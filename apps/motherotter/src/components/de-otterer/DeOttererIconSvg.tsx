import type { DeOttererIconSnapshot } from '@otter/renderer-api'

interface DeOttererIconSvgProps {
  icon: DeOttererIconSnapshot
  size?: number
  className?: string
}

export function DeOttererIconSvg({ icon, size = 24, className }: DeOttererIconSvgProps) {
  return (
    <svg
      viewBox={icon.viewBox}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {icon.paths.map((path, index) => (
        <path
          key={index}
          d={path}
          fill={icon.fill}
          stroke={icon.stroke}
          strokeWidth={icon.strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
