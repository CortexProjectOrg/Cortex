// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TopicBrowser } from '../src/components/TopicBrowser';
import { SearchModal } from '../src/components/SearchModal';
import { TOPICS } from '../src/lib/curriculumCatalog';
import { emptyWorkspace } from '../src/lib/model';
import { discoverTopics, getTopicSubfield, matchesStudyQuery, SUBFIELDS } from '../src/lib/topicDiscovery';

const workspace = vi.hoisted(() => ({ data: {} }));
vi.mock('../src/lib/workspace', () => ({ useWorkspace: () => workspace }));
beforeEach(() => {
  workspace.data = emptyWorkspace();
  Element.prototype.scrollIntoView = vi.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterEach(cleanup);

describe('topic discovery', () => {
  it('assigns every current topic to exactly one existing main subfield', () => {
    const assigned = SUBFIELDS.flatMap((field) => [...field.topicIds]);
    expect(new Set(assigned).size).toBe(assigned.length);
    expect([...assigned].sort()).toEqual(TOPICS.map((topic) => topic.id).sort());
    for (const topic of TOPICS) expect(getTopicSubfield(topic.id).topicIds).toContain(topic.id);
  });

  it('finds subfields, lecture concepts, and multiword searches regardless of case or punctuation', () => {
    expect(discoverTopics(' GROUP THEORY ').map((topic) => topic.id)).toEqual([
      'abstract-algebra',
      'pauli-group',
      'clifford-operations'
    ]);
    expect(discoverTopics('complexity theory').map((topic) => topic.id)).toEqual([
      'classical-complexity',
      'quantum-complexity'
    ]);
    expect(discoverTopics('grover').map((topic) => topic.id)).toEqual(['quantum-algorithms']);
    expect(discoverTopics('bayes', 'probability').map((topic) => topic.id)).toContain(
      'probability-estimation'
    );
    expect(discoverTopics('grover', 'probability')).toEqual([]);
    expect(matchesStudyQuery('  schrodinger   time-evolution ', 'Schrödinger time evolution')).toBe(true);
    expect(discoverTopics('?!')).toEqual([]);
  });

  it('filters topics, opens their lectures, and recovers from an empty result', () => {
    render(
      <MemoryRouter initialEntries={['/topics']}>
        <TopicBrowser />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Probability & statistics.*2 topics/ }));
    expect(screen.getByRole('status').textContent).toContain('2 topics in Probability & statistics');
    expect(screen.queryByRole('region', { name: 'Group theory & algebra' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Probability and estimation.*4 lectures/ }));
    expect(screen.getByRole('link', { name: /Conditional Probability and Bayes/ }).getAttribute('href')).toBe(
      '/topics/probability-estimation/L89-conditional-probability-bayes'
    );
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search topics and lectures' }), {
      target: { value: 'doesnotexist' }
    });
    expect(screen.getByRole('heading', { name: 'No topics found' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show all topics' }));
    expect(screen.getByRole('status').textContent).toContain('26 topics across all subfields');
  });

  it('opens existing hash links and respects a subfield from the URL', () => {
    render(
      <MemoryRouter initialEntries={['/topics?field=complexity#quantum-complexity']}>
        <TopicBrowser />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('button', { name: /Complexity theory.*2 topics/ }).getAttribute('aria-pressed')
    ).toBe('true');
    expect(
      screen
        .getByRole('button', { name: /Quantum computational complexity.*4 lectures/ })
        .getAttribute('aria-expanded')
    ).toBe('true');
    expect(screen.getByRole('link', { name: /BQP, PP, and Quantum Circuit Cost/ })).toBeTruthy();
  });
});

describe('global study search', () => {
  it('focuses the search field and ranks subfield matches before incidental full-text mentions', () => {
    render(
      <MemoryRouter>
        <SearchModal open onClose={vi.fn()} />
      </MemoryRouter>
    );
    const input = screen.getByRole('textbox', { name: 'Search all study material' });
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: 'complexity theory' } });
    const lectures = within(screen.getByRole('region', { name: 'Lecture results' })).getAllByRole('link');
    expect(lectures[0].getAttribute('href')).toContain('/classical-complexity/');
  });

  it('offers subfield shortcuts before typing and finds matching topics alongside lectures', () => {
    const close = vi.fn();
    render(
      <MemoryRouter>
        <SearchModal open onClose={close} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Probability & statistics' }).getAttribute('href')).toBe(
      '/topics?field=probability'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Group theory' }));
    const topics = screen.getByRole('region', { name: 'Topic results' });
    expect(within(topics).getAllByRole('link')).toHaveLength(3);
    const target = within(topics).getByRole('link', { name: /Groups and fields/ });
    expect(target.getAttribute('href')).toBe('/topics?field=algebra#abstract-algebra');
    fireEvent.click(target);
    expect(close).toHaveBeenCalledOnce();
  });

  it('lets users see all lecture matches and keep searching references and personal notes', () => {
    const data = emptyWorkspace();
    data.notes.push({
      id: 'my-note',
      title: 'My Bayesian notes',
      body: 'A probability reminder',
      createdAt: '2026-11-21T08:00:00Z',
      updatedAt: '2026-11-21T08:00:00Z'
    });
    workspace.data = data;
    render(
      <MemoryRouter>
        <SearchModal open onClose={vi.fn()} />
      </MemoryRouter>
    );
    const input = screen.getByRole('textbox', { name: 'Search all study material' });
    fireEvent.change(input, { target: { value: 'group theory' } });
    expect(within(screen.getByRole('region', { name: 'Lecture results' })).getAllByRole('link')).toHaveLength(
      4
    );
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Lecture results' })).getByRole('button', {
        name: /View all/
      })
    );
    expect(
      within(screen.getByRole('region', { name: 'Lecture results' })).getAllByRole('link').length
    ).toBeGreaterThan(4);
    expect(screen.queryByRole('region', { name: 'Topic results' })).toBeNull();
    fireEvent.change(input, { target: { value: 'bayesian' } });
    fireEvent.click(screen.getByRole('button', { name: /Notes.*1/ }));
    expect(screen.getByRole('link', { name: /My Bayesian notes/ }).getAttribute('href')).toBe(
      '/notes/my-note'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('link', { name: 'Geometry' })).toBeTruthy();
  });
});
