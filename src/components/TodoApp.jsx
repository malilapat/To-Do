import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, ListTodo, CheckCheck } from "lucide-react";

const PRIORITIES = {
  low: {
    label: "ต่ำ",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    strip: "border-emerald-400",
    pick: "bg-emerald-500 text-white border-emerald-500",
  },
  medium: {
    label: "กลาง",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    strip: "border-amber-400",
    pick: "bg-amber-500 text-white border-amber-500",
  },
  high: {
    label: "สูง",
    badge: "bg-red-50 text-red-700 border-red-200",
    strip: "border-red-400",
    pick: "bg-red-500 text-white border-red-500",
  },
};

const ORDER = ["low", "medium", "high"];

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

const EXIT_MS = 280;

function TodoRow({
  todo,
  removing,
  editing,
  editText,
  setEditText,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onCyclePriority,
}) {
  const p = PRIORITIES[todo.priority];
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
        marginBottom: removing ? 0 : undefined,
        transition: `grid-template-rows ${EXIT_MS}ms ease, opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease`,
      }}
      className="todo-in"
    >
      <div style={{ minHeight: 0, overflow: "hidden" }}>
        <div
          className={`flex items-center gap-3 bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${p.strip} px-3 py-3 mb-2.5`}
        >
          <button
            type="button"
            onClick={() => onToggle(todo.id)}
            aria-label={todo.completed ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
            aria-pressed={todo.completed}
            className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              todo.completed
                ? "bg-slate-800 border-slate-800 text-white"
                : "bg-white border-slate-300 hover:border-slate-500"
            }`}
          >
            {todo.completed && <Check size={14} strokeWidth={3} />}
          </button>

          <div className="flex-1 min-w-0">
            {editing ? (
              <>
                <input
                  ref={inputRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveEdit();
                    if (e.key === "Escape") onCancelEdit();
                  }}
                  onBlur={onSaveEdit}
                  aria-label="แก้ไขงาน"
                  className="w-full text-base text-slate-800 border-b-2 border-slate-800 bg-transparent py-0.5 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Enter เพื่อบันทึก · Esc เพื่อยกเลิก</p>
              </>
            ) : (
              <span
                onDoubleClick={() => onStartEdit(todo)}
                title="ดับเบิลคลิกเพื่อแก้ไข"
                className={`block text-base break-words select-none cursor-text transition-colors ${
                  todo.completed ? "line-through text-slate-400" : "text-slate-800"
                }`}
              >
                {todo.text}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onCyclePriority(todo.id)}
            title="แตะเพื่อเปลี่ยนระดับความสำคัญ"
            aria-label={`ความสำคัญ: ${p.label} แตะเพื่อเปลี่ยน`}
            className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${p.badge} ${
              todo.completed ? "opacity-50" : ""
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`}
          >
            {p.label}
          </button>

          <div className="shrink-0 flex items-center">
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

export default function TodoApp() {
  const nextId = useRef(4);
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานโครงงานให้อาจารย์", completed: false, priority: "high" },
    { id: 2, text: "ซื้อของเข้าบ้าน", completed: false, priority: "medium" },
    { id: 3, text: "อ่านหนังสือก่อนนอน", completed: true, priority: "low" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [removingIds, setRemovingIds] = useState([]);

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - activeCount;
  const counts = { all: todos.length, active: activeCount, completed: completedCount };

  const visible = todos.filter((t) =>
    filter === "active" ? !t.completed : filter === "completed" ? t.completed : true
  );

  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((prev) => [
      { id: nextId.current++, text: value, completed: false, priority },
      ...prev,
    ]);
    setText("");
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
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    const value = editText.trim();
    if (value) {
      setTodos((prev) => prev.map((t) => (t.id === editingId ? { ...t, text: value } : t)));
    }
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const cyclePriority = (id) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % ORDER.length] }
          : t
      )
    );

  const clearCompleted = () =>
    removeTodos(todos.filter((t) => t.completed && !removingIds.includes(t.id)).map((t) => t.id));

  const emptyMessage =
    todos.length === 0
      ? "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย"
      : filter === "active"
      ? "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!"
      : "ยังไม่มีงานที่เสร็จแล้ว";

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

      <div className="max-w-xl mx-auto">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-sm">
            <ListTodo size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">จดสิ่งที่ต้องทำ แล้วทำให้เสร็จทีละอย่าง</p>
          </div>
        </header>

        {/* Add */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 mb-5">
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

          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-slate-500 mr-1">ความสำคัญ</span>
            {ORDER.map((key) => (
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

        {/* Filter tabs */}
        <div
          role="tablist"
          aria-label="กรองรายการงาน"
          className="flex gap-1 bg-slate-200/60 rounded-xl p-1 mb-4"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 text-sm font-medium rounded-lg py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                filter === f.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs text-slate-400">{counts[f.key]}</span>
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
                removing={removingIds.includes(todo.id)}
                editing={editingId === todo.id}
                editText={editText}
                setEditText={setEditText}
                onToggle={toggle}
                onDelete={(id) => removeTodos([id])}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onCyclePriority={cyclePriority}
              />
            ))}
          </ul>
        )}

        {/* Footer */}
        {todos.length > 0 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-sm text-slate-500">เหลืออีก {activeCount} งาน</p>
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
          ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · แตะป้ายความสำคัญเพื่อเปลี่ยนระดับ
        </p>
      </div>
    </div>
  );
}
