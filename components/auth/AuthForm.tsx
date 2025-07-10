"use client";

/* eslint-disable react/no-unescaped-entities */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "@/app/auth/actions";
import {
  loginSchema,
  signupSchema,
  type LoginFormData,
  type SignupFormData,
} from "@/lib/schemas/auth";
import Link from "next/link";
import { LockKeyhole, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function AuthForm({ type }: { type: "login" | "signup" }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const form = useForm<LoginFormData | SignupFormData>({
    resolver: zodResolver(type === "login" ? loginSchema : signupSchema),
    defaultValues:
      type === "login"
        ? { email: "", password: "" }
        : { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: LoginFormData | SignupFormData) => {
    setIsLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (type === "login") {
        const result = await login(data as LoginFormData);
        if (result.error) {
          if ("form" in result.error) {
            setFormError(result.error.form || "Échec de la connexion");
          } else {
            setFormError("Échec de la connexion");
          }
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        const result = await signup(data as SignupFormData);
        if (result.error) {
          if ("form" in result.error) {
            setFormError(result.error.form || "Échec de la création du compte");
          } else {
            setFormError("Échec de la création du compte");
          }
        } else {
          setFormSuccess(result.message || "Compte créé avec succès");
          form.reset();
        }
      }
    } catch (error) {
      setFormError("Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const title = type === "login" ? "Bon retour" : "Créer un compte";
  const description =
    type === "login"
      ? "Entrez vos identifiants pour accéder à votre compte"
      : "Entrez vos informations pour créer un compte";

  return (
    <Card className="mx-auto max-w-sm shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {title}
        </CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {formSuccess && (
          <Alert
            variant="success"
            className="mb-4 border-green-500 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{formSuccess}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        placeholder="nom@exemple.com"
                        className="pl-10"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="password"
                        className="pl-10"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === "signup" && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmez le mot de passe</FormLabel>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type="password"
                          className="pl-10"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {type === "login" ? "Connexion en cours..." : "Création du compte..."}
                </span>
              ) : (
                <>{type === "login" ? "Se connecter" : "Créer un compte"}</>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col">
        {type === "login" ? (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Vous n&apos;avez pas de compte ?{" "}
            <Link
              href="/signup"
              className="text-primary underline-offset-4 hover:underline">
              S'inscrire
            </Link>
          </p>
        ) : (
          // eslint-disable-next-line react/no-unescaped-entities
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline">
              Se connecter
            </Link>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
