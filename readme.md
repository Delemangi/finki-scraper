# FINKI Scraper

This repository contains scripts for scraping various FINKI services for the purpose of forwarding them to Discord using webhooks.

## Installation

1. `git clone git@github.com:Delemangi/finki-scraper.git`
2. `npm install`

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
      "role": "[role]"
    },
    "jobs": {
      "strategy": "jobs",
      "link": "https://www.finki.ukim.mk/mk/fcse-jobs-internships",
      "webhook": "<webhook url>",
      "role": "[role]"
    },
    "events": {
      "strategy": "events",
      "link": "https://finki.ukim.mk/mk/fcse-events",
      "webhook": "<webhook url>",
      "role": "[role]"
    },
    "projects": {
      "strategy": "projects",
      "link": "https://finki.ukim.mk/mk/fcse-projects",
      "webhook": "<webhook url>",
      "role": "[role]"
    },
    "SIC": {
      "strategy": "course",
      "link": "https://courses.finki.ukim.mk/mod/forum/search.php?id=263&words=&phrase=&notwords=&fullwords=&hfromday=1&hfrommonth=1&hfromyear=1&hfromhour=1&hfromminute=1&htoday=1&htomonth=1&htoyear=1&htohour=1&htominute=1&forumid=486&subject=&user=&perpage=25",
      "webhook": "<webhook url>",
      "role": "[role]",
      "cookie": "[cookie]"
    }
  }
}
```

The parameters marked with `<>` are required, while the ones marked with `[]` are optional. The cookies specific to courses override the global cookie, and at least one cookie should be specified.

## Running

`npm run start <scraper>`, where scraper is one is the scrapers defined in `config.json`.

## Adding more scrapers

More scrapers may be added in `config.json`, and each scraper should have its own scraper strategy implemented. The course scraper strategy may be reused for other Moodle courses.
