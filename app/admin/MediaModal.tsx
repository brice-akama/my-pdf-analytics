'use client';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  IconButton,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';



interface MediaModalProps {
  open: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
}

const MediaModal: React.FC<MediaModalProps> = ({ open, onClose, onSelectImage }) => {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/media', { method: 'GET' });
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error('Failed to load media:', err);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;

      try {
        const res = await fetch('/api/media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64 }),
        });

        const data = await res.json();
        if (data.imageUrl) {
          await fetchImages(); // Refresh image list
          setFile(null);
        } else {
          console.error('Upload failed:', data.error);
        }
      } catch (err) {
        console.error('Error uploading file:', err);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (open) fetchImages();
  }, [open]);

  


  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          p: 4,
          bgcolor: 'background.paper',
          borderRadius: 2,
          maxWidth: 800,
          mx: 'auto',
          mt: 10,
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            color: 'red',
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" mb={2}>
          Media Library
        </Typography>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={handleUpload}
          sx={{ mt: 2 }}
          disabled={!file || loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Upload Image'}
        </Button>

        {file && (
          <Box mt={2}>
            <Typography variant="subtitle2">Preview:</Typography>
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
            />
          </Box>
        )}

        <Typography variant="subtitle1" mt={4}>
          Select an image:
        </Typography>

        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
  <Grid container spacing={2} mt={2}>
    {images.map((img) => (
      <Grid item xs={4} key={img.id}>
        <Box
          onClick={() => {
            onSelectImage(img.url);
            onClose();
          }}
          sx={{
            cursor: 'pointer',
            borderRadius: 2,
            border: '2px solid #ccc',
            padding: 1,
            textAlign: 'center',
          }}
        >
          <img
            src={img.url}
            alt="Media"
            style={{ width: '100%', borderRadius: 8 }}
          />
          <Typography
            variant="caption"
            sx={{
              wordBreak: 'break-all',
              display: 'block',
              mt: 1,
              fontSize: '0.75rem',
              color: 'gray',
            }}
          >
            {img.url}
          </Typography>
        </Box>
      </Grid>
    ))}
  </Grid>
</Box>

      </Box>
    </Modal>
  );
};

export default MediaModal;