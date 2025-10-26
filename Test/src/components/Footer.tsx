import { Sparkles } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-border/30 relative">
      <div className="absolute inset-0 gradient-mesh opacity-20" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-lg font-bold">ClearEntry</div>
              <div className="text-sm text-muted-foreground">Master your trading psychology</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © 2025 ClearEntry. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
