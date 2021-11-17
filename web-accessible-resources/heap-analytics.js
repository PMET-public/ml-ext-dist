/*
This file is the combined output of multiple src files. Do not edit it directly.
*/
isExtDevMode = true
console.log('Heap Analytics (MarketoLive) > Running')
let prod = '3521051524',
  dev = '3020587545',
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFsdC9saWIvY29uY2F0LW5vdGUuanMiLCJhbHQvbGliL2Rldi1tb2RlLmpzIiwiYWx0L3BsdWdpbnYzL2hlYXAtYW5hbHl0aWNzLmpzIiwiYWx0L2xpYi9oZWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQ0ZBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsdC9kaXN0L2Nocm9tZS1leHRlbnNpb24vd2ViLWFjY2Vzc2libGUtcmVzb3VyY2VzL2hlYXAtYW5hbHl0aWNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcblRoaXMgZmlsZSBpcyB0aGUgY29tYmluZWQgb3V0cHV0IG9mIG11bHRpcGxlIHNyYyBmaWxlcy4gRG8gbm90IGVkaXQgaXQgZGlyZWN0bHkuXG4qLyIsImlzRXh0RGV2TW9kZSA9IHRydWUiLCJjb25zb2xlLmxvZygnSGVhcCBBbmFseXRpY3MgKE1hcmtldG9MaXZlKSA+IFJ1bm5pbmcnKVxubGV0IHByb2QgPSAnMzUyMTA1MTUyNCcsXG4gIGRldiA9ICczMDIwNTg3NTQ1JyxcbiAgZW52ID0gcHJvZCIsIjsod2luZG93LmhlYXAgPSB3aW5kb3cuaGVhcCB8fCBbXSksXG4oaGVhcC5sb2FkID0gZnVuY3Rpb24gKGUsIHQpIHtcbiAgKHdpbmRvdy5oZWFwLmFwcGlkID0gZSksICh3aW5kb3cuaGVhcC5jb25maWcgPSB0ID0gdCB8fCB7fSlcbiAgbGV0IHIgPSB0LmZvcmNlU1NMIHx8ICdodHRwczonID09PSBkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbCxcbiAgICBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0JylcbiAgICA7KGEudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnKSwgKGEuYXN5bmMgPSAhMCksIChhLnNyYyA9IChyID8gJ2h0dHBzOicgOiAnaHR0cDonKSArICcvL2Nkbi5oZWFwYW5hbHl0aWNzLmNvbS9qcy9oZWFwLScgKyBlICsgJy5qcycpXG4gIGxldCBuID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdXG4gIG4ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoYSwgbilcbiAgZm9yIChcbiAgICBsZXQgbyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaGVhcC5wdXNoKFtlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBwID0gW1xuICAgICAgICAnYWRkRXZlbnRQcm9wZXJ0aWVzJyxcbiAgICAgICAgJ2FkZFVzZXJQcm9wZXJ0aWVzJyxcbiAgICAgICAgJ2NsZWFyRXZlbnRQcm9wZXJ0aWVzJyxcbiAgICAgICAgJ2lkZW50aWZ5JyxcbiAgICAgICAgJ3JlbW92ZUV2ZW50UHJvcGVydHknLFxuICAgICAgICAnc2V0RXZlbnRQcm9wZXJ0aWVzJyxcbiAgICAgICAgJ3RyYWNrJyxcbiAgICAgICAgJ3Vuc2V0RXZlbnRQcm9wZXJ0eSdcbiAgICAgIF0sXG4gICAgICBjID0gMDtcbiAgICBjIDwgcC5sZW5ndGg7XG4gICAgYysrXG4gICkge1xuICAgIGhlYXBbcFtjXV0gPSBvKHBbY10pXG4gIH1cbn0pXG5cbmhlYXAubG9hZChlbnYsIHtcbiAgZm9yY2VTU0w6IHRydWVcbn0pIl19
