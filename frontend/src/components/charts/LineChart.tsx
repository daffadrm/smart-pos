"use client";

import { useMemo, useRef, useState } from "react";

type Point = { label: string; value: number };

const BLUE = "#2a78d6";
const GRID = "#e1e0d9";
const MUTED = "#898781";

export function LineChart({
  data,
  color = BLUE,
  formatValue = (v: number) => String(v),
}: {
  data: Point[];
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const width = 640;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 48 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const niceMax = useMemo(() => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue || 1)));
    return Math.ceil((maxValue || 1) / magnitude) * magnitude;
  }, [maxValue]);

  const xFor = (i: number) => padding.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yFor = (v: number) => padding.top + plotH - (v / niceMax) * plotH;

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(d.value)}`).join(" ");

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (data.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let best = Infinity;
    data.forEach((_, i) => {
      const dist = Math.abs(xFor(i) - relX);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  if (data.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-gray-400">Belum ada data</div>;
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((t) => {
          const y = padding.top + plotH - t * plotH;
          return (
            <g key={t}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill={MUTED}>
                {Math.round(niceMax * t).toLocaleString("id-ID")}
              </text>
            </g>
          );
        })}

        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) => (
          <circle
            key={i}
            cx={xFor(i)}
            cy={yFor(d.value)}
            r={hoverIndex === i ? 5 : 4}
            fill={color}
            stroke="#fcfcfb"
            strokeWidth={2}
          />
        ))}

        {hoverIndex !== null && (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={padding.top}
            y2={padding.top + plotH}
            stroke={MUTED}
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        )}

        {data.map((d, i) => {
          if (data.length > 14 && i % Math.ceil(data.length / 7) !== 0) return null;
          return (
            <text key={i} x={xFor(i)} y={height - 6} textAnchor="middle" fontSize={10} fill={MUTED}>
              {d.label}
            </text>
          );
        })}
      </svg>

      {hovered && hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${(xFor(hoverIndex) / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="font-semibold text-gray-900">{formatValue(hovered.value)}</p>
          <p className="text-gray-500">{hovered.label}</p>
        </div>
      )}
    </div>
  );
}
