import { Group } from "three";
import { expect, it } from "vitest";
import { findAnimalJoint } from "./animal-rig";

it("resolves imported left/right lids, wings and paws after GLTFLoader sanitizes names", () => {
  const model = new Group();
  for (const name of ["lidL", "lidR", "wingL", "wingR", "armL", "armR"]) {
    const joint = new Group();
    joint.name = name;
    model.add(joint);
  }
  for (const name of ["lid.L", "lid.R", "wing.L", "wing.R", "arm.L", "arm.R"]) {
    expect(findAnimalJoint(model, name)?.name).toBe(name.replace(".", ""));
  }
});

it("also accepts unsanitized names and safely skips absent joints", () => {
  const model = new Group();
  const joint = new Group();
  joint.name = "lid.L";
  model.add(joint);
  expect(findAnimalJoint(model, "lid.L")).toBe(joint);
  expect(findAnimalJoint(model, "jaw")).toBeUndefined();
});
