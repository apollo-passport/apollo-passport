const typeDefinitions = `
type PassportResult {
  error: String,
  token: String
}

type RootMutation {
  passportLoginEmail (email: String!, password: String!): PassportResult
}
`;

export default [typeDefinitions];
