import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '../common/guards/AdminGuard';

import { CustomersService } from './customers.service';

import { GetCustomersQueryDto } from './dto/get-customers-query.dto';
import { RegisterCustomerPayloadDto } from './dto/register-customer-payload.dto';
import { ParamDto } from '../utils/dto/param.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
	constructor(private readonly customersService: CustomersService) {}

	@Get('')
	@UseGuards(AdminGuard)
	async getList(@Query() query: GetCustomersQueryDto) {
		return this.customersService.getList(query);
	}

	@Post('')
	@UseGuards(AdminGuard)
	async create(@Body() payload: CreateCustomerDto) {
		return this.customersService.create(payload);
	}

	@Post('register')
	async register(@Body() payload: RegisterCustomerPayloadDto) {
		return this.customersService.register(payload);
	}

	@Get('tags')
	@UseGuards(AdminGuard)
	async getTags() {
		return this.customersService.getTags();
	}

	@Get(':id')
	@UseGuards(AdminGuard)
	getDetail(@Param() { id }: ParamDto) {
		return this.customersService.getDetail(id);
	}

	@Put(':id')
	@UseGuards(AdminGuard)
	update(@Param() { id }: ParamDto, @Body() payload: UpdateCustomerDto) {
		return this.customersService.update(id, payload);
	}

	@ApiBearerAuth()
	@Put(':id/status')
	@UseGuards(AdminGuard)
	updateStatus(@Param() { id }: ParamDto, @Body('status') status: boolean) {
		return this.customersService.updateStatus(id, status);
	}

	@UseGuards(AdminGuard)
	@HttpCode(HttpStatus.OK)
	@Post(':id/reset_password')
	sendResetPassword(@Param() { id }: ParamDto) {
		return this.customersService.sendResetPasswordEmail(id);
	}

	@Delete(':id')
	@UseGuards(AdminGuard)
	delete(@Param() { id }: ParamDto) {
		return this.customersService.destroy(id);
	}
}
