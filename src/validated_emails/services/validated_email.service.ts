import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateValidatedEmailDto } from '../dto/create-validated-email.dto';

import {
	ValidatedEmail,
	ValidatedEmailDocument,
} from '../schemas/validated_email.schema';

@Injectable()
export class ValidatedEmailService {
	constructor(
		@InjectModel(ValidatedEmail.name)
		private validatedEmailModel: Model<ValidatedEmailDocument>,
	) {}

	create(payload: CreateValidatedEmailDto): Promise<ValidatedEmailDocument> {
		const validated = new this.validatedEmailModel(payload);

		return validated.save();
	}

	findByEmail(email: string) {
		return this.validatedEmailModel.findOne({ email });
	}
}
