import {
  createClient,
  SupabaseClient,
  RealtimeChannel,
} from "@supabase/supabase-js"
import type { Entry, QueueStatus } from "../types/queue"
import type { AuthRole, AuthSession } from "../types/auth"
import { initialSeed } from "../types/queue"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

const STORAGE_KEY = "klinik_sehat_queue_local"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isAuthRole(value: unknown): value is AuthRole {
  return value === "pasien" || value === "staf" || value === "dokter"
}

function parseAuthSession(payload: unknown): AuthSession | null {
  if (!isRecord(payload) || !isRecord(payload.data)) return null

  const { user } = payload.data
  if (
    !isRecord(user) ||
    typeof user.id !== "string" ||
    typeof user.identifier !== "string" ||
    typeof user.name !== "string" ||
    !isAuthRole(user.role) ||
    (user.poly !== undefined && typeof user.poly !== "string")
  ) {
    return null
  }

  return {
    user: {
      id: user.id,
      identifier: user.identifier,
      name: user.name,
      role: user.role,
      ...(typeof user.poly === "string" ? { poly: user.poly } : {}),
    },
  }
}

async function postAuth(
  endpoint: "login" | "register" | "verify-reset" | "reset-password",
  body: Record<string, string>,
): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      "Tidak dapat terhubung ke server autentikasi. Coba lagi beberapa saat.",
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error("Server autentikasi mengirim respons yang tidak valid.")
  }

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : "Autentikasi gagal. Silakan coba kembali."
    throw new Error(message)
  }

  return payload
}

// Inisialisasi client Supabase di frontend untuk fitur Realtime (Live TV Monitor)
export let supabaseFrontend: SupabaseClient | null = null

if (
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("your-project-id")
) {
  try {
    supabaseFrontend = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  } catch (e) {
    console.error("Gagal inisialisasi Supabase di Frontend:", e)
  }
}

// Local storage fallback helpers
function getLocalQueues(): Entry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) return JSON.parse(data)
  } catch (e) {
    console.warn("Gagal membaca localStorage:", e)
  }
  return initialSeed
}

function saveLocalQueues(queues: Entry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queues))
  } catch (e) {
    console.warn("Gagal menyimpan ke localStorage:", e)
  }
}

