import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { compare, genSaltSync, hashSync } from 'bcryptjs';

import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { ValidatedEmailsService } from 'src/validated_emails/validated_emails.service';

import { Account } from './schemas/account.schema';

import { CreateAccountDto } from './dto/create-account.dto';

import { findByEmailParams, findByProviderIdParams } from './types/parameters';
import { AccountType, Provider } from './constants';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';

@Injectable()
export class AccountsService {
	constructor(
		@InjectModel(Account.name) private accountModel: Model<Account>,
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService,

		private validatedEmailsService: ValidatedEmailsService,
	) {}

	async findById(id: string): Promise<Account> {
		try {
			return this.accountModel.findById(id).lean();
		} catch (err) {
			throw new Error(err);
		}
	}

	async findByEmail({
		email,
		accountType,
		provider,
	}: findByEmailParams): Promise<Account[]> {
		try {
			const query = {
				email,
			};

			if (accountType) {
				query['accountType'] = accountType;
			}

			if (provider) {
				query['provider'] = provider;
			}

			return this.accountModel.find(query).select('+password').exec();
		} catch (err) {
			throw new Error(err);
		}
	}

	async findByProviderId({
		providerId,
		provider,
		accountType,
	}: findByProviderIdParams): Promise<Account> {
		try {
			const query = {
				providerId,
			};

			if (provider) {
				query['provider'] = provider;
			}

			if (accountType) {
				query['accountType'] = accountType;
			}

			return this.accountModel.findOne(query).exec();
		} catch (err) {
			throw new Error(err);
		}
	}

	async findByUniqueNo(uniqueNo: string): Promise<Account[]> {
		return this.accountModel.find({ uniqueNo });
	}

	async changeEmail(email: string, uniqueNo: string) {
		const existed = await this.accountModel.findOne({
			uniqueNo,
			provider: Provider.LOCAL,
		});

		if (existed) {
			existed.email = email;

			await existed.save();

			// remove
			await this.accountModel.findOneAndDelete({
				uniqueNo,
				provider: Provider.GOOGLE,
			});
			await this.accountModel.findOneAndDelete({
				uniqueNo,
				provider: Provider.FACEBOOK,
			});
		}
	}

	async getByLatestUniqueNo(): Promise<Account> {
		try {
			return this.accountModel.findOne().sort({ uniqueNo: -1 }).exec();
		} catch (err) {
			throw new Error(err);
		}
	}

	async changePassword(
		id: string,
		{ currentPassword, newPassword }: ChangePasswordDto,
	) {
		const account = await this.accountModel
			.findById(id)
			.select('+password');

		const isEqual = await compare(currentPassword, account.password);

		if (!isEqual) {
			throw new BadRequestException('Incorrect Password');
		}

		const salt = genSaltSync(10);
		account.password = hashSync(newPassword, salt);

		return account.save();
	}

	async resetPassword(id: string, password: string) {
		const account = await this.accountModel.findById(id);

		const salt = genSaltSync(10);
		account.password = hashSync(password, salt);

		return account.save();
	}

	async create({
		password,
		provider,
		type,
		...payload
	}: CreateAccountDto): Promise<Account> {
		try {
			const account = new this.accountModel(payload);

			account.provider = provider;
			account.accountType = type;

			if (provider === Provider.LOCAL) {
				const salt = genSaltSync(10);
				account.password = hashSync(password, salt);
			}

			await account.save();

			const accounts = await this.accountModel.find({
				uniqueNo: payload.uniqueNo,
			});

			if (
				accounts.length === 1 &&
				account.email &&
				account.accountType === AccountType.CUSTOMER
			) {
				const isValid = await this.validatedEmailsService
					.isDeliverable(account.email)
					.toPromise();

				if (isValid) {
					await this.mailerService.sendMail({
						to: account.email,
						subject: 'Welcome to Olsen Bakehouse!',
						template:
							process.cwd() + '/mail_templates/' + 'welcome',
						context: {
							WEBSITE_URL:
								this.configService.get<string>('websiteUrl'),
						},
					});
				}
			}

			return account;
		} catch (err) {
			throw new Error(err);
		}
	}

	async delete(id: string) {
		return this.accountModel.findByIdAndDelete(id);
	}

	async deleteByUniqueNo(uniqueNo: string): Promise<void> {
		const accounts = await this.accountModel.find({ uniqueNo }).exec();

		await Promise.all(
			accounts.map(async (account) => {
				return await this.delete(account._id);
			}),
		);
	}
}
