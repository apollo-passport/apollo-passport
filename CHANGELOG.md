# Change Log
All notable changes to this project will be documented in this file.
This project will adhere to [Semantic Versioning](http://semver.org/) from v1.0.0+.
We use the format from [keepachangelog.com](keepachangelog.com).

## [Unreleased]
### Fixed
* Client: oauth URL's were missing an intermediary `/`.

### Changed
* `apolloPassport.use('name', AugmentedStrategy)` now accepts a newer format.  Now,
  AugmentedStrategies may also include their dependencies, so, e.g. no need to install
  both `apollo-passport-local` *and* `passport-local`.  Also, we can do away with the
  `this.require()` guessing since AugmentedStrategies explicitly include desired modules.

## [v0.0.3]
### Added
* Support for oauth & oauth2 Passport strategies & client-side popups.
* Client retrieves list of available services via apDiscovery GraphQL call.
* Docs in README for `mapUserToJWTProps`, `createTokenForUser`, `winston`.

### Changed
* `options.db` now expects an Apollo Passport DB Driver (see README).
* We now require a `ROOT_URL` to be set (see README).

[Unreleased]: https://github.com/apollo-passport/apollo-passport/compare/master...devel
[v0.0.3]: https://github.com/apollo-passport/apollo-passport/compare/v0.0.2...v0.0.3
