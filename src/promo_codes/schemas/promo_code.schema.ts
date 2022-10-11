import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { PromoCodeType, Code } from '../constants';

export type PromoCodeDocument = PromoCode & Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class PromoCode {
	@Prop({
		trim: true,
		unique: false,
	})
	code: string;

	@Prop()
	title: string;

	@Prop()
	description: string;

	@Prop({
		default: 0,
	})
	amount: number;

	@Prop({
		default: 0,
	})
	total: number;

	@Prop({
		default: 0,
	})
	minSpending: number;

	@Prop({
		default: false,
	})
	multiCodes: boolean;

	@Prop({
		default: false,
	})
	isOnlyAdmin: boolean;

	@Prop([
		raw({
			code: String,
			used: Boolean,
			customer: {
				type: Types.ObjectId,
				ref: 'Customer',
			},
		}),
	])
	codes: Array<Code>;

	@Prop({
		default: 0,
	})
	used: number;

	@Prop()
	startDate: Date;

	@Prop()
	endDate?: Date;

	@Prop({ trim: true, type: String })
	startTime?: string;

	@Prop({ trim: true, type: String })
	endTime?: string;

	@Prop()
	type: PromoCodeType;

	@Prop({
		default: false,
	})
	isUnlimited: boolean;

	@Prop({
		default: false,
	})
	isOneTimePerUser: boolean;

	@Prop({
		default: false,
	})
	isIncludeDeliveryFee: boolean;

	@Prop([String])
	tags: string[];

	@Prop({
		default: true,
	})
	active: boolean;
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode);
