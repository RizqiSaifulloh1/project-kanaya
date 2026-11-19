import { useState, useEffect } from 'react'
import type { Entry } from '../types/queue'
import { POLY } from '../types/queue'
import { soundEffects } from '../utils/audio'
import { Card } from '../components/ui/Card'
import { Btn } from '../components/ui/Btn'
import { Badge } from '../components/ui/Badge'
import { Pipeline } from '../components/ui/Pipeline'

interface SystemMonitorProps {
  queue: Entry[]
  onCallNext: (polyCode?: string) => Promise<Entry | null>
}

export function SystemMonitor({ queue, onCallNext }: SystemMonitorProps) {
  const [stage, setStage] = useState(3)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedPoly, setSelectedPoly] = useState<string>('all')
  const [calling, setCalling] = useState(false)

  const active = queue.filter(
    (q) => q.ticket && q.status !== 'Selesai' && q.status !== 'Dilewati',
  )
  const current = queue.find((q) => q.status === 'Dipanggil')

  // Pipeline simulation on call
  useEffect(() => {
    if (stage < 3) {
      const t = setTimeout(() => setStage(stage + 1), 700)
      return () => clearTimeout(t)
    }
  }, [stage])

  const handleCallNext = async () => {
    setCalling(true)
    setStage(0)

    try {
      const polyCode = selectedPoly === 'all' ? undefined : selectedPoly
      const called = await onCallNext(polyCode)

      if (called && called.ticket) {
        // Bunyikan bel dan suara pengumuman bahasa Indonesia
        soundEffects.announceQueue(called.ticket, called.poly)

        setToast(
          `Halo ${called.name.split(' ')[0]}, nomor antrean ${called.ticket} silakan menuju Poli ${called.poly}.`
        )
        setTimeout(() => setToast(null), 7000)
      } else {
        alert('Tidak ada antrean yang sedang menunggu pada poli yang dipilih.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCalling(false)
    }
  }

  const handleTestSound = () => {
    if (current && current.ticket) {
      soundEffects.announceQueue(current.ticket, current.poly)
    } else {
      soundEffects.announceQueue('A-012', 'Umum')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Monitor Antrean &amp; Layar Publik
          </h1>
          <p className="text-muted mt-1">
            Display live digital signage untuk ruang tunggu pasien dengan pengumuman suara otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Poli */}
          <select
            value={selectedPoly}
            onChange={(e) => setSelectedPoly(e.target.value)}
            className="h-11 px-3 rounded-xl border border-line bg-white text-sm font-medium outline-none focus:border-primary"
          >
            <option value="all">Semua Poli (Global)</option>
            <option value="A">Poli Umum (A)</option>
            <option value="B">Poli Gigi (B)</option>
            <option value="C">Poli Anak (C)</option>
          </select>

          <Btn variant="ghost" className="h-11 px-3 text-xs" onClick={handleTestSound} title="Uji Suara">
            🔊 Tes Suara
          </Btn>

          <Btn disabled={calling} onClick={handleCallNext}>
            {calling ? 'Memanggil…' : '📢 Panggil Antrean Berikutnya'}
          </Btn>
        </div>
      </div>

      {/* Pipeline Status */}
      <Card className="p-6 mt-6">
        <Pipeline stage={stage} />
      </Card>

      {/* Main Grid: Live TV Display Board + Notification Center */}
      <div className="grid lg:grid-cols-5 gap-6 mt-6">
        {/* Kolom TV Publik (Dark Theme Board) */}
        <div className="lg:col-span-3 rounded-2xl bg-ink text-white p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-primary animate-ping" />
                <span className="text-xs uppercase tracking-widest text-white/80 font-bold">
                  Layar Panggilan Pasien
                </span>
              </div>
              <span className="text-xs text-[#d9f4e1] bg-white/10 px-3 py-1 rounded-full font-semibold">
                ● LIVE MONITOR
              </span>
            </div>

            {/* Central Big Number Display */}
            <div className="text-center py-10 my-2 bg-black/20 rounded-2xl border border-white/10">
              <p className="text-white/60 text-sm font-medium tracking-wide uppercase">
                Sedang Dipanggil di Loket / Ruang Periksa
              </p>
              <div className="text-7xl sm:text-8xl font-black tracking-tight mt-2 text-accent drop-shadow-md">
                {current?.ticket ?? '—'}
              </div>
              {current && (
                <div className="mt-3">
                  <span className="text-xl font-bold text-white">
                    Poli {current.poly} ({POLY[current.poly]?.room || 'R. Dokter'})
                  </span>
                  <p className="text-white/60 text-sm mt-0.5">Pasien: {current.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Poli Cards */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            {Object.entries(POLY).map(([k, v]) => {
              const waitingInPoly = active.filter(
                (q) => q.status === 'Menunggu' && q.ticket && q.ticket.startsWith(v.code)
              )
              const firstWaiting = waitingInPoly[0]

              return (
                <div
                  key={k}
                  className="rounded-xl bg-white/10 p-3.5 text-center border border-white/5"
                >
                  <p className="text-xs text-white/70 font-semibold">Poli {k}</p>
                  <p className="text-xl font-extrabold mt-1 text-[#d9f4e1]">
                    {firstWaiting?.ticket ?? '—'}
                  </p>
                  <p className="text-[11px] text-white/50 mt-1">
                    {waitingInPoly.length} pasien menunggu
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Kolom Samping: Log Notifikasi Digital & Antrean Menunggu */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="p-5 flex-1">
            <h2 className="font-bold text-ink">Simulasi Notifikasi Pasien</h2>
            <p className="text-xs text-muted">Integrasi pesan WhatsApp &amp; SMS otomatis</p>

            <div className="mt-4 space-y-3">
              {toast && (
                <div className="rounded-xl border border-primary bg-primary-soft p-3.5 flex gap-3 animate-pulse">
                  <div className="size-9 rounded-full bg-primary text-white grid place-items-center text-xs font-bold shrink-0">
                    SMS
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-primary-dark">Panggilan Masuk:</p>
                    <p className="text-sm text-ink mt-0.5">{toast}</p>
                    <Badge t="green" className="mt-1">
                      Terkirim Otomatis
                    </Badge>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-line p-3.5 flex gap-3 bg-gray-50/50">
                <div className="size-9 rounded-full bg-[#25d366] text-white grid place-items-center text-xs font-bold shrink-0">
                  WA
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted">WhatsApp Gateway</p>
                  <p className="text-sm text-ink mt-0.5">
                    Tiket <b>{active[active.length - 1]?.ticket ?? 'A-012'}</b> berhasil diterbitkan.
                    Estimasi waktu tunggu ~15 menit.
                  </p>
                  <Badge t="green" className="mt-1.5">
                    Terkirim ke Pasien
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick List: Pasien Dalam Antrean */}
          <Card className="p-5 flex-1">
            <h3 className="font-bold text-ink text-sm">Urutan Menunggu Berikutnya</h3>
            <div className="mt-3 divide-y divide-line max-h-48 overflow-y-auto pr-1">
              {active.filter((q) => q.status === 'Menunggu').length === 0 ? (
                <p className="text-xs text-muted py-3 text-center">Semua antrean telah dilayani.</p>
              ) : (
                active
                  .filter((q) => q.status === 'Menunggu')
                  .sort((a, b) => Number(b.priority) - Number(a.priority) || a.id - b.id)
                  .map((item, idx) => (
                    <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-ink">
                          {idx + 1}. {item.ticket}
                        </span>
                        <span className="text-muted ml-2">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.priority && <Badge t="teal">Prioritas</Badge>}
                        <span className="text-muted">{item.poly}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

