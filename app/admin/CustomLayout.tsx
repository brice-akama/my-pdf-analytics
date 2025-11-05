'use client';
import { Layout, LayoutProps } from 'react-admin'; // Import LayoutProps
import CustomAppBar from './CustomAppBar';
  // Import your CustomAppBar

const CustomLayout = (props: LayoutProps) => (
  <Layout {...props} appBar={CustomAppBar} />
);

export default CustomLayout;