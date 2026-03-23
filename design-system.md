# PC BenchHub — Design System v2.0 "Nebula Dark"

## 1. Design Philosophy

**"Premium SaaS meets hardware culture."**

Think Vercel/Linear-level polish fused with tech precision. The design achieves differentiation through:

- **Purple-dominant accent** — 0 direct competitors use this. Instant brand recognition.
- **Category color coding** — CPU, GPU, RAM, Storage each have distinct colors. Unique in the market.
- **Animated gradient mesh background** — Stripe-style signature look, nobody in this niche does this.
- **Glassmorphism surfaces** — Dark glass cards with layered blur and subtle gradient borders.
- **Premium micro-interactions** — Every hover, click and focus state has a designed response.

---

## 2. Color Tokens

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-void` | `#030711` | Deepest dark, not used directly |
| `--bg-base` | `#060c18` | Page background |
| `--bg-elev-1` | `#0a1020` | Card surfaces |
| `--bg-elev-2` | `#0e1628` | Elevated cards, dropdowns |
| `--bg-elev-3` | `#131e34` | Modals, overlays |

### Brand Accent — Violet/Purple
| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#9b6dff` | Primary interactive elements |
| `--accent-dim` | `#7c4dff` | Darker variant, gradient start |
| `--accent-bright` | `#b387ff` | Lighter variant, gradient end |
| `--accent-glow` | `rgba(155,109,255,0.35)` | Box-shadow glow effects |

### Accent 2 — Cyan (data display)
| Token | Value | Usage |
|-------|-------|-------|
| `--cyan` | `#22d3ee` | Score highlights, data callouts |
| `--cyan-dim` | `#0891b2` | Gradient anchor |
| `--cyan-glow` | `rgba(34,211,238,0.30)` | Glow on cyan elements |

### Accent 3 — Emerald (success/top scores)
| Token | Value | Usage |
|-------|-------|-------|
| `--emerald` | `#10b981` | Top scores, "live" badge |
| `--emerald-glow` | `rgba(16,185,129,0.28)` | Glow on success states |

### Semantic
| Token | Value |
|-------|-------|
| `--danger` | `#f43f5e` |
| `--warning` | `#f59e0b` |
| `--info` | `#3b82f6` |

### Hardware Category Colors (unique differentiator)
| Category | Color | Variable |
|----------|-------|----------|
| CPU | `#60a5fa` | `--cat-cpu` |
| GPU | `#fb923c` | `--cat-gpu` |
| RAM | `#a78bfa` | `--cat-ram` |
| Storage | `#34d399` | `--cat-storage` |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#eef2ff` | Main content |
| `--text-muted` | `#8896b0` | Secondary text |
| `--text-soft` | `#4d5d7a` | Tertiary, labels |
| `--text-accent` | `#b29bff` | Accent-tinted text |

### Borders
| Token | Value |
|-------|-------|
| `--line-dim` | `rgba(148,115,255,0.10)` |
| `--line-soft` | `rgba(148,115,255,0.18)` |
| `--line-mid` | `rgba(148,115,255,0.28)` |
| `--line-strong` | `rgba(148,115,255,0.45)` |

---

## 3. Typography

### Font Stack
```
Display: 'Outfit' — Headings, KPI numbers, hero text
Body:    'Inter'  — Paragraphs, labels, UI text
Mono:    'JetBrains Mono' — Scores, stats, code, data
```

### Scale
| Level | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| Hero H1 | clamp(2rem → 3.4rem) | 900 | Outfit | Page heroes |
| Section H2 | clamp(1.2rem → 1.85rem) | 700 | Outfit | Section titles |
| Card H3 | 1rem | 700 | Outfit | Card headings |
| Body | 0.9–1rem | 400–500 | Inter | Paragraphs |
| Label | 0.72–0.78rem | 700 | Inter | Uppercase labels |
| Mono | 0.78–0.875rem | 500–700 | JetBrains Mono | Scores, data |

---

## 4. Spacing System (8px base)

