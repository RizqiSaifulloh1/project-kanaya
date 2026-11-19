import { useEffect, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { Logo } from "../components/ui/Logo"
import { Btn } from "../components/ui/Btn"
import { Field } from "../components/ui/Field"
import { api } from "../services/api"
import type { AuthSession } from "../types/auth"

export type AuthMode = "login" | "register"

interface AuthModalProps {
  initialMode: AuthMode
  onLogin: (session: AuthSession) => void
  onClose: () => void
}

type IconName = "user" | "id" | "phone" | "lock" | "calendar" | "eye" | "eyeOff" | "close"

function Icon({
  name,
  className = "size-4",
}: {
  name: IconName
  className?: string
}) {
  const icons: Record<IconName, ReactNode> = {
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    id: (
      <>
        <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
        <circle cx="9" cy="11" r="2" />
        <path d="M6.5 16a3 3 0 0 1 5 0M14 10h4M14 14h4" />
      </>
    ),
    phone: (
      <path d="M7.2 3.5h2.1l1.2 4.1-1.6 1.5a15 15 0 0 0 6 6l1.5-1.6 4.1 1.2v2.1a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 5.2 5.7a2 2 0 0 1 2-2.2Z" />
    ),
    lock: (
      <>
        <rect x="4.5" y="10" width="15" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9h17M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18M10.6 6.2A10.7 10.7 0 0 1 12 6c6.3 0 9.5 6 9.5 6a15 15 0 0 1-3.2 3.7M6.2 6.8C3.8 8.3 2.5 12 2.5 12s3.2 6 9.5 6c.8 0 1.6-.1 2.3-.3" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {icons[name]}
    </svg>
  )
}

function normalizeWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("62")) return `0${digits.slice(2)}`
  if (digits.startsWith("8")) return `0${digits}`
  return digits
}

