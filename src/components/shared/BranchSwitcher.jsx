import React, { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function BranchSwitcher() {
  const { branches, activeBranchId, setActiveBranchId } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  const currentBranch = branches.find(b => b.id === activeBranchId)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="branch-switcher" ref={dropdownRef}>
      <div className="branch-active" onClick={() => setIsOpen(!isOpen)}>
        <MapPin size={16} className="text-primary-light" />
        <span className="branch-label">{currentBranch?.name || 'Select Branch'}</span>
        <ChevronDown size={14} className="text-muted" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      
      <div className={`branch-dropdown ${isOpen ? 'open' : ''}`}>
        <div className="dropdown-header">Select Clinic Location</div>
        {branches.map(branch => (
          <button 
            key={branch.id} 
            className={`branch-option ${branch.id === activeBranchId ? 'active' : ''}`}
            onClick={() => {
              setActiveBranchId(branch.id)
              setIsOpen(false)
            }}
          >
            <div className="branch-option-name">{branch.name}</div>
            {branch.id === activeBranchId && <div className="active-dot"></div>}
          </button>
        ))}
      </div>
    </div>
  )
}
