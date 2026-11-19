import { useState } from 'react'
import type { Entry, Cat } from '../types/queue'
import { POLY, validate } from '../types/queue'
import { Card } from '../components/ui/Card'
import { Btn } from '../components/ui/Btn'
import { Badge } from '../components/ui/Badge'
import { Field } from '../components/ui/Field'

interface StaffViewProps {
  queue: Entry[]
  onValidateWalkIn: (id: number, data: Partial<Entry>) => Promise<void>
  onAddNewWalkIn: (data: {
    name: string
    nik: string
    phone: string
    poly: string
    cat: Cat
    priority: boolean
    channel: 'Walk-In'
  }) => Promise<void>
  onDelete?: (id: number) => Promise<void>
}

export function StaffView({ queue, onValidateWalkIn, onAddNewWalkIn }: StaffViewProps) {
  const [edit, setEdit] = useState<Entry | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const walkins = queue.filter((q) => q.channel === 'Walk-In')
  const flagged = walkins.filter((w) => !w.ticket)

  const filteredWalkins = walkins.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.nik.includes(search) ||
      (w.ticket && w.ticket.toLowerCase().includes(search.toLowerCase()))
  )

  const errs = edit ? validate(edit) : {}

  const handleOpenNew = () => {
    setIsNew(true)
    setEdit({
      id: Date.now(),
      name: '',
      nik: '',
      phone: '',
      poly: 'Umum',
      cat: 'Umum',
      priority: false,
      channel: 'Walk-In',
      status: 'Menunggu',
    })
  }

  const handleConfirm = async () => {
    if (!edit || Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      if (isNew) {
        await onAddNewWalkIn({
          name: edit.name,
          nik: edit.nik,
          phone: edit.phone,
          poly: edit.poly,
          cat: edit.cat,
          priority: edit.priority,
          channel: 'Walk-In',
        })
      } else {
        await onValidateWalkIn(edit.id, edit)
      }
      setEdit(null)
      setIsNew(false)
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan data pasien walk-in')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Loket Pendaftaran</h1>
          <p className="text-muted mt-1">Registrasi walk-in dan koreksi data pasien sebelum pemeriksaan.</p>
        </div>
        {flagged.length > 0 && (
          <Badge t="red" className="px-3 py-1 text-sm font-semibold">
            ⚠️ {flagged.length} data perlu perbaikan
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          { l: 'Total Walk-In Hari Ini', v: walkins.length, color: 'text-ink' },
          { l: 'Data Perlu Koreksi', v: flagged.length, color: flagged.length ? 'text-red-600' : 'text-ink' },
          { l: 'Menunggu Dipanggil', v: queue.filter((q) => q.status === 'Menunggu' && q.ticket).length, color: 'text-primary' },
        ].map((item) => (
          <Card key={item.l} className="p-5">
            <p className="text-xs text-muted font-medium uppercase tracking-wider">{item.l}</p>
            <p className={`text-3xl font-extrabold mt-1 ${item.color}`}>{item.v}</p>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="mt-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex flex-wrap justify-between items-center gap-3 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-ink">Daftar Pasien Walk-In</h2>
            <span className="text-xs text-muted">({filteredWalkins.length} pasien)</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Cari nama / NIK / tiket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border border-line bg-white outline-none focus:border-primary w-48 sm:w-64"
            />
            <Btn className="h-9 px-4 text-xs font-semibold" onClick={handleOpenNew}>
              + Pasien Walk-In
            </Btn>
          </div>
        </div>

        <ul className="divide-y divide-line">
          {filteredWalkins.length === 0 ? (
            <li className="p-8 text-center text-muted text-sm">Tidak ada data pasien walk-in yang sesuai.</li>
          ) : (
            filteredWalkins.map((w) => {
              const fl = validate(w)
              const bad = !w.ticket

              return (
                <li
                  key={w.id}
                  className={`px-5 py-4 flex flex-wrap items-center justify-between gap-3 transition hover:bg-canvas ${
                    bad ? 'bg-red-50/30' : ''
                  }`}
                >
                  <div className="flex-1 min-w-48">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{w.name || '(Nama belum diisi)'}</p>
                      {w.priority && <Badge t="teal">Prioritas</Badge>}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      NIK: {w.nik || '-'} • HP: {w.phone || '-'} • Poli {w.poly} ({w.cat})
                    </p>
                    {bad && (
                      <ul className="mt-1.5 space-y-0.5">
                        {Object.values(fl).map((m) => (
                          <li key={m} className="text-xs text-red-600 font-medium">
                            • {m}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {bad ? (
                      <Badge t="red">Data Belum Lengkap</Badge>
                    ) : (
                      <Badge t="green" className="text-sm px-3 py-1 font-bold">
                        {w.ticket}
                      </Badge>
                    )}

                    <Btn
                      variant={bad ? 'primary' : 'ghost'}
                      className="h-9 px-4 text-xs"
                      onClick={() => {
                        setIsNew(false)
                        setEdit(w)
                      }}
                    >
                      {bad ? 'Perbaiki & Terbitkan' : 'Edit Data'}
                    </Btn>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </Card>

      {/* Modal Dialog Form Walk-In */}
      {edit && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm grid place-items-center p-4 z-50 animate-fadeIn"
          onClick={() => setEdit(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <Card className="p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-ink">
                {isNew ? 'Registrasi Pasien Walk-In Baru' : 'Koreksi & Konfirmasi Data Pasien'}
              </h3>
              <p className="text-xs text-muted mt-1">
                Pastikan data KTP dan nomor telepon pasien valid sebelum nomor tiket diterbitkan.
              </p>

              {Object.keys(errs).length > 0 && (
                <div className="mt-3 rounded-xl bg-accent-soft text-[#805500] text-sm px-3.5 py-2.5">
                  Terdapat {Object.keys(errs).length} data yang belum memenuhi syarat validasi.
                </div>
              )}

              <div className="mt-4 space-y-3.5">
                <Field
                  label="Nama Lengkap"
                  value={edit.name}
                  error={errs.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  placeholder="Sesuai KTP"
                  required
                />
                <Field
                  label="NIK (16 Digit)"
                  inputMode="numeric"
                  maxLength={16}
                  value={edit.nik}
                  error={errs.nik}
                  onChange={(e) => setEdit({ ...edit, nik: e.target.value })}
                  placeholder="3171xxxxxxxxxxxx"
                  required
                />
                <Field
                  label="Nomor WhatsApp / HP"
                  inputMode="tel"
                  value={edit.phone}
                  error={errs.phone}
                  onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-ink">
                    Poli
                    <select
                      className="mt-1.5 w-full h-11 rounded-xl border border-line px-3 bg-white text-sm outline-none focus:border-primary"
                      value={edit.poly}
                      onChange={(e) => setEdit({ ...edit, poly: e.target.value })}
                    >
                      {Object.keys(POLY).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-ink">
                    Kategori
                    <select
                      className="mt-1.5 w-full h-11 rounded-xl border border-line px-3 bg-white text-sm outline-none focus:border-primary"
                      value={edit.cat}
                      onChange={(e) => setEdit({ ...edit, cat: e.target.value as Cat })}
                    >
                      <option value="Umum">Umum</option>
                      <option value="JKN">BPJS / JKN</option>
                    </select>
                  </label>
                </div>

                <label className="flex items-center gap-2.5 text-xs font-medium text-ink pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={edit.priority}
                    onChange={(e) => setEdit({ ...edit, priority: e.target.checked })}
                  />
                  Prioritas (Lansia / Hamil / Disabilitas)
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Btn variant="ghost" onClick={() => setEdit(null)}>
                  Batal
                </Btn>
                <Btn
                  disabled={Object.keys(errs).length > 0 || saving}
                  onClick={handleConfirm}
                >
                  {saving ? 'Menyimpan…' : isNew ? 'Terbitkan Tiket' : 'Konfirmasi & Terbitkan'}
                </Btn>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

