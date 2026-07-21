const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('restored UI boundary contains product workflow and failure handling', () => {
  const appPath = path.join(__dirname, '..', 'src', 'App.js');
  const app = fs.readFileSync(appPath, 'utf8');
  assert.match(app, /AI Martial Arts Dojo Manager/);
  assert.match(app, /status: 'loading'/);
  assert.match(app, /status: 'error'/);
  assert.match(app, /Retry connection/);
  assert.ok(app.includes("Manage students and memberships"));
  assert.ok(app.includes("Schedule classes and attendance"));
  assert.ok(app.includes("Review belt progression"));
});
