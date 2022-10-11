import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsOptional,
	ValidateNested,
	IsDateString,
	IsString,
	IsArray,
} from 'class-validator';

import { SenderDto } from './sender.dto';
import { RecipientDto } from './recipient.dto';
import { DeliveryDto } from './delivery.dto';
import { ProductDto } from './product.dto';
import { CreateSliceBoxBodyDto } from 'src/slice_boxes/dto/create-slice-box-body.dto';
import { OrderBundlePayloadDto } from './order-bundle-payload.dto';

export class UpdateOrderDto {
	@ApiProperty()
	@IsDateString()
	readonly orderDate: Date;

	@ApiProperty({
		type: [ProductDto],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ProductDto)
	readonly products: ProductDto[];

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

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateSliceBoxBodyDto)
	sliceBoxes: CreateSliceBoxBodyDto[];

	@IsArray()
	@ValidateNested({ each: true })
	bundles: OrderBundlePayloadDto[];

	@ApiProperty({
		type: SenderDto,
	})
	@ValidateNested({ each: true })
	@Type(() => SenderDto)
	readonly sender: SenderDto;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	readonly giftMessage?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	readonly note?: string;

	readonly paid?: number;

	readonly makeRefund?: boolean;
}
