import { describe, expect, it } from "vitest";
import { readJsonBody } from "./json-body";

describe("bounded JSON requests", () => {
  it("accepts valid input and rejects malformed JSON", async () => {
    expect(await readJsonBody(new Request("https://zoo.test", { method: "POST", body: '{"task":"inspect"}' }))).toEqual({ task: "inspect" });
    expect(await readJsonBody(new Request("https://zoo.test", { method: "POST", body: "{" }))).toBeNull();
  });
  it("rejects oversized input without relying on Content-Length", async () => {
    expect(await readJsonBody(new Request("https://zoo.test", { method: "POST", body: JSON.stringify({ task: "x".repeat(17_000) }) }))).toBeNull();
  });
});
