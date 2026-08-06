import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HandoutViewer from './components/HandoutViewer';
import { lessonsMeta } from './data/lessons-meta';

function App() {
  const [currentLessonId, setCurrentLessonId] = useState(lessonsMeta[0]?.id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let isMounted = true;
    if (currentLessonId) {
      setIsLoading(true);
      import(`./data/${currentLessonId}.js`)
        .then(module => {
          if (isMounted) {
            setCurrentLesson(module.default);
            setIsLoading(false);
          }
        })
        .catch(err => {
          console.error("Failed to load lesson:", err);
          if (isMounted) setIsLoading(false);
        });
    }
    return () => { isMounted = false; };
  }, [currentLessonId]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 selection:bg-blue-100 dark:selection:bg-blue-900/50 relative transition-colors duration-300">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none no-print overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-100/40 blur-3xl" />
      </div>

      {/* 固定浮水印 - 不跟著捲動，永遠固定在畫面角落 */}
      <div className="fixed top-24 right-8 z-[100] pointer-events-none select-none no-print text-gray-500/25 text-[18pt] font-medium tracking-wide">
        網站建立自楊家驊老師
      </div>
      <div className="fixed bottom-4 right-28 z-[100] pointer-events-none select-none no-print text-gray-500/25 text-[18pt] font-medium tracking-wide">
        網站建立自楊家驊老師
      </div>

      <Sidebar
        lessons={lessonsMeta}
        currentLessonId={currentLessonId}
        onSelectLesson={setCurrentLessonId}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="flex-1 h-screen overflow-y-auto relative z-10 no-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 font-medium text-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            正在載入課程內容...
          </div>
        ) : currentLesson ? (
          <HandoutViewer lesson={currentLesson} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 font-medium text-lg">
            請從左側選單選擇一課開始
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
