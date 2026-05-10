import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  History, 
  Shirt, 
  GraduationCap, 
  Trophy, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft, 
  Clipboard, 
  Check,
  Loader2,
  Tv,
  Users,
  Mic2,
  FileText,
  Clock,
  Zap,
  FlaskConical,
  Coins,
  Utensils,
  Map,
  Heart,
  Image as ImageIcon
} from 'lucide-react';
import { generateTitles, generateScript, generateImagePrompts, reviseScript, type VideoTitle, type VideoScript, type ImagePrompt } from './lib/geminiService';

const SUBJECTS = [
  { id: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
  { id: 'fashion', label: 'Fashion', icon: <Shirt className="w-5 h-5" /> },
  { id: 'education', label: 'Education', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'sports', label: 'Sports', icon: <Trophy className="w-5 h-5" /> },
  { id: 'tech', label: 'Technology', icon: <Play className="w-5 h-5" /> },
  { id: 'science', label: 'Science', icon: <FlaskConical className="w-5 h-5" /> },
  { id: 'finance', label: 'Finance', icon: <Coins className="w-5 h-5" /> },
  { id: 'cooking', label: 'Cooking', icon: <Utensils className="w-5 h-5" /> },
  { id: 'travel', label: 'Travel', icon: <Map className="w-5 h-5" /> },
  { id: 'lifestyle', label: 'Lifestyle', icon: <Heart className="w-5 h-5" /> },
];

const SCRIPT_TYPES = [
  { id: 'documentary', label: 'Documentary', description: 'Deep dive with cinematic visuals', icon: <History className="w-5 h-5" /> },
  { id: 'tutorial', label: 'Tutorial', description: 'Step-by-step educational guide', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'top10', label: 'Top 10', description: 'Fast-paced countdown list', icon: <Trophy className="w-5 h-5" /> },
  { id: 'essay', label: 'Video Essay', description: 'Deep analytical storytelling', icon: <FileText className="w-5 h-5" /> },
  { id: 'interview', label: 'Interview', description: 'Conversational dialogue style', icon: <Users className="w-5 h-5" /> },
  { id: 'news', label: 'News Digest', description: 'Quick updates on recent events', icon: <Mic2 className="w-5 h-5" /> },
];

const WORD_COUNTS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500];

enum Step {
  SUBJECT,
  TITLES,
  SCRIPT_TYPE,
  GENERATING,
  FINAL_SCRIPT
}

