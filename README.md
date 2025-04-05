# FINKI Scraper

Various scripts for scraping several FINKI (FCSE) services for the purpose of forwarding them to Discord using webhooks.

It's recommended, but not required to run this inside a Docker container.

Requires Node 20 or higher.

## Installation

For development purposes, be sure to run `npm run prepare` to install the Git pre-commit hooks.

### Installation (Docker)

1. `git clone git@github.com:Delemangi/finki-scraper.git`
2. `docker compose build`

### Installation (Normal)

1. `git clone git@github.com:Delemangi/finki-scraper.git`
2. `npm install`

## Running

You may optionally pass arguments to the below commands to override which scrapers are run.

### Running (Docker)

`docker compose run scraper`
or
`docker compose run scraper s1 s2 ... sn`

### Running (Normal)

`npm run start`
or
`npm run start s1 s2 ... sn`

## Server Mode

You can also run this app in server mode using `npm run serve`, which will boot up an Hono based server which will open endpoints for receiving new announcements. In this mode, the app will only scrape new announcements whenever it receives a request to get them, instead of periodically. It is also possible to clear the cache to obtain the same announcements again, as well as to fetch all available scrapers. There is a separate Docker Compose configuration in `docker-compose.server.yaml` for running the app in server mode, and it exposes the port 3000 by default.

The exposed endpoints are:

- `GET /list` to get all available scrapers,
- `GET /get/<name>` to get all announcements from a certain service,
- `DELETE /delete` to delete the cache of all services,
- `DELETE /delete/<name>` to delete the cache of the announcements from a certain service,

where `name` corresponds to the name (key) in the configuration.

## Config

Create a `config` folder and in it create `config.json`. Example:

```json
{
  "successDelay": 600000,
  "errorDelay": 60000,
  "maxPosts": 20,
  "webhook": "<logging webhook url>",
  "sendPosts": true,
  "scrapers": {
    "announcements": {
      "strategy": "announcements",
      "link": "https://www.finki.ukim.mk/mk/student-announcement",
      "webhook": "<webhook url>",
      "role": "[role]",
      "enabled": true
    },
    "jobs": {
      "strategy": "jobs",
      "link": "https://www.finki.ukim.mk/mk/fcse-jobs-internships",
      "webhook": "<webhook url>",
      "role": "[role]",
      "enabled": true
    },
    "events": {
      "strategy": "events",
      "link": "https://finki.ukim.mk/mk/fcse-events",
      "webhook": "<webhook url>",
      "role": "[role]",
      "enabled": true
    },
    "projects": {
      "strategy": "projects",
      "link": "https://finki.ukim.mk/mk/fcse-projects",
      "webhook": "<webhook url>",
      "role": "[role]",
      "enabled": true
    },
    "SIC": {
      "strategy": "course",
      "link": "https://courses.finki.ukim.mk/mod/forum/search.php?id=263&words=&phrase=&notwords=&fullwords=&hfromday=1&hfrommonth=1&hfromyear=1&hfromhour=1&hfromminute=1&htoday=1&htomonth=1&htoyear=1&htohour=1&htominute=1&forumid=486&subject=&user=&perpage=25",
      "webhook": "<webhook url>",
      "role": "[role]",
      "cookie": "[cookie]",
      "enabled": true
    }
  }
}
```

Use the `enabled` property to control which scrapers will be activated on the next run.

More scrapers may be added in `config.json`, and each scraper should have its own scraper strategy implemented. The `course` scraper strategy may be reused for other Moodle courses.
