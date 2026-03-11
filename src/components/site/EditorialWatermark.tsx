"use client";

import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";

export function EditorialWatermark({ basePath }: { basePath: string }) {
    const pathname = usePathname();
    const { scrollYProgress } = useScroll();

    // Translate the page URL slug to a large watermark word
    const getPageName = () => {
        if (pathname === basePath || pathname === `${basePath}/`) return "";

        const parts = pathname.split("/");
        const lastPart = parts[parts.length - 1];

        switch (lastPart) {
            case "galeria": return "GALERÍA";
            case "ubicacion": return "UBICACIÓN";
            case "tipologias": return "TIPOLOGÍAS";
            case "amenidades": return "AMENIDADES";
            case "entorno": return "ENTORNO";
            default: return lastPart.toUpperCase();
        }
    };

    const watermarkText = getPageName();

    // Parallax scroll effect for the watermark
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

    if (!watermarkText) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-[0.02] mix-blend-overlay select-none">
            <motion.div style={{ y }} className="whitespace-nowrap font-site-heading tracking-widest text-[20vw] text-white">
                {watermarkText}
            </motion.div>
        </div>
    );
}
