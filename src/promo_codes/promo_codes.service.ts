import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult } from 'mongoose';
import * as moment from 'moment-timezone';
import * as numeral from 'numeral';
import { uniq, sortBy } from 'lodash';
import * as ExcelJS from 'exceljs';

import { CreatePromoCodeDto } from './dto/create-promo-code.dto';

import { PromoCode, PromoCodeDocument } from './schemas/promo_code.schema';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { GetPromoCodeQueryDto } from './dto/get-promo-codes.query.dto';
import { Code } from './constants';

import { generateCode } from 'src/utils/misc';

import { OrdersService } from 'src/orders/orders.service';
import { AccountType } from 'src/accounts/constants';

@Injectable()
export class PromoCodesService {
	constructor(
		@InjectModel(PromoCode.name)
		private promoCodeModel: PaginateModel<PromoCodeDocument>,

		@Inject(forwardRef(() => OrdersService))
		private readonly ordersService: OrdersService,
	) {}

	async getList({
		page = 1,
		limit = 10,
		keyword = '',
		tags = '',
	}: GetPromoCodeQueryDto): Promise<PaginateResult<PromoCode>> {
		try {
			const query = {};

			if (keyword) {
				query['$or'] = [
					{
						code: {
							$regex: keyword,
							$options: 'i',
						},
					},
					{
						title: {
							$regex: keyword,
							$options: 'i',
						},
					},
				];
			}

			if (tags) {
				query['tags'] = {
					$in: tags.split(','),
				};
			}

			return this.promoCodeModel.paginate(query, {
				page,
				limit,
				sort: {
					created: -1,
				},
			});
		} catch (err) {
			throw new Error(err);
		}
	}

	async getDetail(id: string): Promise<PromoCodeDocument> {
		return this.promoCodeModel.findById(id);
	}

