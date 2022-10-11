import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import {
	AnnouncementSchema,
	Announcement,
} from './schemas/announcement.schema';

@Module({
	imports: [
		MongooseModule.forFeatureAsync([
			{
				name: Announcement.name,
				useFactory: () => {
					const schema = AnnouncementSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),
	],
	controllers: [AnnouncementsController],
	providers: [AnnouncementsService],
	exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
