// ─────────────────────────────────────────────────────────────
// Tiptap Article Editor Client Engine (ESM CDN based)
// ─────────────────────────────────────────────────────────────

import { Editor, Node } from 'https://esm.sh/@tiptap/core@2.2.4';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2.2.4';
import Image from 'https://esm.sh/@tiptap/extension-image@2.2.4';
import Link from 'https://esm.sh/@tiptap/extension-link@2.2.4';
import Underline from 'https://esm.sh/@tiptap/extension-underline@2.2.4';
import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder@2.2.4';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─────────────────────────────────────────────────────────────
// Custom CTA Button Node Extension
// ─────────────────────────────────────────────────────────────
export const CtaButton = Node.create({
  name: 'ctaButton',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      text: {
        default: '지원하기'
      },
      url: {
        default: 'https://daangnservice.career.greetinghr.com/'
      },
      align: {
        default: 'center'
      },
      target: {
        default: '_blank'
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.article-cta-wrap',
        getAttrs: (dom) => {
          const a = dom.querySelector('a.article-cta-btn') || dom.querySelector('a');
          return {
            text: a ? a.textContent.trim() : '지원하기',
            url: a ? (a.getAttribute('href') || '#') : '#',
            align: dom.style.textAlign || 'center',
            target: a ? (a.getAttribute('target') || '_blank') : '_blank'
          };
        }
      },
      {
        tag: 'a.article-cta-btn',
        getAttrs: (dom) => ({
          text: dom.textContent.trim() || '지원하기',
          url: dom.getAttribute('href') || '#',
          align: 'center',
          target: dom.getAttribute('target') || '_blank'
        })
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes.align || 'center';
    const text = HTMLAttributes.text || '지원하기';
    const url = HTMLAttributes.url || '#';
    const target = HTMLAttributes.target || '_blank';

    return [
      'div',
      {
        class: 'article-cta-wrap',
        style: `text-align: ${align}; margin: 36px 0;`
      },
      [
        'a',
        {
          href: url,
          target: target,
          rel: 'noopener noreferrer',
          class: 'article-cta-btn'
        },
        text
      ]
    ];
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.className = 'article-cta-wrap tiptap-cta-view';
      dom.style.textAlign = node.attrs.align || 'center';
      dom.style.margin = '28px 0';
      dom.style.position = 'relative';

      const btn = document.createElement('a');
      btn.className = 'article-cta-btn';
      btn.textContent = node.attrs.text || '지원하기';
      btn.href = '#';
      btn.title = '클릭하여 버튼 문구 및 링크 수정';

      const metaBadge = document.createElement('div');
      metaBadge.className = 'cta-meta-badge';
      metaBadge.innerHTML = `<span class="cta-link-preview">🔗 ${escapeHtml(node.attrs.url || '')}</span> <span class="cta-edit-btn">✏️ 수정</span>`;

      dom.appendChild(btn);
      dom.appendChild(metaBadge);

      function openEdit() {
        if (typeof window.openCtaButtonModal === 'function') {
          window.openCtaButtonModal({
            attrs: node.attrs,
            onSave: (newAttrs) => {
              if (typeof getPos === 'function') {
                const pos = getPos();
                editor.chain().focus().setNodeSelection(pos).command(({ tr }) => {
                  tr.setNodeMarkup(pos, undefined, newAttrs);
                  return true;
                }).run();
              }
            },
            onDelete: () => {
              if (typeof getPos === 'function') {
                const pos = getPos();
                editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
              }
            }
          });
        }
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openEdit();
      });

      metaBadge.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openEdit();
      });

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== 'ctaButton') return false;
          btn.textContent = updatedNode.attrs.text || '지원하기';
          dom.style.textAlign = updatedNode.attrs.align || 'center';
          metaBadge.innerHTML = `<span class="cta-link-preview">🔗 ${escapeHtml(updatedNode.attrs.url || '')}</span> <span class="cta-edit-btn">✏️ 수정</span>`;
          return true;
        }
      };
    };
  }
});

