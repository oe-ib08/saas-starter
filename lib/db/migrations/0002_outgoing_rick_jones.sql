-- Clean up legacy data before migration
DELETE FROM activity_logs;
DELETE FROM invitations;  
DELETE FROM team_members;
DELETE FROM teams;

-- Now proceed with the actual migration
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "invited_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "role" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_better_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."better_auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_better_auth_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."better_auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_better_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."better_auth_user"("id") ON DELETE no action ON UPDATE no action;