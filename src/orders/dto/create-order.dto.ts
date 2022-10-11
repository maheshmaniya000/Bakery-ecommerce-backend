import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsOptional,
	IsMongoId,
	ValidateNested,
	IsDateString,
	IsString,
	IsArray,
	IsPositive,
	IsNumber,
} from 'class-validator';

import { SenderDto } from './sender.dto';
import { RecipientDto } from './recipient.dto';
import { DeliveryDto } from './delivery.dto';
import { CreateSliceBoxBodyDto } from 'src/slice_boxes/dto/create-slice-box-body.dto';
import { OrderBundlePayloadDto } from './order-bundle-payload.dto';
// import { ProductDto } from './product.dto';

export class CreateOrderProductDto {
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

	@ApiProperty({ required: false })
	@IsOptional()
	@IsNumber()
	bigCandles?: number;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsNumber()
	smallCandles?: number;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsNumber()
	knifes?: number;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	message?: string;
}

export class CreateOrderDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsMongoId()
	readonly customerId?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	readonly usedCode?: string;

	@ApiProperty()
	@IsDateString()
	readonly orderDate: string;

	// @ApiProperty({
	// 	required: false,
	// 	type: NewAccountDto,
	// })
	// @IsOptional()
	// @ValidateNested({ each: true })
	// @Type(() => NewAccountDto)
	// readonly newAccount?: NewAccountDto;

	@ApiProperty({
		type: [CreateOrderProductDto],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateOrderProductDto)
	readonly products: CreateOrderProductDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateSliceBoxBodyDto)
	sliceBoxes?: CreateSliceBoxBodyDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	bundles?: OrderBundlePayloadDto[];

	@ApiProperty({ type: DeliveryDto })
	@ValidateNested({ each: true })
	@Type(() => DeliveryDto)
	readonly delivery: DeliveryDto;

	@ApiProperty({
		type: RecipientDto,
	})
	@ValidateNested({ each: true })
	@Type(() => RecipientDto)
	readonly recipient: RecipientDto;

	@ApiProperty({
		type: SenderDto,
	})
	@ValidateNested({ each: true })
	@Type(() => SenderDto)
	readonly sender: SenderDto;

	// @ApiProperty({ required: false })
	// @IsOptional()
	// @IsString()
	// readonly giftMessage?: string;
}
