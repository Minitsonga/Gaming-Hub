import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold">Gaming Hub Frontend</h1>
      <p className="text-zinc-600">
        Frontend initialized. Continue with authentication flow.
      </p>
      <div className="flex gap-3">
        <Link className="rounded bg-black px-4 py-2 text-white" href="/register">
          Create account
        </Link>
        <Link className="rounded border px-4 py-2" href="/login">
          Login
        </Link>
      </div>
    </main>
  );
}
