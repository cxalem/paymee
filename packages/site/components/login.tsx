"use client";

import { useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GoogleLogo from "@/components/icons/google-logo";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export function Login() {
  const { loading, initOAuth } = useLoginWithOAuth();
  const { user, createWallet, logout, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (user && user.wallet) {
      router.push("/dashboard");
    }
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!ready) {
    return <div>Loading...</div>;
  }

  const handleGoogleLogin = async () => {
    try {
      // The user will be redirected to OAuth provider's login page
      await initOAuth({ provider: "google" });
    } catch (err) {
      // Handle errors (network issues, validation errors, etc.)
      console.error(err);
    }
  };

  if (user && !user?.wallet) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Button onClick={() => createWallet()}>Create Wallet</Button>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Button onClick={() => logout()}>Logout</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-neutral-200">
        <CardHeader className="text-center space-y-4">
          <Link
            href="/"
            className="mx-auto w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center"
          >
            <span className="text-white font-bold text-xl">P</span>
          </Link>
          <div>
            <CardTitle className="text-2xl font-bold text-neutral-800">
              Welcome to PayMee Web3
            </CardTitle>
            <CardDescription className="text-neutral-600 mt-2">
              Sign in to access your Web3 payment dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-medium bg-transparent"
          >
            <GoogleLogo className="w-5 h-5 mr-3" />
            {loading ? "Logging in..." : "Continue with Google"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-neutral-600">
              By signing in, you agree to our{" "}
              <a
                href="#"
                className="text-neutral-800 hover:underline font-medium"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-neutral-800 hover:underline font-medium"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
