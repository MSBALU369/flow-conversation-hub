import { cn } from "@/lib/utils";

export type SignalLevel = 0 | 1 | 2 | 3 | 4;

interface SignalStrengthProps {
  level: SignalLevel;
  showNA?: boolean;
  className?: string;
}

export function SignalStrength({ level, showNA = false, className }: SignalStrengthProps) {
  const bars = [1, 2, 3, 4];
  const barHeights = ["h-1.5", "h-2.5", "h-3.5", "h-[18px]"];

  if (showNA) {
    return (
      <div className={cn("flex items-end gap-[2px]", className)}>
        {bars.map((_, i) => (
          <div
            key={i}
            className={cn("w-[3px] rounded-sm bg-muted-foreground/30", barHeights[i])}
          />
        ))}
        <span className="text-[8px] text-muted-foreground ml-0.5 font-semibold leading-none">NA</span>
      </div>
    );
  }

  const getBarColor = (barIndex: number) => {
    if (barIndex >= level) return "bg-muted-foreground/30";
    if (level <= 1) return "bg-destructive";
    if (level <= 2) return "bg-[hsl(var(--ef-streak))]";
    return "bg-green-400";
  };

  return (
    <div className={cn("flex items-end gap-[2px]", className)}>
      {bars.map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] rounded-sm transition-colors duration-300",
            barHeights[i],
            getBarColor(i)
          )}
        />
      ))}
    </div>
  );
}
