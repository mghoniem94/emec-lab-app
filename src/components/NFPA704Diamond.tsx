export function NFPA704Diamond({
  health,
  flammability,
  instability,
  className = "w-16 h-16"
}: {
  health: number
  flammability: number
  instability: number
  className?: string
}) {
  return (
    <div className={`relative rotate-45 ${className}`}>
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 shadow-sm border border-black dark:border-white/20">
        {/* Health (Left) - which is Top-Left in un-rotated grid, but wait.
            If we rotate 45deg clockwise:
            Top-Left becomes Top (Flammability) => No, top-left becomes Top. 
            Wait, let's map it clearly.
            A 2x2 grid rotated 45deg:
            TL -> Top (Flammability - Red)
            TR -> Right (Instability - Yellow)
            BL -> Left (Health - Blue)
            BR -> Bottom (Special - White)
        */}
        <div className="bg-red-600 flex items-center justify-center border-b border-r border-black dark:border-white/20">
          <span className="font-bold text-white -rotate-45">{flammability}</span>
        </div>
        <div className="bg-yellow-400 flex items-center justify-center border-b border-black dark:border-white/20">
          <span className="font-bold text-black -rotate-45">{instability}</span>
        </div>
        <div className="bg-blue-600 flex items-center justify-center border-r border-black dark:border-white/20">
          <span className="font-bold text-white -rotate-45">{health}</span>
        </div>
        <div className="bg-white flex items-center justify-center">
          {/* Special hazard - left blank for now */}
          <span className="font-bold text-black -rotate-45"></span>
        </div>
      </div>
    </div>
  )
}
