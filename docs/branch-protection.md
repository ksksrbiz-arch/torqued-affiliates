# Branch Protection

## Recommended Settings
- Require pull request reviews before merging
- Require status checks to pass before merging (CI)
- Require signed commits
- Restrict who can push to matching branches
- Require linear history

## How to Enable
1. Go to your repository on GitHub.
2. Click 'Settings' > 'Branches'.
3. Add a branch protection rule for `main` (or your default branch).
4. Select the options above as needed.

See [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/branch-protection-rules) for details.
