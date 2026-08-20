import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function GamesLibraryTab({ onAddGameClick, onEditGameClick, onDeleteGame }) {
  const { data: gamesData, error, mutate } = useSWR('/api/games?includeInactive=true', fetcher);
  const [gameSearch, setGameSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const games = gamesData?.games || [];
  const filteredGames = games.filter((g) =>
    g.title.toLowerCase().includes(gameSearch.toLowerCase())
  );

  const handleDelete = async (id) => {
    await onDeleteGame(id);
    mutate(); // revalidate cache
  };

  const handleToggleActive = async (game) => {
    if (togglingId) return;
    setTogglingId(game.id);
    const newActiveState = game.active === false ? true : false;
    try {
      const res = await fetch('/api/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: game.id,
          title: game.title,
          badge: game.badge,
          link: game.link,
          openPanelLink: game.openPanelLink,
          active: newActiveState
        })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        mutate();
      } else {
        alert(resData.message || 'Failed to toggle game visibility.');
      }
    } catch (err) {
      console.error('Toggle game status error:', err);
      alert('Network error while updating game visibility.');
    } finally {
      setTogglingId(null);
    }
  };

  if (!gamesData && !error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--gold-primary)', marginBottom: '1rem', display: 'block' }}></i>
        <p>Loading games library...</p>
      </div>
    );
  }

  return (
    <section className="admin-section-card" style={{ animation: 'fade-in 0.2s ease-out' }}>
      <div className="section-card-header" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3><i className="fa-solid fa-gamepad gold-text"></i> Game Library Manager</h3>
          <button className="submit-btn add-game-trigger" onClick={onAddGameClick} style={{ width: 'auto', marginTop: 0 }}>
            <i className="fa-solid fa-plus"></i> Add New Game
          </button>
        </div>
        
        <div className="input-wrapper search-wrapper" style={{ background: '#0b0d16', width: '100%' }}>
          <i className="fa-solid fa-magnifying-glass input-icon"></i>
          <input
            type="text"
            placeholder="Search games by title..."
            value={gameSearch}
            onChange={(e) => setGameSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Game Cover</th>
              <th>Game Title</th>
              <th>Badge Type</th>
              <th>Lobby Visibility</th>
              <th>Target Play Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGames.length === 0 ? (
              <tr><td colSpan="6" className="text-center text-muted">No games matching criteria found.</td></tr>
            ) : (
              filteredGames.map((game) => (
                <tr key={game.id}>
                  <td>
                    <div className="admin-game-th-img">
                      {(() => {
                        const img = String(game.image || '');
                        const isRealCover =
                          img.startsWith('data:') ||
                          img.startsWith('game_') ||
                          img.startsWith('http://') ||
                          img.startsWith('https://') ||
                          img.startsWith('/');
                        if (isRealCover) {
                          const src = img.startsWith('game_') ? `/${img}` : img;
                          return <img src={src} alt={game.title || 'cover'} style={{ borderRadius: '6px', width: '40px', height: '40px', objectFit: 'cover' }} />;
                        }
                        return (
                          <div className={`game-placeholder-card ${img === 'placeholder_2' ? 'pc-red' : img === 'placeholder_3' ? 'pc-blue' : 'pc-gold'}`} style={{ fontSize: '1rem', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(game.title || '??').slice(0, 2).toUpperCase()}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td><strong>{game.title}</strong></td>
                  <td><span className={`admin-badge-preview b-${game.badge}`}>{game.badge}</span></td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(game)}
                      disabled={togglingId === game.id}
                      style={{
                        background: game.active !== false
                          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(21, 128, 61, 0.25) 100%)'
                          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.25) 100%)',
                        border: `1px solid ${game.active !== false ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                        color: game.active !== false ? '#4ade80' : '#f87171',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: togglingId === game.id ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease',
                        boxShadow: game.active !== false ? '0 0 10px rgba(34, 197, 94, 0.25)' : 'none'
                      }}
                      title={game.active !== false ? 'Click to HIDE from Player Lobby' : 'Click to SHOW in Player Lobby'}
                    >
                      {togglingId === game.id ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: game.active !== false ? '#22c55e' : '#ef4444',
                          boxShadow: game.active !== false ? '0 0 8px #22c55e' : 'none'
                        }} />
                      )}
                      <span>{game.active !== false ? 'ONLINE (ON)' : 'HIDDEN (OFF)'}</span>
                    </button>
                  </td>
                  <td>
                    <a href={game.link} target="_blank" rel="noopener noreferrer" className="gold-text" style={{ fontSize: '0.75rem', textDecoration: 'none' }}>
                      {game.link.slice(0, 24)}...
                    </a>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-row-btn btn-edit" onClick={() => onEditGameClick(game)} title="Edit game"><i className="fa-solid fa-pen"></i></button>
                      <button className="action-row-btn btn-delete" onClick={() => handleDelete(game.id)} title="Delete game"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
