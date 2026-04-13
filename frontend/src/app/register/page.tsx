"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { FeedbackMessage } from "../../components/feedback-message";
import { useAppPreferences } from "../../components/app-preferences";

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
  const { t } = useAppPreferences();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccess(null);
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

      setSuccess(t("Account created successfully.", "Compte cree avec succes."));
      setUsername("");
      setEmail("");
      setPassword("");
      setFieldErrors(EMPTY_FIELD_ERRORS);
    } catch {
      setError(t("Unable to reach the server.", "Impossible de contacter le serveur."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t("Create an account", "Creer un compte")}</h1>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t("Username", "Nom d'utilisateur")}</span>
          <input
            required
            minLength={3}
            className="rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (fieldErrors.username) {
                setFieldErrors((previousErrors) => ({ ...previousErrors, username: null }));
              }
            }}
          />
          {fieldErrors.username ? (
            <span className="text-sm text-red-600" role="alert">
              {fieldErrors.username}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">{t("Email", "Email")}</span>
          <input
            required
            type="email"
            className="rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (fieldErrors.email) {
                setFieldErrors((previousErrors) => ({ ...previousErrors, email: null }));
              }
            }}
          />
          {fieldErrors.email ? (
            <span className="text-sm text-red-600" role="alert">
              {fieldErrors.email}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">{t("Password", "Mot de passe")}</span>
          <input
            required
            type="password"
            minLength={6}
            className="rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (fieldErrors.password) {
                setFieldErrors((previousErrors) => ({ ...previousErrors, password: null }));
              }
            }}
          />
          {fieldErrors.password ? (
            <span className="text-sm text-red-600" role="alert">
              {fieldErrors.password}
            </span>
          ) : null}
        </label>

        <button
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-200 dark:text-black"
          type="submit"
          aria-label={t("Submit registration form", "Soumettre le formulaire d'inscription")}
        >
          {loading
            ? t("Creating account...", "Creation du compte...")
            : t("Register", "Inscription")}
        </button>
      </form>

      {error ? <FeedbackMessage variant="error" message={error} /> : null}
      {success ? <FeedbackMessage variant="success" message={success} /> : null}

      <p className="mt-6 text-sm">
        {t("Already registered?", "Deja inscrit ?")}{" "}
        <Link className="underline" href="/">
          {t("Go back home", "Retour a l'accueil")}
        </Link>
      </p>
    </main>
  );
}
