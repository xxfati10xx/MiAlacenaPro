// Modular React Component Reference for MiAlacena Pro
const { useState, useEffect, useMemo, useRef, Fragment } = React;

const CATEGORIES = [
    { id: 'General', icon: 'Package', color: 'text-slate-500', bg: 'bg-slate-100' },
    { id: 'Lácteos', icon: 'Milk', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Carnes', icon: 'Beef', color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'Frutas', icon: 'Apple', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Despensa', icon: 'Store', color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'Bebidas', icon: 'GlassWater', color: 'text-indigo-500', bg: 'bg-indigo-50' }
];

const TRANSLATIONS = {
    es: { title: 'MiAlacena Pro', pantry: 'Alacena', add: 'Añadir', cart: 'Carrito', profile: 'Ajustes', stats: 'Estadísticas', search: 'Buscar...', empty: 'Vacío', save: 'Guardar', delete: 'Eliminar', edit: 'Detalle', language: 'Idioma', currency: 'Divisa', export: 'Exportar', import: 'Importar', deleteAll: 'Borrar Todo', greeting: 'Hola', statsStock: 'Estado Stock', lowItems: 'Bajos', expiry: 'Vencen', health: 'Salud Despensa', share: 'Compartir Lista' },
    en: { title: 'MyPantry Pro', pantry: 'Pantry', add: 'Add', cart: 'Cart', profile: 'Profile', stats: 'Stats', search: 'Search...', empty: 'Empty', save: 'Save', delete: 'Delete', edit: 'Detail', language: 'Language', currency: 'Currency', export: 'Export', import: 'Import', deleteAll: 'Clear All', greeting: 'Hello', statsStock: 'Stock Status', lowItems: 'Low', expiry: 'Expiry', health: 'Pantry Health', share: 'Share List' }
};

const Icon = ({ name, size = 20, className = "" }) => {
    const iconRef = useRef(null);
    useEffect(() => { if (iconRef.current && lucide[name]) lucide.createIcons({ targets: [iconRef.current], icons: { [name]: lucide[name] } }); }, [name]);
    return <i ref={iconRef} data-lucide={name} style={{ width: size, height: size }} className={`inline-block ${className}`}></i>;
};

