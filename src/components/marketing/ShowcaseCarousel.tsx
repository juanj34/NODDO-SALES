"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const showcaseProjects = [
    {
        name: "Hacienda Primavera",
        location: "Bogotá, Colombia",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        tags: ["Residencial", "Casas"],
    },
    {
        name: "Alegranza",
        location: "Medellín, Colombia",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        tags: ["Apartamentos", "Vista 360"],
    },
    {
        name: "Torres del Lago",
        location: "Cartagena, Colombia",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        tags: ["Lujo", "Penthouse"],
    },
];

export function ShowcaseCarousel() {
    return (
        <section className="py-24 lg:py-32 border-y border-[var(--mk-border-rule)]">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.7 }}
                    >
                        <p className="text-[11px] tracking-[0.3em] uppercase text-[#D4A574] mb-3">
                            PROYECTOS
                        </p>
                        <h2 className="font-heading text-3xl lg:text-4xl font-bold tracking-tight text-[var(--mk-text-primary)] mb-3">
                            Hechos con Noddo.
                        </h2>
                        <p className="text-base text-[var(--mk-text-secondary)] max-w-lg">
                            Proyectos que dejaron el brochure estático para brindar una
                            experiencia de ventas inmersiva.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                    >
                        <button className="btn-mk-outline px-5 py-2.5 text-sm inline-flex items-center gap-2">
                            Ver todos
                            <ArrowRight size={15} />
                        </button>
                    </motion.div>
                </div>

                {/* Horizontal scroll cards */}
                <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 lg:-mx-12 lg:px-12">
                    {showcaseProjects.map((project, index) => (
                        <motion.div
                            key={project.name}
                            className="snap-center shrink-0 w-[80vw] md:w-[380px] lg:w-[420px] group"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.7, delay: index * 0.15 }}
                        >
                            {/* Image */}
                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[var(--mk-surface-2)] border border-[var(--mk-border-subtle)] group-hover:border-[rgba(212,165,116,0.15)] group-hover:shadow-[0_0_30px_rgba(212,165,116,0.06)] transition-all duration-500">
                                <Image
                                    src={project.image}
                                    alt={project.name}
                                    width={800}
                                    height={600}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {/* Info */}
                            <div className="mt-4">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-[#D4A574]/60">
                                    {project.tags.join(" · ")}
                                </p>
                                <h3 className="font-heading text-lg font-semibold text-[var(--mk-text-primary)] mt-1">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-[var(--mk-text-tertiary)]">
                                    {project.location}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
