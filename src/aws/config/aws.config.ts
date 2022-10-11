import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_REGION,
	bucket: 'assets-Online-bake-house',
}));
