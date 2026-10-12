"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "item-1",
    question: "How is Convia different from Typeform or Google Forms?",
    answer:
      "Convia delivers a dual-experience: respondents can either have an interactive conversation with an intelligent AI agent that clarifies questions and digs deeper, or switch to a clean traditional form view anytime. Regardless of how they respond, all data strictly conforms to your validated schema.",
  },
  {
    id: "item-2",
    question: "Can respondents answer however they like in conversational mode?",
    answer:
      "Yes. Respondents can reply using casual phrasing, voice-to-text, bullet points, or multiple sentences at once. Grizzy interprets the intent, extracts the necessary fields, and asks gentle follow-ups if mandatory details are missing.",
  },
  {
    id: "item-3",
    question: "How does the AI form builder work?",
    answer:
      "Simply describe what you need in plain English—for example, 'Customer onboarding questionnaire with company size, role, and pain points'. Grizzy instantly creates sections, selects suitable input types, and sets validation rules. You can also customize and reorder every question manually.",
  },
  {
    id: "item-4",
    question: "Where does the collected data go?",
    answer:
      "All responses are normalized and organized in your dashboard in real-time. You can analyze response trends, view completion drop-offs, inspect full conversational logs, and export everything directly to Excel (.xlsx) whenever you want.",
  },
  {
    id: "item-5",
    question: "Can I embed Convia forms on my own website or product?",
    answer:
      "Yes. You can share forms via a dedicated standalone link, embed them seamlessly in any web page using a responsive iframe, or integrate them into your web application.",
  },
  {
    id: "item-6",
    question: "Is there a free plan available?",
    answer:
      "Yes, you can get started completely free with no credit card required. The free tier lets you build conversational forms, collect live responses, and test AI generation right away.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Section Heading */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            FAQ
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Everything you need to know about conversational forms, schema validation, and building with Grizzy.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 sm:mt-16">
          <Accordion type="single" collapsible className="w-full space-y-3.5 border-none">
            {FAQS.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="rounded-xl border border-border/80 bg-card/70 px-5 transition-colors duration-200 hover:border-border hover:bg-card data-[state=open]:border-primary/40 data-[state=open]:bg-card shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.05)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.03)]"
              >
                <AccordionTrigger className="font-heading text-base font-medium text-foreground py-4 text-left transition-colors hover:no-underline hover:text-primary sm:text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground pt-0 pb-5 sm:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
