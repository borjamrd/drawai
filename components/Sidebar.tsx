'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Library, PlusSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Generador', href: '/', icon: LayoutDashboard },
  { name: 'Biblioteca', href: '/recursos', icon: Library },
  { name: 'Nuevo Recurso', href: '/recursos/crear-recurso', icon: PlusSquare },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex h-14 items-center gap-2 px-5 border-b border-zinc-100 dark:border-zinc-800/60">
        <span className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
          DrawAI
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </div>

      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150',
                isActive
                  ? 'text-zinc-950 dark:text-white bg-zinc-100 dark:bg-zinc-800/60'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-zinc-950 dark:bg-white" />
              )}
              <item.icon
                className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
