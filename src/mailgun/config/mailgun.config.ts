import { registerAs } from '@nestjs/config';

export default registerAs('MAILGUN', () => ({
	apiKey: process.env.MAILGUN_API_KEY,
	publicKey: process.env.MAILGUN_PUBLIC_KEY,
}));
