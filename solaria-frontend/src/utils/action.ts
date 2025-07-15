import { signIn } from "./auth"

export interface Credentials {
    // Define the shape of credentials, e.g.:
    email: string;
    password: string;
}

export const handleLogin = async (credentials: Credentials) => {
    await signIn("credentials", { credentials });
};