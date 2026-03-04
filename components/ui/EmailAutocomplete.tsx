'use client';

// components/ui/EmailAutocomplete.tsx
//
// Drop-in replacement for any email <Input> field.
// Loads suggestions once on mount, filters client-side as user types.
//
// Props:
//   value          - controlled input value
//   onChange       - called with new string value
//   onSelect       - called with { email, name } when suggestion chosen
//   placeholder    - input placeholder
//   className      - extra classes for the input
//   disabled       - disable the input
//   id / name      - forwarded to <input>

import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ContactSuggestion {
  email: string;
  name: string | null;
  source: 'contact' | 'viewer';
  visitCount?: number;
  lastSeen?: string;
}

interface EmailAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: { email: string; name: string | null }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

// Module-level cache — shared across all mounted instances, loaded once per session
let cachedSuggestions: ContactSuggestion[] | null = null;
let loadPromise: Promise<void> | null = null;

async function loadSuggestions(): Promise<void> {
  if (cachedSuggestions !== null) return;
  if (loadPromise) return loadPromise;

  loadPromise = fetch('/api/contacts/suggestions')
    .then((r) => r.json())
    .then((data) => {
      cachedSuggestions = data.suggestions || [];
    })
    .catch(() => {
      cachedSuggestions = []; // fail silently — autocomplete is enhancement only
    });

  return loadPromise;
}

export function EmailAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter email address',
  className,
  disabled,
  id,
  name,
}: EmailAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([]);
  const [filtered, setFiltered] = useState<ContactSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load suggestions on mount (no-op if already cached)
  useEffect(() => {
    loadSuggestions().then(() => {
      if (cachedSuggestions) setSuggestions(cachedSuggestions);
    });
  }, []);

  // Filter as user types (2+ chars)
  useEffect(() => {
    const q = value.toLowerCase().trim();
    if (q.length < 2 || suggestions.length === 0) {
      setFiltered([]);
      setOpen(false);
      return;
    }

    const results = suggestions
      .filter(
        (s) =>
          s.email.toLowerCase().includes(q) ||
          (s.name && s.name.toLowerCase().includes(q))
      )
      .slice(0, 8); // max 8 visible

    setFiltered(results);
    setOpen(results.length > 0);
    setActiveIndex(-1);
  }, [value, suggestions]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback(
    (s: ContactSuggestion) => {
      onChange(s.email);
      onSelect?.({ email: s.email, name: s.name });
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    },
    [onChange, onSelect]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function getInitial(s: ContactSuggestion): string {
    if (s.name) return s.name[0].toUpperCase();
    return s.email[0].toUpperCase();
  }

  function getLabel(s: ContactSuggestion): string {
    if (s.name) return s.name;
    return s.email;
  }

  function getSublabel(s: ContactSuggestion): string {
    if (s.name) return s.email;
    if (s.source === 'viewer' && s.visitCount) {
      return `Viewed ${s.visitCount} time${s.visitCount !== 1 ? 's' : ''}`;
    }
    return '';
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (filtered.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {filtered.map((s, i) => (
            <button
              key={s.email}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur before click registers
                handleSelect(s);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                i === activeIndex
                  ? 'bg-purple-50'
                  : 'hover:bg-gray-50'
              )}
            >
              {/* Avatar circle */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-semibold">
                {getInitial(s)}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getLabel(s)}
                </p>
                {getSublabel(s) && (
                  <p className="text-xs text-gray-500 truncate">
                    {getSublabel(s)}
                  </p>
                )}
              </div>

              {/* Source badge */}
              {s.source === 'viewer' && (
                <span className="flex-shrink-0 text-[10px] font-medium text-purple-600 bg-purple-50 border border-purple-100 rounded px-1.5 py-0.5">
                  viewer
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}