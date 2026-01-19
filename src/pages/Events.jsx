import React, { useEffect, useState } from 'react';
import { getEvents, createEvent, deleteEvent } from '../api/api';

function Events() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    name: '',
    event: '',
    date: '',
    time: '',
    venue: '',
    picture: null,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const res = await getEvents();
    setEvents(res.data);
  };

  const handleCreate = async () => {
    try {
      const formData = new FormData();

      formData.append('name', form.name);
      formData.append('events', form.event);
      formData.append('date', form.date);
      formData.append('time', form.time);
      formData.append('venue', form.venue);

      if (form.picture) {
        formData.append('picture', form.picture);
      }

      await createEvent(formData);

      setForm({
        name: '',
        event: '',
        date: '',
        time: '',
        venue: '',
        picture: null,
      });

      loadEvents();
    } catch (error) {
      console.error(
        'Error creating event:',
        error.response ? error.response.data : error.message,
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await deleteEvent(id);
    loadEvents();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📅 Events</h2>

      {/* ===== CREATE EVENT ===== */}
      <div className="space-y-3 mb-6">
        <input
          className="border p-2 w-full rounded"
          placeholder="Event name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <textarea
          className="border p-2 w-full rounded"
          placeholder="Event description"
          value={form.events}
          onChange={(e) => setForm({ ...form, event: e.target.value })}
        />

        <input
          type="date"
          className="border p-2 w-full rounded"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <input
          type="time"
          className="border p-2 w-full rounded"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        />

        <input
          className="border p-2 w-full rounded"
          placeholder="Venue"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
        />

        <input
          type="file"
          accept="image/*"
          className="border p-2 w-full rounded"
          onChange={(e) => setForm({ ...form, picture: e.target.files[0] })}
        />

        <button
          onClick={handleCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded"
        >
          Create Event
        </button>
      </div>

      {/* ===== EVENT LIST ===== */}
      {events.map((event) => (
        <div
          key={event.id}
          className="border rounded p-4 mb-4 shadow-sm"
        >
          <h4 className="font-bold text-lg">{event.name}</h4>

          <p className="text-sm text-gray-600">
            {event.date} @ {event.time} | {event.venue}
          </p>

          <p className="mt-2">{event.event}</p>

          {event.picture && (
            <img
              src={event.picture}
              alt={event.name}
              className="mt-3 w-full max-h-64 object-cover rounded"
            />
          )}

          <button
            onClick={() => handleDelete(event.id)}
            className="mt-3 text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default Events;
