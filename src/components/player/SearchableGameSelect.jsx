'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function SearchableGameSelect({
  games = [],
  selectedGameTitle = '',
  onSelectGame,
  label = 'SELECT GAME PLATFORM *',
  theme = 'gold' // 'gold' | 'cyan'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find currently selected game object
  const selectedGame = games.find(
    (g) => String(g.title || '').toLowerCase() === String(selectedGameTitle || '').toLowerCase()
  ) || games[0];

  // Filter games based on search query
  const filteredGames = games.filter((g) =>
    String(g.title || '').toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const primaryColor = theme === 'cyan' ? 'var(--cyan-primary, #00f0ff)' : 'var(--gold-primary, #ffd700)';

  return (
    <div className="searchable-game-select-container" ref={dropdownRef}>
      {label && <label className="game-select-label">{label}</label>}

      {/* Main Trigger Field */}
      <div
        className={`game-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
          <div className="game-trigger-logo-box">
            <img
              src={selectedGame?.imageUrl || selectedGame?.image || '/winning_heaven_logo.png'}
              alt={selectedGame?.title || 'Game'}
              className="game-trigger-thumb"
            />
          </div>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span className="game-trigger-title">{selectedGame?.title || 'Select Game'}</span>
            <span className="game-trigger-sub">Tap to change destination platform ({games.length} available)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span className="game-active-pill">SELECTED</span>
          <div className="trigger-arrow-box">
            <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} />
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="game-dropdown-popover">
          {/* Live Search Bar */}
          <div className="game-search-header" onClick={(e) => e.stopPropagation()}>
            <i className="fa-solid fa-magnifying-glass search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${games.length} platform games...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="game-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="clear-search-btn"
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          {/* Scrollable Game Items */}
          <div className="game-dropdown-scroll">
            {filteredGames.length === 0 ? (
              <div className="no-games-row">
                <i className="fa-solid fa-circle-question" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '0.25rem' }} />
                <span>No games match "{search}"</span>
              </div>
            ) : (
              filteredGames.map((g) => {
                const isSelected =
                  String(g.title || '').toLowerCase() === String(selectedGameTitle || '').toLowerCase();
                return (
                  <div
                    key={g.id || g.title}
                    onClick={() => {
                      if (onSelectGame) onSelectGame(g.title);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`game-dropdown-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <img
                        src={g.imageUrl || g.image || '/winning_heaven_logo.png'}
                        alt={g.title}
                        className="game-item-thumb"
                      />
                      <span className="game-item-name">{g.title}</span>
                    </div>

                    {isSelected && (
                      <span className="game-item-badge">
                        <i className="fa-solid fa-check" /> Active
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .searchable-game-select-container {
          position: relative;
          width: 100%;
          user-select: none;
          margin-bottom: 0.75rem;
        }
        .game-select-label {
          display: block;
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--text-muted, #94a3b8);
          letter-spacing: 0.05em;
          margin-bottom: 0.45rem;
        }
        .game-select-trigger {
          width: 100%;
          background: rgba(14, 18, 38, 0.9);
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 0.65rem 0.95rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .game-select-trigger:hover {
          border-color: ${primaryColor};
          background: rgba(20, 26, 54, 0.98);
        }
        .game-select-trigger.active {
          border-color: ${primaryColor};
          background: rgba(20, 26, 54, 0.98);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(255, 200, 0, 0.15);
        }
        .game-trigger-logo-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid ${primaryColor};
          background: #000;
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .game-trigger-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .game-trigger-title {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .game-trigger-sub {
          font-size: 0.7rem;
          color: var(--text-muted, #94a3b8);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .game-active-pill {
          font-size: 0.65rem;
          font-weight: 800;
          color: ${primaryColor};
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.2rem 0.5rem;
          border-radius: 9999px;
          letter-spacing: 0.05em;
        }
        .trigger-arrow-box {
          color: var(--text-muted, #94a3b8);
          font-size: 0.85rem;
          transition: transform 0.2s ease;
        }
        .game-dropdown-popover {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 1050;
          background: #0b0f24;
          border: 1.5px solid ${primaryColor};
          border-radius: 16px;
          padding: 0.5rem;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.95), 0 0 25px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          animation: dropIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dropIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .game-search-header {
          position: relative;
          display: flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 0.5rem;
        }
        .search-icon {
          position: absolute;
          left: 0.85rem;
          color: var(--text-muted, #94a3b8);
          font-size: 0.85rem;
          pointer-events: none;
        }
        .game-search-input {
          width: 100%;
          background: rgba(6, 9, 22, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 0.55rem 2rem 0.55rem 2.2rem;
          color: #fff;
          font-size: 0.85rem;
          outline: none;
          box-sizing: border-box;
        }
        .game-search-input:focus {
          border-color: ${primaryColor};
        }
        .clear-search-btn {
          position: absolute;
          right: 0.85rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.1rem;
          cursor: pointer;
          line-height: 1;
        }
        .clear-search-btn:hover {
          color: #fff;
        }
        .game-dropdown-scroll {
          max-height: 240px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.25rem 0;
        }
        .game-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .game-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .game-dropdown-item.selected {
          background: rgba(255, 200, 0, 0.14);
          border: 1px solid rgba(255, 200, 0, 0.35);
        }
        .game-item-thumb {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.15);
          flex-shrink: 0;
        }
        .game-item-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .game-item-badge {
          font-size: 0.65rem;
          font-weight: 800;
          color: ${primaryColor};
          background: rgba(0, 0, 0, 0.4);
          padding: 0.2rem 0.45rem;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .no-games-row {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
