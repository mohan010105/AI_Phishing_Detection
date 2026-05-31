import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Activity, Link as LinkIcon, Mail, History, Settings, LogOut, Menu, User as UserIcon, FileText, QrCode, Camera, Bot, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/scan/url", label: "Scan URL", icon: LinkIcon },
    { href: "/scan/email", label: "Scan Email", icon: Mail },
    { href: "/scan/qr", label: "QR Scanner", icon: QrCode },
    { href: "/scan/screenshot", label: "Screenshot AI", icon: Camera },
    { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
    { href: "/compare", label: "Compare Threats", icon: GitCompare },
    { href: "/history", label: "History", icon: History },
    { href: "/reports", label: "Reports", icon: FileText },
  ];

  if (user?.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin Console", icon: Settings });
  }

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              location === item.href
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </div>
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-mono">
      {/* Mobile Header */}
      <header className="md:hidden border-b border-border bg-card p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-tight">PHISH_GUARD</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-card border-r border-border p-0 w-64 flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold tracking-tight text-lg">PHISH_GUARD</span>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              <NavLinks />
            </nav>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm truncate">
                  <div className="font-medium text-foreground">{user?.name}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 sticky top-0 h-screen">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary animate-pulse" />
          <span className="font-bold tracking-tight text-xl">PHISH_GUARD</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider px-3">System Access</div>
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-border">
          <Link href="/profile">
            <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-md cursor-pointer hover:bg-secondary/50 transition-colors">
              <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary shrink-0">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="text-sm truncate">
                <div className="font-medium text-foreground truncate">{user?.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </div>
            </div>
          </Link>
          <Link href="/settings">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-md mb-2 transition-colors cursor-pointer ${location === "/settings" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
              <Settings className="h-4 w-4" />
              Settings
            </div>
          </Link>
          <Button variant="outline" className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Terminate Session
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
