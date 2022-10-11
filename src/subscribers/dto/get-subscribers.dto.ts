import { PaginationDto } from '../../utils/dto/pagination.dto';

export class GetSubscribersDto extends PaginationDto {
	keyword?: string;

	startDate?: string;

	endDate?: string;
}
