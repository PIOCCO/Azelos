import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export default function AboutContentCard({ title, children, action }: Props) {
  return (
    <article className="home-mission-card flex h-full flex-col">
      <h3 className="text-sm font-bold leading-snug text-navy">{title}</h3>
      <div className="mt-3 flex-1 text-sm leading-relaxed text-ink-600">{children}</div>
      {action && <div className="mt-4">{action}</div>}
    </article>
  );
}
