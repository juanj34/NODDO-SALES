"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   Audio Context
   ------------------------------------------------------------------ */
interface AudioContextValue {
  isMuted: boolean;
  toggleMute: () => void;
  hasAudio: boolean;
}

const AudioCtx = createContext<AudioContextValue>({
  isMuted: true,
  toggleMute: () => {},
  hasAudio: false,
});

export function useAudio() {
  return useContext(AudioCtx);
}

/* ------------------------------------------------------------------
   Audio Provider
   ------------------------------------------------------------------ */
interface AudioProviderProps {
  audioUrl: string | null | undefined;
  children: ReactNode;
}

const STORAGE_KEY = "noddo-audio-muted";

export function AudioProvider({ audioUrl, children }: AudioProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize from localStorage
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });

  const hasAudio = !!audioUrl;

  // Create audio element once
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.3;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Listen for preloader-done event to auto-unmute
  useEffect(() => {
    if (!audioUrl) return;

    const handler = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Only auto-unmute if user hasn't explicitly muted before
      if (stored !== "true") {
        setIsMuted(false);
        audioRef.current?.play().catch(() => {});
      }
    };

    window.addEventListener("preloader-done", handler);
    return () => window.removeEventListener("preloader-done", handler);
  }, [audioUrl]);

  // Sync mute state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        // Browser blocked autoplay — stay muted
        setIsMuted(true);
      });
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <AudioCtx.Provider value={{ isMuted, toggleMute, hasAudio }}>
      {children}
    </AudioCtx.Provider>
  );
}

/* ------------------------------------------------------------------
   Mute Toggle Button (used in landing + sidebar)
   ------------------------------------------------------------------ */
interface AudioMuteButtonProps {
  className?: string;
  size?: number;
}

export function AudioMuteButton({ className, size = 16 }: AudioMuteButtonProps) {
  const { isMuted, toggleMute, hasAudio } = useAudio();

  if (!hasAudio) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={toggleMute}
        className={cn(
          "w-9 h-9 glass rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer",
          !isMuted && "ring-1 ring-[rgba(var(--site-primary-rgb),0.3)]",
          className
        )}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={size} /> : <Volume2 size={size} />}
      </motion.button>
    </AnimatePresence>
  );
}
