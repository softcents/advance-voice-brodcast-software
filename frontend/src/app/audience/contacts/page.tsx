'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Upload, Search, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ContactItem {
  id: string;
  name: string | null;
  phoneNumber: string;
  createdAt: string;
  group?: {
    id: string;
    name: string;
  };
}

interface GroupItem {
  id: string;
  name: string;
}

import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders, getActiveUserId, getActiveUserRole } from '@/lib/api';

export default function ContactsPage() {
  const { activeUser } = useAuth();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // New Contact
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Import CSV text
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (selectedGroupId) q.append('groupId', selectedGroupId);

      const res = await fetch(`/api/audience/contacts?${q.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const uid = activeUser?.id || getActiveUserId();
      const role = activeUser?.role || getActiveUserRole();
      const query = uid && role === 'CUSTOMER' ? `?userId=${uid}` : '';
      const res = await fetch(`/api/audience/groups${query}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length > 0) setTargetGroupId(data[0].id);
        else setTargetGroupId('');
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [activeUser?.id]);

  useEffect(() => {
    fetchContacts();
  }, [search, selectedGroupId]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone || !targetGroupId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/audience/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: targetGroupId,
          name: newName,
          phoneNumber: newPhone,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewName('');
        setNewPhone('');
        fetchContacts();
      }
    } catch (err) {
      console.error('Failed to add contact:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText || !targetGroupId) return;

    setImporting(true);
    try {
      // Parse CSV lines
      const lines = csvText.split('\n');
      const parsedContacts = lines
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => {
          const parts = l.split(',');
          if (parts.length > 1) {
            return { name: parts[0].trim(), phoneNumber: parts[1].trim() };
          }
          return { phoneNumber: parts[0].trim() };
        });

      const res = await fetch('/api/audience/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: targetGroupId,
          contacts: parsedContacts,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setImportSuccess(`Successfully imported ${data.imported} contacts!`);
        setTimeout(() => {
          setImportSuccess('');
          setShowImportModal(false);
          setCsvText('');
          fetchContacts();
        }, 1500);
      }
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this contact?')) return;
    try {
      await fetch(`/api/audience/contacts/${id}`, { method: 'DELETE' });
      fetchContacts();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-400" /> Contacts Management
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage single contacts and bulk CSV phone number lists for voice broadcasting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white text-xs font-semibold"
          >
            <Upload className="w-4 h-4 text-brand-400" /> Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
          >
            <UserPlus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-gray-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name or number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 w-full"
              />
            </div>

            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchContacts}
              disabled={loading}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-400' : ''}`} />
            </button>
            <span className="text-xs text-gray-400">
              Total: <strong className="text-white">{contacts.length}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-800">
              <tr>
                <th className="py-3 px-4 font-bold">Contact Name</th>
                <th className="py-3 px-4 font-bold">Phone Number</th>
                <th className="py-3 px-4 font-bold">Group</th>
                <th className="py-3 px-4 font-bold">Added Date</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    {loading ? 'Loading contacts...' : 'No contacts found.'}
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-900/40">
                    <td className="py-3 px-4 font-medium text-white">{c.name || 'Unnamed'}</td>
                    <td className="py-3 px-4 font-mono text-gray-300">{c.phoneNumber}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {c.group?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
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

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-400" /> Add New Contact
            </h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tanvir Ahmed"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Phone Number (E.164)</label>
                <input
                  type="text"
                  placeholder="+8801711223344"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Contact Group</label>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  required
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white"
                >
                  {submitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-brand-400" /> Import Contacts from CSV / Text
            </h3>
            <form onSubmit={handleImportCsv} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Target Group</label>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  required
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">
                  Upload CSV / TXT File (Optional)
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setCsvText((event.target?.result as string) || '');
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="w-full text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500/20 file:text-brand-300 hover:file:bg-brand-500/30 cursor-pointer mb-3"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">
                  Contacts Data (Paste Name,Number per line or review uploaded file)
                </label>
                <textarea
                  rows={6}
                  placeholder={`Tanvir Ahmed,+8801711223344\nShakil Hossain,+8801819283746\n+8801912345678`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              {importSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {importSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white"
                >
                  {importing ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
