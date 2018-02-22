var nodegit = require('nodegit');
var path = require('path');

var storeDir = '../store';

var githubToken = process.env.GITHUB_TOKEN;

function pull(service) {

  return new Promise((resolve, reject) => {
    var repository;

    let repoName = service.repositoryUrl.substring(service.repositoryUrl.lastIndexOf('/')+1);
    let repoDir = path.resolve(__dirname, storeDir, repoName);

    console.log(`pulling ${repoName} in directory ${repoDir}`);
    
    // Open a repository that needs to be fetched and fast-forwarded
    nodegit.Repository.open(repoDir)
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
        service.repository = repository;
        service.repositoryDir = repoDir;
        return resolve(service);
      })
      .catch(reject);
  });
}

function clone(service) {

  return new Promise((resolve, reject) => {

    let repoName = service.repositoryUrl.substring(service.repositoryUrl.lastIndexOf('/')+1);
    let repoDir = path.resolve(__dirname, storeDir, repoName);

    console.log(`cloning ${repoName} into ${repoDir}`);

    nodegit
      .Clone(service.repositoryUrl, repoDir, {
        fetchOpts: {
          callbacks: {
            credentials: function() {
              return nodegit.Cred.userpassPlaintextNew(githubToken, "x-oauth-basic");
            }
          }
        }
      })
      .then((repo) => {
        service.repository = repo;
        service.repositoryDir = repoDir;
        return resolve(service);
      })
      .catch(reject);
  });
}

function sync(service) {
  return new Promise((resolve, reject) => {
    pull(service)
      .then(resolve)
      .catch((err) => {
        console.log(err);
        clone(service)
          .then(resolve)
          .catch(reject)
      });
  });
}

module.exports = {
  pull,
  clone,
  sync
}