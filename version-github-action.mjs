import fs from 'fs';
import { exec } from 'child_process';

// Read the manifest.json file
fs.readFile('manifest.json', 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file from disk: ${err}`);
  } else {
    // Parse the file content to a JavaScript object
    const manifest = JSON.parse(data);

    // Extract the version
    const version = manifest.version;

    // Execute the git commands
    exec(`git tag -a ${version} -m "${version}" && git push origin ${version}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
  }
});
