import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiZap, FiClock, FiActivity, FiVolume2, FiVolumeX,
  FiRefreshCw, FiAward, FiCheck, FiAlertCircle, FiTrendingUp
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Web Audio API Mechanical Keyboard Click Synthesizer
const playKeyClickSound = (soundEnabled = true, isError = false) => {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isError) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    } else {
      // Crisp mechanical click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 100, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (isError ? 0.12 : 0.05));
  } catch (e) {}
};

// Key to Finger Guidance Map
const FINGER_GUIDE_MAP = {
  'q': 'Left Pinky', 'a': 'Left Pinky', 'z': 'Left Pinky', '1': 'Left Pinky',
  'w': 'Left Ring', 's': 'Left Ring', 'x': 'Left Ring', '2': 'Left Ring',
  'e': 'Left Middle', 'd': 'Left Middle', 'c': 'Left Middle', '3': 'Left Middle',
  'r': 'Left Index', 'f': 'Left Index', 'v': 'Left Index', '4': 'Left Index',
  't': 'Left Index', 'g': 'Left Index', 'b': 'Left Index', '5': 'Left Index',
  ' ': 'Thumbs (Spacebar)',
  'y': 'Right Index', 'h': 'Right Index', 'n': 'Right Index', '6': 'Right Index',
  'u': 'Right Index', 'j': 'Right Index', 'm': 'Right Index', '7': 'Right Index',
  'i': 'Right Middle', 'k': 'Right Middle', ',': 'Right Middle', '8': 'Right Middle',
  'o': 'Right Ring', 'l': 'Right Ring', '.': 'Right Ring', '9': 'Right Ring',
  'p': 'Right Pinky', ';': 'Right Pinky', '/': 'Right Pinky', '0': 'Right Pinky',
  '-': 'Right Pinky', '=': 'Right Pinky', "'": 'Right Pinky'
};

const PRACTICE_LESSONS = {
  home_row: [
    "asdf jkl; asdf jkl; fads jkla fjdksla; ask dad fall sad lad flask salsa salad",
    "a s d f j k l ; ff jj dd kk ss ll aa ;; all fall sad dad flask glad calf",
    "dad had a salad; all lads had a fall; a sad lad asks a glad dad"
  ],
  top_row: [
    "qwer tyui op qwer tyui op quote write equip power require top write type pure",
    "we try to write quite pretty poetry without pretty typewriter errors quickly",
    "people prepare pretty papers while quiet writers try to type superior reports"
  ],
  bottom_row: [
    "zxcv bnm zxcv bnm zinc verb cabin mixer zenith maximum brave bronze zero",
    "brave citizens examine bizarre mixed boxes with calm zero carbon vision",
    "zebras move calmly next to vibrant volcanoes with maximum bronze vigor"
  ],
  words: [
    "the quick brown fox jumps over the lazy dog with smooth mechanical rhythm",
    "computer keyboard mouse monitor screen hardware software algorithm programming",
    "learning technology empowers creative young minds to achieve extraordinary heights"
  ],
  paragraphs: [
    "Touch typing is an essential digital superpower that allows you to type effortlessly without looking down at the keyboard keys. By keeping your index fingers calibrated on the F and J bumps, your hands naturally glide across the home row to produce rapid and accurate keystrokes."
  ],
  speed_test: [
    "In the modern digital era, mastering computer fundamentals and touch typing transforms how you communicate, work, and build creative projects. Every second saved through fast typing compounds into hours of enhanced productivity and creative flow. Keep your posture upright, breathe calmly, and type with precision."
  ]
};

