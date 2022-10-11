import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GetCategoriesQueryDto } from './dto/get-categories-query.dto';
import { ParamDto } from '../utils/dto/param.dto';

import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
	constructor(private readonly categoriesService: CategoriesService) {}

	@Get('')
	async getList(
		@Query() { page = 1, limit = 10, status }: GetCategoriesQueryDto,
	) {
		return this.categoriesService.getList({ status }, { page, limit });
	}

	@Post('')
	@ApiBearerAuth()
	@UseGuards(AuthGuard('jwt'))
	async create(@Body() payload: CreateCategoryDto) {
		return this.categoriesService.create(payload);
	}

	@Put(':id')
	@ApiBearerAuth()
	@UseGuards(AuthGuard('jwt'))
	async update(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateCategoryDto,
	) {
		return this.categoriesService.update(id, payload);
	}

	@Get(':id')
	async getDetail(@Param() { id }: ParamDto) {
		return this.categoriesService.getDetail(id);
	}

	@Get(':slug/slug/products')
	async getProductsBySlug(
		@Param('slug') slug: string,
		@Query('sort') sort: string,
	) {
		return this.categoriesService.getProducts(slug, sort);
	}

	@Get(':slug/slug')
	async getDetailBySlug(@Param('slug') slug: string) {
		return this.categoriesService.getDetailBySlug(slug);
	}

	@Put(':id/status')
	@UseGuards(AuthGuard('jwt'))
	async updateStatus(
		@Param() { id }: ParamDto,
		@Body('status') status: boolean,
	) {
		return this.categoriesService.updateStatus(id, status);
	}
}
