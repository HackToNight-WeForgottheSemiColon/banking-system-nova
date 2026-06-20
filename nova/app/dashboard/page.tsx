'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import NotificationCenter from '@/components/notification-center'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { ChevronRight, Search } from '../../components/Icons'
import Sidebar from '../../components/sidebar'

interface Account {
  id: number
  userId: number
  accountNumber: string
  accountName: string
  balance: number
}

interface Transaction {
  id: number
  fromAccount: string
  toAccount: string
  amount: number
  description: string
  status: string
  createdAt: string
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeAccount, setActiveAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  const [payees, setPayees] = useState<any[]>([])

  // Split bill states
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [friendUsername, setFriendUsername] = useState('')
  const [splitAmount, setSplitAmount] = useState('')
  const [splitDescription, setSplitDescription] = useState('')
  const [isSubmittingSplit, setIsSubmittingSplit] = useState(false)

  const handleOpenSplitModal = (tx: Transaction) => {
    setSelectedTx(tx)
    setFriendUsername('')
    setSplitAmount((Number(tx.amount) / 2).toString())
    setSplitDescription(`Split bill for ${tx.description || 'Transaction'}`)
    setShowSplitModal(true)
  }

  const handleSendSplitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTx) return

    const amount = Number(splitAmount)
    if (isNaN(amount) || amount <= 0 || amount > Number(selectedTx.amount)) {
      alert(
        `Invalid split amount. Must be positive and at most Rs. ${Number(selectedTx.amount).toLocaleString()}`
      )
      return
    }

    if (!friendUsername.trim()) {
      alert("Please enter a friend's username.")
      return
    }

    setIsSubmittingSplit(true)
    try {
      await apiClient('/bill-splits', {
        method: 'POST',
        body: JSON.stringify({
          payerUsername: friendUsername.trim(),
          amount,
          description: splitDescription.trim(),
          transactionId: selectedTx.id
        })
      })
      alert('Split bill request sent successfully!')
      setShowSplitModal(false)
    } catch (err: any) {
      alert(err?.message || 'Failed to send split bill request.')
    } finally {
      setIsSubmittingSplit(false)
    }
  }

  // Fetch accounts & payees on mount
  useEffect(() => {
    async function fetchAccountsAndPayees() {
      try {
        const [accountsRes, payeesRes] = await Promise.all([
          apiClient<{ ok: boolean; data: Account[] }>('/accounts'),
          apiClient<{ ok: boolean; data: any[] }>('/payees').catch(() => ({
            ok: false,
            data: []
          }))
        ])

        if (accountsRes.ok && accountsRes.data && accountsRes.data.length > 0) {
          setAccounts(accountsRes.data)
          setActiveAccount(accountsRes.data[0])
        }
        if (payeesRes.ok && payeesRes.data) {
          setPayees(payeesRes.data)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoadingAccounts(false)
      }
    }
    fetchAccountsAndPayees()
  }, [])

  // Fetch transactions for the active account
  useEffect(() => {
    if (!activeAccount) return
    const accNum = activeAccount.accountNumber
    async function fetchTransactions() {
      setLoadingTransactions(true)
      try {
        const res = await apiClient<{ ok: boolean; data: Transaction[] }>(
          `/transactions?account=${accNum}`
        )
        if (res.ok && res.data) {
          setTransactions(res.data.slice(0, 5)) // Limit to top 5 recent
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err)
      } finally {
        setLoadingTransactions(false)
      }
    }
    fetchTransactions()
  }, [activeAccount])

  // Cycle to next account on card click
  const handleNextAccount = () => {
    if (accounts.length <= 1 || !activeAccount) return
    const currentIndex = accounts.findIndex(
      (acc) => acc.id === activeAccount.id
    )
    const nextIndex = (currentIndex + 1) % accounts.length
    setActiveAccount(accounts[nextIndex])
  }

  return (
    <main className="dashboard">
      <Sidebar />

      <section className="content">
        {/* Header */}
        <header className="content-header">
          <h1 className="page-title">Dashboard</h1>
          <div className="header-actions">
            <Search size={24} />
            <NotificationCenter />
            <button onClick={logout} className="logout-button">
              LOG OUT
            </button>
            <Link href="/profile">
              <img
                src={user?.avatarUrl || '/person-logo.png'}
                alt="profile"
                className="avatar"
              />
            </Link>
          </div>
        </header>

        {/* Top Section */}
        <div className="top-section">
          {/* Welcome/Balance Card */}
          <div className="welcome-card">
            <h2 className="welcome-title">
              Welcome back, {user?.fullName || 'User'}!
            </h2>

            {loadingAccounts ? (
              <div className="balance-card-loading">Loading accounts...</div>
            ) : activeAccount ? (
              <div
                className="balance-card"
                onClick={handleNextAccount}
                style={{ cursor: 'pointer' }}
              >
                <p className="balance-label">{activeAccount.accountName}</p>
                <p className="balance-amount">
                  Rs.{' '}
                  {Number(activeAccount.balance).toLocaleString('en-US', {
                    minimumFractionDigits: 2
                  })}
                </p>
                <ChevronRight className="balance-chevron" size={30} />
              </div>
            ) : (
              <div className="balance-card-empty">
                No active bank accounts found.
              </div>
            )}

            <div className="carousel-dots">
              {accounts.map((acc, idx) => (
                <span
                  key={acc.id}
                  onClick={() => setActiveAccount(acc)}
                  className={`dot ${activeAccount && activeAccount.id === acc.id ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
            <img
              src="/dashboard-logo.png"
              alt="woman"
              className="welcome-image"
            />
          </div>

          {/* Payees Card */}
          <div className="payees-card">
            <h3 className="payees-title">Saved Payees</h3>
            <div className="payees-list">
              {payees.length > 0 ? (
                payees.slice(0, 3).map((p, idx) => {
                  const parts = p.name.split(' ')
                  const firstName = parts[0] || 'Payee'
                  const lastName = parts.slice(1).join(' ') || ''
                  return (
                    <div key={p.id || idx} className="payee-item">
                      <img
                        src="/person-logo.png"
                        alt="user"
                        className="avatar"
                      />
                      <div className="payee-info">
                        <p>{firstName}</p>
                        <p>{lastName}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <>
                  <div className="payee-item">
                    <img src="/person-logo.png" alt="user" className="avatar" />
                    <div className="payee-info">
                      <p>Dilara</p>
                      <p>Perera</p>
                    </div>
                  </div>
                  <div className="payee-item">
                    <img src="/person-logo.png" alt="user" className="avatar" />
                    <div className="payee-info">
                      <p>Kasun</p>
                      <p>Wickramanayake</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="view-all">
              View all
              <ChevronRight size={15} />
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="transactions-section">
          <h2 className="transactions-title">
            Recent Transactions{' '}
            {activeAccount ? `(${activeAccount.accountNumber})` : ''}
          </h2>
          <div className="transactions-card">
            {loadingTransactions ? (
              <div className="tx-status-msg">Loading transactions...</div>
            ) : transactions.length > 0 ? (
              transactions.map((t) => {
                const isDebit =
                  activeAccount && t.fromAccount === activeAccount.accountNumber
                const prefix = isDebit ? '-' : '+'
                const amountClass = isDebit
                  ? 'transaction-amount debit'
                  : 'transaction-amount credit'
                const dateStr = new Date(t.createdAt).toLocaleDateString(
                  'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }
                )

                return (
                  <div key={t.id} className="transaction-item">
                    <img src="/person-logo.png" alt="user" className="avatar" />
                    <span className="transaction-date">{dateStr}</span>
                    <span className="transaction-account">
                      {isDebit
                        ? `To: ${t.toAccount}`
                        : `From: ${t.fromAccount}`}
                    </span>
                    <span className={amountClass}>
                      {prefix}Rs.{' '}
                      {Number(t.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2
                      })}
                    </span>
                    <span className="transaction-status">{t.status}</span>
                    {isDebit && (
                      <button
                        onClick={() => handleOpenSplitModal(t)}
                        className="split-btn"
                      >
                        Split 👥
                      </button>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="tx-status-msg">
                No transactions found for this account.
              </div>
            )}
          </div>
        </div>
      </section>

      {showSplitModal && selectedTx && (
        <div className="modal-overlay" onClick={() => setShowSplitModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Split Bill with a Friend</h3>
            <div className="modal-tx-info">
              <p>
                <strong>Transaction:</strong>{' '}
                {selectedTx.description || 'Transfer'}
              </p>
              <p>
                <strong>Total Amount:</strong> Rs.{' '}
                {Number(selectedTx.amount).toLocaleString('en-US', {
                  minimumFractionDigits: 2
                })}
              </p>
            </div>

            <form onSubmit={handleSendSplitRequest} className="modal-form">
              <div className="modal-input-group">
                <label className="modal-label">Friend's Username</label>
                <input
                  type="text"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  placeholder="Enter username (e.g. kasun)"
                  className="modal-input"
                  required
                />
              </div>

              <div className="modal-input-group">
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <label className="modal-label">Split Amount (Rs.)</label>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    Max: Rs. {Number(selectedTx.amount).toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(selectedTx.amount)}
                  value={splitAmount}
                  onChange={(e) => setSplitAmount(e.target.value)}
                  className="modal-input"
                  required
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-label">Description</label>
                <input
                  type="text"
                  value={splitDescription}
                  onChange={(e) => setSplitDescription(e.target.value)}
                  placeholder="e.g. Dinner split"
                  className="modal-input"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="modal-btn-cancel"
                  disabled={isSubmittingSplit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn-submit"
                  disabled={isSubmittingSplit}
                >
                  {isSubmittingSplit ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard {
          width: 100vw;
          min-height: 100vh;
          background: #0b0713;
          background: radial-gradient(circle at 50% 0%, #1a0b2e 0%, #07030f 80%);
          display: flex;
          gap: 1.5rem;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
        }

        .content {
          flex: 1;
          padding: 1.5rem 1.25rem;
          overflow-y: auto;
          min-width: 0;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 1rem;
        }

        .page-title {
          font-size: 28px;
          font-weight: 800;
          color: white;
          background: linear-gradient(135deg, #ffffff 0%, #d8b4fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .logout-button {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          padding: 8px 18px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.5px;
        }

        .logout-button:hover {
          background: rgba(255, 0, 127, 0.15);
          border-color: rgba(255, 0, 127, 0.3);
          box-shadow: 0 0 15px rgba(255, 0, 127, 0.2);
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(157, 78, 221, 0.3);
          transition: border-color 0.2s;
        }
        .avatar:hover {
          border-color: var(--primary);
        }

        .top-section {
          margin-top: 1.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .welcome-card {
          width: 640px;
          max-width: 100%;
          height: 230px;
          background: linear-gradient(135deg, rgba(157, 78, 221, 0.12) 0%, rgba(181, 23, 158, 0.04) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }

        .welcome-title {
          font-size: 20px;
          font-weight: 800;
          padding: 1.25rem 1.5rem 0;
          color: white;
        }

        .balance-card {
          position: absolute;
          left: 1.5rem;
          top: 65px;
          width: 380px;
          max-width: calc(100% - 3rem);
          height: 120px;
          background: linear-gradient(135deg, #180f2d 0%, #0d081c 100%);
          border: 1px solid rgba(157, 78, 221, 0.2);
          border-radius: 16px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 0 1.5rem;
          user-select: none;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
          transition: all 0.3s;
        }
        .balance-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
          box-shadow: 0 15px 30px rgba(157, 78, 221, 0.25);
        }

        .balance-card-loading,
        .balance-card-empty {
          position: absolute;
          left: 1.5rem;
          top: 65px;
          width: 380px;
          max-width: calc(100% - 3rem);
          height: 120px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 600;
        }

        .balance-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .balance-amount {
          color: #00f0ff;
          font-size: 24px;
          font-weight: 800;
          margin-top: 0.25rem;
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
        }

        .balance-chevron {
          position: absolute;
          right: 1.5rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .carousel-dots {
          position: absolute;
          bottom: 1.25rem;
          left: 1.5rem;
          display: flex;
          gap: 0.5rem;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transition: all 0.3s;
        }
        .dot.active {
          width: 24px;
          border-radius: 3px;
          background: var(--primary);
          box-shadow: 0 0 8px rgba(157, 78, 221, 0.5);
        }

        .welcome-image {
          position: absolute;
          right: 0;
          bottom: 0;
          height: 230px;
          opacity: 0.85;
          pointer-events: none;
        }

        .payees-card {
          width: 270px;
          height: 230px;
          background: rgba(18, 11, 32, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
          padding: 1.25rem;
          color: white;
          flex: 1;
          min-width: 240px;
        }

        .payees-title {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 1rem;
          letter-spacing: 0.5px;
        }

        .payees-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .payee-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .payee-info {
          font-size: 13px;
          line-height: 1.4;
        }
        .payee-info p:first-child {
          font-weight: 600;
          color: white;
        }
        .payee-info p:last-child {
          color: rgba(255, 255, 255, 0.45);
        }

        .view-all {
          text-align: right;
          margin-top: 1.25rem;
          font-size: 13px;
          color: var(--sidebar-accent);
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.2s;
        }
        .view-all:hover {
          color: white;
        }

        .transactions-section {
          margin-top: 2rem;
          color: white;
        }

        .transactions-title {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: 0.5px;
        }

        .transactions-card {
          background: rgba(18, 11, 32, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
          padding: 1.5rem;
          width: 100%;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.2s;
        }
        .transaction-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .transaction-item:hover {
          background: rgba(255, 255, 255, 0.01);
          transform: scale(1.002);
        }

        .transaction-date {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .transaction-account {
          font-size: 0.95rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
        }

        .transaction-amount {
          font-size: 1rem;
          font-weight: 700;
        }

        .transaction-amount.debit {
          color: var(--debit);
        }

        .transaction-amount.credit {
          color: var(--credit);
        }

        .transaction-status {
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid rgba(0, 240, 255, 0.25);
          padding: 4px 14px;
          border-radius: 6px;
          color: #00f0ff;
          font-size: 0.8rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .tx-status-msg {
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
          text-align: center;
          padding: 2rem 0;
        }

        .split-btn {
          background: rgba(157, 78, 221, 0.15);
          border: 1px solid rgba(157, 78, 221, 0.3);
          color: #e0aaff;
          padding: 5px 14px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s;
        }
        .split-btn:hover {
          background: var(--primary);
          color: white;
          box-shadow: 0 0 12px rgba(157, 78, 221, 0.4);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(5, 2, 10, 0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .modal-card {
          background: rgba(20, 14, 38, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          width: 440px;
          max-width: 90%;
          padding: 2rem;
          color: white;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .modal-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: white;
          margin: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.75rem;
          background: linear-gradient(135deg, #ffffff 0%, #d8b4fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .modal-tx-info {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          border-left: 4px solid var(--primary);
        }

        .modal-tx-info p {
          margin: 0.25rem 0;
        }
        
        .modal-tx-info p strong {
          color: rgba(255, 255, 255, 0.5);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .modal-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .modal-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.5px;
        }

        .modal-input {
          padding: 10px 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          font-size: 0.95rem;
          outline: none;
          color: white;
          transition: all 0.3s;
        }
        .modal-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(157, 78, 221, 0.2);
          background: rgba(255, 255, 255, 0.05);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .modal-btn-cancel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
          padding: 0.65rem 1.25rem;
          font-weight: 700;
          font-size: 0.85rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .modal-btn-submit {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white;
          border: none;
          padding: 0.65rem 1.25rem;
          font-weight: 700;
          font-size: 0.85rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 5px 15px rgba(157, 78, 221, 0.3);
        }
        .modal-btn-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(157, 78, 221, 0.45);
        }

        @media (max-width: 1024px) {
          .welcome-card {
            width: 100%;
          }
          .transactions-card {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            flex-direction: column;
            gap: 0;
          }

          .content {
            padding: 1rem;
          }

          .page-title {
            font-size: 22px;
          }

          .top-section {
            flex-direction: column;
            align-items: stretch;
          }

          .welcome-card {
            height: 220px;
          }
          .balance-card {
            width: calc(100% - 2rem);
            left: 1rem;
            top: 50px;
            height: 100px;
          }
          .balance-label {
            font-size: 12px;
          }
          .balance-amount {
            font-size: 20px;
          }
          .welcome-image {
            height: 160px;
          }
          .carousel-dots {
            left: 1rem;
            bottom: 0.75rem;
          }

          .payees-card {
            width: 100%;
            height: auto;
            min-height: 200px;
          }

          .transactions-card {
            padding: 1rem;
          }

          .transaction-item {
            flex-wrap: wrap;
            gap: 0.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            padding-bottom: 0.75rem;
          }
          .transaction-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .transaction-status {
            padding: 0.15rem 1rem;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .header-actions {
            gap: 0.75rem;
          }
          .avatar {
            width: 35px;
            height: 35px;
          }
          .page-title {
            font-size: 20px;
          }
          .balance-label {
            font-size: 12px;
          }
          .balance-amount {
            font-size: 18px;
          }
          .welcome-card {
            height: 200px;
          }
          .welcome-image {
            height: 130px;
          }
          .transaction-date,
          .transaction-account,
          .transaction-amount {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </main>
  )
}