export const api = {
  async login(identifier: string, password: string): Promise<AuthSession> {
    const session = parseAuthSession(
      await postAuth("login", { identifier, password }),
    )
    if (!session) {
      throw new Error("Respons autentikasi tidak berisi data akun yang valid.")
    }
    return session
  },

  async registerPatientAccount(
    name: string,
    identifier: string,
    whatsapp: string,
    password: string,
    birthDate: string,
  ): Promise<AuthSession> {
    const session = parseAuthSession(
      await postAuth("register", {
        name,
        identifier,
        whatsapp,
        password,
        birthDate,
      }),
    )
    if (!session) {
      throw new Error("Respons pendaftaran tidak berisi data akun yang valid.")
    }
    return session
  },

  async verifyPasswordReset(
    identifier: string,
    whatsapp: string,
  ): Promise<string> {
    const payload = await postAuth("verify-reset", { identifier, whatsapp })
    if (
      isRecord(payload) &&
      isRecord(payload.data) &&
      typeof payload.data.challengeId === "string"
    ) {
      return payload.data.challengeId
    }
    throw new Error("Respons verifikasi reset tidak valid.")
  },

  async resetPassword(
    challengeId: string,
    newPassword: string,
  ): Promise<void> {
    const payload = await postAuth("reset-password", {
      challengeId,
      newPassword,
    })
    if (!isRecord(payload) || payload.success !== true) {
      throw new Error("Kata sandi gagal diperbarui.")
    }
  },

  /**
   * Cek status koneksi Express Backend & Supabase
   */
  async checkHealth(): Promise<{
    online: boolean
    supabaseConnected: boolean
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: "GET" })
      if (!res.ok) throw new Error("Bad response")
      const json = await res.json()
      return {
        online: true,
        supabaseConnected: Boolean(json.supabaseConnected),
      }
    } catch {
      return { online: false, supabaseConnected: false }
    }
  },

  /**
   * Ambil daftar semua antrean
   */
  async getQueues(): Promise<{
    data: Entry[]
    source: "express" | "local"
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/queues`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          saveLocalQueues(json.data) // sinkronkan backup lokal
          return { data: json.data, source: "express" }
        }
      }
    } catch {
      // Backend offline, fallback ke local
    }
    return { data: getLocalQueues(), source: "local" }
  },

  /**
   * Pendaftaran antrean baru (Online atau Walk-in)
   */
  async register(payload: {
    name: string
    nik: string
    phone: string
    poly: string
    cat: "JKN" | "Umum"
    priority: boolean
    channel: "Online" | "Walk-In"
  }): Promise<Entry> {
    try {
      const res = await fetch(`${API_BASE_URL}/queues/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          return json.data
        }
      }
    } catch {
      // Fallback local
    }

    // Fallback logic lokal
    const local = getLocalQueues()
    const code =
      payload.poly === "Gigi" ? "B" : payload.poly === "Anak" ? "C" : "A"
    let highestNum = 0
    local.forEach((q) => {
      if (q.ticket && q.ticket.startsWith(`${code}-`)) {
        const num = parseInt(q.ticket.split("-")[1], 10)
        if (!isNaN(num) && num > highestNum) highestNum = num
      }
    })
    if (highestNum === 0) highestNum = code === "A" ? 12 : code === "C" ? 4 : 0

    const nextTicket =
      payload.channel === "Online"
        ? `${code}-${String(highestNum + 1).padStart(3, "0")}`
        : undefined

    const newItem: Entry = {
      id: Date.now(),
      name: payload.name,
      nik: payload.nik,
      phone: payload.phone,
      poly: payload.poly,
      cat: payload.cat,
      priority: payload.priority,
      channel: payload.channel,
      ticket: nextTicket,
      status: "Menunggu",
      timestamp: Date.now(),
    }
    const updated = [...local, newItem]
    saveLocalQueues(updated)
    return newItem
  },

  /**
   * Panggil antrean berikutnya berdasarkan prioritas
   */
  async callNext(polyCode?: string): Promise<Entry | null> {
    let response: Response | null = null
    try {
      response = await fetch(`${API_BASE_URL}/queues/call-next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ polyCode }),
      })
    } catch {
      // Backend offline; use the local queue store.
    }

    if (response) {
      if (response.status === 404) return null
      const json = await response.json()
      if (response.ok && json.success && json.data) return json.data
      throw new Error(json.message || "Gagal memanggil antrean berikutnya.")
    }

    // Local fallback
    const local = getLocalQueues()
    const active = local.filter((q) => q.ticket && q.status !== "Selesai")
    const waiting = active
      .filter(
        (q) =>
          q.status === "Menunggu" &&
          (!polyCode || q.ticket?.startsWith(polyCode)),
      )
      .sort((a, b) => Number(b.priority) - Number(a.priority) || a.id - b.id)[0]

    if (!waiting) return null

    const updated = local.map((q) => {
      if (
        q.status === "Dipanggil" &&
        (!polyCode || q.ticket?.startsWith(`${polyCode}-`))
      ) {
        return { ...q, status: "Selesai" as const }
      }
      if (q.id === waiting.id) return { ...q, status: "Dipanggil" as const }
      return q
    })
    saveLocalQueues(updated)
    return { ...waiting, status: "Dipanggil" }
  },

  async updateQueueStatus(
    id: number,
    status: Extract<QueueStatus, "Selesai" | "Dilewati">,
  ): Promise<void> {
    let response: Response | null = null
    try {
      response = await fetch(`${API_BASE_URL}/queues/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
    } catch {
      // Backend offline; use the local queue store.
    }

    if (response) {
      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui status antrean.")
      }
      return
    }

    const local = getLocalQueues()
    let found = false
    const updated = local.map((entry) => {
      if (entry.id !== id) return entry
      found = true
      return { ...entry, status }
    })
    if (!found) throw new Error("Antrean tidak ditemukan.")
    saveLocalQueues(updated)
  },

  /**
   * Validasi data pasien walk-in dan terbitkan tiket
   */
  async validateWalkIn(
    id: number,
    payload: Partial<Entry>,
  ): Promise<Entry | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/queues/${id}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          return json.data
        }
      }
    } catch {
      // Fallback local
    }

    const local = getLocalQueues()
    const poly = payload.poly || "Umum"
    const code = poly === "Gigi" ? "B" : poly === "Anak" ? "C" : "A"

    let highestNum = 0
    local.forEach((q) => {
      if (q.ticket && q.ticket.startsWith(`${code}-`)) {
        const num = parseInt(q.ticket.split("-")[1], 10)
        if (!isNaN(num) && num > highestNum) highestNum = num
      }
    })
    if (highestNum === 0) highestNum = code === "A" ? 12 : code === "C" ? 4 : 0
    const ticket = `${code}-${String(highestNum + 1).padStart(3, "0")}`

    let updatedEntry: Entry | null = null
    const updated = local.map((q) => {
      if (q.id === id) {
        updatedEntry = {
          ...q,
          ...payload,
          ticket,
        }
        return updatedEntry
      }
      return q
    })
    saveLocalQueues(updated)
    return updatedEntry
  },

  /**
   * Reset antrean ke data awal
   */
  resetLocal(): Entry[] {
    saveLocalQueues(initialSeed)
    return initialSeed
  },

  /**
   * Berlangganan Supabase Realtime jika Supabase frontend aktif
   */
  subscribeRealtime(onUpdate: () => void): () => void {
    if (!supabaseFrontend) return () => {}

    let channel: RealtimeChannel | null = null
    try {
      channel = supabaseFrontend
        .channel("public:queues")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "queues" },
          () => {
            onUpdate()
          },
        )
        .subscribe()
    } catch (e) {
      console.warn("Realtime subscription error:", e)
    }

    return () => {
      if (channel) {
        supabaseFrontend?.removeChannel(channel)
      }
    }
  },
}
