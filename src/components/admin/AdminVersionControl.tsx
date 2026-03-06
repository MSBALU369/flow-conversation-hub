import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, Save, Loader2 } from "lucide-react";

interface AppSettings {
  id: string;
  latest_version: string;
  min_required_version: string;
  store_url: string;
  update_message: string;
}

export function AdminVersionControl() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("*")
        .limit(1)
        .single();
      if (data) setSettings(data as any);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("app_settings" as any)
      .update({
        latest_version: settings.latest_version,
        min_required_version: settings.min_required_version,
        store_url: settings.store_url,
        update_message: settings.update_message,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", settings.id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ App Settings Saved", description: `Latest: ${settings.latest_version} | Min: ${settings.min_required_version}` });
    }
    setSaving(false);
  };

  if (loading) return null;

  if (!settings) {
    return (
      <Card className="border-border">
        <CardContent className="p-4 text-center text-xs text-muted-foreground">
          No app_settings row found. Insert a default row in Supabase.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" /> 📱 App Version Control
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Latest Version</label>
            <Input
              value={settings.latest_version}
              onChange={e => setSettings({ ...settings, latest_version: e.target.value })}
              className="h-8 text-xs mt-1 bg-background"
              placeholder="1.0.1"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Min Required</label>
            <Input
              value={settings.min_required_version}
              onChange={e => setSettings({ ...settings, min_required_version: e.target.value })}
              className="h-8 text-xs mt-1 bg-background"
              placeholder="1.0.0"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Store URL</label>
          <Input
            value={settings.store_url}
            onChange={e => setSettings({ ...settings, store_url: e.target.value })}
            className="h-8 text-xs mt-1 bg-background"
            placeholder="https://play.google.com/store/apps/..."
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Update Message</label>
          <Input
            value={settings.update_message}
            onChange={e => setSettings({ ...settings, update_message: e.target.value })}
            className="h-8 text-xs mt-1 bg-background"
            placeholder="A new version is available..."
          />
        </div>
        <Button size="sm" className="w-full text-xs" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
