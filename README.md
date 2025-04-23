# FINKI Scraper

Tooling for scraping and providing publicly available data from FCSE services. The data is provided using a REST API or webhooks. Requires Node.js >= 20.

## Architecture

The scrapers are implemented as classes (called strategies) which contain several selectors and methods for fetching the data from each container (post, announcement, etc). Adding a new service requires creating a new strategy and linking it. See [the example strategy](./src/strategies/ExampleStrategy.ts) for more info.

## Quick Setup (Production)

To run the scraper:

1. Clone the repository: `git clone https://github.com/finki-hub/finki-scraper.git`
2. Prepare configuration by copying `config/config.sample.json` to `config/config.json`
3. Install dependencies: `npm i`
4. Run the scraper `npm run start`

It's also available as a Docker image:

```sh
docker run -d \
  --name finki-scraper \
  --restart unless-stopped \
  -v ./cache:/app/cache \
  -v ./config:/app/config \
  -v ./logs:/app/logs \
  ghcr.io/finki-hub/finki-scraper:latest
```

Or Docker Compose: `docker compose up -d`

You can select which scrapers to run declaratively (in the configuration with the `enabled` flag) or imperatively: `npm run start scraper_1 scraper_2 ... scraper_n`

## Quick Setup (Development)

1. Clone the repository: `git clone https://github.com/finki-hub/finki-scraper.git`
2. Install dependencies (and pre-commit hooks): `npm i`
3. Prepare configuration: `cp config/config.sample.json config/config.json`
4. Build the project: `npm run build`
5. Run it: `npm run start`

## Configuration

There is an example configuration file available at [`config/config.sample.json`](./config/config.sample.json). Copy it to `config/config.json` and edit it to your liking.

## Server Mode

If you would like to consume the data from a REST API, run the app in server mode: `npm run serve`. The data will be scraped on each API call instead of periodically.

- `GET /list` - get all active scrapers,
- `GET /get/<name>` - get data from the scraper `<name>`
- `DELETE /delete` - delete the cache of all scrapers
- `DELETE /delete/<name>` - delete the cache of the scraper `<name>`

The `<name>` parameter is what is specified in the configuration.

## License

This project is licensed under the MIT license.
