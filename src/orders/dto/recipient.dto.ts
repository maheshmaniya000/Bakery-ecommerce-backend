import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RecipientDto {
	@ApiProperty()
	@IsString()
	readonly firstName: string;

	@ApiProperty()
	@IsString()
	readonly lastName: string;

	@ApiProperty()
	readonly mobileNo: string;
}
