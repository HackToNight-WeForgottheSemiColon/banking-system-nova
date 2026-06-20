'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
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

type Errors = Partial<{
  amount: string
  accountNumber: string
  accountName: string
  bank: string
  fromAccount: string
}>

export default function Home() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedFromAccount, setSelectedFromAccount] =
    useState<Account | null>(null)
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [bank, setBank] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [step, setStep] = useState<'form' | 'confirm' | 'success' | 'failure'>(
    'form'
  )
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [savedPayees, setSavedPayees] = useState<any[]>([])
  const [savePayeeChecked, setSavePayeeChecked] = useState(false)

  const [transferType, setTransferType] = useState<'instant' | 'scheduled'>(
    'instant'
  )
  const [frequency, setFrequency] = useState('monthly')

  // Virtual card options
  const [cards, setCards] = useState<any[]>([])
  const [useCard, setUseCard] = useState(false)
  const [selectedCard, setSelectedCard] = useState<any | null>(null)

  // Pending split request options
  const [pendingSplits, setPendingSplits] = useState<any[]>([])
  const [loadingSplits, setLoadingSplits] = useState(false)
  const [splitToApprove, setSplitToApprove] = useState<any | null>(null)
  const [approveFromAccount, setApproveFromAccount] = useState('')

  const fetchPendingSplits = async () => {
    setLoadingSplits(true)
    try {
      const res = await apiClient<{ ok: boolean; data: any[] }>(
        '/bill-splits/pending'
      )
      if (res.ok && res.data) {
        setPendingSplits(res.data)
      }
    } catch (err) {
      console.error('Failed to load pending splits:', err)
    } finally {
      setLoadingSplits(false)
    }
  }

  const handleDeclineSplit = async (id: number) => {
    if (!confirm('Are you sure you want to decline this bill split request?'))
      return
    try {
      const res = await apiClient<{ ok: boolean }>(
        '/bill-splits/' + id + '/decline',
        { method: 'POST' }
      )
      if (res.ok) {
        alert('Split request declined.')
        fetchPendingSplits()
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to decline split request.')
    }
  }

  const handleOpenApproveSplit = (split: any) => {
    setSplitToApprove(split)
    if (accounts.length > 0) {
      setApproveFromAccount(accounts[0].accountNumber)
    }
  }

  const handleConfirmApproveSplit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!splitToApprove) return
    try {
      const res = await apiClient<{ ok: boolean }>(
        '/bill-splits/' + splitToApprove.id + '/approve',
        {
          method: 'POST',
          body: JSON.stringify({ fromAccount: approveFromAccount })
        }
      )
      if (res.ok) {
        alert('Split request approved and paid!')
        setSplitToApprove(null)
        fetchPendingSplits()
        // Reload accounts to update balances
        const accRes = await apiClient<{ ok: boolean; data: Account[] }>(
          '/accounts'
        )
        if (accRes.ok && accRes.data) {
          setAccounts(accRes.data)
          if (accRes.data.length > 0) {
            const currentSelected = accRes.data.find(
              (a) =>
                selectedFromAccount &&
                a.accountNumber === selectedFromAccount.accountNumber
            )
            setSelectedFromAccount(currentSelected || accRes.data[0])
          }
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to approve split request.')
    }
  }
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().substring(0, 10) // YYYY-MM-DD
  })
  const [scheduledTransfers, setScheduledTransfers] = useState<any[]>([])
  const [loadingScheduled, setLoadingScheduled] = useState(false)

  const fetchScheduledTransfers = async () => {
    setLoadingScheduled(true)
    try {
      const res = await apiClient<{ ok: boolean; data: any[] }>(
        '/scheduled-transfers'
      )
      if (res.ok && res.data) {
        setScheduledTransfers(res.data)
      }
    } catch (err) {
      console.error('Failed to load scheduled transfers:', err)
    } finally {
      setLoadingScheduled(false)
    }
  }

  const handleCancelScheduled = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this scheduled payment?'))
      return
    try {
      const res = await apiClient<{ ok: boolean; message: string }>(
        `/scheduled-transfers/${id}`,
        {
          method: 'DELETE'
        }
      )
      if (res.ok) {
        fetchScheduledTransfers()
      }
    } catch (err) {
      console.error('Failed to cancel scheduled transfer:', err)
      alert('Failed to cancel scheduled payment.')
    }
  }

  // Fetch accounts & saved payees on mount
  useEffect(() => {
    async function fetchAccountsAndPayees() {
      try {
        const [accRes, payeesRes, cardsRes] = await Promise.all([
          apiClient<{ ok: boolean; data: Account[] }>('/accounts'),
          apiClient<{ ok: boolean; data: any[] }>('/payees').catch(() => ({
            ok: false,
            data: []
          })),
          apiClient<{ ok: boolean; data: any[] }>('/virtual-cards').catch(
            () => ({ ok: false, data: [] })
          )
        ])

        if (accRes.ok && accRes.data && accRes.data.length > 0) {
          setAccounts(accRes.data)
          setSelectedFromAccount(accRes.data[0])
        }
        if (payeesRes.ok && payeesRes.data) {
          setSavedPayees(payeesRes.data)
        }
        if (cardsRes.ok && cardsRes.data) {
          setCards(cardsRes.data)
          if (cardsRes.data.length > 0) {
            setSelectedCard(cardsRes.data[0])
          }
        }
      } catch (err) {
        console.error('Failed to load transfer page data:', err)
      } finally {
        setLoadingAccounts(false)
      }
    }
    fetchAccountsAndPayees()
    fetchScheduledTransfers()
    fetchPendingSplits()
  }, [])

  function validate() {
    const e: Errors = {}
    if (!useCard && !selectedFromAccount) {
      e.fromAccount = 'Source account is required'
    }
    if (useCard && !selectedCard) {
      e.fromAccount = 'Select a virtual card'
    }

    if (!amount) {
      e.amount = 'Amount is required'
    } else if (Number(amount) <= 0 || isNaN(Number(amount))) {
      e.amount = 'Enter a valid positive amount'
    } else if (
      !useCard &&
      selectedFromAccount &&
      Number(amount) > Number(selectedFromAccount.balance)
    ) {
      e.amount = 'Amount exceeds available balance'
    } else if (useCard && selectedCard) {
      const linkedAcc = accounts.find((a) => a.id === selectedCard.accountId)
      if (linkedAcc && Number(amount) > Number(linkedAcc.balance)) {
        e.amount = 'Amount exceeds linked account balance'
      }
    }

    if (!accountNumber) {
      e.accountNumber = 'Account number is required'
    } else if (!/^\d{6,}$/.test(accountNumber)) {
      e.accountNumber = 'Enter a valid account number'
    }

    if (!accountName) {
      e.accountName = 'Account name is required'
    }

    if (!bank) {
      e.bank = 'Select a bank'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      setStep('confirm')
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    if (!useCard && !selectedFromAccount) return
    if (useCard && !selectedCard) return

    setLoading(true)
    setErrorMsg('')
    try {
      let res: any
      if (transferType === 'instant') {
        const payload: any = {
          toAccount: accountNumber,
          amount: Number(amount),
          description
        }
        if (useCard) {
          payload.cardId = selectedCard.id
        } else {
          payload.fromAccount = selectedFromAccount?.accountNumber
        }

        res = await apiClient<{
          ok: boolean
          message: string
          transaction: any
        }>('/transfer', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      } else {
        res = await apiClient<{ ok: boolean; message: string; data: any }>(
          '/scheduled-transfers',
          {
            method: 'POST',
            body: JSON.stringify({
              fromAccount: selectedFromAccount?.accountNumber,
              toAccount: accountNumber,
              amount: Number(amount),
              description: description || 'Scheduled Payment',
              frequency,
              startDate: new Date(startDate + 'T12:00:00Z').toISOString()
            })
          }
        )
      }
      if (res.ok) {
        if (transferType === 'instant') {
          setConfirmation(
            String(
              res.transaction?.id ||
                Math.floor(10000000 + Math.random() * 89999999)
            )
          )
        } else {
          setConfirmation(
            String(
              res.data?.id || Math.floor(10000000 + Math.random() * 89999999)
            )
          )
          fetchScheduledTransfers()
        }

        // Save payee if requested
        if (savePayeeChecked) {
          await apiClient('/payees', {
            method: 'POST',
            body: JSON.stringify({
              name: accountName,
              accountNumber: accountNumber,
              bank: bank
            })
          }).catch((payeeErr) => {
            console.error('Failed to auto-save payee:', payeeErr)
          })
        }

        setStep('success')
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Transaction failed. Please check balance or details.'
      )
      setStep('failure')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light font-geist p-0">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="flex-1 p-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Bank Transfer</h2>
            <div className="flex items-center gap-3">
              <button className="topbar-icon" aria-label="search">
                <img src="/search.png" alt="search" />
              </button>
              <NotificationCenter />
              <Link
                href="/profile"
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 block"
              >
                <img
                  src={user?.avatarUrl || '/person-logo.png'}
                  alt="avatar"
                  className="w-full h-full object-cover bg-white"
                />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-8 items-start mt-6">
            {/* Left side: Transfer views */}
            <div className="col-span-12 lg:col-span-7">
              {step === 'form' ? (
                <form onSubmit={handleNext} className="transfer-card p-8 !my-0">
                  <div className="grid grid-cols-12 gap-y-6 gap-x-8 items-center">
                    {/* Payment Type */}
                    <label className="col-span-3 text-gray-700 font-semibold">
                      Payment Type :
                    </label>
                    <div className="col-span-9 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setTransferType('instant')}
                        className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all ${
                          transferType === 'instant'
                            ? 'bg-[#450043] text-white border-[#450043] shadow'
                            : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-55'
                        }`}
                      >
                        ⚡ Instant Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTransferType('scheduled')
                          setUseCard(false)
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all ${
                          transferType === 'scheduled'
                            ? 'bg-[#450043] text-white border-[#450043] shadow'
                            : 'bg-transparent text-gray-600 border-gray-200 hover:bg-gray-55'
                        }`}
                      >
                        📅 Schedule Payment
                      </button>
                    </div>

                    {/* Pay using Card Checkbox */}
                    {transferType === 'instant' && cards.length > 0 && (
                      <>
                        <div className="col-span-3"></div>
                        <div className="col-span-9 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="pay-using-card-checkbox"
                            checked={useCard}
                            onChange={(e) => setUseCard(e.target.checked)}
                            className="w-4 h-4 accent-[#9a5c97]"
                          />
                          <label
                            htmlFor="pay-using-card-checkbox"
                            className="text-sm text-gray-600 font-semibold cursor-pointer select-none"
                          >
                            Pay using Virtual Card
                          </label>
                        </div>
                      </>
                    )}

                    {/* From Account / Card */}
                    <label className="col-span-3 text-gray-700">
                      {useCard ? 'Select Card :' : 'From Account :'}
                    </label>
                    <div className="col-span-9">
                      {useCard ? (
                        <select
                          value={selectedCard?.id || ''}
                          onChange={(e) => {
                            const selected = cards.find(
                              (c) => c.id === Number(e.target.value)
                            )
                            setSelectedCard(selected || null)
                          }}
                          className="underline-input bg-transparent"
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
                              <option
                                key={c.id}
                                value={c.id}
                                disabled={c.isFrozen}
                              >
                                {c.cardType.toUpperCase()} *
                                {c.cardNumber.slice(-4)}
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
                          className="underline-input bg-transparent"
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
                        <div className="text-sm text-red-600 mt-1">
                          {errors.fromAccount}
                        </div>
                      )}
                    </div>

                    {/* Amount */}
                    <label className="col-span-3 text-gray-700">Amount :</label>
                    <div className="col-span-9">
                      <input
                        aria-label="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="underline-input"
                        placeholder="Enter amount (Rs.)"
                      />
                      {errors.amount && (
                        <div className="text-sm text-red-600 mt-1">
                          {errors.amount}
                        </div>
                      )}
                    </div>

                    {/* Saved Payees Selection */}
                    {savedPayees.length > 0 && (
                      <>
                        <label className="col-span-3 text-gray-700">
                          Saved Payees :
                        </label>
                        <div className="col-span-9">
                          <select
                            onChange={(e) => {
                              const val = e.target.value
                              if (val) {
                                const p = savedPayees.find(
                                  (payee) => payee.id === Number(val)
                                )
                                if (p) {
                                  setAccountNumber(p.accountNumber)
                                  setAccountName(p.name)
                                  setBank(p.bank)
                                }
                              }
                            }}
                            className="underline-input bg-transparent"
                          >
                            <option value="">
                              -- Choose a saved payee to auto-fill --
                            </option>
                            {savedPayees.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.bank} - {p.accountNumber})
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Destination Account Number */}
                    <label className="col-span-3 text-gray-700">
                      Account Number :
                    </label>
                    <div className="col-span-9">
                      <input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter recipient's account number"
                        className="underline-input"
                      />
                      {errors.accountNumber && (
                        <div className="text-sm text-red-600 mt-1">
                          {errors.accountNumber}
                        </div>
                      )}
                    </div>

                    {/* Destination Account Name */}
                    <label className="col-span-3 text-gray-700">
                      Account Name :
                    </label>
                    <div className="col-span-9">
                      <input
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Enter recipient's full name"
                        className="underline-input"
                      />
                      {errors.accountName && (
                        <div className="text-sm text-red-600 mt-1">
                          {errors.accountName}
                        </div>
                      )}
                    </div>

                    {/* Select Bank */}
                    <label className="col-span-3 text-gray-700">
                      Select Bank :
                    </label>
                    <div className="col-span-9">
                      <select
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                        className="underline-input bg-transparent"
                      >
                        <option value="">Choose bank</option>
                        <option>Nova Bank</option>
                        <option>First National</option>
                        <option>Global Trust</option>
                        <option>Union Bank</option>
                      </select>
                      {errors.bank && (
                        <div className="text-sm text-red-600 mt-1">
                          {errors.bank}
                        </div>
                      )}
                    </div>

                    {/* Conditional Scheduling Fields */}
                    {transferType === 'scheduled' && (
                      <>
                        <label className="col-span-3 text-gray-700 font-semibold">
                          Frequency :
                        </label>
                        <div className="col-span-9">
                          <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="underline-input bg-transparent"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        <label className="col-span-3 text-gray-700 font-semibold">
                          Start Date :
                        </label>
                        <div className="col-span-9">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="underline-input"
                            min={(() => {
                              const tomorrow = new Date()
                              tomorrow.setDate(tomorrow.getDate() + 1)
                              return tomorrow.toISOString().substring(0, 10)
                            })()}
                          />
                        </div>
                      </>
                    )}

                    {/* Description */}
                    <label className="col-span-3 text-gray-700">
                      Description :
                    </label>
                    <div className="col-span-9">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Reason for transfer (optional)"
                        className="description-box"
                      />
                    </div>

                    {/* Save Payee Checkbox */}
                    <div className="col-span-3"></div>
                    <div className="col-span-9 flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="save-payee-checkbox"
                        checked={savePayeeChecked}
                        onChange={(e) => setSavePayeeChecked(e.target.checked)}
                        className="w-4 h-4 accent-[#9a5c97]"
                      />
                      <label
                        htmlFor="save-payee-checkbox"
                        className="text-sm text-gray-600 font-semibold cursor-pointer select-none"
                      >
                        Save this payee for future transfers
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-center mt-10">
                    <button type="submit" className="next-btn cursor-pointer">
                      NEXT
                    </button>
                  </div>
                </form>
              ) : step === 'confirm' ? (
                <div className="transfer-card p-8 !my-0">
                  <h3 className="text-center text-2xl font-semibold mb-6">
                    Confirm Transfer
                  </h3>
                  <div className="bg-white rounded-lg p-6 shadow-lg max-w-xl mx-auto text-center">
                    <p className="mb-4">
                      Confirm your{' '}
                      {transferType === 'scheduled'
                        ? `${frequency} scheduled`
                        : ''}{' '}
                      transfer of{' '}
                      <strong>
                        Rs.{' '}
                        {Number(amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2
                        })}
                      </strong>{' '}
                      to <strong>{accountName || 'recipient'}</strong> (
                      {accountNumber})
                    </p>
                    {useCard && selectedCard && (
                      <p className="text-sm text-purple-800 font-bold mb-4 bg-purple-55 p-3 rounded-lg border border-purple-200 inline-block">
                        💳 Paying via Virtual Card:{' '}
                        {selectedCard.cardType.toUpperCase()} *
                        {selectedCard.cardNumber.slice(-4)}
                      </p>
                    )}
                    {transferType === 'scheduled' ? (
                      <p className="text-sm text-gray-600 mb-6">
                        Starting on:{' '}
                        <strong>
                          {new Date(
                            startDate + 'T12:00:00Z'
                          ).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </strong>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mb-6">
                        Additional fee of Rs.50 will be charged.
                      </p>
                    )}
                    <div className="mb-6">
                      <img
                        src="/transfer-illustration.png"
                        alt="illustration"
                        className="mx-auto"
                      />
                    </div>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setStep('form')}
                        className="next-btn"
                        aria-label="back"
                        disabled={loading}
                      >
                        BACK
                      </button>
                      <button
                        onClick={handleTransfer}
                        disabled={loading}
                        className="next-btn transfer-btn !mt-0"
                      >
                        {loading
                          ? 'PROCESSING...'
                          : transferType === 'scheduled'
                            ? 'SCHEDULE'
                            : 'TRANSFER'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : step === 'success' ? (
                <div className="transfer-card p-8 !my-0">
                  <div className="relative">
                    <div className="success-check inside-check">
                      <svg
                        viewBox="0 0 120 120"
                        width="100"
                        height="100"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <radialGradient id="g" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#28a745" />
                            <stop offset="100%" stopColor="#138a3e" />
                          </radialGradient>
                        </defs>
                        <circle cx="60" cy="60" r="50" fill="#dff7e7" />
                        <circle cx="60" cy="60" r="40" fill="#10a654" />
                        <path
                          d="M38 62 L54 78 L82 42"
                          stroke="#fff"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>

                    <h3 className="text-center text-2xl font-semibold mb-4">
                      {transferType === 'scheduled'
                        ? 'Scheduled Setup Successful!'
                        : 'Transfer Successful!'}
                    </h3>
                    <p className="text-center text-sm text-gray-500 mb-10">
                      {transferType === 'scheduled'
                        ? 'Scheduled Reference Number'
                        : 'Confirmation Number'}{' '}
                      : {confirmation}
                    </p>

                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setAmount('')
                          setAccountNumber('')
                          setAccountName('')
                          setBank('')
                          setDescription('')
                          setErrors({})
                          setConfirmation(null)
                          setStep('form')
                          // Reload accounts to get new balances
                          apiClient<{ ok: boolean; data: Account[] }>(
                            '/accounts'
                          ).then((res) => {
                            if (res.ok && res.data) {
                              setAccounts(res.data)
                              const currentSelected = res.data.find(
                                (a) =>
                                  selectedFromAccount &&
                                  a.accountNumber ===
                                    selectedFromAccount.accountNumber
                              )
                              setSelectedFromAccount(
                                currentSelected || res.data[0]
                              )
                            }
                          })
                          fetchPendingSplits()
                        }}
                        className="transfer-btn success-btn"
                      >
                        <span className="mr-3">‹</span> BACK TO HOME
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="transfer-card p-8 !my-0">
                  <div className="relative">
                    <div className="success-check inside-check">
                      <svg
                        viewBox="0 0 120 120"
                        width="100"
                        height="100"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="60" cy="60" r="50" fill="#ffdede" />
                        <circle cx="60" cy="60" r="40" fill="#ffb6b6" />
                        <path
                          d="M60 30 L93 86 L27 86 Z"
                          fill="#ff4d4f"
                          stroke="#fff"
                          strokeWidth="4"
                          strokeLinejoin="round"
                        />
                        <text
                          x="60"
                          y="78"
                          textAnchor="middle"
                          fontSize="36"
                          fill="#fff"
                          fontWeight="700"
                        >
                          !
                        </text>
                      </svg>
                    </div>

                    <h3 className="text-center text-2xl font-semibold mb-4">
                      Transaction Failed!
                    </h3>
                    <p className="text-center text-sm text-red-600 font-semibold mb-6">
                      Reason: {errorMsg}
                    </p>

                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setStep('form')
                        }}
                        className="transfer-btn success-btn"
                      >
                        <span className="mr-3">‹</span> TRY AGAIN
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Right side: Scheduled Transfers list & Pending Splits */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
              {/* Pending Split Requests */}
              <div className="bg-white rounded-[18px] shadow-[0_22px_50px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.04)] p-6">
                <h3 className="text-xl font-bold mb-4 text-[#450043] flex items-center gap-2 border-b border-gray-100 pb-3">
                  <span className="text-2xl">👥</span> Pending Splits
                </h3>

                {loadingSplits ? (
                  <div className="text-sm text-gray-500 py-4 text-center">
                    Loading split requests...
                  </div>
                ) : pendingSplits.length > 0 ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {pendingSplits.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-gray-55 rounded-2xl border border-gray-100 hover:border-gray-200 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span
                              className="font-bold text-gray-900 text-[11px] truncate"
                              style={{ maxWidth: '65%' }}
                            >
                              From: {item.requesterFullName}
                            </span>
                            <span className="font-extrabold text-[#450043] text-xs shrink-0">
                              Rs.{' '}
                              {Number(item.amount).toLocaleString('en-US', {
                                minimumFractionDigits: 2
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 bg-white/70 p-2 rounded-lg border border-gray-100">
                            "{item.description}"
                          </p>
                          <p className="text-[9px] text-gray-400 mt-2">
                            Requested on:{' '}
                            {new Date(item.createdAt).toLocaleDateString(
                              'en-US',
                              { month: 'short', day: 'numeric' }
                            )}
                          </p>
                        </div>
                        <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-100/50">
                          <button
                            onClick={() => handleDeclineSplit(item.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-bold transition px-3 py-1.5 rounded-lg hover:bg-red-50"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleOpenApproveSplit(item)}
                            className="text-xs text-white bg-[#450043] hover:bg-[#9a5c97] font-bold transition px-3.5 py-1.5 rounded-lg shadow-sm"
                          >
                            Approve & Pay
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No pending split requests.
                  </div>
                )}
              </div>

              {/* Scheduled Payments */}
              <div className="bg-white rounded-[18px] shadow-[0_22px_50px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.04)] p-6 min-h-[300px]">
                <h3 className="text-xl font-bold mb-6 text-[#450043] flex items-center gap-2 border-b border-gray-100 pb-3">
                  <span className="text-2xl">📅</span> Scheduled Payments
                </h3>

                {loadingScheduled ? (
                  <div className="text-sm text-gray-500 py-4 text-center">
                    Loading payments...
                  </div>
                ) : scheduledTransfers.length > 0 ? (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {scheduledTransfers.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-gray-55 rounded-2xl border border-gray-100 hover:border-gray-200 transition relative flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#e8d5e7] text-[#450043] mb-2">
                              {item.frequency}
                            </span>
                            <span className="font-bold text-gray-900 text-sm">
                              Rs.{' '}
                              {Number(item.amount).toLocaleString('en-US', {
                                minimumFractionDigits: 2
                              })}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {item.description || 'Recurring Transfer'}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            From: {item.fromAccount} <br />
                            To: {item.toAccount}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100/50">
                          <p className="text-[10px] text-gray-400">
                            Next:{' '}
                            {new Date(item.nextRun).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }
                            )}
                          </p>
                          <button
                            onClick={() => handleCancelScheduled(item.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-bold transition-all px-2.5 py-1 rounded-lg hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <span className="text-4xl block mb-2">💸</span>
                    No active scheduled payments.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Split Approval Popup */}
      {splitToApprove && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[9999]"
          onClick={() => setSplitToApprove(null)}
        >
          <div
            className="bg-white rounded-2xl w-[400px] max-w-[90%] p-6 text-gray-800 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#450043] border-b pb-2">
              Approve Split Request
            </h3>
            <div>
              <p className="text-sm text-gray-600">
                You are paying{' '}
                <strong>{splitToApprove.requesterFullName}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Amount:{' '}
                <strong className="text-green-600">
                  Rs.{' '}
                  {Number(splitToApprove.amount).toLocaleString('en-US', {
                    minimumFractionDigits: 2
                  })}
                </strong>
              </p>
              <p className="text-sm text-gray-550 italic mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                "{splitToApprove.description}"
              </p>
            </div>

            <form
              onSubmit={handleConfirmApproveSplit}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">
                  Pay from Account
                </label>
                <select
                  value={approveFromAccount}
                  onChange={(e) => setApproveFromAccount(e.target.value)}
                  className="w-full border rounded-lg p-2 bg-transparent text-sm focus:border-[#9a5c97] outline-none"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.accountNumber}>
                      {acc.accountName} ({acc.accountNumber}) - Rs.{' '}
                      {Number(acc.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setSplitToApprove(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#450043] hover:bg-[#9a5c97] text-white shadow"
                >
                  Confirm & Pay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
