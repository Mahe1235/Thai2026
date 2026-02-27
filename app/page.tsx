'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plane, Wind, Droplets, CalendarDays, ReceiptText,
  ChevronRight, MapPin, FolderOpen,
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { fetchWeather, weatherInfo } from '@/lib/weather';
import type { WeatherData } from '@/lib/weather';
import { TRIP, FLIGHTS, ITINERARY_DAYS, TOTAL_CASH, MEMBERS } from '@/lib/constants';
import { fmtBaht, getTripDay } from '@/lib/utils';

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

/* ── Countdown digit ── */
function Digit({ val, label }: { val: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="bg-white/10 border border-white/20 rounded-xl w-16 h-16 flex items-center justify-center backdrop-blur-sm">
        <span className="font-mono text-2xl font-bold text-gold cd-digit">{val}</span>
      </div>
      <span className="text-[10px] text-white/50 uppercase tracking-widest">{label}</span>
    </div>
  );
}

/* ── Weather pill ── */
function WeatherPill({ w }: { w: WeatherData }) {
  const info = weatherInfo(w.code);
  return (
    <div className="flex items-center gap-3 bg-surface border border-border rounded-2xl p-4">
      <span className="text-3xl leading-none">{info.emoji}</span>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xl font-bold">{w.temp}°C</span>
          <span className="text-sm text-muted">{info.label}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-muted"><Droplets size={11} /> {w.humidity}%</span>
          <span className="flex items-center gap-1 text-xs text-muted"><Wind size={11} /> {w.windSpeed} km/h</span>
          <span className="flex items-center gap-1 text-xs text-muted"><MapPin size={11} /> {w.location}</span>
        </div>
      </div>
    </div>
  );
}

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

  return (
    <div className="max-w-lg mx-auto">

      {/* ═══ HERO ═══ */}
      <div
        className="relative overflow-hidden px-5 pt-10 pb-8"
        style={{ background: 'linear-gradient(160deg, #0f3460 0%, #16213e 45%, #080B14 100%)' }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20L0 0h40zm0 0L40 40H0z'/%3E%3C/g%3E%3C/svg%3E\")" }}
        />

        {/* Flag + title */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative">
          {isPreTrip && (
            <>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">🇹🇭</span>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Thailand 2026</h1>
                  <p className="text-xs text-white/50 tracking-widest uppercase">Feb 28 – Mar 4 · Group of 7</p>
                </div>
              </div>
              <p className="text-sm text-white/70 mt-2 mb-6">
                {diff?.d === 0 ? '🛫 Today is flight day! Pack your bags.' :
                 diff?.d === 1 ? '✈️ Departing tomorrow night from BLR!' :
                 `${diff?.d} day${diff?.d !== 1 ? 's' : ''} until departure from BLR`}
              </p>
            </>
          )}
          {tripDay && dayData && (
            <>
              <div className="inline-flex items-center gap-1.5 bg-gold/20 border border-gold/30 rounded-full px-3 py-1 mb-2">
                <span className="text-[11px] font-bold text-gold uppercase tracking-wider">Day {tripDay}</span>
              </div>
              <h1 className="text-2xl font-bold text-white">{dayData.title}</h1>
              <p className="text-sm text-white/50 flex items-center gap-1 mt-1 mb-6">
                <MapPin size={11} /> {dayData.location}
              </p>
            </>
          )}
          {isPostTrip && (
            <>
              <span className="text-3xl">🎉</span>
              <h1 className="text-2xl font-bold text-white mt-1">Thailand was incredible!</h1>
              <p className="text-sm text-white/50 mt-1 mb-6">Feb 28 – Mar 4, 2026</p>
            </>
          )}
        </motion.div>

        {/* Countdown */}
        {isPreTrip && diff && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}
          >
            <p className="text-[10px] text-white/40 uppercase tracking-widest text-center mb-3">Countdown to departure</p>
            <div className="flex justify-center gap-2.5">
              <Digit val={pad(diff.d)} label="Days" />
              <span className="font-mono text-2xl text-white/30 self-center mb-4">:</span>
              <Digit val={pad(diff.h)} label="Hrs" />
              <span className="font-mono text-2xl text-white/30 self-center mb-4">:</span>
              <Digit val={pad(diff.m)} label="Min" />
              <span className="font-mono text-2xl text-white/30 self-center mb-4">:</span>
              <Digit val={pad(diff.s)} label="Sec" />
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="px-4 pt-5 space-y-5">

        {/* Weather */}
        {weather
          ? <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><WeatherPill w={weather} /></motion.div>
          : <div className="skeleton h-[72px] rounded-2xl" />
        }

        {/* "Up next" during trip */}
        {tripDay && dayData && (() => {
          const nowStr   = now.toTimeString().slice(0, 5);
          const upcoming = dayData.activities.filter(a => a.time >= nowStr);
          const next     = upcoming[0];
          if (!next) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="bg-surface2 border border-teal/30 rounded-2xl p-4"
            >
              <p className="text-[10px] text-teal uppercase tracking-widest mb-2">Up next</p>
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none">{next.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{next.label}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {next.time}{next.note ? ` · ${next.note}` : ''}
                  </p>
                </div>
              </div>
              {upcoming[1] && (
                <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center gap-2 text-xs text-muted">
                  <span>{upcoming[1].emoji}</span>
                  <span className="font-mono">{upcoming[1].time}</span>
                  <span>—</span>
                  <span>{upcoming[1].label}</span>
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: 'Pool Left',  val: stats ? fmtBaht(stats.remaining) : null, color: 'text-teal'  },
            { label: 'Pool Spent', val: stats ? fmtBaht(stats.spent)     : null, color: 'text-gold'  },
            { label: 'Split',      val: stats ? fmtBaht(stats.splitTotal): null, color: 'text-text'  },
          ].map(item => (
            <Link key={item.label} href="/expenses"
              className="bg-surface border border-border rounded-xl p-3 text-center active:border-gold/50 transition-colors"
            >
              {item.val
                ? <div className={`font-mono text-base font-bold ${item.color}`}>{item.val}</div>
                : <div className="skeleton h-5 w-14 mx-auto rounded" />
              }
              <div className="text-[10px] text-muted mt-0.5 uppercase tracking-wide">{item.label}</div>
            </Link>
          ))}
        </motion.div>

        {/* Next/upcoming flight */}
        {nextFlight && !isPostTrip && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          >
            <p className="text-[10px] text-muted uppercase tracking-widest mb-2">
              {isPreTrip ? 'Your first flight' : 'Next flight'}
            </p>
            <a href={nextFlight.fr24} target="_blank" rel="noopener noreferrer"
              className="block bg-surface border border-border hover:border-gold/40 rounded-2xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plane size={13} className="text-gold" />
                  <span className="font-mono text-sm font-bold text-gold">{nextFlight.flight}</span>
                  <span className="text-xs text-muted">{nextFlight.airline}</span>
                </div>
                <span className="text-[10px] text-teal border border-teal/30 rounded-full px-2.5 py-0.5">Track live ↗</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <div className="font-mono text-xl font-bold">{nextFlight.from}</div>
                  <div className="text-[11px] text-muted">{nextFlight.fromFull}</div>
                </div>
                <div className="flex-1 flex items-center gap-1 px-2">
                  <div className="flex-1 h-px bg-border" />
                  <Plane size={12} className="text-muted" />
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="text-center">
                  <div className="font-mono text-xl font-bold">{nextFlight.to}</div>
                  <div className="text-[11px] text-muted">{nextFlight.toFull}</div>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
                <span>{nextFlight.depLocal} → {nextFlight.arrLocal.split(', ')[1]}</span>
                <span>PNR: {nextFlight.pnr}</span>
              </div>
              {nextFlight.note && <p className="mt-1 text-[11px] text-teal/80">{nextFlight.note}</p>}
              {'warn' in nextFlight && nextFlight.warn && <p className="mt-1 text-[11px] text-red/80">{nextFlight.warn}</p>}
            </a>
          </motion.div>
        )}

        {/* Today's schedule (during trip) */}
        {tripDay && dayData && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link href="/itinerary" className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted uppercase tracking-widest">Today's schedule</p>
              <span className="text-xs text-gold flex items-center gap-0.5">Full view <ChevronRight size={12} /></span>
            </Link>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              {dayData.activities.map((act, i) => {
                const past = act.time < now.toTimeString().slice(0, 5);
                return (
                  <div key={i} className={`flex items-start gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}>
                    <span className="font-mono text-xs text-muted w-10 pt-0.5 shrink-0">{act.time}</span>
                    <span className="text-lg leading-none shrink-0 mt-0.5">{act.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${past ? 'text-muted line-through' : ''}`}>{act.label}</p>
                      {act.note && <p className="text-xs text-muted mt-0.5">{act.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Post-trip settlement CTA */}
        {isPostTrip && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-gold/30 rounded-2xl p-4 space-y-3"
          >
            <p className="font-semibold">Time to settle up!</p>
            <p className="text-sm text-muted">See who owes who and close it out.</p>
            <Link href="/expenses"
              className="flex items-center justify-center gap-2 bg-gold text-bg font-semibold text-sm rounded-xl py-2.5 w-full"
            >
              <ReceiptText size={15} /> View Balances
            </Link>
          </motion.div>
        )}

        {/* Quick links grid */}
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="grid grid-cols-2 gap-3"
        >
          {[
            { href: '/itinerary', icon: CalendarDays, label: 'Itinerary',  sub: '5 days · Phuket & BKK' },
            { href: '/expenses',  icon: ReceiptText,  label: 'Expenses',   sub: '฿70k pool · split' },
            { href: '/docs',      icon: FolderOpen,   label: 'Documents',  sub: 'TDAC · VOA · Flights' },
            { href: '/places',    icon: MapPin,        label: 'Places',     sub: 'Map · visited list' },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href}
              className="flex flex-col gap-1.5 bg-surface border border-border rounded-xl p-3.5 hover:border-gold/40 active:bg-surface2 transition-colors"
            >
              <Icon size={18} className="text-gold" />
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-[11px] text-muted mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Crew */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className="text-[10px] text-muted uppercase tracking-widest mb-2">The crew · {MEMBERS.length}</p>
          <div className="flex gap-2 flex-wrap pb-2">
            {MEMBERS.map((m, i) => (
              <div key={m} className="flex items-center gap-1.5 bg-surface border border-border rounded-full px-2.5 py-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: `${MEMBER_COLORS[i]}22`, color: MEMBER_COLORS[i] }}>
                  {m[0]}
                </div>
                <span className="text-xs">{m}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
