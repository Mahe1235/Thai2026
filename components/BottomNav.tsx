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
      className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: 'rgba(9,9,11,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(4rem + env(safe-area-inset-bottom))',
      }}
    >
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 relative"
          >
            <div className={`flex items-center justify-center w-11 h-7 rounded-2xl transition-all duration-200 ${
              active ? 'bg-amber-500/12' : ''
            }`}>
              <Icon
                size={20}
                className={active ? 'text-gold' : 'text-muted'}
                strokeWidth={active ? 2.2 : 1.7}
              />
            </div>
            <span className={`text-[10px] tracking-wide transition-colors ${
              active ? 'text-gold font-semibold' : 'text-muted font-medium'
            }`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
