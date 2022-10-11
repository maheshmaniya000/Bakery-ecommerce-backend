import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
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

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	readonly authUniqueNo?: string;
}
