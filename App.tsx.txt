
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Volume2, 
  History, 
  Info, 
  BookOpen, 
  Loader2, 
  Sparkles, 
  Copy, 
  Check, 
  ShieldCheck,
  Star,
  Award
} from 'lucide-react';
import { getWordDetails, generateAudio, decodeAudioData } from './services/geminiService';
import { WordDetails, SearchHistoryItem } from './types';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [result, setResult] = useState<WordDetails | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveToHistory = (word: string) => {
    const newHistory = [
      { word, timestamp: Date.now() },
      ...history.filter(h => h.word !== word).slice(0, 5)
    ];
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleSearch = async (e?: React.FormEvent, wordOverride?: string) => {
    if (e) e.preventDefault();
    const word = wordOverride || searchTerm.trim();
    if (!word) return;

    setLoading(true);
    setError(null);
    setCopied(null);
    try {
      const details = await getWordDetails(word);
      setResult(details);
      saveToHistory(word);
      if (!wordOverride) setSearchTerm('');
    } catch (err) {
      setError('দুঃখিত, তথ্যটি পাওয়া যায়নি। সঠিক বানান লিখুন।');
    } finally {
      setLoading(false);
    }
  };

  const playPronunciation = async () => {
    if (!result || audioLoading) return;
    setAudioLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioBufferData = await generateAudio(result.word, result.pronunciationNotation);
      const audioBuffer = await decodeAudioData(new Uint8Array(audioBufferData), audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (err) {
      setError('অডিও প্লে করতে সমস্যা হয়েছে।');
    } finally {
      setAudioLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-6 px-4 sm:py-12 sm:px-8 selection:bg-indigo-100 selection:text-indigo-900 relative">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10"></div>

      <header className="w-full max-w-4xl mb-10 text-center flex flex-col items-center">
        <div className="mb-6 flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <Award className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">
            Dev: <span className="text-indigo-600">Masudujjaman Shanto</span>
          </span>
        </div>

        <div className="bg-slate-900 p-4 rounded-3xl shadow-xl ring-8 ring-white mb-6">
          <BookOpen className="text-white w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 bn-font tracking-tight mb-4">শুদ্ধ উচ্চারণ</h1>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-6">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider bn-font">১০০% বাংলা একাডেমি মানদণ্ড</span>
        </div>
      </header>

      <main className="w-full max-w-2xl space-y-10">
        {/* Responsive Search Box */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-[2rem] sm:rounded-full shadow-lg border border-slate-100">
          <div className="flex-1 flex items-center px-4">
            <Search className="w-5 h-5 text-slate-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="যেকোনো বাংলা শব্দ..."
              className="w-full py-3 sm:py-4 px-3 text-lg bg-transparent outline-none bn-font text-slate-800 placeholder-slate-300 font-bold"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] sm:rounded-full font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:bg-slate-200 bn-font"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'সার্চ'}
          </button>
        </form>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-2xl flex items-center gap-3 bn-font animate-in fade-in">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        {/* Improved Result Card for Mobile */}
        {result && !loading && (
          <article className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-12 shadow-xl border border-slate-50 animate-in zoom-in-95 duration-500 relative">
            <div className="absolute top-6 right-6 sm:top-10 sm:right-10">
              <button 
                onClick={playPronunciation}
                disabled={audioLoading}
                className={`p-6 sm:p-8 rounded-full transition-all active:scale-90 ${audioLoading ? 'bg-slate-50' : 'bg-slate-900 hover:bg-indigo-600 shadow-xl'}`}
              >
                {audioLoading ? (
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-slate-300" />
                ) : (
                  <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                )}
              </button>
            </div>

            <div className="space-y-10">
              <header className="pr-20 sm:pr-28">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase mb-4">{result.partsOfSpeech}</span>
                <h2 className="text-4xl sm:text-7xl font-black text-slate-900 bn-font mb-8 break-words leading-tight">{result.word}</h2>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <span className="block text-[9px] text-slate-400 uppercase font-black tracking-widest mb-2 bn-font">প্রমিত উচ্চারণ লিপি</span>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl sm:text-3xl text-slate-900 font-bold bn-font">[{result.pronunciationNotation}]</span>
                      <button onClick={() => copyToClipboard(result.pronunciationNotation, 'nt')} className="text-slate-300 hover:text-indigo-500">
                        {copied === 'nt' ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <span className="block text-[9px] text-slate-400 uppercase font-black tracking-widest mb-2 bn-font">IPA লিপ্যন্তর</span>
                    <div className="flex items-center justify-between">
                      <span className="text-lg sm:text-xl text-indigo-500 font-mono italic">/{result.ipa}/</span>
                      <button onClick={() => copyToClipboard(result.ipa, 'ip')} className="text-slate-300 hover:text-indigo-500">
                        {copied === 'ip' ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              <div className="space-y-8">
                <section>
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 bn-font">অর্থ</h3>
                  <p className="text-xl sm:text-2xl text-slate-800 bn-font font-bold leading-relaxed">{result.meaning}</p>
                </section>

                <section>
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 bn-font">উদাহরণ</h3>
                  <div className="space-y-3">
                    {result.examples.map((ex, idx) => (
                      <div key={idx} className="p-4 sm:p-6 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 bn-font text-lg text-slate-600 leading-relaxed italic">
                        {ex}
                      </div>
                    ))}
                  </div>
                </section>

                {result.rulesApplied && (
                  <section className="pt-8 border-t border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 bn-font flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> একাডেমি উচ্চারণের সূত্র
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.rulesApplied.map((rule, idx) => (
                        <div key={idx} className="bg-white px-4 py-2 rounded-xl text-[12px] font-bold bn-font border border-slate-100 text-slate-700">
                          {rule}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </article>
        )}

        {/* History Tokens */}
        {!loading && history.length > 0 && (
          <section className="space-y-4 px-2">
            <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] bn-font flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> রিসেন্ট সার্চ
            </h3>
            <div className="flex flex-wrap gap-2">
              {history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(undefined, item.word)}
                  className="bg-white border border-slate-200 text-slate-500 px-5 py-2.5 rounded-2xl hover:bg-slate-900 hover:text-white transition-all text-sm font-bold bn-font"
                >
                  {item.word}
                </button>
              ))}
            </div>
          </section>
        )}

        {!result && !loading && (
          <div className="text-center py-20 px-6 bg-white rounded-[3rem] shadow-sm border border-slate-100">
             <div className="bg-slate-900 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
                <Sparkles className="w-10 h-10 text-white" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 mb-3 bn-font">শুদ্ধ চর্চা শুরু করুন</h2>
             <p className="text-slate-400 bn-font text-sm mb-8">বাংলা একাডেমির প্রমিত ব্যাকরণ অনুযায়ী সঠিক উচ্চারণ ও অর্থ জানুন।</p>
             <div className="flex flex-wrap justify-center gap-2">
               {['ঐতিহ্য', 'অধ্যক্ষ', 'বিস্ময়', 'নৈসর্গিক'].map(w => (
                 <button key={w} onClick={() => handleSearch(undefined, w)} className="bg-slate-50 px-6 py-3 rounded-2xl text-slate-800 font-black bn-font border border-slate-100 hover:bg-slate-900 hover:text-white transition-all">
                   {w}
                 </button>
               ))}
             </div>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-20 pb-10 w-full text-center">
         <div className="max-w-xs mx-auto mb-6 h-px bg-slate-200"></div>
         <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Developed By</p>
         <div className="inline-block bg-white px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm">
           <p className="text-slate-900 font-black bn-font text-lg">মাসুদুজ্জামান শান্ত</p>
           <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Masudujjaman Shanto</p>
         </div>
         <p className="mt-8 text-[10px] text-slate-300 font-bold bn-font">© {new Date().getFullYear()} সকল স্বত্ব সংরক্ষিত</p>
      </footer>
    </div>
  );
};

export default App;
