import Image from 'next/image'

/* ─── Types ──────────────────────────────────────────────── */
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  name?: string
  src?: string | null
  size?: AvatarSize
  online?: boolean
  className?: string
  color?: string   // override bg color (hex)
}

/* ─── Size map ───────────────────────────────────────────── */
const SIZE: Record<AvatarSize, { box: string; text: string; dot: string }> = {
  xs: { box: 'w-6 h-6',   text: 'text-[9px]',  dot: 'w-1.5 h-1.5 ring-1' },
  sm: { box: 'w-7 h-7',   text: 'text-[10px]', dot: 'w-2 h-2 ring-1'     },
  md: { box: 'w-8 h-8',   text: 'text-xs',     dot: 'w-2 h-2 ring-1'     },
  lg: { box: 'w-10 h-10', text: 'text-sm',     dot: 'w-2.5 h-2.5 ring-2' },
  xl: { box: 'w-14 h-14', text: 'text-lg',     dot: 'w-3 h-3 ring-2'     },
}

/* ─── Color palette from name hash ──────────────────────── */
const PALETTE = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#ef4444', // red
]

function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

/* ─── Component ──────────────────────────────────────────── */
export function Avatar({ name = '', src, size = 'md', online, className = '', color }: AvatarProps) {
  const s   = SIZE[size]
  const bg  = color ?? colorFromName(name || '?')
  const ini = initials(name)

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      <div
        className={`${s.box} rounded-full overflow-hidden flex items-center justify-center font-bold select-none`}
        style={{ backgroundColor: src ? undefined : bg }}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`${s.text} text-white tracking-tight`}>{ini || '?'}</span>
        )}
      </div>

      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${s.dot} rounded-full ring-white ${online ? 'bg-emerald-500' : 'bg-gray-300'}`}
        />
      )}
    </div>
  )
}

/* ─── Avatar group (stacked) ─────────────────────────────── */
interface AvatarGroupProps {
  users: { name?: string; src?: string | null }[]
  max?: number
  size?: AvatarSize
}

export function AvatarGroup({ users, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible  = users.slice(0, max)
  const overflow = users.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <div key={i} className="ring-2 ring-white rounded-full">
          <Avatar name={u.name} src={u.src} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={`${SIZE[size].box} rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center`}
        >
          <span className={`${SIZE[size].text} text-gray-500 font-semibold`}>+{overflow}</span>
        </div>
      )}
    </div>
  )
}
