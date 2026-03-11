import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnrolledClasses, joinClass } from '../api';
import { useAuth } from '../AuthContext';

export default function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadClasses(); }, []);

  const loadClasses = async () => {
    try {
      const res = await getEnrolledClasses();
      setClasses(res.data);
    } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    setError('');
    try {
      await joinClass(inviteCode);
      setShowModal(false); setInviteCode('');
      loadClasses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join');
    }
  };

  return (
    <div>
      <nav className="navbar">
        <span className="navbar-brand">👨‍💻 CodeReview.ai</span>
        <div className="navbar-user">
          <span>👋 {user?.name}</span>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>My Classes</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Join Class</button>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Join a Class</h2>
              <div className="form-group">
                <label>Invite Code</label>
                <input className="input" placeholder="e.g. AB12CD34"
                  value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleJoin} disabled={!inviteCode}>Join</button>
              </div>
            </div>
          </div>
        )}

        {loading ? <p style={{color:'var(--text2)'}}>Loading...</p> : classes.length === 0 ? (
          <div className="empty-state">
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🎓</div>
            <h2>No classes yet</h2>
            <p>Join a class using an invite code from your teacher</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Join your first class</button>
          </div>
        ) : (
          <div className="grid">
            {classes.map(cls => (
              <div key={cls._id} className="card" onClick={() => navigate(`/student/classes/${cls._id}`)}>
                <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>📚</div>
                <h3>{cls.name}</h3>
                <p>{cls.description}</p>
                <div className="stats-row" style={{marginTop:'0.8rem'}}>
                  <span className="stat">👨‍🏫 {cls.teacher?.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
