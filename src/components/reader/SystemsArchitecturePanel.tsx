import { FileCode } from 'lucide-react';
import type { CodeReference } from '../../lib/curriculum';
import { MarkdownView } from '../MarkdownView';

interface SystemsArchitecturePanelProps {
  legacyLayout?: boolean;
  codeReferences: CodeReference[];
  implementationChoices: string[];
  codeWalkthrough: string;
}

export function SystemsArchitecturePanel({
  legacyLayout = false,
  codeReferences,
  implementationChoices,
  codeWalkthrough
}: SystemsArchitecturePanelProps) {
  return (
    <section style={{ marginBottom: '36px' }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', marginBottom: '16px' }}>
        {legacyLayout ? '4. Systems & Implementation Architecture' : 'Implementation'}
      </h2>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        {codeReferences.map((ref, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '14px 18px',
              background: 'var(--surface)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px'
              }}
            >
              <FileCode size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 650 }}>
                <code>
                  {ref.crate}/{ref.filePath}
                </code>
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
              <strong>Key patterns & symbols:</strong> {ref.symbols.map((s) => `\`${s}\``).join(', ')}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink)' }}>{ref.purpose}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
          Algorithmic & Engineering Choices:
        </h4>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.7' }}>
          {implementationChoices.map((choice, i) => (
            <li key={i}>{choice}</li>
          ))}
        </ul>
      </div>

      <MarkdownView source={codeWalkthrough} />
    </section>
  );
}
