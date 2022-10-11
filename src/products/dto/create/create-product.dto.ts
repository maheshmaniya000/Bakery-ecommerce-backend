import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';

export class CreateProductDto {
	@ApiProperty()
	@IsString()
	readonly name: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	readonly description?: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	readonly mainImage?: string;

	@ApiProperty()
	@IsOptional()
	@IsArray()
	readonly images?: string[];

	@ApiProperty()
	@IsArray()
	readonly tags: string[];

	@ApiProperty()
	@IsArray()
	readonly categories: string[];

	@ApiProperty()
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	readonly price?: number;

	@ApiProperty()
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	readonly fixedStock?: number;

	@IsOptional()
	fixedStockStartDate?: string;

	readonly isFixedStock?: boolean;

	@ApiProperty()
	@IsBoolean()
	readonly isAutoRestock: boolean;

	@ApiProperty()
	@IsBoolean()
	readonly isSpecial: boolean;

	@IsBoolean()
	readonly isNoCakeText: boolean;

	@ApiProperty()
	@IsArray()
	readonly restocks: number[];

	@ApiProperty()
	@IsArray()
	readonly variants: any[];

	readonly slug?: string;
}
