interface DisclaimerProps {
  text: string;
}

export function Disclaimer({ text }: DisclaimerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-sm border-t border-white/5 px-6 py-2">
      <p className="text-[10px] text-white/30 text-center tracking-wider">
        {text}
      </p>
    </div>
  );
}
