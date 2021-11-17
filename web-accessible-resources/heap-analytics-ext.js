/*
This file is the combined output of multiple src files. Do not edit it directly.
*/
isExtDevMode = true
console.log('Heap Analytics (Extension) > Running')
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFsdC9saWIvY29uY2F0LW5vdGUuanMiLCJhbHQvbGliL2Rldi1tb2RlLmpzIiwiYWx0L3BsdWdpbnYzL2hlYXAtYW5hbHl0aWNzLWV4dC5qcyIsImFsdC9saWIvaGVhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUNGQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbHQvZGlzdC9jaHJvbWUtZXh0ZW5zaW9uL3dlYi1hY2Nlc3NpYmxlLXJlc291cmNlcy9oZWFwLWFuYWx5dGljcy1leHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuVGhpcyBmaWxlIGlzIHRoZSBjb21iaW5lZCBvdXRwdXQgb2YgbXVsdGlwbGUgc3JjIGZpbGVzLiBEbyBub3QgZWRpdCBpdCBkaXJlY3RseS5cbiovIiwiaXNFeHREZXZNb2RlID0gdHJ1ZSIsImNvbnNvbGUubG9nKCdIZWFwIEFuYWx5dGljcyAoRXh0ZW5zaW9uKSA+IFJ1bm5pbmcnKVxubGV0IHByb2QgPSAnNzAyOTU5MjMyJyxcbiAgZGV2ID0gJzI4MjM3NDY5MDcnLFxuICBlbnYgPSBwcm9kIiwiOyh3aW5kb3cuaGVhcCA9IHdpbmRvdy5oZWFwIHx8IFtdKSxcbihoZWFwLmxvYWQgPSBmdW5jdGlvbiAoZSwgdCkge1xuICAod2luZG93LmhlYXAuYXBwaWQgPSBlKSwgKHdpbmRvdy5oZWFwLmNvbmZpZyA9IHQgPSB0IHx8IHt9KVxuICBsZXQgciA9IHQuZm9yY2VTU0wgfHwgJ2h0dHBzOicgPT09IGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sLFxuICAgIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgIDsoYS50eXBlID0gJ3RleHQvamF2YXNjcmlwdCcpLCAoYS5hc3luYyA9ICEwKSwgKGEuc3JjID0gKHIgPyAnaHR0cHM6JyA6ICdodHRwOicpICsgJy8vY2RuLmhlYXBhbmFseXRpY3MuY29tL2pzL2hlYXAtJyArIGUgKyAnLmpzJylcbiAgbGV0IG4gPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF1cbiAgbi5wYXJlbnROb2RlLmluc2VydEJlZm9yZShhLCBuKVxuICBmb3IgKFxuICAgIGxldCBvID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBoZWFwLnB1c2goW2VdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSlcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHAgPSBbXG4gICAgICAgICdhZGRFdmVudFByb3BlcnRpZXMnLFxuICAgICAgICAnYWRkVXNlclByb3BlcnRpZXMnLFxuICAgICAgICAnY2xlYXJFdmVudFByb3BlcnRpZXMnLFxuICAgICAgICAnaWRlbnRpZnknLFxuICAgICAgICAncmVtb3ZlRXZlbnRQcm9wZXJ0eScsXG4gICAgICAgICdzZXRFdmVudFByb3BlcnRpZXMnLFxuICAgICAgICAndHJhY2snLFxuICAgICAgICAndW5zZXRFdmVudFByb3BlcnR5J1xuICAgICAgXSxcbiAgICAgIGMgPSAwO1xuICAgIGMgPCBwLmxlbmd0aDtcbiAgICBjKytcbiAgKSB7XG4gICAgaGVhcFtwW2NdXSA9IG8ocFtjXSlcbiAgfVxufSlcblxuaGVhcC5sb2FkKGVudiwge1xuICBmb3JjZVNTTDogdHJ1ZVxufSkiXX0=
