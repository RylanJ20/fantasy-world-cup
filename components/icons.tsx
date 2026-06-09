import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & { size?: number };

function base({ size = 20, strokeWidth = 1.7, ...props }: IconProps & { strokeWidth?: number }) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

/** Stitched soccer ball — the wordmark glyph. */
export function BallIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth: 1.5, ...props })}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2 8.6 9.7l1.3 4h4.2l1.3-4L12 7.2Z" />
      <path d="M12 3v2.6M5 9.4l2.4 1.4M5.6 17.2l2.3-1.7M18.4 17.2l-2.3-1.7M19 9.4l-2.4 1.4M9.5 19.6l.6-2.3m3.8 2.3-.6-2.3" />
    </svg>
  );
}

export function TrophyIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4.5A2.5 2.5 0 0 0 7 9.5M17 6h2.5A2.5 2.5 0 0 1 17 9.5" />
      <path d="M12 13v3m-3 4h6m-5 0 .5-3.2h3L14 20" />
    </svg>
  );
}

export function CrownIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="m3 7 3.5 3L12 4l5.5 6L21 7l-1.6 11H4.6L3 7Z" />
      <path d="M4.6 18h14.8" />
    </svg>
  );
}

export function BootIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M3 8h6l3 3.5c2.2.4 4.2 1.1 6 2.3 1.6 1.1 3 2.2 3 3.7v1.5H4.5L3 17V8Z" />
      <path d="M3 11h5.5M6 19v2M10 19v2M14 19.2v1.8M18 19.4v1.6" />
    </svg>
  );
}

export function GloveIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M7 21V10a1.6 1.6 0 0 1 3.2 0V8.5a1.6 1.6 0 0 1 3.2 0V9a1.6 1.6 0 0 1 3.2 0v6a6 6 0 0 1-6 6H7Z" />
      <path d="M7 13H5.4A1.4 1.4 0 0 1 4 11.6V9.4A1.4 1.4 0 0 1 7 9" />
    </svg>
  );
}

export function ShieldIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M12 3 5 5.5V11c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9V5.5L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function TargetIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhistleIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })}>
      <path d="M3 12a5 5 0 0 0 5 5h4l6-2.5V9.5a3 3 0 0 0-3-3H8a5 5 0 0 0-5 5Z" />
      <circle cx="8" cy="12" r="2" />
      <path d="M14 6.5 15 4" />
    </svg>
  );
}

export function StarIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth: 1.5, ...props })}>
      <path d="m12 4 2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 16.8l-4.6 2.3.9-5.2L4.5 9.5l5.2-.7L12 4Z" />
    </svg>
  );
}

export function ChevronRight({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth: 2, ...props })}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ArrowLeft({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth: 2, ...props })}>
      <path d="M19 12H5m6-7-7 7 7 7" />
    </svg>
  );
}

export function NetIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth: 1.4, ...props })}>
      <path d="M4 6h16v12H4V6Z" />
      <path d="M8 6v12M12 6v12M16 6v12M4 10h16M4 14h16" />
    </svg>
  );
}

export function MenuIcon({ size = 22, ...props }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth: 2, ...props })}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function XIcon({ size = 22, ...props }: IconProps) {
  return (
    <svg {...base({ size, strokeWidth: 2, ...props })}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
