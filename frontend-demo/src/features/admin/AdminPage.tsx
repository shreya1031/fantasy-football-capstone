import { useState } from 'react';
import { MotionPage } from '../../design/primitives/Stat';
import { Panel } from '../../design/primitives/Panel';
import { DataTable } from '../../design/primitives/DataTable';
import { BadgeChip } from '../../design/primitives/BadgeChip';
import { Button } from '../../design/primitives/Button';
import { LoadingState, ErrorState } from '../../design/primitives/States';
import {
  useAdminUsers,
  useAdminLeagues,
  useAdminDeleteUser,
  useAdminDeleteLeague,
  useAdminRemoveMember,
} from '../../lib/hooks';
import { useAuthStore } from '../../lib/authStore';
import { getErrorMessage } from '../../lib/errors';
import type { AdminUser, AdminLeague } from '../../lib/types';

function ownerLabel(owner: AdminLeague['owner']) {
  return typeof owner === 'string' ? owner : `${owner.displayName} (${owner.email})`;
}

export function AdminPage() {
  const { user } = useAuthStore();
  const currentUserId = user?._id ?? user?.id;

  const { data: users, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useAdminUsers();
  const { data: leagues, isLoading: leaguesLoading, error: leaguesError, refetch: refetchLeagues } = useAdminLeagues();

  const deleteUser = useAdminDeleteUser();
  const deleteLeague = useAdminDeleteLeague();
  const removeMember = useAdminRemoveMember();

  const [actionError, setActionError] = useState('');

  const handleDeleteUser = async (u: AdminUser) => {
    if (!window.confirm(`Delete ${u.email}? Their teams, memberships, scores, and owned leagues will be permanently removed.`)) return;
    setActionError('');
    try {
      await deleteUser.mutateAsync(u._id);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleDeleteLeague = async (l: AdminLeague) => {
    if (!window.confirm(`Delete league "${l.name}" (${l.code})? All memberships will be removed.`)) return;
    setActionError('');
    try {
      await deleteLeague.mutateAsync(l._id);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleRemoveMember = async (l: AdminLeague, membershipId: string, label: string) => {
    if (!window.confirm(`Remove ${label} from "${l.name}"?`)) return;
    setActionError('');
    try {
      await removeMember.mutateAsync({ leagueId: l._id, membershipId });
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const userColumns = [
    {
      key: 'user',
      header: 'User',
      render: (u: AdminUser) => (
        <div>
          <p className="font-medium">{u.displayName}</p>
          <p className="text-xs text-[var(--fg-2)]">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: AdminUser) => (
        <BadgeChip tone={u.role === 'admin' ? 'amber' : 'muted'}>{u.role ?? 'user'}</BadgeChip>
      ),
    },
    { key: 'teams', header: 'Teams', render: (u: AdminUser) => u.teamCount },
    { key: 'leagues', header: 'Leagues', render: (u: AdminUser) => u.leagueCount },
    {
      key: 'joined',
      header: 'Joined',
      render: (u: AdminUser) => (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u: AdminUser) =>
        u._id === currentUserId ? (
          <BadgeChip tone="green">you</BadgeChip>
        ) : (
          <Button
            variant="ghost"
            className="text-xs text-red-600 hover:bg-red-50"
            onClick={() => handleDeleteUser(u)}
            disabled={deleteUser.isPending}
          >
            Delete
          </Button>
        ),
    },
  ];

  return (
    <MotionPage className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="font-body text-sm font-medium text-[var(--accent-green)]">Admin</p>
        <h1 className="font-display text-3xl font-bold">Site Administration</h1>
        <p className="font-body text-sm text-[var(--fg-2)]">Manage users, leagues, and memberships.</p>
      </header>

      {actionError && <p className="text-sm text-[var(--accent-orange)]">{actionError}</p>}

      <Panel title={`Users${users ? ` (${users.length})` : ''}`}>
        {usersLoading ? (
          <LoadingState message="Loading users" />
        ) : usersError ? (
          <ErrorState message="Failed to load users" onRetry={() => refetchUsers()} />
        ) : (
          <DataTable
            columns={userColumns}
            rows={users ?? []}
            keyField={(u) => u._id}
            emptyMessage="No users"
          />
        )}
      </Panel>

      <Panel title={`Leagues${leagues ? ` (${leagues.length})` : ''}`}>
        {leaguesLoading ? (
          <LoadingState message="Loading leagues" />
        ) : leaguesError ? (
          <ErrorState message="Failed to load leagues" onRetry={() => refetchLeagues()} />
        ) : !leagues?.length ? (
          <p className="py-8 text-center font-body text-sm text-[var(--fg-2)]">No leagues</p>
        ) : (
          <ul className="space-y-3">
            {leagues.map((l) => (
              <li key={l._id} className="rounded-lg border border-[var(--panel-border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold">
                      {l.name}{' '}
                      <span className="font-stat text-sm text-[var(--accent-green)]">{l.code}</span>
                    </p>
                    <p className="font-body text-xs text-[var(--fg-2)]">
                      Owner: {ownerLabel(l.owner)} · Season {l.season}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-xs text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteLeague(l)}
                    disabled={deleteLeague.isPending}
                  >
                    Delete League
                  </Button>
                </div>
                {l.members.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {l.members.map((m) => {
                      const label = m.user?.displayName ?? 'Unknown user';
                      return (
                        <li
                          key={m._id}
                          className="flex items-center gap-1.5 rounded-full border border-[var(--panel-border)] bg-[var(--bg-0)]/60 py-1 pl-3 pr-1.5 font-body text-xs"
                        >
                          <span>
                            {label}
                            {m.teamRef ? ` · ${m.teamRef.name}` : ''}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${label}`}
                            className="rounded-full px-1.5 py-0.5 text-red-600 hover:bg-red-50"
                            onClick={() => handleRemoveMember(l, m._id, label)}
                            disabled={removeMember.isPending}
                          >
                            ✕
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </MotionPage>
  );
}
