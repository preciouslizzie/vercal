import React, { useEffect, useState } from 'react';
import { getEvents, createEvent, deleteEvent } from '../api/api';

function Events() {
  const [events, setEvents] = useState([]);
  const [file] = useState(null);
  const [form, setForm] = useState({
    name: '',
    event: '',
    date: '',
    time: '',
    venue: '',
    picture: '',
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getEvents();
    setEvents(res.data);
  };

  const handleCreate = async () => {
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('event', form.description);
    formData.append('date', form.date);
    formData.append('time', form.time);
    formData.append('venue', form.venue);
    formData.append('picture', file);
    if (form.picture) {
      formData.append('picture', form.picture);
    }

    await createEvent(formData);

    setForm({ name: '', event: '', date: '', time: '', picture: null });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await deleteEvent(id);
    await load();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Events</h2>

      <div className="space-y-2 mb-6">
        <input
          className="border p-2 w-full"
          placeholder="Event name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          placeholder="Event description"
          value={form.event}
          onChange={(e) => setForm({ ...form, event: e.target.value })}
        />

        <input
          type="date"
          className="border p-2 w-full"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <input
          type="time"
          className="border p-2 w-full"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setForm({ ...form, picture: e.target.files[0] })}
          className="border p-2 w-full"
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Vene"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
        />

        <button
          type="button"
          onClick={handleCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Create Event
        </button>
      </div>

      {events.map((e) => (
        <div key={e.id} className="border p-4 mb-3 rounded">
          <h4 className="font-bold">{e.title}</h4>
          <p className="text-sm">
            {e.date} @ {e.time} | {e.venue}
          </p>
          <p className="mt-2">{e.description}</p>

          <button
            type="button"
            onClick={() => handleDelete(e.id)}
            className="mt-2 text-red-600"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default Events;
