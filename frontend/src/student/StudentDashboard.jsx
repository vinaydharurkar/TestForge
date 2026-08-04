// ============================================================
// StudentDashboard.jsx — the student's home page (PERSON C).
// Start with this file: it uses only ideas you already know
// (useEffect to load data, .map to draw rows) plus one new one.
//
// NEW IDEA 1: a component INSIDE the same file.
// At the bottom you will find a small <Stat/> component. The four
// summary cards look identical except for their label and number,
// so instead of copying markup four times we write it once and
// pass different PROPS: <Stat label="Exams Taken" value={3} />.
// A file may hold several components; only the "export default"
// one is the page.
//
// NOTE: the four stat numbers come from PERSON D's endpoint
// (/dashboard/student/{id}). This is the one place your screen
// shows their data. If D is not ready yet, the .catch() below
// simply leaves the cards hidden — your exam list still works.
// ============================================================
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { getSession } from '../auth/authService'

export default function StudentDashboard() {
  const [exams, setExams] = useState([])     // the exams this student can take
  const [stats, setStats] = useState(null)   // null = not loaded yet, so cards stay hidden

  // getSession() reads what Person A saved at login.
  const { name, userId } = getSession()

  useEffect(() => {
    // GET /exams returns ONLY exams that have questions mapped
    // (Person B's "published" rule, enforced in the backend).
    client.get('/exams').then((res) => setExams(res.data))

    // Person D's summary counts. .catch(() => {}) means "if this
    // fails, do nothing" — so a missing/incomplete D module never
    // breaks your page.
    client.get(`/dashboard/student/${userId}`)
      .then((res) => setStats(res.data))
      .catch(() => {})
  }, [userId])   // re-run if the logged-in user ever changes

  return (
    <div className="container">
      <h4>Welcome back, {name}</h4>

      {/* Show the cards only once stats have arrived */}
      {stats && (
        <div className="row g-3 my-1">
          <Stat label="Available Exams" value={stats.availableExams} />
          <Stat label="Exams Taken" value={stats.examsTaken} />
          <Stat label="Average %" value={stats.averagePercentage} />
          <Stat label="Weak Topics" value={stats.weakTopicsCount} />
        </div>
      )}

      <h5 className="mt-4">Available Exams</h5>
      <table className="table table-bordered bg-white">
        <thead className="table-light">
          <tr>
            <th>Exam</th><th>Scheduled</th><th>Duration</th>
            <th>Questions</th><th>Passing</th><th></th>
          </tr>
        </thead>
        <tbody>
          {exams.map((ex) => (
            <tr key={ex.examId}>
              <td>{ex.title}</td>
              <td>{ex.scheduledAt?.replace('T', ' ')}</td>
              <td>{ex.durationMinutes} min</td>
              <td>{ex.totalQuestions}</td>
              <td>{ex.passingMarks}</td>
              <td>
                {/* A Link is an <a> that switches pages without reloading.
                    The exam id goes INTO the address: /student/exam/7 */}
                <Link className="btn btn-sm btn-primary" to={`/student/exam/${ex.examId}`}>
                  Start
                </Link>
              </td>
            </tr>
          ))}
          {exams.length === 0 && (
            <tr><td colSpan="6" className="text-muted">No exams available yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// The small reusable card. It receives two props and returns markup.
function Stat({ label, value }) {
  return (
    <div className="col-6 col-md-3">
      <div className="card p-3 text-center">
        <div className="fs-3 fw-bold">{value}</div>
        <div className="text-muted small text-uppercase">{label}</div>
      </div>
    </div>
  )
}
