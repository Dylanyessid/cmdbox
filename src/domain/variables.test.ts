import { describe, expect, it } from "vitest";
import { extractVariables, findMissingVariables, interpolate } from "./variables";

describe("extractVariables", () => {
  it("returns variables in order of first appearance, without duplicates", () => {
    expect(extractVariables("ssh {{user}}@{{host}} -p {{port}} # {{host}}")).toEqual([
      "user",
      "host",
      "port",
    ]);
  });

  it("allows spaces inside the braces", () => {
    expect(extractVariables("docker logs -f {{ container }}")).toEqual(["container"]);
  });

  it("accepts letters, digits, underscores and hyphens in names", () => {
    expect(extractVariables("{{db_host}} {{api-key}} {{env2}} {{_tmp}}")).toEqual([
      "db_host",
      "api-key",
      "env2",
      "_tmp",
    ]);
  });

  it("ignores placeholders that are not valid names", () => {
    expect(extractVariables("{{}} {{ 1abc }} {{a b}} {{-x}}")).toEqual([]);
  });

  it("ignores Go templates used by docker and kubectl", () => {
    expect(extractVariables("docker ps --format '{{.Names}}\\t{{ .Status }}'")).toEqual([]);
  });

  it("detects Go template keywords that look like names (known limitation)", () => {
    expect(
      extractVariables("kubectl get pods -o go-template='{{range .items}}{{.metadata.name}}{{end}}'"),
    ).toEqual(["end"]);
  });

  it("returns an empty list when there are no variables", () => {
    expect(extractVariables("git status")).toEqual([]);
  });
});

describe("interpolate", () => {
  it("replaces each variable with its value", () => {
    expect(interpolate("docker logs -f {{container}}", { container: "api" })).toBe(
      "docker logs -f api",
    );
  });

  it("replaces every occurrence of a repeated variable", () => {
    expect(interpolate("{{host}}:5432 -> {{ host }}", { host: "db" })).toBe("db:5432 -> db");
  });

  it("leaves variables without a value untouched", () => {
    expect(interpolate("ssh {{user}}@{{host}}", { user: "root" })).toBe("ssh root@{{host}}");
  });

  it("replaces a variable with an empty value", () => {
    expect(interpolate("ls {{flags}}", { flags: "" })).toBe("ls ");
  });

  it("leaves Go templates untouched", () => {
    expect(interpolate("docker ps --format '{{.Names}}' -f name={{name}}", { name: "api" })).toBe(
      "docker ps --format '{{.Names}}' -f name=api",
    );
  });

  it("inserts values literally, even if they contain $ patterns", () => {
    expect(interpolate("echo {{text}}", { text: "$HOME $1 $& $$" })).toBe("echo $HOME $1 $& $$");
  });

  it("does not interpolate values again", () => {
    expect(interpolate("{{a}}", { a: "{{b}}", b: "x" })).toBe("{{b}}");
  });

  it("ignores properties inherited from Object", () => {
    expect(interpolate("{{constructor}} {{toString}}", {})).toBe("{{constructor}} {{toString}}");
  });
});

describe("findMissingVariables", () => {
  it("returns the variables without a value", () => {
    expect(findMissingVariables("ssh {{user}}@{{host}}", { user: "root" })).toEqual(["host"]);
  });

  it("treats an empty value as missing", () => {
    expect(findMissingVariables("ssh {{user}}@{{host}}", { user: "", host: "x" })).toEqual([
      "user",
    ]);
  });

  it("lists a repeated variable only once", () => {
    expect(findMissingVariables("{{host}}:5432 -> {{host}}", {})).toEqual(["host"]);
  });

  it("returns an empty list when every variable has a value", () => {
    expect(findMissingVariables("ssh {{user}}@{{host}}", { user: "root", host: "db" })).toEqual(
      [],
    );
  });

  it("returns an empty list when there are no variables", () => {
    expect(findMissingVariables("git status", {})).toEqual([]);
  });

  it("ignores properties inherited from Object", () => {
    expect(findMissingVariables("{{constructor}}", {})).toEqual(["constructor"]);
    expect(findMissingVariables("{{constructor}}", { other: "x" })).toEqual(["constructor"]);
  });
});
