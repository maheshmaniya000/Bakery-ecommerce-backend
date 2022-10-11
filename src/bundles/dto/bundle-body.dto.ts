export class BundleBodyDto {
	name: string;
	description: string;
	slug: string;
	image: string;
	images: string[];
	price: number;
	products: Array<{
		product: string;
		variant?: string;
		qty: number;
	}>;
}
