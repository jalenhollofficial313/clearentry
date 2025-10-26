interface EmotionTagProps {
  emotion: "confident" | "fearful" | "neutral" | "impulsive" | "disciplined";
  label: string;
}

const emotionConfig = {
  confident: {
    bg: "bg-emotion-confident/20",
    text: "text-emotion-confident",
    emoji: "😌",
  },
  fearful: {
    bg: "bg-emotion-fearful/20",
    text: "text-emotion-fearful",
    emoji: "😟",
  },
  neutral: {
    bg: "bg-emotion-neutral/20",
    text: "text-emotion-neutral",
    emoji: "😐",
  },
  impulsive: {
    bg: "bg-emotion-impulsive/20",
    text: "text-emotion-impulsive",
    emoji: "😤",
  },
  disciplined: {
    bg: "bg-emotion-disciplined/20",
    text: "text-emotion-disciplined",
    emoji: "🎯",
  },
};

export const EmotionTag = ({ emotion, label }: EmotionTagProps) => {
  const config = emotionConfig[emotion];
  
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
      <span>{config.emoji}</span>
      <span>{label}</span>
    </span>
  );
};
