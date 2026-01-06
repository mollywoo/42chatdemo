# AI Assistant Project Documentation

This file contains references and guidelines for AI assistants working on this project.

## Project Overview

This is an AI-native project template based on the 42COG (Cognitive Agile) methodology, configured with:
- **Database**: Neon PostgreSQL 17.7
- **ORM**: Drizzle ORM
- **Package Manager**: npm (can be switched to Bun)
- **Development Branch**: dev (branch ID: br-solitary-wildflower-ae3bq5sh)
- **Project ID**: little-recipe-00698160

## Database Configuration

The project uses Neon database with Drizzle ORM. Database connection details are stored in `.env` file (not committed to git).

**Key files:**
- `drizzle.config.ts` - Drizzle configuration
- `src/db/index.ts` - Database connection export
- `src/db/schema.ts` - Database schema definitions
- `src/db/migrations/` - Migration files (when generated)

**Available scripts:**
- `npm run db:generate` - Generate migrations from schema changes
- `npm run db:migrate` - Apply pending migrations
- `npm run db:push` - Push schema directly to database (development)
- `npm run db:studio` - Open Drizzle Studio

## Resources & References

- **Neon + Drizzle ORM best practices**: https://raw.githubusercontent.com/neondatabase-labs/ai-rules/main/neon-drizzle.mdc
- **Serverless connection patterns**: https://raw.githubusercontent.com/neondatabase-labs/ai-rules/main/neon-serverless.mdc