```
4px   — xs  (tight gaps between sibling elements)
8px   — sm  (inner padding, small gaps)
12px  — md  (standard component padding)
16px  — lg  (section gaps, card padding)
24px  — xl  (section spacing)
32px  — 2xl (major section breaks)
48px  — 3xl (page-level spacing)
```

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--r-xs` | 6px | Tiny indicators, dots |
| `--r-sm` | 10px | Inputs, score pills, small badges |
| `--r-md` | 14px | Inner cards, table containers |
| `--r-lg` | 20px | Main card surfaces |
| `--r-xl` | 28px | Large modal panels |

---

## 6. Shadow System

| Name | Value | Usage |
|------|-------|-------|
| `--shadow-sm` | `0 2px 8px rgba(3,7,17,0.4)` | Subtle lift for small elements |
| `--shadow-md` | `0 8px 24px rgba(3,7,17,0.5)` | Standard card shadow |
| `--shadow-lg` | `0 16px 48px rgba(3,7,17,0.6)` | Hover elevation |
| `--shadow-glow` | `0 0 24px rgba(155,109,255,0.22)` | Purple glow on hover |

---

## 7. Component Reference

### Surfaces
```
.surface        — Main dark glass card
.surface-muted  — Secondary/nested surface
.surface-hover  — Adds hover: lift + glow border
```

### Buttons
```
.btn-primary    — Violet gradient + glow (main CTAs)
.btn-secondary  — Dark glass + border (secondary actions)
.btn-ghost      — Transparent + subtle border (tertiary)
.btn-danger     — Red-tinted (destructive)
.btn-link       — Inline text link (accent color)
```

### Chips & Badges
```
.chip           — Pill container (neutral)
.chip-active    — Violet gradient pill (active state)
.chip-live      — Green pulsing dot prefix (live data)
.badge          — Small rounded label (neutral)
.badge-cpu      — Blue-tinted (CPU category)
.badge-gpu      — Orange-tinted (GPU category)
.badge-ram      — Purple-tinted (RAM category)
.badge-storage  — Emerald-tinted (Storage category)
.pill           — Smallest label (archetype, tags)
```

### Score Display
```
.score-pill                   — Mono font data pill
.score-pill[data-tone=high]   — Emerald (high performance)
.score-pill[data-tone=mid]    — Blue (mid performance)
.score-pill[data-tone=low]    — Amber (lower performance)
.score-pill[data-tone=cpu]    — Blue (CPU category)
.score-pill[data-tone=gpu]    — Orange (GPU category)
.metric-track                 — Progress bar (gradient fill)
```

### Rank Badges
```
.rank-badge              — Default dark badge
.rank-badge[data-rank=1] — Gold gradient (1st place)
.rank-badge[data-rank=2] — Silver gradient (2nd place)
.rank-badge[data-rank=3] — Bronze gradient (3rd place)
```

### KPI Stats
```
.kpi-stat          — Stat container with top accent bar
.kpi-stat__label   — Uppercase small label
.kpi-stat__value   — Large display number (glow text-shadow)
.kpi-stat__hint    — Soft helper text below
```

### Navigation
```
.nav-shell    — Sticky frosted glass header
.logo-mark    — Gradient purple logo badge (36×36)
.nav-item     — Navigation pill (hover + active states)
.nav-item.active — Purple glass active state
```

### Animation Classes
```
.fade-up                  — Entry animation (opacity + translateY)
.fade-up[data-delay='1'] — 60ms delay
.fade-up[data-delay='2'] — 120ms delay
.fade-up[data-delay='3'] — 180ms delay
.fade-up[data-delay='4'] — 240ms delay
```

### Gradient Utilities
```
.gradient-title — Purple → violet → cyan gradient text
.mono           — JetBrains Mono font application
```

---

## 8. Layout

### App Shell
```
.app-shell      — Root: animated gradient mesh background
.container-shell — Max-width 1280px, centered, z-index: 1
.footer-shell   — Fixed footer: glass + border-top
```

### Grid Patterns
- **Hero**: `lg:grid-cols-[1.15fr_0.85fr]` — content left, KPI grid right
- **Categories**: `lg:grid-cols-4` — 4 equal shortcut cards
- **Main content**: `xl:grid-cols-[1.55fr_1fr]` — benchmarks + leaderboard
- **KPI grid**: `sm:grid-cols-2` — 2×2 stats

---

## 9. Motion Design

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Page sections | opacity + translateY | 500ms | spring |
| Card hover | transform + shadow | 280ms | spring |
| Button hover | transform | 180ms | spring |
| Input focus | border + shadow | 180ms | ease |
| Score bars | width | 600ms | ease-out |
| Background | radial gradient positions | 18s | ease-in-out alternate |

**Easing tokens:**
- `var(--ease-spring)` → `cubic-bezier(0.16, 1, 0.3, 1)` — bouncy, premium
- `var(--ease-out)` → `cubic-bezier(0.22, 1, 0.36, 1)` — smooth deceleration

---

## 10. Competitive Differentiation

| Feature | UserBenchmark | 3DMark | Geekbench | PassMark | **BenchHub v2** |
|---------|:---:|:---:|:---:|:---:|:---:|
| Purple accent (brand diff) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Animated gradient bg | ❌ | ❌ | ❌ | ❌ | ✅ |
| Category color coding | ❌ | ❌ | ❌ | ❌ | ✅ |
| Dark mode native | ❌ | ✅ | Optional | ❌ | ✅ |
| Glassmorphism cards | ❌ | ❌ | ❌ | ❌ | ✅ |
| Premium micro-interactions | ❌ | Basic | ❌ | ❌ | ✅ |
| Live data badge | ❌ | ❌ | ❌ | ❌ | ✅ |
| Score progress bars | ❌ | ❌ | ❌ | Basic | ✅ Gradient |
| Mobile-first | ❌ | 🟡 | ✅ | ❌ | ✅ |

---

## 11. Implementation Notes

- All design tokens live in `:root {}` in `index.css` — single source of truth
- Tailwind extends these tokens in `tailwind.config.js`
- Component classes (`.surface`, `.btn-primary`, etc.) are in `@layer components`
- Page-specific layout uses inline Tailwind utility classes for grid/flex
- Category theming is achieved via inline `style` props where CSS variables are referenced
- No third-party animation library needed — all animations are CSS keyframes

---

*Design System maintained by: PC BenchHub Design Team*
*Version: 2.0 "Nebula Dark" — March 2026*
