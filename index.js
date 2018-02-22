var nodegit = require('nodegit');
var path = require('path');

var storeDir = 'store';

var githubToken = process.env.GITHUB_TOKEN;

function pull(repo) {
  console.log('pulling');

  return new Promise((resolve, reject) => {
    var repository;
  
    // Open a repository that needs to be fetched and fast-forwarded
    nodegit.Repository.open(path.resolve(__dirname, storeDir, repo))
      .then(function(repo) {
        repository = repo;
  
        return repository.fetchAll({
          callbacks: {
            credentials: function() {
              return nodegit.Cred.userpassPlaintextNew(githubToken, "x-oauth-basic");
            }
          }
        }, true);
      })
      // Now that we're finished fetching, go ahead and merge our local branch
      // with the new one
      .then(function() {
        return repository.mergeBranches("master", "origin/master");
      })
      .then(() => {
        return resolve(repository);
      })
      .catch(reject);
  });
}

function clone(repo) {
  console.log('cloning');

  return new Promise((resolve, reject) => {
    nodegit
      .Clone(`https://github.com/pointsource/${repo}`, `${storeDir}/${repo}`, {
        fetchOpts: {
          callbacks: {
            credentials: function() {
              return nodegit.Cred.userpassPlaintextNew(githubToken, "x-oauth-basic");
            }
          }
        }
      })
      .then(resolve)
      .catch(reject);
  });
}

function sync(repo) {
  return new Promise((resolve, reject) => {
    pull(repo)
      .then(resolve)
      .catch((err) => {
        console.log(err);
        clone(repo)
          .then(resolve)
          .catch(reject)
      });
  });
}

sync('sfi-msa-binding-xact')
  .then((repo) => {
    console.log('done', repo);
  })
  .catch(console.log);