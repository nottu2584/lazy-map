# Typography Standards

This guide documents the typography system for Lazy Map, following shadcn/ui and Tailwind CSS best practices.

## Overview

We use **semantic HTML with Tailwind utility classes** for all typography. Custom CSS classes are avoided to maintain consistency with shadcn/ui patterns and enable responsive design out of the box.

## Key Concept: Base Styles First

**Critical**: Base typography is defined in `/apps/frontend/src/index.css` under `@layer base`. These styles automatically apply to semantic HTML elements.

### Default Behavior
- **Without any `text-*` class**, elements use the base styles defined in `index.css`
- **You DON'T need** to specify `text-base`, `font-semibold`, etc. on elements that match base styles
- **Only add Tailwind classes when you need to override** the base

### ✅ Good Practice (Use Base Styles)
```tsx
// Uses base h3 style: text-lg font-semibold text-foreground
<h3>Section Title</h3>

// Uses base p style: text-base text-muted-foreground
<p>Body text</p>
```

### ❌ Avoid Redundancy
```tsx
// Redundant - already defined in base styles
<h3 className="text-lg font-semibold text-foreground">Section Title</h3>

// Redundant - already defined in base styles
<p className="text-base text-muted-foreground">Body text</p>
```

### When to Override Base Styles

Override base typography when you have a **specific reason**:

1. **Responsive Sizing** (Hero sections): `text-5xl md:text-6xl lg:text-7xl`
2. **Contextual Sizing** (Modals/Sheets): `text-sm` for constrained spaces
3. **Visual Weight Adjustment**: `font-medium` for softer appearance
4. **Spacing & Layout**: Always explicit (`mb-4`, `mt-2`)
5. **Special Colors**: Only when different from base (`text-accent`, `text-destructive`)

## Font Stack

**Note**: These fonts are configured in `/apps/frontend/src/index.css` and automatically applied to their respective elements.

### Body Text (Urbanist)
```css
font-family: 'Urbanist', system-ui, -apple-system, sans-serif;
```
Used for: Paragraphs, general UI text, descriptions

### Headings (Inter)
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```
Used for: All heading levels (h1-h6), titles, section headers

### Technical Text (JetBrains Mono)
```css
font-family: 'JetBrains Mono', 'Courier New', monospace;
```
Used for:
- User input fields (input, textarea, select)
- Code blocks and inline code
- Technical values and map labels

## Typography Scale

**Note**: Base sizes, weights, and colors are defined in `@layer base` in `index.css`. The classes shown below are what you need to add **only when overriding** base styles.

### Heading Hierarchy

| Element | Tailwind Classes | Size | Usage |
|---------|-----------------|------|-------|
| **h1 (Hero)** | `scroll-m-20 text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-balance` | 3-4.5rem | Hero section titles (responsive) |
| **h1 (Page)** | `scroll-m-20 text-4xl font-extrabold tracking-tight` | 2.25rem | Standard page titles (one per page) |
| **h2** | `scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight` | 1.875rem | Section headers with visual separator |
| **h3** | `scroll-m-20 text-2xl font-semibold tracking-tight` | 1.5rem | Subsection headings |
| **h4** | `scroll-m-20 text-xl font-semibold tracking-tight` | 1.25rem | Minor headings |

### Body Text

| Type | Tailwind Classes | Size | Usage |
|------|-----------------|------|-------|
| **Lead** | `text-xl text-muted-foreground` | 1.25rem | Introductory paragraphs, hero descriptions |
| **Large** | `text-lg` | 1.125rem | Emphasized body text |
| **Base** | `leading-7 [&:not(:first-child)]:mt-6` | 1rem | Standard paragraphs |
| **Small** | `text-sm` | 0.875rem | Secondary content, helper text |
| **Muted** | `text-sm text-muted-foreground` | 0.875rem | De-emphasized, contextual info |

### Code & Technical

| Element | Tailwind Classes | Usage |
|---------|-----------------|-------|
| **Inline Code** | `bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm` | Seed values, technical terms |
| **Code Block** | `font-mono` (applied via base styles) | Multi-line code examples |

### Buttons

**Critical Rule**: Use standard button variants and sizes. Never override button styling with custom classes.

**Button Standard**:
- **Font**: `font-black` (900 weight) + `uppercase`
- **Font Family**: Heading font (Inter)
- **Base Text Size**: `text-sm` (14px)
- **Never customize**: height, padding, text size, text color, or hover states

**Available Variants**:
- `default` - Primary CTA (blue-black background)
- `outline` - Secondary action (bordered)
- `ghost` - Subtle action (no background)
- `link` - Text-like button (underlined)
- `secondary` - Alternative CTA (gray background)
- `destructive` - Dangerous action (red background)

**Available Sizes**:
- `sm` - Small (h-8, px-3, text-xs)
- `default` - Standard (h-9, px-4)
- `lg` - Large (h-10, px-8)
- `icon` - Square icon button (h-9 w-9)

**Acceptable className Overrides** (layout/spacing only):
- `w-full` - Full width
- `flex-1` - Flex grow
- `gap-*` - Icon spacing
- `ml-*`, `mr-*` - Margin spacing

**Special Case - Collapsible Triggers**: Section headers that need different spacing but keep button font styling:
- ✅ Allowed: `h-auto`, custom padding (`px-6 py-4`), `hover:bg-transparent` (for subtle interaction)
- ✅ REQUIRED: Keep standard font styling (font-black uppercase) - no `normal-case` override
- Purpose: Looks like a substantial section header while maintaining button typography

**Examples**:
```tsx
// ✅ Correct - Standard button
<Button variant="default" size="lg">
  Generate Map
