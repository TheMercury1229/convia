import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-background pt-16 pb-12 text-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5 md:gap-8">
          {/* Brand & Descriptor (2 cols) */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.svg"
                alt="Convia"
                width={110}
                height={30}
                className="h-6 w-auto dark:hidden"
              />
              <Image
                src="/logo-white.svg"
                alt="Convia"
                width={110}
                height={30}
                className="hidden h-6 w-auto dark:block"
              />
            </Link>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
              The conversational form engine. Build schemas in seconds with AI, share dual-experience links, and collect clean, structured data.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Product
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground sm:text-sm">
              <li>
                <a href="#features" className="transition-colors hover:text-foreground">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="transition-colors hover:text-foreground">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faq" className="transition-colors hover:text-foreground">
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/templates" className="transition-colors hover:text-foreground">
                  Templates
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Account
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground sm:text-sm">
              <li>
                <Link href="/sign-in" className="transition-colors hover:text-foreground">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="transition-colors hover:text-foreground">
                  Get started
                </Link>
              </li>
              <li>
                <Link href="/home" className="transition-colors hover:text-foreground">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground sm:text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar without secondary line separator */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Convia. All rights reserved.</p>

          <p className="flex items-center gap-1.5">
            Made with <Heart className="size-3.5 fill-red-500 text-red-500 inline shrink-0" /> by{" "}
            <a
              href="https://github.com/TheMercury1229"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4 decoration-border transition-colors hover:text-primary hover:decoration-primary"
            >
              Mercury
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
