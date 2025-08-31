"use client"

import 'ckeditor5/ckeditor5.css';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { useEffect, useRef, useState } from 'react';
import {
   ClassicEditor,
   AccessibilityHelp,
   Alignment,
   Autoformat,
   AutoImage,
   AutoLink,
   Autosave,
   BlockQuote,
   Bold,
   CloudServices,
   Essentials,
   FontBackgroundColor,
   FontColor,
   FontFamily,
   FontSize,
   GeneralHtmlSupport,
   Heading,
   ImageBlock,
   ImageCaption,
   ImageInline,
   ImageInsert,
   ImageInsertViaUrl,
   ImageResize,
   ImageStyle,
   ImageTextAlternative,
   ImageToolbar,
   ImageUpload,
   Indent,
   IndentBlock,
   Italic,
   Link,
   List,
   ListProperties,
   MediaEmbed,
   Paragraph,
   SelectAll,
   SourceEditing,
   SpecialCharacters,
   Strikethrough,
   TextTransformation,
   TodoList,
   Underline,
   Undo
} from 'ckeditor5';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CKeditor = ({ content, handleChange, onReady, onAPI, editorType, uploadEnabled = true, uploadBucketId }) => {
   const [isLayoutReady, setIsLayoutReady] = useState(false);
   const [isPreview, setIsPreview] = useState(false);
   const [isHtmlDialogOpen, setIsHtmlDialogOpen] = useState(false);
   const [htmlDraft, setHtmlDraft] = useState('');
   const [currentHtml, setCurrentHtml] = useState(content ?? '');
   const editorRef = useRef(null);
   const [selectedImageFileId, setSelectedImageFileId] = useState(null);
   const pendingUploadsRef = useRef(new Map()); // tempId -> File

   useEffect(() => {
      setIsLayoutReady(true);
      return () => setIsLayoutReady(false);
   }, []);

   useEffect(() => {
      // Sync local preview when external content changes
      setCurrentHtml(content ?? '');
   }, [content]);

   // Build plugins list and filter out any undefined exports to avoid runtime errors
   const pluginsList = [
      AccessibilityHelp,
      Alignment,
      Autoformat,
      AutoImage,
      AutoLink,
      Autosave,
      BlockQuote,
      Bold,
      CloudServices,
      Essentials,
      FontBackgroundColor,
      FontColor,
      FontFamily,
      FontSize,
      GeneralHtmlSupport,
      Heading,
      ImageBlock,
      ImageCaption,
      ImageInline,
      ImageInsert,
      ImageInsertViaUrl,
      ImageResize,
      ImageStyle,
      ImageTextAlternative,
      ImageToolbar,
      ImageUpload,
      Indent,
      IndentBlock,
      Italic,
      Link,
      List,
      ListProperties,
      MediaEmbed,
      Paragraph,
      SelectAll,
      SourceEditing,
      SpecialCharacters,
      Strikethrough,
      TextTransformation,
      TodoList,
      Underline,
      Undo
   ].filter(Boolean);

   const editorConfig = {
      licenseKey: 'GPL',
      toolbar: {
         items: [
            'undo',
            'redo',
            '|',
            'heading',
            '|',
            'fontSize',
            'fontFamily',
            'fontColor',
            '|',
            'bold',
            'italic',
            'underline',
            '|',
            'alignment',
            'outdent',
            'indent',
            'bulletedList',
            'link',
            'mediaEmbed',
            'blockQuote',
            '|',
            'numberedList',
            'todoList',
            'strikethrough',
            'sourceEditing',
            '|',
            'insertImage'
         ],
         shouldNotGroupWhenFull: false
      },
      plugins: pluginsList,
      fontFamily: {
         supportAllValues: true
      },
      fontSize: {
         options: [10, 12, 14, 'default', 18, 20, 22],
         supportAllValues: true
      },
      heading: {
         options: [
            {
               model: 'paragraph',
               title: 'Paragraph',
               class: 'ck-heading_paragraph'
            },
            {
               model: 'heading1',
               view: 'h1',
               title: 'Heading 1',
               class: 'ck-heading_heading1'
            },
            {
               model: 'heading2',
               view: 'h2',
               title: 'Heading 2',
               class: 'ck-heading_heading2'
            },
            {
               model: 'heading3',
               view: 'h3',
               title: 'Heading 3',
               class: 'ck-heading_heading3'
            },
            {
               model: 'heading4',
               view: 'h4',
               title: 'Heading 4',
               class: 'ck-heading_heading4'
            },
            {
               model: 'heading5',
               view: 'h5',
               title: 'Heading 5',
               class: 'ck-heading_heading5'
            },
            {
               model: 'heading6',
               view: 'h6',
               title: 'Heading 6',
               class: 'ck-heading_heading6'
            }
         ]
      },
      htmlSupport: {
         allow: [
            {
               name: /^.*$/,
               styles: true,
               attributes: true,
               classes: true
            }
         ]
      },
      image: {
         toolbar: [
            'toggleImageCaption',
            'imageTextAlternative',
            '|',
            'imageStyle:inline',
            'imageStyle:wrapText',
            'imageStyle:breakText',
            '|',
            'resizeImage'
         ]
      },
      link: {
         addTargetToExternalLinks: true,
         defaultProtocol: 'https://',
         decorators: {
            toggleDownloadable: {
               mode: 'manual',
               label: 'Downloadable',
               attributes: {
                  download: 'file'
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
      placeholder: 'Kirjoita tai liitä sisältösi tähän!'
   };

   return (
      <>
         {isLayoutReady && (
            <div className="space-y-3">
               {/* Inline tools above editor */}
               <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => { setHtmlDraft(currentHtml || ''); setIsHtmlDialogOpen(true); }}>
                     Liitä HTML
                  </Button>
                  <Button type="button" variant={isPreview ? 'default' : 'outline'} onClick={() => setIsPreview(v => !v)}>
                     Esikatselu
                  </Button>
                  {uploadEnabled && uploadBucketId && selectedImageFileId && (
                     <Button
                        type="button"
                        variant="destructive"
                        onClick={async () => {
                           // line comments in English
                           const ok = window.confirm('Poistetaanko kuva varastosta?');
                           if (!ok) return;
                           try {
                              const res = await fetch(`/api/file/${uploadBucketId}/${selectedImageFileId}`, { method: 'DELETE' });
                              if (!res.ok) throw new Error('Delete failed');
                              // Remove the selected image element from editor
                              const editor = editorRef.current;
                              if (editor) {
                                 const model = editor.model;
                                 const selected = model.document.selection.getSelectedElement();
                                 if (selected && (selected.is('element','imageBlock') || selected.is('element','imageInline'))) {
                                    model.change(writer => {
                                       writer.remove(selected);
                                    });
                                 }
                              }
                              setSelectedImageFileId(null);
                           } catch (e) {
                              console.error(e);
                              alert('Kuvan poistaminen epäonnistui');
                           }
                        }}
                     >
                        Poista kuva varastosta
                     </Button>
                  )}
               </div>

               <CKEditor
                  editor={ClassicEditor}
                  data={content ?? ''}
                  onChange={(event, editor) => {
                     const data = editor?.getData?.() ?? '';
                     setCurrentHtml(data);
                     if (typeof handleChange === 'function') {
                        handleChange(event, editor, data);
                     }
                  }}
                  config={editorConfig}
                  onReady={editor => {
                     editorRef.current = editor;
                     // Track image selection to enable deletion button
                     const updateSelectedImage = () => {
                        try {
                           const model = editor.model;
                           const selEl = model.document.selection.getSelectedElement();
                           if (selEl && (selEl.is('element','imageBlock') || selEl.is('element','imageInline'))) {
                              const src = selEl.getAttribute('src') || '';
                              // Expect src like /api/file/<bucket>/<fileId>
                              const match = src.match(/\/api\/file\/[^\/]+\/([^\/?#]+)/);
                              setSelectedImageFileId(match ? match[1] : null);
                           } else {
                              setSelectedImageFileId(null);
                           }
                        } catch {
                           setSelectedImageFileId(null);
                        }
                     };
                     editor.model.document.selection.on('change:range', updateSelectedImage);
                     editor.model.document.selection.on('change:attribute', updateSelectedImage);
                     
                     // Install custom upload adapter (deferred mode: return blob URL, upload later on save).
                     if (uploadEnabled && uploadBucketId) {
                        // line comments in English
                        const createUploadAdapter = (loader, editorInstance) => {
                           return {
                              // Called by CKEditor to upload the file
                              upload: async () => {
                                 const file = await loader.file;
                                 // Validate file size/type before creating blob (Images: 3MB, Videos: 10MB)
                                 const mime = file?.type || '';
                                 const size = typeof file?.size === 'number' ? file.size : 0;
                                 const isImage = mime.startsWith('image/');
                                 const isVideo = mime.startsWith('video/');
                                 const MAX_IMAGE = 3 * 1024 * 1024; // 3MB
                                 const MAX_VIDEO = 10 * 1024 * 1024; // 10MB
                                 if (isImage && size > MAX_IMAGE) {
                                    throw new Error('Image exceeds 3MB limit');
                                 }
                                 if (isVideo && size > MAX_VIDEO) {
                                    throw new Error('Video exceeds 10MB limit');
                                 }
                                 if (!isImage && !isVideo && size > MAX_IMAGE) {
                                    // Fallback cap for unknown types
                                    throw new Error('File exceeds 3MB limit');
                                 }
                                 // Deferred: create blob URL and register pending file by blob URL (primary) and tempId (fallback)
                                 const tempId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
                                 const blobUrl = URL.createObjectURL(file);
                                 pendingUploadsRef.current.set(blobUrl, file);
                                 // Also keep tempId mapping in case we manage to persist it in the HTML
                                 pendingUploadsRef.current.set(tempId, file);
                                 // After image element is inserted, tag it with data-temp-id for later resolution (best-effort)
                                 setTimeout(() => {
                                    try {
                                       const ed = editorInstance || editorRef.current;
                                       if (!ed) return;
                                       const model = ed.model;
                                       model.change(writer => {
                                          const selected = model.document.selection.getSelectedElement();
                                          if (selected && (selected.is('element','imageBlock') || selected.is('element','imageInline'))) {
                                             writer.setAttribute('data-temp-id', tempId, selected);
                                          }
                                       });
                                    } catch {}
                                 }, 0);
                                 // CKEditor expects { default: url }
                                 return { default: blobUrl };
                              },
                              // Optional abort hook
                              abort: () => {}
                           };
                        };

                        const fileRepo = editor?.plugins?.get?.('FileRepository');
                        if (fileRepo) {
                           fileRepo.createUploadAdapter = (loader) => createUploadAdapter(loader, editor);
                        }
                     }
                     // Expose a helper to resolve pending uploads and rewrite blob src to SSR URLs
                     editorRef.current.resolvePendingUploads = async () => {
                        // Parse current HTML and replace images with blob/data src using uploaded URLs
                        const current = editorRef.current?.getData?.() ?? '';
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(current, 'text/html');
                        const imgs = Array.from(doc.querySelectorAll('img'));
                        try { console.debug('[RTE] resolvePendingUploads: imgs found', imgs.length); } catch {}
                        for (const img of imgs) {
                           const src = img.getAttribute('src') || '';
                           const tempId = img.getAttribute('data-temp-id');
                           const isBlob = src.startsWith('blob:') || src.startsWith('data:');
                           if (!isBlob) continue;
                           // Prefer lookup by blob URL
                           let file = pendingUploadsRef.current.get(src);
                           if (!file && tempId) file = pendingUploadsRef.current.get(tempId);
                           if (!file) { try { console.debug('[RTE] no mapping for', src, 'tempId:', tempId); } catch {}; continue; }
                           const form = new FormData();
                           form.append('upload', file);
                           try { console.debug('[RTE] uploading mapped blob', { size: file.size, type: file.type }); } catch {}
                           const res = await fetch(`/api/file/${uploadBucketId}/upload`, { method: 'POST', body: form });
                           if (!res.ok) {
                              const errText = await res.text();
                              throw new Error(`Upload failed: ${errText}`);
                           }
                           const json = await res.json();
                           const finalUrl = json.url || json.default;
                           try { if (src.startsWith('blob:')) URL.revokeObjectURL(src); } catch {}
                           img.setAttribute('src', finalUrl);
                           img.removeAttribute('data-temp-id');
                           // Cleanup both mapping keys
                           pendingUploadsRef.current.delete(src);
                           if (tempId) pendingUploadsRef.current.delete(tempId);
                        }
                        const finalHtml = doc.body.innerHTML;
                        editorRef.current.setData(finalHtml);
                        return finalHtml;
                     };
                     // Provide a small API surface to parent if requested
                     if (typeof onAPI === 'function') {
                        onAPI({
                           resolvePendingUploads: editorRef.current.resolvePendingUploads,
                           getData: () => editorRef.current?.getData?.(),
                           setData: (html) => editorRef.current?.setData?.(html),
                           editor: editorRef.current
                        });
                     }
                     if (onReady) onReady(editor);
                  }}
               />

               {isPreview && (
                  <div className="border rounded-md p-4 bg-white">
                     <div className="text-sm text-muted-foreground mb-2">Esikatselu</div>
                     <div
                        // block comments in English
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: currentHtml || '' }}
                     />
                  </div>
               )}
            </div>
         )}

         {/* HTML Paste Dialog */}
         <Dialog open={isHtmlDialogOpen} onOpenChange={setIsHtmlDialogOpen}>
            <DialogContent className="max-w-3xl">
               <DialogHeader>
                  <DialogTitle>Liitä HTML-koodi</DialogTitle>
               </DialogHeader>
               <div className="space-y-2">
                  <textarea
                     value={htmlDraft}
                     onChange={(e) => setHtmlDraft(e.target.value)}
                     className="w-full min-h-[260px] border rounded-md p-3 font-mono text-sm"
                     placeholder="Liitä valmis HTML tähän..."
                  />
               </div>
               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsHtmlDialogOpen(false)}>Peruuta</Button>
                  <Button
                     type="button"
                     onClick={() => {
                        const html = htmlDraft || '';
                        // Apply into editor and notify parent
                        if (editorRef.current) {
                           editorRef.current.setData(html);
                        }
                        setCurrentHtml(html);
                        if (typeof handleChange === 'function') {
                           handleChange(null, editorRef.current, html);
                        }
                        setIsHtmlDialogOpen(false);
                     }}
                  >
                     Liitä
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </>
   );
};

export default CKeditor;