import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { BundleProduct } from 'src/bundles/schemas/bundle-product.schema';

export type OrderBundleProductDocument = OrderBundleProduct & mongoose.Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class OrderBundleProduct {
	@Prop({ type: mongoose.Schema.Types.ObjectId, ref: BundleProduct.name })
	product: BundleProduct;

	@Prop({
		default: 0,
	})
	candles: number;

	@Prop({
		default: false,
	})
	knife: boolean;

	@Prop({ default: '' })
	cakeText: string;
}

export const OrderBundleProductSchema =
	SchemaFactory.createForClass(OrderBundleProduct);
