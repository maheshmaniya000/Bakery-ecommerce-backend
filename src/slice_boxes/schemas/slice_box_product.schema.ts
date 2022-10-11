import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Product } from 'src/products/schemas/product.schema';

export type SliceBoxProductDocument = SliceBoxProduct & mongoose.Document;

@Schema()
export class SliceBoxProduct {
	@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product' })
	product: Product;

	@Prop()
	price: number;

	@Prop()
	qty: number;
}

export const SliceBoxProductSchema =
	SchemaFactory.createForClass(SliceBoxProduct);
