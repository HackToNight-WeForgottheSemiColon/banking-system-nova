'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

// Minimal icon components to avoid external dependency
type IconProps = { size?: number }
const LayoutGrid = ({ size = 18 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="3"
      width="8"
      height="8"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="13"
      y="3"
      width="8"
      height="8"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="3"
      y="13"
      width="8"
      height="8"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="13"
      y="13"
      width="8"
      height="8"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
)

const CreditCard = ({ size = 18 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="2"
      y="5"
      width="20"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M2 10H22" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 14H10" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const PiggyBank = ({ size = 18 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 5V2M10 3h4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M18 11h2.5c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5H18"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M6 11H3.5C2.7 11 2 10.3 2 9.5S2.7 8 3.5 8H6"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M9 17v3M15 17v3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="10" cy="10" r="0.75" fill="currentColor" />
  </svg>
)

const Settings = ({ size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.28 16.9l.06-.06c.45-.45.58-1.1.33-1.82a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.27-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82L4.3 4.3A2 2 0 1 1 7.12 1.47l.06.06c.45.45 1.1.58 1.82.33.6-.25 1.26-.25 1.86 0 .72.25 1.37.12 1.82-.33l.06-.06A2 2 0 1 1 19.7 4.3l-.06.06c-.45.45-.58 1.1-.33 1.82.25.6.25 1.26 0 1.86a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83l-.06.06z"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
)

const HelpCircle = ({ size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 17h.01"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M9.5 10a2.5 2.5 0 1 1 5 0c0 1.75-2 2.25-2 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const Shield = ({ size = 18 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const baseMenuItems = [
    { label: 'DASHBOARD', path: '/dashboard' },
    { label: 'ACCOUNTS', path: '/bank-accounts' },
    { label: 'CARDS', path: '/cards' },
    { label: 'SAVINGS JARS', path: '/savings-jars' },
    { label: 'BANK TRANSFER', path: '/bank-transfer' },
    { label: 'PAY BILLS', path: '/pay-bills' },
    { label: 'SMART SPEND', path: '/smart-spend' },
    { label: 'E-STATEMENT', path: '/e-statement' }
  ]

  const menuItems =
    user?.role === 'admin'
      ? [...baseMenuItems, { label: 'ADMIN PANEL', path: '/admin' }]
      : baseMenuItems

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {/* Logo */}
        <div className="logo-wrapper">
          <img src="/loginlogo.png" alt="logo" className="logo-img" />
          <h1 className="brand-name">NOVA BANK</h1>
        </div>

        {/* Menu */}
        <nav className="menu">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link key={item.label} href={item.path} className="menu-link">
                <button className={`menu-item ${isActive ? 'active' : ''}`}>
                  {item.label === 'DASHBOARD' && <LayoutGrid size={18} />}
                  {item.label === 'CARDS' && <CreditCard size={18} />}
                  {item.label === 'SAVINGS JARS' && <PiggyBank size={18} />}
                  {item.label === 'ADMIN PANEL' && <Shield size={18} />}
                  {item.label}
                </button>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <Link href="/profile" style={{ color: 'inherit' }}>
          <Settings size={24} />
        </Link>
        <HelpCircle size={24} />
      </div>

      <style jsx>{`
        .sidebar {
          width: 250px;
          background: rgba(13, 8, 24, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 10px 0 40px rgba(0, 0, 0, 0.3);
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .sidebar-top {
          display: flex;
          flex-direction: column;
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .logo-img {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: white;
          object-fit: cover;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
        }

        .brand-name {
          color: white;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 1.5px;
          background: linear-gradient(135deg, #ffffff 0%, #d8b4fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .menu {
          margin-top: 2rem;
          padding: 0 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .menu-link {
          text-decoration: none;
        }

        .menu-item {
          height: 46px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.65);
          text-align: left;
          padding: 0 1.25rem;
          border-radius: 12px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          width: 100%;
          border: 1px solid transparent;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.04);
          color: white;
          transform: translateX(4px);
        }

        .menu-item.active {
          background: linear-gradient(135deg, rgba(157, 78, 221, 0.2) 0%, rgba(181, 23, 158, 0.1) 100%);
          border-color: rgba(157, 78, 221, 0.25);
          color: white;
          box-shadow: 0 4px 15px rgba(157, 78, 221, 0.15);
          font-weight: 700;
        }

        .sidebar-footer {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem;
          color: rgba(255, 255, 255, 0.6);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .sidebar-footer :global(svg) {
          cursor: pointer;
          transition: color 0.2s, transform 0.2s;
        }
        
        .sidebar-footer :global(svg:hover) {
          color: white;
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            flex-direction: row;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding: 0.5rem 1rem;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 50;
          }

          .sidebar-top {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }

          .logo-wrapper {
            padding: 0;
            border-bottom: none;
          }
          .logo-img {
            width: 44px;
            height: 44px;
          }
          .brand-name {
            font-size: 15px;
          }

          .menu {
            display: none; /* Hide standard sidebar links on mobile in favor of bottom-bar navigation (optional, let's keep it overflow-x scroll) */
          }
          
          .sidebar-footer {
            border-top: none;
            padding: 0;
          }
        }
      `}</style>
    </aside>
  )
}
