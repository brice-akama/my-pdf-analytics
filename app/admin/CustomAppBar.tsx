'use client';

import { AppBar, AppBarProps } from "react-admin";

const CustomAppBar = (props: AppBarProps) => (
  <AppBar
    {...props}
    sx={{
      backgroundColor: "black", // Change this to black
      color: "white", // Text and icon color
    }}
  />
);

export default CustomAppBar;