import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { compare } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

import { AccountsService } from '../accounts/accounts.service';
import { AdminsService } from '../admins/admins.service';
import { CustomersService } from '../customers/customers.service';
import { OrdersService } from '../orders/orders.service';
import { OTPService } from '../otp/otp.service';
import { ValidatedEmailsService } from 'src/validated_emails/validated_emails.service';

import { RegisterDto } from './dto/register.dto';

import { AccountType, Provider } from '../accounts/constants';
import { generateOrderNo } from '../utils/misc';

import { Account } from '../accounts/schemas/account.schema';
import { GoogleLoginDto } from './dto/google-login.dto';
import { FacebookLoginDto } from './dto/facebook-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

import { OrderStatus } from 'src/orders/constants';

@Injectable()
export class AuthService {
	constructor(
		private readonly accountsService: AccountsService,
		private readonly jwtService: JwtService,
		private readonly otpService: OTPService,
		private readonly configService: ConfigService,
		private readonly mailerService: MailerService,
		private readonly validatedEmailsService: ValidatedEmailsService,

		@Inject(forwardRef(() => AdminsService))
		private readonly adminsService: AdminsService,

		@Inject(forwardRef(() => CustomersService))
		private readonly customersService: CustomersService,

		@Inject(forwardRef(() => OrdersService))
		private readonly ordersService: OrdersService,
	) {}

	async validateUser(
		email: string,
		password: string,
		accountType: AccountType,
	): Promise<Account> {
		const accounts = await this.accountsService.findByEmail({
			email,
			accountType,
			provider: Provider.LOCAL,
		});

		if (accounts.length === 0) {
			throw new UnauthorizedException(
				'Oops, account not found, please register',
			);
		}

		const isEqual = await compare(password, accounts[0].password);

		if (!isEqual) {
			throw new BadRequestException('Password or email are incorrect');
		}

		return accounts[0];
	}

	async getProfile(userId: string): Promise<any> {
		const account = await this.accountsService.findById(userId);

		const accounts = await this.accountsService.findByUniqueNo(
			account.uniqueNo,
		);

		switch (account.accountType) {
			case AccountType.ADMIN:
				const admin = await this.adminsService.findByAuthUniqueNo(
					account.uniqueNo,
				);
				return { ...admin, auth: account, accounts };

			case AccountType.CUSTOMER:
				const customer = await this.customersService.findByAuthUniqueNo(
					account.uniqueNo,
				);
				return { ...customer, auth: account, accounts };

			default:
				return account;
		}
	}

	async googleLogin({
		googleId,
		email,
		type,
		givenName,
		familyName,
		providerData,
	}: GoogleLoginDto): Promise<string> {
		const existed = await this.accountsService.findByProviderId({
			providerId: googleId,
			provider: Provider.GOOGLE,
			accountType: type,
		});

		if (existed) {
			return this.generateAuthToken(existed);
		}

		const created = await this.register({
			email,
			provider: Provider.GOOGLE,
			providerId: googleId,
			type,
			providerData,
		});

		await this.customersService.create(
			{
				firstName: givenName,
				lastName: familyName,
				email,
				mobileNo: '',
				authUniqueNo: existed ? existed.uniqueNo : created.uniqueNo,
			},
			false,
		);

		return this.generateAuthToken(created);
	}

	async facebookLogin({
		id,
		email,
		type,
		name,
		providerData,
	}: FacebookLoginDto): Promise<string> {
		const existed = await this.accountsService.findByProviderId({
			providerId: id,
			provider: Provider.FACEBOOK,
			accountType: type,
		});

		if (existed) {
			return this.generateAuthToken(existed);
		}

		if (!email) {
			throw new BadRequestException({
				status: 410,
				message: 'Email is required',
			});
		}

		const created = await this.register({
			email,
			provider: Provider.FACEBOOK,
			providerId: id,
			type,
			providerData,
		});

		await this.customersService.create(
			{
				firstName: name,
				lastName: '',
				email,
				mobileNo: '',
				authUniqueNo: created.uniqueNo,
			},
			false,
		);

		return this.generateAuthToken(created);
	}

	async generateAuthToken({
		id,
		uniqueNo,
		accountType,
	}: Account): Promise<string> {
		if (accountType === AccountType.CUSTOMER) {
			const customer = await this.customersService.findByAuthUniqueNo(
				uniqueNo,
			);

			if (!customer?.active) {
				throw new BadRequestException(
					'Account has been locked, please send us an email at hello@olsenbakehouse.com for assistance.',
				);
			}
		} else if (accountType === AccountType.ADMIN) {
			const admin = await this.adminsService.findByAuthUniqueNo(uniqueNo);

			if (!admin?.active) {
				throw new BadRequestException(
					'Account has been locked, please send us an email at hello@olsenbakehouse.com for assistance.',
				);
			}
		}

		return this.jwtService.sign({
			userId: id,
			uniqueNo,
		});
	}

