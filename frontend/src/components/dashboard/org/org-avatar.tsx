import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Extracts 1-2 letter uppercase initials from an organisation name.
 * e.g. "Acme Corp" -> "AC", "Sarah's Team" -> "ST", "Acme" -> "AC"
 */
export function getOrgInitials(name?: string | null): string {
  if (!name || !name.trim()) return "O";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface OrgAvatarProps {
  name?: string | null;
  logo?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function OrgAvatar({
  name,
  logo,
  className,
  fallbackClassName,
}: OrgAvatarProps) {
  const initials = getOrgInitials(name);

  return (
    <Avatar className={cn("size-8 rounded-lg shrink-0", className)}>
      {logo && <AvatarImage src={logo} alt={name ?? "Organisation"} />}
      <AvatarFallback
        className={cn(
          "rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold select-none",
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
