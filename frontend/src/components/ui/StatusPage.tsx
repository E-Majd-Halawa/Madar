import type { ReactNode } from 'react';

interface StatusPageProps {
  title: string;
  body: string;
  actions: ReactNode;
  code?: string;
}

/** Shared layout for 403, 404 and error screens. */
export function StatusPage({ title, body, actions, code }: StatusPageProps) {
  return (
    <main className="bg-ambient grid min-h-dvh place-items-center px-6">
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
        {code && <p className="text-5xl font-semibold tracking-tight text-accent">{code}</p>}
        <h1 className="mt-3 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>
      </div>
    </main>
  );
}
