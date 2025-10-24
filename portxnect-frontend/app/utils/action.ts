"use server";

import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";

interface AuthResponse {
    redirectUrl?: any;
    success: string | null;
    error: string | null;
}

type ActionFunction = (state: AuthResponse, formData: FormData) => Promise<AuthResponse>;

const signInWith = (provider: "google" | "github"): ActionFunction => async (state, formData) => {
    const supabase = await createClient();
    const auth_callback_url = `${process.env.SITE_URL}/auth/callback`;

    try {
        console.log(`Attempting OAuth sign-in with ${provider}`);
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: auth_callback_url,
            },
        });

        if (error) {
            console.error(`OAuth ${provider} error:`, error.message, error);
            return {
                success: null,
                error: `Failed to authenticate with ${provider}: ${error.message}`,
            };
        }

        console.log(`OAuth ${provider} success:`, data);
        if (data?.url) {
            return {
                success: "OAuth initiated",
                redirectUrl: data.url, // send it back
                error: null,
            };
        }

        return {
            success: `Successfully initiated ${provider} authentication`,
            error: null,
        };
    } catch (err) {
        console.error(`Unexpected error during ${provider} OAuth:`, err);
        return {
            success: null,
            error: `Unexpected error during ${provider} authentication`,
        };
    }
};

const signOut: ActionFunction = async (state, formData) => {
    const supabase = await createClient();
    try {
        console.log("Attempting sign out");
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Sign out error:", error.message, error);
            return {
                success: null,
                error: `Failed to sign out: ${error.message}`,
            };
        }
        console.log("Sign out successful");
        return {
            success: "Successfully signed out",
            error: null,
        };
    } catch (err) {
        console.error("Unexpected error during sign out:", err);
        return {
            success: null,
            error: "Unexpected error during sign out",
        };
    }
};

const signupWithEmailPassword: ActionFunction = async (state, formData) => {
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        console.error("Signup error: Email and password are required");
        return {
            success: null,
            error: "Email and password are required",
        };
    }

    try {
        console.log("Attempting signup with:", { email });
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${process.env.SITE_URL}/auth/callback`,
            },
        });

        if (error) {
            console.error("Signup error:", error.message, error);
            return {
                success: null,
                error: error.message || "Failed to create account",
            };
        }

        console.log("Signup success:", data);
        return {
            success: "Please check your email for confirmation",
            error: null,
        };
    } catch (err) {
        console.error("Unexpected error during signup:", err);
        return {
            success: null,
            error: "An unexpected error occurred during signup",
        };
    }
};

const signInWithEmailPassword: ActionFunction = async (state, formData) => {
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        console.error("Signin error: Email and password are required");
        return {
            success: null,
            error: "Email and password are required",
        };
    }

    try {
        console.log("Attempting signin with:", { email });
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Signin error:", error.message, error);
            return {
                success: null,
                error: error.message,
            };
        }

        console.log("Signin success:", data);

        return {
            success: "Logged In Successfully",
            error: null,
        };
    } catch (err) {
        console.error("Unexpected error during signin:", err);
        return {
            success: null,
            error: "An unexpected error occurred during signin",
        };
    }
};

const resetPassword: ActionFunction = async (state, formData) => {
    const supabase = await createClient();
    const email = formData.get("email") as string;

    if (!email) {
        console.error("Reset error: Email is required");
        return {
            success: null,
            error: "Email is required",
        };
    }

    try {
        console.log("Attempting password reset for:", { email });
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.SITE_URL}/auth/update-password`,
        });

        if (error) {
            console.error("Reset error:", error.message, error);
            return {
                success: null,
                error: error.message || "Failed to send password reset email",
            };
        }

        console.log("Password reset email sent successfully");
        return {
            success: "Password reset email sent successfully",
            error: null,
        };
    } catch (err) {
        console.error("Unexpected error during password reset:", err);
        return {
            success: null,
            error: "An unexpected error occurred during password reset",
        };
    }
};

const signInWithGoogle = signInWith("google");
const signInWithGithub = signInWith("github");

export { signInWithGoogle, signOut, signInWithGithub, signupWithEmailPassword, signInWithEmailPassword, resetPassword };