	async used(id: string, code: string, customerId: string): Promise<void> {
		try {
			const existed = await this.promoCodeModel.findById(id);

			if (existed.multiCodes) {
				const index = existed.codes.findIndex(
					(_item) => _item.code === code && !_item.used,
				);

				if (index > -1) {
					existed.codes[index].used = true;
					existed.codes[index].customer = customerId || '';

					existed.used += 1;
				} else {
					throw new BadRequestException(
						'Promo code invalid / expired',
					);
				}
			} else {
				existed.used += 1;
			}

			await existed.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async findByCode(code: string): Promise<PromoCodeDocument> {
		return this.promoCodeModel
			.findOne({
				$or: [
					{
						code: code.toLowerCase(),
					},
					{
						codes: {
							$elemMatch: {
								code: code.toLowerCase(),
							},
						},
					},
				],
				active: true,
			})
			.exec();
	}

	findByOnlyCode(code: string) {
		return this.promoCodeModel
			.findOne({
				$or: [
					{
						code: code.toLowerCase(),
					},
					{
						codes: {
							$elemMatch: {
								code: code.toLowerCase(),
							},
						},
					},
				],
			})
			.exec();
	}

	async exportPromoCodes(id: string): Promise<ExcelJS.Workbook> {
		const { codes = [] } = await this.promoCodeModel.findById(id);

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Codes');
		worksheet.columns = [
			{
				header: 'Code',
				key: 'code',
				width: 80,
			},
			{
				header: 'Used',
				key: 'used',
				width: 20,
			},
		] as ExcelJS.Column[];

		worksheet.addRows(sortBy(codes, 'used'));

		return workbook;
	}

	async getCodesWithCustomer(id: string): Promise<PromoCode> {
		return this.promoCodeModel
			.findById(id)
			.populate('codes.customer')
			.exec();
	}

	async isValid(
		code: string,
		total = 0,
		customerId: string,
		loggedInAccountType?: string,
	): Promise<any> {
		// because of multi codes feature
		if (!code) {
			throw new BadRequestException('Promo code invalid / expired');
		}

		const existed = await this.promoCodeModel
			.findOne({
				$or: [
					{
						code: code.toLowerCase(),
					},
					{
						codes: {
							$elemMatch: {
								code: code.toLowerCase(),
								used: false,
							},
						},
					},
				],
				active: true,
			})
			.exec();

		if (!existed) {
			throw new BadRequestException('Promo code invalid / expired');
		}

		const startDate = moment(existed.startDate).format('YYYY-MM-DD');
		const starter = moment(
			startDate + existed.startTime,
			`YYYY-MM-DD${existed.startTime ? ' hh:mm a' : ''}`,
		);

		if (!existed.isUnlimited && existed.used === existed.total) {
			throw new BadRequestException('Promo code invalid / expired');
		} else if (existed.minSpending > total) {
			throw new BadRequestException(
				'Min spending is ' +
					numeral(existed.minSpending).format('$0.00'),
			);
		} else if (!starter.isBefore(moment())) {
			throw new BadRequestException('Promo code invalid / expired');
		} else if (starter.isBefore(moment())) {
			if (existed.endDate) {
				const endDate = moment(existed.endDate).format('YYYY-MM-DD');
				const ender = moment(
					endDate + existed.endTime,
					`YYYY-MM-DD${existed.endTime ? ' hh:mm a' : ''}`,
				);

				if (ender.isBefore(moment())) {
					throw new BadRequestException(
						'Promo code invalid / expired',
					);
				}
			}
		}

		if (!existed.multiCodes && existed.isOneTimePerUser) {
			const orders = await this.ordersService.findByPromoCode({
				promoId: existed._id,
				customerId: customerId,
			});

			if (orders.length > 0) {
				throw new BadRequestException('Promo code had been used');
			}
		}

		if (existed.isOnlyAdmin && loggedInAccountType !== AccountType.ADMIN) {
			throw new BadRequestException('Promo code invalid / expired');
		}

		// } else if (
		// 	existed.endDate &&
		// 	moment(existed.endDate).isBefore(moment(), 'day')
		// ) {
		// 	throw new BadRequestException('Invalid code');
		// }

		// check start date

		return {
			_id: existed._id.toString(),
			amount: existed.amount,
			type: existed.type,
			isIncludeDeliveryFee: existed.isIncludeDeliveryFee,
			usedCode: code,
		};
	}

	async create(payload: CreatePromoCodeDto): Promise<PromoCode> {
		if (!payload.multiCodes) {
			const isExisted = await this.isExisted(payload.promoCode);

			if (isExisted) {
				throw new BadRequestException('Code already used');
			}
		}

		const codes: Code[] = payload.multiCodes
			? [...new Array(payload.total)].map(() => ({
					code: generateCode(),
					used: false,
			  }))
			: [];

		try {
			const created = new this.promoCodeModel();
			created.code = !payload.multiCodes
				? payload.promoCode.toLowerCase()
				: '';
			created.codes = codes;
			created.multiCodes = payload.multiCodes;
			created.type = payload.type;
			created.amount = payload.amount;
			created.minSpending = payload.minSpending;
			created.startTime = payload.startTime;
			created.endTime = payload.endTime;
			created.startDate = moment(payload.startDate).toDate();
			created.endDate = payload.endDate
				? moment(payload.endDate).toDate()
				: null;
			created.total = payload.isUnlimited ? 0 : payload.total;
			created.isUnlimited = payload.isUnlimited;
			created.isOneTimePerUser = payload.isOneTimePerUser;
			created.isIncludeDeliveryFee = payload.isIncludeDeliveryFee;
			created.isOnlyAdmin = payload.isOnlyAdmin;
			created.title = payload.title;
			created.description = payload.description;
			created.tags = payload.tags;
			return created.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async getTags(): Promise<string[]> {
		const codes = await this.promoCodeModel
			.find({ 'tags.0': { $exists: true } }, { tags: 1 })
			.exec();

		return codes
			.map((doc) => doc.tags)
			.reduce((acc, curr) => uniq([...acc, ...curr]), []);
	}

	async update(id: string, payload: UpdatePromoCodeDto): Promise<PromoCode> {
		try {
			const existed = await this.promoCodeModel.findById(id);

			existed.startDate = moment(payload.startDate).toDate();
			existed.endDate = payload.endDate
				? moment(payload.endDate).toDate()
				: null;
			existed.startTime = payload.startTime;
			existed.endTime = payload.endTime;
			existed.tags = payload.tags;

			if (existed.used === 0) {
				existed.type = payload.type;
				existed.amount = payload.amount;

				existed.total = payload.isUnlimited ? 0 : payload.total;
				existed.isUnlimited = payload.isUnlimited;
				existed.isOneTimePerUser = payload.isOneTimePerUser;
				existed.isIncludeDeliveryFee = payload.isIncludeDeliveryFee;
				existed.title = payload.title;
				existed.description = payload.description;
			}

			return existed.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateStatus(id: string, status: boolean): Promise<PromoCode> {
		try {
			const existed = await this.promoCodeModel.findById(id);

			existed.active = status;

			return existed.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async isExisted(code: string): Promise<boolean> {
		const existed = await this.promoCodeModel.findOne({
			code,
			active: true,
		});

		return existed ? true : false;
	}
}
