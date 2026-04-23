import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, firebaseConfig } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Lock, Mail, User, KeyRound, ShieldAlert, Building2, Users, Stethoscope, ChevronLeft, ClipboardList } from 'lucide-react';

export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState(null); // 'ceo', 'hr', 'employee'
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // Map portal selection to the expected Firestore role
  const PORTAL_TO_ROLE = {
    ceo: 'owner',
    hr: 'hr',
    manager: 'manager',
    employee: 'employee'
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setIsLogin(true); // Always default to login view
    setError('');
    setEmail('');
    setPassword('');
    setAdminKey('');
  };

  const handleBack = () => {
    setSelectedRole(null);
    setError('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        // CEO registration — signup directly (only available on CEO portal)
        await signup(email, password, name, adminKey);
        navigate('/hr');
        setLoading(false);
        return;
      }

      // Step 1: Authenticate via REST API (does NOT trigger onAuthStateChanged)
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message === 'INVALID_LOGIN_CREDENTIALS' 
          ? 'Invalid email or password.' 
          : data.error.message || 'Authentication failed.');
      }

      const uid = data.localId;

      // Step 2: Check the user's role in Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));
      const actualRole = userDoc.exists() ? userDoc.data().role : null;
      const expectedRole = PORTAL_TO_ROLE[selectedRole];

      if (actualRole !== expectedRole) {
        // Role mismatch — never sign in, just show the error
        const portalNames = { owner: 'CEO / Owner', hr: 'HR Manager', manager: 'Department Head', employee: 'Employee' };
        setError(`This account is registered as "${portalNames[actualRole] || 'Unknown'}". Please use the correct portal to sign in.`);
        setLoading(false);
        return;
      }

      // Step 3: Role matches — now do the real Firebase sign in
      await login(email, password);
      
      // Navigate to correct portal
      if (selectedRole === 'employee') {
        navigate('/me');
      } else if (selectedRole === 'manager') {
        navigate('/hr/manager');
      } else {
        navigate('/hr');
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    }

    setLoading(false);
  }

  // --- View: Role Selection Portal Navigation ---
  if (!selectedRole) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-body)',
        padding: '20px'
      }}>
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>MediHR Portals</h1>
            <p className="text-muted" style={{ fontSize: '16px' }}>Select your designated login portal to continue</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            
            {/* CEO Portal Card */}
            <div 
              className="card" 
              onClick={() => handleRoleSelect('ceo')}
              style={{ cursor: 'pointer', padding: '40px 20px', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Building2 size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>CEO / Owner</h3>
              <p className="text-muted text-sm" style={{ margin: 0 }}>Full platform and branch management access.</p>
            </div>

            {/* HR Portal Card */}
            <div 
              className="card" 
              onClick={() => handleRoleSelect('hr')}
              style={{ cursor: 'pointer', padding: '40px 20px', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(34,197,94,0.1)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Users size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>HR Manager</h3>
              <p className="text-muted text-sm" style={{ margin: 0 }}>Manage employees, payroll, and attendance.</p>
            </div>

            {/* Manager Portal Card */}
            <div 
              className="card" 
              onClick={() => handleRoleSelect('manager')}
              style={{ cursor: 'pointer', padding: '40px 20px', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <ClipboardList size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Department Head</h3>
              <p className="text-muted text-sm" style={{ margin: 0 }}>Manage your team and assign workflows.</p>
            </div>

            {/* Employee Portal Card */}
            <div 
              className="card" 
              onClick={() => handleRoleSelect('employee')}
              style={{ cursor: 'pointer', padding: '40px 20px', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Stethoscope size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Employee Panel</h3>
              <p className="text-muted text-sm" style={{ margin: 0 }}>View personal attendance and payroll slips.</p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- View: Login / Signup Form ---
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-body)',
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '40px', textAlign: 'center', position: 'relative' }}>
        
        <button 
          onClick={handleBack}
          className="btn btn-ghost" 
          style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px', borderRadius: '50%' }}
          title="Back to Portals"
        >
          <ChevronLeft size={20} />
        </button>

        <div style={{ 
          width: '60px', height: '60px', borderRadius: '16px', margin: '0 auto 20px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          background: selectedRole === 'ceo' ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' :
                      selectedRole === 'hr' ? 'linear-gradient(135deg, var(--green), #4ade80)' :
                      selectedRole === 'manager' ? 'linear-gradient(135deg, var(--primary), #818cf8)' :
                      'linear-gradient(135deg, var(--amber), #fbbf24)'
        }}>
          <Lock size={30} />
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', textTransform: 'capitalize' }}>
          {isLogin ? `${selectedRole} Login` : 'Owner Registration'}
        </h1>
        <p className="text-muted" style={{ fontSize: '14px', marginBottom: '30px' }}>
          {isLogin ? `Access your secure ${selectedRole} dashboard` : 'Register your owner account to manage multiple branches'}
        </p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px', fontSize: '13px', textAlign: 'left', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          {!isLogin && selectedRole === 'ceo' && (
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Full Name</label>
              <div className="search-bar" style={{ width: '100%' }}>
                <User size={16} className="text-muted" style={{ marginLeft: '10px' }} />
                <input 
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="form-control" style={{ border: 'none', background: 'transparent' }} 
                  placeholder="e.g. Dr. Ali" 
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px' }}>Email Address</label>
            <div className="search-bar" style={{ width: '100%' }}>
              <Mail size={16} className="text-muted" style={{ marginLeft: '10px' }} />
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="form-control" style={{ border: 'none', background: 'transparent' }} 
                placeholder="email@clinic.com" 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px' }}>Password</label>
            <div className="search-bar" style={{ width: '100%' }}>
              <Lock size={16} className="text-muted" style={{ marginLeft: '10px' }} />
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="form-control" style={{ border: 'none', background: 'transparent' }} 
                placeholder="••••••••" 
              />
            </div>
          </div>

          {!isLogin && selectedRole === 'ceo' && (
            <div className="form-group" style={{ marginTop: '10px', padding: '16px', background: 'var(--bg-hover)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <label className="form-label" style={{ fontSize: '12px', color: 'var(--primary)' }}>Owner Admin Key</label>
              <div className="search-bar" style={{ width: '100%', background: 'var(--bg-card)' }}>
                <KeyRound size={16} className="text-primary" style={{ marginLeft: '10px' }} />
                <input 
                  type="password" required value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
                  className="form-control" style={{ border: 'none', background: 'transparent' }} 
                  placeholder="Secret access key..." 
                />
              </div>
              <p className="text-xs text-muted mt-2">Required to establish yourself as the platform owner.</p>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '14px', marginTop: '10px', justifyContent: 'center',
              backgroundColor: selectedRole === 'ceo' ? 'var(--primary)' : selectedRole === 'hr' ? 'var(--green)' : selectedRole === 'manager' ? 'var(--primary)' : 'var(--amber)' 
            }}
          >
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Owner Account')}
          </button>
        </form>

        {selectedRole === 'ceo' && (
          <div style={{ marginTop: '24px', fontSize: '13px' }} className="text-muted">
            {isLogin ? "Don't have an owner account?" : "Already an owner?"}
            <button 
              className="btn btn-ghost" 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{ padding: '4px 8px', marginLeft: '8px', color: 'var(--primary)' }}
            >
              {isLogin ? 'Register Now' : 'Sign In'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
