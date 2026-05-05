import { Suspense } from "react";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start px-6 py-8 sm:justify-center sm:py-12">
      <p className="text-zinc-600" role="status">
        Chargement…
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
