import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import mailConfig from './config/mail.config';
import { MailService } from './mail.service';

@Module({
	imports: [
		ConfigModule.forFeature(mailConfig),

		MailerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				return {
					transport: {
						host: configService.get('mail.host'),
						port: configService.get('mail.port'),
						secure:
							configService
								.get<string>('mail.secure')
								.toLowerCase() === 'true',
						auth: {
							user: configService.get('mail.username'),
							pass: configService.get('mail.password'),
						},
					},

					defaults: {
						from: `Olsen Bakehouse <${configService.get(
							'mail.from',
						)}>`,
						replyTo: configService.get('mail.replyTo'),
					},
					template: {
						dir: process.cwd() + '/mail_templates/',
						adapter: new HandlebarsAdapter(),
						options: {
							strict: true,
						},
					},
				};
			},
		}),
	],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule { }
