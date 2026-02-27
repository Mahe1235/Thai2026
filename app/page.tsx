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

/* shadcn components */
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

/* ── Section wrapper ── */
function Section({ label, action, children }: {
  label: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-[13px] font-medium text-muted-foreground">{label}</h2>
        {action && (
          <Button variant="link" size="sm" asChild className="h-auto p-0 text-[13px]">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

/* ── Quick access config ── */
const QUICK = [
  { href: '/itinerary', icon: CalendarDays, label: 'Itinerary', sub: '5 days · Phuket & BKK',    bg: 'bg-amber-500/10',  fg: 'text-amber-400'  },
  { href: '/expenses',  icon: ReceiptText,  label: 'Expenses',  sub: '₿70k pool · split',        bg: 'bg-teal-500/10',   fg: 'text-teal-400'   },
  { href: '/docs',      icon: FolderOpen,   label: 'Documents', sub: 'TDAC · VOA · Flights',      bg: 'bg-violet-500/10', fg: 'text-violet-400' },
  { href: '/places',    icon: MapPin,       label: 'Places',    sub: 'Map · saved spots',         bg: 'bg-sky-500/10',    fg: 'text-sky-400'    },
];

/* ━━━━━━━━━━━━━━━ Main Page ━━━━━━━━━━━━━━━ */
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
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <Section label="Departure">
            <Card>
              <CardHeader className="items-center pb-1">
                <CardDescription className="uppercase tracking-wider text-[11px]">Countdown</CardDescription>
              </CardHeader>
              <CardContent className="pb-5">
                <div className="flex justify-center gap-6">
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
              </CardContent>
            </Card>
          </Section>
        </motion.div>
      )}

      {/* ━━━ Up Next ━━━ */}
      {tripDay && dayData && (() => {
        const nowStr = now.toTimeString().slice(0, 5);
        const upcoming = dayData.activities.filter(a => a.time >= nowStr);
        const next = upcoming[0];
        if (!next) return null;
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
            <Section label="Up Next">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span className="text-[22px] leading-none mt-0.5">{next.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-[15px]">{next.label}</CardTitle>
                      <CardDescription className="mt-0.5">
                        {next.time}{next.note ? ` · ${next.note}` : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {upcoming[1] && (
                  <CardContent>
                    <Separator className="mb-3" />
                    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <span>{upcoming[1].emoji}</span>
                      <span className="font-mono">{upcoming[1].time}</span>
                      <span className="opacity-40">·</span>
                      <span className="truncate">{upcoming[1].label}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            </Section>
          </motion.div>
        );
      })()}

      {/* ━━━ Weather ━━━ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <Section label="Weather">
          {weather ? (() => {
            const info = weatherInfo(weather.code);
            return (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[28px] leading-none shrink-0">{info.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[17px] font-bold">{weather.temp}°C</span>
                        <CardDescription>{info.label}</CardDescription>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Droplets size={11} /> {weather.humidity}%</span>
                        <span className="flex items-center gap-1"><Wind size={11} /> {weather.windSpeed} km/h</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {weather.location}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })() : (
            <div className="skeleton h-[72px] rounded-xl" />
          )}
        </Section>
      </motion.div>

      {/* ━━━ Money ━━━ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Section label="Money" action={{ label: 'Details', href: '/expenses' }}>
          <Link href="/expenses" className="block active:opacity-70 transition-opacity">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardDescription className="uppercase tracking-wider text-[11px]">Pool remaining</CardDescription>
                    {stats
                      ? <CardTitle className="font-mono text-[22px] text-teal mt-1.5">{fmtBaht(stats.remaining)}</CardTitle>
                      : <div className="skeleton h-6 w-28 rounded mt-1.5" />
                    }
                  </div>
                  <Badge variant="outline" className="text-[11px] text-teal border-teal/20 font-mono">
                    {stats ? `${poolPct}%` : '···'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress bar */}
                <div className="h-[6px] bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${poolPct}%`, background: 'linear-gradient(90deg, #2DD4BF, #0EA5E9)' }}
                  />
                </div>

                <Separator className="my-4" />

                {/* Stats */}
                <div className="grid grid-cols-3 text-center">
                  <div>
                    <CardDescription className="text-[11px] mb-1">Total</CardDescription>
                    <p className="font-mono text-[13px] font-semibold">{fmtBaht(TOTAL_CASH)}</p>
                  </div>
                  <div className="border-x border-border/50">
                    <CardDescription className="text-[11px] mb-1">Spent</CardDescription>
                    <p className={`font-mono text-[13px] font-semibold ${stats?.spent ? 'text-primary' : ''}`}>
                      {stats ? fmtBaht(stats.spent) : '—'}
                    </p>
                  </div>
                  <div>
                    <CardDescription className="text-[11px] mb-1">Split</CardDescription>
                    <p className="font-mono text-[13px] font-semibold">
                      {stats ? fmtBaht(stats.splitTotal) : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </Section>
      </motion.div>

      {/* ━━━ Flight ━━━ */}
      {nextFlight && !isPostTrip && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Section label={isPreTrip ? 'First Flight' : 'Next Flight'}>
            <a href={nextFlight.fr24} target="_blank" rel="noopener noreferrer" className="block active:opacity-70 transition-opacity">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Plane size={14} className="text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="font-mono text-[15px] text-primary">{nextFlight.flight}</CardTitle>
                        <CardDescription className="mt-0.5">{nextFlight.airline}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-teal border-teal/20">Track ↗</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <Separator className="mb-4" />

                  {/* Route */}
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[20px] font-bold leading-none">{nextFlight.from}</p>
                      <CardDescription className="mt-1.5 truncate">{nextFlight.fromFull}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 px-4 shrink-0">
                      <div className="w-5 h-px bg-border" />
                      <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                      <div className="w-5 h-px bg-border" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-mono text-[20px] font-bold leading-none">{nextFlight.to}</p>
                      <CardDescription className="mt-1.5 truncate">{nextFlight.toFull}</CardDescription>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <CardDescription>{nextFlight.depLocal} → {nextFlight.arrLocal.split(', ')[1]}</CardDescription>
                    <CardDescription>PNR {nextFlight.pnr}</CardDescription>
                  </div>
                  {nextFlight.note && <p className="mt-2 text-[13px] text-teal/70">{nextFlight.note}</p>}
                  {'warn' in nextFlight && nextFlight.warn && (
                    <p className="mt-2 text-[13px] text-destructive/70">{nextFlight.warn}</p>
                  )}
                </CardContent>
              </Card>
            </a>
          </Section>
        </motion.div>
      )}

      {/* ━━━ Schedule ━━━ */}
      {tripDay && dayData && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Section label="Schedule" action={{ label: 'Full Plan', href: '/itinerary' }}>
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
                        {act.note && <CardDescription className="mt-0.5 text-[11px]">{act.note}</CardDescription>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </Section>
        </motion.div>
      )}

      {/* ━━━ Post-trip Settlement ━━━ */}
      {isPostTrip && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Time to settle up!</CardTitle>
              <CardDescription>See who owes who and close it out.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full rounded-xl h-11 text-[15px]">
                <Link href="/expenses">
                  <ReceiptText size={15} />
                  View Balances
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {/* ━━━ Quick Access ━━━ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Section label="Quick Access">
          <div className="grid grid-cols-2 gap-3">
            {QUICK.map(({ href, icon: Icon, label, sub, bg, fg }) => (
              <Link key={href} href={href} className="block active:opacity-70 transition-opacity">
                <Card className="h-full">
                  <CardHeader>
                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-1`}>
                      <Icon size={17} className={fg} />
                    </div>
                    <CardTitle className="text-[15px]">{label}</CardTitle>
                    <CardDescription>{sub}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      </motion.div>

      {/* ━━━ Crew ━━━ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
        <Section label={`Crew · ${MEMBERS.length}`}>
          <div className="flex gap-2.5 flex-wrap">
            {MEMBERS.map((m, i) => (
              <div key={m} className="flex items-center gap-2 rounded-full bg-card px-3 py-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback
                    className="text-[10px] font-bold"
                    style={{ background: `${MEMBER_COLORS[i]}15`, color: MEMBER_COLORS[i] }}
                  >
                    {m[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px]">{m}</span>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

    </div>
  );
}
