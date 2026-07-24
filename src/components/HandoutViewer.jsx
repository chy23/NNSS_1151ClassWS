import React, { useState, useEffect, useRef } from 'react';
import { PenTool, Eraser, Trash2, ZoomIn, ZoomOut, Menu } from 'lucide-react';

const checkTool = () => document.body.classList.contains('cursor-eraser') || document.body.classList.contains('cursor-pen');

const BlankWord = ({ text, globalShow }) => {
  const [localState, setLocalState] = useState(null);
  const isVisible = localState !== null ? localState : globalShow;
  
  const toggle = (e) => {
    if (checkTool()) return;
    e.stopPropagation();
    setLocalState(!isVisible);
  };

  if (text === '' || text === '　' || text === '✓' || text === '☑️') {
    const isCheck = (text !== '　');
    return (
      <span onClick={toggle}
        className="cursor-pointer inline-block text-center w-6 data-blankword-check select-none" data-text={isCheck ? '✓' : '　'}>
        <span className={isVisible && isCheck ? 'text-red-600 font-bold' : 'text-transparent'}>
          {isCheck ? '✓' : '　'}
        </span>
      </span>
    );
  }
  return (
    <span onClick={toggle}
      className={`cursor-pointer px-2 mx-1 font-bold transition-colors select-none border-b-[3px] data-blankword ${isVisible ? 'text-red-600 border-red-300 bg-red-50' : 'text-transparent border-slate-400 bg-slate-100'}`}
      data-text={text}>
      {text}
    </span>
  );
};

const parseText = (text, globalShow) => {
  if (!text) return null;
  const parts = text.split(/\(\*(.*?)\*\)/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) return <BlankWord key={i} text={part} globalShow={globalShow} />;
    return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
  });
};

const CheckboxItem = ({ item, globalShow }) => {
  const [localState, setLocalState] = useState(null);
  const isShow = localState !== null ? localState : globalShow;
  
  const toggle = (e) => {
    if (checkTool()) return;
    setLocalState(!isShow);
  };

  const isCorrect = item.isAnswer;
  return (
    <div className="flex items-start data-quiz-opt cursor-pointer group select-none my-1" onClick={toggle} data-correct={isCorrect}>
      <span className={`mr-2 font-bold leading-none ${isShow && isCorrect ? 'text-red-600' : 'text-slate-400'}`}>
        {isShow && isCorrect ? '✓' : '□'}
      </span>
      <span className={isShow && isCorrect ? 'text-red-600 font-bold' : 'text-slate-700'}>
        {parseText(item.text, globalShow)}
      </span>
    </div>
  );
};

