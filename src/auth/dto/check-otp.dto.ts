import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CheckOtpDto {
	@ApiProperty()
	@IsEmail()
	readonly email: string;

	@ApiProperty()
	@IsString()
	readonly otp: string;
}
