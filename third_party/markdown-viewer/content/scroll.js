
var scroll = (() => {
  function onload (done) {
    Promise.all([
      new Promise((resolve) => {
        var timeout = setInterval(() => {
          if (document.styleSheets.length) {
            clearInterval(timeout)
            resolve()
          }
        }, 0)
      }),
      new Promise((resolve) => {
        var images = Array.from(document.querySelectorAll('img'))
        if (!images.length) {
          resolve()
        }
        else {
          Promise.race([
            new Promise((resolve) => {
              var loaded = 0
              images.forEach((img) => {
                img.addEventListener('load', () => {
                  if (++loaded === images.length) {
                    resolve()
                  }
                }, {once: true})
              })
            }),
            new Promise((resolve) => setTimeout(resolve, 500))
          ]).then(resolve)
        }
      }),
      new Promise((resolve) => {
        var code = Array.from(document.querySelectorAll('code[class^=language-]'))
        if (!state.content.syntax || !code.length) {
          resolve()
        }
        else {
          setTimeout(() => resolve(), 40)
        }
      }),
      new Promise((resolve) => {
        var diagrams = Array.from(document.querySelectorAll('code.mermaid'))
        if (!state.content.mermaid || !diagrams.length) {
          resolve()
        }
        else {
          var timeout = setInterval(() => {
            var svg = Array.from(document.querySelectorAll('code.mermaid svg'))
            if (diagrams.length === svg.length || document.documentElement.dataset.markdownViewerMermaidStatus === 'error') {
              clearInterval(timeout)
              resolve()
            }
          }, 50)
        }
      }),
      new Promise((resolve) => {
        if (!state.content.mathjax) {
          resolve()
        }
        else {
          var timeout = setInterval(() => {
            if (mj.loaded) {
              clearInterval(timeout)
              resolve()
            }
          }, 50)
        }
      })
    ]).then(done)
  }
  function listen (container, done) {
    var listener = /html|body/i.test(container.nodeName) ? window : container
    var timeout = null
    listener.addEventListener('scroll', () => {
      clearTimeout(timeout)
      timeout = setTimeout(done, 100)
    })
  }
  function get (container, prefix, offset) {
    var key = prefix + location.origin + location.pathname
    if (offset) {
      container.scrollTop = offset
      return
    }
    try {
      container.scrollTop = parseInt(localStorage.getItem(key))
    }
    catch (err) {
      chrome.storage.local.get(key, (res) => {
        container.scrollTop = parseInt(res[key])
      })
    }
  }
  function set (container, prefix) {
    var key = prefix + location.origin + location.pathname
    listen(container, () => {
      try {
        localStorage.setItem(key, container.scrollTop)
      }
      catch (err) {
        chrome.storage.local.set({[key]: container.scrollTop})
      }
    })
  }
  var pending = null
  var restoring = false
  var readPosition = () => {
    var top = document.scrollingElement.scrollTop
    var headings = Array.from(document.querySelectorAll('#_html h1[id], #_html h2[id], #_html h3[id], #_html h4[id], #_html h5[id], #_html h6[id]'))
    var heading = headings.filter((item) => item.getBoundingClientRect().top <= 1).pop()
    return {top, id: heading ? heading.id : '', offset: heading ? -heading.getBoundingClientRect().top : 0}
  }
  var syncHash = (position) => {
    var hash = position.id ? '#' + encodeURIComponent(position.id) : ''
    if (location.hash !== hash) history.replaceState(history.state, '', location.pathname + location.search + hash)
  }
  var listening = false
  var restore = (update) => {
    if ($('#_toc') && state.raw) $('#_toc').style.visibility = 'hidden'
    onload(() => {
      var container = document.scrollingElement

      if (update && pending) {
        var heading = document.getElementById(pending.id)
        container.scrollTop = heading
          ? container.scrollTop + heading.getBoundingClientRect().top + pending.offset
          : pending.top
        pending = null
      }
      else if (!update && location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)))) {
        var target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
        container.scrollTop += target.getBoundingClientRect().top
      }
      else {
        get(container, 'md-')
      }

      if (state.content.toc) {
        setTimeout(() => get($('#_toc'), 'md-toc-'), 10)
      }

      if (!listening) {
        listening = true
        listen(container, () => {
          if (restoring) return
          var position = readPosition()
          var key = 'md-' + location.origin + location.pathname
          try {
            localStorage.setItem(key, position.top)
          }
          catch (err) {
            chrome.storage.local.set({[key]: position.top})
          }
          syncHash(position)
        })
        if (state.content.toc) {
          setTimeout(() => set($('#_toc'), 'md-toc-'), 10)
        }
      }

      if ($('#_html')) $('#_html').style.visibility = 'visible'
      if ($('#_toc') && !state.raw) $('#_toc').style.visibility = 'visible'
      restoring = false
      if (update) syncHash(readPosition())
    })
  }
  restore.capture = () => {
    pending = readPosition()
    restoring = true
  }
  return restore
})()
