import Link from "next/link";
import { NodDoLogo } from "@/components/ui/NodDoLogo";

export function MarketingFooter() {
  return (
    <footer className="relative z-[1] px-6 lg:px-20 py-10 border-t border-[var(--mk-border-rule)] flex flex-col sm:flex-row justify-between items-center gap-4">
      {/* Logo */}
      <Link href="/" aria-label="NODDO Home">
        <NodDoLogo
          height={14}
          colorNod="rgba(244, 240, 232, 0.2)"
          colorDo="rgba(184, 151, 58, 0.4)"
        />
      </Link>

      <p
        className="text-[10px] tracking-[0.2em]"
        style={{ color: "rgba(244, 240, 232, 0.15)" }}
      >
        &copy; 2026 Noddo Technologies &middot; Todos los derechos reservados
      </p>

      <p
        className="text-[10px] tracking-[0.2em]"
        style={{ color: "rgba(244, 240, 232, 0.15)" }}
      >
        noddo.co
      </p>
    </footer>
  );
}
