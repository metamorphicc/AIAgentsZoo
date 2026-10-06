# AI Agent Zoo Design System

## Intent

AI Agent Zoo is an operating surface, not a launch deck. Every primary navigation item resolves to a real page with a distinct job: observe the habitat, inspect agents, read the trace, inspect artifacts, see assigned work, inspect nodes, and run local controls.

The visual direction is an atmospheric **midnight biome**: dark paper, acid-lime operational signals, rounded geometric type, fine technical rules, and sparse green emphasis. Wallet identity is real and explicitly off-chain; the product does not imply a deployed token or federation layer.

## System

- Genre: atmospheric product UI.
- Macrostructure: Workbench for overview and operations; directory and document variations for registries and details.
- Navigation: persistent N1b-style three-section top bar with only real routes; native `details` disclosure on smaller screens.
- Footer: compact Ft2 utility line.
- Display and interface: Google Sans, variable 400–700.
- Technical data: Google Sans Code.
- Accent footprint: active route, live state, action, routed signal, and key identifiers only.
- Motion: one orchestrated page entrance, living animal drift, active signal flow, a user-pausable habitat rail, vertical text swaps on primary CTAs, and functional loading indicators at real async boundaries. No universal scroll reveals. Reduced-motion removes non-essential movement and slows functional loaders.
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
- `MotionScope`: hydration-aware, one-shot page entrance for landing and product workspaces.
- `KineticLink`: two-layer vertical label swap reserved for the landing page's primary routes.
- `HabitatMotionRail`: slow, pausable preview of the Grok-to-animal handoff loop.
- `RouteLoadingState`: delayed route-level data indicator, shown only when a server transition lasts longer than 150 ms.
- `InlineActivity`: consistent in-button progress for mutations without shifting button geometry.
- `ModelLoadingState`: real GLB loading progress inside the persistent animal viewport.
- `WalletSessionControl`: injected-wallet EIP-4361 sign-in, guardian identity, and local session exit.
- `AccessPanel`: public-read/guardian-write boundary shown at the point where control begins.
- `DemoRunner`: isolated, rate-limited Grok-to-animal proof that never mutates the shared ledger.
- `RuntimeControlPanel`: administrator-only global pause/resume control.
- Status labels pair color with text and a dot.

## Route Map

| Route | Purpose |
| --- | --- |
| `/zoo` | Operational overview and live topology |
| `/demo` | Isolated visitor run with no wallet or durable writes |
| `/agents` | Agent registry |
| `/agents/[id]` | Agent passport, controls, runs, and trace |
| `/animals` and `/animals/[id]` | Human-readable aliases for the agent registry and passports |
| `/enclosures` | Enclosure directory and creation workbench |
| `/enclosures/[id]` | Territory status, residents, activity, and habitat controls |
| `/trace` | Shared event ledger |
| `/artifacts` | Artifact registry |
| `/artifacts/[id]` | Artifact content and provenance |
| `/tasks` | Current assigned work |
| `/nodes` | Local node truth and federation boundary |
| `/manage` | Local guardian controls |
| `/protocol` | Current protocol implementation |

## Access Model

- Visitor: public read access plus the isolated demo.
- Guardian: EIP-4361 wallet session; may create and operate resources owned by that wallet.
- Administrator: allowlisted wallet; may operate system residents and the global runtime switch.
- Every mutation is checked server-side for origin, session, ownership, and a durable rate limit.

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
  --dur-loader: 1.4s;
  --dur-ambient: 32s;
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
  },
  "duration": {
    "loader": { "$type": "duration", "$value": "1.4s" },
    "ambient": { "$type": "duration", "$value": "32s" }
  }
}
```

### shadcn/ui mapping

```css
:root {
  --background: 13.5% 0.012 135;
  --foreground: 96.5% 0.01 115;
  --card: 16.5% 0.014 135;
  --card-foreground: 96.5% 0.01 115;
  --primary: 91% 0.205 118;
  --primary-foreground: 14% 0.018 135;
  --muted: 20.5% 0.018 135;
  --muted-foreground: 66% 0.025 130;
  --border: 28% 0.025 135;
  --ring: 91% 0.205 118;
  --radius: 0.5rem;
}
```
