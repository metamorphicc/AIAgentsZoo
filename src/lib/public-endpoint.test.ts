import { expect, it } from "vitest";
import { isPublicEndpoint } from "./public-endpoint";

it("keeps public endpoints free of credentials and embedded tokens", () => {
  expect(isPublicEndpoint("https://agent.example/hook")).toBe(true);
  for (const url of ["https://user:secret@agent.example/hook", "https://agent.example?api_key=secret", "https://agent.example/#token", "javascript:alert(1)"]) {
    expect(isPublicEndpoint(url)).toBe(false);
  }
});
