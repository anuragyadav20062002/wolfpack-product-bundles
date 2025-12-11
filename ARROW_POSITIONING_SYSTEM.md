# Arrow Positioning System

## Overview

The Arrow Positioning System provides visual guidance in the Design Control Panel (DCP) modal by connecting control labels to their corresponding preview components using directional arrows.

## Core Principle

**Arrows point FROM label TO component**: The label appears at the tail of the arrow, while the arrowhead points directly at the component being controlled.

## Component Location

`app/components/design-control-panel/common/ArrowLabel.tsx`

## Props Interface

```typescript
interface ArrowLabelProps {
  label: string;                    // Text displayed at arrow tail
  position?: "top" | "bottom" | "left" | "right";  // Arrow direction
  horizontalOffset?: number;        // Horizontal shift of entire arrow (default: 0)
  verticalDistance?: number;        // Length of vertical arrows (default: 120)
  horizontalDistance?: number;      // Length of horizontal arrows (default: 120)
  verticalOffset?: number;          // Vertical shift for horizontal arrows (default: 0)
}
```

## Position Types

### Top Position
- **Label location**: Above the component
- **Arrow direction**: Points DOWN towards component
- **Use case**: Controls affecting components below the label
- **Key props**: `verticalDistance`, `horizontalOffset`

```typescript
<ArrowLabel
  label="Product Title"
  position="top"
  verticalDistance={140}
  horizontalOffset={10}
/>
```

### Bottom Position
- **Label location**: Below the component
- **Arrow direction**: Points UP towards component
- **Use case**: Controls affecting components above the label
- **Key props**: `verticalDistance`, `horizontalOffset`

```typescript
<ArrowLabel
  label="Add to Bundle Button"
  position="bottom"
  verticalDistance={130}
/>
```

### Left Position
- **Label location**: Left of the component
- **Arrow direction**: Points RIGHT towards component
- **Use case**: Controls affecting components to the right
- **Key props**: `horizontalDistance`, `verticalOffset`

```typescript
<ArrowLabel
  label="Product Card"
  position="left"
  horizontalDistance={160}
  verticalOffset={-80}
/>
```

### Right Position
- **Label location**: Right of the component
- **Arrow direction**: Points LEFT towards component
- **Use case**: Controls affecting components to the left
- **Key props**: `horizontalDistance`, `verticalOffset`

```typescript
<ArrowLabel
  label="Variant Selector"
  position="right"
  horizontalDistance={140}
/>
```

## Adjustment Parameters

### verticalDistance
- **Applies to**: `top` and `bottom` positions
- **Purpose**: Controls arrow length (distance from label to component)
- **Default**: 120px
- **Typical range**: 100-200px
- **Usage**: Increase to reach components further away vertically

### horizontalDistance
- **Applies to**: `left` and `right` positions
- **Purpose**: Controls arrow length (distance from label to component)
- **Default**: 120px
- **Typical range**: 100-200px
- **Usage**: Increase to reach components further away horizontally

### horizontalOffset
- **Applies to**: `top` and `bottom` positions
- **Purpose**: Shifts arrow left (negative) or right (positive)
- **Default**: 0px
- **Typical range**: -100 to +100px
- **Usage**: Align arrow with off-center components

### verticalOffset
- **Applies to**: `left` and `right` positions
- **Purpose**: Shifts arrow up (negative) or down (positive)
- **Default**: 0px
- **Typical range**: -200 to +200px
- **Usage**: Align arrow with vertically displaced components

## Implementation Examples

### Product Card Section

```typescript
if (activeSubSection === "productCard") {
  return (
    <>
      <ArrowLabel
        label="Product Card"
        position="left"
        horizontalDistance={160}
        verticalOffset={-80}  // Moves arrow up to point at card container
      />
      <ArrowLabel
        label="Product Image"
        position="top"
        verticalDistance={150}  // Long arrow to reach image at top
      />
    </>
  );
}
```

### Product Card Typography Section

```typescript
if (activeSubSection === "productCardTypography") {
  return (
    <>
      <ArrowLabel
        label="Product Title"
        position="top"
        verticalDistance={140}
      />
      <ArrowLabel
        label="Product Prices"
        position="bottom"
        verticalDistance={140}
      />
    </>
  );
}
```