export function createTiptapEditor(options = {}) {
  const {
    element,
    toolbarElement,
    initialContent = '',
    placeholder = '당근서비스 구성원과 독자들에게 전하고 싶은 생생한 이야기를 작성해 보세요...',
    onUpdate
  } = options;

  if (!element) {
    throw new Error('Editor target element is required');
  }

  // Parse initial content safely (JSON string or HTML string)
  let content = initialContent;
  if (typeof content === 'string' && content.trim().startsWith('{')) {
    try {
      content = JSON.parse(content);
    } catch (e) {
      console.warn('Failed to parse content as JSON, using as HTML string', e);
    }
  }

  const editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'article-body-image'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      CtaButton
    ],
    content,
    autofocus: false,
    editorProps: {
      attributes: {
        class: 'tiptap-content'
      },
      handlePaste(view, event, slice) {
        const text = event.clipboardData?.getData('text/plain');
        if (!text || text.trim().length === 0) return false;

        // Check if clipboard contains Markdown indicators (from Notion export, .md file, etc.)
        const isMarkdown = (
          /^#{1,6}\s+.+/m.test(text) ||
          /^\s*[-*+]\s+.+/m.test(text) ||
          /^\s*\d+\.\s+.+/m.test(text) ||
          /^\s*>\s+.+/m.test(text) ||
          /\[.*?\]\(https?:\/\/.*?\)/.test(text) ||
          /!\[.*?\]\(.*?\)/.test(text) ||
          /\*\*.*?\*\*/.test(text) ||
          /```[\s\S]*?```/.test(text) ||
          /^\s*---+\s*$/m.test(text)
        );

        if (isMarkdown && (window.marked || typeof marked !== 'undefined')) {
          event.preventDefault();
          try {
            const parser = window.marked || marked;
            const parsedHtml = parser.parse(text);
            editor.commands.insertContent(parsedHtml);
            return true;
          } catch (err) {
            console.error('Markdown parse error during paste:', err);
            return false;
          }
        }

        return false;
      }
    },
    onUpdate({ editor }) {
      syncToolbarState();
      updateWordCount();
      if (typeof onUpdate === 'function') {
        onUpdate({
          json: editor.getJSON(),
          html: editor.getHTML(),
          isEmpty: editor.isEmpty
        });
      }
    },
    onSelectionUpdate() {
      syncToolbarState();
    }
  });

  // Wire toolbar buttons if toolbar container provided
  if (toolbarElement) {
    bindToolbarEvents(editor, toolbarElement);
  }

  function syncToolbarState() {
    if (!toolbarElement) return;

    const actionMap = {
      'bold': () => editor.isActive('bold'),
      'italic': () => editor.isActive('italic'),
      'underline': () => editor.isActive('underline'),
      'strike': () => editor.isActive('strike'),
      'h1': () => editor.isActive('heading', { level: 1 }),
      'h2': () => editor.isActive('heading', { level: 2 }),
      'h3': () => editor.isActive('heading', { level: 3 }),
      'paragraph': () => editor.isActive('paragraph'),
      'bulletList': () => editor.isActive('bulletList'),
      'orderedList': () => editor.isActive('orderedList'),
      'blockquote': () => editor.isActive('blockquote'),
      'link': () => editor.isActive('link')
    };

    Object.keys(actionMap).forEach((key) => {
      const btn = toolbarElement.querySelector(`[data-action="${key}"]`);
      if (btn) {
        if (actionMap[key]()) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      }
    });

    const undoBtn = toolbarElement.querySelector('[data-action="undo"]');
    if (undoBtn) undoBtn.disabled = !editor.can().undo();

    const redoBtn = toolbarElement.querySelector('[data-action="redo"]');
    if (redoBtn) redoBtn.disabled = !editor.can().redo();
  }

  function updateWordCount() {
    const countEl = document.getElementById('tiptapWordCount');
    if (countEl) {
      const text = editor.getText();
      const chars = text.length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      countEl.textContent = `${chars.toLocaleString()}자 · ${words.toLocaleString()} 단어`;
    }
  }

  // Initial updates
  syncToolbarState();
  updateWordCount();

  return {
    editor,
    getJSON: () => editor.getJSON(),
    getHTML: () => editor.getHTML(),
    getText: () => editor.getText(),
    isEmpty: () => editor.isEmpty,
    setContent: (newContent) => editor.commands.setContent(newContent),
    focus: () => editor.commands.focus(),
    destroy: () => editor.destroy()
  };
}

function bindToolbarEvents(editor, toolbar) {
  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.preventDefault();

    const action = btn.getAttribute('data-action');

    switch (action) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'strike':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'horizontalRule':
        editor.chain().focus().setHorizontalRule().run();
        break;
      case 'link': {
        const prevUrl = editor.getAttributes('link').href;
        const url = window.prompt('연결할 링크 URL을 입력하세요 (https://...):', prevUrl || '');
        if (url === null) return;
        if (url === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
          const finalUrl = url.match(/^https?:\/\//i) ? url : 'https://' + url;
          editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
        }
        break;
      }
      case 'cta-button': {
        if (typeof window.openCtaButtonModal === 'function') {
          window.openCtaButtonModal({
            attrs: {
              text: '지원하기',
              url: 'https://daangnservice.career.greetinghr.com/',
              align: 'center',
              target: '_blank'
            },
            onSave: (attrs) => {
              editor.chain().focus().insertContent({
                type: 'ctaButton',
                attrs
              }).run();
            }
          });
        }
        break;
      }
      case 'markdown-import': {
        if (typeof window.openMarkdownImportModal === 'function') {
          window.openMarkdownImportModal((markdownText) => {
            if (!markdownText) return;
            const parser = window.marked || (typeof marked !== 'undefined' ? marked : null);
            if (parser) {
              const html = parser.parse(markdownText);
              editor.commands.insertContent(html);
            } else {
              editor.commands.insertContent(markdownText);
            }
          });
        }
        break;
      }
      case 'image-upload': {
        const fileInput = document.getElementById('tiptapImageInput');
        if (fileInput) fileInput.click();
        break;
      }
      case 'image-url': {
        const url = window.prompt('삽입할 이미지 URL을 입력하세요:');
        if (url && url.trim()) {
          editor.chain().focus().setImage({ src: url.trim(), alt: '아티클 이미지' }).run();
        }
        break;
      }
      case 'undo':
        editor.chain().focus().undo().run();
        break;
      case 'redo':
        editor.chain().focus().redo().run();
        break;
    }
  });

  // Handle file input upload
  const fileInput = document.getElementById('tiptapImageInput');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success && data.url) {
          editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
        } else {
          alert('이미지 업로드에 실패했습니다: ' + (data.error || '오류 발생'));
        }
      } catch (err) {
        console.error('Image upload failed', err);
        alert('이미지 업로드 중 네트워크 오류가 발생했습니다.');
      } finally {
        fileInput.value = '';
      }
    });
  }
}

window.createTiptapEditor = createTiptapEditor;
