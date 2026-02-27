'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { ITINERARY_DAYS } from '@/lib/constants';
import { getTripDay } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TYPE_COLORS: Record<string, string> = {
  transit:   'bg-blue-500/15 text-blue-300 border-blue-500/25',
  food:      'bg-orange-500/15 text-orange-300 border-orange-500/25',
  activity:  'bg-teal/15 text-teal border-teal/25',
  stay:      'bg-purple-500/15 text-purple-300 border-purple-500/25',
  nightlife: 'bg-pink-500/15 text-pink-300 border-pink-500/25',
};

const TYPE_DOT: Record<string, string> = {
  transit:   'border-blue-400 bg-blue-400/30',
  food:      'border-orange-400 bg-orange-400/30',
  activity:  'border-teal bg-teal/30',
  stay:      'border-purple-400 bg-purple-400/30',
  nightlife: 'border-pink-400 bg-pink-400/30',
};

const TYPE_LABELS: Record<string, string> = {
  transit:   'Transfer',
  food:      'Food',
  activity:  'Activity',
  stay:      'Stay',
  nightlife: 'Nightlife',
};

export default function ItineraryPage() {
  const todayTrip = getTripDay();
  const [activeDay, setActiveDay] = useState(todayTrip ?? 1);

  const day = ITINERARY_DAYS[activeDay - 1];

  return (
    <div className="max-w-lg mx-auto">

      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-bold">Itinerary</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Feb 28 – Mar 4, 2026 · Phuket & Bangkok</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
        {ITINERARY_DAYS.map(d => {
          const isActive  = d.day === activeDay;
          const isToday   = d.day === todayTrip;
          const dateLabel = new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
          return (
            <button
              key={d.day}
              onClick={() => setActiveDay(d.day)}
              className={`flex flex-col items-center shrink-0 rounded-2xl px-4 py-2.5 border transition-all ${
                isActive
                  ? 'bg-primary border-primary text-primary-foreground font-semibold'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide">
                {isToday && !isActive ? '●' : `Day ${d.day}`}
              </span>
              <span className="text-sm font-semibold mt-0.5">{dateLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Day content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDay}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="px-4 space-y-3"
        >
          {/* Day header */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-bold text-lg leading-tight">{day.title}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin size={12} className="shrink-0" /> {day.location}
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[2.1rem] top-3 bottom-3 w-px bg-border" />

            <div className="space-y-1">
              {day.activities.map((act, i) => {
                const dotClass   = TYPE_DOT[act.type]   ?? TYPE_DOT.activity;
                const colorClass = TYPE_COLORS[act.type] ?? TYPE_COLORS.activity;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3"
                  >
                    {/* Time */}
                    <div className="w-16 text-right shrink-0 pt-3">
                      <span className="font-mono text-xs text-muted-foreground">{act.time}</span>
                    </div>

                    {/* Dot */}
                    <div className="relative z-10 mt-3.5 shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 ${dotClass}`} />
                    </div>

                    {/* Activity card */}
                    <div className={`flex-1 mb-2 rounded-xl border p-3 ${colorClass}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg leading-none mt-0.5 shrink-0">{act.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm text-foreground leading-snug">{act.label}</p>
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-[9px] py-0 px-1.5 h-auto ${colorClass}`}
                            >
                              {TYPE_LABELS[act.type] ?? 'Activity'}
                            </Badge>
                          </div>
                          {act.note && (
                            <p className="text-xs opacity-70 mt-0.5">{act.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
