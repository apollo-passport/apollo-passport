const typeDefinitions = `
type PassportResult {
  error: String,
  token: String,
  userId: String
}

type apService {
  name: String,
  label: String,
  type: String,
  clientId: String,
  scope: String,
  urlStart: String
}

type apDiscovery {
  ROOT_URL: String,
  authPath: String,
  services: [ apService ]
}

type RootQuery {
  apDiscovery: apDiscovery
}

type RootMutation {

}

schema {
  query: RootQuery,
  mutation: RootMutation
}
`;

export default [typeDefinitions];
