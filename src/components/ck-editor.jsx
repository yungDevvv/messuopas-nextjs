"use client"

import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Code,
  Link,
  List,
  Indent,
  IndentBlock,
  BlockQuote,
  Heading,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  ImageResize,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  HorizontalLine,
  Alignment,
  FontColor,
  FontBackgroundColor,
  FontSize,
  FontFamily,
  Undo,
  PasteFromOffice,
  RemoveFormat,
  SourceEditing
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

const CKeditor = ({ content = '', handleChange, onReady, editorType }) => {
  // Editor configuration
  const editorConfig = {
    licenseKey: 'GPL', // Use GPL license for open source projects
    plugins: [
      Essentials,
      Paragraph,
      Bold,
      Italic,
      Underline,
      Strikethrough,
      Subscript,
      Superscript,
      Code,
      Link,
      List,
      Indent,
      IndentBlock,
      BlockQuote,
      Heading,
      Image,
      ImageCaption,
      ImageStyle,
      ImageToolbar,
      ImageUpload,
      ImageResize,
      Table,
      TableToolbar,
      TableProperties,
      TableCellProperties,
      HorizontalLine,
      Alignment,
      FontColor,
      FontBackgroundColor,
      FontSize,
      FontFamily,
      Undo,
      PasteFromOffice,
      RemoveFormat,
      SourceEditing
    ],
    toolbar: {
      items: [
        'heading', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'fontColor', 'fontBackgroundColor', '|',
        'fontSize', 'fontFamily', '|',
        'alignment', '|',
        'numberedList', 'bulletedList', '|',
        'outdent', 'indent', '|',
        'blockQuote', 'code', '|',
        'link', 'insertImage', 'insertTable', 'horizontalLine', '|',
        'subscript', 'superscript', '|',
        'removeFormat', '|',
        'undo', 'redo', '|',
        'sourceEditing'
      ],
      shouldNotGroupWhenFull: true
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
        { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
        { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
      ]
    },
    fontSize: {
      options: [
        9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36
      ]
    },
    fontFamily: {
      options: [
        'default',
        'Arial, Helvetica, sans-serif',
        'Courier New, Courier, monospace',
        'Georgia, serif',
        'Lucida Sans Unicode, Lucida Grande, sans-serif',
        'Tahoma, Geneva, sans-serif',
        'Times New Roman, Times, serif',
        'Trebuchet MS, Helvetica, sans-serif',
        'Verdana, Geneva, sans-serif'
      ]
    },
    image: {
      toolbar: [
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
        '|',
        'toggleImageCaption',
        'imageTextAlternative',
        '|',
        'imageResize'
      ],
      resizeOptions: [
        {
          name: 'imageResize:original',
          label: 'Original size',
          value: null
        },
        {
          name: 'imageResize:50',
          label: '50%',
          value: '50'
        },
        {
          name: 'imageResize:75',
          label: '75%',
          value: '75'
        }
      ]
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        'tableProperties',
        'tableCellProperties'
      ]
    },
    link: {
      decorators: {
        openInNewTab: {
          mode: 'manual',
          label: 'Open in a new tab',
          attributes: {
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        }
      }
    },
    list: {
      properties: {
        styles: true,
        startIndex: true,
        reversed: true
      }
    },
    initialData: content
  };

  // Handle editor ready event
  const handleEditorReady = (editor) => {
    if (onReady) {
      onReady(editor);
    }
  };

  // Handle editor change event
  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    if (handleChange) {
      // Maintain compatibility with existing API
      handleChange(event, { getData: () => data }, data);
    }
  };

  // Handle editor error
  const handleEditorError = (error, { phase, willEditorRestart }) => {
    console.error('CKEditor error:', error);
    console.error('Error phase:', phase);
    console.error('Will editor restart:', willEditorRestart);
  };

  return (
    <div className="border rounded-md bg-white">
      <CKEditor
        editor={ClassicEditor}
        config={editorConfig}
        data={content}
        onReady={handleEditorReady}
        onChange={handleEditorChange}
        onError={handleEditorError}
        
      />
    </div>
  );
};

export default CKeditor;