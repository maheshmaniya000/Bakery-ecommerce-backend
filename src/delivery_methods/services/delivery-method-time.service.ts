import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDeliveryTimeDto } from '../dto/create_delivery_method_time.dto';
import {
	DeliveryMethodTime,
	DeliveryMethodTimeDocument,
} from '../schemas/delivery_method_time.schema';

@Injectable()
export class DeliveryMethodTimeService {
	constructor(
		@InjectModel(DeliveryMethodTime.name)
		private timeModel: Model<DeliveryMethodTimeDocument>,
	) {}

	async create(
		dto: CreateDeliveryTimeDto,
	): Promise<DeliveryMethodTimeDocument> {
		try {
			const method = new this.timeModel();

			method.name = dto.name;
			method.price = dto.price;
			method.outskirtPrice = dto.outskirtPrice;
			method.availables = dto.availables;

			return method.save();
		} catch (err) {
			throw new Error(err);
		}
	}
}
