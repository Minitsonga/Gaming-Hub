"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FeedbackMessage } from "../../components/feedback-message";
import { useAppPreferences } from "../../components/app-preferences";

type LoginResponse = {
  data?: {
    login: {
      token: string;
      refreshToken: string;
      user: {
        id: string;
        username: string;
        email: string;
      };
    };
  };
  errors?: Array<{ message: string }>;
};

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      refreshToken
      user {
        id
        username
        email
      }
    }
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useAppPreferences();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loggedOut = searchParams.get("loggedOut") === "1";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint =
        process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: LOGIN_MUTATION,
          variables: {
            input: { email, password },
          },
        }),
      });

      const payload = (await response.json()) as LoginResponse;
      if (!response.ok || payload.errors?.length) {
        setError(payload.errors?.[0]?.message ?? "Login failed.");
        return;
      }

      const result = payload.data?.login;
      if (!result) {
        setError("Login failed.");
        return;
      }

      localStorage.setItem("accessToken", result.token);
      localStorage.setItem("refreshToken", result.refreshToken);
      localStorage.setItem("user", JSON.stringify(result.user));
      router.push("/protected");
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t("Login", "Connexion")}</h1>

      {loggedOut ? (
        <FeedbackMessage
          variant="info"
          message={t("You have been logged out.", "Vous avez ete deconnecte.")}
        />
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t("Email", "Email")}</span>
          <input
            required
            type="email"
            className="rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">{t("Password", "Mot de passe")}</span>
          <input
            required
            type="password"
            className="rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-200 dark:text-black"
          type="submit"
          aria-label={t("Submit login form", "Soumettre le formulaire de connexion")}
        >
          {loading ? t("Logging in...", "Connexion en cours...") : t("Login", "Connexion")}
        </button>
      </form>

      {error ? (
        <FeedbackMessage variant="error" message={error} />
      ) : null}

      <p className="mt-6 text-sm">
        {t("No account yet?", "Pas encore de compte ?")}{" "}
        <Link className="underline" href="/register">
          {t("Create one", "Creer un compte")}
        </Link>
      </p>
    </main>
  );
}
