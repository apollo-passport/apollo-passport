// Synchronous promise stubs

function FakeResolve(value) {
  return () => ({
    then(thenFunc) {
      thenFunc(value);
      return { catch() {} }
    }
  });
}

function FakeReject(error) {
  return () => ({
    then() {
      return {
        catch(catchFunc) { catchFunc(error); }
      }
    }
  });
}

export { FakeResolve, FakeReject };
