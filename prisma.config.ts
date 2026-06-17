/// <reference types="node" />
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // CLI commands (migrate/introspect) use the direct/session connection;
    // fall back to DATABASE_URL when DIRECT_URL is not set.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});