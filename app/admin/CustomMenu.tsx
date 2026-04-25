'use client';

import { Menu } from 'react-admin';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CampaignIcon from '@mui/icons-material/Campaign';
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import FeedbackIcon from '@mui/icons-material/Feedback';

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

    <Menu.Item
      to="/announcements"
      primaryText="Announcements"
      leftIcon={<CampaignIcon />}
    />
    <Menu.Item
  to="/support"
  primaryText="Support"
  leftIcon={<SupportAgentIcon />}
/>
 <Menu.Item
  to="/feedback"
  primaryText="Feedback"
  leftIcon={<FeedbackIcon />}
/>
  </Menu>
);

export default CustomMenu;