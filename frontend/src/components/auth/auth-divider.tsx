import { Separator } from "@/components/ui/separator";

interface AuthDividerProps {
  label?: string;
}

export function AuthDivider({ label = "or continue with email" }: AuthDividerProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <Separator />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background text-muted-foreground px-2">
          {label}
        </span>
      </div>
    </div>
  );
}
