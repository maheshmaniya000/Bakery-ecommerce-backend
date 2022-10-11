import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../utils/dto/pagination.dto';

export class GetDeliveryZonesQueryDto extends PaginationDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	readonly status?: string;
}
