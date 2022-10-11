import { BundleProduct } from 'src/bundles/schemas/bundle-product.schema';

export type OrderBundleProductDto = {
	product: BundleProduct;
	candles: number;
	knife: boolean;
	cakeText: string;
};
