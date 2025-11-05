
// app/admin/page.tsx
'use client';

import dynamic from 'next/dynamic';

const AdminApp = dynamic(() => import('./AdminApp'), { ssr: false });

export default function AdminPage() {
  return <AdminApp />;
}