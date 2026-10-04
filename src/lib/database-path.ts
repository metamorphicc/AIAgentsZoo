import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

type DatabaseEnvironment = Partial<
  Pick<NodeJS.ProcessEnv, "DATABASE_PATH" | "VERCEL">
>;

export function getDatabasePath(
  environment: DatabaseEnvironment = {
    DATABASE_PATH: process.env.DATABASE_PATH,
    VERCEL: process.env.VERCEL,
  },
  workingDirectory = process.cwd(),
) {
  if (environment.VERCEL) {
    return join(tmpdir(), "ai-agent-zoo", "zoo.db");
  }

  if (environment.DATABASE_PATH) {
    return resolve(workingDirectory, environment.DATABASE_PATH);
  }

  return join(workingDirectory, "data", "zoo.db");
}
