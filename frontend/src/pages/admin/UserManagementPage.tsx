import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/index.js';
import { Button } from '../../components/common/Button.js';
import { Badge } from '../../components/common/Badge.js';
import { Users, Shield, UserCheck, Stethoscope, Search, CheckCircle2, XCircle } from 'lucide-react';
import { User, Role } from '../../types/index.js';

export const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', roleFilter, search],
    queryFn: () => adminApi.getUsers({ role: roleFilter || undefined, search: search || undefined }),
  });

  const users = usersData?.data || [];

  const toggleStatusMutation = useMutation({
    mutationFn: (data: { userId: string; isActive: boolean }) => adminApi.toggleUserStatus(data.userId, data.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update user status.');
    },
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Access & Security</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">User Directory & RBAC</h1>
        <p className="text-xs text-slate-500 mt-1">Manage accounts, toggle active authorizations, and audit system permissions.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex gap-2">
            {['', 'PATIENT', 'DOCTOR', 'ADMIN'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === r
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r || 'All Roles'}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading accounts...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={u.role === 'ADMIN' ? 'purple' : u.role === 'DOCTOR' ? 'info' : 'default'}
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                          <XCircle className="w-3.5 h-3.5" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant={u.isActive ? 'outline' : 'primary'}
                        size="sm"
                        className="text-xs"
                        onClick={() => toggleStatusMutation.mutate({ userId: u.id, isActive: !u.isActive })}
                        isLoading={toggleStatusMutation.isPending}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate Account'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
