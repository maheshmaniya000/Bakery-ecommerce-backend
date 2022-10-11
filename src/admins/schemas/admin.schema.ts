import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Admin extends Document {
	@Prop({
		trim: true,
	})
	name: string;

	@Prop()
	email: string;

	@Prop()
	mobileNo: string;

	@Prop({
		trim: true,
	})
	authUniqueNo: string;

	@Prop({
		default: false,
	})
	isSuper?: boolean;

	@Prop({
		default: true,
	})
	active?: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
