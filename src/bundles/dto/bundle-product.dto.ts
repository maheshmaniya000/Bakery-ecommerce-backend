import { Product } from 'src/products/schemas/product.schema';

export interface BundleProductDTO {
	product: Product;
	qty: number;
	variant?: string;
}
