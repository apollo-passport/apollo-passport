# apollo-passport

Full stack Apollo and PassportJS integration, inspired by Meteor Accounts.

[![npm](https://img.shields.io/npm/v/apollo-passport.svg?maxAge=2592000)](https://www.npmjs.com/package/apollo-passport) [![Circle CI](https://circleci.com/gh/apollo-passport/apollo-passport.svg?style=shield)](https://circleci.com/gh/apollo-passport/apollo-passport) [![Coverage Status](https://coveralls.io/repos/github/apollo-passport/apollo-passport/badge.svg?branch=master)](https://coveralls.io/github/apollo-passport/apollo-passport?branch=master) ![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)


Copyright (c) 2016 by Gadi Cohen, released under the MIT license.

## Features

* Super fast start with optional, opinionated resolvers for common tasks and databases.
* JSON Web Tokens (JWTs) for stateless "sessions" making database user lookups on every query optional.

* User interaction via GraphQL, not the framework.

  * Great for SPAs (single page apps) - no reloading or redirects to login; visible progress hints in UI.
  * Re-uses your existing transports.
  * No need for cookies and a cookie-free domain.

* Current database support (PRs welcome, it's very modular):

  * RethinkDB

## In Development

I'm still writing this.  Not everything mentioned in the README exists yet.  Not everything may work.  Most importantly, until a 1.0.0 release, NO SECURITY AUDIT HAS TAKEN PLACE.

Also, I probably won't have time to support this ;)  I'm using this, and it will work for whatever I need it for, but I'm hoping that anyone who uses this - especially at this stage - is interested in actively contributing to the project.  I hope to create a good starting point for community development.

Lastly, this is my first time using passport, apollo/graphql and JWT, so PRs for better practices are welcome.

## Getting Started

```sh
$ npm i --save passport passport-local # etc

$ npm i --save apollo-passport \
  apollo-passport-local \
  apollo-passport-rethinkdbdash \
  apollo-passport-react
```

### Quick Start

Inspired by Meteor's account system, apollo-passport (optionally) comes with everything you need to get started quickly: an opinionated database structure, resolvers for various databases, and the pre-built UI components (just for react, for now) to interact with the user and even configure provider settings.

**Server entry point**

```js
import ApolloPassport from 'apollo-passport';
import RethinkDBDashDriver from 'apollo-passport-rethinkdbdash';
import { Strategy as LocalStrategy } from 'passport-local';

const apolloPassport = new ApolloPassport({
  db: new RethinkDBDashDriver(r),  // "r" is your rethinkdbdash instance
  jwtSecret: 'my special secret'   // will be optional/automatic in the future
});

// Pass the class, not the instance (i.e. no NEW), and no options for defaults
// Make sure you setup strategies BEFORE calling getSchema, getResolvers below.
apolloPassport.use('local', LocalStrategy /*, options */);

// Merge these into your Apollo config however you usually do...
const apolloOptions = {
  schema: apolloPassport.getSchema(),
  resolvers: apolloPassport.getResolvers();
};

app.use('/graphql', apolloServer(apolloPassport.wrapOptions(apolloOptions)));

app.use('/ap-auth', apolloPassport.expressMiddleware('/ap-auth'));
```

**Client config**

```js
// Configure Apollo
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import ApolloPassport from 'apollo-passport/lib/client';
import ApolloPassportLocal from 'apollo-passport-local/client';
import apMiddleware from 'apollo-passport/lib/client/middleware';

const networkInterface = createNetworkInterface('/graphql');
networkInterface.use([ apMiddleware ]);

const apolloClient = new ApolloClient({ networkInterface });
const apolloPassport = new ApolloPassport({ apolloClient });

apolloPassport.use('local', ApolloPassportLocal);

// Optional, if you use Redux... (combine with apollo's reducers & middleware)
const store = createStore(
  combineReducers({
    apollo: apolloClient.reducer(),
    auth: apolloPassport.reducer()
  }),
  applyMiddleware(
    apolloClient.middleware(),
    apolloPassport.middleware()
  )
);

export { apolloClient, apolloPassport };
```

**Client usage**:

```sh
$ npm i --save apollo-passport-react
```

```js
import { LoginButtons } from 'apollo-passport-react';
import 'apollo-passport-react/style/meteor.less';

// From the file above...
import { apolloPassport } from '../../../lib/apollo';

const SomewhereInMyApp = () => (
  <LoginButtons apolloPassport={apolloPassport} />
);
```

See [apollo-passport-react](https://www.npmjs.com/package/apollo-passport-react) for more details.

## API

### Server

#### new ApolloPassport(options)

Instantiates a new ApolloPassport instance for your app, with the given options.

**Required Options**

* **db**: [ "dbName", dbInstance ]

  This is required for the default simple setup, but is not required if you provide your own passport verify functions.

* **jwtSecret**

  Required for now.  Will be created automatically and stored in the database in the future if not specified.  Also not required if the user providers their own verify functions.  Or we'll default to old style login tokens stored in the DB and fetch the user on each query.

**Customization Options**

* **userTableName**
* **mapUserToJWTProps**
* **createTokenFromUser**
* **winston**

#### apolloPassport.use('strategyName', StrategyClass, <options>, <verifyCallback>)

## TODO

* tests
* login
* pluggable interface to allow other packages to provide/replace e.g. react ui login.
* change internal resolve() to search first for installed packages e.g. apollo-passport-facebook (note, no need for an apollo-passport- copy of every package; we look at the inerhitted class for e.g. oauth2).

## Roadmap

* log user auths with ability for admins to see last x logins, failures, etc.

## Alternative architecture

Might switch to a different package for each strategy, allows for static analysis on client?

## Why not use Meteor Accounts as a base?

* PassportJS is to the go-to-auth for node apps and has
  * 200+ authentication strategies
  * 8k stars on github
  * *Only* the auth layer, so easy to build upon
  * Strategies do a good job of normalizing data structure from different providers

* Meteor accounts
  * until Meteor 1.5, lots of deps on pure Meteor packages
  * need to restructure deps on Blaze, Mongo, DDP, pub/sub, etc.
  * less active development

**However**

Besides for PassportJS and JWTs, Meteor Accounts has a looot of stuff we
should consider re-using... UI, validation flow, etc.
