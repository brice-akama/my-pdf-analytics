'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// app/admin/AdminApp.tsx
//
// FINAL VERSION — registers all four admin pages:
//   / (dashboard)       → DashboardPage    (overview metrics)
//   /users              → UsersPage        (user management)
//   /documents-analytics → DocumentsPage   (document analytics)
//   /billing            → BillingPage      (revenue & Paddle subscriptions)
//
// All custom routes fetch /api/admin/* directly — they do NOT go through
// the dataProvider. The dataProvider is only used by the blog Resource.

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

import UsersPage from './users/UsersPage'
import DocumentsPage from './documents/DocumentsPage'
import BillingPageWrapper from './billing/BillingPageWrapper'

const AdminApp = () => {
  return (
    <Admin
      dashboard={DashboardPage}
      authProvider={authProvider}
      loginPage={CustomLogin}
      dataProvider={customDataProvider}
      layout={CustomLayout}
    >
      <Resource
        name="blog"
        list={BlogPostList}
        show={BlogPostShow}
        edit={BlogPostEdit}
        create={BlogPostCreate}
        icon={() => <ArticleIcon sx={{ color: 'red' }} />}
      />

      <CustomRoutes>
        <Route path="/users"                element={<UsersPage />} />
        <Route path="/documents-analytics"  element={<DocumentsPage />} />
        <Route path="/billing"              element={<BillingPageWrapper />} />
      </CustomRoutes>
    </Admin>
  )
}

export default AdminApp