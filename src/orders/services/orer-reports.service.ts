import { Injectable, OnModuleInit } from '@nestjs/common';
import * as moment from 'moment-timezone';

import { DeliveryMethod } from 'src/delivery_methods/schemas/delivery_method.schema';
import { DeliveryZone } from 'src/delivery_zones/schemas/delivery_zone.schema';
import { PromoCodeDocument } from 'src/promo_codes/schemas/promo_code.schema';
import { SliceBox } from 'src/slice_boxes/schemas/slice_box.schema';
import { OrderBundle } from '../schemas/order-bundle/order-bundle.schema';
import { Order } from '../schemas/order.schema';
import { Product } from '../types/types';

@Injectable()
export class OrderReportsService implements OnModuleInit {
	onModuleInit() {
		moment.tz.setDefault('Asia/Singapore');
	}

	mapperSliceBoxesForReport(box: SliceBox) {
		let label = box.option.name;

		box.products.forEach((item) => {
			label += `\n${item.product.name} x${item.qty}`;
		});

		return {
			qty: box.quantity,
			categories: [],
			item: label,
			candles: '',
			message: '',
			knife: '',
			isSpecial: false,
		};
	}

	mapperProductForReport(product: Product) {
		const isSpecial = !product.itemName && product.product.isSpecial;

		return {
			qty: product.quantity,
			categories: product.itemName
				? []
				: product.product.categories.map((_id) => _id.toString()),
			item:
				product.itemName ||
				product.product.name + ' ' + (product.variant?.size || ''),
			candles: isSpecial ? product.candles?.toString() : '',
			message: isSpecial ? product.message : '',
			knife: isSpecial ? (product.knifes > 0 ? 'Yes' : 'No') : '',
			isSpecial,
		};
	}

	mapperBundleForReport(item: OrderBundle) {
		const { quantity, bundle, products } = item;

		const data = [];

		products.forEach(({ product, cakeText, candles, knife }) => {
			const isSpecial = product.product.isSpecial;
			const variant = product.variant
				? product.product.variants.find(
						(v) => v._id.toString() === product.variant,
				  )
				: '';

			data.push({
				qty: quantity * product.qty,
				categories: product.product.categories.map((_id) =>
					_id.toString(),
				),
				item: `${product.product.name}${
					variant ? ` ${variant.size}` : ''
				}`,
				bundle: bundle.name,
				candles: isSpecial ? candles : '',
				message: isSpecial ? cakeText : '',
				knife: isSpecial ? (knife ? 'Yes' : 'No') : '',
				isSpecial: isSpecial,
			});
		});

		return data;
	}

	mapperForReport(order: Order) {
		const method = order.delivery.method as DeliveryMethod;

		const data = {
			orderNo: '#' + order.uniqueNo.toUpperCase(),
			deliveryDate: moment(order.orderDate).format('DD/MM/YYYY'),
			orderDate: moment(order.created).format('DD/MM/YYYY'),
			name: order.sender.firstName + ' ' + order.sender.lastName,
			customerName: order.sender.firstName + ' ' + order.sender.lastName,
			phoneNumber: order.sender.mobileNo,
			email: order.sender.email,
			recipientName:
				order.recipient.firstName + ' ' + order.recipient.lastName,
			recipientPhone: order.recipient.mobileNo,
			address:
				(order.delivery.address || '')
					.toLowerCase()
					.split('singapore')[0] +
				(order.delivery.buildingUnitNo
					? `, ${order.delivery.buildingUnitNo}`
					: ''),
			building: order.delivery.buildingUnitNo,
			postalCode: order.delivery.postalCode
				? `Singapore ${order.delivery.postalCode}`
				: '',
			deliveryFee: order.delivery.price,
			delivery: method.name,
			giftTag: order.giftMessage,
			note: order.note,
			tags: order.tags.join(', '),
			remark: order.remark,
			status: order.status,
		};

		if (order.delivery.postalCode) {
			data['zoneId'] = order.delivery.postalCode.substr(0, 3);
		} else {
			data['zone'] = '1PUP';
		}

		if (order.deliveryZone) {
			const { name } = (order.deliveryZone as unknown) as DeliveryZone;

			data['zone'] = name;
		}

		if (order.promoCode) {
			const code = order.promoCode as PromoCodeDocument;

			data['discountCode'] = code.code;
		}

		if (
			order.delivery.specificTime &&
			order.delivery.specificTime.startTime
		) {
			data[
				'delivery'
			] += ` (${order.delivery.specificTime.startTime} - ${order.delivery.specificTime.endTime})`;
		}

		if (order.delivery?.specificTime?.name) {
			data['delivery'] += ` (${order.delivery.specificTime.name})`;
		}

		return data;
	}
}
