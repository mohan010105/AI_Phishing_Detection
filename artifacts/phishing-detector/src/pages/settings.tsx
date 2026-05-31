import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Bell, Shield, Eye, Download, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const SETTINGS_KEY = "phishguard_settings";

interface UserSettings {
  notifications: boolean;
  autoExport: boolean;
  defaultHistoryLimit: string;
  scanAlertThreshold: string;
  compactView: boolean;
}

const defaults: UserSettings = {
  notifications: true,
  autoExport: false,
  defaultHistoryLimit: "10",
  scanAlertThreshold: "suspicious",
  compactView: false,
};

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

export default function Settings() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDirty(true);
  }, [settings]);

  const set = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setDirty(false);
    toast({ title: "Settings Saved", description: "Your preferences have been updated." });
  };

  const reset = () => {
    setSettings(defaults);
    localStorage.removeItem(SETTINGS_KEY);
    toast({ title: "Settings Reset", description: "All preferences restored to defaults." });
  };

  const exportData = () => {
    const data = {
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phishguard-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure platform behavior and display preferences.</p>
        </div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" /> Notifications
              </CardTitle>
              <CardDescription>Control alert behavior after scan completion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Scan Completion Alerts</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Show a toast notification after each scan finishes.</p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(v) => set("notifications", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Alert Threshold</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Minimum risk level to trigger an elevated alert.</p>
                </div>
                <Select value={settings.scanAlertThreshold} onValueChange={(v) => set("scanAlertThreshold", v)}>
                  <SelectTrigger className="w-[160px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe">Any (Including Safe)</SelectItem>
                    <SelectItem value="suspicious">Suspicious+</SelectItem>
                    <SelectItem value="high_risk">High Risk Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Display */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" /> Display
              </CardTitle>
              <CardDescription>Customize how data is presented.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Compact View</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Reduce spacing in tables and lists.</p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={(v) => set("compactView", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">History Page Size</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Default number of records shown per page.</p>
                </div>
                <Select value={settings.defaultHistoryLimit} onValueChange={(v) => set("defaultHistoryLimit", v)}>
                  <SelectTrigger className="w-[120px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 rows</SelectItem>
                    <SelectItem value="10">10 rows</SelectItem>
                    <SelectItem value="20">20 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data & Privacy */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" /> Data & Privacy
              </CardTitle>
              <CardDescription>Manage your local data and session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Auto-export After Scan</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Automatically download scan result as JSON.</p>
                </div>
                <Switch
                  checked={settings.autoExport}
                  onCheckedChange={(v) => set("autoExport", v)}
                />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
                  <Download className="h-4 w-4" /> Export Settings
                </Button>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" /> Terminate Session & Clear Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between p-4 bg-card/50 border border-border rounded-lg">
            <span className="text-sm text-muted-foreground">
              {dirty ? "You have unsaved changes." : "All settings saved."}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>Reset Defaults</Button>
              <Button size="sm" onClick={save} disabled={!dirty}>Save Settings</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
