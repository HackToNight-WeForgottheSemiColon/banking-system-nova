'use client'

import React, { useEffect, useState } from 'react'
import NotificationCenter from '@/components/notification-center'
import Sidebar from '@/components/sidebar'
import { apiClient } from '@/lib/api-client'
import styles from './cards.module.css'

interface Account {
  id: number
  accountNumber: string
  accountName: string
  balance: number
}

interface VirtualCard {
  id: number
  userId: number
  accountId: number
  cardNumber: string
  cardholderName: string
  expiryDate: string
  cvv: string
  cardType: 'debit' | 'credit'
  isFrozen: boolean
  dailyLimit: number
  createdAt: string
}

export default function CardsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<VirtualCard[]>([])
  const [loading, setLoading] = useState(true)

  // Flip state (tracks IDs of flipped cards)
  const [flippedCardIds, setFlippedCardIds] = useState<Record<number, boolean>>(
    {}
  )

  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('')
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit')
  const [dailyLimit, setDailyLimit] = useState<number>(50000)

  // Local limit inputs (so dragging doesn't cause constant re-fetching)
  const [localLimits, setLocalLimits] = useState<Record<number, number>>({})

  const fetchData = async () => {
    try {
      const [accountsRes, cardsRes] = await Promise.all([
        apiClient<{ ok: boolean; data: Account[] }>('/accounts'),
        apiClient<{ ok: boolean; data: VirtualCard[] }>('/virtual-cards')
      ])

      if (accountsRes.ok && accountsRes.data) {
        setAccounts(accountsRes.data)
        if (accountsRes.data.length > 0) {
          setSelectedAccountId(accountsRes.data[0].id)
        }
      }

      if (cardsRes.ok && cardsRes.data) {
        setCards(cardsRes.data)

        // Initialize local limits
        const limits: Record<number, number> = {}
        cardsRes.data.forEach((c) => {
          limits[c.id] = Number(c.dailyLimit)
        })
        setLocalLimits(limits)
      }
    } catch (err) {
      console.error('Failed to load cards/accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccountId) {
      alert('Please select a bank account to link.')
      return
    }

    try {
      await apiClient('/virtual-cards', {
        method: 'POST',
        body: JSON.stringify({
          accountId: Number(selectedAccountId),
          cardType,
          dailyLimit
        })
      })
      alert('Virtual card generated successfully!')
      fetchData()
    } catch (err: any) {
      alert(err?.message || 'Failed to generate virtual card.')
    }
  }

  const handleToggleFreeze = async (cardId: number) => {
    try {
      const res = await apiClient<{
        ok: boolean
        message: string
        data: VirtualCard
      }>(`/virtual-cards/${cardId}/toggle-freeze`, { method: 'PATCH' })
      if (res.ok) {
        setCards((prev) => prev.map((c) => (c.id === cardId ? res.data : c)))
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update card status.')
    }
  }

  const handleUpdateLimit = async (cardId: number, limit: number) => {
    try {
      const res = await apiClient<{ ok: boolean; data: VirtualCard }>(
        `/virtual-cards/${cardId}/limit`,
        {
          method: 'PATCH',
          body: JSON.stringify({ limit })
        }
      )
      if (res.ok) {
        setCards((prev) => prev.map((c) => (c.id === cardId ? res.data : c)))
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update spending limit.')
    }
  }

  const handleDeleteCard = async (cardId: number) => {
    if (
      !confirm(
        'Are you sure you want to deactivate and delete this virtual card? This cannot be undone.'
      )
    ) {
      return
    }

    try {
      await apiClient(`/virtual-cards/${cardId}`, { method: 'DELETE' })
      alert('Virtual card deleted successfully.')
      fetchData()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete card.')
    }
  }

  const toggleFlip = (cardId: number) => {
    setFlippedCardIds((prev) => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  const formatCardNumber = (num: string) => {
    return num.replace(/(.{4})/g, '$1 ').trim()
  }

  const getAccountName = (accId: number) => {
    const acc = accounts.find((a) => a.id === accId)
    return acc ? acc.accountName : `Account #${accId}`
  }

  return (
    <main className={styles.pageContainer}>
      <Sidebar />
      <section className={styles.content}>
        <header className={styles.contentHeader}>
          <h1 className={styles.pageTitle}>Virtual Cards</h1>
          <div className={styles.headerActions}>
            <NotificationCenter />
            <div className={styles.avatarPlaceholder}>
              <img
                src="/person-logo.png"
                alt="Profile"
                width={40}
                height={40}
                style={{ objectFit: 'cover', borderRadius: '50%' }}
              />
            </div>
          </div>
        </header>

        <div className={styles.dashboardLayout}>
          {/* Virtual Cards Grid */}
          <div className={styles.cardsSection}>
            <h2 className={styles.sectionTitle}>Your Active Cards</h2>
            {loading ? (
              <div>Loading cards...</div>
            ) : cards.length > 0 ? (
              <div className={styles.cardsGrid}>
                {cards.map((card) => {
                  const isFlipped = !!flippedCardIds[card.id]
                  const currentLimit =
                    localLimits[card.id] ?? Number(card.dailyLimit)

                  return (
                    <div className={styles.cardContainer} key={card.id}>
                      {/* Realistic 3D Flipping Card Wrapper */}
                      <div
                        className={styles.cardWrapper}
                        onClick={() => toggleFlip(card.id)}
                      >
                        <div
                          className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''}`}
                        >
                          {/* Front of Card */}
                          <div
                            className={`${styles.cardFront} ${card.cardType === 'debit' ? styles.debitCardFront : styles.creditCardFront}`}
                          >
                            {card.isFrozen && (
                              <div
                                className={styles.frozenOverlay}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className={styles.frozenText}>
                                  ❄️ FROZEN
                                </div>
                              </div>
                            )}
                            <div className={styles.cardHeader}>
                              <span className={styles.cardType}>
                                {card.cardType}
                              </span>
                              <div className={styles.chip} />
                            </div>
                            <div className={styles.cardNumber}>
                              {formatCardNumber(card.cardNumber)}
                            </div>
                            <div className={styles.cardFooter}>
                              <div>
                                <div className={styles.cardLabel}>
                                  Cardholder
                                </div>
                                <div className={styles.cardValue}>
                                  {card.cardholderName}
                                </div>
                              </div>
                              <div>
                                <div className={styles.cardLabel}>Expires</div>
                                <div className={styles.cardValue}>
                                  {card.expiryDate}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Back of Card */}
                          <div className={styles.cardBack}>
                            <div className={styles.magneticStrip} />
                            <div className={styles.signatureArea}>
                              <div className={styles.signatureLine} />
                              <div className={styles.cvvBox}>{card.cvv}</div>
                            </div>
                            <div className={styles.cardInfoBack}>
                              Authorized Signature • Not Transferable • Nova
                              Bank Customer Care
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.helperText}>
                        💡 Click card to flip and view CVV
                      </div>

                      {/* Controls below card */}
                      <div className={styles.controls}>
                        <div className={styles.controlRow}>
                          <span className={styles.controlLabel}>
                            Linked Account
                          </span>
                          <span
                            style={{
                              fontSize: '0.9rem',
                              color: '#fff',
                              fontWeight: 500
                            }}
                          >
                            {getAccountName(card.accountId)}
                          </span>
                        </div>

                        <div className={styles.controlRow}>
                          <span className={styles.controlLabel}>
                            Freeze Card
                          </span>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={card.isFrozen}
                              onChange={() => handleToggleFreeze(card.id)}
                            />
                            <span className={styles.switchSlider} />
                          </label>
                        </div>

                        <div className={styles.limitContainer}>
                          <div className={styles.controlRow}>
                            <span className={styles.controlLabel}>
                              Daily Limit
                            </span>
                            <span
                              style={{
                                fontSize: '0.9rem',
                                color: '#fff',
                                fontWeight: 600
                              }}
                            >
                              Rs. {currentLimit.toLocaleString()}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5000"
                            max="500000"
                            step="5000"
                            value={currentLimit}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              setLocalLimits((prev) => ({
                                ...prev,
                                [card.id]: val
                              }))
                            }}
                            onMouseUp={() =>
                              handleUpdateLimit(card.id, currentLimit)
                            }
                            onTouchEnd={() =>
                              handleUpdateLimit(card.id, currentLimit)
                            }
                            className={styles.slider}
                          />
                        </div>

                        <button
                          className={styles.btnDeleteCard}
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          Deactivate Card
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                No virtual cards found. Use the panel on the right to generate
                one.
              </div>
            )}
          </div>

          {/* Create Virtual Card Section */}
          <div className={styles.createSection}>
            <h2 className={styles.sectionTitle}>Generate Virtual Card</h2>
            <form onSubmit={handleCreateCard} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Bank Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                  className={styles.select}
                  required
                >
                  <option value="" disabled>
                    -- Select account --
                  </option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} ({acc.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Card Type</label>
                <select
                  value={cardType}
                  onChange={(e) =>
                    setCardType(e.target.value as 'debit' | 'credit')
                  }
                  className={styles.select}
                >
                  <option value="debit">Debit Card</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.controlRow}>
                  <label className={styles.formLabel}>
                    Daily Spending Limit
                  </label>
                  <span style={{ fontWeight: 600 }}>
                    Rs. {dailyLimit.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="500000"
                  step="5000"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <button type="submit" className={styles.btnSubmit}>
                Generate Secure Card
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
