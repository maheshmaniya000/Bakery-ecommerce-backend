import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// eslint-disable-next-line
// @ts-ignore
import * as Mailgun from 'mailgun.js';
import FormData from 'form-data';

import mailgunConfig from './config/mailgun.config';

@Injectable()
export class MailgunService {
	constructor(
		@Inject(mailgunConfig.KEY)
		private config: ConfigType<typeof mailgunConfig>,
	) {}

	private createMailgun() {
		const mailgun = new Mailgun(FormData);

		return mailgun.client({
			username: 'api',
			key: this.config.apiKey,
			public_key: this.config.publicKey,
		});
	}

	isEmailValidate(email: string) {
		return from(this.createMailgun().validate.get(email)).pipe(
			switchMap((response) => {
				return of(response.risk !== 'unknown');
			}),
		);
	}
}
