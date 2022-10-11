import { Product as ProductSchema } from '../../products/schemas/product.schema';

export interface Sender {
	firstName: string;
	lastName: string;
	email: string;
	mobileNo: string;
}

export interface Recipient {
	firstName: string;
	lastName: string;
	mobileNo: string;
}

export interface Delivery {
	method: string | any;
	specificTime?: {
		startTime?: string;
		endTime?: string;
		name?: string;
		_id?: string;
	};
	isOutSkirt?: boolean;
	price: number;
	postalCode?: string;
	address: string;
	buildingUnitNo: string;
}

export interface Product {
	product?: ProductSchema;
	category?: string;
	variant?: {
		_id: string;
		price: number;
		size: string;
		image?: string;
	};
	price: number;
	quantity: number;
	itemName?: string;
	candles?: number;
	bigCandles?: number;
	smallCandles?: number;
	knifes?: number;
	message?: string;
}

export type CartItem = {
	productId: string;
	variantId?: string;
	qty: number;
};
