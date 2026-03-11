import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissions, getSubmission, gradeSubmission, getComments } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReviewQueue() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fullSub, setFullSub] = useState(null);
  const [comments, setComments] = useState([]);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [grading, setGrading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSubmissions(); }, [assignmentId]);

  const loadSubmissions = async () => {
    try {
      const res = await getSubmissions(assignmentId);
      setSubmissions(res.data);
    } finally { setLoading(false); }
  };

  const selectSubmission = async (sub) => {
    setSelected(sub); setFullSub(null); setComments([]);
    const [subRes, commentsRes] = await Promise.all([
      getSubmission(sub._id),
      getComments(sub._id)
    ]);
    setFullSub(subRes.data);
    setComments(commentsRes.data);
  };

  const handleGrade = async () => {
    setGrading(true);
    try {
      await gradeSubmission(selected._id, gradeForm);
      loadSubmissions();
      selectSubmission(selected);
      setGradeForm({ score: '', feedback: '' });
    } catch (e) { alert('Failed to grade'); }
    finally { setGrading(false); }
  };

  const scoreData = submissions
    .filter(s => s.grade?.score != null)
    .map(s => ({ name: s.student?.name?.split(' ')[0], score: s.grade.score }));

  return (
    <div>
      <nav className="navbar">
        <span className="navbar-brand">👨‍💻 CodeReview.ai</span>
        <div className="navbar-user">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>📋 Review Queue ({submissions.length})</h1>
        </div>

        <div className="review-layout">
          <div className="review-sidebar">
            <h3>Submissions</h3>
            {loading ? <p style={{padding:'1rem', color:'var(--text2)'}}>Loading...</p> :
              submissions.length === 0 ? <p style={{padding:'1rem', color:'var(--text2)'}}>No submissions yet</p> :
              submissions.map(sub => (
                <div key={sub._id} className={`submission-item ${selected?._id === sub._id ? 'active' : ''}`}
                  onClick={() => selectSubmission(sub)}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span className="submission-item-name">{sub.student?.name}</span>
                    <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                  </div>
                  <div className="submission-item-date">{new Date(sub.submittedAt).toLocaleDateString()}</div>
                </div>
              ))
            }
          </div>

          <div>
            {!selected ? (
              <div className="card">
                <p style={{color:'var(--text2)', marginBottom:'1.5rem'}}>👈 Select a submission to review</p>
                {scoreData.length > 0 && (
                  <>
                    <h3 style={{marginBottom:'1rem'}}>📊 Class Scores</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={scoreData}>
                        <XAxis dataKey="name" stroke="var(--text2)" fontSize={12} />
                        <YAxis domain={[0,100]} stroke="var(--text2)" fontSize={12} />
                        <Tooltip contentStyle={{background:'var(--bg2)', border:'1px solid var(--border)'}} />
                        <Bar dataKey="score" fill="var(--primary)" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            ) : (
              <div>
                <div className="card" style={{marginBottom:'1rem'}}>
                  <h3>👤 {selected.student?.name}</h3>
                  <p style={{fontSize:'0.85rem', color:'var(--text2)'}}>
                    Submitted: {new Date(selected.submittedAt).toLocaleString()}
                  </p>
                </div>

                {fullSub?.code && (
                  <div className="card" style={{marginBottom:'1rem'}}>
                    <h3 style={{marginBottom:'0.8rem'}}>💻 Code</h3>
                    <pre style={{fontFamily:'var(--mono)', fontSize:'0.8rem', overflowX:'auto',
                      background:'var(--bg)', padding:'1rem', borderRadius:'8px', lineHeight:'1.6'}}>
                      <code>{fullSub.code}</code>
                    </pre>
                  </div>
                )}

                {fullSub?.aiReview?.summary && (
                  <div className="card" style={{marginBottom:'1rem'}}>
                    <h3 style={{marginBottom:'0.8rem'}}>🤖 AI Pre-Review (Score: {fullSub.aiReview.score}/100)</h3>
                    <p style={{fontSize:'0.9rem', marginBottom:'1rem'}}>{fullSub.aiReview.summary}</p>
                    {fullSub.aiReview.bugs?.length > 0 && (
                      <>
                        <h4 style={{fontSize:'0.8rem', color:'var(--text2)', marginBottom:'0.5rem'}}>🐛 BUGS</h4>
                        {fullSub.aiReview.bugs.map((bug, i) => (
                          <div key={i} className={`review-item ${bug.severity}`}>
                            <strong style={{color: bug.severity==='critical'?'var(--danger)':'var(--warning)'}}>{bug.severity}</strong>: {bug.description}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {comments.length > 0 && (
                  <div className="card" style={{marginBottom:'1rem'}}>
                    <h3 style={{marginBottom:'0.8rem'}}>💬 Peer Comments</h3>
                    {comments.map((c, i) => (
                      <div key={i} className="comment">
                        <div className="comment-header">
                          <span className="comment-author">{c.authorName}</span>
                        </div>
                        <p className="comment-text">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {!fullSub?.grade?.score ? (
                  <div className="card">
                    <h3 style={{marginBottom:'1rem'}}>✏️ Grade This Submission</h3>
                    <div className="form-group">
                      <label>Score (0-100)</label>
                      <input className="input" type="number" min="0" max="100"
                        placeholder="85" value={gradeForm.score}
                        onChange={e => setGradeForm({...gradeForm, score: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Feedback for student</label>
                      <textarea className="input" rows={4} placeholder="Great work on..."
                        value={gradeForm.feedback}
                        onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})} />
                    </div>
                    <button className="btn btn-primary" onClick={handleGrade}
                      disabled={grading || !gradeForm.score}>
                      {grading ? 'Saving...' : '✅ Submit Grade'}
                    </button>
                  </div>
                ) : (
                  <div className="card" style={{borderColor:'var(--success)'}}>
                    <h3>✅ Graded</h3>
                    <p style={{fontSize:'2rem', fontWeight:700, color:'var(--success)'}}>{fullSub.grade.score}/100</p>
                    {fullSub.grade.feedback && <p style={{color:'var(--text2)', marginTop:'0.5rem'}}>{fullSub.grade.feedback}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
