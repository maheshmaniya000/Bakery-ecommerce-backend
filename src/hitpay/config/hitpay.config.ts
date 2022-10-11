import { registerAs } from '@nestjs/config';

export default registerAs('hitpay', () => ({
	apiKey: process.env.HITPAY_API_KEY,
	salt: process.env.HITPAY_SALT,
	url: process.env.HITPAY_URL,
	redirectUrl: process.env.HITPAY_REDIRECT_URL,
	webhookUrl: process.env.HITPAY_WEBHOOK_URL,
}));
