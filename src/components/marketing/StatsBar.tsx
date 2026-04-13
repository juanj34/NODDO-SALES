"use client";

import { motion } from "framer-motion";
import { Building2, LineChart, Map, MonitorSmartphone } from "lucide-react";

export function StatsBar() {
    const stats = [
        { value: "48+", label: "Proyectos Activos", icon: Building2 },
        { value: "12K", label: "NodDo Quotes", icon: MonitorSmartphone },
        { value: "$20M", label: "Ventas Facilitadas", icon: LineChart },
        { value: "100%", label: "Impacto Visual", icon: Map },
    ];

    return (
        <section className="relative py-16 lg:py-24 border-y border-white/[0.05] bg-[#050505] overflow-hidden">
            {/* Subtle Moving Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        rotate: [0, 360],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[50%] -left-[10%] w-[120%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(99,102,241,0.03)_0deg,transparent_60deg,rgba(14,165,233,0.03)_120deg,transparent_180deg,rgba(16,185,129,0.03)_240deg,transparent_300deg,rgba(99,102,241,0.03)_360deg)] opacity-70 blur-[80px]"
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="flex-1 flex flex-col items-center text-center pt-8 md:pt-0 w-full group"
                        >
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-[var(--noddo-primary)]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)_inset] group-hover:border-[var(--noddo-primary)]/30 transition-colors duration-500">
                                    <stat.icon size={20} className="text-[var(--text-secondary)] group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
                                </div>
                            </div>
                            <motion.span
                                className="text-4xl lg:text-5xl font-heading font-medium tracking-tight text-white mb-2"
                            >
                                {stat.value}
                            </motion.span>
                            <span className="text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors duration-500">
                                {stat.label}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
