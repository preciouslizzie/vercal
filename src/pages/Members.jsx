import React, { useEffect, useState } from 'react';
import API from '../api/api';

const toArray = (payload, nestedKeys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;

  for (const key of nestedKeys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object' && Array.isArray(value.data)) return value.data;
  }

  return [];
};

const looksLikeMember = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value).map((k) => k.toLowerCase());
  const markerCount = [
    'member_id', 'user_id', 'name', 'full_name', 'first_name', 'last_name',
    'email', 'mail', 'role', 'user_role', 'position', 'department',
  ].reduce((sum, key) => (keys.includes(key) ? sum + 1 : sum), 0);
  return markerCount >= 2;
};

const findMembersDeep = (payload, depth = 0) => {
  if (depth > 6 || payload === null || payload === undefined) return [];
  if (Array.isArray(payload)) {
    if (payload.some((item) => looksLikeMember(item))) return payload;
    for (const item of payload) {
      const found = findMembersDeep(item, depth + 1);
      if (found.length > 0) return found;
    }
    return [];
  }
  if (typeof payload !== 'object') return [];
  for (const value of Object.values(payload)) {
    const found = findMembersDeep(value, depth + 1);
    if (found.length > 0) return found;
  }
  return [];
};

const normalizeMember = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw.member_id ?? raw.user_id;
  const fullName = [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim();
  const name = raw.name || raw.full_name || fullName || raw.username || '';
  const email = raw.email || raw.mail || '';
  const role = raw.role || raw.user_role || raw.type || 'member';

  if (!id && !name && !email) return null;
  return {
    ...raw,
    id: id ?? `${email}-${name}`,
    name: name || '-',
    email: email || '-',
    role,
  };
};

const isAdminLike = (member) => {
  const roleValue = String(member?.role || member?.user_role || member?.type || '').toLowerCase();
  const normalized = roleValue.replace(/[_\s-]/g, '');
  return (
    member?.is_admin === true
    || normalized === 'admin'
    || normalized === 'superadmin'
    || roleValue.includes('admin')
  );
};

const extractMembers = (payload) => {
  const list = toArray(payload, ['members', 'items', 'users']);
  const deep = list.length > 0 ? list : findMembersDeep(payload);
  const source = deep.length > 0 ? deep : list;
  return source.map(normalizeMember).filter(Boolean).filter((member) => !isAdminLike(member));
};

const readRecentMembersCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem('recent_members') || '[]');
    return Array.isArray(cached) ? cached.map(normalizeMember).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const mergeMembers = (apiMembers, cachedMembers) => {
  const merged = [...apiMembers, ...cachedMembers];
  return Array.from(
    new Map(
      merged
        .filter(Boolean)
        .filter((member) => !isAdminLike(member))
        .map((m) => [String(m.id || `${m.email}-${m.name}`), m]),
    ).values(),
  );
};

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'member' });

  const loadMembers = async () => {
    try {
      setLoading(true);
      const [membersRes, usersRes] = await Promise.all([
        API.getMembers().catch(() => ({ data: [] })),
        API.get('/admin/users').catch(() => ({ data: [] })),
      ]);
      const membersFromMembersEndpoint = extractMembers(membersRes?.data);
      const membersFromUsersEndpoint = extractMembers(usersRes?.data);
      const apiMembers = mergeMembers(membersFromMembersEndpoint, membersFromUsersEndpoint);
      const cachedMembers = readRecentMembersCache();
      setMembers(mergeMembers(apiMembers, cachedMembers));
    } catch (err) {
      console.error('Failed to load members:', err);
      setMembers(readRecentMembersCache());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const isAdminUser = (() => {
    try {
      const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
      const role = String(admin?.role || admin?.user_role || admin?.type || '').toLowerCase().replace(/[_\s-]/g, '');
      return admin?.is_admin === true || role === 'admin' || role === 'superadmin';
    } catch {
      return false;
    }
  })();

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      alert('Name and email required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role || 'member',
      };
      let createRes;
      try {
        createRes = await API.post('/admin/users', payload);
      } catch (usersErr) {
        try {
          createRes = await API.createMember(payload);
        } catch (membersErr) {
          const usersMessage = usersErr?.response?.data?.message || usersErr?.message || 'Unknown /admin/users error';
          const membersMessage = membersErr?.response?.data?.message || membersErr?.message || 'Unknown /members error';
          throw new Error(`/admin/users failed: ${usersMessage}; /members failed: ${membersMessage}`);
        }
      }
      const created = normalizeMember(
        createRes?.data?.data
        ?? createRes?.data
        ?? { ...payload, id: `${Date.now()}-${payload.email}` },
      );
      if (created && !isAdminLike(created)) {
        let next = [];
        setMembers((prev) => {
          next = mergeMembers([created, ...prev], []);
          return next;
        });
        try {
          localStorage.setItem('recent_members', JSON.stringify(next.slice(0, 100)));
        } catch {
          // ignore storage issues
        }
      }
      setForm({ name: '', email: '', role: 'member' });
      window.dispatchEvent(new Event('members:updated'));
      await loadMembers();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-2xl shadow-xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Church Members</h2>
        <p className="text-gray-600 mt-2">
          Member records 
        </p>
      </div>

      {isAdminUser && false && (
        <form onSubmit={handleAddMember} className="bg-white rounded-xl shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="member">Member</option>
            <option value="user">User</option>
            <option value="volunteer">Volunteer</option>
            <option value="worker">Worker</option>
            <option value="leader">Leader</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">Loading members...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan="3">No members found.</td>
                </tr>
              ) : members.map((m) => (
                <tr key={m.id || `${m.email}-${m.name}`} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{m.name || '-'}</td>
                  <td className="px-4 py-3">{m.email || '-'}</td>
                  <td className="px-4 py-3">{m.role || 'member'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Members;