const Toast = ({ msg, type = 'success' }) => (
    <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-2xl shadow-2xl animate-pop flex items-center gap-3 font-bold text-sm text-white ${type === 'error' ? 'bg-danger' : 'bg-brand'}`}>
        <Icon name={type === 'error' ? 'AlertCircle' : 'CheckCircle'} size={18} /> {msg}
    </div>
);

function App() {
    const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('mialacena_db') || '[]'));
    const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('mialacena_profile') || '{"name":"User","avatar":""}'));
    const [lang, setLang] = useState(() => localStorage.getItem('mialacena_lang') || 'es');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('mialacena_dark') === 'true');
    const [currency, setCurrency] = useState(() => localStorage.getItem('mialacena_currency') || '$');
    const [activeTab, setActiveTab] = useState('pantry');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);
    const [toast, setToast] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceStep, setVoiceStep] = useState(null);
    const [showQR, setShowQR] = useState(false);

    const t = TRANSLATIONS[lang] || TRANSLATIONS.es;

    useEffect(() => { localStorage.setItem('mialacena_db', JSON.stringify(products)); }, [products]);
    useEffect(() => { localStorage.setItem('mialacena_profile', JSON.stringify(profile)); }, [profile]);
    useEffect(() => { localStorage.setItem('mialacena_lang', lang); }, [lang]);
    useEffect(() => { localStorage.setItem('mialacena_currency', currency); }, [currency]);
    useEffect(() => { localStorage.setItem('mialacena_dark', darkMode); document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const stats = useMemo(() => {
        const totalVal = products.reduce((acc, p) => acc + (p.stock * (p.price || 0)), 0);
        const low = products.filter(p => p.stock <= (p.min || 1)).length;
        const expiring = products.filter(p => p.expiry && (new Date(p.expiry) - new Date()) < 259200000).length;
        return { totalVal, low, expiring };
    }, [products]);

    const addProduct = (p) => { setProducts([...products, { id: Date.now().toString(), createdAt: new Date().toISOString(), ...p }]); showToast(lang === 'es' ? "Añadido" : "Added"); setActiveTab('pantry'); };
    
    const shareList = () => {
        const list = products.filter(p => p.stock <= (p.min || 1)).map(p => `- ${p.name} (${p.stock}/${p.min})`).join('\n');
        if (navigator.share) navigator.share({ title: t.cart, text: list }); else alert(list);
    };

    const speak = (text, onEnd) => { const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'es' ? 'es-ES' : 'en-US'; if (onEnd) u.onend = onEnd; window.speechSynthesis.speak(u); };
    
    const startVoice = (msg = null, isForm = false) => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) return showToast("No mic", "error");
        const rec = new SpeechRec(); rec.lang = lang === 'es' ? 'es-ES' : 'en-US';
        rec.onstart = () => setIsListening(true); rec.onend = () => setIsListening(false);
        rec.onresult = (e) => {
            const cmd = e.results[0][0].transcript.toLowerCase();
            if (['cancelar', 'stop', 'parar'].includes(cmd)) { setVoiceStep(null); speak("Ok"); return; }
            if (isForm) {
                if (voiceStep === 'name') { document.getElementById('pName').value = cmd; setVoiceStep('stock'); startVoice(lang === 'es' ? "¿Cuántos?" : "How many?", true); }
                else if (voiceStep === 'stock') { document.getElementById('pStock').value = parseInt(cmd)||1; setVoiceStep(null); speak("Listo"); }
                else { setVoiceStep('name'); startVoice(lang === 'es' ? "¿Qué producto?" : "Which product?", true); }
            }
        };
        if (msg) speak(msg, () => rec.start()); else rec.start();
    };

    const PantryView = () => (
        <div className="flex flex-col gap-6 animate-pop">
            <div className="relative"><Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" /><input type="text" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 glass rounded-3xl outline-none focus:ring-4 ring-brand/10 font-medium" /></div>
            <div className="grid gap-3">
                {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                    <div key={p.id} onClick={() => setEditing(p)} className="glass p-4 rounded-4xl flex items-center gap-4 transition-all hover:bg-brand/5 cursor-pointer">
                        <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-xl ${CATEGORIES.find(c => c.id === p.category)?.bg || 'bg-slate-100'} ${CATEGORIES.find(c => c.id === p.category)?.color || 'text-slate-400'}`}><Icon name={CATEGORIES.find(c => c.id === p.category)?.icon || 'Package'} /></div>
                        <div className="flex-1 min-w-0"><h3 className="font-bold truncate">{p.name}</h3><p className="text-xs text-slate-400 font-bold uppercase">{p.stock} Units</p>
                            <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${p.stock <= p.min ? 'bg-danger' : 'bg-brand'}`} style={{ width: `${Math.min(100, (p.stock/(p.min*2||1))*100)}%` }}></div></div>
                        </div>
                        <Icon name="ChevronRight" className="text-slate-200" />
                    </div>
                ))}
            </div>
        </div>
    );

    const StatsView = () => {
        const canvasRef = useRef(null);
        useEffect(() => { if(canvasRef.current) { new Chart(canvasRef.current, { type: 'doughnut', data: { labels: CATEGORIES.map(c => c.id), datasets: [{ data: CATEGORIES.map(c => products.filter(p => p.category === c.id).length), backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#6366f1', '#ec4899'], borderWidth: 0 }] }, options: { cutout: '80%', plugins: { legend: { display: false } } } }); } }, []);
        return (
            <div className="flex flex-col gap-6 animate-pop">
                <div className="glass p-8 rounded-4xl flex items-center justify-between">
                    <div><h2 className="text-3xl font-black text-brand tracking-tighter">{products.length}</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Items</p></div>
                    <div style={{width:'160px', height:'160px'}}><canvas ref={canvasRef}></canvas></div>
                </div>
            </div>
        );
    };

    const AddView = () => {
        const [selCat, setSelCat] = useState('General');
        return (
            <div className="glass p-8 rounded-4xl flex flex-col gap-5 animate-pop">
                <h2 className="text-2xl font-black tracking-tight">{t.add}</h2>
                <input id="pName" placeholder="Nombre" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl outline-none" />
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{CATEGORIES.map(c => <button key={c.id} onClick={() => setSelCat(c.id)} className={`flex-1 min-w-[70px] p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${selCat === c.id ? 'bg-brand text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}><Icon name={c.icon} size={16} /><span className="text-[9px] font-bold">{c.id}</span></button>)}</div>
                <button onClick={() => { const n = document.getElementById('pName').value; if(n) addProduct({ name: n, stock: 1, min: 1, category: selCat }); }} className="mt-4 p-5 bg-brand text-white rounded-3xl font-black">{t.save}</button>
            </div>
        );
    };

    return (
        <div className="max-w-xl mx-auto min-h-screen px-6 pt-10 pb-32">
            {toast && <Toast msg={toast.message} type={toast.type} />}
            <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-3xl bg-brand flex items-center justify-center text-white shadow-xl shadow-emerald-200"><Icon name="Zap" size={28} /></div>
                <div><h1 className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white leading-none uppercase">Alacena<span className="text-brand"> Pro</span></h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Smart Inventory</p></div></div>
            </header>
            {activeTab === 'pantry' && <PantryView />}
            {activeTab === 'add' && <AddView />}
            {activeTab === 'stats' && <StatsView />}
            {activeTab === 'cart' && (
                <div className="animate-pop">
                    <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black">{t.cart}</h2><button onClick={shareList} className="bg-brand text-white px-5 py-2 rounded-2xl text-xs font-black shadow-lg">SHARE 📤</button></div>
                </div>
            )}
            {activeTab === 'profile' && (
                <div className="flex flex-col gap-6 animate-pop">
                    <div className="glass p-10 rounded-4xl flex flex-col items-center text-center gap-4 relative">
                        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 overflow-hidden">{profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <Icon name="User" size={48} />}</div>
                        <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="text-xl font-black bg-transparent text-center border-b border-transparent focus:border-brand outline-none" />
                    </div>
                </div>
            )}
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] glass rounded-4xl p-3 flex justify-around shadow-2xl z-50 border-white/20">
                {[ { id: 'pantry', icon: 'LayoutGrid' }, { id: 'stats', icon: 'BarChart3' }, { id: 'add', icon: 'PlusCircle' }, { id: 'cart', icon: 'ShoppingCart' }, { id: 'profile', icon: 'Settings' } ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-3 transition-all duration-300 flex items-center justify-center rounded-2xl ${activeTab === tab.id ? 'bg-brand text-white shadow-xl shadow-emerald-200 -translate-y-2 scale-110' : 'text-slate-300 hover:text-slate-50'}`}><Icon name={tab.icon} size={24} /></button>
                ))}
            </nav>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
