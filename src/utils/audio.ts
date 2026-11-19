// Sound synthesizer & Voice Announcer using Web Audio API and SpeechSynthesis

class SoundEffects {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  /**
   * Membunyikan nada bel bandara / antrean klinik khas (Ding-Dong dua nada harmonis)
   */
  public playQueueChime(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    // Nada 1 (Ding - F5 / 698.46 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(698.46, now)
    gain1.gain.setValueAtTime(0.25, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.8)

    // Nada 2 (Dong - C5 / 523.25 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(523.25, now + 0.45)
    gain2.gain.setValueAtTime(0.25, now + 0.45)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.45)
    osc2.stop(now + 1.4)
  }

  /**
   * Menyuarakan panggilan nomor antrean dan poli tujuan dengan suara Bahasa Indonesia
   */
  public announceQueue(ticket: string, polyName: string): void {
    // Bunyikan bel terlebih dahulu
    this.playQueueChime()

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    // Tunggu bel selesai sebelum suara robot/announcer berbicara
    setTimeout(() => {
      window.speechSynthesis.cancel() // Hentikan suara yang sedang berjalan jika ada

      // Format pembacaan tiket agar terdengar jelas (contoh: "Nomor antrean A, 0 1 2, silakan menuju Poli Umum")
      const [polyCode, numberStr] = ticket.split('-')
      const spelledNumber = numberStr ? numberStr.split('').join(' ') : ticket
      const textToSpeak = `Nomor antrean ${polyCode}, ${spelledNumber}. Silakan menuju Poli ${polyName}.`

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = 'id-ID'
      utterance.rate = 0.9
      utterance.pitch = 1.0

      // Cari suara berbahasa Indonesia jika tersedia di sistem user
      const voices = window.speechSynthesis.getVoices()
      const indonesianVoice = voices.find(
        (v) => v.lang.toLowerCase().includes('id') || v.lang.toLowerCase().includes('indonesia')
      )
      if (indonesianVoice) {
        utterance.voice = indonesianVoice
      }

      window.speechSynthesis.speak(utterance)
    }, 1200)
  }
}

export const soundEffects = new SoundEffects()

