import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { OrderBundleProductDto } from 'src/orders/dto/order-bundle-product.dto';

import {
	OrderBundleProduct,
	OrderBundleProductDocument,
} from 'src/orders/schemas/order-bundle/order-bundle-product.schema';

@Injectable()
export class OrderBundleProductService {
	constructor(
		@InjectModel(OrderBundleProduct.name)
		private readonly orderBundleProductModal: Model<OrderBundleProductDocument>,
	) {}

	create(
		payload: OrderBundleProductDto,
	): Promise<OrderBundleProductDocument> {
		const product = new this.orderBundleProductModal(payload);

		return product.save();
	}

	delete(id: string) {
		return this.orderBundleProductModal.findByIdAndDelete(id);
	}
}
