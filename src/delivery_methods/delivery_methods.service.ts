import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult } from 'mongoose';

import { CreateDeliveryMethodDto } from './dto/create_delivery_method.dto';
import { UpdateDeliveryMethodDto } from './dto/update_delivery_method.dto';

import { DeliveryMethod } from './schemas/delivery_method.schema';

import { OutskirtsService } from '../outskirts/outskirts.service';
import { DeliveryMethodTimeService } from './services/delivery-method-time.service';

@Injectable()
export class DeliveryMethodsService {
	constructor(
		@InjectModel(DeliveryMethod.name)
		private model: PaginateModel<DeliveryMethod>,

		private readonly outskirtsService: OutskirtsService,
		private readonly deliveryMethodTimeService: DeliveryMethodTimeService,
	) {}

	async getList(
		{ status },
		{ page, limit },
	): Promise<PaginateResult<DeliveryMethod>> {
		try {
			const query = {};

			if (status) {
				query['active'] = status === 'true';
			}

			return this.model.paginate(query, {
				page,
				limit,
				populate: ['times'],
				sort: {
					sort: 1,
				},
			});
		} catch (err) {
			throw new Error(err);
		}
	}

	async getDetail(id: string): Promise<DeliveryMethod> {
		try {
			return this.model.findById(id).populate('times');
		} catch (err) {
			throw new Error(err);
		}
	}

	async create({
		needPostalCode,
		isOutskirt,
		times,
		...payload
	}: CreateDeliveryMethodDto): Promise<DeliveryMethod> {
		const timeDocuments = await Promise.all(
			times.map((dto) => this.deliveryMethodTimeService.create(dto)),
		);

		try {
			const method = new this.model({
				...payload,
				needPostalCode,
				isOutskirt: needPostalCode && isOutskirt,
			});

			method.times = timeDocuments.map((doc) => doc._id);

			return method.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async getPrice({
		id,
		timeId,
		postalCode,
	}: {
		id: string;
		timeId?: string;
		postalCode?: string;
	}): Promise<number> {
		const method = await this.getDetail(id);
		const isOutskirt = postalCode
			? await this.outskirtsService.findByPostalCode(
					postalCode.toString().substr(0, 3),
			  )
			: false;

		if (timeId) {
			const time = method.times.find(
				(_time) => _time._id.toString() === timeId,
			);

			return isOutskirt ? time.outskirtPrice : time.price;
		} else {
			return isOutskirt ? method.outskirtPrice : method.deliveryPrice;
		}
	}

	async update(
		id: string,
		{
			needPostalCode,
			isOutskirt,
			times,
			...payload
		}: UpdateDeliveryMethodDto,
	): Promise<DeliveryMethod> {
		const timeDocuments = await Promise.all(
			times.map((dto) => this.deliveryMethodTimeService.create(dto)),
		);

		try {
			return this.model.findByIdAndUpdate(
				id,
				{
					...payload,
					needPostalCode,
					isOutskirt: needPostalCode && isOutskirt,
					times: timeDocuments.map((docuemnt) => docuemnt._id),
				},
				{ new: true },
			);
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateStatus(id: string, status: boolean): Promise<DeliveryMethod> {
		try {
			return this.model.findByIdAndUpdate(
				id,
				{ active: status },
				{ new: true },
			);
		} catch (err) {
			throw new Error(err);
		}
	}
	async updatedeliveryfee(id: string): Promise<DeliveryMethod> {
        try {
            return this.model.updateMany(
				{  deliveryPrice: 5}, 
    			{ $set: {  deliveryPrice: 8 }}
            );
        } catch (err) {
            throw new Error(err);
        }
    }
}
