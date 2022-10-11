import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../utils/dto/pagination.dto';
import { OrderType } from '../constants';

export class GetOrdersQueryDto extends PaginationDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsMongoId()
	customerId?: string;

	promoCodeId?: string;

	customers?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	methods?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	keyword?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	products?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	categories?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsEnum(OrderType)
	type?: OrderType;

	@IsOptional()
	@IsString()
	tags?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	statuses?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	orderDate?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	createdDate?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	zones?: string;
}
