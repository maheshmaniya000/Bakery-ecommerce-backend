import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
	DeliveryZone,
	DeliveryZoneSchema,
} from './schemas/delivery_zone.schema';
import { DeliveryZonesService } from './delivery_zones.service';
import { DeliveryZonesController } from './delivery_zones.controller';

@Module({
	imports: [
		MongooseModule.forFeatureAsync([
			{
				name: DeliveryZone.name,
				useFactory: () => {
					const schema = DeliveryZoneSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),
	],
	controllers: [DeliveryZonesController],
	providers: [DeliveryZonesService],
	exports: [DeliveryZonesService],
})
export class DeliveryZonesModule {}
