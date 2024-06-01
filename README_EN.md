# Instructions
This package automates the deployment of frontend files to a server.

## Usage
1.Run npm install.

2.Rename the `serverInfo.js.default` file to `serverInfo.js`, and fill in the relevant server information and packaging details. For the initial deployment, you can temporarily use a test path for the server deployment location.

3.For Windows, double-click `start.bat` to deploy the frontend project to the server.

4.For macOS or other systems, run the following command in the current directory: `node upload.server.js` or `npm run start`

This will deploy the project.

After deployment, the dist folder and dist.zip will be automatically removed.