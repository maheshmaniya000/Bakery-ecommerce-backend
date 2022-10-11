import { Product } from 'src/products/schemas/product.schema';

export class CreateSliceBoxProductDto {
	product: Product;
	qty: number;
	price: number;
}