export function AuthModal({
  initialMode,
  onLogin,
  onClose,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode)
  const [name, setName] = useState("")
  const [identifier, setIdentifier] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [resetStep, setResetStep] = useState<1 | 2>(1)
  const [resetIdentifier, setResetIdentifier] = useState("")
  const [resetWhatsapp, setResetWhatsapp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [resetConfirmPassword, setResetConfirmPassword] = useState("")
  const [resetChallengeId, setResetChallengeId] = useState("")
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({})
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  const validateField = (
    field: string,
    value: string,
    isRegistration = mode === "register",
  ): string | undefined => {
    if (field === "name") {
      if (!value.trim()) return "Nama lengkap wajib diisi."
      if (value.trim().length < 3) return "Nama lengkap minimal 3 karakter."
    }

    if (field === "whatsapp") {
      if (!value.trim()) return "Nomor WhatsApp wajib diisi."
      if (!/^08\d{8,11}$/.test(normalizeWhatsApp(value))) {
        return "Nomor WhatsApp harus diawali 08 dan terdiri dari 10–13 digit."
      }
    }

    if (field === "identifier") {
      const cleanValue = value.trim()
      if (!cleanValue) return "NIK, ID petugas, atau email wajib diisi."
      if (isRegistration && !/^\d{16}$/.test(cleanValue)) {
        return "NIK harus terdiri dari 16 digit angka."
      }
      if (!isRegistration && /^\d+$/.test(cleanValue) && cleanValue.length !== 16) {
        return "Jika menggunakan NIK, masukkan tepat 16 digit angka."
      }
      if (
        cleanValue.includes("@") &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)
      ) {
        return "Format email tidak valid."
      }
      if (!isRegistration && cleanValue.length < 3) {
        return "Masukkan NIK, ID petugas, atau email yang valid."
      }
    }

    if (field === "birthDate") {
      if (!value) return "Tanggal lahir wajib diisi."
      if (value > new Date().toISOString().slice(0, 10)) {
        return "Tanggal lahir tidak boleh di masa depan."
      }
    }

    if (field === "password") {
      if (!value) return "Kata sandi wajib diisi."
      if (isRegistration && value.length < 8) {
        return "Kata sandi minimal 8 karakter."
      }
      if (value.length > 128) return "Kata sandi maksimal 128 karakter."
    }

    if (field === "confirmPassword") {
      if (!value) return "Konfirmasi kata sandi wajib diisi."
      if (value !== password) return "Konfirmasi kata sandi tidak sama."
    }

    return undefined
  }

  const updateField = (field: string, value: string) => {
    if (field === "name") setName(value)
    if (field === "identifier") setIdentifier(value)
    if (field === "whatsapp") setWhatsapp(value)
    if (field === "birthDate") setBirthDate(value)
    if (field === "password") setPassword(value)
    if (field === "confirmPassword") setConfirmPassword(value)

    setErrors((current) => {
      const next = { ...current }
      const error = validateField(field, value)
      if (error) next[field] = error
      else delete next[field]

      if (field === "password" && confirmPassword) {
        const confirmError =
          value === confirmPassword ? undefined : "Konfirmasi kata sandi tidak sama."
        if (confirmError) next.confirmPassword = confirmError
        else delete next.confirmPassword
      }

      return next
    })
    setFormError("")
  }

  const switchMode = (nextMode: "login" | "register" | "forgot") => {
    setMode(nextMode)
    setErrors({})
    setFormError("")
    setResetErrors({})
    setResetError("")
    setResetSuccess(false)
    if (nextMode === "forgot") {
      setResetStep(1)
      setResetIdentifier("")
      setResetWhatsapp("")
      setResetChallengeId("")
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const isRegistration = mode === "register"
    const fields = isRegistration
      ? ["name", "identifier", "whatsapp", "birthDate", "password", "confirmPassword"]
      : ["identifier", "password"]
    const nextErrors: Record<string, string> = {}

    for (const field of fields) {
      const value =
        field === "name"
          ? name
          : field === "identifier"
            ? identifier
            : field === "whatsapp"
              ? whatsapp
              : field === "birthDate"
                ? birthDate
                : field === "confirmPassword"
                  ? confirmPassword
                  : password
      const error = validateField(field, value, isRegistration)
      if (error) nextErrors[field] = error
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setFormError("")
    try {
      const session = isRegistration
        ? await api.registerPatientAccount(
            name,
            identifier,
            whatsapp,
            password,
            birthDate,
          )
        : await api.login(identifier, password)
      onLogin(session)
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memproses login.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const validateResetField = (field: string, value: string): string | undefined => {
    if (field === "identifier" || field === "whatsapp") {
      return validateField(field, value, false)
    }
    if (field === "newPassword") {
      if (!value) return "Kata sandi baru wajib diisi."
      if (value.length < 6) return "Kata sandi baru minimal 6 karakter."
      if (value.length > 128) return "Kata sandi baru maksimal 128 karakter."
    }
    if (field === "confirmPassword") {
      if (!value) return "Konfirmasi kata sandi wajib diisi."
      if (value !== newPassword) return "Konfirmasi kata sandi tidak sama."
    }
    return undefined
  }

  const updateResetField = (field: string, value: string) => {
    if (field === "identifier") setResetIdentifier(value)
    if (field === "whatsapp") setResetWhatsapp(value)
    if (field === "newPassword") setNewPassword(value)
    if (field === "confirmPassword") setResetConfirmPassword(value)

    setResetErrors((current) => {
      const next = { ...current }
      const error = validateResetField(field, value)
      if (error) next[field] = error
      else delete next[field]

      if (field === "newPassword" || field === "confirmPassword") {
        const nextNewPassword = field === "newPassword" ? value : newPassword
        const nextConfirmPassword =
          field === "confirmPassword" ? value : resetConfirmPassword
        if (nextConfirmPassword && nextConfirmPassword !== nextNewPassword) {
          next.confirmPassword = "Konfirmasi kata sandi tidak sama."
        } else if (nextConfirmPassword === nextNewPassword) {
          delete next.confirmPassword
        }
      }

      return next
    })
    setResetError("")
  }

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (resetStep === 1) {
      const identifierError = validateResetField("identifier", resetIdentifier)
      const whatsappError = validateResetField("whatsapp", resetWhatsapp)
      if (identifierError) nextErrors.identifier = identifierError
      if (whatsappError) nextErrors.whatsapp = whatsappError
    } else {
      const passwordError = validateResetField("newPassword", newPassword)
      const confirmError = validateResetField(
        "confirmPassword",
        resetConfirmPassword,
      )
      if (passwordError) nextErrors.newPassword = passwordError
      if (confirmError) nextErrors.confirmPassword = confirmError
    }

    setResetErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setResetError("")
    try {
      if (resetStep === 1) {
        const challengeId = await api.verifyPasswordReset(
          resetIdentifier,
          resetWhatsapp,
        )
        setResetChallengeId(challengeId)
        setResetStep(2)
      } else {
        if (!resetChallengeId) {
          setResetStep(1)
          setResetError("Sesi verifikasi berakhir. Silakan verifikasi ulang.")
          return
        }
        await api.resetPassword(resetChallengeId, newPassword)
        setResetSuccess(true)
        window.setTimeout(() => switchMode("login"), 2000)
      }
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mereset kata sandi.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const passwordToggle = (isVisible: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={isVisible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
      className="rounded-md p-1.5 text-slate-400 transition hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-600"
    >
      <Icon name={isVisible ? "eyeOff" : "eye"} />
    </button>
  )

  const title =
    mode === "forgot"
      ? resetSuccess
        ? "Reset Berhasil"
        : "Lupa Kata Sandi"
      : mode === "register"
        ? "Buat Akun Pasien 👋"
        : "Selamat Datang 👋"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <aside
          className="relative hidden w-[39%] shrink-0 flex-col justify-between overflow-hidden bg-emerald-950 bg-cover bg-center p-8 text-white md:flex lg:p-10"
          style={{ backgroundImage: "url('/images/gedung-nayaka.jpg')" }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-emerald-950/95 via-emerald-900/80 to-slate-950/85" />
          <div className="relative">
            <div className="mb-10 inline-flex rounded-xl bg-white p-2 shadow-lg">
              <Logo />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
              Nayaka Antrean Digital
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              Layanan klinik yang lebih mudah, dari mana saja.
            </h2>
          </div>
          <ul className="relative space-y-5">
            {[
              "Daftar berobat tanpa harus mengantre di loket.",
              "Pantau status antrean dan estimasi panggilan.",
              "Informasi layanan untuk pasien JKN dan umum.",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-white/90">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-white/15 text-emerald-100">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="relative mt-8 text-xs text-white/65">
            Klinik Pratama Nayaka Husada Kebraon · Surabaya
          </p>
        </aside>

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-5 sm:p-8 lg:p-10">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <Icon name="close" />
          </button>

          <div className="mx-auto my-auto w-full max-w-md py-8">
            <div className="mb-6 md:hidden">
              <Logo />
            </div>
            <p className="text-sm font-semibold text-emerald-700">
              NAYAKA ANTREAN DIGITAL
            </p>
            <h2
              id="auth-modal-title"
              className="mt-2 text-2xl font-bold tracking-tight text-slate-900"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {mode === "forgot" && !resetSuccess
                ? `Langkah ${resetStep} dari 2 · ${
                    resetStep === 1
                      ? "Verifikasi identitas"
                      : "Buat kata sandi baru"
                  }`
                : mode === "register"
                  ? "Daftarkan akun pasien untuk mengakses layanan antrean."
                  : mode === "login"
                    ? "Masuk dengan NIK, ID petugas, atau email Anda."
                    : "Ikuti langkah berikut untuk memperbarui kata sandi."}
            </p>

            {mode === "forgot" ? (
              resetSuccess ? (
                <p
                  role="status"
                  className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium leading-6 text-emerald-800"
                >
                  Kata sandi berhasil diperbarui! Silakan masuk kembali.
                </p>
              ) : (
                <form
                  className="mt-7 space-y-4"
                  noValidate
                  onSubmit={handleResetSubmit}
                >
                  {resetStep === 1 ? (
                    <>
                      <Field
                        label="NIK / ID Petugas / Email"
                        placeholder="Masukkan NIK, ID Petugas, atau Email"
                        value={resetIdentifier}
                        error={resetErrors.identifier}
                        leadingIcon={<Icon name="id" />}
                        onChange={(event) =>
                          updateResetField("identifier", event.target.value)
                        }
                        autoComplete="username"
                        required
                      />
                      <Field
                        label="Nomor WhatsApp Terdaftar"
                        placeholder="08xxxxxxxxxx"
                        value={resetWhatsapp}
                        error={resetErrors.whatsapp}
                        leadingIcon={<Icon name="phone" />}
                        onChange={(event) =>
                          updateResetField("whatsapp", event.target.value)
                        }
                        inputMode="tel"
                        autoComplete="tel"
                        required
                      />
                      <p className="text-xs leading-5 text-slate-500">
                        Untuk Staf &amp; Dokter yang lupa nomor terdaftar,
                        silakan hubungi Admin Loket Utama untuk reset akun.
                      </p>
                    </>
                  ) : (
                    <>
                      <Field
                        label="Kata Sandi Baru"
                        type={passwordVisible ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        error={resetErrors.newPassword}
                        leadingIcon={<Icon name="lock" />}
                        trailingAction={passwordToggle(passwordVisible, () =>
                          setPasswordVisible(!passwordVisible),
                        )}
                        onChange={(event) =>
                          updateResetField("newPassword", event.target.value)
                        }
                        autoComplete="new-password"
                        required
                      />
                      <Field
                        label="Konfirmasi Kata Sandi Baru"
                        type={passwordVisible ? "text" : "password"}
                        placeholder="Ulangi kata sandi baru"
                        value={resetConfirmPassword}
                        error={resetErrors.confirmPassword}
                        leadingIcon={<Icon name="lock" />}
                        onChange={(event) =>
                          updateResetField(
                            "confirmPassword",
                            event.target.value,
                          )
                        }
                        autoComplete="new-password"
                        required
                      />
                    </>
                  )}
                  {resetError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                    >
                      {resetError}
                    </p>
                  )}
                  <Btn
                    className="w-full h-12! rounded-xl!"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Memproses…"
                      : resetStep === 1
                        ? "Verifikasi Identitas"
                        : "Simpan Kata Sandi Baru"}
                  </Btn>
                </form>
              )
            ) : (
              <form className="mt-7 space-y-4" noValidate onSubmit={handleSubmit}>
                {mode === "register" && (
                  <Field
                    label="Nama Lengkap"
                    placeholder="Sesuai KTP"
                    value={name}
                    error={errors.name}
                    leadingIcon={<Icon name="user" />}
                    onChange={(event) => updateField("name", event.target.value)}
                    autoComplete="name"
                    required
                  />
                )}
                <Field
                  label={mode === "register" ? "NIK 16 Digit" : "NIK / ID Petugas / Email"}
                  placeholder={
                    mode === "register"
                      ? "Masukkan 16 digit NIK"
                      : "Masukkan NIK, ID Petugas, atau Email"
                  }
                  value={identifier}
                  error={errors.identifier}
                  leadingIcon={<Icon name="id" />}
                  onChange={(event) =>
                    updateField("identifier", event.target.value)
                  }
                  inputMode={mode === "register" ? "numeric" : "text"}
                  maxLength={mode === "register" ? 16 : undefined}
                  autoComplete={mode === "register" ? "off" : "username"}
                  required
                />
                {mode === "register" && (
                  <>
                    <Field
                      label="Nomor WhatsApp"
                      placeholder="08xxxxxxxxxx"
                      value={whatsapp}
                      error={errors.whatsapp}
                      leadingIcon={<Icon name="phone" />}
                      onChange={(event) =>
                        updateField("whatsapp", event.target.value)
                      }
                      inputMode="tel"
                      autoComplete="tel"
                      required
                    />
                    <Field
                      label="Tanggal Lahir"
                      type="date"
                      value={birthDate}
                      error={errors.birthDate}
                      leadingIcon={<Icon name="calendar" />}
                      onChange={(event) =>
                        updateField("birthDate", event.target.value)
                      }
                      autoComplete="bday"
                      max={new Date().toISOString().slice(0, 10)}
                      required
                    />
                  </>
                )}
                <Field
                  label="Kata Sandi"
                  labelAction={
                    mode === "login" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-sm font-medium text-emerald-700 hover:underline"
                      >
                        Lupa kata sandi?
                      </button>
                    )
                  }
                  type={passwordVisible ? "text" : "password"}
                  placeholder={
                    mode === "register"
                      ? "Buat kata sandi minimal 8 karakter"
                      : "Masukkan kata sandi"
                  }
                  value={password}
                  error={errors.password}
                  leadingIcon={<Icon name="lock" />}
                  trailingAction={passwordToggle(passwordVisible, () =>
                    setPasswordVisible(!passwordVisible),
                  )}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  required
                />
                {mode === "register" && (
                  <Field
                    label="Konfirmasi Kata Sandi"
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Ulangi kata sandi"
                    value={confirmPassword}
                    error={errors.confirmPassword}
                    leadingIcon={<Icon name="lock" />}
                    onChange={(event) =>
                      updateField("confirmPassword", event.target.value)
                    }
                    autoComplete="new-password"
                    required
                  />
                )}
                {formError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                  >
                    {formError}
                  </p>
                )}
                <Btn
                  className="w-full h-12! rounded-xl!"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Memproses…"
                    : mode === "register"
                      ? "Buat Akun"
                      : "Masuk →"}
                </Btn>
              </form>
            )}

            <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
              {mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Kembali ke Masuk
                </button>
              ) : mode === "register" ? (
                <p>
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    Masuk di sini
                  </button>
                </p>
              ) : (
                <p>
                  Belum punya akun?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              )}
            </div>
          </div>
        </section>
      </section>
    </div>
  )
}
