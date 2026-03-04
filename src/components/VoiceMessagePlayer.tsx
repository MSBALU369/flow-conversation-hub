import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceMessagePlayerProps {
  url: string;
  isMe: boolean;
  messageId: string;
}

export function VoiceMessagePlayer({ url, isMe, messageId }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = new Audio(url);
    audio.preload = "metadata";
    audioRef.current = audio;

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };
    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [url]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const formatDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button
        onClick={toggle}
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all",
          isMe
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-primary/20 text-primary"
        )}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className={cn("h-1.5 rounded-full overflow-hidden", isMe ? "bg-primary-foreground/20" : "bg-muted")}>
          <div
            className={cn("h-full rounded-full transition-all duration-100", isMe ? "bg-primary-foreground/70" : "bg-primary")}
            style={{ width: `${progress}%` }}
          />
        </div>
        {duration > 0 && (
          <span className={cn("text-[9px] tabular-nums", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
            {formatDur(currentTime)} / {formatDur(duration)}
          </span>
        )}
      </div>
    </div>
  );
}
