import { useEffect, useRef, useState } from 'react'

/** Personal artwork. Playback never gates access to the portfolio. */
export default function WorkspaceScene({ isEnglish }: { isEnglish: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [requestedPlay, setRequestedPlay] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || failed) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    const syncPlayback = () => {
      if (paused || (preference.matches && !requestedPlay) || !visible || document.hidden) video.pause()
      else void video.play().catch(() => setPlaying(false))
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      syncPlayback()
    }, { threshold: 0.15 })
    observer.observe(video)
    preference.addEventListener('change', syncPlayback)
    document.addEventListener('visibilitychange', syncPlayback)
    return () => {
      observer.disconnect()
      preference.removeEventListener('change', syncPlayback)
      document.removeEventListener('visibilitychange', syncPlayback)
      video.pause()
    }
  }, [paused, failed, requestedPlay])

  return (
    <figure className="workspace-scene">
      <div className="workspace-picture">
        {failed ? (
          <img src="/media/workspace-poster.webp" width="1280" height="720"
            alt={isEnglish ? 'Pixel art of a developer at a desk with a sleeping Dachshund' : 'Pixel art de um desenvolvedor na mesa com um Dachshund dormindo'} />
        ) : (
          <video ref={videoRef} loop muted playsInline preload="none"
            poster="/media/workspace-poster.webp" width="1280" height="720"
            aria-label={isEnglish ? 'Animated pixel-art workspace with a sleeping Dachshund' : 'Escritório animado em pixel art com um Dachshund dormindo'}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)}>
            <source src="/media/workspace.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <figcaption>
        {!failed && <button type="button" className="scene-control"
          onClick={() => {
            if (playing) setPaused(true)
            else {
              setPaused(false)
              setRequestedPlay(true)
              // A deliberate press may play even with reduced motion enabled.
              void videoRef.current?.play().catch(() => setPlaying(false))
            }
          }}>
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
            {playing ? <path d="M5 4h3v12H5zm7 0h3v12h-3z" /> : <path d="m6 3 11 7-11 7z" />}
          </svg>
          {playing ? (isEnglish ? 'Pause' : 'Pausar') : (isEnglish ? 'Play' : 'Reproduzir')}
        </button>}
      </figcaption>
    </figure>
  )
}
