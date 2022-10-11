import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { Content, ContentSchema } from './schemas/content.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: Content.name,
				schema: ContentSchema,
			},
		]),
	],
	controllers: [ContentsController],
	providers: [ContentsService],
	exports: [ContentsService],
})
export class ContentsModule {}
