import { Type } from 'class-transformer';
import {
	IsArray,
	IsMongoId,
	IsPositive,
	ValidateNested,
} from 'class-validator';

export class CreateSliceBoxBodyDto {
	@IsMongoId()
	option: string;

	@IsPositive()
	qty: number;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SliceBoxProductDto)
	products: SliceBoxProductDto[];
}

class SliceBoxProductDto {
	@IsMongoId()
	product: string;

	@IsPositive()
	qty: number;
}
