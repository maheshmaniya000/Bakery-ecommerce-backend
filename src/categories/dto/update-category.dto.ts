import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class UpdateCategoryDto {
	@ApiProperty()
	@IsString()
	readonly name: string;

	@IsString()
	readonly description: string;

	readonly items: Array<{ type: string; product: string }>;
	readonly ymals: Array<{ type: string; product: string }>;
}
