"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SignInButtonProps {
  className?: string;
}

export function SignInButton({ className }: SignInButtonProps) {
  return (
    <Button
      asChild
      className={`bg-[#7fbfb0] text-black hover:bg-[#6fb3a2] dark:bg-[#8fd4c3] dark:hover:bg-[#7ccbb8] ${className ?? ""}`}
    >
      <Link href="/login">Sign In</Link>
    </Button>
  );
}
