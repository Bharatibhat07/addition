"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  if (status === "loading") return null;
  if (!session) return <button className="text-sm" onClick={() => signIn()}>Login</button>;
  return <button className="text-sm" onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>;
}

