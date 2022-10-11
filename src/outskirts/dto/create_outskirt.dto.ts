import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class CreateOutskirtDto {
	@ApiProperty()
	@IsString()
	@Type(() => String)
	readonly postalCode: string;

	readonly name: string;
}
