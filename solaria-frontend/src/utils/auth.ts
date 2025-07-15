import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            async authorize(credentials) {
                console.log("Received credentials:", credentials);

                const adminEmail = process.env.ADMIN_EMAIL;
                const adminPassword = process.env.ADMIN_PASSWORD;

                // // Add this debugging
                // console.log("Expected email:", adminEmail);
                // console.log("Expected password:", adminPassword);
                // console.log("Received email:", credentials?.email);
                // console.log("Received password:", credentials?.password);

                if (!credentials?.email || !credentials?.password) {
                    console.log("Missing credentials");
                    return null;
                }

                if (!adminEmail || !adminPassword) {
                    console.log("Missing environment variables");
                    return null;
                }

                if (
                    credentials.email !== adminEmail ||
                    credentials.password !== adminPassword
                ) {
                    console.log("Credentials don't match");
                    return null;
                }

                console.log("Authorization successful");
                return {
                    id: "admin",
                    email: adminEmail,
                };
            }
        }),
    ],
});
