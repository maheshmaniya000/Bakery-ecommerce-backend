import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../utils/dto/pagination.dto';

export class GetProductsQueryDto extends PaginationDto {
	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly category?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsMongoId()
	readonly categoryId?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly sort?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly search?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly keyword: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly createdDate: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly status: string;

	tags?: string;

	ids?: string;
}
