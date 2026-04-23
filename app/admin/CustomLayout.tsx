 'use client';

// app/admin/CustomLayout.tsx
//
// CHANGE FROM YOUR ORIGINAL:
//   Added `menu={CustomMenu}` prop — plugs the sidebar menu in.
//   Your CustomAppBar is completely untouched.

import { Layout, LayoutProps } from 'react-admin';
import CustomAppBar from './CustomAppBar';
import CustomMenu from './CustomMenu';

const CustomLayout = (props: LayoutProps) => (
  <Layout
    {...props}
    appBar={CustomAppBar}
    menu={CustomMenu}
  />
);

export default CustomLayout;