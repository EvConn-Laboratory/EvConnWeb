import { cn } from "@/lib/utils";

interface HexBadgeProps {
  value: string | number;
  size?: "sm" | "md" | "lg";
  variant?: "teal" | "green" | "blue" | "muted";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-6 text-[10px]",
  md: "h-9 w-8 text-xs",
  lg: "h-11 w-10 text-sm",
};

const variantClasses = {
  teal: "bg-[var(--evconn-teal)] text-black",
  green: "bg-[var(--evconn-green)] text-black",
  blue: "bg-[var(--evconn-blue)] text-white",
  muted: "bg-muted text-muted-foreground",
};

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export function HexBadge({
  value,
  size = "md",
  variant = "teal",
  className,
}: HexBadgeProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-bold",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      style={{ clipPath: HEX_CLIP }}
      aria-label={`${value}`}
    >
      {value}
    </div>
  );
}

interface HexAvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  isAlumni?: boolean;
  showActiveDot?: boolean;
  className?: string;
}

export function HexAvatar({
  src,
  name,
  size = 80,
  isAlumni = false,
  showActiveDot = true,
  className,
}: HexAvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn("relative shrink-0", isAlumni && "opacity-60", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="h-full w-full overflow-hidden"
        style={{ clipPath: HEX_CLIP }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
            width={size}
            height={size}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--evconn-teal)]/20 via-[var(--evconn-teal)]/10 to-muted text-sm font-bold text-primary">
            {initials}
          </div>
        )}
      </div>

      {/* Active indicator dot */}
      {!isAlumni && showActiveDot && (
        <span
          className="absolute bottom-1 right-[10%] h-2.5 w-2.5 rounded-full border-2 border-card bg-[var(--evconn-green)]"
          aria-label="Active"
        />
      )}
    </div>
  );
}

interface HexRatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const HEX_PATH =
  "M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z";

export function HexRating({
  value,
  max = 5,
  onChange,
  readOnly = false,
  size = "md",
  className,
}: HexRatingProps) {
  const iconSize = size === "sm" ? 20 : 24;

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role={readOnly ? undefined : "group"}
      aria-label={`Rating: ${value} of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(i + 1)}
            className={cn(
              "transition-transform",
              !readOnly && "cursor-pointer hover:scale-110 active:scale-95",
              readOnly && "cursor-default",
            )}
            aria-label={`Rate ${i + 1}`}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill={filled ? "var(--evconn-teal)" : "none"}
              stroke={filled ? "var(--evconn-teal)" : "var(--bg-border, #1A2736)"}
              strokeWidth="1.5"
              style={{
                filter: filled
                  ? "drop-shadow(0 0 4px rgba(42,191,191,0.4))"
                  : undefined,
                transition: "fill 0.15s ease, filter 0.15s ease",
              }}
            >
              <path d={HEX_PATH} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
