import { ArrowUpRight, FileText } from 'lucide-react';
import type { Element, Root, RootContent } from 'hast';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import ReactMarkdown, { type ExtraProps, type Options } from 'react-markdown';
import { Link } from 'react-router-dom';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { StudyDocument } from '../lib/content';
import { resolvePaperUrls } from '../lib/paperUtils';
import { usePdfViewer } from '../lib/pdfViewerContext';

interface MarkdownViewProps {
  source: string;
  doc?: StudyDocument;
  className?: string;
  allowImages?: boolean;
  insertions?: readonly MarkdownInsertion[];
}

export type MarkdownInsertion = { afterHeading?: string; content: ReactNode };

declare module 'hast' {
  interface ElementData {
    markdownInsertion?: MarkdownInsertion;
  }
}

function MarkdownDiv({ node, ...props }: ComponentPropsWithoutRef<'div'> & ExtraProps) {
  const insertion = node?.data?.markdownInsertion;
  return insertion ? insertion.content : <div {...props} />;
}

function headingLevel(node: RootContent) {
  return node.type === 'element' && /^h[1-6]$/.test(node.tagName) ? Number(node.tagName[1]) : Infinity;
}

function rehypeInsertSections(insertions: readonly MarkdownInsertion[]) {
  return (tree: Root) => {
    const sections = new Map<number, Element[]>();
    for (const insertion of insertions) {
      const { afterHeading } = insertion;
      const heading = afterHeading
        ? tree.children.findIndex(
            (node) =>
              node.type === 'element' &&
              node.properties.id === afterHeading &&
              headingLevel(node) !== Infinity
          )
        : -1;
      const next =
        heading === -1
          ? -1
          : tree.children.findIndex(
              (node, i) => i > heading && headingLevel(node) <= headingLevel(tree.children[heading])
            );
      const position = next < 0 ? tree.children.length : next;
      const slot: Element = {
        type: 'element',
        tagName: 'div',
        properties: {},
        data: { markdownInsertion: insertion },
        children: []
      };
      const slots = sections.get(position) ?? [];
      slots.push(slot);
      sections.set(position, slots);
    }
    const tail = sections.get(tree.children.length) ?? [];
    tree.children = tree.children.flatMap((node, i) => [...(sections.get(i) ?? []), node]).concat(tail);
  };
}

export function MarkdownView({
  source,
  doc,
  className = '',
  allowImages = true,
  insertions
}: MarkdownViewProps) {
  const { openPaper } = usePdfViewer();
  const rehypePlugins: NonNullable<Options['rehypePlugins']> = [rehypeSlug, rehypeKatex];
  if (insertions?.length) rehypePlugins.push([rehypeInsertSections, insertions]);

  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={rehypePlugins}
        components={{
          ...(insertions?.length ? { div: MarkdownDiv } : {}),
          img({ src, alt }) {
            return allowImages ? <img src={src} alt={alt || ''} /> : <span>{alt || 'Image omitted'}</span>;
          },
          a({ href = '', children }) {
            const target = doc?.links[href];
            if (target?.kind === 'unavailable') {
              return (
                <span
                  className="local-reference"
                  title="This reference belongs to the local Markdown notebook"
                >
                  {children}
                </span>
              );
            }
            if (target && ['document', 'notes', 'path', 'progress'].includes(target.kind)) {
              return <Link to={target.href}>{children}</Link>;
            }
            if (href.startsWith('#')) {
              return (
                <a
                  href={href}
                  onClick={(event) => {
                    event.preventDefault();
                    document
                      .getElementById(decodeURIComponent(href.slice(1)))
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {children}
                </a>
              );
            }
            const url = target?.href ?? href;
            if (/^https?:/.test(url)) {
              const paper = resolvePaperUrls(url, undefined, String(children));
              if (paper) {
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <a href={url} target="_blank" rel="noreferrer">
                      {children}
                      <ArrowUpRight className="external-mark" size={12} aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openPaper(paper);
                      }}
                      style={{
                        background: 'var(--soft)',
                        border: '1px solid var(--line)',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '10px',
                        fontWeight: 650,
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        lineHeight: 1.4
                      }}
                      title="Open paper in embedded PDF viewer"
                    >
                      <FileText size={10} />
                      <span>PDF</span>
                    </button>
                  </span>
                );
              }

              return (
                <a href={url} target="_blank" rel="noreferrer">
                  {children}
                  <ArrowUpRight className="external-mark" size={12} aria-hidden="true" />
                </a>
              );
            }
            return <a href={url}>{children}</a>;
          },
          table({ children }) {
            return (
              <div className="table-scroll">
                <table>{children}</table>
              </div>
            );
          },
          pre({ children }) {
            return <pre tabIndex={0}>{children}</pre>;
          }
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
