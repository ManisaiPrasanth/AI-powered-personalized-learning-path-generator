import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../api/client';
import { mlUnits, type MlUnitContent } from '../content/machineLearning';
import { useLanguage } from '../state/LanguageContext';

interface Question {
  id: number;
  text: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
}

interface QuizResponse {
  quiz: {
    id: number;
    title: string;
    totalMarks: number;
  };
  questions: Question[];
}

export const QuizPage: React.FC = () => {
  const api = useApi();
  const navigate = useNavigate();
  const { slug, unitNumber } = useParams();
  const { language } = useLanguage();
  const [data, setData] = useState<QuizResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  // Proctored exam mode state
  const [examActive, setExamActive] = useState(false);
  const [examInitialized, setExamInitialized] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!unitNumber) return;
      setLoading(true);
      try {
        const res = await api.get<QuizResponse>(`/quizzes/unit/${Number(unitNumber)}`);
        setData(res.data);
      } catch (err: any) {
        setResultMessage(err.response?.data?.message ?? 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api, unitNumber]);
  const totalQuestions = data?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;

  const tx =
    language === 'hi'
      ? {
          generate: 'AI से 10 प्रश्न जनरेट करें (+10)',
          generating: 'AI प्रश्न बन रहे हैं...',
          success: 'AI प्रश्न जोड़ दिए गए।'
        }
      : language === 'es'
      ? {
          generate: 'Generar 10 preguntas con IA (+10)',
          generating: 'Generando preguntas...',
          success: 'Preguntas IA agregadas.'
        }
      : {
          generate: 'Generate 10 AI questions (+10)',
          generating: 'Generating AI questions...',
          success: 'AI questions added.'
        };

  function buildQuizContext(unit: MlUnitContent): string {
    const parts: string[] = [];
    parts.push(`Title: ${unit.title}`);
    parts.push(`Overview: ${unit.overview}`);
    parts.push(`Key takeaways: ${unit.keyTakeaways.join(' | ')}`);

    const sections = unit.sections.slice(0, 10);
    for (const s of sections) {
      // Keep code out of quiz-generation context.
      if (s.type === 'code') {
        parts.push(`Section (code): ${s.heading}`);
        continue;
      }
      if (s.type === 'diagram') {
        parts.push(`Section: ${s.heading}`);
        if (s.caption) parts.push(`Diagram caption: ${s.caption}`);
        continue;
      }
      if (s.type === 'callout') {
        parts.push(`Section: ${s.heading}`);
        parts.push(s.body);
        continue;
      }
      parts.push(`Section: ${s.heading}`);
      parts.push(s.body);
      if (s.bullets?.length) parts.push(`Bullets: ${s.bullets.join(' | ')}`);
    }

    parts.push(`Practice tasks: ${unit.practice.slice(0, 5).join(' | ')}`);
    return parts.join('\n').slice(0, 7000);
  }

  const generateAiQuizQuestions = async () => {
    if (!unitNumber) return;
    if (slug !== 'machine-learning') return;
    if (!data) return;

    const unitIdx = Number(unitNumber);
    const unit = mlUnits[unitIdx];
    if (!unit) return;

    setAiBusy(true);
    setAiMessage(null);
    setResultMessage(null);
    setPassed(null);

    // Stop proctoring camera/mic to avoid interruption.
    await endExam();
    setExamInitialized(false);
    setAnswers({});

    setLoading(true);
    try {
      const res = await api.post<{ added?: number; total?: number; message?: string }>(
        '/ai-content/ml-quiz',
        {
          unitId: Number(unitNumber),
          unitNumber: unitIdx,
          unitTitle: unit.title,
          language,
          quizContext: buildQuizContext(unit)
        }
      );

      const reload = await api.get<QuizResponse>(`/quizzes/unit/${Number(unitNumber)}`);
      setData(reload.data);
      setAiMessage(res.data.message ?? tx.success);
    } catch (err: any) {
      setAiMessage(err.response?.data?.message ?? tx.generate);
    } finally {
      setLoading(false);
      setAiBusy(false);
    }
  };

  const endExam = useCallback(async () => {
    setExamActive(false);
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  const startExam = async () => {
    try {
      // Request camera + microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setExamInitialized(true);
      setExamActive(true);
    } catch {
      alert('Camera and microphone access are required to start this exam.');
    }
  };

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [mediaStream]);

  // Automatically start camera/mic once quiz data is loaded
  useEffect(() => {
    if (!examInitialized && !loading && data) {
      void startExam();
    }
  }, [examInitialized, loading, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber) return;
    setSubmitting(true);
    setResultMessage(null);
    try {
      const payload = {
        unitId: Number(unitNumber),
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId: Number(questionId),
          selectedOption
        }))
      };
      const res = await api.post('/quizzes/submit', payload);
      setPassed(res.data.passed);
      setResultMessage(res.data.message);
      // End exam mode once the quiz is submitted
      await endExam();
      if (res.data.passed) {
        setTimeout(() => {
          navigate(`/courses/${slug}`, { replace: true });
        }, 1500);
      } else {
        setTimeout(() => {
          navigate(`/courses/${slug}/units/${unitNumber}/detailed`, { replace: true });
        }, 1500);
      }
    } catch (err: any) {
      setResultMessage(err.response?.data?.message ?? 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-600 dark:text-slate-400">Loading quiz...</p>;
  }

  if (!data) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">{resultMessage ?? 'Quiz not available.'}</p>
    );
  }

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-600 mb-1 dark:text-slate-400">
            <Link to={`/courses/${slug}`} className="hover:text-secondary">
              ← Back to course
            </Link>
          </p>
          <h1 className="text-2xl font-semibold mb-1 text-slate-900 dark:text-slate-50">
            {data.quiz.title}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {totalQuestions} questions • {data.quiz.totalMarks} marks total • Score at least
            70% to unlock the next unit.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-xs text-slate-600 dark:text-slate-400">
          <span>
            Question progress: {answeredCount} / {totalQuestions}
          </span>
        </div>
      </div>
      {slug === 'machine-learning' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              void generateAiQuizQuestions();
            }}
            disabled={aiBusy || submitting || loading}
            className="btn-outline disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {aiBusy ? tx.generating : tx.generate}
          </button>
        </div>
      )}
      {aiMessage && (
        <p className="text-xs text-emerald-700 dark:text-emerald-200 text-right">{aiMessage}</p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr),minmax(260px,0.8fr)] items-start">
        <form onSubmit={handleSubmit} className="space-y-4">
        {data.questions.map((q, idx) => (
          <div
            key={q.id}
            className="card-elevated p-4 space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1 dark:text-slate-400">
              <p>
                Question {idx + 1} of {totalQuestions}
              </p>
            </div>
            <p className="text-sm text-slate-900 mb-2 dark:text-slate-100">{q.text}</p>
            <div className="grid gap-2 text-xs">
              {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 transition-all duration-200 ${
                    answers[q.id] === opt
                      ? 'border-primary bg-primary/10 shadow-soft-xl'
                      : 'border-slate-300 hover:border-secondary/70 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: opt
                      }))
                    }
                    className="text-sky-500"
                  />
                  <span className="font-semibold uppercase text-slate-900 dark:text-slate-100">
                    {opt}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">{q.options[opt]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {resultMessage && (
          <div
            className={`mt-2 rounded-2xl border p-3 text-sm ${
              passed === true
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                : passed === false
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-900 dark:text-amber-100'
                : 'border-red-500/60 bg-red-500/10 text-red-900 dark:text-red-100'
            }`}
          >
            {resultMessage}
          </div>
        )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit quiz'}
            </button>
          </div>
        </form>
        {/* Camera preview while exam is active */}
        {examActive && (
          <div className="w-full">
            <div className="sticky top-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-100 p-3 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-300">
                Exam monitoring (camera)
              </p>
              <video
                ref={videoRef}
                className="w-full aspect-video rounded-xl bg-black"
                muted
                autoPlay
                playsInline
              />
              <p className="text-[0.65rem] text-slate-600 dark:text-slate-500">
                Your camera and microphone stay active until you submit the exam.
              </p>
            </div>
          </div>
        )}
      </div>
      {passed === true && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {Array.from({ length: 25 }).map((_, idx) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              className="absolute w-1 h-4 bg-primary rounded-sm opacity-80"
              style={{
                left: `${Math.random() * 100}%`,
                animation: `confetti-fall 1.5s linear ${Math.random()}s infinite`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
