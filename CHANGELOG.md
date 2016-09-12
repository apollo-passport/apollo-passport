# Change Log
All notable changes to this project will be documented in this file.
This project will adhere to [Semantic Versioning](http://semver.org/) from v1.0.0+.
We use the format from [keepachangelog.com](keepachangelog.com).

## [Unreleased]
### Changed
* `defaultMapUserToJWTProps` now relies on `userId()`,  below.

### Added
* `defaultMapUserToJWTProps` now includes a `displayName` too, looking for
  `user.displayName`, a `displayName` prop in any `service`, and finally,
  the user's primary email address, if it exists.

* `userId()` method that returns the userId field, using
  `DBDriver#mapUserToUserId` preferentially if it exists, then trying
  `user.id`, `user._id`, `user.userId` which coves vast majority of databases
  and schemas.

* `setUserIdProp()` that set's `user.id`, `user._id`, `user.userId`.  Doubtful
  this will stick around.  If you need this anywhere other than for
  `createUser()`, please open an issue immediately.

## [v0.0.5]
### Changed
* Client & server: append `/callback` to service path.

## [v0.0.4]
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
[v0.0.5]: https://github.com/apollo-passport/apollo-passport/compare/v0.0.4...v0.0.5
[v0.0.4]: https://github.com/apollo-passport/apollo-passport/compare/v0.0.3...v0.0.4
[v0.0.3]: https://github.com/apollo-passport/apollo-passport/compare/v0.0.2...v0.0.3
