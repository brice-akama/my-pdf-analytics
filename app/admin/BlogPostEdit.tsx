"use client";

import React, { useState, useRef } from "react";
import {
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
  EditProps,
  useNotify,
  useRedirect,
  useRecordContext,
} from "react-admin";
import { RichTextInput } from "ra-input-rich-text";
import { Button } from "@mui/material";
import MediaModal from "./MediaModal";
import type Quill from "quill";

const BlogPostEdit: React.FC<EditProps> = (props) => {
  const notify = useNotify();
  const redirect = useRedirect();
  const record = useRecordContext();
  const id = record?.id || record?._id;

  const [file, setFile] = useState<File | null>(null);
  const [openMediaModal, setOpenMediaModal] = useState(false);
  const quillRef = useRef<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleSelectImage = (imageUrl: string) => {
    const editor: Quill = quillRef.current?.getEditor();
    if (editor) {
      const range = editor.getSelection();
      if (range) {
        editor.insertEmbed(range.index, "image", imageUrl);
      }
    }
    setOpenMediaModal(false);
  };

  const handleSubmit = async (values: any) => {
    const id = values?.id || values?._id;
    if (!id) {
      notify("Cannot update blog post: ID is missing", { type: "warning" });
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title || "");
    formData.append("content", values.content || "");
    formData.append("metaTitle", values.metaTitle || "");
    formData.append("metaDescription", values.metaDescription || "");
    formData.append("author", values.author || "");
    formData.append("category", values.category || "");

    if (file) {
      formData.append("image", file);
    }

    try {
      const res = await fetch(`/api/blog?id=${id}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        notify("Blog post updated successfully", { type: "success" });
        redirect("/blog");
      } else {
        notify("Failed to update blog post", { type: "error" });
      }
    } catch (error) {
      notify("Error updating blog post", { type: "error" });
      console.error("Update error:", error);
    }
  };

  return (
    <Edit {...props}>
      <SimpleForm onSubmit={handleSubmit} record={record}>
        <TextInput source="title" label="Title" fullWidth />
        <TextInput source="author" label="Author" fullWidth />
        <TextInput source="category" label="Category" fullWidth />

        <label>Content</label>
        <RichTextInput source="content" fullWidth ref={quillRef} />

        <Button
          variant="outlined"
          onClick={() => setOpenMediaModal(true)}
          style={{ marginTop: 8 }}
        >
          Insert Image
        </Button>

        <TextInput source="metaTitle" label="Meta Title" fullWidth />
        <TextInput
          source="metaDescription"
          label="Meta Description"
          multiline
          fullWidth
        />

        <label>Upload Blog Thumbnail:</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />

        <DateInput source="createdAt" label="Created At" />

        <MediaModal
          open={openMediaModal}
          onClose={() => setOpenMediaModal(false)}
          onSelectImage={handleSelectImage}
        />
      </SimpleForm>
    </Edit>
  );
};

export default BlogPostEdit;
