import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MentionUser {
  id: string;
  name: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  users: MentionUser[];
}

export function MentionInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  autoFocus,
  users,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  useEffect(() => {
    setSelectedIdx(0);
  }, [mentionQuery]);

  const getMentionContext = (text: string) => {
    const atIdx = text.lastIndexOf("@");
    if (atIdx === -1) return null;
    // Only trigger if @ is at start or preceded by a space
    if (atIdx > 0 && text[atIdx - 1] !== " ") return null;
    const query = text.slice(atIdx + 1);
    // Don't show if there's a space after the query (mention completed)
    if (query.includes(" ")) return null;
    return { atIdx, query };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    const ctx = getMentionContext(newValue);
    if (ctx) {
      setMentionQuery(ctx.query);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (userName: string) => {
    const ctx = getMentionContext(value);
    if (!ctx) return;
    const before = value.slice(0, ctx.atIdx);
    const newValue = `${before}@${userName} `;
    onChange(newValue);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, filteredUsers.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredUsers[selectedIdx].name);
        return;
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        return;
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
      />
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-full bg-popover border border-border rounded-md shadow-lg z-50 max-h-32 overflow-y-auto">
          {filteredUsers.map((user, idx) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(user.name);
              }}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-muted/50",
                idx === selectedIdx && "bg-muted/50"
              )}
            >
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                {user.name[0]}
              </div>
              <span className="text-foreground">@{user.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
