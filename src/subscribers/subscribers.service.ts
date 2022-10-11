import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult } from 'mongoose';
import * as ExcelJS from 'exceljs';
import * as moment from 'moment-timezone';

import { GetSubscribersDto } from './dto/get-subscribers.dto';

import { SubscriberDocument } from './schemas/subscribe.schema';
import { ExportSubscribersDto } from './dto/export-subscribers.dto';

@Injectable()
export class SubscribersService {
	constructor(
		@InjectModel('Subscriber')
		private model: PaginateModel<SubscriberDocument>,
	) {}

	async getList({
		keyword,
		startDate,
		endDate,
		page = 1,
		limit = 10,
	}: GetSubscribersDto): Promise<PaginateResult<SubscriberDocument>> {
		const query = {};

		if (keyword) {
			query['email'] = keyword;
		}

		if (startDate) {
			query['created'] = {
				$gte: moment(startDate, 'YYYY-MM-DD').toDate(),
				$lt: moment(startDate, 'YYYY-MM-DD').add(1, 'd').toDate(),
			};
		}

		if (endDate) {
			delete query['created']['$lt'];

			query['created']['$lte'] = moment(endDate, 'YYYY-MM-DD').toDate();
		}

		return this.model.paginate(query, {
			page,
			limit,
			sort: {
				created: -1,
			},
		});
	}

	async generateExport({
		keyword,
		startDate,
		endDate,
	}: ExportSubscribersDto) {
		const query = {};

		if (keyword) {
			query['email'] = keyword;
		}

		if (startDate) {
			query['created'] = {
				$gte: moment(startDate, 'YYYY-MM-DD').toDate(),
				$lt: moment(startDate, 'YYYY-MM-DD').add(1, 'd').toDate(),
			};
		}

		if (endDate) {
			delete query['created']['$lt'];

			query['created']['$lte'] = moment(endDate, 'YYYY-MM-DD').toDate();
		}
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Subscribers');
		const data = await this.model.find(query).exec();

		worksheet.columns = [
			{
				header: 'Email',
				key: 'email',
				width: 30,
			},
			{
				header: 'Created At',
				key: 'created',
				width: 30,
			},
		] as ExcelJS.Column[];

		worksheet.addRows(
			data.map((item) => ({
				email: item.email,
				created: moment(item.created).format('DD-MM-YYY HH:mm'),
			})),
		);

		return workbook;
	}

	async addSubscriber(email: string): Promise<boolean> {
		const existed = await this.model.findOne({ email });

		if (existed) {
			return false;
		}

		await this.model.create({ email });

		return true;
	}

	async destory(id: string) {
		return this.model.findByIdAndDelete(id).exec();
	}
}
