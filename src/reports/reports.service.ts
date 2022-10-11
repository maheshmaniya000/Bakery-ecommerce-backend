import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
	getOrdersMasterColumns(): ExcelJS.Column[] {
		return [
			{
				header: 'first 3 numbers of postal code',
				key: 'zoneId',
				width: 20,
			},
			{
				header: 'Zone',
				key: 'zone',
				width: 20,
			},
			{
				header: 'Order no.',
				key: 'orderNo',
				width: 20,
			},
			{
				header: 'Customer Name',
				key: 'customerName',
				width: 30,
			},
			{
				header: 'Customer Phone',
				key: 'phoneNumber',
				width: 20,
			},
			{
				header: 'Sender Name',
				key: 'name',
				width: 20,
			},
			{
				header: 'Recipient Name',
				key: 'recipientName',
				width: 30,
			},
			{
				header: 'Recipient Phone',
				key: 'recipientPhone',
				width: 20,
			},
			{
				header: 'Address',
				key: 'address',
				width: 30,
			},
			{
				header: 'Postal code',
				key: 'postalCode',
				width: 20,
			},
			{
				header: 'Quantity',
				key: 'qty',
				width: 15,
			},
			{
				header: 'Item Name',
				key: 'item',
				width: 30,
			},
			{
				header: 'Delivery type',
				key: 'delivery',
				width: 30,
			},
			{
				header: 'Delivery fee',
				key: 'deliveryFee',
				width: 20,
			},
			{
				header: 'Candles',
				key: 'candles',
				width: 20,
			},
			{
				header: 'Message on cake',
				key: 'message',
				width: 20,
			},
			{
				header: 'Cake Knife',
				key: 'knife',
				width: 20,
			},
			{
				header: 'Bundle',
				key: 'bundle',
				width: 20,
			},
			{
				header: 'Gift message',
				key: 'giftTag',
				width: 20,
			},
			{
				header: 'Instruction to team',
				key: 'note',
				width: 40,
			},
			{
				header: 'Discount Code',
				key: 'discountCode',
				width: 20,
			},
			{
				header: 'Tags',
				key: 'tags',
				width: 20,
			},
			{
				header: 'Internal remark',
				key: 'remark',
				width: 20,
			},
			{
				header: 'Delivery date',
				key: 'deliveryDate',
				width: 20,
			},
			{
				header: 'Order date',
				key: 'orderDate',
				width: 20,
			},
			{
				header: 'Order status',
				key: 'status',
				width: 20,
			},
		] as ExcelJS.Column[];
	}

	getOrdersPackingColumns(): ExcelJS.Column[] {
		return [
			{
				header: 'first 3 numbers of postal code',
				key: 'zoneId',
				width: 20,
			},
			{
				header: 'Zone',
				key: 'zone',
				width: 20,
			},
			{
				header: 'Order no.',
				key: 'orderNo',
				width: 20,
			},
			{
				header: 'Sender Name',
				key: 'name',
				width: 30,
			},
			{
				header: 'Recipient Name',
				key: 'recipientName',
				width: 30,
			},
			{
				header: 'Quantity',
				key: 'qty',
				width: 15,
			},
			{
				header: 'Item Name',
				key: 'item',
				width: 30,
			},
			// {
			// 	header: 'Bundle',
			// 	key: 'bundle',
			// 	width: 20,
			// },
			{
				header: 'Gift message',
				key: 'giftTag',
				width: 20,
			},
			{
				header: 'Instruction to team',
				key: 'note',
				width: 40,
			},
			{
				header: 'Tags',
				key: 'tags',
				width: 20,
			},
			{
				header: 'Intermal remark',
				key: 'remark',
				width: 20,
			},
			{
				header: 'Order status',
				key: 'status',
				width: 20,
			},
		] as ExcelJS.Column[];
	}

	getOrdersDeliveryColumns(): ExcelJS.Column[] {
		return [
			{
				header: 'first 3 numbers of postal code',
				key: 'zoneId',
				width: 20,
			},
			{
				header: 'Zone',
				key: 'zone',
				width: 20,
			},
			{
				header: 'Delivery date',
				key: 'deliveryDate',
				width: 20,
			},
			{
				header: 'Order no.',
				key: 'orderNo',
				width: 20,
			},
			{
				header: 'Sender Name',
				key: 'name',
				width: 30,
			},
			{
				header: 'Sender Number',
				key: 'phoneNumber',
				width: 20,
			},
			{
				header: 'Sender Email',
				key: 'email',
				width: 30,
			},
			{
				header: 'Recipient Name',
				key: 'recipientName',
				width: 30,
			},
			{
				header: 'Recipient Phone',
				key: 'recipientPhone',
				width: 20,
			},
			{
				header: 'Address',
				key: 'address',
				width: 30,
			},
			{
				header: 'Postal code',
				key: 'postalCode',
				width: 20,
			},
			{
				header: 'Tags',
				key: 'tags',
				width: 20,
			},
			{
				header: 'Delivery type',
				key: 'delivery',
				width: 30,
			},
			{
				header: 'Order status',
				key: 'status',
				width: 20,
			},
		] as ExcelJS.Column[];
	}

	getOrdersWholeCakeColumns(): ExcelJS.Column[] {
		return [
			{
				header: 'first 3 numbers of postal code',
				key: 'zoneId',
				width: 20,
			},
			{
				header: 'Zone',
				key: 'zone',
				width: 20,
			},
			{
				header: 'Order no.',
				key: 'orderNo',
				width: 20,
			},
			{
				header: 'Sender Name',
				key: 'name',
				width: 30,
			},
			{
				header: 'Recipient Name',
				key: 'recipientName',
				width: 30,
			},
			{
				header: 'Quantity',
				key: 'qty',
				width: 15,
			},
			{
				header: 'Item Name',
				key: 'item',
				width: 30,
			},
			{
				header: 'Message on cake',
				key: 'message',
				width: 20,
			},
			{
				header: 'Candles',
				key: 'candles',
				width: 20,
			},
			{
				header: 'Cake Knife',
				key: 'knife',
				width: 20,
			},
			// {
			// 	header: 'Bundle',
			// 	key: 'bundle',
			// 	width: 20,
			// },
			{
				header: 'Gift message',
				key: 'giftTag',
				width: 20,
			},
			{
				header: 'Instruction to team',
				key: 'note',
				width: 40,
			},
			{
				header: 'Tags',
				key: 'tags',
				width: 20,
			},
			{
				header: 'Internal remark',
				key: 'remark',
				width: 20,
			},
			{
				header: 'Order status',
				key: 'status',
				width: 20,
			},
		] as ExcelJS.Column[];
	}
}
