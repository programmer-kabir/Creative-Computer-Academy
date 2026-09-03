import React, { useState, useEffect } from 'react';
import {
  FiCheckCircle, FiAlertTriangle, FiXCircle, FiRefreshCw, FiCheck,
  FiArrowRight, FiShield, FiAlertOctagon, FiX, FiLayers, FiType,
  FiSliders, FiFileText
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// ─── Helpers: File Conversion & Light Parser ──────────────────────────────────
const fileToBase64 = (fileOrBlob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result;
      if (typeof res === 'string') {
        const matches = res.match(/^data:(image\/[a-zA-Z0-9\+\-]+);base64,(.+)$/);
        if (matches) {
          resolve({ mimeType: matches[1], data: matches[2] });
          return;
        }
        resolve({ mimeType: 'image/jpeg', data: res.split(',')[1] || res });
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
};

// Extract text layers and strings from raw binary of PSD, EPS, or AI
const extractSourceFileMeta = async (fileObj) => {
  if (!fileObj) return { textSnippets: [], layerNames: [], format: 'unknown' };

  try {
    let arrayBuffer;
    if (fileObj instanceof Blob || (typeof File !== 'undefined' && fileObj instanceof File)) {
      arrayBuffer = await fileObj.arrayBuffer();
    } else if (fileObj.url) {
      const res = await fetch(fileObj.url);
      if (res.ok) arrayBuffer = await res.arrayBuffer();
    }

    if (!arrayBuffer) {
      return { textSnippets: [fileObj.name || ''], layerNames: [], format: 'unknown' };
    }

    const uint8 = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const textChunk = decoder.decode(uint8.slice(0, Math.min(uint8.length, 1024 * 1024))); // Scan up to 1MB

    const textSnippets = new Set();
    const layerNames = new Set();

    // 1. PSD EngineData / Text strings / Unicode names:
    const psdTextMatches = textChunk.match(/\([A-Za-z0-9\s,\.\-_\:\/&!]{3,100}\)/g) || [];
    psdTextMatches.slice(0, 50).forEach(m => {
      const clean = m.replace(/[()]/g, '').trim();
      if (clean.length > 3 && !/^[0-9\s]+$/.test(clean) && !clean.includes('Adobe') && !clean.includes('Photoshop')) {
        textSnippets.add(clean);
      }
    });

    // 2. EPS PostScript Text / Font matches:
    const epsMatches = textChunk.match(/\(([^)]+)\)\s*(show|Tj)/gi) || [];
    epsMatches.slice(0, 40).forEach(m => {
      const text = m.replace(/show|Tj|[()]/gi, '').trim();
      if (text.length > 2) textSnippets.add(text);
    });

    // Detect layer name patterns (Layer, Group, Background, Header, Placeholder, Frame, etc.)
    const layerMatches = textChunk.match(/(Layer\s*\d+|Group\s*\d+|Header|Footer|Logo|Background|Image\s*Placeholder|Photo\s*Frame|Vector\s*Smart\s*Object)/gi) || [];
    layerMatches.slice(0, 30).forEach(l => layerNames.add(l.trim()));

    const fileName = fileObj.name || '';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    return {
      fileName,
      format: ext,
      textSnippets: Array.from(textSnippets).slice(0, 25),
      layerNames: Array.from(layerNames).slice(0, 20)
    };
  } catch (err) {
    console.warn('Source file metadata extraction fallback:', err);
    return { textSnippets: [fileObj?.name || ''], layerNames: [], format: 'extracted_fallback' };
  }
};

// ─── Gemini AI Evaluator ──────────────────────────────────────────────────────
const callVisionAI = async (imageData, task, mainSourceMeta = {}, fileNames = []) => {
  const taskTitle = task?.title || 'Graphic / Design Task';
  const taskDesc = (task?.description || '').replace(/<[^>]*>?/gm, '');
  const taskCategory = task?.category || task?.category_name || 'Design';

  const systemInstruction = `You are a strict, top-tier Art Director and Quality Assurance Inspector at Creative Computer Academy.
Analyze the designer's submitted deliverable (Source File vs Preview Image) against the brief.

CONTEXT & INPUTS:
- Task Title: "${taskTitle}"
- Category: "${taskCategory}"
- Requirements: "${taskDesc}"
- Uploaded Files: ${JSON.stringify(fileNames)}
- Main Source File: ${mainSourceMeta.fileName || 'N/A'} (Format: ${mainSourceMeta.format || 'N/A'})
- Text strings found inside Source File: ${JSON.stringify(mainSourceMeta.textSnippets || [])}
- Layers/Groups found inside Source File: ${JSON.stringify(mainSourceMeta.layerNames || [])}

CORE INSPECTION RULES:
1. SOURCE vs PREVIEW MATCH (match_score: 0-100%):
   - Check if the text, heading, and layout in the Preview Image genuinely correspond to the text & structure in the Source File.
   - CRITICAL RULE FOR DESIGN STANDARDS: It is 100% NORMAL and EXPECTED that the main source file (.psd/.eps) contains EMPTY IMAGE PLACEHOLDER SHAPES/FRAMES (for copyright reasons), while the Preview Image contains actual model/stock photos. Do NOT penalize for this!
   - However, if the Preview Image is from an entirely different project or unrelated template, give a very LOW match score (<40) with a strict warning.

2. SPELLING & TYPOS (spelling_score: 0-100%):
   - Inspect all visible text in the Preview Image for spelling, punctuation, and typos (in English and/or Bengali).

3. LAYER & STRUCTURE QUALITY (layer_score: 0-100%):
   - Assess layer cleanliness, grouping, naming, and professional standards based on source file metadata.

4. READABILITY, CONTRAST & MARGINS (readability_score: 0-100%):
   - Check font hierarchy, contrast against background, padding, safe margins, and visual balance.

5. OVERALL SCORE (overall_score: 0-100):
   - Weighted average of the 4 pillars.

Return ONLY a valid JSON object matching this schema (do NOT wrap in markdown, output raw json):
{
  "overall_score": 88,
  "verdict": "Ready for Review" | "Needs Minor Fixes" | "Reject & Redo",
  "summary": "Objective 1-2 sentence assessment in clear Bengali highlighting strengths and exact flaws.",
  "metrics": {
    "file_match": {
      "score": 95,
      "passed": true,
      "title": "মেইন ফাইল ও প্রিভিউ মিল",
      "details": "বিস্তারিত বাংলায় বর্ণনা (যেমন: টেক্সট ও শেপের মিল পাওয়া গেছে, প্লেসহোল্ডার সঠিক)"
    },
    "spelling": {
      "score": 90,
      "passed": true,
      "title": "বানান ও টাইপোগ্রাফি",
      "details": "বানান সংক্রান্ত বিস্তারিত বাংলায় মতামত"
    },
    "layers": {
      "score": 85,
      "passed": true,
      "title": "লেয়ার অর্গানাইজেশন ও গ্রুপিং",
      "details": "লেয়ারের নাম, ফোল্ডারিং ও প্রফেশনাল স্ট্যান্ডার্ড নিয়ে মন্তব্য"
    },
    "readability": {
      "score": 88,
      "passed": true,
      "title": "কালার কন্ট্রাস্ট ও মার্জিন",
      "details": "ভিজ্যুয়াল ব্যালেন্স ও প্রিন্ট/ডিসপ্লে ক্লিয়ারিটি নিয়ে মন্তব্য"
    }
  },
  "suggestions": [
    "সরাসরি পয়েন্ট আকারে টিপস ১ (বাংলায়)",
    "সরাসরি পয়েন্ট আকারে টিপস ২ (বাংলায়)"
  ]
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          ...(imageData ? [{
            inlineData: {
              mimeType: imageData.mimeType || "image/jpeg",
              data: imageData.data
            }
          }] : [])
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-flash-latest',
    'gemini-1.5-pro'
  ];

  let lastErr = null;

  for (const m of modelsToTry) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          let cleaned = text.trim();
          if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
          else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
          return JSON.parse(cleaned);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastErr = new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("AI সার্ভারে সংযোগ করা যায়নি।");
};

// ─── Component ────────────────────────────────────────────────────────────────
const AIQualityScanner = ({ isOpen, onClose, task, file, imageUrl, submissionFiles = [], onProceedSubmit }) => {
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(1);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const allFiles = Array.isArray(submissionFiles) && submissionFiles.length > 0
    ? submissionFiles
    : (file ? [file] : []);

  const runScan = async () => {
    // Check if any file exists
    if (!allFiles || allFiles.length === 0) {
      setError('কোন ফাইল আপলোড করা হয়নি। AI কোয়ালিটি স্ক্যান করতে দয়া করে প্রথমে আপনার কাজের ফাইল বা প্রিভিউ ইমেজ আপলোড করুন।');
      setScanning(false);
      return;
    }

    const previewObj = allFiles.find(f => {
      const name = f?.name || f?.file?.name || (typeof f === 'string' ? f : '');
      return /\.(jpg|jpeg|png|webp|gif)$/i.test(name) || (f?.file && f.file.type?.startsWith('image/'));
    }) || (imageUrl ? { url: imageUrl, name: 'preview.jpg' } : null);

    const sourceObj = allFiles.find(f => {
      const name = f?.name || f?.file?.name || (typeof f === 'string' ? f : '');
      return /\.(psd|ai|eps|zip|rar|7z)$/i.test(name);
    }) || allFiles.find(f => f !== previewObj) || allFiles[0];

    const hasBlob = previewObj?.file instanceof Blob || (typeof File !== 'undefined' && previewObj?.file instanceof File);
    const hasUrl = previewObj?.url || (typeof previewObj === 'string' && previewObj) || (typeof imageUrl === 'string' && imageUrl);

    if (!hasBlob && !hasUrl) {
      setError('কোন প্রিভিউ ইমেজ পাওয়া যায়নি। অনুগ্রহ করে সোর্স ফাইলের পাশাপাশি একটি ডিজাইন প্রিভিউ ইমেজ (.jpg/.png) আপলোড করুন।');
      setScanning(false);
      return;
    }

    setScanning(true);
    setError('');
    setReport(null);
    setScanStep(1);

    try {
      // Step 1: Parse Source File
      setScanStep(1);
      const sourceMeta = await extractSourceFileMeta(sourceObj?.file || sourceObj);

      // Step 2: Prepare Preview Image Data
      setScanStep(2);
      let imageData = null;
      if (hasBlob && previewObj.file.type?.startsWith('image/')) {
        imageData = await fileToBase64(previewObj.file);
      } else if (hasUrl) {
        const targetUrl = previewObj.url || previewObj || imageUrl;
        if (targetUrl.startsWith('data:image/')) {
          const matches = targetUrl.match(/^data:(image\/[a-zA-Z0-9\+\-]+);base64,(.+)$/);
          if (matches) imageData = { mimeType: matches[1], data: matches[2] };
        } else {
          try {
            const resp = await fetch(targetUrl, { mode: 'cors' });
            if (resp.ok) {
              const blob = await resp.blob();
              if (blob.type.startsWith('image/')) {
                imageData = await fileToBase64(blob);
              }
            }
          } catch (e) {
            // Fallback: load via HTML Image tag + canvas (avoids raw fetch CORS blocks)
            try {
              const canvasData = await new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.naturalWidth || img.width;
                  canvas.height = img.naturalHeight || img.height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9\+\-]+);base64,(.+)$/);
                  resolve(matches ? { mimeType: matches[1], data: matches[2] } : null);
                };
                img.onerror = () => resolve(null);
                img.src = targetUrl;
              });
              if (canvasData) imageData = canvasData;
            } catch (canvasErr) {
              console.warn('Canvas fallback error:', canvasErr);
            }
          }
        }
      }

      // Step 3: Run AI Analysis
      setScanStep(3);
      const fileNames = allFiles.map(f => f?.name || (typeof f === 'string' ? f.split('/').pop() : 'file'));
      const aiResult = await callVisionAI(imageData, task, sourceMeta, fileNames);

      // Step 4: Finalizing Scores
      setScanStep(4);
      await new Promise(r => setTimeout(r, 400));
      setReport(aiResult);
    } catch (err) {
      console.error('AI Quality Scanner Error:', err);
      setError(err.message || 'AI quality scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (!allFiles || allFiles.length === 0) {
        setScanning(false);
        setError('কোন ফাইল আপলোড করা হয়নি। AI কোয়ালিটি স্ক্যান করতে দয়া করে প্রথমে আপনার কাজের ফাইল বা প্রিভিউ ইমেজ আপলোড করুন।');
        setReport(null);
        return;
      }
      runScan();
    } else {
      setScanning(false);
      setError('');
      setReport(null);
    }
  }, [isOpen, submissionFiles?.length, file]);

  if (!isOpen) return null;

  const score = report?.overall_score ?? report?.score ?? 0;
  const scoreColor = score >= 80
    ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
    : score >= 60
      ? 'text-amber-500 border-amber-500/30 bg-amber-500/10'
      : 'text-rose-500 border-rose-500/30 bg-rose-500/10';

  const metricsList = [
    { key: 'file_match', icon: <FiFileText size={14} />, fallbackTitle: 'মেইন ফাইল ও প্রিভিউ মিল' },
    { key: 'spelling', icon: <FiType size={14} />, fallbackTitle: 'বানান ও টাইপোগ্রাফি' },
    { key: 'layers', icon: <FiLayers size={14} />, fallbackTitle: 'লেয়ার অর্গানাইজেশন' },
    { key: 'readability', icon: <FiSliders size={14} />, fallbackTitle: 'কালার ও রিডিবিলিটি' }
  ];

  return (
    <div className="w-full my-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-cyan-500/40 shadow-xl overflow-hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
            <HiSparkles size={14} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              AI ক্রিয়েটিভ কোয়ালিটি ইন্সপেক্টর
            </h4>
            <p className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              AI-Powered Quality & Deliverable Inspection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!scanning && allFiles.length > 0 && (
            <button
              onClick={runScan}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 shadow-2xs active:scale-95"
            >
              <FiRefreshCw size={11} /> Re-check
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
            title="Close"
          >
            <FiX size={15} />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-4">
        {scanning ? (
          /* Step-by-Step Animated Scanner Progress */
          <div className="py-6 px-3 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-3 border-cyan-500/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border-3 border-t-cyan-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                <HiSparkles size={18} className="animate-bounce" />
              </div>
            </div>

            <div>
              <p className="font-black text-slate-800 dark:text-slate-100 text-sm">
                AI কোয়ালিটি ইন্সপেকশন চলছে...
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                সোর্স ফাইল, প্রিভিউ ইমেজ, বানান, শেপ ও লেয়ার বিশ্লেষণ করা হচ্ছে।
              </p>
            </div>

            {/* Steps Checklist */}
            <div className="w-full max-w-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2 text-left">
              {[
                { step: 1, title: 'সোর্স ফাইল (.psd/.eps/.ai) মেটাডাটা ও লেয়ার স্ক্যান' },
                { step: 2, title: 'প্রিভিউ ইমেজ ও ইমেজ প্লেসহোল্ডার শেপ ভ্যালিডেশন' },
                { step: 3, title: 'বানান, ফন্ট হাইয়ারার্কি ও কালার কনট্রাস্ট যাচাই' },
                { step: 4, title: 'কোয়ালিটি কমপ্লায়েন্স ও স্কোর নির্ধারণ' }
              ].map(({ step, title }) => {
                const isDone = scanStep > step;
                const isCurrent = scanStep === step;

                return (
                  <div key={step} className="flex items-center gap-2.5 text-xs">
                    {isDone ? (
                      <FiCheckCircle size={14} className="text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                    )}
                    <span className={`font-semibold ${isDone ? 'text-slate-700 dark:text-slate-300' : isCurrent ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-400 dark:text-slate-600'}`}>
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : error ? (
          /* Error Banner */
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-2">
            <FiAlertOctagon className="mx-auto text-rose-500" size={24} />
            <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
            {allFiles.length > 0 && (
              <button
                onClick={runScan}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm active:scale-95"
              >
                পুনরায় স্ক্যান করুন
              </button>
            )}
          </div>
        ) : report ? (
          /* Final Comprehensive Recap Card */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Overall Score Banner */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${scoreColor} shadow-inner shrink-0`}>
                  <span className="text-xl leading-none">{score}</span>
                  <span className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5">/ ১০০</span>
                </div>
                <div className="min-w-0">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${scoreColor} mb-1`}>
                    <HiSparkles size={10} /> {report.verdict || 'Evaluation Complete'}
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                    {report.summary}
                  </p>
                </div>
              </div>

              {onProceedSubmit && score >= 60 && (
                <button
                  type="button"
                  onClick={onProceedSubmit}
                  className="hidden sm:flex px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-950/20 items-center gap-1.5 shrink-0 active:scale-95"
                >
                  <span>Submit Directly</span>
                  <FiArrowRight size={13} />
                </button>
              )}
            </div>

            {/* 4 Pillars Breakdown with Exact Percentages (%) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {metricsList.map(({ key, icon, fallbackTitle }) => {
                const metric = report.metrics?.[key] || report.checks?.[key] || {};
                const itemScore = metric.score !== undefined ? metric.score : (metric.passed ? 90 : 45);
                const isPassed = metric.passed !== undefined ? metric.passed : itemScore >= 70;
                const title = metric.title || fallbackTitle;
                const details = metric.details || metric.feedback || 'যাচাই সম্পন্ন হয়েছে।';

                const barColor = itemScore >= 80
                  ? 'bg-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : itemScore >= 60
                    ? 'bg-amber-500 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500 text-rose-600 dark:text-rose-400';

                return (
                  <div key={key} className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                        <span className="text-cyan-500">{icon}</span>
                        <span>{title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black text-xs ${barColor.split(' ')[1]}`}>
                          {itemScore}%
                        </span>
                        {isPassed ? (
                          <FiCheckCircle size={13} className="text-emerald-500" />
                        ) : (
                          <FiAlertTriangle size={13} className="text-amber-500" />
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor.split(' ')[0]}`}
                        style={{ width: `${Math.min(Math.max(itemScore, 5), 100)}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {details}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Suggestions & Tips */}
            {Array.isArray(report.suggestions) && report.suggestions.length > 0 && (
              <div className="p-3 bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-black text-cyan-700 dark:text-cyan-300">
                  <HiSparkles size={12} />
                  <span>AI কোয়ালিটি সাজেশন ও পরামর্শ:</span>
                </div>
                <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-600 dark:text-slate-300">
                  {report.suggestions.map((tip, idx) => (
                    <li key={idx} className="leading-snug">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AIQualityScanner;
