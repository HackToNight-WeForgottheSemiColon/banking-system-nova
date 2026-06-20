'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import NotificationCenter from '@/components/notification-center'
import Sidebar from '@/components/sidebar'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

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

interface StatementRow extends Transaction {
  runningBalance: number
  isDebit: boolean // is outflow
}

export default function EStatementPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<StatementRow[]>([])
  const [summary, setSummary] = useState({
    openingBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
    closingBalance: 0
  })
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  // Fetch accounts on mount
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await apiClient<{ ok: boolean; data: Account[] }>(
          '/accounts'
        )
        if (res.ok && res.data && res.data.length > 0) {
          setAccounts(res.data)
          setSelectedAccount(res.data[0])
        }
      } catch (err) {
        console.error('Failed to load accounts:', err)
      } finally {
        setLoadingAccounts(false)
      }
    }
    fetchAccounts()
  }, [])

  // Fetch transactions and calculate summary on account change
  useEffect(() => {
    if (!selectedAccount) return
    const accNum = selectedAccount.accountNumber
    const bal = Number(selectedAccount.balance)

    async function fetchStatement() {
      setLoadingTransactions(true)
      try {
        const res = await apiClient<{ ok: boolean; data: Transaction[] }>(
          `/transactions?account=${accNum}`
        )

        if (res.ok && res.data) {
          const rawTx = [...res.data].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )

          let totalCredits = 0
          let totalDebits = 0
          const closingBalance = bal

          // Calculate running balance and totals
          // First, calculate opening balance

          // closingBalance = openingBalance + totalCredits - totalDebits
          // => openingBalance = closingBalance - totalCredits + totalDebits
          rawTx.forEach((tx) => {
            const amount = Number(tx.amount)
            if (tx.toAccount === accNum) {
              totalCredits += amount
            } else {
              totalDebits += amount
            }
          })

          const openingBalance = closingBalance - totalCredits + totalDebits

          let currentRunning = openingBalance
          const rowsWithRunningBalance: StatementRow[] = rawTx.map((tx) => {
            const amount = Number(tx.amount)
            const isOutflow = tx.fromAccount === accNum
            if (isOutflow) {
              currentRunning -= amount
            } else {
              currentRunning += amount
            }
            return {
              ...tx,
              runningBalance: currentRunning,
              isDebit: isOutflow
            }
          })

          // Reverse to show newest transactions first in the table
          setTransactions(rowsWithRunningBalance.reverse())
          setSummary({
            openingBalance,
            totalCredits,
            totalDebits,
            closingBalance
          })
        }
      } catch (err) {
        console.error('Failed to fetch statement transactions:', err)
      } finally {
        setLoadingTransactions(false)
      }
    }

    fetchStatement()
  }, [selectedAccount])

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = accounts.find(
      (acc) => acc.accountNumber === e.target.value
    )
    setSelectedAccount(selected || null)
  }

  // Format date range for statement
  const getStatementPeriod = () => {
    if (transactions.length === 0) return 'N/A'
    const dates = transactions.map((t) => new Date(t.createdAt).getTime())
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))
    return `${minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  const handleDownloadPdf = async () => {
    if (!selectedAccount) return
    try {
      const token = localStorage.getItem('session_token')
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await fetch(
        `${apiBase}/statements/pdf?account=${selectedAccount.accountNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      if (!res.ok) throw new Error('Failed to download statement')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `statement-${selectedAccount.accountNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading statement:', err)
      alert('Failed to download statement PDF.')
    }
  }

  return (
    <main className="dashboard">
      <Sidebar />

      <section className="content">
        <header className="content-header">
          <h1 className="page-title">E-Statement</h1>
          <div className="header-actions">
            <button className="topbar-icon" aria-label="search" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <img src="/search.png" alt="search" style={{ width: '24px', height: '24px', opacity: 0.6 }} />
            </button>
            <NotificationCenter />
            <Link href="/profile">
              <img
                src={user?.avatarUrl || '/person-logo.png'}
                alt="profile"
                className="avatar"
              />
            </Link>
          </div>
        </header>

        <div className="glass-panel" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="account-selector-row">
            <label htmlFor="statement-account-select" className="selector-label">
              Select Bank Account:
            </label>
            {loadingAccounts ? (
              <div className="loading-text">Loading accounts...</div>
            ) : accounts.length > 0 ? (
              <select
                id="statement-account-select"
                value={selectedAccount?.accountNumber || ''}
                onChange={handleAccountChange}
                className="account-select"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.accountNumber}>
                    {acc.accountName} ({acc.accountNumber})
                  </option>
                ))}
              </select>
            ) : (
              <div className="error-text">
                No bank accounts registered.
              </div>
            )}
          </div>
        </div>

        <section aria-label="Bank statement preview" className="glass-panel statement-preview">
          <div className="max-w-full">
            <div className="statement-header">
              <img
                src="/loginlogo.png"
                alt="Nova Bank"
                className="bank-logo"
              />
              <button onClick={handleDownloadPdf} className="btn-download">
                Download PDF
              </button>
            </div>

            <div className="statement-info">
              <h2 className="info-title">Bank Statement</h2>
              <dl className="info-grid">
                <dt>Account Holder:</dt>
                <dd>{user?.fullName || 'N/A'}</dd>

                <dt>Account Number:</dt>
                <dd>{selectedAccount?.accountNumber || 'N/A'}</dd>

                <dt>Statement Period:</dt>
                <dd>{getStatementPeriod()}</dd>

                <dt>Branch:</dt>
                <dd>Colombo Head Office</dd>
              </dl>
            </div>

            <div className="statement-summary">
              <h3 className="section-title">Account Summary</h3>
              <div className="table-responsive">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Opening Balance</th>
                      <th>Total Credits</th>
                      <th>Total Debits</th>
                      <th>Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        Rs.{' '}
                        {Number(summary.openingBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="credit">+Rs.{' '}
                        {Number(summary.totalCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="debit">-Rs.{' '}
                        {Number(summary.totalDebits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="closing">
                        Rs.{' '}
                        {Number(summary.closingBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="statement-details">
              <h3 className="section-title">Transaction Details</h3>

              <div className="table-responsive">
                <table className="details-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Date</th>
                      <th style={{ width: '25%' }}>Description</th>
                      <th style={{ width: '15%' }}>Reference ID</th>
                      <th style={{ width: '15%' }}>Debit(+)</th>
                      <th style={{ width: '15%' }}>Credit(-)</th>
                      <th style={{ width: '15%' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTransactions ? (
                      <tr>
                        <td colSpan={6} className="text-center loading-text py-6">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : transactions.length > 0 ? (
                      transactions.map((t) => {
                        const dateStr = new Date(t.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                        return (
                          <tr key={t.id}>
                            <td className="text-muted">{dateStr}</td>
                            <td className="font-medium">{t.description || 'Transfer'}</td>
                            <td className="text-muted">{t.id}</td>
                            <td className="credit">
                              {!t.isDebit
                                ? `+Rs. ${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                : '-'}
                            </td>
                            <td className="debit">
                              {t.isDebit
                                ? `-Rs. ${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                : '-'}
                            </td>
                            <td className="font-bold border-l-light">
                              Rs.{' '}
                              {Number(t.runningBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-6">
                          No transaction history.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </section>

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
          color: white;
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

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(157, 78, 221, 0.3);
          transition: border-color 0.2s;
        }
        .avatar:hover {
          border-color: #9d4edd;
        }

        .glass-panel {
          background: rgba(18, 11, 32, 0.65);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
          padding: 2rem;
        }

        .account-selector-row {
          display: grid;
          align-items: center;
          gap: 1.5rem;
          font-size: 1.1rem;
          grid-template-columns: auto 1fr;
        }

        .selector-label {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }

        .account-select {
          min-width: 0;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          background: transparent;
          padding: 0.25rem 0.5rem;
          font-size: 1.1rem;
          color: white;
          outline: none;
        }
        .account-select option {
          background: #120b20;
          color: white;
        }

        .statement-preview {
          min-height: 560px;
        }

        .statement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .bank-logo {
          width: 86px;
          height: 86px;
          border-radius: 50%;
          object-fit: cover;
          background: white;
          border: 2px solid rgba(157, 78, 221, 0.3);
        }

        .btn-download {
          background: linear-gradient(135deg, #9d4edd 0%, #b5179e 100%);
          color: white;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          border: none;
          box-shadow: 0 5px 15px rgba(157, 78, 221, 0.3);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-download:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(157, 78, 221, 0.45);
        }
        .btn-download:active {
          transform: scale(0.98);
        }

        .statement-info {
          margin-top: 1.25rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }
        .info-title {
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
          color: white;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 0.5rem;
        }
        .info-grid dt {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
        }

        .section-title {
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: white;
        }

        .statement-summary {
          margin-top: 2rem;
        }

        .table-responsive {
          overflow-x: auto;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          padding: 1rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.9rem;
        }

        td {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          font-size: 0.9rem;
        }
        tr:last-child td {
          border-bottom: none;
        }

        .credit { color: #00f0ff; font-weight: 600; }
        .debit { color: #ff007f; font-weight: 600; }
        .closing { font-weight: 700; color: white; }
        .text-muted { color: rgba(255, 255, 255, 0.5); }
        .font-medium { font-weight: 500; }
        .font-bold { font-weight: 700; }

        .statement-details {
          margin-top: 2.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 2rem;
        }

        .details-table th, .details-table td {
          padding: 0.75rem 1rem;
        }
        .details-table tbody tr {
          transition: background 0.2s;
        }
        .details-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .border-l-light {
          border-left: 1px solid rgba(255, 255, 255, 0.05);
        }

        .text-center { text-align: center; }
        .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
      `}</style>
    </main>
  )
}