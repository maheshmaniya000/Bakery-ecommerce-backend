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
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';

import { ParamDto } from 'src/utils/dto/param.dto';

import { CreateProductDto } from './dto/create/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { UpdateProductStocksDto } from './dto/update-product-stocks.dto';

import { ProductsService } from './products.service';
import { AdminGuard } from '../common/guards/AdminGuard';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Get('')
	getAll(
		@Query()
		query: GetProductsQueryDto,
	) {
		return this.productsService.getList(query);
	}

	@Post('')
	@UseGuards(AuthGuard('jwt'))
	create(@Body() payload: CreateProductDto) {
		return this.productsService.create(payload);
	}

	@Get('tags')
	@UseGuards(AdminGuard)
	getTags() {
		return this.productsService.getTags();
	}

	@Get(':id')
	getDetail(@Param() { id }: ParamDto) {
		return this.productsService.getDetail(id);
	}

	@Put(':id')
	@UseGuards(AuthGuard('jwt'))
	update(@Param() { id }: ParamDto, @Body() payload: UpdateProductDto) {
		return this.productsService.update(id, payload);
	}

	@Get(':id/stocks')
	@UseGuards(AuthGuard('jwt'))
	getStocks(@Param() { id }: ParamDto) {
		return this.productsService.getStocks(id);
	}

	@Get(':id/sold')
	@UseGuards(AdminGuard)
	getSold(@Param() { id }: ParamDto) {
		return this.productsService.getSold(id);
	}

	@Get(':id/ymal')
	getYMAL(@Param() { id }: ParamDto) {
		return this.productsService.getYMALByProductId(id);
	}

	@Get(':slug/slug')
	async getDetailBySlug(@Param('slug') slug: string) {
		return this.productsService.getDetailBySlug(slug);
	}

	@Post(':id/duplicate')
	@UseGuards(AdminGuard)
	async duplicate(@Param() { id }: ParamDto) {
		return this.productsService.duplicate(id);
	}

	@Put(':id/fixed_stocks')
	@UseGuards(AdminGuard)
	updateFixedStocks(
		@Param() { id }: ParamDto,
		@Body() { stock, fixedStockStartDate, variantId },
	) {
		return this.productsService.updateFixedStocks(id, {
			stock,
			fixedStockStartDate,
			variantId,
		});
	}

	@Put(':id/stocks')
	@UseGuards(AuthGuard('jwt'))
	updateStocks(
		@Param() { id }: ParamDto,
		@Body('stocks') stocks: UpdateProductStocksDto[],
	) {
		return this.productsService.updateStocks(id, stocks);
	}

	@Put(':id/status')
	@UseGuards(AuthGuard('jwt'))
	updateStatus(@Param() { id }: ParamDto, @Body('status') status: boolean) {
		return this.productsService.updateStatus(id, status);
	}
}
