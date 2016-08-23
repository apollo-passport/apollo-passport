export function mergeResolvers(a, b) {
  return {
    ...a,
    ...b,
    RootQuery: {
      ...a.RootQuery,
      ...b.RootQuery
    },
    RootMutation: {
      ...a.RootMutation,
      ...b.RootMutation
    }
  }
}

/*
 * Obviosly this is the wrong way to do this, but it was a quick start.
 * TODO -- merge the individually parsed schemas.
 */

const rootQueryRE = /(type RootQuer(?:y|ies) \{\n)([\s\S]*?\n*)(\}\s*)/;
const rootMutationRE = /(type RootMutations? \{\n)([\s\S]*?\n*)(\}\s*)/;
const schemaRE = /(schema \{\n)([\s\S]*?\n?)(\}\s*)/;

export function mergeSchemas(_schemas) {
  const rootQueries = [];
  const rootMutations = [];
  const outSchemas = [];

  _schemas.forEach((_schema) => {
    outSchemas.push(
      _schema.replace(rootQueryRE, (match, start, queries) => {
        rootQueries.push(queries);
        return '';
      }).replace(rootMutationRE, (match, start, mutations) => {
        rootMutations.push(mutations);
        return '';
      }).replace(schemaRE, '')
    );
  });

  const finalSchema = `
${outSchemas.join('')}
type RootQuery {
${rootQueries.join('')}
}
type RootMutation {
${rootMutations.join('')}
}
schema {
  query: RootQuery,
  mutation: RootMutation
}
  `;

  return finalSchema;
}
