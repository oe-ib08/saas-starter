CREATE TABLE "better_auth_account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "better_auth_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "better_auth_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "better_auth_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "better_auth_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "better_auth_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "better_auth_account" ADD CONSTRAINT "better_auth_account_userId_better_auth_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."better_auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "better_auth_session" ADD CONSTRAINT "better_auth_session_userId_better_auth_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."better_auth_user"("id") ON DELETE no action ON UPDATE no action;