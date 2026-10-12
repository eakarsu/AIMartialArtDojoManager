import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import NativeWorkflowStudio from './NativeWorkflowStudio';
import NativeAIReport from './components/NativeAIReport';
import nativeWorkflowConfig from './nativeWorkflowConfig.json';

let host, root;
global.IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); localStorage.clear(); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); jest.restoreAllMocks(); });
const render = async node => { await act(async () => root.render(node)); };
const click = async button => { await act(async () => button.dispatchEvent(new MouseEvent('click', { bubbles: true }))); };

test('demo button fills credentials without posting login', async () => {
  const requests = [];
  global.fetch = jest.fn(async (url, options) => { requests.push([url, options?.method || 'GET']); return { ok: true, json: async () => ({ email: 'fixture@example.test', password: 'fixture-password' }) }; });
  await render(<App />);
  await click([...host.querySelectorAll('button')].find(button => button.textContent === 'Fill Demo Credentials'));
  expect(host.querySelector('input[type=email]').value).toBe('fixture@example.test');
  expect(host.querySelector('input[type=password]').value).toBe('fixture-password');
  expect(requests).toEqual([['/api/auth/demo-credentials', 'GET']]);
  expect(localStorage.getItem('authToken')).toBeNull();
});

test('presets fill optional text and real record without generation', async () => {
  const calls = [];
  const request = async path => { calls.push(path); return path === '/api/students' ? [{ id: 42, first_name: 'Fixture' }] : path === '/api/ai/history?limit=20' ? { data: [] } : []; };
  const config = { title: 'Fixture', resources: [{ key: 'students', endpoint: '/api/students', label: 'Students', fields: [] }], features: [{ id: 'fixture', title: 'Fixture AI', endpoint: '/api/ai/fixture', fields: [{ key: 'student_id', label: 'Student', required: true, resource: 'students' }, { key: 'details', label: 'Details', required: false, presets: ['First sample', 'Second sample', 'Third sample'] }] }] };
  await render(<NativeWorkflowStudio config={config} request={request} />);
  for (const [index, sample] of ['First sample', 'Second sample', 'Third sample'].entries()) {
    await click([...host.querySelectorAll('.native-ai-control-buttons button')][index]);
    expect(host.querySelector('select').value).toBe('42');
    expect(host.querySelector('textarea').value).toBe(sample);
  }
  expect(calls).not.toContain('/api/ai/fixture');
});

test('missing references stay explicit and block generation', async () => {
  const request = async path => path === '/api/ai/history?limit=20' ? { data: [] } : [];
  const config = { title: 'Fixture', resources: [{ key: 'students', endpoint: '/api/students', label: 'Students', fields: [] }], features: [{ id: 'fixture', title: 'Fixture AI', endpoint: '/api/ai/fixture', fields: [{ key: 'student_id', label: 'Student', required: true, resource: 'students' }] }] };
  await render(<NativeWorkflowStudio config={config} request={request} />);
  await click(host.querySelector('.native-ai-control-buttons button'));
  expect(host.querySelector('.native-workflow-generate').disabled).toBe(true);
  expect(host.textContent).toMatch(/Supply actual Student/);
});

test('returned and saved JSON displays labeled facts and a table', async () => {
  const payload = { summary: { approved: false, score: 0, note: '' }, matches: [{ student: 'A', confidence: 0 }, { student: 'B', confidence: 75 }] };
  await render(<NativeAIReport response={payload} />);
  expect(host.textContent).toMatch(/Approved/);
  expect(host.textContent).toMatch(/No/);
  expect(host.textContent).toMatch(/Score/);
  expect(host.textContent).toMatch(/0/);
  expect(host.textContent).toMatch(/Note/);
  const note = [...host.querySelectorAll('dt')].find(node => node.textContent === 'Note');
  expect(note.nextElementSibling.textContent).toBe('');
  expect(host.querySelectorAll('table tbody tr')).toHaveLength(2);
  await render(<NativeAIReport response={JSON.stringify(payload)} title="Saved analysis" />);
  expect(host.querySelectorAll('table tbody tr')).toHaveLength(2);
});

