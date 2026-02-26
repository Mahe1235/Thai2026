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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex bg-surface/95 backdrop-blur-lg border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(4rem + env(safe-area-inset-bottom))' }}
    >
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 relative"
          >
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-gold"
              />
            )}
            <Icon
              size={21}
              className={active ? 'text-gold' : 'text-muted'}
              strokeWidth={active ? 2.5 : 1.8}
            />
            <span
              className={`text-[10px] font-medium tracking-wide ${
                active ? 'text-gold' : 'text-muted'
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
