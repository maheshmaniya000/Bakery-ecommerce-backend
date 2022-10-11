import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersModule } from 'src/orders/orders.module';

import { PromoCodesController } from './promo_codes.controller';
import { PromoCodesService } from './promo_codes.service';
import { PromoCode, PromoCodeSchema } from './schemas/promo_code.schema';

@Module({
	imports: [
		forwardRef(() => OrdersModule),

		MongooseModule.forFeatureAsync([
			{
				name: PromoCode.name,
				useFactory: () => {
					const schema = PromoCodeSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),
	],
	controllers: [PromoCodesController],
	providers: [PromoCodesService],
	exports: [PromoCodesService],
})
export class PromoCodesModule {}
