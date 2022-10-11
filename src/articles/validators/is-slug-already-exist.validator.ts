import {
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationOptions,
	registerDecorator,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

import { ArticlesService } from '../articles.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsSlugAlreadyExistConstraint
	implements ValidatorConstraintInterface {
	constructor(private readonly articlesService: ArticlesService) {}

	async validate(value: string): Promise<boolean> {
		if (!value) return true;

		const [slug, id] = value.split('|');

		const article = await this.articlesService.findBySlug(slug);

		if (article) {
			if (article._id.toString() !== id) return false;
		}

		return true;
	}

	defaultMessage(): string {
		return '$value had already exist';
	}
}

export function IsSlugAlreadyExist(validationOptions?: ValidationOptions) {
	return function (object: Record<string, any>, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			constraints: [],
			validator: IsSlugAlreadyExistConstraint,
		});
	};
}
