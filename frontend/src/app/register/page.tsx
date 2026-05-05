"use client";

import { useState, type FormEventHandler } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type RegisterResponse = {
  data?: {
    register: {
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

type RegisterFieldErrors = {
  username: string | null;
  email: string | null;
  password: string | null;
};

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
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

const EMPTY_FIELD_ERRORS: RegisterFieldErrors = {
  username: null,
  email: null,
  password: null,
};

function validateRegisterForm(
  username: string,
  email: string,
  password: string
): RegisterFieldErrors {
  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();
  const errors: RegisterFieldErrors = { ...EMPTY_FIELD_ERRORS };

  if (trimmedUsername.length < 3) {
    errors.username = "Username must have at least 3 characters.";
  }
  if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
    errors.email = "Please enter a valid email address.";
  }
  if (password.length < 6) {
    errors.password = "Password must have at least 6 characters.";
  }

  return errors;
}

function hasFieldErrors(errors: RegisterFieldErrors): boolean {
  return Boolean(errors.username || errors.email || errors.password);
}

function mapServerErrorToFields(message: string): RegisterFieldErrors {
  const normalizedMessage = message.toLowerCase();
  const errors: RegisterFieldErrors = { ...EMPTY_FIELD_ERRORS };

  if (normalizedMessage.includes("username already exists")) {
    errors.username = "Username is already taken.";
  } else if (normalizedMessage.includes("username")) {
    errors.username = "Please check your username.";
  }
  if (normalizedMessage.includes("email already exists")) {
    errors.email = "Email is already used.";
  } else if (normalizedMessage.includes("email")) {
    errors.email = "Please check your email address.";
  }
  if (normalizedMessage.includes("password")) {
    errors.password = "Please check your password.";
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useAppPreferences();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>(EMPTY_FIELD_ERRORS);

  function localizeFieldErrors(errors: RegisterFieldErrors): RegisterFieldErrors {
    return {
      username:
        errors.username === "Username is already taken."
          ? t("Username is already taken.", "Ce nom d'utilisateur est deja pris.")
          : errors.username === "Please check your username."
            ? t("Please check your username.", "Veuillez verifier votre nom d'utilisateur.")
            : null,
      email:
        errors.email === "Email is already used."
          ? t("Email is already used.", "Cet email est deja utilise.")
          : errors.email === "Please check your email address."
            ? t("Please check your email address.", "Veuillez verifier votre adresse email.")
            : null,
      password: errors.password
        ? t("Please check your password.", "Veuillez verifier votre mot de passe.")
        : null,
    };
  }

  function getSafeServerError(message: string): string {
    const normalizedMessage = message.toLowerCase();
    const internalMarkers = ["cannot read properties", "stack", "internal", "kind", "typeerror"];
    if (internalMarkers.some((marker) => normalizedMessage.includes(marker))) {
      return t(
        "Something went wrong on our side. Please try again.",
        "Une erreur interne est survenue. Veuillez reessayer."
      );
    }

    if (normalizedMessage.includes("registration failed")) {
      return t("Registration failed. Please try again.", "L'inscription a echoue. Veuillez reessayer.");
    }

    return t("Unable to create account with provided data.", "Impossible de creer le compte avec les donnees fournies.");
  }

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const localValidationErrors = validateRegisterForm(username, email, password);
    setFieldErrors(localValidationErrors);
    if (hasFieldErrors(localValidationErrors)) {
      setLoading(false);
      return;
    }

    try {
      const endpoint =
        process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: REGISTER_MUTATION,
          variables: {
            input: { username, email, password },
          },
        }),
      });

      const payload = (await response.json()) as RegisterResponse;

      if (!response.ok || payload.errors?.length) {
        const message = payload.errors?.[0]?.message ?? "Registration failed.";
        const nextFieldErrors = localizeFieldErrors(mapServerErrorToFields(message));
        setFieldErrors(nextFieldErrors);
        if (!hasFieldErrors(nextFieldErrors)) {
          setError(getSafeServerError(message));
        }
        return;
      }

      const result = payload.data?.register;
      if (!result) {
        setError(t("Registration failed. Please try again.", "L'inscription a echoue. Veuillez reessayer."));
        return;
      }

      localStorage.setItem("accessToken", result.token);
      localStorage.setItem("refreshToken", result.refreshToken);
      localStorage.setItem("user", JSON.stringify(result.user));
      const nextPath = new URLSearchParams(window.location.search).get("next");
      if (nextPath && nextPath.startsWith("/")) {
        router.replace(nextPath);
      } else {
        router.replace("/protected");
      }
    } catch {
      setError(t("Unable to reach the server.", "Impossible de contacter le serveur."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start px-6 py-8 sm:justify-center sm:py-12">
      <Card className="border-sky-300/20 bg-slate-950/60 shadow-[0_10px_30px_rgba(0,0,0,0.42)]">
        <CardHeader>
          <CardTitle className="space-etched text-2xl">{t("Create an account", "Creer un compte")}</CardTitle>
          <CardDescription>
            {t("Choose a username, email and password.", "Choisissez un nom d'utilisateur, un email et un mot de passe.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="register-username">{t("Username", "Nom d'utilisateur")}</Label>
              <Input
                id="register-username"
                required
                minLength={3}
                value={username}
                aria-invalid={Boolean(fieldErrors.username)}
                onChange={(event) => {
                  setUsername(event.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((previousErrors) => ({ ...previousErrors, username: null }));
                  }
                }}
              />
              {fieldErrors.username ? (
                <p className="text-sm text-destructive" role="alert">
                  {fieldErrors.username}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">{t("Email", "Email")}</Label>
              <Input
                id="register-email"
                required
                type="email"
                value={email}
                aria-invalid={Boolean(fieldErrors.email)}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((previousErrors) => ({ ...previousErrors, email: null }));
                  }
                }}
              />
              {fieldErrors.email ? (
                <p className="text-sm text-destructive" role="alert">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">{t("Password", "Mot de passe")}</Label>
              <Input
                id="register-password"
                required
                type="password"
                minLength={6}
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((previousErrors) => ({ ...previousErrors, password: null }));
                  }
                }}
              />
              {fieldErrors.password ? (
                <p className="text-sm text-destructive" role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <Button
              className="w-full"
              type="submit"
              disabled={loading}
              aria-label={t("Submit registration form", "Soumettre le formulaire d'inscription")}
            >
              {loading
                ? t("Creating account...", "Creation du compte...")
                : t("Register", "Inscription")}
            </Button>
          </form>

          {error ? <FeedbackMessage variant="error" message={error} /> : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t border-sky-300/15 text-sm text-muted-foreground">
          <p>
            {t("Already registered?", "Deja inscrit ?")}{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/">
              {t("Go back home", "Retour a l'accueil")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
