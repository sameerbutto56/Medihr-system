import React from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function BranchSwitcher() {
  const { branches, activeBranchId, setActiveBranchId } = useApp()
  
  const currentBranch = branches.find(b => b.id === activeBranchId)

  return (
    <div className="branch-switcher">
      <div className="branch-active">
        <MapPin size={16} className="text-primary-light" />
        <span className="branch-label">{currentBranch?.name || 'Select Branch'}</span>
        <ChevronDown size={14} className="text-muted" />
      </div>
      
      <div className="branch-dropdown">
        <div className="dropdown-header">Select Clinic Location</div>
        {branches.map(branch => (
          <button 
            key={branch.id} 
            className={`branch-option ${branch.id === activeBranchId ? 'active' : ''}`}
            onClick={() => setActiveBranchId(branch.id)}
          >
            <div className="branch-option-name">{branch.name}</div>
            {branch.id === activeBranchId && <div className="active-dot"></div>}
          </button>
        ))}
      </div>
    </div>
  )
}
