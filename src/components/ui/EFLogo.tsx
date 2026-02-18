import { cn } from "@/lib/utils";
import efLogo from "@/assets/ef-logo.png";

interface EFLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export function EFLogo({ size = "md", className, showText = true }: EFLogoProps) {
  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-14 h-14",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={efLogo}
        alt="English Flow"
        className={cn("rounded-xl object-contain", sizeClasses[size])}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-extrabold tracking-wide text-foreground drop-shadow-sm">
            English<span className="text-primary"> Flow</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-bold -mt-0.5 tracking-[0.3em]">
            Talk & Practice
          </span>
        </div>
      )}
    </div>
  );
}
