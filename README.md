# apollo-passport

ApolloStack and PassportJS integration, inspired by Meteor Accounts.

## Where passport ends and apollo-passport begins:

* Authentication in GraphQL, not the framework.  This means:

  * Server framework agnostic: works with Express, Koa, Hapi, and anything else.
  * Great for SPAs (single page apps) - no reloading or redirects to login; view progress updates.
  * Re-uses your existing transports.
  * No need for cookies and a cookie-free domain.

* Optionally opinionated with packaged resolvers for common tasks and databases.
