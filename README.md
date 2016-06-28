# apollo-passport

Full stack Apollo and PassportJS integration, inspired by Meteor Accounts.

Copyright (c) 2016 by Gadi Cohen, released under an MIT license.

## Features

* Authentication in GraphQL, not the framework.  This means:

  * Server framework agnostic: works with Express, and plans for Koa, Hapi, etc (if supported by Apollo)
  * Great for SPAs (single page apps) - no reloading or redirects to login; visible progress hints in UI.
  * Re-uses your existing transports.
  * No need for cookies and a cookie-free domain.

* Optionally opinionated with packaged resolvers for common tasks and databases.

## In Development

I'm still writing this.  Not everything mentioned in the README exists yet.  Not everything may work.  Most importantly, until a 1.0.0 release, NO SECURITY AUDIT HAS TAKEN PLACE.

Also, I don't really have time to support this ;)  I'm using this, and it will work for whatever I need it for, but I'm hoping that anyone who uses this - especially at this stage - is interested in actively contributing to the project.

## Getting Started

```sh
$ npm i --save apollo-passport passport passport-local # etc
```

### Setup Option 1: Easy (recommended)

Inspired by Meteor's account system, apollo-passport (optionally) comes with everything you need to get started quickly: an opinionated database structure, resolvers for various databases, and the pre-built UI components (currently via react+redux) to interact with the user and even configure provider settings.

**Server entry point**

```js
import ApolloPassport from 'apollo-passport';
import { Strategy as LocalStrategy } from 'passport-local';

const apolloPassport = new ApolloPassport({
  db: [ 'rethinkdbhash', r ]
});

// Pass the class, not the instance (i.e. no NEW), and no options for defaults
apolloPassport.use('local', LocalStrategy);

// Merge these into your Apollo config (this will improve)
apolloPassport.getResolvers();
apolloPassport.getSchema();

app.use('/ap-auth', apolloPassport.expressMiddleware());
```

**Client**

```js
import ApolloPassport from 'apollo-passport/client';
import ApolloPassportContainer from 'apollo-passport/ui/react';

// integrate into NetworkInterface
ApolloPassport...

const SomewhereInMyApp = () => (
  <ApolloPassportContainer />
);
```

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
  * need to restructure deps on Blaze, Mongo, etc.
  * less active development
