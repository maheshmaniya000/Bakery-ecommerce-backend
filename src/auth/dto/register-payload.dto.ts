import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

import { AccountType } from '../../accounts/constants';

export class RegisterPayloadDto {
	@ApiProperty()
	@IsEmail()
	readonly email: string;

	@ApiProperty()
	@IsString()
	@MinLength(8)
	readonly password: string;

	// @ApiProperty()
	// @IsEnum(AccountType, {
	// 	message:
	// 		'$property must be one of ' +
	// 		Object.values(AccountType).join(', ') +
	// 		'.',
	// })
	// readonly type: AccountType;
}
