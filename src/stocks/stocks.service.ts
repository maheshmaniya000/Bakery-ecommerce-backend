import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { sortBy, includes } from 'lodash';
import * as moment from 'moment-timezone';

import { Stock } from './schemas/stock.schema';
import { Product } from '../products/schemas/product.schema';

import { SettingsService } from '../settings/settings.service';
import { ProductsService } from 'src/products/products.service';
import { StockLogsService } from './services/stock_logs.service';

import { UpdateStockDto } from './dto/update-stock.dto';
import { StockVariant } from './types';
import { NotifyUpdateStockDto } from './dto/notify-update-stock.dto';
import { getDeliveryDates } from 'src/utils/func/getDeliveryDates';

@Injectable()
export class StocksService {
	constructor(
		@InjectModel(Stock.name) private stockModel: Model<Stock>,

		@Inject(forwardRef(() => SettingsService))
		private readonly settingsService: SettingsService,

		@Inject(forwardRef(() => ProductsService))
		private readonly productsService: ProductsService,

		private stockLogsService: StockLogsService,
	) {}

	async getStocksByProduct(product: Product): Promise<Stock[]> {
		const results: Stock[] = [];
		const dates = await this.settingsService.getDeliveryDates();

		// loop through the days count
		for (let index = 0; index < dates.length; index++) {
			/**
			 * if there is no variants and product had fixed stock
			 * skip that loop
			 */
			if (product.variants.length === 0 && product?.isFixedStock) {
				continue;
			}

			/**
			 * if there is variants and each had fixed stock
			 * skip that loop
			 */
			if (
				product.variants.length > 0 &&
				product.variants.filter((v) => !v?.isFixedStock).length === 0
			) {
				continue;
			}

			const stock = await this.stockModel.findOne({
				product: product._id,
				date: dates[index].toDate(),
			});

			if (stock) {
				// if already created, we find new variants
				for (
					let vIndex = 0;
					vIndex < product.variants.length;
					vIndex++
				) {
					const hasStocks = stock.variants.findIndex(
						(v) =>
							v.variantId ===
							product.variants[vIndex]._id.toString(),
					);

					if (hasStocks === -1) {
						if (!product.variants[vIndex].isFixedStock) {
							const restock = product.variants[vIndex]
								.isAutoRestock
								? product.variants[vIndex].restocks[
										dates[index].day()
								  ]
								: 0;

							const qty = restock || 0;

							stock.variants = [
								...stock.variants,
								{
									variantId: product.variants[vIndex]._id,
									qty: qty,
								},
							] as StockVariant[];

							/**
							 * logs the restock qty on each variant
							 */
							await this.stockLogsService.create({
								stock: stock._id.toString(),
								product: product._id.toString(),
								variantId:
									product.variants[vIndex]._id.toString(),
								qty: qty,
								remark: 'restock variant',
							});
						}
					}
				}

				await stock.save();

				results.push(stock);
			} else {
				const created = new this.stockModel();

				created.date = dates[index].toDate();
				created.product = product._id;

				if (product.variants.length === 0) {
					const restock = product.isAutoRestock
						? product.restocks[dates[index].day()]
						: 0;
					created.qty = restock || 0;
				} else {
					created.variants = product.variants
						.filter((v) => !v?.isFixedStock)
						.map((variant) => {
							const restock = variant.isAutoRestock
								? variant.restocks[dates[index].day()]
								: 0;

							return {
								variantId: variant._id,
								qty: restock || 0,
							};
						}) as StockVariant[];
				}

				await created.save();

				/**
				 * logs the restock qty on each variant
				 */
				await this.stockLogsService.create({
					stock: created._id.toString(),
					product: product._id.toString(),
					qty: created.qty || 0,
					remark: 'restock',
				});

				results.push(created);
			}
		}

		return results;
	}

