import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// formatPrice() and formatArea() moved to:
// - src/lib/currency.ts → formatCurrency()
// - src/lib/units.ts → formatArea()
