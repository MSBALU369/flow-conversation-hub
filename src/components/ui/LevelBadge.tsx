import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function LevelBadge({ level, size = "md", className }: LevelBadgeProps) {
  const sizeClasses = {
    xs: "px-1 py-0.5 text-[8px] gap-0",
    sm: "px-1.5 py-0.5 text-[10px] gap-0.5",
    md: "px-2 py-0.5 text-xs gap-0.5",
    lg: "px-2.5 py-1 text-sm gap-0.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-primary text-primary-foreground font-bold",
        sizeClasses[size],
        className
      )}
    >
      <span className="opacity-90">Level</span>
      <span>{level}</span>
    </div>
  );
}
