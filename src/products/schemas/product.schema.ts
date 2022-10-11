import { Prop, SchemaFactory, Schema, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { Variant } from '../types/variant';
import { ProductStock } from '../types/Stock';
@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Product extends Document {
	@Prop({
		trim: true,
	})
	name: string;

	@Prop({
		trim: true,
	})
	description: string;

	@Prop({
		trim: true,
	})
	slug?: string;

	@Prop()
	mainImage: string;

	@Prop([String])
	images: string[];

	@Prop({
		default: 0,
	})
	basePrice: number;

	@Prop()
	price: number;

	@Prop([String])
	tags: string[];

	@Prop({
		type: [
			{
				type: Types.ObjectId,
				ref: 'Category',
			},
		],
	})
	categories: string[];

	@Prop([
		raw({
			price: Number,
			size: String,
			images: [String],
			isAutoRestock: Boolean,
			isFixedStock: Boolean,
			restocks: [Number],
			fixedStock: Number,
			fixedStockStartDate: String,
		}),
	])
	variants: Variant[];

	@Prop([Number])
	restocks: number[];

	@Prop()
	fixedStock: number;

	@Prop()
	fixedStockStartDate?: string;

	@Prop({
		default: true,
	})
	active: boolean;

	@Prop()
	isAutoRestock: boolean;

	@Prop({
		default: false,
	})
	isFixedStock: boolean;

	// virtual
	stocks?: ProductStock[];

	// for candles, cake knife, message
	@Prop({
		default: false,
	})
	isSpecial: boolean;

	@Prop({
		default: false,
	})
	isNoCakeText: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
