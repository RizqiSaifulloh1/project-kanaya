import type { Entry } from "../types/queue"
import { POLY } from "../types/queue"
import { Logo } from "../components/ui/Logo"
import type { AuthMode } from "./AuthModal"
import type { AuthRole } from "../types/auth"

interface LandingProps {
  queue: Entry[]
  backendOnline: boolean
  onAuthRequested: (mode: AuthMode) => void
  sessionRole: AuthRole | null
  onDashboardRequested: () => void
  onLogout: () => void
}

const clinicAddress =
  "Jl. Raya Mastrip No. 396, Kebraon, Kec. Karangpilang, Surabaya 60222"

const serviceDetails = [
  {
    name: "Umum",
    description: POLY.Umum.desc,
    icon: "✚",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    name: "Gigi",
    description: POLY.Gigi.desc,
    icon: "✦",
    tone: "bg-cyan-50 text-cyan-700",
  },
  {
    name: "Anak",
    description: POLY.Anak.desc,
    icon: "♡",
    tone: "bg-amber-50 text-amber-700",
  },
]

function isClinicOpen(now: Date) {
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()
  return day >= 1 && day <= 6 && minutes >= 9 * 60 && minutes < 17 * 60
}

export function Landing({
  queue,
  backendOnline,
  onAuthRequested,
  sessionRole,
  onDashboardRequested,
  onLogout,
}: LandingProps) {
  const waitingCount = queue.filter((entry) => entry.status === "Menunggu").length
  const currentEntry = queue.find((entry) => entry.status === "Dipanggil")
  const estimatedWait = Math.max(5, waitingCount * 8 + 5)
  const clinicOpen = isClinicOpen(new Date())
  const dashboardLabel = sessionRole
    ? {
        pasien: "Dashboard Pasien",
        staf: "Dashboard Loket",
        dokter: "Dashboard Dokter",
      }[sessionRole]
    : ""
  const handlePrimaryAction = () => {
    if (sessionRole) {
      onDashboardRequested()
    } else {
      onAuthRequested("login")
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-19 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Kembali ke Beranda"
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg sm:gap-3"
          >
            <Logo className="h-8 sm:h-12" />
            <span className="max-w-19 text-[9px] font-bold leading-2.5 tracking-tight text-slate-900 sm:max-w-none sm:text-sm sm:leading-normal">
              Nayaka Antrean Digital
            </span>
          </button>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex"
          >
            <a className="transition hover:text-emerald-700" href="#services">
              Layanan Poli
            </a>
            <a className="transition hover:text-emerald-700" href="#flow">
              Alur Antrean
            </a>
            <a className="transition hover:text-emerald-700" href="#location">
              Jadwal &amp; Lokasi
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {sessionRole ? (
              <>
                <button
                  type="button"
                  onClick={onDashboardRequested}
                  className="h-10 rounded-xl bg-emerald-700 px-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-4 sm:text-sm"
                >
                  {dashboardLabel}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="h-10 rounded-xl border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:px-4 sm:text-sm"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onAuthRequested("register")}
                  className="h-10 rounded-xl border border-emerald-700 px-2.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 sm:px-4 sm:text-sm"
                >
                  Daftar Pasien
                </button>
                <button
                  type="button"
                  onClick={() => onAuthRequested("login")}
                  className="h-10 rounded-xl bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-5 sm:text-sm"
                >
                  Masuk
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-teal-50/70">
        <div className="pointer-events-none absolute -right-36 -top-32 size-112 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-28 size-112 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm sm:text-sm">
              <span aria-hidden="true">✦</span>
              Sistem Antrean Digital <span className="text-emerald-400">•</span>
              FKTP BPJS &amp; Umum
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.55rem]">
              Antrean Klinik Lebih Cepat,{" "}
              <span className="text-emerald-700">Tanpa Menunggu Lama</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Daftar berobat dari rumah, pantau nomor antrean secara real-time,
              dan dapatkan estimasi waktu panggilan di Klinik Pratama Nayaka
              Husada Kebraon.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-800"
              >
                {sessionRole ? "Kembali ke Dashboard" : "Ambil Antrean Sekarang"}{" "}
                <span aria-hidden="true">→</span>
              </button>
              <a
                href="/monitor"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span aria-hidden="true">▣</span> Buka Layar Monitor TV
              </a>
            </div>
            <div className="mt-9 grid gap-3 text-sm text-slate-600 sm:grid-cols-3 sm:gap-5">
              {[
                ["✓", "Terintegrasi BPJS Kesehatan"],
                ["◷", "Estimasi Waktu Real-Time"],
                ["♡", "Jalur Prioritas Lansia"],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {icon}
                  </span>
                  <span className="font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-140 lg:ml-auto">
            <div className="absolute -inset-4 rounded-4xl bg-emerald-200/50 blur-2xl" />
            <div className="relative h-97.5 overflow-hidden rounded-[1.75rem] border border-white shadow-2xl shadow-emerald-950/15 sm:h-117.5">
              <img
                src="/images/gedung-nayaka.jpg"
                alt="Gedung Klinik Nayaka Husada"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-slate-950/10 to-slate-950/20" />
              <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-slate-950/35 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                  </span>
                  Status Antrean Live Hari Ini
                </div>
                <span
                  className={`rounded-full border px-3 py-2 text-[11px] font-semibold backdrop-blur-md sm:text-xs ${
                    clinicOpen
                      ? "border-emerald-200/50 bg-emerald-500/90 text-white"
                      : "border-white/30 bg-slate-950/45 text-white"
                  }`}
                >
                  {clinicOpen ? "Loket Pendaftaran Buka" : "Loket Pendaftaran Tutup"}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-xl backdrop-blur-lg sm:bottom-6 sm:left-6 sm:right-6 sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Sedang dipanggil
                    </p>
                    <p className="mt-0.5 text-2xl font-bold tracking-tight text-emerald-800">
                      {currentEntry?.ticket ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
                    <p className="text-[11px] font-medium text-emerald-700">
                      Estimasi Tunggu
                    </p>
                    <p className="text-sm font-bold text-emerald-900">
                      ±{estimatedWait} Menit
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {serviceDetails.map((service) => {
                    const waiting = queue.filter(
                      (entry) =>
                        entry.poly === service.name &&
                        entry.status === "Menunggu",
                    ).length
                    return (
                      <div
                        key={service.name}
                        className="rounded-xl bg-slate-50 px-2 py-2.5 text-center"
                      >
                        <p className="text-[11px] font-medium text-slate-500">
                          Poli {service.name}
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-800">
                          {waiting} menunggu
                        </p>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-3 text-center text-[11px] text-slate-400">
                  Data antrean diperbarui otomatis
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Layanan Klinik
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Pilih layanan yang Anda butuhkan
            </h2>
            <p className="mt-3 text-slate-600">
              Tiga layanan poli dengan jadwal yang mudah diingat.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {serviceDetails.map((service) => (
              <article
                key={service.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <span
                  className={`grid size-12 place-items-center rounded-2xl text-xl font-bold ${service.tone}`}
                  aria-hidden="true"
                >
                  {service.icon}
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Poli {service.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{service.description}</p>
                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <span className="text-emerald-700" aria-hidden="true">◷</span>
                  Senin – Sabtu, 09.00 – 17.00 WIB
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="flow"
        className="scroll-mt-24 bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Alur Antrean
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Tiga langkah, lebih praktis
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["01", "Masuk atau daftar", "Buat akun pasien untuk mulai menggunakan layanan antrean."],
              ["02", "Pilih poli dan layanan", "Tentukan poli, kategori pasien, dan kebutuhan prioritas."],
              ["03", "Pantau nomor antrean", "Lihat status dan estimasi panggilan dari rumah."],
            ].map(([number, title, description]) => (
              <article
                key={number}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <span className="text-sm font-bold tracking-widest text-emerald-700">
                  {number}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              {sessionRole ? "Kembali ke Dashboard" : "Mulai Ambil Antrean"}{" "}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      <footer
        id="location"
        className="scroll-mt-24 bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="inline-flex rounded-xl bg-white px-2 py-1">
              <Logo />
            </div>
            <h2 className="mt-4 text-xl font-bold">Klinik Pratama Nayaka Husada</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
              Layanan kesehatan tingkat pertama untuk pasien JKN/BPJS dan umum
              di Kebraon, Surabaya.
            </p>
          </div>
          <div className="grid gap-3 text-sm leading-6 text-slate-300 sm:grid-cols-2">
            <p>
              <span className="block font-semibold text-white">Alamat</span>
              {clinicAddress}
            </p>
            <p>
              <span className="block font-semibold text-white">Jadwal</span>
              Senin – Sabtu, 09.00 – 17.00 WIB
            </p>
            <p>
              <span className="block font-semibold text-white">Kode Faskes BPJS</span>
              0217B035
            </p>
            <p>
              <span className="block font-semibold text-white">Telepon / WhatsApp</span>
              (031) 99750803 / 0857-3159-4892
            </p>
          </div>
        </div>
        <div className="mx-auto mt-9 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© Klinik Pratama Nayaka Husada Kebraon</p>
          <p className="inline-flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                backendOnline ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            {backendOnline ? "Backend Express Aktif" : "Backend Offline · Mode lokal"}
          </p>
        </div>
      </footer>
    </main>
  )
}
