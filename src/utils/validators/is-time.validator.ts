import {
	ValidatorConstraintInterface,
	ValidatorConstraint,
	ValidationArguments,
	ValidationOptions,
	registerDecorator,
} from 'class-validator';
import * as moment from 'moment';

@ValidatorConstraint()
export class IsTimeConstraint implements ValidatorConstraintInterface {
	validate(value: string, args: ValidationArguments): boolean {
		if (!value) return false;

		if (typeof value === 'string' && value.length !== 5) return false;

		return moment(value, 'HH:mm').isValid();
	}

	defaultMessage(args: ValidationArguments) {
		return '$property must be HH:mm format';
	}
}

export function IsTime(validationOptions?: ValidationOptions) {
	return function(object: Record<string, any>, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName,
			options: validationOptions,
			constraints: [],
			validator: IsTimeConstraint,
		});
	};
}
