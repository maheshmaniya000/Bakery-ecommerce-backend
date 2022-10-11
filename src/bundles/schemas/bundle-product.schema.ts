import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

import { Product } from 'src/products/schemas/product.schema';

export type BundleProductDocument = BundleProduct & mongoose.Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class BundleProduct {
	@Prop({ type: mongoose.Schema.Types.ObjectId, ref: Product.name })
	product: Product;

	@Prop()
	variant: string;

	@Prop()
	qty: number;
}

export const BundleProductSchema = SchemaFactory.createForClass(BundleProduct);
