import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateStockLogsDto } from '../dto/create-stock-logs.dto';

import { StockLogs } from '../schemas/stock_logs.schema';

@Injectable()
export class StockLogsService {
	constructor(
		@InjectModel(StockLogs.name) private stockLogsModel: Model<StockLogs>,
	) {}

	async create(payload: CreateStockLogsDto) {
		const logs = new this.stockLogsModel();

		logs.stock = Types.ObjectId(payload.stock);

		if (payload.order) {
			logs.order = Types.ObjectId(payload.order);
		}

		logs.product = Types.ObjectId(payload.product);
		logs.variantId = payload.variantId;
		logs.qty = payload.qty;
		logs.remark = payload.remark;

		await logs.save();
	}
}
