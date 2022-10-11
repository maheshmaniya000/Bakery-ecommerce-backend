import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../utils/dto/pagination.dto';

export class GetCustomersQueryDto extends PaginationDto {
	@IsOptional()
	@IsString()
	keyword?: string;

	ids?: string;

	tags?: string;

	status?: string;
}
