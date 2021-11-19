/*
This file is the combined output of multiple src files. Do not edit it directly.
*/
isExtDevMode = true
// catch all for globally defined functions used by any file

// the web accessible resources prefix needs to exist in the chrome extension context AND the window context
// so injected scripts can access other scripts
window.warPrefix
if (typeof warPrefix === 'undefined' &&
  typeof chrome !== 'undefined' &&
  typeof chrome.runtime !== 'undefined' &&
  typeof chrome.runtime.getURL !== 'undefined') {
  window.warPrefix = chrome.runtime.getURL('web-accessible-resources')

  // do not attempt to add this inline script to the extension background or popup page.
  // it's not allowed by Chrome's CSP and it's not needed b/c the warPrefix will be already be available
  // https://stackoverflow.com/questions/37218678/is-content-security-policy-unsafe-inline-deprecated
  if (!/^chrome-extension:.*(\/_generated_background_page\.html|\/popup\/popup.html)$/.test(location.href)) {
    let s = document.createElement('script')
    s.innerHTML = `window.warPrefix = '${warPrefix}'`
    document.head.appendChild(s)
  }
}

// eslint-disable-next-line no-var
var LIB = {

  MARKETO_LIVE_APP: 'https://marketolive.com/m3/pluginv3/marketo-app.js',
  MARKETO_GLOBAL_APP: 'https://marketolive.com/m3/pluginv3/marketo-global-app.js',
  GLOBAL_LANDING_PAGE: 'https://marketolive.com/m3/pluginv3/global-landing-page.js',
  HEAP_ANALYTICS_SCRIPT_LOCATION: 'https://marketolive.com/m3/pluginv3/heap-analytics-ext.js',

  addStyles: function (css) {
    let h = document.getElementsByTagName('head')[0],
      s = document.createElement('style')
    s.type = 'text/css'
    s.innerHTML = css
    h.appendChild(s)
  },

  isPropOfWindowObj: function (s) {
    if (typeof s !== 'string' || /[[(]]/.test(s)) {
      throw 'Invalid param to isPropOfWindowObj'
    }
    let a = s.split('.'),
      obj = window[a.shift()]
    while (obj && a.length) {
      obj = obj[a.shift()]
    }
    return !!obj
  },

  getExtensionId: function () {
    if (typeof chrome === 'object' && typeof chrome.runtime === 'object' && chrome.runtime.id) {
      return chrome.runtime.id
    } else {
      return warPrefix.replace(/.*:\/\/([^/]*).*/, '$1')
    }
  },

  reloadTabs: function (urlMatch) {
    chrome.tabs.query({url: urlMatch},
      function (tabs) {
        for (let i = 0; i < tabs.length; i++) {
          chrome.tabs.reload(tabs[i].id)
        }
      }
    )
  },

  getCookie: function (cookieName) {
    console.log('Getting: Cookie ' + cookieName)
    let name = cookieName + '=',
      cookies = document.cookie.split(';'),
      currCookie

    for (let ii = 0; ii < cookies.length; ii++) {
      currCookie = cookies[ii].trim()
      if (currCookie.indexOf(name) == 0) {
        return currCookie.substring(name.length, currCookie.length)
      }
    }
    console.log('Getting: Cookie ' + cookieName + ' not found')
    return null
  },

  removeCookie: function (obj) {
    let cookie = {
      url: obj.url,
      name: obj.name
    }
    chrome.cookies.remove(cookie, function () {
      console.log('Removing: ' + cookie.name + ' Cookie for ' + cookie.url)
    })
  },

  setCookie: function (obj) {
    let cookie = {
      url: obj.url,
      name: obj.name,
      value: obj.value,
      domain: obj.domain
    }

    if (obj.expiresInDays) {
      cookie.expirationDate = new Date().getTime() / 1000 + obj.expiresInDays * 24 * 60 * 60
    }
    if (obj.secure) {
      cookie.secure = obj.secure
    }

    chrome.cookies.set(cookie, function () {
      if (cookie.value != null) {
        console.log('Setting: ' + cookie.name + ' Cookie for ' + cookie.domain + ' = ' + cookie.value)
      } else {
        console.log('Setting: ' + cookie.name + ' Cookie for ' + cookie.domain + ' = null')
      }
    })
  },

  formatText: function (text) {
    let splitText = text.trim().split(' '),
      formattedText = ''

    for (let ii = 0; ii < splitText.length; ii++) {
      if (ii != 0) {
        formattedText += ' '
      }
      formattedText += splitText[ii].charAt(0).toUpperCase() + splitText[ii].substring(1).toLowerCase()
    }

    return formattedText
  },

  getUrlParam: function (param) {
    console.log('Getting: URL Parameter: ' + param)
    let paramString = window.location.href.split('?')[1]

    if (paramString) {
      let params = paramString.split('&'),
        paramPair,
        paramName,
        paramValue

      for (let ii = 0; ii < params.length; ii++) {
        paramPair = params[ii].split('=')
        paramName = paramPair[0]
        paramValue = paramPair[1]

        if (paramName == param) {
          paramValue = decodeURIComponent(paramValue)
          if (paramValue.search(/^http(s)?:\/\//) == -1) {
            paramValue = paramValue.replace(/\+/g, ' ')
          }
          console.log('URL Parameter: ' + paramName + ' = ' + paramValue)
          return paramValue
        }
      }
    }
    return ''
  },

  loadScript: function (scriptSrc) {
    scriptSrc = scriptSrc.replace('https://marketolive.com/m3/pluginv3', warPrefix)
    console.log('Loading: Script: ' + scriptSrc)
    let scriptElement = document.createElement('script')
    scriptElement.async = true
    scriptElement.src = scriptSrc
    document.getElementsByTagName('head')[0].appendChild(scriptElement)
  },

  webRequest: function (url, params, method, async, responseType, callback) {
    url = url.replace('https://marketolive.com/m3/pluginv3', warPrefix)
    console.log('Web Request > ' + url + '\n' + params)
    let xmlHttp = new XMLHttpRequest(),
      result
    xmlHttp.onreadystatechange = function () {
      if (typeof callback === 'function' && xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        result = callback(xmlHttp.response)
      }
    }
    if (async && xmlHttp.responseType) {
      xmlHttp.responseType = responseType
    }
    xmlHttp.open(method, url, async) // true for asynchronous
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=UTF-8')

    // khb: is this header necessary? why not set it all the time?
    if (url.search(/^\//) != -1 || url.replace(/^[a-z]+:\/\/([^/]+)\/?.*$/, '$1') == window.location.host) {
      xmlHttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    }

    xmlHttp.withCredentials = true
    xmlHttp.send(params)
    return result
  },

  validateDemoExtensionCheck: function (isValidExtension) {
    console.log('> Validating: Demo Extension Check')
    if (isValidExtension) {
      window.mkto_live_extension_state = 'MarketoLive extension is alive!'
      console.log('> Validating: Demo Extension IS Valid')
    } else if (LIB.isPropOfWindowObj('MktPage.validateDemoExtension')) {
      window.mkto_live_extension_state = null
      MktPage.validateDemoExtension(new Date())
      console.log('> Validating: Demo Extension IS NOT Valid')
    }
  },

  getMkt3CtlrAsset: function(key, method) {
    try {
      return Mkt3.app.controllers.get(key)[method]()
    } catch (e) {
      return false
    }
  },

  // overlays an email with the user submitted company logo and color
  // action - mode in which this asset is being viewed (edit/preview)
  overlayEmail: function (action) {
    console.log('> Overlaying: Email')
    let isEmailEditor2,
      clearOverlayVars,
      overlay,
      isMktoHeaderBgColorReplaced =
        (isMktoImgReplaced =
          isMktoHeroBgReplaced =
          isMktoTextReplaced =
          isMktoSubTextReplaced =
          isMktoButtonReplaced =
          isMktoEmail1Replaced =
          editorPrevReady =
          desktopPrevReady =
          phonePrevReady =
          isDesktopPreviewReplaced =
          isPhonePreviewReplaced =
          false),
      logoMktoNameRegex = new RegExp('logo', 'i'),
      buttonTextRegex = new RegExp('signup|sign up|call to action|cta|register|more|contribute', 'i'),
      saveEditsToggle = LIB.getCookie('saveEditsToggleState'),
      logo = LIB.getCookie('logo'),
      heroBackground = LIB.getCookie('heroBackground'),
      color = LIB.getCookie('color'),
      defaultColor = 'rgb(42, 83, 112)',
      logoMaxHeight = '55',
      mktoMainText = 'You To The<br><br>PREMIER BUSINESS EVENT<br>OF THE YEAR',
      mktoSubText = LIB.getHumanDate(),
      company,
      companyName,
      editorRepeatReadyCount = (desktopRepeatReadyCount = phoneRepeatReadyCount = 0),
      maxRepeatReady = 2000,
      maxPreviewRepeatReady = 3000

    if (saveEditsToggle == 'true' || (logo == null && heroBackground == null && color == null)) {
      return false
    }
    if (logo != null) {
      company = logo.split('https://logo.clearbit.com/')[1].split('.')[0]
      companyName = company.charAt(0).toUpperCase() + company.slice(1)
      mktoMainText = companyName + ' Invites ' + mktoMainText
    } else {
      mktoMainText = 'We Invite ' + mktoMainText
    }

    clearOverlayVars = function () {
      isMktoHeaderBgColorReplaced =
        isMktoImgReplaced =
        isMktoHeroBgReplaced =
        isMktoTextReplaced =
        isMktoSubTextReplaced =
        isMktoButtonReplaced =
        isMktoEmail1Replaced =
        false
      emailBody =
        mktoImgs =
        mktoTexts =
        mktoButtons =
        logoSwapCompany =
        logoSwapContainer =
        logoSwapCompanyContainer =
        logoBkg =
        buttonBkg =
        null
    }

    overlay = function (emailDocument) {
      if (emailDocument) {
        let emailBody = emailDocument.getElementsByTagName('body')[0],
          logoSwapCompany = emailDocument.getElementById('logo-swap-company'),
          logoSwapContainer = emailDocument.getElementById('logo-swap-container'),
          logoSwapCompanyContainer = emailDocument.getElementById('logo-swap-company-container'),
          logoBkg = emailDocument.getElementById('logo-bkg'),
          buttonBkg = emailDocument.getElementById('button-bkg')

        if (emailBody && emailBody.innerHTML) {
          let mktoHeader = emailDocument.getElementsByName('header')[0],
            mktoLogo1 = emailDocument.getElementsByName('logo')[0],
            mktoLogo2 = emailDocument.getElementsByName('logo')[1],
            mktoImgs = emailBody.getElementsByClassName('mktoImg'),
            mktoHeroBg = emailDocument.getElementsByName('heroBackground')[0],
            mktoTds = emailBody.getElementsByTagName('td'),
            mktoTitle = emailDocument.getElementsByName('title')[0],
            mktoSubtitle = emailDocument.getElementsByName('subtitle')[0],
            mktoTexts = emailBody.getElementsByClassName('mktoText'),
            mktoButton = emailDocument.getElementsByName('button')[0],
            mktoButtons = emailBody.getElementsByClassName('secondary-font button')

          if (!isMktoHeaderBgColorReplaced && color && mktoHeader) {
            console.log('> Overlaying: Email 2.0 Header Background Company Color for Demo Svcs Template')
            mktoHeader.style.setProperty('background-color', color)
            mktoHeader.setAttribute('bgColor', color)
            isMktoHeaderBgColorReplaced = true
          }

          if (!isMktoImgReplaced && logo && (mktoLogo1 || mktoLogo2 || mktoImgs.length != 0)) {
            if (mktoLogo1 || mktoLogo2) {
              console.log('> Overlaying: Email 2.0 Company Logo for Demo Svcs Template')
              if (mktoLogo1 && mktoLogo1.getAttribute('display') != 'none') {
                console.log('> Overlaying: Email 2.0 Company Logo 1')
                mktoLogo1.style.width = 'auto'
                mktoLogo1.style.height = 'auto'
                mktoLogo1.setAttribute('src', logo)
                isMktoImgReplaced = true
              }

              if (mktoLogo2 && mktoLogo2.getAttribute('display') != 'none') {
                console.log('> Overlaying: Email 2.0 Company Logo 2')
                mktoLogo2.style.width = 'auto'
                mktoLogo2.style.height = 'auto'
                mktoLogo2.setAttribute('src', logo)
                isMktoImgReplaced = true
              }
            } else {
              for (let ii = 0; ii < mktoImgs.length; ii++) {
                let currMktoImg = mktoImgs[ii],
                  currMktoImgMktoName

                if (currMktoImg.getAttribute('mktoname')) {
                  currMktoImgMktoName = currMktoImg.getAttribute('mktoname')
                } else if (currMktoImg.getAttribute('id')) {
                  currMktoImgMktoName = currMktoImg.getAttribute('id')
                }

                if (currMktoImgMktoName && currMktoImgMktoName.search(logoMktoNameRegex) != -1) {
                  let currMktoImgTag = currMktoImg.getElementsByTagName('img')[0]

                  if (currMktoImgTag && currMktoImgTag.getAttribute('src')) {
                    console.log('> Overlaying: Email 2.0 Company Logo')
                    currMktoImgTag.style.width = 'auto'
                    currMktoImgTag.style.height = 'auto'
                    currMktoImgTag.setAttribute('src', logo)
                    isMktoImgReplaced = true
                    break
                  }
                }
              }
            }
          }

          if (!isMktoHeroBgReplaced && heroBackground && (mktoHeroBg || mktoTds.length != 0)) {
            if (mktoHeroBg) {
              console.log('> Overlaying: Email 2.0 Hero Company Background for Demo Svcs Template')
              mktoHeroBg.style.setProperty('background-image', 'url(\'' + heroBackground + '\')')
              mktoHeroBg.setAttribute('background', heroBackground)
              //mktoHeroBg.style.setProperty("background-size", "cover");
              isMktoHeroBgReplaced = true
            } else {
              for (let ii = 0; ii < mktoTds.length; ii++) {
                let currMktoTd = mktoTds[ii]

                if (currMktoTd && currMktoTd.getAttribute('background')) {
                  console.log('> Overlaying: Email 2.0 Hero Company Background')
                  currMktoTd.setAttribute('background', heroBackground)
                  currMktoTd.style.setProperty('background-image', 'url(\'' + heroBackground + '\')')
                  //currMktoTd.style.setProperty("background-size", "cover");
                  isMktoHeroBgReplaced = true
                  break
                }
              }
            }
          }

          if (!isMktoButtonReplaced && color && (mktoButton || mktoButtons.length != 0)) {
            if (mktoButton) {
              console.log('> Overlaying: Email 2.0 Button Company Color for Demo Svcs Template')
              mktoButton.style.setProperty('background-color', color)
              mktoButton.style.setProperty('border-color', color)
              isMktoButtonReplaced = true
            } else {
              for (let ii = 0; ii < mktoButtons.length; ii++) {
                let currMktoButton = mktoButtons[ii]

                if (currMktoButton.innerHTML && currMktoButton.innerHTML.search(buttonTextRegex) != -1) {
                  if (currMktoButton.style && currMktoButton.style.backgroundColor) {
                    console.log('> Overlaying: Email 2.0 Button Company Color')
                    currMktoButton.style.backgroundColor = color
                    currMktoButton.style.borderColor = color
                    isMktoButtonReplaced = true
                    break
                  }
                }
              }
            }
          }
        }

        if (logoSwapCompanyContainer && logoSwapContainer && logoSwapCompany && logoBkg) {
          console.log('> Overlaying: Email 1.0 Company Logo & Color')
          if (color) {
            logoBkg.style.backgroundColor = color
          }

          if (logo) {
            logoSwapCompany.setAttribute('src', logo)

            logoSwapCompany.onload = function () {
              let logoHeightsRatio, logoWidth, logoNewWidth, logoNewHeight, logoStyle

              if (logoSwapCompany.naturalHeight && logoSwapCompany.naturalHeight > logoMaxHeight) {
                logoHeightsRatio = logoSwapCompany.naturalHeight / logoMaxHeight
                logoWidth = logoSwapCompany.naturalWidth / logoHeightsRatio
                logoSwapCompany.width = logoNewWidth = logoWidth
                logoSwapCompany.height = logoNewHeight = logoMaxHeight
              } else if (logoSwapCompany.naturalHeight) {
                logoSwapCompany.width = logoNewWidth = logoSwapCompany.naturalWidth
                logoSwapCompany.height = logoNewHeight = logoSwapCompany.naturalHeight
              } else {
                logoSwapCompany.width = logoSwapCompany.height = logoNewWidth = logoNewHeight = logoMaxHeight
              }

              if (emailDocument.getElementsByTagName('head') && emailDocument.getElementsByTagName('head')[0]) {
                logoStyle = document.createElement('style')
                logoStyle.innerHTML =
                  '#' + logoSwapCompany.id + ' {width : ' + logoNewWidth + 'px !important; height : ' + logoNewHeight + 'px !important;}'
                emailDocument.getElementsByTagName('head')[0].appendChild(logoStyle)
              }
              console.log('> Overlaying: Email 1.0 Company Logo Dimensions = ' + logoNewWidth + ' x ' + logoNewHeight)
            }
            logoSwapContainer.style.display = 'none'
            logoSwapCompanyContainer.style.display = 'block'
          }

          if (buttonBkg && color) {
            buttonBkg.style.setProperty('background-color', color)
          }
          isMktoEmail1Replaced = true
        }

        if (
          (isMktoButtonReplaced &&
            isMktoImgReplaced &&
            isMktoHeroBgReplaced &&
            (!mktoHeader || (mktoHeader && isMktoHeaderBgColorReplaced))) ||
          isMktoEmail1Replaced
        ) {
          clearOverlayVars()
          return true
        }
      }

      return false
    }

    isEmailEditor2 = window.setInterval(function () {
      if (action == 'edit') {
        console.log('> Overlaying: Email Designer')
        if (
          document.getElementsByTagName('iframe')[0] &&
          document.getElementsByTagName('iframe')[0].contentWindow &&
          document.getElementsByTagName('iframe')[0].contentWindow.document &&
          document.getElementsByTagName('iframe')[0].contentWindow.document.readyState == 'complete'
        ) {
          if (overlay(document.getElementsByTagName('iframe')[0].contentWindow.document) || editorRepeatReadyCount >= maxRepeatReady) {
            console.log('> Overlayed: Email Designer = ' + editorRepeatReadyCount)
            console.log('> Overlaying: Email Interval is Cleared')
            window.clearInterval(isEmailEditor2)
            clearOverlayVars()
            return true
          } else if (editorPrevReady) {
            editorRepeatReadyCount++
          } else {
            editorRepeatReadyCount = 1
          }
          editorPrevReady = true
        } else {
          editorPrevReady = false
        }
      } else if (action == 'preview') {
        console.log('> Overlaying: Email Previewer')
        if (
          !isDesktopPreviewReplaced &&
          document.getElementsByTagName('iframe')[2] &&
          document.getElementsByTagName('iframe')[2].contentWindow &&
          document.getElementsByTagName('iframe')[2].contentWindow.document &&
          document.getElementsByTagName('iframe')[2].contentWindow.document.readyState == 'complete'
        ) {
          if (
            overlay(document.getElementsByTagName('iframe')[2].contentWindow.document) ||
            desktopRepeatReadyCount >= maxPreviewRepeatReady
          ) {
            console.log('> Overlayed: Email Desktop Preview = ' + desktopRepeatReadyCount)
            isDesktopPreviewReplaced = true
            clearOverlayVars()
          } else if (desktopPrevReady) {
            desktopRepeatReadyCount++
          } else {
            desktopRepeatReadyCount = 1
          }
          desktopPrevReady = true
        } else {
          desktopPrevReady = false
        }

        if (
          !isPhonePreviewReplaced &&
          document.getElementsByTagName('iframe')[3] &&
          document.getElementsByTagName('iframe')[3].contentWindow &&
          document.getElementsByTagName('iframe')[3].contentWindow.document &&
          document.getElementsByTagName('iframe')[3].contentWindow.document.readyState == 'complete'
        ) {
          if (overlay(document.getElementsByTagName('iframe')[3].contentWindow.document) || phoneRepeatReadyCount >= maxPreviewRepeatReady) {
            console.log('> Overlayed: Email Phone Preview = ' + phoneRepeatReadyCount)
            isPhonePreviewReplaced = true
            clearOverlayVars()
          } else if (phonePrevReady) {
            phoneRepeatReadyCount++
          } else {
            phoneRepeatReadyCount = 1
          }
          phonePrevReady = true
        } else {
          phonePrevReady = false
        }

        if (isPhonePreviewReplaced && isDesktopPreviewReplaced) {
          console.log('> Overlaying: Email Interval is Cleared')
          window.clearInterval(isEmailEditor2)
          clearOverlayVars()
          return true
        }
      }
    }, 0)
  },

  // overlays a landing page with the user submitted company logo and color
  // action - mode in which this asset is being viewed (edit/preview)
  overlayLandingPage: function (action) {
    console.log('> Overlaying: Landing Page')
    let isLandingPageEditor,
      clearOverlayVars,
      overlay,
      isMktoFreeForm =
        (isMktoBackgroundColorReplaced =
          isMktoImgReplaced =
          isMktoHeroBgImgReplaced =
          isMktoTextReplaced =
          isMktoSubTextReplaced =
          isMktoButtonReplaced =
          isMktoOrigReplaced =
          desktopPrevReady =
          phonePrevReady =
          sideBySideDesktopPrevReady =
          sideBySidePhonePrevReady =
          isDesktopReplaced =
          isPhoneReplaced =
          isSideBySideDesktopReplaced =
          isSideBySidePhoneReplaced =
          false),
      mktoBodyId = 'bodyId',
      mktoFreeFormClassName = 'mktoMobileShow',
      logoRegex = new RegExp('primaryImage|primary_image|primary-image|logo|image_1|image-1|image1', 'i'),
      heroBgImgIdRegex = new RegExp('hero', 'i'),
      buttonTextRegex = new RegExp('signup|sign up|call to action|cta|register|more|contribute|submit', 'i'),
      saveEditsToggle = LIB.getCookie('saveEditsToggleState'),
      logo = LIB.getCookie('logo'),
      heroBackground = LIB.getCookie('heroBackground'),
      color = LIB.getCookie('color'),
      defaultColor = 'rgb(42, 83, 112)',
      logoOrigMaxHeight = '55',
      mktoMainText = 'You To Our Event',
      mktoSubText = LIB.getHumanDate(),
      company,
      companyName,
      linearGradient,
      desktopRepeatReadyCount = (phoneRepeatReadyCount = sideBySideDesktopRepeatReadyCount = sideBySidePhoneRepeatReadyCount = 0),
      maxRepeatReady = 2000,
      maxOtherRepeatReady = 2000,
      formatButtonStyle

    if (saveEditsToggle == 'true' || (logo == null && heroBackground == null && color == null)) {
      return false
    }
    if (logo != null) {
      company = logo.split('https://logo.clearbit.com/')[1].split('.')[0]
      companyName = company.charAt(0).toUpperCase() + company.slice(1)
      mktoMainText = companyName + ' Invites ' + mktoMainText
    } else {
      mktoMainText = 'We Invite ' + mktoMainText
    }

    if (color) {
      formButtonStyle = document.createElement('style')
      formButtonStyle.type = 'text/css'
      formButtonStyle.innerHTML =
        '.mktoButton { background-image: none !important; border-radius: 0 !important; border: none !important; background-color: ' +
        color +
        ' !important; }'
      linearGradient = 'linear-gradient(to bottom, ' + color + ', rgb(242, 242, 242)) !important'
    }

    clearOverlayVars = function () {
      isMktoBackgroundColorReplaced =
        isMktoImgReplaced =
        isMktoHeroBgImgReplaced =
        isMktoTextReplaced =
        isMktoSubTextReplaced =
        isMktoButtonReplaced =
        isMktoOrigReplaced =
        false
      iframeBody =
        logoImg =
        textBackground =
        bannerBackground =
        mainTitle =
        subTitle =
        mktoImgs =
        mktoTexts =
        mktoRichTexts =
        mktoButtons =
        null
    }

    overlay = function (iframeDocument) {
      if (iframeDocument) {
        let iframeBody = iframeDocument.getElementsByTagName('body')[0],
          logoImg = iframeDocument.getElementById('lp-logo'),
          textBackground = iframeDocument.getElementById('background-color'),
          bannerBackground = iframeDocument.getElementById('bigger-background'),
          mainTitle = iframeDocument.getElementById('title'),
          subTitle = iframeDocument.getElementById('sub-title')

        if (iframeBody && iframeBody.innerHTML) {
          let mktoHeader = iframeDocument.getElementsByName('header')[0],
            mktoLogo1 = iframeDocument.getElementsByName('logo')[0],
            mktoLogo2 = iframeDocument.getElementsByName('logo')[1],
            mktoImgs = iframeBody.getElementsByClassName('lpimg'),
            mktoHeroBg = iframeDocument.getElementsByName('heroBackground')[0],
            mktoTitle = iframeDocument.getElementsByName('title')[0],
            mktoSubtitle = iframeDocument.getElementsByName('subtitle')[0],
            mktoTexts = iframeBody.getElementsByClassName('mktoText'),
            mktoRichTexts = iframeBody.getElementsByClassName('richTextSpan'),
            mktoButton = iframeDocument.getElementsByName('button')[0],
            mktoButtons = iframeBody.getElementsByTagName('button')

          if (!isMktoBackgroundColorReplaced && color && mktoHeader) {
            console.log('> Overlaying: Landing Page Header Background Company Color for Demo Svcs Template')
            mktoHeader.setAttribute('style', mktoHeader.getAttribute('style') + '; background: ' + linearGradient + ';')
            isMktoBackgroundColorReplaced = true
            isMktoFreeForm = false
          } else if (
            !isMktoBackgroundColorReplaced &&
            color &&
            !bannerBackground &&
            iframeBody.id == mktoBodyId &&
            iframeBody.className != null &&
            iframeBody.getElementsByTagName('div') &&
            iframeBody.getElementsByTagName('div')[0] &&
            iframeBody.getElementsByTagName('div')[0].style
          ) {
            if (iframeBody.className.search(mktoFreeFormClassName) != -1) {
              console.log('> Overlaying: Freeform Landing Page Background Company Color')
              iframeBody.getElementsByTagName('div')[0].style.backgroundColor = color + ' !important'
              isMktoBackgroundColorReplaced = isMktoFreeForm = true
            } else {
              console.log('> Overlaying: Guided Landing Page Background Company Color')
              iframeBody.getElementsByTagName('div')[0].style.background = linearGradient
              isMktoBackgroundColorReplaced = true
              isMktoFreeForm = false
            }
            iframeDocument.getElementsByTagName('head')[0].appendChild(formButtonStyle)
          }

          if (!isMktoImgReplaced && logo && (mktoLogo1 || mktoLogo2 || mktoImgs.length != 0)) {
            if (mktoLogo1 || mktoLogo2) {
              console.log('> Overlaying: Landing Page Company Logo for Demo Svcs Template')
              if (mktoLogo1 && mktoLogo1.getAttribute('display') != 'none') {
                console.log('> Overlaying: Landing Page Company Logo 1')
                mktoLogo1.style.width = 'auto'
                mktoLogo1.style.height = 'auto'
                mktoLogo1.setAttribute('src', logo)
                isMktoImgReplaced = true
              }

              if (mktoLogo2 && mktoLogo2.getAttribute('display') != 'none') {
                console.log('> Overlaying: Landing Page Company Logo 2')
                mktoLogo2.style.width = 'auto'
                mktoLogo2.style.height = 'auto'
                mktoLogo2.setAttribute('src', logo)
                isMktoImgReplaced = true
              }
            } else {
              for (let ii = 0; ii < mktoImgs.length; ii++) {
                let currMktoImg = mktoImgs[ii]

                if (
                  currMktoImg &&
                  currMktoImg.src &&
                  currMktoImg.parentNode &&
                  currMktoImg.parentNode.tagName == 'DIV' &&
                  currMktoImg.parentNode.id.search(logoRegex) != -1
                ) {
                  console.log('> Overlaying: Guided Landing Page Company Logo')
                  currMktoImg.style.width = 'auto'
                  currMktoImg.style.height = 'auto'
                  currMktoImg.setAttribute('src', logo)
                  isMktoImgReplaced = true
                  break
                } else if (
                  currMktoImg &&
                  currMktoImg.src &&
                  currMktoImg.parentNode &&
                  currMktoImg.parentNode.tagName == 'SPAN' &&
                  currMktoImg.parentNode.parentNode &&
                  currMktoImg.parentNode.parentNode.className.search(logoRegex) != -1
                ) {
                  console.log('> Overlaying: Freeform Landing Page Company Logo')
                  currMktoImg.style.width = 'auto'
                  currMktoImg.style.height = 'auto'
                  currMktoImg.setAttribute('src', logo)
                  isMktoImgReplaced = true
                  break
                }
              }
            }
          }

          if (!isMktoHeroBgImgReplaced && heroBackground && (mktoHeroBg || mktoImgs.length != 0)) {
            if (mktoHeroBg && mktoHeroBg.getAttribute('src')) {
              console.log('> Overlaying: Guided Landing Page Hero Company Background for Demo Svcs Template')
              mktoHeroBg.setAttribute('src', heroBackground)
              isMktoHeroBgImgReplaced = true
            } else {
              for (let ii = 0; ii < mktoImgs.length; ii++) {
                let currMktoImg = mktoImgs[ii]

                if (
                  currMktoImg.getAttribute('src') &&
                  currMktoImg.getAttribute('id') &&
                  currMktoImg.getAttribute('id').search(heroBgImgIdRegex) != -1
                ) {
                  console.log('> Overlaying: Guided Landing Page Hero Company Background')
                  currMktoImg.setAttribute('src', heroBackground)
                  isMktoHeroBgImgReplaced = true
                  break
                }
              }
            }
          }

          if (!isMktoButtonReplaced && color && (mktoButton || mktoButtons.length != 0)) {
            if (mktoButton) {
              console.log('> Overlaying: Landing Page Button Company Color for Demo Svcs Template')
              mktoButton.setAttribute(
                'style',
                currMktoButton.getAttribute('style') + '; background-color: ' + color + ' !important; border-color: ' + color + ' !important;'
              )
              isMktoButtonReplaced = true
            } else {
              for (let ii = 0; ii < mktoButtons.length; ii++) {
                let currMktoButton = mktoButtons[ii]

                if (
                  currMktoButton &&
                  currMktoButton.style &&
                  currMktoButton.style.backgroundColor != null &&
                  currMktoButton.innerHTML &&
                  currMktoButton.innerHTML.search(buttonTextRegex) != -1
                ) {
                  console.log('> Overlaying: Landing Page Button Company Color')
                  currMktoButton.setAttribute(
                    'style',
                    currMktoButton.getAttribute('style') +
                    '; background-color: ' +
                    color +
                    ' !important; border-color: ' +
                    color +
                    ' !important;'
                  )
                  isMktoButtonReplaced = true
                  break
                }
              }
            }
          }
        }

        if (logoImg && textBackground && textBackground.style && bannerBackground && bannerBackground.style && mainTitle && subTitle) {
          console.log('> Overlaying: Original Landing Page Company Logo & Color')
          if (logo) {
            logoImg.src = logo

            logoImg.onload = function () {
              let logoHeightsRatio, logoWidth, logoNewWidth, logoNewHeight, logoStyle

              if (logoImg.naturalHeight && logoImg.naturalHeight > logoOrigMaxHeight) {
                logoHeightsRatio = logoImg.naturalHeight / logoOrigMaxHeight
                logoWidth = logoImg.naturalWidth / logoHeightsRatio
                logoImg.width = logoImg.style.width = logoNewWidth = logoWidth
                logoImg.height = logoImg.style.height = logoNewHeight = logoOrigMaxHeight
              } else if (logoImg.naturalHeight) {
                logoImg.width = logoImg.style.width = logoNewWidth = logoImg.naturalWidth
                logoImg.height = logoImg.style.height = logoNewHeight = logoImg.naturalHeight
              } else {
                logoImg.width = logoImg.height = logoImg.style.width = logoImg.style.height = logoNewWidth = logoNewHeight = logoOrigMaxHeight
              }

              if (iframeDocument.getElementsByTagName('head') && iframeDocument.getElementsByTagName('head')[0]) {
                logoStyle = document.createElement('style')
                logoStyle.innerHTML =
                  '#' + logoImg.id + ' {width : ' + logoNewWidth + 'px !important; height : ' + logoNewHeight + 'px !important;}'
                iframeDocument.getElementsByTagName('head')[0].appendChild(logoStyle)
              }
              console.log('> Overlaying: Original Landing Page Company Logo Dimensions = ' + logoNewWidth + ' x ' + logoNewHeight)
            }
          }

          if (color) {
            textBackground.style.backgroundColor = color
            bannerBackground.style.backgroundColor = color
            iframeDocument.getElementsByTagName('head')[0].appendChild(formButtonStyle)
          }
          mainTitle.innerHTML = mktoMainText
          subTitle.innerHTML = mktoSubText
          isMktoOrigReplaced = isMktoFreeForm = true
        }

        if (
          (isMktoButtonReplaced &&
            //&& isMktoSubTextReplaced
            //&& isMktoTextReplaced
            isMktoHeroBgImgReplaced &&
            isMktoImgReplaced &&
            isMktoBackgroundColorReplaced) ||
          isMktoOrigReplaced
        ) {
          clearOverlayVars()
          return true
        }
      }
      return false
    }

    isLandingPageEditor = window.setInterval(function () {
      if (action == 'edit') {
        console.log('> Overlaying: Landing Page Designer')
        if (
          document.getElementsByTagName('iframe')[0] &&
          document.getElementsByTagName('iframe')[0].contentWindow &&
          document.getElementsByTagName('iframe')[0].contentWindow.document &&
          document.getElementsByTagName('iframe')[0].contentWindow.document.readyState == 'complete'
        ) {
          if (overlay(document.getElementsByTagName('iframe')[0].contentWindow.document) || desktopRepeatReadyCount >= maxRepeatReady) {
            console.log('> Overlayed: Landing Page Desktop Designer = ' + desktopRepeatReadyCount)
            isDesktopReplaced = true
            clearOverlayVars()
          } else if (desktopPrevReady) {
            desktopRepeatReadyCount++
          } else {
            desktopRepeatReadyCount = 1
          }
          desktopPrevReady = true
        } else {
          desktopPrevReady = false
        }

        if (
          isMktoFreeForm &&
          !isPhoneReplaced &&
          document.getElementsByTagName('iframe')[1] &&
          document.getElementsByTagName('iframe')[1].contentWindow &&
          document.getElementsByTagName('iframe')[1].contentWindow.document &&
          document.getElementsByTagName('iframe')[1].contentWindow.document.readyState == 'complete'
        ) {
          if (overlay(document.getElementsByTagName('iframe')[1].contentWindow.document) || phoneRepeatReadyCount >= maxRepeatReady) {
            console.log('> Overlayed: Freeform Landing Page Phone Designer = ' + phoneRepeatReadyCount)
            isPhoneReplaced = true
            clearOverlayVars()
          } else if (phonePrevReady) {
            phoneRepeatReadyCount++
          } else {
            phoneRepeatReadyCount = 1
          }
          phonePrevReady = true
        } else {
          phonePrevReady = false
        }

        if (
          (!isMktoFreeForm &&
            isDesktopReplaced &&
            !document.getElementsByTagName('iframe')[1].contentWindow.document.getElementsByTagName('body')[0].innerHTML) ||
          (isMktoFreeForm && isPhoneReplaced && isDesktopReplaced)
        ) {
          console.log('> Overlaying: Landing Page Interval is Cleared')
          window.clearInterval(isLandingPageEditor)
          clearOverlayVars()
          return true
        }
      } else if (action == 'preview') {
        console.log('> Overlaying: Landing Page Previewer')
        if (
          !isDesktopReplaced &&
          document.getElementsByTagName('iframe')[2] &&
          document.getElementsByTagName('iframe')[2].contentWindow &&
          document.getElementsByTagName('iframe')[2].contentWindow.document &&
          document.getElementsByTagName('iframe')[2].contentWindow.document.readyState == 'complete'
        ) {
          if (overlay(document.getElementsByTagName('iframe')[2].contentWindow.document) || desktopRepeatReadyCount >= maxRepeatReady) {
            console.log('> Overlayed: Landing Page Desktop Preview = ' + desktopRepeatReadyCount)
            isDesktopReplaced = true
            clearOverlayVars()
          } else if (desktopPrevReady) {
            desktopRepeatReadyCount++
          } else {
            desktopRepeatReadyCount = 1
          }
          desktopPrevReady = true
        } else {
          desktopPrevReady = false
        }

        if (
          !isPhoneReplaced &&
          document.getElementsByTagName('iframe')[3] &&
          document.getElementsByTagName('iframe')[3].contentWindow &&
          document.getElementsByTagName('iframe')[3].contentWindow.document &&
          document.getElementsByTagName('iframe')[3].contentWindow.document.readyState == 'complete'
        ) {
          if (overlay(document.getElementsByTagName('iframe')[3].contentWindow.document) || phoneRepeatReadyCount >= maxOtherRepeatReady) {
            console.log('> Overlayed: Landing Page Phone Preview = ' + phoneRepeatReadyCount)
            isPhoneReplaced = true
            clearOverlayVars()
          } else if (phonePrevReady) {
            phoneRepeatReadyCount++
          } else {
            phoneRepeatReadyCount = 1
          }
          phonePrevReady = true
        } else {
          phonePrevReady = false
        }

        if (
          !isSideBySideDesktopReplaced &&
          document.getElementsByTagName('iframe')[0] &&
          document.getElementsByTagName('iframe')[0].contentWindow &&
          document.getElementsByTagName('iframe')[0].contentWindow.document &&
          document.getElementsByTagName('iframe')[0].contentWindow.document.readyState == 'complete'
        ) {
          if (
            overlay(document.getElementsByTagName('iframe')[0].contentWindow.document) ||
            sideBySideDesktopRepeatReadyCount >= maxOtherRepeatReady
          ) {
            console.log('> Overlayed: Landing Page Side by Side Desktop Preview = ' + sideBySideDesktopRepeatReadyCount)
            isSideBySideDesktopReplaced = true
            clearOverlayVars()
          } else if (sideBySideDesktopPrevReady) {
            sideBySideDesktopRepeatReadyCount++
          } else {
            sideBySideDesktopRepeatReadyCount = 1
          }
          sideBySideDesktopPrevReady = true
        } else {
          sideBySideDesktopPrevReady = false
        }

        if (
          !isSideBySidePhoneReplaced &&
          document.getElementsByTagName('iframe')[1] &&
          document.getElementsByTagName('iframe')[1].contentWindow &&
          document.getElementsByTagName('iframe')[1].contentWindow.document &&
          document.getElementsByTagName('iframe')[1].contentWindow.document.readyState == 'complete'
        ) {
          if (
            overlay(document.getElementsByTagName('iframe')[1].contentWindow.document) ||
            sideBySidePhoneRepeatReadyCount >= maxOtherRepeatReady
          ) {
            console.log('> Overlayed: Landing Page Side by Side Phone Preview = ' + sideBySidePhoneRepeatReadyCount)
            isSideBySidePhoneReplaced = true
            clearOverlayVars()
          } else if (sideBySidePhonePrevReady) {
            sideBySidePhoneRepeatReadyCount++
          } else {
            sideBySidePhoneRepeatReadyCount = 1
          }
          sideBySidePhonePrevReady = true
        } else {
          sideBySidePhonePrevReady = false
        }

        if (isSideBySidePhoneReplaced && isSideBySideDesktopReplaced && isPhoneReplaced && isDesktopReplaced) {
          console.log('> Overlaying: Landing Page Interval is Cleared')
          window.clearInterval(isLandingPageEditor)
          clearOverlayVars()
          return true
        }
      }
    }, 0)
  },

  getProgramAssetDetails: function (programCompId) {
    let result = LIB.webRequest(
      '/marketingEvent/getLocalAssetDetails',
      'ajaxHandler=MktSession&mktReqUid=' +
      new Date().getTime() +
      Ext.id(null, ':') +
      '&compId=' +
      programCompId +
      '&xsrfId=' +
      MktSecurity.getXsrfId(),
      'POST',
      false,
      '',
      function (response) {
        console.log(response)
        response = JSON.parse(response)
        if (
          response &&
          response.JSONResults &&
          response.JSONResults.localAssetInfo &&
          (response.JSONResults.localAssetInfo.smartCampaigns ||
            (response.JSONResults.localAssetInfo.assetList[0] && response.JSONResults.localAssetInfo.assetList[0].tree))
        ) {
          return response.JSONResults.localAssetInfo
        } else {
          return false
        }
      }
    )
    return result
  },

  getProgramSettings: function (programTreeNode) {
    let result = LIB.webRequest(
      '/marketingEvent/getProgramSettingsData',
      '&start=0' +
      '&query=' +
      '&compId=' +
      programTreeNode.compId +
      '&compType=' +
      programTreeNode.compType +
      '&xsrfId=' +
      MktSecurity.getXsrfId(),
      'POST',
      false,
      '',
      function (response) {
        console.log(response)
        response = JSON.parse(response)
        if (response && response.success) {
          return response
        } else {
          return false
        }
      }
    )
    return result
  },

  getTags: function () {
    let result = LIB.webRequest(
      '/marketingEvent/getAllDescriptors',
      '&start=0' + '&xsrfId=' + MktSecurity.getXsrfId(),
      'POST',
      false,
      '',
      function (response) {
        console.log(response)
        response = JSON.parse(response)
        if (response.success) {
          let currTag,
            jj = 0,
            customTags = []
          for (let ii = 0; ii < response.data.descriptors.length; ii++) {
            currTag = response.data.descriptors[ii]
            if (currTag.type != 'channel') {
              customTags[jj] = currTag
              jj++
            }
          }
          return customTags
        } else {
          return false
        }
      }
    )
    return result
  },

  applyMassClone: function (OBJ, forceReload) {
    console.log('> Applying: Mass Clone Menu Item')
    let massClone = function () {
      if (this.triggeredFrom == 'tree' && this.get('newLocalAsset')) {
        let massCloneItem = this.get('newLocalAsset').cloneConfig(),
          massCloneItemId = 'cloneVertical',
          currExpNode = MktExplorer.getNodeById(this.currNode.attributes.id)

        if (!this.get(massCloneItemId)) {
          massCloneItem.itemId = massCloneItemId
          massCloneItem.text = 'Mass Clone'
          massCloneItem.setHandler(function (el) {
            let cloneForm = new Mkt.apps.marketingEvent.MarketingEventForm({
                cloneFromId: this.ownerCt.currNode.attributes.compId,
                cloneName: this.ownerCt.currNode.attributes.text,
                accessZoneId: this.ownerCt.currNode.attributes.accessZoneId
              }),
              cloneFromField = cloneForm.find('fieldLabel', 'Clone From')[0].cloneConfig(),
              scActivationField = cloneForm.find('fieldLabel', 'Clone To')[0].cloneConfig(),
              showMoreOptionsField = new Mkt.apps.marketingEvent.MarketingEventForm({
                cloneFromId: this.ownerCt.currNode.attributes.compId,
                cloneName: this.ownerCt.currNode.attributes.text,
                accessZoneId: this.ownerCt.currNode.attributes.accessZoneId
              })
                .find('fieldLabel', 'Clone To')[0]
                .cloneConfig(),
              periodCostCloneField = new Mkt.apps.marketingEvent.MarketingEventForm({
                cloneFromId: this.ownerCt.currNode.attributes.compId,
                cloneName: this.ownerCt.currNode.attributes.text,
                accessZoneId: this.ownerCt.currNode.attributes.accessZoneId
              })
                .find('fieldLabel', 'Clone To')[0]
                .cloneConfig(),
              periodCostMonthField = new Mkt.apps.marketingEvent.MarketingEventForm({
                cloneFromId: this.ownerCt.currNode.attributes.compId,
                cloneName: this.ownerCt.currNode.attributes.text,
                accessZoneId: this.ownerCt.currNode.attributes.accessZoneId
              })
                .find('fieldLabel', 'Clone To')[0]
                .cloneConfig(),
              periodCostOffsetField = new Mkt.apps.marketingEvent.MarketingEventForm({
                cloneFromId: this.ownerCt.currNode.attributes.compId,
                cloneName: this.ownerCt.currNode.attributes.text,
                accessZoneId: this.ownerCt.currNode.attributes.accessZoneId
              })
                .find('fieldLabel', 'Name')[0]
                .cloneConfig(),
              tagNameField = new Mkt.apps.marketingEvent.MarketingEventForm({
                cloneFromId: this.ownerCt.currNode.attributes.compId,
                cloneName: this.ownerCt.currNode.attributes.text,
                accessZoneId: this.ownerCt.currNode.attributes.accessZoneId
              })
                .find('fieldLabel', 'Clone To')[0]
                .cloneConfig(),
              tagValueField = new Mkt.apps.marketingEvent.MarketingEventForm({
                cloneFromId: this.ownerCt.currNode.attributes.compId,
                cloneName: this.ownerCt.currNode.attributes.text,
                accessZoneId: this.ownerCt.currNode.attributes.accessZoneId
              })
                .find('fieldLabel', 'Clone To')[0]
                .cloneConfig(),
              massCloneForm = new Mkt.apps.marketingEvent.MarketingEventForm({currNode: this.ownerCt.currNode}),
              customTags,
              currCustomTag,
              currCustomTagName,
              currCustomTagValue
            el.parentMenu.hide(true)

            let isCloneVerticalForm = window.setInterval(function () {
              if (
                massCloneForm &&
                massCloneForm.buttons[1] &&
                massCloneForm.buttons[1].setHandler &&
                massCloneForm.find('fieldLabel', 'Channel')[0] &&
                massCloneForm.find('fieldLabel', 'Channel')[0].destroy &&
                massCloneForm.find('fieldLabel', 'Description')[0] &&
                massCloneForm.find('fieldLabel', 'Description')[0].destroy &&
                massCloneForm.find('fieldLabel', 'Program Type')[0] &&
                massCloneForm.find('fieldLabel', 'Program Type')[0].destroy &&
                massCloneForm.find('fieldLabel', 'Campaign Folder')[0] &&
                massCloneForm.find('fieldLabel', 'Campaign Folder')[0].fieldLabel &&
                massCloneForm.find('fieldLabel', 'Name')[0] &&
                massCloneForm.find('fieldLabel', 'Name')[0].fieldLabel &&
                massCloneForm.items.last().setText &&
                massCloneForm.items.last().setVisible &&
                massCloneForm.setWidth &&
                massCloneForm.setHeight
              ) {
                window.clearInterval(isCloneVerticalForm)

                massCloneForm.setTitle('Mass Clone')
                massCloneForm.buttons[1].setText('Clone')
                massCloneForm.buttons[1].currNode = massCloneForm.currNode
                massCloneForm.find('fieldLabel', 'Channel')[0].destroy()
                massCloneForm.find('fieldLabel', 'Description')[0].destroy()
                massCloneForm.find('fieldLabel', 'Program Type')[0].destroy()
                massCloneForm.find('fieldLabel', 'Campaign Folder')[0].fieldLabel = 'Clone To'
                massCloneForm.find('fieldLabel', 'Name')[0].fieldLabel = 'Program Suffix'

                showMoreOptionsField.fieldLabel = 'Show More Options'
                showMoreOptionsField.itemCls = ''
                showMoreOptionsField.store.data.items[0].set('text', 'No')
                showMoreOptionsField.store.data.items[1].set('text', 'Yes')

                scActivationField.fieldLabel = 'SC Activation State'
                scActivationField.itemCls = ''
                scActivationField.store.data.items[0].set('text', 'Inherit State')
                scActivationField.store.data.items[1].set('text', 'Force Activate')

                periodCostCloneField.fieldLabel = 'Period Cost Data'
                periodCostCloneField.itemCls = ''
                periodCostCloneField.store.data.items[0].set('text', 'Inherit Data')
                periodCostCloneField.store.data.items[1].set('text', 'Baseline Data')

                periodCostMonthField.fieldLabel = 'Period Cost Months'
                periodCostMonthField.itemCls = 'mktRequired'
                periodCostMonthField.store.data.items[0].set('text', '12 Months')
                periodCostMonthField.store.data.items[1].set('text', '24 Months')

                periodCostOffsetField.fieldLabel = 'Period Cost Offset'
                periodCostOffsetField.itemCls = ''

                tagNameField.fieldLabel = 'Change Tag Type'
                tagNameField.itemCls = ''

                tagValueField.fieldLabel = 'New Tag Value'
                tagValueField.itemCls = 'mktRequired'

                let origOnSelect = showMoreOptionsField.onSelect
                showMoreOptionsField.onSelect = function (doFocus) {
                  origOnSelect.apply(this, arguments)
                  if (this.value == 2) {
                    this.ownerCt.find('fieldLabel', 'SC Activation State')[0].label.setVisible(true)
                    this.ownerCt.find('fieldLabel', 'SC Activation State')[0].setVisible(true)
                    this.ownerCt.find('fieldLabel', 'Period Cost Data')[0].label.setVisible(true)
                    this.ownerCt.find('fieldLabel', 'Period Cost Data')[0].setVisible(true)
                    this.ownerCt.find('fieldLabel', 'Change Tag Type')[0].label.setVisible(true)
                    this.ownerCt.find('fieldLabel', 'Change Tag Type')[0].setVisible(true)
                  } else {
                    this.ownerCt.find('fieldLabel', 'SC Activation State')[0].label.setVisible(false)
                    this.ownerCt.find('fieldLabel', 'SC Activation State')[0].setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Period Cost Data')[0].label.setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Period Cost Data')[0].setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Change Tag Type')[0].setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Change Tag Type')[0].label.setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Period Cost Offset')[0].setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Period Cost Offset')[0].label.setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Period Cost Months')[0].setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Period Cost Months')[0].label.setVisible(false)
                  }
                }
                periodCostCloneField.onSelect = function (doFocus) {
                  origOnSelect.apply(this, arguments)
                  if (this.value == 2) {
                    this.ownerCt.find('fieldLabel', 'Period Cost Months')[0].label.setVisible(true)
                    this.ownerCt.find('fieldLabel', 'Period Cost Months')[0].setVisible(true)
                    this.ownerCt.find('fieldLabel', 'Period Cost Offset')[0].label.setVisible(true)
                    this.ownerCt.find('fieldLabel', 'Period Cost Offset')[0].setVisible(true)
                  } else {
                    this.ownerCt.find('fieldLabel', 'Period Cost Offset')[0].setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Period Cost Offset')[0].label.setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Period Cost Months')[0].setVisible(false)
                    this.ownerCt.find('fieldLabel', 'Period Cost Months')[0].label.setVisible(false)
                  }
                }
                tagNameField.onSelect = function (doFocus) {
                  origOnSelect.apply(this, arguments)
                  if (this.value) {
                    this.ownerCt.find('fieldLabel', 'New Tag Value')[0].label.setVisible(true)
                    this.ownerCt.find('fieldLabel', 'New Tag Value')[0].setVisible(true)
                  } else {
                    this.ownerCt.find('fieldLabel', 'New Tag Value')[0].setVisible(false)
                    this.ownerCt.find('fieldLabel', 'New Tag Value')[0].label.setVisible(false)
                  }
                }

                massCloneForm.insert(0, cloneFromField)
                massCloneForm.insert(massCloneForm.items.length - 1, showMoreOptionsField)
                massCloneForm.insert(massCloneForm.items.length - 1, scActivationField)
                scActivationField.setVisible(false)
                massCloneForm.insert(massCloneForm.items.length - 1, periodCostCloneField)
                periodCostCloneField.setVisible(false)
                massCloneForm.insert(massCloneForm.items.length - 1, periodCostMonthField)
                periodCostMonthField.setVisible(false)
                massCloneForm.insert(massCloneForm.items.length - 1, periodCostOffsetField)
                periodCostOffsetField.setVisible(false)
                massCloneForm.insert(massCloneForm.items.length - 1, tagNameField)
                tagNameField.setVisible(false)
                massCloneForm.insert(massCloneForm.items.length - 1, tagValueField)
                tagValueField.setVisible(false)

                massCloneForm.buttons[1].setHandler(function () {
                  let waitMsg = new Ext.Window({
                    closable: true,
                    modal: true,
                    width: 520,
                    height: 225,
                    cls: 'mktModalForm',
                    title: 'Please Wait ...',
                    html:
                      '<b>Mass Cloning:</b>  <i>' +
                      massCloneForm.currNode.text +
                      '</i><br><br>This may take several minutes depending on the quantity of programs and assets contained therein.'
                  }),
                    cloneToFolderId = massCloneForm.find('fieldLabel', 'Clone To')[0].getValue(),
                    cloneToSuffix = massCloneForm.find('fieldLabel', 'Program Suffix')[0].getValue(),
                    cloneToTreeNode = MktExplorer.getNodeById(cloneToFolderId),
                    scActivationState = scActivationField.getValue(),
                    periodCostClone = periodCostCloneField.getValue(),
                    periodCostOffset = periodCostOffsetField.getValue(),
                    tagName = tagNameField.getValue(),
                    tagValue = tagValueField.getValue(),
                    scForceActivate,
                    inheritPeriodCost,
                    periodCostMonth,
                    numOfPeriodCostMonths,
                    _this = this,
                    waitMsgShow

                  if (scActivationState == 2) {
                    scForceActivate = true
                  } else {
                    scForceActivate = false
                  }

                  if (periodCostClone == 1) {
                    inheritPeriodCost = true
                  } else {
                    inheritPeriodCost = false
                    periodCostMonth = periodCostMonthField.getValue()

                    if (periodCostMonth == 1) {
                      numOfPeriodCostMonths = 12
                    } else if (periodCostMonth == 2) {
                      numOfPeriodCostMonths = 24
                    } else {
                      numOfPeriodCostMonths = 0
                    }

                    if (!isNumber(parseInt(periodCostOffset))) {
                      periodCostOffset = null
                    }
                  }

                  massCloneForm.close()
                  waitMsgShow = waitMsg.show()
                  OBJ.heapTrack('track', {name: 'Mass Clone', assetName: 'Tool'})

                  let isWaitMsgShow = window.setInterval(function () {
                    if (waitMsgShow) {
                      window.clearInterval(isWaitMsgShow)
                      let currTreeNode,
                        cloneFolderResponse,
                        cloneProgramResponse,
                        getOrigProgramSettingsResponse,
                        getNewProgramSettingsResponse,
                        getNewProgramAssetDetailsResponse

                      if (_this.currNode.attributes.compType == 'Marketing Folder') {
                        // Mass Clone @ Folder
                        for (let ii = 0; _this.currNode.attributes.children && ii < _this.currNode.attributes.children.length; ii++) {
                          currTreeNode = _this.currNode.attributes.children[ii]

                          if (currTreeNode.compType == 'Marketing Folder') {
                            // Mass Clone @ Folder with Folder children
                            cloneFolderResponse = LIB.cloneFolder(currTreeNode.text, cloneToSuffix, cloneToFolderId)

                            if (cloneFolderResponse) {
                              for (let jj = 0; currTreeNode.children && jj < currTreeNode.children.length; jj++) {
                                if (currTreeNode.children[jj].compType == 'Marketing Folder') {
                                  // Mass Clone @ Folder with Folder depth of 2
                                  let currFolderTreeNode = currTreeNode.children[jj]

                                  cloneFolderResponse = LIB.cloneFolder(currFolderTreeNode.text, cloneToSuffix, currFolderTreeNode.id)

                                  if (cloneFolderResponse) {
                                    var currOrigProgramTreeNode

                                    for (let kk = 0; currFolderTreeNode.children && kk < currFolderTreeNode.children.length; kk++) {
                                      currOrigProgramTreeNode = currFolderTreeNode.children[kk]

                                      cloneProgramResponse = LIB.cloneProgram(
                                        cloneToSuffix,
                                        cloneFolderResponse.JSONResults.actions[0].parameters[0][0].id,
                                        currOrigProgramTreeNode
                                      )

                                      if (cloneProgramResponse) {
                                        getOrigProgramSettingsResponse = LIB.getProgramSettings(currOrigProgramTreeNode)

                                        if (
                                          getOrigProgramSettingsResponse &&
                                          getOrigProgramSettingsResponse.data &&
                                          (inheritPeriodCost || numOfPeriodCostMonths > 0)
                                        ) {
                                          LIB.clonePeriodCost(
                                            getOrigProgramSettingsResponse.data,
                                            cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                            numOfPeriodCostMonths,
                                            parseInt(periodCostOffset),
                                            inheritPeriodCost
                                          )
                                        }

                                        getNewProgramSettingsResponse = LIB.getProgramSettings({
                                          compId: cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                          compType: cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compType
                                        })

                                        if (getNewProgramSettingsResponse && getNewProgramSettingsResponse.data && tagName && tagValue) {
                                          LIB.setProgramTag(
                                            getNewProgramSettingsResponse.data,
                                            cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                            tagName,
                                            tagValue
                                          )
                                        }

                                        if (cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compType == 'Nurture Program') {
                                          LIB.cloneNurtureCadence(
                                            currOrigProgramTreeNode.compId,
                                            cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId
                                          )
                                        }

                                        getNewProgramAssetDetailsResponse = LIB.cloneSmartCampaignState(
                                          currOrigProgramTreeNode.compId,
                                          cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                          scForceActivate
                                        )

                                        LIB.setProgramReportFilter(getNewProgramAssetDetailsResponse, cloneToFolderId)
                                      }
                                    }
                                  }
                                } else {
                                  // Mass Clone @ Folder with Folder depth of 1
                                  currOrigProgramTreeNode = currTreeNode.children[jj]

                                  cloneProgramResponse = LIB.cloneProgram(
                                    cloneToSuffix,
                                    cloneFolderResponse.JSONResults.actions[0].parameters[0][0].id,
                                    currOrigProgramTreeNode
                                  )

                                  if (cloneProgramResponse) {
                                    getOrigProgramSettingsResponse = LIB.getProgramSettings(currOrigProgramTreeNode)

                                    if (
                                      getOrigProgramSettingsResponse &&
                                      getOrigProgramSettingsResponse.data &&
                                      (inheritPeriodCost || numOfPeriodCostMonths > 0)
                                    ) {
                                      LIB.clonePeriodCost(
                                        getOrigProgramSettingsResponse.data,
                                        cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                        numOfPeriodCostMonths,
                                        parseInt(periodCostOffset),
                                        inheritPeriodCost
                                      )
                                    }

                                    getNewProgramSettingsResponse = LIB.getProgramSettings({
                                      compId: cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                      compType: cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compType
                                    })

                                    if (getNewProgramSettingsResponse && getNewProgramSettingsResponse.data && tagName && tagValue) {
                                      LIB.setProgramTag(
                                        getNewProgramSettingsResponse.data,
                                        cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                        tagName,
                                        tagValue
                                      )
                                    }

                                    if (cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compType == 'Nurture Program') {
                                      LIB.cloneNurtureCadence(
                                        currOrigProgramTreeNode.compId,
                                        cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId
                                      )
                                    }

                                    getNewProgramAssetDetailsResponse = LIB.cloneSmartCampaignState(
                                      currOrigProgramTreeNode.compId,
                                      cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                      scForceActivate
                                    )

                                    LIB.setProgramReportFilter(getNewProgramAssetDetailsResponse, cloneToFolderId)
                                  }
                                }
                              }
                            }
                          } else {
                            // Mass Clone @ Folder with Program children
                            var currOrigProgramTreeNode = currTreeNode

                            cloneProgramResponse = LIB.cloneProgram(cloneToSuffix, cloneToFolderId, currOrigProgramTreeNode)

                            if (cloneProgramResponse) {
                              getOrigProgramSettingsResponse = LIB.getProgramSettings(currOrigProgramTreeNode)

                              if (
                                getOrigProgramSettingsResponse &&
                                getOrigProgramSettingsResponse.data &&
                                (inheritPeriodCost || numOfPeriodCostMonths > 0)
                              ) {
                                LIB.clonePeriodCost(
                                  getOrigProgramSettingsResponse.data,
                                  cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                  numOfPeriodCostMonths,
                                  parseInt(periodCostOffset),
                                  inheritPeriodCost
                                )
                              }

                              getNewProgramSettingsResponse = LIB.getProgramSettings({
                                compId: cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                compType: cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compType
                              })

                              if (getNewProgramSettingsResponse && getNewProgramSettingsResponse.data && tagName && tagValue) {
                                LIB.setProgramTag(
                                  getNewProgramSettingsResponse.data,
                                  cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                  tagName,
                                  tagValue
                                )
                              }

                              if (cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compType == 'Nurture Program') {
                                LIB.cloneNurtureCadence(
                                  currOrigProgramTreeNode.compId,
                                  cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId
                                )
                              }

                              getNewProgramAssetDetailsResponse = LIB.cloneSmartCampaignState(
                                currOrigProgramTreeNode.compId,
                                cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                                scForceActivate
                              )

                              LIB.setProgramReportFilter(getNewProgramAssetDetailsResponse, cloneToFolderId)
                            }
                          }
                        }
                      } else {
                        // Mass Clone @ Program
                        var currOrigProgramTreeNode = _this.currNode.attributes

                        cloneProgramResponse = LIB.cloneProgram(cloneToSuffix, cloneToFolderId, currOrigProgramTreeNode)

                        if (cloneProgramResponse) {
                          getOrigProgramSettingsResponse = LIB.getProgramSettings(currOrigProgramTreeNode)

                          if (
                            getOrigProgramSettingsResponse &&
                            getOrigProgramSettingsResponse.data &&
                            (inheritPeriodCost || numOfPeriodCostMonths > 0)
                          ) {
                            LIB.clonePeriodCost(
                              getOrigProgramSettingsResponse.data,
                              cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                              numOfPeriodCostMonths,
                              parseInt(periodCostOffset),
                              inheritPeriodCost
                            )
                          }

                          getNewProgramSettingsResponse = LIB.getProgramSettings({
                            compId: cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                            compType: cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compType
                          })

                          if (getNewProgramSettingsResponse && getNewProgramSettingsResponse.data && tagName && tagValue) {
                            LIB.setProgramTag(
                              getNewProgramSettingsResponse.data,
                              cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                              tagName,
                              tagValue
                            )
                          }

                          if (cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compType == 'Nurture Program') {
                            LIB.cloneNurtureCadence(
                              currOrigProgramTreeNode.compId,
                              cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId
                            )
                          }

                          getNewProgramAssetDetailsResponse = LIB.cloneSmartCampaignState(
                            currOrigProgramTreeNode.compId,
                            cloneProgramResponse.JSONResults.actions[0].parameters[0][0].compId,
                            scForceActivate
                          )

                          LIB.setProgramReportFilter(getNewProgramAssetDetailsResponse, cloneToFolderId)
                        }
                      }
                      LIB.reloadMarketingActivites()
                      waitMsg.close()
                    }
                  }, 0)
                })

                massCloneForm.show()
                showMoreOptionsField.onSelect(showMoreOptionsField.findRecord('text', 'No'))
                scActivationField.onSelect(scActivationField.findRecord('text', 'Inherit State'))
                periodCostCloneField.onSelect(periodCostCloneField.findRecord('text', 'Inherit Data'))
                massCloneForm.setWidth(525)
                massCloneForm.setHeight(560)
                massCloneForm.items.last().setText('Programs that have a folder depth greater than 2 will not be cloned.')
                massCloneForm.items.last().setVisible(true)
                tagValueField.label.setVisible(false)
                tagNameField.label.setVisible(false)
                periodCostMonthField.label.dom.innerHTML = '&nbsp;&nbsp;&nbsp; Months:'
                periodCostMonthField.label.setVisible(false)
                periodCostOffsetField.label.dom.innerHTML = '&nbsp;&nbsp;&nbsp; Cost Offset (+/-):'
                periodCostOffsetField.label.setVisible(false)
                tagValueField.label.dom.innerHTML = '&nbsp;&nbsp;&nbsp; New Tag Value:'
                periodCostCloneField.label.setVisible(false)
                scActivationField.label.setVisible(false)
                customTags = LIB.getTags()
                currCustomTagName = tagNameField.store.data.items[0].copy(0)
                currCustomTagValue = tagValueField.store.data.items[0].copy(0)
                tagNameField.store.removeAll(true)
                tagValueField.store.removeAll(true)
                let isCustomTags = window.setInterval(function () {
                  if (customTags) {
                    window.clearInterval(isCustomTags)

                    for (let ii = 0; ii < customTags.length; ii++) {
                      currCustomTag = customTags[ii]
                      currCustomTagName = currCustomTagName.copy(currCustomTag.name)
                      currCustomTagName.set('text', currCustomTag.name)
                      currCustomTagName.data.id = currCustomTag.name
                      tagNameField.store.add(currCustomTagName)

                      for (let jj = 0; jj < currCustomTag.values.length; jj++) {
                        currCustomTagValue = currCustomTagValue.copy(currCustomTag.values[jj].value)
                        currCustomTagValue.set('text', currCustomTag.values[jj].value)
                        currCustomTagValue.data.id = currCustomTag.values[jj].value
                        tagValueField.store.add(currCustomTagValue)
                      }
                    }
                  }
                }, 0)
              }
            }, 0)
          })
        }

        if (this.get(massCloneItemId)) {
          if (
            (this.currNode.attributes.compType == 'Marketing Folder' &&
              !this.currNode.attributes.marketingProgramId &&
              currExpNode &&
              currExpNode.isExpandable()) ||
            this.currNode.attributes.compType == 'Marketing Program' ||
            this.currNode.attributes.compType == 'Nurture Program' ||
            this.currNode.attributes.compType == 'Marketing Event' ||
            this.currNode.attributes.compType == 'Email Batch Program' ||
            this.currNode.attributes.compType == 'In-App Program'
          ) {
            if (forceReload) {
              this.get(massCloneItemId).destroy()
              this.addItem(massCloneItem)
            } else {
              this.get(massCloneItemId).setVisible(true)
            }
          } else {
            this.get(massCloneItemId).setVisible(false)
          }
        } else if (
          (this.currNode.attributes.compType == 'Marketing Folder' &&
            !this.currNode.attributes.marketingProgramId &&
            currExpNode &&
            currExpNode.isExpandable()) ||
          this.currNode.attributes.compType == 'Marketing Program' ||
          this.currNode.attributes.compType == 'Nurture Program' ||
          this.currNode.attributes.compType == 'Marketing Event' ||
          this.currNode.attributes.compType == 'Email Batch Program' ||
          this.currNode.attributes.compType == 'In-App Program'
        ) {
          this.addItem(massCloneItem)
        }
      }
    }

    if (LIB.isPropOfWindowObj('Ext.menu.Menu.prototype.showAt')) {
      console.log('> Executing: Applying Mass Clone Menu Item')
      if (!origMenuShowAtFunc) {
        origMenuShowAtFunc = Ext.menu.Menu.prototype.showAt
      }

      Ext.menu.Menu.prototype.showAt = function (xy, parentMenu) {
        massClone.apply(this, arguments) //TODO changes here Hunter
        origMenuShowAtFunc.apply(this, arguments)
      }
    } else {
      console.log('> Skipping: Applying Mass Clone Menu Item')
    }
  },

  /*
  *  This function adds a right-click menu item that performs a mass clone of all
  *  Programs from the selected root folder that have a folder depth level 1 or less:
  *    Clones the folder structure
  *    Clones all Programs
  *    Sets Period Costs for the next 24 months using the source Program's first Cost
  *    Sets the Vertical Tag using the name of the destination folder
  *    Clones the Stream Cadences using the source Nurture Program
  *    Clones the activation state of trigger Smart Campaigns
  *    Clones the recurring schedule of batch Smart Campaigns
  *    Sets the asset filter for cloned reports to the destination folder
  */
  cloneFolder: function (origFolderName, cloneToSuffix, cloneToFolderId) {
    let newFolderName, result

    if (origFolderName.search(/\([^)]*\)$/) != -1) {
      newFolderName = origFolderName.replace(/\([^)]*\)$/, '(' + cloneToSuffix + ')')
    } else {
      newFolderName = origFolderName.text + ' (' + cloneToSuffix + ')'
    }

    result = LIB.webRequest(
      '/explorer/createProgramFolder',
      'ajaxHandler=MktSession&mktReqUid=' +
      new Date().getTime() +
      Ext.id(null, ':') +
      '&text=' +
      newFolderName +
      '&parentId=' +
      cloneToFolderId +
      '&tempNodeId=ext-' +
      cloneToFolderId +
      '&xsrfId=' +
      MktSecurity.getXsrfId(),
      'POST',
      false,
      '',
      function (response) {
        console.log(response)
        response = JSON.parse(response)

        if (
          response &&
          response.JSONResults &&
          response.JSONResults.appvars &&
          response.JSONResults.appvars.createProgramFolderResult == 'success'
        ) {
          return response
        } else {
          return false
        }
      }
    )

    return result
  },

  cloneNurtureCadence: function (origProgramCompId, newProgramCompId) {
    let getNurtureCadence, getOrigNurtureCadenceResponse, getNewNurtureCadenceResponse

    getNurtureCadence = function (programCompId) {
      let programFilter = encodeURIComponent('[{"property":"id","value":' + programCompId + '}]'),
        fields = encodeURIComponent('["+tracks"]'),
        result

      result = LIB.webRequest(
        '/data/nurture/retrieve',
        'filter=' + programFilter + '&fields=' + fields + '&xsrfId=' + MktSecurity.getXsrfId(),
        'POST',
        false,
        '',
        function (response) {
          console.log(response)
          response = JSON.parse(response)

          if (response && response.success) {
            return response
          } else {
            return false
          }
        }
      )

      return result
    }

    getOrigNurtureCadenceResponse = getNurtureCadence(origProgramCompId)
    getNewNurtureCadenceResponse = getNurtureCadence(newProgramCompId)

    if (
      getOrigNurtureCadenceResponse &&
      getNewNurtureCadenceResponse &&
      getOrigNurtureCadenceResponse.data[0].tracks.length == getNewNurtureCadenceResponse.data[0].tracks.length
    ) {
      let currOrigStream,
        currNewStream,
        streamCadences = '['

      for (let ii = 0; ii < getOrigNurtureCadenceResponse.data[0].tracks.length; ii++) {
        currOrigStream = getOrigNurtureCadenceResponse.data[0].tracks[ii]
        currNewStream = getNewNurtureCadenceResponse.data[0].tracks[ii]

        if (ii != 0) {
          streamCadences += ','
        }
        streamCadences +=
          '{"id":' +
          currNewStream.id +
          ',"recurrenceType":"' +
          currOrigStream.recurrenceType +
          '","everyNUnit":' +
          currOrigStream.everyNUnit +
          ',"weekMask":"' +
          currOrigStream.weekMask +
          '","startDate":"' +
          currOrigStream.startDate +
          '"}'
      }
      streamCadences += ']'
      streamCadences = streamCadences.replace(/"null"/g, 'null')

      LIB.webRequest(
        '/data/nurtureTrack/update',
        'data=' + encodeURIComponent(streamCadences) + '&xsrfId=' + MktSecurity.getXsrfId(),
        'POST',
        false,
        '',
        function (response) {
          console.log(response)
        }
      )
    }
  },

  clonePeriodCost: function (origProgramSettingsData, newProgramCompId, numOfMonths, offset, inherit) {
    let currYear = new Date().getFullYear(),
      currMonth = new Date().getMonth() + 1,
      setPeriodCost

    setPeriodCost = function (newProgramCompId, costDate, costAmount) {
      LIB.webRequest(
        '/marketingEvent/setCostSubmit',
        'ajaxHandler=MktSession&mktReqUid=' +
        new Date().getTime() +
        Ext.id(null, ':') +
        '&compId=' +
        newProgramCompId +
        '&costId=' +
        '&type=period' +
        '&startDate=' +
        costDate +
        '&amount=' +
        costAmount.toString() +
        '&description=' +
        '&xsrfId=' +
        MktSecurity.getXsrfId(),
        'POST',
        false,
        '',
        function (response) {
          console.log(response)
        }
      )
    }

    if (inherit && origProgramSettingsData) {
      let currPeriodCost

      for (let ii = 0; ii < origProgramSettingsData.length; ii++) {
        currPeriodCost = origProgramSettingsData[ii]

        if (currPeriodCost.itemType == 'period' && currPeriodCost.summaryData.amount && currPeriodCost.summaryData.startDate) {
          var currCostMonth = currPeriodCost.summaryData.startDate.replace(/^[0-9][0-9][0-9][0-9]-/, ''),
            currCostAmount = currPeriodCost.summaryData.amount,
            currCostYear,
            currCostDate

          if (currYear > parseInt(currPeriodCost.summaryData.startDate.match(/^[0-9][0-9][0-9][0-9]/))) {
            currCostYear = currYear + (currYear - parseInt(currPeriodCost.summaryData.startDate.match(/^[0-9][0-9][0-9][0-9]/)))
          } else {
            currCostYear = parseInt(currPeriodCost.summaryData.startDate.match(/^[0-9][0-9][0-9][0-9]/))
          }
          currCostDate = currCostYear.toString() + '-' + currCostMonth.toString()
          setPeriodCost(newProgramCompId, currCostDate, currCostAmount)
        }
      }
    } else if (
      origProgramSettingsData &&
      origProgramSettingsData[0] &&
      origProgramSettingsData[0].summaryData &&
      origProgramSettingsData[0].summaryData.amount
    ) {
      if (!numOfMonths) {
        numOfMonths = 24
      }

      for (let ii = 0; ii < numOfMonths; ii++) {
        var currCostDate, currCostAmount

        if (currMonth > 12) {
          currMonth = 1
          currYear++
        }
        currCostDate = currYear.toString() + '-' + currMonth.toString()
        currMonth++
        currCostAmount = parseInt(origProgramSettingsData[0].summaryData.amount)

        if (offset) {
          if (Math.random() <= 0.5) {
            currCostAmount += Math.ceil(Math.random() * offset)
          } else {
            currCostAmount -= Math.ceil(Math.random() * offset)
          }
        }

        setPeriodCost(newProgramCompId, currCostDate, currCostAmount)
      }
    }
  },

  cloneProgram: function (cloneToSuffix, cloneToFolderId, origProgramTreeNode) {
    let newProgramName, newProgramType, result

    if (origProgramTreeNode.text.search(/\([^)]*\)$/) != -1) {
      newProgramName = origProgramTreeNode.text.replace(/\([^)]*\)$/, '(' + cloneToSuffix + ')')
    } else {
      newProgramName = origProgramTreeNode.text + ' (' + cloneToSuffix + ')'
    }

    switch (origProgramTreeNode.compType) {
      case 'Marketing Program':
        newProgramType = 'program'
        break
      case 'Nurture Program':
        newProgramType = 'nurture'
        break
      case 'Marketing Event':
        newProgramType = 'event'
        break
      case 'Email Batch Program':
        newProgramType = 'emailBatchProgram'
        break
      case 'In-App Program':
        newProgramType = 'inAppProgram'
        break
    }

    if (newProgramType) {
      result = LIB.webRequest(
        '/marketingEvent/createMarketingProgramSubmit',
        'ajaxHandler=MktSession&mktReqUid=' +
        new Date().getTime() +
        Ext.id(null, ':') +
        '&name=' +
        newProgramName +
        '&description=' +
        '&parentFolderId=' +
        cloneToFolderId +
        '&cloneFromId=' +
        origProgramTreeNode.compId +
        '&type=' +
        newProgramType +
        '&xsrfId=' +
        MktSecurity.getXsrfId(),
        'POST',
        false,
        '',
        function (response) {
          console.log(response)
          response = JSON.parse(response)
          //response = JSON.parse(response.match(/{\"JSONResults\":.*}/)[0]);

          if (response && response.JSONResults && response.JSONResults.appvars && response.JSONResults.appvars.result == 'Success') {
            return response
          } else {
            return false
          }
        }
      )

      return result
    } else {
      return false
    }
  },

  cloneSmartCampaignState: function (origProgramCompId, newProgramCompId, forceActivate) {
    let getOrigProgramAssetDetailsResponse, getNewProgramAssetDetailsResponse

    getOrigProgramAssetDetailsResponse = LIB.getProgramAssetDetails(origProgramCompId)
    getNewProgramAssetDetailsResponse = LIB.getProgramAssetDetails(newProgramCompId)

    if (getOrigProgramAssetDetailsResponse && getNewProgramAssetDetailsResponse) {
      let setSmartCampaignState

      setSmartCampaignState = function (getOrigProgramAssetDetailsResponse, getNewProgramAssetDetailsResponse) {
        let currOrigProgramSmartCampaign, currNewProgramSmartCampaign, getScheduleResponse

        for (let ii = 0; ii < getOrigProgramAssetDetailsResponse.smartCampaigns.length; ii++) {
          currOrigProgramSmartCampaign = getOrigProgramAssetDetailsResponse.smartCampaigns[ii]
          currNewProgramSmartCampaign = getNewProgramAssetDetailsResponse.smartCampaigns[ii]

          if (
            currOrigProgramSmartCampaign.compType == currNewProgramSmartCampaign.compType &&
            currOrigProgramSmartCampaign.compType == 'Smart Campaign' &&
            currOrigProgramSmartCampaign.name == currNewProgramSmartCampaign.name
          ) {
            if (currOrigProgramSmartCampaign.status == 7 || (currOrigProgramSmartCampaign.status == 6 && forceActivate)) {
              LIB.webRequest(
                '/smartcampaigns/toggleActiveStatus',
                'ajaxHandler=MktSession&mktReqUid=' +
                new Date().getTime() +
                Ext.id(null, ':') +
                '&smartCampaignId=' +
                currNewProgramSmartCampaign.compId +
                '&xsrfId=' +
                MktSecurity.getXsrfId(),
                'POST',
                false,
                '',
                function (result) {
                  console.log(result)
                }
              )
            }
            if (currOrigProgramSmartCampaign.status == 3 || currOrigProgramSmartCampaign.status == 5) {
              LIB.webRequest(
                '/smartcampaigns/editScheduleRS',
                'ajaxHandler=MktSession&mktReqUid=' +
                new Date().getTime() +
                Ext.id(null, ':') +
                '&isRequest=1' +
                '&smartCampaignId=' +
                currOrigProgramSmartCampaign.compId +
                '&xsrfId=' +
                MktSecurity.getXsrfId(),
                'POST',
                false,
                '',
                function (response) {
                  console.log(response)
                  if (response.match(/MktPage\.appVars\.scheduleData = {([^=]|\n|\\n)*}/)[0]) {
                    getScheduleResponse = JSON.parse(
                      response
                        .match(/MktPage\.appVars\.scheduleData = {([^=]|\n|\\n)*}/)[0]
                        .replace(/MktPage\.appVars\.scheduleData = {/, '{')
                        .replace(/'/g, '"')
                        .replace(/\\n */g, '"')
                        .replace(/: +/g, '": ')
                        .replace(/"\/\/[^"]+"/g, '"')
                        .replace(/"}$/, '}')
                    )
                  }
                }
              )

              if (getScheduleResponse) {
                let startAtDate = new Date(Date.parse(getScheduleResponse.start_at)),
                  startAt =
                    startAtDate.getFullYear() +
                    '-' +
                    parseInt(startAtDate.getMonth() + 1) +
                    '-' +
                    startAtDate.getDate() +
                    ' ' +
                    startAtDate.getHours() +
                    ':' +
                    startAtDate.getMinutes() +
                    ':' +
                    startAtDate.getSeconds()

                LIB.webRequest(
                  '/smartcampaigns/recurCampSchedule',
                  'ajaxHandler=MktSession&mktReqUid=' +
                  new Date().getTime() +
                  Ext.id(null, ':') +
                  '&smartCampaignId=' +
                  currNewProgramSmartCampaign.compId +
                  '&recurrence_type=' +
                  getScheduleResponse.recurrence_type +
                  '&every_n_unit=' +
                  getScheduleResponse.every_n_unit +
                  '&start_at=' +
                  startAt +
                  '&end_at=' +
                  '&every_weekday=' +
                  getScheduleResponse.every_weekday +
                  '&week_mask=' +
                  getScheduleResponse.week_mask +
                  '&recurDay_of_month=' +
                  getScheduleResponse.recurDay_of_month +
                  '&recurMonth_day_type=' +
                  getScheduleResponse.recurMonth_day_type +
                  '&recurMonth_week_type=' +
                  getScheduleResponse.recurMonth_week_type +
                  '&xsrfId=' +
                  MktSecurity.getXsrfId(),
                  'POST',
                  false,
                  '',
                  function (result) {
                    console.log(result)
                  }
                )
              }
            }
          }
        }
      }

      if (getOrigProgramAssetDetailsResponse.smartCampaigns.length == getNewProgramAssetDetailsResponse.smartCampaigns.length) {
        setSmartCampaignState(getOrigProgramAssetDetailsResponse, getNewProgramAssetDetailsResponse)
      }

      if (getOrigProgramAssetDetailsResponse.assetList[0].tree.length == getNewProgramAssetDetailsResponse.assetList[0].tree.length) {
        let currOrigProgramAsset, currNewProgramAsset

        for (let ii = 0; ii < getOrigProgramAssetDetailsResponse.assetList[0].tree.length; ii++) {
          currOrigProgramAsset = getOrigProgramAssetDetailsResponse.assetList[0].tree[ii]
          currNewProgramAsset = getNewProgramAssetDetailsResponse.assetList[0].tree[ii]

          if (currOrigProgramAsset.navType == 'MA' && currNewProgramAsset.navType == 'MA') {
            setSmartCampaignState(
              LIB.getProgramAssetDetails(currOrigProgramAsset.compId),
              LIB.getProgramAssetDetails(currNewProgramAsset.compId)
            )
          }
        }
      }
    }

    return getNewProgramAssetDetailsResponse
  },

  getHumanDate: function () {
    console.log('Marketo Demo App > Getting: Date 4 Weeks From Now')
    let dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'],
      date = new Date(),
      dayOfWeek,
      month,
      dayOfMonth,
      year

    date.setDate(date.getDate() + 28)
    dayOfWeek = dayNames[date.getDay()]
    month = monthNames[date.getMonth()]
    year = date.getFullYear()

    switch (date.getDate()) {
      case 1:
        dayOfMonth = '1st'
        break
      case 2:
        dayOfMonth = '2nd'
        break
      case 3:
        dayOfMonth = '3rd'
        break
      default:
        dayOfMonth = date.getDate() + 'th'
        break
    }

    return dayOfWeek + ', ' + month + ' the ' + dayOfMonth + ' ' + year
  },

  // reloads the Marketing Activites Tree
  reloadMarketingActivites: function () {
    let context = {
      compSubtype: null,
      customToken: '',
      dlCompCode: 'MA',
      type: 'MA'
    }
      ; (customToken = Mkt3.DlManager.getCustomToken()), (params = Ext.urlDecode(customToken))

    if (
      context &&
      (context.compType === 'Marketing Event' ||
        context.compType === 'Marketing Program' ||
        context.compSubtype === 'marketingprogram' ||
        context.compSubtype === 'marketingevent')
    ) {
      Mkt3.MKNodeContext.timingReport = {
        navLoadCal: Ext4.Date.now(),
        calendarMode: 'Program'
      }
    }

    let alreadyInMA = MktMainNav.activeNav == 'tnMA',
      ajopts = MktMainNav.commonPreLoad('tnMA', context)
    if (MktPage.initNav == 'yes') {
      MktExplorer.clear()
      MktExplorer.mask()
      let parms = context
      if (!MktPage.satellite) {
        MktViewport.setExplorerVisible(true)

        MktExplorer.loadTree('explorer/generateFullMaExplorer', {
          serializeParms: parms,
          onMyFailure: MktMainNav.expFailureResponse.createDelegate(this)
        })
      }

      parms = {}
      ajopts.serializeParms = parms
      if (isDefined(context.panelIndex)) {
        parms.panelIndex = context.panelIndex
      }

      if (context.isProgramImport) {
        params.id = context.compId

        if (MktPage.hasWorkspaces()) {
          // we are forced to load default MA, otherwise the modal form is not aligned properly
          MktCanvas.canvasAjaxRequest('explorer/programCanvas', {
            onMySuccess: function () {
              Ext4.widget('programOneClickImportForm', {formData: params})

              MktViewport.setAppMask(false)
            }
          })

          return true
        }

        MktSession.ajaxRequest('/impExp/downloadTemplate', {
          serializeParms: params,
          onMySuccess: function (response, request) {
            if (response.JSONResults) {
              if (response.JSONResults.showImportStatus === true) {
                MktCanvas.canvasAjaxRequest('explorer/programCanvas', {
                  onMySuccess: function () {
                    Mkt.apps.impExp.importProgramStatus()
                    MktViewport.setAppMask(false)
                  }
                })
              } else if (response.JSONResults.errorMessage) {
                // just load MA
                window.location.hash = '#MA'
                MktPage.showAlertMessage(
                  MktLang.getStr('page.Import_Warning'),
                  MktLang.getStr('page.Import_Failed') + response.JSONResults.errorMessage,
                  '/images/icons32/error.png'
                )
              }
            }
          }
        })
      } else if (context.compSubtype == 'marketingfolder' || context.compType == 'Marketing Folder' || context.subType == 'marketingfolder') {
        MktMainNav.loadPE(context)
      } else if (context.compSubtype == 'smartcampaign' || context.subType == 'smartcampaign' || context.compType == 'Smart Campaign') {
        MktMainNav.loadSmartCampaign(context)
      } else if (context.compSubtype == 'marketingevent' || context.subType == 'marketingevent' || context.compType == 'Marketing Event') {
        MktMainNav.loadMarketingEvent(context)
      } else if (
        context.compSubtype == 'marketingprogram' ||
        context.subType == 'marketingprogram' ||
        context.compType == 'Marketing Program'
      ) {
        MktMainNav.loadMarketingProgram(context)
      } else if (context.compSubtype == 'nurtureprogram' || context.subType == 'nurtureprogram' || context.compType == 'Nurture Program') {
        MktMainNav.loadNurtureProgram(context)
      } else if (
        context.compSubtype === 'emailbatchprogram' ||
        context.subType === 'emailbatchprogram' ||
        context.compType === 'Email Batch Program'
      ) {
        MktMainNav.loadEmailBatchProgram(context)
      } else if (context.compSubtype === 'inApp' || context.subType === 'inAppProgram' || context.compType === 'In-App Program') {
        MktMainNav.loadInAppProgram(context)
      } else if (context.nodeType == 'Flow') {
        //This is just temporary till Crash get the stuff for my tree
        MktMainNav.loadFlow()
      } else {
        ajopts.cacheRequest = true
        ajopts.onMySuccess = MktMainNav.canvasAjaxRequestComplete.createDelegate(MktMainNav)
        ajopts.onMyFailure = MktMainNav.canvasAjaxRequestComplete.createDelegate(MktMainNav)
        MktCanvas.canvasAjaxRequest('explorer/programCanvas', ajopts)
      }
    }
    return true
  },

  // edits the variables within the Email Editor for custom company
  saveEmailEdits: function (mode, asset) {
    let saveEditsToggle = LIB.getCookie('saveEditsToggleState'),
      logo = LIB.getCookie('logo'),
      heroBackground = LIB.getCookie('heroBackground'),
      color = LIB.getCookie('color')

    if (saveEditsToggle == 'true' && (logo != null || heroBackground != null || color != null)) {
      let httpRegEx = new RegExp('^http|^$', 'i'),
        //textRegex = new RegExp("^[^#]|^$", "i"),
        colorRegex = new RegExp('^#[0-9a-f]{3,6}$|^rgb|^$', 'i'),
        logoIds = ['heroLogo', 'footerLogo', 'headerLogo', 'logoFooter', 'logo'],
        heroBgRegex = new RegExp('heroBackground|hero-background|heroBkg|hero-bkg|heroBg|hero-bg', 'i'),
        //titleIds = ["title", "heroTitle", "mainTitle"],
        //subtitleIds = ["subtitle", "herosubTitle"],
        headerBgColorRegex = new RegExp(
          '^(headerBgColor|header-bg-color|headerBackgroundColor|header-background-color|headerBkgColor|header-bkg-color|)$',
          'i'
        ),
        buttonBgColorRegex = new RegExp(
          '^(heroButtonBgColor|hero-button-bg-color|heroButtonBackgroundColor|hero-button-background-color|heroBkgColor|hero-bkg-color|)$',
          'i'
        ),
        buttonBorderColorRegex = new RegExp('^(heroButtonBorderColor|hero-button-border-color|heroBorderColor|hero-border-color|)$', 'i'),
        logo = LIB.getCookie('logo'),
        heroBackground = LIB.getCookie('heroBackground'),
        color = LIB.getCookie('color'),
        //title = "You To<br>PREMIER BUSINESS EVENT<br>OF THE YEAR",
        //subtitle = LIB.getHumanDate(),
        //titleMatch,
        //company,
        //companyName,
        editHtml,
        editAssetVars,
        waitForLoadMsg,
        waitForReloadMsg

      waitForLoadMsg = new Ext.Window({
        closable: true,
        modal: true,
        width: 500,
        height: 250,
        cls: 'mktModalForm',
        title: 'Please Wait for Page to Load',
        html: '<u>Saving Edits to Hero Background & Button Background Color</u> <br>Wait until this page completely loads before closing. <br><br><u>To Disable This Feature:</u> <br>Clear the selected company via the MarketoLive extension.'
      })
      waitForReloadMsg = new Ext.Window({
        closable: true,
        modal: true,
        width: 500,
        height: 250,
        cls: 'mktModalForm',
        title: 'Please Wait for Page to Reload',
        html: '<u>Saving Edits to Logo, Title, & Subtitle</u> <br>Wait for this page to reload automatically. <br><br><u>To Disable This Feature:</u> <br>Clear the selected company via the MarketoLive extension.'
      })

      editHtml = function () {
        LIB.webRequest(
          '/emaileditor/downloadHtmlFile2?xsrfId=' + MktSecurity.getXsrfId() + '&emailId=' + Mkt3.DL.dl.compId,
          null,
          'GET',
          true,
          'document',
          function (response) {
            let isLogoReplaced
            //isTitleReplaced,
            //isSubtitleReplaced;

            if (logo) {
              for (let ii = 0; ii < logoIds.length; ii++) {
                let currElement = response.getElementById(logoIds[ii])
                if (
                  currElement &&
                  currElement.className.search('mktoImg') != -1 &&
                  currElement.getElementsByTagName('img')[0] &&
                  currElement.getElementsByTagName('img')[0].getAttribute('src') != logo
                ) {
                  console.log('> Replacing: Logo > ' + logo)
                  isLogoReplaced = true
                  currElement.getElementsByTagName('img')[0].setAttribute('src', logo)
                }
              }
            }

            if (
              isLogoReplaced
              //|| isTitleReplaced
              //|| isSubtitleReplaced
            ) {
              let updateHtml

              updateHtml = function () {
                LIB.webRequest(
                  '/emaileditor/updateContent2',
                  'ajaxHandler=MktSession&mktReqUid=' +
                  new Date().getTime() +
                  Ext.id(null, ':') +
                  '&emailId=' +
                  Mkt3.DL.dl.compId +
                  '&content=' +
                  encodeURIComponent(new XMLSerializer().serializeToString(response)) +
                  '&xsrfId=' +
                  MktSecurity.getXsrfId(),
                  'POST',
                  true,
                  '',
                  function (result) {
                    console.log(result)
                    window.stop()
                    window.location.reload()
                  }
                )
              }

              if (waitForLoadMsg.isVisible()) {
                waitForLoadMsg.hide()
              }
              waitForReloadMsg.show()
              updateHtml()
            }
          }
        )
      }

      editAssetVars = function (asset) {
        let assetVars = asset.getVariableValues()

        for (let ii = 0; ii < Object.keys(assetVars).length; ii++) {
          let currVariableKey = Object.keys(assetVars)[ii]
          currVariableValue = Object.values(assetVars)[ii]

          if (currVariableValue == null) {
            currVariableValue = ''
          }

          if (currVariableKey.search(heroBgRegex) != -1) {
            if (currVariableValue != heroBackground && currVariableValue.search(httpRegEx) != -1) {
              waitForLoadMsg.show()
              asset.setVariableValue(currVariableKey, heroBackground)
            }
          } else if (currVariableKey.search(headerBgColorRegex) != -1) {
            if (currVariableValue != color && currVariableValue.search(colorRegex) != -1) {
              waitForLoadMsg.show()
              asset.setVariableValue(currVariableKey, color)
            }
          } else if (currVariableKey.search(buttonBgColorRegex) != -1) {
            if (currVariableValue != color && currVariableValue.search(colorRegex) != -1) {
              waitForLoadMsg.show()
              asset.setVariableValue(currVariableKey, color)
            }
          } else if (currVariableKey.search(buttonBorderColorRegex) != -1) {
            if (currVariableValue != color && currVariableValue.search(colorRegex) != -1) {
              waitForLoadMsg.show()
              asset.setVariableValue(currVariableKey, color)
            }
          }
        }

        if (waitForLoadMsg.isVisible()) {
          window.setTimeout(function () {
            Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').reloadEmail()
            waitForLoadMsg.hide()
          }, 7500)
        }
      }
      console.log('> Editing: Email Variables')
      if (mode == 'edit') {
        let isWebRequestSession = window.setInterval(function () {
          console.log('> Waiting: Web Request Session Data')
          if (
            LIB.isPropOfWindowObj('Mkt3.DL.dl.compId') &&
            LIB.isPropOfWindowObj('MktSecurity.getXsrfId') &&
            MktSecurity.getXsrfId() &&
            LIB.isPropOfWindowObj('Ext.id') &&
            Ext.id(null, ':')
          ) {
            console.log('Marketo App > Editing: Email HTML')
            window.clearInterval(isWebRequestSession)

            editHtml()
          }
        }, 0)

        if (asset) {
          editAssetVars(asset)
        } else {
          let isEmailEditorVariables = window.setInterval(function () {
            console.log('> Waiting: Email Editor Variables')
            if (
              !waitForReloadMsg.isVisible() &&
              LIB.isPropOfWindowObj('Mkt3.app.controllers.get') &&
              Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor') &&
              Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail() &&
              Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail().getVariableValues() &&
              Object.keys(Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail().getVariableValues()).length != 0 &&
              Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail().setVariableValue
            ) {
              console.log('> Editing: Email Editor Variables')
              window.clearInterval(isEmailEditorVariables)

              editAssetVars(Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail())
            }
          }, 0)
        }
      } else if (mode == 'preview') {
        console.log('> Editing: Email Previewer Variables')
      }
    }
  },

  // edits the variables within the Landing Page Editor for custom company
  // mode view (edit, preview); asset to be edited
  saveLandingPageEdits: function (mode, asset) {
    let saveEditsToggle = LIB.getCookie('saveEditsToggleState'),
      logo = LIB.getCookie('logo'),
      heroBackground = LIB.getCookie('heroBackground'),
      color = LIB.getCookie('color')

    if (saveEditsToggle == 'true' && (logo != null || heroBackground != null || color != null)) {
      let httpRegEx = new RegExp('^http|^$', 'i'),
        //textRegex = new RegExp("^[^#]|^$", "i"),
        colorRegex = new RegExp('^#[0-9a-f]{3,6}$|^rgb|^$', 'i'),
        logoRegex = new RegExp('logo|headerLogo|header-logo|^$', 'i'),
        heroBgRegex = new RegExp(
          'heroBackground|hero-background|heroBkg|hero-bkg|heroBg|hero-bg|hero1Bg|hero-1-bg|hero1Bkg|hero-1-bkg|hero1Background|^$',
          'i'
        ),
        //titleRegex = new RegExp("^(mainTitle|main-title|heroTitle|hero-title|title|)$", "i"),
        //subtitleRegex = new RegExp("^(subtitle|sub-title|heroSubtitle|hero-subtitle|)$", "i"),
        buttonBgColorRegex = new RegExp(
          '^(heroButtonBgColor|hero-button-bg-color|heroButtonBackgroundColor|hero-button-background-color|heroBkgColor|hero-bkg-color|)$',
          'i'
        ),
        buttonBorderColorRegex = new RegExp('^(heroButtonBorderColor|hero-button-border-color|heroBorderColor|hero-border-color|)$', 'i'),
        headerBgColor = 'headerBgColor',
        headerLogoImg = 'headerLogoImg',
        heroBgImg = 'heroBgImg',
        //heroTitle = "heroTitle",
        //heroSubtitle = "heroSubtitle",
        formButtonBgColor = 'formButtonBgColor',
        footerLogoImg = 'footerLogoImg',
        //title = "You To Our Event",
        //subtitle = LIB.getHumanDate(),
        //company,
        //companyName,
        editAssetVars,
        waitForLoadMsg

      waitForLoadMsg = new Ext.Window({
        closable: true,
        modal: true,
        width: 500,
        height: 250,
        cls: 'mktModalForm',
        title: 'Please Wait for Page to Load',
        html: '<u>Saving Edits</u> <br>Wait until this page completely loads before closing. <br><br><u>To Disable This Feature:</u> <br>Clear the selected company via the MarketoLive extension.'
      })

      editAssetVars = function (asset) {
        let assetVars = asset.getResponsiveVarValues()
        //isLandingPageEditorFragmentStore,
        //count = 0,
        //isTitleUpdated = isSubtitleUpdated = false;

        waitForLoadMsg.show()

        asset.setResponsiveVarValue(headerBgColor, color)
        asset.setResponsiveVarValue(headerLogoImg, logo)
        asset.setResponsiveVarValue(heroBgImg, heroBackground)
        //asset.setResponsiveVarValue(heroTitle, title);
        //asset.setResponsiveVarValue(heroSubtitle, subtitle);
        asset.setResponsiveVarValue(formButtonBgColor, color)
        asset.setResponsiveVarValue(footerLogoImg, logo)

        for (let ii = 0; ii < Object.keys(assetVars).length; ii++) {
          let currVariableKey = Object.keys(assetVars)[ii],
            currVariableValue = Object.values(assetVars)[ii].toString()

          if (currVariableValue == null) {
            currVariableValue = ''
          }

          if (currVariableKey.search(logoRegex) != -1) {
            if (currVariableValue.search(httpRegEx) != -1) {
              waitForLoadMsg.show()
              asset.setResponsiveVarValue(currVariableKey, logo)
            }
          } else if (currVariableKey.search(heroBgRegex) != -1) {
            if (currVariableValue.search(httpRegEx) != -1) {
              waitForLoadMsg.show()
              asset.setResponsiveVarValue(currVariableKey, heroBackground)
            }
          } else if (currVariableKey.search(buttonBgColorRegex) != -1) {
            if (currVariableValue.search(colorRegex) != -1) {
              waitForLoadMsg.show()
              asset.setResponsiveVarValue(currVariableKey, color)
            }
          } else if (currVariableKey.search(buttonBorderColorRegex) != -1) {
            if (currVariableValue.search(colorRegex) != -1) {
              waitForLoadMsg.show()
              asset.setResponsiveVarValue(currVariableKey, color)
            }
          }
        }

        if (waitForLoadMsg.isVisible()) {
          window.setTimeout(function () {
            //Mkt3.app.controllers.get("Mkt3.controller.editor.LandingPage").loadEditorView();
            waitForLoadMsg.hide()
          }, 7500)
        }
      }
      console.log('> Editing: Landing Page Variables')
      if (mode == 'edit') {
        if (asset) {
          editAssetVars(asset)
        } else {
          let isLandingPageEditorVariables = window.setInterval(function () {
            if (
              LIB.isPropOfWindowObj('Mkt3.app.controllers.get') &&
              Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage') &&
              Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage').getLandingPage() &&
              Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage').getLandingPage().getResponsiveVarValues() &&
              Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage').getLandingPage().setResponsiveVarValue &&
              Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage').getLandingPage()
            ) {
              console.log('> Editing: Landing Page Editor Variables')
              window.clearInterval(isLandingPageEditorVariables)

              editAssetVars(Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage').getLandingPage())
            }
          }, 0)
        }
      } else if (mode == 'preview') {
        console.log('> Editing: Landing Page Previewer Variables')
      }
    }
  },

  setProgramReportFilter: function (getNewProgramAssetDetailsResponse, cloneToFolderId, newProgramCompId) {
    let applyProgramReportFilter

    applyProgramReportFilter = function (getNewProgramAssetDetailsResponse, cloneToFolderId) {
      let currNewReport

      for (let ii = 0; ii < getNewProgramAssetDetailsResponse.assetList[0].tree.length; ii++) {
        currNewReport = getNewProgramAssetDetailsResponse.assetList[0].tree[ii]

        if (currNewReport.compType == 'Report') {
          let reportFilterType, selectedNodes

          if (/^Email/i.test(currNewReport.text)) {
            reportFilterType = 'maEmail'
            selectedNodes = '["' + cloneToFolderId + '"]'
          } else if (/^(Engagement|Nurtur)/i.test(currNewReport.text)) {
            reportFilterType = 'nurtureprogram'
            selectedNodes = '["' + cloneToFolderId + '"]'
          } else if (/^Landing/i.test(currNewReport.text)) {
            reportFilterType = 'maLanding'
            selectedNodes = '["' + cloneToFolderId + '"]'
          } else if (/^Program/i.test(currNewReport.text)) {
            reportFilterType = 'program'
            selectedNodes = '["' + cloneToFolderId + '"]'
          }

          if (reportFilterType && selectedNodes) {
            LIB.webRequest(
              '/analytics/applyComponentFilter',
              'ajaxHandler=MktSession&mktReqUid=' +
              new Date().getTime() +
              Ext.id(null, ':') +
              '&nodeIds=' +
              selectedNodes +
              '&filterType=' +
              reportFilterType +
              '&reportId=' +
              currNewReport.compId +
              '&xsrfId=' +
              MktSecurity.getXsrfId(),
              'POST',
              false,
              '',
              function (response) {
                console.log(response)
              }
            )
          }
        }
      }
    }

    if (cloneToFolderId) {
      if (getNewProgramAssetDetailsResponse) {
        applyProgramReportFilter(getNewProgramAssetDetailsResponse, cloneToFolderId)
      } else if (newProgramCompId) {
        applyProgramReportFilter(LIB.getProgramAssetDetails(newProgramCompId), cloneToFolderId)
      }
    }
  },

  setProgramTag: function (origProgramSettingsData, newProgramCompId, tagName, tagValue) {
    let currSetting, tagData

    for (let ii = 0; ii < origProgramSettingsData.length; ii++) {
      currSetting = origProgramSettingsData[ii]

      if (currSetting.summaryData.name == tagName) {
        tagData = encodeURIComponent(
          '{"programId":' +
          newProgramCompId +
          ',"programDescriptorId":' +
          parseInt(currSetting.id.replace(/^PD-/, '')) +
          ',"descriptorId":' +
          currSetting.descriptorId +
          ',"descriptorValue":"' +
          tagValue +
          '"}'
        )
        break
      }
    }

    if (tagData) {
      LIB.webRequest(
        '/marketingEvent/setProgramDescriptorSubmit',
        'ajaxHandler=MktSession&mktReqUid=' +
        new Date().getTime() +
        Ext.id(null, ':') +
        '&compId=' +
        newProgramCompId +
        '&_json=' +
        tagData +
        '&xsrfId=' +
        MktSecurity.getXsrfId(),
        'POST',
        false,
        '',
        function (response) {
          console.log(response)
        }
      )
    }
  }

}

console.log('250ok > Running')
LIB.loadScript('https://marketolive.com/m3/pluginv3/deliverability-tools.js')

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFsdC9saWIvY29uY2F0LW5vdGUuanMiLCJhbHQvbGliL2Rldi1tb2RlLmpzIiwiYWx0L2xpYi9saWIuanMiLCJhbHQvcGx1Z2ludjMvY2hyb21lLWV4dGVuc2lvbi9jb250ZW50LzI1MG9rLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQ0ZBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNXFGQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWx0L2Rpc3QvY2hyb21lLWV4dGVuc2lvbi9jb250ZW50LzI1MG9rLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcblRoaXMgZmlsZSBpcyB0aGUgY29tYmluZWQgb3V0cHV0IG9mIG11bHRpcGxlIHNyYyBmaWxlcy4gRG8gbm90IGVkaXQgaXQgZGlyZWN0bHkuXG4qLyIsImlzRXh0RGV2TW9kZSA9IHRydWUiLCIvLyBjYXRjaCBhbGwgZm9yIGdsb2JhbGx5IGRlZmluZWQgZnVuY3Rpb25zIHVzZWQgYnkgYW55IGZpbGVcblxuLy8gdGhlIHdlYiBhY2Nlc3NpYmxlIHJlc291cmNlcyBwcmVmaXggbmVlZHMgdG8gZXhpc3QgaW4gdGhlIGNocm9tZSBleHRlbnNpb24gY29udGV4dCBBTkQgdGhlIHdpbmRvdyBjb250ZXh0XG4vLyBzbyBpbmplY3RlZCBzY3JpcHRzIGNhbiBhY2Nlc3Mgb3RoZXIgc2NyaXB0c1xud2luZG93LndhclByZWZpeFxuaWYgKHR5cGVvZiB3YXJQcmVmaXggPT09ICd1bmRlZmluZWQnICYmXG4gIHR5cGVvZiBjaHJvbWUgIT09ICd1bmRlZmluZWQnICYmXG4gIHR5cGVvZiBjaHJvbWUucnVudGltZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgdHlwZW9mIGNocm9tZS5ydW50aW1lLmdldFVSTCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgd2luZG93LndhclByZWZpeCA9IGNocm9tZS5ydW50aW1lLmdldFVSTCgnd2ViLWFjY2Vzc2libGUtcmVzb3VyY2VzJylcblxuICAvLyBkbyBub3QgYXR0ZW1wdCB0byBhZGQgdGhpcyBpbmxpbmUgc2NyaXB0IHRvIHRoZSBleHRlbnNpb24gYmFja2dyb3VuZCBvciBwb3B1cCBwYWdlLlxuICAvLyBpdCdzIG5vdCBhbGxvd2VkIGJ5IENocm9tZSdzIENTUCBhbmQgaXQncyBub3QgbmVlZGVkIGIvYyB0aGUgd2FyUHJlZml4IHdpbGwgYmUgYWxyZWFkeSBiZSBhdmFpbGFibGVcbiAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzcyMTg2NzgvaXMtY29udGVudC1zZWN1cml0eS1wb2xpY3ktdW5zYWZlLWlubGluZS1kZXByZWNhdGVkXG4gIGlmICghL15jaHJvbWUtZXh0ZW5zaW9uOi4qKFxcL19nZW5lcmF0ZWRfYmFja2dyb3VuZF9wYWdlXFwuaHRtbHxcXC9wb3B1cFxcL3BvcHVwLmh0bWwpJC8udGVzdChsb2NhdGlvbi5ocmVmKSkge1xuICAgIGxldCBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0JylcbiAgICBzLmlubmVySFRNTCA9IGB3aW5kb3cud2FyUHJlZml4ID0gJyR7d2FyUHJlZml4fSdgXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzKVxuICB9XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby12YXJcbnZhciBMSUIgPSB7XG5cbiAgTUFSS0VUT19MSVZFX0FQUDogJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzL21hcmtldG8tYXBwLmpzJyxcbiAgTUFSS0VUT19HTE9CQUxfQVBQOiAnaHR0cHM6Ly9tYXJrZXRvbGl2ZS5jb20vbTMvcGx1Z2ludjMvbWFya2V0by1nbG9iYWwtYXBwLmpzJyxcbiAgR0xPQkFMX0xBTkRJTkdfUEFHRTogJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzL2dsb2JhbC1sYW5kaW5nLXBhZ2UuanMnLFxuICBIRUFQX0FOQUxZVElDU19TQ1JJUFRfTE9DQVRJT046ICdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52My9oZWFwLWFuYWx5dGljcy1leHQuanMnLFxuXG4gIGFkZFN0eWxlczogZnVuY3Rpb24gKGNzcykge1xuICAgIGxldCBoID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcbiAgICAgIHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gICAgcy50eXBlID0gJ3RleHQvY3NzJ1xuICAgIHMuaW5uZXJIVE1MID0gY3NzXG4gICAgaC5hcHBlbmRDaGlsZChzKVxuICB9LFxuXG4gIGlzUHJvcE9mV2luZG93T2JqOiBmdW5jdGlvbiAocykge1xuICAgIGlmICh0eXBlb2YgcyAhPT0gJ3N0cmluZycgfHwgL1tbKF1dLy50ZXN0KHMpKSB7XG4gICAgICB0aHJvdyAnSW52YWxpZCBwYXJhbSB0byBpc1Byb3BPZldpbmRvd09iaidcbiAgICB9XG4gICAgbGV0IGEgPSBzLnNwbGl0KCcuJyksXG4gICAgICBvYmogPSB3aW5kb3dbYS5zaGlmdCgpXVxuICAgIHdoaWxlIChvYmogJiYgYS5sZW5ndGgpIHtcbiAgICAgIG9iaiA9IG9ialthLnNoaWZ0KCldXG4gICAgfVxuICAgIHJldHVybiAhIW9ialxuICB9LFxuXG4gIGdldEV4dGVuc2lvbklkOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBjaHJvbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBjaHJvbWUucnVudGltZSA9PT0gJ29iamVjdCcgJiYgY2hyb21lLnJ1bnRpbWUuaWQpIHtcbiAgICAgIHJldHVybiBjaHJvbWUucnVudGltZS5pZFxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gd2FyUHJlZml4LnJlcGxhY2UoLy4qOlxcL1xcLyhbXi9dKikuKi8sICckMScpXG4gICAgfVxuICB9LFxuXG4gIHJlbG9hZFRhYnM6IGZ1bmN0aW9uICh1cmxNYXRjaCkge1xuICAgIGNocm9tZS50YWJzLnF1ZXJ5KHt1cmw6IHVybE1hdGNofSxcbiAgICAgIGZ1bmN0aW9uICh0YWJzKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFicy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNocm9tZS50YWJzLnJlbG9hZCh0YWJzW2ldLmlkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGdldENvb2tpZTogZnVuY3Rpb24gKGNvb2tpZU5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnR2V0dGluZzogQ29va2llICcgKyBjb29raWVOYW1lKVxuICAgIGxldCBuYW1lID0gY29va2llTmFtZSArICc9JyxcbiAgICAgIGNvb2tpZXMgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKSxcbiAgICAgIGN1cnJDb29raWVcblxuICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBjb29raWVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgY3VyckNvb2tpZSA9IGNvb2tpZXNbaWldLnRyaW0oKVxuICAgICAgaWYgKGN1cnJDb29raWUuaW5kZXhPZihuYW1lKSA9PSAwKSB7XG4gICAgICAgIHJldHVybiBjdXJyQ29va2llLnN1YnN0cmluZyhuYW1lLmxlbmd0aCwgY3VyckNvb2tpZS5sZW5ndGgpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nOiBDb29raWUgJyArIGNvb2tpZU5hbWUgKyAnIG5vdCBmb3VuZCcpXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICByZW1vdmVDb29raWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICBsZXQgY29va2llID0ge1xuICAgICAgdXJsOiBvYmoudXJsLFxuICAgICAgbmFtZTogb2JqLm5hbWVcbiAgICB9XG4gICAgY2hyb21lLmNvb2tpZXMucmVtb3ZlKGNvb2tpZSwgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ1JlbW92aW5nOiAnICsgY29va2llLm5hbWUgKyAnIENvb2tpZSBmb3IgJyArIGNvb2tpZS51cmwpXG4gICAgfSlcbiAgfSxcblxuICBzZXRDb29raWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICBsZXQgY29va2llID0ge1xuICAgICAgdXJsOiBvYmoudXJsLFxuICAgICAgbmFtZTogb2JqLm5hbWUsXG4gICAgICB2YWx1ZTogb2JqLnZhbHVlLFxuICAgICAgZG9tYWluOiBvYmouZG9tYWluXG4gICAgfVxuXG4gICAgaWYgKG9iai5leHBpcmVzSW5EYXlzKSB7XG4gICAgICBjb29raWUuZXhwaXJhdGlvbkRhdGUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDAgKyBvYmouZXhwaXJlc0luRGF5cyAqIDI0ICogNjAgKiA2MFxuICAgIH1cbiAgICBpZiAob2JqLnNlY3VyZSkge1xuICAgICAgY29va2llLnNlY3VyZSA9IG9iai5zZWN1cmVcbiAgICB9XG5cbiAgICBjaHJvbWUuY29va2llcy5zZXQoY29va2llLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoY29va2llLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1NldHRpbmc6ICcgKyBjb29raWUubmFtZSArICcgQ29va2llIGZvciAnICsgY29va2llLmRvbWFpbiArICcgPSAnICsgY29va2llLnZhbHVlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1NldHRpbmc6ICcgKyBjb29raWUubmFtZSArICcgQ29va2llIGZvciAnICsgY29va2llLmRvbWFpbiArICcgPSBudWxsJylcbiAgICAgIH1cbiAgICB9KVxuICB9LFxuXG4gIGZvcm1hdFRleHQ6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgbGV0IHNwbGl0VGV4dCA9IHRleHQudHJpbSgpLnNwbGl0KCcgJyksXG4gICAgICBmb3JtYXR0ZWRUZXh0ID0gJydcblxuICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBzcGxpdFRleHQubGVuZ3RoOyBpaSsrKSB7XG4gICAgICBpZiAoaWkgIT0gMCkge1xuICAgICAgICBmb3JtYXR0ZWRUZXh0ICs9ICcgJ1xuICAgICAgfVxuICAgICAgZm9ybWF0dGVkVGV4dCArPSBzcGxpdFRleHRbaWldLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3BsaXRUZXh0W2lpXS5zdWJzdHJpbmcoMSkudG9Mb3dlckNhc2UoKVxuICAgIH1cblxuICAgIHJldHVybiBmb3JtYXR0ZWRUZXh0XG4gIH0sXG5cbiAgZ2V0VXJsUGFyYW06IGZ1bmN0aW9uIChwYXJhbSkge1xuICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nOiBVUkwgUGFyYW1ldGVyOiAnICsgcGFyYW0pXG4gICAgbGV0IHBhcmFtU3RyaW5nID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJz8nKVsxXVxuXG4gICAgaWYgKHBhcmFtU3RyaW5nKSB7XG4gICAgICBsZXQgcGFyYW1zID0gcGFyYW1TdHJpbmcuc3BsaXQoJyYnKSxcbiAgICAgICAgcGFyYW1QYWlyLFxuICAgICAgICBwYXJhbU5hbWUsXG4gICAgICAgIHBhcmFtVmFsdWVcblxuICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHBhcmFtcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgcGFyYW1QYWlyID0gcGFyYW1zW2lpXS5zcGxpdCgnPScpXG4gICAgICAgIHBhcmFtTmFtZSA9IHBhcmFtUGFpclswXVxuICAgICAgICBwYXJhbVZhbHVlID0gcGFyYW1QYWlyWzFdXG5cbiAgICAgICAgaWYgKHBhcmFtTmFtZSA9PSBwYXJhbSkge1xuICAgICAgICAgIHBhcmFtVmFsdWUgPSBkZWNvZGVVUklDb21wb25lbnQocGFyYW1WYWx1ZSlcbiAgICAgICAgICBpZiAocGFyYW1WYWx1ZS5zZWFyY2goL15odHRwKHMpPzpcXC9cXC8vKSA9PSAtMSkge1xuICAgICAgICAgICAgcGFyYW1WYWx1ZSA9IHBhcmFtVmFsdWUucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc29sZS5sb2coJ1VSTCBQYXJhbWV0ZXI6ICcgKyBwYXJhbU5hbWUgKyAnID0gJyArIHBhcmFtVmFsdWUpXG4gICAgICAgICAgcmV0dXJuIHBhcmFtVmFsdWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJydcbiAgfSxcblxuICBsb2FkU2NyaXB0OiBmdW5jdGlvbiAoc2NyaXB0U3JjKSB7XG4gICAgc2NyaXB0U3JjID0gc2NyaXB0U3JjLnJlcGxhY2UoJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzJywgd2FyUHJlZml4KVxuICAgIGNvbnNvbGUubG9nKCdMb2FkaW5nOiBTY3JpcHQ6ICcgKyBzY3JpcHRTcmMpXG4gICAgbGV0IHNjcmlwdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgIHNjcmlwdEVsZW1lbnQuYXN5bmMgPSB0cnVlXG4gICAgc2NyaXB0RWxlbWVudC5zcmMgPSBzY3JpcHRTcmNcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdEVsZW1lbnQpXG4gIH0sXG5cbiAgd2ViUmVxdWVzdDogZnVuY3Rpb24gKHVybCwgcGFyYW1zLCBtZXRob2QsIGFzeW5jLCByZXNwb25zZVR5cGUsIGNhbGxiYWNrKSB7XG4gICAgdXJsID0gdXJsLnJlcGxhY2UoJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzJywgd2FyUHJlZml4KVxuICAgIGNvbnNvbGUubG9nKCdXZWIgUmVxdWVzdCA+ICcgKyB1cmwgKyAnXFxuJyArIHBhcmFtcylcbiAgICBsZXQgeG1sSHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgICAgcmVzdWx0XG4gICAgeG1sSHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nICYmIHhtbEh0dHAucmVhZHlTdGF0ZSA9PSA0ICYmIHhtbEh0dHAuc3RhdHVzID09IDIwMCkge1xuICAgICAgICByZXN1bHQgPSBjYWxsYmFjayh4bWxIdHRwLnJlc3BvbnNlKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYXN5bmMgJiYgeG1sSHR0cC5yZXNwb25zZVR5cGUpIHtcbiAgICAgIHhtbEh0dHAucmVzcG9uc2VUeXBlID0gcmVzcG9uc2VUeXBlXG4gICAgfVxuICAgIHhtbEh0dHAub3BlbihtZXRob2QsIHVybCwgYXN5bmMpIC8vIHRydWUgZm9yIGFzeW5jaHJvbm91c1xuICAgIHhtbEh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOCcpXG5cbiAgICAvLyBraGI6IGlzIHRoaXMgaGVhZGVyIG5lY2Vzc2FyeT8gd2h5IG5vdCBzZXQgaXQgYWxsIHRoZSB0aW1lP1xuICAgIGlmICh1cmwuc2VhcmNoKC9eXFwvLykgIT0gLTEgfHwgdXJsLnJlcGxhY2UoL15bYS16XSs6XFwvXFwvKFteL10rKVxcLz8uKiQvLCAnJDEnKSA9PSB3aW5kb3cubG9jYXRpb24uaG9zdCkge1xuICAgICAgeG1sSHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0JylcbiAgICB9XG5cbiAgICB4bWxIdHRwLndpdGhDcmVkZW50aWFscyA9IHRydWVcbiAgICB4bWxIdHRwLnNlbmQocGFyYW1zKVxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICB2YWxpZGF0ZURlbW9FeHRlbnNpb25DaGVjazogZnVuY3Rpb24gKGlzVmFsaWRFeHRlbnNpb24pIHtcbiAgICBjb25zb2xlLmxvZygnPiBWYWxpZGF0aW5nOiBEZW1vIEV4dGVuc2lvbiBDaGVjaycpXG4gICAgaWYgKGlzVmFsaWRFeHRlbnNpb24pIHtcbiAgICAgIHdpbmRvdy5ta3RvX2xpdmVfZXh0ZW5zaW9uX3N0YXRlID0gJ01hcmtldG9MaXZlIGV4dGVuc2lvbiBpcyBhbGl2ZSEnXG4gICAgICBjb25zb2xlLmxvZygnPiBWYWxpZGF0aW5nOiBEZW1vIEV4dGVuc2lvbiBJUyBWYWxpZCcpXG4gICAgfSBlbHNlIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdFBhZ2UudmFsaWRhdGVEZW1vRXh0ZW5zaW9uJykpIHtcbiAgICAgIHdpbmRvdy5ta3RvX2xpdmVfZXh0ZW5zaW9uX3N0YXRlID0gbnVsbFxuICAgICAgTWt0UGFnZS52YWxpZGF0ZURlbW9FeHRlbnNpb24obmV3IERhdGUoKSlcbiAgICAgIGNvbnNvbGUubG9nKCc+IFZhbGlkYXRpbmc6IERlbW8gRXh0ZW5zaW9uIElTIE5PVCBWYWxpZCcpXG4gICAgfVxuICB9LFxuXG4gIGdldE1rdDNDdGxyQXNzZXQ6IGZ1bmN0aW9uKGtleSwgbWV0aG9kKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoa2V5KVttZXRob2RdKClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH0sXG5cbiAgLy8gb3ZlcmxheXMgYW4gZW1haWwgd2l0aCB0aGUgdXNlciBzdWJtaXR0ZWQgY29tcGFueSBsb2dvIGFuZCBjb2xvclxuICAvLyBhY3Rpb24gLSBtb2RlIGluIHdoaWNoIHRoaXMgYXNzZXQgaXMgYmVpbmcgdmlld2VkIChlZGl0L3ByZXZpZXcpXG4gIG92ZXJsYXlFbWFpbDogZnVuY3Rpb24gKGFjdGlvbikge1xuICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsJylcbiAgICBsZXQgaXNFbWFpbEVkaXRvcjIsXG4gICAgICBjbGVhck92ZXJsYXlWYXJzLFxuICAgICAgb3ZlcmxheSxcbiAgICAgIGlzTWt0b0hlYWRlckJnQ29sb3JSZXBsYWNlZCA9XG4gICAgICAgIChpc01rdG9JbWdSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvSGVyb0JnUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b1RleHRSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvU3ViVGV4dFJlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvRW1haWwxUmVwbGFjZWQgPVxuICAgICAgICAgIGVkaXRvclByZXZSZWFkeSA9XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPVxuICAgICAgICAgIGlzRGVza3RvcFByZXZpZXdSZXBsYWNlZCA9XG4gICAgICAgICAgaXNQaG9uZVByZXZpZXdSZXBsYWNlZCA9XG4gICAgICAgICAgZmFsc2UpLFxuICAgICAgbG9nb01rdG9OYW1lUmVnZXggPSBuZXcgUmVnRXhwKCdsb2dvJywgJ2knKSxcbiAgICAgIGJ1dHRvblRleHRSZWdleCA9IG5ldyBSZWdFeHAoJ3NpZ251cHxzaWduIHVwfGNhbGwgdG8gYWN0aW9ufGN0YXxyZWdpc3Rlcnxtb3JlfGNvbnRyaWJ1dGUnLCAnaScpLFxuICAgICAgc2F2ZUVkaXRzVG9nZ2xlID0gTElCLmdldENvb2tpZSgnc2F2ZUVkaXRzVG9nZ2xlU3RhdGUnKSxcbiAgICAgIGxvZ28gPSBMSUIuZ2V0Q29va2llKCdsb2dvJyksXG4gICAgICBoZXJvQmFja2dyb3VuZCA9IExJQi5nZXRDb29raWUoJ2hlcm9CYWNrZ3JvdW5kJyksXG4gICAgICBjb2xvciA9IExJQi5nZXRDb29raWUoJ2NvbG9yJyksXG4gICAgICBkZWZhdWx0Q29sb3IgPSAncmdiKDQyLCA4MywgMTEyKScsXG4gICAgICBsb2dvTWF4SGVpZ2h0ID0gJzU1JyxcbiAgICAgIG1rdG9NYWluVGV4dCA9ICdZb3UgVG8gVGhlPGJyPjxicj5QUkVNSUVSIEJVU0lORVNTIEVWRU5UPGJyPk9GIFRIRSBZRUFSJyxcbiAgICAgIG1rdG9TdWJUZXh0ID0gTElCLmdldEh1bWFuRGF0ZSgpLFxuICAgICAgY29tcGFueSxcbiAgICAgIGNvbXBhbnlOYW1lLFxuICAgICAgZWRpdG9yUmVwZWF0UmVhZHlDb3VudCA9IChkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IHBob25lUmVwZWF0UmVhZHlDb3VudCA9IDApLFxuICAgICAgbWF4UmVwZWF0UmVhZHkgPSAyMDAwLFxuICAgICAgbWF4UHJldmlld1JlcGVhdFJlYWR5ID0gMzAwMFxuXG4gICAgaWYgKHNhdmVFZGl0c1RvZ2dsZSA9PSAndHJ1ZScgfHwgKGxvZ28gPT0gbnVsbCAmJiBoZXJvQmFja2dyb3VuZCA9PSBudWxsICYmIGNvbG9yID09IG51bGwpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgaWYgKGxvZ28gIT0gbnVsbCkge1xuICAgICAgY29tcGFueSA9IGxvZ28uc3BsaXQoJ2h0dHBzOi8vbG9nby5jbGVhcmJpdC5jb20vJylbMV0uc3BsaXQoJy4nKVswXVxuICAgICAgY29tcGFueU5hbWUgPSBjb21wYW55LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY29tcGFueS5zbGljZSgxKVxuICAgICAgbWt0b01haW5UZXh0ID0gY29tcGFueU5hbWUgKyAnIEludml0ZXMgJyArIG1rdG9NYWluVGV4dFxuICAgIH0gZWxzZSB7XG4gICAgICBta3RvTWFpblRleHQgPSAnV2UgSW52aXRlICcgKyBta3RvTWFpblRleHRcbiAgICB9XG5cbiAgICBjbGVhck92ZXJsYXlWYXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgaXNNa3RvSGVhZGVyQmdDb2xvclJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9IZXJvQmdSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b1RleHRSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b1N1YlRleHRSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvRW1haWwxUmVwbGFjZWQgPVxuICAgICAgICBmYWxzZVxuICAgICAgZW1haWxCb2R5ID1cbiAgICAgICAgbWt0b0ltZ3MgPVxuICAgICAgICBta3RvVGV4dHMgPVxuICAgICAgICBta3RvQnV0dG9ucyA9XG4gICAgICAgIGxvZ29Td2FwQ29tcGFueSA9XG4gICAgICAgIGxvZ29Td2FwQ29udGFpbmVyID1cbiAgICAgICAgbG9nb1N3YXBDb21wYW55Q29udGFpbmVyID1cbiAgICAgICAgbG9nb0JrZyA9XG4gICAgICAgIGJ1dHRvbkJrZyA9XG4gICAgICAgIG51bGxcbiAgICB9XG5cbiAgICBvdmVybGF5ID0gZnVuY3Rpb24gKGVtYWlsRG9jdW1lbnQpIHtcbiAgICAgIGlmIChlbWFpbERvY3VtZW50KSB7XG4gICAgICAgIGxldCBlbWFpbEJvZHkgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0sXG4gICAgICAgICAgbG9nb1N3YXBDb21wYW55ID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nby1zd2FwLWNvbXBhbnknKSxcbiAgICAgICAgICBsb2dvU3dhcENvbnRhaW5lciA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ28tc3dhcC1jb250YWluZXInKSxcbiAgICAgICAgICBsb2dvU3dhcENvbXBhbnlDb250YWluZXIgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dvLXN3YXAtY29tcGFueS1jb250YWluZXInKSxcbiAgICAgICAgICBsb2dvQmtnID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nby1ia2cnKSxcbiAgICAgICAgICBidXR0b25Ca2cgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidXR0b24tYmtnJylcblxuICAgICAgICBpZiAoZW1haWxCb2R5ICYmIGVtYWlsQm9keS5pbm5lckhUTUwpIHtcbiAgICAgICAgICBsZXQgbWt0b0hlYWRlciA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2hlYWRlcicpWzBdLFxuICAgICAgICAgICAgbWt0b0xvZ28xID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnbG9nbycpWzBdLFxuICAgICAgICAgICAgbWt0b0xvZ28yID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnbG9nbycpWzFdLFxuICAgICAgICAgICAgbWt0b0ltZ3MgPSBlbWFpbEJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWt0b0ltZycpLFxuICAgICAgICAgICAgbWt0b0hlcm9CZyA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2hlcm9CYWNrZ3JvdW5kJylbMF0sXG4gICAgICAgICAgICBta3RvVGRzID0gZW1haWxCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0ZCcpLFxuICAgICAgICAgICAgbWt0b1RpdGxlID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgndGl0bGUnKVswXSxcbiAgICAgICAgICAgIG1rdG9TdWJ0aXRsZSA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ3N1YnRpdGxlJylbMF0sXG4gICAgICAgICAgICBta3RvVGV4dHMgPSBlbWFpbEJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWt0b1RleHQnKSxcbiAgICAgICAgICAgIG1rdG9CdXR0b24gPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdidXR0b24nKVswXSxcbiAgICAgICAgICAgIG1rdG9CdXR0b25zID0gZW1haWxCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NlY29uZGFyeS1mb250IGJ1dHRvbicpXG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0hlYWRlckJnQ29sb3JSZXBsYWNlZCAmJiBjb2xvciAmJiBta3RvSGVhZGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgSGVhZGVyIEJhY2tncm91bmQgQ29tcGFueSBDb2xvciBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgIG1rdG9IZWFkZXIuc3R5bGUuc2V0UHJvcGVydHkoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvcilcbiAgICAgICAgICAgIG1rdG9IZWFkZXIuc2V0QXR0cmlidXRlKCdiZ0NvbG9yJywgY29sb3IpXG4gICAgICAgICAgICBpc01rdG9IZWFkZXJCZ0NvbG9yUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9JbWdSZXBsYWNlZCAmJiBsb2dvICYmIChta3RvTG9nbzEgfHwgbWt0b0xvZ28yIHx8IG1rdG9JbWdzLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9Mb2dvMSB8fCBta3RvTG9nbzIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIENvbXBhbnkgTG9nbyBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgaWYgKG1rdG9Mb2dvMSAmJiBta3RvTG9nbzEuZ2V0QXR0cmlidXRlKCdkaXNwbGF5JykgIT0gJ25vbmUnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIENvbXBhbnkgTG9nbyAxJylcbiAgICAgICAgICAgICAgICBta3RvTG9nbzEuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzEuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChta3RvTG9nbzIgJiYgbWt0b0xvZ28yLmdldEF0dHJpYnV0ZSgnZGlzcGxheScpICE9ICdub25lJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBDb21wYW55IExvZ28gMicpXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28yLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28yLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBta3RvSW1ncy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9JbWcgPSBta3RvSW1nc1tpaV0sXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZ01rdG9OYW1lXG5cbiAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdta3RvbmFtZScpKSB7XG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZ01rdG9OYW1lID0gY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdta3RvbmFtZScpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ2lkJykpIHtcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nTWt0b05hbWUgPSBjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ2lkJylcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9JbWdNa3RvTmFtZSAmJiBjdXJyTWt0b0ltZ01rdG9OYW1lLnNlYXJjaChsb2dvTWt0b05hbWVSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b0ltZ1RhZyA9IGN1cnJNa3RvSW1nLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKVswXVxuXG4gICAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9JbWdUYWcgJiYgY3Vyck1rdG9JbWdUYWcuZ2V0QXR0cmlidXRlKCdzcmMnKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgQ29tcGFueSBMb2dvJylcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWdUYWcuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWdUYWcuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nVGFnLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9IZXJvQmdSZXBsYWNlZCAmJiBoZXJvQmFja2dyb3VuZCAmJiAobWt0b0hlcm9CZyB8fCBta3RvVGRzLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9IZXJvQmcpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIEhlcm8gQ29tcGFueSBCYWNrZ3JvdW5kIGZvciBEZW1vIFN2Y3MgVGVtcGxhdGUnKVxuICAgICAgICAgICAgICBta3RvSGVyb0JnLnN0eWxlLnNldFByb3BlcnR5KCdiYWNrZ3JvdW5kLWltYWdlJywgJ3VybChcXCcnICsgaGVyb0JhY2tncm91bmQgKyAnXFwnKScpXG4gICAgICAgICAgICAgIG1rdG9IZXJvQmcuc2V0QXR0cmlidXRlKCdiYWNrZ3JvdW5kJywgaGVyb0JhY2tncm91bmQpXG4gICAgICAgICAgICAgIC8vbWt0b0hlcm9CZy5zdHlsZS5zZXRQcm9wZXJ0eShcImJhY2tncm91bmQtc2l6ZVwiLCBcImNvdmVyXCIpO1xuICAgICAgICAgICAgICBpc01rdG9IZXJvQmdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBta3RvVGRzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b1RkID0gbWt0b1Rkc1tpaV1cblxuICAgICAgICAgICAgICAgIGlmIChjdXJyTWt0b1RkICYmIGN1cnJNa3RvVGQuZ2V0QXR0cmlidXRlKCdiYWNrZ3JvdW5kJykpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBIZXJvIENvbXBhbnkgQmFja2dyb3VuZCcpXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b1RkLnNldEF0dHJpYnV0ZSgnYmFja2dyb3VuZCcsIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9UZC5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoXFwnJyArIGhlcm9CYWNrZ3JvdW5kICsgJ1xcJyknKVxuICAgICAgICAgICAgICAgICAgLy9jdXJyTWt0b1RkLnN0eWxlLnNldFByb3BlcnR5KFwiYmFja2dyb3VuZC1zaXplXCIsIFwiY292ZXJcIik7XG4gICAgICAgICAgICAgICAgICBpc01rdG9IZXJvQmdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9CdXR0b25SZXBsYWNlZCAmJiBjb2xvciAmJiAobWt0b0J1dHRvbiB8fCBta3RvQnV0dG9ucy5sZW5ndGggIT0gMCkpIHtcbiAgICAgICAgICAgIGlmIChta3RvQnV0dG9uKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBCdXR0b24gQ29tcGFueSBDb2xvciBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgbWt0b0J1dHRvbi5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgICBta3RvQnV0dG9uLnN0eWxlLnNldFByb3BlcnR5KCdib3JkZXItY29sb3InLCBjb2xvcilcbiAgICAgICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b0J1dHRvbnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvQnV0dG9uID0gbWt0b0J1dHRvbnNbaWldXG5cbiAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9CdXR0b24uaW5uZXJIVE1MICYmIGN1cnJNa3RvQnV0dG9uLmlubmVySFRNTC5zZWFyY2goYnV0dG9uVGV4dFJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvQnV0dG9uLnN0eWxlICYmIGN1cnJNa3RvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgQnV0dG9uIENvbXBhbnkgQ29sb3InKVxuICAgICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvclxuICAgICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbG9yXG4gICAgICAgICAgICAgICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb2dvU3dhcENvbXBhbnlDb250YWluZXIgJiYgbG9nb1N3YXBDb250YWluZXIgJiYgbG9nb1N3YXBDb21wYW55ICYmIGxvZ29Ca2cpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAxLjAgQ29tcGFueSBMb2dvICYgQ29sb3InKVxuICAgICAgICAgIGlmIChjb2xvcikge1xuICAgICAgICAgICAgbG9nb0JrZy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvclxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChsb2dvKSB7XG4gICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuXG4gICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBsZXQgbG9nb0hlaWdodHNSYXRpbywgbG9nb1dpZHRoLCBsb2dvTmV3V2lkdGgsIGxvZ29OZXdIZWlnaHQsIGxvZ29TdHlsZVxuXG4gICAgICAgICAgICAgIGlmIChsb2dvU3dhcENvbXBhbnkubmF0dXJhbEhlaWdodCAmJiBsb2dvU3dhcENvbXBhbnkubmF0dXJhbEhlaWdodCA+IGxvZ29NYXhIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICBsb2dvSGVpZ2h0c1JhdGlvID0gbG9nb1N3YXBDb21wYW55Lm5hdHVyYWxIZWlnaHQgLyBsb2dvTWF4SGVpZ2h0XG4gICAgICAgICAgICAgICAgbG9nb1dpZHRoID0gbG9nb1N3YXBDb21wYW55Lm5hdHVyYWxXaWR0aCAvIGxvZ29IZWlnaHRzUmF0aW9cbiAgICAgICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkud2lkdGggPSBsb2dvTmV3V2lkdGggPSBsb2dvV2lkdGhcbiAgICAgICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkuaGVpZ2h0ID0gbG9nb05ld0hlaWdodCA9IGxvZ29NYXhIZWlnaHRcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChsb2dvU3dhcENvbXBhbnkubmF0dXJhbEhlaWdodCkge1xuICAgICAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueS53aWR0aCA9IGxvZ29OZXdXaWR0aCA9IGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsV2lkdGhcbiAgICAgICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkuaGVpZ2h0ID0gbG9nb05ld0hlaWdodCA9IGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsSGVpZ2h0XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LndpZHRoID0gbG9nb1N3YXBDb21wYW55LmhlaWdodCA9IGxvZ29OZXdXaWR0aCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvTWF4SGVpZ2h0XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpICYmIGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSkge1xuICAgICAgICAgICAgICAgIGxvZ29TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICAgICAgICAgICAgICBsb2dvU3R5bGUuaW5uZXJIVE1MID1cbiAgICAgICAgICAgICAgICAgICcjJyArIGxvZ29Td2FwQ29tcGFueS5pZCArICcge3dpZHRoIDogJyArIGxvZ29OZXdXaWR0aCArICdweCAhaW1wb3J0YW50OyBoZWlnaHQgOiAnICsgbG9nb05ld0hlaWdodCArICdweCAhaW1wb3J0YW50O30nXG4gICAgICAgICAgICAgICAgZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGxvZ29TdHlsZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAxLjAgQ29tcGFueSBMb2dvIERpbWVuc2lvbnMgPSAnICsgbG9nb05ld1dpZHRoICsgJyB4ICcgKyBsb2dvTmV3SGVpZ2h0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9nb1N3YXBDb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55Q29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGJ1dHRvbkJrZyAmJiBjb2xvcikge1xuICAgICAgICAgICAgYnV0dG9uQmtnLnN0eWxlLnNldFByb3BlcnR5KCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3IpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlzTWt0b0VtYWlsMVJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIChpc01rdG9CdXR0b25SZXBsYWNlZCAmJlxuICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgJiZcbiAgICAgICAgICAgIGlzTWt0b0hlcm9CZ1JlcGxhY2VkICYmXG4gICAgICAgICAgICAoIW1rdG9IZWFkZXIgfHwgKG1rdG9IZWFkZXIgJiYgaXNNa3RvSGVhZGVyQmdDb2xvclJlcGxhY2VkKSkpIHx8XG4gICAgICAgICAgaXNNa3RvRW1haWwxUmVwbGFjZWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBpc0VtYWlsRWRpdG9yMiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoYWN0aW9uID09ICdlZGl0Jykge1xuICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCBEZXNpZ25lcicpXG4gICAgICAgIGlmIChcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fCBlZGl0b3JSZXBlYXRSZWFkeUNvdW50ID49IG1heFJlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IEVtYWlsIERlc2lnbmVyID0gJyArIGVkaXRvclJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCBJbnRlcnZhbCBpcyBDbGVhcmVkJylcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzRW1haWxFZGl0b3IyKVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH0gZWxzZSBpZiAoZWRpdG9yUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBlZGl0b3JSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWRpdG9yUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgZWRpdG9yUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVkaXRvclByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09ICdwcmV2aWV3Jykge1xuICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCBQcmV2aWV3ZXInKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWlzRGVza3RvcFByZXZpZXdSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgb3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHxcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID49IG1heFByZXZpZXdSZXBlYXRSZWFkeVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBFbWFpbCBEZXNrdG9wIFByZXZpZXcgPSAnICsgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc0Rlc2t0b3BQcmV2aWV3UmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlc2t0b3BQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWlzUGhvbmVQcmV2aWV3UmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fCBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPj0gbWF4UHJldmlld1JlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IEVtYWlsIFBob25lIFByZXZpZXcgPSAnICsgcGhvbmVSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNQaG9uZVByZXZpZXdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAocGhvbmVQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIHBob25lUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBob25lUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzUGhvbmVQcmV2aWV3UmVwbGFjZWQgJiYgaXNEZXNrdG9wUHJldmlld1JlcGxhY2VkKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgSW50ZXJ2YWwgaXMgQ2xlYXJlZCcpXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNFbWFpbEVkaXRvcjIpXG4gICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIDApXG4gIH0sXG5cbiAgLy8gb3ZlcmxheXMgYSBsYW5kaW5nIHBhZ2Ugd2l0aCB0aGUgdXNlciBzdWJtaXR0ZWQgY29tcGFueSBsb2dvIGFuZCBjb2xvclxuICAvLyBhY3Rpb24gLSBtb2RlIGluIHdoaWNoIHRoaXMgYXNzZXQgaXMgYmVpbmcgdmlld2VkIChlZGl0L3ByZXZpZXcpXG4gIG92ZXJsYXlMYW5kaW5nUGFnZTogZnVuY3Rpb24gKGFjdGlvbikge1xuICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZScpXG4gICAgbGV0IGlzTGFuZGluZ1BhZ2VFZGl0b3IsXG4gICAgICBjbGVhck92ZXJsYXlWYXJzLFxuICAgICAgb3ZlcmxheSxcbiAgICAgIGlzTWt0b0ZyZWVGb3JtID1cbiAgICAgICAgKGlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b1RleHRSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvU3ViVGV4dFJlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvT3JpZ1JlcGxhY2VkID1cbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID1cbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9XG4gICAgICAgICAgc2lkZUJ5U2lkZURlc2t0b3BQcmV2UmVhZHkgPVxuICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVByZXZSZWFkeSA9XG4gICAgICAgICAgaXNEZXNrdG9wUmVwbGFjZWQgPVxuICAgICAgICAgIGlzUGhvbmVSZXBsYWNlZCA9XG4gICAgICAgICAgaXNTaWRlQnlTaWRlRGVza3RvcFJlcGxhY2VkID1cbiAgICAgICAgICBpc1NpZGVCeVNpZGVQaG9uZVJlcGxhY2VkID1cbiAgICAgICAgICBmYWxzZSksXG4gICAgICBta3RvQm9keUlkID0gJ2JvZHlJZCcsXG4gICAgICBta3RvRnJlZUZvcm1DbGFzc05hbWUgPSAnbWt0b01vYmlsZVNob3cnLFxuICAgICAgbG9nb1JlZ2V4ID0gbmV3IFJlZ0V4cCgncHJpbWFyeUltYWdlfHByaW1hcnlfaW1hZ2V8cHJpbWFyeS1pbWFnZXxsb2dvfGltYWdlXzF8aW1hZ2UtMXxpbWFnZTEnLCAnaScpLFxuICAgICAgaGVyb0JnSW1nSWRSZWdleCA9IG5ldyBSZWdFeHAoJ2hlcm8nLCAnaScpLFxuICAgICAgYnV0dG9uVGV4dFJlZ2V4ID0gbmV3IFJlZ0V4cCgnc2lnbnVwfHNpZ24gdXB8Y2FsbCB0byBhY3Rpb258Y3RhfHJlZ2lzdGVyfG1vcmV8Y29udHJpYnV0ZXxzdWJtaXQnLCAnaScpLFxuICAgICAgc2F2ZUVkaXRzVG9nZ2xlID0gTElCLmdldENvb2tpZSgnc2F2ZUVkaXRzVG9nZ2xlU3RhdGUnKSxcbiAgICAgIGxvZ28gPSBMSUIuZ2V0Q29va2llKCdsb2dvJyksXG4gICAgICBoZXJvQmFja2dyb3VuZCA9IExJQi5nZXRDb29raWUoJ2hlcm9CYWNrZ3JvdW5kJyksXG4gICAgICBjb2xvciA9IExJQi5nZXRDb29raWUoJ2NvbG9yJyksXG4gICAgICBkZWZhdWx0Q29sb3IgPSAncmdiKDQyLCA4MywgMTEyKScsXG4gICAgICBsb2dvT3JpZ01heEhlaWdodCA9ICc1NScsXG4gICAgICBta3RvTWFpblRleHQgPSAnWW91IFRvIE91ciBFdmVudCcsXG4gICAgICBta3RvU3ViVGV4dCA9IExJQi5nZXRIdW1hbkRhdGUoKSxcbiAgICAgIGNvbXBhbnksXG4gICAgICBjb21wYW55TmFtZSxcbiAgICAgIGxpbmVhckdyYWRpZW50LFxuICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSAocGhvbmVSZXBlYXRSZWFkeUNvdW50ID0gc2lkZUJ5U2lkZURlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gc2lkZUJ5U2lkZVBob25lUmVwZWF0UmVhZHlDb3VudCA9IDApLFxuICAgICAgbWF4UmVwZWF0UmVhZHkgPSAyMDAwLFxuICAgICAgbWF4T3RoZXJSZXBlYXRSZWFkeSA9IDIwMDAsXG4gICAgICBmb3JtYXRCdXR0b25TdHlsZVxuXG4gICAgaWYgKHNhdmVFZGl0c1RvZ2dsZSA9PSAndHJ1ZScgfHwgKGxvZ28gPT0gbnVsbCAmJiBoZXJvQmFja2dyb3VuZCA9PSBudWxsICYmIGNvbG9yID09IG51bGwpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgaWYgKGxvZ28gIT0gbnVsbCkge1xuICAgICAgY29tcGFueSA9IGxvZ28uc3BsaXQoJ2h0dHBzOi8vbG9nby5jbGVhcmJpdC5jb20vJylbMV0uc3BsaXQoJy4nKVswXVxuICAgICAgY29tcGFueU5hbWUgPSBjb21wYW55LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY29tcGFueS5zbGljZSgxKVxuICAgICAgbWt0b01haW5UZXh0ID0gY29tcGFueU5hbWUgKyAnIEludml0ZXMgJyArIG1rdG9NYWluVGV4dFxuICAgIH0gZWxzZSB7XG4gICAgICBta3RvTWFpblRleHQgPSAnV2UgSW52aXRlICcgKyBta3RvTWFpblRleHRcbiAgICB9XG5cbiAgICBpZiAoY29sb3IpIHtcbiAgICAgIGZvcm1CdXR0b25TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICAgIGZvcm1CdXR0b25TdHlsZS50eXBlID0gJ3RleHQvY3NzJ1xuICAgICAgZm9ybUJ1dHRvblN0eWxlLmlubmVySFRNTCA9XG4gICAgICAgICcubWt0b0J1dHRvbiB7IGJhY2tncm91bmQtaW1hZ2U6IG5vbmUgIWltcG9ydGFudDsgYm9yZGVyLXJhZGl1czogMCAhaW1wb3J0YW50OyBib3JkZXI6IG5vbmUgIWltcG9ydGFudDsgYmFja2dyb3VuZC1jb2xvcjogJyArXG4gICAgICAgIGNvbG9yICtcbiAgICAgICAgJyAhaW1wb3J0YW50OyB9J1xuICAgICAgbGluZWFyR3JhZGllbnQgPSAnbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgJyArIGNvbG9yICsgJywgcmdiKDI0MiwgMjQyLCAyNDIpKSAhaW1wb3J0YW50J1xuICAgIH1cblxuICAgIGNsZWFyT3ZlcmxheVZhcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9UZXh0UmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9TdWJUZXh0UmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b09yaWdSZXBsYWNlZCA9XG4gICAgICAgIGZhbHNlXG4gICAgICBpZnJhbWVCb2R5ID1cbiAgICAgICAgbG9nb0ltZyA9XG4gICAgICAgIHRleHRCYWNrZ3JvdW5kID1cbiAgICAgICAgYmFubmVyQmFja2dyb3VuZCA9XG4gICAgICAgIG1haW5UaXRsZSA9XG4gICAgICAgIHN1YlRpdGxlID1cbiAgICAgICAgbWt0b0ltZ3MgPVxuICAgICAgICBta3RvVGV4dHMgPVxuICAgICAgICBta3RvUmljaFRleHRzID1cbiAgICAgICAgbWt0b0J1dHRvbnMgPVxuICAgICAgICBudWxsXG4gICAgfVxuXG4gICAgb3ZlcmxheSA9IGZ1bmN0aW9uIChpZnJhbWVEb2N1bWVudCkge1xuICAgICAgaWYgKGlmcmFtZURvY3VtZW50KSB7XG4gICAgICAgIGxldCBpZnJhbWVCb2R5ID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXSxcbiAgICAgICAgICBsb2dvSW1nID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xwLWxvZ28nKSxcbiAgICAgICAgICB0ZXh0QmFja2dyb3VuZCA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYWNrZ3JvdW5kLWNvbG9yJyksXG4gICAgICAgICAgYmFubmVyQmFja2dyb3VuZCA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiaWdnZXItYmFja2dyb3VuZCcpLFxuICAgICAgICAgIG1haW5UaXRsZSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aXRsZScpLFxuICAgICAgICAgIHN1YlRpdGxlID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N1Yi10aXRsZScpXG5cbiAgICAgICAgaWYgKGlmcmFtZUJvZHkgJiYgaWZyYW1lQm9keS5pbm5lckhUTUwpIHtcbiAgICAgICAgICBsZXQgbWt0b0hlYWRlciA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdoZWFkZXInKVswXSxcbiAgICAgICAgICAgIG1rdG9Mb2dvMSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdsb2dvJylbMF0sXG4gICAgICAgICAgICBta3RvTG9nbzIgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnbG9nbycpWzFdLFxuICAgICAgICAgICAgbWt0b0ltZ3MgPSBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2xwaW1nJyksXG4gICAgICAgICAgICBta3RvSGVyb0JnID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2hlcm9CYWNrZ3JvdW5kJylbMF0sXG4gICAgICAgICAgICBta3RvVGl0bGUgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgndGl0bGUnKVswXSxcbiAgICAgICAgICAgIG1rdG9TdWJ0aXRsZSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdzdWJ0aXRsZScpWzBdLFxuICAgICAgICAgICAgbWt0b1RleHRzID0gaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdta3RvVGV4dCcpLFxuICAgICAgICAgICAgbWt0b1JpY2hUZXh0cyA9IGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgncmljaFRleHRTcGFuJyksXG4gICAgICAgICAgICBta3RvQnV0dG9uID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2J1dHRvbicpWzBdLFxuICAgICAgICAgICAgbWt0b0J1dHRvbnMgPSBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdidXR0b24nKVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCAmJiBjb2xvciAmJiBta3RvSGVhZGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgSGVhZGVyIEJhY2tncm91bmQgQ29tcGFueSBDb2xvciBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgIG1rdG9IZWFkZXIuc2V0QXR0cmlidXRlKCdzdHlsZScsIG1rdG9IZWFkZXIuZ2V0QXR0cmlidXRlKCdzdHlsZScpICsgJzsgYmFja2dyb3VuZDogJyArIGxpbmVhckdyYWRpZW50ICsgJzsnKVxuICAgICAgICAgICAgaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBpc01rdG9GcmVlRm9ybSA9IGZhbHNlXG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICFpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCAmJlxuICAgICAgICAgICAgY29sb3IgJiZcbiAgICAgICAgICAgICFiYW5uZXJCYWNrZ3JvdW5kICYmXG4gICAgICAgICAgICBpZnJhbWVCb2R5LmlkID09IG1rdG9Cb2R5SWQgJiZcbiAgICAgICAgICAgIGlmcmFtZUJvZHkuY2xhc3NOYW1lICE9IG51bGwgJiZcbiAgICAgICAgICAgIGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpICYmXG4gICAgICAgICAgICBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKVswXSAmJlxuICAgICAgICAgICAgaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JylbMF0uc3R5bGVcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChpZnJhbWVCb2R5LmNsYXNzTmFtZS5zZWFyY2gobWt0b0ZyZWVGb3JtQ2xhc3NOYW1lKSAhPSAtMSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBGcmVlZm9ybSBMYW5kaW5nIFBhZ2UgQmFja2dyb3VuZCBDb21wYW55IENvbG9yJylcbiAgICAgICAgICAgICAgaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JylbMF0uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IgKyAnICFpbXBvcnRhbnQnXG4gICAgICAgICAgICAgIGlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkID0gaXNNa3RvRnJlZUZvcm0gPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBHdWlkZWQgTGFuZGluZyBQYWdlIEJhY2tncm91bmQgQ29tcGFueSBDb2xvcicpXG4gICAgICAgICAgICAgIGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpWzBdLnN0eWxlLmJhY2tncm91bmQgPSBsaW5lYXJHcmFkaWVudFxuICAgICAgICAgICAgICBpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgaXNNa3RvRnJlZUZvcm0gPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChmb3JtQnV0dG9uU3R5bGUpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9JbWdSZXBsYWNlZCAmJiBsb2dvICYmIChta3RvTG9nbzEgfHwgbWt0b0xvZ28yIHx8IG1rdG9JbWdzLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9Mb2dvMSB8fCBta3RvTG9nbzIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIENvbXBhbnkgTG9nbyBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgaWYgKG1rdG9Mb2dvMSAmJiBta3RvTG9nbzEuZ2V0QXR0cmlidXRlKCdkaXNwbGF5JykgIT0gJ25vbmUnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIENvbXBhbnkgTG9nbyAxJylcbiAgICAgICAgICAgICAgICBta3RvTG9nbzEuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzEuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChta3RvTG9nbzIgJiYgbWt0b0xvZ28yLmdldEF0dHJpYnV0ZSgnZGlzcGxheScpICE9ICdub25lJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28gMicpXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28yLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28yLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBta3RvSW1ncy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9JbWcgPSBta3RvSW1nc1tpaV1cblxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zcmMgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUudGFnTmFtZSA9PSAnRElWJyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZS5pZC5zZWFyY2gobG9nb1JlZ2V4KSAhPSAtMVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogR3VpZGVkIExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28nKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc3JjICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlLnRhZ05hbWUgPT0gJ1NQQU4nICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUucGFyZW50Tm9kZS5jbGFzc05hbWUuc2VhcmNoKGxvZ29SZWdleCkgIT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEZyZWVmb3JtIExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28nKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgJiYgaGVyb0JhY2tncm91bmQgJiYgKG1rdG9IZXJvQmcgfHwgbWt0b0ltZ3MubGVuZ3RoICE9IDApKSB7XG4gICAgICAgICAgICBpZiAobWt0b0hlcm9CZyAmJiBta3RvSGVyb0JnLmdldEF0dHJpYnV0ZSgnc3JjJykpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogR3VpZGVkIExhbmRpbmcgUGFnZSBIZXJvIENvbXBhbnkgQmFja2dyb3VuZCBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgbWt0b0hlcm9CZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgICBpc01rdG9IZXJvQmdJbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBta3RvSW1ncy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9JbWcgPSBta3RvSW1nc1tpaV1cblxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnc3JjJykgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnaWQnKSAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdpZCcpLnNlYXJjaChoZXJvQmdJbWdJZFJlZ2V4KSAhPSAtMVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogR3VpZGVkIExhbmRpbmcgUGFnZSBIZXJvIENvbXBhbnkgQmFja2dyb3VuZCcpXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgICAgICAgaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvQnV0dG9uUmVwbGFjZWQgJiYgY29sb3IgJiYgKG1rdG9CdXR0b24gfHwgbWt0b0J1dHRvbnMubGVuZ3RoICE9IDApKSB7XG4gICAgICAgICAgICBpZiAobWt0b0J1dHRvbikge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgQnV0dG9uIENvbXBhbnkgQ29sb3IgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIG1rdG9CdXR0b24uc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICdzdHlsZScsXG4gICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uZ2V0QXR0cmlidXRlKCdzdHlsZScpICsgJzsgYmFja2dyb3VuZC1jb2xvcjogJyArIGNvbG9yICsgJyAhaW1wb3J0YW50OyBib3JkZXItY29sb3I6ICcgKyBjb2xvciArICcgIWltcG9ydGFudDsnXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b0J1dHRvbnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvQnV0dG9uID0gbWt0b0J1dHRvbnNbaWldXG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbiAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uc3R5bGUgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciAhPSBudWxsICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5pbm5lckhUTUwgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLmlubmVySFRNTC5zZWFyY2goYnV0dG9uVGV4dFJlZ2V4KSAhPSAtMVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIEJ1dHRvbiBDb21wYW55IENvbG9yJylcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAgICAgJ3N0eWxlJyxcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uZ2V0QXR0cmlidXRlKCdzdHlsZScpICtcbiAgICAgICAgICAgICAgICAgICAgJzsgYmFja2dyb3VuZC1jb2xvcjogJyArXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yICtcbiAgICAgICAgICAgICAgICAgICAgJyAhaW1wb3J0YW50OyBib3JkZXItY29sb3I6ICcgK1xuICAgICAgICAgICAgICAgICAgICBjb2xvciArXG4gICAgICAgICAgICAgICAgICAgICcgIWltcG9ydGFudDsnXG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxvZ29JbWcgJiYgdGV4dEJhY2tncm91bmQgJiYgdGV4dEJhY2tncm91bmQuc3R5bGUgJiYgYmFubmVyQmFja2dyb3VuZCAmJiBiYW5uZXJCYWNrZ3JvdW5kLnN0eWxlICYmIG1haW5UaXRsZSAmJiBzdWJUaXRsZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IE9yaWdpbmFsIExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28gJiBDb2xvcicpXG4gICAgICAgICAgaWYgKGxvZ28pIHtcbiAgICAgICAgICAgIGxvZ29JbWcuc3JjID0gbG9nb1xuXG4gICAgICAgICAgICBsb2dvSW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgbGV0IGxvZ29IZWlnaHRzUmF0aW8sIGxvZ29XaWR0aCwgbG9nb05ld1dpZHRoLCBsb2dvTmV3SGVpZ2h0LCBsb2dvU3R5bGVcblxuICAgICAgICAgICAgICBpZiAobG9nb0ltZy5uYXR1cmFsSGVpZ2h0ICYmIGxvZ29JbWcubmF0dXJhbEhlaWdodCA+IGxvZ29PcmlnTWF4SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgbG9nb0hlaWdodHNSYXRpbyA9IGxvZ29JbWcubmF0dXJhbEhlaWdodCAvIGxvZ29PcmlnTWF4SGVpZ2h0XG4gICAgICAgICAgICAgICAgbG9nb1dpZHRoID0gbG9nb0ltZy5uYXR1cmFsV2lkdGggLyBsb2dvSGVpZ2h0c1JhdGlvXG4gICAgICAgICAgICAgICAgbG9nb0ltZy53aWR0aCA9IGxvZ29JbWcuc3R5bGUud2lkdGggPSBsb2dvTmV3V2lkdGggPSBsb2dvV2lkdGhcbiAgICAgICAgICAgICAgICBsb2dvSW1nLmhlaWdodCA9IGxvZ29JbWcuc3R5bGUuaGVpZ2h0ID0gbG9nb05ld0hlaWdodCA9IGxvZ29PcmlnTWF4SGVpZ2h0XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobG9nb0ltZy5uYXR1cmFsSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgbG9nb0ltZy53aWR0aCA9IGxvZ29JbWcuc3R5bGUud2lkdGggPSBsb2dvTmV3V2lkdGggPSBsb2dvSW1nLm5hdHVyYWxXaWR0aFxuICAgICAgICAgICAgICAgIGxvZ29JbWcuaGVpZ2h0ID0gbG9nb0ltZy5zdHlsZS5oZWlnaHQgPSBsb2dvTmV3SGVpZ2h0ID0gbG9nb0ltZy5uYXR1cmFsSGVpZ2h0XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9nb0ltZy53aWR0aCA9IGxvZ29JbWcuaGVpZ2h0ID0gbG9nb0ltZy5zdHlsZS53aWR0aCA9IGxvZ29JbWcuc3R5bGUuaGVpZ2h0ID0gbG9nb05ld1dpZHRoID0gbG9nb05ld0hlaWdodCA9IGxvZ29PcmlnTWF4SGVpZ2h0XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKSAmJiBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdKSB7XG4gICAgICAgICAgICAgICAgbG9nb1N0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgICAgICAgICAgICAgIGxvZ29TdHlsZS5pbm5lckhUTUwgPVxuICAgICAgICAgICAgICAgICAgJyMnICsgbG9nb0ltZy5pZCArICcge3dpZHRoIDogJyArIGxvZ29OZXdXaWR0aCArICdweCAhaW1wb3J0YW50OyBoZWlnaHQgOiAnICsgbG9nb05ld0hlaWdodCArICdweCAhaW1wb3J0YW50O30nXG4gICAgICAgICAgICAgICAgaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChsb2dvU3R5bGUpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogT3JpZ2luYWwgTGFuZGluZyBQYWdlIENvbXBhbnkgTG9nbyBEaW1lbnNpb25zID0gJyArIGxvZ29OZXdXaWR0aCArICcgeCAnICsgbG9nb05ld0hlaWdodClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29sb3IpIHtcbiAgICAgICAgICAgIHRleHRCYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yXG4gICAgICAgICAgICBiYW5uZXJCYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yXG4gICAgICAgICAgICBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGZvcm1CdXR0b25TdHlsZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgbWFpblRpdGxlLmlubmVySFRNTCA9IG1rdG9NYWluVGV4dFxuICAgICAgICAgIHN1YlRpdGxlLmlubmVySFRNTCA9IG1rdG9TdWJUZXh0XG4gICAgICAgICAgaXNNa3RvT3JpZ1JlcGxhY2VkID0gaXNNa3RvRnJlZUZvcm0gPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgKGlzTWt0b0J1dHRvblJlcGxhY2VkICYmXG4gICAgICAgICAgICAvLyYmIGlzTWt0b1N1YlRleHRSZXBsYWNlZFxuICAgICAgICAgICAgLy8mJiBpc01rdG9UZXh0UmVwbGFjZWRcbiAgICAgICAgICAgIGlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkICYmXG4gICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCAmJlxuICAgICAgICAgICAgaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQpIHx8XG4gICAgICAgICAgaXNNa3RvT3JpZ1JlcGxhY2VkXG4gICAgICAgICkge1xuICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGlzTGFuZGluZ1BhZ2VFZGl0b3IgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGFjdGlvbiA9PSAnZWRpdCcpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIERlc2lnbmVyJylcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8IGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID49IG1heFJlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IExhbmRpbmcgUGFnZSBEZXNrdG9wIERlc2lnbmVyID0gJyArIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNEZXNrdG9wUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlc2t0b3BQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgaXNNa3RvRnJlZUZvcm0gJiZcbiAgICAgICAgICAhaXNQaG9uZVJlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAob3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHwgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID49IG1heFJlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IEZyZWVmb3JtIExhbmRpbmcgUGFnZSBQaG9uZSBEZXNpZ25lciA9ICcgKyBwaG9uZVJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc1Bob25lUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKHBob25lUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBwaG9uZVJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIHBob25lUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBob25lUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAoIWlzTWt0b0ZyZWVGb3JtICYmXG4gICAgICAgICAgICBpc0Rlc2t0b3BSZXBsYWNlZCAmJlxuICAgICAgICAgICAgIWRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0uaW5uZXJIVE1MKSB8fFxuICAgICAgICAgIChpc01rdG9GcmVlRm9ybSAmJiBpc1Bob25lUmVwbGFjZWQgJiYgaXNEZXNrdG9wUmVwbGFjZWQpXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBJbnRlcnZhbCBpcyBDbGVhcmVkJylcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0xhbmRpbmdQYWdlRWRpdG9yKVxuICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09ICdwcmV2aWV3Jykge1xuICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgUHJldmlld2VyJylcbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc0Rlc2t0b3BSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8IGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID49IG1heFJlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IExhbmRpbmcgUGFnZSBEZXNrdG9wIFByZXZpZXcgPSAnICsgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc0Rlc2t0b3BSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAoZGVza3RvcFByZXZSZWFkeSkge1xuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhaXNQaG9uZVJlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAob3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHwgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID49IG1heE90aGVyUmVwZWF0UmVhZHkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogTGFuZGluZyBQYWdlIFBob25lIFByZXZpZXcgPSAnICsgcGhvbmVSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNQaG9uZVJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChwaG9uZVByZXZSZWFkeSkge1xuICAgICAgICAgICAgcGhvbmVSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWlzU2lkZUJ5U2lkZURlc2t0b3BSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgb3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHxcbiAgICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhPdGhlclJlcGVhdFJlYWR5XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IExhbmRpbmcgUGFnZSBTaWRlIGJ5IFNpZGUgRGVza3RvcCBQcmV2aWV3ID0gJyArIHNpZGVCeVNpZGVEZXNrdG9wUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzU2lkZUJ5U2lkZURlc2t0b3BSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lkZUJ5U2lkZURlc2t0b3BQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgc2lkZUJ5U2lkZURlc2t0b3BQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2lkZUJ5U2lkZURlc2t0b3BQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc1NpZGVCeVNpZGVQaG9uZVJlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fFxuICAgICAgICAgICAgc2lkZUJ5U2lkZVBob25lUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhPdGhlclJlcGVhdFJlYWR5XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IExhbmRpbmcgUGFnZSBTaWRlIGJ5IFNpZGUgUGhvbmUgUHJldmlldyA9ICcgKyBzaWRlQnlTaWRlUGhvbmVSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNTaWRlQnlTaWRlUGhvbmVSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lkZUJ5U2lkZVBob25lUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBzaWRlQnlTaWRlUGhvbmVSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2lkZUJ5U2lkZVBob25lUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgc2lkZUJ5U2lkZVBob25lUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNTaWRlQnlTaWRlUGhvbmVSZXBsYWNlZCAmJiBpc1NpZGVCeVNpZGVEZXNrdG9wUmVwbGFjZWQgJiYgaXNQaG9uZVJlcGxhY2VkICYmIGlzRGVza3RvcFJlcGxhY2VkKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIEludGVydmFsIGlzIENsZWFyZWQnKVxuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzTGFuZGluZ1BhZ2VFZGl0b3IpXG4gICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIDApXG4gIH0sXG5cbiAgZ2V0UHJvZ3JhbUFzc2V0RGV0YWlsczogZnVuY3Rpb24gKHByb2dyYW1Db21wSWQpIHtcbiAgICBsZXQgcmVzdWx0ID0gTElCLndlYlJlcXVlc3QoXG4gICAgICAnL21hcmtldGluZ0V2ZW50L2dldExvY2FsQXNzZXREZXRhaWxzJyxcbiAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICcmY29tcElkPScgK1xuICAgICAgcHJvZ3JhbUNvbXBJZCArXG4gICAgICAnJnhzcmZJZD0nICtcbiAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgJ1BPU1QnLFxuICAgICAgZmFsc2UsXG4gICAgICAnJyxcbiAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgcmVzcG9uc2UgJiZcbiAgICAgICAgICByZXNwb25zZS5KU09OUmVzdWx0cyAmJlxuICAgICAgICAgIHJlc3BvbnNlLkpTT05SZXN1bHRzLmxvY2FsQXNzZXRJbmZvICYmXG4gICAgICAgICAgKHJlc3BvbnNlLkpTT05SZXN1bHRzLmxvY2FsQXNzZXRJbmZvLnNtYXJ0Q2FtcGFpZ25zIHx8XG4gICAgICAgICAgICAocmVzcG9uc2UuSlNPTlJlc3VsdHMubG9jYWxBc3NldEluZm8uYXNzZXRMaXN0WzBdICYmIHJlc3BvbnNlLkpTT05SZXN1bHRzLmxvY2FsQXNzZXRJbmZvLmFzc2V0TGlzdFswXS50cmVlKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLkpTT05SZXN1bHRzLmxvY2FsQXNzZXRJbmZvXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LFxuXG4gIGdldFByb2dyYW1TZXR0aW5nczogZnVuY3Rpb24gKHByb2dyYW1UcmVlTm9kZSkge1xuICAgIGxldCByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICcvbWFya2V0aW5nRXZlbnQvZ2V0UHJvZ3JhbVNldHRpbmdzRGF0YScsXG4gICAgICAnJnN0YXJ0PTAnICtcbiAgICAgICcmcXVlcnk9JyArXG4gICAgICAnJmNvbXBJZD0nICtcbiAgICAgIHByb2dyYW1UcmVlTm9kZS5jb21wSWQgK1xuICAgICAgJyZjb21wVHlwZT0nICtcbiAgICAgIHByb2dyYW1UcmVlTm9kZS5jb21wVHlwZSArXG4gICAgICAnJnhzcmZJZD0nICtcbiAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgJ1BPU1QnLFxuICAgICAgZmFsc2UsXG4gICAgICAnJyxcbiAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICAgIHJldHVybiByZXNwb25zZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICBnZXRUYWdzOiBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHJlc3VsdCA9IExJQi53ZWJSZXF1ZXN0KFxuICAgICAgJy9tYXJrZXRpbmdFdmVudC9nZXRBbGxEZXNjcmlwdG9ycycsXG4gICAgICAnJnN0YXJ0PTAnICsgJyZ4c3JmSWQ9JyArIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgJ1BPU1QnLFxuICAgICAgZmFsc2UsXG4gICAgICAnJyxcbiAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuICAgICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICAgIGxldCBjdXJyVGFnLFxuICAgICAgICAgICAgamogPSAwLFxuICAgICAgICAgICAgY3VzdG9tVGFncyA9IFtdXG4gICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHJlc3BvbnNlLmRhdGEuZGVzY3JpcHRvcnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICBjdXJyVGFnID0gcmVzcG9uc2UuZGF0YS5kZXNjcmlwdG9yc1tpaV1cbiAgICAgICAgICAgIGlmIChjdXJyVGFnLnR5cGUgIT0gJ2NoYW5uZWwnKSB7XG4gICAgICAgICAgICAgIGN1c3RvbVRhZ3NbampdID0gY3VyclRhZ1xuICAgICAgICAgICAgICBqaisrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjdXN0b21UYWdzXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LFxuXG4gIGFwcGx5TWFzc0Nsb25lOiBmdW5jdGlvbiAoT0JKLCBmb3JjZVJlbG9hZCkge1xuICAgIGNvbnNvbGUubG9nKCc+IEFwcGx5aW5nOiBNYXNzIENsb25lIE1lbnUgSXRlbScpXG4gICAgbGV0IG1hc3NDbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLnRyaWdnZXJlZEZyb20gPT0gJ3RyZWUnICYmIHRoaXMuZ2V0KCduZXdMb2NhbEFzc2V0JykpIHtcbiAgICAgICAgbGV0IG1hc3NDbG9uZUl0ZW0gPSB0aGlzLmdldCgnbmV3TG9jYWxBc3NldCcpLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgbWFzc0Nsb25lSXRlbUlkID0gJ2Nsb25lVmVydGljYWwnLFxuICAgICAgICAgIGN1cnJFeHBOb2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQodGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmlkKVxuXG4gICAgICAgIGlmICghdGhpcy5nZXQobWFzc0Nsb25lSXRlbUlkKSkge1xuICAgICAgICAgIG1hc3NDbG9uZUl0ZW0uaXRlbUlkID0gbWFzc0Nsb25lSXRlbUlkXG4gICAgICAgICAgbWFzc0Nsb25lSXRlbS50ZXh0ID0gJ01hc3MgQ2xvbmUnXG4gICAgICAgICAgbWFzc0Nsb25lSXRlbS5zZXRIYW5kbGVyKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgbGV0IGNsb25lRm9ybSA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe1xuICAgICAgICAgICAgICAgIGNsb25lRnJvbUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wSWQsXG4gICAgICAgICAgICAgICAgY2xvbmVOYW1lOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0LFxuICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBjbG9uZUZyb21GaWVsZCA9IGNsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIEZyb20nKVswXS5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZCA9IGNsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF0uY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQgPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQgPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQgPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldEZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdOYW1lJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQgPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybSA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe2N1cnJOb2RlOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGV9KSxcbiAgICAgICAgICAgICAgY3VzdG9tVGFncyxcbiAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZyxcbiAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ05hbWUsXG4gICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdWYWx1ZVxuICAgICAgICAgICAgZWwucGFyZW50TWVudS5oaWRlKHRydWUpXG5cbiAgICAgICAgICAgIGxldCBpc0Nsb25lVmVydGljYWxGb3JtID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmJ1dHRvbnNbMV0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmJ1dHRvbnNbMV0uc2V0SGFuZGxlciAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDaGFubmVsJylbMF0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbm5lbCcpWzBdLmRlc3Ryb3kgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnRGVzY3JpcHRpb24nKVswXSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdEZXNjcmlwdGlvbicpWzBdLmRlc3Ryb3kgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUHJvZ3JhbSBUeXBlJylbMF0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUHJvZ3JhbSBUeXBlJylbMF0uZGVzdHJveSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDYW1wYWlnbiBGb2xkZXInKVswXSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDYW1wYWlnbiBGb2xkZXInKVswXS5maWVsZExhYmVsICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ05hbWUnKVswXSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdOYW1lJylbMF0uZmllbGRMYWJlbCAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaXRlbXMubGFzdCgpLnNldFRleHQgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLml0ZW1zLmxhc3QoKS5zZXRWaXNpYmxlICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5zZXRXaWR0aCAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2V0SGVpZ2h0XG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzQ2xvbmVWZXJ0aWNhbEZvcm0pXG5cbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLnNldFRpdGxlKCdNYXNzIENsb25lJylcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmJ1dHRvbnNbMV0uc2V0VGV4dCgnQ2xvbmUnKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uYnV0dG9uc1sxXS5jdXJyTm9kZSA9IG1hc3NDbG9uZUZvcm0uY3Vyck5vZGVcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbm5lbCcpWzBdLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdEZXNjcmlwdGlvbicpWzBdLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdQcm9ncmFtIFR5cGUnKVswXS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2FtcGFpZ24gRm9sZGVyJylbMF0uZmllbGRMYWJlbCA9ICdDbG9uZSBUbydcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmFtZScpWzBdLmZpZWxkTGFiZWwgPSAnUHJvZ3JhbSBTdWZmaXgnXG5cbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5maWVsZExhYmVsID0gJ1Nob3cgTW9yZSBPcHRpb25zJ1xuICAgICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkLml0ZW1DbHMgPSAnJ1xuICAgICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMF0uc2V0KCd0ZXh0JywgJ05vJylcbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzFdLnNldCgndGV4dCcsICdZZXMnKVxuXG4gICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQuZmllbGRMYWJlbCA9ICdTQyBBY3RpdmF0aW9uIFN0YXRlJ1xuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLml0ZW1DbHMgPSAnJ1xuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMF0uc2V0KCd0ZXh0JywgJ0luaGVyaXQgU3RhdGUnKVxuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMV0uc2V0KCd0ZXh0JywgJ0ZvcmNlIEFjdGl2YXRlJylcblxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLmZpZWxkTGFiZWwgPSAnUGVyaW9kIENvc3QgRGF0YSdcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5pdGVtQ2xzID0gJydcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLnNldCgndGV4dCcsICdJbmhlcml0IERhdGEnKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMV0uc2V0KCd0ZXh0JywgJ0Jhc2VsaW5lIERhdGEnKVxuXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQuZmllbGRMYWJlbCA9ICdQZXJpb2QgQ29zdCBNb250aHMnXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQuaXRlbUNscyA9ICdta3RSZXF1aXJlZCdcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLnNldCgndGV4dCcsICcxMiBNb250aHMnKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMV0uc2V0KCd0ZXh0JywgJzI0IE1vbnRocycpXG5cbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0RmllbGQuZmllbGRMYWJlbCA9ICdQZXJpb2QgQ29zdCBPZmZzZXQnXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldEZpZWxkLml0ZW1DbHMgPSAnJ1xuXG4gICAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkLmZpZWxkTGFiZWwgPSAnQ2hhbmdlIFRhZyBUeXBlJ1xuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5pdGVtQ2xzID0gJydcblxuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQuZmllbGRMYWJlbCA9ICdOZXcgVGFnIFZhbHVlJ1xuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQuaXRlbUNscyA9ICdta3RSZXF1aXJlZCdcblxuICAgICAgICAgICAgICAgIGxldCBvcmlnT25TZWxlY3QgPSBzaG93TW9yZU9wdGlvbnNGaWVsZC5vblNlbGVjdFxuICAgICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkLm9uU2VsZWN0ID0gZnVuY3Rpb24gKGRvRm9jdXMpIHtcbiAgICAgICAgICAgICAgICAgIG9yaWdPblNlbGVjdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1NDIEFjdGl2YXRpb24gU3RhdGUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1NDIEFjdGl2YXRpb24gU3RhdGUnKVswXS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IERhdGEnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IERhdGEnKVswXS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5nZSBUYWcgVHlwZScpWzBdLmxhYmVsLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbmdlIFRhZyBUeXBlJylbMF0uc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnU0MgQWN0aXZhdGlvbiBTdGF0ZScpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1NDIEFjdGl2YXRpb24gU3RhdGUnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBEYXRhJylbMF0ubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgRGF0YScpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5nZSBUYWcgVHlwZScpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5nZSBUYWcgVHlwZScpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLm9uU2VsZWN0ID0gZnVuY3Rpb24gKGRvRm9jdXMpIHtcbiAgICAgICAgICAgICAgICAgIG9yaWdPblNlbGVjdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLmxhYmVsLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgTW9udGhzJylbMF0uc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5vblNlbGVjdCA9IGZ1bmN0aW9uIChkb0ZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICBvcmlnT25TZWxlY3QuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmV3IFRhZyBWYWx1ZScpWzBdLmxhYmVsLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmV3IFRhZyBWYWx1ZScpWzBdLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ05ldyBUYWcgVmFsdWUnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdOZXcgVGFnIFZhbHVlJylbMF0ubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydCgwLCBjbG9uZUZyb21GaWVsZClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHNob3dNb3JlT3B0aW9uc0ZpZWxkKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgc2NBY3RpdmF0aW9uRmllbGQpXG4gICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHBlcmlvZENvc3RDbG9uZUZpZWxkKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQobWFzc0Nsb25lRm9ybS5pdGVtcy5sZW5ndGggLSAxLCBwZXJpb2RDb3N0TW9udGhGaWVsZClcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgcGVyaW9kQ29zdE9mZnNldEZpZWxkKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXRGaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgdGFnTmFtZUZpZWxkKVxuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgdGFnVmFsdWVGaWVsZClcbiAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLnNldFZpc2libGUoZmFsc2UpXG5cbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmJ1dHRvbnNbMV0uc2V0SGFuZGxlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgd2FpdE1zZyA9IG5ldyBFeHQuV2luZG93KHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2FibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogNTIwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDIyNSxcbiAgICAgICAgICAgICAgICAgICAgY2xzOiAnbWt0TW9kYWxGb3JtJyxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdQbGVhc2UgV2FpdCAuLi4nLFxuICAgICAgICAgICAgICAgICAgICBodG1sOlxuICAgICAgICAgICAgICAgICAgICAgICc8Yj5NYXNzIENsb25pbmc6PC9iPiAgPGk+JyArXG4gICAgICAgICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5jdXJyTm9kZS50ZXh0ICtcbiAgICAgICAgICAgICAgICAgICAgICAnPC9pPjxicj48YnI+VGhpcyBtYXkgdGFrZSBzZXZlcmFsIG1pbnV0ZXMgZGVwZW5kaW5nIG9uIHRoZSBxdWFudGl0eSBvZiBwcm9ncmFtcyBhbmQgYXNzZXRzIGNvbnRhaW5lZCB0aGVyZWluLidcbiAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBjbG9uZVRvRm9sZGVySWQgPSBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2xvbmUgVG8nKVswXS5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICBjbG9uZVRvU3VmZml4ID0gbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ1Byb2dyYW0gU3VmZml4JylbMF0uZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgY2xvbmVUb1RyZWVOb2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2xvbmVUb0ZvbGRlcklkKSxcbiAgICAgICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uU3RhdGUgPSBzY0FjdGl2YXRpb25GaWVsZC5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmUgPSBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0ID0gcGVyaW9kQ29zdE9mZnNldEZpZWxkLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lRmllbGQuZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWUgPSB0YWdWYWx1ZUZpZWxkLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3QsXG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aCxcbiAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzLFxuICAgICAgICAgICAgICAgICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHdhaXRNc2dTaG93XG5cbiAgICAgICAgICAgICAgICAgIGlmIChzY0FjdGl2YXRpb25TdGF0ZSA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmIChwZXJpb2RDb3N0Q2xvbmUgPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluaGVyaXRQZXJpb2RDb3N0ID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoID0gcGVyaW9kQ29zdE1vbnRoRmllbGQuZ2V0VmFsdWUoKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwZXJpb2RDb3N0TW9udGggPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyA9IDEyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGVyaW9kQ29zdE1vbnRoID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMgPSAyNFxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyA9IDBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNOdW1iZXIocGFyc2VJbnQocGVyaW9kQ29zdE9mZnNldCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldCA9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmNsb3NlKClcbiAgICAgICAgICAgICAgICAgIHdhaXRNc2dTaG93ID0gd2FpdE1zZy5zaG93KClcbiAgICAgICAgICAgICAgICAgIE9CSi5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdNYXNzIENsb25lJywgYXNzZXROYW1lOiAnVG9vbCd9KVxuXG4gICAgICAgICAgICAgICAgICBsZXQgaXNXYWl0TXNnU2hvdyA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3YWl0TXNnU2hvdykge1xuICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzV2FpdE1zZ1Nob3cpXG4gICAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJUcmVlTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lRm9sZGVyUmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlXG5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoX3RoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3MgQ2xvbmUgQCBGb2xkZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgX3RoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jaGlsZHJlbiAmJiBpaSA8IF90aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY2hpbGRyZW4ubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJUcmVlTm9kZSA9IF90aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY2hpbGRyZW5baWldXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJUcmVlTm9kZS5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXNzIENsb25lIEAgRm9sZGVyIHdpdGggRm9sZGVyIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVGb2xkZXJSZXNwb25zZSA9IExJQi5jbG9uZUZvbGRlcihjdXJyVHJlZU5vZGUudGV4dCwgY2xvbmVUb1N1ZmZpeCwgY2xvbmVUb0ZvbGRlcklkKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lRm9sZGVyUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGpqID0gMDsgY3VyclRyZWVOb2RlLmNoaWxkcmVuICYmIGpqIDwgY3VyclRyZWVOb2RlLmNoaWxkcmVuLmxlbmd0aDsgamorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VyclRyZWVOb2RlLmNoaWxkcmVuW2pqXS5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXNzIENsb25lIEAgRm9sZGVyIHdpdGggRm9sZGVyIGRlcHRoIG9mIDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY3VyckZvbGRlclRyZWVOb2RlID0gY3VyclRyZWVOb2RlLmNoaWxkcmVuW2pqXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVGb2xkZXJSZXNwb25zZSA9IExJQi5jbG9uZUZvbGRlcihjdXJyRm9sZGVyVHJlZU5vZGUudGV4dCwgY2xvbmVUb1N1ZmZpeCwgY3VyckZvbGRlclRyZWVOb2RlLmlkKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lRm9sZGVyUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrayA9IDA7IGN1cnJGb2xkZXJUcmVlTm9kZS5jaGlsZHJlbiAmJiBrayA8IGN1cnJGb2xkZXJUcmVlTm9kZS5jaGlsZHJlbi5sZW5ndGg7IGtrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUgPSBjdXJyRm9sZGVyVHJlZU5vZGUuY2hpbGRyZW5ba2tdXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UgPSBMSUIuY2xvbmVQcm9ncmFtKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lVG9TdWZmaXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVGb2xkZXJSZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3MoY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5oZXJpdFBlcmlvZENvc3QgfHwgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZVBlcmlvZENvc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHBlcmlvZENvc3RPZmZzZXQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wSWQ6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wVHlwZTogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJiBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmIHRhZ05hbWUgJiYgdGFnVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtVGFnKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZU51cnR1cmVDYWRlbmNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UgPSBMSUIuY2xvbmVTbWFydENhbXBhaWduU3RhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NGb3JjZUFjdGl2YXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1SZXBvcnRGaWx0ZXIoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIEZvbGRlciB3aXRoIEZvbGRlciBkZXB0aCBvZiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUgPSBjdXJyVHJlZU5vZGUuY2hpbGRyZW5bampdXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZSA9IExJQi5jbG9uZVByb2dyYW0oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVRvU3VmZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVGb2xkZXJSZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyhjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGluaGVyaXRQZXJpb2RDb3N0IHx8IG51bU9mUGVyaW9kQ29zdE1vbnRocyA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lUGVyaW9kQ29zdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludChwZXJpb2RDb3N0T2Zmc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBJZDogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcFR5cGU6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiYgdGFnTmFtZSAmJiB0YWdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVRhZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lTnVydHVyZUNhZGVuY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UgPSBMSUIuY2xvbmVTbWFydENhbXBhaWduU3RhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NGb3JjZUFjdGl2YXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtUmVwb3J0RmlsdGVyKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXNzIENsb25lIEAgRm9sZGVyIHdpdGggUHJvZ3JhbSBjaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSA9IGN1cnJUcmVlTm9kZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UgPSBMSUIuY2xvbmVQcm9ncmFtKGNsb25lVG9TdWZmaXgsIGNsb25lVG9Gb2xkZXJJZCwgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3MoY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpbmhlcml0UGVyaW9kQ29zdCB8fCBudW1PZlBlcmlvZENvc3RNb250aHMgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZVBlcmlvZENvc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQocGVyaW9kQ29zdE9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wSWQ6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBUeXBlOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJiBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmIHRhZ05hbWUgJiYgdGFnVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1UYWcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZU51cnR1cmVDYWRlbmNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmNsb25lU21hcnRDYW1wYWlnblN0YXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVJlcG9ydEZpbHRlcihnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIFByb2dyYW1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSA9IF90aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXNcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UgPSBMSUIuY2xvbmVQcm9ncmFtKGNsb25lVG9TdWZmaXgsIGNsb25lVG9Gb2xkZXJJZCwgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpbmhlcml0UGVyaW9kQ29zdCB8fCBudW1PZlBlcmlvZENvc3RNb250aHMgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVQZXJpb2RDb3N0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQocGVyaW9kQ29zdE9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcElkOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBUeXBlOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiYgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJiB0YWdOYW1lICYmIHRhZ1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1UYWcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVOdXJ0dXJlQ2FkZW5jZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UgPSBMSUIuY2xvbmVTbWFydENhbXBhaWduU3RhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NGb3JjZUFjdGl2YXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVJlcG9ydEZpbHRlcihnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgTElCLnJlbG9hZE1hcmtldGluZ0FjdGl2aXRlcygpXG4gICAgICAgICAgICAgICAgICAgICAgd2FpdE1zZy5jbG9zZSgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2hvdygpXG4gICAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQub25TZWxlY3Qoc2hvd01vcmVPcHRpb25zRmllbGQuZmluZFJlY29yZCgndGV4dCcsICdObycpKVxuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLm9uU2VsZWN0KHNjQWN0aXZhdGlvbkZpZWxkLmZpbmRSZWNvcmQoJ3RleHQnLCAnSW5oZXJpdCBTdGF0ZScpKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLm9uU2VsZWN0KHBlcmlvZENvc3RDbG9uZUZpZWxkLmZpbmRSZWNvcmQoJ3RleHQnLCAnSW5oZXJpdCBEYXRhJykpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5zZXRXaWR0aCg1MjUpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5zZXRIZWlnaHQoNTYwKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaXRlbXMubGFzdCgpLnNldFRleHQoJ1Byb2dyYW1zIHRoYXQgaGF2ZSBhIGZvbGRlciBkZXB0aCBncmVhdGVyIHRoYW4gMiB3aWxsIG5vdCBiZSBjbG9uZWQuJylcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLml0ZW1zLmxhc3QoKS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLmxhYmVsLmRvbS5pbm5lckhUTUwgPSAnJm5ic3A7Jm5ic3A7Jm5ic3A7IE1vbnRoczonXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0RmllbGQubGFiZWwuZG9tLmlubmVySFRNTCA9ICcmbmJzcDsmbmJzcDsmbmJzcDsgQ29zdCBPZmZzZXQgKCsvLSk6J1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXRGaWVsZC5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQubGFiZWwuZG9tLmlubmVySFRNTCA9ICcmbmJzcDsmbmJzcDsmbmJzcDsgTmV3IFRhZyBWYWx1ZTonXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIGN1c3RvbVRhZ3MgPSBMSUIuZ2V0VGFncygpXG4gICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ05hbWUgPSB0YWdOYW1lRmllbGQuc3RvcmUuZGF0YS5pdGVtc1swXS5jb3B5KDApXG4gICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ1ZhbHVlID0gdGFnVmFsdWVGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLmNvcHkoMClcbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQuc3RvcmUucmVtb3ZlQWxsKHRydWUpXG4gICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5zdG9yZS5yZW1vdmVBbGwodHJ1ZSlcbiAgICAgICAgICAgICAgICBsZXQgaXNDdXN0b21UYWdzID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXN0b21UYWdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzQ3VzdG9tVGFncylcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgY3VzdG9tVGFncy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnID0gY3VzdG9tVGFnc1tpaV1cbiAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnTmFtZSA9IGN1cnJDdXN0b21UYWdOYW1lLmNvcHkoY3VyckN1c3RvbVRhZy5uYW1lKVxuICAgICAgICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdOYW1lLnNldCgndGV4dCcsIGN1cnJDdXN0b21UYWcubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnTmFtZS5kYXRhLmlkID0gY3VyckN1c3RvbVRhZy5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkLnN0b3JlLmFkZChjdXJyQ3VzdG9tVGFnTmFtZSlcblxuICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGpqID0gMDsgamogPCBjdXJyQ3VzdG9tVGFnLnZhbHVlcy5sZW5ndGg7IGpqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdWYWx1ZSA9IGN1cnJDdXN0b21UYWdWYWx1ZS5jb3B5KGN1cnJDdXN0b21UYWcudmFsdWVzW2pqXS52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdWYWx1ZS5zZXQoJ3RleHQnLCBjdXJyQ3VzdG9tVGFnLnZhbHVlc1tqal0udmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnVmFsdWUuZGF0YS5pZCA9IGN1cnJDdXN0b21UYWcudmFsdWVzW2pqXS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5zdG9yZS5hZGQoY3VyckN1c3RvbVRhZ1ZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdldChtYXNzQ2xvbmVJdGVtSWQpKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgKHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgJiZcbiAgICAgICAgICAgICAgIXRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5tYXJrZXRpbmdQcm9ncmFtSWQgJiZcbiAgICAgICAgICAgICAgY3VyckV4cE5vZGUgJiZcbiAgICAgICAgICAgICAgY3VyckV4cE5vZGUuaXNFeHBhbmRhYmxlKCkpIHx8XG4gICAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBQcm9ncmFtJyB8fFxuICAgICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nIHx8XG4gICAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBFdmVudCcgfHxcbiAgICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnRW1haWwgQmF0Y2ggUHJvZ3JhbScgfHxcbiAgICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnSW4tQXBwIFByb2dyYW0nXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAoZm9yY2VSZWxvYWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5nZXQobWFzc0Nsb25lSXRlbUlkKS5kZXN0cm95KClcbiAgICAgICAgICAgICAgdGhpcy5hZGRJdGVtKG1hc3NDbG9uZUl0ZW0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLmdldChtYXNzQ2xvbmVJdGVtSWQpLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5nZXQobWFzc0Nsb25lSXRlbUlkKS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAodGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJyAmJlxuICAgICAgICAgICAgIXRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5tYXJrZXRpbmdQcm9ncmFtSWQgJiZcbiAgICAgICAgICAgIGN1cnJFeHBOb2RlICYmXG4gICAgICAgICAgICBjdXJyRXhwTm9kZS5pc0V4cGFuZGFibGUoKSkgfHxcbiAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBQcm9ncmFtJyB8fFxuICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJyB8fFxuICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEV2ZW50JyB8fFxuICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnRW1haWwgQmF0Y2ggUHJvZ3JhbScgfHxcbiAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ0luLUFwcCBQcm9ncmFtJ1xuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLmFkZEl0ZW0obWFzc0Nsb25lSXRlbSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dC5tZW51Lk1lbnUucHJvdG90eXBlLnNob3dBdCcpKSB7XG4gICAgICBjb25zb2xlLmxvZygnPiBFeGVjdXRpbmc6IEFwcGx5aW5nIE1hc3MgQ2xvbmUgTWVudSBJdGVtJylcbiAgICAgIGlmICghb3JpZ01lbnVTaG93QXRGdW5jKSB7XG4gICAgICAgIG9yaWdNZW51U2hvd0F0RnVuYyA9IEV4dC5tZW51Lk1lbnUucHJvdG90eXBlLnNob3dBdFxuICAgICAgfVxuXG4gICAgICBFeHQubWVudS5NZW51LnByb3RvdHlwZS5zaG93QXQgPSBmdW5jdGlvbiAoeHksIHBhcmVudE1lbnUpIHtcbiAgICAgICAgbWFzc0Nsb25lLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgLy9UT0RPIGNoYW5nZXMgaGVyZSBIdW50ZXJcbiAgICAgICAgb3JpZ01lbnVTaG93QXRGdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJz4gU2tpcHBpbmc6IEFwcGx5aW5nIE1hc3MgQ2xvbmUgTWVudSBJdGVtJylcbiAgICB9XG4gIH0sXG5cbiAgLypcbiAgKiAgVGhpcyBmdW5jdGlvbiBhZGRzIGEgcmlnaHQtY2xpY2sgbWVudSBpdGVtIHRoYXQgcGVyZm9ybXMgYSBtYXNzIGNsb25lIG9mIGFsbFxuICAqICBQcm9ncmFtcyBmcm9tIHRoZSBzZWxlY3RlZCByb290IGZvbGRlciB0aGF0IGhhdmUgYSBmb2xkZXIgZGVwdGggbGV2ZWwgMSBvciBsZXNzOlxuICAqICAgIENsb25lcyB0aGUgZm9sZGVyIHN0cnVjdHVyZVxuICAqICAgIENsb25lcyBhbGwgUHJvZ3JhbXNcbiAgKiAgICBTZXRzIFBlcmlvZCBDb3N0cyBmb3IgdGhlIG5leHQgMjQgbW9udGhzIHVzaW5nIHRoZSBzb3VyY2UgUHJvZ3JhbSdzIGZpcnN0IENvc3RcbiAgKiAgICBTZXRzIHRoZSBWZXJ0aWNhbCBUYWcgdXNpbmcgdGhlIG5hbWUgb2YgdGhlIGRlc3RpbmF0aW9uIGZvbGRlclxuICAqICAgIENsb25lcyB0aGUgU3RyZWFtIENhZGVuY2VzIHVzaW5nIHRoZSBzb3VyY2UgTnVydHVyZSBQcm9ncmFtXG4gICogICAgQ2xvbmVzIHRoZSBhY3RpdmF0aW9uIHN0YXRlIG9mIHRyaWdnZXIgU21hcnQgQ2FtcGFpZ25zXG4gICogICAgQ2xvbmVzIHRoZSByZWN1cnJpbmcgc2NoZWR1bGUgb2YgYmF0Y2ggU21hcnQgQ2FtcGFpZ25zXG4gICogICAgU2V0cyB0aGUgYXNzZXQgZmlsdGVyIGZvciBjbG9uZWQgcmVwb3J0cyB0byB0aGUgZGVzdGluYXRpb24gZm9sZGVyXG4gICovXG4gIGNsb25lRm9sZGVyOiBmdW5jdGlvbiAob3JpZ0ZvbGRlck5hbWUsIGNsb25lVG9TdWZmaXgsIGNsb25lVG9Gb2xkZXJJZCkge1xuICAgIGxldCBuZXdGb2xkZXJOYW1lLCByZXN1bHRcblxuICAgIGlmIChvcmlnRm9sZGVyTmFtZS5zZWFyY2goL1xcKFteKV0qXFwpJC8pICE9IC0xKSB7XG4gICAgICBuZXdGb2xkZXJOYW1lID0gb3JpZ0ZvbGRlck5hbWUucmVwbGFjZSgvXFwoW14pXSpcXCkkLywgJygnICsgY2xvbmVUb1N1ZmZpeCArICcpJylcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3Rm9sZGVyTmFtZSA9IG9yaWdGb2xkZXJOYW1lLnRleHQgKyAnICgnICsgY2xvbmVUb1N1ZmZpeCArICcpJ1xuICAgIH1cblxuICAgIHJlc3VsdCA9IExJQi53ZWJSZXF1ZXN0KFxuICAgICAgJy9leHBsb3Jlci9jcmVhdGVQcm9ncmFtRm9sZGVyJyxcbiAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICcmdGV4dD0nICtcbiAgICAgIG5ld0ZvbGRlck5hbWUgK1xuICAgICAgJyZwYXJlbnRJZD0nICtcbiAgICAgIGNsb25lVG9Gb2xkZXJJZCArXG4gICAgICAnJnRlbXBOb2RlSWQ9ZXh0LScgK1xuICAgICAgY2xvbmVUb0ZvbGRlcklkICtcbiAgICAgICcmeHNyZklkPScgK1xuICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAnUE9TVCcsXG4gICAgICBmYWxzZSxcbiAgICAgICcnLFxuICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UpXG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHJlc3BvbnNlICYmXG4gICAgICAgICAgcmVzcG9uc2UuSlNPTlJlc3VsdHMgJiZcbiAgICAgICAgICByZXNwb25zZS5KU09OUmVzdWx0cy5hcHB2YXJzICYmXG4gICAgICAgICAgcmVzcG9uc2UuSlNPTlJlc3VsdHMuYXBwdmFycy5jcmVhdGVQcm9ncmFtRm9sZGVyUmVzdWx0ID09ICdzdWNjZXNzJ1xuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcblxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICBjbG9uZU51cnR1cmVDYWRlbmNlOiBmdW5jdGlvbiAob3JpZ1Byb2dyYW1Db21wSWQsIG5ld1Byb2dyYW1Db21wSWQpIHtcbiAgICBsZXQgZ2V0TnVydHVyZUNhZGVuY2UsIGdldE9yaWdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlLCBnZXROZXdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlXG5cbiAgICBnZXROdXJ0dXJlQ2FkZW5jZSA9IGZ1bmN0aW9uIChwcm9ncmFtQ29tcElkKSB7XG4gICAgICBsZXQgcHJvZ3JhbUZpbHRlciA9IGVuY29kZVVSSUNvbXBvbmVudCgnW3tcInByb3BlcnR5XCI6XCJpZFwiLFwidmFsdWVcIjonICsgcHJvZ3JhbUNvbXBJZCArICd9XScpLFxuICAgICAgICBmaWVsZHMgPSBlbmNvZGVVUklDb21wb25lbnQoJ1tcIit0cmFja3NcIl0nKSxcbiAgICAgICAgcmVzdWx0XG5cbiAgICAgIHJlc3VsdCA9IExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAnL2RhdGEvbnVydHVyZS9yZXRyaWV2ZScsXG4gICAgICAgICdmaWx0ZXI9JyArIHByb2dyYW1GaWx0ZXIgKyAnJmZpZWxkcz0nICsgZmllbGRzICsgJyZ4c3JmSWQ9JyArIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAnUE9TVCcsXG4gICAgICAgIGZhbHNlLFxuICAgICAgICAnJyxcbiAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuXG4gICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIClcblxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cblxuICAgIGdldE9yaWdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlID0gZ2V0TnVydHVyZUNhZGVuY2Uob3JpZ1Byb2dyYW1Db21wSWQpXG4gICAgZ2V0TmV3TnVydHVyZUNhZGVuY2VSZXNwb25zZSA9IGdldE51cnR1cmVDYWRlbmNlKG5ld1Byb2dyYW1Db21wSWQpXG5cbiAgICBpZiAoXG4gICAgICBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZSAmJlxuICAgICAgZ2V0TmV3TnVydHVyZUNhZGVuY2VSZXNwb25zZSAmJlxuICAgICAgZ2V0T3JpZ051cnR1cmVDYWRlbmNlUmVzcG9uc2UuZGF0YVswXS50cmFja3MubGVuZ3RoID09IGdldE5ld051cnR1cmVDYWRlbmNlUmVzcG9uc2UuZGF0YVswXS50cmFja3MubGVuZ3RoXG4gICAgKSB7XG4gICAgICBsZXQgY3Vyck9yaWdTdHJlYW0sXG4gICAgICAgIGN1cnJOZXdTdHJlYW0sXG4gICAgICAgIHN0cmVhbUNhZGVuY2VzID0gJ1snXG5cbiAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZS5kYXRhWzBdLnRyYWNrcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgY3Vyck9yaWdTdHJlYW0gPSBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZS5kYXRhWzBdLnRyYWNrc1tpaV1cbiAgICAgICAgY3Vyck5ld1N0cmVhbSA9IGdldE5ld051cnR1cmVDYWRlbmNlUmVzcG9uc2UuZGF0YVswXS50cmFja3NbaWldXG5cbiAgICAgICAgaWYgKGlpICE9IDApIHtcbiAgICAgICAgICBzdHJlYW1DYWRlbmNlcyArPSAnLCdcbiAgICAgICAgfVxuICAgICAgICBzdHJlYW1DYWRlbmNlcyArPVxuICAgICAgICAgICd7XCJpZFwiOicgK1xuICAgICAgICAgIGN1cnJOZXdTdHJlYW0uaWQgK1xuICAgICAgICAgICcsXCJyZWN1cnJlbmNlVHlwZVwiOlwiJyArXG4gICAgICAgICAgY3Vyck9yaWdTdHJlYW0ucmVjdXJyZW5jZVR5cGUgK1xuICAgICAgICAgICdcIixcImV2ZXJ5TlVuaXRcIjonICtcbiAgICAgICAgICBjdXJyT3JpZ1N0cmVhbS5ldmVyeU5Vbml0ICtcbiAgICAgICAgICAnLFwid2Vla01hc2tcIjpcIicgK1xuICAgICAgICAgIGN1cnJPcmlnU3RyZWFtLndlZWtNYXNrICtcbiAgICAgICAgICAnXCIsXCJzdGFydERhdGVcIjpcIicgK1xuICAgICAgICAgIGN1cnJPcmlnU3RyZWFtLnN0YXJ0RGF0ZSArXG4gICAgICAgICAgJ1wifSdcbiAgICAgIH1cbiAgICAgIHN0cmVhbUNhZGVuY2VzICs9ICddJ1xuICAgICAgc3RyZWFtQ2FkZW5jZXMgPSBzdHJlYW1DYWRlbmNlcy5yZXBsYWNlKC9cIm51bGxcIi9nLCAnbnVsbCcpXG5cbiAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAnL2RhdGEvbnVydHVyZVRyYWNrL3VwZGF0ZScsXG4gICAgICAgICdkYXRhPScgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyZWFtQ2FkZW5jZXMpICsgJyZ4c3JmSWQ9JyArIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAnUE9TVCcsXG4gICAgICAgIGZhbHNlLFxuICAgICAgICAnJyxcbiAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIH1cbiAgICAgIClcbiAgICB9XG4gIH0sXG5cbiAgY2xvbmVQZXJpb2RDb3N0OiBmdW5jdGlvbiAob3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEsIG5ld1Byb2dyYW1Db21wSWQsIG51bU9mTW9udGhzLCBvZmZzZXQsIGluaGVyaXQpIHtcbiAgICBsZXQgY3VyclllYXIgPSBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCksXG4gICAgICBjdXJyTW9udGggPSBuZXcgRGF0ZSgpLmdldE1vbnRoKCkgKyAxLFxuICAgICAgc2V0UGVyaW9kQ29zdFxuXG4gICAgc2V0UGVyaW9kQ29zdCA9IGZ1bmN0aW9uIChuZXdQcm9ncmFtQ29tcElkLCBjb3N0RGF0ZSwgY29zdEFtb3VudCkge1xuICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICcvbWFya2V0aW5nRXZlbnQvc2V0Q29zdFN1Ym1pdCcsXG4gICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICcmY29tcElkPScgK1xuICAgICAgICBuZXdQcm9ncmFtQ29tcElkICtcbiAgICAgICAgJyZjb3N0SWQ9JyArXG4gICAgICAgICcmdHlwZT1wZXJpb2QnICtcbiAgICAgICAgJyZzdGFydERhdGU9JyArXG4gICAgICAgIGNvc3REYXRlICtcbiAgICAgICAgJyZhbW91bnQ9JyArXG4gICAgICAgIGNvc3RBbW91bnQudG9TdHJpbmcoKSArXG4gICAgICAgICcmZGVzY3JpcHRpb249JyArXG4gICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgJ1BPU1QnLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJycsXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICB9XG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKGluaGVyaXQgJiYgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEpIHtcbiAgICAgIGxldCBjdXJyUGVyaW9kQ29zdFxuXG4gICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIGN1cnJQZXJpb2RDb3N0ID0gb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGFbaWldXG5cbiAgICAgICAgaWYgKGN1cnJQZXJpb2RDb3N0Lml0ZW1UeXBlID09ICdwZXJpb2QnICYmIGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLmFtb3VudCAmJiBjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5zdGFydERhdGUpIHtcbiAgICAgICAgICB2YXIgY3VyckNvc3RNb250aCA9IGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLnN0YXJ0RGF0ZS5yZXBsYWNlKC9eWzAtOV1bMC05XVswLTldWzAtOV0tLywgJycpLFxuICAgICAgICAgICAgY3VyckNvc3RBbW91bnQgPSBjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5hbW91bnQsXG4gICAgICAgICAgICBjdXJyQ29zdFllYXIsXG4gICAgICAgICAgICBjdXJyQ29zdERhdGVcblxuICAgICAgICAgIGlmIChjdXJyWWVhciA+IHBhcnNlSW50KGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLnN0YXJ0RGF0ZS5tYXRjaCgvXlswLTldWzAtOV1bMC05XVswLTldLykpKSB7XG4gICAgICAgICAgICBjdXJyQ29zdFllYXIgPSBjdXJyWWVhciArIChjdXJyWWVhciAtIHBhcnNlSW50KGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLnN0YXJ0RGF0ZS5tYXRjaCgvXlswLTldWzAtOV1bMC05XVswLTldLykpKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyQ29zdFllYXIgPSBwYXJzZUludChjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5zdGFydERhdGUubWF0Y2goL15bMC05XVswLTldWzAtOV1bMC05XS8pKVxuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJyQ29zdERhdGUgPSBjdXJyQ29zdFllYXIudG9TdHJpbmcoKSArICctJyArIGN1cnJDb3N0TW9udGgudG9TdHJpbmcoKVxuICAgICAgICAgIHNldFBlcmlvZENvc3QobmV3UHJvZ3JhbUNvbXBJZCwgY3VyckNvc3REYXRlLCBjdXJyQ29zdEFtb3VudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YSAmJlxuICAgICAgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGFbMF0gJiZcbiAgICAgIG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhWzBdLnN1bW1hcnlEYXRhICYmXG4gICAgICBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YVswXS5zdW1tYXJ5RGF0YS5hbW91bnRcbiAgICApIHtcbiAgICAgIGlmICghbnVtT2ZNb250aHMpIHtcbiAgICAgICAgbnVtT2ZNb250aHMgPSAyNFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbnVtT2ZNb250aHM7IGlpKyspIHtcbiAgICAgICAgdmFyIGN1cnJDb3N0RGF0ZSwgY3VyckNvc3RBbW91bnRcblxuICAgICAgICBpZiAoY3Vyck1vbnRoID4gMTIpIHtcbiAgICAgICAgICBjdXJyTW9udGggPSAxXG4gICAgICAgICAgY3VyclllYXIrK1xuICAgICAgICB9XG4gICAgICAgIGN1cnJDb3N0RGF0ZSA9IGN1cnJZZWFyLnRvU3RyaW5nKCkgKyAnLScgKyBjdXJyTW9udGgudG9TdHJpbmcoKVxuICAgICAgICBjdXJyTW9udGgrK1xuICAgICAgICBjdXJyQ29zdEFtb3VudCA9IHBhcnNlSW50KG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhWzBdLnN1bW1hcnlEYXRhLmFtb3VudClcblxuICAgICAgICBpZiAob2Zmc2V0KSB7XG4gICAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPD0gMC41KSB7XG4gICAgICAgICAgICBjdXJyQ29zdEFtb3VudCArPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIG9mZnNldClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VyckNvc3RBbW91bnQgLT0gTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiBvZmZzZXQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2V0UGVyaW9kQ29zdChuZXdQcm9ncmFtQ29tcElkLCBjdXJyQ29zdERhdGUsIGN1cnJDb3N0QW1vdW50KVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBjbG9uZVByb2dyYW06IGZ1bmN0aW9uIChjbG9uZVRvU3VmZml4LCBjbG9uZVRvRm9sZGVySWQsIG9yaWdQcm9ncmFtVHJlZU5vZGUpIHtcbiAgICBsZXQgbmV3UHJvZ3JhbU5hbWUsIG5ld1Byb2dyYW1UeXBlLCByZXN1bHRcblxuICAgIGlmIChvcmlnUHJvZ3JhbVRyZWVOb2RlLnRleHQuc2VhcmNoKC9cXChbXildKlxcKSQvKSAhPSAtMSkge1xuICAgICAgbmV3UHJvZ3JhbU5hbWUgPSBvcmlnUHJvZ3JhbVRyZWVOb2RlLnRleHQucmVwbGFjZSgvXFwoW14pXSpcXCkkLywgJygnICsgY2xvbmVUb1N1ZmZpeCArICcpJylcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3UHJvZ3JhbU5hbWUgPSBvcmlnUHJvZ3JhbVRyZWVOb2RlLnRleHQgKyAnICgnICsgY2xvbmVUb1N1ZmZpeCArICcpJ1xuICAgIH1cblxuICAgIHN3aXRjaCAob3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wVHlwZSkge1xuICAgICAgY2FzZSAnTWFya2V0aW5nIFByb2dyYW0nOlxuICAgICAgICBuZXdQcm9ncmFtVHlwZSA9ICdwcm9ncmFtJ1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnTnVydHVyZSBQcm9ncmFtJzpcbiAgICAgICAgbmV3UHJvZ3JhbVR5cGUgPSAnbnVydHVyZSdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ01hcmtldGluZyBFdmVudCc6XG4gICAgICAgIG5ld1Byb2dyYW1UeXBlID0gJ2V2ZW50J1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnRW1haWwgQmF0Y2ggUHJvZ3JhbSc6XG4gICAgICAgIG5ld1Byb2dyYW1UeXBlID0gJ2VtYWlsQmF0Y2hQcm9ncmFtJ1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnSW4tQXBwIFByb2dyYW0nOlxuICAgICAgICBuZXdQcm9ncmFtVHlwZSA9ICdpbkFwcFByb2dyYW0nXG4gICAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgaWYgKG5ld1Byb2dyYW1UeXBlKSB7XG4gICAgICByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgJy9tYXJrZXRpbmdFdmVudC9jcmVhdGVNYXJrZXRpbmdQcm9ncmFtU3VibWl0JyxcbiAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgJyZuYW1lPScgK1xuICAgICAgICBuZXdQcm9ncmFtTmFtZSArXG4gICAgICAgICcmZGVzY3JpcHRpb249JyArXG4gICAgICAgICcmcGFyZW50Rm9sZGVySWQ9JyArXG4gICAgICAgIGNsb25lVG9Gb2xkZXJJZCArXG4gICAgICAgICcmY2xvbmVGcm9tSWQ9JyArXG4gICAgICAgIG9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkICtcbiAgICAgICAgJyZ0eXBlPScgK1xuICAgICAgICBuZXdQcm9ncmFtVHlwZSArXG4gICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgJ1BPU1QnLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJycsXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcbiAgICAgICAgICAvL3Jlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZS5tYXRjaCgve1xcXCJKU09OUmVzdWx0c1xcXCI6Lip9LylbMF0pO1xuXG4gICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLkpTT05SZXN1bHRzICYmIHJlc3BvbnNlLkpTT05SZXN1bHRzLmFwcHZhcnMgJiYgcmVzcG9uc2UuSlNPTlJlc3VsdHMuYXBwdmFycy5yZXN1bHQgPT0gJ1N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApXG5cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9LFxuXG4gIGNsb25lU21hcnRDYW1wYWlnblN0YXRlOiBmdW5jdGlvbiAob3JpZ1Byb2dyYW1Db21wSWQsIG5ld1Byb2dyYW1Db21wSWQsIGZvcmNlQWN0aXZhdGUpIHtcbiAgICBsZXQgZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlXG5cbiAgICBnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1Bc3NldERldGFpbHMob3JpZ1Byb2dyYW1Db21wSWQpXG4gICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1Bc3NldERldGFpbHMobmV3UHJvZ3JhbUNvbXBJZClcblxuICAgIGlmIChnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlICYmIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSkge1xuICAgICAgbGV0IHNldFNtYXJ0Q2FtcGFpZ25TdGF0ZVxuXG4gICAgICBzZXRTbWFydENhbXBhaWduU3RhdGUgPSBmdW5jdGlvbiAoZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlKSB7XG4gICAgICAgIGxldCBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLCBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24sIGdldFNjaGVkdWxlUmVzcG9uc2VcblxuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5zbWFydENhbXBhaWducy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduID0gZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5zbWFydENhbXBhaWduc1tpaV1cbiAgICAgICAgICBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24gPSBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2Uuc21hcnRDYW1wYWlnbnNbaWldXG5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLmNvbXBUeXBlID09IGN1cnJOZXdQcm9ncmFtU21hcnRDYW1wYWlnbi5jb21wVHlwZSAmJlxuICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5jb21wVHlwZSA9PSAnU21hcnQgQ2FtcGFpZ24nICYmXG4gICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLm5hbWUgPT0gY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduLm5hbWVcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLnN0YXR1cyA9PSA3IHx8IChjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLnN0YXR1cyA9PSA2ICYmIGZvcmNlQWN0aXZhdGUpKSB7XG4gICAgICAgICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICAgICAgICcvc21hcnRjYW1wYWlnbnMvdG9nZ2xlQWN0aXZlU3RhdHVzJyxcbiAgICAgICAgICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgICAgICAgICAnJnNtYXJ0Q2FtcGFpZ25JZD0nICtcbiAgICAgICAgICAgICAgICBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcElkICtcbiAgICAgICAgICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgICAgICAgICAnUE9TVCcsXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgJycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uc3RhdHVzID09IDMgfHwgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5zdGF0dXMgPT0gNSkge1xuICAgICAgICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAgICAgICAnL3NtYXJ0Y2FtcGFpZ25zL2VkaXRTY2hlZHVsZVJTJyxcbiAgICAgICAgICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgICAgICAgICAnJmlzUmVxdWVzdD0xJyArXG4gICAgICAgICAgICAgICAgJyZzbWFydENhbXBhaWduSWQ9JyArXG4gICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5jb21wSWQgK1xuICAgICAgICAgICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm1hdGNoKC9Na3RQYWdlXFwuYXBwVmFyc1xcLnNjaGVkdWxlRGF0YSA9IHsoW149XXxcXG58XFxcXG4pKn0vKVswXSkge1xuICAgICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlID0gSlNPTi5wYXJzZShcbiAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hdGNoKC9Na3RQYWdlXFwuYXBwVmFyc1xcLnNjaGVkdWxlRGF0YSA9IHsoW149XXxcXG58XFxcXG4pKn0vKVswXVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL01rdFBhZ2VcXC5hcHBWYXJzXFwuc2NoZWR1bGVEYXRhID0gey8sICd7JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csICdcIicpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXG4gKi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLzogKy9nLCAnXCI6ICcpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCJcXC9cXC9bXlwiXStcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wifSQvLCAnfScpXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICBpZiAoZ2V0U2NoZWR1bGVSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGxldCBzdGFydEF0RGF0ZSA9IG5ldyBEYXRlKERhdGUucGFyc2UoZ2V0U2NoZWR1bGVSZXNwb25zZS5zdGFydF9hdCkpLFxuICAgICAgICAgICAgICAgICAgc3RhcnRBdCA9XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0QXREYXRlLmdldEZ1bGxZZWFyKCkgK1xuICAgICAgICAgICAgICAgICAgICAnLScgK1xuICAgICAgICAgICAgICAgICAgICBwYXJzZUludChzdGFydEF0RGF0ZS5nZXRNb250aCgpICsgMSkgK1xuICAgICAgICAgICAgICAgICAgICAnLScgK1xuICAgICAgICAgICAgICAgICAgICBzdGFydEF0RGF0ZS5nZXREYXRlKCkgK1xuICAgICAgICAgICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgICAgICAgICBzdGFydEF0RGF0ZS5nZXRIb3VycygpICtcbiAgICAgICAgICAgICAgICAgICAgJzonICtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRBdERhdGUuZ2V0TWludXRlcygpICtcbiAgICAgICAgICAgICAgICAgICAgJzonICtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRBdERhdGUuZ2V0U2Vjb25kcygpXG5cbiAgICAgICAgICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAgICAgICAgICcvc21hcnRjYW1wYWlnbnMvcmVjdXJDYW1wU2NoZWR1bGUnLFxuICAgICAgICAgICAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICAgICAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAgICAgICAgICAgJyZzbWFydENhbXBhaWduSWQ9JyArXG4gICAgICAgICAgICAgICAgICBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcElkICtcbiAgICAgICAgICAgICAgICAgICcmcmVjdXJyZW5jZV90eXBlPScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS5yZWN1cnJlbmNlX3R5cGUgK1xuICAgICAgICAgICAgICAgICAgJyZldmVyeV9uX3VuaXQ9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLmV2ZXJ5X25fdW5pdCArXG4gICAgICAgICAgICAgICAgICAnJnN0YXJ0X2F0PScgK1xuICAgICAgICAgICAgICAgICAgc3RhcnRBdCArXG4gICAgICAgICAgICAgICAgICAnJmVuZF9hdD0nICtcbiAgICAgICAgICAgICAgICAgICcmZXZlcnlfd2Vla2RheT0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UuZXZlcnlfd2Vla2RheSArXG4gICAgICAgICAgICAgICAgICAnJndlZWtfbWFzaz0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2Uud2Vla19tYXNrICtcbiAgICAgICAgICAgICAgICAgICcmcmVjdXJEYXlfb2ZfbW9udGg9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLnJlY3VyRGF5X29mX21vbnRoICtcbiAgICAgICAgICAgICAgICAgICcmcmVjdXJNb250aF9kYXlfdHlwZT0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UucmVjdXJNb250aF9kYXlfdHlwZSArXG4gICAgICAgICAgICAgICAgICAnJnJlY3VyTW9udGhfd2Vla190eXBlPScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS5yZWN1ck1vbnRoX3dlZWtfdHlwZSArXG4gICAgICAgICAgICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAgICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5zbWFydENhbXBhaWducy5sZW5ndGggPT0gZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLnNtYXJ0Q2FtcGFpZ25zLmxlbmd0aCkge1xuICAgICAgICBzZXRTbWFydENhbXBhaWduU3RhdGUoZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlKVxuICAgICAgfVxuXG4gICAgICBpZiAoZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZS5sZW5ndGggPT0gZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlLmxlbmd0aCkge1xuICAgICAgICBsZXQgY3Vyck9yaWdQcm9ncmFtQXNzZXQsIGN1cnJOZXdQcm9ncmFtQXNzZXRcblxuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZS5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1Bc3NldCA9IGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWVbaWldXG4gICAgICAgICAgY3Vyck5ld1Byb2dyYW1Bc3NldCA9IGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZVtpaV1cblxuICAgICAgICAgIGlmIChjdXJyT3JpZ1Byb2dyYW1Bc3NldC5uYXZUeXBlID09ICdNQScgJiYgY3Vyck5ld1Byb2dyYW1Bc3NldC5uYXZUeXBlID09ICdNQScpIHtcbiAgICAgICAgICAgIHNldFNtYXJ0Q2FtcGFpZ25TdGF0ZShcbiAgICAgICAgICAgICAgTElCLmdldFByb2dyYW1Bc3NldERldGFpbHMoY3Vyck9yaWdQcm9ncmFtQXNzZXQuY29tcElkKSxcbiAgICAgICAgICAgICAgTElCLmdldFByb2dyYW1Bc3NldERldGFpbHMoY3Vyck5ld1Byb2dyYW1Bc3NldC5jb21wSWQpXG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZVxuICB9LFxuXG4gIGdldEh1bWFuRGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIERlbW8gQXBwID4gR2V0dGluZzogRGF0ZSA0IFdlZWtzIEZyb20gTm93JylcbiAgICBsZXQgZGF5TmFtZXMgPSBbJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCddLFxuICAgICAgbW9udGhOYW1lcyA9IFsnSkFOJywgJ0ZFQicsICdNQVInLCAnQVBSJywgJ01BWScsICdKVU5FJywgJ0pVTFknLCAnQVVHJywgJ1NFUFQnLCAnT0NUJywgJ05PVicsICdERUMnXSxcbiAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpLFxuICAgICAgZGF5T2ZXZWVrLFxuICAgICAgbW9udGgsXG4gICAgICBkYXlPZk1vbnRoLFxuICAgICAgeWVhclxuXG4gICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgMjgpXG4gICAgZGF5T2ZXZWVrID0gZGF5TmFtZXNbZGF0ZS5nZXREYXkoKV1cbiAgICBtb250aCA9IG1vbnRoTmFtZXNbZGF0ZS5nZXRNb250aCgpXVxuICAgIHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKClcblxuICAgIHN3aXRjaCAoZGF0ZS5nZXREYXRlKCkpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgZGF5T2ZNb250aCA9ICcxc3QnXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDI6XG4gICAgICAgIGRheU9mTW9udGggPSAnMm5kJ1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAzOlxuICAgICAgICBkYXlPZk1vbnRoID0gJzNyZCdcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGRheU9mTW9udGggPSBkYXRlLmdldERhdGUoKSArICd0aCdcbiAgICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF5T2ZXZWVrICsgJywgJyArIG1vbnRoICsgJyB0aGUgJyArIGRheU9mTW9udGggKyAnICcgKyB5ZWFyXG4gIH0sXG5cbiAgLy8gcmVsb2FkcyB0aGUgTWFya2V0aW5nIEFjdGl2aXRlcyBUcmVlXG4gIHJlbG9hZE1hcmtldGluZ0FjdGl2aXRlczogZnVuY3Rpb24gKCkge1xuICAgIGxldCBjb250ZXh0ID0ge1xuICAgICAgY29tcFN1YnR5cGU6IG51bGwsXG4gICAgICBjdXN0b21Ub2tlbjogJycsXG4gICAgICBkbENvbXBDb2RlOiAnTUEnLFxuICAgICAgdHlwZTogJ01BJ1xuICAgIH1cbiAgICAgIDsgKGN1c3RvbVRva2VuID0gTWt0My5EbE1hbmFnZXIuZ2V0Q3VzdG9tVG9rZW4oKSksIChwYXJhbXMgPSBFeHQudXJsRGVjb2RlKGN1c3RvbVRva2VuKSlcblxuICAgIGlmIChcbiAgICAgIGNvbnRleHQgJiZcbiAgICAgIChjb250ZXh0LmNvbXBUeXBlID09PSAnTWFya2V0aW5nIEV2ZW50JyB8fFxuICAgICAgICBjb250ZXh0LmNvbXBUeXBlID09PSAnTWFya2V0aW5nIFByb2dyYW0nIHx8XG4gICAgICAgIGNvbnRleHQuY29tcFN1YnR5cGUgPT09ICdtYXJrZXRpbmdwcm9ncmFtJyB8fFxuICAgICAgICBjb250ZXh0LmNvbXBTdWJ0eXBlID09PSAnbWFya2V0aW5nZXZlbnQnKVxuICAgICkge1xuICAgICAgTWt0My5NS05vZGVDb250ZXh0LnRpbWluZ1JlcG9ydCA9IHtcbiAgICAgICAgbmF2TG9hZENhbDogRXh0NC5EYXRlLm5vdygpLFxuICAgICAgICBjYWxlbmRhck1vZGU6ICdQcm9ncmFtJ1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBhbHJlYWR5SW5NQSA9IE1rdE1haW5OYXYuYWN0aXZlTmF2ID09ICd0bk1BJyxcbiAgICAgIGFqb3B0cyA9IE1rdE1haW5OYXYuY29tbW9uUHJlTG9hZCgndG5NQScsIGNvbnRleHQpXG4gICAgaWYgKE1rdFBhZ2UuaW5pdE5hdiA9PSAneWVzJykge1xuICAgICAgTWt0RXhwbG9yZXIuY2xlYXIoKVxuICAgICAgTWt0RXhwbG9yZXIubWFzaygpXG4gICAgICBsZXQgcGFybXMgPSBjb250ZXh0XG4gICAgICBpZiAoIU1rdFBhZ2Uuc2F0ZWxsaXRlKSB7XG4gICAgICAgIE1rdFZpZXdwb3J0LnNldEV4cGxvcmVyVmlzaWJsZSh0cnVlKVxuXG4gICAgICAgIE1rdEV4cGxvcmVyLmxvYWRUcmVlKCdleHBsb3Jlci9nZW5lcmF0ZUZ1bGxNYUV4cGxvcmVyJywge1xuICAgICAgICAgIHNlcmlhbGl6ZVBhcm1zOiBwYXJtcyxcbiAgICAgICAgICBvbk15RmFpbHVyZTogTWt0TWFpbk5hdi5leHBGYWlsdXJlUmVzcG9uc2UuY3JlYXRlRGVsZWdhdGUodGhpcylcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgcGFybXMgPSB7fVxuICAgICAgYWpvcHRzLnNlcmlhbGl6ZVBhcm1zID0gcGFybXNcbiAgICAgIGlmIChpc0RlZmluZWQoY29udGV4dC5wYW5lbEluZGV4KSkge1xuICAgICAgICBwYXJtcy5wYW5lbEluZGV4ID0gY29udGV4dC5wYW5lbEluZGV4XG4gICAgICB9XG5cbiAgICAgIGlmIChjb250ZXh0LmlzUHJvZ3JhbUltcG9ydCkge1xuICAgICAgICBwYXJhbXMuaWQgPSBjb250ZXh0LmNvbXBJZFxuXG4gICAgICAgIGlmIChNa3RQYWdlLmhhc1dvcmtzcGFjZXMoKSkge1xuICAgICAgICAgIC8vIHdlIGFyZSBmb3JjZWQgdG8gbG9hZCBkZWZhdWx0IE1BLCBvdGhlcndpc2UgdGhlIG1vZGFsIGZvcm0gaXMgbm90IGFsaWduZWQgcHJvcGVybHlcbiAgICAgICAgICBNa3RDYW52YXMuY2FudmFzQWpheFJlcXVlc3QoJ2V4cGxvcmVyL3Byb2dyYW1DYW52YXMnLCB7XG4gICAgICAgICAgICBvbk15U3VjY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBFeHQ0LndpZGdldCgncHJvZ3JhbU9uZUNsaWNrSW1wb3J0Rm9ybScsIHtmb3JtRGF0YTogcGFyYW1zfSlcblxuICAgICAgICAgICAgICBNa3RWaWV3cG9ydC5zZXRBcHBNYXNrKGZhbHNlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgTWt0U2Vzc2lvbi5hamF4UmVxdWVzdCgnL2ltcEV4cC9kb3dubG9hZFRlbXBsYXRlJywge1xuICAgICAgICAgIHNlcmlhbGl6ZVBhcm1zOiBwYXJhbXMsXG4gICAgICAgICAgb25NeVN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSwgcmVxdWVzdCkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkpTT05SZXN1bHRzKSB7XG4gICAgICAgICAgICAgIGlmIChyZXNwb25zZS5KU09OUmVzdWx0cy5zaG93SW1wb3J0U3RhdHVzID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgTWt0Q2FudmFzLmNhbnZhc0FqYXhSZXF1ZXN0KCdleHBsb3Jlci9wcm9ncmFtQ2FudmFzJywge1xuICAgICAgICAgICAgICAgICAgb25NeVN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgTWt0LmFwcHMuaW1wRXhwLmltcG9ydFByb2dyYW1TdGF0dXMoKVxuICAgICAgICAgICAgICAgICAgICBNa3RWaWV3cG9ydC5zZXRBcHBNYXNrKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UuSlNPTlJlc3VsdHMuZXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgLy8ganVzdCBsb2FkIE1BXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnI01BJ1xuICAgICAgICAgICAgICAgIE1rdFBhZ2Uuc2hvd0FsZXJ0TWVzc2FnZShcbiAgICAgICAgICAgICAgICAgIE1rdExhbmcuZ2V0U3RyKCdwYWdlLkltcG9ydF9XYXJuaW5nJyksXG4gICAgICAgICAgICAgICAgICBNa3RMYW5nLmdldFN0cigncGFnZS5JbXBvcnRfRmFpbGVkJykgKyByZXNwb25zZS5KU09OUmVzdWx0cy5lcnJvck1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAnL2ltYWdlcy9pY29uczMyL2Vycm9yLnBuZydcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuY29tcFN1YnR5cGUgPT0gJ21hcmtldGluZ2ZvbGRlcicgfHwgY29udGV4dC5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgfHwgY29udGV4dC5zdWJUeXBlID09ICdtYXJrZXRpbmdmb2xkZXInKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZFBFKGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuY29tcFN1YnR5cGUgPT0gJ3NtYXJ0Y2FtcGFpZ24nIHx8IGNvbnRleHQuc3ViVHlwZSA9PSAnc21hcnRjYW1wYWlnbicgfHwgY29udGV4dC5jb21wVHlwZSA9PSAnU21hcnQgQ2FtcGFpZ24nKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZFNtYXJ0Q2FtcGFpZ24oY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5jb21wU3VidHlwZSA9PSAnbWFya2V0aW5nZXZlbnQnIHx8IGNvbnRleHQuc3ViVHlwZSA9PSAnbWFya2V0aW5nZXZlbnQnIHx8IGNvbnRleHQuY29tcFR5cGUgPT0gJ01hcmtldGluZyBFdmVudCcpIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkTWFya2V0aW5nRXZlbnQoY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGNvbnRleHQuY29tcFN1YnR5cGUgPT0gJ21hcmtldGluZ3Byb2dyYW0nIHx8XG4gICAgICAgIGNvbnRleHQuc3ViVHlwZSA9PSAnbWFya2V0aW5ncHJvZ3JhbScgfHxcbiAgICAgICAgY29udGV4dC5jb21wVHlwZSA9PSAnTWFya2V0aW5nIFByb2dyYW0nXG4gICAgICApIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkTWFya2V0aW5nUHJvZ3JhbShjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChjb250ZXh0LmNvbXBTdWJ0eXBlID09ICdudXJ0dXJlcHJvZ3JhbScgfHwgY29udGV4dC5zdWJUeXBlID09ICdudXJ0dXJlcHJvZ3JhbScgfHwgY29udGV4dC5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJykge1xuICAgICAgICBNa3RNYWluTmF2LmxvYWROdXJ0dXJlUHJvZ3JhbShjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgY29udGV4dC5jb21wU3VidHlwZSA9PT0gJ2VtYWlsYmF0Y2hwcm9ncmFtJyB8fFxuICAgICAgICBjb250ZXh0LnN1YlR5cGUgPT09ICdlbWFpbGJhdGNocHJvZ3JhbScgfHxcbiAgICAgICAgY29udGV4dC5jb21wVHlwZSA9PT0gJ0VtYWlsIEJhdGNoIFByb2dyYW0nXG4gICAgICApIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkRW1haWxCYXRjaFByb2dyYW0oY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5jb21wU3VidHlwZSA9PT0gJ2luQXBwJyB8fCBjb250ZXh0LnN1YlR5cGUgPT09ICdpbkFwcFByb2dyYW0nIHx8IGNvbnRleHQuY29tcFR5cGUgPT09ICdJbi1BcHAgUHJvZ3JhbScpIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkSW5BcHBQcm9ncmFtKGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQubm9kZVR5cGUgPT0gJ0Zsb3cnKSB7XG4gICAgICAgIC8vVGhpcyBpcyBqdXN0IHRlbXBvcmFyeSB0aWxsIENyYXNoIGdldCB0aGUgc3R1ZmYgZm9yIG15IHRyZWVcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkRmxvdygpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBham9wdHMuY2FjaGVSZXF1ZXN0ID0gdHJ1ZVxuICAgICAgICBham9wdHMub25NeVN1Y2Nlc3MgPSBNa3RNYWluTmF2LmNhbnZhc0FqYXhSZXF1ZXN0Q29tcGxldGUuY3JlYXRlRGVsZWdhdGUoTWt0TWFpbk5hdilcbiAgICAgICAgYWpvcHRzLm9uTXlGYWlsdXJlID0gTWt0TWFpbk5hdi5jYW52YXNBamF4UmVxdWVzdENvbXBsZXRlLmNyZWF0ZURlbGVnYXRlKE1rdE1haW5OYXYpXG4gICAgICAgIE1rdENhbnZhcy5jYW52YXNBamF4UmVxdWVzdCgnZXhwbG9yZXIvcHJvZ3JhbUNhbnZhcycsIGFqb3B0cylcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfSxcblxuICAvLyBlZGl0cyB0aGUgdmFyaWFibGVzIHdpdGhpbiB0aGUgRW1haWwgRWRpdG9yIGZvciBjdXN0b20gY29tcGFueVxuICBzYXZlRW1haWxFZGl0czogZnVuY3Rpb24gKG1vZGUsIGFzc2V0KSB7XG4gICAgbGV0IHNhdmVFZGl0c1RvZ2dsZSA9IExJQi5nZXRDb29raWUoJ3NhdmVFZGl0c1RvZ2dsZVN0YXRlJyksXG4gICAgICBsb2dvID0gTElCLmdldENvb2tpZSgnbG9nbycpLFxuICAgICAgaGVyb0JhY2tncm91bmQgPSBMSUIuZ2V0Q29va2llKCdoZXJvQmFja2dyb3VuZCcpLFxuICAgICAgY29sb3IgPSBMSUIuZ2V0Q29va2llKCdjb2xvcicpXG5cbiAgICBpZiAoc2F2ZUVkaXRzVG9nZ2xlID09ICd0cnVlJyAmJiAobG9nbyAhPSBudWxsIHx8IGhlcm9CYWNrZ3JvdW5kICE9IG51bGwgfHwgY29sb3IgIT0gbnVsbCkpIHtcbiAgICAgIGxldCBodHRwUmVnRXggPSBuZXcgUmVnRXhwKCdeaHR0cHxeJCcsICdpJyksXG4gICAgICAgIC8vdGV4dFJlZ2V4ID0gbmV3IFJlZ0V4cChcIl5bXiNdfF4kXCIsIFwiaVwiKSxcbiAgICAgICAgY29sb3JSZWdleCA9IG5ldyBSZWdFeHAoJ14jWzAtOWEtZl17Myw2fSR8XnJnYnxeJCcsICdpJyksXG4gICAgICAgIGxvZ29JZHMgPSBbJ2hlcm9Mb2dvJywgJ2Zvb3RlckxvZ28nLCAnaGVhZGVyTG9nbycsICdsb2dvRm9vdGVyJywgJ2xvZ28nXSxcbiAgICAgICAgaGVyb0JnUmVnZXggPSBuZXcgUmVnRXhwKCdoZXJvQmFja2dyb3VuZHxoZXJvLWJhY2tncm91bmR8aGVyb0JrZ3xoZXJvLWJrZ3xoZXJvQmd8aGVyby1iZycsICdpJyksXG4gICAgICAgIC8vdGl0bGVJZHMgPSBbXCJ0aXRsZVwiLCBcImhlcm9UaXRsZVwiLCBcIm1haW5UaXRsZVwiXSxcbiAgICAgICAgLy9zdWJ0aXRsZUlkcyA9IFtcInN1YnRpdGxlXCIsIFwiaGVyb3N1YlRpdGxlXCJdLFxuICAgICAgICBoZWFkZXJCZ0NvbG9yUmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICdeKGhlYWRlckJnQ29sb3J8aGVhZGVyLWJnLWNvbG9yfGhlYWRlckJhY2tncm91bmRDb2xvcnxoZWFkZXItYmFja2dyb3VuZC1jb2xvcnxoZWFkZXJCa2dDb2xvcnxoZWFkZXItYmtnLWNvbG9yfCkkJyxcbiAgICAgICAgICAnaSdcbiAgICAgICAgKSxcbiAgICAgICAgYnV0dG9uQmdDb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAnXihoZXJvQnV0dG9uQmdDb2xvcnxoZXJvLWJ1dHRvbi1iZy1jb2xvcnxoZXJvQnV0dG9uQmFja2dyb3VuZENvbG9yfGhlcm8tYnV0dG9uLWJhY2tncm91bmQtY29sb3J8aGVyb0JrZ0NvbG9yfGhlcm8tYmtnLWNvbG9yfCkkJyxcbiAgICAgICAgICAnaSdcbiAgICAgICAgKSxcbiAgICAgICAgYnV0dG9uQm9yZGVyQ29sb3JSZWdleCA9IG5ldyBSZWdFeHAoJ14oaGVyb0J1dHRvbkJvcmRlckNvbG9yfGhlcm8tYnV0dG9uLWJvcmRlci1jb2xvcnxoZXJvQm9yZGVyQ29sb3J8aGVyby1ib3JkZXItY29sb3J8KSQnLCAnaScpLFxuICAgICAgICBsb2dvID0gTElCLmdldENvb2tpZSgnbG9nbycpLFxuICAgICAgICBoZXJvQmFja2dyb3VuZCA9IExJQi5nZXRDb29raWUoJ2hlcm9CYWNrZ3JvdW5kJyksXG4gICAgICAgIGNvbG9yID0gTElCLmdldENvb2tpZSgnY29sb3InKSxcbiAgICAgICAgLy90aXRsZSA9IFwiWW91IFRvPGJyPlBSRU1JRVIgQlVTSU5FU1MgRVZFTlQ8YnI+T0YgVEhFIFlFQVJcIixcbiAgICAgICAgLy9zdWJ0aXRsZSA9IExJQi5nZXRIdW1hbkRhdGUoKSxcbiAgICAgICAgLy90aXRsZU1hdGNoLFxuICAgICAgICAvL2NvbXBhbnksXG4gICAgICAgIC8vY29tcGFueU5hbWUsXG4gICAgICAgIGVkaXRIdG1sLFxuICAgICAgICBlZGl0QXNzZXRWYXJzLFxuICAgICAgICB3YWl0Rm9yTG9hZE1zZyxcbiAgICAgICAgd2FpdEZvclJlbG9hZE1zZ1xuXG4gICAgICB3YWl0Rm9yTG9hZE1zZyA9IG5ldyBFeHQuV2luZG93KHtcbiAgICAgICAgY2xvc2FibGU6IHRydWUsXG4gICAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgICB3aWR0aDogNTAwLFxuICAgICAgICBoZWlnaHQ6IDI1MCxcbiAgICAgICAgY2xzOiAnbWt0TW9kYWxGb3JtJyxcbiAgICAgICAgdGl0bGU6ICdQbGVhc2UgV2FpdCBmb3IgUGFnZSB0byBMb2FkJyxcbiAgICAgICAgaHRtbDogJzx1PlNhdmluZyBFZGl0cyB0byBIZXJvIEJhY2tncm91bmQgJiBCdXR0b24gQmFja2dyb3VuZCBDb2xvcjwvdT4gPGJyPldhaXQgdW50aWwgdGhpcyBwYWdlIGNvbXBsZXRlbHkgbG9hZHMgYmVmb3JlIGNsb3NpbmcuIDxicj48YnI+PHU+VG8gRGlzYWJsZSBUaGlzIEZlYXR1cmU6PC91PiA8YnI+Q2xlYXIgdGhlIHNlbGVjdGVkIGNvbXBhbnkgdmlhIHRoZSBNYXJrZXRvTGl2ZSBleHRlbnNpb24uJ1xuICAgICAgfSlcbiAgICAgIHdhaXRGb3JSZWxvYWRNc2cgPSBuZXcgRXh0LldpbmRvdyh7XG4gICAgICAgIGNsb3NhYmxlOiB0cnVlLFxuICAgICAgICBtb2RhbDogdHJ1ZSxcbiAgICAgICAgd2lkdGg6IDUwMCxcbiAgICAgICAgaGVpZ2h0OiAyNTAsXG4gICAgICAgIGNsczogJ21rdE1vZGFsRm9ybScsXG4gICAgICAgIHRpdGxlOiAnUGxlYXNlIFdhaXQgZm9yIFBhZ2UgdG8gUmVsb2FkJyxcbiAgICAgICAgaHRtbDogJzx1PlNhdmluZyBFZGl0cyB0byBMb2dvLCBUaXRsZSwgJiBTdWJ0aXRsZTwvdT4gPGJyPldhaXQgZm9yIHRoaXMgcGFnZSB0byByZWxvYWQgYXV0b21hdGljYWxseS4gPGJyPjxicj48dT5UbyBEaXNhYmxlIFRoaXMgRmVhdHVyZTo8L3U+IDxicj5DbGVhciB0aGUgc2VsZWN0ZWQgY29tcGFueSB2aWEgdGhlIE1hcmtldG9MaXZlIGV4dGVuc2lvbi4nXG4gICAgICB9KVxuXG4gICAgICBlZGl0SHRtbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgJy9lbWFpbGVkaXRvci9kb3dubG9hZEh0bWxGaWxlMj94c3JmSWQ9JyArIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpICsgJyZlbWFpbElkPScgKyBNa3QzLkRMLmRsLmNvbXBJZCxcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgICdHRVQnLFxuICAgICAgICAgIHRydWUsXG4gICAgICAgICAgJ2RvY3VtZW50JyxcbiAgICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGxldCBpc0xvZ29SZXBsYWNlZFxuICAgICAgICAgICAgLy9pc1RpdGxlUmVwbGFjZWQsXG4gICAgICAgICAgICAvL2lzU3VidGl0bGVSZXBsYWNlZDtcblxuICAgICAgICAgICAgaWYgKGxvZ28pIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGxvZ29JZHMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJFbGVtZW50ID0gcmVzcG9uc2UuZ2V0RWxlbWVudEJ5SWQobG9nb0lkc1tpaV0pXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgY3VyckVsZW1lbnQgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJFbGVtZW50LmNsYXNzTmFtZS5zZWFyY2goJ21rdG9JbWcnKSAhPSAtMSAmJlxuICAgICAgICAgICAgICAgICAgY3VyckVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpWzBdICYmXG4gICAgICAgICAgICAgICAgICBjdXJyRWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJylbMF0uZ2V0QXR0cmlidXRlKCdzcmMnKSAhPSBsb2dvXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBSZXBsYWNpbmc6IExvZ28gPiAnICsgbG9nbylcbiAgICAgICAgICAgICAgICAgIGlzTG9nb1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgY3VyckVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpWzBdLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBpc0xvZ29SZXBsYWNlZFxuICAgICAgICAgICAgICAvL3x8IGlzVGl0bGVSZXBsYWNlZFxuICAgICAgICAgICAgICAvL3x8IGlzU3VidGl0bGVSZXBsYWNlZFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGxldCB1cGRhdGVIdG1sXG5cbiAgICAgICAgICAgICAgdXBkYXRlSHRtbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAgICAgICAgICcvZW1haWxlZGl0b3IvdXBkYXRlQ29udGVudDInLFxuICAgICAgICAgICAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICAgICAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAgICAgICAgICAgJyZlbWFpbElkPScgK1xuICAgICAgICAgICAgICAgICAgTWt0My5ETC5kbC5jb21wSWQgK1xuICAgICAgICAgICAgICAgICAgJyZjb250ZW50PScgK1xuICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcocmVzcG9uc2UpKSArXG4gICAgICAgICAgICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAgICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zdG9wKClcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHdhaXRGb3JMb2FkTXNnLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuaGlkZSgpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgd2FpdEZvclJlbG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgdXBkYXRlSHRtbCgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGVkaXRBc3NldFZhcnMgPSBmdW5jdGlvbiAoYXNzZXQpIHtcbiAgICAgICAgbGV0IGFzc2V0VmFycyA9IGFzc2V0LmdldFZhcmlhYmxlVmFsdWVzKClcblxuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgT2JqZWN0LmtleXMoYXNzZXRWYXJzKS5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBsZXQgY3VyclZhcmlhYmxlS2V5ID0gT2JqZWN0LmtleXMoYXNzZXRWYXJzKVtpaV1cbiAgICAgICAgICBjdXJyVmFyaWFibGVWYWx1ZSA9IE9iamVjdC52YWx1ZXMoYXNzZXRWYXJzKVtpaV1cblxuICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjdXJyVmFyaWFibGVWYWx1ZSA9ICcnXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goaGVyb0JnUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgIT0gaGVyb0JhY2tncm91bmQgJiYgY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGh0dHBSZWdFeCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFZhcmlhYmxlVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goaGVhZGVyQmdDb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlICE9IGNvbG9yICYmIGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChjb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0VmFyaWFibGVWYWx1ZShjdXJyVmFyaWFibGVLZXksIGNvbG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChidXR0b25CZ0NvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgIT0gY29sb3IgJiYgY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRWYXJpYWJsZVZhbHVlKGN1cnJWYXJpYWJsZUtleSwgY29sb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGJ1dHRvbkJvcmRlckNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgIT0gY29sb3IgJiYgY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRWYXJpYWJsZVZhbHVlKGN1cnJWYXJpYWJsZUtleSwgY29sb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHdhaXRGb3JMb2FkTXNnLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLnJlbG9hZEVtYWlsKClcbiAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLmhpZGUoKVxuICAgICAgICAgIH0sIDc1MDApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKCc+IEVkaXRpbmc6IEVtYWlsIFZhcmlhYmxlcycpXG4gICAgICBpZiAobW9kZSA9PSAnZWRpdCcpIHtcbiAgICAgICAgbGV0IGlzV2ViUmVxdWVzdFNlc3Npb24gPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IFdhaXRpbmc6IFdlYiBSZXF1ZXN0IFNlc3Npb24gRGF0YScpXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLkRMLmRsLmNvbXBJZCcpICYmXG4gICAgICAgICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdFNlY3VyaXR5LmdldFhzcmZJZCcpICYmXG4gICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSAmJlxuICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdFeHQuaWQnKSAmJlxuICAgICAgICAgICAgRXh0LmlkKG51bGwsICc6JylcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEVkaXRpbmc6IEVtYWlsIEhUTUwnKVxuICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNXZWJSZXF1ZXN0U2Vzc2lvbilcblxuICAgICAgICAgICAgZWRpdEh0bWwoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgMClcblxuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICBlZGl0QXNzZXRWYXJzKGFzc2V0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBpc0VtYWlsRWRpdG9yVmFyaWFibGVzID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IFdhaXRpbmc6IEVtYWlsIEVkaXRvciBWYXJpYWJsZXMnKVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAhd2FpdEZvclJlbG9hZE1zZy5pc1Zpc2libGUoKSAmJlxuICAgICAgICAgICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCcpICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKS5nZXRWYXJpYWJsZVZhbHVlcygpICYmXG4gICAgICAgICAgICAgIE9iamVjdC5rZXlzKE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5nZXRFbWFpbCgpLmdldFZhcmlhYmxlVmFsdWVzKCkpLmxlbmd0aCAhPSAwICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5nZXRFbWFpbCgpLnNldFZhcmlhYmxlVmFsdWVcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBFZGl0aW5nOiBFbWFpbCBFZGl0b3IgVmFyaWFibGVzJylcbiAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNFbWFpbEVkaXRvclZhcmlhYmxlcylcblxuICAgICAgICAgICAgICBlZGl0QXNzZXRWYXJzKE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5nZXRFbWFpbCgpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIDApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobW9kZSA9PSAncHJldmlldycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogRW1haWwgUHJldmlld2VyIFZhcmlhYmxlcycpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIGVkaXRzIHRoZSB2YXJpYWJsZXMgd2l0aGluIHRoZSBMYW5kaW5nIFBhZ2UgRWRpdG9yIGZvciBjdXN0b20gY29tcGFueVxuICAvLyBtb2RlIHZpZXcgKGVkaXQsIHByZXZpZXcpOyBhc3NldCB0byBiZSBlZGl0ZWRcbiAgc2F2ZUxhbmRpbmdQYWdlRWRpdHM6IGZ1bmN0aW9uIChtb2RlLCBhc3NldCkge1xuICAgIGxldCBzYXZlRWRpdHNUb2dnbGUgPSBMSUIuZ2V0Q29va2llKCdzYXZlRWRpdHNUb2dnbGVTdGF0ZScpLFxuICAgICAgbG9nbyA9IExJQi5nZXRDb29raWUoJ2xvZ28nKSxcbiAgICAgIGhlcm9CYWNrZ3JvdW5kID0gTElCLmdldENvb2tpZSgnaGVyb0JhY2tncm91bmQnKSxcbiAgICAgIGNvbG9yID0gTElCLmdldENvb2tpZSgnY29sb3InKVxuXG4gICAgaWYgKHNhdmVFZGl0c1RvZ2dsZSA9PSAndHJ1ZScgJiYgKGxvZ28gIT0gbnVsbCB8fCBoZXJvQmFja2dyb3VuZCAhPSBudWxsIHx8IGNvbG9yICE9IG51bGwpKSB7XG4gICAgICBsZXQgaHR0cFJlZ0V4ID0gbmV3IFJlZ0V4cCgnXmh0dHB8XiQnLCAnaScpLFxuICAgICAgICAvL3RleHRSZWdleCA9IG5ldyBSZWdFeHAoXCJeW14jXXxeJFwiLCBcImlcIiksXG4gICAgICAgIGNvbG9yUmVnZXggPSBuZXcgUmVnRXhwKCdeI1swLTlhLWZdezMsNn0kfF5yZ2J8XiQnLCAnaScpLFxuICAgICAgICBsb2dvUmVnZXggPSBuZXcgUmVnRXhwKCdsb2dvfGhlYWRlckxvZ298aGVhZGVyLWxvZ298XiQnLCAnaScpLFxuICAgICAgICBoZXJvQmdSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ2hlcm9CYWNrZ3JvdW5kfGhlcm8tYmFja2dyb3VuZHxoZXJvQmtnfGhlcm8tYmtnfGhlcm9CZ3xoZXJvLWJnfGhlcm8xQmd8aGVyby0xLWJnfGhlcm8xQmtnfGhlcm8tMS1ia2d8aGVybzFCYWNrZ3JvdW5kfF4kJyxcbiAgICAgICAgICAnaSdcbiAgICAgICAgKSxcbiAgICAgICAgLy90aXRsZVJlZ2V4ID0gbmV3IFJlZ0V4cChcIl4obWFpblRpdGxlfG1haW4tdGl0bGV8aGVyb1RpdGxlfGhlcm8tdGl0bGV8dGl0bGV8KSRcIiwgXCJpXCIpLFxuICAgICAgICAvL3N1YnRpdGxlUmVnZXggPSBuZXcgUmVnRXhwKFwiXihzdWJ0aXRsZXxzdWItdGl0bGV8aGVyb1N1YnRpdGxlfGhlcm8tc3VidGl0bGV8KSRcIiwgXCJpXCIpLFxuICAgICAgICBidXR0b25CZ0NvbG9yUmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICdeKGhlcm9CdXR0b25CZ0NvbG9yfGhlcm8tYnV0dG9uLWJnLWNvbG9yfGhlcm9CdXR0b25CYWNrZ3JvdW5kQ29sb3J8aGVyby1idXR0b24tYmFja2dyb3VuZC1jb2xvcnxoZXJvQmtnQ29sb3J8aGVyby1ia2ctY29sb3J8KSQnLFxuICAgICAgICAgICdpJ1xuICAgICAgICApLFxuICAgICAgICBidXR0b25Cb3JkZXJDb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cCgnXihoZXJvQnV0dG9uQm9yZGVyQ29sb3J8aGVyby1idXR0b24tYm9yZGVyLWNvbG9yfGhlcm9Cb3JkZXJDb2xvcnxoZXJvLWJvcmRlci1jb2xvcnwpJCcsICdpJyksXG4gICAgICAgIGhlYWRlckJnQ29sb3IgPSAnaGVhZGVyQmdDb2xvcicsXG4gICAgICAgIGhlYWRlckxvZ29JbWcgPSAnaGVhZGVyTG9nb0ltZycsXG4gICAgICAgIGhlcm9CZ0ltZyA9ICdoZXJvQmdJbWcnLFxuICAgICAgICAvL2hlcm9UaXRsZSA9IFwiaGVyb1RpdGxlXCIsXG4gICAgICAgIC8vaGVyb1N1YnRpdGxlID0gXCJoZXJvU3VidGl0bGVcIixcbiAgICAgICAgZm9ybUJ1dHRvbkJnQ29sb3IgPSAnZm9ybUJ1dHRvbkJnQ29sb3InLFxuICAgICAgICBmb290ZXJMb2dvSW1nID0gJ2Zvb3RlckxvZ29JbWcnLFxuICAgICAgICAvL3RpdGxlID0gXCJZb3UgVG8gT3VyIEV2ZW50XCIsXG4gICAgICAgIC8vc3VidGl0bGUgPSBMSUIuZ2V0SHVtYW5EYXRlKCksXG4gICAgICAgIC8vY29tcGFueSxcbiAgICAgICAgLy9jb21wYW55TmFtZSxcbiAgICAgICAgZWRpdEFzc2V0VmFycyxcbiAgICAgICAgd2FpdEZvckxvYWRNc2dcblxuICAgICAgd2FpdEZvckxvYWRNc2cgPSBuZXcgRXh0LldpbmRvdyh7XG4gICAgICAgIGNsb3NhYmxlOiB0cnVlLFxuICAgICAgICBtb2RhbDogdHJ1ZSxcbiAgICAgICAgd2lkdGg6IDUwMCxcbiAgICAgICAgaGVpZ2h0OiAyNTAsXG4gICAgICAgIGNsczogJ21rdE1vZGFsRm9ybScsXG4gICAgICAgIHRpdGxlOiAnUGxlYXNlIFdhaXQgZm9yIFBhZ2UgdG8gTG9hZCcsXG4gICAgICAgIGh0bWw6ICc8dT5TYXZpbmcgRWRpdHM8L3U+IDxicj5XYWl0IHVudGlsIHRoaXMgcGFnZSBjb21wbGV0ZWx5IGxvYWRzIGJlZm9yZSBjbG9zaW5nLiA8YnI+PGJyPjx1PlRvIERpc2FibGUgVGhpcyBGZWF0dXJlOjwvdT4gPGJyPkNsZWFyIHRoZSBzZWxlY3RlZCBjb21wYW55IHZpYSB0aGUgTWFya2V0b0xpdmUgZXh0ZW5zaW9uLidcbiAgICAgIH0pXG5cbiAgICAgIGVkaXRBc3NldFZhcnMgPSBmdW5jdGlvbiAoYXNzZXQpIHtcbiAgICAgICAgbGV0IGFzc2V0VmFycyA9IGFzc2V0LmdldFJlc3BvbnNpdmVWYXJWYWx1ZXMoKVxuICAgICAgICAvL2lzTGFuZGluZ1BhZ2VFZGl0b3JGcmFnbWVudFN0b3JlLFxuICAgICAgICAvL2NvdW50ID0gMCxcbiAgICAgICAgLy9pc1RpdGxlVXBkYXRlZCA9IGlzU3VidGl0bGVVcGRhdGVkID0gZmFsc2U7XG5cbiAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG5cbiAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGhlYWRlckJnQ29sb3IsIGNvbG9yKVxuICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoaGVhZGVyTG9nb0ltZywgbG9nbylcbiAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGhlcm9CZ0ltZywgaGVyb0JhY2tncm91bmQpXG4gICAgICAgIC8vYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGhlcm9UaXRsZSwgdGl0bGUpO1xuICAgICAgICAvL2Fzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShoZXJvU3VidGl0bGUsIHN1YnRpdGxlKTtcbiAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGZvcm1CdXR0b25CZ0NvbG9yLCBjb2xvcilcbiAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGZvb3RlckxvZ29JbWcsIGxvZ28pXG5cbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IE9iamVjdC5rZXlzKGFzc2V0VmFycykubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgbGV0IGN1cnJWYXJpYWJsZUtleSA9IE9iamVjdC5rZXlzKGFzc2V0VmFycylbaWldLFxuICAgICAgICAgICAgY3VyclZhcmlhYmxlVmFsdWUgPSBPYmplY3QudmFsdWVzKGFzc2V0VmFycylbaWldLnRvU3RyaW5nKClcblxuICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjdXJyVmFyaWFibGVWYWx1ZSA9ICcnXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2gobG9nb1JlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChodHRwUmVnRXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBsb2dvKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChoZXJvQmdSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goaHR0cFJlZ0V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGN1cnJWYXJpYWJsZUtleSwgaGVyb0JhY2tncm91bmQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGJ1dHRvbkJnQ29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goY29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShjdXJyVmFyaWFibGVLZXksIGNvbG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChidXR0b25Cb3JkZXJDb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChjb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGN1cnJWYXJpYWJsZUtleSwgY29sb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHdhaXRGb3JMb2FkTXNnLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9Na3QzLmFwcC5jb250cm9sbGVycy5nZXQoXCJNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlXCIpLmxvYWRFZGl0b3JWaWV3KCk7XG4gICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5oaWRlKClcbiAgICAgICAgICB9LCA3NTAwKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZygnPiBFZGl0aW5nOiBMYW5kaW5nIFBhZ2UgVmFyaWFibGVzJylcbiAgICAgIGlmIChtb2RlID09ICdlZGl0Jykge1xuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICBlZGl0QXNzZXRWYXJzKGFzc2V0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBpc0xhbmRpbmdQYWdlRWRpdG9yVmFyaWFibGVzID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmFwcC5jb250cm9sbGVycy5nZXQnKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKCkuZ2V0UmVzcG9uc2l2ZVZhclZhbHVlcygpICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKCkuc2V0UmVzcG9uc2l2ZVZhclZhbHVlICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBFZGl0aW5nOiBMYW5kaW5nIFBhZ2UgRWRpdG9yIFZhcmlhYmxlcycpXG4gICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzTGFuZGluZ1BhZ2VFZGl0b3JWYXJpYWJsZXMpXG5cbiAgICAgICAgICAgICAgZWRpdEFzc2V0VmFycyhNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIDApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobW9kZSA9PSAncHJldmlldycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogTGFuZGluZyBQYWdlIFByZXZpZXdlciBWYXJpYWJsZXMnKVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBzZXRQcm9ncmFtUmVwb3J0RmlsdGVyOiBmdW5jdGlvbiAoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQsIG5ld1Byb2dyYW1Db21wSWQpIHtcbiAgICBsZXQgYXBwbHlQcm9ncmFtUmVwb3J0RmlsdGVyXG5cbiAgICBhcHBseVByb2dyYW1SZXBvcnRGaWx0ZXIgPSBmdW5jdGlvbiAoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQpIHtcbiAgICAgIGxldCBjdXJyTmV3UmVwb3J0XG5cbiAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWUubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIGN1cnJOZXdSZXBvcnQgPSBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWVbaWldXG5cbiAgICAgICAgaWYgKGN1cnJOZXdSZXBvcnQuY29tcFR5cGUgPT0gJ1JlcG9ydCcpIHtcbiAgICAgICAgICBsZXQgcmVwb3J0RmlsdGVyVHlwZSwgc2VsZWN0ZWROb2Rlc1xuXG4gICAgICAgICAgaWYgKC9eRW1haWwvaS50ZXN0KGN1cnJOZXdSZXBvcnQudGV4dCkpIHtcbiAgICAgICAgICAgIHJlcG9ydEZpbHRlclR5cGUgPSAnbWFFbWFpbCdcbiAgICAgICAgICAgIHNlbGVjdGVkTm9kZXMgPSAnW1wiJyArIGNsb25lVG9Gb2xkZXJJZCArICdcIl0nXG4gICAgICAgICAgfSBlbHNlIGlmICgvXihFbmdhZ2VtZW50fE51cnR1cikvaS50ZXN0KGN1cnJOZXdSZXBvcnQudGV4dCkpIHtcbiAgICAgICAgICAgIHJlcG9ydEZpbHRlclR5cGUgPSAnbnVydHVyZXByb2dyYW0nXG4gICAgICAgICAgICBzZWxlY3RlZE5vZGVzID0gJ1tcIicgKyBjbG9uZVRvRm9sZGVySWQgKyAnXCJdJ1xuICAgICAgICAgIH0gZWxzZSBpZiAoL15MYW5kaW5nL2kudGVzdChjdXJyTmV3UmVwb3J0LnRleHQpKSB7XG4gICAgICAgICAgICByZXBvcnRGaWx0ZXJUeXBlID0gJ21hTGFuZGluZydcbiAgICAgICAgICAgIHNlbGVjdGVkTm9kZXMgPSAnW1wiJyArIGNsb25lVG9Gb2xkZXJJZCArICdcIl0nXG4gICAgICAgICAgfSBlbHNlIGlmICgvXlByb2dyYW0vaS50ZXN0KGN1cnJOZXdSZXBvcnQudGV4dCkpIHtcbiAgICAgICAgICAgIHJlcG9ydEZpbHRlclR5cGUgPSAncHJvZ3JhbSdcbiAgICAgICAgICAgIHNlbGVjdGVkTm9kZXMgPSAnW1wiJyArIGNsb25lVG9Gb2xkZXJJZCArICdcIl0nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcG9ydEZpbHRlclR5cGUgJiYgc2VsZWN0ZWROb2Rlcykge1xuICAgICAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgICAgICcvYW5hbHl0aWNzL2FwcGx5Q29tcG9uZW50RmlsdGVyJyxcbiAgICAgICAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgICAgICAgJyZub2RlSWRzPScgK1xuICAgICAgICAgICAgICBzZWxlY3RlZE5vZGVzICtcbiAgICAgICAgICAgICAgJyZmaWx0ZXJUeXBlPScgK1xuICAgICAgICAgICAgICByZXBvcnRGaWx0ZXJUeXBlICtcbiAgICAgICAgICAgICAgJyZyZXBvcnRJZD0nICtcbiAgICAgICAgICAgICAgY3Vyck5ld1JlcG9ydC5jb21wSWQgK1xuICAgICAgICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjbG9uZVRvRm9sZGVySWQpIHtcbiAgICAgIGlmIChnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UpIHtcbiAgICAgICAgYXBwbHlQcm9ncmFtUmVwb3J0RmlsdGVyKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkKVxuICAgICAgfSBlbHNlIGlmIChuZXdQcm9ncmFtQ29tcElkKSB7XG4gICAgICAgIGFwcGx5UHJvZ3JhbVJlcG9ydEZpbHRlcihMSUIuZ2V0UHJvZ3JhbUFzc2V0RGV0YWlscyhuZXdQcm9ncmFtQ29tcElkKSwgY2xvbmVUb0ZvbGRlcklkKVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBzZXRQcm9ncmFtVGFnOiBmdW5jdGlvbiAob3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEsIG5ld1Byb2dyYW1Db21wSWQsIHRhZ05hbWUsIHRhZ1ZhbHVlKSB7XG4gICAgbGV0IGN1cnJTZXR0aW5nLCB0YWdEYXRhXG5cbiAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEubGVuZ3RoOyBpaSsrKSB7XG4gICAgICBjdXJyU2V0dGluZyA9IG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhW2lpXVxuXG4gICAgICBpZiAoY3VyclNldHRpbmcuc3VtbWFyeURhdGEubmFtZSA9PSB0YWdOYW1lKSB7XG4gICAgICAgIHRhZ0RhdGEgPSBlbmNvZGVVUklDb21wb25lbnQoXG4gICAgICAgICAgJ3tcInByb2dyYW1JZFwiOicgK1xuICAgICAgICAgIG5ld1Byb2dyYW1Db21wSWQgK1xuICAgICAgICAgICcsXCJwcm9ncmFtRGVzY3JpcHRvcklkXCI6JyArXG4gICAgICAgICAgcGFyc2VJbnQoY3VyclNldHRpbmcuaWQucmVwbGFjZSgvXlBELS8sICcnKSkgK1xuICAgICAgICAgICcsXCJkZXNjcmlwdG9ySWRcIjonICtcbiAgICAgICAgICBjdXJyU2V0dGluZy5kZXNjcmlwdG9ySWQgK1xuICAgICAgICAgICcsXCJkZXNjcmlwdG9yVmFsdWVcIjpcIicgK1xuICAgICAgICAgIHRhZ1ZhbHVlICtcbiAgICAgICAgICAnXCJ9J1xuICAgICAgICApXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRhZ0RhdGEpIHtcbiAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAnL21hcmtldGluZ0V2ZW50L3NldFByb2dyYW1EZXNjcmlwdG9yU3VibWl0JyxcbiAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgJyZjb21wSWQ9JyArXG4gICAgICAgIG5ld1Byb2dyYW1Db21wSWQgK1xuICAgICAgICAnJl9qc29uPScgK1xuICAgICAgICB0YWdEYXRhICtcbiAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAnUE9TVCcsXG4gICAgICAgIGZhbHNlLFxuICAgICAgICAnJyxcbiAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIH1cbiAgICAgIClcbiAgICB9XG4gIH1cblxufVxuIiwiY29uc29sZS5sb2coJzI1MG9rID4gUnVubmluZycpXG5MSUIubG9hZFNjcmlwdCgnaHR0cHM6Ly9tYXJrZXRvbGl2ZS5jb20vbTMvcGx1Z2ludjMvZGVsaXZlcmFiaWxpdHktdG9vbHMuanMnKVxuIl19
