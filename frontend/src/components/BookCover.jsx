const genreStyles = {
  Programming: {
    bg: '#1a1a2e',
    accent: '#5b9bd5',
    textColor: '#ffffff',
    labelColor: 'rgba(255,255,255,0.5)',
    decoration: 'code',
  },
  Database: {
    bg: '#e8ece6',
    accent: '#3d7a5f',
    textColor: '#1a2e1a',
    labelColor: 'rgba(29,46,29,0.45)',
    decoration: 'grid',
  },
  Science: {
    bg: '#f5f0e8',
    accent: '#2c5f7c',
    textColor: '#1a2a3a',
    labelColor: 'rgba(26,42,58,0.4)',
    decoration: 'circles',
  },
  Mathematics: {
    bg: '#f0e8f5',
    accent: '#6b3fa0',
    textColor: '#2a1a3a',
    labelColor: 'rgba(42,26,58,0.4)',
    decoration: 'geometry',
  },
  Literature: {
    bg: '#faf5ed',
    accent: '#8b4513',
    textColor: '#3d1c02',
    labelColor: 'rgba(61,28,2,0.4)',
    decoration: 'classic',
  },
  History: {
    bg: '#f2e8d5',
    accent: '#7c5c3c',
    textColor: '#3a2a18',
    labelColor: 'rgba(58,42,24,0.4)',
    decoration: 'archival',
  },
  'Self-Help': {
    bg: '#1a3030',
    accent: '#e8b84b',
    textColor: '#ffffff',
    labelColor: 'rgba(255,255,255,0.45)',
    decoration: 'minimal',
  },
  Fiction: {
    bg: '#2c1810',
    accent: '#d4956b',
    textColor: '#ffffff',
    labelColor: 'rgba(255,255,255,0.4)',
    decoration: 'bold',
  },
  Design: {
    bg: '#1a1a1a',
    accent: '#e0e0e0',
    textColor: '#ffffff',
    labelColor: 'rgba(255,255,255,0.4)',
    decoration: 'modern',
  },
}

