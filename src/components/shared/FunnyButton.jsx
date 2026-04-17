import React, { useState } from 'react'

export default function FunnyButton({ 
  onClick, 
  label, 
  isFormValid, 
  type = "submit", 
  className = "btn btn-primary" 
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    if (!isFormValid) {
      // Small, funny random jumps within a tight radius (+-60px)
      // This keeps the button within the modal's reach
      const jumpX = (Math.random() - 0.5) * 120 
      const jumpY = (Math.random() - 0.5) * 120
      
      setOffset({ 
        x: jumpX, 
        y: jumpY 
      })
    }
  }

  // Auto-reset when form is valid
  React.useEffect(() => {
    if (isFormValid) setOffset({ x: 0, y: 0 })
  }, [isFormValid])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type={type}
        className={className}
        onClick={isFormValid ? onClick : (e) => e.preventDefault()}
        onMouseEnter={handleMouseMove}
        onMouseMove={handleMouseMove}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: isFormValid ? 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 0.1s ease-out',
          position: 'relative',
          cursor: isFormValid ? 'pointer' : 'help',
          whiteSpace: 'nowrap',
          zIndex: 5
        }}
      >
        {label}
      </button>
    </div>
  )
}
