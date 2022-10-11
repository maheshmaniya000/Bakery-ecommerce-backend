import { Prop, Schema, raw, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import {
	DeliverySettings,
	MinForDelivery,
	PeakDaySurCharge,
} from '../types/deliverySettings';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Setting extends Document {
	@Prop({
		trim: true,
	})
	name: string;

	@Prop({ trim: true })
	restockTime: string;

	@Prop({
		default: 0,
	})
	minAmount: number;

	@Prop({
		default: 0,
	})
	notifyLowStock: number;

	@Prop(
		raw({
			preparationDays: Number,
			deliveryDays: Number,
			deliveryNextDayTime: String,
			blackoutDates: [String],
			blackOutDay: Number,
		}),
	)
	deliverySettings: DeliverySettings;

	@Prop(
		raw({
			price: Number,
			dates: [String],
		}),
	)
	peakDaySurcharge: PeakDaySurCharge;

	@Prop({
		type: [
			{
				type: Types.ObjectId,
				ref: 'Product',
			},
		],
	})
	currentlyTrending: Types.ObjectId[];

	@Prop({
		type: [
			{
				type: Types.ObjectId,
				ref: 'Product',
			},
		],
	})
	popularItems: Types.ObjectId[];

	@Prop(
		raw({
			active: Boolean,
			minAmount: Number,
			deliveryDiscount: Number,
			freeDelivery: Boolean,
		}),
	)
	minForDelivery: MinForDelivery;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
