import { PaginationDto } from '../../utils/dto/pagination.dto';

export class GetPromoCodeQueryDto extends PaginationDto {
	keyword?: string;

	tags?: string;
}
