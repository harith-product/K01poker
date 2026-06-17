import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2 } from 'lucide-react';
import { getMembers, addMember, updateMemberName } from '../../lib/adminData';
import type { Member } from '../../lib/adminData';
import { useToast } from '../../lib/useToast';
import { Toast } from './Toast';

interface ManageMembersProps {
  onBack: () => void;
}

type Sheet = 'none' | 'add' | 'edit';

export function ManageMembers({ onBack }: ManageMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [sheet, setSheet] = useState<Sheet>('none');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const { message, toast } = useToast();

  function loadMembers() { getMembers().then(setMembers); }
  useEffect(() => { loadMembers(); }, []);

  async function handleAdd() {
    if (!newName.trim()) { toast('Enter a name', 'error'); return; }
    try {
      await addMember(newName.trim());
      toast(`${newName.trim()} added!`);
      setNewName(''); setSheet('none'); loadMembers();
    } catch { toast('Failed to add member', 'error'); }
  }

  async function handleEdit() {
    if (!editingId || !editingName.trim()) { toast('Enter a name', 'error'); return; }
    try {
      await updateMemberName(editingId, editingName.trim());
      toast('Name updated!');
      setEditingId(null); setEditingName(''); setSheet('none'); loadMembers();
    } catch { toast('Failed to update name', 'error'); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <Toast message={message} />
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-gray-900 text-2xl font-bold">Manage Members</h1>
        </div>
        <button onClick={() => { setNewName(''); setSheet('add'); }}
          className="w-full py-3 mb-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold rounded-2xl flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Member
        </button>
        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">All Members</p>
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <span className="text-gray-900 font-bold text-base">{m.name}</span>
              <button onClick={() => { setEditingId(m.id); setEditingName(m.name); setSheet('edit'); }}
                className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Edit2 className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {sheet !== 'none' && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheet('none')} />
          <div className="relative bg-white rounded-t-3xl p-6 max-w-lg w-full mx-auto">
            {sheet === 'add' && (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Add Member</h2>
                <p className="text-gray-500 text-sm mb-4">Enter the name of the new member</p>
                <label className="block text-sm text-gray-700 mb-2">Member name</label>
                <input autoFocus type="text" placeholder="Enter name" value={newName}
                  onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-violet-400 mb-6" />
                <div className="flex gap-3">
                  <button onClick={() => setSheet('none')} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium">Cancel</button>
                  <button onClick={handleAdd} className="flex-1 py-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl">Add</button>
                </div>
              </>
            )}
            {sheet === 'edit' && (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Rename Member</h2>
                <p className="text-gray-500 text-sm mb-4">Edit the member's name</p>
                <label className="block text-sm text-gray-700 mb-2">Member name</label>
                <input autoFocus type="text" placeholder="Enter name" value={editingName}
                  onChange={e => setEditingName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEdit()}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-violet-400 mb-6" />
                <div className="flex gap-3">
                  <button onClick={() => setSheet('none')} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium">Cancel</button>
                  <button onClick={handleEdit} className="flex-1 py-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl">Confirm</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
