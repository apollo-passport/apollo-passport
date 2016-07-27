import chai from 'chai';

import { mergeResolvers, mergeSchemas } from './graphql-merge';

const should = chai.should();

describe('graphql-merge', () => {

  describe('mergeResolvers', () => {

    it('merges 1st level and RootMutations', () => {

      const a = { a: 1, RootMutation: { a: 1 } };
      const b = { b: 1, RootMutation: { b: 1 } };

      mergeResolvers(a, b).should.deep.equal({
        a: 1, b: 1,
        RootMutation: { a: 1, b: 1 }
      });

    });

  });

  describe('mergeSchemas', () => {

    it('merges schemas', () => {

      const a = `
type Something {
  error: String,
  token: String,
  userId: String
}

type RootMutations {
  someMutation (email: String!, password: String!): Something
}

type RootQueries {
  someQuery (email: String!, password: String!): Something
}

schema {
  query: RootQueries
  mutation: RootMutations
}
`;

      const b = `
type SomethingElse {
  id: String
}

type RootMutations {
  someOtherMutation (id: String): SomethingElse
}

type RootQueries {
  someOtherQuery (id: String): SomethingElse
}

schema {
  query: RootQueries
  mutation: RootMutations
}
`;

      const merged = mergeSchemas([a, b]);
      merged.should.equal(`

type Something {
  error: String,
  token: String,
  userId: String
}


type SomethingElse {
  id: String
}


type RootQueries {
  someQuery (email: String!, password: String!): Something
  someOtherQuery (id: String): SomethingElse

}
type RootMutations {
  someMutation (email: String!, password: String!): Something
  someOtherMutation (id: String): SomethingElse

}
schema {
  query: RootQueries,
  mutation: RootMutations
}
  `);

    });

  });

});
