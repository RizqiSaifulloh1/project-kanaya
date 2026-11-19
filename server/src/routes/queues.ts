import { Router, Request, Response } from 'express'
import { supabase, isSupabaseConfigured } from '../supabase.js'

export const queuesRouter = Router()

export type QueueItem = {
  id: number
  ticket?: string | null
  name: string
  nik: string
  phone: string
  poly: string
  poly_code: string
  cat: 'JKN' | 'Umum'
  channel: 'Online' | 'Walk-In'
  priority: boolean
  status: 'Menunggu' | 'Dipanggil' | 'Selesai' | 'Dilewati'
  created_at?: string
  called_at?: string | null
  finished_at?: string | null
}

const POLY_MAP: Record<string, { code: string; name: string }> = {
  Umum: { code: 'A', name: 'Umum' },
  Gigi: { code: 'B', name: 'Gigi' },
  Anak: { code: 'C', name: 'Anak' },
}

// Memory fallback store jika Supabase belum diisi .env
let memoryStore: QueueItem[] = [
  { id: 1, name: 'Budi Santoso', nik: '3171234567890001', phone: '081234567890', poly: 'Umum', poly_code: 'A', cat: 'JKN', priority: false, channel: 'Online', ticket: 'A-012', status: 'Dipanggil', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, name: 'Agung Pratama', nik: '3171234567890002', phone: '081298765432', poly: 'Umum', poly_code: 'A', cat: 'Umum', priority: false, channel: 'Online', ticket: 'A-013', status: 'Menunggu', created_at: new Date(Date.now() - 2400000).toISOString() },
  { id: 3, name: 'Dewi Lestari', nik: '3171234567890003', phone: '081355566677', poly: 'Umum', poly_code: 'A', cat: 'JKN', priority: true, channel: 'Online', ticket: 'A-014', status: 'Menunggu', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 4, name: 'Hendra Wijaya', nik: '3171234567890004', phone: '081355566678', poly: 'Gigi', poly_code: 'B', cat: 'JKN', priority: false, channel: 'Online', ticket: 'B-004', status: 'Dipanggil', created_at: new Date(Date.now() - 2100000).toISOString() },
  { id: 5, name: 'Maya Putri', nik: '3171234567890005', phone: '081355566679', poly: 'Gigi', poly_code: 'B', cat: 'Umum', priority: false, channel: 'Online', ticket: 'B-005', status: 'Menunggu', created_at: new Date(Date.now() - 1500000).toISOString() },
  { id: 6, name: 'Rina Wulandari', nik: '3171234567890006', phone: '081355566680', poly: 'Gigi', poly_code: 'B', cat: 'JKN', priority: false, channel: 'Online', ticket: 'B-006', status: 'Menunggu', created_at: new Date(Date.now() - 900000).toISOString() },
  { id: 7, name: 'Siti Aminah', nik: '3171234567890007', phone: '081298765432', poly: 'Anak', poly_code: 'C', cat: 'Umum', priority: false, channel: 'Online', ticket: 'C-002', status: 'Dipanggil', created_at: new Date(Date.now() - 2400000).toISOString() },
  { id: 8, name: 'Fajar Nugraha', nik: '3171234567890008', phone: '081355566681', poly: 'Anak', poly_code: 'C', cat: 'JKN', priority: false, channel: 'Online', ticket: 'C-003', status: 'Menunggu', created_at: new Date(Date.now() - 1500000).toISOString() },
  { id: 9, name: 'Putri Anggraini', nik: '3171234567890009', phone: '081355566682', poly: 'Anak', poly_code: 'C', cat: 'Umum', priority: true, channel: 'Online', ticket: 'C-004', status: 'Menunggu', created_at: new Date(Date.now() - 600000).toISOString() },
  { id: 10, name: 'Rina Wulandari', nik: '31712345678', phone: '0812345', poly: 'Gigi', poly_code: 'B', cat: 'JKN', priority: false, channel: 'Walk-In', ticket: null, status: 'Menunggu', created_at: new Date(Date.now() - 1200000).toISOString() },
  { id: 11, name: 'Agus Setiawan', nik: '3171234567890011', phone: '081355566683', poly: 'Umum', poly_code: 'A', cat: 'Umum', priority: false, channel: 'Walk-In', ticket: null, status: 'Menunggu', created_at: new Date(Date.now() - 300000).toISOString() },
]