	async register({
		email,
		type,
		provider,
		otp,
		...payload
	}: RegisterDto): Promise<Account> {
		const accounts = await this.accountsService.findByEmail({
			email,
			accountType: type,
		});

		// First by
		const isExisted = accounts.find((acc) => acc.provider === provider);

		if (isExisted) {
			throw new BadRequestException(
				'This account is already registered, please sign in',
			);
		}

		if (provider === Provider.LOCAL && otp) {
			const isValid = await this.otpService.checkValid(email, otp);

			if (!isValid) {
				throw new BadRequestException('Invalid OTP');
			} else {
				await this.otpService.used(email, otp);
			}
		}

		try {
			const latest = await this.accountsService.getByLatestUniqueNo();

			const uniqueNo =
				accounts.length > 0
					? accounts[0].uniqueNo
					: generateOrderNo(latest?.uniqueNo || '');

			return this.accountsService.create({
				...payload,
				email,
				type,
				uniqueNo,
				provider,
			});
		} catch (err) {
			throw new Error(err);
		}
	}

	async sendResetPassword(email: string, accountType: AccountType) {
		const accounts = await this.accountsService.findByEmail({
			email,
			accountType: accountType,
			provider: Provider.LOCAL,
		});
		const WEBSITE_URL = this.configService.get<string>('websiteUrl');
		const CMS_URL = this.configService.get<string>('cmsUrl');

		if (accounts.length === 0) {
			throw new BadRequestException('Account not found!');
		}

		const token = await this.jwtService.sign(
			{ accountId: accounts[0]._id },
			{
				expiresIn: '2h',
			},
		);

		if (accountType === AccountType.CUSTOMER) {
			const customer = await this.customersService.findByAuthUniqueNo(
				accounts[0].uniqueNo,
			);

			if (!customer.active) {
				throw new BadRequestException(
					'Account has been locked, please send us an email at hello@olsenbakehouse.com for assistance.',
				);
			}

			await this.sendResetPasswordEmail(
				customer.email,
				`${customer.firstName} ${customer.lastName}`,
				token,
				WEBSITE_URL,
			);
		} else if (accountType === AccountType.ADMIN) {
			const admin = await this.adminsService.findByAuthUniqueNo(
				accounts[0].uniqueNo,
			);

			if (!admin.active) {
				throw new BadRequestException(
					'Account has been locked, please send us an email at hello@olsenbakehouse.com for assistance.',
				);
			}

			await this.sendResetPasswordEmail(
				admin.email,
				admin.name,
				token,
				CMS_URL,
			);
		}
	}

	async resetPassword(token: string, password: string) {
		try {
			const { accountId } = await this.jwtService.verify(token);

			return this.accountsService.resetPassword(accountId, password);
		} catch (err) {
			throw new BadRequestException('Token expired!');
		}
	}

	async setPassword(profile: any, password: string) {
		return this.accountsService.create({
			email: profile.email,
			uniqueNo: profile.authUniqueNo,
			password,
			provider: Provider.LOCAL,
			type: AccountType.CUSTOMER,
		});
	}

	async linkWithFacebook(profile: any, payload: FacebookLoginDto) {
		return this.accountsService.create({
			...payload,
			uniqueNo: profile.authUniqueNo,
			provider: Provider.FACEBOOK,
			providerId: payload.id,
		});
	}

	async linkWithGoogle(profile: any, payload: GoogleLoginDto) {
		return this.accountsService.create({
			...payload,
			uniqueNo: profile.authUniqueNo,
			provider: Provider.GOOGLE,
			providerId: payload.googleId,
		});
	}

	async changePassword(profile: any, payload: ChangePasswordDto) {
		const account = profile.accounts.find(
			(acc) => acc.provider === Provider.LOCAL,
		);

		return this.accountsService.changePassword(account._id, payload);
	}

	async updateCart(profile: any, cart: any[]): Promise<any> {
		await this.customersService.updateCart(profile._id, cart);

		return this.getProfile(profile.auth._id);
	}

	async sendOtp(email: string) {
		const isDeliverable = await this.validatedEmailsService
			.isDeliverable(email)
			.toPromise();

		if (!isDeliverable) {
			throw new BadRequestException(`${email} is undeliverable!`);
		}

		await this.otpService.create(email);
	}

	async checkOtp(email: string, otp: string): Promise<boolean> {
		return this.otpService.checkValid(email, otp);
	}

	async getOrders(customerId: string, { page, limit }) {
		if (!customerId) {
			return {
				docs: [],
			};
		}

		return this.ordersService.getList({
			customerId,
			page,
			limit,
			statuses: Object.values(OrderStatus).join(','),
		});
	}

	private async sendResetPasswordEmail(
		email: string,
		name: string,
		token: string,
		url: string,
	) {
		const isDeliverable = await this.validatedEmailsService
			.isDeliverable(email)
			.toPromise();

		if (!isDeliverable) {
			throw new BadRequestException(`${email} is undeliverable!`);
		}

		await this.mailerService.sendMail({
			to: email,
			subject: 'Forgotten password reset',
			template: process.cwd() + '/mail_templates/' + 'reset-password',
			context: {
				name: name.trim(),
				WEBSITE_URL: `${url}?token=${token}&action=reset-password`,
			},
		});
	}

	async updateProfile(profile: any, payload: UpdateProfileDto): Promise<any> {
		return this.customersService.update(profile._id, payload);
	}

	async deleteAccount(id: string) {
		return this.accountsService.delete(id);
	}
}
