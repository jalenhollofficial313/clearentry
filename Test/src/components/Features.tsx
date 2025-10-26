import { Brain, Bot, TrendingUp, BookOpen, MessageSquare, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Psychological Analysis",
    description: "Track your emotions before, during, and after each trade. Identify patterns in confidence, fear, or hesitation so you can strengthen your mental game.",
    color: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: Bot,
    title: "AI-Powered Trade Feedback",
    description: "Get instant feedback on your logged trades. Our AI analyzes your entries, notes, and outcomes, then suggests ways to refine your strategy.",
    color: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
  },
  {
    icon: TrendingUp,
    title: "Easy Trade Entry Logging",
    description: "Log trades with a single click when you open and close positions. Add notes, emotions, and screenshots to capture the full story behind every decision.",
    color: "from-primary/15 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: BookOpen,
    title: "Organized Trading Journal",
    description: "Keep all your trades, strategies, and notes in one place. Search, filter, and revisit past trades to continuously improve your approach.",
    color: "from-accent/15 to-accent/5",
    iconColor: "text-accent",
  },
  {
    icon: MessageSquare,
    title: "Personalized AI Chat",
    description: "Ask questions directly to your trading assistant. Whether it's clarifying your past performance, suggesting strategy improvements, or breaking down market psychology.",
    color: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: BarChart3,
    title: "Emotional & Strategic Statistics",
    description: "Track your P/L and other data based on your emotions as well as the strategy used for your trade.",
    color: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
  },
];

export const Features = () => {
  return (
    <section className="py-32 px-6 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-20 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Feature{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Highlights
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to master your trading psychology
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-panel rounded-2xl p-8 soft-shadow transition-smooth hover:scale-105 hover:glow-accent group relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-smooth`} />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-card to-muted/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth shadow-lg">
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-primary transition-smooth">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
