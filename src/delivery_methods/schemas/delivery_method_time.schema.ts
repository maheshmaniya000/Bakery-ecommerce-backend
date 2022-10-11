import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeliveryMethodTimeDocument = DeliveryMethodTime & Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class DeliveryMethodTime extends Document {
	@Prop()
	name: string;

	@Prop({
		default: 0,
	})
	price: number;

	@Prop({
		default: 0,
	})
	outskirtPrice: number;

	@Prop()
	availables: string[];
}

export const DeliveryMethodTimeSchema = SchemaFactory.createForClass(
	DeliveryMethodTime,
);
