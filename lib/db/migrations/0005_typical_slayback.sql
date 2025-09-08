ALTER TABLE "better_auth_user" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "better_auth_user" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "better_auth_user" ADD COLUMN "stripe_product_id" text;--> statement-breakpoint
ALTER TABLE "better_auth_user" ADD COLUMN "plan_name" varchar(50);--> statement-breakpoint
ALTER TABLE "better_auth_user" ADD COLUMN "subscription_status" varchar(20);--> statement-breakpoint
ALTER TABLE "better_auth_user" ADD CONSTRAINT "better_auth_user_stripe_customer_id_unique" UNIQUE("stripe_customer_id");--> statement-breakpoint
ALTER TABLE "better_auth_user" ADD CONSTRAINT "better_auth_user_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id");