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

;(async () => {
  try {
    const pkg = require('../package.json')
    const resolve = (file) => path.join(__dirname, '..', file)

    const registry = fs.readFileSync(resolve('REGISTRY'), 'utf8').trim()

    // Generate the command to run
    const tag = `${registry}:v${pkg.version}`
    const cmd = `docker build -t ${tag} . && docker push ${tag}`

    // Print the command we're running
    console.log('Running:', cmd)

    // Stop if in dry mode
    if (process.argv.includes('dry')) return

    // Execute the command
    const proc = exec(cmd)
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
