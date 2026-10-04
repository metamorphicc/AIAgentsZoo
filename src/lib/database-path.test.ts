import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getDatabasePath } from "./database-path";

describe("getDatabasePath", () => {
  it("keeps local development data in the project directory", () => {
    expect(getDatabasePath({}, "C:\\workspace\\zoo")).toBe(
      join("C:\\workspace\\zoo", "data", "zoo.db"),
    );
  });

  it("uses the writable temporary directory on Vercel", () => {
    expect(getDatabasePath({ VERCEL: "1" }, "C:\\workspace\\zoo")).toBe(
      join(tmpdir(), "ai-agent-zoo", "zoo.db"),
    );
  });

  it("does not let a local database path escape Vercel temporary storage", () => {
    expect(
      getDatabasePath(
        { DATABASE_PATH: "storage/custom.db", VERCEL: "1" },
        "C:\\workspace\\zoo",
      ),
    ).toBe(join(tmpdir(), "ai-agent-zoo", "zoo.db"));
  });

  it("allows a custom database path outside Vercel", () => {
    expect(
      getDatabasePath(
        { DATABASE_PATH: "storage/custom.db" },
        "C:\\workspace\\zoo",
      ),
    ).toBe(join("C:\\workspace\\zoo", "storage", "custom.db"));
  });
});
