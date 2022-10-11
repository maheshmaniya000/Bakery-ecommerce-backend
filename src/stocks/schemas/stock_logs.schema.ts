import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class StockLogs extends Document {
	@Prop({ type: Types.ObjectId, ref: 'Stock' })
	stock: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: 'Product' })
	product: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: 'Order' })
	order?: Types.ObjectId;

	@Prop({
		default: '',
	})
	variantId?: string;

	@Prop({
		default: '',
	})
	remark?: string;

	@Prop({
		default: 0,
	})
	qty: number;
}

export const StockLogsSchema = SchemaFactory.createForClass(StockLogs);
