import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseKey.includes('your-supabase')
)

export let supabase: SupabaseClient | null = null

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ [Supabase] Terkoneksi dengan proyek Supabase:', supabaseUrl)
  } catch (err) {
    console.error('❌ [Supabase] Gagal menginisialisasi client Supabase:', err)
  }
} else {
  console.warn(
    '⚠️  [Supabase] Kredensial belum diisi di server/.env.\n' +
      '   Server Express sementara menggunakan Memory Mode agar API tetap bisa diuji langsung.'
  )
}

