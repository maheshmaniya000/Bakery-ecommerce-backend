import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';
import * as moment from 'moment-timezone';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Order } from '../schemas/order.schema';
import { OrderStatus } from '../constants';

import { BackupOrderService } from './backup-order.service';
import { OrdersService } from '../orders.service';
import { OrderUtilsService } from './order-utils.service';
import { StocksService } from 'src/stocks/stocks.service';

@Injectable()
export class OrderSchedulerService implements OnModuleInit {
	constructor(
		@InjectModel(Order.name) private orderModel: PaginateModel<Order>,

		private backupOrderService: BackupOrderService,
		private ordersService: OrdersService,
		private orderUtilsService: OrderUtilsService,
		private stocksService: StocksService,
	) {}

	async onModuleInit(): Promise<void> {
		moment.tz.setDefault('Asia/Singapore');
	}

	@Cron(CronExpression.EVERY_DAY_AT_5AM)
	async isPendingPaymentsExpired(): Promise<void> {
		const orders = await this.orderModel.find({
			status: OrderStatus.PENDING_PAYMENT,
		});

		for (const order of orders) {
			const orderDate = moment(order.orderDate).startOf('d');
			const days = orderDate.diff(moment().startOf('d'), 'days');

			// switch back to confirmed, because of pending payment expired
			if (days <= 1) {
				const backup = await this.backupOrderService.findByUniqueNo(
					order.uniqueNo,
				);

				if (backup) {
					// ----------- put back to stocks (+) -----------
					const putBackProducts = await this.orderUtilsService
						.getProductUsage(order._id)
						.toPromise();

					await this.stocksService.updateStocksBySpecific(
						orderDate.toDate(),
						putBackProducts.map((product) => ({
							...product,
							qty: -Math.abs(product.qty),
						})),
					);
					// ----------------------------------------------

					// ----------- reduce to stocks (-) -----------
					const payload = backup.toObject();
					delete payload._id;

					await this.orderModel.findByIdAndUpdate(
						order._id,
						payload as any,
					);

					const reduceProducts = await this.orderUtilsService
						.getProductUsage(order._id)
						.toPromise();

					await this.stocksService.updateStocksBySpecific(
						orderDate.toDate(),
						reduceProducts.map((product) => ({
							...product,
							qty: Math.abs(product.qty),
						})),
					);
					// ----------------------------------------------
				}
			}
		}
	}

	@Cron(CronExpression.EVERY_DAY_AT_3AM)
	async checkExpiredOrders() {
		const orders = await this.orderModel.find({
			orderDate: {
				$lte: moment().startOf('d').toDate(),
			},
			status: OrderStatus.PENDING,
		});

		for (let index = 0; index < orders.length; index++) {
			orders[index].status = OrderStatus.EXPIRED;

			await orders[index].save();
		}
	}

	@Cron(CronExpression.EVERY_DAY_AT_4AM)
	async checkProcessedOrders() {
		const orders = await this.orderModel.find({
			orderDate: {
				$lt: moment().startOf('d').toDate(),
			},
			status: {
				$in: [OrderStatus.DELIVERING, OrderStatus.READY_FOR_COLLECTION],
			},
		});

		for (let index = 0; index < orders.length; index++) {
			orders[index].status = OrderStatus.COMPLETED;

			await orders[index].save();

			await this.ordersService.sendEmail(orders[index]._id);
		}
	}
}
