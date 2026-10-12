import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export function Hero() {
    return (<section className="relative px-4 pt-14 pb-12 text-center sm:px-6 sm:pt-20 sm:pb-16 lg:pt-24">
        <div className="mx-auto max-w-4xl">
            {/* Headline (Balanced across 2 lines) */}
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl leading-[1.12]">
                Turn static forms into
                <span className="block text-foreground">natural conversations.</span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Build smart forms in seconds with plain English prompts. Let respondents
                answer conversationally or classically, and collect clean, structured data.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" asChild className="h-11 px-6 font-medium">
                    <Link href="/sign-up">
                        Start building free
                        <ArrowRight className="ml-2 size-4" />
                    </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="h-11 px-6 font-medium">
                    <a href="#how-it-works">See how it works</a>
                </Button>
            </div>

            {/* Micro-feature checklist */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    Prompt-to-form AI
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    Conversational filling
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    Instant CSV &amp; Excel export
                </span>
            </div>

            {/* Interactive Hero Demo Component */}
        </div>
    </section>)
}