'use client';

import { useState, useEffect } from 'react';
import { FolderTree, PlusCircle, Trash2, PhoneCall, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface GroupItem {
  id: string;
  name: string;
  totalContacts: number;
  createdAt: string;
  _count?: { contacts: number };
}

import { useAuth } from '@/context/AuthContext';
import { getAuthHeaders, getActiveUserId, getActiveUserRole } from '@/lib/api';

export default function GroupsPage() {
  const { activeUser } = useAuth();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
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
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [activeUser?.id]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    setSubmitting(true);
    try {
      const uid = activeUser?.id || getActiveUserId();
      const res = await fetch('/api/audience/groups', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newGroupName, userId: uid }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewGroupName('');
        fetchGroups();
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group? All contacts within it will be removed.')) return;
    try {
      await fetch(`/api/audience/groups/${id}`, { method: 'DELETE' });
      fetchGroups();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-brand-400" /> Contact Groups
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Segment your contacts into target groups for scheduled voice broadcasting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchGroups}
            disabled={loading}
            className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20"
          >
            <PlusCircle className="w-4 h-4" /> Create New Group
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 text-sm glass-panel rounded-2xl border border-gray-800">
            {loading ? 'Loading groups...' : 'No contact groups found. Click "Create New Group" to get started.'}
          </div>
        ) : (
          groups.map((g) => {
            const count = g._count?.contacts ?? g.totalContacts ?? 0;
            return (
              <div
                key={g.id}
                className="p-5 rounded-2xl glass-panel border border-gray-800 hover:border-brand-500/40 transition space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
                      {count.toLocaleString()} Numbers
                    </span>
                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      className="p-1 rounded text-gray-500 hover:text-rose-400 transition"
                      title="Delete group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{g.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">ID: {g.id.slice(0, 16)}...</p>
                </div>
                <div className="pt-3 border-t border-gray-800/80 flex justify-between items-center text-xs text-gray-500">
                  <span>Created: {new Date(g.createdAt).toLocaleDateString()}</span>
                  <Link
                    href={`/campaigns`}
                    className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Broadcast
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-brand-400" /> Create Contact Group
            </h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Retailers Dhaka"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white"
                >
                  {submitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
