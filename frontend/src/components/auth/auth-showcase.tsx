import Image from "next/image";
import Link from "next/link";

export function AuthShowcase() {
  return (
    <aside
      aria-label="Convia overview"
      className="relative overflow-hidden hidden lg:flex lg:w-[50%] xl:w-[50%] flex-col justify-between overflow-hidden bg-primary p-6 xl:p-10 text-white"
    >
      {/* Subtle Ambient Glows */}

      {/* Top: Logo pinned at top-left */}
      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo-white.svg"
            alt="Convia"
            width={150}
            height={45}
            className="h-8.5 w-auto"
            priority
          />
        </Link>
      </div>

    </aside>
  );
}
