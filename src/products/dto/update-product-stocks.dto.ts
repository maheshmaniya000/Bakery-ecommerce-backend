import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, IsString } from 'class-validator';

export class UpdateProductStocksDto {
	@IsMongoId()
	readonly _id: string;

	@IsString()
	readonly variant: '';

	@IsNumber()
	@Type(() => Number)
	readonly qty: number;
}
