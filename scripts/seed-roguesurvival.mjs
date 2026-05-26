/**
 * Crée ou publie le jeu roguesurvival dans le catalogue (Mongo Atlas).
 * Usage : node scripts/seed-roguesurvival.mjs
 * Variables : GRAPHQL_URL (défaut http://localhost:4000/graphql)
 */
const GRAPHQL_URL = process.env.GRAPHQL_URL ?? "http://localhost:4000/graphql";
const SLUG = "roguesurvival";

async function gql(query, variables = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const payload = await res.json();
  if (!res.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? `HTTP ${res.status}`);
  }
  return payload.data;
}

const REGISTER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user { id }
    }
  }
`;

const GAMES = `
  query Games {
    games { id slug status }
  }
`;

const CREATE = `
  mutation CreateGame($input: CreateGameInput!) {
    createGame(input: $input) {
      id
      slug
      status
    }
  }
`;

const UPDATE = `
  mutation UpdateGame($id: ID!, $input: UpdateGameInput!) {
    updateGame(id: $id, input: $input) {
      id
      slug
      status
    }
  }
`;

async function main() {
  const seedEmail = `seed-${SLUG}@test.com`;
  const seedPassword = "SeedRoguesurvival1!";
  const seedUsername = "seed_operator";

  let token;
  try {
    const reg = await gql(REGISTER, {
      input: { username: seedUsername, email: seedEmail, password: seedPassword },
    });
    token = reg.register.token;
    console.log("[seed] Compte seed créé.");
  } catch (registerErr) {
    const msg = registerErr.message.toLowerCase();
    if (!msg.includes("already exists")) {
      throw registerErr;
    }
    try {
      const login = await gql(
        `mutation Login($input: LoginInput!) { login(input: $input) { token } }`,
        { input: { email: seedEmail, password: seedPassword } }
      );
      token = login.login.token;
      console.log("[seed] Connexion compte seed existant.");
    } catch {
      throw new Error(
        "Compte seed déjà présent avec un autre mot de passe. Supprime l'utilisateur seed-operator dans Mongo ou change le mot de passe."
      );
    }
  }

  const { games } = await gql(GAMES, {}, token);
  const existing = games.find((g) => g.slug === SLUG);

  if (existing) {
    if (existing.status !== "published") {
      await gql(UPDATE, { id: existing.id, input: { status: "published" } }, token);
      console.log(`[seed] Jeu ${SLUG} publié (id ${existing.id}).`);
    } else {
      console.log(`[seed] Jeu ${SLUG} déjà publié (id ${existing.id}).`);
    }
    return;
  }

  const created = await gql(
    CREATE,
    {
      input: {
        slug: SLUG,
        title: "Rogue Survival",
        description:
          "Roguelike d'action WebGL : runs, skills, Xyst et progression sauvegardée sur le hub.",
        technology: "unity-webgl",
        thumbnailUrl: "http://localhost:3000/games/roguesurvival/TemplateData/unity-logo-dark.png",
        tags: ["roguelike", "survival", "unity"],
      },
    },
    token
  );

  await gql(UPDATE, { id: created.createGame.id, input: { status: "published" } }, token);
  console.log(`[seed] Jeu ${SLUG} créé et publié (id ${created.createGame.id}).`);
}

main().catch((err) => {
  console.error("[seed] Échec:", err.message);
  process.exit(1);
});
