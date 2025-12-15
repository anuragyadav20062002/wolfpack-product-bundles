/**
 * Centralized SVG Icons for Design Control Panel
 *
 * All SVG icons used in the DCP previews are defined here for:
 * - Consistency across components
 * - Easy maintenance and updates
 * - Reusability
 */

import React from "react";

interface IconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  className?: string;
}

/**
 * Shopping Cart Icon - Typical e-commerce style
 * Used in: Bundle Footer preview
 */
export function ShoppingCartIcon({
  width = 18,
  height = 18,
  color = "currentColor",
  className
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="9" cy="21" r="1" fill={color} stroke="none"/>
      <circle cx="20" cy="21" r="1" fill={color} stroke="none"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

/**
 * Image Placeholder Icon
 * Used in: Empty State cards
 */
export function ImagePlaceholderIcon({
  width = 69,
  height = 69,
  color = "#666",
  className
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 69 69"
      fill="none"
      className={className}
    >
      <rect width="69" height="69" rx="8" fill={color} opacity="0.1"/>
      <path
        d="M24.5 34.5L28.5 30.5L37.5 39.5L44.5 32.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
      <circle cx="40" cy="28" r="2.5" fill={color} opacity="0.4"/>
    </svg>
  );
}

/**
 * Plus Icon
 * Used in: Empty State cards (alternative)
 */
export function PlusIcon({
  width = 69,
  height = 69,
  color = "#666",
  className
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 69 69"
      fill="none"
      className={className}
    >
      <line
        x1="34.5"
        y1="15"
        x2="34.5"
        y2="54"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="15"
        y1="34.5"
        x2="54"
        y2="34.5"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Close Icon with circular background
 * Used in: Clear badge on step cards
 */
export function CloseIcon({
  width = 24,
  height = 24,
  color = "#000",
  bgColor = "#f3f4f6",
  className
}: IconProps & { bgColor?: string }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="12" r="12" fill={bgColor}/>
      <path
        d="M8 8L16 16M16 8L8 16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
