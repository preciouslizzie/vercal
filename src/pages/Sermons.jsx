import React, { useEffect, useState } from 'react';
import { UploadWidget } from '@bytescale/upload-widget';
import { Header } from '../components';
import API from '../api/api';

const Sermons = () => {
  const [title, setTitle] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sermons, setSermons] = useState([]);
  const uploadAudio = async () => {
    console.log('UPLOAD FUNCTION CALLED');

    return new Promise((resolve, reject) => {
      UploadWidget.open({
        apiKey: process.env.REACT_APP_BYTESCALE_KEY,
        maxFileCount: 1,
        mimeTypes: ['audio/*'],

        onComplete: (files) => {
          console.log('BYTESCALE FILES:', files);

          if (!files || files.length === 0) {
            reject(new Error('Upload cancelled'));
            return;
          }

          const file = files[0];

          resolve({
            fileUrl: file.fileUrl, // ✅ public CDN URL
            filePath: file.filePath,
            etag: file.etag,
          });
        },

        onError: (error) => {
          reject(error);
        },
      });
    });
  };

  //  Load Sermons
  const loadSermons = async () => {
    const res = await API.getSermons();
    setSermons(res.data);
  };

  useEffect(() => {
    loadSermons();
  }, []);

  // ================= Submit Sermon =================
  const submitSermon = async () => {
    if (!title || !audioFile) {
      alert('Title and audio are required');
      return;
    }

    try {
      setLoading(true);

      const audioData = await uploadAudio();
      console.log(audioData);

      await API.post('/audio', {
        title,
        audio_url: audioData.fileUrl,
        file_path: audioData.filePath,
        etag: audioData.etag,
      });

      setTitle('');
      setAudioFile(null);
      await loadSermons();
    } catch (error) {
      console.log(error.response?.data);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };
  const deleteSermon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sermon?')) return;

    await API.deleteSermon(id);
    loadSermons();
  };

  return (
    <div className="m-2 md:m-10 mt-24 p-6 bg-white rounded-3xl">
      <Header category="Ministry" title="Sermons & Teachings" />

      {/* Upload Form */}
      <div className="space-y-4 mb-6">
        <input
          className="border p-2 rounded w-full"
          placeholder="Sermon Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setAudioFile(e.target.files[0])}
        />

        <button
          type="button"
          onClick={submitSermon}
          className="bg-indigo-600 text-white px-6 py-2 rounded"
        >
          {loading ? 'Publishing...' : 'Publish Sermon'}
        </button>
      </div>

      {/* Sermon List */}
      <div className="space-y-4">
        {sermons.map((s) => (
          <div key={s.id} className="border p-4 rounded">
            <h3 className="font-bold text-lg">{s.title}</h3>

            {s.audio_url && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio controls className="mt-3 w-full">
              <source src={s.audio_url} />
            </audio>
            )}

            <button
              type="button"
              onClick={() => deleteSermon(s.id)}
              className="mt-3 text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sermons;
