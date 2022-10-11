import { Types } from 'mongoose';

export interface StockVariant extends Types.Subdocument {
	variantId: string;
	qty: number;
}
