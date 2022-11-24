// DO NOT EDIT! All changes will be lost. This is a temporary, auto-generated file using gulp to combine javascript sources.
window.MARKETO_EXT_VERSION = 'v22.12.1'; // version also automatically injected via gulp using manifest.json

console.log('Heap Analytics (Extension) > Running', MARKETO_EXT_VERSION)
let prod = '702959232',
  dev = '2823746907',
  env = prod
;(window.heap = window.heap || []),
(heap.load = function (e, t) {
  (window.heap.appid = e), (window.heap.config = t = t || {})
  let r = t.forceSSL || 'https:' === document.location.protocol,
    a = document.createElement('script')
    ;(a.type = 'text/javascript'), (a.async = !0), (a.src = (r ? 'https:' : 'http:') + '//cdn.heapanalytics.com/js/heap-' + e + '.js')
  let n = document.getElementsByTagName('script')[0]
  n.parentNode.insertBefore(a, n)
  for (
    let o = function (e) {
        return function () {
          heap.push([e].concat(Array.prototype.slice.call(arguments, 0)))
        }
      },
      p = [
        'addEventProperties',
        'addUserProperties',
        'clearEventProperties',
        'identify',
        'removeEventProperty',
        'setEventProperties',
        'track',
        'unsetEventProperty'
      ],
      c = 0;
    c < p.length;
    c++
  ) {
    heap[p[c]] = o(p[c])
  }
})

heap.load(env, {
  forceSSL: true
})