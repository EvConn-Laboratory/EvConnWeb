import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className,
      )}
      style={{
        background: "linear-gradient(90deg, var(--bg-surface, hsl(var(--muted))) 25%, var(--bg-elevated, hsl(var(--accent))) 50%, var(--bg-surface, hsl(var(--muted))) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.5s infinite",
      }}
      {...props}
    />
  );
}

export { Skeleton };
