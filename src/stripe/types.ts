import { Order } from '../orders/schemas/order.schema';

export interface GetPaymentIntentParams {
	order: Order;
	amount: number;
}
