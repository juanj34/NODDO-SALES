import { Loader2 } from "lucide-react";

export default function ExplorarLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-[var(--surface-0)]">
      <Loader2
        size={28}
        className="animate-spin text-[var(--site-primary)]"
      />
    </div>
  );
}
