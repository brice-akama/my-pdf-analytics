import React from "react";
import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  ShowProps,
} from "react-admin";

const BlogPostShow: React.FC<ShowProps> = (props) => {
  return (
    <Show {...props}>
      <SimpleShowLayout>
        <TextField source="author" label="Author" />
        <TextField source="category" label="Category" />
        <TextField source="title" label="Title" />
        <TextField source="content" label="Content" />
        <TextField source="metaTitle" label="Meta Title" />
        <TextField source="metaDescription" label="Meta Description" />
        <DateField source="createdAt" label="Created At" />
      </SimpleShowLayout>
    </Show>
  );
};

export default BlogPostShow;
