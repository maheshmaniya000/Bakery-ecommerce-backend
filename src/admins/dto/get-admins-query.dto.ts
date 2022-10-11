import { PaginationDto } from 'src/utils/dto/pagination.dto';

export class GetAdminsQueryDto extends PaginationDto {
	keyword: string;
}
