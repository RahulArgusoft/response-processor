// Prisma config for Prisma 7+
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Port 5436 for local Docker to avoid conflicts
    url: process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5436/response_processor?schema=public",
  },
});
