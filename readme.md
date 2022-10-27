# FINKI Scraper

This repository contains scripts for scraping various FINKI services for purposes of sending them to Discord.

## Installation

1. `git clone git@github.com:Delemangi/finki-scraper.git`
2. `npm install`

## Config

Create a `config` folder and in it create `config.json`.

Structure:

```json
{
    "CoursesCookie": "<courses cookie>",
    "successDelay": "<ms>",
    "errorDelay": "<ms>",
    "jobsURL": "<webhook url>",
    "jobsRole": "<role ID>",
    "announcementsURL": "<announcement url>",
    "announcementsRole": "<role ID>",
    "eventsURL": "<events url>",
    "eventsRole": "<role ID>",
    "courses": {
        "course": {
            "url": "<url>",
            "role": "<role ID>",
            "cookie": "<Courses cookie>"
        }
    }
}
```

## Running

The following scripts are available:

1. `npm run jobs`
2. `npm run announcements`
3. `npm run events`
4. `npm run course <course> <link> [cache]`
