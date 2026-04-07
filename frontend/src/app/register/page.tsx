"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

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

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

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
        setError(payload.errors?.[0]?.message ?? "Registration failed.");
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
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <h1 className="mb-6 text-2xl font-semibold">Create an account</h1>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Username</span>
          <input
            required
            minLength={3}
            className="rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Email</span>
          <input
            required
            type="email"
            className="rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Password</span>
          <input
            required
            type="password"
            minLength={6}
            className="rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          type="submit"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-4 text-sm text-green-600" role="status" aria-live="polite">
          {success}
        </p>
      ) : null}

      <p className="mt-6 text-sm">
        Already registered?{" "}
        <Link className="underline" href="/">
          Go back home
        </Link>
      </p>
    </main>
  );
}
