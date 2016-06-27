const typeDefinitions = `
type PassportResult {
  loginToken: String
}

type RootMutation {
  passportLoginEmail (email: String!, password: String!): PassportResult
}
`;

export default [typeDefinitions];
