'use client'

// app/admin/users/UsersPage.tsx
//
// WHAT THIS FILE DOES:
//   Wrapper that manages navigation between UserList and UserDetail.
//   When an admin clicks a user row → shows UserDetail.
//   When they click "back" → returns to UserList (preserving filters).

import { useState } from 'react'
import UserList from './UserList'
import UserDetail from './UserDetail'

export default function UsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  if (selectedUserId) {
    return (
      <UserDetail
        userId={selectedUserId}
        onBack={() => setSelectedUserId(null)}
      />
    )
  }

  return <UserList onSelectUser={id => setSelectedUserId(id)} />
}