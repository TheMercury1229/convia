import Image from "next/image";
import Link from "next/link";
import { AuthShowcase } from "@/components/auth/auth-showcase";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col min-h-svh lg:flex-row  overflow-hidden">
      {/* 50% Left Showcase Panel */}

      < AuthShowcase />
      {/* 50% Right Form Area */}
      < main className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-10 lg:w-[50%] xl:w-[50%]" >
        {/* Mobile Header: Logo */}
        <div className="flex items-center justify-between w-full lg:hidden" >
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Convia"
              width={120}
              height={36}
              className="h-7 w-auto"
              priority
            />
          </Link>
        </div >

        {/* Center: Auth Form Container */}
        <div className="my-auto w-full max-w-[420px] mx-auto py-4" >
          {children}
        </div >
      </main >
    </div >
  );
}
