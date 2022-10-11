import { CreateContactUsDto } from '../dto/create-contact-us.dto';

export class ContactUsRequestedEvent {
	constructor(private payload: CreateContactUsDto) {}

	getData(): CreateContactUsDto {
		return this.payload;
	}
}
