import { ApiProperty } from '@nestjs/swagger';
import {
	IsString,
	IsOptional,
	IsEmail,
	IsObject,
	IsEnum,
} from 'class-validator';

import { AccountType } from '../../accounts/constants';

export class FacebookLoginDto {
	@ApiProperty()
	@IsString()
	readonly id: string;

	@ApiProperty()
	@IsString()
	readonly name: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsEmail()
	readonly email?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsObject()
	readonly picture: any;

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
