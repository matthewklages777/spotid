// dotenv is intentionally not imported here — Railway injects env vars directly.
// For local dev, Next.js / the shell already loads .env before this runs.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
