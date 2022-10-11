import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import AWSConfig from './config/aws.config';
import { AWSService } from './aws.service';

@Module({
	imports: [ConfigModule.forFeature(AWSConfig)],
	providers: [AWSService],
	exports: [AWSService],
})
export class AWSModule {}
