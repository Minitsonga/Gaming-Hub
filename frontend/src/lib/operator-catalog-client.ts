type GameInput = {
  slug: string;
  title: string;
  description: string;
  technology: "unity-webgl" | "web-native";
  thumbnailUrl: string;
  tags: string[];
};

const CREATE_GAME_MUTATION = `
  mutation CreateGame($input: CreateGameInput!) {
    createGame(input: $input) {
      id
      title
    }
  }
`;

const UPDATE_GAME_MUTATION = `
  mutation UpdateGame($id: ID!, $input: UpdateGameInput!) {
    updateGame(id: $id, input: $input) {
      id
      title
      status
    }
  }
`;

async function sendAuthorizedRequest(query: string, variables: Record<string, unknown>) {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const accessToken = localStorage.getItem("accessToken");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as { errors?: Array<{ message: string }> };
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "Operation failed.");
  }
}

export async function createGame(input: GameInput) {
  await sendAuthorizedRequest(CREATE_GAME_MUTATION, { input });
}

export async function updateGame(id: string, input: Partial<GameInput> & { status?: string }) {
  await sendAuthorizedRequest(UPDATE_GAME_MUTATION, { id, input });
}
