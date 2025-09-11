
import { useEffect, useMemo, useState } from "react";
import { ensureSeed, listUsers, createUser, updateUser, deleteUser } from "../services/users.js";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", name: "", role: "operario", active: true, password: "" });

  useEffect(() => {
    const initial = ensureSeed();
    setUsers(initial);
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return users;
    return users.filter(u => 
      (u.username?.toLowerCase().includes(t)) || 
      (u.name?.toLowerCase().includes(t)) ||
      (u.role?.toLowerCase().includes(t))
    );
  }, [users, q]);

  function openCreate() {
    setEditing(null);
    setForm({ username: "", name: "", role: "operario", active: true });
    setModalOpen(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({ username: u.username, name: u.name, role: u.role, active: u.active });
    setModalOpen(true);
  }

  function handleSubmit(e) {
    // duplicate guard
    e.preventDefault();
    try {
      if (editing) {
        // Verificar duplicados (excepto el propio)
        const exists = users.some(u => u.id !== editing.id && u.username?.toLowerCase() === form.username.trim().toLowerCase());
        if (exists) { alert("El usuario ya existe"); return; }
        const patch = { username: form.username, name: form.name, role: form.role, active: form.active };
        if (form.password) patch.password = form.password;
        const updated = updateUser(editing.id, patch);
        setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      } else {
        // Verificar duplicados
        const exists2 = users.some(u => u.username?.toLowerCase() === form.username.trim().toLowerCase());
        if (exists2) { alert("El usuario ya existe"); return; }
        if (!form.password) { alert("Debe definir una contraseña"); return; }
        const created = createUser(form);
        setUsers(prev => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message || String(err));
    }
  }

  function handleDelete(id) {
    if (!confirm("¿Eliminar este usuario?")) return;
    deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Usuarios operarios</h2>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, usuario o rol..."
            className="border rounded px-3 py-2"
          />
          <button onClick={openCreate} className="px-3 py-2 rounded border hover:bg-gray-50">+ Nuevo</button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Usuario</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Rol</th>
              <th className="p-2">Activo</th>
              <th className="p-2">Creado</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.username}</td>
                <td className="p-2">{u.name}</td>
                <td className="p-2 capitalize">{u.role}</td>
                <td className="p-2">
                  <span className={"px-2 py-1 rounded text-sm " + (u.active ? "bg-green-100" : "bg-red-100")}>
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="p-2">{new Date(u.createdAt).toLocaleString()}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan="7">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">{editing ? "Editar usuario" : "Nuevo usuario"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Usuario</label>
                <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label className="block text-sm mb-1">Nombre</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label className="block text-sm mb-1">Rol</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="border rounded px-3 py-2 w-full">
                  <option value="operario">Operario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Contraseña {editing ? "(dejar en blanco para no cambiar)" : ""}</label>
                <input type="password" value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} className="border rounded px-3 py-2 w-full" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                <label htmlFor="active">Activo</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-2 rounded border">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded border bg-gray-900 text-white">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
