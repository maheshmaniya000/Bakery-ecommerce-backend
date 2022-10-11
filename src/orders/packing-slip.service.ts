import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as moment from 'moment';

import { Order } from './schemas/order.schema';
import { DeliveryZone } from 'src/delivery_zones/schemas/delivery_zone.schema';
import { SliceBox } from 'src/slice_boxes/schemas/slice_box.schema';
import { OrderBundle } from './schemas/order-bundle/order-bundle.schema';

@Injectable()
export class PackingSlipService {
	// for doc on pageAdded
	private currentOrder: Order = null;
	private ITEM_WIDTH: number;

	// chinese
	private CH_FONT = process.cwd() + '/assets/fonts/NotoSerifSC-Regular.otf';
	private FONT = process.cwd() + '/assets/fonts/Marion-Regular.ttf';

	async generate(orders: Order[]) {
		const doc = new PDFDocument({
			size: 'A6',
			margin: 20,
			info: {
				Title: 'Packing Slip',
				Author: 'Online Bakehouse',
			},
			autoFirstPage: false,
		});

		const LOGO = process.cwd() + '/assets/images/logo.png';
		const FONT = process.cwd() + '/assets/fonts/Marion-Regular.ttf';

		doc.font(FONT).fontSize(10);

		doc.on('pageAdded', () => {
			if (this.currentOrder) {
				doc.image(LOGO, doc.page.width - 80, doc.page.margins.top, {
					width: 60,
					height: 25,
				});

				doc.fontSize(14).text(
					`Order no   #${this.currentOrder.uniqueNo.toString()}`,
					doc.page.margins.left,
					doc.page.margins.top,
				);

				doc.fontSize(12).moveDown(0.4);

				doc.text(
					`${this.currentOrder.recipient.firstName} ${this.currentOrder.recipient.lastName}/ ${this.currentOrder.recipient.mobileNo}`,
					doc.page.margins.left,
				);

				doc.moveDown(0.2).text(
					this.currentOrder.delivery.method?.name +
						(this.currentOrder.delivery.specificTime?.startTime
							? ` (${this.currentOrder.delivery.specificTime.startTime} - ${this.currentOrder.delivery.specificTime.endTime})`
							: '') +
						(this.currentOrder.delivery.specificTime?.name
							? ` (${this.currentOrder.delivery.specificTime.name})`
							: ''),
				);

				if (this.currentOrder.deliveryZone) {
					const { name } = (this.currentOrder
						.deliveryZone as unknown) as DeliveryZone;

					doc.moveDown(0.2).text(name);
				}

				doc.moveDown(0.4);
				doc.text(
					`Delivery date   ${moment(
						this.currentOrder.orderDate,
					).format('DD/MM/YYYY')}`,
				);

				doc.moveDown(0.5);

				doc.moveTo(20, doc.y)
					.lineTo(doc.page.width - doc.page.margins.right * 2, doc.y)
					.stroke();

				doc.fontSize(10).moveDown(0.5);

				this.ITEM_WIDTH =
					doc.page.width -
					(doc.page.margins.left + doc.page.margins.right + 50);
			}
		});

		this.mapDocument(orders, doc);

		return doc;
	}

	mapDocument(orders: Order[], doc: PDFKit.PDFDocument) {
		if (orders.length === 0) {
			if (this.currentOrder === null) {
				doc.addPage();
			}

			return doc;
		}

		doc.fontSize(10);

		const order = orders[0];

		this.currentOrder = order;

		doc.addPage();

		// this.ITEM_WIDTH =
		// 	doc.page.width -
		// 	(doc.page.margins.left + doc.page.margins.right + 50);

		order.products.forEach((product) => {
			const tempY = doc.y;
			const meta = {
				quantity: product.quantity,
				name: product.itemName
					? product.itemName
					: product.product.name,
				variant: product.variant?.size
					? ` ${product.variant.size}`
					: '',
				price: product.price,
				candles: product.candles ? product.candles : '',
				textOnCake: product.message,
				knife: product.knifes > 0 ? 'Yes' : 'No',
			};

			doc.fontSize(10).text(
				meta.name + meta.variant,
				doc.page.margins.left,
				tempY,
				{
					width: this.ITEM_WIDTH,
				},
			);

			doc.fontSize(10).text(
				`x${meta.quantity}`,
				doc.page.width - (doc.page.margins.right + 40),
				tempY,
				{
					width: 40,
				},
			);

			doc.text('', doc.page.margins.left);

			if (doc.widthOfString(meta.name + meta.variant) > this.ITEM_WIDTH) {
				doc.moveDown();
			}

			if (product.product && product.product.isSpecial) {
				doc.moveDown(0.2);

				const specials = {
					'Candles (standard):': meta.candles || 0,
					'Cake Knife:': meta.knife,
					'Cake Text:': meta.textOnCake || '',
				};

				Object.keys(specials).forEach((key) => {
					const _tempY = doc.y;
					const _tempX = doc.x;

					if (key === 'Cake Text:') {
						const isChinese = specials[key]
							.toString()
							.match(/[\u3400-\u9FBF]/);

						doc.fontSize(8)
							.text(key, _tempX, _tempY)
							.font(isChinese ? this.CH_FONT : this.FONT)
							.fontSize(isChinese ? 6 : 8)
							.text(specials[key], _tempX + 100, _tempY, {
								width: 140,
							});

						if (!specials[key]) {
							doc.moveDown();
						}
					} else {
						doc.fontSize(8)
							.text(key, _tempX, _tempY)
							.text(specials[key], _tempX + 100, _tempY, {
								width: 140,
							});
					}

					doc.text('', doc.page.margins.left).moveDown(0.2);
				});

				doc.font(this.FONT).fontSize(10).moveDown();
			} else {
				doc.moveDown();

				// if (doc.widthOfString(meta.name + meta.variant) > ITEM_WIDTH) {
				// 	doc.moveDown();
				// }
			}
		});

		order.sliceBoxes.map((box) => this.mapSliceBoxForSlip(box, doc));
		order.bundles.map((bundle) => this.mapBundleForSlip(bundle, doc));

		return this.mapDocument(
			orders.filter((_order) => _order._id !== order._id),
			doc,
		);
	}

