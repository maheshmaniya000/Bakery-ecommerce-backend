import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, Types } from 'mongoose';
import * as moment from 'moment';
import { isEmpty, uniq, uniqBy, concat, sortBy } from 'lodash';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CreateProductDto } from './dto/create/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStocksDto } from './dto/update-product-stocks.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';

import { Product } from './schemas/product.schema';

import { SettingsService } from '../settings/settings.service';
import { CategoriesService } from 'src/categories/categories.service';
import { StocksService } from '../stocks/stocks.service';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class ProductsService implements OnModuleInit {
	constructor(
		@InjectModel(Product.name) private productModel: PaginateModel<Product>,

		private readonly settingsService: SettingsService,

		@Inject(forwardRef(() => CategoriesService))
		private readonly categoriesService: CategoriesService,

		@Inject(forwardRef(() => StocksService))
		private readonly stocksService: StocksService,

		@Inject(forwardRef(() => OrdersService))
		private ordersService: OrdersService,
	) {}

	async onModuleInit(): Promise<void> {
		await this.CheckAndCovertSlug();
	}

	async getList({
		category,
		status,
		sort,
		keyword,
		search,
		createdDate,
		categoryId,
		page = 1,
		limit = 10,
		ids,
		tags,
	}: GetProductsQueryDto) {
		try {
			const query = {};
			const sortBy = {};

			if (category) {
				// const detail = await this.categoriesService.getDetailBySlug(
				// 	category,
				// );
				// if (detail) {
				// 	query['_id'] = {
				// 		$in: detail.products.map(
				// 			(product: any) =>
				// 				new Types.ObjectId(product._id.toString()),
				// 		),
				// 	};
				// }
			}

			if (search) {
				query['name'] = {
					$regex: search,
					$options: 'i',
				};
			}

			if (keyword) {
				query['$or'] = [
					{
						name: {
							$regex: keyword,
							$options: 'i',
						},
					},
				];
			}

			if (categoryId) {
				query['categories'] = new Types.ObjectId(categoryId);
			}

			if (sort) {
				const keys = sort.split(',');

				keys.forEach((key) => {
					const [col, sorter] = key.split('-');

					sortBy[col] = sorter || 'asc';
				});
			}

			if (status) {
				query['active'] = status === 'active';
			}

			if (createdDate) {
				query['created'] = {
					$gte: moment(createdDate, 'YYYY-MM-DD').toDate(),
					$lt: moment(createdDate, 'YYYY-MM-DD').add(1, 'd').toDate(),
				};
			}

			if (tags) {
				query['tags'] = {
					$in: tags.split(','),
				};
			}

			if (ids) {
				query['_id'] = {
					$in: ids.split(',').map((id) => new Types.ObjectId(id)),
				};
			}

			const products = await this.productModel.paginate(query, {
				page,
				limit,
				select: {
					restocks: 0,
					isAutoRestock: 0,
				},
				sort: sortBy,
				lean: true,
				populate: [{ path: 'categories', select: 'name slug' }],
			});

			const results = {
				...products,
				docs: await Promise.all(
					products.docs.map(async (doc) => {
						return {
							...doc,
							variants: await Promise.all(
								doc.variants.map(async (variant) => {
									return {
										...variant,
										stocks: await this.stocksService.getAvailabeStocks(
											doc._id,
											variant._id,
										),
									};
								}),
							),
							stocks: await this.stocksService.getAvailabeStocks(
								doc._id,
							),
						};
					}),
				),
			};

			return {
				...results,
				docs: isEmpty(query['_id'])
					? results.docs
					: isEmpty(sortBy)
					? await this.sortByCategorySequence(
							results.docs,
							query['_id']['$in'],
					  )
					: results.docs,
			};
		} catch (err) {
			throw new Error(err);
		}
	}

	async findByIds(ids: string[]): Promise<Product[]> {
		return this.productModel
			.find({
				_id: {
					$in: ids.map((id) => new Types.ObjectId(id)),
				},
			})
			.exec();
	}

	async create(payload: CreateProductDto): Promise<Product> {
		try {
			const product = new this.productModel(payload);

			product.basePrice = payload.price;

			const lowest = sortBy(payload.variants, 'price');

			if (payload.variants.length > 0) {
				product.basePrice = lowest[0].price;
			}

			// if there is fixed stock
			if (payload.isFixedStock) {
				product.isAutoRestock = false;
				product.restocks = new Array(7).fill(0);
			}

			product.variants = lowest.map((item) => {
				// if there is fixed stock
				if (item?.isFixedStock) {
					item.isAutoRestock = false;
					item.restocks = new Array(7).fill(0);
				}

				return item;
			});

			await product.save();

			// set stocks
			await this.stocksService.getStocksByProduct(product);

			await this.categoriesService.updateProducts(
				product.categories,
				product._id,
			);

			return product;
		} catch (err) {
			throw new Error(err);
		}
	}

	async update(id: string, payload: UpdateProductDto): Promise<Product> {
		try {
			const product = await this.productModel.findById(id);

			Object.keys(payload).forEach((key) => {
				product[key] = payload[key];
			});

			product.basePrice = payload.price;

			const lowest = sortBy(payload.variants, 'price');

			// if there is variants
			if (payload.variants.length > 0) {
				product.price = 0;
				product.basePrice = lowest[0].price;
				product.isAutoRestock = false;
				product.restocks = new Array(7).fill(0);
			}

			// if there is fixed stock
			if (payload.isFixedStock) {
				product.isAutoRestock = false;
				product.restocks = new Array(7).fill(0);
			}

			product.variants = lowest.map((item) => {
				// if there is fixed stock
				if (item?.isFixedStock) {
					item.isAutoRestock = false;
					item.restocks = new Array(7).fill(0);
				}

				return item;
			});

			await this.categoriesService.updateProducts(payload.categories, id);

			return product.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async duplicate(id: string): Promise<any> {
		const product = await this.productModel.findById(id).lean().exec();

		// remove ID
		delete product._id;

		const count = await this.productModel
			.find({
				name: {
					$regex: product.name,
					$options: 'i',
				},
			})
			.countDocuments();

		return this.productModel.create({
			...product,
			name: `${product.name} (${count})`,
			active: false,
		});
	}

	async reduceFixedStock(
		id: string,
		qty: number,
		variantId?: string,
	): Promise<void> {
		const product = await this.productModel.findById(id);

		if (variantId) {
			const index = product.variants.findIndex(
				(i) => i._id.toString() === variantId.toString(),
			);

			if (index > -1) {
				product.variants[index].fixedStock -= qty;
			}
		} else {
			product.fixedStock -= qty;
		}

		await product.save();
	}

	async updateStatus(id: string, status: boolean): Promise<Product> {
		try {
			const product = await this.productModel.findById(id);

			product.active = status;

			if (status) {
				// sync stocks
				await this.stocksService.getStocksByProduct(product);
			}

			return product.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async getSold(id: string) {
		const product = await this.productModel.findById(id);

		return this.ordersService.getProductSoldDetail(product);
	}

	async getPrice({
		productId,
		variantId,
	}: {
		productId: string;
		variantId?: string;
	}): Promise<number> {
		const product = await this.getDetail(productId);

		if (variantId && product.variants.length > 0) {
			const variant = product.variants.find(
				(item) => item._id.toString() === variantId,
			);

			return variant.price;
		}

		return product.price;
	}

	async updateStocks(
		id: string,
		stocks: UpdateProductStocksDto[],
	): Promise<boolean> {
		return this.stocksService.updateStocks(stocks);
	}

	async updateFixedStocks(
		id: string,
		{ stock, fixedStockStartDate = '', variantId },
	) {
		const product = await this.productModel.findById(id);

		if (!isEmpty(variantId)) {
			const index = product.variants.findIndex(
				(i) => i._id.toString() === variantId.toString(),
			);

			if (index > -1) {
				product.variants[index].fixedStock = stock;
				product.variants[index].fixedStockStartDate =
					fixedStockStartDate;
			}
		} else {
			product.fixedStockStartDate = fixedStockStartDate;
			product.fixedStock = stock;
		}

		await product.save();

		return true;
	}

	async getStocks(id: string) {
		const product = await this.productModel.findById(id);

		return this.stocksService.getStocksByProduct(product);
	}

	async getDetailBySlug(slug: string) {
		const product = await this.productModel.findOne({ slug }).exec();

		if (product) {
			return this.getDetail(product._id);
		}

		return '';
	}

	async getDetail(id: string): Promise<any> {
		try {
			const product = await this.productModel
				.findById(id)
				.populate([{ path: 'categories' }])
				.lean();

			return {
				...product,
				variants: await Promise.all(
					product.variants.map(async (variant) => {
						return {
							...variant,
							stocks: product.active
								? await this.stocksService.getAvailabeStocks(
										product._id,
										variant._id,
								  )
								: [],
						};
					}),
				),
				stocks: product.active
					? await this.stocksService.getAvailabeStocks(product._id)
					: [],
			};
		} catch (err) {
			throw new Error(err);
		}
	}

	async getYMALByProductId(id: string): Promise<Product[]> {
		try {
			let list: Product[] = [];
			const { categories } = await this.productModel.findById(id).exec();

			for (let index = 0; index < categories.length; index++) {
				const ymals = await this.categoriesService.getYMAL(
					categories[index],
				);

				list = concat(list, ymals) as Product[];
			}

			return uniqBy(list, '_id');
		} catch (err) {
			throw new Error(err);
		}
	}

	async getTags(): Promise<string[]> {
		const products = await this.productModel
			.find({ 'tags.0': { $exists: true } }, { tags: 1 })
			.exec();

		return products
			.map((doc) => doc.tags)
			.reduce((acc, curr) => uniq([...acc, ...curr]), []);
	}

	async findById(id: string, pure = false): Promise<Product> {
		if (pure) {
			return this.productModel.findById(id).lean();
		}

		return this.productModel.findById(id);
	}

	async sortByCategorySequence(products: any[], orders: string[]) {
		const resuts = [];

		for (let index = 0; index < orders.length; index++) {
			const product = products.find(
				({ _id }) => _id.toString() === orders[index].toString(),
			);

			if (product) {
				resuts.push(product);
			}
		}

		return resuts;
	}

	async getLowFixedStock() {
		const { notifyLowStock } = await this.settingsService.getOne();

		return this.productModel.find({
			active: true,
			$or: [
				{
					isFixedStock: true,
					fixedStock: { $lte: notifyLowStock },
					variants: { $size: 0 },
				},
				{
					'variants.isFixedStock': true,
					'variants.fixedStock': { $lte: notifyLowStock },
				},
			],
		});
	}

	private async CheckAndCovertSlug(): Promise<void> {
		const products = await this.productModel.find({ slug: null }).exec();

		await Promise.all(
			products.map(async (product) => {
				product.slug = product.name.split(' ').join('-').toLowerCase();

				return await product.save();
			}),
		);
	}

	@Cron(CronExpression.EVERY_DAY_AT_6AM)
	async restocksProduct() {
		const products = await this.productModel.find({ active: true });

		for (let index = 0; index < products.length; index++) {
			await this.stocksService.getStocksByProduct(products[index]);
		}
	}
}
