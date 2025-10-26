import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/30">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-smooth">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            ClearEntry
          </span>
        </Link>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="default" size="sm" className="glow-primary">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};
