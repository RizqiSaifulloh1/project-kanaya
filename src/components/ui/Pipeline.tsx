const STEPS = ['Validasi Data', 'Algoritma Prioritas', 'Tiket Diterbitkan']

export function Pipeline({ stage }: { stage: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((s, i) => {
        const done = stage > i
        const active = stage === i
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2 w-24 sm:w-32 text-center">
              <div
                className={`size-10 rounded-full grid place-items-center text-sm font-bold transition-all duration-300 ${
                  done
                    ? 'bg-primary text-white scale-100'
                    : active
                      ? 'bg-primary-soft text-primary-dark ring-4 ring-primary/20 scale-105 animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${done || active ? 'text-ink' : 'text-gray-400'}`}>
                {s}
              </span>
            </div>
            {i < 2 && (
              <div
                className={`h-0.5 flex-1 -mt-6 transition-colors duration-500 ${
                  done ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

