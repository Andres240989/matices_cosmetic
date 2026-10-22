import type { ReactNode } from "react";

export function Section(props: { step: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">
        <span className="mr-2 text-muted">{props.step}.</span>
        {props.title}
      </h2>
      {props.children}
    </section>
  );
}
