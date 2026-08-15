import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeHtml } from './html.ts';

test('escapeHtml protects user-controlled email content', () => {
  assert.equal(escapeHtml(`<script>alert('x')</script> & "quoted"`), '&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt; &amp; &quot;quoted&quot;');
});
