import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignments, createAssignment } from '../api';
import { useAuth } from '../AuthContext';

export default function ClassDetail() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'teacher';
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', language: 'javascript', deadline: '', maxGrade: 100 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAssignments(); }, [classId]);

  const loadAssignments = async () => {
    try {
      const res = await getAssignments(classId);
      setAssignments(res.data);
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      await createAssignment(classId, form);
      setShowModal(false);
      setForm({ title: '', description: '', language: 'javascript', deadline: '', maxGrade: 100 });
      loadAssignments();
    } catch (err) { alert('Failed to create assignment'); }
  };

  const handleAssignmentClick = (a) => {
    if (isTeacher) navigate(`/teacher/assignments/${a._id}/review`);
    else navigate(`/student/assignments/${a._id}/submit`);
  };

  const LANGUAGES = ['javascript', 'python', 'php', 'java', 'typescript', 'cpp', 'c', 'rust'];

  return (
    <div>
      <nav className="navbar">
        <span className="navbar-brand">👨‍💻 CodeReview.ai</span>
        <div className="navbar-user">
          <button className="btn btn-secondary" onClick={() => navigate(isTeacher ? '/teacher' : '/student')}>← Back</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>📝 Assignments</h1>
          {isTeacher && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Assignment</button>}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Create Assignment</h2>
              <div className="form-group">
                <label>Title</label>
                <input className="input" placeholder="e.g. Build a REST API"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="input" rows={3} placeholder="What should students build?"
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Language</label>
                <select className="input" value={form.language} onChange={e => setForm({...form, language: e.target.value})}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Deadline (optional)</label>
                <input className="input" type="datetime-local"
                  value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Max Grade</label>
                <input className="input" type="number" value={form.maxGrade}
                  onChange={e => setForm({...form, maxGrade: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!form.title}>Create</button>
              </div>
            </div>
          </div>
        )}

        {loading ? <p style={{color:'var(--text2)'}}>Loading...</p> : assignments.length === 0 ? (
          <div className="empty-state">
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>📝</div>
            <h2>No assignments yet</h2>
            {isTeacher ? <p>Create the first assignment for this class</p> : <p>Your teacher hasn't added assignments yet</p>}
          </div>
        ) : (
          <div className="grid">
            {assignments.map(a => (
              <div key={a._id} className="card" onClick={() => handleAssignmentClick(a)}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'0.5rem'}}>
                  <h3>{a.title}</h3>
                  <span style={{fontSize:'0.75rem', background:'var(--bg3)', padding:'0.2rem 0.5rem', borderRadius:'6px', color:'var(--primary)', fontFamily:'var(--mono)'}}>{a.language}</span>
                </div>
                <p>{a.description}</p>
                <div className="stats-row" style={{marginTop:'0.8rem'}}>
                  {a.deadline && <span className="stat">⏰ {new Date(a.deadline).toLocaleDateString()}</span>}
                  <span className="stat">🏆 Max: {a.maxGrade}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
