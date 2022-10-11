import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

import { AccountType } from '../../accounts/constants';

export class GoogleLoginDto {
	@ApiProperty()
	@IsEmail()
	readonly email: string;

	@ApiProperty()
	@IsString()
	readonly googleId: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly familyName?: string;

	@ApiProperty()
	@IsString()
	readonly givenName: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly imageUrl?: string;

	@ApiProperty()
	@IsEnum(AccountType, {
		message:
			'$property must be one of ' +
			Object.values(AccountType).join(', ') +
			'.',
	})
	readonly type: AccountType;

	providerData?: any;
}
