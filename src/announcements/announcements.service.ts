import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult } from 'mongoose';
import * as moment from 'moment';

import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { GetAnnouncementsDto } from './dto/get-announcements.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

import {
	Announcement,
	AnnouncementDocument,
} from './schemas/announcement.schema';

@Injectable()
export class AnnouncementsService {
	constructor(
		@InjectModel(Announcement.name)
		private model: PaginateModel<AnnouncementDocument>,
	) {}

	async getList({
		page = 1,
		limit = 10,
	}: GetAnnouncementsDto): Promise<PaginateResult<Announcement>> {
		return this.model.paginate({}, { page, limit });
	}

	async getDetail(id: string): Promise<Announcement> {
		return this.model.findById(id);
	}

	async create(payload: CreateAnnouncementDto): Promise<Announcement> {
		const created = new this.model(payload);

		return created.save();
	}

	async update(
		id: string,
		payload: UpdateAnnouncementDto,
	): Promise<Announcement> {
		try {
			const existed = await this.model.findById(id);

			existed.type = payload.type;
			existed.header = payload.header;
			existed.message = payload.message;
			existed.startDate = moment(
				payload.startDate,
				'YYYY-MM-DD',
			).toDate();
			existed.endDate = payload.endDate
				? moment(payload.endDate, 'YYYY-MM-DD').toDate()
				: null;

			return existed.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateStatus(id: string, status: boolean): Promise<Announcement> {
		try {
			const existed = await this.model.findById(id);

			existed.active = status;

			return existed.save();
		} catch (err) {
			throw new Error(err);
		}
	}
}
