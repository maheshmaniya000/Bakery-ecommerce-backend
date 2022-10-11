import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { BundlesService } from 'src/bundles/bundles.service';
import { BundleDocument } from 'src/bundles/schemas/bundle.schema';

import { CreateOrderBundleDto } from '../../dto/create-order-bundle.dto';

import {
	OrderBundle,
	OrderBundleDocument,
} from '../../schemas/order-bundle/order-bundle.schema';
import { OrderBundleProductService } from './order-bundle-product.service';

@Injectable()
export class OrderBundleService {
	constructor(
		@InjectModel(OrderBundle.name)
		private readonly orderBundleModal: Model<OrderBundleDocument>,

		private readonly bundlesService: BundlesService,
		private readonly orderBundleProductService: OrderBundleProductService,
	) {}

	create(payload: CreateOrderBundleDto): Promise<OrderBundle> {
		const orderBundle = new this.orderBundleModal(payload);

		return orderBundle.save();
	}

	async delete(id: string) {
		const { products } = await this.orderBundleModal
			.findById(id)
			.populate('products');

		for (const product of products) {
			await this.orderBundleProductService.delete((product as any)._id);
		}

		return this.orderBundleModal.findByIdAndDelete(id);
	}

	getProducts(
		id: string,
	): Observable<
		Array<{ productId: string; variantId: string; qty: number }>
	> {
		return from(this.orderBundleModal.findById(id).populate('bundle')).pipe(
			switchMap((order) =>
				this.bundlesService.getProducts(
					(order.bundle as BundleDocument)._id,
					order.quantity,
				),
			),
		);
	}
}
