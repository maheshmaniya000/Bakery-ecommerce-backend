import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactUsDocument = ContactUs & Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class ContactUs {
	@Prop()
	name: string;

	@Prop()
	email: string;

	@Prop()
	mobileNo: string;

	@Prop()
	message: string;
}

export const ContactUsSchema = SchemaFactory.createForClass(ContactUs);
