import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, type TestDatabase } from "../../test/testDatabase";
import { NotFoundError } from "../types";
import { sqliteCollectionRepository as collections } from "./collectionRepository";
import { sqliteCommandRepository as commands } from "./commandRepository";

let db: TestDatabase;
vi.mock("../../db/client", () => ({ getDb: async () => db }));

beforeEach(() => {
  db = createTestDatabase();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(1_000);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sqliteCollectionRepository", () => {
  it("creates a collection with a trimmed name and timestamps", async () => {
    const created = await collections.create("  Docker  ");

    expect(created).toEqual({
      id: expect.any(String),
      name: "Docker",
      createdAt: 1_000,
      updatedAt: 1_000,
    });
    expect(await collections.list()).toEqual([created]);
  });

  it("rejects an empty name", async () => {
    await expect(collections.create("   ")).rejects.toThrow();
  });

  it("lists collections alphabetically, ignoring case", async () => {
    await collections.create("git");
    await collections.create("Docker");
    await collections.create("kubectl");

    const names = (await collections.list()).map((c) => c.name);

    expect(names).toEqual(["Docker", "git", "kubectl"]);
  });

  it("renames a collection and updates its timestamp", async () => {
    const { id } = await collections.create("Dokcer");
    vi.setSystemTime(2_000);

    await collections.rename(id, " Docker ");

    expect(await collections.list()).toEqual([
      { id, name: "Docker", createdAt: 1_000, updatedAt: 2_000 },
    ]);
  });

  it("deletes a collection together with its commands", async () => {
    const docker = await collections.create("Docker");
    const git = await collections.create("git");
    await commands.create({ ...commandInput, collectionId: docker.id });
    const gitCommand = await commands.create({ ...commandInput, collectionId: git.id });

    await collections.delete(docker.id);

    expect(await collections.list()).toEqual([git]);
    expect(await commands.list()).toEqual([gitCommand]);
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(collections.rename("missing", "x")).rejects.toThrow(NotFoundError);
    await expect(collections.delete("missing")).rejects.toThrow(NotFoundError);
  });
});

const commandInput = {
  name: "List containers",
  template: "docker ps",
  description: "",
  tags: [],
  variables: [],
};
