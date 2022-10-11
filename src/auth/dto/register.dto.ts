import { AccountType, Provider } from '../../accounts/constants';

export class RegisterDto {
	readonly email: string;
	readonly password?: string;
	readonly otp?: string;
	readonly type: AccountType;
	readonly provider: Provider;
	readonly providerId?: string;
	readonly providerData?: any;
}
