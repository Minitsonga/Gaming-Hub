const REFRESH_MUTATION = `
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
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

type GraphQLBody = {
  query: string;
  variables?: Record<string, unknown>;
};

function getEndpoint(): string {
  return process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
}

function isAuthError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("unauthorized") ||
    m.includes("invalid token") ||
    m.includes("jwt") ||
    m.includes("not authenticated") ||
    m.includes("forbidden")
  );
}

async function refreshSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  try {
    const response = await fetch(getEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: REFRESH_MUTATION,
        variables: { input: { refreshToken } },
      }),
    });
    const payload = (await response.json()) as {
      data?: {
        refreshToken: { token: string; refreshToken: string; user: unknown };
      };
      errors?: Array<{ message: string }>;
    };
    if (!response.ok || payload.errors?.length || !payload.data?.refreshToken) {
      return false;
    }
    const next = payload.data.refreshToken;
    localStorage.setItem("accessToken", next.token);
    localStorage.setItem("refreshToken", next.refreshToken);
    localStorage.setItem("user", JSON.stringify(next.user));
    return true;
  } catch {
    return false;
  }
}

/**
 * POST GraphQL au gateway. Si `withAuth`, envoie Bearer et tente un refresh + une relance sur erreur d’auth.
 */
export async function graphqlFetch<T = unknown>(
  body: GraphQLBody,
  options: { withAuth?: boolean; signal?: AbortSignal } = {}
): Promise<{ ok: boolean; status: number; data?: T; errors?: Array<{ message: string }> }> {
  const { withAuth = false, signal } = options;
  const endpoint = getEndpoint();

  async function once(accessToken: string | null): Promise<{
    ok: boolean;
    status: number;
    data?: T;
    errors?: Array<{ message: string }>;
  }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (withAuth && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });
    const payload = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string }>;
    };
    return {
      ok: response.ok && !payload.errors?.length,
      status: response.status,
      data: payload.data,
      errors: payload.errors,
    };
  }

  let accessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  let result = await once(accessToken);

  if (
    withAuth &&
    typeof window !== "undefined" &&
    result.errors?.length &&
    result.errors.some((e) => isAuthError(e.message))
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      accessToken = localStorage.getItem("accessToken");
      result = await once(accessToken);
    }
  }

  return result;
}
