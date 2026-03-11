import React, { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import API from '../api/api';

const buildImageUrl = (imagePath) => {
  if (!imagePath) return '';
  const value = String(imagePath);
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API.defaults.baseURL}${value}`;
};

const normalizeBlog = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw.blog_id ?? raw.slug ?? `${Date.now()}`;
  return {
    ...raw,
    id,
    title: raw.title || '',
    author: raw.author || raw.user?.name || 'Admin',
    post: raw.post || raw.content || '',
    image: raw.image || raw.image_url || raw.thumbnail || '',
    created_at: raw.created_at || raw.date || new Date().toISOString(),
  };
};

const toBlogArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.blogs)) return payload.blogs;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const extractApiError = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  const errors = data?.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors).flat()[0];
    if (first) return String(first);
  }
  return err?.message || fallback;
};

const stripHtml = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const styles = {
  container: {
    padding: '28px',
    maxWidth: '1180px',
    margin: 'auto',
    fontFamily: '"Segoe UI", "Avenir Next", "Helvetica Neue", sans-serif',
    background: 'linear-gradient(165deg, #f3f7ff 0%, #eefcf8 55%, #ffffff 100%)',
    borderRadius: '24px',
    border: '1px solid #dbeafe',
  },
  header: {
    marginBottom: '22px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '16px',
  },
  titleWrap: {
    maxWidth: '700px',
  },
  title: {
    fontSize: '30px',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    margin: 0,
    color: '#0f172a',
  },
  subtitle: {
    marginTop: '8px',
    marginBottom: 0,
    color: '#475569',
  },
  form: {
    background: 'rgba(255,255,255,0.95)',
    padding: '20px',
    borderRadius: '18px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 20px 35px rgba(15, 23, 42, 0.06)',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    marginBottom: '12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    background: '#fff',
    boxSizing: 'border-box',
  },
  search: {
    width: '100%',
    padding: '13px 14px',
    marginBottom: '18px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    boxSizing: 'border-box',
  },
  primaryBtn: {
    backgroundColor: '#0ea5e9',
    color: '#ffffff',
    padding: '11px 18px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    padding: '11px 18px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginLeft: '10px',
  },
  dangerBtn: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginLeft: '10px',
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #0284c7',
    color: '#0369a1',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  card: {
    background: 'linear-gradient(160deg, #ffffff 0%, #f8fbff 100%)',
    padding: '20px',
    borderRadius: '14px',
    marginBottom: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)',
  },
  image: {
    width: '100%',
    maxHeight: '260px',
    objectFit: 'cover',
    borderRadius: '10px',
    marginBottom: '14px',
  },
  meta: {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '12px',
  },
  actions: {
    marginTop: '16px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '20px',
  },
  pageBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  status: {
    marginBottom: '12px',
    fontSize: '13px',
    color: '#0369a1',
  },
};

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState({
    title: '',
    author: '',
    post: '',
  });
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const perPage = 5;

  const fetchBlogs = async () => {
    try {
      const res = await API.getBlogs();
      const normalized = toBlogArray(res?.data).map(normalizeBlog).filter(Boolean);
      setBlogs(normalized);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const resetForm = () => {
    setForm({ title: '', author: '', post: '' });
    setImage(null);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    const normalizedTitle = String(form.title || '').trim();
    const normalizedPost = String(form.post || '').trim();
    const plainPost = stripHtml(normalizedPost);
    const adminName = (() => {
      try {
        const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
        return String(admin?.name || admin?.full_name || '').trim();
      } catch {
        return '';
      }
    })();
    const normalizedAuthor = String(form.author || adminName || '').trim();

    if (!normalizedTitle) {
      setStatusMessage('Title is required.');
      return;
    }
    if (!plainPost) {
      setStatusMessage('Post content is required.');
      return;
    }
    if (!editingId && !image) {
      setStatusMessage('Image is required when creating a blog post.');
      return;
    }

    const data = new FormData();
    data.append('title', normalizedTitle);
    data.append('author', normalizedAuthor || 'Admin');
    data.append('post', normalizedPost);
    if (image) data.append('image', image);

    try {
      setSubmitLoading(true);

      if (editingId) {
        const res = await API.updateBlog(editingId, data);
        const updated = normalizeBlog(res?.data?.data ?? res?.data) || {
          id: editingId,
          ...form,
          title: normalizedTitle,
          author: normalizedAuthor || 'Admin',
          post: normalizedPost,
          image: '',
          created_at: new Date().toISOString(),
        };
        setBlogs((prev) => prev.map((blog) => (
          String(blog.id) === String(editingId) ? { ...blog, ...updated } : blog
        )));
        setStatusMessage('Blog updated successfully.');
      } else {
        const res = await API.createBlog(data);
        const created = normalizeBlog(res?.data?.data ?? res?.data) || {
          id: `temp-${Date.now()}`,
          title: normalizedTitle,
          author: normalizedAuthor || '',
          post: normalizedPost,
          image: image ? URL.createObjectURL(image) : '',
          created_at: new Date().toISOString(),
        };
        setBlogs((prev) => [created, ...prev]);
        setPage(1);
        setStatusMessage('Blog added to list.');
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setStatusMessage(extractApiError(err, 'Unable to save blog right now.'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (blog) => {
    setForm({
      title: blog.title,
      author: blog.author,
      post: blog.post,
    });
    setEditingId(blog.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog?')) return;

    try {
      setActionLoading(`delete-${id}`);
      await API.deleteBlog(id);
      setBlogs((prev) => prev.filter((blog) => String(blog.id) !== String(id)));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBlogs = useMemo(() => blogs.filter((b) => (
    String(b.title || '').toLowerCase().includes(search.toLowerCase())
    || String(b.author || '').toLowerCase().includes(search.toLowerCase())
  )), [blogs, search]);

  const totalPages = Math.ceil(filteredBlogs.length / perPage);
  const paginatedBlogs = filteredBlogs.slice((page - 1) * perPage, page * perPage);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <h1 style={styles.title}>Blog Post</h1>
          <p style={styles.subtitle}>Feed.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <h3 style={{ marginTop: 0, marginBottom: '14px', color: '#0f172a' }}>
          {editingId ? 'Edit Blog Post' : 'Create Blog Post'}
        </h3>

        {statusMessage && <div style={styles.status}>{statusMessage}</div>}

        <input
          name="title"
          placeholder="Blog title"
          value={form.title}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <input
          name="author"
          placeholder="Author"
          value={form.author}
          onChange={handleChange}
          style={styles.input}
        />

        <ReactQuill
          value={form.post}
          onChange={(value) => setForm({ ...form, post: value })}
          style={{ marginBottom: '15px' }}
        />

        <input type="file" onChange={handleImageChange} style={{ marginBottom: '4px' }} />

        <div style={{ marginTop: '15px' }}>
          <button
            type="submit"
            style={{ ...styles.primaryBtn, opacity: submitLoading ? 0.8 : 1 }}
            disabled={submitLoading}
          >
            {submitLoading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            )}
            {submitLoading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Blog' : 'Create Blog')}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={styles.secondaryBtn}
              disabled={submitLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <input
        placeholder="Search blog posts..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        style={styles.search}
      />

      {paginatedBlogs.length === 0 && (
        <div style={styles.card}>
          <p style={{ margin: 0, color: '#64748b' }}>No blog posts found.</p>
        </div>
      )}

      {paginatedBlogs.map((blog) => (
        <div key={blog.id} style={styles.card}>
          {blog.image && (
            <img
              src={buildImageUrl(blog.image)}
              alt={blog.title}
              style={styles.image}
            />
          )}

          <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#0f172a' }}>{blog.title}</h3>

          <p style={styles.meta}>
            {blog.author || 'Admin'} | {new Date(blog.created_at).toLocaleDateString()}
          </p>

          <div
            style={{ lineHeight: '1.7', color: '#374151' }}
            dangerouslySetInnerHTML={{ __html: blog.post }}
          />

          <div style={styles.actions}>
            <button onClick={() => handleEdit(blog)} style={styles.outlineBtn}>
              Edit
            </button>
            <button
              onClick={() => handleDelete(blog.id)}
              style={{
                ...styles.dangerBtn,
                opacity: actionLoading === `delete-${blog.id}` ? 0.6 : 1,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
              }}
              disabled={actionLoading === `delete-${blog.id}`}
            >
              {actionLoading === `delete-${blog.id}` ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div style={styles.pagination}>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              style={{
                ...styles.pageBtn,
                background: page === i + 1 ? '#0284c7' : '#e2e8f0',
                color: page === i + 1 ? '#fff' : '#0f172a',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Blogs;
