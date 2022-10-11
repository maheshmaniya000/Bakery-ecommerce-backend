import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as moment from 'moment-timezone';
import { includes } from 'lodash';

import { UpdateDeliverySettingsDto } from './dto/update-delivery-settings.dto';
import { UpdateRestockTimeDto } from './dto/update-restock-time.dto';
import { UpdatePeakDaySurchargeDto } from './dto/update-peak-day-surcharge.dto';

import { Setting } from './schemas/setting.schema';
import { Product } from 'src/products/schemas/product.schema';

import { StocksService } from 'src/stocks/stocks.service';

@Injectable()
export class SettingsService implements OnModuleInit {
	constructor(
		@InjectModel(Setting.name) private settingModel: Model<Setting>,

		@Inject(forwardRef(() => StocksService))
		private stocksService: StocksService,
	) {}

	async onModuleInit(): Promise<void> {
		moment.tz.setDefault('Asia/Singapore');

		const count = await this.settingModel.find().countDocuments();

		if (count === 0) {
			const defaultSetting = new this.settingModel({
				name: 'Default Setting',
			});

			await defaultSetting.save();
		}
	}

	async getOne(): Promise<Setting> {
		try {
			return this.settingModel.findOne();
		} catch (err) {
			throw new Error(err);
		}
	}

	async isBlackoutDay(date: moment.Moment): Promise<boolean> {
		const { deliverySettings } = await this.getOne();

		return includes(
			deliverySettings.blackoutDates || [],
			date.format('YYYY-MM-DD'),
		);
	}

	async getDeliveryDates(): Promise<moment.Moment[]> {
		const { deliverySettings } = await this.getOne();

		let startDay = 1;
		const daysCount = deliverySettings.deliveryDays;
		const results = [];

		if (deliverySettings.deliveryNextDayTime) {
			const cutOff = moment(
				deliverySettings.deliveryNextDayTime,
				'hh:mm a',
			);

			const isAfter = moment().isAfter(cutOff);

			if (isAfter) {
				startDay += 1;
			}
		}

		const today = moment().startOf('date');

		for (let index = startDay; index <= daysCount; index++) {
			results.push(today.clone().add(index, 'days'));
		}

		return results;
	}

	async updateDeliverySettings(
		payload: UpdateDeliverySettingsDto,
	): Promise<Setting> {
		try {
			const setting = await this.settingModel.findOne();

			setting.deliverySettings = payload;

			return setting.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updatePeakDaySurcharge(
		payload: UpdatePeakDaySurchargeDto,
	): Promise<Setting> {
		try {
			const setting = await this.settingModel.findOne();

			setting.peakDaySurcharge = payload;

			return setting.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateMinForDelivery(payload: any): Promise<Setting> {
		try {
			const setting = await this.settingModel.findOne();

			setting.minForDelivery = payload;

			return setting.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateCurrentlyTrending(products: string[]): Promise<Setting> {
		try {
			const setting = await this.settingModel.findOne();

			setting.currentlyTrending = products.map(
				(_id) => new Types.ObjectId(_id),
			);

			return setting.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updatePopularItems(products: string[]): Promise<Setting> {
		try {
			const setting = await this.settingModel.findOne();

			setting.popularItems = products.map(
				(_id) => new Types.ObjectId(_id),
			);

			return setting.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async getCurrentlyTrending(): Promise<Product[]> {
		const { currentlyTrending } = await this.settingModel
			.findOne()
			.populate({ path: 'currentlyTrending', active: 'true' })
			.lean()
			.exec();

		const products = currentlyTrending as unknown as Product[];

		if (!products) {
			return [];
		}

		const data = await Promise.all(
			products.map(async (doc) => {
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
					stocks: await this.stocksService.getAvailabeStocks(doc._id),
				};
			}),
		);

		const SoldOut = data.filter((_product) => {
			const variantStocks = _product.variants.reduce(
				(acc, cur) => cur.stocks.length + acc,
				0,
			);

			const stock = _product.stocks.length + variantStocks;

			return stock === 0;
		});

		const InStock = data.filter((_product) => {
			const variantStocks = _product.variants.reduce(
				(acc, cur) => cur.stocks.length + acc,
				0,
			);

			const stock = _product.stocks.length + variantStocks;

			return stock > 0;
		});

		return [...InStock, ...SoldOut] as Product[];
	}

	async getPopularItems(): Promise<Product[]> {
		const { popularItems } = await this.settingModel
			.findOne()
			.populate({ path: 'popularItems', active: 'true' })
			.lean()
			.exec();

		const products = popularItems as unknown as Product[];

		if (!products) {
			return [];
		}

		const data = await Promise.all(
			products.map(async (doc) => {
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
					stocks: await this.stocksService.getAvailabeStocks(doc._id),
				};
			}),
		);

		const SoldOut = data.filter((_product) => {
			const variantStocks = _product.variants.reduce(
				(acc, cur) => cur.stocks.length + acc,
				0,
			);

			const stock = _product.stocks.length + variantStocks;

			return stock === 0;
		});

		const InStock = data.filter((_product) => {
			const variantStocks = _product.variants.reduce(
				(acc, cur) => cur.stocks.length + acc,
				0,
			);

			const stock = _product.stocks.length + variantStocks;

			return stock > 0;
		});

		return [...InStock, ...SoldOut] as Product[];
	}

	async updateRestockTime(payload: UpdateRestockTimeDto): Promise<Setting> {
		try {
			const setting = await this.settingModel.findOne();

			setting.restockTime = payload.restockTime;

			return setting.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateMinAmountCart(amount: number): Promise<Setting> {
		try {
			const setting = await this.settingModel.findOne();

			setting.minAmount = amount;

			return setting.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateNotifyLowStock(amount: number): Promise<Setting> {
		try {
			const setting = await this.settingModel.findOne();

			setting.notifyLowStock = amount;

			return setting.save();
		} catch (err) {
			throw new Error(err);
		}
	}
}
