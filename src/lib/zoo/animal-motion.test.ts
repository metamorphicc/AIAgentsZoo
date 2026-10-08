import { expect, it } from "vitest";
import { animalMotion, owlLidScale } from "./animal-motion";

it("moves species joints over time instead of replaying identical exported poses", () => {
  expect(animalMotion("raven", "Scan", 0.5, 1).headY).not.toBe(animalMotion("raven", "Scan", 1.25, 1).headY);
  expect(animalMotion("owl", "Look Around", 1, 1).headY).toBeGreaterThan(0.5);
  expect(animalMotion("beaver", "Gnaw", 0.5, 1).jaw).toBeGreaterThan(0);
  expect(animalMotion("meerkat", "Lookout", 1, 1).headY).toBeGreaterThan(0.4);
});

it("eases behavior back into the idle pose", () => {
  expect(animalMotion("raven", "Scan", 3.2, 2)).toEqual(animalMotion("raven", "Idle", 0, 2));
});

it("keeps owl eyes unobstructed in idle and closes both lids during a blink", () => {
  expect(owlLidScale(animalMotion("owl", "Idle", 0, 1).blink)).toBe(0.015);
  expect(owlLidScale(animalMotion("owl", "Blink", 0.45, 1).blink)).toBe(1);
  expect(owlLidScale(animalMotion("owl", "Blink", 1, 1).blink)).toBe(0.015);
  expect(owlLidScale(-1)).toBe(0.015);
  expect(owlLidScale(2)).toBe(1);
});
