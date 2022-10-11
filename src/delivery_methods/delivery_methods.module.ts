import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
	DeliveryMethod,
	DeliveryMethodSchema,
} from './schemas/delivery_method.schema';

import { DeliveryMethodsService } from './delivery_methods.service';
import { DeliveryMethodsController } from './delivery_methods.controller';

import { OutskirtsModule } from '../outskirts/outskirts.module';
import {
	DeliveryMethodTime,
	DeliveryMethodTimeSchema,
} from './schemas/delivery_method_time.schema';
import { DeliveryMethodTimeService } from './services/delivery-method-time.service';

@Module({
	imports: [
		OutskirtsModule,

		MongooseModule.forFeatureAsync([
			{
				name: DeliveryMethod.name,
				useFactory: () => {
					const schema = DeliveryMethodSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
			{
				name: DeliveryMethodTime.name,
				useFactory: () => DeliveryMethodTimeSchema,
			},
		]),
	],
	controllers: [DeliveryMethodsController],
	providers: [DeliveryMethodTimeService, DeliveryMethodsService],
	exports: [DeliveryMethodsService],
})
export class DeliveryMethodsModule {}
