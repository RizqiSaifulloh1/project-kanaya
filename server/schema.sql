-- ============================================================
-- SQL SCHEMA FOR KLINIK SEHAT (SUPABASE POSTGRESQL)
-- ============================================================
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Buat Tabel Poliklinik
CREATE TABLE IF NOT EXISTS public.polies (
    code VARCHAR(5) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    doctor VARCHAR(100),
    room VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Data Master Poli
INSERT INTO public.polies (code, name, description, doctor, room)
VALUES 
    ('A', 'Umum', 'Pemeriksaan umum dan penyakit dalam', 'dr. Siti Rahma, Sp.PD', 'R. 101'),
    ('B', 'Gigi', 'Pemeriksaan kesehatan dental dan mulut', 'drg. Hendra Pratama', 'R. 102'),
    ('C', 'Anak', 'Pediatric dan imunisasi anak', 'dr. Linda Marlina, Sp.A', 'R. 103')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    doctor = EXCLUDED.doctor,
    room = EXCLUDED.room;

-- 2. Buat Tabel Antrean (Queues)
CREATE TABLE IF NOT EXISTS public.queues (
    id BIGSERIAL PRIMARY KEY,
    ticket VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    nik VARCHAR(16) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    poly VARCHAR(50) NOT NULL,
    poly_code VARCHAR(5) NOT NULL REFERENCES public.polies(code) ON UPDATE CASCADE,
    cat VARCHAR(20) NOT NULL DEFAULT 'Umum', -- 'JKN' atau 'Umum'
    channel VARCHAR(20) NOT NULL DEFAULT 'Online', -- 'Online' atau 'Walk-In'
    priority BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'Menunggu', -- 'Menunggu', 'Dipanggil', 'Selesai', 'Dilewati'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    called_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE
);

-- Buat index untuk performa query antrean harian
CREATE INDEX IF NOT EXISTS idx_queues_status ON public.queues(status);
CREATE INDEX IF NOT EXISTS idx_queues_created_at ON public.queues(created_at);
CREATE INDEX IF NOT EXISTS idx_queues_poly_code ON public.queues(poly_code);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.polies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses untuk polies (Bisa dibaca siapa saja)
CREATE POLICY "Allow public read polies" 
ON public.polies 
FOR SELECT 
USING (true);

-- Kebijakan akses untuk queues (Bisa dibaca dan ditulis oleh aplikasi antrean)
CREATE POLICY "Allow public all queues" 
ON public.queues 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Aktifkan Supabase Realtime pada tabel queues
-- (Memungkinkan monitor TV dan HP pasien menerima live update secara instan tanpa refresh)
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;

-- 5. Seed Data Awal untuk Demo/Pengujian
INSERT INTO public.queues (ticket, name, nik, phone, poly, poly_code, cat, channel, priority, status)
VALUES
    ('A-012', 'Budi Santoso', '3171234567890001', '081234567890', 'Umum', 'A', 'JKN', 'Online', false, 'Dipanggil'),
    ('C-004', 'Siti Aminah', '3171234567890002', '081298765432', 'Anak', 'C', 'Umum', 'Online', true, 'Menunggu'),
    (NULL, 'Rina Wulandari', '31712345678', '0812345', 'Gigi', 'B', 'JKN', 'Walk-In', false, 'Menunggu'),
    (NULL, 'Agus Setiawan', '3171234567890004', '081355566677', 'Umum', 'A', 'Umum', 'Walk-In', false, 'Menunggu');

