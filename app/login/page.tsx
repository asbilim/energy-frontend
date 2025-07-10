"use client";

import { useEffect, useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error=access_denied")) {
      const params = new URLSearchParams(hash.substring(1)); // remove #
      const errorDescription = params.get("error_description");
      setError(
        errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
          : "Une erreur s'est produite lors de l'authentification."
      );
      // Clean the URL
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AuthForm type="login" />
      </div>
    </div>
  );
}
