import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { AnnouncementType } from '../constants';

export class UpdateAnnouncementDto {
	@ApiProperty()
	@IsString()
	header: string;

	@ApiProperty()
	@IsString()
	message: string;

	@ApiProperty()
	@IsString()
	startDate: string;

	@ApiProperty()
	@IsOptional()
	@IsString()
	endDate?: string;

	@ApiProperty()
	@IsString()
	type: AnnouncementType;
}
