import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  FiMousePointer, FiZap, FiBookOpen, FiCommand,
  FiAward, FiTrendingUp, FiActivity
} from 'react-icons/fi';

import MouseTrainer from '../components/foundations/MouseTrainer';
import MouseArcadeGames from '../components/foundations/MouseArcadeGames';
import TouchTypingMaster from '../components/foundations/TouchTypingMaster';
import BanglaTypingLab from '../components/foundations/BanglaTypingLab';
import ShortcutsTrainer from '../components/foundations/ShortcutsTrainer';
import FoundationsAnalytics from '../components/foundations/FoundationsAnalytics';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const FoundationsLab = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('mouse'); // 'mouse' | 'arcade' | 'typing' | 'bangla' | 'shortcuts' | 'analytics'
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}api/student/foundations/get_progress.php?user_id=${user.id}`);
      if (res.data.status === 'success') {
        setProgressData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [user]);

  const tabs = [
    { id: 'mouse', label: '🖱️ মাউস ট্রেনিং (Skill Drills)', desc: 'Aim, Double Click & Drag Drop' },
    { id: 'arcade', label: '🎮 মাউস আর্কেড (Arcade Games)', desc: 'Balloons, Maze, Whack-A-Bug' },
    { id: 'typing', label: '⌨️ টাচ টাইপিং (English Typing)', desc: 'Home Row, WPM & Accuracy' },
    { id: 'bangla', label: '🇧🇩 বাংলা টাইপিং (Bangla Lab)', desc: 'Avro & Bijoy Phonetic' },
    { id: 'shortcuts', label: '⚡ ওএস শর্টকাটস (Shortcuts)', desc: 'Ctrl+C, Ctrl+V & Pro Keys' },
    { id: 'analytics', label: '📊 প্রগ্রেস ও সার্টিফিকেট (Stats)', desc: 'Badges, Heatmap & Cert' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-bold">
            <span>🌱 কম্পিউটার ফাউন্ডেশন ও প্র্যাকটিস ল্যাব</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Computer Foundations & Interactive Speed Lab
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 font-medium">
            মাউস কন্ট্রোল, দ্রুত টাচ টাইপিং, কিবোর্ড শর্টকাট এবং ফান্ডামেন্টালস শিখে আপনার কম্পিউটারের দক্ষতা বাড়িয়ে নিন।
          </p>
        </div>

        {/* Floating Quick Badges Count */}
        <div className="absolute right-6 bottom-6 hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-bold shadow-md">
            🏆
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-indigo-200 uppercase">Skill Badges</p>
            <p className="text-base font-black text-white">
              {progressData?.stats?.unlocked_badges_count || 0} Unlocked
            </p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[150px] py-3 px-3.5 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md font-black border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 font-semibold'
            }`}
          >
            <p className="text-xs truncate">{tab.label}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Active Tab Content Stage */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'mouse' && (
          <MouseTrainer user={user} onProgressUpdate={fetchProgress} />
        )}

        {activeTab === 'arcade' && (
          <MouseArcadeGames user={user} />
        )}

        {activeTab === 'typing' && (
          <TouchTypingMaster user={user} onProgressUpdate={fetchProgress} />
        )}

        {activeTab === 'bangla' && (
          <BanglaTypingLab user={user} onProgressUpdate={fetchProgress} />
        )}

        {activeTab === 'shortcuts' && (
          <ShortcutsTrainer user={user} onProgressUpdate={fetchProgress} />
        )}

        {activeTab === 'analytics' && (
          <FoundationsAnalytics progressData={progressData} user={user} />
        )}
      </div>
    </div>
  );
};

export default FoundationsLab;
