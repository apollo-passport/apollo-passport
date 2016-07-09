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

    this._subscribers = new Set();

    this._token = localStorage.getItem('apToken');
    this._userId = localStorage.getItem('apUserId');
    this._verified = false;

    if (this._token)
      this.assertToken();
  }

  assertToken() {

  }

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

  // if it's not reactive does this make any sense?
  userId() {
    return this._userId;
  }

  logout() {
    localStorage.removeItem('apToken');
    localStorage.removeItem('apUserId');
    delete this._userId;

    this.emitState();
  }
}

export default ApolloPassport;