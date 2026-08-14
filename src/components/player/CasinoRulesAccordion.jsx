'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_TIERS = [
  { depositRange: '$5 - $50', multiplier: '3x Deposit', minCashoutExample: 'Min $15.00 – $150.00', note: 'Fast 5-Minute Payout' },
  { depositRange: '$51 - $100', multiplier: '3x Deposit', minCashoutExample: 'Min $153.00 – $300.00', note: 'Instant Payout' },
  { depositRange: '$101 - $250', multiplier: '2x Deposit', minCashoutExample: 'Min $202.00 – $500.00', note: 'VIP Express Payout' },
  { depositRange: '$250+', multiplier: '2x Deposit', minCashoutExample: 'Min $500.00+', note: 'Unlimited High Roller' }
];

export default function CasinoRulesAccordion({ frontendSettings = {} }) {
  const [openSection, setOpenSection] = useState(null);

  const minDep = frontendSettings.minimumDepositLimit !== undefined ? Number(frontendSettings.minimumDepositLimit) : 5;
  const minWith = frontendSettings.minimumWithdrawalLimit !== undefined ? Number(frontendSettings.minimumWithdrawalLimit) : 5;
  const fpAmount = frontendSettings.signupFreeplay !== undefined ? Number(frontendSettings.signupFreeplay) : 3;
  const fpMaxCashout = frontendSettings.freeplayMaxCashout !== undefined ? Number(frontendSettings.freeplayMaxCashout) : 50;
  const fpUnlock = frontendSettings.freeplayUnlockDeposit !== undefined ? Number(frontendSettings.freeplayUnlockDeposit) : 25;
  const firstBonus = frontendSettings.firstDepositBonus !== undefined ? Number(frontendSettings.firstDepositBonus) : 300;
  const regBonus = frontendSettings.regularDepositBonus !== undefined ? Number(frontendSettings.regularDepositBonus) : 20;

  const tiers = Array.isArray(frontendSettings.cashoutTiers) && frontendSettings.cashoutTiers.length > 0
    ? frontendSettings.cashoutTiers
    : DEFAULT_TIERS;

  const customRules = Array.isArray(frontendSettings.customCashoutRules) && frontendSettings.customCashoutRules.length > 0
    ? frontendSettings.customCashoutRules
    : [];

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const sections = useMemo(() => [
    {
      id: 'deposit_rules',
      icon: 'fa-solid fa-coins',
      iconColor: '#ffc800',
      title: 'DEPOSIT & COIN LOADING RULES',
      subtitle: `Minimum $${minDep}.00 deposit, payment receipt & ${firstBonus}% match bonus`,
      items: [
        {
          highlight: `Minimum Deposit $${minDep}.00:`,
          text: `The minimum deposit amount is strictly $${minDep}.00. Deposits under $${minDep}.00 cannot be credited.`
        },
        {
          highlight: 'Mandatory Payment Receipt:',
          text: 'A clear payment screenshot showing the note code, recipient tag, and timestamp is required for all deposits.'
        },
        {
          highlight: `${firstBonus}% First Deposit Bonus:`,
          text: `Enjoy a ${firstBonus}% match bonus on your first load and ${regBonus}% reload bonus on all future deposits.`
        },
        {
          highlight: 'Rapid 24/7 Coin Allotment:',
          text: 'Our 24/7 coin distribution staff loads game credits directly to your in-game username within minutes of verification.'
        }
      ]
    },
    {
      id: 'cashout_tiers',
      icon: 'fa-solid fa-scale-balanced',
      iconColor: '#00e676',
      title: 'DEPOSIT VS. MINIMUM CASHOUT RULES',
      subtitle: `Deposit $5 to $50 requires 3x multiplier to cash out. No max limits on real deposits!`,
      isTierTable: true,
      items: [
        {
          highlight: '3x Deposit Multiplier Requirement:',
          text: 'Deposits between $5.00 and $50.00 require a minimum 3x multiplier to cash out (e.g. $5 deposit requires min $15 cashout, $50 deposit requires min $150 cashout).'
        },
        {
          highlight: 'NO MAXIMUM CASHOUT CAPS:',
          text: 'There are strictly NO maximum caps or limits on real money deposits! You can cash out 100% of your winnings once your minimum session multiplier is reached.'
        },
        {
          highlight: `Supported Instant Payment Gateways:`,
          text: `Fast cashouts sent directly to CashApp, PayPal, Chime, Zelle, Bitcoin, Apple Pay, and Venmo.`
        }
      ]
    },
    {
      id: 'freeplay_rules',
      icon: 'fa-solid fa-gift',
      iconColor: '#00f0ff',
      title: 'SIGNUP FREEPLAY & BONUS CASHOUT RULES',
      subtitle: `$${fpAmount}.00 Freeplay, $${fpMaxCashout}.00 max cashout & $${fpUnlock}.00 hold balance unlock`,
      items: [
        {
          highlight: `$${fpAmount}.00 Instant Signup Freeplay:`,
          text: `All newly registered players receive $${fpAmount}.00 Freeplay on their first game of choice without any initial deposit.`
        },
        {
          highlight: `$${fpMaxCashout}.00 Max Cashout on Freeplay:`,
          text: `The maximum allowable cashout redeemed from $${fpAmount}.00 freeplay winnings is $${fpMaxCashout}.00.`
        },
        {
          highlight: `Hold Balance Unlock with $${fpUnlock}.00 Deposit:`,
          text: `Any excess winnings above $${fpMaxCashout}.00 are safely preserved in your Cashout Hold and unlocked as deposit bonus after depositing $${fpUnlock}.00.`
        },
        {
          highlight: '1 Freeplay Per Player Account:',
          text: 'Freeplay promotions are strictly limited to one claim per person, device, and household.'
        }
      ]
    },
    {
      id: 'security_rules',
      icon: 'fa-solid fa-shield-halved',
      iconColor: '#a855f7',
      title: 'ACCOUNT SAFETY & FAIR PLAY RULES',
      subtitle: 'Single account policy, certified RNG & 24/7 player assistance',
      items: [
        {
          highlight: 'Single Account Policy:',
          text: 'Players may only operate one Winning Heaven account. Multi-accounting to abuse promotions is strictly prohibited.'
        },
        {
          highlight: 'Certified Provably Fair RNG:',
          text: 'All slot and fish arcade platforms operate certified RNG algorithms ensuring genuine payout probabilities.'
        },
        ...customRules.map((cr) => ({
          highlight: `${cr.title}:`,
          text: cr.description
        }))
      ]
    }
  ], [minDep, minWith, fpAmount, fpMaxCashout, fpUnlock, firstBonus, regBonus, customRules]);

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
              PLATFORM RULES & <span className="gold-gradient-text">MINIMUM CASHOUT MULTIPLIERS</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click any section below to review deposit terms, minimum withdrawal multipliers, and bonus guidelines
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
        {sections.map((sec) => {
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
                      gap: '0.75rem'
                    }}>
                      {/* If Cashout Tiers Section: Render Rich Interactive Tiers Table */}
                      {sec.isTierTable && (
                        <div style={{
                          background: 'rgba(6, 8, 18, 0.95)',
                          border: '1px solid rgba(0, 230, 118, 0.3)',
                          borderRadius: '14px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(0, 230, 118, 0.1)',
                            borderBottom: '1px solid rgba(0, 230, 118, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.4rem'
                          }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#00e676', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              <i className="fa-solid fa-bolt" style={{ marginRight: '6px' }} /> Minimum Withdrawal Multipliers by Deposit
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#ffc800', fontWeight: 800 }}>
                              <i className="fa-solid fa-infinity" style={{ marginRight: '4px' }} /> No Max Caps on Winnings
                            </span>
                          </div>

                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                  <th style={{ padding: '0.65rem 1rem', fontWeight: 800 }}>Deposit Range</th>
                                  <th style={{ padding: '0.65rem 1rem', fontWeight: 800 }}>Min Multiplier</th>
                                  <th style={{ padding: '0.65rem 1rem', fontWeight: 800 }}>Min Cashout Example</th>
                                  <th style={{ padding: '0.65rem 1rem', fontWeight: 800 }}>Payout Speed</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tiers.map((t, idx) => (
                                  <tr
                                    key={idx}
                                    style={{
                                      borderBottom: idx < tiers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                                    }}
                                  >
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#fff' }}>
                                      {t.depositRange}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gold-primary)', fontWeight: 900 }}>
                                      {t.multiplier || '3x Deposit'}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 900, color: '#00e676', fontFamily: 'var(--font-heading)' }}>
                                      {t.minCashoutExample || t.maxCashout || `Min $${(parseFloat(String(t.depositRange || '').replace(/[^0-9.]/g, '') || 5) * 3).toFixed(2)}`}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                      <i className="fa-solid fa-bolt" style={{ color: '#00e676', marginRight: '5px' }} />
                                      {t.note || 'Instant Payout'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Rule Bullets */}
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