### Button Section

```typescript
if (activeSubSection === "button") {
  return (
    <ArrowLabel
      label="Add to Bundle Button"
      position="bottom"
      verticalDistance={130}
    />
  );
}
```

### Quantity & Variant Selector Section

```typescript
if (activeSubSection === "quantityVariantSelector") {
  return (
    <>
      <ArrowLabel
        label="Quantity Selector"
        position="top"
        verticalDistance={140}
      />
      <ArrowLabel
        label="Variant Selector"
        position="bottom"
        verticalDistance={100}
      />
    </>
  );
}
```

## Visual Testing & Adjustment

When implementing arrows for a new section:

1. **Start with defaults**: Use position-appropriate defaults
   - Vertical arrows: `verticalDistance={120}`
   - Horizontal arrows: `horizontalDistance={120}`

2. **Test in browser**: Open DCP modal and navigate to the section

3. **Adjust length**: Modify distance values if arrow doesn't reach component
   - Too short: Increase `verticalDistance` or `horizontalDistance`
   - Too long: Decrease distance values

4. **Align arrow**: Use offset values for precise positioning
   - Off-center horizontally: Adjust `horizontalOffset` (for top/bottom arrows)
   - Off-center vertically: Adjust `verticalOffset` (for left/right arrows)

5. **Multiple arrows**: When using multiple arrows, adjust each independently

## Technical Implementation

### SVG Structure

Each arrow is rendered as an SVG with:
- **Line element**: Connects label to component
- **Polygon element**: Creates arrowhead pointing at component
- **Text element**: Displays label at arrow tail

### Positioning Logic

```typescript
// Top position example
case "top":
  return {
    containerStyle: {
      top: `-${verticalDistance}px`,  // Position above component
      left: horizontalOffset !== 0 ? `${horizontalOffset}px` : "50%",
      transform: horizontalOffset === 0 ? "translateX(-50%)" : "none",
    },
    svgContent: (
      <>
        <line x1="1" y1="0" x2="1" y2={verticalDistance - 40} />
        {/* Arrowhead points DOWN to component */}
        <polygon
          points={`1,${verticalDistance - 40} -3,${verticalDistance - 46} 5,${verticalDistance - 46}`}
        />
      </>
    ),
  };
```

## Best Practices

1. **Use appropriate position**: Choose based on preview layout and available space
2. **Minimize overlaps**: Adjust offsets to prevent arrows from crossing
3. **Keep labels concise**: Short labels (2-4 words) work best
4. **Test responsiveness**: Verify arrows work at different DCP modal sizes
5. **Match Figma design**: Reference design specs for exact positioning
6. **Group related arrows**: Use multiple arrows when one subsection controls multiple UI elements

## Common Patterns

### Pointing to stacked elements
```typescript
<>
  <ArrowLabel label="Top Element" position="top" verticalDistance={100} />
  <ArrowLabel label="Bottom Element" position="bottom" verticalDistance={100} />
</>
```

### Pointing to side-by-side elements
```typescript
<>
  <ArrowLabel label="Left Element" position="left" horizontalDistance={150} verticalOffset={-50} />
  <ArrowLabel label="Right Element" position="right" horizontalDistance={150} verticalOffset={50} />
</>
```

### Pointing to nested elements
```typescript
<>
  <ArrowLabel label="Container" position="left" horizontalDistance={160} verticalOffset={-100} />
  <ArrowLabel label="Inner Element" position="top" verticalDistance={140} horizontalOffset={20} />
</>
```

## Troubleshooting

### Arrow doesn't reach component
- Increase `verticalDistance` or `horizontalDistance`

### Arrow points to wrong element
- Adjust `horizontalOffset` (for vertical arrows) or `verticalOffset` (for horizontal arrows)

### Arrow overlaps with other UI
- Try different position (top/bottom/left/right)
- Adjust offset values to shift arrow away from obstruction

### Multiple arrows collide
- Adjust offsets to separate arrows
- Consider using different positions for each arrow

### Label is cut off
- Ensure sufficient space in preview container
- Try shorter label text
- Adjust positioning to move label to clearer area
