'use client';

import React, { useState, useMemo } from 'react';
import GameCard from './GameCard';

export default function GameGrid({
  games = [],
  gameAccounts = [],
  accountRequests = [],
  favorites = [],
  onToggleFavorite,
  onPlayGame,
  onRequestAccount,
  onViewCredentials,
  onDepositToGame
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set(['ALL']);
    games.forEach((g) => {
      if (g.category) set.add(g.category.toUpperCase());
    });
    return Array.from(set);
  }, [games]);

  // Filter games based on category, search query, and favorites toggle
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      // Category check
      if (selectedCategory !== 'ALL' && (g.category || '').toUpperCase() !== selectedCategory) {
        return false;
      }
      // Favorites check
      if (onlyFavorites && !favorites.includes(g.id || g.title)) {
        return false;
      }
      // Search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (g.title || '').toLowerCase().includes(q);
        const matchCat = (g.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCat) return false;
      }
      return true;
    });
  }, [games, selectedCategory, searchQuery, onlyFavorites, favorites]);

  // Map game accounts by title
  const accountMap = useMemo(() => {
    const map = {};
    gameAccounts.forEach((acc) => {
      if (acc.gameTitle) map[acc.gameTitle.toLowerCase().trim()] = acc;
    });
    return map;
  }, [gameAccounts]);

  // Map pending account requests by title
  const pendingMap = useMemo(() => {
    const set = new Set();
    accountRequests.forEach((req) => {
      if (req.status === 'PENDING' && req.gameTitle) {
        set.add(req.gameTitle.toLowerCase().trim());
      }
    });
    return set;
  }, [accountRequests]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', margin: '1rem 0' }}>
      
      {/* Category Pills & Search Bar Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Search Bar Row */}
        <div className="game-filter-row" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            position: 'relative',
            flex: 1,
            minWidth: '220px'
          }}>
            <i className="fa-solid fa-magnifying-glass" style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }} />
            <input
              type="text"
              placeholder="Search games by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(10, 14, 28, 0.85)',
                border: '1px solid var(--border-muted)',
                borderRadius: '14px',
                padding: '0.7rem 1rem 0.7rem 2.4rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border-color 0.25s ease'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          {/* Favorites Toggle Filter Pill */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            style={{
              background: onlyFavorites ? 'rgba(255, 200, 0, 0.18)' : 'rgba(255,255,255,0.06)',
              border: onlyFavorites ? '1px solid var(--gold-primary)' : '1px solid rgba(255,255,255,0.15)',
              color: onlyFavorites ? 'var(--gold-primary)' : 'var(--text-muted)',
              borderRadius: '14px',
              padding: '0.7rem 0.95rem',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fa-solid fa-star" style={{ color: onlyFavorites ? 'var(--gold-primary)' : 'inherit' }} />
            FAVORITES ({favorites.length})
          </button>
        </div>

        {/* Categories Bar */}
        <div className="category-filter-pills" style={{
          display: 'flex',
          gap: '0.45rem',
          overflowX: 'auto',
          paddingBottom: '0.35rem',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      {filteredGames.length === 0 ? (
        <div style={{
          background: 'rgba(10, 14, 28, 0.6)',
          border: '1px solid var(--card-border)',
          borderRadius: '18px',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <i className="fa-solid fa-gamepad" style={{ fontSize: '2.5rem', color: 'rgba(255,200,0,0.3)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 0.5rem 0' }}>No Games Found</h3>
          <p style={{ fontSize: '0.85rem' }}>Try searching with a different title or select another category.</p>
        </div>
      ) : (
        <div className="games-grid">
          {filteredGames.map((game) => {
            const titleKey = (game.title || '').toLowerCase().trim();
            const userAccount = accountMap[titleKey] || null;
            const hasPendingRequest = pendingMap.has(titleKey);
            const isFav = favorites.includes(game.id || game.title);

            return (
              <GameCard
                key={game.id || game.title}
                game={game}
                userAccount={userAccount}
                hasPendingAccountRequest={hasPendingRequest}
                isFavorite={isFav}
                onToggleFavorite={onToggleFavorite}
                onPlayGame={onPlayGame}
                onRequestAccount={onRequestAccount}
                onViewCredentials={onViewCredentials}
                onDepositToGame={onDepositToGame}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
