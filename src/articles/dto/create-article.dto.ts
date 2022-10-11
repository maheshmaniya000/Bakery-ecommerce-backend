import { ApiProperty } from '@nestjs/swagger';
import {
	IsString,
	IsOptional,
	IsEnum,
	IsBoolean,
	IsArray,
} from 'class-validator';

import { Status } from '../constants';
import { IsTime } from '../../utils/validators/is-time.validator';
import { IsDate } from '../../utils/validators/is-date.validator';
import { IsSlugAlreadyExist } from '../validators/is-slug-already-exist.validator';

export class CreateArticleDto {
	@ApiProperty()
	@IsString()
	readonly title: string;

	@ApiProperty()
	@IsString()
	readonly author: string;

	@ApiProperty()
	@IsArray()
	readonly categories: string[];

	@ApiProperty()
	@IsString()
	readonly content: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly metaTitle: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly metaDescription: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly coverImage?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly mainImage?: string;

	@ApiProperty()
	@IsString()
	@IsSlugAlreadyExist()
	readonly slug: string;

	@ApiProperty()
	@IsBoolean()
	readonly isFeature: boolean;

	@ApiProperty()
	@IsOptional()
	@IsString()
	@IsDate()
	readonly publishStartDate: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	@IsTime()
	readonly publishStartTime: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsDate()
	readonly publishEndDate: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsTime()
	readonly publishEndTime: string;

	@ApiProperty()
	@IsEnum(Status, {
		message:
			'$property must be one of ' +
			Object.values(Status).join(', ') +
			'.',
	})
	readonly status: Status;
}
