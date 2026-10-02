import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  ListTodo,
  CheckCheck,
  Calendar,
  Search,
  X,
  Tag,
  Briefcase,
  User,
  ShoppingBag,
  HeartPulse,
} from "lucide-react";

/* ---------- Config ---------- */

const PRIORITIES = {
  low: {
    label: "ต่ำ",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    strip: "border-emerald-400",
    pick: "bg-emerald-500 text-white border-emerald-500",
  },
  medium: {
    label: "กลาง",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    strip: "border-orange-400",
    pick: "bg-orange-500 text-white border-orange-500",
  },
  high: {
    label: "สูง",
    badge: "bg-red-50 text-red-700 border-red-200",
    strip: "border-red-400",
    pick: "bg-red-500 text-white border-red-500",
  },
};
const PRIORITY_ORDER = ["low", "medium", "high"];

const CATEGORIES = {
  work: {
    label: "งาน",
    Icon: Briefcase,
    tag: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: "text-indigo-500",
  },
  personal: {
    label: "ส่วนตัว",
    Icon: User,
    tag: "bg-violet-50 text-violet-700 border-violet-200",
    icon: "text-violet-500",
  },
  shopping: {
    label: "ช้อปปิ้ง",
    Icon: ShoppingBag,
    tag: "bg-pink-50 text-pink-700 border-pink-200",
    icon: "text-pink-500",
  },
  health: {
    label: "สุขภาพ",
    Icon: HeartPulse,
    tag: "bg-teal-50 text-teal-700 border-teal-200",
    icon: "text-teal-500",
  },
};
const CATEGORY_ORDER = ["work", "personal", "shopping", "health"];

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

const EXIT_MS = 280;
const COLORS = { done: "#10b981", active: "#60a5fa", overdue: "#ef4444", track: "#e2e8f0" };

/* ---------- Date helpers (local time, "YYYY-MM-DD" strings) ---------- */

const pad = (n) => String(n).padStart(2, "0");
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toYMD(d);
};
const parseYMD = (s) => new Date(`${s}T00:00:00`);
const formatDate = (s) =>
  parseYMD(s).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
const daysBetween = (a, b) => Math.round((parseYMD(a) - parseYMD(b)) / 86400000);

const isOverdue = (todo, today) => !todo.completed && !!todo.due && todo.due < today;

function dueInfo(todo, today) {
  if (!todo.due) return null;
  if (todo.completed)
    return { cls: "bg-slate-50 text-slate-400 border-slate-200", label: formatDate(todo.due) };
  if (todo.due < today)
    return {
      cls: "bg-red-50 text-red-700 border-red-200",
      label: `เลยกำหนด ${daysBetween(today, todo.due)} วัน`,
    };
  if (todo.due === today)
    return {
      cls: "bg-yellow-50 text-yellow-800 border-yellow-300",
      label: "ครบกำหนดวันนี้",
    };
  return { cls: "bg-slate-50 text-slate-600 border-slate-200", label: formatDate(todo.due) };
}

/* ---------- Statistics ---------- */

