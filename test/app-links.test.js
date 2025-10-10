const { expect } = require('chai');
const { getViewsChecks, checkList } = require('./tools/simple-link-image-check');

describe('app view links', function () {
  this.timeout(300000);

  it('has no broken links in pug views', async () => {
    const checks = getViewsChecks();
    const deduped = checks; // already deduped by helper
    const { results, processed } = await checkList(deduped);
    if (results.length) {
      const lines = results.map((r) => `- ${r.url} (found in: ${r.sources.join(', ')}) => ${r.error || r.status}`).join('\n');
      throw new Error(`Broken view links (${results.length} of ${processed}):\n${lines}`);
    }
    expect(results.length).to.equal(0);
  });
});
