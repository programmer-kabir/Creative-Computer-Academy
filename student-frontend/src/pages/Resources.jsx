import React from 'react';
import { FiBookOpen, FiDownloadCloud, FiExternalLink, FiFileText, FiVideo, FiLayers } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const Resources = () => {
  const learningMaterials = [
    { title: 'Graphic Design & Vector Essentials Handbook', type: 'PDF Guide', size: '14.2 MB', category: 'Handouts' },
    { title: 'Web Development (HTML5, CSS3, JS & React) Complete Roadmap', type: 'Curriculum PDF', size: '8.5 MB', category: 'Handouts' },
    { title: 'CCA Official Brand Kit & Vector Assets', type: 'ZIP Bundle', size: '24.8 MB', category: 'Branding' },
    { title: 'Typography and Color Theory Cheatsheet', type: 'Reference Sheet', size: '3.1 MB', category: 'Handouts' },
    { title: 'Professional Freelancing & Portfolio Building Guide', type: 'Career Guide', size: '6.4 MB', category: 'Career' },
  ];

  const usefulTools = [
    { name: 'VS Code Editor', desc: 'Code editor recommended for all programming & web development modules.', link: 'https://code.visualstudio.com/' },
    { name: 'Figma', desc: 'Industry standard UI/UX and collaborative design tool.', link: 'https://www.figma.com/' },
    { name: 'Git & GitHub Desktop', desc: 'Version control tools for software and website development.', link: 'https://desktop.github.com/' },
    { name: 'Google Fonts & Icons', desc: 'Curated free typography for web design & print design.', link: 'https://fonts.google.com/' }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-2xl">
            <FiBookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Course Resources & Materials</h1>
            <p className="text-sm text-slate-400">Download handouts, templates, and access recommended software tools.</p>
          </div>
        </div>
      </div>

      {/* Materials List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
            <FiLayers size={18} className="text-indigo-600" />
            <span>Class Handouts & Design Kits</span>
          </h3>

          <div className="space-y-3">
            {learningMaterials.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4 hover:border-indigo-400 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <FiFileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.type} • {item.size}</p>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Downloading ${item.title}...`)}
                  className="p-2.5 bg-slate-100 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:hover:bg-indigo-600 rounded-xl text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  title="Download File"
                >
                  <FiDownloadCloud size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Useful Tools List */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
            <HiSparkles size={18} className="text-amber-400" />
            <span>Recommended Software & Tools</span>
          </h3>

          <div className="space-y-3">
            {usefulTools.map((tool, idx) => (
              <a
                key={idx}
                href={tool.link}
                target="_blank"
                rel="noreferrer"
                className="block p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">
                    {tool.name}
                  </h4>
                  <FiExternalLink size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className="text-xs text-slate-400 mt-1">{tool.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
