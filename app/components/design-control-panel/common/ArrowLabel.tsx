import { Text } from "@shopify/polaris";

interface ArrowLabelProps {
  label: string;
  position?: "top" | "bottom" | "left" | "right";
  horizontalOffset?: number;
  verticalDistance?: number;
  horizontalDistance?: number;
}

export function ArrowLabel({
  label,
  position = "top",
  horizontalOffset = 0,
  verticalDistance = 150,
  horizontalDistance = 120,
}: ArrowLabelProps) {
  const arrowColor = "#6B7280";
  const strokeWidth = 1.5;

  // Calculate positions based on direction
  const getArrowStyles = () => {
    switch (position) {
      case "top":
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
              {/* Arrowhead pointing down */}
              <polygon points={`1,${verticalDistance - 40} 4,${verticalDistance - 46} 1,${verticalDistance - 36} -2,${verticalDistance - 46}`} fill={arrowColor}/>
            </>
          ),
          svgStyle: { marginTop: "8px" },
          svgDimensions: { width: 6, height: verticalDistance - 32 },
        };
      case "bottom":
        return {
          containerStyle: {
            position: "absolute" as const,
            bottom: `-${verticalDistance}px`,
            left: horizontalOffset === 0 ? "50%" : `${horizontalOffset}px`,
            transform: horizontalOffset === 0 ? "translateX(-50%)" : "none",
            display: "flex",
            flexDirection: "column-reverse" as const,
            alignItems: "center",
            pointerEvents: "none" as const,
          },
          svgContent: (
            <>
              {/* Vertical line up */}
              <line x1="1" y1={verticalDistance - 32} x2="1" y2="8" stroke={arrowColor} strokeWidth={strokeWidth}/>
              {/* Arrowhead pointing up */}
              <polygon points="1,8 4,14 1,4 -2,14" fill={arrowColor}/>
            </>
          ),
          svgStyle: { marginBottom: "8px" },
          svgDimensions: { width: 6, height: verticalDistance - 32 },
        };
      case "left":
        return {
          containerStyle: {
            position: "absolute" as const,
            left: `-${horizontalDistance}px`,
            top: horizontalOffset === 0 ? "50%" : `${horizontalOffset}px`,
            transform: horizontalOffset === 0 ? "translateY(-50%)" : "none",
            display: "flex",
            flexDirection: "row" as const,
            alignItems: "center",
            pointerEvents: "none" as const,
          },
          svgContent: (
            <>
              {/* Horizontal line right */}
              <line x1="8" y1="1" x2={horizontalDistance - 40} y2="1" stroke={arrowColor} strokeWidth={strokeWidth}/>
              {/* Arrowhead pointing right */}
              <polygon points={`${horizontalDistance - 40},1 ${horizontalDistance - 46},-2 ${horizontalDistance - 36},1 ${horizontalDistance - 46},4`} fill={arrowColor}/>
            </>
          ),
          svgStyle: { marginRight: "8px" },
          svgDimensions: { width: horizontalDistance - 32, height: 6 },
        };
      case "right":
        return {
          containerStyle: {
            position: "absolute" as const,
            right: `-${horizontalDistance}px`,
            top: horizontalOffset === 0 ? "50%" : `${horizontalOffset}px`,
            transform: horizontalOffset === 0 ? "translateY(-50%)" : "none",
            display: "flex",
            flexDirection: "row-reverse" as const,
            alignItems: "center",
            pointerEvents: "none" as const,
          },
          svgContent: (
            <>
              {/* Horizontal line left */}
              <line x1={horizontalDistance - 32} y1="1" x2="8" y2="1" stroke={arrowColor} strokeWidth={strokeWidth}/>
              {/* Arrowhead pointing left */}
              <polygon points="8,1 14,-2 4,1 14,4" fill={arrowColor}/>
            </>
          ),
          svgStyle: { marginLeft: "8px" },
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
