# Static Page

For when you want to quickly throw up a not-so-terrible-looking html page
and you only want to write markdown.
This repo is a [node.js](https://nodejs.org) app which compiles assets with
[unified](https://www.npmjs.com/package/unified),
[remark](https://www.npmjs.com/package/remark) and
[rehype](https://www.npmjs.com/package/rehype), styles them with
[bulma](https://www.npmjs.com/package/bulma) then deploys them with
[docker](https://www.docker.com/).

<!-- toc-head -->

## Table of Contents

- [An example](#an-example)
- [Customisation](#customisation)
  - [Frontmatter](#frontmatter)
  - [Favicon](#favicon)
- [Development](#development)
  - [Setup](#setup)
  - [Commands](#commands)
  - [Code formatting](#code-formatting)
- [Deployment](#deployment)
  - [Building the image](#building-the-image)

<!-- toc-tail -->

## An example

Say you want a quick holding page and you have a markdown file with content in, `content.md`.

```md
---
title: Coming Soon
subtitle: You'll have to wait a little bit longer
theme: #6b2636
---

# Coming Soon

Etiam porta sem malesuada magna mollis euismod. Etiam porta sem malesuada magna mollis euismod. Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.
```

Then you want to quickly deploy it using docker:

```bash
docker run -it --rm \
  -v `pwd`/content.md:/app/page.md
  -p 3000:3000
  robb-j/static-page:1.1.0
```

Then all you have to do is visit `http://localhost:3000`

## Customisation

### Frontmatter

There are currently 3 values you can set in the frontmatter

- `title` – **required** The title of the page
- `subtitle` – An optional subtitle of the page
- `theme` – A css colour for the theme of the page

### Favicon

You can override the favicon by docker bind-mounting it to `/app/src/favicon.png`.

## Development

### Setup

To develop on this repo you will need to have [Docker](https://www.docker.com/) and
[node.js](https://nodejs.org) installed on your dev machine and have an understanding of them.
This guide assumes you have the repo checked out and are on macOS, but equivalent commands are available.

### Commands

```bash
# Install npm packages
npm i

# Run the development server
# -> It will compile the html & css and server them at localhost:3000
# -> It watches for file changes using `nodemon` and restarts the server
npm run dev

# Generate the table of contents for this readme
npm run gen-readme-toc
```

### Code formatting

This repo uses [Prettier](https://prettier.io/) to automatically format code to a consistent standard.
It works using the [husky](https://www.npmjs.com/package/husky)
and [lint-staged](https://www.npmjs.com/package/lint-staged) packages to
automatically format code whenever code is commited.
This means that code that is pushed to the repo is always formatted to a consistent standard.

You can manually run the formatter with `npm run prettier` if you want.

Prettier is slightly configured in [.prettierrc.yml](/.prettierrc.yml)
and also ignores files using [.prettierignore](/.prettierignore).

## Deployment

### Building the image

This repo uses an npm `postversion` script to build, tag and push the docker image to dockerhub.
Use the `npm version` command to create a new version and it will build and
push a new docker image with that version.
This means that all images are [semantically versioned](https://semver.org/).
The `:latest` docker tag is not used.

```bash
# Deploy a new version of the CLI
npm version # major | minor | patch
git push --tags
```

---

> This repo was setup with [robb-j/node-base](https://github.com/robb-j/node-base)
