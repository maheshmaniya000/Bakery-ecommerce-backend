import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class CreateCategoryDto {
	@ApiProperty()
	@IsString()
	readonly name: string;

	@IsString()
	readonly description: string;

	@ApiProperty()
	@IsArray()
	readonly products: string[];

	@ApiProperty()
	@IsArray()
	readonly ymal: string[];
}
