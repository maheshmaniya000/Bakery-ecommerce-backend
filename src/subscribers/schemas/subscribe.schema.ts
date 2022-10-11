import { Schema, Document } from 'mongoose';

export interface Subscriber {
	email: string;
}

export interface SubscriberDocument extends Subscriber, Document {
	created?: any;
}

export const SubscriberSchema = new Schema(
	{
		email: {
			type: String,
			trim: true,
			required: true,
		},
	},
	{
		timestamps: {
			createdAt: 'created',
			updatedAt: 'updated',
		},
	},
);
