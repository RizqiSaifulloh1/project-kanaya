export type AuthRole = "pasien" | "staf" | "dokter"

export interface AuthSession {
  user: {
    id: string

    identifier: string

    name: string

    role: AuthRole

    poly?: string
  }
}