</Button>

// ✅ Correct - With layout class
<Button variant="outline" size="sm" className="w-full">
  Sign In
</Button>

// ✅ Correct - Icon button
<Button variant="ghost" size="icon" aria-label="Close">
  <X />
</Button>

// ✅ Correct - Collapsible trigger (subtle hover, standard font/size)
<CollapsibleTrigger asChild>
  <Button
    variant="ghost"
    className="w-full justify-between px-6 hover:bg-transparent"
  >
    Advanced Settings
    {/* Uses default height (h-9) matching preset buttons */}
    {/* Font is font-black uppercase - no override! */}
    <ChevronDown className="h-5 w-5" />
  </Button>
</CollapsibleTrigger>

// ✅ Correct - Active state button (colored border only)
<Button
  variant="outline"
  className={cn(
    "flex-1",
    isActive && "border-primary border-2"
  )}
>
  {label}
</Button>

// ❌ Wrong - Overriding font styling
<Button className="normal-case text-base font-semibold">Bad</Button>
<Button className="text-primary hover:text-primary/80">Bad</Button>
<Button className="h-auto py-1 px-2 text-sm">Bad</Button>
<Button className="text-primary hover:text-primary/80">Bad</Button>
<Button className="h-6 w-6">Bad</Button>
```

**SVG Icons in Buttons**:
- Buttons automatically size icons to `size-4` (16px) via `[&_svg]:size-4`
- Never manually set icon size inside buttons
- Icons automatically inherit button text color

```tsx
// ✅ Correct - Icon auto-sized
<Button variant="ghost" size="icon">
  <X />  {/* Automatically 16px */}
</Button>

// ❌ Wrong - Manual icon sizing
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />  {/* Redundant */}
</Button>
```

### Icons Next to Text

**Standard**: Helper/info icons use 16px (h-4 w-4) for better visibility and tap targets.

| Icon Type | Size | Usage |
|-----------|------|-------|
| **Helper/Info icons** | `h-4 w-4` (16px) | TooltipHelp, form labels, explanations |
| **Button icons** | Auto-sized | Buttons size icons via `[&_svg]:size-4` |
| **Inline icons** | Match text size | When icon flows inline with text (rare) |

**Examples**:
```tsx
// ✅ Correct - Helper icon (always 16px)
<TooltipHelp content="Explanation">
  <FieldLabel className="text-sm">Label</FieldLabel>
  {/* Icon is h-4 w-4 (16px) - standard */}
