import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterCustomerPayloadDto {
	@ApiProperty()
	@IsString()
	readonly firstName: string;

	@ApiProperty()
	@IsString()
	readonly lastName: string;

	@ApiProperty()
	@IsString()
	readonly mobileNo: string;

	@ApiProperty()
	@IsEmail()
	readonly email: string;

	@ApiProperty()
	@IsString()
	@MinLength(6)
	readonly password: string;

	@ApiProperty()
	@IsString()
	readonly otp: string;
}
