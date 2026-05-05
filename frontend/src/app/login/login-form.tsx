"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FeedbackMessage } from "../../components/feedback-message";
import { useAppPreferences } from "../../components/app-preferences";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useAppPreferences();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loggedOut = searchParams.get("loggedOut") === "1";
  const nextPath = searchParams.get("next");

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
        const serverMessage = payload.errors?.[0]?.message?.toLowerCase() ?? "";
        if (serverMessage.includes("invalid") || serverMessage.includes("credential")) {
          setError(t("Invalid email or password.", "Email ou mot de passe invalide."));
        } else {
          setError(t("Login failed.", "La connexion a echoue."));
        }
        return;
      }

      const result = payload.data?.login;
      if (!result) {
        setError(t("Login failed.", "La connexion a echoue."));
        return;
      }

      localStorage.setItem("accessToken", result.token);
      localStorage.setItem("refreshToken", result.refreshToken);
      localStorage.setItem("user", JSON.stringify(result.user));
      if (nextPath && nextPath.startsWith("/")) {
        router.push(nextPath);
      } else {
        router.push("/protected");
      }
    } catch {
      setError(t("Unable to reach the server.", "Impossible de contacter le serveur."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start px-6 py-8 sm:justify-center sm:py-12">
      <Card className="border-sky-300/20 bg-slate-950/60 shadow-[0_10px_30px_rgba(0,0,0,0.42)]">
        <CardHeader>
          <CardTitle className="space-etched text-2xl">{t("Login", "Connexion")}</CardTitle>
          <CardDescription>
            {t("Sign in with your email and password.", "Connectez-vous avec votre email et mot de passe.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loggedOut ? (
            <FeedbackMessage
              variant="info"
              message={t("You have been logged out.", "Vous avez ete deconnecte.")}
            />
          ) : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="login-email">{t("Email", "Email")}</Label>
              <Input
                id="login-email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">{t("Password", "Mot de passe")}</Label>
              <Input
                id="login-password"
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <Button
              className="w-full"
              type="submit"
              disabled={loading}
              aria-label={t("Submit login form", "Soumettre le formulaire de connexion")}
            >
              {loading ? t("Logging in...", "Connexion en cours...") : t("Login", "Connexion")}
            </Button>
          </form>

          {error ? <FeedbackMessage variant="error" message={error} /> : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t border-sky-300/15 text-sm text-muted-foreground">
          <p>
            {t("No account yet?", "Pas encore de compte ?")}{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/register">
              {t("Create one", "Creer un compte")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
