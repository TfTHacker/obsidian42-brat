import { readFileSync, writeFileSync } from "node:fs";

const semver = await import("semver");

const targetVersion = process.env.npm_package_version;
const targetSemver = semver.parse(targetVersion);

// read minAppVersion from manifest.json and bump version to target version
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
// Write manifest.json with target version only if the target version is not a pre-release version
if (targetSemver.prerelease.length === 0) {
  manifest.version = targetVersion;
  writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

  // update versions.json with target version and minAppVersion from manifest.json
  // but only if the target version is not already in versions.json
  const versions = JSON.parse(readFileSync("versions.json", "utf8"));
  if (!Object.values(versions).includes(minAppVersion)) {
    versions[targetVersion] = minAppVersion;
    writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
  }
} else {
  console.log(
    `Skipping version bump in manifest.json for pre-release version: ${targetVersion}`
  );
}
