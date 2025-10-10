const { expect } = require('chai');
const { getMarkdownChecks, checkList } = require('./tools/simple-link-image-check');

describe('docs links', function () {
  this.timeout(300000);

  it('has no broken links in markdown docs', async () => {
    const checks = getMarkdownChecks();
    const deduped = checks; // already deduped by helper
    const { results, processed } = await checkList(deduped);
    if (results.length) {
      const lines = results.map((r) => `- ${r.url} (found in: ${r.sources.join(', ')}) => ${r.error || r.status}`).join('\n');
      throw new Error(`Broken markdown links (${results.length} of ${processed}):\n${lines}`);
    }
    expect(results.length).to.equal(0);
  });
});