	async getAvailabeStocks(
		productId: string,
		variantId?: string,
	): Promise<Array<{ qty: number; date: string }>> {
		/**
		 * we get the deliver date for default qty 1 first
		 */
		const days = await this.getDeliverableDates([ { productId, variantId, qty: 1}]);

		/**
		 * First we will check product or variant had fixed stock.
		 * Then, there is fixed stock and will return that stock
		 */
		const product = await this.productsService.findById(productId);

		if (product?.isFixedStock && !variantId) {
			if (product.fixedStock > 0) {
				return days.map(day => {
					if (day.isClosed) {
						return {
							date: day.date,
							qty: 0
						}
					}

					if (product.fixedStockStartDate) {
						if (
							moment(moment(day.date).format('YYYY-MM-DD')).isSameOrAfter(
								moment(product.fixedStockStartDate).format(
									'YYYY-MM-DD',
								),
							)
						) {
							return {
								date: day.date,
								qty: product.fixedStock,
							};
						} else {
							return {
								date: day.date,
								qty: 0,
							};
						}
					} else {
						return {
							date: day.date,
							qty: product.fixedStock
						}
					}

				}).filter((day) => day.qty > 0);
			}

			return [];
		}

		if (variantId) {
			const variant = product.variants.find(
				(item) => item._id.toString() === variantId.toString(),
			);

			if (variant?.isFixedStock) {
				if (variant.fixedStock > 0) {
					return days.map(day => {
						if (day.isClosed) {
							return {
								date: day.date,
								qty: 0
							}
						}
	
						if (variant.fixedStockStartDate) {
							if (
								moment(moment(day.date).format('YYYY-MM-DD')).isSameOrAfter(
									moment(variant.fixedStockStartDate).format(
										'YYYY-MM-DD',
									),
								)
							) {
								return {
									date: day.date,
									qty: variant.fixedStock,
								};
							} else {
								return {
									date: day.date,
									qty: 0,
								};
							}
						} else {
							return {
								date: day.date,
								qty: variant.fixedStock,
							};
						}
	
					}).filter((day) => day.qty > 0);
				}

				return [];
			}
		}

		/** ----------- */

		const query = {
			date: {
				$in: days
					.filter(
						(day) => !day.isClosed
					)
					.map((day) => new Date(day.date)),
			},
			product: new Types.ObjectId(productId),
		};
		const sort = {
			date: 1,
		};
		const projections = {};

		if (variantId) {
			query['variants'] = {
				$elemMatch: {
					variantId: new Types.ObjectId(variantId),
					qty: {
						$gt: 0,
					},
				},
			};

			projections['variants.$'] = 1;
			projections['date'] = 1;
		} else {
			query['qty'] = {
				$gt: 0,
			};
		}

		return (
			await this.stockModel
				.find(query, projections)
				.sort(sort)
				.lean()
				.exec()
		).map((stock) => {
			if (variantId) {
				return {
					qty: stock.variants[0].qty,
					date: stock.date.toISOString(),
				};
			} else {
				return {
					qty: stock.qty,
					date: stock.date.toISOString(),
				};
			}
		});
	}

