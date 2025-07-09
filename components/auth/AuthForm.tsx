"use client";

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
import Link from "next/link";
import { LockKeyhole, Mail } from "lucide-react";

export function AuthForm({ type }: { type: "login" | "signup" }) {
  const title = type === "login" ? "Welcome back" : "Create an account";
  const description =
    type === "login"
      ? "Enter your credentials to access your account"
      : "Enter your information to create an account";

  return (
    <Card className="mx-auto max-w-sm shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {title}
        </CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
            </div>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                className="pl-10"
                required
              />
            </div>
          </div>
          {type === "login" ? (
            <Button formAction={login} type="submit" className="w-full">
              Sign in
            </Button>
          ) : (
            <Button formAction={signup} type="submit" className="w-full">
              Create account
            </Button>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        {type === "login" ? (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        ) : (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
