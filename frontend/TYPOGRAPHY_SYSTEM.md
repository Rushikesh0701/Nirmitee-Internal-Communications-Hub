# Global Typography System

This document defines the global typography system used throughout the application.

## Typography Scale

### Display / Headline (Largest)
- **Font Size**: 26px (Compact)
- **Font Weight**: 700 (Bold)
- **Line Height**: 1.2
- **Letter Spacing**: -0.02em
- **Usage**: Main page titles, hero sections, large statistics
- **CSS Class**: `.text-display`
- **Example**: `<h1 className="text-display">Welcome</h1>`

### Heading 1
- **Font Size**: 22px (Compact)
- **Font Weight**: 700 (Bold)
- **Line Height**: 1.25
- **Letter Spacing**: -0.015em
- **Usage**: Primary page headings, section titles
- **CSS Class**: `.text-h1` or use `<h1>` tag
- **Example**: `<h1 className="text-h1">Page Title</h1>`

### Heading 2
- **Font Size**: 20px (Compact)
- **Font Weight**: 600 (Semibold)
- **Line Height**: 1.3
- **Letter Spacing**: -0.01em
- **Usage**: Subsection headings, card titles
- **CSS Class**: `.text-h2` or use `<h2>` tag
- **Example**: `<h2 className="text-h2">Section Title</h2>`

### Heading 3
- **Font Size**: 18px (Compact)
- **Font Weight**: 600 (Semibold)
- **Line Height**: 1.35
- **Letter Spacing**: -0.005em
- **Usage**: Tertiary headings, smaller section titles
- **CSS Class**: `.text-h3` or use `<h3>` tag
- **Example**: `<h3 className="text-h3">Subsection</h3>`

### Subheading
- **Font Size**: 16px (Compact)
- **Font Weight**: 500 (Medium)
- **Line Height**: 1.4
- **Letter Spacing**: 0
- **Usage**: Descriptive text below headings, emphasized paragraphs
- **CSS Class**: `.text-subheading`
- **Example**: `<p className="text-subheading">Description text</p>`

### Body / Paragraph
- **Font Size**: 15px
- **Font Weight**: 400 (Regular)
- **Line Height**: 1.5
- **Letter Spacing**: 0
- **Usage**: Main content text, paragraphs, general text
- **CSS Class**: `.text-body` or use `<p>` tag
- **Example**: `<p className="text-body">Regular paragraph text</p>`

### Caption / Description
- **Font Size**: 13px
- **Font Weight**: 400 (Regular)
- **Line Height**: 1.4
- **Letter Spacing**: 0
- **Usage**: Secondary information, metadata, labels, helper text
- **CSS Class**: `.text-caption`
- **Example**: `<span className="text-caption">Last updated 2 hours ago</span>`

### Button Text
- **Font Size**: 14px
- **Font Weight**: 500 (Medium)
- **Line Height**: 1.4
- **Letter Spacing**: 0.01em
- **Usage**: All button labels, clickable text
- **CSS Class**: `.text-button`
- **Example**: `<button className="btn text-button">Click Me</button>`

### Overline / Small Text
- **Font Size**: 11px
- **Font Weight**: 500 (Medium)
- **Line Height**: 1.3
- **Letter Spacing**: 0.05em
- **Text Transform**: Uppercase
- **Usage**: Labels, tags, timestamps, very small text
- **CSS Class**: `.text-overline`
- **Example**: `<span className="text-overline">LABEL</span>`

## Migration Guide

### Old Patterns → New Patterns

1. **Page Titles**
   - `text-xl sm:text-2xl font-bold` → `text-h1`
   - `text-2xl font-bold` → `text-h1`
   - `text-xl font-bold` → `text-h1`

2. **Section Headings**
   - `text-lg font-bold` → `text-h2`
   - `text-lg font-semibold` → `text-h2`

3. **Subsection Headings**
   - `text-base font-semibold` → `text-h3`
   - `font-semibold` (with default size) → `text-h3`

4. **Body Text**
   - `text-sm` → `text-caption` (for secondary text)
   - `text-base` → `text-body` (for main content)
   - Default `<p>` → Uses `text-body` automatically

5. **Small Text**
   - `text-xs` → `text-overline` (for labels/tags)
   - `text-xs font-semibold` → `text-overline`

6. **Button Text**
   - `text-sm font-medium` → `text-button` (buttons already have this)
   - Remove `text-sm font-medium` from buttons

## CSS Variables

All typography values are defined as CSS variables in `index.css`:

```css
--typography-display-size: 32px;
--typography-display-weight: 700;
--typography-display-line-height: 1.2;
--typography-display-letter-spacing: -0.02em;

--typography-h1-size: 28px;
--typography-h1-weight: 700;
--typography-h1-line-height: 1.25;
--typography-h1-letter-spacing: -0.015em;

/* ... and so on for all styles */
```

## Tailwind Configuration

Typography utilities are also available in Tailwind config:

```js
fontSize: {
  'display': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
  'h1': ['28px', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '700' }],
  // ... etc
}
```

## Accessibility

All typography sizes meet WCAG AA standards:
- Minimum body text: 15px (exceeds 14px requirement)
- Line heights ensure readability
- Letter spacing improves legibility
- Font weights provide clear hierarchy

## Usage Examples

```jsx
// Page title
<h1 className="text-h1">Dashboard</h1>

// Section heading
<h2 className="text-h2">Recent Activity</h2>

// Subsection
<h3 className="text-h3">User Statistics</h3>

// Body text
<p className="text-body">This is regular paragraph text.</p>

// Caption/description
<span className="text-caption">Last updated 2 hours ago</span>

// Button (already includes text-button)
<button className="btn">Submit</button>

// Small label
<span className="text-overline">CATEGORY</span>
```

