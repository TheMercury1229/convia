import { Metadata } from "next";
import { BillingPage } from "@/components/billing/billing-page";

export const metadata: Metadata = {
  title: "Billing & Credits | Convia",
  description: "Manage your organisation plan, credit balance, and usage history.",
};

export default function Page() {
  return <BillingPage />;
}
