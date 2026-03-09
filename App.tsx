/* global React, ReactDOM, lucide, Chart, QRCode, mobilenet, firebase, Tesseract, Html5QrcodeScanner */
const { useState, useEffect, useMemo, useRef, Fragment } = React;

// --- IndexedDB Helper ---
const DB = {
    dbName: 'MiAlacenaDB',
    version: 1,
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },
    async getAll(storeName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    async save(storeName, item) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    async delete(storeName, id) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    async clear(storeName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};

const CATEGORIES = [
    { id: 'General', icon: 'Package', color: 'text-slate-500', bg: 'bg-slate-100' },
    { id: 'Lácteos', icon: 'Milk', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Carnes', icon: 'Beef', color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'Frutas', icon: 'Apple', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Despensa', icon: 'Store', color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'Bebidas', icon: 'GlassWater', color: 'text-indigo-500', bg: 'bg-indigo-50' }
];

const UNITS = ['uds', 'kg', 'g', 'l', 'ml', 'oz', 'lb'];

const TRANSLATIONS = {
    es: { title: 'MiAlacena Pro', pantry: 'Alacena', add: 'Añadir', cart: 'Carrito', profile: 'Ajustes', stats: 'Análisis', search: 'Buscar...', empty: 'Vacío', save: 'Guardar', delete: 'Eliminar', edit: 'Detalle', language: 'Idioma', currency: 'Divisa', export: 'Exportar', import: 'Importar', deleteAll: 'Borrar Todo', greeting: 'Hola', statsStock: 'Estado Stock', lowItems: 'Bajos', expiry: 'Vencen', health: 'Salud Despensa', share: 'Compartir Lista', login: 'Entrar con Google', logout: 'Cerrar Sesión', photo: 'Foto', units: 'Unidades', unit: 'Unidad' },
    en: { title: 'MyPantry Pro', pantry: 'Pantry', add: 'Add', cart: 'Cart', profile: 'Profile', stats: 'Stats', search: 'Search...', empty: 'Empty', save: 'Save', delete: 'Delete', edit: 'Detail', language: 'Language', currency: 'Currency', export: 'Export', import: 'Import', deleteAll: 'Clear All', greeting: 'Hello', statsStock: 'Stock Status', lowItems: 'Low', expiry: 'Expiry', health: 'Pantry Health', share: 'Share List', login: 'Login with Google', logout: 'Logout', photo: 'Photo', units: 'Units', unit: 'Unit' },
    pt: { title: 'MinhaDespensa Pro', pantry: 'Despensa', add: 'Adicionar', cart: 'Carrinho', profile: 'Perfil', stats: 'Estatísticas', search: 'Buscar...', empty: 'Vazio', save: 'Salvar', delete: 'Excluir', edit: 'Detalhes', language: 'Idioma', currency: 'Moeda', export: 'Exportar', import: 'Importar', deleteAll: 'Limpar Tudo', greeting: 'Olá', statsStock: 'Status do Estoque', lowItems: 'Baixos', expiry: 'Vencendo', health: 'Saúde da Despensa', share: 'Compartilhar Lista', login: 'Entrar con Google', logout: 'Sair', photo: 'Foto', units: 'Unidades', unit: 'Unidade' },
    it: { title: 'MiaDispensa Pro', pantry: 'Dispensa', add: 'Aggiungi', cart: 'Carrello', profile: 'Profilo', stats: 'Statistiche', search: 'Cerca...', empty: 'Vuoto', save: 'Salva', delete: 'Elimina', edit: 'Dettagli', language: 'Lingua', currency: 'Valuta', export: 'Esporta', import: 'Importa', deleteAll: 'Cancella Tutto', greeting: 'Ciao', statsStock: 'Stato Scorte', lowItems: 'Bassi', expiry: 'Scadenza', health: 'Salute Dispensa', share: 'Condividi Lista', login: 'Accedi con Google', logout: 'Esci', photo: 'Foto', units: 'Unità', unit: 'Unità' },
    fr: { title: 'MonGardeManger Pro', pantry: 'Garde-Manger', add: 'Ajouter', cart: 'Panier', profile: 'Profil', stats: 'Stats', search: 'Rechercher...', empty: 'Vide', save: 'Enregistrer', delete: 'Supprimer', edit: 'Détails', language: 'Langue', currency: 'Devise', export: 'Exporter', import: 'Importer', deleteAll: 'Tout Effacer', greeting: 'Bonjour', statsStock: 'État du Stock', lowItems: 'Bas', expiry: 'Expiration', health: 'Santé Cellier', share: 'Partager Liste', login: 'Connexion Google', logout: 'Déconnexion', photo: 'Photo', units: 'Unités', unit: 'Unité' },
    de: { title: 'MeineVorratskammer Pro', pantry: 'Vorratskammer', add: 'Hinzufügen', cart: 'Warenkorb', profile: 'Profil', stats: 'Statistik', search: 'Suchen...', empty: 'Leer', save: 'Speichern', delete: 'Löschen', edit: 'Details', language: 'Sprache', currency: 'Währung', export: 'Exportieren', import: 'Importieren', deleteAll: 'Alles Löschen', greeting: 'Hallo', statsStock: 'Lagerbestand', lowItems: 'Niedrig', expiry: 'Ablauf', health: 'Vorratsstatus', share: 'Liste Teilen', login: 'Google Login', logout: 'Abmelden', photo: 'Foto', units: 'Einheiten', unit: 'Einheit' },
    zh: { title: '我的橱柜 Pro', pantry: '橱柜', add: '添加', cart: '购物车', profile: '个人资料', stats: '统计', search: '搜索...', empty: '空', save: '保存', delete: '删除', edit: '详情', language: '语言', currency: '货币', export: '导出', import: '导入', deleteAll: '清空所有', greeting: '你好', statsStock: '库存状态', lowItems: '低库存', expiry: '到期', health: '橱柜健康', share: '分享列表', login: '谷歌登录', logout: '登出', photo: '照片', units: '单位', unit: '单位' },
    ja: { title: 'マイパントリー Pro', pantry: 'パントリー', add: '追加', cart: 'カート', profile: 'プロフィール', stats: '統計', search: '検索...', empty: '空', save: '保存', delete: '削除', edit: '詳細', language: '言語', currency: '通貨', export: 'エクスポート', import: 'インポート', deleteAll: 'すべて削除', greeting: 'こんにちは', statsStock: '在庫状況', lowItems: '不足', expiry: '期限', health: 'パントリーの健康', share: 'リストを共有', login: 'Googleでログイン', logout: 'ログアウト', photo: '写真', units: '個', unit: '単位' },
    ru: { title: 'МояКладовая Pro', pantry: 'Кладовая', add: 'Добавить', cart: 'Корзина', profile: 'Профиль', stats: 'Статистика', search: 'Поиск...', empty: 'Пусто', save: 'Сохранить', delete: 'Удалить', edit: 'Детали', language: 'Язык', currency: 'Валюта', export: 'Экспорт', import: 'Импорт', deleteAll: 'Очистить все', greeting: 'Привет', statsStock: 'Статус запасов', lowItems: 'Мало', expiry: 'Срок годности', health: 'Состояние кладовой', share: 'Поделиться списком', login: 'Вход через Google', logout: 'Выйти', photo: 'Фото', units: 'Штук', unit: 'Шт' },
    ar: { title: 'مخزني برو', pantry: 'المخزن', add: 'إضافة', cart: 'السلة', profile: 'الملف الشخصي', stats: 'الإحصائيات', search: 'بحث...', empty: 'فارغ', save: 'حفظ', delete: 'حذف', edit: 'تفاصيل', language: 'اللغة', currency: 'العملة', export: 'تصدير', import: 'استيراد', deleteAll: 'مسح الكل', greeting: 'مرحباً', statsStock: 'حالة المخزون', lowItems: 'منخفض', expiry: 'انتهاء الصلاحية', health: 'صحة المخزن', share: 'مشاركة القائمة', login: 'الدخول بجوجل', logout: 'خروج', photo: 'صورة', units: 'وحدات', unit: 'وحدة' }
};

const Icon = ({ name, size = 20, className = "" }) => {
    const iconRef = useRef(null);
    useEffect(() => { if (iconRef.current && lucide[name]) lucide.createIcons({ targets: [iconRef.current], icons: { [name]: lucide[name] } }); }, [name]);
    return <i ref={iconRef} data-lucide={name} style={{ width: size, height: size }} className={`inline-block ${className}`}></i>;
};

const Toast = ({ msg, type = 'success' }) => {
    if (!msg) return null;
    return (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-2xl shadow-2xl animate-pop flex items-center gap-3 font-bold text-sm text-white ${type === 'error' ? 'bg-danger' : 'bg-brand'}`}>
            <Icon name={type === 'error' ? 'AlertCircle' : 'CheckCircle'} size={18} /> {msg}
        </div>
    );
};

// --- Sub-Components ---

const PantryView = ({ products, search, setSearch, setEditing, t }) => (
    <div className="flex flex-col gap-6 animate-pop">
        <div className="relative"><Icon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" /><input type="text" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 glass rounded-3xl outline-none focus:ring-4 ring-brand/10 font-medium" /></div>
        <div className="grid gap-3">
            {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id} onClick={() => setEditing(p)} className="glass p-4 rounded-4xl flex items-center gap-4 transition-all hover:bg-brand/5 cursor-pointer group">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-xl overflow-hidden ${CATEGORIES.find(c => c.id === p.category)?.bg || 'bg-slate-100'} ${CATEGORIES.find(c => c.id === p.category)?.color || 'text-slate-400'}`}>
                        {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Icon name={CATEGORIES.find(c => c.id === p.category)?.icon || 'Package'} />}
                    </div>
                    <div className="flex-1 min-w-0"><h3 className="font-bold truncate text-slate-700 dark:text-slate-200">{p.name}</h3><p className="text-[10px] text-slate-400 font-bold uppercase">{p.stock} {p.unit || 'uds'}</p>
                        <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${p.stock <= p.min ? 'bg-danger' : 'bg-brand'}`} style={{ width: `${Math.min(100, (p.stock/(p.min*2||1))*100)}%` }}></div></div>
                    </div>
                    <Icon name="ChevronRight" className="text-slate-200 group-hover:text-brand transition-colors" />
                </div>
            ))}
            {products.length === 0 && <div className="py-20 text-center text-slate-300 font-bold"><Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-20" />{t.empty}</div>}
        </div>
    </div>
);

const StatsView = ({ products, stats, currency, t }) => {
    const canvasRef = useRef(null);
    useEffect(() => { if(canvasRef.current && products.length > 0) {
        const ctx = canvasRef.current.getContext('2d');
        new Chart(ctx, { type: 'doughnut', data: { labels: CATEGORIES.map(c => c.id), datasets: [{ data: CATEGORIES.map(c => products.filter(p => p.category === c.id).length), backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#6366f1', '#ec4899'], borderWidth: 0, hoverOffset: 4 }] }, options: { cutout: '80%', plugins: { legend: { display: false } } } });
    } }, [products]);
    return (
        <div className="flex flex-col gap-6 animate-pop">
            <div className="glass p-8 rounded-5xl flex items-center justify-between shadow-sm">
                <div><h2 className="text-4xl font-black text-brand tracking-tighter">{products.length}</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.statsStock}</p>
                    <div className="mt-4 flex flex-col gap-1.5">
                        {stats.low > 0 && <p className="text-[10px] font-black text-danger uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span> {stats.low} {t.lowItems}</p>}
                        {stats.expiring > 0 && <p className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> {stats.expiring} {t.expiry}</p>}
                    </div>
                </div>
                <div className="chart-container"><canvas ref={canvasRef}></canvas></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="glass p-6 rounded-4xl text-center"><div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3"><Icon name="Wallet" /></div><h4 className="text-xl font-black">{currency}{stats.totalVal.toLocaleString()}</h4><p className="text-[10px] font-bold text-slate-400 uppercase">Valor Total</p></div>
                <div className="glass p-6 rounded-4xl text-center"><div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3"><Icon name="Zap" /></div><h4 className="text-xl font-black">{stats.health}%</h4><p className="text-[10px] font-bold text-slate-400 uppercase">{t.health}</p></div>
            </div>
        </div>
    );
};

// State for AI singletons
let aiModel = null;

const AddView = ({ addProduct, startVoice, runAIScan, runOCRScan, isListening, t }) => {
    const [form, setForm] = useState({ name: '', stock: 1, min: 2, price: 0, expiry: '', category: 'General', unit: 'uds' });
    const [image, setImage] = useState(null);

    const handleAdd = () => {
        if(form.name) {
            addProduct({ ...form, image });
            setForm({ name: '', stock: 1, min: 2, price: 0, expiry: '', category: 'General', unit: 'uds' });
            setImage(null);
        }
    };

    const takePhoto = () => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
        input.onchange = (e) => {
            const file = e.target.files[0]; if(!file) return;
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result);
            reader.readAsDataURL(file);
        };
        input.click();
    };

    return (
        <div className="flex flex-col gap-8 animate-pop">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrada Rápida</label>
                    <div className="flex gap-2">
                        <button onClick={() => runAIScan((name) => setForm({...form, name}))} className="text-brand hover:text-emerald-600 transition-colors"><Icon name="Eye" size={16} /></button>
                        <button onClick={() => runOCRScan((name) => setForm({...form, name}))} className="text-secondary hover:text-blue-600 transition-colors"><Icon name="Receipt" size={16} /></button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={takePhoto} className={`h-32 rounded-4xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${image ? 'bg-brand/5 border-brand text-brand shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${image ? 'bg-brand text-white' : 'bg-emerald-50 text-brand'}`}><Icon name="Camera" /></div>
                        <span className="text-[11px] font-bold">{t.photo}</span>
                    </button>
                    <button onClick={() => startVoice((key, val) => setForm(f => ({...f, [key]: val})), true)} className={`h-32 rounded-4xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${isListening ? 'bg-danger/5 border-danger text-danger animate-pulse' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isListening ? 'bg-danger text-white' : 'bg-emerald-50 text-brand'}`}><Icon name="Mic" /></div>
                        <span className="text-[11px] font-bold">Dictar voz</span>
                    </button>
                </div>
            </div>

            <div className="glass p-8 rounded-5xl flex flex-col gap-6 shadow-sm border-white">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest -mt-2">Información Detallada</label>

                <div className="space-y-4">
                    <div><label className="text-[10px] font-black text-slate-600 uppercase ml-2 mb-2 block">Nombre del Producto</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej. Leche de Almendras" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl outline-none focus:ring-4 ring-brand/10 font-medium transition-all" /></div>

                    <div>
                        <label className="text-[10px] font-black text-slate-600 uppercase ml-2 mb-2 block">Categoría</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{CATEGORIES.map(c => <button key={c.id} onClick={() => setForm({...form, category: c.id})} className={`flex-1 min-w-[85px] p-4 rounded-3xl flex flex-col items-center gap-2 transition-all ${form.category === c.id ? 'bg-emerald-50 border-2 border-brand text-brand' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:bg-slate-100 border-2 border-transparent'}`}><Icon name={c.icon} size={20} /><span className="text-[10px] font-bold">{c.id}</span></button>)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-600 uppercase ml-2 mb-2 block">Stock</label>
                            <div className="flex gap-1">
                                <input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl outline-none font-medium" />
                                <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="p-2 bg-slate-100 rounded-2xl text-[10px] font-bold uppercase">
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                        <div><label className="text-[10px] font-black text-slate-600 uppercase ml-2 mb-2 block">Mínimo (Alerta)</label><input type="number" value={form.min} onChange={e => setForm({...form, min: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl outline-none font-medium" /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black text-slate-600 uppercase ml-2 mb-2 block">Precio ({window.currencySymbol || '$'})</label><input type="number" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)||0})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl outline-none font-medium" /></div>
                        <div><label className="text-[10px] font-black text-slate-600 uppercase ml-2 mb-2 block">Vencimiento</label><input type="date" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl outline-none font-medium text-xs" /></div>
                    </div>
                </div>

                <button onClick={handleAdd} className="mt-4 p-5 bg-brand text-white rounded-4xl font-black shadow-2xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-3"><Icon name="Save" /> {t.save}</button>
            </div>
        </div>
    );
};

function App() {
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('mialacena_profile') || '{"name":"Invitado","avatar":""}'));
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
    window.currencySymbol = currency;

    useEffect(() => { DB.getAll('products').then(data => setProducts(data || [])); }, []);

    useEffect(() => {
        if (window.__firebase_config) {
            firebase.initializeApp(window.__firebase_config);
            firebase.auth().onAuthStateChanged(u => { if(u) { setUser(u); setProfile({ name: u.displayName, avatar: u.photoURL }); } else { setUser(null); } });
        }
    }, []);

    const login = () => {
        if(!window.__firebase_config) return showToast("Google Auth no configurado", "error");
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).catch(e => showToast(e.message, 'error'));
    };

    const logout = () => firebase.auth().signOut().then(() => showToast("Sesión cerrada"));

    useEffect(() => { localStorage.setItem('mialacena_profile', JSON.stringify(profile)); }, [profile]);
    useEffect(() => { localStorage.setItem('mialacena_lang', lang); }, [lang]);
    useEffect(() => { localStorage.setItem('mialacena_currency', currency); }, [currency]);
    useEffect(() => { localStorage.setItem('mialacena_dark', darkMode); document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const stats = useMemo(() => {
        const totalVal = products.reduce((acc, p) => acc + (p.stock * (p.price || 0)), 0);
        const lowItems = products.filter(p => p.stock <= (p.min || 1));
        const low = lowItems.length;
        const expiring = products.filter(p => p.expiry && (new Date(p.expiry) - new Date()) < 259200000).length;
        const health = products.length > 0 ? Math.round(((products.length - low) / products.length) * 100) : 100;
        return { totalVal, low, expiring, health };
    }, [products]);

    const addProduct = async (p) => {
        const newProduct = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...p };
        await DB.save('products', newProduct);
        setProducts([...products, newProduct]);
        showToast(lang === 'es' ? "Producto añadido" : "Product added");
        setActiveTab('pantry');
    };

    const updateProduct = async (p) => {
        await DB.save('products', p);
        setProducts(products.map(item => item.id === p.id ? p : item));
        setEditing(null);
        showToast("Actualizado");
    };

    const deleteProduct = async (id) => {
        await DB.delete('products', id);
        setProducts(products.filter(p => p.id !== id));
        setEditing(null);
        showToast("Eliminado", "error");
    };

    const shareList = () => {
        const list = products.filter(p => p.stock <= (p.min || 1)).map(p => `- ${p.name} (${p.stock}/${p.min})`).join('\n');
        if (navigator.share) navigator.share({ title: t.cart, text: list }); else alert(list);
    };

    const runAIScan = async (onDone) => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
        input.onchange = async (e) => {
            const file = e.target.files[0]; if (!file) return;
            showToast(lang === 'es' ? "Analizando..." : "Analyzing...");
            const img = document.createElement('img'); img.src = URL.createObjectURL(file);
            img.onload = async () => {
                try {
                    if(!aiModel) aiModel = await mobilenet.load();
                    const preds = await aiModel.classify(img);
                    if (preds.length > 0) {
                        const name = preds[0].className.split(',')[0];
                        onDone(name);
                        showToast(lang === 'es' ? "Reconocido!" : "Recognized!");
                    }
                }
                catch (err) { showToast("Error IA", "error"); }
            };
        };
        input.click();
    };

    const runOCRScan = async (onDone) => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
        input.onchange = async (e) => {
            const file = e.target.files[0]; if (!file) return;
            showToast(lang === 'es' ? "Leyendo ticket..." : "Reading receipt...");
            try {
                const result = await Tesseract.recognize(file, 'spa+eng');
                const text = result.data.text;
                const lines = text.split('\n').filter(l => l.length > 3 && /\d/.test(l));
                if(lines.length > 0) {
                    const first = lines[0].replace(/[0-9.,$]/g, '').trim();
                    onDone(first);
                    showToast(lang === 'es' ? "Ticket leído" : "Receipt read");
                }
            } catch (err) { showToast("OCR Error", "error"); }
        };
        input.click();
    };

    const speak = (text, onEnd) => { const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'es' ? 'es-ES' : 'en-US'; if (onEnd) u.onend = onEnd; window.speechSynthesis.speak(u); };

    const startVoice = (onUpdate, isForm = false, step = null) => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) return showToast("Mic no soportado", "error");

        const currentStep = step || voiceStep;
        const rec = new SpeechRec();
        rec.lang = lang === 'es' ? 'es-ES' : 'en-US';

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onresult = (e) => {
            const cmd = e.results[0][0].transcript.toLowerCase();
            if (['cancelar', 'stop', 'parar', 'cancel'].includes(cmd)) { setVoiceStep(null); speak("Ok"); return; }

            if (isForm) {
                if (currentStep === 'name') {
                    onUpdate('name', cmd);
                    setVoiceStep('stock');
                    setTimeout(() => startVoice(onUpdate, true, 'stock'), 100);
                }
                else if (currentStep === 'stock') {
                    const val = parseInt(cmd.replace(/[^0-9]/g, '')) || 1;
                    onUpdate('stock', val);
                    setVoiceStep('min');
                    setTimeout(() => startVoice(onUpdate, true, 'min'), 100);
                }
                else if (currentStep === 'min') {
                    const val = parseInt(cmd.replace(/[^0-9]/g, '')) || 1;
                    onUpdate('min', val);
                    setVoiceStep(null);
                    speak(lang === 'es' ? "Producto listo" : "Product ready");
                }
                else {
                    setVoiceStep('name');
                    startVoice(onUpdate, true, 'name');
                }
            } else {
                const p = products.find(i => cmd.includes(i.name.toLowerCase()));
                if (p) speak(lang === 'es' ? `Tienes ${p.stock} de ${p.name}` : `You have ${p.stock} of ${p.name}`);
                else speak(lang === 'es' ? "No lo encuentro" : "Not found");
            }
        };

        if (currentStep === 'name') speak(lang === 'es' ? "¿Qué producto?" : "Which product?", () => rec.start());
        else if (currentStep === 'stock') speak(lang === 'es' ? "¿Cuántos?" : "How many?", () => rec.start());
        else if (currentStep === 'min') speak(lang === 'es' ? "¿Mínimo?" : "Minimum?", () => rec.start());
        else rec.start();
    };

    const QRModal = () => {
        const [scanning, setScanning] = useState(false);
        const scannerRef = useRef(null);
        useEffect(() => {
            if (scanning) {
                scannerRef.current = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
                scannerRef.current.render(async (decodedText) => {
                    try {
                        const imported = JSON.parse(decodedText);
                        if (Array.isArray(imported)) {
                            for (const p of imported) await DB.save('products', p);
                            setProducts(await DB.getAll('products'));
                            showToast("Sincronizado!"); setScanning(false); setShowQR(false);
                        }
                    } catch (e) { showToast("QR Inválido", "error"); }
                });
            }
            return () => { if (scannerRef.current) scannerRef.current.clear(); };
        }, [scanning]);
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-pop">
                <div className="glass p-10 rounded-5xl text-center max-w-sm w-full border-white/40 shadow-2xl overflow-hidden">
                    <div className="flex justify-center gap-4 mb-6">
                        <button onClick={() => setScanning(false)} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!scanning ? 'bg-brand text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>Generar</button>
                        <button onClick={() => setScanning(true)} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${scanning ? 'bg-brand text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>Escanear</button>
                    </div>
                    {!scanning ? ( <div className="animate-pop"><div id="qr-dest" className="bg-white p-6 rounded-4xl mx-auto mb-8 w-fit shadow-inner"></div><p className="text-[10px] text-slate-400 mb-6 font-medium">Muestra este código para que otro dispositivo lo escanee</p></div> ) : ( <div className="animate-pop"><div id="qr-reader" className="w-full rounded-3xl overflow-hidden bg-black mb-6"></div><p className="text-[10px] text-slate-400 mb-6 font-medium">Apunta la cámara al código del otro dispositivo</p></div> )}
                    <button onClick={() => setShowQR(false)} className="w-full p-4 bg-brand text-white rounded-3xl font-black shadow-lg shadow-emerald-200 transition-all active:scale-95">Cerrar</button>
                </div>
            </div>
        );
    };

    useEffect(() => { if(showQR) { const dest = document.getElementById('qr-dest'); if(dest) { dest.innerHTML = ''; new QRCode(dest, { text: JSON.stringify(products.slice(0,5)), width: 200, height: 200, colorDark : "#064e3b", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.L }); } } }, [showQR, products]);

    return (
        <div className="max-w-xl mx-auto min-h-screen px-6 pt-10 pb-32">
            {toast && <Toast {...toast} />}
            {showQR && <QRModal />}
            <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-3xl bg-brand flex items-center justify-center text-white shadow-2xl shadow-emerald-300 transition-transform active:scale-90"><Icon name="Zap" size={28} /></div><div><h1 className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white leading-none uppercase">Alacena<span className="text-brand"> Pro</span></h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Smarter Inventory</p></div></div>
                <div className="flex gap-2.5"><button onClick={() => setDarkMode(!darkMode)} className="w-11 h-11 glass rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand transition-colors"><Icon name={darkMode ? "Sun" : "Moon"} size={18} /></button><select value={lang} onChange={e => setLang(e.target.value)} className="w-11 h-11 glass rounded-2xl font-black text-[10px] text-slate-500 uppercase tracking-tight appearance-none text-center outline-none">{Object.keys(TRANSLATIONS).map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            </header>
            {activeTab === 'pantry' && <PantryView products={products} search={search} setSearch={setSearch} setEditing={setEditing} t={t} />}
            {activeTab === 'add' && <AddView addProduct={addProduct} startVoice={startVoice} runAIScan={runAIScan} runOCRScan={runOCRScan} isListening={isListening} t={t} />}
            {activeTab === 'stats' && <StatsView products={products} stats={stats} currency={currency} t={t} />}
            {activeTab === 'cart' && (
                <div className="animate-pop">
                    <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black tracking-tight">{t.cart}</h2><button onClick={shareList} className="bg-brand text-white px-6 py-2.5 rounded-2xl text-[10px] font-black shadow-xl shadow-emerald-200 flex items-center gap-2 uppercase tracking-wider active:scale-95 transition-all"><Icon name="Share2" size={14} /> {t.share}</button></div>
                    <div className="grid gap-3">
                        {products.filter(p => p.stock <= (p.min || 1)).map(p => (
                            <div key={p.id} className="glass p-5 rounded-4xl flex justify-between items-center animate-pop group border-l-4 border-l-danger"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-2xl bg-red-50 text-danger flex items-center justify-center"><Icon name={CATEGORIES.find(c => c.id === p.category)?.icon || 'Package'} size={20} /></div><h3 className="font-bold text-slate-700">{p.name}</h3></div><div className="text-right"><p className="text-[10px] font-black text-danger uppercase mb-1 flex items-center justify-end gap-1"><Icon name="AlertTriangle" size={10} /> Crítico</p><p className="font-bold text-slate-500">{p.stock} <span className="opacity-30">/</span> {p.min} {p.unit || 'uds'}</p></div></div>
                        ))}
                        {products.filter(p => p.stock <= (p.min || 1)).length === 0 && ( <div className="py-20 text-center glass rounded-5xl border-dashed border-2 border-slate-100 dark:border-slate-800"><div className="w-20 h-20 bg-emerald-50 text-brand rounded-full flex items-center justify-center mx-auto mb-6"><Icon name="Check" size={40} /></div><p className="text-slate-400 font-black uppercase text-xs tracking-widest">✨ Despensa Completa</p></div> )}
                    </div>
                </div>
            )}
            {activeTab === 'profile' && (
                <div className="flex flex-col gap-6 animate-pop">
                    <div className="glass p-10 rounded-5xl flex flex-col items-center text-center gap-4 relative shadow-sm">
                        <div className="w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 overflow-hidden ring-4 ring-white shadow-xl">{profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <Icon name="User" size={56} />}</div>
                        <div className="space-y-1"><input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="text-2xl font-black bg-transparent text-center border-b-2 border-transparent focus:border-brand outline-none transition-all" /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{user ? user.email : 'Free Account'}</p></div>
                        {!user ? ( <button onClick={login} className="mt-4 px-8 py-3 bg-white text-slate-700 rounded-2xl font-bold text-xs flex items-center gap-3 shadow-lg hover:shadow-xl transition-all border border-slate-100"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" /> {t.login}</button> ) : ( <button onClick={logout} className="mt-4 text-xs font-black text-danger uppercase tracking-widest hover:underline">{t.logout}</button> )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setCurrency(prompt("Symbol:", currency) || currency)} className="glass p-6 rounded-4xl flex flex-col items-center gap-3 group transition-all hover:bg-white"><div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Icon name="Coins" /></div><span className="text-[10px] font-black uppercase text-slate-500">{t.currency} ({currency})</span></button>
                        <button onClick={() => setShowQR(true)} className="glass p-6 rounded-4xl flex flex-col items-center gap-3 group transition-all hover:bg-white"><div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Icon name="QrCode" /></div><span className="text-[10px] font-black uppercase text-slate-500">Sync QR</span></button>
                        <button onClick={() => { if(confirm("¿Seguro?")) { DB.clear('products').then(() => window.location.reload()); } }} className="glass p-6 rounded-4xl flex flex-col items-center gap-3 text-danger col-span-2 group hover:bg-red-50 transition-all"><Icon name="Trash2" className="group-hover:animate-bounce" /><span className="text-[10px] font-black uppercase">{t.deleteAll}</span></button>
                    </div>
                </div>
            )}
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] glass rounded-[2.5rem] p-3 flex justify-around shadow-2xl z-[100] border-white/20 transition-all duration-500">
                {[ { id: 'pantry', icon: 'LayoutGrid' }, { id: 'stats', icon: 'BarChart3' }, { id: 'add', icon: 'PlusCircle' }, { id: 'cart', icon: 'ShoppingCart' }, { id: 'profile', icon: 'Settings' } ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 transition-all duration-300 flex items-center justify-center rounded-[1.75rem] relative ${activeTab === tab.id ? 'tab-active' : 'text-slate-300 hover:text-slate-500'}`}><Icon name={tab.icon} size={24} />{tab.id === 'cart' && products.filter(p => p.stock <= (p.min || 1)).length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>}</button>
                ))}
            </nav>
            {editing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-pop">
                    <div className="glass w-full max-w-sm p-10 rounded-5xl shadow-2xl relative border-white/40 border-t-8 border-t-brand">
                        <button onClick={() => setEditing(null)} className="absolute top-8 right-8 w-10 h-10 glass rounded-full flex items-center justify-center text-slate-300 hover:text-danger transition-colors"><Icon name="X" /></button>
                        <h2 className="text-3xl font-black mb-10 tracking-tighter">{t.edit}</h2>
                        <div className="flex flex-col gap-6">
                            <div className="w-24 h-24 rounded-4xl bg-slate-50 overflow-hidden mx-auto mb-4 border-4 border-white shadow-lg">{editing.image ? <img src={editing.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Icon name="Package" size={40} /></div>}</div>
                            <input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} className="w-full p-4 glass rounded-3xl outline-none font-black text-xl text-center focus:ring-4 ring-brand/10 transition-all" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Stock ({editing.unit})</p><input type="number" value={editing.stock} onChange={e => setEditing({...editing, stock: parseFloat(e.target.value)||0})} className="w-full p-4 glass rounded-3xl outline-none font-black text-center" /></div>
                                <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Mínimo</p><input type="number" value={editing.min} onChange={e => setEditing({...editing, min: parseFloat(e.target.value)||0})} className="w-full p-4 glass rounded-3xl outline-none font-black text-center" /></div>
                            </div>
                            <button onClick={() => updateProduct(editing)} className="mt-4 p-5 bg-brand text-white rounded-4xl font-black shadow-xl shadow-emerald-200 active:scale-95 transition-all">{t.save}</button>
                            <button onClick={() => { if(confirm("¿Eliminar?")) deleteProduct(editing.id); }} className="text-danger font-black text-[10px] uppercase tracking-widest p-2 hover:bg-red-50 rounded-2xl transition-colors">🗑️ {t.delete}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
