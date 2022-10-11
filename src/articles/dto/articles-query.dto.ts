import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

import { PaginationDto } from '../../utils/dto/pagination.dto';
import { Status } from '../constants';

export class ArticlesQueryDto extends PaginationDto {
	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	category?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	feature?: string;

	@ApiProperty({
		enum: Object.keys(Status),
		required: false,
	})
	@IsOptional()
	@IsEnum(Object.keys(Status))
	status?: Status;
}