function Donut({ segments, total, percent }) {
  const R = 15.9155; // circumference = 100
  let offset = 25; // start at 12 o'clock
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const len = (s.value / total) * 100;
      const el = (
        <circle
          key={s.key}
          cx="18"
          cy="18"
          r={R}
          fill="none"
          stroke={s.color}
          strokeWidth="4"
          strokeDasharray={`${len} ${100 - len}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dasharray 400ms ease, stroke-dashoffset 400ms ease" }}
        />
      );
      offset -= len;
      return el;
    });

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full" role="img" aria-label={`เสร็จแล้ว ${percent}%`}>
        <circle cx="18" cy="18" r={R} fill="none" stroke={COLORS.track} strokeWidth="4" />
        {arcs}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700">
        {percent}%
      </div>
    </div>
  );
}

function Stats({ total, completed, overdue }) {
  const active = total - completed - overdue;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const segments = [
    { key: "done", label: "เสร็จแล้ว", value: completed, color: COLORS.done },
    { key: "active", label: "กำลังทำ", value: active, color: COLORS.active },
    { key: "overdue", label: "เลยกำหนด", value: overdue, color: COLORS.overdue },
  ];

  return (
    <section
      aria-label="สถิติ"
      className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 sm:p-5 mb-5 flex items-center gap-4 sm:gap-6"
    >
      <Donut segments={segments} total={total} percent={percent} />
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">งานทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-800">{total}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">ทำเสร็จแล้ว</p>
            <p className="text-2xl font-bold text-slate-800">{percent}%</p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {segments.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              {s.label} {s.value}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Todo row ---------- */

function TodoRow({
  todo,
  today,
  removing,
  editing,
  editText,
  setEditText,
  editDue,
  setEditDue,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onCyclePriority,
  onCycleCategory,
}) {
  const p = PRIORITIES[todo.priority];
  const c = CATEGORIES[todo.category];
  const due = dueInfo(todo, today);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <li
      style={{
        display: "grid",
        gridTemplateRows: removing ? "0fr" : "1fr",
        opacity: removing ? 0 : 1,
        transform: removing ? "translateX(24px)" : "translateX(0)",
        transition: `grid-template-rows ${EXIT_MS}ms ease, opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease`,
      }}
      className="todo-in"
    >
      <div style={{ minHeight: 0, overflow: "hidden" }}>
        <div
          className={`flex items-start gap-3 bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${p.strip} px-3 py-3 mb-2.5`}
        >
          <button
            type="button"
            onClick={() => onToggle(todo.id)}
            aria-label={todo.completed ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
            aria-pressed={todo.completed}
            className={`shrink-0 mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              todo.completed
                ? "bg-slate-800 border-slate-800 text-white"
                : "bg-white border-slate-300 hover:border-slate-500"
            }`}
          >
            {todo.completed && <Check size={14} strokeWidth={3} />}
          </button>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) onSaveEdit();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
              >
                <input
                  ref={inputRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  aria-label="แก้ไขงาน"
                  className="w-full text-base text-slate-800 border-b-2 border-slate-800 bg-transparent py-0.5 focus:outline-none"
                />
                <label className="flex items-center gap-2 mt-2.5 text-sm text-slate-500">
                  <Calendar size={14} />
                  กำหนดส่ง
                  <input
                    type="date"
                    value={editDue}
                    onChange={(e) => setEditDue(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-slate-500"
                  />
                </label>
                <p className="text-xs text-slate-400 mt-1.5">Enter เพื่อบันทึก · Esc เพื่อยกเลิก</p>
              </div>
            ) : (
              <>
                <span
                  onDoubleClick={() => onStartEdit(todo)}
                  title="ดับเบิลคลิกเพื่อแก้ไข"
                  className={`block text-base break-words select-none cursor-text transition-colors ${
                    todo.completed ? "line-through text-slate-400" : "text-slate-800"
                  }`}
                >
                  {todo.text}
                </span>
                <div className={`flex flex-wrap items-center gap-1.5 mt-1.5 ${todo.completed ? "opacity-60" : ""}`}>
                  <button
                    type="button"
                    onClick={() => onCycleCategory(todo.id)}
                    title="แตะเพื่อเปลี่ยนหมวดหมู่"
                    aria-label={`หมวดหมู่: ${c.label} แตะเพื่อเปลี่ยน`}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${c.tag} focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`}
                  >
                    <c.Icon size={12} />
                    {c.label}
                  </button>
                  {due && (
                    <span
                      title={`กำหนดส่ง ${parseYMD(todo.due).toLocaleDateString("th-TH", {
                        dateStyle: "long",
                      })}`}
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${due.cls}`}
                    >
                      <Calendar size={12} />
                      {due.label}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onCyclePriority(todo.id)}
                    title="แตะเพื่อเปลี่ยนระดับความสำคัญ"
                    aria-label={`ความสำคัญ: ${p.label} แตะเพื่อเปลี่ยน`}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${p.badge} focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`}
                  >
                    ความสำคัญ{p.label}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 flex items-center -mr-1">
            <button
              type="button"
              onClick={() => onStartEdit(todo)}
              aria-label="แก้ไข"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(todo.id)}
              aria-label="ลบ"
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ---------- App ---------- */

export default function TodoApp() {
  const today = toYMD(new Date());

  const nextId = useRef(6);
  const editingRef = useRef(null);
  const [todos, setTodos] = useState(() => [
    { id: 1, text: "ส่งรายงานโครงงานให้อาจารย์", completed: false, priority: "high", category: "work", due: addDays(-1) },
    { id: 2, text: "ซื้อของเข้าบ้าน", completed: false, priority: "medium", category: "shopping", due: addDays(0) },
    { id: 3, text: "นัดตรวจสุขภาพประจำปี", completed: false, priority: "medium", category: "health", due: addDays(5) },
    { id: 4, text: "อ่านหนังสือก่อนนอน", completed: true, priority: "low", category: "personal", due: "" },
    { id: 5, text: "ตอบอีเมลลูกค้า", completed: false, priority: "low", category: "work", due: addDays(2) },
  ]);

  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [due, setDue] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDue, setEditDue] = useState("");
  const [removingIds, setRemovingIds] = useState([]);

  /* derived */
  const q = query.trim().toLowerCase();
  const base = todos.filter(
    (t) =>
      (catFilter === "all" || t.category === catFilter) &&
      (!q || t.text.toLowerCase().includes(q))
  );
  const visible = base.filter((t) =>
    statusFilter === "active" ? !t.completed : statusFilter === "completed" ? t.completed : true
  );
  const tabCounts = {
    all: base.length,
    active: base.filter((t) => !t.completed).length,
    completed: base.filter((t) => t.completed).length,
  };
  const catCounts = CATEGORY_ORDER.reduce(
    (acc, k) => ({ ...acc, [k]: todos.filter((t) => t.category === k).length }),
    {}
  );

  const completedCount = todos.filter((t) => t.completed).length;
  const overdueCount = todos.filter((t) => isOverdue(t, today)).length;
  const remaining = todos.length - completedCount;

  /* actions */
  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((prev) => [
      { id: nextId.current++, text: value, completed: false, priority, category, due },
      ...prev,
    ]);
    setText("");
    setDue("");
  };

  const toggle = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const removeTodos = (ids) => {
    if (ids.length === 0) return;
    setRemovingIds((prev) => [...prev, ...ids]);
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
      setRemovingIds((prev) => prev.filter((i) => !ids.includes(i)));
    }, EXIT_MS);
  };

  const startEdit = (todo) => {
    editingRef.current = todo.id;
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDue(todo.due || "");
  };

  const saveEdit = () => {
    const id = editingRef.current;
    if (id === null) return;
    editingRef.current = null;
    const value = editText.trim();
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text: value || t.text, due: editDue } : t))
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    editingRef.current = null;
    setEditingId(null);
  };

  const cycle = (id, field, order) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, [field]: order[(order.indexOf(t[field]) + 1) % order.length] } : t
      )
    );

  const clearCompleted = () =>
    removeTodos(todos.filter((t) => t.completed && !removingIds.includes(t.id)).map((t) => t.id));

  const selectCategory = (key) => {
    setCatFilter(key);
    if (key !== "all") setCategory(key);
  };

  const emptyMessage = q
    ? `ไม่พบงานที่ตรงกับ "${query.trim()}"`
    : todos.length === 0
    ? "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย"
    : statusFilter === "completed"
    ? "ยังไม่มีงานที่เสร็จแล้ว"
    : statusFilter === "active"
    ? "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!"
    : "ยังไม่มีงานในหมวดนี้";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <style>{`
        @keyframes todoIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .todo-in { animation: todoIn 240ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .todo-in { animation: none; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-sm">
            <ListTodo size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">จดสิ่งที่ต้องทำ แล้วทำให้เสร็จทีละอย่าง</p>
          </div>
        </header>

        <Stats total={todos.length} completed={completedCount} overdue={overdueCount} />

        <div className="flex flex-col md:flex-row gap-5">
          {/* Category sidebar (chips on mobile) */}
          <aside className="md:w-52 shrink-0">
            <nav
              aria-label="หมวดหมู่"
              className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0 md:sticky md:top-6"
            >
              {[{ key: "all", label: "ทั้งหมด", Icon: ListTodo, icon: "text-slate-500", count: todos.length }]
                .concat(
                  CATEGORY_ORDER.map((k) => ({
                    key: k,
                    label: CATEGORIES[k].label,
                    Icon: CATEGORIES[k].Icon,
                    icon: CATEGORIES[k].icon,
                    count: catCounts[k],
                  }))
                )
                .map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => selectCategory(item.key)}
                    aria-pressed={catFilter === item.key}
                    className={`shrink-0 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                      catFilter === item.key
                        ? "bg-white shadow-sm border border-slate-200 text-slate-800 font-medium"
                        : "border border-transparent text-slate-600 hover:bg-white/70"
                    }`}
                  >
                    <item.Icon size={16} className={item.icon} />
                    <span className="md:flex-1 md:text-left">{item.label}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                      {item.count}
                    </span>
                  </button>
                ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {/* Add */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 mb-4">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  placeholder="มีอะไรต้องทำบ้าง?"
                  aria-label="เพิ่มงานใหม่"
                  className="flex-1 min-w-0 text-base text-slate-800 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-slate-500 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={addTodo}
                  disabled={!text.trim()}
                  className="shrink-0 flex items-center gap-1.5 bg-slate-800 text-white font-medium rounded-xl px-4 py-2.5 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  <Plus size={18} />
                  <span>เพิ่ม</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <label className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Tag size={14} />
                  <span className="shrink-0">หมวดหมู่</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-slate-800 focus:outline-none"
                  >
                    {CATEGORY_ORDER.map((k) => (
                      <option key={k} value={k}>
                        {CATEGORIES[k].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Calendar size={14} />
                  <span className="shrink-0">กำหนดส่ง</span>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-slate-800 focus:outline-none"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-slate-500 mr-1">ความสำคัญ</span>
                {PRIORITY_ORDER.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPriority(key)}
                    aria-pressed={priority === key}
                    className={`text-sm px-3.5 py-1 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                      priority === key
                        ? PRIORITIES[key].pick
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {PRIORITIES[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                aria-label="ค้นหางาน"
                className="w-full text-base text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 shadow-sm focus:outline-none focus:border-slate-500 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status tabs */}
            <div role="tablist" aria-label="กรองตามสถานะ" className="flex gap-1 bg-slate-200/60 rounded-xl p-1 mb-4">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={statusFilter === f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`flex-1 text-sm font-medium rounded-lg py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                    statusFilter === f.key
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 text-xs text-slate-400">{tabCounts[f.key]}</span>
                </button>
              ))}
            </div>

            {/* List */}
            {visible.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-200 text-center text-slate-400 py-12 px-4">
                {emptyMessage}
              </div>
            ) : (
              <ul>
                {visible.map((todo) => (
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    today={today}
                    removing={removingIds.includes(todo.id)}
                    editing={editingId === todo.id}
                    editText={editText}
                    setEditText={setEditText}
                    editDue={editDue}
                    setEditDue={setEditDue}
                    onToggle={toggle}
                    onDelete={(id) => removeTodos([id])}
                    onStartEdit={startEdit}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    onCyclePriority={(id) => cycle(id, "priority", PRIORITY_ORDER)}
                    onCycleCategory={(id) => cycle(id, "category", CATEGORY_ORDER)}
                  />
                ))}
              </ul>
            )}

            {/* Footer */}
            {todos.length > 0 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-sm text-slate-500">เหลืออีก {remaining} งาน</p>
                <button
                  type="button"
                  onClick={clearCompleted}
                  disabled={completedCount === 0}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors rounded-lg px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <CheckCheck size={16} />
                  ล้างที่เสร็จแล้ว
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center mt-8">
              ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · แตะป้ายหมวดหมู่หรือความสำคัญเพื่อเปลี่ยน
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
