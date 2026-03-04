import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-light tracking-widest mb-4">NODESITES</h1>
      <p className="text-white/50 text-lg mb-12">
        Micrositios inmobiliarios premium
      </p>
      <div className="flex gap-6">
        <Link
          href="/sites/alto-de-yeguas"
          className="border border-[#C9A96E] text-[#C9A96E] px-8 py-3 text-sm tracking-wider hover:bg-[#C9A96E] hover:text-black transition-all duration-300"
        >
          VER DEMO
        </Link>
        <Link
          href="/login"
          className="border border-white/20 text-white/70 px-8 py-3 text-sm tracking-wider hover:border-white hover:text-white transition-all duration-300"
        >
          DASHBOARD
        </Link>
      </div>
    </div>
  );
}
