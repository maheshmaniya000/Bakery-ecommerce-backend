import { Injectable } from '@nestjs/common';

import { CustomersService } from './customers/customers.service';
import { OrdersService } from './orders/orders.service';

@Injectable()
export class AppService {
	constructor(
		private readonly customersService: CustomersService,
		private readonly ordersService: OrdersService,
	) {}

	getHello(): string {
		return 'Hello World!';
	}

	async getInfoForDashboard() {
		return {
			registeredCustomers: await this.customersService.getRegisteredCount(),
			totalOrdersOfToday: await this.ordersService.getTotalOrdersOfToday(),
			totalRevenueOfToday: await this.ordersService.getTotalRevenueOfToday(),
			totalOrders: await this.ordersService.getTotalOrdersCount(),
			totalRevenue: await this.ordersService.getTotalRevenue(),
			dailyRevenue: await this.ordersService.getDailyRevenue(),
			monthlyRevenue: await this.ordersService.getMonthlyRevenue(),
			yearlyRevenue: await this.ordersService.getYearlyRevenue(),
			dailyOrders: await this.ordersService.getDailyTotalOrders(),
			monthlyOrders: await this.ordersService.getMonthlyTotalOrders(),
			yearlyOrders: await this.ordersService.getYearlyTotalOrders(),
		};
	}
}
