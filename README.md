# Easybaby Backend

Backend for easybaby project. Built with goodness of NestJS with TypeORM.

## Prerequisites

### With docker

To start with docker, install it from your favorite package manager, or download it
from [official Docker Desktop site](https://www.docker.com/products/docker-desktop/), and that would be it

### Without docker

#### NodeJS

First, we need to install NodeJS, the runtime of the app. To get that, install NodeJS 24 from your favorite package
manager, or download it from [official NodeJS download site](https://nodejs.org/en/download)

#### PostgreSQL

Application needs postgres database. The most convenient way of running it, would be docker:

```bash
docker run --env=POSTGRES_USER=postgres --env=POSTGRES_DB=postgres --env=POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

This will create postgres database with default credentials, that are already set in .env.example file.

If you don't want to use docker, you can install postgres locally from your favorite package manager, or download it
from [official Postgres download site](https://www.postgresql.org/download/)

### Brevo API key (optional)

To send emails, we use Brevo API. It is not needed for development purposes, but get full picture of application
locally, you would need to provide the app with it.
You can get it from [Brevo website](https://brevo.com/)

## Installation & Running

To install and run the app, you can use provided docker compose, or do it manually with npm.

### With Docker (compose)

Docker compose is recommended way of running the app. To do that, first inspect docker-compose.yml and fill in
environment variables for `app` service, or, better yet,
use [docker-compose.override.yml](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/)

Then, to start the app, use

```bash
$ docker compose --profile default up
```

### without Docker (npm)

If you don't want to use docker, you can easily run the app manually. To do that, first, install dependencies

```bash
$ npm install
```

Then copy the .env.example file to .env and fill in the required environment variables. When thats done, run the app in
chosen mode:

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run build && npm run start:prod
```

## API documentation

When the app is properly running, you can access swagger documentation at http://localhost:3000/api/

## Run tests

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```
