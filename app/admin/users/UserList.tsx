'use client'

import { useState, useEffect } from 'react'

interface UserListProps {
  onSelectUser?: (id: string) => void
}

export default function UserList({ onSelectUser }: UserListProps) {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(res => setUsers(res.data || []))
  }, [])

  return (
    <div>
      {users.map(u => (
        <div key={u.id} onClick={() => onSelectUser?.(u.id)}>
          {u.name}
        </div>
      ))}
    </div>
  )
}