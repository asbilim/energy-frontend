"use client";

import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <AuthForm type="signup" />
      </div>
    </div>
  );
}
