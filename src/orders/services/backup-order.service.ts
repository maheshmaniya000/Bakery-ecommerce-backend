import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { BackupOrder } from '../schemas/backup-order.schema';
import { Order } from '../schemas/order.schema';

@Injectable()
export class BackupOrderService {
	constructor(
		@InjectModel(BackupOrder.name)
		private backupOrderModel: PaginateModel<BackupOrder>,
	) {}

	async create(parent: Order): Promise<BackupOrder> {
		const payload = parent.toObject();

		delete payload._id;

		const existed = await this.backupOrderModel.findOne({
			uniqueNo: payload.uniqueNo,
		});

		if (existed) {
			// will delete

			await this.backupOrderModel.findByIdAndDelete(existed._id);
		}

		try {
			const order = new this.backupOrderModel(payload);

			await order.save();

			return order;
		} catch (err) {
			throw new Error(err);
		}
	}

	async findByUniqueNo(uniqueNo: string): Promise<BackupOrder> {
		return this.backupOrderModel.findOne({ uniqueNo });
	}
}
