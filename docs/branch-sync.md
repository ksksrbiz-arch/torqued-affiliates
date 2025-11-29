# Branch sync guide — migrating branches from legacy repo

This document outlines a safe approach to migrate branches (including `master` and others) from an old / legacy repo into this new repository.

Approach A — Mirror (preserves history and all refs)

1. Ensure both repos allow the mirror/push (you may need admin privileges).
2. Run the provided script from `tools/branch-sync.ps1`: 

```pwsh
.\tools\branch-sync.ps1 -sourceRepoUrl "https://github.com/OLD_ORG/old-repo.git" -targetRepoUrl "https://github.com/YOUR_ORG/torqued-affiliates.git"
```

This performs a full mirror (branches and tags) and pushes them into the target. Use with care — verify the branches and tags once complete.

Approach B — Fetch & selectively push

If you only want to migrate a subset of branches:

```pwsh
# clone the source repository
git clone https://github.com/OLD_ORG/old-repo.git tmp-old
cd tmp-old
# fetch all branches
git fetch --all
# add new remote
git remote add new-origin https://github.com/YOUR_ORG/torqued-affiliates.git
# push selected branches
git push new-origin master:master
git push new-origin feature/a-long-running-branch:feature/a-long-running-branch
# push tags if needed
git push new-origin --tags
```

Selective helper script

For convenience the `tools/branch-sync-selective.ps1` helper can push a comma-separated list of branches. Example:

```pwsh
.\tools\branch-sync-selective.ps1 -sourceRepoUrl "https://github.com/OLD_ORG/old-repo.git" -targetRepoUrl "https://github.com/YOUR_ORG/torqued-affiliates.git" -branches "master,feature/x,hotfix/1"
```

Notes & Safety
- It's a good idea to test the push to a separate branch first.
- If you have protected branches or CI rules on the new repo, adjust permissions before pushing.
- Contact your organization admins if you don't have push permission.

After migrating, scan for secrets and rotate any tokens that may have leaked.
