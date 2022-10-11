import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import * as moment from 'moment';

import { ContactUsRequestedEvent } from '../contact_us/events/contact-us-requested.event';

@Injectable()
export class MailService {
	constructor(
		private mailerService: MailerService,
		private configService: ConfigService,
	) {}

	@OnEvent('contact-us.requested', { async: true })
	async handleContactUsRequestedEvent(payload: ContactUsRequestedEvent) {
		try {
			await this.mailerService.sendMail({
				to: this.configService.get('mail.from'),
				replyTo: payload.getData().email,
				template: process.cwd() + '/mail_templates/' + 'contact-us',
				subject: `New customer message on 
				${moment().format('dddd DD, YYYY')}
				at 
				${moment().format('h:mma')}`,
				context: payload.getData(),
			});
		} catch (err) {
			throw new Error(err);
		}
	}
}
