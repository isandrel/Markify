/**
 * Keeps one tracking issue in sync with the live 1Point3Acres checks:
 * opened (or commented on) when they fail, closed when they pass again.
 * Called from .github/workflows/live-e2e.yml through actions/github-script.
 */
const fs = require('fs');

const LABEL = 'live-e2e';
const TITLE = 'Live E2E failing: 1Point3Acres';

/** Failing tests, plus skipped ones and notes (annotations) worth showing in the run summary. */
function readReport(reportPath) {
    const failures = [];
    const notes = [];
    let report;
    try {
        report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch (error) {
        return { failures: [`- Could not read the test report (${error.message}); the run log has details.`], notes };
    }
    const clean = text => text.replace(/\u001b\[[0-9;]*m/g, '').split('\n').find(line => line.trim())?.trim().slice(0, 300) ?? '';
    const walk = suite => {
        for (const child of suite.suites ?? []) walk(child);
        for (const spec of suite.specs ?? []) {
            for (const test of spec.tests ?? []) {
                const annotations = [...(test.annotations ?? []), ...(test.results ?? []).flatMap(result => result.annotations ?? [])];
                for (const note of annotations) {
                    const line = `- ${note.type === 'skip' ? 'Skipped' : note.type} · **${spec.title}**: ${clean(note.description ?? '')}`;
                    if (!notes.includes(line)) notes.push(line);
                }
                if (test.status === 'unexpected') failures.push(`- **${spec.title}**: ${clean(test.results?.at(-1)?.error?.message ?? 'no error message')}`);
            }
        }
    };
    for (const suite of report.suites ?? []) walk(suite);
    return { failures, notes };
}

module.exports = async ({ github, context, core, outcome, reportPath }) => {
    const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
    const failed = outcome === 'failure';
    const { failures: reported, notes } = readReport(reportPath);
    const failures = failed ? reported : [];
    // Which tests failed and why, without run-specific numbers.
    const signature = failures.map(line => line.replace(/\d+/g, '#')).sort().join('|').replace(/[^\w|# -]/g, '').slice(0, 300);
    const { data: open } = await github.rest.issues.listForRepo({ ...context.repo, state: 'open', labels: LABEL, per_page: 20 });
    const existing = open.find(issue => issue.title === TITLE);

    if (failed) {
        const body = [
            `Live checks against www.1point3acres.com failed in [run ${context.runId}](${runUrl}).`,
            '',
            failures.length ? failures.join('\n') : '- No failing test was recorded; the run log has details.',
            '',
            'The run\'s `live-e2e-report` artifact has traces plus `discover-main.html`, `thread.json` and `posts.json` samples',
            'for updating `config/adapters/1point3acres.toml` and `packages/e2e/fixtures/sites/1point3acres.ts`.',
            'A "Blocked or unavailable" failure means bot protection or an outage rather than a Markify change.',
        ].join('\n');
        if (existing) {
            // Same failing set as last time: the issue already says so; don't add a daily duplicate.
            const marker = `<!-- live-e2e-signature: ${signature} -->`;
            if (!(existing.body ?? '').includes(marker)) {
                await github.rest.issues.createComment({ ...context.repo, issue_number: existing.number, body });
                await github.rest.issues.update({ ...context.repo, issue_number: existing.number, body: `${(existing.body ?? '').replace(/\n?<!-- live-e2e-signature: [^>]* -->/g, '')}\n${marker}` });
            }
        } else {
            try {
                await github.rest.issues.createLabel({ ...context.repo, name: LABEL, color: 'd73a4a', description: 'Real-site end-to-end checks' });
            } catch { /* label already exists */ }
            await github.rest.issues.create({ ...context.repo, title: TITLE, labels: [LABEL], body: `${body}\n<!-- live-e2e-signature: ${signature} -->` });
        }
    } else if (existing) {
        await github.rest.issues.createComment({ ...context.repo, issue_number: existing.number, body: `Live checks pass again in [run ${context.runId}](${runUrl}). Closing.` });
        await github.rest.issues.update({ ...context.repo, issue_number: existing.number, state: 'closed', state_reason: 'completed' });
    }

    await core.summary
        .addHeading(failed ? 'Live 1Point3Acres checks failed' : 'Live 1Point3Acres checks passed', 3)
        .addRaw(failures.join('\n'))
        .addRaw(notes.length ? `\n\n**Notes**\n${notes.join('\n')}\n` : '')
        .addLink('Run', runUrl)
        .write();
};
