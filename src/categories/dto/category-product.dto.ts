import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsMongoId, IsNumber } from 'class-validator';

export class CategoryProductDto {
	@ApiProperty()
	@IsMongoId()
	readonly product: string;

	@ApiProperty()
	@IsNumber()
	@Type(() => Number)
	readonly sequence: number;
}
