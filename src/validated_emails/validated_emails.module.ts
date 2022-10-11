import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MailGunModule } from 'src/mailgun/mailgun.module';

import {
	ValidatedEmail,
	ValidatedEmailSchema,
} from './schemas/validated_email.schema';
import { ValidatedEmailService } from './services/validated_email.service';
import { ValidatedEmailsService } from './validated_emails.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: ValidatedEmail.name, schema: ValidatedEmailSchema },
		]),

		MailGunModule,
	],
	providers: [ValidatedEmailService, ValidatedEmailsService],
	exports: [ValidatedEmailsService],
})
export class ValidatedEmailsModule {}
