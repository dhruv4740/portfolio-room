import { useEffect, useRef } from 'react'

/**
 * ProjectCard — overlay card shown when a checkpoint is hit.
 *
 * Props:
 *   project  — project object from PROJECTS, or null
 *   onClose  — callback when user dismisses the card
 */
export default function ProjectCard({ project, onClose }) {
  const cardRef = useRef(null)

  // Slide in when project changes
  useEffect(() => {
    if (!cardRef.current) return
    if (project) {
      cardRef.current.style.opacity  = '0'
      cardRef.current.style.transform = 'translateY(16px)'
      // rAF to trigger transition
      requestAnimationFrame(() => {
        if (!cardRef.current) return
        cardRef.current.style.transition = 'opacity 0.28s ease, transform 0.28s ease'
        cardRef.current.style.opacity    = '1'
        cardRef.current.style.transform  = 'translateY(0)'
      })
    }
  }, [project])

  if (!project) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '12px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div
        ref={cardRef}
        style={{
          pointerEvents: 'auto',
          background: 'rgba(10, 12, 22, 0.88)',
          border: '1px solid rgba(0, 207, 255, 0.35)',
          borderRadius: '10px',
          padding: '14px 16px',
          maxWidth: '240px',
          boxShadow: '0 0 24px rgba(0, 207, 255, 0.15), 0 4px 16px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              fontWeight: 700,
              color: '#e0f0ff',
              lineHeight: 1.3,
              marginRight: '8px',
            }}
          >
            {project.name}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(160,190,220,0.7)',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
              padding: '0 2px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            color: 'rgba(200,220,240,0.8)',
            lineHeight: 1.5,
            marginBottom: '10px',
          }}
        >
          {project.description}
        </p>

        {/* Tech badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
          {project.tech.map(t => (
            <span
              key={t}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                background: 'rgba(0, 207, 255, 0.12)',
                border: '1px solid rgba(0, 207, 255, 0.3)',
                borderRadius: '4px',
                padding: '2px 6px',
                color: '#7dd4fc',
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Link button */}
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: '#00cffe',
            border: '1px solid rgba(0,207,255,0.4)',
            borderRadius: '4px',
            padding: '3px 10px',
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}
        >
          view on github →
        </a>
      </div>
    </div>
  )
}
