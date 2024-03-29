const { join } = require('path')
const fs = require('fs')
const { promisify } = require('util')
const { createServer } = require('http')

const unified = require('unified')
const vfile = require('to-vfile')
const h = require('hastscript')
const parseMarkdown = require('remark-parse')
const addToc = require('remark-toc')
const mdToHtml = require('remark-rehype')
const frontmatter = require('remark-frontmatter')
const toHtmlString = require('rehype-stringify')
const wrapInHtmlDoc = require('rehype-document')

const Yaml = require('yaml')
const Sass = require('sass')
const minimist = require('minimist')

const { formatMilliseconds } = require('format-ms')

const readFile = promisify(fs.readFile)

const resolvePath = (...paths) => join(__dirname, ...paths)

/** Search a hastscript tree to find a node which matches a predicate */
function find(node, predicate) {
  if (!node.children) return
  for (const child of node.children) {
    if (predicate(child)) return child

    const nested = find(child, predicate)
    if (nested) return nested
  }
  return null
}

// A plugin to parse and validate yaml frontmatter
// -> Should be added after `remark-frontmatter`
const extractFrontmatter = () => (node, file) => {
  try {
    if (node.children[0].type !== 'yaml') {
      throw new Error('Frontmatter is missing')
    }
    const yaml = Yaml.parse(node.children[0].value)

    if (typeof yaml.title !== 'string') throw new Error('No title')

    file.data.matter = yaml
  } catch (error) {
    file.fail(error)
  }
}

// A plugin to wrap the markdown's content in a bulma page
const injectPageStructure = () => (node, file) => {
  const content = node.children

  const { title, subtitle = '' } = file.data.matter

  node.children = [
    h('.page', [
      h('.hero.is-primary', [
        h('.hero-body', [
          h('.container', [
            h('h1.title', title),
            subtitle && h('h2.subtitle', subtitle),
          ]),
        ]),
      ]),
      h('section.section.page-expand', [
        h('.container', [h('.content', [content])]),
      ]),
      h('footer.footer.has-text-centered.has-text-monospace', [
        h('.container', [
          'Page rendered with ',
          h(
            'a',
            {
              href: 'https://github.com/robb-j/static-page',
              target: '_blank',
              rel: 'noopener',
            },
            'robb-j/static-page'
          ),
        ]),
      ]),
    ]),
  ]
}

// A plugin to update `rehype-document`'s title with a value from the frontmatter
const updateDocumentTitle = () => (node, file) => {
  const title = find(node, (node) => node.tagName === 'title')
  if (title && title.children[0]) {
    title.children[0].value = file.data.matter.title
  }
}

/** Render a markdown file to html, extracting yaml and wrapping in a bulma page */
function renderMarkdown(file) {
  const start = Date.now()
  return new Promise((resolve, reject) =>
    unified()
      .use(parseMarkdown)
      .use(frontmatter, ['yaml'])
      .use(extractFrontmatter)
      .use(addToc)
      .use(mdToHtml)
      .use(injectPageStructure)
      .use(wrapInHtmlDoc, {
        css: ['/style.css'],
        js: ['/script.js'],
        link: [{ rel: 'icon', href: '/favicon.png' }],
      })
      .use(updateDocumentTitle)
      .use(toHtmlString)
      .process(file, (err, file) => {
        const duration = Date.now() - start

        if (err) reject(err)
        else resolve([file.data.matter, file.toString(), duration])
      })
  )
}

/** Compile sass from a file, prepending $primary from yaml frontmatter */
async function compileSass(file, config) {
  const { theme = '#3943b7' } = config
  const data = `$primary: ${theme}\n` + (await readFile(file, 'utf8'))

  const options = {
    data,
    indentedSyntax: true,
    includePaths: [resolvePath('../node_modules')],
  }

  return new Promise((resolve, reject) => {
    Sass.render(options, (err, result) => {
      if (err) reject(err)
      else resolve([String(result.css), result.stats.duration])
    })
  })
}

// Shutdown the http server and exit the process
// waits for 5s for services to stop routing traffic
function shutdown(server) {
  isTerminating = true
  console.log('Exiting ...')

  const delay = process.env.NODE_ENV === 'production' ? 5000 : 0
  setTimeout(() => server.close(() => process.exit()), delay)
}

let isTerminating = false

;(async () => {
  try {
    const { port = 3000, page = 'page.md' } = minimist(process.argv)

    // Load static assets
    const [favicon, script] = await Promise.all([
      readFile(resolvePath('favicon.png')),
      readFile(resolvePath('script.js')),
    ])

    // Render markdown to html
    process.stdout.write('Rendering html')
    const [config, html, t1] = await renderMarkdown(
      vfile.readSync(page),
      frontmatter
    )
    process.stdout.write(` (${formatMilliseconds(t1)})\n`)

    // Compile sass into css
    process.stdout.write('Compilling sass')
    const [css, t2] = await compileSass(resolvePath('styles.sass'), config)
    process.stdout.write(` (${formatMilliseconds(t2)})\n`)

    // Create a http server to serve the files
    const server = createServer((req, res) => {
      res.statusCode = 200
      switch (req.url) {
        case '/':
        case '/index':
        case '/index.html': {
          res.setHeader('Content-Type', 'text/html')
          return res.end(html)
        }
        case '/style.css': {
          res.setHeader('Content-Type', 'text/css')
          return res.end(css)
        }
        case '/favicon.png': {
          res.setHeader('Content-Type', 'image/png')
          return res.end(favicon)
        }
        case '/script.js': {
          res.setHeader('Content-Type', 'application/javascript')
          return res.end(script)
        }
        case '/healthz': {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.statusCode = isTerminating ? 503 : 200
          res.end(JSON.stringify({ msg: isTerminating ? 'terminating' : 'ok' }))
          return
        }
        default: {
          res.statusCode = '404'
          res.setHeader('Content-Type', 'text/plain')
          res.end('Not Found\n')
        }
      }
    })

    // Start the server and listen for requests
    await new Promise((resolve) => server.listen(port, resolve))
    console.log('Listening on :' + port)

    process.on('SIGINT', () => shutdown(server))
    process.on('SIGTERM', () => shutdown(server))
  } catch (error) {
    console.log(error)
  }
})()
