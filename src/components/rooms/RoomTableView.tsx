import { useMemo } from "react";
import { Crown, Mic, MicOff } from "lucide-react";

interface Member {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface RoomTableViewProps {
  members: Member[];
  hostId: string;
  currentUserId?: string;
  activeSpeakers: string[];
  mutedMembers: Set<string>;
  isHost: boolean;
  onKick?: (userId: string) => void;
  onToggleMute?: (userId: string) => void;
}

export function RoomTableView({ members, hostId, currentUserId, activeSpeakers, mutedMembers, isHost, onKick, onToggleMute }: RoomTableViewProps) {
  const positions = useMemo(() => {
    const count = members.length;
    if (count === 0) return [];
    return members.map((member, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      const radiusX = 40;
      const radiusY = 36;
      const x = 50 + radiusX * Math.cos(angle);
      const y = 50 + radiusY * Math.sin(angle);
      return { ...member, x, y };
    });
  }, [members]);

  const isSpeaking = (userId: string) => activeSpeakers.includes(userId);
  const isMuted = (userId: string) => mutedMembers.has(userId);

  return (
    <div className="relative w-full aspect-square max-w-[340px] mx-auto my-1">
      {/* CSS for speaking wave animation */}
      <style>{`
        @keyframes speaking-wave {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.35); opacity: 0.15; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes speaking-wave-2 {
          0% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.2); opacity: 0.1; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        .speaking-ring-1 { animation: speaking-wave 1.2s ease-out infinite; }
        .speaking-ring-2 { animation: speaking-wave-2 1.2s ease-out infinite 0.3s; }
        .speaking-ring-3 { animation: speaking-wave 1.2s ease-out infinite 0.6s; }
      `}</style>

      {/* Table surface */}
      <div className="absolute inset-[16%] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border border-primary/20 shadow-[inset_0_2px_15px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-2 rounded-full border border-primary/10" />
        <div className="flex flex-col items-center justify-center h-full gap-0.5">
          <span className="text-lg font-bold text-primary/40">{members.length}</span>
          <span className="text-[9px] text-muted-foreground/60 tracking-wider uppercase">/ 20 members</span>
        </div>
      </div>

      {/* Members */}
      {positions.map((member) => {
        const host = member.user_id === hostId;
        const isMe = member.user_id === currentUserId;
        const speaking = isSpeaking(member.user_id);
        const muted = isMuted(member.user_id);
        const canManage = isHost && !isMe && member.user_id !== hostId;

        return (
          <div
            key={member.user_id}
            className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 group"
            style={{ left: `${member.x}%`, top: `${member.y}%` }}
          >
            <div className="relative">
              {/* Speaking wave rings */}
              {speaking && !muted && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-green-400/50 speaking-ring-1" />
                  <div className="absolute inset-0 rounded-full border border-green-400/30 speaking-ring-2" />
                  <div className="absolute inset-0 rounded-full border border-green-400/20 speaking-ring-3" />
                </>
              )}

              {/* Avatar */}
              <div className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                speaking && !muted ? "border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.4)]" 
                : muted ? "border-destructive/50 opacity-70" 
                : isMe ? "border-primary" 
                : host ? "border-amber-400" 
                : "border-border"
              } bg-muted`}>
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {(member.username || "?")[0]?.toUpperCase()}
                  </div>
                )}

                {/* Muted overlay */}
                {muted && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <MicOff className="w-4 h-4 text-destructive" />
                  </div>
                )}
              </div>

              {/* Host crown */}
              {host && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-sm" />
                </div>
              )}

              {/* Speaking mic indicator */}
              {speaking && !muted && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                  <Mic className="w-2.5 h-2.5 text-white" />
                </div>
              )}

              {/* Muted indicator (not speaking) */}
              {!speaking && muted && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive flex items-center justify-center shadow-sm">
                  <MicOff className="w-2.5 h-2.5 text-destructive-foreground" />
                </div>
              )}

              {/* Host controls on hover/tap */}
              {canManage && (
                <div className="absolute -top-1 -right-6 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 z-10">
                  <button
                    onClick={() => onToggleMute?.(member.user_id)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${muted ? "bg-primary text-primary-foreground" : "bg-destructive/80 text-destructive-foreground"}`}
                    title={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? <Mic className="w-2.5 h-2.5" /> : <MicOff className="w-2.5 h-2.5" />}
                  </button>
                  <button
                    onClick={() => onKick?.(member.user_id)}
                    className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    title="Remove"
                  >
                    <span className="text-[9px] font-bold">✕</span>
                  </button>
                </div>
              )}
            </div>

            {/* Username */}
            <span className={`text-[9px] max-w-[52px] truncate text-center leading-tight ${
              speaking && !muted ? "text-green-400 font-semibold" 
              : muted ? "text-destructive/70" 
              : isMe ? "text-primary font-semibold" 
              : "text-muted-foreground"
            }`}>
              {isMe ? "You" : member.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
