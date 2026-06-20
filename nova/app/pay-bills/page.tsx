'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import NotificationCenter from '@/components/notification-center'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Search,
  Settings
} from '../../components/Icons'
import Sidebar from '../../components/sidebar'

type Biller = {
  id: string
  name: string
  logo: string
}

const billers: Biller[] = [
  { id: 'water', name: 'Water Board', logo: '/billers/water-board.png' },
  { id: 'cable', name: 'Cable TV', logo: '/billers/cable-tv.png' },
  { id: 'ceb', name: 'CEB', logo: '/billers/ceb.png' },
  { id: 'airtel', name: 'Airtel', logo: '/billers/airtel.png' },
  { id: 'dialog', name: 'Dialog', logo: '/billers/dialog.png' },
  { id: 'slt', name: 'Sri Lanka Telecom', logo: '/billers/electricity.png' },
  { id: 'peotv', name: 'PEO TV', logo: '/billers/mpesa.png' },
  { id: 'hutch', name: 'Hutch', logo: '/billers/hutch.png' },
  { id: 'aia', name: 'AIA', logo: '/billers/aia.png' },
  { id: 'lolc', name: 'LOLC', logo: '/billers/lolc.png' },
  { id: 'insurance2', name: 'Insurance', logo: '/billers/insurance2.png' },
  { id: 'hsbc', name: 'HSBC', logo: '/billers/hsbc.png' }
]

type Screen = 'select' | 'form' | 'success' | 'failed'

interface Account {
  id: number
  userId: number
  accountNumber: string
  accountName: string
  balance: number
}

type FormErrors = {
  fromAccount?: string
  accountNumber?: string
  billId?: string
  dueAmount?: string
}

