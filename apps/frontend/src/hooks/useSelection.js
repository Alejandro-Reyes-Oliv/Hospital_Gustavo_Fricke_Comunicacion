import { useMemo, useState } from "react";

export default function useSelection(initial = []) {
  const [sel, setSel] = useState(() => new Set(initial));

  const isSelected = (id) => sel.has(id);
  const size = sel.size;

  const toggle = (id) => {
    const s = new Set(sel);
    s.has(id) ? s.delete(id) : s.add(id);
    setSel(s);
  };

  const clear = () => setSel(new Set());

  const setMany = (ids) => {
    const s = new Set(sel);
    ids.forEach((id) => s.add(id));
    setSel(s);
  };

  const removeMany = (ids) => {
    const s = new Set(sel);
    ids.forEach((id) => s.delete(id));
    setSel(s);
  };

  const values = useMemo(() => Array.from(sel), [sel]);

  return { sel, isSelected, toggle, clear, setMany, removeMany, values, size };
}
