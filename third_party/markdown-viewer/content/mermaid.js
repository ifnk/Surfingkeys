
var mmd = (() => {
  var loaded = false
  var rendering = Promise.resolve()
  var activeViewer = null

  var closeViewer = () => {
    if (!activeViewer) return
    activeViewer.resizeObserver.disconnect()
    activeViewer.overlay.remove()
    document.body.classList.remove('markdown-viewer-diagram-open')
    activeViewer = null
    document.documentElement.dataset.markdownViewerDiagramMode = 'closed'
    document.dispatchEvent(new CustomEvent('surfingkeys:markdownViewerMode', {detail: {open: false}}))
  }

  // 全屏图统一使用视窗像素坐标：屏幕位置 = 平移 + 图内位置 × 缩放。
  var fitTransform = (width, height, stageWidth, stageHeight) => {
    var scale = Math.min((stageWidth - 32) / width, (stageHeight - 32) / height)
    scale = Math.min(20, Math.max(0.01, scale))
    return {scale, x: (stageWidth - width * scale) / 2, y: (stageHeight - height * scale) / 2}
  }

  var zoomTransform = (transform, factor, anchor) => {
    var scale = Math.min(20, Math.max(0.01, transform.scale * factor))
    return {
      scale,
      x: anchor.x - (anchor.x - transform.x) * scale / transform.scale,
      y: anchor.y - (anchor.y - transform.y) * scale / transform.scale
    }
  }

  var panTransform = (transform, dx, dy) => ({...transform, x: transform.x + dx, y: transform.y + dy})

  var setViewerTransform = (transform, fitted = false) => {
    if (!activeViewer) return
    activeViewer.transform = transform
    activeViewer.fit = fitted
    activeViewer.svg.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
  }

  var handleViewerKey = (key) => {
    if (!activeViewer) return false
    var step = 80
    if (key === '+' || key === '=' || key === 'Add') zoomViewerAtCenter(1.3)
    else if (key === '-' || key === '_' || key === 'Subtract') zoomViewerAtCenter(1 / 1.3)
    else if (key === 'h') setViewerTransform(panTransform(activeViewer.transform, step, 0))
    else if (key === 'l') setViewerTransform(panTransform(activeViewer.transform, -step, 0))
    else if (key === 'j') setViewerTransform(panTransform(activeViewer.transform, 0, -step))
    else if (key === 'k') setViewerTransform(panTransform(activeViewer.transform, 0, step))
    else if (key === 'Escape') closeViewer()
    else return false
    return true
  }

  document.addEventListener('surfingkeys:markdownViewerKey', (event) => {
    handleViewerKey(event.detail.key)
  })
  window.addEventListener('keydown', (event) => {
    if (!activeViewer || document.documentElement.dataset.surfingkeysMarkdownViewer === 'ready'
      || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return
    if (handleViewerKey(event.key)) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }, true)

  var setButtonStatus = (button, label, status) => {
    button.textContent = status
    setTimeout(() => { if (button.isConnected) button.textContent = label }, 2000)
  }

  var copySource = async (source, button) => {
    try {
      await navigator.clipboard.writeText(source)
      setButtonStatus(button, '复制代码', '代码已复制')
    }
    catch (error) {
      setButtonStatus(button, '复制代码', '复制失败')
      console.error('[Markdown Viewer Mermaid code copy]', error)
    }
  }

  var renderedLabelLines = (label) => {
    var walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT)
    var range = document.createRange()
    var lines = []
    var node
    while ((node = walker.nextNode())) {
      for (var index = 0; index < node.textContent.length; index++) {
        range.setStart(node, index)
        range.setEnd(node, index + 1)
        var rect = range.getBoundingClientRect()
        if (!rect.height) continue
        var current = lines[lines.length - 1]
        if (!current || Math.abs(current.top - rect.top) > 2) {
          lines.push({top: rect.top, text: node.textContent[index]})
        }
        else current.text += node.textContent[index]
      }
    }
    return lines.map((line) => line.text.trim()).filter(Boolean)
  }

  var copyPng = async (svg, button) => {
    var cleanSvg = svg.cloneNode(true)
    cleanSvg.removeAttribute('style')
    var originalLabels = svg.querySelectorAll('foreignObject')
    cleanSvg.querySelectorAll('foreignObject').forEach((label, index) => {
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      var original = originalLabels[index]
      var lines = renderedLabelLines(original)
      if (!lines.length) lines = [label.textContent.trim()]
      var height = Number(label.getAttribute('height')) || 21
      var font = getComputedStyle(original.querySelector('p') || original)
      var lineHeight = parseFloat(font.lineHeight) || 21
      text.setAttribute('x', String((Number(label.getAttribute('width')) || 0) / 2))
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'middle')
      text.setAttribute('font-family', font.fontFamily)
      text.setAttribute('font-size', font.fontSize)
      text.setAttribute('fill', font.color)
      lines.forEach((line, index) => {
        var span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
        span.setAttribute('x', text.getAttribute('x'))
        span.setAttribute('y', String((height - lines.length * lineHeight) / 2 + (index + 0.5) * lineHeight))
        span.textContent = line
        text.appendChild(span)
      })
      label.replaceWith(text)
    })
    var viewBox = svg.viewBox.baseVal
    if (viewBox.width && viewBox.height) {
      cleanSvg.setAttribute('width', String(Math.ceil(viewBox.width)))
      cleanSvg.setAttribute('height', String(Math.ceil(viewBox.height)))
    }
    var markup = new XMLSerializer().serializeToString(cleanSvg)
    try {
      var png = (async () => {
        var svgUrl = URL.createObjectURL(new Blob([markup], {type: 'image/svg+xml'}))
        var bitmap = new Image()
        try {
          bitmap.src = svgUrl
          await bitmap.decode()
        }
        finally {
          URL.revokeObjectURL(svgUrl)
        }
        var canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        var context = canvas.getContext('2d')
        context.fillStyle = '#fff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(bitmap, 0, 0)
        var blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (!blob) throw new Error('PNG encoding failed')
        return blob
      })()
      await navigator.clipboard.write([new ClipboardItem({'image/png': png})])
      setButtonStatus(button, '复制 PNG', 'PNG 已复制')
    }
    catch (error) {
      setButtonStatus(button, '复制 PNG', '复制失败')
      console.error('[Markdown Viewer Mermaid PNG copy]', error)
    }
  }

  var zoomViewerAtCenter = (factor) => {
    var {stage, transform} = activeViewer
    setViewerTransform(zoomTransform(transform, factor,
      {x: stage.clientWidth / 2, y: stage.clientHeight / 2}))
  }

  var fitViewer = () => {
    if (!activeViewer) return
    var {stage, width, height} = activeViewer
    if (!stage.clientWidth || !stage.clientHeight || !width || !height) return
    setViewerTransform(fitTransform(width, height, stage.clientWidth, stage.clientHeight), true)
  }

  var openViewer = (source) => {
    closeViewer()
    var overlay = document.createElement('div')
    overlay.className = 'markdown-viewer-diagram-overlay'
    overlay.innerHTML = '<div class="markdown-viewer-diagram-toolbar"><span>+ / - 缩放　h j k l 平移　Esc 退出</span><div class="markdown-viewer-diagram-toolbar-actions"><button type="button" data-action="fit">适应窗口</button><button type="button" data-action="copy-png">复制 PNG</button><button type="button" data-action="close">关闭</button></div></div><div class="markdown-viewer-diagram-stage"></div>'
    var svg = source.cloneNode(true)
    svg.removeAttribute('style')
    var stage = overlay.querySelector('.markdown-viewer-diagram-stage')
    stage.appendChild(svg)
    document.body.appendChild(overlay)
    document.body.classList.add('markdown-viewer-diagram-open')
    var viewBox = svg.viewBox.baseVal
    var width = viewBox.width || svg.getBBox().width
    var height = viewBox.height || svg.getBBox().height
    svg.style.width = `${width}px`
    svg.style.height = `${height}px`
    var resizeObserver = new ResizeObserver(() => {
      if (activeViewer && activeViewer.fit) fitViewer()
    })
    activeViewer = {overlay, svg, stage, width, height, resizeObserver, fit: true,
      transform: {scale: 1, x: 0, y: 0}}
    fitViewer()
    resizeObserver.observe(stage)
    document.documentElement.dataset.markdownViewerDiagramMode = 'open'
    document.dispatchEvent(new CustomEvent('surfingkeys:markdownViewerMode', {detail: {open: true}}))
    overlay.querySelector('[data-action="close"]').addEventListener('click', closeViewer)
    overlay.querySelector('[data-action="fit"]').addEventListener('click', fitViewer)
    var copyButton = overlay.querySelector('[data-action="copy-png"]')
    copyButton.addEventListener('click', () => copyPng(source, copyButton))
    stage.addEventListener('wheel', (event) => {
      event.preventDefault()
      var rect = stage.getBoundingClientRect()
      var delta = event.deltaY || event.deltaX
      if (!delta) return
      var pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1)
      var factor = Math.min(4, Math.max(0.25, Math.exp(-pixels * 0.0015)))
      setViewerTransform(zoomTransform(activeViewer.transform, factor,
        {x: event.clientX - rect.left, y: event.clientY - rect.top}))
    }, {passive: false})
    var drag = null
    stage.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return
      drag = {id: event.pointerId, x: event.clientX, y: event.clientY, transform: activeViewer.transform}
      stage.setPointerCapture(event.pointerId)
    })
    stage.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id) return
      setViewerTransform(panTransform(drag.transform, event.clientX - drag.x, event.clientY - drag.y))
    })
    var endDrag = (event) => { if (drag && event.pointerId === drag.id) drag = null }
    stage.addEventListener('pointerup', endDrag)
    stage.addEventListener('pointercancel', endDrag)
  }

  var walk = (regex, string, result = [], match = regex.exec(string)) =>
    !match ? result : walk(regex, string, result.concat(match[1]))

  var render = async () => {
    closeViewer()
    if (loaded) {
      var definitions = walk(/<pre><code class="mermaid">([\s\S]+?)<\/code><\/pre>/gi, state.html)

      Array.from(document.querySelectorAll('pre code.mermaid')).forEach((diagram, index) => {
        diagram.removeAttribute('data-processed')
        diagram.innerHTML = definitions[index]
      })
    }
    var dark =
      state._themes[state.theme] === 'dark' ||
      (state._themes[state.theme] === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    var theme = dark ? 'redux-dark-color' : 'redux-color'
    var debug = document.documentElement.dataset
    debug.markdownViewerMermaidVersion = '12.0.0'
    debug.markdownViewerMermaidTheme = theme
    debug.markdownViewerMermaidLook = 'neo'
    debug.markdownViewerMermaidLayout = 'elk'
    debug.markdownViewerMermaidDensity = 'compact'
    debug.markdownViewerMermaidStatus = 'rendering'
    delete debug.markdownViewerMermaidError

    mermaid.initialize({
      theme,
      look: 'neo',
      layout: 'elk',
      startOnLoad: false,
      flowchart: {nodeSpacing: 5, rankSpacing: 5, diagramPadding: 4, padding: 5},
      sequence: {actorMargin: 10, width: 120}
    })
    var sources = new Map(Array.from(document.querySelectorAll('pre code.mermaid'))
      .map((diagram) => [diagram, diagram.textContent]))
    await mermaid.run({querySelector: 'code.mermaid'})
    loaded = true

    var diagrams = Array.from(document.querySelectorAll('code.mermaid'))
    var svg = Array.from(document.querySelectorAll('pre code.mermaid svg'))
    debug.markdownViewerMermaidCount = String(svg.length)
    debug.markdownViewerMermaidStatus = svg.length === diagrams.length ? 'ready' : 'incomplete'
    svg.forEach((diagram) => {
      var panzoom = Panzoom(diagram, {canvas: true})
      var pre = diagram.parentElement.parentElement
      pre.addEventListener('wheel', (e) => {
        if (!e.shiftKey) return
        panzoom.zoomWithWheel(e)
      })
      var toolbar = document.createElement('div')
      toolbar.className = 'markdown-viewer-diagram-actions'
      var copy = document.createElement('button')
      copy.type = 'button'
      copy.textContent = '复制代码'
      copy.title = '复制 Mermaid 源代码'
      copy.addEventListener('click', () => copySource(sources.get(diagram.parentElement), copy))
      var png = document.createElement('button')
      png.type = 'button'
      png.textContent = '复制 PNG'
      png.title = '复制 PNG 图像到剪贴板'
      png.addEventListener('click', () => copyPng(diagram, png))
      var enlarge = document.createElement('button')
      enlarge.type = 'button'
      enlarge.textContent = '放大'
      enlarge.title = '放大查看图表'
      enlarge.addEventListener('click', () => openViewer(diagram))
      toolbar.append(copy, png, enlarge)
      pre.appendChild(toolbar)
    })
  }

  return {
    render: () => {
      rendering = rendering.catch(() => {}).then(render).catch((error) => {
        document.documentElement.dataset.markdownViewerMermaidStatus = 'error'
        document.documentElement.dataset.markdownViewerMermaidError = String(error)
        console.error('[Markdown Viewer Mermaid 12]', error)
      })
      return rendering
    }
  }
})()
