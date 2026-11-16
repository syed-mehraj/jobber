import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const small = (props: IconProps) => ({
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

const large = (props: IconProps) => ({
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const PlusIcon = (p: IconProps) => (
  <svg {...small(p)} strokeWidth={1.8}>
    <path d="M8 3v10M3 8h10" />
  </svg>
)

export const MenuIcon = (p: IconProps) => (
  <svg {...small(p)} strokeWidth={1.6}>
    <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
  </svg>
)

export const CloseIcon = (p: IconProps) => (
  <svg {...small(p)} strokeWidth={1.6}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
)

export const DashboardIcon = (p: IconProps) => (
  <svg {...large(p)}>
    <rect x="3" y="3" width="6" height="6" rx="1.5" />
    <rect x="11" y="3" width="6" height="6" rx="1.5" />
    <rect x="3" y="11" width="6" height="6" rx="1.5" />
    <rect x="11" y="11" width="6" height="6" rx="1.5" />
  </svg>
)

export const ResumeIcon = (p: IconProps) => (
  <svg {...large(p)}>
    <path d="M6 2.5h6l3.5 3.5v11a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1v-13.5a1 1 0 0 1 1-1z" />
    <path d="M8 10h5M8 13h5" />
  </svg>
)

export const JobsIcon = (p: IconProps) => (
  <svg {...large(p)}>
    <rect x="2.5" y="6" width="15" height="11" rx="2" />
    <path d="M7 6V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V6" />
  </svg>
)

export const ApplicationsIcon = (p: IconProps) => (
  <svg {...large(p)}>
    <rect x="2.5" y="3" width="4.5" height="14" rx="1.2" />
    <rect x="9" y="3" width="4.5" height="9" rx="1.2" />
    <rect x="15.5" y="3" width="2" height="6" rx="1" />
  </svg>
)

export const CompaniesIcon = (p: IconProps) => (
  <svg {...large(p)}>
    <path d="M3 17V7l7-4 7 4v10" />
    <path d="M8 17v-5h4v5" />
  </svg>
)

export const LocationIcon = (p: IconProps) => (
  <svg {...large(p)}>
    <path d="M10 17s-5.5-4.6-5.5-9a5.5 5.5 0 0 1 11 0c0 4.4-5.5 9-5.5 9z" />
    <circle cx="10" cy="8" r="2" />
  </svg>
)

export const BellIcon = (p: IconProps) => (
  <svg {...large(p)}>
    <path d="M5 8a5 5 0 0 1 10 0v3.5l1.5 2.5h-13L5 11.5V8z" />
    <path d="M8.2 16.5a2 2 0 0 0 3.6 0" />
  </svg>
)

export const SwatchIcon = (p: IconProps) => (
  <svg {...large(p)}>
    <rect x="3" y="3" width="6" height="14" rx="2" />
    <path d="M9 7.5l4-3.2 3 3.6-7 5.6" />
    <circle cx="6" cy="13.5" r="1" />
  </svg>
)

export const ExternalIcon = (p: IconProps) => (
  <svg {...small(p)} strokeWidth={1.6}>
    <path d="M6 3.5H3.5v9h9V10M9 3h4v4M13 3L7.5 8.5" />
  </svg>
)

export const CheckIcon = (p: IconProps) => (
  <svg {...small(p)} strokeWidth={1.8}>
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
)

export const CompassIcon = (p: IconProps) => (
  <svg {...large(p)}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M12.8 7.2l-1.6 4-4 1.6 1.6-4z" />
  </svg>
)
