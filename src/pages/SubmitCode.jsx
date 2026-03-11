import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitCode, getSubmission, getComments, postComment } from '../api';
import { useAuth } from '../AuthContext';

export default function SubmitCode() {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    let interval;
    if (submissionId && polling) {
      interval = setInterval(async () => {
        try {
          const res = await getSubmission(submissionId);
          setSubmission(res.data);
          if (res.data.status !== 'pending') {
            setPolling(false);
            loadComments();
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [submissionId, polling]);

  const loadComments = async () => {
    if (!submissionId) return;
    const res = await getComments(submissionId);
    setComments(res.data);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const res = await submitCode(assignmentId, code);
      setSubmissionId(res.data.id);
      setPolling(true);
    } catch (err) { alert('Submission failed'); }
    finally { setSubmitting(false); }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await postComment(submissionId, { text: newComment, type: 'suggestion' });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (e) {}
  };

  const review = submission?.aiReview;

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
          <h1>💻 Submit Code</h1>
        </div>

        {!submissionId ? (
          <>
            <div className="form-group">
              <label>Your Code</label>
              <textarea className="code-editor" value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="// Write your code here..." />
            </div>
            <button className="btn btn-primary" onClick={handleSubmit}
              disabled={submitting || !code.trim()}>
              {submitting ? 'Submitting...' : '🚀 Submit for AI Review'}
            </button>
          </>
        ) : (
          <>
            <div className="card" style={{marginBottom:'1rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                <span style={{fontSize:'1.5rem'}}>
                  {submission?.status === 'pending' ? '⏳' : submission?.status === 'reviewed' ? '🤖' : '✅'}
                </span>
                <div>
                  <p style={{fontWeight:600}}>
                    {submission?.status === 'pending' ? 'AI is reviewing your code...' :
                     submission?.status === 'reviewed' ? 'AI review complete!' : 'Graded by teacher'}
                  </p>
                  <p style={{fontSize:'0.8rem', color:'var(--text2)'}}>
                    {submission?.status === 'pending' ? 'This usually takes 10-30 seconds' : ''}
                  </p>
                </div>
                <span className={`badge badge-${submission?.status}`} style={{marginLeft:'auto'}}>
                  {submission?.status}
                </span>
              </div>
            </div>

            {review && (
              <div className="ai-review">
                <div className="card" style={{marginBottom:'1rem'}}>
                  <h3>🤖 AI Code Review</h3>
                  <div className="score-display">
                    <span className="score-number" style={{
                      color: review.score >= 70 ? 'var(--success)' : review.score >= 40 ? 'var(--warning)' : 'var(--danger)'
                    }}>{review.score ?? '—'}</span>
                    <div>
                      <p style={{fontWeight:600}}>/ 100</p>
                      <p style={{fontSize:'0.8rem', color:'var(--text2)'}}>Complexity: {review.complexity}</p>
                    </div>
                  </div>
                  <div className="review-section">
                    <h4>📋 Summary</h4>
                    <p style={{fontSize:'0.9rem', lineHeight:'1.6'}}>{review.summary}</p>
                  </div>

                  {review.bugs?.length > 0 && (
                    <div className="review-section">
                      <h4>🐛 Bugs ({review.bugs.length})</h4>
                      {review.bugs.map((bug, i) => (
                        <div key={i} className={`review-item ${bug.severity}`}>
                          <span style={{fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', marginRight:'0.5rem',
                            color: bug.severity==='critical' ? 'var(--danger)' : bug.severity==='warning' ? 'var(--warning)' : 'var(--text2)'}}>
                            {bug.severity}
                          </span>
                          {bug.line && <span style={{color:'var(--text2)'}}>Line {bug.line}: </span>}
                          {bug.description}
                        </div>
                      ))}
                    </div>
                  )}

                  {review.improvements?.length > 0 && (
                    <div className="review-section">
                      <h4>💡 Improvements</h4>
                      {review.improvements.map((imp, i) => (
                        <div key={i} className="review-item">→ {imp.description}</div>
                      ))}
                    </div>
                  )}

                  {review.positives?.length > 0 && (
                    <div className="review-section">
                      <h4>✅ What you did well</h4>
                      {review.positives.map((pos, i) => (
                        <div key={i} className="review-item positive">✓ {pos.description}</div>
                      ))}
                    </div>
                  )}
                </div>

                {submission?.grade && (
                  <div className="card" style={{marginBottom:'1rem', borderColor:'var(--success)'}}>
                    <h3>🏆 Teacher Grade</h3>
                    <p style={{fontSize:'2rem', fontWeight:700, color:'var(--success)'}}>{submission.grade.score}/100</p>
                    {submission.grade.feedback && <p style={{marginTop:'0.5rem', color:'var(--text2)'}}>{submission.grade.feedback}</p>}
                  </div>
                )}

                <div className="card">
                  <h3>💬 Comments</h3>
                  {comments.map((c, i) => (
                    <div key={i} className="comment">
                      <div className="comment-header">
                        <span className="comment-author">{c.authorName}</span>
                        <span className={`badge badge-reviewed`} style={{fontSize:'0.7rem'}}>{c.type}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                    </div>
                  ))}
                  <div style={{display:'flex', gap:'0.5rem', marginTop:'0.8rem'}}>
                    <input className="input" placeholder="Add a comment..."
                      value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleComment()} />
                    <button className="btn btn-primary" onClick={handleComment}>Post</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