test('preset preserves a selected upload and does not call the provider', async () => {
  const calls = [];
  const request = async path => { calls.push(path); return { data: [] }; };
  const config = { title: 'Fixture', resources: [], features: [{ id: 'upload', title: 'Upload review', endpoint: '/api/ai/upload', fields: [{ key: 'evidence', type: 'file', label: 'Evidence', required: true }, { key: 'details', label: 'Details', required: false, presets: ['Review this file'] }] }] };
  await render(<NativeWorkflowStudio config={config} request={request} />);
  const input = host.querySelector('input[type=file]');
  const file = new File(['fixture'], 'fixture.txt', { type: 'text/plain' });
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  await click(host.querySelector('.native-ai-control-buttons button'));
  expect(host.querySelector('input[type=file]').files[0]).toBe(file);
  expect(host.querySelector('textarea').value).toBe('Review this file');
  expect(calls).not.toContain('/api/ai/upload');
});

test('saved history opens structured detail from its stored JSON', async () => {
  const saved = { id: 7, endpoint: 'belt-readiness', created_at: '2026-10-10T12:00:00Z', result: JSON.stringify({ ready: false, score: 0, notes: '' }) };
  const request = async path => path.startsWith('/api/ai/history') ? { data: [saved] } : [];
  await render(<NativeWorkflowStudio config={{ title: 'Fixture', features: [], resources: [] }} request={request} />);
  await click([...host.querySelectorAll('button')].find(button => button.textContent.includes('Belt readiness')));
  expect(host.querySelector('[role=dialog]').textContent).toMatch(/Ready/);
  expect(host.querySelector('[role=dialog]').textContent).toMatch(/No/);
  expect(host.querySelector('[role=dialog]').textContent).toMatch(/Score/);
  expect(host.querySelector('[role=dialog]').textContent).toMatch(/0/);
  expect(host.querySelector('[role=dialog]').textContent).toMatch(/Notes/);
  expect(host.querySelector('[role=dialog] pre')).toBeNull();
});

test('bracket preset uses only loaded students and requires two real records', async () => {
  const request = async path => path === '/api/students' ? [{ id: 12 }, { id: 19 }] : { data: [] };
  const config = { title: 'Fixture', resources: [{ key: 'students', endpoint: '/api/students', label: 'Students', fields: [] }], features: [{ id: 'bracket', title: 'Bracket', endpoint: '/api/ai/bracket-projection', fields: [{ key: 'student_ids', type: 'json', label: 'Student IDs', required: false, manual: true }] }] };
  await render(<NativeWorkflowStudio config={config} request={request} />);
  await click([...host.querySelectorAll('.native-ai-control-buttons button')][2]);
  expect(JSON.parse(host.querySelector('textarea').value)).toEqual([12, 19]);
  expect(host.querySelector('.native-workflow-generate').disabled).toBe(false);
});

test('all configured AI forms offer three complete examples using genuine references', async () => {
  const request = async path => path === '/api/students' ? [{ id: 12 }, { id: 19 }, { id: 31 }] : path === '/api/ai/history?limit=20' ? { data: [] } : [];
  await render(<NativeWorkflowStudio config={nativeWorkflowConfig} request={request} />);
  expect(nativeWorkflowConfig.features).toHaveLength(14);
  for (const feature of nativeWorkflowConfig.features) {
    await click([...host.querySelectorAll('nav[aria-label="AI tools"] button')].find(button => button.textContent === feature.title));
    expect(host.querySelectorAll('.native-ai-control-buttons button')).toHaveLength(3);
    await click(host.querySelector('.native-ai-control-buttons button'));
    for (const field of feature.fields) {
      const input = host.querySelector(`#native-workflow-${field.key}`);
      expect(input).not.toBeNull();
      if (field.key === 'dojoId') { expect(input.value).toBe(''); expect(host.textContent).toMatch(/Supply actual Dojo Id/); }
      else if (field.key === 'student_ids') expect(JSON.parse(input.value)).toEqual([12, 19, 31]);
      else if (field.resource) expect(['12', '19', '31']).toContain(input.value);
      else expect(input.value).not.toBe('');
    }
  }
});
