export function StarMark({
  size = 18,
  className,
  gradient = false,
}: {
  size?: number
  className?: string
  gradient?: boolean
}) {
  const id = `star-grad-${size}-${gradient ? 'g' : 's'}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {gradient && (
        <defs>
          <linearGradient id={id} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffe9b5" />
            <stop offset="0.55" stopColor="#ffd27a" />
            <stop offset="1" stopColor="#ffab6b" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 1.6c1.05 5.72 4.68 9.35 10.4 10.4-5.72 1.05-9.35 4.68-10.4 10.4-1.05-5.72-4.68-9.35-10.4-10.4C7.32 10.95 10.95 7.32 12 1.6Z"
        fill={gradient ? `url(#${id})` : 'currentColor'}
      />
    </svg>
  )
}
