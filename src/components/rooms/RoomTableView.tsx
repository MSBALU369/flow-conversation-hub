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
}

export function RoomTableView({ members, hostId, currentUserId, activeSpeakers }: RoomTableViewProps) {
  // Calculate positions around an elliptical table
  const positions = useMemo(() => {
    const count = members.length;
    if (count === 0) return [];

    return members.map((member, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      // Elliptical layout: wider than tall
      const radiusX = 42; // % of container width
      const radiusY = 38; // % of container height
      const x = 50 + radiusX * Math.cos(angle);
      const y = 50 + radiusY * Math.sin(angle);
      return { ...member, x, y, angle };
    });
  }, [members]);

  const isSpeaking = (userId: string) => activeSpeakers.includes(userId);

  return (
    <div className="relative w-full aspect-square max-w-[360px] mx-auto my-2">
      {/* Table surface */}
      <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-amber-900/30 via-amber-800/20 to-amber-900/30 border-2 border-amber-700/30 shadow-[inset_0_2px_20px_rgba(0,0,0,0.3)]">
        <div className="absolute inset-2 rounded-full border border-amber-600/15" />
        <div className="flex items-center justify-center h-full">
          <span className="text-[10px] text-amber-600/40 font-medium tracking-widest uppercase">
            {members.length}/20
          </span>
        </div>
      </div>

      {/* Members around the table */}
      {positions.map((member) => {
        const isHost = member.user_id === hostId;
        const isMe = member.user_id === currentUserId;
        const speaking = isSpeaking(member.user_id);

        return (
          <div
            key={member.user_id}
            className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ left: `${member.x}%`, top: `${member.y}%` }}
          >
            {/* Avatar with speaking ring */}
            <div className={`relative w-10 h-10 rounded-full ${speaking ? "ring-2 ring-green-400 ring-offset-1 ring-offset-background animate-pulse" : ""}`}>
              <div className={`w-full h-full rounded-full overflow-hidden border-2 ${isMe ? "border-primary" : isHost ? "border-amber-400" : "border-border"} bg-muted`}>
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {(member.username || "?")[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {/* Host crown */}
              {isHost && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
              )}
              {/* Speaking indicator */}
              {speaking && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <Mic className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            {/* Username */}
            <span className={`text-[9px] max-w-[56px] truncate text-center ${isMe ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {isMe ? "You" : member.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
