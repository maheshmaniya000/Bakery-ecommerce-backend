import {
	Body,
	Controller,
	Delete,
	Get,
	Post,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
	HealthCheck,
	HealthCheckService,
	MongooseHealthIndicator,
} from '@nestjs/terminus';

import { AppService } from './app.service';
import { AWSService } from './aws/aws.service';
import { AdminGuard } from './common/guards/AdminGuard';
import { ImageOptions } from './utils/misc';

@Controller()
@ApiTags('General')
export class AppController {
	constructor(
		private health: HealthCheckService,
		private database: MongooseHealthIndicator,
		private readonly awsService: AWSService,
		private readonly appService: AppService,
	) {}

	@Get('health')
	@HealthCheck()
	check() {
		return this.health.check([() => this.database.pingCheck('database')]);
	}

	@Get('dashboard')
	@UseGuards(AdminGuard)
	async getDashboard() {
		return this.appService.getInfoForDashboard();
	}

	@Post('images_upload')
	@UseGuards(AuthGuard('jwt'))
	@ApiConsumes('multipart/form-data')
	@UseInterceptors(FilesInterceptor('images', 10, ImageOptions))
	async uploadImages(@UploadedFiles() images) {
		return this.awsService.uploadToS3(images);
	}

	@Delete('images_remove')
	@UseGuards(AuthGuard('jwt'))
	async removeImages(@Body('images') images: string[]) {
		for (let index = 0; index < images.length; index++) {
			await this.awsService.removeFromS3(images[index]);
		}

		return 'success';
	}
}
