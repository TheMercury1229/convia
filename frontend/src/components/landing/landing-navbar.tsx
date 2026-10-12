"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/dashboard/mode-toggle";
import { authClient } from "@/lib/auth-client";

export function LandingNavbar() {
  const { data: session } = authClient.useSession();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Convia"
            width={120}
            height={32}
            className="h-6 w-auto dark:hidden"
            priority
          />
          <Image
            src="/logo-white.svg"
            alt="Convia"
            width={120}
            height={32}
            className="hidden h-6 w-auto dark:block"
            priority
          />
        </Link>

        {/* Minimal Nav links */}
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a
            href="#features"
            className="transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#faq"
            className="transition-colors hover:text-foreground"
          >
            FAQ
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ModeToggle />
          {session?.user ? (
            <Button size="sm" asChild className="text-sm font-medium">
              <Link href="/home">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-sm font-medium">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="text-sm font-medium">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
