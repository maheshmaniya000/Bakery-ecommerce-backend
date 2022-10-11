import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import StripeConfig from './config/stripe.config';
import { StripeService } from './stripe.service';

@Module({
	imports: [ConfigModule.forFeature(StripeConfig)],
	providers: [StripeService],
	exports: [StripeService],
})
export class StripeModule {}
