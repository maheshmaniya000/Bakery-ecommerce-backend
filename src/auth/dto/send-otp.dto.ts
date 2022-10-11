import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SendOtpDto {
	@ApiProperty()
	@IsEmail()
	readonly email: string;
}
