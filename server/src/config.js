try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch {}

export const config = {
  port: Number(process.env.PORT) || 3001,

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME || 'huonght',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE || 'mentor_game',
  },
  testDatabase: process.env.DB_TEST_DATABASE || 'mentor_game_test',
  defaultPageSize: 10,
  maxPageSize: 100,
};
