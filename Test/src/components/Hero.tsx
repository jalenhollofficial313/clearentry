import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Brain, Sparkles } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 gradient-mesh opacity-60" />
      
      {/* Animated orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="glass-panel px-6 py-3 rounded-full inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Next-gen trading psychology</span>
            </div>
          </div>
          
          {/* Main heading */}
          <div className="text-center space-y-6 animate-fade-in-up">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              Clear{" "}
              <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent animate-gradient-shift" style={{ backgroundSize: "200% 200%" }}>
                Entry
              </span>
            </h1>
            
            <p className="text-2xl md:text-4xl text-foreground/90 font-light max-w-3xl mx-auto leading-relaxed">
              Master Your Trades.{" "}
              <span className="text-primary font-medium">Master Your Mind.</span>
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The only trading journal that understands your psychology. Track emotions, 
              analyze patterns, and evolve your strategy with AI-powered insights.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-10 animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" className="glow-primary group text-base px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 hover:border-primary text-base px-8">
              View Dashboard Demo
            </Button>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            {[
              { icon: Brain, label: "Emotional Intelligence", desc: "Track trading psychology" },
              { icon: TrendingUp, label: "Smart Analytics", desc: "AI-powered insights" },
              { icon: Sparkles, label: "Real-time Feedback", desc: "Instant trade analysis" },
            ].map((feature, i) => (
              <div key={i} className="glass-panel rounded-2xl p-6 text-center group hover:scale-105 transition-smooth hover:glow-accent">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-smooth">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.label}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
