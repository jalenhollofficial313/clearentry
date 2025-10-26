import { CheckCircle2 } from "lucide-react";

export const About = () => {
  const benefits = [
    "Understand the why behind every trade",
    "AI-powered psychological insights",
    "Real-time emotional pattern detection",
    "Grow consistently with data-driven discipline",
  ];

  return (
    <section className="py-32 px-6 relative">
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            About{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Clear Entry
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The next-generation trading journal built for modern traders
          </p>
        </div>
        
        <div className="glass-panel rounded-3xl p-10 md:p-16 soft-shadow relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10 space-y-8">
            <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed">
              Clear Entry is a next-generation trading journal built for modern traders. We go
              beyond just tracking numbers — we help you understand the{" "}
              <span className="text-primary font-semibold">why</span> behind your trades.
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Clear Entry combines psychological insights with{" "}
              <span className="text-accent font-semibold">AI analytics</span> so you can trade
              smarter, stay disciplined, and grow consistently.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-smooth">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground/90">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
