import { Router, Request, Response } from "express"

import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto"

import { isSupabaseConfigured } from "../supabase.js"

type AccountRole = "pasien" | "staf" | "dokter"

interface Account {
  id: string

  identifier: string
  whatsapp: string
  birthDate?: string
  name: string

  role: AccountRole

  salt: Buffer

  passwordHash: Buffer

  poly?: string
}

const demoCredentials = [
  {
    id: "demo-patient",

    identifier: "3171234567890001",
    whatsapp: "081234567890",
    password: "Pasien123!",

    name: "Budi Santoso",

    role: "pasien",
  },

  {
    id: "demo-staff",

    identifier: "PETUGAS001",
    whatsapp: "081355500001",
    password: "Staf123!",

    name: "Petugas Klinik",

    role: "staf",
  },

  {
    id: "demo-doctor",

    identifier: "dokter@nayaka.test",
    whatsapp: "081355500002",
    password: "Dokter123!",

    name: "dr. Siti Rahma",

    role: "dokter",

    poly: "Umum",
  },
] as const

interface ResetChallenge {
  accountId: string
  expiresAt: number
}

const resetChallenges = new Map<string, ResetChallenge>()

function normalizeWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("62")) return `0${digits.slice(2)}`
  if (digits.startsWith("8")) return `0${digits}`
  return digits
}

function createAccount(
  account: Omit<Account, "salt" | "passwordHash"> & { password: string },
): Account {
  const salt = randomBytes(16)

  return {
    id: account.id,

    identifier: account.identifier,

    whatsapp: account.whatsapp,

    birthDate: account.birthDate,

    name: account.name,

    role: account.role,

    poly: account.poly,

    salt,

    passwordHash: scryptSync(account.password, salt, 64),
  }
}

const memoryAccounts: Account[] = isSupabaseConfigured
  ? []
  : demoCredentials.map((account) =>
      createAccount({
        ...account,

        identifier: account.identifier.toLowerCase(),
      }),
    )

export const authRouter = Router()

export function logDemoAccounts(): void {
  if (isSupabaseConfigured || process.env.NODE_ENV === "production") return

  console.log("🧪 [Auth] Akun demo Memory Mode (khusus pengembangan):")

  console.table(
    demoCredentials.map(({ identifier, whatsapp, password, role }) => ({
      identifier,

      whatsapp,

      password,

      role,
    })),
  )
}

function sendUnsupportedSupabaseAuth(res: Response): void {
  res.status(503).json({
    success: false,

    message:
      "Autentikasi akun Supabase belum dikonfigurasi. Login demo hanya tersedia saat server berjalan dalam Memory Mode.",
  })
}

function sendSession(res: Response, account: Account, status = 200): void {
  res.status(status).json({
    success: true,

    data: {
      user: {
        id: account.id,

        identifier: account.identifier,

        name: account.name,

        role: account.role,

        ...(account.poly ? { poly: account.poly } : {}),
      },
    },
  })
}

authRouter.post("/login", (req: Request, res: Response): void => {
  if (isSupabaseConfigured) {
    sendUnsupportedSupabaseAuth(res)

    return
  }

  const identifier =
    typeof req.body?.identifier === "string"
      ? req.body.identifier.trim().toLowerCase()
      : ""
  const password =
    typeof req.body?.password === "string" ? req.body.password : ""

  if (!identifier) {
    res
      .status(400)
      .json({
        success: false,
        message: "NIK, ID petugas, atau email wajib diisi.",
      })

    return
  }

  if (!password) {
    res.status(400).json({ success: false, message: "Kata sandi wajib diisi." })

    return
  }

  if (identifier.length > 254 || password.length > 128) {
    res
      .status(400)
      .json({
        success: false,
        message: "Input login melebihi batas yang diizinkan.",
      })

    return
  }

  const account = memoryAccounts.find((item) => item.identifier === identifier)

  if (!account || account.passwordHash.length !== 64) {
    res
      .status(401)
      .json({
        success: false,
        message: "Kredensial tidak ditemukan atau tidak sesuai.",
      })

    return
  }

  const passwordHash = scryptSync(password, account.salt, 64)

  if (!timingSafeEqual(passwordHash, account.passwordHash)) {
    res
      .status(401)
      .json({
        success: false,
        message: "Kredensial tidak ditemukan atau tidak sesuai.",
      })

    return
  }

  sendSession(res, account)
})

