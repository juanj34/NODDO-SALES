"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, FolderOpen, LogOut, Settings, Users, BarChart3, ToggleLeft, Calculator, FileText, ContactRound, CircleDollarSign } from "lucide-react";
import { useTranslation } from "@/i18n";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { t } = useTranslation("dashboard");

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setOpen(false)} />

            <div className="relative w-full max-w-2xl bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-xl shadow-2xl overflow-hidden glass-panel animate-fade-in">
                <Command label="Global Command Menu">
                    {/* Search Input */}
                    <div className="flex items-center px-4 border-b border-[var(--border-subtle)]">
                        <Search className="text-[var(--text-tertiary)] shrink-0 mr-3" size={20} />
                        <Command.Input
                            placeholder={t("commandPalette.searchPlaceholder")}
                            className="flex-1 bg-transparent py-4 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none text-base"
                            autoFocus
                        />
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-[var(--surface-3)] rounded text-xs text-[var(--text-tertiary)]">ESC</kbd>
                        </div>
                    </div>

                    {/* Results List */}
                    <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
                        <Command.Empty className="py-6 text-center text-sm text-[var(--text-tertiary)]">
                            {t("commandPalette.noResults")}
                        </Command.Empty>

                        <Command.Group heading={t("commandPalette.navigation")} className="px-2 py-3 font-ui text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider uppercase">
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/proyectos"))}
                                className="flex items-center px-4 py-3 mt-1 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white cursor-pointer transition-colors aria-selected:bg-[var(--surface-3)] aria-selected:text-white"
                            >
                                <FolderOpen className="mr-3 shrink-0" size={16} />
                                {t("commandPalette.viewAllProjects")}
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/leads"))}
                                className="flex items-center px-4 py-3 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white cursor-pointer transition-colors aria-selected:bg-[var(--surface-3)] aria-selected:text-white"
                            >
                                <ContactRound className="mr-3 shrink-0" size={16} />
                                Leads
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/analytics"))}
                                className="flex items-center px-4 py-3 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white cursor-pointer transition-colors aria-selected:bg-[var(--surface-3)] aria-selected:text-white"
                            >
                                <BarChart3 className="mr-3 shrink-0" size={16} />
                                Analytics
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/financiero"))}
                                className="flex items-center px-4 py-3 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white cursor-pointer transition-colors aria-selected:bg-[var(--surface-3)] aria-selected:text-white"
                            >
                                <CircleDollarSign className="mr-3 shrink-0" size={16} />
                                Financiero
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/disponibilidad"))}
                                className="flex items-center px-4 py-3 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white cursor-pointer transition-colors aria-selected:bg-[var(--surface-3)] aria-selected:text-white"
                            >
                                <ToggleLeft className="mr-3 shrink-0" size={16} />
                                Disponibilidad
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/cotizador"))}
                                className="flex items-center px-4 py-3 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white cursor-pointer transition-colors aria-selected:bg-[var(--surface-3)] aria-selected:text-white"
                            >
                                <Calculator className="mr-3 shrink-0" size={16} />
                                Cotizador
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/cotizaciones"))}
                                className="flex items-center px-4 py-3 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white cursor-pointer transition-colors aria-selected:bg-[var(--surface-3)] aria-selected:text-white"
                            >
                                <FileText className="mr-3 shrink-0" size={16} />
                                Cotizaciones
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/equipo"))}
                                className="flex items-center px-4 py-3 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white cursor-pointer transition-colors aria-selected:bg-[var(--surface-3)] aria-selected:text-white"
                            >
                                <Users className="mr-3 shrink-0" size={16} />
                                Equipo
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/cuenta"))}
                                className="flex items-center px-4 py-3 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-white cursor-pointer transition-colors aria-selected:bg-[var(--surface-3)] aria-selected:text-white"
                            >
                                <Settings className="mr-3 shrink-0" size={16} />
                                {t("commandPalette.accountSettings")}
                            </Command.Item>
                        </Command.Group>

                        <Command.Separator className="h-px bg-[var(--border-subtle)] my-2 mx-2" />

                        <Command.Group heading={t("commandPalette.actions")} className="px-2 py-3 font-ui text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider uppercase">
                            <Command.Item
                                onSelect={() => runCommand(() => {
                                    router.push("/login");
                                })}
                                className="flex items-center px-4 py-3 mt-1 rounded-lg text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 cursor-pointer transition-colors aria-selected:bg-red-500/10 aria-selected:text-red-400"
                            >
                                <LogOut className="mr-3 shrink-0" size={16} />
                                {t("commandPalette.logout")}
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}
