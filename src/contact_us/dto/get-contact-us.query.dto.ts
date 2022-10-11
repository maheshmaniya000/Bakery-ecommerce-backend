import { PaginationDto } from 'src/utils/dto/pagination.dto';

export class GetContactUsQueryDto extends PaginationDto {
	keyword?: string;
}
