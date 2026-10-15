"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Brain,
  BookOpen,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Plus,
  Play,
  Check,
  AlertCircle,
  Layers,
  Award,
  Sparkles,
  X,
  Clock,
} from "lucide-react";
import { StudentProfile } from "./OtherViews";
import { TaskItem } from "./ActionDeck";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  flashcardFront?: string;
  flashcardBack?: string;
  source?: string;
}

export interface QuizItem {
  id: string;
  title: string;
  quizType: "quiz" | "flashcard" | "ulangan";
  sourceType: string;
  sourceTitle: string;
  totalQuestions: number;
  score?: number;
  status: "in_progress" | "completed";
  sessionState?: {
    currentQIndex?: number;
    selectedAnswers?: Record<number, number>;
    showAnswer?: Record<number, boolean>;
    isFlipped?: boolean;
    flashcardMastered?: Record<number, boolean>;
  };
  expiresAt?: string;
  isExpired?: boolean;
  daysRemaining?: number;
  createdAt: string;
  questions: QuizQuestion[];
}

interface QuizSectionProps {
  profile?: StudentProfile;
  courses?: string[];
  tasks?: TaskItem[];
  uploadedDocs?: Array<{
    id: string;
    course_name: string;
    file_name: string;
    topic?: string;
    session_no?: number;
  }>;
}

const LOCAL_STORAGE_KEY = "akademikos_active_quiz_v2";

