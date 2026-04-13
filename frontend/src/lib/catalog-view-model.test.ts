import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterAndSortGames, paginateGames } from "./catalog-view-model";

const games = [
  {
    id: "1",
    slug: "zeta",
    title: "Zeta Quest",
    description: "desc",
    thumbnailUrl: "https://example.com/zeta.png",
    technology: "Unity",
    status: "published",
    tags: ["rpg"],
  },
  {
    id: "2",
    slug: "alpha",
    title: "Alpha Run",
    description: "desc",
    thumbnailUrl: "https://example.com/alpha.png",
    technology: "Unity",
    status: "published",
    tags: ["arcade"],
  },
];

describe("catalog view model", () => {
  it("filters and sorts games", () => {
    const result = filterAndSortGames(games, "run", "title-asc");
    assert.equal(result.length, 1);
    assert.equal(result[0].title, "Alpha Run");
  });

  it("paginates games", () => {
    const result = paginateGames(games, 2, 1);
    assert.equal(result.length, 1);
    assert.equal(result[0].title, "Alpha Run");
  });
});
