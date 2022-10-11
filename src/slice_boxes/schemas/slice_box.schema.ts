import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { SliceBoxOption } from 'src/slice_box_options/schemas/slice_box_option.schema';
import { SliceBoxProduct } from './slice_box_product.schema';

export type SliceBoxDocument = SliceBox & mongoose.Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class SliceBox {
	@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SliceBoxOption' })
	option: SliceBoxOption;

	@Prop({
		type: [
			{ type: mongoose.Schema.Types.ObjectId, ref: 'SliceBoxProduct' },
		],
	})
	products: SliceBoxProduct[];

	@Prop()
	quantity: number;

	@Prop()
	total: number;
}

export const SliceBoxSchema = SchemaFactory.createForClass(SliceBox);
