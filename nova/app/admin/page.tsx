'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import NotificationCenter from '@/components/notification-center'
import Sidebar from '@/components/sidebar'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import styles from './admin.module.css'

interface UserAccount {
  id: number
  userId: number
  accountNumber: string
  accountName: string
  balance: number
}

interface UserProfile {
  id: number
  username: string
  role: string
  fullName: string
  email: string
  nic: string
  createdAt: string
}

interface SystemAuditLog {
  id: number
  event: string
  payload: Record<string, unknown>
  createdAt: string
}

interface SystemStats {
  totalUsers: number
  totalAccounts: number
  totalDeposits: number
  totalTransactions: number
  totalVolume: number
}

export default function AdminPage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  // Data State
  const [users, setUsers] = useState<UserProfile[]>([])
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([])
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalAccounts: 0,
    totalDeposits: 0,
    totalTransactions: 0,
    totalVolume: 0
  })

  // Page State
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'accounts' | 'logs'
  >('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null)

  // Event & Role Filters
  const [roleFilter, setRoleFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')

  // Modals
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(
    null
  )
  const [adjustForm, setAdjustForm] = useState({
    amount: '',
    action: 'deposit' as 'deposit' | 'withdraw' | 'set'
  })

  // Submit states
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false)
  const [submittingRole, setSubmittingRole] = useState<number | null>(null)

  // Fetch admin system data
  const fetchAdminData = async () => {
    try {
      const res = await apiClient<{
        ok: boolean
        users: UserProfile[]
        accounts: UserAccount[]
        auditLogs: SystemAuditLog[]
        stats: SystemStats
      }>('/admin/system')

      if (res) {
        setUsers(res.users || [])
        setAccounts(res.accounts || [])
        setAuditLogs(res.auditLogs || [])
        setStats(
          res.stats || {
            totalUsers: 0,
            totalAccounts: 0,
            totalDeposits: 0,
            totalTransactions: 0,
            totalVolume: 0
          }
        )
      }
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData()
    } else if (user) {
      setLoading(false)
    }
  }, [user])

  // Actions
  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin'
    const confirmMsg = `Are you sure you want to change user ID ${userId} to ${newRole.toUpperCase()}?`
    if (!confirm(confirmMsg)) return

    setSubmittingRole(userId)
    try {
      await apiClient(`/admin/users/${userId}/role`, {
        method: 'POST',
        body: JSON.stringify({ role: newRole })
      })
      alert(`User role changed to ${newRole.toUpperCase()} successfully!`)
      await fetchAdminData()
    } catch (err: any) {
      alert(err?.message || 'Failed to update user role.')
    } finally {
      setSubmittingRole(null)
    }
  }

  const handleOpenBalanceModal = (account: UserAccount) => {
    setSelectedAccount(account)
    setAdjustForm({
      amount: '',
      action: 'deposit'
    })
    setShowBalanceModal(true)
  }

  const handleAdjustBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return

    const amountNum = parseFloat(adjustForm.amount)
    if (isNaN(amountNum) || amountNum < 0) {
      alert('Please enter a valid non-negative amount.')
      return
    }

    setSubmittingAdjustment(true)
    try {
      await apiClient(
        `/admin/accounts/${selectedAccount.accountNumber}/adjust-balance`,
        {
          method: 'POST',
          body: JSON.stringify({
            amount: amountNum,
            action: adjustForm.action
          })
        }
      )
      alert('Balance adjusted successfully!')
      setShowBalanceModal(false)
      await fetchAdminData()
    } catch (err: any) {
      alert(err?.message || 'Failed to adjust balance.')
    } finally {
      setSubmittingAdjustment(false)
    }
  }

  // Loader Gate
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Verifying administrative clearance...</p>
      </div>
    )
  }

  // Access Denied Gate
  if (!user || user.role !== 'admin') {
    return (
      <main className={styles.pageContainer}>
        <div className={styles.accessDeniedContainer}>
          <div className={styles.accessDeniedCard}>
            <div className={styles.deniedIconWrapper}>
              <svg
                width="40"
                height="40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2>ACCESS DENIED</h2>
            <p>
              You do not have the required administrative clearance to view this
              secure panel. If you believe this is an error, contact the system
              administrator.
            </p>
            <button
              className={styles.actionBtn}
              onClick={() => router.push('/dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Filtering Lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const filteredAccounts = accounts.filter((acc) => {
    return (
      acc.accountNumber.includes(searchQuery) ||
      acc.accountName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.payload)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    const matchesEvent = eventFilter === 'all' || log.event === eventFilter
    return matchesSearch && matchesEvent
  })

  // Get unique audit event names for filters
  const uniqueEventNames = Array.from(
    new Set(auditLogs.map((log) => log.event))
  )

  return (
    <main className={styles.pageContainer}>
      <Sidebar />

      <section className={styles.content}>
        {/* Header */}
        <header className={styles.contentHeader}>
          <div>
            <h1 className={styles.pageTitle}>Admin Control Center</h1>
            <p
              style={{
                color: '#94a3b8',
                fontSize: '0.9rem',
                marginTop: '0.25rem'
              }}
            >
              Real-time platform statistics, user roles, account vaults, and
              system audit logs.
            </p>
          </div>
          <div className={styles.headerActions}>
            <NotificationCenter />
            <button onClick={logout} className={styles.logoutButton}>
              LOG OUT
            </button>
            <Link href="/profile">
              <img
                src={user?.avatarUrl || '/person-logo.png'}
                alt="profile"
                className={styles.avatar}
              />
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper}>
              <svg
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className={styles.kpiInfo}>
              <h4>Total Users</h4>
              <p className={styles.kpiValue}>{stats.totalUsers}</p>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper}>
              <svg
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div className={styles.kpiInfo}>
              <h4>Linked Accounts</h4>
              <p className={styles.kpiValue}>{stats.totalAccounts}</p>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper}>
              <svg
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className={styles.kpiInfo}>
              <h4>Vault Reserves</h4>
              <p className={styles.kpiValue}>
                Rs.{' '}
                {Number(stats.totalDeposits).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper}>
              <svg
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className={styles.kpiInfo}>
              <h4>Tx Volume</h4>
              <p className={styles.kpiValue}>
                Rs.{' '}
                {Number(stats.totalVolume).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabsContainer}>
          <button
            onClick={() => {
              setActiveTab('overview')
              setSearchQuery('')
            }}
            className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
          >
            SYSTEM OVERVIEW
          </button>
          <button
            onClick={() => {
              setActiveTab('users')
              setSearchQuery('')
            }}
            className={`${styles.tabButton} ${activeTab === 'users' ? styles.active : ''}`}
          >
            USER DIRECTORY
          </button>
          <button
            onClick={() => {
              setActiveTab('accounts')
              setSearchQuery('')
            }}
            className={`${styles.tabButton} ${activeTab === 'accounts' ? styles.active : ''}`}
          >
            ACCOUNT VAULTS
          </button>
          <button
            onClick={() => {
              setActiveTab('logs')
              setSearchQuery('')
            }}
            className={`${styles.tabButton} ${activeTab === 'logs' ? styles.active : ''}`}
          >
            SYSTEM AUDIT LOGS
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '2rem'
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    marginBottom: '1rem',
                    color: '#d8b4fe'
                  }}
                >
                  Platform Health & Activity
                </h3>
                <p
                  style={{
                    color: '#94a3b8',
                    lineHeight: 1.6,
                    marginBottom: '1.5rem'
                  }}
                >
                  Welcome to the Nova Bank Command center. As an administrator,
                  you have capabilities to inspect global bank accounts,
                  override roles, adjust balances, and audit actions. Every
                  update is tracked globally inside the immutable system log
                  below.
                </p>

                <div className={styles.tableContainer}>
                  <div
                    style={{
                      padding: '1.25rem 1.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      fontWeight: 700,
                      color: '#a78bfa'
                    }}
                  >
                    Quick Activity Logs (Last 5 events)
                  </div>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Payload Summary</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.slice(0, 5).map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 700, color: '#e9d5ff' }}>
                            {log.event}
                          </td>
                          <td
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.8rem',
                              color: '#f472b6'
                            }}
                          >
                            {JSON.stringify(log.payload)}
                          </td>
                          <td style={{ color: '#94a3b8' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            style={{ textAlign: 'center', color: '#64748b' }}
                          >
                            No events logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '1.5rem'
                }}
              >
                <h4
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    marginBottom: '1rem',
                    color: '#a78bfa'
                  }}
                >
                  Admin Actions Quick Reference
                </h4>
                <ul
                  style={{
                    listStyleType: 'disc',
                    paddingLeft: '1.25rem',
                    color: '#94a3b8',
                    fontSize: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    lineHeight: '1.5'
                  }}
                >
                  <li>
                    Use the <strong>User Directory</strong> tab to promote
                    accounts to administrators or demote them to regular
                    customers.
                  </li>
                  <li>
                    Use the <strong>Account Vaults</strong> tab to adjust bank
                    balances, adding or deducting funds, or locking vault
                    states.
                  </li>
                  <li>
                    Use the <strong>System Audit Logs</strong> tab to verify
                    ledger details and audit security activity.
                  </li>
                  <li>
                    Ensure all actions comply with local financial operations
                    standards.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className={styles.controlsRow}>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  placeholder="Search username, name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <span className={styles.searchIcon}>🔍</span>
              </div>
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="customer">Customers</option>
                </select>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>NIC</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ color: '#d8b4fe', fontWeight: 'bold' }}>
                        {u.id}
                      </td>
                      <td>@{u.username}</td>
                      <td>{u.fullName}</td>
                      <td>
                        {u.email || (
                          <span style={{ color: '#64748b' }}>n/a</span>
                        )}
                      </td>
                      <td>
                        {u.nic || <span style={{ color: '#64748b' }}>n/a</span>}
                      </td>
                      <td>
                        <span
                          className={`${styles.roleBadge} ${u.role === 'admin' ? styles.admin : styles.customer}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          disabled={submittingRole === u.id}
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className={styles.actionBtn}
                        >
                          {submittingRole === u.id
                            ? 'Updating...'
                            : u.role === 'admin'
                              ? 'Demote'
                              : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: 'center',
                          color: '#64748b',
                          padding: '2rem'
                        }}
                      >
                        No users match search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div>
            <div className={styles.controlsRow}>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  placeholder="Search account number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <span className={styles.searchIcon}>🔍</span>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Account Number</th>
                    <th>Owner ID</th>
                    <th>Account Nickname</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id}>
                      <td style={{ color: '#d8b4fe', fontWeight: 'bold' }}>
                        {acc.id}
                      </td>
                      <td>{acc.accountNumber}</td>
                      <td>User #{acc.userId}</td>
                      <td>{acc.accountName}</td>
                      <td style={{ fontWeight: 700, color: '#f472b6' }}>
                        Rs.{' '}
                        {Number(acc.balance).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenBalanceModal(acc)}
                          className={styles.actionBtn}
                        >
                          Adjust Balance
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: 'center',
                          color: '#64748b',
                          padding: '2rem'
                        }}
                      >
                        No accounts match search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className={styles.controlsRow}>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <span className={styles.searchIcon}>🔍</span>
              </div>
              <div>
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Events</option>
                  {uniqueEventNames.map((evt) => (
                    <option key={evt} value={evt}>
                      {evt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Event Type</th>
                    <th>Timestamp</th>
                    <th>Payload Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id
                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() =>
                            setExpandedLogId(isExpanded ? null : log.id)
                          }
                          className={styles.expandableRow}
                        >
                          <td style={{ color: '#d8b4fe', fontWeight: 'bold' }}>
                            {log.id}
                          </td>
                          <td style={{ fontWeight: 700, color: '#e9d5ff' }}>
                            {log.event}
                          </td>
                          <td style={{ color: '#94a3b8' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td
                            style={{
                              color: '#64748b',
                              fontSize: '0.8rem',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              maxWidth: '300px'
                            }}
                          >
                            {JSON.stringify(log.payload)}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className={styles.expandedDetailRow}>
                            <td colSpan={4}>
                              <div style={{ marginTop: '0.5rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.8rem',
                                    color: '#a78bfa',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  Full Payload Metadata:
                                </span>
                                <pre className={styles.preBox}>
                                  {JSON.stringify(log.payload, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          textAlign: 'center',
                          color: '#64748b',
                          padding: '2rem'
                        }}
                      >
                        No audit logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Adjust Balance Dialog Modal */}
      {showBalanceModal && selectedAccount && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Adjust Vault Balance</h3>
              <button
                onClick={() => setShowBalanceModal(false)}
                className={styles.modalCloseBtn}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdjustBalanceSubmit}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                  Account Number
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0.75rem 0',
                    fontWeight: 'bold',
                    color: '#ffffff'
                  }}
                >
                  {selectedAccount.accountNumber}
                </p>

                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                  Current Balance
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontWeight: 'bold',
                    color: '#f472b6',
                    fontSize: '1.1rem'
                  }}
                >
                  Rs.{' '}
                  {Number(selectedAccount.balance).toLocaleString('en-US', {
                    minimumFractionDigits: 2
                  })}
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Adjustment Action</label>
                <select
                  value={adjustForm.action}
                  onChange={(e) =>
                    setAdjustForm({
                      ...adjustForm,
                      action: e.target.value as any
                    })
                  }
                  className={styles.formSelect}
                >
                  <option value="deposit">Deposit (Add Funds)</option>
                  <option value="withdraw">Withdraw (Deduct Funds)</option>
                  <option value="set">Set Explicit Balance</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter adjustment amount"
                  value={adjustForm.amount}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, amount: e.target.value })
                  }
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className={`${styles.actionBtn} ${styles.secondary}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjustment}
                  className={styles.actionBtn}
                >
                  {submittingAdjustment ? 'Processing...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
