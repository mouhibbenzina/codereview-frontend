import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyClasses, createClass } from '../api';
import { useAuth } from '../AuthContext';

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadClasses(); }, []);

  const loadClasses = async () => {
    try {
      const res = await getMyClasses();
      setClasses(res.data);
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      await createClass(form);
      setShowModal(false); setForm({ name: '', description: '' });
      loadClasses();
    } catch (err) { alert('Failed to create class'); }
  };

  return (
    <div>
      <nav className="navbar">
        <span className="navbar-brand">👨‍💻 CodeReview.ai</span>
        <div className="navbar-user">
          <span>👋 {user?.name} (Teacher)</span>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>My Classes</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Class</button>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Create New Class</h2>
              <div className="form-group">
                <label>Class Name</label>
                <input className="input" placeholder="e.g. Web Development 2024"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea className="input" rows={3} placeholder="What will students learn?"
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name}>Create</button>
              </div>
            </div>
          </div>
        )}

        {loading ? <p style={{color:'var(--text2)'}}>Loading...</p> : classes.length === 0 ? (
          <div className="empty-state">
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🏫</div>
            <h2>No classes yet</h2>
            <p>Create your first class to get started</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create first class</button>
          </div>
        ) : (
          <div className="grid">
            {classes.map(cls => (
              <div key={cls._id} className="card" onClick={() => navigate(`/teacher/classes/${cls._id}`, { state: cls })}>
                <div style={{fontSize:'2rem', marginBottom:'0.5rem'}}>🏫</div>
                <h3>{cls.name}</h3>
                <p>{cls.description}</p>
                <div className="stats-row" style={{marginTop:'0.8rem'}}>
                  <span className="stat">👥 {cls.studentCount} students</span>
                  <span className="stat">📝 {cls.assignmentCount} assignments</span>
                </div>
                <div className="invite-code">{cls.inviteCode}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
