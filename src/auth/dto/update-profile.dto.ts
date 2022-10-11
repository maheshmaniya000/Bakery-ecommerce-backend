import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateProfileDto {
	@ApiProperty()
	@IsString()
	firstName: string;

	@ApiProperty()
	@IsString()
	lastName: string;

	@ApiProperty()
	@IsString()
	mobileNo: string;
}
