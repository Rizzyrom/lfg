'use client'

import { useState, useEffect } from 'react'

interface Group {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: {
    memberships: number
  }
}

interface Invite {
  id: string
  token: string
  groupId: string | null
  createdById: string
  createdAt: string
  expiresAt: string | null
}

export default function GroupsClient({ userId }: { userId: string }) {
  const [groups, setGroups] = useState<Group[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateInvite, setShowCreateInvite] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [groupsRes, invitesRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/invites')
      ])

      if (groupsRes.ok) {
        const data = await groupsRes.json()
        setGroups(data.groups || [])
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json()
        setInvites(data.invites || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) return

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc || null
        })
      })

      if (res.ok) {
        setNewGroupName('')
        setNewGroupDesc('')
        setShowCreateGroup(false)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to create group:', error)
    }
  }

  const createInvite = async () => {
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: null })
      })

      if (res.ok) {
        setShowCreateInvite(false)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to create invite:', error)
    }
  }

  const copyInvite = (token: string) => {
    const url = `${window.location.origin}/register?invite=${token}`
    navigator.clipboard.writeText(url)
    alert('Invite link copied to clipboard!')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tv-text mb-2">Groups & Invites</h1>
        <p className="text-sm text-tv-text-soft">
          Manage your groups and invite new members to LFG
        </p>
      </div>

      {/* Groups Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-tv-text">Your Groups</h2>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tv-blue text-white text-sm font-medium hover:bg-tv-blue/90 transition-all active:scale-95 shadow-lg shadow-tv-blue/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Group
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-tv-chip rounded-xl animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-tv-text-soft">No groups yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <div key={group.id} className="card p-4 hover:border-tv-blue transition">
                <h3 className="text-lg font-bold text-tv-text mb-1">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-tv-text-soft mb-3">{group.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-tv-text-soft">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {group._count.memberships} members
                  </span>
                  <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invites Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-tv-text">Invite Links</h2>
          <button
            onClick={() => setShowCreateInvite(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tv-chip hover:bg-tv-hover text-tv-text text-sm font-medium transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Invite
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-tv-chip rounded-lg animate-pulse" />
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-tv-text-soft">No invites yet. Generate one to invite new members!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => (
              <div key={invite.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-tv-text">
                    {window.location.origin}/register?invite={invite.token}
                  </p>
                  <p className="text-xs text-tv-text-soft mt-1">
                    Created {new Date(invite.createdAt).toLocaleDateString()}
                    {invite.expiresAt && ` • Expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => copyInvite(invite.token)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tv-chip hover:bg-tv-hover text-tv-text text-sm font-medium transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateGroup(false)}
        >
          <div
            className="bg-tv-panel rounded-2xl shadow-2xl max-w-md w-full p-6 border border-tv-grid"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-tv-text mb-4">Create New Group</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-tv-text mb-2">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., Crypto Traders"
                  className="w-full px-4 py-3 bg-tv-chip border border-tv-grid rounded-lg text-tv-text placeholder-tv-text-soft focus:outline-none focus:border-tv-blue transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-tv-text mb-2">Description (optional)</label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="What's this group about?"
                  rows={3}
                  className="w-full px-4 py-3 bg-tv-chip border border-tv-grid rounded-lg text-tv-text placeholder-tv-text-soft focus:outline-none focus:border-tv-blue transition resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 px-4 py-3 rounded-lg bg-tv-chip hover:bg-tv-hover text-tv-text font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  disabled={!newGroupName.trim()}
                  className="flex-1 px-4 py-3 rounded-lg bg-tv-blue text-white font-medium hover:bg-tv-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-tv-blue/30"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invite Modal */}
      {showCreateInvite && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateInvite(false)}
        >
          <div
            className="bg-tv-panel rounded-2xl shadow-2xl max-w-md w-full p-6 border border-tv-grid"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-tv-text mb-4">Generate Invite Link</h3>
            <p className="text-sm text-tv-text-soft mb-6">
              Create a new invite link that can be shared with others to join LFG.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateInvite(false)}
                className="flex-1 px-4 py-3 rounded-lg bg-tv-chip hover:bg-tv-hover text-tv-text font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createInvite}
                className="flex-1 px-4 py-3 rounded-lg bg-tv-blue text-white font-medium hover:bg-tv-blue/90 transition-all shadow-lg shadow-tv-blue/30"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