const TableContent = ({ headers, rows, globalShow }) => {
  return (
    <table className="w-full border-collapse my-4 text-sm md:text-base">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="border border-slate-400 p-2 bg-slate-100 font-bold text-center">
              {parseText(h, globalShow)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rIdx) => (
          <tr key={rIdx}>
            {row.map((cell, cIdx) => (
              <td key={cIdx} className="border border-slate-400 p-2">
                {parseText(cell, globalShow)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default function HandoutViewer({ lesson, isSidebarOpen, setIsSidebarOpen }) {
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [toolMode, setToolMode] = useState('none');
  const [exportSize, setExportSize] = useState('A4');
  const [exportMargin, setExportMargin] = useState('standard');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isWidescreen, setIsWidescreen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    setShowAllAnswers(false);
    if (lesson?.prepSheets && lesson.prepSheets.length > 0) {
      setActiveTab(lesson.prepSheets[0].title);
    } else {
      setActiveTab('summary');
    }
    setResetKey(k => k + 1);
  }, [lesson?.id]);

  const toggleShowAll = () => {
    if (showAllAnswers) setResetKey(k => k + 1);
    setShowAllAnswers(prev => !prev);
  };

  const isHighlightNode = (node) => {
    if (!node || !node.style) return false;
    const bg = (node.style.backgroundColor || '').replace(/\s/g, '').toLowerCase();
    return bg === 'rgb(254,240,138)' || bg === '#fef08a' || bg === 'yellow' || bg === 'rgb(255,255,0)';
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (toolMode === 'pen') {
        const selection = window.getSelection();
        if (!selection.isCollapsed && selection.rangeCount > 0) {
          document.designMode = "on";
          document.execCommand("HiliteColor", false, "#fef08a");
          document.execCommand("backColor", false, "#fef08a");
          document.designMode = "off";
          selection.removeAllRanges();
        }
      }
    };
    const handleClick = (e) => {
      if (toolMode === 'eraser') {
        let target = e.target;
        while (target && target !== document.body) {
          if (isHighlightNode(target)) { target.style.backgroundColor = ''; break; }
          target = target.parentNode;
        }
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleClick);
    return () => { document.removeEventListener('mouseup', handleMouseUp); document.removeEventListener('click', handleClick); };
  }, [toolMode]);

  useEffect(() => {
    document.body.className = `font-sans antialiased bg-slate-50 text-slate-800 ${toolMode === 'pen' ? 'cursor-pen' : toolMode === 'eraser' ? 'cursor-eraser' : ''}`;
  }, [toolMode]);

  const clearAllHighlight = () => {
    document.getElementById('printable-area')?.querySelectorAll('*').forEach(el => {
      if (isHighlightNode(el)) el.style.backgroundColor = '';
    });
  };

  const exportToWord = (mode, showWatermark = true) => {
    const clone = document.getElementById('printable-area').cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(el => el.remove());

    if (mode === 'student') {
      clone.querySelectorAll('.data-blankword').forEach(el => {
        const len = (el.getAttribute('data-text') || '').trim().length;
        el.innerHTML = '＿'.repeat(len > 0 ? len * 2 : 4);
        el.style.color = '#000'; el.style.border = 'none'; el.style.background = 'transparent';
      });
      clone.querySelectorAll('.data-blankword-check').forEach(el => {
        el.innerHTML = '　'; el.style.color = '#000'; el.style.background = 'transparent';
      });
      clone.querySelectorAll('.data-quiz-opt').forEach(el => {
        const icon = el.children[0]; const text = el.children[1];
        if (icon) { icon.innerHTML = '□'; icon.style.color = '#000'; icon.classList.remove('hidden'); }
        if (text) { text.style.color = '#000'; text.style.fontWeight = 'normal'; }
      });
    } else {
      clone.querySelectorAll('.data-blankword').forEach(el => {
        el.innerHTML = el.getAttribute('data-text');
        el.style.color = '#DC2626'; el.style.background = 'transparent'; el.style.textDecoration = 'underline';
      });
      clone.querySelectorAll('.data-blankword-check').forEach(el => {
        const val = el.getAttribute('data-text');
        el.innerHTML = val === '✓' ? '✓' : '　';
        el.style.color = val === '✓' ? '#DC2626' : '#000';
        el.style.fontWeight = val === '✓' ? 'bold' : 'normal';
        el.style.background = 'transparent';
      });
      clone.querySelectorAll('.data-quiz-opt').forEach(el => {
        const isCorrect = el.getAttribute('data-correct') === 'true';
        const icon = el.children[0]; const text = el.children[1];
        if (isCorrect) {
          if (icon) { icon.innerHTML = '✓'; icon.style.color = '#DC2626'; icon.classList.remove('hidden'); }
          if (text) { text.style.color = '#DC2626'; text.style.fontWeight = 'bold'; }
        } else {
          if (icon) { icon.innerHTML = '□'; icon.style.color = '#000'; icon.classList.remove('hidden'); }
          if (text) { text.style.color = '#000'; text.style.fontWeight = 'normal'; }
        }
      });
    }

    let sizeCss = '21cm 29.7cm';
    if (exportSize === 'B4') sizeCss = '25.7cm 36.4cm';
    if (exportSize === 'A3') sizeCss = '29.7cm 42cm';
    let marginCss = '2.54cm 3.18cm 2.54cm 3.18cm';
    if (exportMargin === 'wide') marginCss = '2.54cm 5.08cm 2.54cm 5.08cm';
    if (exportMargin === 'narrow') marginCss = '1.27cm 1.27cm 1.27cm 1.27cm';

    const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <style>
        @page WordSection1 { size: ${sizeCss}; margin: ${marginCss}; }
        div.WordSection1 { page: WordSection1; }
        body, p, span, div, li, ul, h1, h2, h3, h4 { font-family: "標楷體", "BiauKai", "DFKai-SB", serif !important; line-height: 1.5 !important; }
        body { font-size: 12pt !important; color: #000; }
        h1 { font-size: 16pt !important; font-weight: bold; text-align: center; margin-bottom: 24px; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #94a3b8; padding: 6px 8px; }
      </style>
    </head>
    <body><div class="WordSection1">${clone.innerHTML}</div></body>
    </html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const lessonNumber = lesson.id.replace('lesson-', '').padStart(2, '0');
    let tabName = activeTab === 'summary' ? '課堂重點整理' : activeTab;
    link.download = `${lessonNumber}_${lesson.lessonNum}_${lesson.lessonName}_${tabName}_${mode === 'teacher' ? '教用版' : '學用版'}.doc`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!lesson) {
    return <div className="p-10 text-center text-slate-500">請從左側選擇一份單元</div>;
  }

  const renderContent = () => {
    let items = [];
    if (activeTab === 'summary') {
      items = lesson.summary || [];
    } else {
      const sheet = lesson.prepSheets?.find(s => s.title === activeTab);
      if (sheet) items = sheet.content || [];
    }

    return (
      <div className="space-y-2 mt-6">
        {items.map((item, i) => {
          if (item.isTable) {
            return (
              <div key={i} style={{ marginLeft: `${item.indent * 2}em` }}>
                <TableContent headers={item.headers} rows={item.rows} globalShow={showAllAnswers} />
              </div>
            );
          }
          if (item.isCheckbox) {
            return (
              <div key={i} style={{ marginLeft: `${item.indent * 2}em` }}>
                <CheckboxItem item={item} globalShow={showAllAnswers} />
              </div>
            );
          }
          return (
            <div key={i} style={{ marginLeft: `${item.indent * 2}em` }} className="leading-relaxed my-1">
              {parseText(item.text, showAllAnswers)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full pb-20">
      <div className="no-print bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-40 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4 shrink-0">
        <div className="font-bold text-xl text-blue-900 flex items-center gap-3">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors" title="開啟課程列表">
              <Menu size={20} />
            </button>
          )}
          講義控制台
        </div>
        <div className="flex gap-3 flex-wrap justify-center items-center">
          <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <button onClick={() => setZoomLevel(z => Math.max(0.5, parseFloat((z - 0.1).toFixed(1))))} className="p-1 hover:bg-white rounded text-slate-600" title="縮小"><ZoomOut size={18} /></button>
            <span className="text-sm font-bold w-12 text-center text-slate-700">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel(z => Math.min(2, parseFloat((z + 0.1).toFixed(1))))} className="p-1 hover:bg-white rounded text-slate-600" title="放大"><ZoomIn size={18} /></button>
          </div>
          <button onClick={() => setIsWidescreen(!isWidescreen)} className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${isWidescreen ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {isWidescreen ? '縮回版面' : '拉寬版面'}
          </button>
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
            <label className="text-sm font-bold text-slate-700 flex items-center">版面：
              <select className="ml-1 border-slate-300 rounded text-sm p-1" value={exportSize} onChange={e => setExportSize(e.target.value)}>
                <option value="A4">A4</option><option value="B4">B4</option><option value="A3">A3</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700 flex items-center">邊界：
              <select className="ml-1 border-slate-300 rounded text-sm p-1" value={exportMargin} onChange={e => setExportMargin(e.target.value)}>
                <option value="standard">標準</option><option value="wide">寬</option><option value="narrow">窄</option>
              </select>
            </label>
          </div>
          <button onClick={toggleShowAll} className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm">
            {showAllAnswers ? '🔒 隱藏全解答' : '👁️ 顯示全解答'}
          </button>
          <button onClick={() => exportToWord('teacher')} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow font-bold text-sm">匯出教用版</button>
          <button onClick={() => exportToWord('student')} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg shadow font-bold text-sm">匯出學用版</button>
        </div>
      </div>

      <div className="w-full flex justify-center mt-4 px-6 no-print">
        <div className="flex space-x-2 border-b border-slate-300 w-full max-w-[850px] overflow-x-auto">
          {lesson.prepSheets?.map((sheet, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(sheet.title)}
              className={`px-4 py-2 font-bold transition-colors whitespace-nowrap ${activeTab === sheet.title ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              預習單 {sheet.title}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 font-bold transition-colors whitespace-nowrap ${activeTab === 'summary' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            課堂重點整理
          </button>
        </div>
      </div>

      <div className="flex-1 w-full p-6 flex justify-center overflow-y-auto">
        <div
          key={`content-${lesson.id}-${activeTab}-${resetKey}`}
          id="printable-area"
          className={`relative w-full ${isWidescreen ? 'max-w-[1200px]' : 'max-w-[850px]'} bg-white p-10 md:p-16 shadow-xl rounded-xl border border-slate-100 content-area self-start`}
          style={{ zoom: zoomLevel }}
        >
          <div className="text-right font-bold text-lg mb-2 text-slate-800">
            班級：_______ 座號：___ 姓名：_____________
          </div>
          <h1 className="font-bold text-center mb-8 text-slate-800 text-2xl relative z-10 flex flex-col gap-2">
            <span>115學年六上社會學習講義南一版</span>
            <span>
              {lesson.lessonNum} {lesson.lessonName}
              {activeTab !== 'summary' ? ` - 預習單 ${activeTab}` : ' - 課堂重點整理'}
            </span>
          </h1>

          <section className="mb-14">
             {renderContent()}
          </section>
        </div>
      </div>

      <div className="no-print fixed bottom-8 right-8 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-2xl border border-slate-200 flex flex-col space-y-3 z-50">
        <button onClick={() => setToolMode(toolMode === 'pen' ? 'none' : 'pen')} className={`p-4 rounded-full transition-all ${toolMode === 'pen' ? 'bg-yellow-300 text-yellow-800 shadow-inner' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`} title="螢光筆畫記"><PenTool size={24} /></button>
        <button onClick={() => setToolMode(toolMode === 'eraser' ? 'none' : 'eraser')} className={`p-4 rounded-full transition-all ${toolMode === 'eraser' ? 'bg-pink-300 text-pink-800 shadow-inner' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`} title="消除畫記"><Eraser size={24} /></button>
        <button onClick={clearAllHighlight} className="p-4 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-600 transition-colors" title="清除所有畫記"><Trash2 size={24} /></button>
      </div>
    </div>
  );
}
