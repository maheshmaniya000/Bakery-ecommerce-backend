import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSliceBoxProductDto } from '../dto/create-slice-box-product.dto';
import {
	SliceBoxProduct,
	SliceBoxProductDocument,
} from '../schemas/slice_box_product.schema';

@Injectable()
export class SliceBoxProductSerivce {
	constructor(
		@InjectModel(SliceBoxProduct.name)
		private model: Model<SliceBoxProductDocument>,
	) {}

	async create(payload: CreateSliceBoxProductDto): Promise<SliceBoxProduct> {
		const product = new this.model(payload);

		try {
			return product.save();
		} catch (err) {
			throw new Error(err);
		}
	}
}