authRouter.post("/register", (req: Request, res: Response): void => {
  if (isSupabaseConfigured) {
    sendUnsupportedSupabaseAuth(res)

    return
  }

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : ""

  const identifier =
    typeof req.body?.identifier === "string"
      ? req.body.identifier.trim().toLowerCase()
      : ""

  const whatsapp =
    typeof req.body?.whatsapp === "string"
      ? normalizeWhatsApp(req.body.whatsapp)
      : ""

  const birthDate =
    typeof req.body?.birthDate === "string" ? req.body.birthDate : ""

  const password =
    typeof req.body?.password === "string" ? req.body.password : ""

  if (name.length < 3) {
    res
      .status(400)
      .json({ success: false, message: "Nama lengkap minimal 3 karakter." })

    return
  }

  if (!/^\d{16}$/.test(identifier)) {
    res
      .status(400)
      .json({
        success: false,
        message: "NIK harus terdiri dari 16 digit angka.",
      })

    return
  }

  if (!/^08\d{8,11}$/.test(whatsapp)) {
    res.status(400).json({
      success: false,
      message: "Nomor WhatsApp harus berformat 08 dan terdiri dari 10–13 digit.",
    })

    return
  }

  const parsedBirthDate = new Date(`${birthDate}T00:00:00.000Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ||
    Number.isNaN(parsedBirthDate.getTime()) ||
    parsedBirthDate.toISOString().slice(0, 10) !== birthDate ||
    birthDate > new Date().toISOString().slice(0, 10)
  ) {
    res.status(400).json({
      success: false,
      message: "Tanggal lahir wajib diisi dengan tanggal yang valid.",
    })

    return
  }

  if (password.length < 8 || password.length > 128) {
    res
      .status(400)
      .json({
        success: false,
        message: "Kata sandi harus terdiri dari 8–128 karakter.",
      })

    return
  }

  if (memoryAccounts.some((account) => account.identifier === identifier)) {
    res
      .status(409)
      .json({ success: false, message: "NIK tersebut sudah terdaftar." })

    return
  }

  const account = createAccount({
    id: randomUUID(),

    identifier,

    whatsapp,

    birthDate,

    password,

    name,

    role: "pasien",
  })

  memoryAccounts.push(account)

  sendSession(res, account, 201)
})

authRouter.post("/verify-reset", (req: Request, res: Response): void => {
  if (isSupabaseConfigured) {
    sendUnsupportedSupabaseAuth(res)

    return
  }

  const identifier =
    typeof req.body?.identifier === "string"
      ? req.body.identifier.trim().toLowerCase()
      : ""
  const whatsapp =
    typeof req.body?.whatsapp === "string"
      ? normalizeWhatsApp(req.body.whatsapp)
      : ""

  if (
    !identifier ||
    !/^08\d{8,11}$/.test(whatsapp) ||
    identifier.length > 254
  ) {
    res.status(400).json({
      success: false,
      message: "Data identitas atau nomor WhatsApp tidak sesuai.",
    })

    return
  }

  const account = memoryAccounts.find(
    (item) =>
      item.identifier === identifier &&
      normalizeWhatsApp(item.whatsapp) === whatsapp,
  )

  if (!account) {
    res.status(400).json({
      success: false,
      message: "Data identitas atau nomor WhatsApp tidak sesuai.",
    })

    return
  }

  const now = Date.now()
  for (const [challengeId, challenge] of resetChallenges) {
    if (challenge.expiresAt <= now) resetChallenges.delete(challengeId)
  }

  const challengeId = randomUUID()
  resetChallenges.set(challengeId, {
    accountId: account.id,
    expiresAt: now + 10 * 60 * 1000,
  })

  res.json({
    success: true,
    data: { challengeId, expiresInSeconds: 600 },
  })
})

authRouter.post("/reset-password", (req: Request, res: Response): void => {
  if (isSupabaseConfigured) {
    sendUnsupportedSupabaseAuth(res)

    return
  }

  const challengeId =
    typeof req.body?.challengeId === "string" ? req.body.challengeId : ""
  const newPassword =
    typeof req.body?.newPassword === "string" ? req.body.newPassword : ""

  if (newPassword.length < 6 || newPassword.length > 128) {
    res.status(400).json({
      success: false,
      message: "Kata sandi baru harus terdiri dari 6–128 karakter.",
    })

    return
  }

  const challenge = resetChallenges.get(challengeId)
  if (!challenge || challenge.expiresAt <= Date.now()) {
    resetChallenges.delete(challengeId)
    res.status(400).json({
      success: false,
      message: "Sesi reset tidak valid atau telah kedaluwarsa. Mulai ulang proses reset.",
    })

    return
  }

  const accountIndex = memoryAccounts.findIndex(
    (account) => account.id === challenge.accountId,
  )
  const account = memoryAccounts[accountIndex]
  if (!account) {
    resetChallenges.delete(challengeId)
    res.status(400).json({
      success: false,
      message: "Akun tidak ditemukan. Mulai ulang proses reset.",
    })

    return
  }

  const salt = randomBytes(16)
  memoryAccounts[accountIndex] = {
    ...account,
    salt,
    passwordHash: scryptSync(newPassword, salt, 64),
  }
  resetChallenges.delete(challengeId)

  res.json({
    success: true,
    message: "Kata sandi berhasil diperbarui! Silakan masuk kembali.",
  })
})
