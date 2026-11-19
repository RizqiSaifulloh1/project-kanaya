import { useState } from "react"
import type { ReactNode } from "react"
import { Logo } from "./Logo"
import { Badge } from "./Badge"

export interface ShellProps {
  role: string
  backgroundImage: string
  welcomeTitle: string
  welcomeDescription: string
  backendOnline?: boolean
  supabaseConnected?: boolean
  onHome: () => void
  onLogout: () => void
  onRefresh?: () => void
  children: ReactNode
}

export const Shell = ({
  role,
  backgroundImage,
  welcomeTitle,
  welcomeDescription,
  backendOnline = false,
  supabaseConnected = false,
  onHome,
  onLogout,
  onRefresh,
  children,
}: ShellProps) => {
  const [imageAvailable, setImageAvailable] = useState(true)
  const fallbackBackground =
    "linear-gradient(to bottom right, #ecfdf5, #ffffff, #f1f5f9)"

  return (
    <div
      className="relative min-h-screen isolate bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: imageAvailable
          ? `url("${backgroundImage}")`
          : fallbackBackground,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-50/88 via-white/82 to-emerald-50/88 backdrop-blur-[2px]"
      />
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onHome}
            aria-label="Kembali ke Beranda"
            className="shrink-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Logo />
          </button>
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            {/* Status backend indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted">
              <span
                className={`size-2 rounded-full ${
                  backendOnline
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              <span>
                {backendOnline
                  ? supabaseConnected
                    ? "Supabase Realtime"
                    : "Express API"
                  : "Offline Mode"}
              </span>
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh antrean"
                className="p-2 text-muted hover:text-primary transition rounded-lg hover:bg-gray-100"
              >
                🔄
              </button>
            )}

            <button
              type="button"
              onClick={onHome}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 sm:px-3"
              aria-label="Kembali ke Beranda"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="size-4 shrink-0"
              >
                <path
                  d="m3.5 9 6.5-5.5L16.5 9v7.25a.75.75 0 0 1-.75.75h-3.5v-5h-4.5v5h-3.5a.75.75 0 0 1-.75-.75V9Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden sm:inline">Kembali ke Beranda</span>
            </button>

            <Badge t="teal" className="shrink-0">
              {role}
            </Badge>
            <button
              onClick={onLogout}
              className="shrink-0 text-sm text-muted hover:text-red-600 transition font-medium"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 max-w-6xl mx-auto px-5 py-8">
        <section className="relative mb-8 h-36 md:h-44 overflow-hidden rounded-2xl border border-white/70 bg-linear-to-br from-emerald-50 via-white to-slate-100 shadow-md">
          {imageAvailable && (
            <img
              src={backgroundImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover object-right"
              onError={() => setImageAvailable(false)}
            />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-emerald-900/95 via-emerald-800/80 to-transparent" />
          <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center p-5 text-white sm:p-7">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
              {welcomeTitle}
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/85 sm:text-sm sm:leading-6">
              {welcomeDescription}
            </p>
          </div>
        </section>
        {children}
      </main>
    </div>
  )
}
