import { Bundle } from 'src/bundles/schemas/bundle.schema';
import { OrderBundleProduct } from '../schemas/order-bundle/order-bundle-product.schema';

export class CreateOrderBundleDto {
	bundle: Bundle;
	quantity: number;
	price: number;
	products: OrderBundleProduct[];
}
