import gql from 'graphql-tag';
import createHash from 'sha.js';
import jwtDecode from 'jwt-decode';

// check and warn if regenerator-runtime not installed / present

const mutation = gql`
mutation login (
  $email: String!
  $password: String!
) {
  passportLoginEmail (
    email: $email
    password: $password
  ) {
    error
    token
  }
}
`;

class ApolloPassport {

  constructor({ apolloClient }) {
    this.apolloClient = apolloClient;

    this._subscribers = new Set();

    // Redux support.  This gets set this apolloClient.middleware().
    this.store = null;

    this._token = localStorage.getItem('apToken');

    // Set initial values
    this.setState(true);

    if (this._token) {
      // constructor is a synchronous method, queue this for after.
      setTimeout(() => { this.assertToken() }, 1);
    }
  }

  assertToken() {

  }

  /* actions */

  // TODO needs to move to 'local' package
  async loginWithEmail(email, password) {
    const result = await this.apolloClient.mutate({
      mutation,
      variables: {
        email,
        password: createHash('sha256').update(password).digest('hex')
      }
    });

    if (result.errors) {
      console.error("A server side error was thrown during the Apollo Passport GraphQL query:");
      console.error(result.errors);
      return;
      // should we still update state?
    }

    const queryResult = result.data.passportLoginEmail;
    const data = queryResult.token ? jwtDecode(queryResult.token) : {};

    // TODO needs a generalized method outside of local
    localStorage.setItem('apToken', queryResult.token);
    this.setState({ data: data, verified: true, error: null });
  }

  signupWithEmail(email, password) {

  }

  logout() {
    localStorage.removeItem('apToken');
    this.setState({ data: {}, verified: false, error: null });
  }

  /* state */

  stateHash(state) {
    return JSON.stringify(state || this._state);
  }

  setState(nextState) {
    if (!this._state) {
      this._state = {
        data: this._token ? jwtDecode(this._token) : {},
        verified: false,
        error: null
      };
      this._stateHash = this.stateHash();
    }

    // Just set initial values and exit, used in constructor
    if (nextState === true)
      return;

    const nextStateHash = this.stateHash(nextState);
    const hasChanged = this._stateHash !== nextStateHash;

    if (hasChanged) {
      this._state = nextState;
      this._stateHash = nextStateHash;

      // XXX todo debounce
      this.emitState();
    }

  }

  getState() {
    return this._state;
  }

  subscribe(callback) {
    this._subscribers.add(callback);
  }

  unsubscribe(callback) {
    this._subscribers.delete(callback);
  }

  emitState() {
    const state = this.getState();
    this._subscribers.forEach(callback => callback(state));
  }

  /* optional redux support */

  reducer() {
    var self = this;

    return function apolloPassportReducer(state, action) {
      if (action.type === 'APOLLO_PASSPORT_UPDATE')
        return action.state;

      // I guess this is anti-pattern in Redux but I like to populate the
      // initial value without a dispatch.
      return state || self.getState();
    }
  }

  middleware() {
    var self = this;
    return function apolloPassportMiddleware(store) {
      self.store = store;

      self.subscribe(state => {
        self.store.dispatch({
          type: 'APOLLO_PASSPORT_UPDATE',
          state: state
        });
      });

      // Don't do anything special, we just use middleware to get our store
      // with the same API as Apollo.
      return next => action => next(action);
    }
  }
}

export default ApolloPassport;