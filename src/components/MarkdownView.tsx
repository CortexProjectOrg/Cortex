import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { StudyDocument } from '../lib/content';

interface MarkdownViewProps {
  source: string;
  doc?: StudyDocument;
  className?: string;
}

export function MarkdownView({ source, doc, className = '' }: MarkdownViewProps) {
  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeSlug, rehypeKatex]}
        components={{
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
                  onClick={event => {
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
