"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import { signIn, signUp } from "@/lib/actions/auth.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthForm({ type }: { type: FormType }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignIn = type === "sign-in";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignIn) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const idToken = await userCredential.user.getIdToken();

        const result = await signIn({ email, idToken });
        if (result?.success === false) {
          setError(result.message);
          setLoading(false);
          return;
        }

        router.push("/");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name,
          email,
          password,
        });

        if (!result.success) {
          setError(result.message);
          setLoading(false);
          return;
        }

        toast.success("Account created successfully!");
        router.push("/sign-in");
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("A user already exists under the same email.");
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="card flex flex-col gap-6 px-10 py-14">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">Prepwise</h2>
        </div>

        <h3 className="text-center">
          {isSignIn
            ? "Sign in to your account"
            : "Create an account"}
        </h3>

        <form onSubmit={handleSubmit} className="form w-full space-y-6 mt-4">
          {!isSignIn && (
            <div className="space-y-2">
              <Label className="label">Name</Label>
              <Input
                className="input"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="label">Email</Label>
            <Input
              className="input"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="label">Password</Label>
            <Input
              className="input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-destructive-100 text-sm">{error}</p>}

          <Button className="btn w-full" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isSignIn
              ? "Sign In"
              : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm">
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="text-primary-200 font-semibold"
          >
            {isSignIn ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
