'use client';

import { useState } from 'react';

interface NotesPanelProps {
  notes: any[];
  onAddNote: (message: string) => void;
}

export default function NotesPanel({ notes, onAddNote }: NotesPanelProps) {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim()) return;

    setIsAdding(true);
    await onAddNote(newNote);
    setNewNote('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Review Notes</h3>

      {/* Add Note */}
      <div className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={!newNote.trim() || isAdding}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isAdding ? 'Adding...' : 'Add Note'}
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500">No notes yet</p>
        ) : (
          notes.map((note: any) => (
            <div key={note.id} className="border-l-2 border-blue-500 pl-3 py-2 bg-gray-50 rounded">
              <div className="text-sm text-gray-900">{note.message}</div>
              <div className="text-xs text-gray-500 mt-1">
                Admin #{note.adminId} • <span className="en-digits">{new Date(note.createdAt).toLocaleDateString('en-GB')} {new Date(note.createdAt).toLocaleTimeString('en-GB', { hour12: false })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
