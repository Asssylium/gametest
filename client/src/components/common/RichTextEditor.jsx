import React from 'react';
import { Box, Typography } from '@mui/material';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import { uploadFiles } from '../../utils/uploadThing.js';

class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then((file) => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await uploadFiles('gameImageUploader', {
            files: [file],
          });

          if (response && response.length > 0) {
            resolve({
              default: response[0].url,
            });
          } else {
            reject('Lỗi: Server không trả về đường dẫn ảnh.');
          }
        } catch (error) {
          console.error('UploadThing Error:', error);
          reject(error.message || 'Lỗi khi tải ảnh lên máy chủ.');
        }
      });
    });
  }

  abort() {}
}

function MyCustomUploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return new MyUploadAdapter(loader);
  };
}

export default function RichTextEditor({ label, value, onChange }) {
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {label && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}

      <Box
        sx={{
          '& .ck-editor__editable': {
            minHeight: '250px',
            color: 'text.primary',
            fontSize: '1rem',
          },
        }}
      >
        <CKEditor
          editor={ClassicEditor}
          data={value || ''}
          config={{
            extraPlugins: [MyCustomUploadAdapterPlugin],
          }}
          onChange={(event, editor) => {
            const data = editor.getData();
            onChange(data);
          }}
        />
      </Box>
    </Box>
  );
}
