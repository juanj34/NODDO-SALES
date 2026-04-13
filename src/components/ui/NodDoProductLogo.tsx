/**
 * NodDo Product Logos — Brand mark + styled product titles
 * Used in PageHeaders for NodDo Quote™, NodDo Grid™, etc.
 */

/** Brand mark icon — the gold "DO" from the NODDO wordmark, sized for the 40x40 icon box */
export function NodDoBrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="143 2 100 35"
      fill="none"
      width={size}
      height={size * 0.36}
      aria-hidden="true"
    >
      {/* D (gold) */}
      <path
        d="M173.63,6.57c3.49,0,6.37.34,8.64,1.01,2.27.67,4.05,1.59,5.35,2.75s2.2,2.49,2.73,3.97c.53,1.49.79,3.04.79,4.67s-.3,3.18-.89,4.67c-.59,1.49-1.57,2.81-2.92,3.97-1.36,1.16-3.15,2.08-5.38,2.75-2.23.67-5,1.01-8.31,1.01h-27.89V6.57h27.89ZM155.43,23.61h17.82c1.45,0,2.67-.1,3.68-.29,1.01-.19,1.81-.48,2.42-.87.61-.39,1.05-.87,1.32-1.45s.41-1.26.41-2.03-.14-1.45-.41-2.03-.71-1.07-1.32-1.45c-.61-.39-1.41-.68-2.42-.87-1.01-.19-2.23-.29-3.68-.29h-17.82v9.3Z"
        fill="#b8983c"
      />
      {/* O (gold) */}
      <path
        d="M216.13,32.14c-5.63,0-10.16-.5-13.6-1.49-3.44-.99-5.93-2.47-7.5-4.42-1.56-1.95-2.34-4.37-2.34-7.26s.78-5.31,2.34-7.26c1.56-1.95,4.06-3.42,7.5-4.42,3.43-.99,7.97-1.49,13.6-1.49s10.16.5,13.6,1.49c3.43.99,5.93,2.47,7.5,4.42,1.56,1.95,2.34,4.37,2.34,7.26s-.78,5.31-2.34,7.26c-1.56,1.95-4.06,3.42-7.5,4.42-3.43.99-7.97,1.49-13.6,1.49ZM216.13,24.78c2.66,0,4.96-.16,6.9-.48,1.94-.32,3.43-.9,4.49-1.74,1.06-.84,1.59-2.03,1.59-3.58s-.53-2.74-1.59-3.58c-1.06-.84-2.56-1.42-4.49-1.74-1.94-.32-4.24-.48-6.9-.48s-4.99.16-6.99.48c-2,.32-3.56.9-4.69,1.74-1.12.84-1.69,2.03-1.69,3.58s.56,2.74,1.69,3.58,2.69,1.42,4.69,1.74c2,.32,4.33.48,6.99.48Z"
        fill="#b8983c"
      />
    </svg>
  );
}

/** Product title: "NodDo" in white heading + product name in gold UI font + ™ */
export function NodDoProductTitle({ product }: { product: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-heading font-light text-[var(--text-primary)]">NodDo</span>
      <span className="font-ui font-bold text-[var(--site-primary)] uppercase tracking-[0.12em] text-[0.85em]">
        {product}<sup className="text-[0.55em] ml-0.5 -top-[0.6em] relative">™</sup>
      </span>
    </span>
  );
}
