import {
	IsEmail,
	IsString,
	MinLength,
	IsEnum,
	IsOptional,
} from 'class-validator';

import { Provider, AccountType } from '../constants';

export class CreateAccountDto {
	@IsString()
	readonly uniqueNo: string;

	@IsOptional()
	@IsEmail()
	readonly email?: string;

	@IsString()
	@MinLength(8)
	readonly password?: string;

	@IsEnum(Provider, {
		message:
			'$property must be one of ' +
			Object.values(Provider).join(', ') +
			'.',
	})
	readonly provider: Provider;

	@IsOptional()
	@IsString()
	providerId?: string;

	@IsEnum(AccountType, {
		message:
			'$property must be one of ' +
			Object.values(AccountType).join(', ') +
			'.',
	})
	readonly type: AccountType;

	providerData?: any;
}
