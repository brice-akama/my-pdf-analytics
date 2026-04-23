'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// app/admin/AdminApp.tsx
//
// CHANGES FROM PREVIOUS VERSION:
//   Added two new custom pages:
//     1. UsersPage — User Management (list + detail)
//     2. DocumentsPage — Document Analytics
//
//   These are registered as custom routes using React Admin's <CustomRoutes>
//   because they talk to /api/admin/* directly rather than going through
//   your dataProvider (which is scoped to user-facing resources like blog).
//
//   Everything else — authProvider, dataProvider, layout, CustomLogin,
//   the blog Resource, DashboardPage — is completely untouched.

import { Admin, Resource, CustomRoutes } from 'react-admin'
import { Route } from 'react-router-dom'
import customDataProvider from '../../lib/dataProvider'

import BlogPostList from './BlogPostList'
import BlogPostShow from './BlogPostShow'
import BlogPostCreate from './BlogPostCreate'
import BlogPostEdit from './BlogPostEdit'
import ArticleIcon from '@mui/icons-material/Article'

import CustomLogin from './CustomLogin'
import { authProvider } from './authProvider'
import CustomLayout from './CustomLayout'
import DashboardPage from './DashboardPage'

// ── New admin pages ────────────────────────────────────────────
import UsersPage from './users/UsersPage'
import DocumentsPage from './documents/DocumentsPage'

const AdminApp = () => {
  return (
    <Admin
      dashboard={DashboardPage}
      authProvider={authProvider}
      loginPage={CustomLogin}
      dataProvider={customDataProvider}
      layout={CustomLayout}
    >
      {/* Existing resource — untouched */}
      <Resource
        name="blog"
        list={BlogPostList}
        show={BlogPostShow}
        edit={BlogPostEdit}
        create={BlogPostCreate}
        icon={() => <ArticleIcon sx={{ color: 'red' }} />}
      />

      {/* New admin-only custom routes */}
      {/* These don't go through dataProvider — they fetch /api/admin/* directly */}
      <CustomRoutes>
        <Route path="/users" element={<UsersPage />} />
        <Route path="/documents-analytics" element={<DocumentsPage />} />
      </CustomRoutes>
    </Admin>
  )
}

export default AdminApp