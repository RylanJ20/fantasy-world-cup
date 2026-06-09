import Link from "next/link";
import { BallIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-28 text-center">
      <BallIcon size={56} className="text-turf-bright" />
      <p className="eyebrow mt-6">Out of play</p>
      <h1 className="mt-2 font-display text-6xl text-chalk">Off the pitch</h1>
      <p className="mt-3 text-muted">
        That page is offside — we couldn&apos;t find it.
      </p>
      <Link
        href="/"
        className="lift mt-8 rounded-xl border border-line-strong bg-surface px-5 py-2.5 text-sm font-bold text-chalk"
      >
        Back to the table
      </Link>
    </div>
  );
}
