import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-bg text-fg">
      <p className="text-6xl font-extrabold tracking-widest text-brand">404</p>
      <p className="text-sm text-muted">这一页不在茶馆里</p>
      <Link
        href="/"
        className="rounded-lg border border-line bg-card px-4 py-2 text-sm text-fg transition hover:border-brand"
      >
        回到自选
      </Link>
    </main>
  );
}
