'use client'

import React, { useEffect, useState } from 'react'
import NotificationCenter from '@/components/notification-center'
import Sidebar from '@/components/sidebar'
import { apiClient } from '@/lib/api-client'
import styles from './savings-jars.module.css'

interface Account {
  id: number
  accountNumber: string
  accountName: string
  balance: number
}

interface SavingsJar {
  id: number
  userId: number
  name: string
  targetAmount: number
  currentAmount: number
  roundUpEnabled: boolean
  roundUpRule: number
  createdAt: string
  updatedAt: string
}

export default function SavingsJarsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [jars, setJars] = useState<SavingsJar[]>([])
  const [loading, setLoading] = useState(true)

  // Creation form state
  const [newJarName, setNewJarName] = useState('')
  const [newJarTarget, setNewJarTarget] = useState('')
  const [newJarRoundUp, setNewJarRoundUp] = useState(false)
  const [newJarRule, setNewJarRule] = useState<number>(100)

  // Modal active states
  const [activeModal, setActiveModal] = useState<
    'deposit' | 'withdraw' | 'delete' | null
  >(null)
  const [selectedJar, setSelectedJar] = useState<SavingsJar | null>(null)

  // Modal form states
  const [transactionAccount, setTransactionAccount] = useState<string>('')
  const [transactionAmount, setTransactionAmount] = useState<string>('')

  const fetchData = async () => {
    try {
      const [accountsRes, jarsRes] = await Promise.all([
        apiClient<{ ok: boolean; data: Account[] }>('/accounts'),
        apiClient<{ ok: boolean; data: SavingsJar[] }>('/savings-jars')
      ])

      if (accountsRes.ok && accountsRes.data) {
        setAccounts(accountsRes.data)
        if (accountsRes.data.length > 0) {
          setTransactionAccount(accountsRes.data[0].accountNumber)
        }
      }

      if (jarsRes.ok && jarsRes.data) {
        setJars(jarsRes.data)
      }
    } catch (err) {
      console.error('Failed to load accounts/savings jars:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateJar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newJarName.trim()) {
      alert('Please enter a goal name.')
      return
    }
    const target = Number(newJarTarget)
    if (isNaN(target) || target <= 0) {
      alert('Please enter a valid target amount greater than 0.')
      return
    }

    try {
      await apiClient('/savings-jars', {
        method: 'POST',
        body: JSON.stringify({
          name: newJarName.trim(),
          targetAmount: target,
          roundUpEnabled: newJarRoundUp,
          roundUpRule: newJarRoundUp ? Number(newJarRule) : undefined
        })
      })
      alert('Savings jar created successfully!')
      setNewJarName('')
      setNewJarTarget('')
      setNewJarRoundUp(false)
      fetchData()
    } catch (err: any) {
      alert(err?.message || 'Failed to create savings jar.')
    }
  }

  const handleToggleRoundUp = async (jar: SavingsJar) => {
    const nextRoundUpState = !jar.roundUpEnabled
    try {
      const res = await apiClient<{ ok: boolean; data: SavingsJar }>(
        `/savings-jars/${jar.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            roundUpEnabled: nextRoundUpState,
            roundUpRule: jar.roundUpRule
          })
        }
      )
      if (res.ok) {
        alert(
          nextRoundUpState
            ? `Round-up activated for "${jar.name}"! Others have been disabled.`
            : `Round-up disabled for "${jar.name}".`
        )
        fetchData()
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update round-up preferences.')
    }
  }

  const handleUpdateRule = async (jar: SavingsJar, rule: number) => {
    try {
      const res = await apiClient<{ ok: boolean; data: SavingsJar }>(
        `/savings-jars/${jar.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            roundUpRule: rule
          })
        }
      )
      if (res.ok) {
        fetchData()
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update round-up rule.')
    }
  }

  const openDepositModal = (jar: SavingsJar) => {
    setSelectedJar(jar)
    setTransactionAmount('')
    setActiveModal('deposit')
  }

  const openWithdrawModal = (jar: SavingsJar) => {
    setSelectedJar(jar)
    setTransactionAmount('')
    setActiveModal('withdraw')
  }

  const openDeleteModal = (jar: SavingsJar) => {
    setSelectedJar(jar)
    setActiveModal('delete')
  }

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJar || !activeModal) return

    const amount = Number(transactionAmount)

    if (activeModal !== 'delete') {
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0.')
        return
      }
      if (!transactionAccount) {
        alert('Please select an account.')
        return
      }
    }

    try {
      if (activeModal === 'deposit') {
        const res = await apiClient<{ ok: boolean; message: string }>(
          `/savings-jars/${selectedJar.id}/deposit`,
          {
            method: 'POST',
            body: JSON.stringify({
              accountNumber: transactionAccount,
              amount
            })
          }
        )
        if (res.ok) {
          alert(`Deposited Rs. ${amount.toLocaleString()} successfully!`)
          setActiveModal(null)
          fetchData()
        }
      } else if (activeModal === 'withdraw') {
        const res = await apiClient<{ ok: boolean; message: string }>(
          `/savings-jars/${selectedJar.id}/withdraw`,
          {
            method: 'POST',
            body: JSON.stringify({
              accountNumber: transactionAccount,
              amount
            })
          }
        )
        if (res.ok) {
          alert(`Withdrew Rs. ${amount.toLocaleString()} successfully!`)
          setActiveModal(null)
          fetchData()
        }
      } else if (activeModal === 'delete') {
        const url = `/savings-jars/${selectedJar.id}${
          Number(selectedJar.currentAmount) > 0
            ? `?refundAccount=${transactionAccount}`
            : ''
        }`
        const res = await apiClient<{ ok: boolean; message: string }>(url, {
          method: 'DELETE'
        })
        if (res.ok) {
          alert(`Savings jar deactivated successfully. ${res.message || ''}`)
          setActiveModal(null)
          fetchData()
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Transaction failed.')
    }
  }

  return (
    <main className={styles.pageContainer}>
      <Sidebar />
      <section className={styles.content}>
        <header className={styles.contentHeader}>
          <h1 className={styles.pageTitle}>Savings Jars</h1>
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
          {/* Active Jars View */}
          <div className={styles.jarsSection}>
            <h2 className={styles.sectionTitle}>Your Savings Goals</h2>
            {loading ? (
              <div>Loading savings jars...</div>
            ) : jars.length > 0 ? (
              <div className={styles.jarsGrid}>
                {jars.map((jar) => {
                  const currentVal = Number(jar.currentAmount)
                  const targetVal = Number(jar.targetAmount)
                  const percent =
                    targetVal > 0
                      ? Math.min((currentVal / targetVal) * 100, 100)
                      : 0

                  return (
                    <div className={styles.jarCard} key={jar.id}>
                      {/* Realistic 3D Glass Jar */}
                      <div className={styles.jarContainer}>
                        <div className={styles.jarNeck} />

                        {/* Dynamic percentage overlay */}
                        <div className={styles.jarPercent}>
                          {Math.round(percent)}%
                        </div>

                        {/* Gold Liquid height controlled by progress */}
                        <div
                          className={styles.liquid}
                          style={{ height: `${percent}%` }}
                        >
                          {percent > 0 && (
                            <>
                              <div className={styles.wave} />
                              <div className={styles.waveSecondary} />
                              {/* Glowing floating bubbles */}
                              <div
                                className={styles.bubble}
                                style={{
                                  left: '20%',
                                  animationDelay: '0s',
                                  width: '8px',
                                  height: '8px'
                                }}
                              />
                              <div
                                className={styles.bubble}
                                style={{
                                  left: '45%',
                                  animationDelay: '1s',
                                  width: '12px',
                                  height: '12px'
                                }}
                              />
                              <div
                                className={styles.bubble}
                                style={{
                                  left: '70%',
                                  animationDelay: '2.5s',
                                  width: '6px',
                                  height: '6px'
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Goal Details */}
                      <div className={styles.jarInfo}>
                        <h3 className={styles.jarName}>{jar.name}</h3>
                        <p className={styles.jarProgress}>
                          Rs. {currentVal.toLocaleString('en-US')} / Rs.{' '}
                          {targetVal.toLocaleString('en-US')}
                        </p>

                        {/* Round-up indicator / configuration */}
                        <div
                          style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            alignItems: 'center'
                          }}
                        >
                          <label
                            className={styles.checkboxLabel}
                            style={{ justifyContent: 'center' }}
                          >
                            <input
                              type="checkbox"
                              checked={jar.roundUpEnabled}
                              onChange={() => handleToggleRoundUp(jar)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span>Spare Change Round-Up</span>
                          </label>

                          {jar.roundUpEnabled && (
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                fontSize: '0.8rem'
                              }}
                            >
                              <span>Rule:</span>
                              <select
                                value={jar.roundUpRule}
                                onChange={(e) =>
                                  handleUpdateRule(jar, Number(e.target.value))
                                }
                                className={styles.select}
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.8rem',
                                  width: 'auto',
                                  background: 'rgba(255,255,255,0.05)'
                                }}
                              >
                                <option value={50}>Nearest Rs. 50</option>
                                <option value={100}>Nearest Rs. 100</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Deposit / Withdraw / Delete Buttons */}
                      <div className={styles.actions}>
                        <button
                          className={styles.btnDeposit}
                          onClick={() => openDepositModal(jar)}
                        >
                          Save
                        </button>
                        <button
                          className={styles.btnWithdraw}
                          onClick={() => openWithdrawModal(jar)}
                        >
                          Withdraw
                        </button>
                      </div>

                      <button
                        className={styles.btnDelete}
                        onClick={() => openDeleteModal(jar)}
                      >
                        Deactivate Jar
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                No savings jars created yet. Set a goal in the panel on the
                right to start saving!
              </div>
            )}
          </div>

          {/* New Jar Creation Form */}
          <div className={styles.createSection}>
            <h2 className={styles.sectionTitle}>Set a Savings Goal</h2>
            <form onSubmit={handleCreateJar} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Europe Trip ✈️"
                  value={newJarName}
                  onChange={(e) => setNewJarName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Amount (Rs.)</label>
                <input
                  type="number"
                  placeholder="e.g. 250000"
                  value={newJarTarget}
                  onChange={(e) => setNewJarTarget(e.target.value)}
                  className={styles.input}
                  min="1"
                  required
                />
              </div>

              <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newJarRoundUp}
                    onChange={(e) => setNewJarRoundUp(e.target.checked)}
                  />
                  <span>Enable spare change sweeps for this jar</span>
                </label>
              </div>

              {newJarRoundUp && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Round-Up Nearest Factor
                  </label>
                  <select
                    value={newJarRule}
                    onChange={(e) => setNewJarRule(Number(e.target.value))}
                    className={styles.select}
                  >
                    <option value={50}>
                      Nearest Rs. 50 (e.g. Rs. 210 rounds up to Rs. 250)
                    </option>
                    <option value={100}>
                      Nearest Rs. 100 (e.g. Rs. 210 rounds up to Rs. 300)
                    </option>
                  </select>
                </div>
              )}

              <button type="submit" className={styles.btnSubmit}>
                Launch Goal Jar
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Manual Deposit/Withdraw/Delete Dialog */}
      {activeModal && selectedJar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              {activeModal === 'deposit' && `Save into "${selectedJar.name}"`}
              {activeModal === 'withdraw' &&
                `Withdraw from "${selectedJar.name}"`}
              {activeModal === 'delete' && `Deactivate "${selectedJar.name}"`}
            </h3>

            <form onSubmit={handleModalSubmit} className={styles.form}>
              {/* If delete and balance > 0, or if deposit/withdraw, pick bank account */}
              {(activeModal !== 'delete' ||
                Number(selectedJar.currentAmount) > 0) && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {activeModal === 'deposit' && 'Debit Bank Account'}
                    {activeModal === 'withdraw' && 'Credit Bank Account'}
                    {activeModal === 'delete' &&
                      'Refund Destination Account (Current Balance exists)'}
                  </label>
                  <select
                    value={transactionAccount}
                    onChange={(e) => setTransactionAccount(e.target.value)}
                    className={styles.select}
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.accountNumber}>
                        {acc.accountName} (Rs.{' '}
                        {Number(acc.balance).toLocaleString('en-US', {
                          minimumFractionDigits: 2
                        })}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Deposit/Withdraw amounts */}
              {activeModal !== 'delete' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    className={styles.input}
                    min="1"
                    required
                  />
                  {activeModal === 'withdraw' && (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.5)',
                        marginTop: '2px'
                      }}
                    >
                      Max available: Rs.{' '}
                      {Number(selectedJar.currentAmount).toLocaleString(
                        'en-US'
                      )}
                    </span>
                  )}
                </div>
              )}

              {activeModal === 'delete' && (
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#fca5a5',
                    lineHeight: '1.4'
                  }}
                >
                  ⚠️ Deactivating this jar will permanently remove it.
                  {Number(selectedJar.currentAmount) > 0
                    ? ` The current savings of Rs. ${Number(selectedJar.currentAmount).toLocaleString('en-US')} will be automatically returned to your refund account.`
                    : ' There are no remaining funds in this jar.'}
                </p>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnConfirm}>
                  {activeModal === 'deposit' && 'Confirm Deposit'}
                  {activeModal === 'withdraw' && 'Confirm Withdrawal'}
                  {activeModal === 'delete' && 'Deactivate Jar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
