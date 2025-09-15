import { applyTemplatePublic } from '../src/index';

describe('Postback template engine', () => {
  it('replaces placeholders with encoded values', () => {
    const tpl = 'https://example.com?cid={{ click_id }}&p={{ payout }}';
    const url = applyTemplatePublic(tpl, { click_id: 'abc 123', payout: 10.5 });
    expect(url).toBe('https://example.com?cid=abc%20123&p=10.5');
  });
});

