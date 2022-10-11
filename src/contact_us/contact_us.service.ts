import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';
import { EventEmitter2 } from 'eventemitter2';

import { CreateContactUsDto } from './dto/create-contact-us.dto';

import { ContactUs, ContactUsDocument } from './schemas/contact_us.schema';
import { ContactUsRequestedEvent } from './events/contact-us-requested.event';

@Injectable()
export class ContactUsService {
	constructor(
		@InjectModel(ContactUs.name)
		private contactUsModel: PaginateModel<ContactUsDocument>,
		private eventEmitter: EventEmitter2,
	) {}

	async getList({ page = 1, limit = 10, keyword = '' }) {
		const query = {};

		if (keyword) {
			query['$or'] = [
				{
					name: {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					email: {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					mobileNo: {
						$regex: keyword,
						$options: 'i',
					},
				},
				{
					message: {
						$regex: keyword,
						$options: 'i',
					},
				},
			];
		}

		return this.contactUsModel.paginate(query, {
			page,
			limit,
			sort: {
				created: -1,
			},
		});
	}

	async create(data: CreateContactUsDto) {
		this.eventEmitter.emit(
			'contact-us.requested',
			new ContactUsRequestedEvent(data),
		);
	}
}
