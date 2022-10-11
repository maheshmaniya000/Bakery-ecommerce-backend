import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';
import { useContainer } from 'class-validator';
import * as helmet from 'helmet';

import { BasicAuth } from './types/basic-auth.interface';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bodyParser: false,
	});
	const configService = app.get(ConfigService);
	const version = configService.get<string>('version');
	const basicAuthInfo = configService.get<BasicAuth>('basicAuth');
	const docsPath = '/' + version + '/docs';

	if (process.env.NODE_ENV === 'staging') {
		app.enableCors({
			origin: [
				'https://staging.olsenbakehouse.com',
				'https://staging-cms.olsenbakehouse.com',
			],
		});
	} else if (process.env.NODE_ENV === 'production') {
		app.enableCors({
			origin: [
				'https://v2.olsenbakehouse.com',
				'https://www.olsenbakehouse.com',
				'https://olsenbakehouse.com',
				'https://cms.olsenbakehouse.com',
			],
		});

		app.use(helmet());
	} else {
		app.enableCors();
	}

	app.setGlobalPrefix(version + '/api');

	// for Custom Validation Class (Injectable)
	useContainer(app.select(AppModule), { fallbackOnErrors: true });
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
		}),
	);

	app.use(
		docsPath,
		basicAuth({
			challenge: true,
			users: {
				[basicAuthInfo.username]: basicAuthInfo.password,
			},
		}),
	);

	const options = new DocumentBuilder()
		.setTitle('Olsen bake house')
		.setVersion('1.0')
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup(docsPath, app, document);

	await app.listen(configService.get<number>('port'));
}
bootstrap();
