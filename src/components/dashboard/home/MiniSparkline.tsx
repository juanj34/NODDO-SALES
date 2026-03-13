"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface Props {
  data: { bucket: string; views: number }[];
}

export function MiniSparkline({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="w-[80px] h-[28px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id="miniSparkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8973a" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#b8973a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="views"
            stroke="#b8973a"
            strokeWidth={1.5}
            fill="url(#miniSparkGradient)"
            isAnimationActive={true}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
