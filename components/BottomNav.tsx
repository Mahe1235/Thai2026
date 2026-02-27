'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, ReceiptText, FolderOpen, MapPin } from 'lucide-react';

const TABS = [
  { href: '/itinerary', icon: CalendarDays,  label: 'Itinerary' },
  { href: '/expenses',  icon: ReceiptText,   label: 'Expenses'  },
  { href: '/',          icon: Home,           label: 'Today'     },
  { href: '/docs',      icon: FolderOpen,     label: 'Docs'      },
  { href: '/places',    icon: MapPin,         label: 'Places'    },
] as const;

export default function BottomNav() {
  const path = usePathname();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <nav
        className="flex items-center gap-0.5 px-2 py-1.5 rounded-full pointer-events-auto"
        style={{
          background: 'rgba(16,16,18,0.97)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 8px 40px rgba(0,0,0,0.7)',
        }}
      >
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center justify-center gap-0.5 px-[18px] py-2.5 rounded-full transition-all duration-200"
            >
              {active && (
                <span className="absolute inset-0 bg-white/[0.09] rounded-full" />
              )}
              <Icon
                size={20}
                className={`relative z-10 transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}
                strokeWidth={active ? 2 : 1.7}
              />
              <span className={`relative z-10 text-[9px] tracking-wide transition-colors ${
                active ? 'text-white font-medium' : 'text-zinc-600'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
