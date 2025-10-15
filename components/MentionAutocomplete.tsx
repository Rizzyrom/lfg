'use client'

import { useEffect, useState, useRef } from 'react'

interface GroupMember {
  id: string
  username: string
}

interface MentionAutocompleteProps {
  query: string
  onSelect: (username: string) => void
  onClose: () => void
  position: { top: number; left: number }
}

export default function MentionAutocomplete({
  query,
  onSelect,
  onClose,
  position,
}: MentionAutocompleteProps) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch group members
    const fetchMembers = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/chat/members?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setMembers(data.members || [])
        }
      } catch (error) {
        console.error('Failed to fetch members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [query])

  useEffect(() => {
    // Reset selected index when members change
    setSelectedIndex(0)
  }, [members])

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (members.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % members.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + members.length) % members.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (members[selectedIndex]) {
          onSelect(members[selectedIndex].username)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [members, selectedIndex, onSelect, onClose])

  useEffect(() => {
    // Scroll selected item into view
    if (dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (loading) {
    return (
      <div
        className="fixed z-50 bg-tv-panel border border-tv-grid rounded-lg elevation-2 p-3"
        style={{ top: position.top, left: position.left }}
      >
        <p className="text-tv-text-soft text-sm">Loading...</p>
      </div>
    )
  }

  if (members.length === 0) {
    return null
  }

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-tv-panel border border-tv-grid rounded-lg elevation-3 overflow-hidden max-h-48 overflow-y-auto"
      style={{ top: position.top, left: position.left, minWidth: '200px' }}
    >
      {members.map((member, index) => (
        <button
          key={member.id}
          onClick={() => onSelect(member.username)}
          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
            index === selectedIndex
              ? 'bg-tv-chip text-tv-text font-medium'
              : 'text-tv-text hover:bg-tv-hover'
          }`}
        >
          <span className="font-medium">@{member.username}</span>
        </button>
      ))}
    </div>
  )
}
