'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function GameCard({
  game,
  userAccount,
  hasPendingAccountRequest = false,
  isFavorite = false,
  onToggleFavorite,
  onPlayGame,
  onRequestAccount,
  onViewCredentials,
  onDepositToGame
}) {
  const isMaintenance = Boolean(game.isMaintenance);

  const getTagBadge = () => {
    if (isMaintenance) return <span className="badge-red"><i className="fa-solid fa-wrench" /> MAINTENANCE</span>;
    if (game.isHot) return <span className="badge-red"><i className="fa-solid fa-fire" /> HOT</span>;
    if (game.isNew) return <span className="badge-cyan"><i className="fa-solid fa-sparkles" /> NEW</span>;
    if (game.badge) return <span className="badge-gold">{game.badge}</span>;
    return null;
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={() => onPlayGame(game, userAccount)}
      style={{
        position: 'relative',
        background: 'rgba(12, 16, 32, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: userAccount 
          ? '1.5px solid rgba(255, 215, 0, 0.35)' 
          : hasPendingAccountRequest 
            ? '1.5px solid rgba(255, 170, 0, 0.35)' 
            : '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: userAccount 
          ? '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(255,200,0,0.12)' 
          : '0 10px 30px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer'
      }}
    >
      {/* Artwork Banner Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '68%',
        background: '#04050b',
        overflow: 'hidden'
      }}>
        <img
          src={game.image || game.logoUrl || '/winning_heaven_logo.png'}
          alt={game.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: isMaintenance ? 'grayscale(80%) brightness(0.6)' : 'none',
            transition: 'transform 0.4s ease'
          }}
        />

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(12,16,32,0.98) 0%, transparent 60%)'
        }} />

        {/* Top Badges Row */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2
        }}>
          <div>{getTagBadge()}</div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(game.id || game.title); }}
            style={{
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: isFavorite ? '#ffc800' : 'rgba(255,255,255,0.6)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            <i className={isFavorite ? 'fa-solid fa-star' : 'fa-regular fa-star'} />
          </button>
        </div>
      </div>

      {/* Content Details */}
      <div style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        gap: '0.75rem'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: '#fff',
            margin: '0 0 0.25rem 0',
            lineHeight: 1.2
          }}>
            {game.title}
          </h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fa-solid fa-layer-group" style={{ color: 'var(--gold-primary)', fontSize: '0.7rem' }} />
            <span>{game.category || 'Slots & Fish'}</span>
          </div>
        </div>

        {/* Action Button Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
          {isMaintenance ? (
            <button
              disabled
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-muted)',
                padding: '0.65rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'not-allowed',
                textAlign: 'center'
              }}
            >
              UNDER MAINTENANCE
            </button>
          ) : userAccount ? (
            /* User Has Credentials for this game */
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPlayGame(game, userAccount); }}
              className="btn-gold-glow"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
            >
              <i className="fa-solid fa-gamepad" /> OPEN GAME HUB
            </button>
          ) : hasPendingAccountRequest ? (
            /* Pending Request */
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPlayGame(game, null); }}
              style={{
                width: '100%',
                background: 'rgba(255, 170, 0, 0.15)',
                border: '1.5px solid #ffaa00',
                color: '#ffc800',
                padding: '0.7rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 0 15px rgba(255, 170, 0, 0.25)'
              }}
            >
              <i className="fa-solid fa-spinner fa-spin" />
              <span>PENDING / VIEW STATUS</span>
            </button>
          ) : (
            /* Request Account */
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPlayGame(game, null); }}
              className="btn-cyan-glow"
              style={{ width: '100%', padding: '0.7rem', fontSize: '0.82rem' }}
            >
              <i className="fa-solid fa-user-plus" />
              <span>REQUEST ACCOUNT</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
