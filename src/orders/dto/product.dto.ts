import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsMongoId,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
} from 'class-validator';

export class ProductDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsMongoId()
	readonly categoryId?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsMongoId()
	readonly productId?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsMongoId()
	readonly variantId?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	readonly itemName?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	readonly price?: number;

	@ApiProperty()
	@IsPositive()
	@Type(() => Number)
	readonly quantity: number;

	@ApiProperty()
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	readonly candles?: number;

	@ApiProperty()
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	readonly knifes?: number;

	@ApiProperty()
	@IsOptional()
	@IsString()
	readonly message?: string;
}