export default function QuizSection({
  profile,
  courses = [],
  tasks = [],
  uploadedDocs = [],
}: QuizSectionProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  // Setup form states
  const [selectedCourse, setSelectedCourse] = useState<string>(courses[0] || "Semua Mata Kuliah");
  const [selectedSources, setSelectedSources] = useState<string[]>(["catatan"]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedRpsSession, setSelectedRpsSession] = useState<number>(1);
  const [prediksiScope, setPrediksiScope] = useState<"uts" | "uas">("uts");
  const [quizType, setQuizType] = useState<"quiz" | "flashcard" | "ulangan">("quiz");
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Active quiz runtime states
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);

  // Flashcard specific states
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [flashcardMastered, setFlashcardMastered] = useState<Record<number, boolean>>({});

  // Confirmation modal state
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Loading & history states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savedQuizzes, setSavedQuizzes] = useState<QuizItem[]>([]);

  // Toggle multi-source selection
  const handleToggleSource = (key: string) => {
    setSelectedSources((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  // Filter available documents by course
  const filteredDocs = uploadedDocs.filter(
    (d) => selectedCourse === "Semua Mata Kuliah" || d.course_name.toLowerCase().includes(selectedCourse.toLowerCase())
  );

  // Filter available tasks by course
  const filteredTasks = tasks.filter(
    (t) => selectedCourse === "Semua Mata Kuliah" || t.course.toLowerCase().includes(selectedCourse.toLowerCase())
  );

  // Persist session to local storage
  const syncLocalSession = useCallback(
    (
      quiz: QuizItem | null,
      qIndex: number,
      answers: Record<number, number>,
      shown: Record<number, boolean>,
      flipped: boolean,
      mastered: Record<number, boolean>
    ) => {
      if (!quiz) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return;
      }
      try {
        const payload = {
          quiz,
          currentQIndex: qIndex,
          selectedAnswers: answers,
          showAnswer: shown,
          isFlipped: flipped,
          flashcardMastered: mastered,
          timestamp: Date.now(),
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.error("Local session save error:", e);
      }
    },
    []
  );

  // Fetch quizzes from API
  const fetchQuizzes = async () => {
    try {
      const res = await fetch("/api/quiz");
      if (res.ok) {
        const data = await res.json();
        setSavedQuizzes(data.quizzes || []);
      }
    } catch (e) {
      console.error("Failed to load quizzes:", e);
    }
  };

  // Initial load: fetch saved list and restore active session if present
  useEffect(() => {
    fetchQuizzes();

    // Check local storage for active session
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const ageMs = Date.now() - (parsed.timestamp || 0);
        // Valid for up to 7 days (604,800,000 ms)
        if (parsed.quiz && ageMs < 7 * 24 * 60 * 60 * 1000) {
          setActiveQuiz(parsed.quiz);
          setCurrentQIndex(parsed.currentQIndex || 0);
          setSelectedAnswers(parsed.selectedAnswers || {});
          setShowAnswer(parsed.showAnswer || {});
          setIsFlipped(parsed.isFlipped || false);
          setFlashcardMastered(parsed.flashcardMastered || {});
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to restore session from cache:", e);
    }
  }, []);

  // Update session locally whenever play state progresses
  useEffect(() => {
    if (activeQuiz && !isQuizCompleted) {
      syncLocalSession(
        activeQuiz,
        currentQIndex,
        selectedAnswers,
        showAnswer,
        isFlipped,
        flashcardMastered
      );
    }
  }, [activeQuiz, currentQIndex, selectedAnswers, showAnswer, isFlipped, flashcardMastered, isQuizCompleted, syncLocalSession]);

  // Create new quiz
  const handleStartQuiz = async () => {
    setIsLoading(true);

    const sourceTitles: string[] = [];
    if (selectedSources.includes("catatan")) {
      const doc = filteredDocs.find((d) => d.id === selectedDocId) || filteredDocs[0];
      sourceTitles.push(doc ? doc.file_name : "Catatan Berkas");
    }
    if (selectedSources.includes("tugas")) {
      const t = filteredTasks.find((item) => item.id === selectedTaskId) || filteredTasks[0];
      sourceTitles.push(t ? t.title : "Bank Tugas");
    }
    if (selectedSources.includes("rps")) {
      sourceTitles.push(`RPS Sesi ${selectedRpsSession}`);
    }
    if (selectedSources.includes("prediksi")) {
      sourceTitles.push(prediksiScope === "uts" ? "Prediksi UTS" : "Prediksi UAS");
    }

    const combinedSourceTitle = sourceTitles.join(" + ") || "Materi Terpadu";

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: selectedCourse === "Semua Mata Kuliah" ? (courses[0] || "Umum") : selectedCourse,
          sources: selectedSources,
          sourceType: selectedSources.join(", "),
          sourceTitle: combinedSourceTitle,
          quizType,
          questionCount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.quiz) {
          setActiveQuiz(data.quiz);
          setCurrentQIndex(0);
          setSelectedAnswers({});
          setShowAnswer({});
          setIsQuizCompleted(false);
          setFinalScore(0);
          setIsFlipped(false);
          setFlashcardMastered({});

          syncLocalSession(data.quiz, 0, {}, {}, false, {});
          fetchQuizzes();
        }
      }
    } catch (err) {
      console.error("Error creating quiz:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Option selection
  const handleSelectOption = (optIdx: number) => {
    if (showAnswer[currentQIndex]) return;
    const nextAnswers = { ...selectedAnswers, [currentQIndex]: optIdx };
    const nextShown = { ...showAnswer, [currentQIndex]: true };
    setSelectedAnswers(nextAnswers);
    setShowAnswer(nextShown);

    if (activeQuiz) {
      syncLocalSession(activeQuiz, currentQIndex, nextAnswers, nextShown, isFlipped, flashcardMastered);
    }
  };

  // Finish quiz and evaluate score
  const handleFinishQuiz = async () => {
    if (!activeQuiz) return;
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const calculatedScore = Math.round((correctCount / activeQuiz.questions.length) * 100);
    setFinalScore(calculatedScore);
    setIsQuizCompleted(true);
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    try {
      await fetch("/api/quiz", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeQuiz.id,
          score: calculatedScore,
          status: "completed",
          sessionState: null,
        }),
      });
      fetchQuizzes();
    } catch (e) {
      console.error("Failed to save score:", e);
    }
  };

  // Save current progress and exit to history
  const handleSaveAndExit = async () => {
    if (activeQuiz) {
      const sessionState = {
        currentQIndex,
        selectedAnswers,
        showAnswer,
        isFlipped,
        flashcardMastered,
      };

      try {
        await fetch("/api/quiz", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeQuiz.id,
            status: "in_progress",
            sessionState,
          }),
        });
      } catch (e) {
        console.error("Failed to save progress to server:", e);
      }
    }

    setShowExitModal(false);
    setActiveQuiz(null);
    setActiveTab("history");
    fetchQuizzes();
  };

  // Discard current quiz session
  const handleDiscardSession = async () => {
    if (activeQuiz) {
      try {
        await fetch(`/api/quiz?id=${activeQuiz.id}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete quiz:", e);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setShowExitModal(false);
    setActiveQuiz(null);
    fetchQuizzes();
  };

  // Resume an in-progress quiz from history
  const handleResumeQuiz = (quiz: QuizItem) => {
    setActiveQuiz(quiz);
    setIsQuizCompleted(false);

    if (quiz.sessionState) {
      setCurrentQIndex(quiz.sessionState.currentQIndex || 0);
      setSelectedAnswers(quiz.sessionState.selectedAnswers || {});
      setShowAnswer(quiz.sessionState.showAnswer || {});
      setIsFlipped(quiz.sessionState.isFlipped || false);
      setFlashcardMastered(quiz.sessionState.flashcardMastered || {});

      syncLocalSession(
        quiz,
        quiz.sessionState.currentQIndex || 0,
        quiz.sessionState.selectedAnswers || {},
        quiz.sessionState.showAnswer || {},
        quiz.sessionState.isFlipped || false,
        quiz.sessionState.flashcardMastered || {}
      );
    } else {
      setCurrentQIndex(0);
      setSelectedAnswers({});
      setShowAnswer({});
      setIsFlipped(false);
      setFlashcardMastered({});
      syncLocalSession(quiz, 0, {}, {}, false, {});
    }
  };

  // Delete quiz from history
  const handleDeleteQuiz = async (id: string) => {
    try {
      const res = await fetch(`/api/quiz?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedQuizzes((prev) => prev.filter((q) => q.id !== id));
        if (activeQuiz?.id === id) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setActiveQuiz(null);
        }
      }
    } catch (e) {
      console.error("Failed to delete quiz:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white dark:bg-m3-surface border border-m3-outline-variant p-6 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-m3-primary/10 border border-m3-primary/20 text-m3-primary flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-m3-on-surface">Latihan & Kuis Mandiri</h2>
            <p className="text-xs text-m3-secondary">Evaluasi materi kuliah dengan kuis dan flashcard adaptif.</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-m3-surface-container rounded-2xl border border-m3-outline-variant self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (activeQuiz) {
                setShowExitModal(true);
              } else {
                setActiveTab("create");
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "create" && !activeQuiz
                ? "bg-m3-primary text-m3-on-primary shadow-2xs"
                : "text-m3-secondary hover:text-m3-on-surface"
            }`}
          >
            Mulai Baru
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeQuiz) {
                setShowExitModal(true);
              } else {
                setActiveTab("history");
                fetchQuizzes();
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "history" || activeQuiz
                ? "bg-m3-primary text-m3-on-primary shadow-2xs"
                : "text-m3-secondary hover:text-m3-on-surface"
            }`}
          >
            <span>Riwayat & Bank Soal</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/30 text-current font-mono">
              {savedQuizzes.length}
            </span>
          </button>
        </div>
      </div>

      {/* ACTIVE QUIZ VIEW */}
      {activeQuiz && (
        <div className="bg-white dark:bg-m3-surface border border-m3-outline-variant rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-m3-outline-variant/60 flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-m3-secondary block">
                {activeQuiz.quizType === "flashcard"
                  ? "Kartu Hafalan"
                  : activeQuiz.quizType === "ulangan"
                  ? "Simulasi Ulangan"
                  : "Kuis Pilihan Ganda"}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-m3-on-surface">{activeQuiz.title}</h3>
            </div>

            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-m3-outline-variant text-xs font-semibold text-m3-secondary hover:text-m3-on-surface hover:bg-m3-surface-container transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Jeda / Keluar</span>
            </button>
          </div>

          {/* FLASHCARD MODE */}
          {activeQuiz.quizType === "flashcard" && (
            <div className="max-w-xl mx-auto space-y-5">
              <div className="flex items-center justify-between text-xs text-m3-secondary">
                <span>
                  Kartu {currentQIndex + 1} dari {activeQuiz.questions.length}
                </span>
                <span>{flashcardMastered[currentQIndex] ? "Dikuasai" : "Belum Dikuasai"}</span>
              </div>

              {/* Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`min-h-[240px] p-6 sm:p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none shadow-sm ${
                  isFlipped
                    ? "bg-m3-primary/10 border-m3-primary text-m3-on-surface"
                    : "bg-white dark:bg-m3-surface-container border-m3-outline-variant hover:border-m3-primary text-m3-on-surface"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span
                    className={`px-2.5 py-0.5 rounded-full ${
                      isFlipped ? "bg-m3-primary/20 text-m3-primary" : "bg-m3-surface-container text-m3-secondary"
                    }`}
                  >
                    {isFlipped ? "Definisi / Jawaban" : "Konsep / Pertanyaan"}
                  </span>
                  <span className="text-[10px] text-m3-secondary">Klik kartu untuk membalik</span>
                </div>

                <div className="my-auto text-center py-6">
                  {isFlipped ? (
                    <p className="text-sm sm:text-base font-semibold leading-relaxed whitespace-pre-line">
                      {activeQuiz.questions[currentQIndex]?.flashcardBack ||
                        activeQuiz.questions[currentQIndex]?.explanation}
                    </p>
                  ) : (
                    <h4 className="text-lg sm:text-xl font-bold">
                      {activeQuiz.questions[currentQIndex]?.flashcardFront ||
                        activeQuiz.questions[currentQIndex]?.question}
                    </h4>
                  )}
                </div>

                <div className="text-center text-[10px] text-m3-secondary">
                  {activeQuiz.questions[currentQIndex]?.source && (
                    <span>Sumber: {activeQuiz.questions[currentQIndex]?.source}</span>
                  )}
                </div>
              </div>

              {/* Flashcard Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => {
                    setCurrentQIndex((prev) => prev - 1);
                    setIsFlipped(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-m3-outline-variant text-xs font-semibold disabled:opacity-30 hover:bg-m3-surface-container flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFlashcardMastered((prev) => ({ ...prev, [currentQIndex]: false }));
                      if (currentQIndex < activeQuiz.questions.length - 1) {
                        setCurrentQIndex((prev) => prev + 1);
                        setIsFlipped(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Perlu Diulang
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlashcardMastered((prev) => ({ ...prev, [currentQIndex]: true }));
                      if (currentQIndex < activeQuiz.questions.length - 1) {
                        setCurrentQIndex((prev) => prev + 1);
                        setIsFlipped(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Sudah Paham</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={currentQIndex === activeQuiz.questions.length - 1}
                  onClick={() => {
                    setCurrentQIndex((prev) => prev + 1);
                    setIsFlipped(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-m3-outline-variant text-xs font-semibold disabled:opacity-30 hover:bg-m3-surface-container flex items-center gap-1 cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* QUIZ & ULANGAN MODE */}
          {(activeQuiz.quizType === "quiz" || activeQuiz.quizType === "ulangan") && !isQuizCompleted && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-m3-secondary font-semibold">
                  <span>
                    Soal {currentQIndex + 1} dari {activeQuiz.questions.length}
                  </span>
                  <span>{Object.keys(selectedAnswers).length} Dijawab</span>
                </div>
                <div className="w-full h-2 rounded-full bg-m3-surface-container overflow-hidden">
                  <div
                    className="h-full bg-m3-primary transition-all duration-300"
                    style={{
                      width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="p-5 sm:p-6 rounded-2xl bg-m3-surface-container/30 border border-m3-outline-variant space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-m3-secondary">
                  <span className="font-bold px-2 py-0.5 rounded bg-m3-surface-container border border-m3-outline-variant text-m3-on-surface">
                    {activeQuiz.questions[currentQIndex]?.source || "Materi"}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-m3-on-surface leading-relaxed">
                  {activeQuiz.questions[currentQIndex]?.question}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {activeQuiz.questions[currentQIndex]?.options.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentQIndex] === optIdx;
                  const isChecked = showAnswer[currentQIndex];
                  const isCorrect = optIdx === activeQuiz.questions[currentQIndex].correctAnswer;

                  let optionStyle =
                    "bg-white dark:bg-m3-surface-container/60 border-m3-outline-variant hover:border-m3-primary text-m3-on-surface";
                  if (isChecked) {
                    if (isCorrect) {
                      optionStyle =
                        "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200 font-bold shadow-2xs";
                    } else if (isSelected) {
                      optionStyle =
                        "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-950 dark:text-rose-200 shadow-2xs";
                    } else {
                      optionStyle = "opacity-50 border-m3-outline-variant";
                    }
                  } else if (isSelected) {
                    optionStyle = "bg-m3-primary/10 border-m3-primary text-m3-primary font-semibold shadow-2xs";
                  }

                  const letter = ["A", "B", "C", "D"][optIdx] || String(optIdx + 1);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer ${optionStyle}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isChecked && isCorrect
                            ? "bg-emerald-500 text-white"
                            : isChecked && isSelected
                            ? "bg-rose-500 text-white"
                            : "bg-m3-surface-container text-m3-on-surface-variant"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 leading-relaxed">{option}</span>
                      {isChecked && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      )}
                      {isChecked && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showAnswer[currentQIndex] && (
                <div className="p-4 rounded-2xl bg-m3-surface-container/40 border border-m3-outline-variant text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-m3-primary">
                    <HelpCircle className="w-4 h-4" />
                    <span>Pembahasan:</span>
                  </div>
                  <p className="text-m3-on-surface leading-relaxed pl-5">
                    {activeQuiz.questions[currentQIndex]?.explanation}
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-m3-outline-variant/60">
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => prev - 1)}
                  className="px-4 py-2 rounded-xl border border-m3-outline-variant text-xs font-semibold disabled:opacity-30 hover:bg-m3-surface-container flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {currentQIndex < activeQuiz.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQIndex((prev) => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-m3-primary text-m3-on-primary text-xs font-bold hover:brightness-95 flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Lanjut</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishQuiz}
                    className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Selesaikan Latihan</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SCORE CARD */}
          {isQuizCompleted && (
            <div className="max-w-lg mx-auto text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-m3-secondary">Hasil Latihan</span>
                <h3 className="text-3xl font-extrabold text-m3-on-surface mt-1">{finalScore} / 100</h3>
                <p className="text-xs text-m3-secondary mt-1">
                  {finalScore >= 80
                    ? "Pemahaman materi sangat baik."
                    : finalScore >= 60
                    ? "Hasil cukup baik. Tingkatkan materi yang belum dikuasai."
                    : "Perlu latihan lebih lanjut pada topik ini."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-m3-surface-container/30 border border-m3-outline-variant text-xs">
                <div>
                  <span className="text-m3-secondary block">Benar</span>
                  <span className="font-bold text-emerald-600 text-base">
                    {Math.round((finalScore / 100) * activeQuiz.questions.length)} Soal
                  </span>
                </div>
                <div>
                  <span className="text-m3-secondary block">Salah</span>
                  <span className="font-bold text-rose-600 text-base">
                    {activeQuiz.questions.length - Math.round((finalScore / 100) * activeQuiz.questions.length)} Soal
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnswers({});
                    setShowAnswer({});
                    setIsQuizCompleted(false);
                    setCurrentQIndex(0);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-m3-outline-variant text-xs font-bold hover:bg-m3-surface-container flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ulangi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveQuiz(null);
                    setActiveTab("create");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-m3-primary text-m3-on-primary text-xs font-bold hover:brightness-95 shadow-xs cursor-pointer"
                >
                  Latihan Baru
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SETUP NEW QUIZ FORM */}
      {!activeQuiz && activeTab === "create" && (
        <div className="bg-white dark:bg-m3-surface border border-m3-outline-variant rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-6">
            {/* Mata Kuliah Selector */}
            <div className="space-y-2">
              <label htmlFor="course-select" className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-m3-primary" />
                <span>Mata Kuliah</span>
              </label>
              <select
                id="course-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-3 rounded-2xl border border-m3-outline-variant bg-white dark:bg-m3-surface-container text-xs sm:text-sm font-medium text-m3-on-surface focus:outline-none focus:border-m3-primary cursor-pointer shadow-2xs"
              >
                <option value="Semua Mata Kuliah">Semua Mata Kuliah</option>
                {courses.map((cName) => (
                  <option key={cName} value={cName}>
                    {cName}
                  </option>
                ))}
              </select>
            </div>

            {/* Sumber Soal (Multi-select) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-m3-primary" />
                  <span>Sumber Materi</span>
                </label>
                <span className="text-[11px] text-m3-secondary">{selectedSources.length} dipilih</span>
              </div>

              {/* Multi-select Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: "catatan", label: "Catatan Kuliah", icon: FileText },
                  { key: "tugas", label: "Tugas Lama", icon: CheckCircle2 },
                  { key: "rps", label: "RPS Silabus", icon: BookOpen },
                  { key: "prediksi", label: "Prediksi Ujian", icon: Sparkles },
                ].map((item) => {
                  const isChecked = selectedSources.includes(item.key);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleToggleSource(item.key)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                        isChecked
                          ? "bg-m3-primary/10 border-m3-primary text-m3-on-surface shadow-2xs"
                          : "bg-white dark:bg-m3-surface-container/40 border-m3-outline-variant hover:bg-m3-surface-container/60 text-m3-on-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${isChecked ? "text-m3-primary" : "text-m3-secondary"}`} />
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isChecked
                              ? "bg-m3-primary border-m3-primary text-white"
                              : "border-m3-outline-variant bg-transparent"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <span className="text-xs font-bold block">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Contextual Selectors for Active Sources */}
              <div className="p-4 rounded-2xl bg-m3-surface-container/20 border border-m3-outline-variant/60 text-xs space-y-3">
                {selectedSources.includes("catatan") && (
                  <div className="space-y-1">
                    <label className="font-semibold text-m3-on-surface block">Dokumen Catatan:</label>
                    {filteredDocs.length > 0 ? (
                      <select
                        value={selectedDocId}
                        onChange={(e) => setSelectedDocId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-m3-outline-variant bg-white dark:bg-m3-surface-container text-xs text-m3-on-surface focus:outline-none focus:border-m3-primary cursor-pointer"
                      >
                        <option value="">Semua Dokumen Catatan Terkait</option>
                        {filteredDocs.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.file_name} {doc.session_no ? `(Sesi ${doc.session_no})` : ""} - {doc.course_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[11px] text-m3-secondary">Menggunakan materi modul kurikulum perkuliahan.</p>
                    )}
                  </div>
                )}

                {selectedSources.includes("tugas") && (
                  <div className="space-y-1">
                    <label className="font-semibold text-m3-on-surface block">Riwayat Tugas:</label>
                    {filteredTasks.length > 0 ? (
                      <select
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-m3-outline-variant bg-white dark:bg-m3-surface-container text-xs text-m3-on-surface focus:outline-none focus:border-m3-primary cursor-pointer"
                      >
                        <option value="">Semua Riwayat Tugas Terkait</option>
                        {filteredTasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.course}] {t.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[11px] text-m3-secondary">Menggunakan bank soal tugas standar.</p>
                    )}
                  </div>
                )}

                {selectedSources.includes("rps") && (
                  <div className="space-y-1">
                    <label className="font-semibold text-m3-on-surface block">Sesi Pertemuan RPS (1 - 16):</label>
                    <select
                      value={selectedRpsSession}
                      onChange={(e) => setSelectedRpsSession(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-m3-outline-variant bg-white dark:bg-m3-surface-container text-xs text-m3-on-surface focus:outline-none focus:border-m3-primary cursor-pointer"
                    >
                      {Array.from({ length: 16 }, (_, i) => i + 1).map((sess) => (
                        <option key={sess} value={sess}>
                          Pertemuan {sess} {sess === 8 ? "(UTS)" : sess === 16 ? "(UAS)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedSources.includes("prediksi") && (
                  <div className="space-y-1">
                    <label className="font-semibold text-m3-on-surface block">Target Ujian:</label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-m3-surface-container border border-m3-outline-variant cursor-pointer flex-1 text-xs">
                        <input
                          type="radio"
                          name="prediksiScope"
                          checked={prediksiScope === "uts"}
                          onChange={() => setPrediksiScope("uts")}
                          className="accent-m3-primary"
                        />
                        <span>UTS (Sesi 1 s.d. 7)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-m3-surface-container border border-m3-outline-variant cursor-pointer flex-1 text-xs">
                        <input
                          type="radio"
                          name="prediksiScope"
                          checked={prediksiScope === "uas"}
                          onChange={() => setPrediksiScope("uas")}
                          className="accent-m3-primary"
                        />
                        <span>UAS (Sesi 8 s.d. 16)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Format Latihan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-m3-primary" />
                <span>Format Latihan</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: "quiz", label: "Kuis Pilihan Ganda" },
                  { key: "flashcard", label: "Kartu Hafalan" },
                  { key: "ulangan", label: "Simulasi Ulangan" },
                ].map((fmt) => (
                  <button
                    key={fmt.key}
                    type="button"
                    onClick={() => setQuizType(fmt.key as any)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all text-left ${
                      quizType === fmt.key
                        ? "bg-m3-primary/10 border-m3-primary text-m3-on-surface shadow-2xs"
                        : "bg-white dark:bg-m3-surface-container/40 border-m3-outline-variant hover:bg-m3-surface-container/60 text-m3-on-surface"
                    }`}
                  >
                    <span className="text-xs font-bold block">{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Jumlah Soal & Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-m3-outline-variant/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-m3-on-surface">Jumlah Soal:</span>
                <div className="flex items-center gap-1 bg-m3-surface-container p-1 rounded-xl border border-m3-outline-variant">
                  {[5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        questionCount === count
                          ? "bg-m3-primary text-m3-on-primary shadow-2xs"
                          : "text-m3-secondary hover:text-m3-on-surface"
                      }`}
                    >
                      {count} Soal
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleStartQuiz}
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold hover:brightness-95 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Menyiapkan Latihan...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Mulai Latihan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED QUIZZES / HISTORY VIEW */}
      {activeTab === "history" && !activeQuiz && (
        <div className="bg-white dark:bg-m3-surface border border-m3-outline-variant rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="border-b border-m3-outline-variant/60 pb-3 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-m3-on-surface">Riwayat & Bank Soal</h3>
          </div>

          {savedQuizzes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-m3-outline-variant rounded-2xl space-y-2">
              <Brain className="w-8 h-8 text-m3-secondary/50 mx-auto" />
              <p className="text-xs text-m3-secondary font-medium">Belum ada riwayat latihan.</p>
              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className="px-4 py-2 rounded-xl bg-m3-primary text-m3-on-primary text-xs font-bold hover:brightness-95 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mulai Latihan Baru</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {savedQuizzes.map((quiz) => {
                const isInProgress = quiz.status === "in_progress";
                const isExpired = quiz.isExpired;
                const remaining = quiz.daysRemaining !== undefined ? quiz.daysRemaining : 7;

                return (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-2xl border border-m3-outline-variant bg-m3-surface-container/20 hover:bg-m3-surface-container/40 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-m3-surface-container border border-m3-outline-variant text-m3-on-surface uppercase">
                          {quiz.quizType === "flashcard"
                            ? "Flashcard"
                            : quiz.quizType === "ulangan"
                            ? "Ulangan"
                            : "Quiz"}
                        </span>

                        {isInProgress ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isExpired
                                ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                                : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>
                              {isExpired ? "Kedaluwarsa" : `Sedang Berjalan • Tersisa ${remaining} hari`}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs font-extrabold text-emerald-600">
                            Skor: {quiz.score ?? 0} / 100
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-m3-on-surface line-clamp-2">
                        {quiz.title}
                      </h4>
                      <span className="text-[10px] text-m3-secondary block">
                        {quiz.sourceTitle || quiz.sourceType} • {quiz.totalQuestions} Soal
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-m3-outline-variant/50">
                      {isInProgress && !isExpired ? (
                        <button
                          type="button"
                          onClick={() => handleResumeQuiz(quiz)}
                          className="px-3.5 py-1.5 rounded-xl bg-m3-primary text-m3-on-primary text-xs font-bold hover:brightness-95 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Lanjutkan Latihan</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleResumeQuiz(quiz)}
                          className="px-3.5 py-1.5 rounded-xl border border-m3-outline-variant hover:bg-m3-surface-container text-m3-on-surface text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Ulangi Latihan</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Hapus riwayat ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION EXIT POPUP MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-m3-surface border border-m3-outline-variant max-w-md w-full rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="p-1 rounded-lg text-m3-secondary hover:text-m3-on-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-m3-on-surface">Simpan Sesi Latihan?</h3>
              <p className="text-xs text-m3-secondary mt-1 leading-relaxed">
                Kemajuan latihan Anda akan disimpan otomatis selama 7 hari di tab Riwayat. Anda dapat melanjutkannya kapan saja.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveAndExit}
                className="w-full py-2.5 rounded-xl bg-m3-primary text-m3-on-primary text-xs font-bold hover:brightness-95 transition-all shadow-xs cursor-pointer"
              >
                Simpan & Lanjutkan Nanti
              </button>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="w-full py-2.5 rounded-xl border border-m3-outline-variant text-xs font-semibold text-m3-on-surface hover:bg-m3-surface-container transition-all cursor-pointer"
              >
                Tetap Latihan
              </button>
              <button
                type="button"
                onClick={handleDiscardSession}
                className="w-full py-2 text-center text-xs text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Buang Sesi Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
