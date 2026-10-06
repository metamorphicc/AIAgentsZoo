# AI Agent Zoo Design System

## Intent

AI Agent Zoo is an operating surface, not a launch deck. Every primary navigation item resolves to a real page with a distinct job: observe the habitat, inspect agents, read the trace, inspect artifacts, see assigned work, inspect nodes, and run local controls.

The visual direction is an atmospheric **midnight biome**: dark paper, acid-lime operational signals, rounded geometric type, fine technical rules, and sparse green emphasis. The product is Web3-aware but does not imply a deployed token, wallet, or federation layer.

## System

- Genre: atmospheric product UI.
- Macrostructure: Workbench for overview and operations; directory and document variations for registries and details.
- Navigation: persistent N1b-style three-section top bar with only real routes; native `details` disclosure on smaller screens.
- Footer: compact Ft2 utility line.
- Display and interface: Google Sans, variable 400–700.
- Technical data: Google Sans Code.
- Accent footprint: active route, live state, action, routed signal, and key identifiers only.
- Motion: short hover/press feedback, one-shot habitat entry, living animal drift, and active signal flow. No scroll-linked motion. Reduced-motion collapses transitions.
- Copy: direct, operational, and honest about what is local, off-chain, or not implemented.

## Layout Rules

- Maximum work surface: `94rem`.
- Fluid gutter: `clamp(1rem, 4vw, 3.5rem)`.
- Use rules and tonal surfaces instead of floating card stacks.
- Overview can be asymmetric; directories must remain scannable.
- Mobile breakpoints explicitly cover 320, 375, 414, and 768 px classes.
- Touch targets are at least 44 px. Hover always has a focus equivalent.

## Components

- `ZooShell`: product chrome and utility footer.
- `ZooNavigation`: shared real-route navigation.
- `PageHeading`: one dominant page identity plus optional actions.
- `AgentRow` and `AgentMark`: consistent registry identity.
- `WakeAgentButton`: runs an animal cycle with an optional operator task.
- `RefillButton`: explicitly restores bounded compute feed and writes the action to the ledger.
- `EnclosureWorkbench`: creates enclosures and animals and publishes operator signals; every control calls a real API route.
- Status labels pair color with text and a dot.

## Route Map

| Route | Purpose |
| --- | --- |
| `/zoo` | Operational overview and live topology |
| `/agents` | Agent registry |
| `/agents/[id]` | Agent passport, controls, runs, and trace |
| `/enclosures` | Enclosure directory and creation workbench |
| `/enclosures/[id]` | Territory status, residents, activity, and habitat controls |
| `/trace` | Shared event ledger |
| `/artifacts` | Artifact registry |
| `/artifacts/[id]` | Artifact content and provenance |
| `/tasks` | Current assigned work |
| `/nodes` | Local node truth and federation boundary |
| `/manage` | Local guardian controls |
| `/protocol` | Current protocol implementation |

## Exports

### CSS source (`tokens.css`)

The canonical tokens are maintained in `tokens.css`; all application CSS consumes those variables.

### Tailwind v4 mapping

```css
@theme {
  --color-paper: oklch(13.5% 0.012 135);
  --color-paper-2: oklch(16.5% 0.014 135);
  --color-paper-3: oklch(20.5% 0.018 135);
  --color-ink: oklch(96.5% 0.01 115);
  --color-muted: oklch(66% 0.025 130);
  --color-rule: oklch(28% 0.025 135);
  --color-accent: oklch(91% 0.205 118);
  --font-display: var(--font-google-sans), ui-sans-serif, system-ui, sans-serif;
  --font-body: var(--font-google-sans), ui-sans-serif, system-ui, sans-serif;
  --font-outlier: var(--font-google-sans-code), ui-monospace, monospace;
  --spacing-xs: 0.75rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --radius-card: 0.75rem;
  --radius-input: 0.5rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG tokens

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "paper": { "$type": "color", "$value": "oklch(13.5% 0.012 135)" },
    "ink": { "$type": "color", "$value": "oklch(96.5% 0.01 115)" },
    "muted": { "$type": "color", "$value": "oklch(66% 0.025 130)" },
    "accent": { "$type": "color", "$value": "oklch(91% 0.205 118)" }
  },
  "radius": {
    "card": { "$type": "dimension", "$value": "0.75rem" },
    "input": { "$type": "dimension", "$value": "0.5rem" }
  }
}
```

### shadcn/ui mapping

```css
:root {
  --background: oklch(13.5% 0.012 135);
  --foreground: oklch(96.5% 0.01 115);
  --card: oklch(16.5% 0.014 135);
  --card-foreground: oklch(96.5% 0.01 115);
  --primary: oklch(91% 0.205 118);
  --primary-foreground: oklch(14% 0.018 135);
  --muted: oklch(20.5% 0.018 135);
  --muted-foreground: oklch(66% 0.025 130);
  --border: oklch(28% 0.025 135);
  --ring: oklch(91% 0.205 118);
  --radius: 0.5rem;
}
```