export default function App() {
  const [step, setStep] = useState<Step>(Step.SUBJECT);
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [titles, setTitles] = useState<VideoTitle[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<VideoTitle | null>(null);
  const [scriptType, setScriptType] = useState(SCRIPT_TYPES[0].id);
  const [targetWordCount, setTargetWordCount] = useState(500);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [imagePrompts, setImagePrompts] = useState<ImagePrompt[]>([]);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [revising, setRevising] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubjectSelect = (subj: string) => {
    if (subj === 'other') return;
    setSubject(subj);
    handleGenerateTitles(subj);
  };

  const handleCustomSubjectSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (customSubject.trim()) {
      setSubject(customSubject);
      handleGenerateTitles(customSubject);
    }
  };

  const handleGenerateTitles = async (subj: string) => {
    setLoading(true);
    setStep(Step.TITLES);
    try {
      const generated = await generateTitles(subj);
      setTitles(generated);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleSelect = (title: VideoTitle) => {
    setSelectedTitle(title);
    setStep(Step.SCRIPT_TYPE);
  };

  const handleFinalGenerate = async () => {
    if (!selectedTitle) return;
    setLoading(true);
    setStep(Step.GENERATING);
    setImagePrompts([]); // Clear old prompts
    try {
      const result = await generateScript(
        selectedTitle.title, 
        subject, 
        scriptType,
        `${targetWordCount} words`
      );
      setScript(result);
      setStep(Step.FINAL_SCRIPT);
    } catch (error) {
      console.error(error);
      setStep(Step.SCRIPT_TYPE);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (!script) return;
    setLoadingPrompts(true);
    try {
      const prompts = await generateImagePrompts(script.content);
      setImagePrompts(prompts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleRevision = async () => {
    if (!script || !revisionFeedback.trim()) return;
    setRevising(true);
    try {
      const revised = await reviseScript(script, revisionFeedback);
      setScript(revised);
      setRevisionFeedback('');
      setImagePrompts([]); // Clear prompts as script changed
    } catch (error) {
      console.error(error);
    } finally {
      setRevising(false);
    }
  };

  const copyToClipboard = () => {
    if (script) {
      navigator.clipboard.writeText(script.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setStep(Step.SUBJECT);
    setSubject('');
    setCustomSubject('');
    setTitles([]);
    setSelectedTitle(null);
    setScript(null);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
            <div className="w-8 h-8 bg-brand rounded-sm flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rotate-45"></div>
            </div>
            <span className="font-display font-bold text-xl uppercase tracking-tight text-slate-900">CreatorCore</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium">
            <span className={`step-indicator ${step >= Step.SUBJECT ? 'step-active' : 'step-inactive'}`}>1. Subject</span>
            <span className={`step-indicator ${step >= Step.TITLES ? 'step-active' : 'step-inactive'}`}>2. Titles</span>
            <span className={`step-indicator ${step >= Step.SCRIPT_TYPE ? 'step-active' : 'step-inactive'}`}>3. Type</span>
            <span className={`step-indicator ${step >= Step.FINAL_SCRIPT ? 'step-active' : 'step-inactive'}`}>4. Script</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <span className="text-sm font-semibold text-slate-600">User</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 pt-32">
        <AnimatePresence mode="wait">
          {/* Step 1: Choose Subject */}
          {step === Step.SUBJECT && (
            <motion.section
              key="subject"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Choose Subject</h2>
                <h1 className="text-4xl font-bold text-slate-900">What's your next video about?</h1>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSubjectSelect(s.id)}
                    className="glass-card hover:border-brand hover:bg-brand-light group transition-all text-left flex flex-col gap-4 p-5"
                  >
                    <div className="text-2xl group-hover:scale-110 transition-transform">
                      {s.id === 'history' && '🏛️'}
                      {s.id === 'fashion' && '👗'}
                      {s.id === 'education' && '🎓'}
                      {s.id === 'sports' && '🏀'}
                      {s.id === 'tech' && '💻'}
                      {s.id === 'science' && '🧪'}
                      {s.id === 'finance' && '🪙'}
                      {s.id === 'cooking' && '🍳'}
                      {s.id === 'travel' && '🌍'}
                      {s.id === 'lifestyle' && '✨'}
                    </div>
                    <span className="font-bold text-sm uppercase tracking-wider text-slate-600 group-hover:text-brand">{s.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleCustomSubjectSubmit} className="max-w-2xl relative">
                <input
                  type="text"
                  placeholder="Or enter a custom topic..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-6 py-4 focus:outline-none focus:border-brand shadow-sm pr-16 text-slate-900"
                />
                <button
                  type="submit"
                  disabled={!customSubject.trim()}
                  className="absolute right-2 top-2 p-3 bg-brand text-white rounded shadow-sm disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </motion.section>
          )}

          {/* Step 2: Choose Title */}
          {step === Step.TITLES && (
            <motion.section
              key="titles"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-end justify-between border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Generated Titles (10)</h2>
                  <p className="text-2xl font-bold text-slate-900 capitalize">{subject}</p>
                </div>
                <button onClick={() => setStep(Step.SUBJECT)} className="btn-secondary py-2 px-4 shadow-sm">
                  CHANGE TOPIC
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-12 h-12 border-2 border-slate-200 border-t-brand rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Analyzing Trends...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {titles.map((t, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleTitleSelect(t)}
                      className="glass-card hover:border-brand hover:shadow-md transition-all text-left group border-slate-100"
                    >
                      <h3 className="text-base font-bold text-slate-800 mb-2 leading-snug group-hover:text-brand">{t.title}</h3>
                      <p className="text-slate-500 text-sm italic">"{t.hook}"</p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {/* Step 3: Choose Script Type & Length */}
          {step === Step.SCRIPT_TYPE && (
            <motion.section
              key="scriptType"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-12"
            >
              <div className="space-y-2 text-center max-w-2xl mx-auto">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuration</h2>
                <h1 className="text-3xl font-bold text-slate-900">Fine-tune your masterpiece</h1>
                <p className="text-slate-500 mt-2">Select the style and duration for your viral script.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Style Selection */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Narrative Style
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {SCRIPT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setScriptType(type.id)}
                        className={`p-4 text-left transition-all flex items-center gap-4 rounded-lg border-2 ${
                          scriptType === type.id ? 'border-brand bg-brand-light shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded shrink-0 flex items-center justify-center ${scriptType === type.id ? 'bg-brand text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {type.icon}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-sm">{type.label}</h4>
                          <p className="text-[11px] text-slate-500">{type.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Word Count Selection */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Target Word Count
                  </h3>
                  <div className="space-y-4">
                    <select
                      value={targetWordCount}
                      onChange={(e) => setTargetWordCount(Number(e.target.value))}
                      className="w-full bg-white border-2 border-slate-100 rounded-lg p-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand shadow-sm appearance-none cursor-pointer"
                    >
                      {WORD_COUNTS.map((count) => (
                        <option key={count} value={count}>
                          {count} Words
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 italic">
                      More words allow for deeper storytelling, while fewer words keep it punchy and fast-paced.
                    </p>
                  </div>

                  <div className="pt-8 space-y-4">
                    <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                        <span>Summary</span>
                        <Zap className="w-3 h-3" />
                      </div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        Generating a <span className="text-brand font-bold">{targetWordCount} words</span> script 
                        in <span className="text-brand font-bold">{SCRIPT_TYPES.find(s => s.id === scriptType)?.label}</span> style 
                        for "<span className="text-indigo-900 border-b border-indigo-200">{selectedTitle?.title}</span>".
                      </p>
                    </div>
                    <button onClick={handleFinalGenerate} className="w-full btn-primary py-4 gap-3">
                      <Sparkles className="w-4 h-4" /> CREATE VIRAL SCRIPT
                    </button>
                    <p className="text-[10px] text-center text-slate-400 uppercase tracking-[0.2em] font-bold">Press to confirm generation</p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Step 4: Generating Overlay */}
          {step === Step.GENERATING && (
            <motion.section
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 gap-8"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-sm flex items-center justify-center relative shadow-inner">
                <div className="w-10 h-10 border-4 border-brand rounded-sm animate-pulse" />
                <Loader2 className="w-4 h-4 absolute text-brand animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Script Engine Active</h2>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Optimizing Narrative Flow...</p>
              </div>
            </motion.section>
          )}

          {/* Step 5: Final Script */}
          {step === Step.FINAL_SCRIPT && script && (
            <motion.section
              key="final"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-[0.2em]">
                    <div className="w-2 h-2 bg-brand rotate-45" /> Fully Generated
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">{script.title}</h2>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded">
                      Style: {SCRIPT_TYPES.find(s => s.id === script.scriptType)?.label}
                    </span>
                    <span className="px-2 py-1 bg-indigo-50 text-brand text-[10px] font-bold uppercase tracking-widest rounded">
                      Niche: {subject}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleGeneratePrompts} 
                    disabled={loadingPrompts || imagePrompts.length > 0}
                    className="btn-secondary py-2.5 px-6 gap-2"
                  >
                    {loadingPrompts ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {imagePrompts.length > 0 ? 'PROMPTS READY' : 'IMAGE PROMPTS'}
                  </button>
                  <button onClick={copyToClipboard} className="btn-secondary py-2.5 px-6 gap-2">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                    {copied ? 'COPIED' : 'COPY SCRIPT'}
                  </button>
                  <button onClick={reset} className="btn-primary py-2.5 px-6">
                    NEW PROJECT
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                <div className="lg:col-span-1 space-y-4 sticky top-24">
                  <div className="glass-card p-5 space-y-4 bg-slate-50 shadow-none border-dashed">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Narrative Outline</h3>
                    <ul className="space-y-4">
                      {script.outline.map((point, i) => (
                        <li key={i} className="flex gap-3 text-xs font-medium text-slate-600 leading-normal">
                          <span className="text-brand font-bold bg-white w-5 h-5 flex items-center justify-center rounded border border-slate-200 shrink-0">{i + 1}</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {imagePrompts.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card p-5 space-y-4 bg-indigo-50/30 border-brand/20 shadow-none"
                    >
                      <h3 className="text-[10px] font-bold text-brand uppercase tracking-widest border-b border-brand/10 pb-2 flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Visual Prompts
                      </h3>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {imagePrompts.map((p, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{p.scene}</p>
                            <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 leading-normal italic">
                              "{p.prompt}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-white border-2 border-slate-100 rounded-lg p-8 shadow-sm min-h-[700px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand/10" />
                    <div className="font-sans text-sm leading-8 text-slate-700 whitespace-pre-wrap selection:bg-brand/10">
                      {script.content.split('\n').map((line, idx) => {
                        if (line.includes('[') && line.includes(']')) {
                          const isVisual = line.toLowerCase().includes('visual') || line.toLowerCase().includes('b-roll');
                          return (
                            <p key={idx} className={`font-bold my-4 ${isVisual ? 'text-slate-400 italic text-[11px] uppercase tracking-wider' : 'text-brand'}`}>
                              {line}
                            </p>
                          );
                        }
                        return <p key={idx}>{line}</p>;
                      })}
                    </div>
                    
                    <div className="mt-12 flex justify-center gap-1 opacity-20">
                      {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />)}
                    </div>
                  </div>

                  {/* Revision UI */}
                  <div className="glass-card bg-slate-50 border-slate-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Request Revision</h3>
                    <div className="flex gap-4">
                      <textarea
                        value={revisionFeedback}
                        onChange={(e) => setRevisionFeedback(e.target.value)}
                        placeholder="e.g., 'Make the intro more exciting' or 'Add a section about...'"
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-brand min-h-[80px]"
                      />
                      <button
                        onClick={handleRevision}
                        disabled={revising || !revisionFeedback.trim()}
                        className="btn-primary self-end h-fit gap-2"
                      >
                        {revising ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        REVISE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 bg-slate-50" />
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-brand/5 rounded-full blur-3xl -z-10" />
      <div className="fixed -bottom-24 -left-24 w-64 h-64 bg-slate-200/50 rounded-full blur-2xl -z-10" />
    </div>
  );
}
