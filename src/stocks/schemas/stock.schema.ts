import { Prop, SchemaFactory, Schema, raw } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

import { StockVariant } from '../types';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Stock extends Document {
	@Prop()
	date: Date;

	@Prop({
		type: Types.ObjectId,
		ref: 'Product',
	})
	product: string | Types.ObjectId;

	@Prop([
		raw({
			variantId: String,
			qty: Number,
		}),
	])
	variants: Array<StockVariant>;

	@Prop({
		default: 0,
	})
	qty: number;
}

export const StockSchema = SchemaFactory.createForClass(Stock);
