const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { token?: string }
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (!response.ok || payload.errors?.length || !payload.data) {
    throw new Error(payload.errors?.[0]?.message ?? "GraphQL request failed");
  }

  return payload.data;
}
