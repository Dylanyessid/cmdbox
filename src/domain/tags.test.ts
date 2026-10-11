import { describe, expect, it } from "vitest";
import { MAX_TAG_LENGTH, addTags, parseTags } from "./tags";

describe("parseTags", () => {
  it("splits on commas and trims each tag", () => {
    expect(parseTags(" docker,  logs ,k8s")).toEqual(["docker", "logs", "k8s"]);
  });

  it("drops empty tags", () => {
    expect(parseTags(",, docker ,  ,")).toEqual(["docker"]);
    expect(parseTags("   ")).toEqual([]);
  });

  it("truncates tags longer than the limit", () => {
    const [tag] = parseTags("a".repeat(MAX_TAG_LENGTH + 10));

    expect(tag).toHaveLength(MAX_TAG_LENGTH);
  });
});

describe("addTags", () => {
  it("appends new tags in order", () => {
    expect(addTags(["docker"], ["logs", "k8s"])).toEqual(["docker", "logs", "k8s"]);
  });

  it("skips tags that already exist, ignoring case", () => {
    expect(addTags(["Docker"], ["docker", "logs", "LOGS"])).toEqual(["Docker", "logs"]);
  });

  it("does not modify the original list", () => {
    const current = ["docker"];

    addTags(current, ["logs"]);

    expect(current).toEqual(["docker"]);
  });
});
