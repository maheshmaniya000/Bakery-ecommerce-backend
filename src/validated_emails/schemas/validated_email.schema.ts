import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ValidatedEmailDocument = ValidatedEmail & Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class ValidatedEmail {
	@Prop({
		type: String,
		trim: true,
	})
	email: string;

	@Prop()
	isDeliverable: boolean;
}

export const ValidatedEmailSchema =
	SchemaFactory.createForClass(ValidatedEmail);
