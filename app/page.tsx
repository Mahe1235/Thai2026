'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plane, Wind, Droplets, CalendarDays, ReceiptText,
  MapPin, FolderOpen, ArrowRight,
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { fetchWeather, weatherInfo } from '@/lib/weather';
import type { WeatherData } from '@/lib/weather';
import { TRIP, FLIGHTS, ITINERARY_DAYS, TOTAL_CASH, MEMBERS } from '@/lib/constants';
import { fmtBaht, getTripDay } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const MEMBER_COLORS = ['#F5C842', '#00C9A7', '#FF7EB3', '#7C83FD', '#FF9A3C', '#4ECDC4', '#C471ED'];

/* ── Helpers ── */
function getDiff(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1_000),
  };
}
function pad(n: number) { return String(n).padStart(2, '0'); }
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── Section header (iOS grouped style) ── */
function SectionHeader({ title, action }: { title: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <h2 className="text-[13px] font-medium text-muted-foreground">{title}</h2>
      {action && (
        <Link href={action.href} className="text-[13px] text-primary font-medium">
          {action.label}
        </Link>
      )}
    </div>
  );
}

/* ── Quick access config ── */
const QUICK = [
  { href: '/itinerary', icon: CalendarDays, label: 'Itinerary', sub: '5 days · Phuket & BKK',    bg: 'bg-amber-500/10',  fg: 'text-amber-400'  },
  { href: '/expenses',  icon: ReceiptText,  label: 'Expenses',  sub: '₿70k pool · split',        bg: 'bg-teal-500/10',   fg: 'text-teal-400'   },
  { href: '/docs',      icon: FolderOpen,   label: 'Documents', sub: 'TDAC · VOA · Flights',      bg: 'bg-violet-500/10', fg: 'text-violet-400' },
  { href: '/places',    icon: MapPin,       label: 'Places',    sub: 'Map · saved spots',         bg: 'bg-sky-500/10',    fg: 'text-sky-400'    },
];

