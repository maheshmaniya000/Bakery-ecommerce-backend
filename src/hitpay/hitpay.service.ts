import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { stringify } from 'qs';
import { AxiosResponse } from 'axios';
import { createHmac } from 'crypto';

import { Order } from '../orders/schemas/order.schema';
import { HitpayRequest } from './types';

@Injectable()
export class HitpayService {
	constructor(
		private httpService: HttpService,
		private configService: ConfigService,
	) {}

	async createRequest(
		order: Order,
		amount: number,
	): Promise<AxiosResponse<HitpayRequest>> {
		const { url, apiKey, redirectUrl, webhookUrl } = this.configService.get(
			'hitpay',
		);

		return this.httpService
			.post<HitpayRequest>(
				`${url}payment-requests`,
				stringify({
					amount: Number(amount).toFixed(2),
					currency: 'SGD',
					email: order.customer.email,
					name:
						order.customer.firstName +
						' ' +
						order.customer.lastName,
					purpose: 'For Online bakehouse order',
					reference_number: order._id.toString(),
					redirect_url: `${redirectUrl}checkout/${order._id}?success=true`,
					webhook: webhookUrl,
				}),
				{
					headers: {
						'X-BUSINESS-API-KEY': apiKey,
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				},
			)
			.toPromise();
	}

	async getRequest(id: string): Promise<AxiosResponse<any>> {
		const { url, apiKey } = this.configService.get('hitpay');

		return this.httpService
			.get<HitpayRequest>(`${url}payment-requests/${id}`, {
				headers: {
					'X-BUSINESS-API-KEY': apiKey,
				},
			})
			.toPromise();
	}

	async isValid({ hmac: encrypted, ...data }: any): Promise<boolean> {
		const salt = this.configService.get<string>('hitpay.salt');

		const hmac = createHmac('sha256', salt);
		const hmacSource = [];

		Object.keys(data)
			.sort()
			.forEach((key) => {
				hmacSource.push(`${key}${data[key]}`);
			});

		const payload = hmacSource.join('');

		const signed = hmac.update(Buffer.from(payload, 'utf-8')).digest('hex');

		return signed === encrypted;
	}
}
