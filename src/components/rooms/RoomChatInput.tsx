import { useState, useRef, useEffect } from "react";
import { Send, Image, Link2, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RoomChatInputProps {
  roomId: string;
  userId: string;
  onSend: (content: string, mediaUrl?: string) => void;
}

export function RoomChatInput({ roomId, userId, onSend }: RoomChatInputProps) {
  const [message, setMessage] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check if current user is admin
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const roles = (data || []).map((r: any) => r.role);
      setIsAdmin(roles.includes("admin") || roles.includes("root"));
    })();
  }, [userId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed" });
      return;
    }
    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = async () => {
    if (!message.trim() && !mediaFile) return;

    let mediaUrl: string | undefined;

    if (mediaFile) {
      setUploading(true);
      const ext = mediaFile.name.split(".").pop();
      const path = `room-${roomId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chat_media").upload(path, mediaFile);
      if (error) {
        toast({ title: "Upload failed", description: error.message });
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("chat_media").getPublicUrl(path);
      mediaUrl = urlData.publicUrl;
      setUploading(false);
    }

    onSend(message.trim() || (mediaUrl ? "📷 Media" : ""), mediaUrl);
    setMessage("");
    clearMedia();
  };

  // Detect and render links in messages
  const isUrl = (text: string) => /https?:\/\/[^\s]+/.test(text);

  return (
    <div className="bg-card border-t border-border shrink-0">
      {/* Media preview */}
      {mediaPreview && (
        <div className="px-4 pt-2 flex items-center gap-2">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
            <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" />
            <button onClick={clearMedia} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground">{mediaFile?.name}</span>
        </div>
      )}

      <div className="px-3 py-2 flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        {isAdmin && <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />}
        <button onClick={() => fileRef.current?.click()} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <Image className="w-5 h-5" />
        </button>
        {isAdmin && (
          <button onClick={() => videoRef.current?.click()} className="p-2 rounded-full hover:bg-muted transition-colors text-primary">
            <Video className="w-5 h-5" />
          </button>
        )}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-muted border-0 h-9 text-sm"
        />
        <Button
          onClick={handleSend}
          size="icon"
          className="shrink-0 bg-primary text-primary-foreground h-9 w-9"
          disabled={(!message.trim() && !mediaFile) || uploading}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
