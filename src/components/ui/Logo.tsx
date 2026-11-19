export const Logo = ({
  light,
  className = '',
}: {
  light?: boolean
  className?: string
}) => (
  <div className="select-none">
    <img
      src="/logo-nayaka-husada.png"
      alt="Klinik Nayaka Husada"
      className={`${className || 'h-12'} w-auto object-contain ${light ? 'rounded-lg bg-white px-3 py-1 shadow-sm' : ''}`}
    />
  </div>
)

