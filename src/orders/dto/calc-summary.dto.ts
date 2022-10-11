import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsMongoId,
	IsOptional,
	IsPositive,
	ValidateNested,
} from 'class-validator';

export class CartItemDto {
	@ApiProperty()
	@IsMongoId()
	productId: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsMongoId()
	variantId?: string;

	@ApiProperty()
	@IsPositive()
	qty: number;
}

class BundleDto {
	@IsMongoId()
	bundle: string;

	@IsPositive()
	quantity: number;
}

export class CalcSummaryDto {
	@ApiProperty({
		type: [CartItemDto],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CartItemDto)
	cart: CartItemDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	bundles?: BundleDto[];
}
