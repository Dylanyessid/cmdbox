import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Collection } from "../../domain/models";
import { createTestDatabase, type TestDatabase } from "../../test/testDatabase";
import { NotFoundError, type CommandInput } from "../types";
import { sqliteCollectionRepository as collections } from "./collectionRepository";
import { sqliteCommandRepository as commands } from "./commandRepository";

let db: TestDatabase;
vi.mock("../../db/client", () => ({ getDb: async () => db }));

let docker: Collection;

beforeEach(async () => {
  db = createTestDatabase();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(1_000);
  docker = await collections.create("Docker");
});

afterEach(() => {
  vi.useRealTimers();
});

function input(overrides: Partial<CommandInput> = {}): CommandInput {
  return {
    collectionId: docker.id,
    name: "Container logs",
    template: "docker logs -f {{container}}",
    description: "Follow the logs of a container",
    tags: ["docker", "logs"],
    variables: [{ name: "container", defaultValue: "api", isSecret: false }],
    ...overrides,
  };
}

describe("sqliteCommandRepository", () => {
  it("creates a command and reads it back, including tags and variables", async () => {
    const created = await commands.create(input({ name: "  Container logs  " }));

    expect(created).toEqual({
      ...input(),
      id: expect.any(String),
      copyCount: 0,
      lastUsedAt: null,
      createdAt: 1_000,
      updatedAt: 1_000,
    });
    expect(await commands.list()).toEqual([created]);
  });

  it("rejects a command whose collection does not exist", async () => {
    await expect(commands.create(input({ collectionId: "missing" }))).rejects.toThrow();
  });

  it("rejects an empty name", async () => {
    await expect(commands.create(input({ name: "  " }))).rejects.toThrow();
  });

  it("lists only the commands of a collection", async () => {
    const git = await collections.create("git");
    const dockerCommand = await commands.create(input());
    await commands.create(input({ collectionId: git.id, name: "Status", template: "git status" }));

    expect(await commands.listByCollection(docker.id)).toEqual([dockerCommand]);
  });

  it("lists commands alphabetically, ignoring case", async () => {
    await commands.create(input({ name: "ps" }));
    await commands.create(input({ name: "Logs" }));

    const names = (await commands.list()).map((c) => c.name);

    expect(names).toEqual(["Logs", "ps"]);
  });

  it("updates the editable fields and keeps usage stats and creation date", async () => {
    const { id } = await commands.create(input());
    await commands.recordUse(id);
    vi.setSystemTime(2_000);

    await commands.update(id, input({ name: "Tail logs", tags: [], variables: [] }));

    expect(await commands.list()).toEqual([
      expect.objectContaining({
        id,
        name: "Tail logs",
        tags: [],
        variables: [],
        copyCount: 1,
        createdAt: 1_000,
        updatedAt: 2_000,
      }),
    ]);
  });

  it("records each use without changing updatedAt", async () => {
    const { id } = await commands.create(input());
    vi.setSystemTime(2_000);
    await commands.recordUse(id);
    vi.setSystemTime(3_000);
    await commands.recordUse(id);

    const [command] = await commands.list();

    expect(command).toMatchObject({ copyCount: 2, lastUsedAt: 3_000, updatedAt: 1_000 });
  });

  it("deletes a command", async () => {
    const { id } = await commands.create(input());

    await commands.delete(id);

    expect(await commands.list()).toEqual([]);
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(commands.update("missing", input())).rejects.toThrow(NotFoundError);
    await expect(commands.delete("missing")).rejects.toThrow(NotFoundError);
    await expect(commands.recordUse("missing")).rejects.toThrow(NotFoundError);
  });
});