const TouchTypingMaster = ({ user, onProgressUpdate }) => {
  const [difficulty, setDifficulty] = useState('home_row'); // 'home_row' | 'top_row' | 'bottom_row' | 'words' | 'paragraphs' | 'speed_test'
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Exercise Text
  const [targetText, setTargetText] = useState(PRACTICE_LESSONS.home_row[0]);
  const [userInput, setUserInput] = useState('');
  const [activeCharIdx, setActiveCharIdx] = useState(0);

  // Live Metrics
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [cpm, setCpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [weakKeysMap, setWeakKeysMap] = useState({});
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize Lesson
  const loadLesson = (mode = difficulty) => {
    const list = PRACTICE_LESSONS[mode] || PRACTICE_LESSONS.home_row;
    const randLesson = list[Math.floor(Math.random() * list.length)];
    setTargetText(randLesson);
    setUserInput('');
    setActiveCharIdx(0);
    setStartTime(null);
    setElapsedSeconds(0);
    setWpm(0);
    setCpm(0);
    setAccuracy(100);
    setMistakesCount(0);
    setWeakKeysMap({});
    setIsTestComplete(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    loadLesson(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty]);

  // Live Timer Tracker
  useEffect(() => {
    if (startTime && !isTestComplete) {
      timerRef.current = setInterval(() => {
        const secs = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(secs);

        // Calculate WPM: (characters / 5) / (seconds / 60)
        const typedChars = userInput.length;
        const currentWpm = Math.round((typedChars / 5) / (secs / 60));
        const currentCpm = Math.round((typedChars / secs) * 60);
        setWpm(currentWpm);
        setCpm(currentCpm);
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isTestComplete, userInput]);

  // Handle Keystrokes
  const handleInputChange = (e) => {
    if (isTestComplete) return;

    const val = e.target.value;
    if (!startTime) {
      setStartTime(Date.now());
    }

    const currentIdx = val.length - 1;
    if (currentIdx >= 0) {
      const typedChar = val[currentIdx];
      const expectedChar = targetText[currentIdx];

      if (typedChar === expectedChar) {
        playKeyClickSound(soundEnabled, false);
      } else {
        playKeyClickSound(soundEnabled, true);
        setMistakesCount(prev => prev + 1);
        if (expectedChar) {
          setWeakKeysMap(prev => ({
            ...prev,
            [expectedChar.toLowerCase()]: (prev[expectedChar.toLowerCase()] || 0) + 1
          }));
        }
      }
    }

    setUserInput(val);
    setActiveCharIdx(val.length);

    // Live Accuracy
    const totalTyped = val.length;
    let correct = 0;
    for (let i = 0; i < totalTyped; i++) {
      if (val[i] === targetText[i]) correct++;
    }
    const acc = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100;
    setAccuracy(acc);

    // Check Completion
    if (val.length >= targetText.length) {
      finishTypingTest(val, acc);
    }
  };

  const finishTypingTest = async (finalInput, finalAcc) => {
    setIsTestComplete(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const totalSecs = Math.max(1, Math.floor((Date.now() - (startTime || Date.now())) / 1000));
    const finalWpm = Math.round((finalInput.length / 5) / (totalSecs / 60));

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    // Save to Database
    if (user?.id) {
      try {
        setIsSaving(true);
        const res = await axios.post(`${API_BASE}api/student/foundations/save_typing_session.php`, {
          user_id: user.id,
          language: 'en',
          difficulty_level: difficulty,
          wpm: finalWpm,
          cpm: Math.round((finalInput.length / totalSecs) * 60),
          accuracy_percent: finalAcc,
          raw_wpm: finalWpm,
          mistakes_count: mistakesCount,
          error_keys: weakKeysMap,
          duration_seconds: totalSecs
        });

        if (res.data?.data?.new_badges?.length > 0) {
          res.data.data.new_badges.forEach(b => {
            toast.success(`🎉 New Badge: ${b.icon} ${b.title}!`, { duration: 3000 });
          });
        }
        if (onProgressUpdate) onProgressUpdate();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const nextChar = targetText[activeCharIdx] || '';
  const fingerGuide = FINGER_GUIDE_MAP[nextChar.toLowerCase()] || 'Press any key';

  // Virtual Keyboard Rows Layout
  const keyboardRows = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
    ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl']
  ];

  return (
    <div className="space-y-6">
      {/* Mode Selector & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Tier Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'home_row', label: '🏠 Home Row' },
            { id: 'top_row', label: '⬆️ Top Row' },
            { id: 'bottom_row', label: '⬇️ Bottom Row' },
            { id: 'words', label: '📝 Common Words' },
            { id: 'paragraphs', label: '📜 Paragraphs' },
            { id: 'speed_test', label: '⚡ 60s Speed Test' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setDifficulty(mode.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                difficulty === mode.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Mute and Reset buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
            title="Toggle Key Click Sound"
          >
            {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
            <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          <button
            onClick={() => loadLesson(difficulty)}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <FiRefreshCw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Speedometer & Live Stats HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FiZap size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Typing Speed</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {wpm} <span className="text-xs font-semibold text-slate-400">WPM</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FiActivity size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Accuracy</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {accuracy}<span className="text-xs font-semibold text-slate-400">%</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
            <FiClock size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Time Elapsed</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {elapsedSeconds}s
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
            <FiAlertCircle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Errors</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {mistakesCount}
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Typing Prompt Stage */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl relative cursor-text transition-all"
      >
        {/* Hidden active Input */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          className="opacity-0 absolute inset-0 w-full h-full cursor-default"
          autoFocus
          disabled={isTestComplete}
        />

        {/* Text Display with Character Cursor Highlighting */}
        <div className="text-lg sm:text-xl md:text-2xl font-mono leading-relaxed select-none tracking-wide text-slate-400 dark:text-slate-500 break-words">
          {targetText.split('').map((char, index) => {
            const isTyped = index < userInput.length;
            const isCorrect = isTyped && userInput[index] === char;
            const isCurrent = index === userInput.length;

            return (
              <span
                key={index}
                className={`transition-colors duration-75 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white px-0.5 rounded-xs animate-pulse font-black shadow-xs'
                    : isTyped
                    ? isCorrect
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 rounded-xs font-bold'
                    : ''
                }`}
              >
                {char === ' ' && isCurrent ? '␣' : char}
              </span>
            );
          })}
        </div>

        {/* Live Finger Positioning Guidance Bubble */}
        {!isTestComplete && nextChar && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center">
                👉
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Next Key: <span className="font-mono text-indigo-600 dark:text-indigo-400 uppercase font-black">[{nextChar === ' ' ? 'SPACE' : nextChar}]</span>
              </span>
              <span className="text-slate-400 font-medium">
                → Use <strong className="text-indigo-500 font-bold">{fingerGuide}</strong>
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              {userInput.length} / {targetText.length} Chars
            </span>
          </div>
        )}

        {/* Completion Celebration Overlay */}
        {isTestComplete && (
          <div className="mt-6 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-4 animate-in zoom-in-95">
            <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              🎉 Drill Finished! {wpm} WPM & {accuracy}% Accuracy
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto font-medium">
              Great progress! Regular 10-minute daily practice builds lifelong muscle memory.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => loadLesson(difficulty)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Practice Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3D Interactive Virtual Keyboard Visualization */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl text-slate-200 space-y-2 select-none overflow-x-auto">
        <div className="flex items-center justify-between mb-2 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Interactive Virtual Keyboard Guide</span>
          <span className="text-indigo-400 font-mono">F & J have tactile bumps</span>
        </div>

        <div className="space-y-1.5 min-w-[620px]">
          {keyboardRows.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1.5">
              {row.map((key, kIdx) => {
                const isTarget = nextChar.toLowerCase() === key.toLowerCase() || (key === 'Space' && nextChar === ' ');
                const isHomeRowBump = key === 'f' || key === 'j';

                let widthClass = 'w-10 sm:w-11';
                if (key === 'Backspace' || key === 'Tab' || key === 'Caps' || key === 'Enter') widthClass = 'w-16 sm:w-20';
                if (key === 'Shift') widthClass = 'w-20 sm:w-24';
                if (key === 'Space') widthClass = 'w-64 sm:w-72';
                if (key === 'Ctrl' || key === 'Alt') widthClass = 'w-12 sm:w-14';

                return (
                  <div
                    key={kIdx}
                    className={`${widthClass} h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all duration-100 ${
                      isTarget
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 scale-105 ring-2 ring-white animate-pulse'
                        : isHomeRowBump
                        ? 'bg-slate-800 text-indigo-300 border-b-2 border-indigo-500'
                        : 'bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{key}</span>
                    {isHomeRowBump && <span className="w-1.5 h-0.5 bg-indigo-400 rounded-full mt-0.5"></span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TouchTypingMaster;
