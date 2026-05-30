'use client'

import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

interface FloatingInputProps {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  autoComplete?: string
  className?: string
  inputBg?: string
}

export function FloatingInput({
  label, type = 'text', value, onChange, error, hint,
  disabled, required, autoComplete, className = '', inputBg = 'bg-white',
}: FloatingInputProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'
  const inputType  = isPassword ? (showPwd ? 'text' : 'password') : type
  const isLifted   = focused || value.length > 0

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div
        className={`
          relative rounded-xl border transition-all duration-150
          ${error
            ? 'border-red-400 bg-red-50/30 shadow-[0_0_0_3px_rgb(239,68,68,0.08)]'
            : focused
              ? `border-indigo-500 ${inputBg} shadow-[0_0_0_3px_rgb(99,102,241,0.08)]`
              : `border-gray-200 ${inputBg} hover:border-gray-300`
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
        `}
      >
        {/* Floating label */}
        <label
          htmlFor={id}
          className={`
            absolute left-3.5 pointer-events-none transition-all duration-150 select-none
            ${isLifted
              ? 'top-2 text-[10px] font-semibold'
              : 'top-1/2 -translate-y-1/2 text-sm font-normal'
            }
            ${error ? 'text-red-500' : focused ? 'text-indigo-600' : 'text-gray-400'}
          `}
        >
          {label}{required && <span className="ml-0.5 text-red-400">*</span>}
        </label>

        <input
          id={id}
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            w-full bg-transparent outline-none text-sm text-gray-900
            ${isLifted ? 'pt-5 pb-2 px-3.5' : 'py-3.5 px-3.5'}
            ${isPassword ? 'pr-10' : ''}
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {/* Error icon */}
        {error && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
        )}
      </div>

      {/* Error / hint message */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5 text-xs text-red-500 flex items-center gap-1 pl-1"
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5 text-xs text-gray-400 pl-1"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
