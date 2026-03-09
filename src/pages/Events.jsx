import React, { useEffect, useState } from 'react';
import API from '../api/api'; // Corrected the import for the default export
import { createEvent } from '../api/api'; // Importing the createEvent function

function Event() {
  const [event, setEvent] = useState([]);
  const [form, setForm] = useState({
    name: '',
    event: '',
    date: '',
    time: '',
    venue: '',
    picture: null,
  });
  const [isCreating, setIsCreating] = useState(false); // State to track loading

  useEffect(() => {
    // No need to load events since the GET method is not supported for /api/admin/event
  }, []);

  const handleCreate = async () => {
    setIsCreating(true); // Set loading state to true
    try {
      // Validation: Ensure all required fields are filled
      if (!form.name || !form.event || !form.date || !form.time || !form.venue) {
        console.error('All fields are required.');
        alert('Please fill in all required fields.');
        setIsCreating(false);
        return;
      }

      const formData = new FormData();

      formData.append('name', form.name);
      formData.append('event', form.event); // Ensure the correct field name is used
      formData.append('date', form.date);
      formData.append('time', form.time);
      formData.append('venue', form.venue);

      if (form.picture) {
        formData.append('picture', form.picture);
      }

      console.log('Form Data:', Object.fromEntries(formData.entries())); // Log form data for debugging

      const response = await createEvent(formData); // Use POST method to create event

      setForm({
        name: '',
        event: '',
        date: '',
        time: '',
        venue: '',
        picture: null,
      });

      // Manually add the created event to the state
      setEvent((prevEvent) => [...prevEvent, response.data]);
    } catch (error) {
      console.error(
        'Error creating event:',
        error.response ? error.response.data : error.message,
      );
      alert(error.response?.data?.message || 'Failed to create event.');
    } finally {
      setIsCreating(false); // Reset loading state
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await deleteEvent(id);
    setEvent((prevEvent) => prevEvent.filter((event) => event.id !== id));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📅 Event</h2>

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
          value={form.event}
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
          className={`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isCreating} // Disable button while loading
        >
          {isCreating ? 'Creating...' : 'Create Event'}
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
