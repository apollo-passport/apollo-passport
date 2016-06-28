export default function verify(username, password, done) {
  //return done(null, false);
  done(null, {
    username: 'gadi',
    password: 'pass'
  });
}
