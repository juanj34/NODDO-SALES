"use client";

import {
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignCenterVertical,
  AlignCenterHorizontal,
  GripHorizontal,
  GripVertical,
} from "lucide-react";
import { motion } from "framer-motion";

interface AlignmentToolbarProps {
  selectedUnits: { id: string; fachada_x: number; fachada_y: number }[];
  onAlign: (updates: { id: string; fachada_x: number; fachada_y: number }[]) => void;
}

interface AlignAction {
  icon: React.ElementType;
  label: string;
  action: (units: AlignmentToolbarProps["selectedUnits"]) => AlignmentToolbarProps["selectedUnits"];
}

const alignActions: AlignAction[] = [
  {
    icon: AlignStartVertical,
    label: "Alinear izquierda",
    action: (units) => {
      const minX = Math.min(...units.map((u) => u.fachada_x));
      return units.map((u) => ({ ...u, fachada_x: minX }));
    },
  },
  {
    icon: AlignCenterVertical,
    label: "Centrar horizontal",
    action: (units) => {
      const avgX =
        units.reduce((sum, u) => sum + u.fachada_x, 0) / units.length;
      return units.map((u) => ({ ...u, fachada_x: avgX }));
    },
  },
  {
    icon: AlignEndVertical,
    label: "Alinear derecha",
    action: (units) => {
      const maxX = Math.max(...units.map((u) => u.fachada_x));
      return units.map((u) => ({ ...u, fachada_x: maxX }));
    },
  },
  {
    icon: AlignStartHorizontal,
    label: "Alinear arriba",
    action: (units) => {
      const minY = Math.min(...units.map((u) => u.fachada_y));
      return units.map((u) => ({ ...u, fachada_y: minY }));
    },
  },
  {
    icon: AlignCenterHorizontal,
    label: "Centrar vertical",
    action: (units) => {
      const avgY =
        units.reduce((sum, u) => sum + u.fachada_y, 0) / units.length;
      return units.map((u) => ({ ...u, fachada_y: avgY }));
    },
  },
  {
    icon: AlignEndHorizontal,
    label: "Alinear abajo",
    action: (units) => {
      const maxY = Math.max(...units.map((u) => u.fachada_y));
      return units.map((u) => ({ ...u, fachada_y: maxY }));
    },
  },
  {
    icon: GripHorizontal,
    label: "Distribuir horizontalmente",
    action: (units) => {
      if (units.length < 2) return units;
      const sorted = [...units].sort((a, b) => a.fachada_x - b.fachada_x);
      const minX = sorted[0].fachada_x;
      const maxX = sorted[sorted.length - 1].fachada_x;
      const step = (maxX - minX) / (sorted.length - 1);
      return sorted.map((u, i) => ({ ...u, fachada_x: minX + step * i }));
    },
  },
  {
    icon: GripVertical,
    label: "Distribuir verticalmente",
    action: (units) => {
      if (units.length < 2) return units;
      const sorted = [...units].sort((a, b) => a.fachada_y - b.fachada_y);
      const minY = sorted[0].fachada_y;
      const maxY = sorted[sorted.length - 1].fachada_y;
      const step = (maxY - minY) / (sorted.length - 1);
      return sorted.map((u, i) => ({ ...u, fachada_y: minY + step * i }));
    },
  },
];

export function AlignmentToolbar({
  selectedUnits,
  onAlign,
}: AlignmentToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-1 px-2 py-1.5 bg-[var(--surface-2)] backdrop-blur-xl border border-[rgba(var(--site-primary-rgb),0.3)] rounded-xl shadow-lg"
    >
      {alignActions.map((action, i) => (
        <div key={action.label} className="relative group">
          {/* Separator between align and distribute groups */}
          {i === 6 && (
            <div className="absolute -left-1 top-1 bottom-1 w-px bg-[var(--border-default)]" />
          )}
          <button
            onClick={() => onAlign(action.action(selectedUnits))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--site-primary)] hover:bg-[var(--surface-2)] transition-all"
          >
            <action.icon size={15} />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
            {action.label}
          </div>
        </div>
      ))}
      <div className="ml-1 pl-2 border-l border-[var(--border-default)]">
        <span className="text-[10px] text-[var(--text-tertiary)]">
          {selectedUnits.length} sel.
        </span>
      </div>
    </motion.div>
  );
}
