import {
	Controller,
	Get,
	Post,
	Body,
	Query,
	Param,
	Put,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
	UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

import { ArticlesService } from './articles.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticlesQueryDto } from './dto/articles-query.dto';
import { ParamDto } from 'src/utils/dto/param.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ImageOptions } from '../utils/misc';
import { AdminGuard } from 'src/common/guards/AdminGuard';
import { Status } from './constants';
import { AWSService } from 'src/aws/aws.service';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
	constructor(
		private readonly articlesService: ArticlesService,
		private readonly configService: ConfigService,
		private awsService: AWSService,
	) {}

	@Get('')
	async getList(@Query() query: ArticlesQueryDto) {
		return await this.articlesService.getList(
			query.search,
			query.category,
			query.feature,
			query.status,
			{
				page: query.page || 1,
				limit: query.limit || 10,
			},
		);
	}

	@Post('images')
	@UseInterceptors(FileInterceptor('file', ImageOptions))
	async uploadImage(@UploadedFile() image) {
		if (!image) {
			throw new BadRequestException(
				'Invalid file type. Only accept jpg and png file.',
			);
		}

		const paths = await this.awsService.uploadToS3([image]);

		return {
			location: paths[0],
		};
	}

	@UseGuards(AdminGuard)
	@Post('')
	async create(@Body() createBlogDto: CreateArticleDto) {
		return await this.articlesService.create(createBlogDto);
	}

	@Get('slug/:slug')
	async getDetailBySlug(@Param() params) {
		return await this.articlesService.findBySlug(params.slug);
	}

	@Get('categories')
	@UseGuards(AdminGuard)
	async getCategories() {
		return this.articlesService.getCategories();
	}

	@Put(':id/status')
	async updateStatus(
		@Param() { id }: ParamDto,
		@Body('status') status: Status,
	) {
		return this.articlesService.updateStatus(id, status);
	}

	@Get(':id')
	async getDetail(@Param() params: ParamDto) {
		return await this.articlesService.getDetail(params.id);
	}

	@UseGuards(AdminGuard)
	@Put(':id')
	async update(
		@Param() params: ParamDto,
		@Body() updateArticleDto: UpdateArticleDto,
	) {
		return await this.articlesService.update(params.id, updateArticleDto);
	}
}
