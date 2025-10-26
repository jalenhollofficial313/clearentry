import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  delay?: number;
}

export const StatCard = ({ label, value, sublabel, trend, icon: Icon, delay = 0 }: StatCardProps) => {
  const trendColor = {
    up: "text-primary",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  }[trend || "neutral"];

  return (
    <div 
      className="glass-panel rounded-2xl p-6 soft-shadow transition-smooth hover:scale-105 hover:glow-accent group relative overflow-hidden"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-smooth">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
        
        <div className={`text-4xl font-bold ${trendColor} mb-2 group-hover:scale-105 transition-smooth`}>
          {value}
        </div>
        
        {sublabel && (
          <div className="text-xs text-muted-foreground">{sublabel}</div>
        )}
      </div>
    </div>
  );
};
