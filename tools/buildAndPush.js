#!/usr/bin/env node

/*
 * robb-j - npm based docke build & push
 * Uses /REGISTRY + package version to build and push a docker image
 * Useful when set in a npm `postversion` script
 * Args:
 *  - [latest] Also tag with latest
 *  - [dry] Don't perform the command
 */

// Imports
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const { promisify } = require('util')
const readFile = promisify(fs.readFile)

const version = process.env.npm_package_version

;(async () => {
  try {
    // Get the registry to push to from the REGISTRY file
    const registry = (
      await readFile(path.join(__dirname, '..', 'REGISTRY'), 'utf8')
    ).trim()

    // Generate tags for the image
    const tags = [`${registry}:${version}`]
    if (process.argv.includes('latest')) {
      tags.push(`${registry}:latest`)
    }

    // Reduce the tags into a statement
    const tagsStmt = tags.map((tag) => `-t ${tag}`).join(' ')

    // Generate the command to run
    const cmd = [`docker build ${tagsStmt} .`]
      .concat(tags.map((tag) => `docker push ${tag}`))
      .join(' && ')

    // Print the command we're running
    console.log('Running:', cmd)

    // Stop if in dry mode
    if (process.argv.includes('dry')) return

    // Execute the command
    const proc = exec(cmd)
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
  } catch (error) {
    console.log(`Error: ${error.message}`)
  }
})()
