import {
	IsArray,
	IsBoolean,
	IsMongoId,
	IsNumber,
	IsPositive,
	IsString,
	ValidateNested,
} from 'class-validator';

class OrderBundleProductPayloadDto {
	@IsMongoId()
	product: string;

	@IsNumber()
	candles: number;

	@IsBoolean()
	knife: boolean;

	@IsString()
	cakeText: string;
}

export class OrderBundlePayloadDto {
	@IsMongoId()
	bundle: string;

	@IsPositive()
	quantity: number;

	@IsArray()
	@ValidateNested({ each: true })
	products: OrderBundleProductPayloadDto[];
}
