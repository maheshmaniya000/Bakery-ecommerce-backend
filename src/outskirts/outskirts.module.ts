import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Outskirt, OutskirtSchema } from './schemas/outskirt.schema';
import { OutskirtsService } from './outskirts.service';
import { OutskirtsController } from './outskirts.controller';

@Module({
	imports: [
		MongooseModule.forFeatureAsync([
			{
				name: Outskirt.name,
				useFactory: () => {
					const schema = OutskirtSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),
	],
	controllers: [OutskirtsController],
	providers: [OutskirtsService],
	exports: [OutskirtsService],
})
export class OutskirtsModule {}
