import { Injectable } from '@nestjs/common';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { MailgunService } from 'src/mailgun/mailgun.service';
import { ValidatedEmailService } from './services/validated_email.service';

@Injectable()
export class ValidatedEmailsService {
	constructor(
		private validatedEmailService: ValidatedEmailService,
		private mailgunService: MailgunService,
	) {}

	isDeliverable(email: string) {
		return of(true);

		return from(this.validatedEmailService.findByEmail(email)).pipe(
			switchMap((validated) => {
				if (validated) return of(validated.isDeliverable);

				return this.mailgunService.isEmailValidate(email).pipe(
					switchMap((isDeliverable) =>
						from(
							this.validatedEmailService.create({
								email,
								isDeliverable,
							}),
						).pipe(
							switchMap((validated) =>
								of(validated.isDeliverable),
							),
						),
					),
				);
			}),
		);
	}
}
