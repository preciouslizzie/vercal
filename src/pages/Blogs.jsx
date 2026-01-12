import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import API from '../api/api';

/* ================= STYLES ================= */
const styles = {
  container: {
    padding: '30px',
    maxWidth: '900px',
    margin: 'auto',
    fontFamily: 'Arial, sans-serif',
  },

  header: {
    marginBottom: '20px',
  },

  form: {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  },

  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
  },

  search: {
    width: '100%',
    padding: '10px',
    marginBottom: '20px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
  },

  primaryBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '10px 18px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  secondaryBtn: {
    backgroundColor: '#e5e7eb',
    color: '#111827',
    padding: '10px 18px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginLeft: '10px',
  },

  dangerBtn: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginLeft: '10px',
  },

  outlineBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #2563eb',
    color: '#2563eb',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
  },

  card: {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  },

  image: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '10px',
  },

  meta: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '10px',
  },

  actions: {
    marginTop: '15px',
  },

  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '20px',
  },

  pageBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
};

/* ================= COMPONENT ================= */
const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState({
    title: '',
    author: '',
    content: '',
  });
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const perPage = 5;

  /* ===== FETCH BLOGS ===== */
  const fetchBlogs = async () => {
    try {
      const res = await API.getBlogs();
      setBlogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  /* ===== HANDLERS ===== */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const resetForm = () => {
    setForm({ title: '', author: '', content: '' });
    setImage(null);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('title', form.title);
    data.append('author', form.author);
    data.append('content', form.content);
    if (image) data.append('image', image);

    try {
      if (editingId) {
        await API.updateBlog(editingId, data);
      } else {
        await API.createBlog(data);
      }
      resetForm();
      fetchBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (blog) => {
    setForm({
      title: blog.title,
      author: blog.author,
      content: blog.content,
    });
    setEditingId(blog.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog?')) return;
    try {
      await API.deleteBlog(id);
      fetchBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  /* ===== FILTER & PAGINATION ===== */
  const filteredBlogs = blogs.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filteredBlogs.length / perPage);
  const paginatedBlogs = filteredBlogs.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>📝 Blog Management</h1>

      {/* ===== FORM ===== */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>{editingId ? 'Edit Blog Post' : 'Create Blog Post'}</h3>

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
          value={form.content}
          onChange={(value) => setForm({ ...form, content: value })}
          style={{ marginBottom: '15px' }}
        />

        <input type="file" onChange={handleImageChange} />

        <div style={{ marginTop: '15px' }}>
          <button type="submit" style={styles.primaryBtn}>
            {editingId ? 'Update Blog' : 'Create Blog'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={styles.secondaryBtn}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ===== SEARCH ===== */}
      <input
        placeholder="Search blog posts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />

      {/* ===== BLOG LIST ===== */}
      {paginatedBlogs.map((blog) => (
        <div key={blog.id} style={styles.card}>
          <h2>{blog.title}</h2>

          {blog.image && (
            <img
              src={blog.image}
              alt={blog.title}
              style={styles.image}
            />
          )}

          <p style={styles.meta}>
            {blog.author} • {blog.createdAt}
          </p>

          <div
            dangerouslySetInnerHTML={{
              __html: blog.content,
            }}
          />

          <div style={styles.actions}>
            <button
              onClick={() => handleEdit(blog)}
              style={styles.outlineBtn}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(blog.id)}
              style={styles.dangerBtn}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* ===== PAGINATION ===== */}
      <div style={styles.pagination}>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            style={{
              ...styles.pageBtn,
              background:
                                page === i + 1 ? '#2563eb' : '#e5e7eb',
              color: page === i + 1 ? '#fff' : '#000',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Blogs;
