import { cn } from "@/lib/utils";

interface NeonBatteryProps {
  segments?: number;
  maxSegments?: number;
  className?: string;
  size?: "sm" | "md";
}

// Rainbow color logic based on segment count
function getBatteryColor(segments: number): { color: string; glowColor: string; label: string } {
  if (segments === 7) {
    return { color: "#22c55e", glowColor: "0 0 6px #22c55e", label: "⚡ Full Power!" };
  } else if (segments >= 5) {
    return { color: "#3b82f6", glowColor: "0 0 6px #3b82f6", label: "⚡ High Energy!" };
  } else if (segments >= 3) {
    return { color: "#f97316", glowColor: "0 0 6px #f97316", label: "⚡ Medium" };
  } else {
    return { color: "#ef4444", glowColor: "0 0 6px #ef4444", label: "⚡ Low Energy" };
  }
}

export function NeonBattery({ 
  segments = 7, 
  maxSegments = 7, 
  className,
  size = "md"
}: NeonBatteryProps) {
  // Size presets for compact mobile UI
  const sizeConfig = size === "sm" 
    ? { segmentWidth: 4, segmentHeight: 10, segmentGap: 2, padding: 3, capWidth: 3, capHeight: 5 }
    : { segmentWidth: 6, segmentHeight: 16, segmentGap: 3, padding: 4, capWidth: 4, capHeight: 8 };

  const { segmentWidth, segmentHeight, segmentGap, padding, capWidth, capHeight } = sizeConfig;
  
  const totalWidth = (segmentWidth * maxSegments) + (segmentGap * (maxSegments - 1)) + (padding * 2) + capWidth;
  const totalHeight = segmentHeight + (padding * 2);
  
  const { color, glowColor } = getBatteryColor(segments);

  return (
    <svg 
      width={totalWidth} 
      height={totalHeight} 
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className={cn("drop-shadow-sm", className)}
    >
      {/* Battery body outline */}
      <rect
        x={0.5}
        y={0.5}
        width={totalWidth - capWidth - 1}
        height={totalHeight - 1}
        rx={3}
        ry={3}
        fill="none"
        className="stroke-foreground/30"
        strokeWidth={1.5}
      />
      
      {/* Battery cap */}
      <rect
        x={totalWidth - capWidth}
        y={(totalHeight - capHeight) / 2}
        width={capWidth - 1}
        height={capHeight}
        rx={1.5}
        ry={1.5}
        className="fill-foreground/40"
      />

      {/* Battery segments */}
      {Array.from({ length: maxSegments }).map((_, i) => {
        const isActive = i < segments;
        const x = padding + (i * (segmentWidth + segmentGap));
        const y = padding;
        
        return (
          <g key={i}>
            {/* Glow effect for active segments (subtle) */}
            {isActive && (
              <rect
                x={x - 1}
                y={y - 1}
                width={segmentWidth + 2}
                height={segmentHeight + 2}
                rx={1.5}
                ry={1.5}
                fill="none"
                style={{
                  filter: 'blur(2px)',
                  fill: color,
                  opacity: 0.3,
                }}
              />
            )}
            
            {/* Segment rectangle */}
            <rect
              x={x}
              y={y}
              width={segmentWidth}
              height={segmentHeight}
              rx={1}
              ry={1}
              fill={isActive ? color : 'hsl(var(--muted))'}
              style={isActive ? {
                filter: `drop-shadow(${glowColor})`,
              } : undefined}
            />
          </g>
        );
      })}
    </svg>
  );
}
