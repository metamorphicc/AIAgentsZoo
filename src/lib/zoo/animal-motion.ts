import type { SpeciesId } from "./types";

export const behaviorDuration: Record<string, number> = {
  Scan: 3.2, Call: 2.1, Signal: 2.5, "Look Around": 3.8, Blink: 1,
  Gnaw: 3, "Tail Sweep": 2.8, Build: 3.4, Lookout: 3.7, Alert: 2.2,
};

// The owl's upper lids are anchored above each eye, and grow down to close.
export function owlLidScale(blink: number) {
  return 0.015 + 0.985 * Math.max(0, Math.min(1, blink));
}

export function animalMotion(species: SpeciesId, behavior: string, elapsed: number, clock: number) {
  const duration = behaviorDuration[behavior] ?? 3;
  const envelope = behavior === "Idle" ? 0 : Math.max(0, Math.min(1, elapsed / 0.3, (duration - elapsed) / 0.35));
  const motion = { headX: 0.012 * Math.sin(clock * 0.9), headY: 0.025 * Math.sin(clock * 0.7), headZ: 0, jaw: 0, wing: 0, tail: 0, arm: 0, blink: 0, breath: 0.004 * Math.sin(clock * 1.8) };
  if (species === "raven") {
    if (behavior === "Scan") { motion.headY += envelope * 0.5 * Math.sin(elapsed * 1.9); motion.headZ = envelope * 0.06 * Math.sin(elapsed * 2.1); }
    if (behavior === "Call") { motion.jaw = envelope * 0.22 * Math.abs(Math.sin(elapsed * 7)); motion.headX -= envelope * 0.08; }
    if (behavior === "Signal") { motion.wing = envelope * 0.13 * Math.sin(elapsed * 4); motion.headY += envelope * 0.12; }
  } else if (species === "owl") {
    if (behavior === "Look Around") { motion.headY += envelope * 0.8 * Math.sin(elapsed * 1.5); motion.headZ = envelope * 0.07; }
    if (behavior === "Blink") motion.blink = envelope * Math.exp(-Math.pow((elapsed - 0.45) / 0.15, 2));
    if (behavior === "Signal") { motion.headX += envelope * 0.1 * Math.sin(elapsed * 5); motion.wing = envelope * 0.08; }
  } else if (species === "beaver") {
    if (behavior === "Gnaw") { motion.jaw = envelope * 0.17 * (0.5 + 0.5 * Math.sin(elapsed * 11)); motion.headX += envelope * 0.035 * Math.sin(elapsed * 11); }
    if (behavior === "Tail Sweep") motion.tail = envelope * 0.3 * Math.sin(elapsed * 2.6);
    if (behavior === "Build") { motion.arm = envelope * 0.17 * Math.sin(elapsed * 5); motion.headX += envelope * 0.08; }
  } else {
    if (behavior === "Lookout" || behavior === "Scan") { motion.headY += envelope * 0.55 * Math.sin(elapsed * 1.7); motion.headX -= envelope * 0.04; }
    if (behavior === "Alert") { motion.headX -= envelope * 0.09; motion.arm = envelope * 0.1; }
  }
  return motion;
}
