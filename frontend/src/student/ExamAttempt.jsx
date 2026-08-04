// ============================================================
// ExamAttempt.jsx — THE EXAM SCREEN. The most important file of
// the whole frontend, and the one to understand deeply for the viva.
//
// WHAT IT MUST DO (your Activity Diagram 4, in code):
//   load the exam -> start a countdown -> let the student answer
//   and move between questions -> submit on click OR automatically
//   when the timer hits 00:00 -> show the result.
//
// ------------------------------------------------------------
// NEW IDEA 1: useParams() — reading a value FROM THE URL.
// Person A's route is /student/exam/:id  — the ":id" part is a
// placeholder. If the browser is at /student/exam/7, then
// useParams() gives us { id: "7" }. That is how this one component
// can show ANY exam.
//
// NEW IDEA 2: a timer with useEffect + setInterval.
// setInterval(fn, 1000) is plain JavaScript: "run fn every 1000ms".
// We use it to decrease secondsLeft by 1 each second. Two rules:
//   (a) start it inside useEffect (side work, not drawing);
//   (b) ALWAYS stop it when the effect re-runs, by RETURNING a
//       cleanup function: return () => clearInterval(t).
//   Without (b) you would stack a new timer every second and the
//   clock would race. This cleanup line is the classic React
//   beginner mistake — keep it.
//
// NEW IDEA 3: useRef — a value that is remembered but does NOT
// redraw the screen. useState redraws on every change; sometimes
// we just need a flag. submitted = useRef(false) guards against
// double submission (student clicks Submit exactly as the timer
// hits zero). Read/write it as submitted.current.
//
// NEW IDEA 4: an OBJECT in state as a lookup table.
// answers = { 12: "B", 15: "A" }  means question 12 -> option B.
// Looking up answers[q.questionId] tells us what is selected, and
// undefined means "not answered yet". Cheap to read, easy to count.
// ------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import client from '../api/client'

export default function ExamAttempt() {
  const { id } = useParams()          // which exam (from the URL)
  const navigate = useNavigate()      // to jump to the result page

  const [exam, setExam] = useState(null)          // null until loaded
  const [current, setCurrent] = useState(0)       // index of the question on screen (0-based)
  const [answers, setAnswers] = useState({})      // { questionId: "A" }
  const [secondsLeft, setSecondsLeft] = useState(null)
  const submitted = useRef(false)                 // "have we submitted already?"

  // ---------- 1) Load the exam once ----------
  useEffect(() => {
    client.get(`/exams/${id}/attempt`).then((res) => {
      setExam(res.data)
      // durationMinutes comes from the exam Person B created.
      setSecondsLeft(res.data.durationMinutes * 60)
    })
    // IMPORTANT: the JSON that arrives has NO correctOption field —
    // your team's backend sends a student-safe version, so the
    // answer key is not even present in the browser. Check it in
    // DevTools > Network; it is a great viva demonstration.
  }, [id])

  // ---------- 2) The countdown ----------
  useEffect(() => {
    if (secondsLeft === null) return          // exam not loaded yet
    if (secondsLeft <= 0) { handleSubmit(); return }   // TIME OVER -> auto submit

    const t = setInterval(() => {
      // Using (s) => s - 1 means "take the latest value and subtract
      // 1" — safer than writing secondsLeft - 1 inside a timer.
      setSecondsLeft((s) => s - 1)
    }, 1000)

    return () => clearInterval(t)   // cleanup: stop the old timer
  }, [secondsLeft])

  // ---------- 3) Recording an answer ----------
  function choose(questionId, option) {
    // Copy the object and set/overwrite this question's answer.
    setAnswers({ ...answers, [questionId]: option })
  }

  // ---------- 4) Submitting ----------
  async function handleSubmit() {
    if (submitted.current) return      // never submit twice
    submitted.current = true

    // Convert { 12: "B", 15: "A" } into the list your backend wants:
    // [ { questionId: 12, selectedOption: "B" }, ... ]
    // Object.entries turns an object into [key, value] pairs.
    // Skipped questions are simply absent — your GradingService
    // treats them as null/wrong, which is exactly right.
    const payload = {
      answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId: Number(questionId),   // object keys are strings; backend wants a number
        selectedOption,
      })),
    }

    const res = await client.post(`/exams/${id}/submit`, payload)

    // Go to the result page and HAND IT the graded result.
    // The second argument { state: ... } passes data along with the
    // navigation, so the result page does not need to re-fetch.
    navigate('/student/result', { state: res.data })
  }

  // While the exam is still loading, show a simple message.
  if (!exam) return <div className="container">Loading exam...</div>

  const q = exam.questions[current]     // the question currently shown
  // padStart(2,'0') turns 7 into "07" so the clock reads 09:07
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">{exam.title}</h4>
        <div className="timer-box">{mins}:{secs}</div>
      </div>

      <div className="row">
        {/* ---------- LEFT: the current question ---------- */}
        <div className="col-md-8">
          <div className="card p-3">
            <div className="text-muted small mb-1">
              Question {current + 1} of {exam.questions.length} · Topic: {q.topicName}
            </div>
            <p className="fs-5">{q.questionText}</p>

            {/* Four options drawn with .map so we do not repeat markup.
                The extra className is added only for the SELECTED one. */}
            {['A', 'B', 'C', 'D'].map((letter) => (
              <div key={letter}
                   className={'option-row border rounded p-2 mb-2 ' +
                              (answers[q.questionId] === letter ? 'bg-primary-subtle border-primary' : '')}
                   onClick={() => choose(q.questionId, letter)}>
                <strong>{letter}.</strong> {q['option' + letter]}
              </div>
            ))}

            <div className="d-flex justify-content-between mt-2">
              <button className="btn btn-outline-secondary" disabled={current === 0}
                      onClick={() => setCurrent(current - 1)}>Previous</button>
              <button className="btn btn-outline-secondary"
                      disabled={current === exam.questions.length - 1}
                      onClick={() => setCurrent(current + 1)}>Next</button>
            </div>
          </div>
        </div>

        {/* ---------- RIGHT: navigator + submit ---------- */}
        <div className="col-md-4">
          <div className="card p-3">
            <h6>Question Navigator</h6>
            <div className="d-flex flex-wrap gap-2">
              {exam.questions.map((qq, i) => (
                <button key={qq.questionId}
                        className={'btn btn-outline-dark qnav-btn ' +
                                   (answers[qq.questionId] ? 'qnav-answered ' : '') +
                                   (i === current ? 'qnav-current' : '')}
                        onClick={() => setCurrent(i)}>
                  {i + 1}
                </button>
              ))}
            </div>
            <hr />
            <div className="small text-muted mb-2">
              {Object.keys(answers).length} answered ·{' '}
              {exam.questions.length - Object.keys(answers).length} remaining
            </div>
            <button className="btn btn-success w-100" onClick={handleSubmit}>SUBMIT EXAM</button>
            <div className="small text-muted mt-1 text-center">Auto-submits at 00:00</div>
          </div>
        </div>
      </div>
    </div>
  )
}
