import { Geist_Mono, DM_Sans, Outfit } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"
import Provider from "@/components/providers/provider"

const outfitHeading = Outfit({ subsets: ["latin"], variable: "--font-heading" })

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Convia - The Conversational way of filling forms",
  description: "AI-powered form builder that talks to your users. Create smart, conversational forms that adapt to each respondent.",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        dmSans.variable,
        outfitHeading.variable
      )}
    >
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
