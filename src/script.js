function updateVariable() {
  document.body.style.setProperty('--page-height', window.innerHeight + 'px')
}

window.addEventListener('resize', updateVariable)

updateVariable()
