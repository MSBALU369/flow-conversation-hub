import { Search, X } from "lucide-react";
import { useCallState } from "@/hooks/useCallState";
import { useLocation, useNavigate } from "react-router-dom";

export default function FloatingSearchBubble() {
  const { isSearching, stopSearching } = useCallState();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on the finding page itself or if not searching
  if (!isSearching || location.pathname === "/finding") return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2 animate-in slide-in-from-right">
      <button
        onClick={() => navigate("/finding")}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
      >
        <Search className="w-4 h-4 animate-pulse" />
        <span className="text-xs font-medium">Finding...</span>
      </button>
      <button
        onClick={stopSearching}
        className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
      >
        <X className="w-4 h-4 text-destructive" />
      </button>
    </div>
  );
}
