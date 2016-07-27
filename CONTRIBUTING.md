# Contributing to Apollo Passport

**TL;DR; Tests, coverage, linting, changelog** (See Pull Request Requirements, below).

The Apollo Passport project was intended - since it's inception - to be a commmunity maintained project.  We'd love to see you get involved (especially long time contributors from the Meteor community who we've worked with before).

## Getting started

1. Fork the project on Github (top right on the project page)
1. `git clone git@github.com:yourname/apollo-passport`
1. `git checkout devel`
1. `git checkout -b proposed-feature`

Most packages in the project are self contained with their own tests.  But if you want to use your devel copy in a project, use `npm link`:

1. In your cloned directory: `sudo npm link`
1. In your app / project: `npm link apollo-passport`

## Pull Requests

### Requirements

All PRs:

1. must not break the **test suite** (`npm test`), nor reduce **test coverage** (`npm run coverage`).  If you're fixing a bug, include a test that would fail without your fix.

1. must respect the **`.eslintrc`** (`npm run lint`).  Ideally your editor supports `eslint`.  Feel free to query rules with us that don't make sense, or disable rules in a particular scope when it makes sense,
together with a comment explaining why.

1. must update the **`CHANGELOG.md`** file, in the `vNEXT` section at the top, in the format of keepachangelog.com (@mention yourself at the end of the line).

1. must be isolated.  Avoid grouping many, unrelated changes in a single PR.

### Submission

1. From "getting started", your work should ideally be in it's own feature branch.
1. `git push`, and click on the new "merge" button / row on the project page.  *Merge to **devel***.
