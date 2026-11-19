import { useState, useEffect, useCallback } from "react"
import type { Role, Entry, Cat } from "./types/queue"
import type { AuthRole, AuthSession } from "./types/auth"
import { initialSeed } from "./types/queue"
import { api } from "./services/api"
import { Shell } from "./components/ui/Shell"
import { Landing } from "./views/Landing"
import { AuthModal } from "./views/AuthModal"
import type { AuthMode } from "./views/AuthModal"
import { PublicMonitor } from "./views/PublicMonitor"
import { PatientView } from "./views/PatientView"
import { StaffView } from "./views/StaffView"
import { SystemMonitor } from "./views/SystemMonitor"
import { DoctorView } from "./views/DoctorView"

const roleMap: Record<AuthRole, Role> = {
  pasien: "patient",
  staf: "staff",
  dokter: "doctor",
}

const dashboardVisuals: Record<
  Role,
  { backgroundImage: string; welcomeTitle: string; welcomeDescription: string }
> = {
  patient: {
    backgroundImage: "/images/bg-pasien.jpg",
    welcomeTitle: "Selamat Datang di Layanan Pasien",
    welcomeDescription:
      "Ambil nomor antrean, pantau estimasi waktu tunggu, dan cek status panggilan poli Anda.",
  },
  staff: {
    backgroundImage: "/images/bg-staf.jpg",
    welcomeTitle: "Portal Operasional Loket Pendaftaran",
    welcomeDescription:
      "Kelola verifikasi kedatangan pasien, pendaftaran langsung, dan pengaturan antrean loket.",
  },
  doctor: {
    backgroundImage: "/images/bg-dokter.jpg",
    welcomeTitle: "Panel Pemeriksaan Dokter — 3 Poli Layanan",
    welcomeDescription:
      "Kelola pemanggilan pasien secara terpisah untuk Poli Umum, Poli Gigi, dan Poli Anak.",
  },
  system: {
    backgroundImage: "/images/bg-dokter.jpg",
    welcomeTitle: "Panel Pemeriksaan Dokter — 3 Poli Layanan",
    welcomeDescription:
      "Kelola pemanggilan pasien secara terpisah untuk Poli Umum, Poli Gigi, dan Poli Anak.",
  },
}

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null)
  const role = authSession ? roleMap[authSession.user.role] : null
  const [showLanding, setShowLanding] = useState(false)
  const [tab, setTab] = useState<"main" | "display">("main")
  const [queue, setQueue] = useState<Entry[]>(initialSeed)
  const [backendOnline, setBackendOnline] = useState<boolean>(false)
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)

  const handleLogin = useCallback((session: AuthSession) => {
    setAuthSession(session)
    setShowLanding(false)
    setAuthMode(null)
    setTab("main")
  }, [])

  const handleCloseAuth = useCallback(() => setAuthMode(null), [])

  // 1. Sinkronisasi data antrean dari API / Local
  const loadQueues = useCallback(async () => {
    try {
      const res = await api.getQueues()
      if (res && res.data) {
        setQueue(res.data)
      }
    } catch (e) {
      console.warn("Gagal memuat antrean:", e)
    }
  }, [])

  // 2. Cek status Backend Express & Supabase
  const checkHealth = useCallback(async () => {
    const status = await api.checkHealth()
    setBackendOnline(status.online)
    setSupabaseConnected(status.supabaseConnected)
  }, [])

  useEffect(() => {
    checkHealth()
    loadQueues()

    // Polling berkala jika belum ada realtime
    const interval = setInterval(() => {
      checkHealth()
      loadQueues()
    }, 3000)

    // Supabase Realtime subscription
    const unsubscribe = api.subscribeRealtime(() => {
      loadQueues()
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [checkHealth, loadQueues])

  // Pendaftaran antrean baru (Online atau Walk-in)
  const handleRegister = async (payload: {
    name: string
    nik: string
    phone: string
    poly: string
    cat: Cat
    priority: boolean
    channel: "Online" | "Walk-In"
  }): Promise<Entry> => {
    const newEntry = await api.register(payload)
    await loadQueues()
    return newEntry
  }

  // Panggil antrean berikutnya
  const handleCallNext = async (polyCode?: string): Promise<Entry | null> => {
    const called = await api.callNext(polyCode)
    await loadQueues()
    return called
  }

  const handleUpdateQueueStatus = async (
    id: number,
    status: "Selesai" | "Dilewati",
  ) => {
    await api.updateQueueStatus(id, status)
    await loadQueues()
  }

  // Validasi data walk-in
  const handleValidateWalkIn = async (id: number, data: Partial<Entry>) => {
    await api.validateWalkIn(id, data)
    await loadQueues()
  }

  // Tambah walk-in baru langsung dari loket
  const handleAddNewWalkIn = async (data: {
    name: string
    nik: string
    phone: string
    poly: string
    cat: Cat
    priority: boolean
    channel: "Walk-In"
  }) => {
    await api.register(data)
    await loadQueues()
  }

  if (window.location.pathname === "/monitor") {
    return <PublicMonitor queue={queue} backendOnline={backendOnline} />
  }

  if (!role || showLanding) {
    return (
      <>
        <Landing
          queue={queue}
          backendOnline={backendOnline}
          onAuthRequested={setAuthMode}
          sessionRole={authSession?.user.role ?? null}
          onDashboardRequested={() => setShowLanding(false)}
          onLogout={() => {
            setAuthSession(null)
            setShowLanding(true)
          }}
        />
        {authMode && (
          <AuthModal
            key={authMode}
            initialMode={authMode}
            onLogin={handleLogin}
            onClose={handleCloseAuth}
          />
        )}
      </>
    )
  }

  const roleLabelMap: Record<Role, string> = {
    patient: "Pasien",
    staff: "Petugas Loket",
    doctor: "Dokter",
    system: "Monitor Layar TV",
  }

  return (
    <Shell
      role={roleLabelMap[role]}
      {...dashboardVisuals[role]}
      backendOnline={backendOnline}
      supabaseConnected={supabaseConnected}
      onHome={() => setShowLanding(true)}
      onLogout={() => {
        setAuthSession(null)
        setShowLanding(true)
      }}
      onRefresh={loadQueues}
    >
      {role === "patient" && (
        <PatientView queue={queue} onRegister={handleRegister} />
      )}

      {role === "staff" && (
        <>
          <div className="mb-6 inline-flex p-1 bg-gray-100 rounded-xl gap-1">
            {([
              ["main", "Meja Loket Pendaftaran"],
              ["display", "Monitor TV Publik"],
            ] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`h-9 px-4 rounded-lg text-sm font-semibold transition ${
                  tab === k
                    ? "bg-white text-primary-dark shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === "main" ? (
            <StaffView
              queue={queue}
              onValidateWalkIn={handleValidateWalkIn}
              onAddNewWalkIn={handleAddNewWalkIn}
            />
          ) : (
            <SystemMonitor queue={queue} onCallNext={handleCallNext} />
          )}
        </>
      )}

      {role === "system" && (
        <SystemMonitor queue={queue} onCallNext={handleCallNext} />
      )}

      {role === "doctor" && (
        <DoctorView
          queue={queue}
          onCallNext={handleCallNext}
          onUpdateStatus={handleUpdateQueueStatus}
        />
      )}
    </Shell>
  )
}
