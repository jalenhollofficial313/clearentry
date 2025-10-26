import { Play } from "lucide-react";

export const Walkthrough = () => {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-1/4 -right-48 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              See it in action
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            Watch ClearEntry in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how ClearEntry transforms your trading psychology in under 2 minutes
          </p>
        </div>

        {/* Video Container */}
        <div className="relative animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="glass-panel p-2 rounded-2xl group hover:scale-[1.02] transition-all duration-500">
            <div className="relative aspect-video bg-background/50 rounded-xl overflow-hidden border border-white/10">
              {/* Video Placeholder - Replace with actual video */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse-glow" />
                    <div className="relative w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center backdrop-blur-sm group-hover:bg-primary/20 transition-all duration-300">
                      <Play className="w-8 h-8 text-primary fill-primary" />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">Video walkthrough coming soon</p>
                </div>
              </div>

              {/* Replace the div above with your video embed */}
              {/* Example for YouTube:
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                title="ClearEntry Walkthrough"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              */}

              {/* Example for Vimeo:
              <iframe
                className="w-full h-full"
                src="https://player.vimeo.com/video/YOUR_VIDEO_ID"
                title="ClearEntry Walkthrough"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
              */}

              {/* For direct video file:
              <video
                className="w-full h-full object-cover"
                controls
                poster="/path-to-thumbnail.jpg"
              >
                <source src="/path-to-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              */}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/20 rounded-full blur-3xl -z-10" />
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
        </div>

        {/* Key Benefits Below Video */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          {[
            { label: "Quick Setup", value: "< 5 min" },
            { label: "Intuitive Interface", value: "No Training" },
            { label: "Instant Insights", value: "Real-time AI" }
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-xl bg-background/30 border border-white/5 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
