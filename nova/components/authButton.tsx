import type { ButtonHTMLAttributes } from 'react'

type AuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export default function AuthButton({
  className = '',
  type = 'button',
  disabled,
  children,
  ...props
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`relative flex items-center justify-center gap-3 overflow-hidden rounded-full font-extrabold tracking-wider text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none ${className}`}
      style={{
        height: '64px',
        minWidth: '228px',
        padding: '0 2.5rem',
        fontSize: '1.25rem',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 25px -5px rgba(157, 78, 221, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }}
      {...props}
    >
      {/* Decorative inner glow hover effect using standard CSS triggers */}
      <span className="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 hover:opacity-10 pointer-events-none" />
      <span className="relative z-10">{children}</span>
      
      <style jsx>{`
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(181, 23, 158, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4);
          border-color: rgba(255, 255, 255, 0.3);
        }
        button:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow: 0 4px 10px -2px rgba(157, 78, 221, 0.4);
        }
      `}</style>
    </button>
  )
}

