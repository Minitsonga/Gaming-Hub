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

  if (normalizedMessage.includes("username")) {
    errors.username = message;
  }
  if (normalizedMessage.includes("email")) {
    errors.email = message;
  }
  if (normalizedMessage.includes("password")) {
    errors.password = message;
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
        const nextFieldErrors = mapServerErrorToFields(message);
        setFieldErrors(nextFieldErrors);
        if (!hasFieldErrors(nextFieldErrors)) {
          setError(message);
        }
        return;
      }

      const result = payload.data?.register;
      if (!result) {
        setError("Registration failed.");
        return;
      }

      localStorage.setItem("accessToken", result.token);
      localStorage.setItem("refreshToken", result.refreshToken);
      localStorage.setItem("user", JSON.stringify(result.user));

      setSuccess("Account created successfully.");
      setUsername("");
      setEmail("");
      setPassword("");
      setFieldErrors(EMPTY_FIELD_ERRORS);
    } catch {
      setError("Unable to reach the server.");
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
