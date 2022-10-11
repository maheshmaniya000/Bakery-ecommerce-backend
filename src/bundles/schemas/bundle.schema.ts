import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

import { BundleProduct } from './bundle-product.schema';

export type BundleDocument = Bundle & mongoose.Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Bundle {
	@Prop()
	name: string;

	@Prop()
	description: string;

	@Prop()
	slug: string;

	@Prop()
	image: string;

	@Prop([String])
	images: string[];

	@Prop()
	price: number;

	@Prop({
		default: true,
	})
	isActive: boolean;

	@Prop({
		type: [
			{ type: mongoose.Schema.Types.ObjectId, ref: BundleProduct.name },
		],
	})
	products: BundleProduct[];
}

export const BundleSchema = SchemaFactory.createForClass(Bundle);
