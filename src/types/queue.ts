export type Role = "patient" | "staff" | "doctor" | "system"
export type Cat = "JKN" | "Umum"
export type Channel = "Online" | "Walk-In"
export type QueueStatus = "Menunggu" | "Dipanggil" | "Selesai" | "Dilewati"

export type Entry = {
  id: number
  name: string
  nik: string
  phone: string
  poly: string
  cat: Cat
  priority: boolean
  channel: Channel
  ticket?: string
  status: QueueStatus
  timestamp?: number
}

export type PolyInfo = {
  code: string
  desc: string
  doctor?: string
  room?: string
}

export const POLY: Record<string, PolyInfo> = {
  Umum: {
    code: "A",
    desc: "Pemeriksaan umum",
    doctor: "dr. Siti Rahma, Sp.PD",
    room: "R. 101",
  },
  Gigi: {
    code: "B",
    desc: "Dental & mulut",
    doctor: "drg. Hendra Pratama",
    room: "R. 102",
  },
  Anak: {
    code: "C",
    desc: "Pediatric",
    doctor: "dr. Linda Marlina, Sp.A",
    room: "R. 103",
  },
}

export const validate = (
  e: Pick<Entry, "name" | "nik" | "phone">,
): Record<string, string> => {
  const f: Record<string, string> = {}
  const name = (e.name || "").trim()
  const nik = (e.nik || "").trim()
  const phone = (e.phone || "").trim()

  if (!name) {
    f.name = "Nama lengkap wajib diisi"
  } else if (name.length < 3) {
    f.name = `Nama masih terlalu pendek (${name.length}/3 karakter)`
  }

  if (!nik) {
    f.nik = "NIK wajib diisi"
  } else if (!/^\d+$/.test(nik)) {
    f.nik = "NIK hanya boleh berisi angka"
  } else if (nik.length < 16) {
    f.nik = `NIK kurang ${16 - nik.length} digit (saat ini ${nik.length}/16 digit)`
  } else if (nik.length > 16) {
    f.nik = `NIK kelebihan ${nik.length - 16} digit (maksimal 16 digit)`
  }

  if (!phone) {
    f.phone = "Nomor WhatsApp / HP wajib diisi"
  } else if (!/^\d+$/.test(phone)) {
    f.phone = "Nomor WhatsApp / HP hanya boleh berisi angka"
  } else if (!phone.startsWith("08")) {
    f.phone = "Nomor WhatsApp / HP harus diawali dengan 08"
  } else if (phone.length < 10) {
    f.phone = `Nomor HP terlalu pendek, kurang ${10 - phone.length} digit (minimal 10 digit)`
  } else if (phone.length > 13) {
    f.phone = `Nomor HP terlalu panjang, maksimal 13 digit (saat ini ${phone.length} digit)`
  }
  return f
}

export const initialSeed: Entry[] = [
  {
    id: 1,
    name: "Budi Santoso",
    nik: "3171234567890001",
    phone: "081234567890",
    poly: "Umum",
    cat: "JKN",
    priority: false,
    channel: "Online",
    ticket: "A-012",
    status: "Dipanggil",
    timestamp: Date.now() - 3600000,
  },
  {
    id: 2,
    name: "Agung Pratama",
    nik: "3171234567890002",
    phone: "081298765432",
    poly: "Umum",
    cat: "Umum",
    priority: false,
    channel: "Online",
    ticket: "A-013",
    status: "Menunggu",
    timestamp: Date.now() - 2400000,
  },
  {
    id: 3,
    name: "Dewi Lestari",
    nik: "3171234567890003",
    phone: "081355566677",
    poly: "Umum",
    cat: "JKN",
    priority: true,
    channel: "Online",
    ticket: "A-014",
    status: "Menunggu",
    timestamp: Date.now() - 1200000,
  },
  {
    id: 4,
    name: "Hendra Wijaya",
    nik: "3171234567890004",
    phone: "081355566678",
    poly: "Gigi",
    cat: "JKN",
    priority: false,
    channel: "Online",
    ticket: "B-004",
    status: "Dipanggil",
    timestamp: Date.now() - 2100000,
  },
  {
    id: 5,
    name: "Maya Putri",
    nik: "3171234567890005",
    phone: "081355566679",
    poly: "Gigi",
    cat: "Umum",
    priority: false,
    channel: "Online",
    ticket: "B-005",
    status: "Menunggu",
    timestamp: Date.now() - 1800000,
  },
  {
    id: 6,
    name: "Rina Wulandari",
    nik: "3171234567890006",
    phone: "081355566680",
    poly: "Gigi",
    cat: "JKN",
    priority: false,
    channel: "Online",
    ticket: "B-006",
    status: "Menunggu",
    timestamp: Date.now() - 900000,
  },
  {
    id: 7,
    name: "Siti Aminah",
    nik: "3171234567890007",
    phone: "081298765432",
    poly: "Anak",
    cat: "Umum",
    priority: false,
    channel: "Online",
    ticket: "C-002",
    status: "Dipanggil",
    timestamp: Date.now() - 2400000,
  },
  {
    id: 8,
    name: "Fajar Nugraha",
    nik: "3171234567890008",
    phone: "081355566681",
    poly: "Anak",
    cat: "JKN",
    priority: false,
    channel: "Online",
    ticket: "C-003",
    status: "Menunggu",
    timestamp: Date.now() - 1500000,
  },
  {
    id: 9,
    name: "Putri Anggraini",
    nik: "3171234567890009",
    phone: "081355566682",
    poly: "Anak",
    cat: "Umum",
    priority: true,
    channel: "Online",
    ticket: "C-004",
    status: "Menunggu",
    timestamp: Date.now() - 600000,
  },
  {
    id: 10,
    name: "Rina Wulandari",
    nik: "31712345678",
    phone: "0812345",
    poly: "Gigi",
    cat: "JKN",
    priority: false,
    channel: "Walk-In",
    status: "Menunggu",
    timestamp: Date.now() - 1200000,
  },
  {
    id: 11,
    name: "Agus Setiawan",
    nik: "3171234567890011",
    phone: "081355566683",
    poly: "Umum",
    cat: "Umum",
    priority: false,
    channel: "Walk-In",
    status: "Menunggu",
    timestamp: Date.now() - 300000,
  },
]
