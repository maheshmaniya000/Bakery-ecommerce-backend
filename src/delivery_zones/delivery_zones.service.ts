import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult } from 'mongoose';

import { CreateDeliveryZoneDto } from './dto/create_delivery_zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update_delivery_zone.dto';

import { DeliveryZone } from './schemas/delivery_zone.schema';

@Injectable()
export class DeliveryZonesService {
	constructor(
		@InjectModel(DeliveryZone.name)
		private deliveryZoneModel: PaginateModel<DeliveryZone>,
	) {}

	async getList(
		{ status = '' },
		{ page, limit },
	): Promise<PaginateResult<DeliveryZone>> {
		try {
			const query = {};

			if (status) {
				query['active'] = status;
			}

			return this.deliveryZoneModel.paginate(query, { page, limit });
		} catch (err) {
			throw new Error(err);
		}
	}

	async getDetail(id: string): Promise<DeliveryZone> {
		try {
			return this.deliveryZoneModel.findById(id);
		} catch (err) {
			throw new Error(err);
		}
	}

	async create(payload: CreateDeliveryZoneDto): Promise<DeliveryZone> {
		try {
			const outskirt = new this.deliveryZoneModel(payload);

			return outskirt.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async findByPostalCode(postalCode: string): Promise<DeliveryZone> {
		try {
			return this.deliveryZoneModel.findOne({ postalCodes: postalCode });
		} catch (err) {
			throw new Error(err);
		}
	}

	async update(
		id: string,
		payload: UpdateDeliveryZoneDto,
	): Promise<DeliveryZone> {
		try {
			return this.deliveryZoneModel.findByIdAndUpdate(
				id,
				{ ...payload },
				{ new: true },
			);
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateStatus(id: string, status: boolean): Promise<DeliveryZone> {
		try {
			return this.deliveryZoneModel.findByIdAndUpdate(
				id,
				{ active: status },
				{ new: true },
			);
		} catch (err) {
			throw new Error(err);
		}
	}
}
