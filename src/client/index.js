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
    token
    error
  }
}
`;

class ApolloPassport {

  constructor({ apolloClient }) {
    this.apolloClient = apolloClient;
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

    // mod state..., redux, etc.
  }

  signupWithEmail(email, password) {

  }
}

export default ApolloPassport;