# Moloch v3 DApp

Related supporting repositories:

- [openlawteam/molochv3-contracts](https://github.com/openlawteam/molochv3-contracts)
- [openlawteam/snapshot-hub (erc-712 branch)](https://github.com/openlawteam/snapshot-hub/tree/erc-712)
- [openlawteam/snapshot-js-erc712](https://github.com/openlawteam/snapshot-js-erc712)

## Developer Setup

### Local `.env` File

When running locally you'll need a `.env` file in the root directory with the following:

```
REACT_APP_ENVIRONMENT=localhost
REACT_APP_INFURA_PROJECT_ID_LOCAL=...
REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS=...
REACT_APP_MULTICALL_CONTRACT_ADDRESS=...
REACT_APP_SNAPSHOT_HUB_API_URL=http://localhost:8081
```

NOTE:

- `REACT_APP_INFURA_PROJECT_ID_LOCAL` can be the same value you use for LAO local development.
- `REACT_APP_DAO_REGISTRY_CONTRACT_ADDRESS` is the address of the `DaoRegistry` smart contract deployed to your network.
- `REACT_APP_MULTICALL_CONTRACT_ADDRESS` is the address of the `Multicall` smart contract deployed to your network.
- `REACT_APP_SNAPSHOT_HUB_API_URL` is the url of [snaphot-hub](https://github.com/openlawteam/snapshot-hub) running locally in a container.

#### Optional env vars for local development

`REACT_APP_DEFAULT_CHAIN_NAME_LOCAL=<MAINNET | ROPSTEN | RINKEBY | GOERLI | KOVAN | GANACHE>`

### Ganache Workspace Setup

When you set up your Ganache network workspace in the [Ganache GUI app](https://www.trufflesuite.com/ganache), change the Network ID to `1337`. That is necessary in order to connect MetaMask to your Ganache network. The DApp is configured for Ganache to be `chainId` `1337`.

Alternatively (and for now the more stable method), you can run the network with the [Ganache CLI](https://github.com/trufflesuite/ganache-cli):

- `npm install -g ganache-cli` (if not already installed)
- `ganache-cli --port 7545 --networkId 1337`

**Remember**: After you deploy the `DaoRegistry` smart contract on your local Ganache network you must include the deployed contract's address in your local root `.env` file.

## Running the local graph-node

Clone the https://github.com/openlawteam/molochv3-contracts repo and from the root open up a terminal, `npm ci`.

### Running ganache-cli

In a new terminal tab, `ganache-cli --port 7545 --networkId 1337 --blockTime 10`.
Then deploy the contracts to the local ganache instance `truffle deploy --network=ganache`

### Running IPFS (version 0.4.18)

If you already have a version of IPFS on your machine, check the version `ipfs version`. As per the recommendation from The Graph guys, you need version 0.4.18 of IPFS and version 7 of the IPFS repo to work with the local graph-node. If you have an old or newer version you’ll need to migrate your IPFS repo to version 7.

#### Installing version 0.4.18 (IPFS)

Get it from https://dist.ipfs.io/#go-ipfs or alternatively use this download link: https://dist.ipfs.io/go-ipfs/v0.4.18/go-ipfs_v0.4.18_darwin-amd64.tar.gz

Unzip it… `tar -xvzf go-ipfs_v0.4.18_darwin-amd64.tar.gz`

Then follow these instructions for your OS https://docs.ipfs.io/install/command-line/#official-distributions from step 3.

#### Down/upgrading to version 7 (IPFS repo)

You will need to migrate the IPFS repo version 7… do that by downloading the migration-repo from here https://dist.ipfs.io/#fs-repo-migrations and then unzipping…
Alternately, download from this direct link https://dist.ipfs.io/fs-repo-migrations/v1.7.1/fs-repo-migrations_v1.7.1_darwin-amd64.tar.gz

```
tar -xvzf fs-repo-migrations_v1.7.1_darwin-amd64.tar.gz
cd fs-repo-migrations
./fs-repo-migrations -to 7 --revert-ok
```

### Start IPFS

After re/installing IPFS and its repo, start the service by running `ipfs init` followed by `ipfs daemon`

### Start the PostgreSQL database

Install PostgreSQL and run `initdb -D .postgres` followed by `pg_ctl -D .postgres -l logfile start` and `createdb graph-node`

### Start the graph-node

Make sure you have cargo installed, if not follow the instructions here to install it https://doc.rust-lang.org/cargo/getting-started/installation.html

Then:

```
➜ cargo run -p graph-node --release -- \
  --postgres-url postgresql://USERNAME[:PASSWORD]@localhost:5432/graph-node \
  --ethereum-rpc mainnet:http://localhost:7545 \
  --ipfs 127.0.0.1:5001

```

Deploy the subgraph to the local graph-node:

- Don’t forget to update the `BankFactory` and `DaoFactory` contract addresses in `subgraph.yaml` before deploying

  `graph create-local`
  `graph deploy-local`

### Troubleshooting

Error: thread 'tokio-runtime-worker' panicked at 'genesis block cannot be reverted

thread 'tokio-runtime-worker' panicked at 'genesis block cannot be reverted', /path/graph-node/core/src/subgraph/instance_manager.rs:526:34
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
Panic in tokio task, aborting!
[1] 16415 abort cargo run -p graph-node --release -- --postgres-url --ethereum-rpc --ipfs

Solution: `dropdb graph-node`… then create a fresh db `createdb graph-node`

Error: **_ Deployment Failed _** when running `truffle deploy --network=ganache`

"Migrations" hit an invalid opcode while deploying. Try:

- Verifying that your constructor params satisfy all assert conditions.
- Verifying your constructor code doesn't access an array out of bounds.
- Adding reason strings to your assert statements.

Solution: If you have Ganache CLI v6.1.0 … upgrade to the latest version

Useful links:
https://github.com/rust-lang/cargo/
https://doc.rust-lang.org/cargo/getting-started/installation.html
https://github.com/graphprotocol/graph-node
https://dist.ipfs.io/#go-ipfs

## GitHub Pages Deployments

Deployments for the development environment are handled automatically with a GitHub Action:

- `GitHub Pages development deployment`: push to `main` branch -> https://molochv3.org

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
