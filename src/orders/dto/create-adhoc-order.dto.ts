import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsOptional,
	IsMongoId,
	ValidateNested,
	IsDateString,
	IsString,
	IsArray,
} from 'class-validator';

import { NewAccountDto } from './new-account.dto';
import { SenderDto } from './sender.dto';
import { RecipientDto } from './recipient.dto';
import { DeliveryDto } from './delivery.dto';
import { ProductDto } from './product.dto';
import { CreateSliceBoxBodyDto } from 'src/slice_boxes/dto/create-slice-box-body.dto';
import { OrderBundlePayloadDto } from './order-bundle-payload.dto';

export class CreateAdhocOrderDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsMongoId()
	readonly customerId?: string;

	@ApiProperty()
	@IsDateString()
	readonly orderDate: Date;

	@ApiProperty({
		required: false,
		type: NewAccountDto,
	})
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => NewAccountDto)
	readonly newAccount?: NewAccountDto;

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

	@ApiProperty({
		type: SenderDto,
	})
	@ValidateNested({ each: true })
	@Type(() => SenderDto)
	readonly sender: SenderDto;

	@IsArray()
	@ValidateNested({ each: true })
	sliceBoxes: CreateSliceBoxBodyDto[];

	@IsArray()
	@ValidateNested({ each: true })
	bundles: OrderBundlePayloadDto[];

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	readonly giftMessage?: string;

	readonly usedCode?: string;

	readonly paid?: number;
}
