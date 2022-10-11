import { ProductStock } from './Stock';

export interface Variant {
	_id?: string;
	price: number;
	size: string;
	image?: string;
	isAutoRestock: boolean;
	isFixedStock?: boolean;
	fixedStock?: number;
	fixedStockStartDate?: string;
	restocks: Array<number>;
	stocks?: ProductStock[];
}
