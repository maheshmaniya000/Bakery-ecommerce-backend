import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/products/schemas/product.schema';

type Item = {
	product: string;
	type: string;
};

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Category extends Document {
	@Prop({
		type: String,
		trim: true,
		unique: true,
	})
	name: string;

	@Prop({
		default: '',
	})
	description: string;

	@Prop()
	slug: string;

	@Prop({
		default: true,
	})
	active: boolean;

	@Prop({
		type: [
			{
				type: Types.ObjectId,
				ref: 'Product',
			},
		],
	})
	products: string[];

	@Prop([
		raw({
			product: { type: String },
			type: { type: String },
		}),
	])
	items: Item[];

	@Prop([
		raw({
			product: { type: String },
			type: { type: String },
		}),
	])
	ymals: Item[];

	@Prop({
		type: [
			{
				type: Types.ObjectId,
				ref: 'Product',
			},
		],
	})
	ymal: string[];

	mappedProducts?: Product[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