/* ── Main Page ── */
export default function TodayPage() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [stats, setStats] = useState<{ remaining: number; spent: number; splitTotal: number } | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    tick.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick.current);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const loc = today >= '2026-03-03'
      ? { lat: 13.75, lon: 100.52, name: 'Bangkok' }
      : { lat: 7.89,  lon: 98.40,  name: 'Phuket'  };
    fetchWeather(loc.lat, loc.lon, loc.name).then(setWeather);
  }, []);

  useEffect(() => {
    (async () => {
      const [cash, split] = await Promise.all([
        db.from('cash_transactions').select('type,amount'),
        db.from('split_expenses').select('amount'),
      ]);
      const tx = cash.data ?? [];
      const spent = tx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const distributed = tx.filter(t => t.type === 'cash').reduce((s, t) => s + Number(t.amount), 0);
      const splitTotal = (split.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
      setStats({ remaining: TOTAL_CASH - spent - distributed, spent, splitTotal });
    })();
  }, []);

  const isPreTrip  = now < TRIP.departure;
  const isPostTrip = now > TRIP.end;
  const tripDay    = getTripDay();
  const dayData    = tripDay ? ITINERARY_DAYS[tripDay - 1] : null;
  const nextFlight = FLIGHTS.find(f => new Date(f.depUTC) > now);
  const diff       = isPreTrip ? getDiff(TRIP.departure) : null;
  const poolPct    = stats ? Math.max(0, Math.min(100, Math.round(stats.remaining / TOTAL_CASH * 100))) : 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-14 pb-4 flex flex-col gap-7">

      {/* ━━━ Header ━━━ */}
      <motion.header initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="px-1">
        <h1 className="text-[28px] font-bold tracking-tight leading-tight">{greeting()}</h1>
        {isPreTrip && diff && (
          <p className="text-[15px] text-muted-foreground mt-1">
            {diff.d === 0 ? 'Flight day — time to go.' :
             diff.d === 1 ? 'Departing tomorrow from BLR.' :
             `Thailand in ${diff.d} day${diff.d !== 1 ? 's' : ''}.`}
          </p>
        )}
        {tripDay && dayData && (
          <p className="text-[15px] text-muted-foreground mt-1">Day {tripDay} of 5 · {dayData.location}</p>
        )}
        {isPostTrip && (
          <p className="text-[15px] text-muted-foreground mt-1">Thailand 2026 — what a trip.</p>
        )}
      </motion.header>

      {/* ━━━ Countdown ━━━ */}
      {isPreTrip && diff && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <SectionHeader title="Departure" />
          <Card>
            <div className="py-6 px-4 flex justify-center gap-6">
              {[
                { v: pad(diff.d), u: 'days' },
                { v: pad(diff.h), u: 'hrs' },
                { v: pad(diff.m), u: 'min' },
                { v: pad(diff.s), u: 'sec' },
              ].map(({ v, u }) => (
                <div key={u} className="flex flex-col items-center gap-1">
                  <span className="font-mono text-[26px] font-bold leading-none tnum">{v}</span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{u}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.section>
      )}

      {/* ━━━ Up Next (during trip) ━━━ */}
      {tripDay && dayData && (() => {
        const nowStr = now.toTimeString().slice(0, 5);
        const upcoming = dayData.activities.filter(a => a.time >= nowStr);
        const next = upcoming[0];
        if (!next) return null;
        return (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
            <SectionHeader title="Up Next" />
            <Card>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-[22px] leading-none mt-0.5">{next.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold">{next.label}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                      {next.time}{next.note ? ` · ${next.note}` : ''}
                    </p>
                  </div>
                </div>
                {upcoming[1] && (
                  <>
                    <Separator className="my-3" />
                    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <span>{upcoming[1].emoji}</span>
                      <span className="font-mono">{upcoming[1].time}</span>
                      <span className="opacity-40">·</span>
                      <span className="truncate">{upcoming[1].label}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.section>
        );
      })()}

      {/* ━━━ Weather ━━━ */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <SectionHeader title="Weather" />
        {weather ? (() => {
          const info = weatherInfo(weather.code);
          return (
            <Card>
              <div className="p-4 flex items-center gap-4">
                <span className="text-[28px] leading-none shrink-0">{info.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[17px] font-bold">{weather.temp}°C</span>
                    <span className="text-[13px] text-muted-foreground">{info.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Droplets size={11} /> {weather.humidity}%</span>
                    <span className="flex items-center gap-1"><Wind size={11} /> {weather.windSpeed} km/h</span>
                    <span className="flex items-center gap-1"><MapPin size={11} /> {weather.location}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })() : (
          <div className="skeleton h-[72px] rounded-xl" />
        )}
      </motion.section>

      {/* ━━━ Money ━━━ */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <SectionHeader title="Money" action={{ label: 'Details', href: '/expenses' }} />
        <Link href="/expenses" className="block active:opacity-70 transition-opacity">
          <Card>
            <div className="p-4">

              {/* Hero */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">Pool remaining</p>
                  {stats
                    ? <p className="font-mono text-[22px] font-bold text-teal leading-none">{fmtBaht(stats.remaining)}</p>
                    : <div className="skeleton h-6 w-28 rounded" />
                  }
                </div>
                <Badge variant="outline" className="text-[11px] text-teal border-teal/20 font-mono mt-3">
                  {stats ? `${poolPct}%` : '···'}
                </Badge>
              </div>

              {/* Progress */}
              <div className="mt-4 h-[6px] bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${poolPct}%`, background: 'linear-gradient(90deg, #2DD4BF, #0EA5E9)' }}
                />
              </div>

              <Separator className="my-4" />

              {/* Stats */}
              <div className="grid grid-cols-3 text-center">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Total</p>
                  <p className="font-mono text-[13px] font-semibold">{fmtBaht(TOTAL_CASH)}</p>
                </div>
                <div className="border-x border-border/50">
                  <p className="text-[11px] text-muted-foreground mb-1">Spent</p>
                  <p className={`font-mono text-[13px] font-semibold ${stats?.spent ? 'text-primary' : ''}`}>
                    {stats ? fmtBaht(stats.spent) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Split</p>
                  <p className="font-mono text-[13px] font-semibold">
                    {stats ? fmtBaht(stats.splitTotal) : '—'}
                  </p>
                </div>
              </div>

            </div>
          </Card>
        </Link>
      </motion.section>

      {/* ━━━ Flight ━━━ */}
      {nextFlight && !isPostTrip && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionHeader title={isPreTrip ? 'First Flight' : 'Next Flight'} />
          <a href={nextFlight.fr24} target="_blank" rel="noopener noreferrer" className="block active:opacity-70 transition-opacity">
            <Card>
              <div className="p-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Plane size={14} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="font-mono text-[15px] font-bold text-primary leading-none">{nextFlight.flight}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{nextFlight.airline}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-teal border-teal/20">Track ↗</Badge>
                </div>

                <Separator className="my-4" />

                {/* Route */}
                <div className="flex items-center">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[20px] font-bold leading-none">{nextFlight.from}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{nextFlight.fromFull}</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 shrink-0">
                    <div className="w-5 h-px bg-border" />
                    <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                    <div className="w-5 h-px bg-border" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="font-mono text-[20px] font-bold leading-none">{nextFlight.to}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{nextFlight.toFull}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                  <span>{nextFlight.depLocal} → {nextFlight.arrLocal.split(', ')[1]}</span>
                  <span>PNR {nextFlight.pnr}</span>
                </div>
                {nextFlight.note && <p className="mt-2 text-[13px] text-teal/70">{nextFlight.note}</p>}
                {'warn' in nextFlight && nextFlight.warn && (
                  <p className="mt-2 text-[13px] text-destructive/70">{nextFlight.warn}</p>
                )}

              </div>
            </Card>
          </a>
        </motion.section>
      )}

      {/* ━━━ Today's Schedule ━━━ */}
      {tripDay && dayData && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <SectionHeader title="Schedule" action={{ label: 'Full Plan', href: '/itinerary' }} />
          <Card>
            {dayData.activities.map((act, i) => {
              const past = act.time < now.toTimeString().slice(0, 5);
              return (
                <div key={i}>
                  {i > 0 && <Separator className="mx-4" />}
                  <div className="flex items-start gap-3 px-4 py-3 min-h-[44px]">
                    <span className="font-mono text-[11px] text-muted-foreground w-10 pt-0.5 shrink-0">{act.time}</span>
                    <span className="text-[17px] leading-none shrink-0 mt-px">{act.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[15px] leading-snug ${past ? 'text-muted-foreground line-through' : ''}`}>
                        {act.label}
                      </p>
                      {act.note && <p className="text-[11px] text-muted-foreground mt-0.5">{act.note}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </motion.section>
      )}

      {/* ━━━ Post-trip Settlement ━━━ */}
      {isPostTrip && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border border-primary/20">
            <div className="p-4 space-y-3">
              <p className="text-[15px] font-semibold">Time to settle up!</p>
              <p className="text-[13px] text-muted-foreground">See who owes who and close it out.</p>
              <Link
                href="/expenses"
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-[15px] rounded-xl py-3 w-full"
              >
                <ReceiptText size={15} /> View Balances
              </Link>
            </div>
          </Card>
        </motion.section>
      )}

      {/* ━━━ Quick Access ━━━ */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <SectionHeader title="Quick Access" />
        <div className="grid grid-cols-2 gap-3">
          {QUICK.map(({ href, icon: Icon, label, sub, bg, fg }) => (
            <Link key={href} href={href} className="block active:opacity-70 transition-opacity">
              <Card className="p-4 h-full">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={17} className={fg} />
                </div>
                <p className="text-[15px] font-semibold leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{sub}</p>
              </Card>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ━━━ Crew ━━━ */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
        <SectionHeader title={`Crew · ${MEMBERS.length}`} />
        <div className="flex gap-2 flex-wrap">
          {MEMBERS.map((m, i) => (
            <div key={m} className="flex items-center gap-2 rounded-full bg-card px-3 py-2">
              <div
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: `${MEMBER_COLORS[i]}15`, color: MEMBER_COLORS[i] }}
              >
                {m[0]}
              </div>
              <span className="text-[13px]">{m}</span>
            </div>
          ))}
        </div>
      </motion.section>

    </div>
  );
}
