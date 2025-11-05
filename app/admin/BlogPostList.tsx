import React from "react";
import {
  List,
  Datagrid,
  TextField,
  DateField,
  EditButton,
  DeleteButton,
  ListProps,
  ShowButton,
} from "react-admin";

const BlogPostList: React.FC<ListProps> = (props) => (
  <List {...props} perPage={10}>
    <Datagrid rowClick="edit">
      <TextField source="title" label="Title" />
      <TextField source="author" label="Author" />
      <TextField source="category" label="Category" />
      <DateField source="createdAt" label="Created At" />
      <EditButton />
      <DeleteButton />
      <ShowButton />
    </Datagrid>
  </List>
);

export default BlogPostList;
