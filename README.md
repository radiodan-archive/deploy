#Deploy

A quick and simple deployment server.

## Installation

`npm install`

## Usage

1. Add webhook `http://hostname/post-hook` to your required projects. Set to only send commit events.
2. Add the repo name to `whitelist.json`, otherwise the server will not accept the webhook request.
