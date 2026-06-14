export function CharacterBodySilhouette() {
  return (
    <svg
      className="character-body-silhouette-svg"
      viewBox="0 0 120 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        {/* Head */}
        <ellipse cx="60" cy="24" rx="16" ry="18" fill="rgba(74, 111, 165, 0.12)" />
        {/* Neck */}
        <rect x="54" y="40" width="12" height="10" rx="3" fill="rgba(74, 111, 165, 0.1)" />
        {/* Torso */}
        <path
          d="M38 50 L82 50 L76 118 L44 118 Z"
          fill="rgba(74, 111, 165, 0.14)"
        />
        {/* Left arm */}
        <path
          d="M38 52 L18 58 L14 98 L26 96 L32 68 Z"
          fill="rgba(74, 111, 165, 0.1)"
        />
        {/* Right arm */}
        <path
          d="M82 52 L102 58 L106 98 L94 96 L88 68 Z"
          fill="rgba(74, 111, 165, 0.1)"
        />
        {/* Hips */}
        <path
          d="M44 118 L76 118 L72 132 L48 132 Z"
          fill="rgba(74, 111, 165, 0.12)"
        />
        {/* Left leg */}
        <path
          d="M48 132 L58 132 L54 198 L42 198 L44 132 Z"
          fill="rgba(74, 111, 165, 0.1)"
        />
        {/* Right leg */}
        <path
          d="M62 132 L72 132 L78 198 L66 198 L62 132 Z"
          fill="rgba(74, 111, 165, 0.1)"
        />
        {/* Left foot */}
        <ellipse cx="48" cy="204" rx="10" ry="5" fill="rgba(74, 111, 165, 0.12)" />
        {/* Right foot */}
        <ellipse cx="72" cy="204" rx="10" ry="5" fill="rgba(74, 111, 165, 0.12)" />
      </g>
      <g
        fill="none"
        stroke="rgba(120, 150, 190, 0.45)"
        strokeWidth="1.25"
        strokeLinejoin="round"
      >
        <ellipse cx="60" cy="24" rx="16" ry="18" />
        <path d="M38 50 L82 50 L76 118 L44 118 Z" />
        <path d="M38 52 L18 58 L14 98 L26 96 L32 68 Z" />
        <path d="M82 52 L102 58 L106 98 L94 96 L88 68 Z" />
        <path d="M44 118 L76 118 L72 132 L48 132 Z" />
        <path d="M48 132 L58 132 L54 198 L42 198 Z" />
        <path d="M62 132 L72 132 L78 198 L66 198 Z" />
        <ellipse cx="48" cy="204" rx="10" ry="5" />
        <ellipse cx="72" cy="204" rx="10" ry="5" />
      </g>
    </svg>
  )
}
