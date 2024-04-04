# Updating the version

1. update pacakage.json version number
2. npm run version (updates the manifest and version file)
3. commit repo
4. npm run githubaction (commits the version number tag to the repo and pushes it, which kicks of the github action to prepare the release)
