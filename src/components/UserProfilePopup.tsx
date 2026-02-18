import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { MapPin, BarChart3, Users, UserPlus, UserMinus, MessageCircle, MoreVertical, VolumeX, Ban, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface UserProfilePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    level: number;
    location?: string;
    isOnline: boolean;
    followersCount: number;
    followingCount: number;
    fansCount?: number;
    weeklyData?: { day: string; minutes: number }[];
  };
  myName?: string;
  myWeeklyData?: { day: string; minutes: number }[];
}

function CompareGraphInline({
  userName,
  friendName,
  myData,
  friendData,
}: {
  userName: string;
  friendName: string;
  myData: { day: string; minutes: number }[];
  friendData: { day: string; minutes: number }[];
}) {
  const maxMin = Math.max(...myData.map((d) => d.minutes), ...friendData.map((d) => d.minutes), 1);
  const cW = 260, cH = 120, pL = 36, pR = 10, pB = 10;
  const plotW = cW - pL - pR, plotH = cH - 10 - pB;
  const toPoints = (data: typeof myData) =>
    data.map((d, i) => ({
      x: pL + (i / (data.length - 1)) * plotW,
      y: cH - pB - (d.minutes / maxMin) * plotH,
    }));
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const myPts = toPoints(myData), friendPts = toPoints(friendData);
  const myTotal = myData.reduce((s, d) => s + d.minutes, 0);
  const friendTotal = friendData.reduce((s, d) => s + d.minutes, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#9ca3af" }} />
          <span className="text-muted-foreground">{userName} ({myTotal}m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#38bdf8" }} />
          <span className="text-muted-foreground">{friendName} ({friendTotal}m)</span>
        </div>
      </div>
      <div className="flex justify-center">
        <svg width={cW} height={cH + 18} viewBox={`0 0 ${cW} ${cH + 18}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = cH - pB - pct * plotH;
            return (
              <g key={pct}>
                <line x1={pL} y1={y} x2={cW - pR} y2={y} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} />
                <text x={pL - 5} y={y + 3} textAnchor="end" fontSize={8} fontWeight="bold" fill="hsl(var(--foreground))">
                  {Math.round(pct * maxMin)}m
                </text>
              </g>
            );
          })}
          <path d={toPath(myPts)} fill="none" stroke="#9ca3af" strokeWidth={2} />
          {myPts.map((p, i) => <circle key={`m${i}`} cx={p.x} cy={p.y} r={2.5} fill="#9ca3af" />)}
          <path d={toPath(friendPts)} fill="none" stroke="#38bdf8" strokeWidth={2} />
          {friendPts.map((p, i) => <circle key={`f${i}`} cx={p.x} cy={p.y} r={2.5} fill="#38bdf8" />)}
          {dayLabels.map((day, i) => {
            const x = pL + (i / (dayLabels.length - 1)) * plotW;
            return (
              <text key={day} x={x} y={cH + 14} textAnchor="middle" fontSize={9} fontWeight="bold" fill="hsl(var(--foreground))">
                {day}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function UserProfilePopup({ open, onOpenChange, user, myName = "You", myWeeklyData }: UserProfilePopupProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const defaultMyData = dayLabels.map((day) => ({ day, minutes: Math.floor(Math.random() * 40) + 5 }));
  const defaultFriendData = user.weeklyData || dayLabels.map((day) => ({ day, minutes: Math.floor(Math.random() * 45) + 5 }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-xs p-0 overflow-hidden">
        {/* Top banner */}
        <div className="h-16 bg-gradient-to-r from-primary/30 to-accent/30 relative" />

        {/* Avatar row with 3-dot menu */}
        <div className="flex items-start justify-center -mt-8 px-4 relative">
          <div className="flex flex-col items-center flex-1">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-muted border-4 border-background flex items-center justify-center text-2xl font-bold text-foreground overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name[0]?.toUpperCase()
                )}
              </div>
              {user.isOnline && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[hsl(var(--ef-online))] rounded-full border-2 border-background" />
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="absolute right-4 top-5 p-1.5 rounded-full hover:bg-muted transition-colors">
                <MoreVertical className="w-4 h-4 text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem className="gap-2 text-sm">
                <VolumeX className="w-4 h-4" /> Mute
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-sm text-destructive focus:text-destructive">
                <Ban className="w-4 h-4" /> Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col items-center px-4 pb-4">

          {/* Name & Level */}
          <h3 className="text-lg font-bold text-foreground mt-2">{user.name}</h3>
          <div className="mt-1">
            <LevelBadge level={user.level} size="sm" />
          </div>

          {/* Location */}
          {user.location && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{user.location}</span>
            </div>
          )}

          {/* Stats row: Following | Followers | Fans */}
          <div className="flex items-center gap-5 mt-3">
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{user.followingCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Following</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{user.followersCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{user.fansCount ?? 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Fans</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 w-full">
            <Button
              onClick={() => setIsFollowing(!isFollowing)}
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className="flex-1 text-xs"
            >
              {isFollowing ? (
                <><UserMinus className="w-3.5 h-3.5 mr-1" /> Unfollow</>
              ) : (
                <><UserPlus className="w-3.5 h-3.5 mr-1" /> Follow</>
              )}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              <MessageCircle className="w-3.5 h-3.5 mr-1" /> Message
            </Button>
          </div>

          {/* Compare Graph */}
          <div className="w-full mt-4 glass-card p-3 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Speaking Comparison</span>
            </div>
            <CompareGraphInline
              userName={myName}
              friendName={user.name}
              myData={myWeeklyData || defaultMyData}
              friendData={defaultFriendData}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
