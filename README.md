# Description

Maps out a set of locations and given an address shows the distance and time to any of the given locations (in this case the set of fireworks shows around chicagoland).


# Setup

Enable google maps JS API: https://console.cloud.google.com/google/maps-apis/credentials

Create a .env file next to the package.json with your Google API Key 

```bash
cp .envexample .env
npm install
```

Edit the .env file and paste your API key

# Running
Run a local dev server with parcel:

```bash
npm start
```


# Build for deploy
Build a dist folder with JS compiled from TS with parcel:

```bash
npm run build
```


Build a docker image with nginx using the dist folder:

```bash
npm run build-docker
```

Run the docker image:

```bash
npm run run-docker
```

This will start a server on port 8080 (you can see the docker container running by using `docker ps`)

To remove the container running the image you can use:

```bash
npm run clean-docker
```

See `package.json` for details of the above scripts