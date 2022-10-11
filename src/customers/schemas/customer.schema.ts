import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Customer extends Document {
	@Prop()
	firstName: string;

	@Prop()
	lastName: string;

	@Prop()
	mobileNo: string;

	@Prop()
	email: string;

	@Prop()
	cart: any[];

	@Prop({
		trim: true,
	})
	authUniqueNo?: string;

	@Prop({
		default: true,
	})
	active: boolean;

	@Prop([String])
	tags: string[];

	@Prop()
	cartUpdatedAt?: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
