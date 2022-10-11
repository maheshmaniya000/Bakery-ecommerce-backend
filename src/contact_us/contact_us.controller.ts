import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { ContactUsService } from './contact_us.service';

import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { GetContactUsQueryDto } from './dto/get-contact-us.query.dto';

import { AdminGuard } from '../common/guards/AdminGuard';

@Controller('contact-us')
export class ContactUsController {
	constructor(private contactUsService: ContactUsService) {}

	@Get('')
	@UseGuards(AdminGuard)
	async getList(@Query() query: GetContactUsQueryDto) {
		return this.contactUsService.getList(query);
	}

	@Post('')
	async create(@Body() payload: CreateContactUsDto) {
		return this.contactUsService.create(payload);
	}
}
