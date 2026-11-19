import { useState } from "react"

import type { Entry, QueueStatus } from "../types/queue"
import { POLY } from "../types/queue"
import { Card } from "../components/ui/Card"
import { Btn } from "../components/ui/Btn"
import { Badge } from "../components/ui/Badge"
import { soundEffects } from "../utils/audio"

type PolyName = keyof typeof POLY
type DoctorQueueAction = Extract<QueueStatus, "Selesai" | "Dilewati">

interface DoctorViewProps {
  queue: Entry[]
  onCallNext: (polyCode?: string) => Promise<Entry | null>
  onUpdateStatus: (id: number, status: DoctorQueueAction) => Promise<void>
}

export function DoctorView({
  queue,
  onCallNext,
  onUpdateStatus,
}: DoctorViewProps) {
  const [activePoli, setActivePoli] = useState<PolyName>("Umum")
  const [busyAction, setBusyAction] = useState<number | "call" | null>(null)
  const [error, setError] = useState("")

  const polyInfo = POLY[activePoli]
  const current = queue.find(
    (entry) => entry.poly === activePoli && entry.status === "Dipanggil",
  )
  const waiting = queue
    .filter(
      (entry) =>
        entry.poly === activePoli && entry.ticket && entry.status === "Menunggu",
    )
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.id - b.id)
  const canRepeatCall =
    typeof window !== "undefined" && "speechSynthesis" in window

  const callNext = async () => {
    setBusyAction("call")
    setError("")
    try {
      const called = await onCallNext(polyInfo.code)
      if (!called) {
        setError(`Belum ada antrean menunggu di Poli ${activePoli}.`)
      } else {
        soundEffects.announceQueue(called.ticket ?? "", called.poly)
      }
    } catch (requestError) {
      console.error(requestError)
      setError("Gagal memanggil antrean. Silakan coba kembali.")
    } finally {
      setBusyAction(null)
    }
  }

  const updateStatus = async (
    entry: Entry,
    status: DoctorQueueAction,
  ) => {
    setBusyAction(entry.id)
    setError("")
    try {
      await onUpdateStatus(entry.id, status)
    } catch (requestError) {
      console.error(requestError)
      setError("Gagal memperbarui status pasien. Silakan coba kembali.")
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Dashboard Dokter
        </h1>
        <p className="mt-1 text-muted">
          Manajemen dan pemanggilan antrean pasien berdasarkan poli layanan.
        </p>
      </div>

      <section
        aria-label="Ringkasan antrean berdasarkan poli"
        className="grid gap-4 md:grid-cols-3"
      >
        {(Object.keys(POLY) as PolyName[]).map((poly) => {
          const currentInPoly = queue.find(
            (entry) => entry.poly === poly && entry.status === "Dipanggil",
          )
          const waitingInPoly = queue.filter(
            (entry) =>
              entry.poly === poly &&
              entry.ticket &&
              entry.status === "Menunggu",
          ).length
          const selected = activePoli === poly

          return (
            <button
              key={poly}
              type="button"
              onClick={() => {
                setActivePoli(poly)
                setError("")
              }}
              aria-pressed={selected}
              className={`rounded-2xl border border-white/70 bg-white/95 p-5 text-left shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                selected
                  ? "border-emerald-600 ring-2 ring-emerald-600/25"
                  : "hover:border-emerald-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">Poli {poly}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Kode {POLY[poly].code} · {POLY[poly].room}
                  </p>
                </div>
                <Badge t={selected ? "green" : "gray"}>
                  {waitingInPoly} menunggu
                </Badge>
              </div>
              <p className="mt-5 text-2xl font-extrabold tracking-tight text-primary-dark">
                {currentInPoly?.ticket ?? "—"}
              </p>
              <p className="mt-1 truncate text-sm text-muted">
                {currentInPoly?.name ?? "Belum ada pasien dipanggil"}
              </p>
            </button>
          )
        })}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="bg-linear-to-br from-primary to-primary-dark p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/75">
                  Sedang Dilayani
                </p>
                <h2 className="mt-1 text-xl font-bold">Poli {activePoli}</h2>
              </div>
              <Badge t="green" className="bg-white/15 text-white">
                {polyInfo.room}
              </Badge>
            </div>
            {current ? (
              <div className="mt-7">
                <p className="text-5xl font-extrabold tracking-tight">
                  {current.ticket}
                </p>
                <p className="mt-2 text-lg font-semibold">{current.name}</p>
                <p className="mt-1 text-sm text-white/75">
                  {current.priority
                    ? "Lansia / Jalur prioritas"
                    : current.cat === "JKN"
                      ? "BPJS / JKN"
                      : "Pasien Umum"}
                </p>
              </div>
            ) : (
              <p className="mt-7 rounded-xl bg-white/10 p-4 text-sm text-white/85">
                Belum ada pasien yang sedang dipanggil.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted">
              {waiting.length} pasien menunggu di Poli {activePoli}
            </p>
            <div className="flex flex-wrap gap-2">
              {current && canRepeatCall && (
                <Btn
                  variant="ghost"
                  onClick={() =>
                    soundEffects.announceQueue(
                      current.ticket ?? "",
                      activePoli,
                    )
                  }
                >
                  🔊 Panggil Ulang Suara
                </Btn>
              )}
              {current && (
                <Btn
                  variant="ghost"
                  onClick={() => updateStatus(current, "Selesai")}
                  disabled={busyAction !== null}
                >
                  Selesaikan Pemeriksaan
                </Btn>
              )}
              <Btn
                onClick={callNext}
                disabled={busyAction !== null || waiting.length === 0}
              >
                {busyAction === "call"
                  ? "Memanggil…"
                  : "Panggil Pasien Berikutnya"}
              </Btn>
            </div>
          </div>
          {error && (
            <p
              className="px-5 pb-5 text-sm font-medium text-red-600"
              role="alert"
            >
              {error}
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-ink">Antrean Berikutnya</h2>
            <Badge t="teal">{waiting.length} pasien</Badge>
          </div>
          {waiting.length > 0 ? (
            <ol className="mt-3 divide-y divide-line">
              {waiting.map((entry, index) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {index + 1}. {entry.ticket}
                      {entry.priority && (
                        <Badge t="amber" className="ml-2">
                          Prioritas
                        </Badge>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {entry.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted">
                      {entry.cat === "JKN" ? "JKN" : "Umum"}
                    </span>
                    <Btn
                      variant="ghost"
                      className="h-9 px-3 text-xs"
                      onClick={() => updateStatus(entry, "Dilewati")}
                      disabled={busyAction !== null}
                    >
                      {busyAction === entry.id ? "Memproses…" : "Lewati"}
                    </Btn>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 rounded-xl bg-canvas p-4 text-center text-sm text-muted">
              Tidak ada antrean menunggu.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
