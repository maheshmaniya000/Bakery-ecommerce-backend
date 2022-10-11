import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { AccountType, Provider } from '../constants';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Account extends Document {
	@Prop({
		type: String,
		required: true,
	})
	uniqueNo: string;

	@Prop({
		type: String,
		trim: true,
		lowercase: true,
	})
	email?: string;

	@Prop({
		type: String,
		select: false,
	})
	password?: string;

	@Prop({
		type: String,
		enum: Object.values(AccountType),
		required: true,
	})
	accountType: string;

	@Prop({
		type: String,
		enum: Object.values(Provider),
		required: true,
	})
	provider: string;

	@Prop({ type: Object })
	providerData?: any;

	@Prop({
		type: String,
	})
	providerId?: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
