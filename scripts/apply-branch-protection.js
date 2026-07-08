#!/usr/bin/env node
/**
 * Applies a repository ruleset that protects `master`:
 * - blocks branch deletion and force pushes
 * - requires pull requests before merging
 * - requires the CI workflow to pass
 *
 * Usage (repo admin):
 *   GITHUB_TOKEN=ghp_... node scripts/apply-branch-protection.js
 *
 * Token needs `admin:repo` (classic) or Repository administration (fine-grained).
 */
const REPO = process.env.GITHUB_REPOSITORY ?? 'mwaqarshahid/plarem';
const BRANCH = process.env.PROTECTED_BRANCH ?? 'master';
const CI_CHECK = process.env.CI_STATUS_CHECK ?? 'quality';
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('Missing GITHUB_TOKEN. Create a PAT with repo admin scope and re-run.');
  process.exit(1);
}

const [owner, repo] = REPO.split('/');
const api = (path, options = {}) =>
  fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

async function listRulesets() {
  const response = await api('/rulesets');
  if (!response.ok) {
    throw new Error(`Failed to list rulesets (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

async function deleteRuleset(id) {
  const response = await api(`/rulesets/${id}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete ruleset ${id} (${response.status}): ${await response.text()}`);
  }
}

async function createRuleset() {
  const body = {
    name: 'Protect master',
    target: 'branch',
    enforcement: 'active',
    conditions: {
      ref_name: {
        include: [`refs/heads/${BRANCH}`],
        exclude: [],
      },
    },
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: 0,
          dismiss_stale_reviews_on_push: false,
          require_code_owner_review: false,
          require_last_push_approval: false,
          required_review_thread_resolution: false,
        },
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: [{ context: CI_CHECK }],
        },
      },
    ],
  };

  const response = await api('/rulesets', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to create ruleset (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  const rulesets = await listRulesets();
  const existing = rulesets.filter((ruleset) => ruleset.name === 'Protect master');

  for (const ruleset of existing) {
    await deleteRuleset(ruleset.id);
    console.log(`Removed existing ruleset ${ruleset.id}`);
  }

  const created = await createRuleset();
  console.log(`Created ruleset "${created.name}" (id ${created.id}) for ${BRANCH}.`);
  console.log(`Required status check: "${CI_CHECK}" (job name from .github/workflows/ci.yml).`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
