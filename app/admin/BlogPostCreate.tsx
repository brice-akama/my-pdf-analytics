"use client";

import React from "react";
import {
  Create,
  SimpleForm,
  TextInput,
  DateInput,
  CreateProps,
  useNotify,
  useRedirect,
} from "react-admin";
import { RichTextInput } from "ra-input-rich-text";

const BlogPostCreate: React.FC<CreateProps> = (props) => {
  const [file, setFile] = React.useState<File | null>(null);
  const notify = useNotify();
  const redirect = useRedirect();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleSubmit = async (values: any) => {
    const formData = new FormData();

    formData.append("title", values.title || "");
    formData.append("content", values.content || "");
    formData.append("metaTitle", values.metaTitle || "");
    formData.append("metaDescription", values.metaDescription || "");
    formData.append("author", values.author || "");
    formData.append("category", values.category || "");

    if (file) formData.append("image", file);

    try {
      const response = await fetch("/api/blog", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        notify("Blog post created successfully", { type: "success" });
        redirect("/blog");
      } else {
        throw new Error("Failed to create blog post");
      }
    } catch {
      notify("Error creating blog post", { type: "error" });
    }
  };

  return (
    <Create {...props}>
      <SimpleForm onSubmit={handleSubmit}>
        <TextInput source="author" label="Author" fullWidth />
        <TextInput source="category" label="Category" fullWidth />

        <TextInput source="title" label="Title" fullWidth />
        <RichTextInput source="content" label="Content" fullWidth />

        <TextInput source="metaTitle" label="Meta Title" fullWidth />
        <TextInput
          source="metaDescription"
          label="Meta Description"
          multiline
          fullWidth
        />

        <input type="file" accept="image/*" onChange={handleFileChange} />

        <DateInput source="createdAt" label="Created At" defaultValue={new Date()} />

        <button type="submit">Create Blog Post</button>
      </SimpleForm>
    </Create>
  );
};

export default BlogPostCreate;