const defaultStyle = {
  bg: '#f5f2ed',
  accent: '#6b5b4a',
  textColor: '#2c2c2c',
  labelColor: 'rgba(44,44,44,0.4)',
  decoration: 'default',
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function Decoration({ type, accent, seed }) {
  const s = seed % 100

  if (type === 'code') {
    return (
      <svg className="cover-decoration" viewBox="0 0 200 300" fill="none">
        <text x="24" y="55" fill={accent} opacity="0.12" fontFamily="'Courier New', monospace" fontSize="11">{'<div>'}</text>
        <text x="36" y="72" fill={accent} opacity="0.09" fontFamily="'Courier New', monospace" fontSize="11">{'  <h1>'}</text>
        <text x="36" y="89" fill={accent} opacity="0.07" fontFamily="'Courier New', monospace" fontSize="11">{'    title'}</text>
        <text x="36" y="106" fill={accent} opacity="0.09" fontFamily="'Courier New', monospace" fontSize="11">{'  </h1>'}</text>
        <text x="24" y="123" fill={accent} opacity="0.12" fontFamily="'Courier New', monospace" fontSize="11">{'</div>'}</text>
        <line x1="24" y1="250" x2="120" y2="250" stroke={accent} strokeWidth="0.5" opacity="0.1" />
        <line x1="24" y1="262" x2="80" y2="262" stroke={accent} strokeWidth="0.5" opacity="0.07" />
        <rect x="148" y="24" width="32" height="32" rx="2" stroke={accent} strokeWidth="0.5" opacity="0.1" />
        <line x1="154" y1="34" x2="170" y2="34" stroke={accent} strokeWidth="0.8" opacity="0.12" />
        <line x1="154" y1="42" x2="166" y2="42" stroke={accent} strokeWidth="0.8" opacity="0.08" />
        {s > 50 && <circle cx="160" cy="200" r={18 + (s % 12)} stroke={accent} strokeWidth="0.4" opacity="0.06" fill="none" />}
      </svg>
    )
  }

  if (type === 'grid') {
    return (
      <svg className="cover-decoration" viewBox="0 0 200 300" fill="none">
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <line x1={24 + i * 22} y1="24" x2={24 + i * 22} y2="140" stroke={accent} strokeWidth="0.4" opacity="0.1" />
            <line x1="24" y1={30 + i * 16} x2="145" y2={30 + i * 16} stroke={accent} strokeWidth="0.4" opacity="0.1" />
          </g>
        ))}
        <rect x="148" y="180" width="28" height="80" rx="1" stroke={accent} strokeWidth="0.5" opacity="0.12" fill={accent} fillOpacity="0.03" />
        <line x1="152" y1="192" x2="172" y2="192" stroke={accent} strokeWidth="0.6" opacity="0.12" />
        <line x1="152" y1="202" x2="168" y2="202" stroke={accent} strokeWidth="0.6" opacity="0.08" />
      </svg>
    )
  }

  if (type === 'circles') {
    return (
      <svg className="cover-decoration" viewBox="0 0 200 300" fill="none">
        <circle cx="155" cy="55" r="32" stroke={accent} strokeWidth="0.5" opacity="0.12" fill="none" />
        <circle cx="165" cy="65" r="16" stroke={accent} strokeWidth="0.4" opacity="0.08" fill="none" />
        <circle cx="40" cy="220" r="22" stroke={accent} strokeWidth="0.4" opacity="0.08" fill={accent} fillOpacity="0.03" />
        <line x1="120" y1="210" x2="176" y2="210" stroke={accent} strokeWidth="0.3" opacity="0.08" />
        <line x1="135" y1="222" x2="172" y2="222" stroke={accent} strokeWidth="0.3" opacity="0.06" />
        <circle cx="162" cy="260" r="3" fill={accent} opacity="0.12" />
        <circle cx="172" cy="254" r="2" fill={accent} opacity="0.08" />
      </svg>
    )
  }

  if (type === 'geometry') {
    return (
      <svg className="cover-decoration" viewBox="0 0 200 300" fill="none">
        <polygon points="155,28 185,78 125,78" stroke={accent} strokeWidth="0.5" opacity="0.1" fill={accent} fillOpacity="0.03" />
        <rect x="135" y="150" width="36" height="36" stroke={accent} strokeWidth="0.4" opacity="0.08" fill="none" transform="rotate(15 153 168)" />
        <circle cx="48" cy="230" r="18" stroke={accent} strokeWidth="0.4" opacity="0.07" fill="none" />
        <line x1="28" y1="40" x2="28" y2="100" stroke={accent} strokeWidth="0.4" opacity="0.08" />
        <line x1="22" y1="40" x2="34" y2="40" stroke={accent} strokeWidth="0.4" opacity="0.08" />
        <line x1="22" y1="100" x2="34" y2="100" stroke={accent} strokeWidth="0.4" opacity="0.08" />
      </svg>
    )
  }

  if (type === 'classic') {
    return (
      <svg className="cover-decoration" viewBox="0 0 200 300" fill="none">
        <rect x="20" y="20" width="160" height="260" rx="1" stroke={accent} strokeWidth="0.6" opacity="0.12" fill="none" />
        <rect x="26" y="26" width="148" height="248" rx="1" stroke={accent} strokeWidth="0.3" opacity="0.07" fill="none" />
        <line x1="36" y1="56" x2="164" y2="56" stroke={accent} strokeWidth="0.4" opacity="0.1" />
        <line x1="100" y1="50" x2="100" y2="62" stroke={accent} strokeWidth="0.5" opacity="0.12" />
        <line x1="36" y1="244" x2="164" y2="244" stroke={accent} strokeWidth="0.4" opacity="0.1" />
        <circle cx="100" cy="260" r="2" fill={accent} opacity="0.1" />
      </svg>
    )
  }

  if (type === 'archival') {
    return (
      <svg className="cover-decoration" viewBox="0 0 200 300" fill="none">
        <line x1="20" y1="36" x2="85" y2="36" stroke={accent} strokeWidth="0.5" opacity="0.12" />
        <line x1="20" y1="48" x2="65" y2="48" stroke={accent} strokeWidth="0.3" opacity="0.08" />
        <rect x="120" y="22" width="52" height="68" rx="2" stroke={accent} strokeWidth="0.5" opacity="0.1" fill={accent} fillOpacity="0.03" />
        <line x1="130" y1="42" x2="162" y2="42" stroke={accent} strokeWidth="0.4" opacity="0.08" />
        <line x1="130" y1="52" x2="156" y2="52" stroke={accent} strokeWidth="0.4" opacity="0.06" />
        <line x1="130" y1="62" x2="160" y2="62" stroke={accent} strokeWidth="0.4" opacity="0.05" />
        <line x1="20" y1="260" x2="105" y2="260" stroke={accent} strokeWidth="0.3" opacity="0.08" />
        <line x1="20" y1="270" x2="70" y2="270" stroke={accent} strokeWidth="0.3" opacity="0.06" />
      </svg>
    )
  }

  if (type === 'minimal') {
    return (
      <svg className="cover-decoration" viewBox="0 0 200 300" fill="none">
        <circle cx="160" cy="48" r="28" stroke={accent} strokeWidth="0.5" opacity="0.1" fill={accent} fillOpacity="0.03" />
        <line x1="20" y1="260" x2="65" y2="260" stroke={accent} strokeWidth="1" opacity="0.12" />
        <line x1="20" y1="272" x2="45" y2="272" stroke={accent} strokeWidth="0.5" opacity="0.07" />
        <rect x="20" y="24" width="3" height="80" rx="1" fill={accent} opacity="0.06" />
      </svg>
    )
  }

  if (type === 'bold') {
    return (
      <svg className="cover-decoration" viewBox="0 0 200 300" fill="none">
        <rect x="20" y="220" width="55" height="3" rx="1" fill={accent} opacity="0.12" />
        <rect x="20" y="230" width="35" height="2" rx="1" fill={accent} opacity="0.07" />
        <circle cx="160" cy="38" r="22" fill={accent} opacity="0.05" />
        <line x1="138" y1="38" x2="182" y2="38" stroke={accent} strokeWidth="0.4" opacity="0.1" />
        <line x1="160" y1="16" x2="160" y2="60" stroke={accent} strokeWidth="0.4" opacity="0.08" />
      </svg>
    )
  }

  if (type === 'modern') {
    return (
      <svg className="cover-decoration" viewBox="0 0 200 300" fill="none">
        <line x1="20" y1="28" x2="20" y2="110" stroke={accent} strokeWidth="0.4" opacity="0.12" />
        <line x1="14" y1="28" x2="26" y2="28" stroke={accent} strokeWidth="0.4" opacity="0.12" />
        <line x1="14" y1="110" x2="26" y2="110" stroke={accent} strokeWidth="0.4" opacity="0.12" />
        <rect x="135" y="210" width="42" height="42" stroke={accent} strokeWidth="0.4" opacity="0.08" fill="none" />
        <line x1="135" y1="231" x2="177" y2="231" stroke={accent} strokeWidth="0.3" opacity="0.06" />
        <line x1="156" y1="210" x2="156" y2="252" stroke={accent} strokeWidth="0.3" opacity="0.06" />
      </svg>
    )
  }

  return (
    <svg className="cover-decoration" viewBox="0 0 200 300" fill="none">
      <line x1="20" y1="32" x2="85" y2="32" stroke={accent} strokeWidth="0.5" opacity="0.1" />
      <line x1="20" y1="44" x2="60" y2="44" stroke={accent} strokeWidth="0.3" opacity="0.07" />
      <rect x="135" y="215" width="40" height="55" rx="1" stroke={accent} strokeWidth="0.4" opacity="0.07" fill="none" />
    </svg>
  )
}

function BookCover({ book, size = 'normal', className = '' }) {
  const genre = book.genre || ''
  const style = genreStyles[genre] || defaultStyle
  const seed = hashString(book.title + book.author)
  const titleLines = book.title.length > 28 ? book.title.substring(0, 28) + '...' : book.title

  const sizeClass = size === 'small' ? 'cover-small' : size === 'hero' ? 'cover-hero' : ''

  return (
    <div className={`editorial-cover ${sizeClass} ${className}`} style={{ background: style.bg }}>
      <Decoration type={style.decoration} accent={style.accent} seed={seed} />

      <div className="cover-content">
        <span className="cover-genre-label" style={{ color: style.labelColor }}>{genre || 'General'}</span>

        <h3 className="cover-title-text" style={{ color: style.textColor }}>{titleLines}</h3>

        <p className="cover-author-text" style={{ color: style.labelColor }}>{book.author}</p>

        <div className="cover-footer">
          <span className="cover-brand" style={{ color: style.labelColor }}>BOOK BANK</span>
          <span className="cover-line" style={{ background: `${style.accent}20` }} />
        </div>
      </div>

      <div className="cover-spine" style={{ background: `${style.accent}18` }} />
    </div>
  )
}

export default BookCover
