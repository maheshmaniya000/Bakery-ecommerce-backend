import { AccountType, Provider } from '../constants';

export interface findByEmailParams {
	readonly email: string;
	readonly accountType?: AccountType;
	readonly provider?: Provider;
}

export interface findByProviderIdParams {
	readonly providerId: string;
	readonly provider?: Provider;
	readonly accountType?: AccountType;
}
