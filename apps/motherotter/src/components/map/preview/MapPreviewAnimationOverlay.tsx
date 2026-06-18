import { DeOttererIconSvg } from '../../de-otterer/DeOttererIconSvg'
import { useMapPreviewAnimationStore } from '../../../store/mapPreviewAnimationStore'

export function MapPreviewAnimationOverlay() {
  const sprites = useMapPreviewAnimationStore((state) => state.sprites)

  if (sprites.length === 0) return null

  return (
    <div className="map-preview-animation-overlay" aria-hidden="true">
      {sprites.map((sprite) => (
        <div
          key={sprite.id}
          className="map-preview-animation-sprite"
          style={{
            ['--cell-x' as string]: sprite.x,
            ['--cell-y' as string]: sprite.y,
            opacity: sprite.icon.opacity,
            transform: `rotate(${sprite.icon.rotation}deg) scale(${sprite.icon.scale})`,
          }}
        >
          <DeOttererIconSvg icon={sprite.iconSnapshot} size={24} />
        </div>
      ))}
    </div>
  )
}
