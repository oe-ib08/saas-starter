import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db/drizzle";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        }
    }),
    baseURL: process.env.BETTER_AUTH_URL || process.env.BASE_URL || "http://localhost:3000",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        autoSignInAfterVerification: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days default
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            maxAge: 60 * 60 * 24 * 30, // 30 days for remember me
        }
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            redirectURI: process.env.BETTER_AUTH_URL ? `${process.env.BETTER_AUTH_URL}/api/auth/callback/google` : "http://localhost:3000/api/auth/callback/google",
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
            enabled: !!process.env.GITHUB_CLIENT_ID,
            redirectURI: process.env.BETTER_AUTH_URL ? `${process.env.BETTER_AUTH_URL}/api/auth/callback/github` : "http://localhost:3000/api/auth/callback/github",
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "member",
            }
        }
    },
    advanced: {
        database: {
            generateId: () => {
                return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            }
        }
    },
    // Configure redirect after successful OAuth
    trustedOrigins: ["http://localhost:3000"],
});