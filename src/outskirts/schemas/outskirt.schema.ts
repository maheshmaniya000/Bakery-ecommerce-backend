import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Outskirt extends Document {
	@Prop({
		trim: true,
	})
	postalCode: string;

	@Prop()
	name: string;

	@Prop({
		default: true,
	})
	active: boolean;
}

export const OutskirtSchema = SchemaFactory.createForClass(Outskirt);
