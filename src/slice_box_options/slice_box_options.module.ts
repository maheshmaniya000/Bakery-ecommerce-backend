import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SliceBoxOptionRepository } from './repositories/slice_box_option.repository';

import {
	SliceBoxOption,
	SliceBoxOptionSchema,
} from './schemas/slice_box_option.schema';

import { SliceBoxOptionsController } from './slice_box_options.controller';

import { SliceBoxOptionsService } from './slice_box_options.service';

@Module({
	imports: [
		MongooseModule.forFeatureAsync([
			{
				name: SliceBoxOption.name,
				useFactory: () => {
					const schema = SliceBoxOptionSchema;

					return schema;
				},
			},
		]),
	],
	controllers: [SliceBoxOptionsController],
	providers: [SliceBoxOptionRepository, SliceBoxOptionsService],
	exports: [SliceBoxOptionsService],
})
export class SliceBoxOptionsModule {}