</TooltipHelp>

// ✅ Correct - Button icon (auto-sized)
<Button variant="ghost" size="icon">
  <X />  {/* Auto-sized to 16px */}
</Button>

// ✅ Correct - Inline icon matches text
<p className="text-lg flex items-center gap-2">
  <Star className="h-[1.125rem] w-[1.125rem]" />
  Featured item
</p>
```

### Tooltips

**WCAG Requirement**: All tooltip text must be at least `text-sm` (14px) for accessibility compliance.

**Color System**:
- **Background**: `bg-primary` (Blue-black: `220 30% 10%`)
- **Text**: `text-primary-foreground` (Bright white: `0 0% 100%`)
- **Important**: Tooltip text is ALWAYS white (`primary-foreground`). Never override text color.

**Icon Sizing**: Helper icons use standard 16px size for better visibility and tap targets:
- **Helper/Info icons**: Always `h-4 w-4` (16px) - standard for all text sizes
- **Inline icons** (in body text): Match text size when icon is part of flowing text

| Pattern | Component | Text Size | Text Color | Usage |
|---------|-----------|-----------|------------|-------|
| **Helper Tooltip** | `<TooltipHelp>` | `text-sm` | `text-primary-foreground` (white) | Brief explanations with info icon |
| **Custom Tooltip** | `<TooltipContent>` | `text-sm` (default) | `text-primary-foreground` (white) | Rich content, multiple lines |

#### Standard Patterns

**Simple Helper Text** (Use `TooltipHelp` component):
```tsx
import { TooltipHelp } from '@/components/ui/TooltipHelp';

<TooltipHelp content="Brief explanation text">
  <FieldLabel className="text-sm">Label</FieldLabel>
  {/* Icon automatically sized h-4 w-4 (16px) for better visibility */}
</TooltipHelp>
```

**Rich Content** (Use `TooltipContent` directly):
```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

<Tooltip>
  <TooltipTrigger asChild>
    <Button>Hover me</Button>
  </TooltipTrigger>
  <TooltipContent className="max-w-xs space-y-1">
    <p className="text-sm font-medium">Title or Label</p>
    {/* Text color automatically white - no need to add text-primary-foreground */}
    <p className="text-sm text-primary-foreground/80">Detailed information here</p>
    {/* Only add /80 opacity for reduced emphasis */}
  </TooltipContent>
</Tooltip>
```

**Important Notes**:
- Base `TooltipContent` automatically applies `text-sm` (14px) and `text-primary-foreground` (white)
- **All `<p>` tags inside tooltips automatically inherit white text** via `[&_p]:text-inherit`
  - This overrides the global `p { text-muted-foreground }` style
  - No need to add color classes to paragraphs inside tooltips
- **Never override tooltip text color** - always white (`primary-foreground`) for contrast against dark background
- Always add explicit `text-sm` to content paragraphs for clarity
- Use `max-w-xs` to constrain tooltip width for readability
- For multi-line content, use `space-y-1` for consistent spacing
- Use `font-medium` on title paragraphs to establish hierarchy
- Never use `text-xs` in tooltips (WCAG violation)
- For reduced emphasis in multi-line tooltips, use `text-primary-foreground/80` (80% opacity white)

## Utility Classes Explained

### `scroll-m-20`
Adds scroll margin-top to prevent content from hiding under fixed headers during anchor navigation.

**Always use on headings** (h1-h6).

### `tracking-tight`
Reduces letter-spacing for better visual density on headings.

**Use on all headings**.

### `text-balance`
Improves line breaking for better text wrapping on multi-line headings.

**Use on h1 elements**, especially for long titles.

### `[&:not(:first-child)]:mt-6`
Applies margin-top only if the element is not the first child, preventing double margins.

**Use on paragraph tags** within article/section content.

## Semantic HTML Requirements

### ✅ Correct Usage

```tsx
// Page title
<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
  Generate Your Map
