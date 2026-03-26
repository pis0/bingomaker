/**
 * ConnectionOverlay — shown when a network request fails and retry is in progress.
 *
 * Pure HTML/CSS overlay (React DOM layer, not PixiJS) with backdrop-blur
 * and a CSS spinner. Sits on top of the game canvas via z-index.
 */
export default function ConnectionOverlay() {
  return (
    <div className="connection-overlay">
      <div className="connection-spinner" />
    </div>
  )
}
