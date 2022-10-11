import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString } from 'class-validator';

import { AccountType } from '../../accounts/constants';

export class LoginPayloadDto {
	@ApiProperty()
	@IsEmail()
	readonly email: string;

	@ApiProperty()
	@IsString()
	readonly password: string;

	@ApiProperty()
	@IsEnum(AccountType, {
		message:
			'$property must be one of ' +
			Object.values(AccountType).join(', ') +
			'.',
	})
	readonly type: AccountType;
}
