'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plane, Wind, Droplets, CalendarDays, ReceiptText,
  MapPin, FolderOpen, ChevronRight,
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { fetchWeather, weatherInfo } from '@/lib/weather';
import type { WeatherData } from '@/lib/weather';
import { TRIP, FLIGHTS, ITINERARY_DAYS, TOTAL_CASH, MEMBERS } from '@/lib/constants';
import { fmtBaht, getTripDay } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const MEMBER_COLORS = ['#F5C842','#00C9A7','#FF7EB3','#7C83FD','#FF9A3C','#4ECDC4','#C471ED'];

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
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}

/* ── Section label ── */
function SectionLabel({ label, href }: { label: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] font-medium">{label}</p>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          See all <ChevronRight size={11} />
        </Link>
      )}
    </div>
  );
}

/* ── Weather card (2-line) ── */
function WeatherCard({ w }: { w: WeatherData }) {
  const info = weatherInfo(w.code);
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <span className="text-3xl leading-none shrink-0">{info.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold">{w.temp}°C</span>
            <span className="text-sm text-muted-foreground">{info.label}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Droplets size={11} /> {w.humidity}%</span>
            <span className="flex items-center gap-1"><Wind size={11} /> {w.windSpeed} km/h</span>
            <span className="flex items-center gap-1"><MapPin size={11} /> {w.location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Quick access config ── */
const QUICK_LINKS = [
  {
    href: '/itinerary', icon: CalendarDays, label: 'Itinerary', sub: '5 days · Phuket & BKK',
    iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', hoverBorder: 'hover:border-amber-500/30',
  },
  {
    href: '/expenses', icon: ReceiptText, label: 'Expenses', sub: '฿70k pool · split',
    iconBg: 'bg-teal-500/15', iconColor: 'text-teal-400', hoverBorder: 'hover:border-teal-500/30',
  },
  {
    href: '/docs', icon: FolderOpen, label: 'Documents', sub: 'TDAC · VOA · Flights',
    iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', hoverBorder: 'hover:border-violet-500/30',
  },
  {
    href: '/places', icon: MapPin, label: 'Places', sub: 'Map · visited list',
    iconBg: 'bg-sky-500/15', iconColor: 'text-sky-400', hoverBorder: 'hover:border-sky-500/30',
  },
];

/* ── Main page ── */
export default function TodayPage() {
  const [now, setNow]         = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [stats, setStats]     = useState<{ remaining: number; spent: number; splitTotal: number } | null>(null);
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
      const tx          = cash.data ?? [];
      const spent       = tx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const distributed = tx.filter(t => t.type === 'cash').reduce((s, t) => s + Number(t.amount), 0);
      const splitTotal  = (split.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
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
    <div className="max-w-lg mx-auto px-5 pt-12 space-y-7">

      {/* ── Greeting header ── */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight leading-tight">{greeting()}</h1>
        {isPreTrip && diff && (
          <p className="text-muted-foreground text-sm mt-1.5">
            {diff.d === 0 ? 'Flight day — pack your bags.' :
             diff.d === 1 ? 'Departing tomorrow night from BLR.' :
             `Thailand in ${diff.d} day${diff.d !== 1 ? 's' : ''}.`}
          </p>
        )}
        {tripDay && dayData && (
          <p className="text-muted-foreground text-sm mt-1.5">Day {tripDay} of 5 · {dayData.location}</p>
        )}
        {isPostTrip && (
          <p className="text-muted-foreground text-sm mt-1.5">Thailand 2026 — what a trip.</p>
        )}
      </motion.div>

      {/* ── Countdown (pre-trip) ── */}
      {isPreTrip && diff && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        >
          <SectionLabel label="Countdown to departure" />
          <Card>
            <CardContent className="py-5 px-5">
              <div className="flex items-baseline justify-center gap-1">
                {[
                  { val: pad(diff.d), unit: 'd' },
                  { val: pad(diff.h), unit: 'h' },
                  { val: pad(diff.m), unit: 'm' },
                  { val: pad(diff.s), unit: 's' },
                ].map(({ val, unit }) => (
                  <div key={unit} className="flex items-baseline">
                    <span className="font-mono text-[38px] font-semibold text-foreground leading-none cd-digit">{val}</span>
                    <span className="text-muted-foreground text-sm ml-1 mr-3 last:mr-0">{unit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Up next (during trip) ── */}
      {tripDay && dayData && (() => {
        const nowStr   = now.toTimeString().slice(0, 5);
        const upcoming = dayData.activities.filter(a => a.time >= nowStr);
        const next     = upcoming[0];
        if (!next) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          >
            <SectionLabel label="Up next" />
            <Card className="overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-teal/70 via-teal/20 to-transparent" />
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none">{next.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{next.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {next.time}{next.note ? ` · ${next.note}` : ''}
                    </p>
                  </div>
                </div>
                {upcoming[1] && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{upcoming[1].emoji}</span>
                    <span className="font-mono">{upcoming[1].time}</span>
                    <span>—</span>
                    <span>{upcoming[1].label}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* ── Weather ── */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionLabel label="Weather" />
        {weather
          ? <WeatherCard w={weather} />
          : <div className="skeleton h-[72px] rounded-2xl" />
        }
      </motion.div>

      {/* ── Money ── */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <SectionLabel label="Money" href="/expenses" />
        <Link href="/expenses">
          <Card className="overflow-hidden hover:border-teal/40 transition-colors cursor-pointer">
            <div className="h-0.5 bg-gradient-to-r from-teal/80 via-teal/25 to-transparent" />
            <CardContent className="p-5">

              {/* Hero number */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-[0.08em] mb-2">Pool remaining</p>
                  {stats
                    ? <p className="font-mono text-[32px] font-bold text-teal leading-none">{fmtBaht(stats.remaining)}</p>
                    : <div className="skeleton h-8 w-32 rounded" />
                  }
                </div>
                <Badge variant="outline" className="text-teal border-teal/30 font-mono shrink-0 mt-1">
                  {stats ? `${poolPct}%` : '···'}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${poolPct}%`, background: 'linear-gradient(90deg, #2DD4BF 0%, #0EA5E9 100%)' }}
                />
              </div>

              <Separator className="mb-4" />

              {/* 3 inline stats */}
              <div className="grid grid-cols-3 text-center gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">Total pool</p>
                  <p className="font-mono text-[13px] font-semibold">{fmtBaht(TOTAL_CASH)}</p>
                </div>
                <div className="border-x border-border">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Cash spent</p>
                  <p className={`font-mono text-[13px] font-semibold ${stats?.spent ? 'text-primary' : 'text-muted-foreground'}`}>
                    {stats ? fmtBaht(stats.spent) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">Split total</p>
                  <p className="font-mono text-[13px] font-semibold">
                    {stats ? fmtBaht(stats.splitTotal) : '—'}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* ── Next flight ── */}
      {nextFlight && !isPostTrip && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
          <SectionLabel label={isPreTrip ? 'First flight' : 'Next flight'} />
          <a href={nextFlight.fr24} target="_blank" rel="noopener noreferrer">
            <Card className="overflow-hidden hover:border-primary/40 transition-colors cursor-pointer">
              <div className="h-0.5 bg-gradient-to-r from-primary/80 via-primary/25 to-transparent" />
              <CardContent className="p-5">

                {/* Airline row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Plane size={15} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold text-primary leading-none">{nextFlight.flight}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{nextFlight.airline}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-teal border-teal/30 text-[10px]">Track live ↗</Badge>
                </div>

                {/* Route display */}
                <div className="flex items-center mb-4">
                  <div className="flex-1">
                    <p className="font-mono text-[28px] font-bold leading-none">{nextFlight.from}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{nextFlight.fromFull}</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 text-muted-foreground shrink-0">
                    <div className="h-px w-6 bg-border" />
                    <Plane size={12} />
                    <div className="h-px w-6 bg-border" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-mono text-[28px] font-bold leading-none">{nextFlight.to}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{nextFlight.toFull}</p>
                  </div>
                </div>

                {/* Times */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{nextFlight.depLocal} → {nextFlight.arrLocal.split(', ')[1]}</span>
                  <span>PNR: {nextFlight.pnr}</span>
                </div>
                {nextFlight.note && <p className="mt-1.5 text-xs text-teal/80">{nextFlight.note}</p>}
                {'warn' in nextFlight && nextFlight.warn && <p className="mt-1.5 text-xs text-destructive/80">{nextFlight.warn}</p>}

              </CardContent>
            </Card>
          </a>
        </motion.div>
      )}

      {/* ── Today's schedule ── */}
      {tripDay && dayData && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionLabel label="Today's schedule" href="/itinerary" />
          <Card className="overflow-hidden">
            {dayData.activities.map((act, i) => {
              const past = act.time < now.toTimeString().slice(0, 5);
              return (
                <div key={i} className={`flex items-start gap-3 px-5 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                  <span className="font-mono text-xs text-muted-foreground w-10 pt-0.5 shrink-0">{act.time}</span>
                  <span className="text-lg leading-none shrink-0 mt-0.5">{act.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${past ? 'text-muted-foreground line-through' : ''}`}>{act.label}</p>
                    {act.note && <p className="text-xs text-muted-foreground mt-0.5">{act.note}</p>}
                  </div>
                </div>
              );
            })}
          </Card>
        </motion.div>
      )}

      {/* ── Post-trip settlement ── */}
      {isPostTrip && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-primary/30">
            <div className="h-0.5 bg-gradient-to-r from-primary/80 via-primary/25 to-transparent" />
            <CardContent className="p-5 space-y-3">
              <p className="font-semibold">Time to settle up!</p>
              <p className="text-sm text-muted-foreground">See who owes who and close it out.</p>
              <Link
                href="/expenses"
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl py-2.5 w-full"
              >
                <ReceiptText size={15} /> View Balances
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Quick access ── */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
        <SectionLabel label="Quick access" />
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ href, icon: Icon, label, sub, iconBg, iconColor, hoverBorder }) => (
            <Link key={href} href={href}>
              <Card className={`flex flex-col gap-3 p-5 ${hoverBorder} active:bg-secondary transition-colors cursor-pointer h-full`}>
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon size={18} className={iconColor} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Crew ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }} className="pb-4">
        <SectionLabel label={`The crew · ${MEMBERS.length}`} />
        <div className="flex gap-2 flex-wrap">
          {MEMBERS.map((m, i) => (
            <div key={m} className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: `${MEMBER_COLORS[i]}22`, color: MEMBER_COLORS[i] }}
              >
                {m[0]}
              </div>
              <span className="text-xs">{m}</span>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
