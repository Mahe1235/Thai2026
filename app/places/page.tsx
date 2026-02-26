'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MapPin, ExternalLink, Check, Trash2 } from 'lucide-react';
import { db } from '@/lib/supabase';
import type { Place } from '@/lib/supabase';

const CATEGORIES = ['All', 'Beach', 'Temple', 'Food', 'Nightlife', 'Shopping', 'Activity', 'Hotel'] as const;
type Cat = typeof CATEGORIES[number];

const CATEGORY_EMOJI: Record<string, string> = {
  Beach: '🏖️', Temple: '🛕', Food: '🍜', Nightlife: '🌙',
  Shopping: '🛍️', Activity: '🎡', Hotel: '🏨',
};

/* ── Add Place sheet ── */
function AddPlaceSheet({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName]       = useState('');
  const [category, setCat]    = useState('Food');
  const [address, setAddress] = useState('');
  const [mapsUrl, setMaps]    = useState('');
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await db.from('places').insert({
        name: name.trim(),
        category,
        address: address || null,
        maps_url: mapsUrl || null,
        notes: notes || null,
        visited: false,
        sort_order: 999,
      });
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg mx-auto bg-surface border border-border rounded-t-3xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Add Place</h2>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={20} /></button>
        </div>

        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50 placeholder-muted"
            placeholder="e.g. Café del Mar" autoFocus
          />
        </div>

        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.slice(1).map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  category === c ? 'border-gold bg-gold/10 text-gold' : 'border-border text-muted'
                }`}
              >
                {CATEGORY_EMOJI[c]} {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">Address (optional)</label>
          <input value={address} onChange={e => setAddress(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50 placeholder-muted"
            placeholder="e.g. Kamala Beach, Phuket"
          />
        </div>

        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">Google Maps URL (optional)</label>
          <input value={mapsUrl} onChange={e => setMaps(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50 placeholder-muted"
            placeholder="https://maps.app.goo.gl/..."
          />
        </div>

        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50 placeholder-muted"
            placeholder="e.g. Best sunset views in Kamala"
          />
        </div>

        <button onClick={save} disabled={saving || !name.trim()}
          className="w-full bg-gold text-bg font-bold rounded-xl py-3 text-sm disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Add Place'}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ── */
export default function PlacesPage() {
  const [places, setPlaces]   = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<Cat>('All');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const { data } = await db.from('places').select('*').order('sort_order').order('created_at');
    setPlaces((data ?? []) as Place[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = db.channel('places')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'places' }, load)
      .subscribe();
    return () => { db.removeChannel(ch); };
  }, [load]);

  async function toggleVisited(id: number, current: boolean) {
    await db.from('places').update({ visited: !current }).eq('id', id);
    setPlaces(p => p.map(pl => pl.id === id ? { ...pl, visited: !current } : pl));
  }

  async function deletePlace(id: number) {
    await db.from('places').delete().eq('id', id);
    setPlaces(p => p.filter(pl => pl.id !== id));
  }

  const filtered = filter === 'All' ? places : places.filter(p => p.category === filter);
  const visited  = places.filter(p => p.visited).length;

  return (
    <>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="px-4 pt-6 pb-3 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Places</h1>
            <p className="text-sm text-muted mt-0.5">
              {visited}/{places.length} visited
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-gold text-bg font-semibold text-sm rounded-xl px-4 py-2"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Map link */}
        <div className="px-4 mb-3">
          <a
            href="https://maps.app.goo.gl/yvRxuzL1BgPr3J2K8" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-surface2 border border-border rounded-xl px-4 py-3 hover:border-gold/40 transition-colors"
          >
            <MapPin size={16} className="text-teal shrink-0" />
            <span className="text-sm font-medium flex-1">Open Group Maps List</span>
            <ExternalLink size={14} className="text-muted" />
          </a>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm border transition-all ${
                filter === c
                  ? 'bg-gold border-gold text-bg font-semibold'
                  : 'bg-surface border-border text-muted'
              }`}
            >
              {c !== 'All' && <span>{CATEGORY_EMOJI[c]}</span>}
              {c}
              {c !== 'All' && (
                <span className="text-[10px] opacity-60">
                  {places.filter(p => p.category === c).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Places list */}
        <div className="px-4 space-y-2">
          {loading && [1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          {!loading && filtered.length === 0 && (
            <div className="text-center text-muted text-sm py-12">
              {filter === 'All' ? 'No places yet. Add some!' : `No ${filter} places yet`}
            </div>
          )}
          {!loading && filtered.map((place, i) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-surface border rounded-2xl p-4 transition-colors ${
                place.visited ? 'border-border opacity-60' : 'border-border hover:border-gold/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleVisited(place.id, place.visited)}
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    place.visited ? 'bg-teal border-teal' : 'border-border hover:border-teal/60'
                  }`}
                >
                  {place.visited && <Check size={13} className="text-bg" strokeWidth={2.5} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-semibold flex-1">{place.name}</span>
                    <span className="text-xs bg-surface2 border border-border rounded-full px-2 py-0.5 shrink-0 whitespace-nowrap">
                      {CATEGORY_EMOJI[place.category] ?? '📍'} {place.category}
                    </span>
                  </div>
                  {place.address && (
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                      <MapPin size={10} /> {place.address}
                    </p>
                  )}
                  {place.notes && (
                    <p className="text-xs text-muted mt-1">{place.notes}</p>
                  )}
                  {place.maps_url && (
                    <a href={place.maps_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal mt-1.5"
                    >
                      <ExternalLink size={10} /> Open in Maps
                    </a>
                  )}
                </div>
                <button onClick={() => deletePlace(place.id)}
                  className="text-muted hover:text-red transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      <AnimatePresence>
        {showAdd && (
          <AddPlaceSheet onClose={() => setShowAdd(false)} onSave={load} />
        )}
      </AnimatePresence>
    </>
  );
}
