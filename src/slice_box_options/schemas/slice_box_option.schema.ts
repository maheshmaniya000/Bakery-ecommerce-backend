import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SliceBoxOptionDocument = SliceBoxOption & Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class SliceBoxOption {
	@Prop()
	name: string;

	@Prop()
	min: number;

	@Prop()
	max: number;

	@Prop()
	image: string;

	@Prop()
	description: string;

	@Prop({
		default: true,
	})
	isActive?: boolean;

	@Prop({
		default: '',
	})
	remark?: string;
}

export const SliceBoxOptionSchema =
	SchemaFactory.createForClass(SliceBoxOption);
