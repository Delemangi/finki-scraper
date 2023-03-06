# FINKI Scraper

Various scripts for scraping several FINKI (FCSE) services for the purpose of forwarding them to Discord using webhooks.

It's recommended, but not required to run this inside a Docker container.

## Installation

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

## Config

Create a `config` folder and in it create `config.json`. Example:

```json
{
  "successDelay": 600000,
  "errorDelay": 60000,
  "maxPosts": 20,
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

More scrapers may be added in `config.json`, and each scraper should have its own scraper strategy implemented. The course scraper strategy may be reused for other Moodle courses.
