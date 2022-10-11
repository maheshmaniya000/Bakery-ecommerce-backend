import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { AnnouncementType } from '../constants';

export type AnnouncementDocument = Announcement & Document;

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Announcement {
	@Prop()
	header: string;

	@Prop()
	message: string;

	@Prop()
	startDate: Date;

	@Prop()
	endDate?: Date;

	@Prop({
		default: true,
	})
	active: boolean;

	@Prop({
		type: String,
		enum: Object.values(AnnouncementType),
	})
	type: AnnouncementType;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
