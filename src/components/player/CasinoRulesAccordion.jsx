'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RULES_SECTIONS = [
  {
    id: 'deposit_rules',
    icon: 'fa-solid fa-coins',
    iconColor: '#ffc800',
    title: 'DEPOSIT & COIN LOADING RULES',
    subtitle: 'Minimum limits, screenshot requirements & match bonuses',
    items: [
      {
        highlight: 'Minimum Deposit:',
        text: 'The minimum deposit amount is strictly $5.00. Deposits under $5.00 will not be processed.'
      },
      {
        highlight: 'Mandatory Payment Receipt:',
        text: 'A clear payment screenshot showing the recipient tag, amount, and timestamp is required for all deposits to verify transfer.'
      },
      {
        highlight: 'Instant Match Bonuses:',
        text: 'Enjoy a 300% First Deposit Match Bonus on your initial load and 20% match bonus on all subsequent reload deposits.'
      },
      {
        highlight: 'Rapid Coin Allotment:',
        text: 'Our 24/7 coin distribution staff loads game credits directly to your linked game username within minutes of verification.'
      }
    ]
  },
  {
    id: 'freeplay_rules',
    icon: 'fa-solid fa-gift',
    iconColor: '#00f0ff',
    title: 'FREEPLAY & SIGNUP BONUS RULES',
    subtitle: '$3 signup bonus, $50 max cashout & balance hold unlocks',
    items: [
      {
        highlight: '$3.00 Instant Freeplay:',
        text: 'All newly registered players are eligible to claim $3.00 Freeplay on their first platform game of choice.'
      },
      {
        highlight: '$50.00 Max Cashout on Freeplay:',
        text: 'The maximum allowable cashout redeemed from freeplay bonuses is $50.00.'
      },
      {
        highlight: 'Remaining Hold Balance:',
        text: 'Any excess balance above $50.00 is safely preserved in your Cashout Hold and can be unlocked as game deposit bonus after depositing $25.00.'
      },
      {
        highlight: 'One Freeplay Policy:',
        text: 'Freeplay is limited to one claim per person, device, and household.'
      }
    ]
  },
  {
    id: 'cashout_rules',
    icon: 'fa-solid fa-bolt',
    iconColor: '#00e676',
    title: 'CASHOUT & REDEMPTION RULES',
    subtitle: 'Supported payout methods, fast processing & remainder payouts',
    items: [
      {
        highlight: 'Supported Payout Methods:',
        text: 'Redeem your winnings instantly via CashApp, PayPal, Chime, Zelle, Bitcoin, Apple Pay, or Venmo.'
      },
      {
        highlight: 'Direct Payment Processing:',
        text: 'Approved payouts are sent directly to your payment tag or wallet address by our 24/7 finance team.'
      },
      {
        highlight: 'Partial Payouts & Remaining Claims:',
        text: 'If a cashout has a remainder balance, you can claim the remainder or transfer it directly into another game with one tap.'
      }
    ]
  },
  {
    id: 'security_rules',
    icon: 'fa-solid fa-shield-halved',
    iconColor: '#a855f7',
    title: 'ACCOUNT SAFETY & FAIR PLAY RULES',
    subtitle: 'Single account policy, RNG fairness & 24/7 player assistance',
    items: [
      {
        highlight: 'Single Account Policy:',
        text: 'Players may only operate one Winning Heaven account. Multi-accounting to abuse promotions is strictly prohibited.'
      },
      {
        highlight: 'Fair RNG Gaming:',
        text: 'All integrated slot and fish game platforms operate certified provably fair RNG algorithms.'
      },
      {
        highlight: '24/7 Live Support:',
        text: 'Have a question about a deposit or payout? Click the yellow headset icon at the bottom-right to chat live with our support team.'
      }
    ]
  }
];

export default function CasinoRulesAccordion() {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <section style={{
      width: '100%',
      marginTop: '2.5rem',
      marginBottom: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem'
    }}>
      {/* Section Title Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0 0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(255, 200, 0, 0.12)',
            border: '1px solid rgba(255, 200, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-primary)'
          }}>
            <i className="fa-solid fa-scale-balanced" />
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1.15rem',
              fontWeight: 900,
              color: '#fff',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.04em'
            }}>
              PLATFORM RULES & <span className="gold-gradient-text">PLAYER GUIDELINES</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click any section below to review deposit, bonus, and cashout terms
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '0.7rem',
          color: 'var(--gold-primary)',
          background: 'rgba(255, 200, 0, 0.08)',
          border: '1px solid rgba(255, 200, 0, 0.25)',
          padding: '0.25rem 0.65rem',
          borderRadius: '20px',
          fontWeight: 700
        }}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: '4px' }} /> Tap to Expand
        </span>
      </div>

      {/* Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {RULES_SECTIONS.map((sec) => {
          const isOpen = openSection === sec.id;

          return (
            <div
              key={sec.id}
              style={{
                background: isOpen ? 'rgba(14, 18, 38, 0.95)' : 'rgba(8, 11, 24, 0.75)',
                border: isOpen ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.25s ease',
                boxShadow: isOpen ? '0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(255,200,0,0.1)' : 'none'
              }}
            >
              {/* Accordion Trigger Header */}
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `rgba(${sec.iconColor === '#ffc800' ? '255, 200, 0' : sec.iconColor === '#00f0ff' ? '0, 240, 255' : sec.iconColor === '#00e676' ? '0, 230, 118' : '168, 85, 247'}, 0.15)`,
                    border: `1px solid ${sec.iconColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: sec.iconColor,
                    fontSize: '1rem',
                    flexShrink: 0
                  }}>
                    <i className={sec.icon} />
                  </div>

                  <div>
                    <div style={{
                      fontWeight: 900,
                      color: isOpen ? 'var(--gold-primary)' : '#fff',
                      fontSize: '0.92rem',
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.02em',
                      transition: 'color 0.2s ease'
                    }}>
                      {sec.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {sec.subtitle}
                    </div>
                  </div>
                </div>

                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isOpen ? 'var(--gold-primary)' : 'rgba(255,255,255,0.06)',
                  color: isOpen ? '#000' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  flexShrink: 0,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'all 0.25s ease'
                }}>
                  <i className="fa-solid fa-chevron-down" />
                </div>
              </button>

              {/* Collapsible Content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      padding: '0 1.25rem 1.25rem 1.25rem',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      marginTop: '0.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}>
                      {sec.items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(6, 8, 18, 0.7)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.65rem',
                            fontSize: '0.82rem',
                            lineHeight: 1.45
                          }}
                        >
                          <i className="fa-solid fa-check" style={{ color: sec.iconColor, marginTop: '3px', fontSize: '0.8rem', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: '#fff', marginRight: '5px' }}>{item.highlight}</strong>
                            <span style={{ color: 'var(--text-muted)' }}>{item.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