</h1>

// Lead paragraph
<p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
  Tactical battlemap generator for tabletop RPGs.
</p>

// Section header
<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
  Key Features
</h2>

// Body paragraph
<p className="leading-7 [&:not(:first-child)]:mt-6">
  Generate deterministic maps from seed values.
</p>

// Inline code
<code className="bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">
  goblin-ambush
</code>
```

### ❌ Incorrect Usage

```tsx
// Don't use divs styled as headings
<div className="text-4xl font-bold">Page Title</div>

// Don't skip heading levels (h1 → h3)
<h1>Main Title</h1>
<h3>Should be h2</h3>

// Don't use custom CSS classes
<h1 className="text-hero">Title</h1>

// Don't use spans for paragraphs
<span className="text-lg">This should be a paragraph</span>
```

## Responsive Typography

Use Tailwind breakpoints for responsive sizing:

```tsx
// Hero section - Large responsive heading
<h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-balance">
  Hero Title
</h1>

// Standard page heading - Medium responsive
<h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight">
  Page Title
</h1>

// Responsive paragraph
<p className="text-base md:text-lg">
  Adjusts size on larger screens
</p>
```

### Responsive Size Recommendations

| Context | Mobile | Tablet | Desktop | Classes |
|---------|--------|--------|---------|---------|
| **Hero** | 3rem | 3.75rem | 4.5rem | `text-5xl md:text-6xl lg:text-7xl` |
| **Page Title** | 1.875rem | 2.25rem | 2.25rem | `text-3xl lg:text-4xl` |
| **Section** | 1.5rem | 1.875rem | 1.875rem | `text-2xl md:text-3xl` |

## Spacing Standards

### Core Principles
- **Lightweight & Simple**: Use consistent spacing to reduce cognitive load
- **Readable & Accessible**: Maintain clear visual hierarchy through spacing
- **No Distractions**: Predictable spacing patterns help users focus on map generation

### Spacing Scale

| Context | Spacing Class | Size | Usage |
|---------|--------------|------|-------|
| **Section boundaries** | `space-y-6` or `py-6` | 1.5rem (24px) | Between major sections |
| **Subsection groups** | `space-y-3` | 0.75rem (12px) | Within related content |
| **List items** | `space-y-2` | 0.5rem (8px) | Between list entries |
| **Detail pairs** | `mt-2` or `mt-3` | 0.5-0.75rem (8-12px) | Label to value spacing |
| **Icon + text** | `gap-2` | 0.5rem (8px) | Icon and adjacent label |
| **Heading to content** | `mb-4` or `mb-6` | 1-1.5rem (16-24px) | After h1-h3 elements |
| **Empty states** | `py-12` | 3rem (48px) | Centered empty messages |

### Standard Patterns

**Section Structure** (Recommended):
```tsx
// Container → Sections → Groups → Items
<div className="space-y-6">        {/* Major sections */}
  <div className="space-y-3">      {/* Subsections */}
    <h3>Title</h3>
    <div className="space-y-2">    {/* Item groups */}
      <p>Item 1</p>
      <p>Item 2</p>
    </div>
  </div>
</div>
```

**Detail Label/Value Pairs**:
```tsx
// ✅ Correct - Readable spacing
<div>
  <h5 className="text-muted-foreground">Label</h5>
  <p className="mt-2">Value content here</p>
</div>

// ❌ Wrong - Too cramped
<div>
  <h5>Label</h5>
  <p className="mt-1">Value</p>  {/* Only 4px gap - hard to scan */}
</div>
```

**Card Content Spacing**:
```tsx
// ✅ Correct - Use default card padding
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content gets p-6 automatically */}
    <p>Content here</p>
  </CardContent>
