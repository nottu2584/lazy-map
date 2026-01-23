# Typography Standards

This guide documents the typography system for Lazy Map, following shadcn/ui and Tailwind CSS best practices.

## Overview

We use **semantic HTML with Tailwind utility classes** for all typography. Custom CSS classes are avoided to maintain consistency with shadcn/ui patterns and enable responsive design out of the box.

## Font Stack

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

### 4. Color Contrast
Our color system ensures WCAG AA compliance:
- `text-foreground`: Near black (high contrast)
- `text-muted-foreground`: Medium gray (sufficient for secondary text)

### 5. Line Height
Use `leading-7` (1.75) for body paragraphs to ensure comfortable reading.

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