	async updateStocks(stocks: UpdateStockDto[]): Promise<boolean> {
		try {
			for (let index = 0; index < stocks.length; index++) {
				const stock = await this.stockModel.findById(stocks[index]._id);

				if (stocks[index].variant) {
					const _index = stock.variants.findIndex(
						(variant) =>
							variant.variantId === stocks[index].variant,
					);

					stock.variants[_index].qty = stocks[index].qty;

					await this.stockLogsService.create({
						stock: stock._id.toString(),
						product: stock.product.toString(),
						variantId: stocks[index].variant,
						qty: stocks[index].qty,
						remark: 'set stocks by CMS',
					});
				} else {
					stock.qty = stocks[index].qty;

					await this.stockLogsService.create({
						stock: stock._id.toString(),
						product: stock.product.toString(),
						qty: stocks[index].qty,
						remark: 'set stocks by CMS',
					});
				}

				await stock.save();
			}

			return true;
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateStocksBySpecific(
		date: Date,
		data: Array<{
			productId: string;
			variantId?: string;
			qty: number;
		}>,
	): Promise<void> {
		try {
			/**
			 * check product or variant had fixed stock
			 */
			for (let index = 0; index < data.length; index++) {
				const product = await this.productsService.findById(
					data[index].productId,
				);

				if (product?.isFixedStock && !data[index].variantId) {
					await this.productsService.reduceFixedStock(
						data[index].productId,
						data[index].qty,
					);
					continue;
				}

				if (data[index].variantId) {
					const variant = product.variants.find(
						(item) =>
							item._id.toString() ===
							data[index].variantId.toString(),
					);

					if (variant && variant?.isFixedStock) {
						await this.productsService.reduceFixedStock(
							data[index].productId,
							data[index].qty,
							data[index].variantId,
						);
						continue;
					}
				}

				const stock = await this.stockModel.findOne({
					date,
					product: new Types.ObjectId(data[index].productId),
				});

				if (stock) {
					if (data[index].variantId) {
						const vIndex = stock.variants.findIndex(
							(i) =>
								i.variantId.toString() ===
								data[index].variantId.toString(),
						);

						if (vIndex > -1) {
							stock.variants[vIndex].qty -= data[index].qty;
						}
					} else {
						stock.qty -= data[index].qty;
					}

					await this.stockLogsService.create({
						stock: stock._id.toString(),
						product: data[index].productId,
						variantId: data[index].variantId,
						qty:
							data[index].qty > 0
								? -Math.abs(data[index].qty)
								: Math.abs(data[index].qty),
						remark: data[index].qty > 0 ? 'sold' : 'refill',
					});

					await stock.save();
				}
			}
		} catch (err) {
			throw new Error(err);
		}
	}

	async getDeliverableDates(
		cart: Array<{
			productId: string;
			variantId?: string;
			qty: number;
		}>,
	) {
		const { deliverySettings, peakDaySurcharge } =
			await this.settingsService.getOne();

		const products = await this.productsService.findByIds(
			cart.map((_item) => _item.productId),
		);

		const dates = await this.settingsService.getDeliveryDates();

		const results = [];

		// loop through the days count
		for (let index = 0; index < dates.length; index++) {
			const date = dates[index];

			const isMonday = date.day() === deliverySettings.blackOutDay;

			const isBlackout = includes(
				deliverySettings?.blackoutDates || [],
				date.format('YYYY-MM-DD'),
			);

			const isPeakDay = includes(
				peakDaySurcharge?.dates || [],
				date.format('YYYY-MM-DD'),
			);

			results.push({
				date: date.toISOString(),
				isClosed: isBlackout || isMonday ? true : false,
				isPeakDay,
			});
		}

		const workingDays = getDeliveryDates(
			results,
			deliverySettings.preparationDays,
		);

		return Promise.all(
			workingDays.map(async (day) => {
				const custom = {
					isPeakDay: false,
					...day,
					date: day.date,
					valid: false,
				};

				if (!day.isClosed) {
					const isEnoughStocks = await this.isEnoughStocks(
						cart,
						new Date(day.date),
						products,
					);

					custom.valid = isEnoughStocks;
				}

				return custom;
			}),
		);
	}

	private async isEnoughStocks(
		data: Array<{
			productId: string;
			variantId?: string;
			qty: number;
		}>,
		date: Date,
		products: Product[], // to increase performance
	): Promise<boolean> {
		let hadEnoughStock = true;

		for (let index = 0; index < data.length; index++) {
			/**
			 * check product or vairant had fixed stock
			 */
			const product = products.find(
				(_product) =>
					_product._id.toString() ===
					data[index].productId.toString(),
			);

			// if product active false
			if (!product?.active) {
				hadEnoughStock = false;
				break;
			}

			if (product?.isFixedStock && !data[index].variantId) {
				if (data[index].qty > product.fixedStock) {
					hadEnoughStock = false;
					break;
				} else {
					if (product.fixedStockStartDate) {
						if (
							moment(
								moment(date).format('YYYY-MM-DD'),
							).isSameOrAfter(
								moment(product.fixedStockStartDate).format(
									'YYYY-MM-DD',
								),
							)
						) {
							continue;
						} else {
							hadEnoughStock = false;
							break;
						}
					} else {
						continue;
					}
				}
			}

			if (data[index].variantId) {
				const variant = product.variants.find(
					(item) =>
						item._id.toString() ===
						data[index].variantId.toString(),
				);

				if (variant && variant?.isFixedStock) {
					if (data[index].qty > variant.fixedStock) {
						hadEnoughStock = false;
						break;
					} else {
						if (variant.fixedStockStartDate) {
							if (
								moment(
									moment(date).format('YYYY-MM-DD'),
								).isSameOrAfter(
									moment(variant.fixedStockStartDate).format(
										'YYYY-MM-DD',
									),
								)
							) {
								continue;
							} else {
								hadEnoughStock = false;
								break;
							}
						} else {
							continue;
						}
					}
				}
			}

			/** --------- */

			const query = {
				date,
				product: new Types.ObjectId(data[index].productId),
			};

			if (data[index].variantId) {
				query['variants'] = {
					$elemMatch: {
						variantId: data[index].variantId,
						qty: {
							$gte: data[index].qty,
						},
					},
				};
			} else {
				query['qty'] = {
					$gte: data[index].qty,
				};
			}

			if ((await this.stockModel.countDocuments(query)) === 0) {
				hadEnoughStock = false;
				break;
			} else {
				continue;
			}
		}

		return hadEnoughStock;
	}

	async updateNotifyStocks(id, { variantId, stocks }: NotifyUpdateStockDto) {
		try {
			const stock = await this.stockModel.findById(id);

			if (variantId) {
				const index = stock.variants.findIndex(
					(item) => item.variantId.toString() === variantId,
				);

				stock.variants[index].qty = stocks;
			} else {
				stock.qty = stocks;
			}

			return stock.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async getNotifyLowStocks() {
		const { notifyLowStock, deliverySettings } =
			await this.settingsService.getOne();

		const dates = (await this.settingsService.getDeliveryDates()).filter(
			(date) => {
				return !includes(
					deliverySettings?.blackoutDates || [],
					date.format('YYYY-MM-DD'),
				);
			},
		);

		const stocks = await this.stockModel
			.find({
				$or: [
					{
						qty: {
							$lte: notifyLowStock,
						},
					},
					{
						'variants.qty': {
							$lte: notifyLowStock,
						},
					},
				],
				date: {
					$in: dates.map((date) => date.toDate()),
				},
			})
			.sort({ date: 1 })
			.limit(100)
			.populate({
				path: 'product',
				match: {
					active: true,
				},
			});

		const data = [];

		for (let index = 0; index < stocks.length; index++) {
			if (!stocks[index].product) {
				continue;
			}

			const dayOfWeek = moment
				.tz(stocks[index].date, 'Asia/Singapore')
				.day();

			const product = stocks[index].product as unknown as Product;

			if (product?.isFixedStock && product.variants.length === 0) {
				continue;
			}

			const item = {
				date: stocks[index].date,
			};

			item['_id'] = stocks[index]._id;
			item['product'] = product.name;

			if (
				stocks[index].variants.length === 0 &&
				stocks[index].qty <= notifyLowStock
			) {
				if (
					product.isAutoRestock &&
					product.restocks[dayOfWeek] === 0
				) {
					continue;
				}

				item['stocks'] = stocks[index].qty;

				data.push(item);
			}

			for (
				let vIndex = 0;
				vIndex < stocks[index].variants.length;
				vIndex++
			) {
				if (stocks[index].variants[vIndex].qty <= notifyLowStock) {
					const variant = product.variants.find(
						({ _id }) =>
							_id.toString() ===
							stocks[index].variants[vIndex].variantId,
					);

					if (variant && !variant?.isFixedStock) {
						if (
							variant.isAutoRestock &&
							variant.restocks[dayOfWeek] === 0
						) {
							continue;
						}

						const info = {
							stocks: stocks[index].variants[vIndex].qty,
							variant: variant.size,
							variantId: variant._id,
						};
						data.push({ ...item, ...info });
					}
				}
			}
		}

		// From fixed stocks
		const products = await this.productsService.getLowFixedStock();

		products.forEach((product) => {
			const item = {
				date: dates[0].toDate(),
				_id: product._id,
				type: 'FixedStock',
				product: product.name,
			};

			if (product.variants.length === 0) {
				item['stocks'] = product.fixedStock;

				data.push(item);
			} else {
				product.variants.forEach((variant) => {
					if (variant.isFixedStock) {
						data.push({
							...item,
							stocks: variant.fixedStock,
							variant: variant.size,
							variantId: variant._id,
						});
					}
				});
			}
		});

		return sortBy(data, 'stocks');
	}
}
