import type { Entry } from "../types/queue"
import { POLY } from "../types/queue"
import { Logo } from "../components/ui/Logo"

interface PublicMonitorProps {
  queue: Entry[]
  backendOnline: boolean
}

export function PublicMonitor({ queue, backendOnline }: PublicMonitorProps) {
  const active = queue.filter(
    (entry) => entry.status !== "Selesai" && entry.status !== "Dilewati",
  )
  const current = queue.find((entry) => entry.status === "Dipanggil")
  const waiting = active
    .filter((entry) => entry.status === "Menunggu" && entry.ticket)
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.id - b.id)

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-8 sm:py-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white px-2 py-1">
            <Logo />
          </div>
          <div>
            <p className="text-sm font-bold sm:text-base">Nayaka Antrean Digital</p>
            <p className="text-xs text-white/55">Layar Monitor Pasien</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/75 sm:inline-flex">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            LIVE
          </span>
          <a
            href="/"
            className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 sm:px-4 sm:text-sm"
          >
            Kembali ke Beranda
          </a>
        </div>
      </header>

      <section className="mx-auto mt-8 grid max-w-7xl gap-5 lg:mt-12 lg:grid-cols-[1.4fr_0.8fr]">
        <article className="flex min-h-95 flex-col justify-between rounded-3xl border border-white/10 bg-linear-to-br from-slate-900 to-emerald-950 p-6 shadow-2xl sm:p-10">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/70">
                Nomor Antrean
              </p>
              <h1 className="mt-1 text-xl font-bold sm:text-2xl">
                Sedang Dipanggil
              </h1>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              {backendOnline ? "Terhubung" : "Mode lokal"}
            </span>
          </div>
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-white/55">
              Silakan menuju ruang pemeriksaan
            </p>
            <p className="mt-2 text-7xl font-black tracking-tight text-emerald-300 sm:text-9xl">
              {current?.ticket ?? "—"}
            </p>
            {current && (
              <p className="mt-4 text-lg font-semibold text-white/90">
                Poli {current.poly} · {POLY[current.poly]?.room ?? "Ruang pemeriksaan"}
              </p>
            )}
          </div>
          <p className="text-center text-xs text-white/45">
            Informasi antrean diperbarui otomatis
          </p>
        </article>

        <aside className="rounded-3xl border border-white/10 bg-white/6 p-5 sm:p-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                Antrean Berikutnya
              </p>
              <h2 className="mt-1 text-xl font-bold">Pasien Menunggu</h2>
            </div>
            <span className="text-sm font-semibold text-emerald-200">
              {waiting.length} pasien
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {waiting.length ? (
              waiting.slice(0, 7).map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/4 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-xs font-bold text-white/60">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{entry.ticket}</p>
                      <p className="text-xs text-white/50">Poli {entry.poly}</p>
                    </div>
                  </div>
                  {entry.priority && (
                    <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                      Prioritas
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/4 px-4 py-8 text-center text-sm text-white/55">
                Belum ada pasien yang menunggu.
              </p>
            )}
          </div>
        </aside>
      </section>

      <section className="mx-auto mt-5 grid max-w-7xl gap-4 sm:grid-cols-3">
        {Object.entries(POLY).map(([name, info]) => {
          const polyQueue = active.filter((entry) => entry.poly === name)
          const polyCurrent = polyQueue.find((entry) => entry.status === "Dipanggil")
          const polyWaiting = polyQueue.filter((entry) => entry.status === "Menunggu")
          return (
            <article
              key={name}
              className="rounded-2xl border border-white/10 bg-white/6 p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Poli {name}</h3>
                <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-white/65">
                  {info.code}
                </span>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-emerald-200">
                {polyCurrent?.ticket ?? "—"}
              </p>
              <p className="mt-1 text-xs text-white/50">
                {polyWaiting.length} pasien menunggu
              </p>
            </article>
          )
        })}
      </section>
    </main>
  )
}
