import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BundleProductDTO } from '../dto/bundle-product.dto';

import {
	BundleProduct,
	BundleProductDocument,
} from '../schemas/bundle-product.schema';

@Injectable()
export class BundleProductService {
	constructor(
		@InjectModel(BundleProduct.name)
		private bundleProductModel: Model<BundleProductDocument>,
	) {}

	create(payload: BundleProductDTO): Promise<BundleProduct> {
		const product = new this.bundleProductModel(payload);

		return product.save();
	}

	findById(id: string) {
		return this.bundleProductModel.findById(id);
	}

	deleteById(id: string) {
		return this.bundleProductModel.findByIdAndDelete(id);
	}
}
