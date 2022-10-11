import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class NewAccountDto {
	@ApiProperty()
	@IsString()
	readonly firstName: string;

	@ApiProperty()
	@IsString()
	readonly lastName: string;

	@ApiProperty()
	readonly mobileNo: string;

	@ApiProperty()
	@IsEmail()
	readonly email: string;
}
