export class CreateStockLogsDto {
	stock: string;
	product: string;
	order?: string;
	variantId?: string;
	qty: number;
	remark?: string;
}
