import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Bundle } from 'src/bundles/schemas/bundle.schema';
import { OrderBundleProduct } from './order-bundle-product.schema';

export type OrderBundleDocument = OrderBundle & mongoose.Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class OrderBundle {
	@Prop({ type: mongoose.Schema.Types.ObjectId, ref: Bundle.name })
	bundle: Bundle;

	@Prop()
	quantity: number;

	@Prop()
	price: number;

	@Prop({
		type: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: OrderBundleProduct.name,
			},
		],
	})
	products: OrderBundleProduct[];
}

export const OrderBundleSchema = SchemaFactory.createForClass(OrderBundle);
