DROP INDEX "model_configs_model_id_idx";--> statement-breakpoint
DROP INDEX "session_token_idx";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "archived" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "model_configs" ALTER COLUMN "enabled" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "model_configs" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "prompt_templates" ALTER COLUMN "is_public" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "prompt_templates" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "model_configs_enabled_idx" ON "model_configs" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "prompt_templates_is_public_idx" ON "prompt_templates" USING btree ("is_public");--> statement-breakpoint
ALTER TABLE "model_configs" DROP COLUMN "base_url";