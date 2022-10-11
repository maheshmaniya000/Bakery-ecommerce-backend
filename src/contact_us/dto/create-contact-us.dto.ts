import { IsEmail, IsString } from 'class-validator';

export class CreateContactUsDto {
	@IsString()
	name: string;

	@IsEmail()
	email: string;

	@IsString()
	mobileNo: string;

	@IsString()
	message: string;
}
