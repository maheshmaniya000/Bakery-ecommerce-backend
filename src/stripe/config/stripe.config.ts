import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
	secertKey: process.env.STRIPE_SECRET_KEY,
	endpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
}));
