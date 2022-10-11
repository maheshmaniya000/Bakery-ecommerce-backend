import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateSliceBoxDto } from '../dto/create-slice-box.dto';

import { SliceBox, SliceBoxDocument } from '../schemas/slice_box.schema';

@Injectable()
export class SliceBoxService {
	constructor(
		@InjectModel(SliceBox.name) private model: Model<SliceBoxDocument>,
	) {}

	async create(payload: CreateSliceBoxDto): Promise<SliceBox> {
		const box = new this.model();

		try {
			box.option = payload.option;
			box.quantity = payload.qty;
			box.total = payload.total;
			box.products = payload.products;

			return box.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	getDetailById(id: string) {
		return this.model
			.findById(id)
			.populate([
				{ path: 'option' },
				{ path: 'products', populate: { path: 'product' } },
			]);
	}
}
