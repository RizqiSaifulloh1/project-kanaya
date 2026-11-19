import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { Entry, Cat } from '../types/queue'
import { POLY, validate } from '../types/queue'
import { Card } from '../components/ui/Card'
import { Btn } from '../components/ui/Btn'
import { Badge } from '../components/ui/Badge'
import { Field } from '../components/ui/Field'
import { Pipeline } from '../components/ui/Pipeline'

interface PatientViewProps {
  queue: Entry[]
  onRegister: (payload: {
    name: string
    nik: string
    phone: string
    poly: string
    cat: Cat
    priority: boolean
    channel: 'Online' | 'Walk-In'
  }) => Promise<Entry>
}

export function PatientView({ queue, onRegister }: PatientViewProps) {
  const [view, setView] = useState<'choose' | 'form' | 'processing' | 'ticket' | 'walkin'>('choose')
  const [step, setStep] = useState(0)
  const [f, setF] = useState({
    name: '',
    nik: '',
    phone: '',
    poly: 'Umum',
    cat: 'Umum' as Cat,
    priority: false,
  })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [stage, setStage] = useState(0)
  const [mine, setMine] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: unknown) => {
    const next = { ...f, [k]: v } as typeof f
    setF(next)

    const currentErrors = validate(next)
    setErrs((previous) => {
      const nextErrors = { ...previous }
      delete nextErrors[k]
      if (currentErrors[k]) {
        nextErrors[k] = currentErrors[k]
      }
      return nextErrors
    })
  }

  const next = async () => {
    if (step === 0) {
      const e = validate(f)
      setErrs(e)
      if (Object.keys(e).length > 0) return
    }
    if (step < 2) {
      return setStep(step + 1)
    }

    // Eksekusi pendaftaran
    setView('processing')
    setStage(0)
    setTimeout(() => setStage(1), 700)
    setTimeout(() => setStage(2), 1400)

    try {
      setLoading(true)
      const res = await onRegister({
        ...f,
        channel: 'Online',
      })
      setTimeout(() => {
        setMine(res)
        setStage(3)
        setView('ticket')
        setLoading(false)
      }, 2100)
    } catch (err) {
      console.error(err)
      setLoading(false)
      setView('form')
      alert('Terjadi kesalahan saat menerbitkan tiket antrean.')
    }
  }

  const live = mine && queue.find((q) => q.id === mine.id)
  const ahead = mine
    ? queue.filter(
        (q) =>
          q.status === 'Menunggu' &&
          q.ticket &&
          mine.ticket &&
          q.ticket[0] === mine.ticket[0] &&
          q.id < mine.id
      ).length
    : 0

  if (view === 'choose') {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Halo, Pasien</h1>
        <p className="text-muted mt-1">Pilih metode pendaftaran antrean Anda hari ini.</p>
        <div className="grid sm:grid-cols-2 gap-5 mt-8 max-w-3xl">
          {[
            {
              k: 'form',
              t: 'Pendaftaran Online',
              d: 'Isi data dari rumah, dapatkan tiket QR digital dan estimasi waktu tunggu secara langsung.',
              b: 'Direkomendasikan',
            },
            {
              k: 'walkin',
              t: 'Walk-In di Klinik',
              d: 'Bagi pasien yang datang langsung ke meja pendaftaran. Petugas kami akan membantu input data.',
              b: 'Di Loket',
            },
          ].map((c) => (
            <button
              key={c.k}
              onClick={() => {
                setView(c.k as 'form' | 'walkin')
                setStep(0)
              }}
              className="text-left group cursor-pointer"
            >
              <Card className="p-6 h-full transition group-hover:border-primary group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_28px_rgba(22,138,69,0.12)]">
                <Badge t={c.k === 'form' ? 'teal' : 'gray'}>{c.b}</Badge>
                <h3 className="text-xl font-bold mt-4 text-ink">{c.t}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{c.d}</p>
                <span className="inline-block mt-5 text-sm font-semibold text-primary">
                  Mulai Pendaftaran →
                </span>
              </Card>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'walkin') {
    return (
      <Card className="max-w-lg mx-auto p-8 text-center">
        <div className="size-16 mx-auto rounded-2xl bg-primary-soft grid place-items-center text-3xl">
          🏥
        </div>
        <h2 className="text-xl font-bold mt-5 text-ink">Silakan Menuju Loket Pendaftaran</h2>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          Harap bawa KTP asli dan Kartu BPJS/JKN Anda (jika ada). Petugas loket kami akan memvalidasi
          data diri Anda dan mencetakkan nomor antrean fisik.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Btn variant="ghost" onClick={() => setView('choose')}>
            Kembali
          </Btn>
        </div>
      </Card>
    )
  }

  if (view === 'processing') {
    return (
      <Card className="max-w-xl mx-auto p-8">
        <h2 className="text-lg font-bold text-center mb-8 text-ink">
          Menerbitkan Tiket Antrean Anda…
        </h2>
        <Pipeline stage={stage} />
      </Card>
    )
  }

  if (view === 'ticket' && mine) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="overflow-hidden shadow-xl border-primary/20">
          <div className="border-t-4 border-accent bg-linear-to-br from-primary to-primary-dark text-white text-center py-7 px-6">
            <Badge t="green" className="bg-white/20 text-white font-bold">
              Tiket Antrean Terbit
            </Badge>
            <p className="text-sm text-white/80 mt-3 font-medium">Nomor Antrean Anda</p>
            <div className="text-6xl font-extrabold tracking-tight mt-1">{mine.ticket}</div>
            <p className="text-white/95 mt-2 font-semibold">
              Poli {mine.poly} • {mine.cat}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <QRCodeSVG
                value={`KLINIK-SEHAT:${mine.ticket}:${mine.nik}`}
                size={140}
                level="M"
                includeMargin
              />
              <p className="text-[11px] text-muted mt-2 text-center font-medium">
                Pindai di loket atau ruang periksa dokter
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-canvas p-3.5 border border-line">
                <p className="text-xs text-muted">Estimasi Tunggu</p>
                <p className="text-xl font-bold mt-1 text-ink">
                  ~{Math.max(ahead, 0) * 8 + 5} menit
                </p>
              </div>
              <div className="rounded-xl bg-canvas p-3.5 border border-line">
                <p className="text-xs text-muted">Antrean di Depan</p>
                <p className="text-xl font-bold mt-1 text-ink">{ahead} orang</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm py-2 px-1 border-t border-line">
              <span className="text-muted font-medium">Status Langsung:</span>
              <Badge
                t={
                  live?.status === 'Dipanggil'
                    ? 'blue'
                    : live?.status === 'Selesai' || live?.status === 'Dilewati'
                      ? 'gray'
                      : 'amber'
                }
              >
                {live?.status ?? 'Menunggu'}
              </Badge>
            </div>

            {mine.priority && (
              <div className="p-3 bg-accent-soft border border-accent/40 rounded-xl text-sm text-[#805500] font-medium">
                ⭐ Pasien Prioritas (Lansia / Hamil / Disabilitas)
              </div>
            )}

            <div className="flex gap-2">
              <Btn
                type="button"
                className="flex-1"
                onClick={() => window.print()}
              >
                🖨️ Cetak Tiket
              </Btn>
              <Btn
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setView('choose')
                  setMine(null)
                  setF({ ...f, name: '', nik: '', phone: '' })
                }}
              >
                Selesai
              </Btn>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <Card className="max-w-xl mx-auto p-6 sm:p-8">
      <div className="flex gap-2 mb-6">
        {['Data Diri', 'Pilihan Layanan', 'Konfirmasi'].map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
            <p className={`text-xs mt-2 ${i === step ? 'font-bold text-ink' : 'text-muted'}`}>
              {i + 1}. {s}
            </p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <Field
            label="Nama Lengkap Pasien"
            value={f.name}
            onChange={(e) => set('name', e.target.value)}
            error={errs.name}
            placeholder="Sesuai KTP"
            required
          />
          <Field
            label="Nomor Induk Kependudukan (NIK)"
            inputMode="numeric"
            maxLength={16}
            value={f.nik}
            onChange={(e) => set('nik', e.target.value)}
            error={errs.nik}
            placeholder="16 digit angka KTP"
            required
          />
          <Field
            label="Nomor WhatsApp / HP"
            inputMode="numeric"
            value={f.phone}
            onChange={(e) => set('phone', e.target.value)}
            error={errs.phone}
            placeholder="08xxxxxxxxxx"
            required
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold mb-2 text-ink">Pilih Poli Tujuan</p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(POLY).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set('poly', k)}
                  className={`rounded-xl border p-3 text-left transition hover:border-primary ${
                    f.poly === k
                      ? 'border-primary bg-primary-soft ring-2 ring-primary/20'
                      : 'border-line bg-white'
                  }`}
                >
                  <p className="font-bold text-sm text-ink">{k}</p>
                  <p className="text-xs text-muted mt-0.5">{v.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2 text-ink">Kategori Pasien</p>
            <div className="grid grid-cols-2 gap-3">
              {(['JKN', 'Umum'] as Cat[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('cat', c)}
                  className={`h-11 rounded-xl border text-sm font-semibold transition hover:border-primary ${
                    f.cat === c
                      ? 'border-primary bg-primary-soft text-primary-dark ring-2 ring-primary/20'
                      : 'border-line bg-white text-ink'
                  }`}
                >
                  {c === 'JKN' ? 'BPJS / JKN' : 'Pasien Umum'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm p-3 rounded-xl border border-line bg-canvas cursor-pointer hover:bg-gray-100/60 transition">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={f.priority}
              onChange={(e) => set('priority', e.target.checked)}
            />
            <span className="font-medium text-ink">
              Lansia / Ibu Hamil / Penyandang Disabilitas (Jalur Prioritas)
            </span>
          </label>
        </div>
      )}

      {step === 2 && (
        <dl className="text-sm divide-y divide-line">
          {[
            ['Nama Pasien', f.name],
            ['NIK', f.nik],
            ['Nomor HP', f.phone],
            ['Poli Tujuan', `Poli ${f.poly}`],
            ['Kategori', f.cat === 'JKN' ? 'BPJS / JKN' : 'Pasien Umum'],
            ['Jalur Prioritas', f.priority ? 'Ya (Aktif)' : 'Tidak'],
          ].map(([a, b]) => (
            <div key={a} className="flex justify-between py-2.5">
              <dt className="text-muted">{a}</dt>
              <dd className="font-semibold text-ink">{b}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex justify-between mt-8">
        <Btn
          variant="ghost"
          type="button"
          onClick={() => (step === 0 ? setView('choose') : setStep(step - 1))}
        >
          Kembali
        </Btn>
        <Btn type="button" disabled={loading} onClick={next}>
          {step === 2 ? (loading ? 'Memproses…' : 'Ambil Nomor Antrean') : 'Lanjut'}
        </Btn>
      </div>
    </Card>
  )
}

