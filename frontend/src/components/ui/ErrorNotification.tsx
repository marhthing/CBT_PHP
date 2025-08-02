import { useState, useEffect } from 'react'

interface ErrorNotificationProps {
  message: string
  onClose: () => void
  type?: 'error' | 'success' | 'warning' | 'info'
}

export default function ErrorNotification({ message, onClose, type = 'error' }: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation to complete
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#10b981',
          border: '#059669',
          icon: '✓'
        }
      case 'warning':
        return {
          bg: '#f59e0b',
          border: '#d97706',
          icon: '⚠'
        }
      case 'info':
        return {
          bg: '#3b82f6',
          border: '#2563eb',
          icon: 'ℹ'
        }
      default:
        return {
          bg: '#ef4444',
          border: '#dc2626',
          icon: '✕'
        }
    }
  }

  const colors = getColors()

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        background: 'white',
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        maxWidth: '400px',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: colors.bg,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {colors.icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#1e293b',
            lineHeight: '1.4'
          }}>
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
import React from 'react'

interface ErrorNotificationProps {
  message: string
  onClose?: () => void
}

export default function ErrorNotification({ message, onClose }: ErrorNotificationProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      maxWidth: '400px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
