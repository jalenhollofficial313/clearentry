import { Navigation } from "@/components/Navigation";
import { StatCard } from "@/components/StatCard";
import { EmotionTag } from "@/components/EmotionTag";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Percent, Clock, Target } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      
      <main className="pt-24 px-6 pb-12 relative z-10">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-6 animate-fade-in">
            <div>
              <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Dashboard
              </h1>
              <p className="text-xl text-muted-foreground">Your trades. Your mindset. Perfected.</p>
            </div>
            <Button size="lg" className="glow-primary group">
              <Plus className="w-5 h-5 mr-2" />
              New Trade Entry
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-slide-in">
            <StatCard 
              label="Total P/L" 
              value="+$800" 
              trend="up" 
              icon={TrendingUp}
              delay={0}
            />
            <StatCard 
              label="Win Rate" 
              value="83%" 
              sublabel="15 wins / 18 trades" 
              icon={Percent}
              delay={0.1}
            />
            <StatCard 
              label="Avg Hold Time" 
              value="1 min" 
              sublabel="Scalping focus" 
              icon={Clock}
              delay={0.2}
            />
            <StatCard 
              label="Best Strategy" 
              value="FVG" 
              sublabel="Fair Value Gap" 
              icon={Target}
              delay={0.3}
            />
          </div>

          {/* Emotion Overview */}
          <div className="glass-panel rounded-2xl p-8 soft-shadow mb-12 animate-scale-in">
            <h3 className="text-2xl font-bold mb-6">Current Emotional State</h3>
            <div className="flex flex-wrap gap-3">
              <EmotionTag emotion="confident" label="Confidence" />
              <EmotionTag emotion="disciplined" label="Disciplined" />
              <EmotionTag emotion="neutral" label="Calm" />
            </div>
          </div>

          {/* Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className="glass-panel rounded-2xl p-8 soft-shadow group hover:scale-[1.02] transition-smooth">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                P/L Curve
              </h3>
              <div className="h-72 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
                
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Chart visualization</p>
                  <p className="text-sm text-muted-foreground/60 mt-2">Showing profit/loss trend</p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-8 soft-shadow group hover:scale-[1.02] transition-smooth">
              <h3 className="text-2xl font-bold mb-6">Daily Reflection</h3>
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/30">
                  <p className="text-muted-foreground leading-relaxed italic">
                    Today you posted a total profit of{" "}
                    <span className="text-primary font-semibold">$800</span> with three winning trades and one loss. 
                    The loss was linked to holding too long driven by greed rather than your fair value gap strategy, 
                    primarily on AAPL and TSLA.
                  </p>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-3">Detected Emotions:</div>
                  <div className="flex flex-wrap gap-2">
                    <EmotionTag emotion="confident" label="Confidence" />
                    <EmotionTag emotion="fearful" label="Fear" />
                    <EmotionTag emotion="impulsive" label="Greed" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="glass-panel rounded-2xl p-8 soft-shadow relative overflow-hidden animate-fade-in-up">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold">AI Emotional Review</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-lg text-foreground/90 leading-relaxed">
                  Your emotional review indicates that <span className="text-primary font-semibold">confidence</span> and{" "}
                  <span className="text-emotion-fearful font-semibold">fear</span> can lead to positive outcomes when you maintain discipline.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  Most trades used your fair value gap strategy, but today's loss highlights a pattern of struggling to exit 
                  timely under <span className="text-emotion-impulsive font-semibold">greed</span> influence. Compared to previous days, 
                  you showed good execution under confidence and fear but need more discipline around greedy impulses.
                </p>
                
                <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                  <div className="text-sm font-semibold text-accent mb-2">💡 Key Insight</div>
                  <p className="text-sm text-muted-foreground">
                    Setting strict exit rules at your planned profit targets or trailing stop rules could help counteract 
                    greed influence, such as pre-planned profit targets or trailing stops to maintain discipline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
