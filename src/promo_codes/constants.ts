// export type PromoCodeType = {
// 	PERCENTAGE: 'PERCENTAGE';
// 	ABSOLUTE: 'ABSOLUTE';
// };

import { Customer } from 'src/customers/schemas/customer.schema';

export enum PromoCodeType {
	PERCENTAGE = 'PERCENTAGE',
	ABSOLUTE = 'ABSOLUTE',
}

// export const PromoCodeType: TypePromoCodeType = {
// 	PERCENTAGE: 'PERCENTAGE',
// 	ABSOLUTE: 'ABSOLUTE',
// };

export type Code = {
	code: string;
	used: boolean;
	customer?: string | Customer;
};
