"use client";

import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import Image from "next/image";

interface AuthFormProps {
  type: "signin" | "signup";
}

export function AuthForm({ type }: AuthFormProps) {
  const isSignUp = type === "signup";
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left side - Form */}
      <div className="flex w-full flex-col items-center justify-center p-8 md:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to MediCare
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isSignUp 
                ? "Create your account to get started"
                : "Sign in to access your account"}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
                <LabelInputContainer>
                  <Label htmlFor="firstname">First name</Label>
                  <Input id="firstname" placeholder="John" type="text" />
                </LabelInputContainer>
                <LabelInputContainer>
                  <Label htmlFor="lastname">Last name</Label>
                  <Input id="lastname" placeholder="Doe" type="text" />
                </LabelInputContainer>
              </div>
            )}

            <LabelInputContainer>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="your.email@example.com"
                type="email"
                required
              />
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                required
                minLength={8}
              />
            </LabelInputContainer>

            {isSignUp && (
              <LabelInputContainer>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  placeholder="••••••••"
                  type="password"
                  required
                  minLength={8}
                />
              </LabelInputContainer>
            )}

            <div className="pt-2">
              <button
                className="group/btn relative flex h-10 w-full items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 font-medium text-white shadow-md transition-all hover:shadow-lg"
                type="submit"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
                <BottomGradient />
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <IconBrandGoogle className="mr-2 h-4 w-4" />
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <IconBrandGithub className="mr-2 h-4 w-4" />
                GitHub
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <a
                  href="/signin"
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Sign in
                </a>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Sign up
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="relative hidden h-full w-1/2 md:block">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-500/20" />
        <div className="relative flex h-full items-center justify-center p-12">
          <div className="relative h-4/5 w-full overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src="/images/auth-bg.jpg"
              alt="Healthcare professionals"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h2 className="mb-2 text-3xl font-bold">MediCare</h2>
              <p className="text-blue-100">
                Your trusted partner in healthcare management and patient care.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("w-full flex-1 space-y-2", className)}>
      {children}
    </div>
  );
};
