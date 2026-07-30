// ============================================================
// ManageExams.jsx — create exams and map questions into them.
// This is your junction-table endpoint (POST /exams/{id}/questions)
// turned into a screen.
//
// NEW IDEA 5: an array in state for CHECKBOXES.
// The "Add Questions" panel shows one checkbox per bank question.
// We keep the ticked ids in an array: checked = [3, 5, 8].
// toggle(id) adds the id if missing, removes it if present —
// using filter (keep all except id) and spread (copy + append).
//
// ALSO NOTE: two panels on one page. selectedExam state decides
// whether the mapping panel is visible ({selectedExam && ...}).
// null = hidden; an exam object = shown for that exam.
// ============================================================
import { useEffect, useState } from 'react'
import client from '../api/client'

export default function ManageExams() {
  const [exams, setExams] = useState([])
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState({ title: '', durationMinutes: 30, passingMarks: 1, scheduledAt: '' })
  const [selectedExam, setSelectedExam] = useState(null)  // which exam's mapping panel is open
  const [checked, setChecked] = useState([])              // ticked questionIds
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    // /exams/all is the ADMIN list (includes exams with 0 questions);
    // students call /exams which hides empty ones.
    const [e, q] = await Promise.all([client.get('/exams/all'), client.get('/questions')])
    setExams(e.data)
    setQuestions(q.data)
  }

  function update(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function createExam(e) {
    e.preventDefault(); setError('')
    try {
      // The datetime-local input gives "2026-07-25T10:00" — exactly the
      // ISO format Spring parses into LocalDateTime. Number(...) turns
      // the text-box strings into real numbers for the backend.
      await client.post('/exams', {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        passingMarks: Number(form.passingMarks),
      })
      setForm({ title: '', durationMinutes: 30, passingMarks: 1, scheduledAt: '' })
      load()
    } catch (err) {
      const d = err.response?.data
      setError(d?.error || Object.values(d || {})[0] || 'Create failed')
    }
  }

  async function removeExam(id) {
    setError('')
    try { await client.delete(`/exams/${id}`); load() }
    catch (err) {
      // An exam that already has student results is protected by the
      // backend — its message appears here.
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  // Checkbox logic: in the array? take it out. Not in? put it in.
  function toggle(qid) {
    setChecked(checked.includes(qid)
      ? checked.filter((x) => x !== qid)   // remove
      : [...checked, qid])                 // add
  }

  async function mapQuestions() {
    setError('')
    try {
      // Your junction endpoint: body { questionIds: [ ... ] }.
      // Sending the same ids twice is safe — the backend skips duplicates.
      await client.post(`/exams/${selectedExam.examId}/questions`, { questionIds: checked })
      setSelectedExam(null); setChecked([]); load()
    } catch (err) {
      setError(err.response?.data?.error || 'Mapping failed')
    }
  }

  return (
    <div className="container">
      <h4>Manage Exams</h4>
      {error && <div className="alert alert-danger py-2">{error}</div>}

      {/* ---------- create-exam form ---------- */}
      <form className="card p-3 my-3" onSubmit={createExam}>
        <div className="row g-2">
          <div className="col-md-4">
            <input className="form-control" name="title" placeholder="Exam title"
                   value={form.title} onChange={update} required />
          </div>
          <div className="col-md-2">
            <input className="form-control" type="number" min="1" name="durationMinutes"
                   placeholder="Duration (min)" value={form.durationMinutes} onChange={update} required />
          </div>
          <div className="col-md-2">
            <input className="form-control" type="number" min="0" name="passingMarks"
                   placeholder="Passing marks" value={form.passingMarks} onChange={update} required />
          </div>
          <div className="col-md-3">
            <input className="form-control" type="datetime-local" name="scheduledAt"
                   value={form.scheduledAt} onChange={update} required />
          </div>
          <div className="col-md-1">
            <button className="btn btn-primary w-100">Create</button>
          </div>
        </div>
      </form>

      {/* ---------- exam list ---------- */}
      <table className="table table-bordered bg-white">
        <thead className="table-light">
          <tr><th>Title</th><th>Scheduled</th><th>Duration</th><th>Passing</th><th>Questions</th><th style={{ width: 220 }}>Actions</th></tr>
        </thead>
        <tbody>
          {exams.map((ex) => (
            <tr key={ex.examId}>
              <td>{ex.title}</td>
              {/* replace('T',' ') just makes 2026-07-25T10:00 readable */}
              <td>{ex.scheduledAt?.replace('T', ' ')}</td>
              <td>{ex.durationMinutes} min</td>
              <td>{ex.passingMarks}</td>
              <td>{ex.totalQuestions}</td>
              <td>
                <button className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => { setSelectedExam(ex); setChecked([]) }}>Add Questions</button>
                <button className="btn btn-sm btn-outline-danger"
                        onClick={() => removeExam(ex.examId)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---------- mapping panel (only when an exam is selected) ---------- */}
      {selectedExam && (
        <div className="card p-3">
          <h6>Add questions to: {selectedExam.title}</h6>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {questions.map((q) => (
              <div className="form-check" key={q.questionId}>
                <input className="form-check-input" type="checkbox"
                       checked={checked.includes(q.questionId)}
                       onChange={() => toggle(q.questionId)} />
                <label className="form-check-label">[{q.topicName}] {q.questionText}</label>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <button className="btn btn-primary me-2" onClick={mapQuestions}
                    disabled={checked.length === 0}>
              Map {checked.length} question(s)
            </button>
            <button className="btn btn-secondary" onClick={() => setSelectedExam(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
