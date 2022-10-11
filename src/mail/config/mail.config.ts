import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
	host: process.env.MAIL_HOST,
	port: process.env.MAIL_PORT || 465,
	username: process.env.MAIL_USERNAME,
	password: process.env.MAIL_PASSWORD,
	from: process.env.MAIL_FROM,
	secure: process.env.MAIL_SECURE,
	replyTo: process.env.MAIL_REPLYTO
}));
