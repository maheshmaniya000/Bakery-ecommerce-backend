export default (): any => ({
	port: parseInt(process.env.PORT, 10) || 3000,
	version: process.env.API_VERSION || 'v1',
	websiteUrl: process.env.WEBSITE_URL,
	cmsUrl: process.env.CMS_URL,

	database: {
		uri: process.env.MONGODB_URI,
	},

	basicAuth: {
		username: process.env.BASIC_AUTH_USERNAME,
		password: process.env.BASIC_AUTH_PASSWORD,
	},

	jwt: {
		secret: process.env.JWT_SECRET,
		expiresIn: process.env.JWT_EXPIRES_IN,
	},
});
