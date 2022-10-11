import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class DeliveryZone extends Document {
	@Prop({
		trim: true,
	})
	name: string;

	@Prop()
	description?: string;

	@Prop([String])
	postalCodes: string[];

	@Prop({
		default: true,
	})
	active: boolean;
}

export const DeliveryZoneSchema = SchemaFactory.createForClass(DeliveryZone);
