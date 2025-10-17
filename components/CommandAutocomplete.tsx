'use client';

import { useState, useEffect } from 'react';
import { getAllCommands } from '@/lib/commands/registry';

interface CommandAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (command: string) => void;
  onClose: () => void;
}

export default function CommandAutocomplete({
  query,
  position,
  onSelect,
  onClose,
}: CommandAutocompleteProps) {
  const [filtered, setFiltered] = useState<any[]>([]);

  useEffect(() => {
    const commands = getAllCommands();
    const lowerQuery = query.toLowerCase();

    const matches = commands.filter(
      (cmd) =>
        cmd.name.toLowerCase().startsWith(lowerQuery) ||
        cmd.aliases?.some((alias) => alias.toLowerCase().startsWith(lowerQuery))
    );

    setFiltered(matches.slice(0, 8)); // Limit to 8 results
  }, [query]);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <>
      {/* Click-away overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onTouchStart={onClose}
      />

      {/* Autocomplete dropdown */}
      <div
        className="fixed z-50 bg-tv-panel border border-tv-grid rounded-xl shadow-2xl overflow-hidden min-w-[300px] max-w-md"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <div className="p-2 border-b border-tv-grid bg-tv-bg-secondary">
          <h3 className="text-xs font-semibold text-tv-text-soft flex items-center gap-2">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Commands
          </h3>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {filtered.map((cmd, idx) => (
            <button
              key={cmd.name}
              onClick={() => onSelect(cmd.name)}
              className="w-full px-4 py-2.5 text-left hover:bg-tv-hover active:bg-tv-chip transition-colors border-b border-tv-grid/50 last:border-b-0"
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-tv-blue font-semibold">
                  /{cmd.name}
                </span>
                {cmd.aliases && cmd.aliases.length > 0 && (
                  <span className="text-xs text-tv-text-soft">
                    ({cmd.aliases.join(', ')})
                  </span>
                )}
              </div>
              <div className="text-xs text-tv-text-soft mt-0.5">{cmd.desc}</div>
              {cmd.args && (
                <div className="text-xs text-tv-text-soft/70 mt-1">
                  Args: {cmd.args}
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-tv-grid bg-tv-bg-secondary">
          <p className="text-[10px] text-tv-text-soft">
            ↑↓ Navigate • Enter Select • Esc Close
          </p>
        </div>
      </div>
    </>
  );
}
