// frontend/src/app/(admin)/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { User, ShieldCheck, ShieldOff, Search } from 'lucide-react';

// Mock data for initial UI development
const mockUsers = [
  {
    id: 1,
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    country: 'USA',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '098-765-4321',
    country: 'Canada',
    isActive: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    fullName: 'Ahmed Ali',
    email: 'ahmed.ali@example.com',
    phone: '555-555-5555',
    country: 'Egypt',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [loading, setLoading] = useState(false); // Set to false since we use mock data
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In the future, you would fetch users from the API here
    // setLoading(true);
    // adminAPI.getAllUsers()
    //   .then(response => {
    //     if (response.success) setUsers(response.data);
    //   })
    //   .catch(err => console.error('Failed to fetch users', err))
    //   .finally(() => setLoading(false));
  }, []);

  const handleToggleUserStatus = (userId: number) => {
    // Placeholder for backend API call
    alert(`Toggling status for user ID: ${userId}. API call not implemented.`);
    // Optimistically update UI
    setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  };

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:flex md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <div className="mt-4 md:mt-0 relative">
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{user.fullName}</div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.country}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleUserStatus(user.id)}
                        className={`flex items-center gap-2 text-sm font-medium ${user.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                        {user.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
