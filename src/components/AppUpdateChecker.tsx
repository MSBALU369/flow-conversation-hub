import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, X } from "lucide-react";

const CLIENT_VERSION = "1.0.0";

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

export function AppUpdateChecker() {
  const [hardUpdate, setHardUpdate] = useState(false);
  const [softUpdate, setSoftUpdate] = useState(false);
  const [message, setMessage] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("update_dismissed") === "true");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("*")
        .limit(1)
        .single();
      if (!data) return;
      const settings = data as any;
      setMessage(settings.update_message || "");
      setStoreUrl(settings.store_url || "");

      if (compareVersions(CLIENT_VERSION, settings.min_required_version) < 0) {
        setHardUpdate(true);
      } else if (compareVersions(CLIENT_VERSION, settings.latest_version) < 0) {
        if (!dismissed) setSoftUpdate(true);
      }
    })();
  }, [dismissed]);

  const handleDismiss = () => {
    setSoftUpdate(false);
    setDismissed(true);
    sessionStorage.setItem("update_dismissed", "true");
  };

  // Hard update - non-dismissible blocking dialog
  if (hardUpdate) {
    return (
      <Dialog open modal>
        <DialogContent
          className="border-destructive/50 max-w-sm [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <DialogTitle className="text-lg">Update Required</DialogTitle>
            <DialogDescription className="text-sm">{message}</DialogDescription>
          </DialogHeader>
          <Button
            className="w-full mt-2"
            onClick={() => window.open(storeUrl, "_blank")}
          >
            <Download className="w-4 h-4 mr-2" /> Update Now
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Soft update - dismissible banner
  if (softUpdate) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-primary text-primary-foreground rounded-xl p-3 shadow-lg flex items-start gap-3">
          <Download className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">Update Available</p>
            <p className="text-[10px] opacity-90 mt-0.5 line-clamp-2">{message}</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-2 h-7 text-[10px]"
              onClick={() => window.open(storeUrl, "_blank")}
            >
              Update Now
            </Button>
          </div>
          <button onClick={handleDismiss} className="p-0.5 rounded hover:bg-primary-foreground/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
