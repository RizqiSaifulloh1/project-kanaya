import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  labelAction?: ReactNode
  leadingIcon?: ReactNode
  trailingAction?: ReactNode
}

export const Field = ({
  label,
  error,
  labelAction,
  leadingIcon,
  trailingAction,
  ...p
}: FieldProps) => {
  const generatedId = useId()
  const inputId = p.id ?? generatedId

  return (
    <div className="block">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-[15px] font-medium">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative mt-1.5">
        {leadingIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400"
          >
            {leadingIcon}
          </span>
        )}
        <input
          {...p}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`h-11 w-full rounded-xl border bg-white text-sm outline-none transition placeholder:text-gray-400 hover:border-primary/60 focus:border-primary focus:ring-4 focus:ring-primary/15 ${
            leadingIcon
              ? `pl-10 ${trailingAction ? 'pr-11' : 'pr-3.5'}`
              : trailingAction
                ? 'pl-3.5 pr-11'
                : 'px-3.5'
          } ${
            error ? 'border-red-400 bg-red-50/40' : 'border-line'
          }`}
        />
        {trailingAction && (
          <span className="absolute inset-y-0 right-2 flex items-center">
            {trailingAction}
          </span>
        )}
      </div>
      {error && (
        <span
          id={`${inputId}-error`}
          className="mt-1 block text-[13px] font-medium text-red-600"
        >
          {error}
        </span>
      )}
    </div>
  )
}

