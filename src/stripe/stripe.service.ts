import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Request } from 'express';

import { GetPaymentIntentParams } from './types';

@Injectable()
export class StripeService {
	private stripe: Stripe = null;

	constructor(private readonly configService: ConfigService) {
		this.stripe = new Stripe(
			this.configService.get<string>('stripe.secertKey'),
			{
				apiVersion: '2020-08-27',
				typescript: true,
			},
		);
	}

	// Retrieve the event by verifying the signature using the raw body and secret.
	async getEvent(req: Request): Promise<Stripe.Event> {
		try {
			const event = this.stripe.webhooks.constructEvent(
				// eslint-disable-next-line
				// @ts-ignore
				req.body,
				req.headers['stripe-signature'],
				this.configService.get<string>('stripe.endpointSecret'),
			);

			return event;
		} catch (err) {
			console.log(err.message, 'stripe.getEvent');
			throw new BadRequestException(err);
		}
	}

	async getPaymentIntent({
		order,
		amount,
	}: GetPaymentIntentParams): Promise<Stripe.PaymentIntent> {
		const params: Stripe.PaymentIntentCreateParams = {
			amount: parseInt(Number(amount * 100).toFixed(0), 10),
			currency: 'SGD',
			description: 'For Online Bakehouse order',
			metadata: {
				orderId: order._id.toString(),
			},
		};

		return this.stripe.paymentIntents.create(params);
	}

	async createRefund(amount = 0, intentId = ''): Promise<void> {
		try {
			await this.stripe.refunds.create({
				amount: parseInt(Number(amount * 100).toFixed(0), 10),
				payment_intent: intentId,
			});
		} catch (err) {
			throw new Error(err);
		}
	}

	async retrievePaymentIntent(intentId: string) {
		return this.stripe.paymentIntents.retrieve(intentId);
	}

	async getBalanceTransaction(
		id: string,
	): Promise<Stripe.BalanceTransaction> {
		return this.stripe.balanceTransactions.retrieve(id);
	}
}
