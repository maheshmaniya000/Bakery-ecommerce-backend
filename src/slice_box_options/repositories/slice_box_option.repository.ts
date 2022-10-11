import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateSliceBoxOptionDto } from '../dto/create-slice-box-option.dto';
import { GetSliceBoxOptionsQueryDto } from '../dto/get-slice-box-options.query.dto';
import { UpdateSliceBoxOptionDto } from '../dto/update-slice-box-option.dto';

import {
	SliceBoxOption,
	SliceBoxOptionDocument,
} from '../schemas/slice_box_option.schema';

@Injectable()
export class SliceBoxOptionRepository {
	constructor(
		@InjectModel(SliceBoxOption.name)
		private sliceBoxOptionModel: Model<SliceBoxOptionDocument>,
	) {}

	async getList(_query: GetSliceBoxOptionsQueryDto) {
		const query = {};

		if (_query.active) {
			query['isActive'] = _query.active.toLowerCase() === 'true';
		}

		return this.sliceBoxOptionModel.find(query);
	}

	findById(id: string) {
		return this.sliceBoxOptionModel.findById(id);
	}

	async create(payload: CreateSliceBoxOptionDto) {
		const option = new this.sliceBoxOptionModel();

		option.name = payload.name;
		option.min = payload.min;
		option.max = payload.max;
		option.image = payload.image;
		option.description = payload.description;
		option.remark = payload.remark || '';

		try {
			await option.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async update(id: string, payload: UpdateSliceBoxOptionDto) {
		const option = await this.sliceBoxOptionModel.findById(id);

		option.name = payload.name;
		option.min = payload.min;
		option.max = payload.max;
		option.image = payload.image;
		option.description = payload.description;
		option.remark = payload.remark || '';

		try {
			await option.save();
		} catch (err) {
			throw new Error(err);
		}
	}
}
