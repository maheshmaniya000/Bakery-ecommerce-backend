import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { PromoCodeDocument } from '../../promo_codes/schemas/promo_code.schema';
import { Customer } from '../../customers/schemas/customer.schema';

import { OrderStatus, OrderType, PaymentType } from '../constants';
import { Recipient, Sender, Delivery, Product } from '../types/types';
import { SliceBox } from 'src/slice_boxes/schemas/slice_box.schema';
import { OrderBundle } from './order-bundle/order-bundle.schema';

@Schema({
	timestamps: {
		createdAt: 'created',
		updatedAt: 'updated',
	},
})
export class Order extends Document {
	@Prop({
		type: Types.ObjectId,
		ref: 'Customer',
	})
	customer: Customer;

	@Prop({
		type: Types.ObjectId,
		ref: 'PromoCode',
	})
	promoCode: PromoCodeDocument;

	@Prop({
		default: '',
	})
	usedCode: string;

	@Prop({
		required: true,
	})
	orderDate: Date;

	@Prop()
	paidAt?: Date;

	@Prop([
		raw({
			product: {
				type: Types.ObjectId,
				ref: 'Product',
			},
			category: {
				type: Types.ObjectId,
				ref: 'Category',
			},
			variant: {
				_id: String,
				price: Number,
				size: String,
				image: String,
			},
			price: Number,
			quantity: Number,
			itemName: String,
			isWholeCake: Boolean,
			candles: Number,
			knifes: Number,
			message: String,
		}),
	])
	products: Product[];

	@Prop({ type: [{ type: Types.ObjectId, ref: 'SliceBox' }] })
	sliceBoxes: SliceBox[];

	@Prop({ type: [{ type: Types.ObjectId, ref: OrderBundle.name }] })
	bundles: OrderBundle[];

	@Prop(
		raw({
			method: {
				type: Types.ObjectId,
				ref: 'DeliveryMethod',
			},
			specificTime: {
				startTime: String,
				endTime: String,
				name: String,
				_id: String,
			},
			isOutSkirt: Boolean,
			price: Number,
			postalCode: String,
			address: String,
			buildingUnitNo: String,
		}),
	)
	delivery: Delivery;

	@Prop(
		raw({
			firstName: String,
			lastName: String,
			email: String,
			mobileNo: String,
		}),
	)
	sender: Sender;

	@Prop(
		raw({
			firstName: String,
			lastName: String,
			mobileNo: String,
		}),
	)
	recipient: Recipient;

	@Prop()
	remark?: string;

	@Prop([String])
	tags: string[];

	@Prop({
		type: Types.ObjectId,
		ref: 'DeliveryZone',
	})
	deliveryZone?: string;

	@Prop({
		required: true,
		unique: true,
	})
	uniqueNo: string;

	@Prop({
		default: 0,
	})
	peakDaySurcharge: number;

	@Prop({
		default: 0,
	})
	discount: number;

	@Prop({
		default: 0,
	})
	totalAmount: number;

	@Prop({
		default: 0,
	})
	paid: number;

	@Prop({
		default: 0,
	})
	unpaid: number;

	@Prop({
		default: '',
	})
	giftMessage?: string;

	@Prop({
		type: String,
		default: OrderStatus.PENDING,
	})
	status: OrderStatus;

	@Prop({
		type: String,
		default: OrderType.NORMAL,
	})
	type: OrderType;

	@Prop({
		default: 0,
	})
	fees: number;

	@Prop()
	paymentType: PaymentType;

	@Prop()
	paymentLog: any[];

	created?: Date;

	updated?: Date;

	@Prop()
	note?: string;

	@Prop({
		default: false,
	})
	usedFreeDelivery?: boolean;

	// virtual fields
	virtualDiscount?: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
