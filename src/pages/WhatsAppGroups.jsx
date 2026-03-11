import React, { useEffect, useMemo, useState } from 'react';
import { BsWhatsapp } from 'react-icons/bs';
import { FiCopy, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import API from '../api/api';
import {
  createWhatsAppLink,
  getRoles,
} from '../api/adminApi';

const toList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.links)) return payload.links;
  return [];
};

const getCurrentRole = () => {
  try {
    const adminUser = JSON.parse(localStorage.getItem('admin_user') || 'null');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return (adminUser?.role || user?.role || '').toLowerCase();
  } catch {
    return '';
  }
};

const isValidWhatsAppUrl = (value) => /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\//i.test(value || '');

export default function WhatsAppGroups() {
  const [links, setLinks] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    title: '',
    link: '',
    role_id: '',
  });

  const role = getCurrentRole();
  const isAdmin = role === 'admin' || role === 'super_admin';

  const loadLinks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.getWhatsAppLinks();
      setLinks(toList(res?.data));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load WhatsApp groups');
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  useEffect(() => {
    const loadRoles = async () => {
      if (!isAdmin) return;
      try {
        const res = await getRoles();
        const roleList = toList(res?.data);
        setRoles(roleList);
        if (roleList.length > 0 && !form.role_id) {
          setForm((prev) => ({ ...prev, role_id: String(roleList[0].id) }));
        }
      } catch {
        setRoles([]);
      }
    };
    loadRoles();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter((item) => {
      const department = item?.role?.name || item?.department || '';
      return (
        String(item?.title || '').toLowerCase().includes(q)
        || String(item?.link || '').toLowerCase().includes(q)
        || String(department).toLowerCase().includes(q)
      );
    });
  }, [links, query]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Group title is required.');
      return;
    }
    if (!isValidWhatsAppUrl(form.link.trim())) {
      setError('Use a valid WhatsApp invite URL (chat.whatsapp.com or wa.me).');
      return;
    }
    if (!form.role_id) {
      setError('Select a department.');
      return;
    }

    setSaving(true);
    try {
      await createWhatsAppLink({
        title: form.title.trim(),
        link: form.link.trim(),
        role_id: Number(form.role_id),
      });
      setForm((prev) => ({ ...prev, title: '', link: '' }));
      await loadLinks();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create WhatsApp group');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // no-op for older browsers
    }
  };

  return (
    <div className="min-h-screen text-slate-800">
      <div className="rounded-3xl p-8 mb-8 bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-100 border border-emerald-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="uppercase text-xs tracking-[0.2em] text-emerald-700 font-semibold">Communication Hub</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">Department WhatsApp Groups</h1>
            <p className="text-slate-600 mt-3 max-w-3xl">
              Admin creates invite links per department. Members only see groups they are allowed to join.
            </p>
          </div>
          <button
            type="button"
            onClick={loadLinks}
            className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {isAdmin && (
        <form onSubmit={submit} className="mb-8 rounded-2xl border border-slate-200 bg-white/90 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BsWhatsapp className="text-emerald-500 text-xl" />
            <h2 className="text-xl font-bold">Create Department Group</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <input
              type="text"
              placeholder="Group title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="md:col-span-3 rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <input
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              value={form.link}
              onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
              className="md:col-span-5 rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <select
              value={form.role_id}
              onChange={(e) => setForm((prev) => ({ ...prev, role_id: e.target.value }))}
              className="md:col-span-2 rounded-xl border border-slate-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="">Select department</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving}
              className="md:col-span-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-4 py-3 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Publish Group'}
            </button>
          </div>
        </form>
      )}

      <div className="mb-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, department or link..."
          className="w-full md:w-[480px] rounded-xl border border-slate-300 px-4 py-3 bg-white"
        />
      </div>

      <div className="mb-5">
        <a
          href="https://wa.me/2348012345678"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <BsWhatsapp className="text-xl" /> WhatsApp Me
        </a>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500">Loading WhatsApp groups...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500">No WhatsApp groups available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white shadow-md hover:shadow-xl transition-all p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-xs mt-1 text-slate-500">
                    Department: {item?.role?.name || 'General'}
                  </p>
                </div>
                <BsWhatsapp className="text-2xl text-emerald-500" />
              </div>
              <p className="text-sm text-slate-500 mt-3 break-all">{item.link}</p>

              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => copyLink(item.link)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <FiCopy />
                  Copy
                </button>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700"
                >
                  <FiExternalLink />
                  Join Group
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
