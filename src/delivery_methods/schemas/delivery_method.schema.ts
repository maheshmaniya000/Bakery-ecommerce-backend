import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MSchema } from 'mongoose';

import {
	DeliveryMethodEmail,
	DeliveryMethodType,
	DeliveryTimeSlot,
} from '../constants';
import { DeliveryMethodTime } from './delivery_method_time.schema';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class DeliveryMethod extends Document {
	@Prop({
		trim: true,
		unique: true,
	})
	name: string;

	@Prop()
	description?: string;

	@Prop()
	icon?: string;

	@Prop({
		default: 0,
	})
	deliveryPrice: number;

	@Prop({
		default: 0,
	})
	outskirtPrice?: number;

	@Prop({
		type: String,
		default: DeliveryMethodType.NORMAL,
	})
	type: DeliveryMethodType;

	@Prop({
		type: String,
	})
	emailType: DeliveryMethodEmail;

	@Prop([raw({ startTime: String, endTime: String })])
	specificTimes: DeliveryTimeSlot[];

	@Prop({
		default: false,
	})
	needPostalCode: boolean;

	@Prop({
		default: false,
	})
	isOutskirt: boolean;

	@Prop({
		default: true,
	})
	active: boolean;

	@Prop({
		default: 1,
	})
	sort: number;

	@Prop({
		type: [{ type: MSchema.Types.ObjectId, ref: 'DeliveryMethodTime' }],
	})
	times: DeliveryMethodTime[];
}

export const DeliveryMethodSchema = SchemaFactory.createForClass(
	DeliveryMethod,
);
