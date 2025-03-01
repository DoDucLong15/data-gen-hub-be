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
});
