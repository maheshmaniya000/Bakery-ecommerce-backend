import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/common/guards/AdminGuard';

import { ContentsService } from './contents.service';

import { UpdateHomeCarouselDto } from './dto/update-home-carousel.dto';

@ApiTags('Contents')
@Controller('contents')
export class ContentsController {
	constructor(private readonly contentsService: ContentsService) {}

	@Get('')
	@ApiBearerAuth()
	async getList() {
		return this.contentsService.getList();
	}

	@Get('home_carousel')
	async getHomeCarousel() {
		const content = await this.contentsService.getOne();

		return content.homeCarousel;
	}

	@Get('featured_on')
	async getFeaturedOn() {
		const content = await this.contentsService.getOne();

		return content.featuredOn;
	}

	@Get('our_clients')
	async getOurClients() {
		const content = await this.contentsService.getOne();

		return content.ourClients;
	}

	@Get('refund_policy')
	async getRefundPolicy() {
		const content = await this.contentsService.getOne();

		return content.refundPolicy;
	}

	@Get('privacy_policy')
	async getPrivacyPolicy() {
		const content = await this.contentsService.getOne();

		return content.privacyPolicy;
	}

	@Get('tnc')
	async getTNC() {
		const content = await this.contentsService.getOne();

		return content.tnc;
	}

	@Get('faq')
	async getFAQ() {
		const content = await this.contentsService.getOne();

		return content.faq;
	}

	@Get('faq_cakecare')
	async getFAQCakecare() {
		const content = await this.contentsService.getOne();

		return content.faqCakecare;
	}

	@Get('about_us')
	async getAboutUs() {
		const content = await this.contentsService.getOne();

		return content.aboutUs;
	}

	@Get('our_story')
	async getOurStory() {
		const content = await this.contentsService.getOne();

		return content.ourStory;
	}

	@ApiBearerAuth()
	@Put('home_carousel')
	@UseGuards(AdminGuard)
	async updateHomeCarousel(@Body() { images }: UpdateHomeCarouselDto) {
		return this.contentsService.updateHomeCarousel(images);
	}

	@ApiBearerAuth()
	@Put('featured_on')
	@UseGuards(AdminGuard)
	async updateFeaturedOn(@Body() { data }) {
		return this.contentsService.updateFeaturedOn(data);
	}

	@ApiBearerAuth()
	@Put('our_clients')
	@UseGuards(AdminGuard)
	async updateOurClients(@Body() { data }) {
		return this.contentsService.updateOurClients(data);
	}

	@ApiBearerAuth()
	@Put('refund_policy')
	@UseGuards(AdminGuard)
	async updateRefundPolicy(@Body() { data }) {
		return this.contentsService.updateRefundPolicy(data);
	}

	@ApiBearerAuth()
	@Put('privacy_policy')
	@UseGuards(AdminGuard)
	async updatePrivacyPolicy(@Body() { data }) {
		return this.contentsService.updatePrivacyPolicy(data);
	}

	@ApiBearerAuth()
	@Put('tnc')
	@UseGuards(AdminGuard)
	async updateTNC(@Body() { data }) {
		return this.contentsService.updateTNC(data);
	}

	@ApiBearerAuth()
	@Put('faq')
	@UseGuards(AdminGuard)
	async updateFAQ(@Body() { data }) {
		return this.contentsService.updateFAQ(data);
	}

	@ApiBearerAuth()
	@Put('faq_cakecare')
	@UseGuards(AdminGuard)
	async updateFAQCakecare(@Body() { data }) {
		return this.contentsService.updateFAQCakecare(data);
	}

	@ApiBearerAuth()
	@Put('about_us')
	@UseGuards(AdminGuard)
	async updateAboutUs(@Body() { data }) {
		return this.contentsService.updateAboutUs(data);
	}

	@ApiBearerAuth()
	@Put('our_story')
	@UseGuards(AdminGuard)
	async updateOurStory(@Body() { data }) {
		return this.contentsService.updateOurStory(data);
	}
}
