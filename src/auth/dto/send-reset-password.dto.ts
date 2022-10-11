import { IsEmail } from 'class-validator';

export class SendResetPasswordDto {
	@IsEmail()
	email: string;
}
