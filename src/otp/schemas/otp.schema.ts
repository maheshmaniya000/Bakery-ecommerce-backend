import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = OTP & Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class OTP {
	@Prop({
		type: String,
		trim: true,
		required: true,
	})
	email: string;

	@Prop({
		type: String,
		trim: true,
		required: true,
	})
	otp: string;

	@Prop({
		type: Boolean,
		default: false,
	})
	used: boolean;

	created?: Date;
	updated?: Date;
}

export const OtpSchema = SchemaFactory.createForClass(OTP);
