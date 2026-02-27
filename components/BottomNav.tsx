'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, ReceiptText, FolderOpen, MapPin } from 'lucide-react';

const TABS = [
  { href: '/itinerary', icon: CalendarDays, label: 'Plan'     },
  { href: '/expenses',  icon: ReceiptText,  label: 'Expenses' },
  { href: '/',          icon: Home,          label: 'Home'     },
  { href: '/docs',      icon: FolderOpen,    label: 'Docs'     },
  { href: '/places',    icon: MapPin,        label: 'Places'   },
] as const;

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50"
      style={{
        background: 'rgba(9,9,11,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Top border */}
      <div className="h-px bg-white/[0.06]" />

      {/* Tab items */}
      <div className="flex justify-around items-center h-[52px] max-w-lg mx-auto px-2">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-[3px] min-w-[56px] py-1"
            >
              <Icon
                size={20}
                className={`transition-colors ${active ? 'text-primary' : 'text-zinc-500'}`}
                strokeWidth={active ? 2.2 : 1.5}
              />
              <span className={`text-[10px] leading-none transition-colors ${
                active ? 'text-primary font-semibold' : 'text-zinc-500'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area spacer */}
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}
