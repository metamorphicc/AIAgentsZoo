import { PropertyBinding, type Object3D } from "three";

export const animalJointNames = ["body", "head", "jaw", "tail", "wing.L", "wing.R", "arm.L", "arm.R", "lid.L", "lid.R"] as const;

export function findAnimalJoint(model: Object3D, name: string) {
  // GLTFLoader removes dots from node names, e.g. Blender's lid.L becomes lidL.
  return model.getObjectByName(name) ?? model.getObjectByName(PropertyBinding.sanitizeNodeName(name));
}
