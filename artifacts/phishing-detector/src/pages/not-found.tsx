import { Link } from "wouter";
import { Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background font-mono">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="relative">
            <Shield className="h-20 w-20 text-muted-foreground/20" />
            <AlertTriangle className="h-8 w-8 text-destructive absolute bottom-0 right-0" />
          </div>
        </div>
        <div>
          <div className="text-6xl font-bold text-destructive tracking-tight mb-2">404</div>
          <h1 className="text-xl font-semibold text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
            The requested resource does not exist or you lack clearance to access it.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
            Return to Base
          </Button>
        </Link>
      </div>
    </div>
  );
}
