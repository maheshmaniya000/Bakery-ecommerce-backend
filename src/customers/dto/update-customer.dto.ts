import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateCustomerDto {
	@ApiProperty()
	@IsString()
	readonly firstName: string;

	@ApiProperty()
	@IsString()
	readonly lastName: string;

	@ApiProperty()
	@IsString()
	readonly mobileNo: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsEmail()
	readonly email?: string;

	tags?: string[];
}