	mapSliceBoxForSlip(box: SliceBox, doc: PDFKit.PDFDocument) {
		const tempY = doc.y;

		doc.fontSize(10).text(box.option.name, doc.page.margins.left, tempY, {
			width: this.ITEM_WIDTH,
		});

		doc.fontSize(10).text(
			`x${box.quantity}`,
			doc.page.width - (doc.page.margins.right + 40),
			tempY,
			{
				width: 40,
			},
		);

		doc.text('', doc.page.margins.left);

		if (doc.widthOfString(box.option.name) > this.ITEM_WIDTH) {
			doc.moveDown();
		}

		doc.moveDown(0.2);

		box.products.forEach((item) => {
			doc.fontSize(8).text(
				`${item.product.name} x${item.qty}`,
				doc.x,
				doc.y,
			);

			doc.text('', doc.page.margins.left).moveDown(0.2);
		});

		doc.moveDown();
	}

	mapBundleForSlip(orderBundle: OrderBundle, doc: PDFKit.PDFDocument) {
		const tempY = doc.y;

		doc.fontSize(10).text(
			orderBundle.bundle.name,
			doc.page.margins.left,
			tempY,
			{
				width: this.ITEM_WIDTH,
			},
		);

		doc.fontSize(10).text(
			`x${orderBundle.quantity}`,
			doc.page.width - (doc.page.margins.right + 40),
			tempY,
			{
				width: 40,
			},
		);

		doc.text('', doc.page.margins.left);

		if (doc.widthOfString(orderBundle.bundle.name) > this.ITEM_WIDTH) {
			doc.moveDown();
		}

		doc.moveDown(0.2);

		orderBundle.products.forEach(({ product: bundle, ...detail }) => {
			const variant = bundle.variant
				? bundle.product.variants.find(
						(v) => v._id.toString() === bundle.variant,
				  )
				: '';

			doc.fontSize(8).text(
				`${bundle.product.name}${variant ? ` ${variant.size}` : ''} x${
					bundle.qty
				}`,
				doc.x,
				doc.y,
			);

			if (bundle.product.isSpecial) {
				doc.moveDown(0.2);

				const specials = {
					'Candles (standard):': detail.candles || 0,
					'Cake Knife:': detail.knife ? 'Yes' : 'No',
					'Cake Text:': detail.cakeText || '',
				};

				Object.keys(specials).forEach((key) => {
					const _tempY = doc.y;
					const _tempX = doc.x;

					if (key === 'Cake Text:') {
						const isChinese = specials[key]
							.toString()
							.match(/[\u3400-\u9FBF]/);

						doc.fontSize(8)
							.text(key, _tempX, _tempY)
							.font(isChinese ? this.CH_FONT : this.FONT)
							.fontSize(isChinese ? 6 : 8)
							.text(specials[key], _tempX + 100, _tempY, {
								width: 140,
							});

						if (!specials[key]) {
							doc.moveDown();
						}
					} else {
						doc.fontSize(8)
							.text(key, _tempX, _tempY)
							.text(specials[key], _tempX + 100, _tempY, {
								width: 140,
							});
					}

					doc.text('', doc.page.margins.left).moveDown(0.2);
				});
			}

			doc.text('', doc.page.margins.left).moveDown(0.5);
		});

		doc.moveDown();
	}
}
