'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';


import { Admin, Resource } from "react-admin";
import customDataProvider from "../../lib/dataProvider"; // Go back two levels to access the lib folder

 
 
 
 

import BlogPostList from "./BlogPostList";
import BlogPostShow from "./BlogPostShow";
import BlogPostCreate from "./BlogPostCreate";
import BlogPostEdit from "./BlogPostEdit";
import ArticleIcon from '@mui/icons-material/Article'
import CustomLogin from "./CustomLogin";
import { authProvider } from "./authProvider";
import CustomLayout from "./CustomLayout";




const AdminPage = () => {
  

  

  return (
    <Admin  authProvider={authProvider} loginPage={CustomLogin}   dataProvider={customDataProvider} layout={CustomLayout}>
      
      
    
      
       <Resource name="blog" list={BlogPostList} show={BlogPostShow} edit={BlogPostEdit} create={BlogPostCreate} icon={() => <ArticleIcon sx={{ color: "red" }} />} />
   

   

  


    

      

      
      
       
    </Admin>
  );
};

export default AdminPage;