"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  loginSchema,
  signupSchema,
  type LoginFormData,
  type SignupFormData,
} from "@/lib/schemas/auth";

export async function login(formData: LoginFormData) {
  try {
    // Validate the form data
    const validatedFields = loginSchema.safeParse(formData);

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors,
        data: null,
      };
    }

    const { email, password } = validatedFields.data;
    const supabase = await createClient();

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error: { form: error.message },
        data: null,
      };
    }

    return { error: null, data };
  } catch (error) {
    return {
      error: { form: "An unexpected error occurred" },
      data: null,
    };
  }
}

export async function signup(formData: SignupFormData) {
  try {
    // Validate the form data
    const validatedFields = signupSchema.safeParse(formData);

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors,
        data: null,
      };
    }

    const { email, password } = validatedFields.data;
    const origin = (await headers()).get("origin");
    const supabase = await createClient();

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        error: { form: error.message },
        data: null,
      };
    }

    return {
      error: null,
      data,
      message: "Check your email to confirm your account",
    };
  } catch (error) {
    return {
      error: { form: "An unexpected error occurred" },
      data: null,
    };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
}
