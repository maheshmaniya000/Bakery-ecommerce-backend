import { Module, HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import HitpayConfig from './config/hitpay.config';
import { HitpayService } from './hitpay.service';

@Module({
	imports: [HttpModule, ConfigModule.forFeature(HitpayConfig)],
	providers: [HitpayService],
	exports: [HitpayService],
})
export class HitpayModule {}
