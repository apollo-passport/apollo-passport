import gql from 'graphql-tag';

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
    userId
  }
}
`;

class ApolloPassport {

  constructor({ apolloClient }) {
    this.apolloClient = apolloClient;

    // Redux support.  This gets set this apolloClient.middleware().
    this.store = null;

    this._subscribers = new Set();

    this._token = localStorage.getItem('apToken');
    this._userId = localStorage.getItem('apUserId');
    this._verified = false;

    if (this._token)
      this.assertToken();
  }

  assertToken() {

  }

  /* actions */

  async loginWithEmail(email, password) {
    const result = await this.apolloClient.mutate({
      mutation,
      variables: { email, password }
    });

    // if error...

    const queryResult = result.data.passportLoginEmail;

    if (queryResult.error)
      throw new Error(queryResult.error);

    localStorage.setItem('apToken', queryResult.token);
    localStorage.setItem('apUserId', queryResult.userId);
    this._userId = queryResult.userId;

    this.emitState();
  }

  signupWithEmail(email, password) {

  }

  // if it's not reactive does this make any sense?  can get from state.
  userId() {
    return this._userId;
  }

  logout() {
    localStorage.removeItem('apToken');
    localStorage.removeItem('apUserId');
    delete this._userId;

    this.emitState();
  }

  /* state */

  getState() {
    return {
      userId: this._userId,
      verified: this._verified
    };
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
      // value without a dispatch.
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