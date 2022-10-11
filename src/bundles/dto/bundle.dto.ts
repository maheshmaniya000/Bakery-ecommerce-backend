import { BundleProduct } from '../schemas/bundle-product.schema';

export interface BundleDTO {
	name: string;
	description: string;
	slug: string;
	image: string;
	images: string[];
	price: number;
	products: BundleProduct[];
}
