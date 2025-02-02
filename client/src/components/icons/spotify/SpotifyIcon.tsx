import React from "react";

interface SpotifyIconProps {
  size?: number;
  color?: string;
}

const SpotifyIcon: React.FC<SpotifyIconProps> = ({ size = 48, color = "currentColor" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="spotify-icon"
  >
    <circle cx="12" cy="12" r="10" stroke="none" fill="none" />
    <path
      d="M8 15.5c3-1.5 6.5-1.5 9.5 0M8 12c3.5-2 7.5-2 11 0M8 8.5c4-2.5 8.5-2.5 12.5 0"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export default SpotifyIcon;
