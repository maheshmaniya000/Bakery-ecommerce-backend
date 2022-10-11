import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment';

import { OTP, OtpDocument } from './schemas/otp.schema';
import { OTP_EXPIRE_MINUTE } from './constants';

@Injectable()
export class OTPService {
	constructor(
		@InjectModel(OTP.name) private otpModel: Model<OtpDocument>,
		private readonly mailerService: MailerService,
	) {}

	private generateOTP(): string {
		const digits = '0123456789';

		let OTP = '';

		for (let index = 0; index < 6; index++) {
			OTP += digits[Math.floor(Math.random() * 10)];
		}

		return OTP;
	}

	async create(email: string): Promise<void> {
		try {
			const otp = new this.otpModel();

			otp.email = email;
			otp.otp = this.generateOTP();

			// ------------------ set used for previous ones ------------------
			// const previous = await this.otpModel.findOne({
			// 	email,
			// 	used: false,
			// });

			// if (previous) {
			// 	previous.used = true;

			// 	await previous.save();
			// }

			// ------------------ ****** ---------------

			// send email
			await this.mailerService.sendMail({
				to: email,
				subject: 'Your one-time password (OTP)',
				template: process.cwd() + '/mail_templates/' + 'otp',
				context: {
					otp: otp.otp,
					name: 'Sir/ Madam',
					// expires:
					// 	moment()
					// 		.add(OTP_EXPIRE_MINUTE, 'minute')
					// 		.format('ddd DD MMM YYYY, HH:mm') + ' SGT',
				},
			});

			await otp.save();
		} catch (err) {
			throw new Error(err);
		}
	}

	async checkValid(email: string, otp: string): Promise<boolean> {
		try {
			const existed = await this.otpModel
				.findOne({ email, otp, used: false })
				.sort({ created: -1 });

			if (!existed) return false;

			return true;

			// disable expires feature
			// if (
			// 	moment().isSameOrBefore(
			// 		moment(existed.created).add(OTP_EXPIRE_MINUTE, 'minute'),
			// 	)
			// ) {
			// 	return true;
			// }
		} catch (err) {
			throw new Error(err);
		}
	}

	async used(email: string, otp: string): Promise<OtpDocument> {
		try {
			const existed = await this.otpModel
				.findOne({ email, otp, used: false })
				.sort({ created: -1 });

			existed.used = true;

			return existed.save();
		} catch (err) {
			throw new Error(err);
		}
	}
}
