import {
	ValidatorConstraintInterface,
	ValidatorConstraint,
	ValidationArguments,
	ValidationOptions,
	registerDecorator,
} from 'class-validator';
import * as moment from 'moment';

@ValidatorConstraint()
export class IsDateConstraint implements ValidatorConstraintInterface {
	validate(value: string, args: ValidationArguments): boolean {
		if (!value) return false;

		if (typeof value === 'string' && value.length !== 10) return false;

		return moment(value, 'YYYY-MM-DD').isValid();
	}

	defaultMessage(args: ValidationArguments) {
		return '$property must be YYYY-MM-DD format';
	}
}

export function IsDate(validationOptions?: ValidationOptions) {
	return function(object: Record<string, any>, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName,
			options: validationOptions,
			constraints: [],
			validator: IsDateConstraint,
		});
	};
}
