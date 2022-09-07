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
    "jobsURL": "<webhook url>",
    "jobsRole": "<role ID>"
}
```

## Running

The following scripts are available:

1. `npm run jobs`