</Card>

// ❌ Wrong - Don't override default padding
<Card>
  <CardContent className="pt-6">  {/* Unnecessary override */}
    <p>Content</p>
  </CardContent>
</Card>
```

**Section Padding**:
```tsx
// Consistent section boundaries
<section className="py-6">       {/* Small sections */}
<section className="py-8">       {/* Medium sections */}
<section className="py-12">      {/* Large sections / empty states */}
<section className="pt-32 pb-16"> {/* Hero sections only */}
```

### Spacing Anti-Patterns

**❌ Avoid**:
- `mt-1` (4px) for detail label spacing - too cramped
- `space-y-1` for content with multi-line text - insufficient breathing room
- Mixing `mb-*` and `space-y-*` on the same container - creates double margins
- Custom padding overrides on shadcn/ui components - breaks consistency

**✅ Use Instead**:
- `mt-2` or `mt-3` for detail labels
- `space-y-2` minimum for readable content
- Choose either `mb-*` OR `space-y-*`, not both
- Accept default component spacing

---

## Accessibility Best Practices

### 1. Always Use Semantic HTML
Screen readers rely on proper HTML structure. Use h1-h6 for headings, p for paragraphs, code for technical terms.

### 2. Maintain Heading Hierarchy
Never skip heading levels. Follow the natural progression: h1 → h2 → h3.

```tsx
✅ Correct:
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>

❌ Wrong:
<h1>Page Title</h1>
<h3>Skipped h2!</h3>
```

### 3. Use One h1 Per Page
Each page should have exactly one h1 element representing the main page title.

### 4. Minimum Text Size (WCAG Compliance)

**CRITICAL**: Never use `text-xs` (12px) for body content.

| Class | Size | WCAG Status | Usage |
|-------|------|-------------|-------|
| `text-xs` | 12px | ❌ **NON-COMPLIANT** | Avoid for body text |
| `text-sm` | 14px | ✅ **MINIMUM** | Labels, secondary text |
| `text-base` | 16px | ✅ **RECOMMENDED** | Body content |
| `text-lg` | 18px | ✅ **LARGE** | Emphasis, leads |

**Usage Guidelines**:
- **Body content**: `text-base` (16px) minimum
- **Labels & helper text**: `text-sm` (14px) minimum
- **Code badges/pills**: `text-sm` (14px) minimum
- **Never use `text-xs` for readable content**

```tsx
// ✅ Correct - Accessible text sizes
<p>Standard body text</p>  {/* text-base by default */}
<p className="text-sm text-muted-foreground">Helper text</p>

// ❌ Wrong - Below WCAG minimum
<p className="text-xs">Important information</p>  {/* 12px - too small */}
<span className="text-xs">User-facing label</span>  {/* 12px - inaccessible */}
```

### 5. Color Contrast

Our color system ensures WCAG AA compliance:
- `text-foreground`: `hsl(220 30% 10%)` - Near black (high contrast 15:1)
- `text-muted-foreground`: `hsl(0 0% 40%)` - Medium gray (4.5:1 contrast ratio)

**Contrast Guidelines**:
- Use `text-foreground` for headings and primary content
- Use `text-muted-foreground` for secondary information only
- Never use `text-muted-foreground` with `text-xs` (double accessibility issue)
- For multi-line descriptions with `text-muted-foreground`, add `leading-relaxed` for readability

```tsx
// ✅ Correct - Proper contrast usage
<h3>Section Title</h3>  {/* text-foreground by default */}
<p className="text-muted-foreground">Helper text</p>

// ⚠️ Acceptable but add line-height
<p className="text-sm text-muted-foreground leading-relaxed">
  Multi-line description with proper line spacing for readability.
</p>

// ❌ Wrong - Low contrast + small text
<p className="text-xs text-muted-foreground">
  Important information  {/* Both size AND contrast issues */}
