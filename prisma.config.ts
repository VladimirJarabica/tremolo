import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "be/db/schema.prisma",
  migrations: {
    path: "be/db/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
