import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_FILES, INITIAL_TREE, TreeNode } from './data';
import { 
  Play, Search, GitBranch, Bug, Blocks, X, ChevronRight, ChevronDown, 
  Settings, AlertCircle, FileCode, Plus, Maximize,
  Minus, Copy, Trash2, Edit2, FilePlus, FolderPlus, Save, Folder, Music
} from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css'; // Or any other theme

export default function App() {
  const [isLaunched, setIsLaunched] = useState(false);
  const [curtainOn, setCurtainOn] = useState(false);
  const [activePanel, setActivePanel] = useState('explorer');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [projects, setProjects] = useState<{id: string, name: string}[]>(() => {
    const saved = localStorage.getItem('gameycode-projects');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'My Game' }];
  });
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return localStorage.getItem('gameycode-current-project') || 'default';
  });

  const [files, setFiles] = useState<Record<string, any>>(() => {
    const projectId = localStorage.getItem('gameycode-current-project') || 'default';
    const saved = localStorage.getItem(`gameycode-files-${projectId}`);
    if (saved) return JSON.parse(saved);
    if (projectId === 'default') {
      const legacy = localStorage.getItem('gameycode-files');
      if (legacy) {
        localStorage.setItem(`gameycode-files-default`, legacy);
        return JSON.parse(legacy);
      }
      return INITIAL_FILES;
    }
    return {};
  });
  const [tree, setTree] = useState<TreeNode[]>(() => {
    const projectId = localStorage.getItem('gameycode-current-project') || 'default';
    const saved = localStorage.getItem(`gameycode-tree-${projectId}`);
    if (saved) return JSON.parse(saved);
    if (projectId === 'default') {
      const legacy = localStorage.getItem('gameycode-tree');
      if (legacy) {
        localStorage.setItem(`gameycode-tree-default`, legacy);
        return JSON.parse(legacy);
      }
      return INITIAL_TREE;
    }
    return [];
  });
  const [openTabs, setOpenTabs] = useState<string[]>(['game.js', 'player.js']);
  const [activeTab, setActiveTab] = useState<string | null>('game.js');
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState('terminal');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: string } | null>(null);
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [fontSize, setFontSize] = useState(13);
  const [wordWrap, setWordWrap] = useState(false);

  const [newItemModal, setNewItemModal] = useState<{ type: 'file' | 'folder', parent: string | null } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [renameModal, setRenameModal] = useState<{ oldName: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('gameycode-theme') || 'dark');
  const [soundExtInstalled, setSoundExtInstalled] = useState(() => localStorage.getItem('gameycode-sound-ext') === 'true');

  const codeScrollRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const minimapVpRef = useRef<HTMLDivElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (newItemModal && newItemInputRef.current) {
      newItemInputRef.current.focus();
    }
  }, [newItemModal]);

  useEffect(() => {
    if (renameModal && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameModal]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gameycode-theme', theme);
  }, [theme]);

  const launch = () => {
    setCurtainOn(true);
    setTimeout(() => {
      setIsLaunched(true);
      setTimeout(() => setCurtainOn(false), 100);
    }, 550);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openFile = (name: string) => {
    if (!openTabs.includes(name)) {
      setOpenTabs([...openTabs, name]);
    }
    setActiveTab(name);
  };

  const closeTab = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== name);
    setOpenTabs(newTabs);
    if (activeTab === name) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  const toggleFolder = (folderName: string) => {
    const toggleNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.type === 'folder' && node.name === folderName) {
          return { ...node, open: !node.open };
        }
        return node;
      });
    };
    setTree(toggleNode(tree));
  };

  const handleContextMenu = (e: React.MouseEvent, fileName: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file: fileName });
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleScroll = () => {
    if (gutterRef.current && codeScrollRef.current) {
      gutterRef.current.scrollTop = codeScrollRef.current.scrollTop;
    }
    updateMinimapVp();
  };

  const updateMinimapVp = () => {
    if (!minimapEnabled || !codeScrollRef.current || !minimapVpRef.current || !minimapRef.current) return;
    const scroll = codeScrollRef.current;
    const vp = minimapVpRef.current;
    const canvas = minimapRef.current;
    
    const scrollRatio = scroll.scrollTop / (scroll.scrollHeight - scroll.clientHeight);
    const maxVpTop = canvas.clientHeight - vp.clientHeight;
    vp.style.top = `${(scrollRatio || 0) * maxVpTop}px`;
  };

  const saveFile = () => {
    if (!activeTab) return;
    
    const newFiles = {
      ...files,
      [activeTab]: {
        ...files[activeTab],
        modified: false
      }
    };
    setFiles(newFiles);
    localStorage.setItem(`gameycode-files-${currentProjectId}`, JSON.stringify(newFiles));
    localStorage.setItem(`gameycode-tree-${currentProjectId}`, JSON.stringify(tree));
    showToast(`Saved ${activeTab}`);
  };

  const insertSoundCode = () => {
    if (!activeTab || !files[activeTab]) {
      showToast('Open a file to insert sound code');
      return;
    }
    const soundSnippet = `
// --- Sound Effect ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency = 440, type = 'sine', duration = 0.1) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}
// --------------------
`;
    const newContent = files[activeTab].content + '\n' + soundSnippet;
    const newFiles = { ...files };
    newFiles[activeTab] = { ...newFiles[activeTab], content: newContent, modified: true };
    setFiles(newFiles);
    localStorage.setItem(`gameycode-files-${currentProjectId}`, JSON.stringify(newFiles));
    showToast('Sound code inserted!');
  };

  const deleteItem = (name: string) => {
    const newFiles = { ...files };
    delete newFiles[name];
    setFiles(newFiles);
    localStorage.setItem(`gameycode-files-${currentProjectId}`, JSON.stringify(newFiles));

    const removeFromTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.filter(n => n.name !== name).map(n => {
        if (n.type === 'folder' && n.children) {
          return { ...n, children: n.children.filter(c => c !== name) };
        }
        return n;
      });
    };
    const newTree = removeFromTree(tree);
    setTree(newTree);
    localStorage.setItem(`gameycode-tree-${currentProjectId}`, JSON.stringify(newTree));

    if (openTabs.includes(name)) {
      const newTabs = openTabs.filter(t => t !== name);
      setOpenTabs(newTabs);
      if (activeTab === name) {
        setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
      }
    }
    showToast(`Deleted ${name}`);
  };

  const handleRename = () => {
    if (!renameValue.trim() || !renameModal) return;
    const oldName = renameModal.oldName;
    const newName = renameValue.trim();
    if (oldName === newName) { setRenameModal(null); return; }
    if (files[newName]) { showToast('Name already exists'); return; }

    const newFiles = { ...files };
    newFiles[newName] = newFiles[oldName];
    newFiles[newName].ext = newName.split('.').pop() || 'txt';
    delete newFiles[oldName];
    setFiles(newFiles);
    localStorage.setItem(`gameycode-files-${currentProjectId}`, JSON.stringify(newFiles));

    const renameInTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(n => {
        if (n.name === oldName) return { ...n, name: newName };
        if (n.type === 'folder' && n.children) {
           return { ...n, children: n.children.map(c => c === oldName ? newName : c) };
        }
        return n;
      });
    };
    const newTree = renameInTree(tree);
    setTree(newTree);
    localStorage.setItem(`gameycode-tree-${currentProjectId}`, JSON.stringify(newTree));

    if (openTabs.includes(oldName)) {
      const newTabs = openTabs.map(t => t === oldName ? newName : t);
      setOpenTabs(newTabs);
      if (activeTab === oldName) setActiveTab(newName);
    }
    setRenameModal(null);
    showToast(`Renamed to ${newName}`);
  };

  const modifiedFiles = Object.keys(files).filter(k => files[k].modified && !files[k].staged);
  const stagedFiles = Object.keys(files).filter(k => files[k].staged);

  const stageFile = (f: string) => {
    const newFiles = { ...files };
    newFiles[f].staged = true;
    setFiles(newFiles);
    localStorage.setItem(`gameycode-files-${currentProjectId}`, JSON.stringify(newFiles));
  };

  const unstageFile = (f: string) => {
    const newFiles = { ...files };
    newFiles[f].staged = false;
    setFiles(newFiles);
    localStorage.setItem(`gameycode-files-${currentProjectId}`, JSON.stringify(newFiles));
  };

  const stageAll = () => {
    const newFiles = { ...files };
    modifiedFiles.forEach(f => {
      newFiles[f].staged = true;
    });
    setFiles(newFiles);
    localStorage.setItem(`gameycode-files-${currentProjectId}`, JSON.stringify(newFiles));
  };

  const unstageAll = () => {
    const newFiles = { ...files };
    stagedFiles.forEach(f => {
      newFiles[f].staged = false;
    });
    setFiles(newFiles);
    localStorage.setItem(`gameycode-files-${currentProjectId}`, JSON.stringify(newFiles));
  };

  const [commitMessage, setCommitMessage] = useState('');

  const commitChanges = () => {
    if (stagedFiles.length === 0) {
      showToast('No staged changes to commit');
      return;
    }
    if (!commitMessage.trim()) {
      showToast('Please enter a commit message');
      return;
    }
    const newFiles = { ...files };
    stagedFiles.forEach(f => {
      newFiles[f].modified = false;
      newFiles[f].staged = false;
    });
    setFiles(newFiles);
    setCommitMessage('');
    localStorage.setItem(`gameycode-files-${currentProjectId}`, JSON.stringify(newFiles));
    showToast(`Committed ${stagedFiles.length} files`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files, tree, activeTab]);

  useEffect(() => {
    if (minimapEnabled && activeTab && minimapRef.current) {
      const ctx = minimapRef.current.getContext('2d');
      if (ctx) {
        const style = getComputedStyle(document.documentElement);
        ctx.fillStyle = style.getPropertyValue('--bg4').trim() || '#1c2333';
        ctx.fillRect(0, 0, 82, minimapRef.current.height);
        ctx.fillStyle = style.getPropertyValue('--acc').trim() || '#3b82f6';
        ctx.globalAlpha = 0.5;
        
        const lines = files[activeTab]?.content.split('\n') || [];
        lines.forEach((line, i) => {
          const len = Math.min(line.length, 40);
          if (len > 0) {
            ctx.fillRect(2, i * 2, len * 1.5, 1.5);
          }
        });
        ctx.globalAlpha = 1.0;
      }
    }
  }, [activeTab, files, minimapEnabled, fontSize, theme]);

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node, i) => {
      if (node.type === 'folder') {
        return (
          <div key={`${node.name}-${i}`}>
            <div 
              className="folder-row" 
              style={{ paddingLeft: `${10 + depth * 10}px` }}
              onClick={() => toggleFolder(node.name)}
            >
              <ChevronRight size={14} className={`f-arrow ${node.open ? 'open' : ''}`} />
              <FolderPlus size={14} className="text-blue-400" />
              <span>{node.name}</span>
            </div>
            <div className={`f-children ${node.open ? 'open' : ''}`}>
              {node.children && node.children.map(childName => {
                const isFolder = !childName.includes('.');
                if (isFolder) return null; // Simplified for this example
                return (
                  <div 
                    key={childName}
                    className={`file-row ${activeTab === childName ? 'active' : ''}`}
                    style={{ paddingLeft: `${24 + depth * 10}px` }}
                    onClick={() => openFile(childName)}
                    onContextMenu={(e) => handleContextMenu(e, childName)}
                  >
                    <FileCode size={13} className={
                      childName.endsWith('.js') ? 'text-yellow-400' : 
                      childName.endsWith('.html') ? 'text-orange-400' : 
                      childName.endsWith('.css') ? 'text-blue-400' : 
                      childName.endsWith('.json') ? 'text-green-400' : 'text-teal-400'
                    } />
                    <span>{childName}</span>
                    {files[childName]?.modified && <span className="fi-mod">M</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      return (
        <div 
          key={node.name}
          className={`file-row ${activeTab === node.name ? 'active' : ''}`}
          style={{ paddingLeft: `${10 + depth * 10}px` }}
          onClick={() => openFile(node.name)}
          onContextMenu={(e) => handleContextMenu(e, node.name)}
        >
          <FileCode size={13} className={
            node.name.endsWith('.js') ? 'text-yellow-400' : 
            node.name.endsWith('.html') ? 'text-orange-400' : 
            node.name.endsWith('.css') ? 'text-blue-400' : 
            node.name.endsWith('.json') ? 'text-green-400' : 'text-teal-400'
          } />
          <span>{node.name}</span>
          {files[node.name]?.modified && <span className="fi-mod">M</span>}
        </div>
      );
    });
  };

  const activeFileContent = activeTab ? files[activeTab]?.content : '';
  const lineCount = activeFileContent ? activeFileContent.split('\n').length : 0;

  const handleCodeChange = (code: string) => {
    if (activeTab) {
      setFiles({
        ...files,
        [activeTab]: {
          ...files[activeTab],
          content: code,
          modified: true
        }
      });
    }
  };

  const getLanguage = (ext: string) => {
    switch(ext) {
      case 'js': return Prism.languages.javascript;
      case 'html': return Prism.languages.markup;
      case 'css': return Prism.languages.css;
      case 'json': return Prism.languages.json;
      case 'md': return Prism.languages.markdown;
      default: return Prism.languages.javascript;
    }
  };

  const handleCreateItem = () => {
    if (!newItemName.trim()) return;
    
    const name = newItemName.trim();
    
    if (newItemModal?.type === 'file') {
      if (files[name]) {
        showToast('File already exists');
        return;
      }
      const ext = name.split('.').pop() || 'txt';
      const newFiles = {
        ...files,
        [name]: {
          ext,
          dir: newItemModal.parent || '',
          content: '',
          modified: false
        }
      };
      setFiles(newFiles);
      localStorage.setItem(`gameycode-files-${currentProjectId}`, JSON.stringify(newFiles));
      
      const newTree = [...tree];
      if (newItemModal.parent) {
        const parentNode = newTree.find(n => n.name === newItemModal.parent);
        if (parentNode && parentNode.children) {
          parentNode.children.push(name);
        }
      } else {
        newTree.push({ type: 'file', name });
      }
      setTree(newTree);
      localStorage.setItem(`gameycode-tree-${currentProjectId}`, JSON.stringify(newTree));
      openFile(name);
    } else if (newItemModal?.type === 'folder') {
      const newTree = [...tree];
      newTree.push({ type: 'folder', name, open: true, children: [] });
      setTree(newTree);
      localStorage.setItem(`gameycode-tree-${currentProjectId}`, JSON.stringify(newTree));
    }
    
    setNewItemModal(null);
    setNewItemName('');
  };

  const runProject = () => {
    const htmlFile = files['index.html']?.content || '';
    const cssFile = files['sprites.css']?.content || files['style.css']?.content || '';
    
    // Simple bundling: replace links and scripts with inline content
    let fullHtml = htmlFile;
    
    if (fullHtml.includes('<link rel="stylesheet" href="./sprites.css"/>')) {
      fullHtml = fullHtml.replace('<link rel="stylesheet" href="./sprites.css"/>', `<style>${cssFile}</style>`);
    } else if (fullHtml.includes('<link rel="stylesheet" href="style.css">')) {
      fullHtml = fullHtml.replace('<link rel="stylesheet" href="style.css">', `<style>${cssFile}</style>`);
    } else {
      fullHtml = fullHtml.replace('</head>', `<style>${cssFile}</style></head>`);
    }

    const jsFiles = ['physics.js', 'renderer.js', 'player.js', 'game.js']
      .map(f => files[f]?.content || '')
      .map(content => content.replace(/import\s+.*?from\s+['"].*?['"];?/g, '')) // Remove imports
      .map(content => content.replace(/export\s+/g, '')) // Remove exports
      .join('\n\n');
    
    fullHtml = fullHtml
      .replace('<script type="module"\n          src="../src/game.js"></script>', '')
      .replace('<script type="module" src="../src/game.js"></script>', '')
      .replace('<script src="physics.js"></script>', '')
      .replace('<script src="player.js"></script>', '')
      .replace('<script src="game.js"></script>', '');
      
    fullHtml = fullHtml.replace('</body>', `<script>${jsFiles}</script></body>`);

    const blob = new Blob([fullHtml], { type: 'text/html' });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setPreviewOpen(true);
    showToast('Project running in preview');
  };

  const switchProject = (id: string) => {
    setCurrentProjectId(id);
    localStorage.setItem('gameycode-current-project', id);
    
    const savedFiles = localStorage.getItem(`gameycode-files-${id}`);
    const savedTree = localStorage.getItem(`gameycode-tree-${id}`);
    
    if (savedFiles && savedTree) {
      setFiles(JSON.parse(savedFiles));
      setTree(JSON.parse(savedTree));
    } else if (id === 'default') {
      setFiles(INITIAL_FILES);
      setTree(INITIAL_TREE);
    }
    
    setOpenTabs([]);
    setActiveTab(null);
  };

  const createNewProject = () => {
    if (!newProjectName.trim()) return;
    const id = crypto.randomUUID();
    const name = newProjectName.trim();
    const newProjects = [...projects, { id, name }];
    setProjects(newProjects);
    localStorage.setItem('gameycode-projects', JSON.stringify(newProjects));
    
    const blankFiles = {
      'index.html': { ext: 'html', dir: '', content: '<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <canvas id="canvas" width="800" height="600"></canvas>\n  <script src="game.js"></script>\n</body>\n</html>', modified: false },
      'game.js': { ext: 'js', dir: '', content: 'const canvas = document.getElementById("canvas");\nconst ctx = canvas.getContext("2d");\n\nctx.fillStyle = "#3b82f6";\nctx.fillRect(100, 100, 50, 50);\n', modified: false },
      'style.css': { ext: 'css', dir: '', content: 'body { background: #0d1117; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }\ncanvas { background: #111620; border: 2px solid #1e2d40; border-radius: 8px; }', modified: false }
    };
    const blankTree: TreeNode[] = [
      { type: 'file', name: 'index.html' },
      { type: 'file', name: 'game.js' },
      { type: 'file', name: 'style.css' }
    ];
    
    localStorage.setItem(`gameycode-files-${id}`, JSON.stringify(blankFiles));
    localStorage.setItem(`gameycode-tree-${id}`, JSON.stringify(blankTree));
    
    setNewProjectModal(false);
    setNewProjectName('');
    switchProject(id);
  };

  return (
    <>
      {!isLaunched && (
        <div id="landing">
          <div className="l-tag"><span>Gamey</span>Code</div>
          <div className="l-title">Code the<br/>Next Reality.</div>
          <div className="l-sub">The ultimate code editor for game developers.</div>
          <button className="btn-join" onClick={launch}>Launch Editor</button>
        </div>
      )}

      <div id="curtain" className={curtainOn ? 'on' : ''}></div>

      <div id="editor" className={isLaunched ? 'show' : ''} style={{ display: isLaunched ? 'flex' : 'none' }}>
        {/* Title Bar */}
        <div className="titlebar">
          <div className="dots">
            <div className="dot r"><X size={8} /></div>
            <div className="dot y"><Minus size={8} /></div>
            <div className="dot g"><Maximize size={8} /></div>
          </div>
          <div className="tb-brand">
            <div className="tb-gem"><Play size={12} fill="white" /></div>
            <div className="tb-name">Gamey<span className="c">Code</span></div>
          </div>
          <div className="tb-actions">
            {soundExtInstalled && (
              <button className="tb-btn" onClick={insertSoundCode} title="Insert Sound Code">
                <Music size={14} />
              </button>
            )}
            <button className={`tb-btn ${findOpen ? 'active-btn' : ''}`} onClick={() => setFindOpen(!findOpen)} title="Find (Ctrl+F)">
              <Search size={14} />
            </button>
            <button className="tb-btn" onClick={saveFile} title="Save (Ctrl+S)">
              <Save size={14} />
            </button>
            <button className="tb-btn run-btn" onClick={runProject} title="Run Project">
              <Play size={12} /> Run
            </button>
            <button className="tb-btn" onClick={() => setSettingsOpen(true)} title="Settings">
              <Settings size={14} />
            </button>
          </div>
        </div>

        <div className="main-row">
          {/* Activity Bar */}
          <div className="actbar">
            <button className={`ab-btn ${activePanel === 'explorer' ? 'active' : ''}`} onClick={() => { setSidebarCollapsed(activePanel === 'explorer' ? !sidebarCollapsed : false); setActivePanel('explorer'); }}>
              <FileCode size={20} />
              <div className="ab-tip">Explorer</div>
            </button>
            <button className={`ab-btn ${activePanel === 'search' ? 'active' : ''}`} onClick={() => { setSidebarCollapsed(activePanel === 'search' ? !sidebarCollapsed : false); setActivePanel('search'); }}>
              <Search size={20} />
              <div className="ab-tip">Search</div>
            </button>
            <button className={`ab-btn ${activePanel === 'source' ? 'active' : ''}`} onClick={() => { setSidebarCollapsed(activePanel === 'source' ? !sidebarCollapsed : false); setActivePanel('source'); }}>
              <GitBranch size={20} />
              <div className="ab-badge"></div>
              <div className="ab-tip">Source Control</div>
            </button>
            <button className={`ab-btn ${activePanel === 'debug' ? 'active' : ''}`} onClick={() => { setSidebarCollapsed(activePanel === 'debug' ? !sidebarCollapsed : false); setActivePanel('debug'); }}>
              <Bug size={20} />
              <div className="ab-tip">Run and Debug</div>
            </button>
            <button className={`ab-btn ${activePanel === 'extensions' ? 'active' : ''}`} onClick={() => { setSidebarCollapsed(activePanel === 'extensions' ? !sidebarCollapsed : false); setActivePanel('extensions'); }}>
              <Blocks size={20} />
              <div className="ab-tip">Extensions</div>
            </button>
            <div className="ab-spacer"></div>
            <button className="ab-btn" onClick={() => setSettingsOpen(true)}>
              <Settings size={20} />
              <div className="ab-tip">Settings</div>
            </button>
          </div>

          {/* Sidebar */}
          <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            {/* Explorer Panel */}
            <div className={`sb-panel ${activePanel === 'explorer' ? 'active' : ''}`}>
              <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg1)]">
                <div className="flex items-center gap-2 w-full">
                  <Folder size={14} className="text-[var(--t3)]" />
                  <select 
                    className="bg-transparent text-[var(--t1)] text-xs font-semibold outline-none flex-1 cursor-pointer"
                    value={currentProjectId}
                    onChange={(e) => switchProject(e.target.value)}
                  >
                    {projects.map(p => <option key={p.id} value={p.id} className="bg-[var(--bg2)]">{p.name}</option>)}
                  </select>
                </div>
                <button className="sb-ibtn ml-1" title="New Project" onClick={() => setNewProjectModal(true)}>
                  <Plus size={14} />
                </button>
              </div>
              <div className="sb-head">
                <div className="sb-title">Explorer</div>
                <div className="sb-acts">
                  <button className="sb-ibtn" title="New File" onClick={() => setNewItemModal({ type: 'file', parent: null })}><FilePlus size={14} /></button>
                  <button className="sb-ibtn" title="New Folder" onClick={() => setNewItemModal({ type: 'folder', parent: null })}><FolderPlus size={14} /></button>
                  <button className="sb-ibtn" onClick={() => setSidebarCollapsed(true)}><Minus size={14} /></button>
                </div>
              </div>
              <div className="file-tree">
                {renderTree(tree)}
              </div>
            </div>

            {/* Search Panel */}
            <div className={`sb-panel ${activePanel === 'search' ? 'active' : ''}`}>
              <div className="sb-head">
                <div className="sb-title">Search</div>
              </div>
              <div className="sb-search-box">
                <input 
                  type="text" 
                  className="sb-sinput" 
                  placeholder="Search files..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="sb-results">
                {searchQuery && Object.keys(files).filter(f => f.toLowerCase().includes(searchQuery.toLowerCase())).map(f => (
                  <div key={f} className="file-row" onClick={() => openFile(f)}>
                    <FileCode size={13} className="text-blue-400" /> <span>{f}</span>
                  </div>
                ))}
                {(!searchQuery || Object.keys(files).filter(f => f.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) && (
                  <div className="p-4 text-xs text-[var(--t3)] text-center">
                    {searchQuery ? 'No results found.' : 'Type to search files.'}
                  </div>
                )}
              </div>
            </div>

            {/* Source Control Panel */}
            <div className={`sb-panel ${activePanel === 'source' ? 'active' : ''}`}>
              <div className="sb-head">
                <div className="sb-title">Source Control</div>
              </div>
              <div className="sc-section flex-1 overflow-y-auto">
                {stagedFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="sc-label flex justify-between items-center mb-2">
                      <span>Staged Changes</span>
                      <button onClick={unstageAll} className="text-[var(--t3)] hover:text-[var(--t1)]" title="Unstage All"><Minus size={12} /></button>
                    </div>
                    {stagedFiles.map(f => (
                      <div key={f} className="sc-file group" onClick={() => openFile(f)}>
                        <FileCode size={13} className="text-green-400" />
                        <div className="sc-fname">{f}</div>
                        <div className="sc-status M text-green-400">M</div>
                        <button className="ml-auto opacity-0 group-hover:opacity-100 text-[var(--t3)] hover:text-[var(--t1)]" onClick={(e) => { e.stopPropagation(); unstageFile(f); }} title="Unstage Changes"><Minus size={14}/></button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="sc-label flex justify-between items-center mb-2">
                  <span>Changes</span>
                  {modifiedFiles.length > 0 && (
                    <button onClick={stageAll} className="text-[var(--t3)] hover:text-[var(--t1)]" title="Stage All"><Plus size={12} /></button>
                  )}
                </div>
                {modifiedFiles.length === 0 ? (
                  <div className="p-4 text-xs text-[var(--t3)] text-center">No pending changes.</div>
                ) : (
                  modifiedFiles.map(f => (
                    <div key={f} className="sc-file group" onClick={() => openFile(f)}>
                      <FileCode size={13} className="text-yellow-400" />
                      <div className="sc-fname">{f}</div>
                      <div className="sc-status M">M</div>
                      <button className="ml-auto opacity-0 group-hover:opacity-100 text-[var(--t3)] hover:text-[var(--t1)]" onClick={(e) => { e.stopPropagation(); stageFile(f); }} title="Stage Changes"><Plus size={14}/></button>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-auto sc-commit-area">
                <textarea 
                  className="sc-input" 
                  placeholder="Message (Ctrl+Enter to commit)"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      commitChanges();
                    }
                  }}
                ></textarea>
                <button className="sc-commit-btn" onClick={commitChanges}>Commit</button>
              </div>
            </div>

            {/* Debug Panel */}
            <div className={`sb-panel ${activePanel === 'debug' ? 'active' : ''}`}>
              <div className="sb-head">
                <div className="sb-title">Run and Debug</div>
              </div>
              <div className="p-4">
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2" onClick={() => showToast('Debugger attached.')}>
                  <Play size={12} fill="white" /> Start Debugging
                </button>
              </div>
            </div>

            {/* Extensions Panel */}
            <div className={`sb-panel ${activePanel === 'extensions' ? 'active' : ''}`}>
              <div className="sb-head">
                <div className="sb-title">Extensions</div>
              </div>
              <div className="ext-search">
                <input type="text" className="sb-sinput" placeholder="Search Extensions in Marketplace" />
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="ext-item">
                  <div className="ext-icon bg-blue-900/30 text-blue-400"><Blocks size={20} /></div>
                  <div className="ext-info">
                    <div className="ext-name">GameyCode Tools</div>
                    <div className="ext-desc">Essential tools for game dev.</div>
                  </div>
                  <button className="ext-btn installed">Installed</button>
                </div>
                <div className="ext-item">
                  <div className="ext-icon bg-purple-900/30 text-purple-400"><Music size={20} /></div>
                  <div className="ext-info">
                    <div className="ext-name">Sound Effects Pro</div>
                    <div className="ext-desc">Quickly insert sound effects code.</div>
                  </div>
                  {soundExtInstalled ? (
                    <button className="ext-btn installed" onClick={() => { setSoundExtInstalled(false); localStorage.setItem('gameycode-sound-ext', 'false'); }}>Installed</button>
                  ) : (
                    <button className="ext-btn" onClick={() => { setSoundExtInstalled(true); localStorage.setItem('gameycode-sound-ext', 'true'); showToast('Sound Effects Pro installed!'); }}>Install</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div className="editor-area">
            <div className="tabbar">
              {openTabs.map(tab => (
                <div 
                  key={tab} 
                  className={`tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  <div className={`tdot ${files[tab]?.ext || 'js'}`}></div>
                  <div className="tab-n">{tab}</div>
                  {files[tab]?.modified && <div className="tab-mod"></div>}
                  <div className="tab-x" onClick={(e) => closeTab(e, tab)}><X size={12} /></div>
                </div>
              ))}
              <div className="tab-add-btn" onClick={() => setNewItemModal({ type: 'file', parent: null })}><Plus size={14} /></div>
            </div>

            <div className="breadcrumb">
              <span className="bc-i">GameyCode</span>
              <span className="bc-sep"><ChevronRight size={12} /></span>
              <span className="bc-i">{activeTab ? files[activeTab]?.dir || 'root' : ''}</span>
              <span className="bc-sep"><ChevronRight size={12} /></span>
              <span className="bc-i last">{activeTab || 'No file open'}</span>
            </div>

            <div className="code-pane">
              {/* Find Bar */}
              <div className={`find-bar ${findOpen ? 'open' : ''}`}>
                <input 
                  type="text" 
                  className="find-input" 
                  placeholder="Find" 
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                />
                <div className="find-count">0 of 0</div>
                <div className="find-nav">
                  <button className="find-nav-btn"><ChevronDown size={14} className="rotate-180" /></button>
                  <button className="find-nav-btn"><ChevronDown size={14} /></button>
                </div>
                <button className="find-close" onClick={() => setFindOpen(false)}><X size={14} /></button>
              </div>

              {activeTab ? (
                <>
                  <div className="gutter" ref={gutterRef}>
                    {Array.from({ length: lineCount }).map((_, i) => (
                      <div key={i} className={`gl ${i === 58 ? 'aline' : ''}`}>{i + 1}</div>
                    ))}
                  </div>
                  <div className="code-scroll" ref={codeScrollRef} onScroll={handleScroll}>
                    <div className="code-inner" style={{ fontSize: `${fontSize}px` }}>
                      <Editor
                        value={activeFileContent}
                        onValueChange={handleCodeChange}
                        highlight={code => Prism.highlight(code, getLanguage(files[activeTab]?.ext || 'js'), files[activeTab]?.ext || 'javascript')}
                        padding={0}
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: `${fontSize}px`,
                          backgroundColor: 'transparent',
                          minHeight: '100%',
                          whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                        }}
                        textareaClassName="editor-textarea"
                      />
                    </div>
                  </div>
                  {minimapEnabled && (
                    <div className="minimap">
                      <canvas id="mmCanvas" ref={minimapRef} width="82" height="2000"></canvas>
                      <div className="mm-vp" ref={minimapVpRef}></div>
                    </div>
                  )}
                </>
              ) : (
                <div className="welcome-screen">
                  <div className="welcome-logo">Gamey<span>Code</span></div>
                  <div className="welcome-links">
                    <div className="welcome-link" onClick={() => setNewItemModal({ type: 'file', parent: null })}>
                      <FilePlus size={16} /> New File
                    </div>
                    <div className="welcome-link" onClick={() => setNewProjectModal(true)}>
                      <FolderPlus size={16} /> New Project
                    </div>
                    <div className="welcome-link" onClick={() => setSettingsOpen(true)}>
                      <Settings size={16} /> Settings
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Panel */}
            <div className={`bottom ${bottomPanelOpen ? 'open' : 'closed'}`}>
              <div className="ptabs">
                <div className={`ptab ${activeBottomTab === 'problems' ? 'active' : ''}`} onClick={() => { setActiveBottomTab('problems'); setBottomPanelOpen(true); }}>
                  Problems <span className="pbadge">1</span>
                </div>
                <div className={`ptab ${activeBottomTab === 'output' ? 'active' : ''}`} onClick={() => { setActiveBottomTab('output'); setBottomPanelOpen(true); }}>Output</div>
                <div className={`ptab ${activeBottomTab === 'debug' ? 'active' : ''}`} onClick={() => { setActiveBottomTab('debug'); setBottomPanelOpen(true); }}>Debug Console</div>
                <div className={`ptab ${activeBottomTab === 'terminal' ? 'active' : ''}`} onClick={() => { setActiveBottomTab('terminal'); setBottomPanelOpen(true); }}>Terminal</div>
                <div className="pt-spacer"></div>
                <button className="pt-btn" onClick={() => setBottomPanelOpen(!bottomPanelOpen)}>
                  {bottomPanelOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} className="-rotate-90" />}
                </button>
                <button className="pt-btn" onClick={() => setBottomPanelOpen(false)}><X size={14} /></button>
              </div>
              
              <div className={`panel-content ${activeBottomTab === 'terminal' ? 'active' : ''}`}>
                <div className="terminal">
                  <div><span className="tp">gameycode@web</span><span className="to">:</span><span className="tpa">~/project</span><span className="to">$</span> Welcome to GameyCode Terminal.</div>
                  <div><span className="to">Ready.</span></div>
                  <div><span className="tp">gameycode@web</span><span className="to">:</span><span className="tpa">~/project</span><span className="to">$</span> <span className="tcur"></span></div>
                </div>
              </div>

              <div className={`panel-content ${activeBottomTab === 'problems' ? 'active' : ''}`}>
                <div className="problems-list">
                  <div className="p-4 text-xs text-[var(--t3)]">No problems detected in the workspace.</div>
                </div>
              </div>
              
              <div className={`panel-content ${activeBottomTab === 'output' ? 'active' : ''}`}>
                <div className="p-4 text-xs font-mono text-[var(--t3)]">No output tasks running.</div>
              </div>
              
              <div className={`panel-content ${activeBottomTab === 'debug' ? 'active' : ''}`}>
                <div className="p-4 text-xs font-mono text-[var(--t3)]">Please start a debug session to evaluate expressions.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="statusbar">
          <div className="si"><GitBranch size={12} /> main</div>
          <div className="si-sep"></div>
          <div className="si"><X size={12} className="text-red-300" /> 0 <AlertCircle size={12} className="ml-2 text-yellow-300" /> 0</div>
          <div className="si-sep"></div>
          <div className="si"><Play size={12} /> GameyCode Engine</div>
          
          <div className="si-r">
            <div className="si">Ln {lineCount}</div>
            <div className="si-sep"></div>
            <div className="si">Spaces: 2</div>
            <div className="si-sep"></div>
            <div className="si">UTF-8</div>
            <div className="si-sep"></div>
            <div className="si">{activeTab ? (files[activeTab]?.ext === 'js' ? 'JavaScript' : files[activeTab]?.ext === 'html' ? 'HTML' : files[activeTab]?.ext === 'css' ? 'CSS' : 'Text') : 'No File'}</div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`toast ${toastMsg ? 'show' : ''}`}>
        {toastMsg}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="ctx-menu open" 
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="ctx-item" onClick={() => { openFile(contextMenu.file); setContextMenu(null); }}>
            <Edit2 size={14} /> Open
          </div>
          <div className="ctx-item" onClick={() => { showToast('Copied to clipboard'); setContextMenu(null); }}>
            <Copy size={14} /> Copy Path
          </div>
          <div className="ctx-item" onClick={() => { setRenameValue(contextMenu.file); setRenameModal({ oldName: contextMenu.file }); setContextMenu(null); }}>
            <Edit2 size={14} /> Rename
          </div>
          <div className="ctx-sep"></div>
          <div className="ctx-item danger" onClick={() => { deleteItem(contextMenu.file); setContextMenu(null); }}>
            <Trash2 size={14} /> Delete <span className="ctx-shortcut">Del</span>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <div className={`settings-overlay ${settingsOpen ? 'open' : ''}`} onClick={() => setSettingsOpen(false)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="sm-head">
            <div className="sm-title">Settings</div>
            <button className="sm-close" onClick={() => setSettingsOpen(false)}><X size={16} /></button>
          </div>
          <div className="sm-body">
            <div className="sm-section">Editor</div>
            
            <div className="sm-row">
              <div>
                <div className="sm-label">Font Size</div>
                <div className="sm-sub">Controls the font size in pixels.</div>
              </div>
              <input 
                type="number" 
                className="sb-sinput w-20" 
                value={fontSize} 
                onChange={(e) => setFontSize(Number(e.target.value))}
                min="8" max="32"
              />
            </div>
            
            <div className="sm-row">
              <div>
                <div className="sm-label">Minimap</div>
                <div className="sm-sub">Controls whether the minimap is shown.</div>
              </div>
              <button 
                className={`sm-toggle ${minimapEnabled ? 'on' : ''}`}
                onClick={() => setMinimapEnabled(!minimapEnabled)}
              ></button>
            </div>
            
            <div className="sm-row">
              <div>
                <div className="sm-label">Word Wrap</div>
                <div className="sm-sub">Controls how lines wrap.</div>
              </div>
              <button 
                className={`sm-toggle ${wordWrap ? 'on' : ''}`}
                onClick={() => setWordWrap(!wordWrap)}
              ></button>
            </div>

            <div className="sm-section mt-4">Workbench</div>
            
            <div className="sm-row">
              <div>
                <div className="sm-label">Color Theme</div>
                <div className="sm-sub">Specifies the color theme used in the workbench.</div>
              </div>
              <select 
                className="sm-select"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="dark">GameyCode Dark</option>
                <option value="light">GameyCode Light</option>
                <option value="hc">High Contrast</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* New Item Modal */}
      <div className={`settings-overlay ${newItemModal ? 'open' : ''}`} onClick={() => setNewItemModal(null)}>
        <div className="settings-modal" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
          <div className="sm-head">
            <div className="sm-title">New {newItemModal?.type === 'file' ? 'File' : 'Folder'}</div>
            <button className="sm-close" onClick={() => setNewItemModal(null)}><X size={16} /></button>
          </div>
          <div className="sm-body">
            <div className="sm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div className="sm-label">Name</div>
              <input 
                ref={newItemInputRef}
                type="text" 
                className="sb-sinput" 
                value={newItemName} 
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`Enter ${newItemModal?.type} name...`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateItem();
                  if (e.key === 'Escape') setNewItemModal(null);
                }}
              />
            </div>
            <div className="flex justify-end mt-2">
              <button className="sc-commit-btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={handleCreateItem}>
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      <div className={`settings-overlay ${renameModal ? 'open' : ''}`} onClick={() => setRenameModal(null)}>
        <div className="settings-modal" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
          <div className="sm-head">
            <div className="sm-title">Rename</div>
            <button className="sm-close" onClick={() => setRenameModal(null)}><X size={16} /></button>
          </div>
          <div className="sm-body">
            <div className="sm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div className="sm-label">New Name</div>
              <input 
                ref={renameInputRef}
                type="text" 
                className="sb-sinput" 
                value={renameValue} 
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setRenameModal(null);
                }}
              />
            </div>
            <div className="flex justify-end mt-2">
              <button className="sc-commit-btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={handleRename}>
                Rename
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      <div className={`settings-overlay ${newProjectModal ? 'open' : ''}`} onClick={() => setNewProjectModal(false)}>
        <div className="settings-modal" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
          <div className="sm-head">
            <div className="sm-title">New Project</div>
            <button className="sm-close" onClick={() => setNewProjectModal(false)}><X size={16} /></button>
          </div>
          <div className="sm-body">
            <div className="sm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div className="sm-label">Project Name</div>
              <input 
                type="text" 
                className="sb-sinput" 
                value={newProjectName} 
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createNewProject();
                  if (e.key === 'Escape') setNewProjectModal(false);
                }}
              />
            </div>
            <div className="flex justify-end mt-2">
              <button className="sc-commit-btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={createNewProject}>
                Create Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <div className={`settings-overlay ${previewOpen ? 'open' : ''}`} onClick={() => setPreviewOpen(false)}>
        <div className="settings-modal" style={{ width: '80vw', height: '80vh', maxWidth: '1200px' }} onClick={e => e.stopPropagation()}>
          <div className="sm-head">
            <div className="sm-title flex items-center gap-2"><Play size={14} className="text-green-400" /> Preview</div>
            <button className="sm-close" onClick={() => setPreviewOpen(false)}><X size={16} /></button>
          </div>
          <div className="sm-body" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg1)' }}>
            {previewUrl && (
              <iframe 
                src={previewUrl} 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Game Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
