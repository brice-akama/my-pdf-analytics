'use client';

// app/admin/CustomMenu.tsx
//
// FINAL VERSION — sidebar navigation with all four pages.

import { Menu } from 'react-admin';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CreditCardIcon from '@mui/icons-material/CreditCard';

const CustomMenu = () => (
  <Menu>
    <Menu.DashboardItem />

    <Menu.Item
      to="/blog"
      primaryText="Blog"
      leftIcon={<ArticleIcon sx={{ color: 'red' }} />}
    />

    <Menu.Item
      to="/users"
      primaryText="Users"
      leftIcon={<PeopleIcon />}
    />

    <Menu.Item
      to="/documents-analytics"
      primaryText="Documents"
      leftIcon={<InsertDriveFileIcon />}
    />

    <Menu.Item
      to="/billing"
      primaryText="Billing"
      leftIcon={<CreditCardIcon />}
    />
  </Menu>
);

export default CustomMenu;