</p>
```

### 6. Line Height

Use adequate line-height for all text content:

| Text Type | Line Height | Usage |
|-----------|-------------|-------|
| Headings | 1.1 - 1.4 | Defined in base styles |
| Body text | 1.6 | Paragraphs (default) |
| Dense text | `leading-normal` (1.5) | Acceptable minimum |
| Multi-line descriptions | `leading-relaxed` (1.625) | Recommended |
| Long-form content | `leading-7` (1.75) | Articles, docs |

```tsx
// ✅ Correct - Multi-line with proper spacing
<p className="text-sm text-muted-foreground leading-relaxed">
  This is a longer explanation that spans multiple lines
  and needs comfortable line spacing for readability.
</p>

// ❌ Wrong - Dense text without line-height
<p className="text-sm">
  Long explanation without explicit line-height
  may appear cramped on smaller screens.
</p>
```

### 7. Focus on Core User Flow

**Priority**: Users should generate maps immediately without confusion.

**Design Principles**:
- **Clear visual hierarchy**: Use spacing and text size to guide the eye
- **Minimal distractions**: Avoid excessive decoration or dense text blocks
- **Fast interactions**: Helper modals/sheets should be scannable (use proper spacing)
- **Accessible by default**: Follow WCAG AA standards for all user-facing content

**Implementation**:
```tsx
// Main action - Clear and prominent
<Button size="lg" className="mt-4">
  Generate Map
</Button>

// Helper action - Smaller but still accessible
<Button variant="ghost" size="sm" className="mt-2">
  Need help?
</Button>

// Secondary info - Readable but de-emphasized
<p className="text-sm text-muted-foreground mt-3 leading-relaxed">
  Maps are generated using seed values for deterministic results.
</p>
```

## Migration from Custom Classes

If you encounter legacy custom classes, replace them as follows:

| Old Class | New Pattern | Element |
|-----------|------------|---------|
| `.text-hero` | `scroll-m-20 text-4xl font-extrabold tracking-tight` | h1 |
| `.text-section-title` | `scroll-m-20 text-3xl font-semibold tracking-tight` | h2 |
| `.text-body-large` | `text-xl` or `text-lg` | p |
| `.font-heading` | Remove (automatically applied to h1-h6) | - |

## Examples

### Landing Page Hero

```tsx
<section className="pt-32 pb-16 px-6 text-center">
  <h1 className="scroll-m-20 text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-balance">
    Generate Your Map
  </h1>
  <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
    Tactical battlemap generator for tabletop RPGs.
    Enter a seed value to create your map.
  </p>
</section>
```

### Page with Sections

```tsx
<article className="container mx-auto px-6 py-16">
  <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight mb-8">
    Documentation
  </h1>

  <p className="text-xl text-muted-foreground mb-8">
    Learn how to generate and customize your tactical maps.
  </p>

  <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-12">
    Getting Started
  </h2>

  <p className="leading-7 [&:not(:first-child)]:mt-6">
    First paragraph with no top margin due to smart selector.
  </p>

  <p className="leading-7 [&:not(:first-child)]:mt-6">
    Second paragraph automatically gets margin-top.
  </p>

  <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8">
    Basic Usage
  </h3>

  <p className="leading-7 [&:not(:first-child)]:mt-6">
    Try seed values like <code className="bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">goblin-ambush</code> or <code className="bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">forest-temple</code>.
  </p>
</article>
```

### Empty States

```tsx
<div className="text-center py-16">
  <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
    No Maps Yet
  </h2>
  <p className="text-sm text-muted-foreground">
    Generate your first map to see it here.
  </p>
</div>
```

## Reference

- [shadcn/ui Typography](https://ui.shadcn.com/docs/components/radix/typography)
- [Tailwind Typography Plugin](https://tailwindcss.com/docs/typography-plugin)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

## Questions?

When in doubt:
1. Use semantic HTML first (h1-h6, p, code)
2. Apply Tailwind utilities for styling
3. Never create custom CSS classes for typography
4. Test for accessibility and responsive behavior
