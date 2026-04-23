import React, { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { 
  Users, ClipboardList, Plus, Search, CheckCircle2, 
  Clock, AlertCircle, Trash2, Send, UserPlus
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ManagerPortal() {
  const { currentUser, userData } = useAuth()
  const { 
    hrEmployees, hrTasks, hrDepartments, 
    addTask, updateTask, deleteTask, assignToTeam 
  } = useApp()
  
  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' or 'team'
  const [showTaskForm, setShowTaskForm] = useState(false)
  
  // 1. Identify my staff
  const myTeam = useMemo(() => 
    hrEmployees.filter(e => e.managerId === currentUser?.uid),
    [hrEmployees, currentUser]
  )

  const myDept = useMemo(() => 
    hrDepartments.find(d => d.id === userData?.managedDepartmentId),
    [hrDepartments, userData]
  )

  // 2. Identify available employees (same branch, not assigned to me, not assigned to others)
  // 2. Identify available employees (Same branch, same department, unmanaged)
  const availableEmployees = useMemo(() => {
    const myDeptName = myDept?.name?.toLowerCase()
    
    // First try: Same Branch + Same Department
    const sameDept = hrEmployees.filter(e => 
      e.branchId === userData?.branchId && 
      e.department?.toLowerCase() === myDeptName &&
      !e.managerId && 
      !e.isManager
    )

    if (sameDept.length > 0) return sameDept

    // Fallback: Show all unmanaged staff in the same branch if department match is empty
    return hrEmployees.filter(e => 
      e.branchId === userData?.branchId && 
      !e.managerId && 
      !e.isManager
    )
  }, [hrEmployees, userData, myDept])

  const myTasks = useMemo(() => 
    hrTasks.filter(t => t.assignedBy === currentUser?.uid),
    [hrTasks, currentUser]
  )

  const assignablePeople = useMemo(() => {
    return [...myTeam, ...availableEmployees]
  }, [myTeam, availableEmployees])

  // ── Render: Team Hub ──────────────────────────────────────────────────────
  if (activeTab === 'team') {
    return (
      <div className="animate-in">
        <PortalHeader activeTab={activeTab} setActiveTab={setActiveTab} deptName={myDept?.name} />
        
        <div className="grid-2 gap-6 mt-6">
          <div className="card p-6">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <Users size={18} className="text-primary" /> My Team ({myTeam.length})
            </h3>
            <div className="space-y-3">
              {myTeam.length === 0 ? (
                <div className="empty-state p-4 border-dashed">
                  <p className="text-sm text-muted">You haven't added anyone to your team yet.</p>
                </div>
              ) : (
                myTeam.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-hover rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 36, height: 36 }}>
                        {m.name.split(' ').map(n=>n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-700">{m.name}</div>
                        <div className="text-xs text-muted">{m.role}</div>
                      </div>
                    </div>
                    <button 
                      className="btn btn-ghost btn-sm text-danger" 
                      onClick={() => assignToTeam(m.id, null)}
                      title="Remove from team"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6" style={{ background: 'rgba(99,102,241,0.02)' }}>
            <h3 className="section-title mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-green" /> Recruit for Team
            </h3>
            <p className="text-xs text-muted mb-4 italic">Only employees registered by HR and not currently in a team are shown here.</p>
            <div className="space-y-3">
              {availableEmployees.length === 0 ? (
                <p className="text-center text-xs text-muted p-4">No available employees found in your branch.</p>
              ) : (
                availableEmployees.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border shadow-sm">
                    <div>
                      <div className="fw-600 text-sm">{e.name}</div>
                      <div className="text-xs text-muted">{e.role} · {e.department}</div>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => assignToTeam(e.id, currentUser.uid)}
                    >
                      Add to Team
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Task Master ───────────────────────────────────────────────────
  return (
    <div className="animate-in">
      <PortalHeader activeTab={activeTab} setActiveTab={setActiveTab} deptName={myDept?.name} />
      
      <div className="mt-8">
        <div className="section-header flex justify-between items-center bg-hover p-4 rounded-xl border border-border">
          <div>
            <h3 className="section-title mb-0">Assigned Work</h3>
            <p className="section-sub">Tracking progress and workflow for your staff</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowTaskForm(true)}>
            <Send size={15} /> Assign New Work
          </button>
        </div>

        <div className="mt-6 card overflow-hidden">
          <table className="w-100">
            <thead>
              <tr style={{ background: 'var(--bg-hover)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px' }}>Task Description</th>
                <th style={{ padding: '12px 16px', fontSize: '12px' }}>Assigned To</th>
                <th style={{ padding: '12px 16px', fontSize: '12px' }}>Due Date</th>
                <th style={{ padding: '12px 16px', fontSize: '12px' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myTasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted">No tasks assigned yet.</td>
                </tr>
              ) : (
                myTasks.map(t => {
                  const assignee = myTeam.find(m => m.authUid === t.assignedTo) || hrEmployees.find(e => e.authUid === t.assignedTo)
                  return (
                    <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>
                        <div className="fw-700">{t.title}</div>
                        <div className="text-xs text-muted">{t.description}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div className="text-sm fw-600">{assignee?.name || 'Unknown'}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div className="text-sm">{formatDate(t.dueDate)}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${t.status === 'completed' ? 'active' : 'warning'}`}>
                          {t.status === 'completed' ? <CheckCircle2 size={10} style={{ marginRight: 4 }} /> : <Clock size={10} style={{ marginRight: 4 }} />}
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => deleteTask(t.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTaskForm && (
        <TaskForm 
          team={assignablePeople} 
          onClose={() => setShowTaskForm(false)} 
          onSubmit={(data) => {
            addTask({ ...data, assignedBy: currentUser.uid })
            setShowTaskForm(false)
          }}
        />
      )}
    </div>
  )
}

function PortalHeader({ activeTab, setActiveTab, deptName }) {
  return (
    <div className="page-header">
      <div className="flex justify-between items-end">
        <div>
          <h1 style={{ marginBottom: '4px' }}>Manager Portal</h1>
          <p className="text-primary fw-800" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {deptName || 'Department'} Head
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setActiveTab('tasks')}
          >
            <ClipboardList size={16} /> Workflows
          </button>
          <button 
            className={`btn ${activeTab === 'team' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setActiveTab('team')}
          >
            <Users size={16} /> My Team
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskForm({ team, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: new Date().toISOString().split('T')[0]
  })

  const handleSub = (e) => {
    e.preventDefault()
    if (!formData.assignedTo) return alert('Select staff member')
    onSubmit(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2 className="section-title">Assign New Work</h2>
          <button className="toggle-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSub}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input 
                className="form-control" 
                required 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Weekly Report"
              />
            </div>
            <div className="form-group mt-3">
              <label className="form-label">Description</label>
              <textarea 
                className="form-control" 
                rows="3" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
            <div className="grid-2 gap-4 mt-3">
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select 
                  className="form-control" 
                  required 
                  value={formData.assignedTo} 
                  onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                >
                  <option value="">-- Select Member --</option>
                  {team.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  required 
                  value={formData.dueDate} 
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Send Invitation</button>
          </div>
        </form>
      </div>
    </div>
  )
}