// Helper untuk generate nomor tiket berikutnya per poli
async function generateNextTicket(polyCode: string): Promise<string> {
  let highestNum = 0

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('queues')
      .select('ticket')
      .eq('poly_code', polyCode)
      .not('ticket', 'is', null)

    if (data && data.length > 0) {
      data.forEach((row) => {
        if (row.ticket && row.ticket.startsWith(`${polyCode}-`)) {
          const num = parseInt(row.ticket.split('-')[1], 10)
          if (!isNaN(num) && num > highestNum) highestNum = num
        }
      })
    }
  } else {
    memoryStore.forEach((q) => {
      if (q.ticket && q.ticket.startsWith(`${polyCode}-`)) {
        const num = parseInt(q.ticket.split('-')[1], 10)
        if (!isNaN(num) && num > highestNum) highestNum = num
      }
    })
  }

  // Baseline jika belum ada
  if (highestNum === 0) {
    if (polyCode === 'A') highestNum = 12
    else if (polyCode === 'C') highestNum = 4
  }

  const nextNum = highestNum + 1
  return `${polyCode}-${String(nextNum).padStart(3, '0')}`
}

// 1. GET /api/queues - Ambil semua antrean
queuesRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      res.json({ success: true, source: 'supabase', data })
      return
    }

    res.json({ success: true, source: 'memory', data: memoryStore })
  } catch (err: unknown) {
    console.error('🚨 [Supabase Error GET /queues]:', err)
    res.json({ success: true, source: 'memory-fallback', data: memoryStore, warning: 'Supabase unreachable' })
  }
})

// 2. POST /api/queues/register - Pendaftaran antrean baru (Online atau Walk-In)
queuesRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, nik, phone, poly = 'Umum', cat = 'Umum', priority = false, channel = 'Online' } = req.body

    const polyInfo = POLY_MAP[poly] || { code: 'A', name: 'Umum' }

    // Jika online, langsung generate nomor tiket
    let ticket: string | null = null
    if (channel === 'Online') {
      ticket = await generateNextTicket(polyInfo.code)
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('queues')
        .insert([
          {
            name,
            nik,
            phone,
            poly: polyInfo.name,
            poly_code: polyInfo.code,
            cat,
            channel,
            priority: Boolean(priority),
            ticket,
            status: 'Menunggu',
          },
        ])
        .select()
        .single()

      if (error) throw error
      res.status(201).json({ success: true, source: 'supabase', data })
      return
    }

    const newItem: QueueItem = {
      id: Date.now(),
      name,
      nik,
      phone,
      poly: polyInfo.name,
      poly_code: polyInfo.code,
      cat,
      channel,
      priority: Boolean(priority),
      ticket,
      status: 'Menunggu',
      created_at: new Date().toISOString(),
    }
    memoryStore.push(newItem)
    res.status(201).json({ success: true, source: 'memory', data: newItem })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mendaftarkan antrean'
    res.status(500).json({ success: false, error: message })
  }
})

// 3. POST /api/queues/call-next - Panggil antrean berikutnya berdasarkan prioritas
queuesRouter.post('/call-next', async (req: Request, res: Response): Promise<void> => {
  try {
    const { polyCode } = req.body // opsional: panggil per poli atau global

    if (isSupabaseConfigured && supabase) {
      // 1. Ambil semua yang masih menunggu dan punya tiket
      let query = supabase
        .from('queues')
        .select('*')
        .eq('status', 'Menunggu')
        .not('ticket', 'is', null)

      if (polyCode) {
        query = query.eq('poly_code', polyCode)
      }

      const { data: waitingList, error } = await query

      if (error) throw error
      if (!waitingList || waitingList.length === 0) {
        res.status(404).json({ success: false, message: 'Tidak ada antrean yang menunggu' })
        return
      }

      // Urutkan prioritas = true duluan, lalu id terkecil (waktu datang duluan)
      waitingList.sort((a, b) => Number(b.priority) - Number(a.priority) || a.id - b.id)
      const nextQueue = waitingList[0]

      // Ubah yang sedang dipanggil sebelumnya menjadi Selesai
      let finishQuery = supabase
        .from('queues')
        .update({ status: 'Selesai', finished_at: new Date().toISOString() })
        .eq('status', 'Dipanggil')
      if (polyCode) finishQuery = finishQuery.eq('poly_code', polyCode)
      const { error: finishError } = await finishQuery
      if (finishError) throw finishError

      // Set target menjadi Dipanggil
      const { data: calledItem, error: updateError } = await supabase
        .from('queues')
        .update({ status: 'Dipanggil', called_at: new Date().toISOString() })
        .eq('id', nextQueue.id)
        .select()
        .single()

      if (updateError) throw updateError
      res.json({ success: true, data: calledItem })
      return
    }

    // Memory Mode
    const waiting = memoryStore
      .filter((q) => q.status === 'Menunggu' && q.ticket && (!polyCode || q.poly_code === polyCode))
      .sort((a, b) => Number(b.priority) - Number(a.priority) || a.id - b.id)[0]

    if (!waiting) {
      res.status(404).json({ success: false, message: 'Tidak ada antrean yang menunggu' })
      return
    }

    // Ubah status
    memoryStore = memoryStore.map((q) => {
      if (
        q.status === 'Dipanggil' &&
        (!polyCode || q.poly_code === polyCode)
      ) {
        return { ...q, status: 'Selesai', finished_at: new Date().toISOString() }
      }
      if (q.id === waiting.id) return { ...q, status: 'Dipanggil', called_at: new Date().toISOString() }
      return q
    })

    const called = memoryStore.find((q) => q.id === waiting.id)
    res.json({ success: true, data: called })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memanggil antrean berikutnya'
    res.status(500).json({ success: false, error: message })
  }
})

