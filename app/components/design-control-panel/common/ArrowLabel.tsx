import { Text } from "@shopify/polaris";

interface ArrowLabelProps {
  label: string;
  position?: "top" | "bottom" | "left" | "right";
  horizontalOffset?: number;
  verticalDistance?: number;
  horizontalDistance?: number;
  verticalOffset?: number;
}

export function ArrowLabel({
  label,
  position = "top",
  horizontalOffset = 0,
  verticalDistance = 150,
  horizontalDistance = 120,
  verticalOffset = 0,
}: ArrowLabelProps) {
  const arrowColor = "#6B7280";
  const strokeWidth = 1.5;

  // Calculate positions based on direction
  // Label is always at the tail, arrowhead points towards component
  const getArrowStyles = () => {
    switch (position) {
      case "top":
        // Label is above component, arrow points DOWN to component
        return {
          containerStyle: {
            position: "absolute" as const,
            top: `-${verticalDistance}px`,
            left: horizontalOffset === 0 ? "50%" : `${horizontalOffset}px`,
            transform: horizontalOffset === 0 ? "translateX(-50%)" : "none",
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            pointerEvents: "none" as const,
          },
          svgContent: (
            <>
              {/* Vertical line down */}
              <line x1="1" y1="0" x2="1" y2={verticalDistance - 40} stroke={arrowColor} strokeWidth={strokeWidth}/>
              {/* Arrowhead pointing down towards component */}
              <polygon points={`1,${verticalDistance - 40} -3,${verticalDistance - 46} 5,${verticalDistance - 46}`} fill={arrowColor}/>
            </>
          ),
          svgStyle: { marginTop: "8px" },
          svgDimensions: { width: 10, height: verticalDistance - 32 },
        };
      case "bottom":
        // Label is below component, arrow points UP to component
        return {
          containerStyle: {
            position: "absolute" as const,
            bottom: `-${verticalDistance}px`,
            left: horizontalOffset === 0 ? "50%" : `${horizontalOffset}px`,
            transform: horizontalOffset === 0 ? "translateX(-50%)" : "none",
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            pointerEvents: "none" as const,
          },
          svgContent: (
            <>
              {/* Vertical line up */}
              <line x1="1" y1={verticalDistance - 32} x2="1" y2="8" stroke={arrowColor} strokeWidth={strokeWidth}/>
              {/* Arrowhead pointing up towards component */}
              <polygon points="1,8 -3,14 5,14" fill={arrowColor}/>
            </>
          ),
          svgStyle: { marginBottom: "8px" },
          svgDimensions: { width: 10, height: verticalDistance - 32 },
        };
      case "left":
        // Label is to the left of component, arrow points RIGHT to component
        return {
          containerStyle: {
            position: "absolute" as const,
            left: `-${horizontalDistance}px`,
            top: verticalOffset !== 0 ? `${verticalOffset}px` : "50%",
            transform: verticalOffset === 0 ? "translateY(-50%)" : "none",
            display: "flex",
            flexDirection: "row" as const,
            alignItems: "center",
            pointerEvents: "none" as const,
          },
          svgContent: (
            <>
              {/* Horizontal line right */}
              <line x1="0" y1="1" x2={horizontalDistance - 40} y2="1" stroke={arrowColor} strokeWidth={strokeWidth}/>
              {/* Arrowhead pointing right towards component */}
              <polygon points={`${horizontalDistance - 40},1 ${horizontalDistance - 46},-3 ${horizontalDistance - 46},5`} fill={arrowColor}/>
            </>
          ),
          svgStyle: { marginLeft: "8px" },
          svgDimensions: { width: horizontalDistance - 32, height: 6 },
        };
      case "right":
        // Label is to the right of component, arrow points LEFT to component
        return {
          containerStyle: {
            position: "absolute" as const,
            right: `-${horizontalDistance}px`,
            top: verticalOffset !== 0 ? `${verticalOffset}px` : "50%",
            transform: verticalOffset === 0 ? "translateY(-50%)" : "none",
            display: "flex",
            flexDirection: "row" as const,
            alignItems: "center",
            pointerEvents: "none" as const,
          },
          svgContent: (
            <>
              {/* Horizontal line left */}
              <line x1={horizontalDistance - 32} y1="1" x2="8" y2="1" stroke={arrowColor} strokeWidth={strokeWidth}/>
              {/* Arrowhead pointing left towards component */}
              <polygon points="8,1 14,-3 14,5" fill={arrowColor}/>
            </>
          ),
          svgStyle: { marginRight: "8px" },
          svgDimensions: { width: horizontalDistance - 32, height: 6 },
        };
      default:
        return {
          containerStyle: {},
          svgContent: null,
          svgStyle: {},
          svgDimensions: { width: 0, height: 0 },
        };
    }
  };

  const { containerStyle, svgContent, svgStyle, svgDimensions } = getArrowStyles();

  return (
    <div style={containerStyle}>
      {position === "top" || position === "left" ? (
        <>
          <Text as="p" variant="bodySm" tone="subdued" fontWeight="medium">
            {label}
          </Text>
          <svg width={svgDimensions.width} height={svgDimensions.height} style={svgStyle}>
            {svgContent}
          </svg>
        </>
      ) : (
        <>
          <svg width={svgDimensions.width} height={svgDimensions.height} style={svgStyle}>
            {svgContent}
          </svg>
          <Text as="p" variant="bodySm" tone="subdued" fontWeight="medium">
            {label}
          </Text>
        </>
      )}
    </div>
  );
}
