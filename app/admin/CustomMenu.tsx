'use client';

// app/admin/CustomMenu.tsx
//
// WHAT THIS FILE DOES:
//   Adds the sidebar navigation menu to the React Admin layout.
//   Includes all existing resources plus the two new custom pages:
//   Users and Document Analytics.
//
// HOW IT WORKS:
//   React Admin's <Menu> renders the sidebar. <Menu.Item> for Resources
//   uses the resource name. For CustomRoutes we use <Menu.Item> with
//   a direct "to" path — that's the only way to link to custom routes
//   in the sidebar.

import { Menu } from 'react-admin';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const CustomMenu = () => (
  <Menu>
    {/* Overview dashboard — React Admin's built-in dashboard link */}
    <Menu.DashboardItem />

    {/* Existing blog resource */}
    <Menu.Item
      to="/blog"
      primaryText="Blog"
      leftIcon={<ArticleIcon sx={{ color: 'red' }} />}
    />

    {/* New: User Management */}
    <Menu.Item
      to="/users"
      primaryText="Users"
      leftIcon={<PeopleIcon />}
    />

    {/* New: Document Analytics */}
    <Menu.Item
      to="/documents-analytics"
      primaryText="Documents"
      leftIcon={<InsertDriveFileIcon />}
    />
  </Menu>
);

export default CustomMenu;