// 4. PATCH /api/queues/:id/status - Lewati antrean atau selesaikan pemeriksaan
queuesRouter.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const id = Number.parseInt(rawId, 10)
    const status = req.body?.status

    if (
      !Number.isInteger(id) ||
      (status !== 'Selesai' && status !== 'Dilewati')
    ) {
      res.status(400).json({ success: false, message: 'Status antrean tidak valid.' })
      return
    }

    const expectedCurrentStatus = status === 'Selesai' ? 'Dipanggil' : 'Menunggu'
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('queues')
        .update({
          status,
          finished_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', expectedCurrentStatus)
        .select()
        .maybeSingle()

      if (error) throw error
      if (!data) {
        res.status(409).json({
          success: false,
          message: 'Status antrean sudah berubah atau tidak sesuai dengan tindakan.',
        })
        return
      }
      res.json({ success: true, data })
      return
    }

    const item = memoryStore.find((queueItem) => queueItem.id === id)
    if (!item) {
      res.status(404).json({ success: false, message: 'Antrean tidak ditemukan.' })
      return
    }

    if (item.status !== expectedCurrentStatus) {
      res.status(409).json({
        success: false,
        message: 'Status antrean sudah berubah atau tidak sesuai dengan tindakan.',
      })
      return
    }

    item.status = status
    item.finished_at = new Date().toISOString()
    res.json({ success: true, data: item })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui status antrean'
    res.status(500).json({ success: false, error: message })
  }
})

// 5. PATCH /api/queues/:id/validate - Validasi & terbitkan tiket walk-in oleh staf
queuesRouter.patch('/:id/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const id = parseInt(rawId, 10)
    const { name, nik, phone, poly, cat } = req.body

    const polyInfo = POLY_MAP[poly] || { code: 'A', name: 'Umum' }
    const ticket = await generateNextTicket(polyInfo.code)

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('queues')
        .update({
          name,
          nik,
          phone,
          poly: polyInfo.name,
          poly_code: polyInfo.code,
          cat,
          ticket,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      res.json({ success: true, data })
      return
    }

    const item = memoryStore.find((q) => q.id === id)
    if (!item) {
      res.status(404).json({ success: false, message: 'Data pasien tidak ditemukan' })
      return
    }

    item.name = name ?? item.name
    item.nik = nik ?? item.nik
    item.phone = phone ?? item.phone
    item.poly = polyInfo.name
    item.poly_code = polyInfo.code
    item.cat = cat ?? item.cat
    item.ticket = ticket

    res.json({ success: true, data: item })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memvalidasi data pasien'
    res.status(500).json({ success: false, error: message })
  }
})

// 6. DELETE /api/queues/:id - Hapus antrean
queuesRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const id = parseInt(rawId, 10)

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('queues').delete().eq('id', id)
      if (error) throw error
      res.json({ success: true, message: `Antrean #${id} berhasil dihapus` })
      return
    }

    memoryStore = memoryStore.filter((q) => q.id !== id)
    res.json({ success: true, message: `Antrean #${id} berhasil dihapus` })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus antrean'
    res.status(500).json({ success: false, error: message })
  }
})
