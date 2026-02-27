'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, ReceiptText, FolderOpen, MapPin } from 'lucide-react';

const TABS = [
  { href: '/itinerary', icon: CalendarDays, label: 'Plan'   },
  { href: '/expenses',  icon: ReceiptText,  label: 'Splits' },
  { href: '/',          icon: Home,          label: 'Home'   },
  { href: '/docs',      icon: FolderOpen,    label: 'Docs'   },
  { href: '/places',    icon: MapPin,        label: 'Map'    },
] as const;

export default function BottomNav() {
  const path = usePathname();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <nav
        className="flex items-center gap-0 px-1.5 py-1 rounded-full pointer-events-auto"
        style={{
          background: 'rgba(18,18,22,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 6px 32px rgba(0,0,0,0.65)',
        }}
      >
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center justify-center gap-[2px] px-[14px] py-2 rounded-full transition-all duration-200"
            >
              {active && (
                <span className="absolute inset-0 bg-white/[0.08] rounded-full" />
              )}
              <Icon
                size={18}
                className={`relative z-10 transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}
                strokeWidth={active ? 2 : 1.6}
              />
              <span className={`relative z-10 text-[9px] leading-none tracking-wide transition-colors ${
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
