import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import mailgunConfig from './config/mailgun.config';

import { MailgunService } from './mailgun.service';

@Module({
	imports: [ConfigModule.forFeature(mailgunConfig)],
	providers: [MailgunService],
	exports: [MailgunService],
})
export class MailGunModule {}
