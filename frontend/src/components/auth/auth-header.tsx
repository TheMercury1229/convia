interface AuthHeaderProps {
  title: string;
  description: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm">
        {description}
      </p>
    </div>
  );
}
