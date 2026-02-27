'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, ReceiptText, FolderOpen, MapPin } from 'lucide-react';

/* iOS-standard 49pt tab bar with safe-area support */

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
        background: 'rgba(22,22,24,0.82)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
    >
      {/* Hairline separator — matches iOS */}
      <div className="h-px w-full bg-white/[0.08]" />

      {/* 49px tab content */}
      <div className="flex items-end justify-around h-[49px] max-w-lg mx-auto pb-1">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-end gap-[2px] min-w-[64px] min-h-[44px]"
            >
              <Icon
                size={22}
                className={active ? 'text-primary' : 'text-[#8E8E93]'}
                strokeWidth={active ? 2 : 1.5}
              />
              <span
                className={`text-[10px] leading-none ${
                  active ? 'text-primary font-medium' : 'text-[#8E8E93]'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area spacer for notch devices */}
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}