export default function PayBillsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedFromAccount, setSelectedFromAccount] =
    useState<Account | null>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const [screen, setScreen] = useState<Screen>('select')
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)
  const [accountNumber, setAccountNumber] = useState('') // Biller Account Number
  const [billId, setBillId] = useState('')
  const [dueAmount, setDueAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [failReason, setFailReason] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  // Virtual card options
  const [cards, setCards] = useState<any[]>([])
  const [useCard, setUseCard] = useState(false)
  const [selectedCard, setSelectedCard] = useState<any | null>(null)

  // Fetch accounts & cards on mount
  useEffect(() => {
    async function fetchAccountsAndCards() {
      try {
        const [accRes, cardsRes] = await Promise.all([
          apiClient<{ ok: boolean; data: Account[] }>('/accounts'),
          apiClient<{ ok: boolean; data: any[] }>('/virtual-cards').catch(
            () => ({ ok: false, data: [] })
          )
        ])
        if (accRes.ok && accRes.data && accRes.data.length > 0) {
          setAccounts(accRes.data)
          setSelectedFromAccount(accRes.data[0])
        }
        if (cardsRes.ok && cardsRes.data) {
          setCards(cardsRes.data)
          if (cardsRes.data.length > 0) {
            setSelectedCard(cardsRes.data[0])
          }
        }
      } catch (err) {
        console.error('Failed to load accounts/cards:', err)
      } finally {
        setLoadingAccounts(false)
      }
    }
    fetchAccountsAndCards()
  }, [])

  function handleSelectBiller(biller: Biller) {
    setSelectedBiller(biller)
    setErrors({})
    setScreen('form')
  }

  function validateForm(): boolean {
    const newErrors: FormErrors = {}

    if (!useCard && !selectedFromAccount) {
      newErrors.fromAccount = 'Source account is required'
    }
    if (useCard && !selectedCard) {
      newErrors.fromAccount = 'Select a virtual card'
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Biller account number is required'
    } else if (!/^[0-9]{6,16}$/.test(accountNumber.trim())) {
      newErrors.accountNumber = 'Enter a valid account number (6–16 digits)'
    }

    if (!billId.trim()) {
      newErrors.billId = 'Bill ID is required'
    } else if (billId.trim().length < 3) {
      newErrors.billId = 'Bill ID looks too short'
    }

    if (!dueAmount.trim()) {
      newErrors.dueAmount = 'Due amount is required'
    } else {
      const amount = Number(dueAmount)
      if (Number.isNaN(amount) || amount <= 0) {
        newErrors.dueAmount = 'Enter a valid amount greater than 0'
      } else if (
        !useCard &&
        selectedFromAccount &&
        amount > Number(selectedFromAccount.balance)
      ) {
        newErrors.dueAmount = 'Amount exceeds available balance'
      } else if (useCard && selectedCard) {
        const linkedAcc = accounts.find((a) => a.id === selectedCard.accountId)
        if (linkedAcc && amount > Number(linkedAcc.balance)) {
          newErrors.dueAmount = 'Amount exceeds linked account balance'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handlePayNow() {
    if (
      !validateForm() ||
      (!useCard && !selectedFromAccount) ||
      (useCard && !selectedCard) ||
      !selectedBiller
    ) {
      return
    }

    setLoading(true)
    setFailReason('')
    try {
      const payload: any = {
        toAccount: '9999999999', // Seeded Admin Vault
        amount: Number(dueAmount),
        description: `Bill Payment: ${selectedBiller.name} - Ref: ${billId} (${remarks || 'No remarks'})`
      }

      if (useCard) {
        payload.cardId = selectedCard.id
      } else {
        payload.fromAccount = selectedFromAccount?.accountNumber
      }

      // Execute the bill payment as a transfer to Admin Vault
      const res = await apiClient<{
        ok: boolean
        message: string
        transaction: any
      }>('/transfer', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setConfirmationNumber(
          String(
            res.transaction?.id ||
              Math.floor(10000000 + Math.random() * 90000000)
          )
        )
        setScreen('success')
      }
    } catch (err: any) {
      setFailReason(
        err?.message || 'Bill payment failed. Please check details.'
      )
      setScreen('failed')
    } finally {
      setLoading(false)
    }
  }

  function resetToHome() {
    setScreen('select')
    setSelectedBiller(null)
    setAccountNumber('')
    setBillId('')
    setDueAmount('')
    setRemarks('')
    setErrors({})
    // Reload accounts
    apiClient<{ ok: boolean; data: Account[] }>('/accounts').then((res) => {
      if (res.ok && res.data) {
        setAccounts(res.data)
        setSelectedFromAccount(res.data[0])
      }
    })
  }

  return (
    <div className="page">
      <Sidebar />

      <div className="content">
        <header className="topbar">
          <h1>Pay Bills</h1>
          <div className="topbar-icons">
            <Search size={20} />
            <NotificationCenter />
            <Link href="/profile" className="avatar">
              <img
                src={user?.avatarUrl || '/person-logo.png'}
                alt="Profile"
                width={36}
                height={36}
                style={{
                  objectFit: 'cover',
                  borderRadius: '50%',
                  background: 'white'
                }}
              />
            </Link>
          </div>
        </header>

        <main className="main">
          <div className="card-wrapper">
            {screen === 'select' && (
              <div className="card">
                <div className="biller-grid">
                  {billers.map((biller) => (
                    <button
                      key={biller.id}
                      onClick={() => handleSelectBiller(biller)}
                      className="biller-btn"
                    >
                      <div className="biller-icon logo-circle">
                        <Image
                          src={biller.logo}
                          alt={biller.name}
                          width={44}
                          height={44}
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <span className="biller-name">{biller.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {screen === 'form' && selectedBiller && (
              <div className="card">
                <button
                  className="back-btn"
                  onClick={() => setScreen('select')}
                >
                  <ChevronLeft size={16} />
                  Back to billers
                </button>
                <div className="biller-header">
                  <div className="biller-icon small logo-circle">
                    <Image
                      src={selectedBiller.logo}
                      alt={selectedBiller.name}
                      width={28}
                      height={28}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <span className="biller-header-name">
                    {selectedBiller.name}
                  </span>
                </div>{' '}
                {/* Pay using Card Checkbox */}
                {cards.length > 0 && (
                  <div
                    className="field"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      id="pay-using-card-checkbox"
                      checked={useCard}
                      onChange={(e) => setUseCard(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        margin: 0
                      }}
                    />
                    <label
                      htmlFor="pay-using-card-checkbox"
                      style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.7)',
                        fontWeight: 600
                      }}
                    >
                      Pay using Virtual Card
                    </label>
                  </div>
                )}
                {/* From Account / Card */}
                <div className="field">
                  <label>{useCard ? 'Select Card' : 'Pay From Account'}</label>
                  {useCard ? (
                    <select
                      value={selectedCard?.id || ''}
                      onChange={(e) => {
                        const selected = cards.find(
                          (c) => c.id === Number(e.target.value)
                        )
                        setSelectedCard(selected || null)
                      }}
                      className="underline-select"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '0.85rem 1.1rem',
                        fontSize: '0.95rem',
                        color: '#f3f0f7',
                        outline: 'none'
                      }}
                    >
                      {cards.map((c) => {
                        const linkedAcc = accounts.find(
                          (a) => a.id === c.accountId
                        )
                        const balanceStr = linkedAcc
                          ? ` - Balance: Rs. ${Number(linkedAcc.balance).toLocaleString()}`
                          : ''
                        const limitStr = `(Limit: Rs. ${Number(c.dailyLimit).toLocaleString()})`
                        const isFrozenStr = c.isFrozen ? ' [FROZEN]' : ''
                        return (
                          <option key={c.id} value={c.id} disabled={c.isFrozen}>
                            {c.cardType.toUpperCase()} *{c.cardNumber.slice(-4)}
                            {isFrozenStr} {limitStr}
                            {balanceStr}
                          </option>
                        )
                      })}
                    </select>
                  ) : loadingAccounts ? (
                    <div className="text-sm text-gray-500">
                      Loading accounts...
                    </div>
                  ) : accounts.length > 0 ? (
                    <select
                      value={selectedFromAccount?.accountNumber || ''}
                      onChange={(e) => {
                        const selected = accounts.find(
                          (acc) => acc.accountNumber === e.target.value
                        )
                        setSelectedFromAccount(selected || null)
                      }}
                      className="underline-select"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '0.85rem 1.1rem',
                        fontSize: '0.95rem',
                        color: '#f3f0f7',
                        outline: 'none'
                      }}
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.accountNumber}>
                          {acc.accountName} ({acc.accountNumber}) - Rs.{' '}
                          {Number(acc.balance).toLocaleString('en-US', {
                            minimumFractionDigits: 2
                          })}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-red-600">
                      No bank accounts available.
                    </div>
                  )}
                  {errors.fromAccount && (
                    <span className="error-text">{errors.fromAccount}</span>
                  )}
                </div>
                {/* Biller Account Number */}
                <div className="field">
                  <label>Biller Account number</label>
                  <input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter biller account number"
                    className={errors.accountNumber ? 'input-error' : ''}
                  />
                  {errors.accountNumber && (
                    <span className="error-text">{errors.accountNumber}</span>
                  )}
                </div>
                {/* Bill ID */}
                <div className="field">
                  <label>Bill ID</label>
                  <input
                    value={billId}
                    onChange={(e) => setBillId(e.target.value)}
                    placeholder="Enter bill ID"
                    className={errors.billId ? 'input-error' : ''}
                  />
                  {errors.billId && (
                    <span className="error-text">{errors.billId}</span>
                  )}
                </div>
                {/* Due Amount */}
                <div className="field">
                  <label>Due Amount</label>
                  <input
                    type="number"
                    value={dueAmount}
                    onChange={(e) => setDueAmount(e.target.value)}
                    placeholder="0.00"
                    className={errors.dueAmount ? 'input-error' : ''}
                  />
                  {errors.dueAmount && (
                    <span className="error-text">{errors.dueAmount}</span>
                  )}
                </div>
                {/* Remarks */}
                <div className="field">
                  <label>Remarks</label>
                  <input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <button
                  className="pay-now-btn"
                  onClick={handlePayNow}
                  disabled={loading}
                >
                  {loading ? 'PROCESSING...' : 'PAY NOW'}
                </button>
              </div>
            )}

            {screen === 'success' && (
              <div className="card status-card">
                <div className="status-circle success">
                  <CheckCircle2 size={64} />
                </div>
                <h2>Payment Successful!</h2>
                <p className="status-sub">
                  Confirmation number : {confirmationNumber}
                </p>
                <button className="back-home-btn" onClick={resetToHome}>
                  <ChevronLeft size={16} />
                  BACK TO HOME
                </button>
              </div>
            )}

            {screen === 'failed' && (
              <div className="card status-card">
                <div className="status-circle failed">
                  <AlertTriangle size={64} />
                </div>
                <h2>Payment Failed!</h2>
                <p className="status-sub">{failReason}</p>
                <button className="back-home-btn" onClick={resetToHome}>
                  <ChevronLeft size={16} />
                  BACK TO HOME
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .page {
          display: flex;
          min-height: 100vh;
          background: var(--background);
        }
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--glass-bg);
          padding: 1.1rem 2.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(16px);
        }
        .topbar h1 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--foreground);
        }
        .topbar-icons {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          color: rgba(255,255,255,0.6);
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .main {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 3rem;
        }
        .card-wrapper {
          width: 100%;
          max-width: 760px;
        }
        .card {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 3rem;
        }
        .biller-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2.5rem 2rem;
        }
        .biller-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
          background: none;
          border: none;
          cursor: pointer;
        }
        .biller-icon {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .biller-icon.small {
          width: 48px;
          height: 48px;
        }
        .logo-circle {
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(255,255,255,0.15);
        }
        .biller-btn:hover .biller-icon {
          transform: scale(1.07);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
        }
        .biller-name {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.7);
          text-align: center;
          line-height: 1.25;
          font-weight: 500;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          font-size: 0.9rem;
          cursor: pointer;
          margin-bottom: 1.75rem;
          padding: 0;
        }
        .back-btn:hover {
          color: rgba(255,255,255,0.8);
        }
        .biller-header {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 2.25rem;
        }
        .biller-header-name {
          font-weight: 600;
          font-size: 1.05rem;
          color: var(--foreground);
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1.4rem;
        }
        .field label {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
          font-weight: 500;
        }
        .field input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.85rem 1.1rem;
          font-size: 0.95rem;
          color: var(--foreground);
          outline: none;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .field input:focus {
          box-shadow: 0 0 0 2px rgba(157, 78, 221, 0.3);
          border-color: var(--primary);
        }
        .field input.input-error {
          border-color: #f87171;
          background: rgba(248, 113, 113, 0.08);
        }
        .error-text {
          font-size: 0.78rem;
          color: #ef4444;
          margin-top: 0.15rem;
        }
        .pay-now-btn {
          margin-top: 1.75rem;
          width: 100%;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white;
          font-weight: 700;
          font-size: 1rem;
          padding: 1rem;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 20px rgba(157, 78, 221, 0.3);
        }
        .pay-now-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(157, 78, 221, 0.45);
        }
        .status-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4rem 3rem;
        }
        .status-circle {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.75rem;
        }
        .status-circle.success {
          background: rgba(0, 240, 255, 0.1);
          color: var(--success);
        }
        .status-circle.failed {
          background: rgba(248, 113, 113, 0.1);
          color: #f87171;
        }
        .status-card h2 {
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--foreground);
          margin-bottom: 0.6rem;
        }
        .status-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 2.25rem;
          white-space: pre-line;
        }
        .back-home-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.85rem 2.25rem;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 20px rgba(157, 78, 221, 0.3);
        }
        .back-home-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(157, 78, 221, 0.45);
        }
      `}</style>
    </div>
  )
}
