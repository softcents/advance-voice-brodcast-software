'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileAudio,
  Upload,
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  Volume2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

interface AudioItem {
  id: string;
  title: string;
  durationSeconds: number;
  originalPath: string;
  convertedPath?: string;
  isTTS: boolean;
  ttsText?: string;
  isApproved: boolean;
  createdAt: string;
}

import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders, getActiveUserId, getActiveUserRole } from '@/lib/api';

export default function AudioStudioPage() {
  const { activeUser } = useAuth();
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTtsModal, setShowTtsModal] = useState(false);

  // Upload Form
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // TTS Form
  const [ttsTitle, setTtsTitle] = useState('');
  const [ttsText, setTtsText] = useState('হ্যালো! আমাদের বিশেষ অফারে আপনাকে স্বাগতম।');
  const [submittingTts, setSubmittingTts] = useState(false);

  const fetchAudios = async () => {
    setLoading(true);
    try {
      const uid = activeUser?.id || getActiveUserId();
      const role = activeUser?.role || getActiveUserRole();
      const query = uid && role === 'CUSTOMER' ? `?userId=${uid}` : '';
      const res = await fetch(`/api/audio${query}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setAudios(data);
      }
    } catch (err) {
      console.error('Failed to fetch audio assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudios();
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [activeUser?.id]);

  // HTML5 audio stream player
  const togglePlay = (id: string) => {
    if (playingId === id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setPlayingId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const player = new Audio(`/api/audio/${id}/stream`);
      audioPlayerRef.current = player;
      setPlayingId(id);

      player.play().catch((e) => {
        console.error('Audio playback failed:', e);
        setPlayingId(null);
      });

      player.onended = () => {
        setPlayingId(null);
        audioPlayerRef.current = null;
      };

      player.onerror = () => {
        console.error('Stream load error');
        setPlayingId(null);
        audioPlayerRef.current = null;
      };
    }
  };

  // Upload real file to Multer & FFmpeg auto-converter
  const handleUploadAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select an audio file (MP3, WAV, OGG, M4A)');
      return;
    }

    setSubmitting(true);
    setUploadError(null);

    const uid = activeUser?.id || getActiveUserId();
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title.trim() || selectedFile.name);
    if (uid) formData.append('userId', uid);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('impersonated_token') || localStorage.getItem('voicepro_token')
          : null;

      const res = await fetch('/api/audio/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.ok) {
        setShowUploadModal(false);
        setTitle('');
        setSelectedFile(null);
        fetchAudios();
      } else {
        const err = await res.json();
        setUploadError(err.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError('Network error uploading audio');
    } finally {
      setSubmitting(false);
    }
  };

  // TTS generation
  const handleGenerateTts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttsTitle || !ttsText) return;

    setSubmittingTts(true);
    try {
      const uid = activeUser?.id || getActiveUserId();
      const res = await fetch('/api/audio', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: uid,
          title: ttsTitle,
          originalPath: `audios/tts/${Date.now()}.wav`,
          durationSeconds: Math.max(8, Math.round(ttsText.length / 8)),
          isTTS: true,
          ttsText,
        }),
      });
      if (res.ok) {
        setShowTtsModal(false);
        setTtsTitle('');
        setTtsText('');
        fetchAudios();
      }
    } catch (err) {
      console.error('TTS failed:', err);
    } finally {
      setSubmittingTts(false);
    }
  };

  // Toggle approval
  const handleToggleApprove = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/audio/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });
      if (res.ok) {
        fetchAudios();
      }
    } catch (e) {
      console.error('Failed to update audio approval status');
    }
  };

  const handleDeleteAudio = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audio asset?')) return;
    try {
      if (playingId === id && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setPlayingId(null);
      }
      await fetch(`/api/audio/${id}`, { method: 'DELETE' });
      fetchAudios();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <FileAudio className="w-6 h-6 text-brand-400" /> Audio Studio & Voice Assets (অডিও ব্যবস্থাপনা)
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Upload voice broadcasts (MP3/WAV) with auto-conversion to Asterisk PBX 8kHz 16-bit Mono PCM, live browser playback, and admin approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAudios}
            disabled={loading}
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
            title="Refresh audio list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowTtsModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-200 text-xs font-semibold"
          >
            <Sparkles className="w-4 h-4 text-brand-400" /> Text to Speech (TTS)
          </button>
          <button
            onClick={() => {
              setUploadError(null);
              setShowUploadModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
          >
            <Upload className="w-4 h-4" /> Upload Audio File
          </button>
        </div>
      </div>

      {/* Audio Assets Table */}
      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-brand-400" /> Active Audio Library ({audios.length} Files)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5 font-semibold">Audio Title & Playback</th>
                <th className="p-3.5 font-semibold">Duration</th>
                <th className="p-3.5 font-semibold">Source Type</th>
                <th className="p-3.5 font-semibold">Asterisk Format</th>
                <th className="p-3.5 font-semibold">Approval Status</th>
                <th className="p-3.5 font-semibold">Created Date</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {audios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {loading ? 'Loading audio assets...' : 'No audio files found. Click "Upload Audio File" to add one.'}
                  </td>
                </tr>
              ) : (
                audios.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-800/30 transition">
                    {/* Audio Title & Play button */}
                    <td className="p-3.5 font-bold text-white flex items-center gap-2.5">
                      <button
                        onClick={() => togglePlay(a.id)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-md ${
                          playingId === a.id
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-brand-500/20 text-brand-400 hover:bg-brand-500 hover:text-white'
                        }`}
                        title={playingId === a.id ? 'Pause playback' : 'Play audio in browser'}
                      >
                        {playingId === a.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                      <div>
                        <div className="text-sm">{a.title}</div>
                        {a.ttsText && (
                          <div className="text-[10px] text-gray-400 font-normal truncate max-w-xs mt-0.5">
                            {a.ttsText}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                          ID: {a.id.substring(0, 8)}...
                        </div>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="p-3.5 font-mono text-brand-300 font-bold text-sm">
                      {a.durationSeconds}s
                    </td>

                    {/* Source */}
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.isTTS
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {a.isTTS ? 'TTS' : 'UPLOAD'}
                      </span>
                    </td>

                    {/* Asterisk Format */}
                    <td className="p-3.5 text-gray-400 font-mono text-[11px]">
                      8kHz 16-bit Mono WAV
                    </td>

                    {/* Approval Status */}
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleApprove(a.id, a.isApproved)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                          a.isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                        title="Click to toggle approval"
                      >
                        {a.isApproved ? (
                          <>
                            <Check className="w-3 h-3" /> Approved
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" /> Pending Review
                          </>
                        )}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="p-3.5 text-gray-400 text-xs">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteAudio(a.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete audio asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-400" /> Upload Voice Broadcast Audio
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadAudio} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Audio Title / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Eid Mega Sale Campaign"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Select Audio File (MP3, WAV, OGG, M4A)</label>
                <div className="border-2 border-dashed border-gray-800 hover:border-brand-500 rounded-xl p-4 text-center cursor-pointer bg-gray-950 transition">
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        if (!title) setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                      }
                    }}
                    className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500/20 file:text-brand-300 hover:file:bg-brand-500/30 cursor-pointer"
                    required
                  />
                  {selectedFile && (
                    <div className="mt-2 text-xs text-brand-400 font-medium">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Files are automatically converted by FFmpeg into 8,000Hz 16-bit Mono PCM for optimal Asterisk PBX quality.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? 'Converting & Uploading...' : 'Upload & Convert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TTS Modal */}
      {showTtsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" /> Bengali Text to Speech (TTS)
              </h3>
              <button onClick={() => setShowTtsModal(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateTts} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Welcome Message"
                  value={ttsTitle}
                  onChange={(e) => setTtsTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Bengali Message Script</label>
                <textarea
                  rows={4}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTtsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTts}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
                >
                  {submittingTts && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {submittingTts ? 'Synthesizing Audio...' : 'Generate Voice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
