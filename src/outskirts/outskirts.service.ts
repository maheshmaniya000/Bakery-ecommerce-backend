import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult } from 'mongoose';

import { CreateOutskirtDto } from './dto/create_outskirt.dto';
import { UpdateOutskirtDto } from './dto/update_outskirt.dto';

import { Outskirt } from './schemas/outskirt.schema';

@Injectable()
export class OutskirtsService {
	constructor(
		@InjectModel(Outskirt.name)
		private outskirtModel: PaginateModel<Outskirt>,
	) {}

	async getList(
		{ status },
		{ page, limit },
	): Promise<PaginateResult<Outskirt>> {
		try {
			const query = {};

			if (status) {
				query['active'] = status === 'true';
			}

			return this.outskirtModel.paginate(query, { page, limit });
		} catch (err) {
			throw new Error(err);
		}
	}

	async getDetail(id: string): Promise<Outskirt> {
		try {
			return this.outskirtModel.findById(id);
		} catch (err) {
			throw new Error(err);
		}
	}

	async findByPostalCode(postalCode: string): Promise<Outskirt> {
		try {
			return this.outskirtModel.findOne({ postalCode, active: true });
		} catch (err) {
			throw new Error(err);
		}
	}

	async create(payload: CreateOutskirtDto): Promise<Outskirt> {
		try {
			const outskirt = new this.outskirtModel(payload);

			return outskirt.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async update(id: string, payload: UpdateOutskirtDto): Promise<Outskirt> {
		try {
			return this.outskirtModel.findByIdAndUpdate(
				id,
				{ ...payload },
				{ new: true },
			);
		} catch (err) {
			throw new Error(err);
		}
	}

	async updateStatus(id: string, status: boolean): Promise<Outskirt> {
		try {
			return this.outskirtModel.findByIdAndUpdate(
				id,
				{ active: status },
				{ new: true },
			);
		} catch (err) {
			throw new Error(err);
		}
	}
}
