# TRIBUTE dao

## Developer Setup

### Local `.env` File

When running locally you'll need a `.env` file in the root directory with the following:

```
REACT_APP_ENVIRONMENT=localhost
REACT_APP_INFURA_PROJECT_ID_LOCAL=...
REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS=...
REACT_APP_SNAPSHOT_HUB_API_URL=http://localhost:8081
```
NOTE:

- `REACT_APP_SNAPSHOT_HUB_API_URL` is the url of [snaphot-hub](https://github.com/openlawteam/snapshot-hub) running locally in a container.
- `REACT_APP_INFURA_PROJECT_ID_LOCAL` can be the same value you use for LAO local development.
- `REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS` is the address of the `DaoRegistry` smart contract deployed to your network.

### Ganache Workspace Setup

When you set up your Ganache network workspace in the [Ganache GUI app](https://www.trufflesuite.com/ganache), change the Network ID to `1337`. That is necessary in order to connect MetaMask to your Ganache network. The DApp is configured for Ganache to be `chainId` `1337`.

**Remember**: After you deploy the `DaoRegistry` smart contract on your local Ganache network you must include the deployed contract's address in your local root `.env` file.

## Netlify Deployments

[![Netlify Status](https://api.netlify.com/api/v1/badges/fc474fa4-9853-4dc0-a910-281167e7fdfc/deploy-status)](https://app.netlify.com/sites/tributedao/deploys)

Deployments to production and develop environments are handled automatically via Netlify and GH actions:

- `Netlify preview deployment`: pull_request (non-draft) to `main` branch -> https://deploy-preview-[PR#]--tributedao.netlify.app

- `Netlify develop deployment`: push to `main` branch -> https://develop--tributedao.netlify.app

- `Netlify production deployment`: push `v*` tag (will presumably be part of a release) -> https://tributedao.netlify.app

_Note for this deployment implementation with a single `main` branch to work, the Netlify automatic builds/deploys are stopped (you'll see evidence of that in the [Netlify project UI](https://app.netlify.com/sites/tributedao/overview)). They are now handled through these GH actions and Netlify CLI. See @note in `netlify.toml` for more info._

For production deployments, simply run `npm run release` and follow the interactive UI in your console. The release script runs [np](https://github.com/sindresorhus/np). We have initially configured `np` (in `package.json`) to automatically handle only versioning, release drafts, and git tagging. We can enable additional features as needed, such as publishing to npm.

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
