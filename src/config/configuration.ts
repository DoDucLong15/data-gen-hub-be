export const configuration = () => ({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) || 8080 : 8080,
  database: {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    db: process.env.POSTGRES_DB,
    ssl_ca_file: process.env.POSTGRES_CA_FILE ?? '',
  },
  mailer: {
    googleMailerUser: process.env.GOOGLE_MAILER_USER,
    googleOauthClientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    googleOauthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    googleMailerRefreshToken: process.env.GOOGLE_MAILER_REFRESH_TOKEN,
    googleMailerAccessToken: process.env.GOOGLE_MAILER_ACCESS_TOKEN,
  },
  auth: {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  },
});
