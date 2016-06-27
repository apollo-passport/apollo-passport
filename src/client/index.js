import gql from 'graphql-tag';

const mutation = gql`
mutation passportLoginEmail (
  $email: String!,
  password: String!
) {
  passportLoginEmail(
    email: $email,
    password: $password
  )
}
`;

class apolloPassport {

  constructor({ apolloClient }) {
    this.apolloClient = apolloClient;
  }

  loginWithEmail(email, password) {

  }

  signupWithEmail(email, password) {

  }

}


export default apolloPassport;