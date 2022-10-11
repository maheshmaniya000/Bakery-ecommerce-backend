import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class UpdateOutskirtDto {
	@ApiProperty()
	@IsString()
	@Type(() => String)
	readonly postalCode: string;

	name: string;
}
