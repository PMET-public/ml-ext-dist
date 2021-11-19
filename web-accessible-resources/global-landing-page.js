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

console.log('Global Landing Page > Running')
// eslint-disable-next-line no-var
var MARKETO_LIVE_LANDING_PAGE = 'https://marketolive.com/m3/pluginv3/marketo-live-landing-page.js',
  mktoLiveProdLandingPageDomain = 'http://pages.marketolive.com',
  mktoLiveDevLandingPageDomain = 'http://dev.pages.marketolive.com',
  mktoLiveLandingPageHostsMatch = 'http://na-sjdemo1.marketo.com',
  mktoLiveDevMunchkinId = '685-BTN-772',
  mktoLiveProdMunchkinId = '185-NGX-811',
  mktoLiveNewPodMunchkinId = '924-LFC-514',
  mktoLiveMunchkinIdsMatch = '(' + mktoLiveProdMunchkinId + '|' + mktoLiveDevMunchkinId + '|' + mktoLiveNewPodMunchkinId + ')',
  mktoLiveLandingPageDomainMatch =
    '^(' +
    mktoLiveProdLandingPageDomain +
    '|' +
    mktoLiveDevLandingPageDomain +
    '|' +
    mktoLiveLandingPageHostsMatch +
    '/lp/' +
    mktoLiveMunchkinIdsMatch +
    ')/'


if (window.location.href.search(mktoLiveLandingPageDomainMatch) != -1) {
  console.log('Global Landing Page > Location: MarketoLive Landing Page')
  LIB.loadScript(MARKETO_LIVE_LANDING_PAGE)
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFsdC9saWIvY29uY2F0LW5vdGUuanMiLCJhbHQvbGliL2Rldi1tb2RlLmpzIiwiYWx0L2xpYi9saWIuanMiLCJhbHQvcGx1Z2ludjMvZ2xvYmFsLWxhbmRpbmctcGFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUNGQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsdC9kaXN0L2Nocm9tZS1leHRlbnNpb24vd2ViLWFjY2Vzc2libGUtcmVzb3VyY2VzL2dsb2JhbC1sYW5kaW5nLXBhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuVGhpcyBmaWxlIGlzIHRoZSBjb21iaW5lZCBvdXRwdXQgb2YgbXVsdGlwbGUgc3JjIGZpbGVzLiBEbyBub3QgZWRpdCBpdCBkaXJlY3RseS5cbiovIiwiaXNFeHREZXZNb2RlID0gdHJ1ZSIsIi8vIGNhdGNoIGFsbCBmb3IgZ2xvYmFsbHkgZGVmaW5lZCBmdW5jdGlvbnMgdXNlZCBieSBhbnkgZmlsZVxuXG4vLyB0aGUgd2ViIGFjY2Vzc2libGUgcmVzb3VyY2VzIHByZWZpeCBuZWVkcyB0byBleGlzdCBpbiB0aGUgY2hyb21lIGV4dGVuc2lvbiBjb250ZXh0IEFORCB0aGUgd2luZG93IGNvbnRleHRcbi8vIHNvIGluamVjdGVkIHNjcmlwdHMgY2FuIGFjY2VzcyBvdGhlciBzY3JpcHRzXG53aW5kb3cud2FyUHJlZml4XG5pZiAodHlwZW9mIHdhclByZWZpeCA9PT0gJ3VuZGVmaW5lZCcgJiZcbiAgdHlwZW9mIGNocm9tZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgdHlwZW9mIGNocm9tZS5ydW50aW1lICE9PSAndW5kZWZpbmVkJyAmJlxuICB0eXBlb2YgY2hyb21lLnJ1bnRpbWUuZ2V0VVJMICE9PSAndW5kZWZpbmVkJykge1xuICB3aW5kb3cud2FyUHJlZml4ID0gY2hyb21lLnJ1bnRpbWUuZ2V0VVJMKCd3ZWItYWNjZXNzaWJsZS1yZXNvdXJjZXMnKVxuXG4gIC8vIGRvIG5vdCBhdHRlbXB0IHRvIGFkZCB0aGlzIGlubGluZSBzY3JpcHQgdG8gdGhlIGV4dGVuc2lvbiBiYWNrZ3JvdW5kIG9yIHBvcHVwIHBhZ2UuXG4gIC8vIGl0J3Mgbm90IGFsbG93ZWQgYnkgQ2hyb21lJ3MgQ1NQIGFuZCBpdCdzIG5vdCBuZWVkZWQgYi9jIHRoZSB3YXJQcmVmaXggd2lsbCBiZSBhbHJlYWR5IGJlIGF2YWlsYWJsZVxuICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNzIxODY3OC9pcy1jb250ZW50LXNlY3VyaXR5LXBvbGljeS11bnNhZmUtaW5saW5lLWRlcHJlY2F0ZWRcbiAgaWYgKCEvXmNocm9tZS1leHRlbnNpb246LiooXFwvX2dlbmVyYXRlZF9iYWNrZ3JvdW5kX3BhZ2VcXC5odG1sfFxcL3BvcHVwXFwvcG9wdXAuaHRtbCkkLy50ZXN0KGxvY2F0aW9uLmhyZWYpKSB7XG4gICAgbGV0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgIHMuaW5uZXJIVE1MID0gYHdpbmRvdy53YXJQcmVmaXggPSAnJHt3YXJQcmVmaXh9J2BcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHMpXG4gIH1cbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXZhclxudmFyIExJQiA9IHtcblxuICBNQVJLRVRPX0xJVkVfQVBQOiAnaHR0cHM6Ly9tYXJrZXRvbGl2ZS5jb20vbTMvcGx1Z2ludjMvbWFya2V0by1hcHAuanMnLFxuICBNQVJLRVRPX0dMT0JBTF9BUFA6ICdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52My9tYXJrZXRvLWdsb2JhbC1hcHAuanMnLFxuICBHTE9CQUxfTEFORElOR19QQUdFOiAnaHR0cHM6Ly9tYXJrZXRvbGl2ZS5jb20vbTMvcGx1Z2ludjMvZ2xvYmFsLWxhbmRpbmctcGFnZS5qcycsXG4gIEhFQVBfQU5BTFlUSUNTX1NDUklQVF9MT0NBVElPTjogJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzL2hlYXAtYW5hbHl0aWNzLWV4dC5qcycsXG5cbiAgYWRkU3R5bGVzOiBmdW5jdGlvbiAoY3NzKSB7XG4gICAgbGV0IGggPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLFxuICAgICAgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICBzLnR5cGUgPSAndGV4dC9jc3MnXG4gICAgcy5pbm5lckhUTUwgPSBjc3NcbiAgICBoLmFwcGVuZENoaWxkKHMpXG4gIH0sXG5cbiAgaXNQcm9wT2ZXaW5kb3dPYmo6IGZ1bmN0aW9uIChzKSB7XG4gICAgaWYgKHR5cGVvZiBzICE9PSAnc3RyaW5nJyB8fCAvW1soXV0vLnRlc3QocykpIHtcbiAgICAgIHRocm93ICdJbnZhbGlkIHBhcmFtIHRvIGlzUHJvcE9mV2luZG93T2JqJ1xuICAgIH1cbiAgICBsZXQgYSA9IHMuc3BsaXQoJy4nKSxcbiAgICAgIG9iaiA9IHdpbmRvd1thLnNoaWZ0KCldXG4gICAgd2hpbGUgKG9iaiAmJiBhLmxlbmd0aCkge1xuICAgICAgb2JqID0gb2JqW2Euc2hpZnQoKV1cbiAgICB9XG4gICAgcmV0dXJuICEhb2JqXG4gIH0sXG5cbiAgZ2V0RXh0ZW5zaW9uSWQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIGNocm9tZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGNocm9tZS5ydW50aW1lID09PSAnb2JqZWN0JyAmJiBjaHJvbWUucnVudGltZS5pZCkge1xuICAgICAgcmV0dXJuIGNocm9tZS5ydW50aW1lLmlkXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB3YXJQcmVmaXgucmVwbGFjZSgvLio6XFwvXFwvKFteL10qKS4qLywgJyQxJylcbiAgICB9XG4gIH0sXG5cbiAgcmVsb2FkVGFiczogZnVuY3Rpb24gKHVybE1hdGNoKSB7XG4gICAgY2hyb21lLnRhYnMucXVlcnkoe3VybDogdXJsTWF0Y2h9LFxuICAgICAgZnVuY3Rpb24gKHRhYnMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YWJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY2hyb21lLnRhYnMucmVsb2FkKHRhYnNbaV0uaWQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gIH0sXG5cbiAgZ2V0Q29va2llOiBmdW5jdGlvbiAoY29va2llTmFtZSkge1xuICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nOiBDb29raWUgJyArIGNvb2tpZU5hbWUpXG4gICAgbGV0IG5hbWUgPSBjb29raWVOYW1lICsgJz0nLFxuICAgICAgY29va2llcyA9IGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOycpLFxuICAgICAgY3VyckNvb2tpZVxuXG4gICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGNvb2tpZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICBjdXJyQ29va2llID0gY29va2llc1tpaV0udHJpbSgpXG4gICAgICBpZiAoY3VyckNvb2tpZS5pbmRleE9mKG5hbWUpID09IDApIHtcbiAgICAgICAgcmV0dXJuIGN1cnJDb29raWUuc3Vic3RyaW5nKG5hbWUubGVuZ3RoLCBjdXJyQ29va2llLmxlbmd0aClcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5sb2coJ0dldHRpbmc6IENvb2tpZSAnICsgY29va2llTmFtZSArICcgbm90IGZvdW5kJylcbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIHJlbW92ZUNvb2tpZTogZnVuY3Rpb24gKG9iaikge1xuICAgIGxldCBjb29raWUgPSB7XG4gICAgICB1cmw6IG9iai51cmwsXG4gICAgICBuYW1lOiBvYmoubmFtZVxuICAgIH1cbiAgICBjaHJvbWUuY29va2llcy5yZW1vdmUoY29va2llLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnUmVtb3Zpbmc6ICcgKyBjb29raWUubmFtZSArICcgQ29va2llIGZvciAnICsgY29va2llLnVybClcbiAgICB9KVxuICB9LFxuXG4gIHNldENvb2tpZTogZnVuY3Rpb24gKG9iaikge1xuICAgIGxldCBjb29raWUgPSB7XG4gICAgICB1cmw6IG9iai51cmwsXG4gICAgICBuYW1lOiBvYmoubmFtZSxcbiAgICAgIHZhbHVlOiBvYmoudmFsdWUsXG4gICAgICBkb21haW46IG9iai5kb21haW5cbiAgICB9XG5cbiAgICBpZiAob2JqLmV4cGlyZXNJbkRheXMpIHtcbiAgICAgIGNvb2tpZS5leHBpcmF0aW9uRGF0ZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMCArIG9iai5leHBpcmVzSW5EYXlzICogMjQgKiA2MCAqIDYwXG4gICAgfVxuICAgIGlmIChvYmouc2VjdXJlKSB7XG4gICAgICBjb29raWUuc2VjdXJlID0gb2JqLnNlY3VyZVxuICAgIH1cblxuICAgIGNocm9tZS5jb29raWVzLnNldChjb29raWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChjb29raWUudmFsdWUgIT0gbnVsbCkge1xuICAgICAgICBjb25zb2xlLmxvZygnU2V0dGluZzogJyArIGNvb2tpZS5uYW1lICsgJyBDb29raWUgZm9yICcgKyBjb29raWUuZG9tYWluICsgJyA9ICcgKyBjb29raWUudmFsdWUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnU2V0dGluZzogJyArIGNvb2tpZS5uYW1lICsgJyBDb29raWUgZm9yICcgKyBjb29raWUuZG9tYWluICsgJyA9IG51bGwnKVxuICAgICAgfVxuICAgIH0pXG4gIH0sXG5cbiAgZm9ybWF0VGV4dDogZnVuY3Rpb24gKHRleHQpIHtcbiAgICBsZXQgc3BsaXRUZXh0ID0gdGV4dC50cmltKCkuc3BsaXQoJyAnKSxcbiAgICAgIGZvcm1hdHRlZFRleHQgPSAnJ1xuXG4gICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHNwbGl0VGV4dC5sZW5ndGg7IGlpKyspIHtcbiAgICAgIGlmIChpaSAhPSAwKSB7XG4gICAgICAgIGZvcm1hdHRlZFRleHQgKz0gJyAnXG4gICAgICB9XG4gICAgICBmb3JtYXR0ZWRUZXh0ICs9IHNwbGl0VGV4dFtpaV0uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzcGxpdFRleHRbaWldLnN1YnN0cmluZygxKS50b0xvd2VyQ2FzZSgpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZvcm1hdHRlZFRleHRcbiAgfSxcblxuICBnZXRVcmxQYXJhbTogZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgY29uc29sZS5sb2coJ0dldHRpbmc6IFVSTCBQYXJhbWV0ZXI6ICcgKyBwYXJhbSlcbiAgICBsZXQgcGFyYW1TdHJpbmcgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnPycpWzFdXG5cbiAgICBpZiAocGFyYW1TdHJpbmcpIHtcbiAgICAgIGxldCBwYXJhbXMgPSBwYXJhbVN0cmluZy5zcGxpdCgnJicpLFxuICAgICAgICBwYXJhbVBhaXIsXG4gICAgICAgIHBhcmFtTmFtZSxcbiAgICAgICAgcGFyYW1WYWx1ZVxuXG4gICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgcGFyYW1zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICBwYXJhbVBhaXIgPSBwYXJhbXNbaWldLnNwbGl0KCc9JylcbiAgICAgICAgcGFyYW1OYW1lID0gcGFyYW1QYWlyWzBdXG4gICAgICAgIHBhcmFtVmFsdWUgPSBwYXJhbVBhaXJbMV1cblxuICAgICAgICBpZiAocGFyYW1OYW1lID09IHBhcmFtKSB7XG4gICAgICAgICAgcGFyYW1WYWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudChwYXJhbVZhbHVlKVxuICAgICAgICAgIGlmIChwYXJhbVZhbHVlLnNlYXJjaCgvXmh0dHAocyk/OlxcL1xcLy8pID09IC0xKSB7XG4gICAgICAgICAgICBwYXJhbVZhbHVlID0gcGFyYW1WYWx1ZS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zb2xlLmxvZygnVVJMIFBhcmFtZXRlcjogJyArIHBhcmFtTmFtZSArICcgPSAnICsgcGFyYW1WYWx1ZSlcbiAgICAgICAgICByZXR1cm4gcGFyYW1WYWx1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAnJ1xuICB9LFxuXG4gIGxvYWRTY3JpcHQ6IGZ1bmN0aW9uIChzY3JpcHRTcmMpIHtcbiAgICBzY3JpcHRTcmMgPSBzY3JpcHRTcmMucmVwbGFjZSgnaHR0cHM6Ly9tYXJrZXRvbGl2ZS5jb20vbTMvcGx1Z2ludjMnLCB3YXJQcmVmaXgpXG4gICAgY29uc29sZS5sb2coJ0xvYWRpbmc6IFNjcmlwdDogJyArIHNjcmlwdFNyYylcbiAgICBsZXQgc2NyaXB0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgc2NyaXB0RWxlbWVudC5hc3luYyA9IHRydWVcbiAgICBzY3JpcHRFbGVtZW50LnNyYyA9IHNjcmlwdFNyY1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc2NyaXB0RWxlbWVudClcbiAgfSxcblxuICB3ZWJSZXF1ZXN0OiBmdW5jdGlvbiAodXJsLCBwYXJhbXMsIG1ldGhvZCwgYXN5bmMsIHJlc3BvbnNlVHlwZSwgY2FsbGJhY2spIHtcbiAgICB1cmwgPSB1cmwucmVwbGFjZSgnaHR0cHM6Ly9tYXJrZXRvbGl2ZS5jb20vbTMvcGx1Z2ludjMnLCB3YXJQcmVmaXgpXG4gICAgY29uc29sZS5sb2coJ1dlYiBSZXF1ZXN0ID4gJyArIHVybCArICdcXG4nICsgcGFyYW1zKVxuICAgIGxldCB4bWxIdHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCksXG4gICAgICByZXN1bHRcbiAgICB4bWxIdHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgJiYgeG1sSHR0cC5yZWFkeVN0YXRlID09IDQgJiYgeG1sSHR0cC5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgIHJlc3VsdCA9IGNhbGxiYWNrKHhtbEh0dHAucmVzcG9uc2UpXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChhc3luYyAmJiB4bWxIdHRwLnJlc3BvbnNlVHlwZSkge1xuICAgICAgeG1sSHR0cC5yZXNwb25zZVR5cGUgPSByZXNwb25zZVR5cGVcbiAgICB9XG4gICAgeG1sSHR0cC5vcGVuKG1ldGhvZCwgdXJsLCBhc3luYykgLy8gdHJ1ZSBmb3IgYXN5bmNocm9ub3VzXG4gICAgeG1sSHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04JylcblxuICAgIC8vIGtoYjogaXMgdGhpcyBoZWFkZXIgbmVjZXNzYXJ5PyB3aHkgbm90IHNldCBpdCBhbGwgdGhlIHRpbWU/XG4gICAgaWYgKHVybC5zZWFyY2goL15cXC8vKSAhPSAtMSB8fCB1cmwucmVwbGFjZSgvXlthLXpdKzpcXC9cXC8oW14vXSspXFwvPy4qJC8sICckMScpID09IHdpbmRvdy5sb2NhdGlvbi5ob3N0KSB7XG4gICAgICB4bWxIdHRwLnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKVxuICAgIH1cblxuICAgIHhtbEh0dHAud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuICAgIHhtbEh0dHAuc2VuZChwYXJhbXMpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LFxuXG4gIHZhbGlkYXRlRGVtb0V4dGVuc2lvbkNoZWNrOiBmdW5jdGlvbiAoaXNWYWxpZEV4dGVuc2lvbikge1xuICAgIGNvbnNvbGUubG9nKCc+IFZhbGlkYXRpbmc6IERlbW8gRXh0ZW5zaW9uIENoZWNrJylcbiAgICBpZiAoaXNWYWxpZEV4dGVuc2lvbikge1xuICAgICAgd2luZG93Lm1rdG9fbGl2ZV9leHRlbnNpb25fc3RhdGUgPSAnTWFya2V0b0xpdmUgZXh0ZW5zaW9uIGlzIGFsaXZlISdcbiAgICAgIGNvbnNvbGUubG9nKCc+IFZhbGlkYXRpbmc6IERlbW8gRXh0ZW5zaW9uIElTIFZhbGlkJylcbiAgICB9IGVsc2UgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0UGFnZS52YWxpZGF0ZURlbW9FeHRlbnNpb24nKSkge1xuICAgICAgd2luZG93Lm1rdG9fbGl2ZV9leHRlbnNpb25fc3RhdGUgPSBudWxsXG4gICAgICBNa3RQYWdlLnZhbGlkYXRlRGVtb0V4dGVuc2lvbihuZXcgRGF0ZSgpKVxuICAgICAgY29uc29sZS5sb2coJz4gVmFsaWRhdGluZzogRGVtbyBFeHRlbnNpb24gSVMgTk9UIFZhbGlkJylcbiAgICB9XG4gIH0sXG5cbiAgZ2V0TWt0M0N0bHJBc3NldDogZnVuY3Rpb24oa2V5LCBtZXRob2QpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldChrZXkpW21ldGhvZF0oKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfSxcblxuICAvLyBvdmVybGF5cyBhbiBlbWFpbCB3aXRoIHRoZSB1c2VyIHN1Ym1pdHRlZCBjb21wYW55IGxvZ28gYW5kIGNvbG9yXG4gIC8vIGFjdGlvbiAtIG1vZGUgaW4gd2hpY2ggdGhpcyBhc3NldCBpcyBiZWluZyB2aWV3ZWQgKGVkaXQvcHJldmlldylcbiAgb3ZlcmxheUVtYWlsOiBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwnKVxuICAgIGxldCBpc0VtYWlsRWRpdG9yMixcbiAgICAgIGNsZWFyT3ZlcmxheVZhcnMsXG4gICAgICBvdmVybGF5LFxuICAgICAgaXNNa3RvSGVhZGVyQmdDb2xvclJlcGxhY2VkID1cbiAgICAgICAgKGlzTWt0b0ltZ1JlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9IZXJvQmdSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvVGV4dFJlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9TdWJUZXh0UmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9FbWFpbDFSZXBsYWNlZCA9XG4gICAgICAgICAgZWRpdG9yUHJldlJlYWR5ID1cbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID1cbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9XG4gICAgICAgICAgaXNEZXNrdG9wUHJldmlld1JlcGxhY2VkID1cbiAgICAgICAgICBpc1Bob25lUHJldmlld1JlcGxhY2VkID1cbiAgICAgICAgICBmYWxzZSksXG4gICAgICBsb2dvTWt0b05hbWVSZWdleCA9IG5ldyBSZWdFeHAoJ2xvZ28nLCAnaScpLFxuICAgICAgYnV0dG9uVGV4dFJlZ2V4ID0gbmV3IFJlZ0V4cCgnc2lnbnVwfHNpZ24gdXB8Y2FsbCB0byBhY3Rpb258Y3RhfHJlZ2lzdGVyfG1vcmV8Y29udHJpYnV0ZScsICdpJyksXG4gICAgICBzYXZlRWRpdHNUb2dnbGUgPSBMSUIuZ2V0Q29va2llKCdzYXZlRWRpdHNUb2dnbGVTdGF0ZScpLFxuICAgICAgbG9nbyA9IExJQi5nZXRDb29raWUoJ2xvZ28nKSxcbiAgICAgIGhlcm9CYWNrZ3JvdW5kID0gTElCLmdldENvb2tpZSgnaGVyb0JhY2tncm91bmQnKSxcbiAgICAgIGNvbG9yID0gTElCLmdldENvb2tpZSgnY29sb3InKSxcbiAgICAgIGRlZmF1bHRDb2xvciA9ICdyZ2IoNDIsIDgzLCAxMTIpJyxcbiAgICAgIGxvZ29NYXhIZWlnaHQgPSAnNTUnLFxuICAgICAgbWt0b01haW5UZXh0ID0gJ1lvdSBUbyBUaGU8YnI+PGJyPlBSRU1JRVIgQlVTSU5FU1MgRVZFTlQ8YnI+T0YgVEhFIFlFQVInLFxuICAgICAgbWt0b1N1YlRleHQgPSBMSUIuZ2V0SHVtYW5EYXRlKCksXG4gICAgICBjb21wYW55LFxuICAgICAgY29tcGFueU5hbWUsXG4gICAgICBlZGl0b3JSZXBlYXRSZWFkeUNvdW50ID0gKGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gcGhvbmVSZXBlYXRSZWFkeUNvdW50ID0gMCksXG4gICAgICBtYXhSZXBlYXRSZWFkeSA9IDIwMDAsXG4gICAgICBtYXhQcmV2aWV3UmVwZWF0UmVhZHkgPSAzMDAwXG5cbiAgICBpZiAoc2F2ZUVkaXRzVG9nZ2xlID09ICd0cnVlJyB8fCAobG9nbyA9PSBudWxsICYmIGhlcm9CYWNrZ3JvdW5kID09IG51bGwgJiYgY29sb3IgPT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBpZiAobG9nbyAhPSBudWxsKSB7XG4gICAgICBjb21wYW55ID0gbG9nby5zcGxpdCgnaHR0cHM6Ly9sb2dvLmNsZWFyYml0LmNvbS8nKVsxXS5zcGxpdCgnLicpWzBdXG4gICAgICBjb21wYW55TmFtZSA9IGNvbXBhbnkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBjb21wYW55LnNsaWNlKDEpXG4gICAgICBta3RvTWFpblRleHQgPSBjb21wYW55TmFtZSArICcgSW52aXRlcyAnICsgbWt0b01haW5UZXh0XG4gICAgfSBlbHNlIHtcbiAgICAgIG1rdG9NYWluVGV4dCA9ICdXZSBJbnZpdGUgJyArIG1rdG9NYWluVGV4dFxuICAgIH1cblxuICAgIGNsZWFyT3ZlcmxheVZhcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpc01rdG9IZWFkZXJCZ0NvbG9yUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0hlcm9CZ1JlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvVGV4dFJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvU3ViVGV4dFJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9FbWFpbDFSZXBsYWNlZCA9XG4gICAgICAgIGZhbHNlXG4gICAgICBlbWFpbEJvZHkgPVxuICAgICAgICBta3RvSW1ncyA9XG4gICAgICAgIG1rdG9UZXh0cyA9XG4gICAgICAgIG1rdG9CdXR0b25zID1cbiAgICAgICAgbG9nb1N3YXBDb21wYW55ID1cbiAgICAgICAgbG9nb1N3YXBDb250YWluZXIgPVxuICAgICAgICBsb2dvU3dhcENvbXBhbnlDb250YWluZXIgPVxuICAgICAgICBsb2dvQmtnID1cbiAgICAgICAgYnV0dG9uQmtnID1cbiAgICAgICAgbnVsbFxuICAgIH1cblxuICAgIG92ZXJsYXkgPSBmdW5jdGlvbiAoZW1haWxEb2N1bWVudCkge1xuICAgICAgaWYgKGVtYWlsRG9jdW1lbnQpIHtcbiAgICAgICAgbGV0IGVtYWlsQm9keSA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXSxcbiAgICAgICAgICBsb2dvU3dhcENvbXBhbnkgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dvLXN3YXAtY29tcGFueScpLFxuICAgICAgICAgIGxvZ29Td2FwQ29udGFpbmVyID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nby1zd2FwLWNvbnRhaW5lcicpLFxuICAgICAgICAgIGxvZ29Td2FwQ29tcGFueUNvbnRhaW5lciA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ28tc3dhcC1jb21wYW55LWNvbnRhaW5lcicpLFxuICAgICAgICAgIGxvZ29Ca2cgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dvLWJrZycpLFxuICAgICAgICAgIGJ1dHRvbkJrZyA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J1dHRvbi1ia2cnKVxuXG4gICAgICAgIGlmIChlbWFpbEJvZHkgJiYgZW1haWxCb2R5LmlubmVySFRNTCkge1xuICAgICAgICAgIGxldCBta3RvSGVhZGVyID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnaGVhZGVyJylbMF0sXG4gICAgICAgICAgICBta3RvTG9nbzEgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdsb2dvJylbMF0sXG4gICAgICAgICAgICBta3RvTG9nbzIgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdsb2dvJylbMV0sXG4gICAgICAgICAgICBta3RvSW1ncyA9IGVtYWlsQm9keS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdta3RvSW1nJyksXG4gICAgICAgICAgICBta3RvSGVyb0JnID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnaGVyb0JhY2tncm91bmQnKVswXSxcbiAgICAgICAgICAgIG1rdG9UZHMgPSBlbWFpbEJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RkJyksXG4gICAgICAgICAgICBta3RvVGl0bGUgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCd0aXRsZScpWzBdLFxuICAgICAgICAgICAgbWt0b1N1YnRpdGxlID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnc3VidGl0bGUnKVswXSxcbiAgICAgICAgICAgIG1rdG9UZXh0cyA9IGVtYWlsQm9keS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdta3RvVGV4dCcpLFxuICAgICAgICAgICAgbWt0b0J1dHRvbiA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2J1dHRvbicpWzBdLFxuICAgICAgICAgICAgbWt0b0J1dHRvbnMgPSBlbWFpbEJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc2Vjb25kYXJ5LWZvbnQgYnV0dG9uJylcblxuICAgICAgICAgIGlmICghaXNNa3RvSGVhZGVyQmdDb2xvclJlcGxhY2VkICYmIGNvbG9yICYmIG1rdG9IZWFkZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBIZWFkZXIgQmFja2dyb3VuZCBDb21wYW55IENvbG9yIGZvciBEZW1vIFN2Y3MgVGVtcGxhdGUnKVxuICAgICAgICAgICAgbWt0b0hlYWRlci5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgbWt0b0hlYWRlci5zZXRBdHRyaWJ1dGUoJ2JnQ29sb3InLCBjb2xvcilcbiAgICAgICAgICAgIGlzTWt0b0hlYWRlckJnQ29sb3JSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0ltZ1JlcGxhY2VkICYmIGxvZ28gJiYgKG1rdG9Mb2dvMSB8fCBta3RvTG9nbzIgfHwgbWt0b0ltZ3MubGVuZ3RoICE9IDApKSB7XG4gICAgICAgICAgICBpZiAobWt0b0xvZ28xIHx8IG1rdG9Mb2dvMikge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgQ29tcGFueSBMb2dvIGZvciBEZW1vIFN2Y3MgVGVtcGxhdGUnKVxuICAgICAgICAgICAgICBpZiAobWt0b0xvZ28xICYmIG1rdG9Mb2dvMS5nZXRBdHRyaWJ1dGUoJ2Rpc3BsYXknKSAhPSAnbm9uZScpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgQ29tcGFueSBMb2dvIDEnKVxuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMS5zdHlsZS53aWR0aCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMS5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzEuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKG1rdG9Mb2dvMiAmJiBta3RvTG9nbzIuZ2V0QXR0cmlidXRlKCdkaXNwbGF5JykgIT0gJ25vbmUnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIENvbXBhbnkgTG9nbyAyJylcbiAgICAgICAgICAgICAgICBta3RvTG9nbzIuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzIuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28yLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG1rdG9JbWdzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b0ltZyA9IG1rdG9JbWdzW2lpXSxcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nTWt0b05hbWVcblxuICAgICAgICAgICAgICAgIGlmIChjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ21rdG9uYW1lJykpIHtcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nTWt0b05hbWUgPSBjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ21rdG9uYW1lJylcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnaWQnKSkge1xuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWdNa3RvTmFtZSA9IGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnaWQnKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjdXJyTWt0b0ltZ01rdG9OYW1lICYmIGN1cnJNa3RvSW1nTWt0b05hbWUuc2VhcmNoKGxvZ29Na3RvTmFtZVJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvSW1nVGFnID0gY3Vyck1rdG9JbWcuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpWzBdXG5cbiAgICAgICAgICAgICAgICAgIGlmIChjdXJyTWt0b0ltZ1RhZyAmJiBjdXJyTWt0b0ltZ1RhZy5nZXRBdHRyaWJ1dGUoJ3NyYycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBDb21wYW55IExvZ28nKVxuICAgICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZ1RhZy5zdHlsZS53aWR0aCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZ1RhZy5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWdUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0hlcm9CZ1JlcGxhY2VkICYmIGhlcm9CYWNrZ3JvdW5kICYmIChta3RvSGVyb0JnIHx8IG1rdG9UZHMubGVuZ3RoICE9IDApKSB7XG4gICAgICAgICAgICBpZiAobWt0b0hlcm9CZykge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgSGVybyBDb21wYW55IEJhY2tncm91bmQgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIG1rdG9IZXJvQmcuc3R5bGUuc2V0UHJvcGVydHkoJ2JhY2tncm91bmQtaW1hZ2UnLCAndXJsKFxcJycgKyBoZXJvQmFja2dyb3VuZCArICdcXCcpJylcbiAgICAgICAgICAgICAgbWt0b0hlcm9CZy5zZXRBdHRyaWJ1dGUoJ2JhY2tncm91bmQnLCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgICAgICAgLy9ta3RvSGVyb0JnLnN0eWxlLnNldFByb3BlcnR5KFwiYmFja2dyb3VuZC1zaXplXCIsIFwiY292ZXJcIik7XG4gICAgICAgICAgICAgIGlzTWt0b0hlcm9CZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG1rdG9UZHMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvVGQgPSBta3RvVGRzW2lpXVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvVGQgJiYgY3Vyck1rdG9UZC5nZXRBdHRyaWJ1dGUoJ2JhY2tncm91bmQnKSkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIEhlcm8gQ29tcGFueSBCYWNrZ3JvdW5kJylcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvVGQuc2V0QXR0cmlidXRlKCdiYWNrZ3JvdW5kJywgaGVyb0JhY2tncm91bmQpXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b1RkLnN0eWxlLnNldFByb3BlcnR5KCdiYWNrZ3JvdW5kLWltYWdlJywgJ3VybChcXCcnICsgaGVyb0JhY2tncm91bmQgKyAnXFwnKScpXG4gICAgICAgICAgICAgICAgICAvL2N1cnJNa3RvVGQuc3R5bGUuc2V0UHJvcGVydHkoXCJiYWNrZ3JvdW5kLXNpemVcIiwgXCJjb3ZlclwiKTtcbiAgICAgICAgICAgICAgICAgIGlzTWt0b0hlcm9CZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0J1dHRvblJlcGxhY2VkICYmIGNvbG9yICYmIChta3RvQnV0dG9uIHx8IG1rdG9CdXR0b25zLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9CdXR0b24pIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIEJ1dHRvbiBDb21wYW55IENvbG9yIGZvciBEZW1vIFN2Y3MgVGVtcGxhdGUnKVxuICAgICAgICAgICAgICBta3RvQnV0dG9uLnN0eWxlLnNldFByb3BlcnR5KCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3IpXG4gICAgICAgICAgICAgIG1rdG9CdXR0b24uc3R5bGUuc2V0UHJvcGVydHkoJ2JvcmRlci1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBta3RvQnV0dG9ucy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9CdXR0b24gPSBta3RvQnV0dG9uc1tpaV1cblxuICAgICAgICAgICAgICAgIGlmIChjdXJyTWt0b0J1dHRvbi5pbm5lckhUTUwgJiYgY3Vyck1rdG9CdXR0b24uaW5uZXJIVE1MLnNlYXJjaChidXR0b25UZXh0UmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9CdXR0b24uc3R5bGUgJiYgY3Vyck1rdG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBCdXR0b24gQ29tcGFueSBDb2xvcicpXG4gICAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yXG4gICAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLnN0eWxlLmJvcmRlckNvbG9yID0gY29sb3JcbiAgICAgICAgICAgICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxvZ29Td2FwQ29tcGFueUNvbnRhaW5lciAmJiBsb2dvU3dhcENvbnRhaW5lciAmJiBsb2dvU3dhcENvbXBhbnkgJiYgbG9nb0JrZykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDEuMCBDb21wYW55IExvZ28gJiBDb2xvcicpXG4gICAgICAgICAgaWYgKGNvbG9yKSB7XG4gICAgICAgICAgICBsb2dvQmtnLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGxvZ28pIHtcbiAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueS5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG5cbiAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGxldCBsb2dvSGVpZ2h0c1JhdGlvLCBsb2dvV2lkdGgsIGxvZ29OZXdXaWR0aCwgbG9nb05ld0hlaWdodCwgbG9nb1N0eWxlXG5cbiAgICAgICAgICAgICAgaWYgKGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsSGVpZ2h0ICYmIGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsSGVpZ2h0ID4gbG9nb01heEhlaWdodCkge1xuICAgICAgICAgICAgICAgIGxvZ29IZWlnaHRzUmF0aW8gPSBsb2dvU3dhcENvbXBhbnkubmF0dXJhbEhlaWdodCAvIGxvZ29NYXhIZWlnaHRcbiAgICAgICAgICAgICAgICBsb2dvV2lkdGggPSBsb2dvU3dhcENvbXBhbnkubmF0dXJhbFdpZHRoIC8gbG9nb0hlaWdodHNSYXRpb1xuICAgICAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueS53aWR0aCA9IGxvZ29OZXdXaWR0aCA9IGxvZ29XaWR0aFxuICAgICAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueS5oZWlnaHQgPSBsb2dvTmV3SGVpZ2h0ID0gbG9nb01heEhlaWdodFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LndpZHRoID0gbG9nb05ld1dpZHRoID0gbG9nb1N3YXBDb21wYW55Lm5hdHVyYWxXaWR0aFxuICAgICAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueS5oZWlnaHQgPSBsb2dvTmV3SGVpZ2h0ID0gbG9nb1N3YXBDb21wYW55Lm5hdHVyYWxIZWlnaHRcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkud2lkdGggPSBsb2dvU3dhcENvbXBhbnkuaGVpZ2h0ID0gbG9nb05ld1dpZHRoID0gbG9nb05ld0hlaWdodCA9IGxvZ29NYXhIZWlnaHRcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJykgJiYgZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdKSB7XG4gICAgICAgICAgICAgICAgbG9nb1N0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgICAgICAgICAgICAgIGxvZ29TdHlsZS5pbm5lckhUTUwgPVxuICAgICAgICAgICAgICAgICAgJyMnICsgbG9nb1N3YXBDb21wYW55LmlkICsgJyB7d2lkdGggOiAnICsgbG9nb05ld1dpZHRoICsgJ3B4ICFpbXBvcnRhbnQ7IGhlaWdodCA6ICcgKyBsb2dvTmV3SGVpZ2h0ICsgJ3B4ICFpbXBvcnRhbnQ7fSdcbiAgICAgICAgICAgICAgICBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQobG9nb1N0eWxlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDEuMCBDb21wYW55IExvZ28gRGltZW5zaW9ucyA9ICcgKyBsb2dvTmV3V2lkdGggKyAnIHggJyArIGxvZ29OZXdIZWlnaHQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2dvU3dhcENvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgICAgICBsb2dvU3dhcENvbXBhbnlDb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYnV0dG9uQmtnICYmIGNvbG9yKSB7XG4gICAgICAgICAgICBidXR0b25Ca2cuc3R5bGUuc2V0UHJvcGVydHkoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvcilcbiAgICAgICAgICB9XG4gICAgICAgICAgaXNNa3RvRW1haWwxUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgKGlzTWt0b0J1dHRvblJlcGxhY2VkICYmXG4gICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCAmJlxuICAgICAgICAgICAgaXNNa3RvSGVyb0JnUmVwbGFjZWQgJiZcbiAgICAgICAgICAgICghbWt0b0hlYWRlciB8fCAobWt0b0hlYWRlciAmJiBpc01rdG9IZWFkZXJCZ0NvbG9yUmVwbGFjZWQpKSkgfHxcbiAgICAgICAgICBpc01rdG9FbWFpbDFSZXBsYWNlZFxuICAgICAgICApIHtcbiAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGlzRW1haWxFZGl0b3IyID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChhY3Rpb24gPT0gJ2VkaXQnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIERlc2lnbmVyJylcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8IGVkaXRvclJlcGVhdFJlYWR5Q291bnQgPj0gbWF4UmVwZWF0UmVhZHkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogRW1haWwgRGVzaWduZXIgPSAnICsgZWRpdG9yUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIEludGVydmFsIGlzIENsZWFyZWQnKVxuICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNFbWFpbEVkaXRvcjIpXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfSBlbHNlIGlmIChlZGl0b3JQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIGVkaXRvclJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlZGl0b3JSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBlZGl0b3JQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWRpdG9yUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT0gJ3ByZXZpZXcnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIFByZXZpZXdlcicpXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhaXNEZXNrdG9wUHJldmlld1JlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fFxuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPj0gbWF4UHJldmlld1JlcGVhdFJlYWR5XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IEVtYWlsIERlc2t0b3AgUHJldmlldyA9ICcgKyBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzRGVza3RvcFByZXZpZXdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAoZGVza3RvcFByZXZSZWFkeSkge1xuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhaXNQaG9uZVByZXZpZXdSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8IHBob25lUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhQcmV2aWV3UmVwZWF0UmVhZHkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogRW1haWwgUGhvbmUgUHJldmlldyA9ICcgKyBwaG9uZVJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc1Bob25lUHJldmlld1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChwaG9uZVByZXZSZWFkeSkge1xuICAgICAgICAgICAgcGhvbmVSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNQaG9uZVByZXZpZXdSZXBsYWNlZCAmJiBpc0Rlc2t0b3BQcmV2aWV3UmVwbGFjZWQpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCBJbnRlcnZhbCBpcyBDbGVhcmVkJylcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0VtYWlsRWRpdG9yMilcbiAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgMClcbiAgfSxcblxuICAvLyBvdmVybGF5cyBhIGxhbmRpbmcgcGFnZSB3aXRoIHRoZSB1c2VyIHN1Ym1pdHRlZCBjb21wYW55IGxvZ28gYW5kIGNvbG9yXG4gIC8vIGFjdGlvbiAtIG1vZGUgaW4gd2hpY2ggdGhpcyBhc3NldCBpcyBiZWluZyB2aWV3ZWQgKGVkaXQvcHJldmlldylcbiAgb3ZlcmxheUxhbmRpbmdQYWdlOiBmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlJylcbiAgICBsZXQgaXNMYW5kaW5nUGFnZUVkaXRvcixcbiAgICAgIGNsZWFyT3ZlcmxheVZhcnMsXG4gICAgICBvdmVybGF5LFxuICAgICAgaXNNa3RvRnJlZUZvcm0gPVxuICAgICAgICAoaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9IZXJvQmdJbWdSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvVGV4dFJlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9TdWJUZXh0UmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9PcmlnUmVwbGFjZWQgPVxuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPVxuICAgICAgICAgIHBob25lUHJldlJlYWR5ID1cbiAgICAgICAgICBzaWRlQnlTaWRlRGVza3RvcFByZXZSZWFkeSA9XG4gICAgICAgICAgc2lkZUJ5U2lkZVBob25lUHJldlJlYWR5ID1cbiAgICAgICAgICBpc0Rlc2t0b3BSZXBsYWNlZCA9XG4gICAgICAgICAgaXNQaG9uZVJlcGxhY2VkID1cbiAgICAgICAgICBpc1NpZGVCeVNpZGVEZXNrdG9wUmVwbGFjZWQgPVxuICAgICAgICAgIGlzU2lkZUJ5U2lkZVBob25lUmVwbGFjZWQgPVxuICAgICAgICAgIGZhbHNlKSxcbiAgICAgIG1rdG9Cb2R5SWQgPSAnYm9keUlkJyxcbiAgICAgIG1rdG9GcmVlRm9ybUNsYXNzTmFtZSA9ICdta3RvTW9iaWxlU2hvdycsXG4gICAgICBsb2dvUmVnZXggPSBuZXcgUmVnRXhwKCdwcmltYXJ5SW1hZ2V8cHJpbWFyeV9pbWFnZXxwcmltYXJ5LWltYWdlfGxvZ298aW1hZ2VfMXxpbWFnZS0xfGltYWdlMScsICdpJyksXG4gICAgICBoZXJvQmdJbWdJZFJlZ2V4ID0gbmV3IFJlZ0V4cCgnaGVybycsICdpJyksXG4gICAgICBidXR0b25UZXh0UmVnZXggPSBuZXcgUmVnRXhwKCdzaWdudXB8c2lnbiB1cHxjYWxsIHRvIGFjdGlvbnxjdGF8cmVnaXN0ZXJ8bW9yZXxjb250cmlidXRlfHN1Ym1pdCcsICdpJyksXG4gICAgICBzYXZlRWRpdHNUb2dnbGUgPSBMSUIuZ2V0Q29va2llKCdzYXZlRWRpdHNUb2dnbGVTdGF0ZScpLFxuICAgICAgbG9nbyA9IExJQi5nZXRDb29raWUoJ2xvZ28nKSxcbiAgICAgIGhlcm9CYWNrZ3JvdW5kID0gTElCLmdldENvb2tpZSgnaGVyb0JhY2tncm91bmQnKSxcbiAgICAgIGNvbG9yID0gTElCLmdldENvb2tpZSgnY29sb3InKSxcbiAgICAgIGRlZmF1bHRDb2xvciA9ICdyZ2IoNDIsIDgzLCAxMTIpJyxcbiAgICAgIGxvZ29PcmlnTWF4SGVpZ2h0ID0gJzU1JyxcbiAgICAgIG1rdG9NYWluVGV4dCA9ICdZb3UgVG8gT3VyIEV2ZW50JyxcbiAgICAgIG1rdG9TdWJUZXh0ID0gTElCLmdldEh1bWFuRGF0ZSgpLFxuICAgICAgY29tcGFueSxcbiAgICAgIGNvbXBhbnlOYW1lLFxuICAgICAgbGluZWFyR3JhZGllbnQsXG4gICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IChwaG9uZVJlcGVhdFJlYWR5Q291bnQgPSBzaWRlQnlTaWRlRGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSBzaWRlQnlTaWRlUGhvbmVSZXBlYXRSZWFkeUNvdW50ID0gMCksXG4gICAgICBtYXhSZXBlYXRSZWFkeSA9IDIwMDAsXG4gICAgICBtYXhPdGhlclJlcGVhdFJlYWR5ID0gMjAwMCxcbiAgICAgIGZvcm1hdEJ1dHRvblN0eWxlXG5cbiAgICBpZiAoc2F2ZUVkaXRzVG9nZ2xlID09ICd0cnVlJyB8fCAobG9nbyA9PSBudWxsICYmIGhlcm9CYWNrZ3JvdW5kID09IG51bGwgJiYgY29sb3IgPT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBpZiAobG9nbyAhPSBudWxsKSB7XG4gICAgICBjb21wYW55ID0gbG9nby5zcGxpdCgnaHR0cHM6Ly9sb2dvLmNsZWFyYml0LmNvbS8nKVsxXS5zcGxpdCgnLicpWzBdXG4gICAgICBjb21wYW55TmFtZSA9IGNvbXBhbnkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBjb21wYW55LnNsaWNlKDEpXG4gICAgICBta3RvTWFpblRleHQgPSBjb21wYW55TmFtZSArICcgSW52aXRlcyAnICsgbWt0b01haW5UZXh0XG4gICAgfSBlbHNlIHtcbiAgICAgIG1rdG9NYWluVGV4dCA9ICdXZSBJbnZpdGUgJyArIG1rdG9NYWluVGV4dFxuICAgIH1cblxuICAgIGlmIChjb2xvcikge1xuICAgICAgZm9ybUJ1dHRvblN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgICAgZm9ybUJ1dHRvblN0eWxlLnR5cGUgPSAndGV4dC9jc3MnXG4gICAgICBmb3JtQnV0dG9uU3R5bGUuaW5uZXJIVE1MID1cbiAgICAgICAgJy5ta3RvQnV0dG9uIHsgYmFja2dyb3VuZC1pbWFnZTogbm9uZSAhaW1wb3J0YW50OyBib3JkZXItcmFkaXVzOiAwICFpbXBvcnRhbnQ7IGJvcmRlcjogbm9uZSAhaW1wb3J0YW50OyBiYWNrZ3JvdW5kLWNvbG9yOiAnICtcbiAgICAgICAgY29sb3IgK1xuICAgICAgICAnICFpbXBvcnRhbnQ7IH0nXG4gICAgICBsaW5lYXJHcmFkaWVudCA9ICdsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAnICsgY29sb3IgKyAnLCByZ2IoMjQyLCAyNDIsIDI0MikpICFpbXBvcnRhbnQnXG4gICAgfVxuXG4gICAgY2xlYXJPdmVybGF5VmFycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9IZXJvQmdJbWdSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b1RleHRSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b1N1YlRleHRSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvT3JpZ1JlcGxhY2VkID1cbiAgICAgICAgZmFsc2VcbiAgICAgIGlmcmFtZUJvZHkgPVxuICAgICAgICBsb2dvSW1nID1cbiAgICAgICAgdGV4dEJhY2tncm91bmQgPVxuICAgICAgICBiYW5uZXJCYWNrZ3JvdW5kID1cbiAgICAgICAgbWFpblRpdGxlID1cbiAgICAgICAgc3ViVGl0bGUgPVxuICAgICAgICBta3RvSW1ncyA9XG4gICAgICAgIG1rdG9UZXh0cyA9XG4gICAgICAgIG1rdG9SaWNoVGV4dHMgPVxuICAgICAgICBta3RvQnV0dG9ucyA9XG4gICAgICAgIG51bGxcbiAgICB9XG5cbiAgICBvdmVybGF5ID0gZnVuY3Rpb24gKGlmcmFtZURvY3VtZW50KSB7XG4gICAgICBpZiAoaWZyYW1lRG9jdW1lbnQpIHtcbiAgICAgICAgbGV0IGlmcmFtZUJvZHkgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLFxuICAgICAgICAgIGxvZ29JbWcgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbHAtbG9nbycpLFxuICAgICAgICAgIHRleHRCYWNrZ3JvdW5kID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JhY2tncm91bmQtY29sb3InKSxcbiAgICAgICAgICBiYW5uZXJCYWNrZ3JvdW5kID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JpZ2dlci1iYWNrZ3JvdW5kJyksXG4gICAgICAgICAgbWFpblRpdGxlID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpdGxlJyksXG4gICAgICAgICAgc3ViVGl0bGUgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3ViLXRpdGxlJylcblxuICAgICAgICBpZiAoaWZyYW1lQm9keSAmJiBpZnJhbWVCb2R5LmlubmVySFRNTCkge1xuICAgICAgICAgIGxldCBta3RvSGVhZGVyID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2hlYWRlcicpWzBdLFxuICAgICAgICAgICAgbWt0b0xvZ28xID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2xvZ28nKVswXSxcbiAgICAgICAgICAgIG1rdG9Mb2dvMiA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdsb2dvJylbMV0sXG4gICAgICAgICAgICBta3RvSW1ncyA9IGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbHBpbWcnKSxcbiAgICAgICAgICAgIG1rdG9IZXJvQmcgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnaGVyb0JhY2tncm91bmQnKVswXSxcbiAgICAgICAgICAgIG1rdG9UaXRsZSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCd0aXRsZScpWzBdLFxuICAgICAgICAgICAgbWt0b1N1YnRpdGxlID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ3N1YnRpdGxlJylbMF0sXG4gICAgICAgICAgICBta3RvVGV4dHMgPSBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21rdG9UZXh0JyksXG4gICAgICAgICAgICBta3RvUmljaFRleHRzID0gaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdyaWNoVGV4dFNwYW4nKSxcbiAgICAgICAgICAgIG1rdG9CdXR0b24gPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnYnV0dG9uJylbMF0sXG4gICAgICAgICAgICBta3RvQnV0dG9ucyA9IGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2J1dHRvbicpXG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkICYmIGNvbG9yICYmIG1rdG9IZWFkZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBIZWFkZXIgQmFja2dyb3VuZCBDb21wYW55IENvbG9yIGZvciBEZW1vIFN2Y3MgVGVtcGxhdGUnKVxuICAgICAgICAgICAgbWt0b0hlYWRlci5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgbWt0b0hlYWRlci5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgKyAnOyBiYWNrZ3JvdW5kOiAnICsgbGluZWFyR3JhZGllbnQgKyAnOycpXG4gICAgICAgICAgICBpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGlzTWt0b0ZyZWVGb3JtID0gZmFsc2VcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgIWlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkICYmXG4gICAgICAgICAgICBjb2xvciAmJlxuICAgICAgICAgICAgIWJhbm5lckJhY2tncm91bmQgJiZcbiAgICAgICAgICAgIGlmcmFtZUJvZHkuaWQgPT0gbWt0b0JvZHlJZCAmJlxuICAgICAgICAgICAgaWZyYW1lQm9keS5jbGFzc05hbWUgIT0gbnVsbCAmJlxuICAgICAgICAgICAgaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JykgJiZcbiAgICAgICAgICAgIGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpWzBdICYmXG4gICAgICAgICAgICBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKVswXS5zdHlsZVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgaWYgKGlmcmFtZUJvZHkuY2xhc3NOYW1lLnNlYXJjaChta3RvRnJlZUZvcm1DbGFzc05hbWUpICE9IC0xKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEZyZWVmb3JtIExhbmRpbmcgUGFnZSBCYWNrZ3JvdW5kIENvbXBhbnkgQ29sb3InKVxuICAgICAgICAgICAgICBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKVswXS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvciArICcgIWltcG9ydGFudCdcbiAgICAgICAgICAgICAgaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgPSBpc01rdG9GcmVlRm9ybSA9IHRydWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEd1aWRlZCBMYW5kaW5nIFBhZ2UgQmFja2dyb3VuZCBDb21wYW55IENvbG9yJylcbiAgICAgICAgICAgICAgaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JylbMF0uc3R5bGUuYmFja2dyb3VuZCA9IGxpbmVhckdyYWRpZW50XG4gICAgICAgICAgICAgIGlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICBpc01rdG9GcmVlRm9ybSA9IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGZvcm1CdXR0b25TdHlsZSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0ltZ1JlcGxhY2VkICYmIGxvZ28gJiYgKG1rdG9Mb2dvMSB8fCBta3RvTG9nbzIgfHwgbWt0b0ltZ3MubGVuZ3RoICE9IDApKSB7XG4gICAgICAgICAgICBpZiAobWt0b0xvZ28xIHx8IG1rdG9Mb2dvMikge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvIGZvciBEZW1vIFN2Y3MgVGVtcGxhdGUnKVxuICAgICAgICAgICAgICBpZiAobWt0b0xvZ28xICYmIG1rdG9Mb2dvMS5nZXRBdHRyaWJ1dGUoJ2Rpc3BsYXknKSAhPSAnbm9uZScpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvIDEnKVxuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMS5zdHlsZS53aWR0aCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMS5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzEuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKG1rdG9Mb2dvMiAmJiBta3RvTG9nbzIuZ2V0QXR0cmlidXRlKCdkaXNwbGF5JykgIT0gJ25vbmUnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIENvbXBhbnkgTG9nbyAyJylcbiAgICAgICAgICAgICAgICBta3RvTG9nbzIuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzIuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28yLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG1rdG9JbWdzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b0ltZyA9IG1rdG9JbWdzW2lpXVxuXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnNyYyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZSAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZS50YWdOYW1lID09ICdESVYnICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlLmlkLnNlYXJjaChsb2dvUmVnZXgpICE9IC0xXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBHdWlkZWQgTGFuZGluZyBQYWdlIENvbXBhbnkgTG9nbycpXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zdHlsZS53aWR0aCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zcmMgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUudGFnTmFtZSA9PSAnU1BBTicgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUucGFyZW50Tm9kZSAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZS5wYXJlbnROb2RlLmNsYXNzTmFtZS5zZWFyY2gobG9nb1JlZ2V4KSAhPSAtMVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRnJlZWZvcm0gTGFuZGluZyBQYWdlIENvbXBhbnkgTG9nbycpXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zdHlsZS53aWR0aCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9IZXJvQmdJbWdSZXBsYWNlZCAmJiBoZXJvQmFja2dyb3VuZCAmJiAobWt0b0hlcm9CZyB8fCBta3RvSW1ncy5sZW5ndGggIT0gMCkpIHtcbiAgICAgICAgICAgIGlmIChta3RvSGVyb0JnICYmIG1rdG9IZXJvQmcuZ2V0QXR0cmlidXRlKCdzcmMnKSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBHdWlkZWQgTGFuZGluZyBQYWdlIEhlcm8gQ29tcGFueSBCYWNrZ3JvdW5kIGZvciBEZW1vIFN2Y3MgVGVtcGxhdGUnKVxuICAgICAgICAgICAgICBta3RvSGVyb0JnLnNldEF0dHJpYnV0ZSgnc3JjJywgaGVyb0JhY2tncm91bmQpXG4gICAgICAgICAgICAgIGlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG1rdG9JbWdzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b0ltZyA9IG1rdG9JbWdzW2lpXVxuXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdzcmMnKSAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdpZCcpICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ2lkJykuc2VhcmNoKGhlcm9CZ0ltZ0lkUmVnZXgpICE9IC0xXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBHdWlkZWQgTGFuZGluZyBQYWdlIEhlcm8gQ29tcGFueSBCYWNrZ3JvdW5kJylcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgaGVyb0JhY2tncm91bmQpXG4gICAgICAgICAgICAgICAgICBpc01rdG9IZXJvQmdJbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9CdXR0b25SZXBsYWNlZCAmJiBjb2xvciAmJiAobWt0b0J1dHRvbiB8fCBta3RvQnV0dG9ucy5sZW5ndGggIT0gMCkpIHtcbiAgICAgICAgICAgIGlmIChta3RvQnV0dG9uKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBCdXR0b24gQ29tcGFueSBDb2xvciBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgbWt0b0J1dHRvbi5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgJ3N0eWxlJyxcbiAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgKyAnOyBiYWNrZ3JvdW5kLWNvbG9yOiAnICsgY29sb3IgKyAnICFpbXBvcnRhbnQ7IGJvcmRlci1jb2xvcjogJyArIGNvbG9yICsgJyAhaW1wb3J0YW50OydcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBta3RvQnV0dG9ucy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9CdXR0b24gPSBta3RvQnV0dG9uc1tpaV1cblxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5zdHlsZSAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLmlubmVySFRNTCAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uaW5uZXJIVE1MLnNlYXJjaChidXR0b25UZXh0UmVnZXgpICE9IC0xXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgQnV0dG9uIENvbXBhbnkgQ29sb3InKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgICAnc3R5bGUnLFxuICAgICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgK1xuICAgICAgICAgICAgICAgICAgICAnOyBiYWNrZ3JvdW5kLWNvbG9yOiAnICtcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgK1xuICAgICAgICAgICAgICAgICAgICAnICFpbXBvcnRhbnQ7IGJvcmRlci1jb2xvcjogJyArXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yICtcbiAgICAgICAgICAgICAgICAgICAgJyAhaW1wb3J0YW50OydcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobG9nb0ltZyAmJiB0ZXh0QmFja2dyb3VuZCAmJiB0ZXh0QmFja2dyb3VuZC5zdHlsZSAmJiBiYW5uZXJCYWNrZ3JvdW5kICYmIGJhbm5lckJhY2tncm91bmQuc3R5bGUgJiYgbWFpblRpdGxlICYmIHN1YlRpdGxlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogT3JpZ2luYWwgTGFuZGluZyBQYWdlIENvbXBhbnkgTG9nbyAmIENvbG9yJylcbiAgICAgICAgICBpZiAobG9nbykge1xuICAgICAgICAgICAgbG9nb0ltZy5zcmMgPSBsb2dvXG5cbiAgICAgICAgICAgIGxvZ29JbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBsZXQgbG9nb0hlaWdodHNSYXRpbywgbG9nb1dpZHRoLCBsb2dvTmV3V2lkdGgsIGxvZ29OZXdIZWlnaHQsIGxvZ29TdHlsZVxuXG4gICAgICAgICAgICAgIGlmIChsb2dvSW1nLm5hdHVyYWxIZWlnaHQgJiYgbG9nb0ltZy5uYXR1cmFsSGVpZ2h0ID4gbG9nb09yaWdNYXhIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICBsb2dvSGVpZ2h0c1JhdGlvID0gbG9nb0ltZy5uYXR1cmFsSGVpZ2h0IC8gbG9nb09yaWdNYXhIZWlnaHRcbiAgICAgICAgICAgICAgICBsb2dvV2lkdGggPSBsb2dvSW1nLm5hdHVyYWxXaWR0aCAvIGxvZ29IZWlnaHRzUmF0aW9cbiAgICAgICAgICAgICAgICBsb2dvSW1nLndpZHRoID0gbG9nb0ltZy5zdHlsZS53aWR0aCA9IGxvZ29OZXdXaWR0aCA9IGxvZ29XaWR0aFxuICAgICAgICAgICAgICAgIGxvZ29JbWcuaGVpZ2h0ID0gbG9nb0ltZy5zdHlsZS5oZWlnaHQgPSBsb2dvTmV3SGVpZ2h0ID0gbG9nb09yaWdNYXhIZWlnaHRcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChsb2dvSW1nLm5hdHVyYWxIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICBsb2dvSW1nLndpZHRoID0gbG9nb0ltZy5zdHlsZS53aWR0aCA9IGxvZ29OZXdXaWR0aCA9IGxvZ29JbWcubmF0dXJhbFdpZHRoXG4gICAgICAgICAgICAgICAgbG9nb0ltZy5oZWlnaHQgPSBsb2dvSW1nLnN0eWxlLmhlaWdodCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvSW1nLm5hdHVyYWxIZWlnaHRcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2dvSW1nLndpZHRoID0gbG9nb0ltZy5oZWlnaHQgPSBsb2dvSW1nLnN0eWxlLndpZHRoID0gbG9nb0ltZy5zdHlsZS5oZWlnaHQgPSBsb2dvTmV3V2lkdGggPSBsb2dvTmV3SGVpZ2h0ID0gbG9nb09yaWdNYXhIZWlnaHRcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpICYmIGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0pIHtcbiAgICAgICAgICAgICAgICBsb2dvU3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gICAgICAgICAgICAgICAgbG9nb1N0eWxlLmlubmVySFRNTCA9XG4gICAgICAgICAgICAgICAgICAnIycgKyBsb2dvSW1nLmlkICsgJyB7d2lkdGggOiAnICsgbG9nb05ld1dpZHRoICsgJ3B4ICFpbXBvcnRhbnQ7IGhlaWdodCA6ICcgKyBsb2dvTmV3SGVpZ2h0ICsgJ3B4ICFpbXBvcnRhbnQ7fSdcbiAgICAgICAgICAgICAgICBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGxvZ29TdHlsZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBPcmlnaW5hbCBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvIERpbWVuc2lvbnMgPSAnICsgbG9nb05ld1dpZHRoICsgJyB4ICcgKyBsb2dvTmV3SGVpZ2h0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjb2xvcikge1xuICAgICAgICAgICAgdGV4dEJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3JcbiAgICAgICAgICAgIGJhbm5lckJhY2tncm91bmQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3JcbiAgICAgICAgICAgIGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoZm9ybUJ1dHRvblN0eWxlKVxuICAgICAgICAgIH1cbiAgICAgICAgICBtYWluVGl0bGUuaW5uZXJIVE1MID0gbWt0b01haW5UZXh0XG4gICAgICAgICAgc3ViVGl0bGUuaW5uZXJIVE1MID0gbWt0b1N1YlRleHRcbiAgICAgICAgICBpc01rdG9PcmlnUmVwbGFjZWQgPSBpc01rdG9GcmVlRm9ybSA9IHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAoaXNNa3RvQnV0dG9uUmVwbGFjZWQgJiZcbiAgICAgICAgICAgIC8vJiYgaXNNa3RvU3ViVGV4dFJlcGxhY2VkXG4gICAgICAgICAgICAvLyYmIGlzTWt0b1RleHRSZXBsYWNlZFxuICAgICAgICAgICAgaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgJiZcbiAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkICYmXG4gICAgICAgICAgICBpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCkgfHxcbiAgICAgICAgICBpc01rdG9PcmlnUmVwbGFjZWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgaXNMYW5kaW5nUGFnZUVkaXRvciA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoYWN0aW9uID09ICdlZGl0Jykge1xuICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgRGVzaWduZXInKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAob3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHwgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPj0gbWF4UmVwZWF0UmVhZHkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogTGFuZGluZyBQYWdlIERlc2t0b3AgRGVzaWduZXIgPSAnICsgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc0Rlc2t0b3BSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAoZGVza3RvcFByZXZSZWFkeSkge1xuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBpc01rdG9GcmVlRm9ybSAmJlxuICAgICAgICAgICFpc1Bob25lUmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fCBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPj0gbWF4UmVwZWF0UmVhZHkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogRnJlZWZvcm0gTGFuZGluZyBQYWdlIFBob25lIERlc2lnbmVyID0gJyArIHBob25lUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzUGhvbmVSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAocGhvbmVQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIHBob25lUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBob25lUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICghaXNNa3RvRnJlZUZvcm0gJiZcbiAgICAgICAgICAgIGlzRGVza3RvcFJlcGxhY2VkICYmXG4gICAgICAgICAgICAhZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXS5pbm5lckhUTUwpIHx8XG4gICAgICAgICAgKGlzTWt0b0ZyZWVGb3JtICYmIGlzUGhvbmVSZXBsYWNlZCAmJiBpc0Rlc2t0b3BSZXBsYWNlZClcbiAgICAgICAgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIEludGVydmFsIGlzIENsZWFyZWQnKVxuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzTGFuZGluZ1BhZ2VFZGl0b3IpXG4gICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT0gJ3ByZXZpZXcnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBQcmV2aWV3ZXInKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWlzRGVza3RvcFJlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAob3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHwgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPj0gbWF4UmVwZWF0UmVhZHkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogTGFuZGluZyBQYWdlIERlc2t0b3AgUHJldmlldyA9ICcgKyBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzRGVza3RvcFJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChkZXNrdG9wUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc1Bob25lUmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fCBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPj0gbWF4T3RoZXJSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBMYW5kaW5nIFBhZ2UgUGhvbmUgUHJldmlldyA9ICcgKyBwaG9uZVJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc1Bob25lUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKHBob25lUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBwaG9uZVJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIHBob25lUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBob25lUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhaXNTaWRlQnlTaWRlRGVza3RvcFJlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fFxuICAgICAgICAgICAgc2lkZUJ5U2lkZURlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID49IG1heE90aGVyUmVwZWF0UmVhZHlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogTGFuZGluZyBQYWdlIFNpZGUgYnkgU2lkZSBEZXNrdG9wIFByZXZpZXcgPSAnICsgc2lkZUJ5U2lkZURlc2t0b3BSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNTaWRlQnlTaWRlRGVza3RvcFJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChzaWRlQnlTaWRlRGVza3RvcFByZXZSZWFkeSkge1xuICAgICAgICAgICAgc2lkZUJ5U2lkZURlc2t0b3BSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2lkZUJ5U2lkZURlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBzaWRlQnlTaWRlRGVza3RvcFByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzaWRlQnlTaWRlRGVza3RvcFByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWlzU2lkZUJ5U2lkZVBob25lUmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8XG4gICAgICAgICAgICBzaWRlQnlTaWRlUGhvbmVSZXBlYXRSZWFkeUNvdW50ID49IG1heE90aGVyUmVwZWF0UmVhZHlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogTGFuZGluZyBQYWdlIFNpZGUgYnkgU2lkZSBQaG9uZSBQcmV2aWV3ID0gJyArIHNpZGVCeVNpZGVQaG9uZVJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc1NpZGVCeVNpZGVQaG9uZVJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChzaWRlQnlTaWRlUGhvbmVQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzaWRlQnlTaWRlUGhvbmVSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBzaWRlQnlTaWRlUGhvbmVQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2lkZUJ5U2lkZVBob25lUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1NpZGVCeVNpZGVQaG9uZVJlcGxhY2VkICYmIGlzU2lkZUJ5U2lkZURlc2t0b3BSZXBsYWNlZCAmJiBpc1Bob25lUmVwbGFjZWQgJiYgaXNEZXNrdG9wUmVwbGFjZWQpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgSW50ZXJ2YWwgaXMgQ2xlYXJlZCcpXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNMYW5kaW5nUGFnZUVkaXRvcilcbiAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgMClcbiAgfSxcblxuICBnZXRQcm9ncmFtQXNzZXREZXRhaWxzOiBmdW5jdGlvbiAocHJvZ3JhbUNvbXBJZCkge1xuICAgIGxldCByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICcvbWFya2V0aW5nRXZlbnQvZ2V0TG9jYWxBc3NldERldGFpbHMnLFxuICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgJyZjb21wSWQ9JyArXG4gICAgICBwcm9ncmFtQ29tcElkICtcbiAgICAgICcmeHNyZklkPScgK1xuICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAnUE9TVCcsXG4gICAgICBmYWxzZSxcbiAgICAgICcnLFxuICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UpXG4gICAgICAgIGlmIChcbiAgICAgICAgICByZXNwb25zZSAmJlxuICAgICAgICAgIHJlc3BvbnNlLkpTT05SZXN1bHRzICYmXG4gICAgICAgICAgcmVzcG9uc2UuSlNPTlJlc3VsdHMubG9jYWxBc3NldEluZm8gJiZcbiAgICAgICAgICAocmVzcG9uc2UuSlNPTlJlc3VsdHMubG9jYWxBc3NldEluZm8uc21hcnRDYW1wYWlnbnMgfHxcbiAgICAgICAgICAgIChyZXNwb25zZS5KU09OUmVzdWx0cy5sb2NhbEFzc2V0SW5mby5hc3NldExpc3RbMF0gJiYgcmVzcG9uc2UuSlNPTlJlc3VsdHMubG9jYWxBc3NldEluZm8uYXNzZXRMaXN0WzBdLnRyZWUpKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuSlNPTlJlc3VsdHMubG9jYWxBc3NldEluZm9cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sXG5cbiAgZ2V0UHJvZ3JhbVNldHRpbmdzOiBmdW5jdGlvbiAocHJvZ3JhbVRyZWVOb2RlKSB7XG4gICAgbGV0IHJlc3VsdCA9IExJQi53ZWJSZXF1ZXN0KFxuICAgICAgJy9tYXJrZXRpbmdFdmVudC9nZXRQcm9ncmFtU2V0dGluZ3NEYXRhJyxcbiAgICAgICcmc3RhcnQ9MCcgK1xuICAgICAgJyZxdWVyeT0nICtcbiAgICAgICcmY29tcElkPScgK1xuICAgICAgcHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCArXG4gICAgICAnJmNvbXBUeXBlPScgK1xuICAgICAgcHJvZ3JhbVRyZWVOb2RlLmNvbXBUeXBlICtcbiAgICAgICcmeHNyZklkPScgK1xuICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAnUE9TVCcsXG4gICAgICBmYWxzZSxcbiAgICAgICcnLFxuICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UpXG4gICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LFxuXG4gIGdldFRhZ3M6IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgcmVzdWx0ID0gTElCLndlYlJlcXVlc3QoXG4gICAgICAnL21hcmtldGluZ0V2ZW50L2dldEFsbERlc2NyaXB0b3JzJyxcbiAgICAgICcmc3RhcnQ9MCcgKyAnJnhzcmZJZD0nICsgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAnUE9TVCcsXG4gICAgICBmYWxzZSxcbiAgICAgICcnLFxuICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UpXG4gICAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgICAgbGV0IGN1cnJUYWcsXG4gICAgICAgICAgICBqaiA9IDAsXG4gICAgICAgICAgICBjdXN0b21UYWdzID0gW11cbiAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgcmVzcG9uc2UuZGF0YS5kZXNjcmlwdG9ycy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgIGN1cnJUYWcgPSByZXNwb25zZS5kYXRhLmRlc2NyaXB0b3JzW2lpXVxuICAgICAgICAgICAgaWYgKGN1cnJUYWcudHlwZSAhPSAnY2hhbm5lbCcpIHtcbiAgICAgICAgICAgICAgY3VzdG9tVGFnc1tqal0gPSBjdXJyVGFnXG4gICAgICAgICAgICAgIGpqKytcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGN1c3RvbVRhZ3NcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sXG5cbiAgYXBwbHlNYXNzQ2xvbmU6IGZ1bmN0aW9uIChPQkosIGZvcmNlUmVsb2FkKSB7XG4gICAgY29uc29sZS5sb2coJz4gQXBwbHlpbmc6IE1hc3MgQ2xvbmUgTWVudSBJdGVtJylcbiAgICBsZXQgbWFzc0Nsb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMudHJpZ2dlcmVkRnJvbSA9PSAndHJlZScgJiYgdGhpcy5nZXQoJ25ld0xvY2FsQXNzZXQnKSkge1xuICAgICAgICBsZXQgbWFzc0Nsb25lSXRlbSA9IHRoaXMuZ2V0KCduZXdMb2NhbEFzc2V0JykuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICBtYXNzQ2xvbmVJdGVtSWQgPSAnY2xvbmVWZXJ0aWNhbCcsXG4gICAgICAgICAgY3VyckV4cE5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZCh0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuaWQpXG5cbiAgICAgICAgaWYgKCF0aGlzLmdldChtYXNzQ2xvbmVJdGVtSWQpKSB7XG4gICAgICAgICAgbWFzc0Nsb25lSXRlbS5pdGVtSWQgPSBtYXNzQ2xvbmVJdGVtSWRcbiAgICAgICAgICBtYXNzQ2xvbmVJdGVtLnRleHQgPSAnTWFzcyBDbG9uZSdcbiAgICAgICAgICBtYXNzQ2xvbmVJdGVtLnNldEhhbmRsZXIoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBsZXQgY2xvbmVGb3JtID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIGNsb25lRnJvbUZpZWxkID0gY2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2xvbmUgRnJvbScpWzBdLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkID0gY2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2xvbmUgVG8nKVswXS5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZCA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe1xuICAgICAgICAgICAgICAgIGNsb25lRnJvbUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wSWQsXG4gICAgICAgICAgICAgICAgY2xvbmVOYW1lOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0LFxuICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2xvbmUgVG8nKVswXVxuICAgICAgICAgICAgICAgIC5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZCA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe1xuICAgICAgICAgICAgICAgIGNsb25lRnJvbUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wSWQsXG4gICAgICAgICAgICAgICAgY2xvbmVOYW1lOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0LFxuICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2xvbmUgVG8nKVswXVxuICAgICAgICAgICAgICAgIC5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZCA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe1xuICAgICAgICAgICAgICAgIGNsb25lRnJvbUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wSWQsXG4gICAgICAgICAgICAgICAgY2xvbmVOYW1lOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0LFxuICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2xvbmUgVG8nKVswXVxuICAgICAgICAgICAgICAgIC5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0RmllbGQgPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5kKCdmaWVsZExhYmVsJywgJ05hbWUnKVswXVxuICAgICAgICAgICAgICAgIC5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgICAgICB0YWdOYW1lRmllbGQgPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZCA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe1xuICAgICAgICAgICAgICAgIGNsb25lRnJvbUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wSWQsXG4gICAgICAgICAgICAgICAgY2xvbmVOYW1lOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0LFxuICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2xvbmUgVG8nKVswXVxuICAgICAgICAgICAgICAgIC5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7Y3Vyck5vZGU6IHRoaXMub3duZXJDdC5jdXJyTm9kZX0pLFxuICAgICAgICAgICAgICBjdXN0b21UYWdzLFxuICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnLFxuICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnTmFtZSxcbiAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ1ZhbHVlXG4gICAgICAgICAgICBlbC5wYXJlbnRNZW51LmhpZGUodHJ1ZSlcblxuICAgICAgICAgICAgbGV0IGlzQ2xvbmVWZXJ0aWNhbEZvcm0gPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uYnV0dG9uc1sxXSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uYnV0dG9uc1sxXS5zZXRIYW5kbGVyICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5uZWwnKVswXSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDaGFubmVsJylbMF0uZGVzdHJveSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdEZXNjcmlwdGlvbicpWzBdICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0Rlc2NyaXB0aW9uJylbMF0uZGVzdHJveSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdQcm9ncmFtIFR5cGUnKVswXSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdQcm9ncmFtIFR5cGUnKVswXS5kZXN0cm95ICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0NhbXBhaWduIEZvbGRlcicpWzBdICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0NhbXBhaWduIEZvbGRlcicpWzBdLmZpZWxkTGFiZWwgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmFtZScpWzBdICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ05hbWUnKVswXS5maWVsZExhYmVsICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pdGVtcy5sYXN0KCkuc2V0VGV4dCAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaXRlbXMubGFzdCgpLnNldFZpc2libGUgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLnNldFdpZHRoICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5zZXRIZWlnaHRcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNDbG9uZVZlcnRpY2FsRm9ybSlcblxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2V0VGl0bGUoJ01hc3MgQ2xvbmUnKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uYnV0dG9uc1sxXS5zZXRUZXh0KCdDbG9uZScpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5idXR0b25zWzFdLmN1cnJOb2RlID0gbWFzc0Nsb25lRm9ybS5jdXJyTm9kZVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDaGFubmVsJylbMF0uZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0Rlc2NyaXB0aW9uJylbMF0uZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ1Byb2dyYW0gVHlwZScpWzBdLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDYW1wYWlnbiBGb2xkZXInKVswXS5maWVsZExhYmVsID0gJ0Nsb25lIFRvJ1xuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdOYW1lJylbMF0uZmllbGRMYWJlbCA9ICdQcm9ncmFtIFN1ZmZpeCdcblxuICAgICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkLmZpZWxkTGFiZWwgPSAnU2hvdyBNb3JlIE9wdGlvbnMnXG4gICAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQuaXRlbUNscyA9ICcnXG4gICAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQuc3RvcmUuZGF0YS5pdGVtc1swXS5zZXQoJ3RleHQnLCAnTm8nKVxuICAgICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMV0uc2V0KCd0ZXh0JywgJ1llcycpXG5cbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5maWVsZExhYmVsID0gJ1NDIEFjdGl2YXRpb24gU3RhdGUnXG4gICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQuaXRlbUNscyA9ICcnXG4gICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQuc3RvcmUuZGF0YS5pdGVtc1swXS5zZXQoJ3RleHQnLCAnSW5oZXJpdCBTdGF0ZScpXG4gICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQuc3RvcmUuZGF0YS5pdGVtc1sxXS5zZXQoJ3RleHQnLCAnRm9yY2UgQWN0aXZhdGUnKVxuXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQuZmllbGRMYWJlbCA9ICdQZXJpb2QgQ29zdCBEYXRhJ1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLml0ZW1DbHMgPSAnJ1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMF0uc2V0KCd0ZXh0JywgJ0luaGVyaXQgRGF0YScpXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQuc3RvcmUuZGF0YS5pdGVtc1sxXS5zZXQoJ3RleHQnLCAnQmFzZWxpbmUgRGF0YScpXG5cbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5maWVsZExhYmVsID0gJ1BlcmlvZCBDb3N0IE1vbnRocydcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5pdGVtQ2xzID0gJ21rdFJlcXVpcmVkJ1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMF0uc2V0KCd0ZXh0JywgJzEyIE1vbnRocycpXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQuc3RvcmUuZGF0YS5pdGVtc1sxXS5zZXQoJ3RleHQnLCAnMjQgTW9udGhzJylcblxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXRGaWVsZC5maWVsZExhYmVsID0gJ1BlcmlvZCBDb3N0IE9mZnNldCdcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0RmllbGQuaXRlbUNscyA9ICcnXG5cbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQuZmllbGRMYWJlbCA9ICdDaGFuZ2UgVGFnIFR5cGUnXG4gICAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkLml0ZW1DbHMgPSAnJ1xuXG4gICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5maWVsZExhYmVsID0gJ05ldyBUYWcgVmFsdWUnXG4gICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5pdGVtQ2xzID0gJ21rdFJlcXVpcmVkJ1xuXG4gICAgICAgICAgICAgICAgbGV0IG9yaWdPblNlbGVjdCA9IHNob3dNb3JlT3B0aW9uc0ZpZWxkLm9uU2VsZWN0XG4gICAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQub25TZWxlY3QgPSBmdW5jdGlvbiAoZG9Gb2N1cykge1xuICAgICAgICAgICAgICAgICAgb3JpZ09uU2VsZWN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnU0MgQWN0aXZhdGlvbiBTdGF0ZScpWzBdLmxhYmVsLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnU0MgQWN0aXZhdGlvbiBTdGF0ZScpWzBdLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgRGF0YScpWzBdLmxhYmVsLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgRGF0YScpWzBdLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbmdlIFRhZyBUeXBlJylbMF0ubGFiZWwuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdDaGFuZ2UgVGFnIFR5cGUnKVswXS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdTQyBBY3RpdmF0aW9uIFN0YXRlJylbMF0ubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnU0MgQWN0aXZhdGlvbiBTdGF0ZScpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IERhdGEnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBEYXRhJylbMF0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbmdlIFRhZyBUeXBlJylbMF0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbmdlIFRhZyBUeXBlJylbMF0ubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgT2Zmc2V0JylbMF0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgT2Zmc2V0JylbMF0ubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgTW9udGhzJylbMF0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgTW9udGhzJylbMF0ubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQub25TZWxlY3QgPSBmdW5jdGlvbiAoZG9Gb2N1cykge1xuICAgICAgICAgICAgICAgICAgb3JpZ09uU2VsZWN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgTW9udGhzJylbMF0ubGFiZWwuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLmxhYmVsLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgT2Zmc2V0JylbMF0uc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgT2Zmc2V0JylbMF0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgT2Zmc2V0JylbMF0ubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgTW9udGhzJylbMF0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgTW9udGhzJylbMF0ubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkLm9uU2VsZWN0ID0gZnVuY3Rpb24gKGRvRm9jdXMpIHtcbiAgICAgICAgICAgICAgICAgIG9yaWdPblNlbGVjdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdOZXcgVGFnIFZhbHVlJylbMF0ubGFiZWwuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdOZXcgVGFnIFZhbHVlJylbMF0uc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmV3IFRhZyBWYWx1ZScpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ05ldyBUYWcgVmFsdWUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KDAsIGNsb25lRnJvbUZpZWxkKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgc2hvd01vcmVPcHRpb25zRmllbGQpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQobWFzc0Nsb25lRm9ybS5pdGVtcy5sZW5ndGggLSAxLCBzY0FjdGl2YXRpb25GaWVsZClcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgcGVyaW9kQ29zdENsb25lRmllbGQpXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHBlcmlvZENvc3RNb250aEZpZWxkKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQobWFzc0Nsb25lRm9ybS5pdGVtcy5sZW5ndGggLSAxLCBwZXJpb2RDb3N0T2Zmc2V0RmllbGQpXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldEZpZWxkLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQobWFzc0Nsb25lRm9ybS5pdGVtcy5sZW5ndGggLSAxLCB0YWdOYW1lRmllbGQpXG4gICAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQobWFzc0Nsb25lRm9ybS5pdGVtcy5sZW5ndGggLSAxLCB0YWdWYWx1ZUZpZWxkKVxuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQuc2V0VmlzaWJsZShmYWxzZSlcblxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uYnV0dG9uc1sxXS5zZXRIYW5kbGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgIGxldCB3YWl0TXNnID0gbmV3IEV4dC5XaW5kb3coe1xuICAgICAgICAgICAgICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbW9kYWw6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiA1MjAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogMjI1LFxuICAgICAgICAgICAgICAgICAgICBjbHM6ICdta3RNb2RhbEZvcm0nLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1BsZWFzZSBXYWl0IC4uLicsXG4gICAgICAgICAgICAgICAgICAgIGh0bWw6XG4gICAgICAgICAgICAgICAgICAgICAgJzxiPk1hc3MgQ2xvbmluZzo8L2I+ICA8aT4nICtcbiAgICAgICAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmN1cnJOb2RlLnRleHQgK1xuICAgICAgICAgICAgICAgICAgICAgICc8L2k+PGJyPjxicj5UaGlzIG1heSB0YWtlIHNldmVyYWwgbWludXRlcyBkZXBlbmRpbmcgb24gdGhlIHF1YW50aXR5IG9mIHByb2dyYW1zIGFuZCBhc3NldHMgY29udGFpbmVkIHRoZXJlaW4uJ1xuICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgIGNsb25lVG9Gb2xkZXJJZCA9IG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIGNsb25lVG9TdWZmaXggPSBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUHJvZ3JhbSBTdWZmaXgnKVswXS5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICBjbG9uZVRvVHJlZU5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChjbG9uZVRvRm9sZGVySWQpLFxuICAgICAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25TdGF0ZSA9IHNjQWN0aXZhdGlvbkZpZWxkLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZSA9IHBlcmlvZENvc3RDbG9uZUZpZWxkLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXQgPSBwZXJpb2RDb3N0T2Zmc2V0RmllbGQuZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSA9IHRhZ05hbWVGaWVsZC5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICB0YWdWYWx1ZSA9IHRhZ1ZhbHVlRmllbGQuZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgc2NGb3JjZUFjdGl2YXRlLFxuICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdCxcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoLFxuICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMsXG4gICAgICAgICAgICAgICAgICAgIF90aGlzID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgd2FpdE1zZ1Nob3dcblxuICAgICAgICAgICAgICAgICAgaWYgKHNjQWN0aXZhdGlvblN0YXRlID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NGb3JjZUFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2NGb3JjZUFjdGl2YXRlID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKHBlcmlvZENvc3RDbG9uZSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGluaGVyaXRQZXJpb2RDb3N0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3QgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGggPSBwZXJpb2RDb3N0TW9udGhGaWVsZC5nZXRWYWx1ZSgpXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHBlcmlvZENvc3RNb250aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID0gMTJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwZXJpb2RDb3N0TW9udGggPT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyA9IDI0XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID0gMFxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc051bWJlcihwYXJzZUludChwZXJpb2RDb3N0T2Zmc2V0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0ID0gbnVsbFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uY2xvc2UoKVxuICAgICAgICAgICAgICAgICAgd2FpdE1zZ1Nob3cgPSB3YWl0TXNnLnNob3coKVxuICAgICAgICAgICAgICAgICAgT0JKLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ01hc3MgQ2xvbmUnLCBhc3NldE5hbWU6ICdUb29sJ30pXG5cbiAgICAgICAgICAgICAgICAgIGxldCBpc1dhaXRNc2dTaG93ID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdhaXRNc2dTaG93KSB7XG4gICAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNXYWl0TXNnU2hvdylcbiAgICAgICAgICAgICAgICAgICAgICBsZXQgY3VyclRyZWVOb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVGb2xkZXJSZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2VcblxuICAgICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIEZvbGRlclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBfdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNoaWxkcmVuICYmIGlpIDwgX3RoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jaGlsZHJlbi5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyclRyZWVOb2RlID0gX3RoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jaGlsZHJlbltpaV1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VyclRyZWVOb2RlLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3MgQ2xvbmUgQCBGb2xkZXIgd2l0aCBGb2xkZXIgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZUZvbGRlclJlc3BvbnNlID0gTElCLmNsb25lRm9sZGVyKGN1cnJUcmVlTm9kZS50ZXh0LCBjbG9uZVRvU3VmZml4LCBjbG9uZVRvRm9sZGVySWQpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVGb2xkZXJSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgamogPSAwOyBjdXJyVHJlZU5vZGUuY2hpbGRyZW4gJiYgamogPCBjdXJyVHJlZU5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBqaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyVHJlZU5vZGUuY2hpbGRyZW5bampdLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3MgQ2xvbmUgQCBGb2xkZXIgd2l0aCBGb2xkZXIgZGVwdGggb2YgMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjdXJyRm9sZGVyVHJlZU5vZGUgPSBjdXJyVHJlZU5vZGUuY2hpbGRyZW5bampdXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZUZvbGRlclJlc3BvbnNlID0gTElCLmNsb25lRm9sZGVyKGN1cnJGb2xkZXJUcmVlTm9kZS50ZXh0LCBjbG9uZVRvU3VmZml4LCBjdXJyRm9sZGVyVHJlZU5vZGUuaWQpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVGb2xkZXJSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGtrID0gMDsgY3VyckZvbGRlclRyZWVOb2RlLmNoaWxkcmVuICYmIGtrIDwgY3VyckZvbGRlclRyZWVOb2RlLmNoaWxkcmVuLmxlbmd0aDsga2srKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSA9IGN1cnJGb2xkZXJUcmVlTm9kZS5jaGlsZHJlbltra11cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZSA9IExJQi5jbG9uZVByb2dyYW0oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVUb1N1ZmZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZUZvbGRlclJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lUHJvZ3JhbVJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyhjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpbmhlcml0UGVyaW9kQ29zdCB8fCBudW1PZlBlcmlvZENvc3RNb250aHMgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lUGVyaW9kQ29zdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQocGVyaW9kQ29zdE9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaGVyaXRQZXJpb2RDb3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBJZDogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBUeXBlOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiYgdGFnTmFtZSAmJiB0YWdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1UYWcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ1ZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lTnVydHVyZUNhZGVuY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSA9IExJQi5jbG9uZVNtYXJ0Q2FtcGFpZ25TdGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVJlcG9ydEZpbHRlcihnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXNzIENsb25lIEAgRm9sZGVyIHdpdGggRm9sZGVyIGRlcHRoIG9mIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSA9IGN1cnJUcmVlTm9kZS5jaGlsZHJlbltqal1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlID0gTElCLmNsb25lUHJvZ3JhbShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lVG9TdWZmaXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZUZvbGRlclJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lUHJvZ3JhbVJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5oZXJpdFBlcmlvZENvc3QgfHwgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVQZXJpb2RDb3N0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHBlcmlvZENvc3RPZmZzZXQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaGVyaXRQZXJpb2RDb3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcElkOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wVHlwZTogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiYgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJiB0YWdOYW1lICYmIHRhZ1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtVGFnKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ1ZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVOdXJ0dXJlQ2FkZW5jZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSA9IExJQi5jbG9uZVNtYXJ0Q2FtcGFpZ25TdGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1SZXBvcnRGaWx0ZXIoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3MgQ2xvbmUgQCBGb2xkZXIgd2l0aCBQcm9ncmFtIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlID0gY3VyclRyZWVOb2RlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZSA9IExJQi5jbG9uZVByb2dyYW0oY2xvbmVUb1N1ZmZpeCwgY2xvbmVUb0ZvbGRlcklkLCBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyhjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGluaGVyaXRQZXJpb2RDb3N0IHx8IG51bU9mUGVyaW9kQ29zdE1vbnRocyA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lUGVyaW9kQ29zdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludChwZXJpb2RDb3N0T2Zmc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBJZDogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcFR5cGU6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiYgdGFnTmFtZSAmJiB0YWdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVRhZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lTnVydHVyZUNhZGVuY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UgPSBMSUIuY2xvbmVTbWFydENhbXBhaWduU3RhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NGb3JjZUFjdGl2YXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtUmVwb3J0RmlsdGVyKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXNzIENsb25lIEAgUHJvZ3JhbVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlID0gX3RoaXMuY3Vyck5vZGUuYXR0cmlidXRlc1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZSA9IExJQi5jbG9uZVByb2dyYW0oY2xvbmVUb1N1ZmZpeCwgY2xvbmVUb0ZvbGRlcklkLCBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lUHJvZ3JhbVJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3MoY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGluaGVyaXRQZXJpb2RDb3N0IHx8IG51bU9mUGVyaW9kQ29zdE1vbnRocyA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZVBlcmlvZENvc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludChwZXJpb2RDb3N0T2Zmc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaGVyaXRQZXJpb2RDb3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wSWQ6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcFR5cGU6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJiBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmIHRhZ05hbWUgJiYgdGFnVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVRhZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ1ZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZU51cnR1cmVDYWRlbmNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSA9IExJQi5jbG9uZVNtYXJ0Q2FtcGFpZ25TdGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtUmVwb3J0RmlsdGVyKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBMSUIucmVsb2FkTWFya2V0aW5nQWN0aXZpdGVzKClcbiAgICAgICAgICAgICAgICAgICAgICB3YWl0TXNnLmNsb3NlKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5zaG93KClcbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5vblNlbGVjdChzaG93TW9yZU9wdGlvbnNGaWVsZC5maW5kUmVjb3JkKCd0ZXh0JywgJ05vJykpXG4gICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQub25TZWxlY3Qoc2NBY3RpdmF0aW9uRmllbGQuZmluZFJlY29yZCgndGV4dCcsICdJbmhlcml0IFN0YXRlJykpXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQub25TZWxlY3QocGVyaW9kQ29zdENsb25lRmllbGQuZmluZFJlY29yZCgndGV4dCcsICdJbmhlcml0IERhdGEnKSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLnNldFdpZHRoKDUyNSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLnNldEhlaWdodCg1NjApXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pdGVtcy5sYXN0KCkuc2V0VGV4dCgnUHJvZ3JhbXMgdGhhdCBoYXZlIGEgZm9sZGVyIGRlcHRoIGdyZWF0ZXIgdGhhbiAyIHdpbGwgbm90IGJlIGNsb25lZC4nKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaXRlbXMubGFzdCgpLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQubGFiZWwuZG9tLmlubmVySFRNTCA9ICcmbmJzcDsmbmJzcDsmbmJzcDsgTW9udGhzOidcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXRGaWVsZC5sYWJlbC5kb20uaW5uZXJIVE1MID0gJyZuYnNwOyZuYnNwOyZuYnNwOyBDb3N0IE9mZnNldCAoKy8tKTonXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldEZpZWxkLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5sYWJlbC5kb20uaW5uZXJIVE1MID0gJyZuYnNwOyZuYnNwOyZuYnNwOyBOZXcgVGFnIFZhbHVlOidcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgY3VzdG9tVGFncyA9IExJQi5nZXRUYWdzKClcbiAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnTmFtZSA9IHRhZ05hbWVGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLmNvcHkoMClcbiAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnVmFsdWUgPSB0YWdWYWx1ZUZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMF0uY29weSgwKVxuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5zdG9yZS5yZW1vdmVBbGwodHJ1ZSlcbiAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLnN0b3JlLnJlbW92ZUFsbCh0cnVlKVxuICAgICAgICAgICAgICAgIGxldCBpc0N1c3RvbVRhZ3MgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgaWYgKGN1c3RvbVRhZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNDdXN0b21UYWdzKVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBjdXN0b21UYWdzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWcgPSBjdXN0b21UYWdzW2lpXVxuICAgICAgICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdOYW1lID0gY3VyckN1c3RvbVRhZ05hbWUuY29weShjdXJyQ3VzdG9tVGFnLm5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ05hbWUuc2V0KCd0ZXh0JywgY3VyckN1c3RvbVRhZy5uYW1lKVxuICAgICAgICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdOYW1lLmRhdGEuaWQgPSBjdXJyQ3VzdG9tVGFnLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQuc3RvcmUuYWRkKGN1cnJDdXN0b21UYWdOYW1lKVxuXG4gICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgamogPSAwOyBqaiA8IGN1cnJDdXN0b21UYWcudmFsdWVzLmxlbmd0aDsgamorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ1ZhbHVlID0gY3VyckN1c3RvbVRhZ1ZhbHVlLmNvcHkoY3VyckN1c3RvbVRhZy52YWx1ZXNbampdLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ1ZhbHVlLnNldCgndGV4dCcsIGN1cnJDdXN0b21UYWcudmFsdWVzW2pqXS52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdWYWx1ZS5kYXRhLmlkID0gY3VyckN1c3RvbVRhZy52YWx1ZXNbampdLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLnN0b3JlLmFkZChjdXJyQ3VzdG9tVGFnVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ2V0KG1hc3NDbG9uZUl0ZW1JZCkpIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAodGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJyAmJlxuICAgICAgICAgICAgICAhdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLm1hcmtldGluZ1Byb2dyYW1JZCAmJlxuICAgICAgICAgICAgICBjdXJyRXhwTm9kZSAmJlxuICAgICAgICAgICAgICBjdXJyRXhwTm9kZS5pc0V4cGFuZGFibGUoKSkgfHxcbiAgICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIFByb2dyYW0nIHx8XG4gICAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScgfHxcbiAgICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEV2ZW50JyB8fFxuICAgICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdFbWFpbCBCYXRjaCBQcm9ncmFtJyB8fFxuICAgICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdJbi1BcHAgUHJvZ3JhbSdcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChmb3JjZVJlbG9hZCkge1xuICAgICAgICAgICAgICB0aGlzLmdldChtYXNzQ2xvbmVJdGVtSWQpLmRlc3Ryb3koKVxuICAgICAgICAgICAgICB0aGlzLmFkZEl0ZW0obWFzc0Nsb25lSXRlbSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuZ2V0KG1hc3NDbG9uZUl0ZW1JZCkuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmdldChtYXNzQ2xvbmVJdGVtSWQpLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICh0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInICYmXG4gICAgICAgICAgICAhdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLm1hcmtldGluZ1Byb2dyYW1JZCAmJlxuICAgICAgICAgICAgY3VyckV4cE5vZGUgJiZcbiAgICAgICAgICAgIGN1cnJFeHBOb2RlLmlzRXhwYW5kYWJsZSgpKSB8fFxuICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIFByb2dyYW0nIHx8XG4gICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nIHx8XG4gICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRXZlbnQnIHx8XG4gICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdFbWFpbCBCYXRjaCBQcm9ncmFtJyB8fFxuICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnSW4tQXBwIFByb2dyYW0nXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXMuYWRkSXRlbShtYXNzQ2xvbmVJdGVtKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0Lm1lbnUuTWVudS5wcm90b3R5cGUuc2hvd0F0JykpIHtcbiAgICAgIGNvbnNvbGUubG9nKCc+IEV4ZWN1dGluZzogQXBwbHlpbmcgTWFzcyBDbG9uZSBNZW51IEl0ZW0nKVxuICAgICAgaWYgKCFvcmlnTWVudVNob3dBdEZ1bmMpIHtcbiAgICAgICAgb3JpZ01lbnVTaG93QXRGdW5jID0gRXh0Lm1lbnUuTWVudS5wcm90b3R5cGUuc2hvd0F0XG4gICAgICB9XG5cbiAgICAgIEV4dC5tZW51Lk1lbnUucHJvdG90eXBlLnNob3dBdCA9IGZ1bmN0aW9uICh4eSwgcGFyZW50TWVudSkge1xuICAgICAgICBtYXNzQ2xvbmUuYXBwbHkodGhpcywgYXJndW1lbnRzKSAvL1RPRE8gY2hhbmdlcyBoZXJlIEh1bnRlclxuICAgICAgICBvcmlnTWVudVNob3dBdEZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnPiBTa2lwcGluZzogQXBwbHlpbmcgTWFzcyBDbG9uZSBNZW51IEl0ZW0nKVxuICAgIH1cbiAgfSxcblxuICAvKlxuICAqICBUaGlzIGZ1bmN0aW9uIGFkZHMgYSByaWdodC1jbGljayBtZW51IGl0ZW0gdGhhdCBwZXJmb3JtcyBhIG1hc3MgY2xvbmUgb2YgYWxsXG4gICogIFByb2dyYW1zIGZyb20gdGhlIHNlbGVjdGVkIHJvb3QgZm9sZGVyIHRoYXQgaGF2ZSBhIGZvbGRlciBkZXB0aCBsZXZlbCAxIG9yIGxlc3M6XG4gICogICAgQ2xvbmVzIHRoZSBmb2xkZXIgc3RydWN0dXJlXG4gICogICAgQ2xvbmVzIGFsbCBQcm9ncmFtc1xuICAqICAgIFNldHMgUGVyaW9kIENvc3RzIGZvciB0aGUgbmV4dCAyNCBtb250aHMgdXNpbmcgdGhlIHNvdXJjZSBQcm9ncmFtJ3MgZmlyc3QgQ29zdFxuICAqICAgIFNldHMgdGhlIFZlcnRpY2FsIFRhZyB1c2luZyB0aGUgbmFtZSBvZiB0aGUgZGVzdGluYXRpb24gZm9sZGVyXG4gICogICAgQ2xvbmVzIHRoZSBTdHJlYW0gQ2FkZW5jZXMgdXNpbmcgdGhlIHNvdXJjZSBOdXJ0dXJlIFByb2dyYW1cbiAgKiAgICBDbG9uZXMgdGhlIGFjdGl2YXRpb24gc3RhdGUgb2YgdHJpZ2dlciBTbWFydCBDYW1wYWlnbnNcbiAgKiAgICBDbG9uZXMgdGhlIHJlY3VycmluZyBzY2hlZHVsZSBvZiBiYXRjaCBTbWFydCBDYW1wYWlnbnNcbiAgKiAgICBTZXRzIHRoZSBhc3NldCBmaWx0ZXIgZm9yIGNsb25lZCByZXBvcnRzIHRvIHRoZSBkZXN0aW5hdGlvbiBmb2xkZXJcbiAgKi9cbiAgY2xvbmVGb2xkZXI6IGZ1bmN0aW9uIChvcmlnRm9sZGVyTmFtZSwgY2xvbmVUb1N1ZmZpeCwgY2xvbmVUb0ZvbGRlcklkKSB7XG4gICAgbGV0IG5ld0ZvbGRlck5hbWUsIHJlc3VsdFxuXG4gICAgaWYgKG9yaWdGb2xkZXJOYW1lLnNlYXJjaCgvXFwoW14pXSpcXCkkLykgIT0gLTEpIHtcbiAgICAgIG5ld0ZvbGRlck5hbWUgPSBvcmlnRm9sZGVyTmFtZS5yZXBsYWNlKC9cXChbXildKlxcKSQvLCAnKCcgKyBjbG9uZVRvU3VmZml4ICsgJyknKVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXdGb2xkZXJOYW1lID0gb3JpZ0ZvbGRlck5hbWUudGV4dCArICcgKCcgKyBjbG9uZVRvU3VmZml4ICsgJyknXG4gICAgfVxuXG4gICAgcmVzdWx0ID0gTElCLndlYlJlcXVlc3QoXG4gICAgICAnL2V4cGxvcmVyL2NyZWF0ZVByb2dyYW1Gb2xkZXInLFxuICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgJyZ0ZXh0PScgK1xuICAgICAgbmV3Rm9sZGVyTmFtZSArXG4gICAgICAnJnBhcmVudElkPScgK1xuICAgICAgY2xvbmVUb0ZvbGRlcklkICtcbiAgICAgICcmdGVtcE5vZGVJZD1leHQtJyArXG4gICAgICBjbG9uZVRvRm9sZGVySWQgK1xuICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICdQT1NUJyxcbiAgICAgIGZhbHNlLFxuICAgICAgJycsXG4gICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgcmVzcG9uc2UgJiZcbiAgICAgICAgICByZXNwb25zZS5KU09OUmVzdWx0cyAmJlxuICAgICAgICAgIHJlc3BvbnNlLkpTT05SZXN1bHRzLmFwcHZhcnMgJiZcbiAgICAgICAgICByZXNwb25zZS5KU09OUmVzdWx0cy5hcHB2YXJzLmNyZWF0ZVByb2dyYW1Gb2xkZXJSZXN1bHQgPT0gJ3N1Y2Nlc3MnXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiByZXNwb25zZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LFxuXG4gIGNsb25lTnVydHVyZUNhZGVuY2U6IGZ1bmN0aW9uIChvcmlnUHJvZ3JhbUNvbXBJZCwgbmV3UHJvZ3JhbUNvbXBJZCkge1xuICAgIGxldCBnZXROdXJ0dXJlQ2FkZW5jZSwgZ2V0T3JpZ051cnR1cmVDYWRlbmNlUmVzcG9uc2UsIGdldE5ld051cnR1cmVDYWRlbmNlUmVzcG9uc2VcblxuICAgIGdldE51cnR1cmVDYWRlbmNlID0gZnVuY3Rpb24gKHByb2dyYW1Db21wSWQpIHtcbiAgICAgIGxldCBwcm9ncmFtRmlsdGVyID0gZW5jb2RlVVJJQ29tcG9uZW50KCdbe1wicHJvcGVydHlcIjpcImlkXCIsXCJ2YWx1ZVwiOicgKyBwcm9ncmFtQ29tcElkICsgJ31dJyksXG4gICAgICAgIGZpZWxkcyA9IGVuY29kZVVSSUNvbXBvbmVudCgnW1wiK3RyYWNrc1wiXScpLFxuICAgICAgICByZXN1bHRcblxuICAgICAgcmVzdWx0ID0gTElCLndlYlJlcXVlc3QoXG4gICAgICAgICcvZGF0YS9udXJ0dXJlL3JldHJpZXZlJyxcbiAgICAgICAgJ2ZpbHRlcj0nICsgcHJvZ3JhbUZpbHRlciArICcmZmllbGRzPScgKyBmaWVsZHMgKyAnJnhzcmZJZD0nICsgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICdQT1NUJyxcbiAgICAgICAgZmFsc2UsXG4gICAgICAgICcnLFxuICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UpXG5cbiAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKVxuXG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfVxuXG4gICAgZ2V0T3JpZ051cnR1cmVDYWRlbmNlUmVzcG9uc2UgPSBnZXROdXJ0dXJlQ2FkZW5jZShvcmlnUHJvZ3JhbUNvbXBJZClcbiAgICBnZXROZXdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlID0gZ2V0TnVydHVyZUNhZGVuY2UobmV3UHJvZ3JhbUNvbXBJZClcblxuICAgIGlmIChcbiAgICAgIGdldE9yaWdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlICYmXG4gICAgICBnZXROZXdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlICYmXG4gICAgICBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZS5kYXRhWzBdLnRyYWNrcy5sZW5ndGggPT0gZ2V0TmV3TnVydHVyZUNhZGVuY2VSZXNwb25zZS5kYXRhWzBdLnRyYWNrcy5sZW5ndGhcbiAgICApIHtcbiAgICAgIGxldCBjdXJyT3JpZ1N0cmVhbSxcbiAgICAgICAgY3Vyck5ld1N0cmVhbSxcbiAgICAgICAgc3RyZWFtQ2FkZW5jZXMgPSAnWydcblxuICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGdldE9yaWdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlLmRhdGFbMF0udHJhY2tzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICBjdXJyT3JpZ1N0cmVhbSA9IGdldE9yaWdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlLmRhdGFbMF0udHJhY2tzW2lpXVxuICAgICAgICBjdXJyTmV3U3RyZWFtID0gZ2V0TmV3TnVydHVyZUNhZGVuY2VSZXNwb25zZS5kYXRhWzBdLnRyYWNrc1tpaV1cblxuICAgICAgICBpZiAoaWkgIT0gMCkge1xuICAgICAgICAgIHN0cmVhbUNhZGVuY2VzICs9ICcsJ1xuICAgICAgICB9XG4gICAgICAgIHN0cmVhbUNhZGVuY2VzICs9XG4gICAgICAgICAgJ3tcImlkXCI6JyArXG4gICAgICAgICAgY3Vyck5ld1N0cmVhbS5pZCArXG4gICAgICAgICAgJyxcInJlY3VycmVuY2VUeXBlXCI6XCInICtcbiAgICAgICAgICBjdXJyT3JpZ1N0cmVhbS5yZWN1cnJlbmNlVHlwZSArXG4gICAgICAgICAgJ1wiLFwiZXZlcnlOVW5pdFwiOicgK1xuICAgICAgICAgIGN1cnJPcmlnU3RyZWFtLmV2ZXJ5TlVuaXQgK1xuICAgICAgICAgICcsXCJ3ZWVrTWFza1wiOlwiJyArXG4gICAgICAgICAgY3Vyck9yaWdTdHJlYW0ud2Vla01hc2sgK1xuICAgICAgICAgICdcIixcInN0YXJ0RGF0ZVwiOlwiJyArXG4gICAgICAgICAgY3Vyck9yaWdTdHJlYW0uc3RhcnREYXRlICtcbiAgICAgICAgICAnXCJ9J1xuICAgICAgfVxuICAgICAgc3RyZWFtQ2FkZW5jZXMgKz0gJ10nXG4gICAgICBzdHJlYW1DYWRlbmNlcyA9IHN0cmVhbUNhZGVuY2VzLnJlcGxhY2UoL1wibnVsbFwiL2csICdudWxsJylcblxuICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICcvZGF0YS9udXJ0dXJlVHJhY2svdXBkYXRlJyxcbiAgICAgICAgJ2RhdGE9JyArIGVuY29kZVVSSUNvbXBvbmVudChzdHJlYW1DYWRlbmNlcykgKyAnJnhzcmZJZD0nICsgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICdQT1NUJyxcbiAgICAgICAgZmFsc2UsXG4gICAgICAgICcnLFxuICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgfVxuICAgICAgKVxuICAgIH1cbiAgfSxcblxuICBjbG9uZVBlcmlvZENvc3Q6IGZ1bmN0aW9uIChvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YSwgbmV3UHJvZ3JhbUNvbXBJZCwgbnVtT2ZNb250aHMsIG9mZnNldCwgaW5oZXJpdCkge1xuICAgIGxldCBjdXJyWWVhciA9IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKSxcbiAgICAgIGN1cnJNb250aCA9IG5ldyBEYXRlKCkuZ2V0TW9udGgoKSArIDEsXG4gICAgICBzZXRQZXJpb2RDb3N0XG5cbiAgICBzZXRQZXJpb2RDb3N0ID0gZnVuY3Rpb24gKG5ld1Byb2dyYW1Db21wSWQsIGNvc3REYXRlLCBjb3N0QW1vdW50KSB7XG4gICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgJy9tYXJrZXRpbmdFdmVudC9zZXRDb3N0U3VibWl0JyxcbiAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgJyZjb21wSWQ9JyArXG4gICAgICAgIG5ld1Byb2dyYW1Db21wSWQgK1xuICAgICAgICAnJmNvc3RJZD0nICtcbiAgICAgICAgJyZ0eXBlPXBlcmlvZCcgK1xuICAgICAgICAnJnN0YXJ0RGF0ZT0nICtcbiAgICAgICAgY29zdERhdGUgK1xuICAgICAgICAnJmFtb3VudD0nICtcbiAgICAgICAgY29zdEFtb3VudC50b1N0cmluZygpICtcbiAgICAgICAgJyZkZXNjcmlwdGlvbj0nICtcbiAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAnUE9TVCcsXG4gICAgICAgIGZhbHNlLFxuICAgICAgICAnJyxcbiAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIH1cbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAoaW5oZXJpdCAmJiBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YSkge1xuICAgICAgbGV0IGN1cnJQZXJpb2RDb3N0XG5cbiAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YS5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgY3VyclBlcmlvZENvc3QgPSBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YVtpaV1cblxuICAgICAgICBpZiAoY3VyclBlcmlvZENvc3QuaXRlbVR5cGUgPT0gJ3BlcmlvZCcgJiYgY3VyclBlcmlvZENvc3Quc3VtbWFyeURhdGEuYW1vdW50ICYmIGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLnN0YXJ0RGF0ZSkge1xuICAgICAgICAgIHZhciBjdXJyQ29zdE1vbnRoID0gY3VyclBlcmlvZENvc3Quc3VtbWFyeURhdGEuc3RhcnREYXRlLnJlcGxhY2UoL15bMC05XVswLTldWzAtOV1bMC05XS0vLCAnJyksXG4gICAgICAgICAgICBjdXJyQ29zdEFtb3VudCA9IGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLmFtb3VudCxcbiAgICAgICAgICAgIGN1cnJDb3N0WWVhcixcbiAgICAgICAgICAgIGN1cnJDb3N0RGF0ZVxuXG4gICAgICAgICAgaWYgKGN1cnJZZWFyID4gcGFyc2VJbnQoY3VyclBlcmlvZENvc3Quc3VtbWFyeURhdGEuc3RhcnREYXRlLm1hdGNoKC9eWzAtOV1bMC05XVswLTldWzAtOV0vKSkpIHtcbiAgICAgICAgICAgIGN1cnJDb3N0WWVhciA9IGN1cnJZZWFyICsgKGN1cnJZZWFyIC0gcGFyc2VJbnQoY3VyclBlcmlvZENvc3Quc3VtbWFyeURhdGEuc3RhcnREYXRlLm1hdGNoKC9eWzAtOV1bMC05XVswLTldWzAtOV0vKSkpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJDb3N0WWVhciA9IHBhcnNlSW50KGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLnN0YXJ0RGF0ZS5tYXRjaCgvXlswLTldWzAtOV1bMC05XVswLTldLykpXG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJDb3N0RGF0ZSA9IGN1cnJDb3N0WWVhci50b1N0cmluZygpICsgJy0nICsgY3VyckNvc3RNb250aC50b1N0cmluZygpXG4gICAgICAgICAgc2V0UGVyaW9kQ29zdChuZXdQcm9ncmFtQ29tcElkLCBjdXJyQ29zdERhdGUsIGN1cnJDb3N0QW1vdW50KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhICYmXG4gICAgICBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YVswXSAmJlxuICAgICAgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGFbMF0uc3VtbWFyeURhdGEgJiZcbiAgICAgIG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhWzBdLnN1bW1hcnlEYXRhLmFtb3VudFxuICAgICkge1xuICAgICAgaWYgKCFudW1PZk1vbnRocykge1xuICAgICAgICBudW1PZk1vbnRocyA9IDI0XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBudW1PZk1vbnRoczsgaWkrKykge1xuICAgICAgICB2YXIgY3VyckNvc3REYXRlLCBjdXJyQ29zdEFtb3VudFxuXG4gICAgICAgIGlmIChjdXJyTW9udGggPiAxMikge1xuICAgICAgICAgIGN1cnJNb250aCA9IDFcbiAgICAgICAgICBjdXJyWWVhcisrXG4gICAgICAgIH1cbiAgICAgICAgY3VyckNvc3REYXRlID0gY3VyclllYXIudG9TdHJpbmcoKSArICctJyArIGN1cnJNb250aC50b1N0cmluZygpXG4gICAgICAgIGN1cnJNb250aCsrXG4gICAgICAgIGN1cnJDb3N0QW1vdW50ID0gcGFyc2VJbnQob3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGFbMF0uc3VtbWFyeURhdGEuYW1vdW50KVxuXG4gICAgICAgIGlmIChvZmZzZXQpIHtcbiAgICAgICAgICBpZiAoTWF0aC5yYW5kb20oKSA8PSAwLjUpIHtcbiAgICAgICAgICAgIGN1cnJDb3N0QW1vdW50ICs9IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogb2Zmc2V0KVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyQ29zdEFtb3VudCAtPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIG9mZnNldClcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzZXRQZXJpb2RDb3N0KG5ld1Byb2dyYW1Db21wSWQsIGN1cnJDb3N0RGF0ZSwgY3VyckNvc3RBbW91bnQpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGNsb25lUHJvZ3JhbTogZnVuY3Rpb24gKGNsb25lVG9TdWZmaXgsIGNsb25lVG9Gb2xkZXJJZCwgb3JpZ1Byb2dyYW1UcmVlTm9kZSkge1xuICAgIGxldCBuZXdQcm9ncmFtTmFtZSwgbmV3UHJvZ3JhbVR5cGUsIHJlc3VsdFxuXG4gICAgaWYgKG9yaWdQcm9ncmFtVHJlZU5vZGUudGV4dC5zZWFyY2goL1xcKFteKV0qXFwpJC8pICE9IC0xKSB7XG4gICAgICBuZXdQcm9ncmFtTmFtZSA9IG9yaWdQcm9ncmFtVHJlZU5vZGUudGV4dC5yZXBsYWNlKC9cXChbXildKlxcKSQvLCAnKCcgKyBjbG9uZVRvU3VmZml4ICsgJyknKVxuICAgIH0gZWxzZSB7XG4gICAgICBuZXdQcm9ncmFtTmFtZSA9IG9yaWdQcm9ncmFtVHJlZU5vZGUudGV4dCArICcgKCcgKyBjbG9uZVRvU3VmZml4ICsgJyknXG4gICAgfVxuXG4gICAgc3dpdGNoIChvcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBUeXBlKSB7XG4gICAgICBjYXNlICdNYXJrZXRpbmcgUHJvZ3JhbSc6XG4gICAgICAgIG5ld1Byb2dyYW1UeXBlID0gJ3Byb2dyYW0nXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdOdXJ0dXJlIFByb2dyYW0nOlxuICAgICAgICBuZXdQcm9ncmFtVHlwZSA9ICdudXJ0dXJlJ1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnTWFya2V0aW5nIEV2ZW50JzpcbiAgICAgICAgbmV3UHJvZ3JhbVR5cGUgPSAnZXZlbnQnXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdFbWFpbCBCYXRjaCBQcm9ncmFtJzpcbiAgICAgICAgbmV3UHJvZ3JhbVR5cGUgPSAnZW1haWxCYXRjaFByb2dyYW0nXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdJbi1BcHAgUHJvZ3JhbSc6XG4gICAgICAgIG5ld1Byb2dyYW1UeXBlID0gJ2luQXBwUHJvZ3JhbSdcbiAgICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBpZiAobmV3UHJvZ3JhbVR5cGUpIHtcbiAgICAgIHJlc3VsdCA9IExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAnL21hcmtldGluZ0V2ZW50L2NyZWF0ZU1hcmtldGluZ1Byb2dyYW1TdWJtaXQnLFxuICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAnJm5hbWU9JyArXG4gICAgICAgIG5ld1Byb2dyYW1OYW1lICtcbiAgICAgICAgJyZkZXNjcmlwdGlvbj0nICtcbiAgICAgICAgJyZwYXJlbnRGb2xkZXJJZD0nICtcbiAgICAgICAgY2xvbmVUb0ZvbGRlcklkICtcbiAgICAgICAgJyZjbG9uZUZyb21JZD0nICtcbiAgICAgICAgb3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQgK1xuICAgICAgICAnJnR5cGU9JyArXG4gICAgICAgIG5ld1Byb2dyYW1UeXBlICtcbiAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAnUE9TVCcsXG4gICAgICAgIGZhbHNlLFxuICAgICAgICAnJyxcbiAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuICAgICAgICAgIC8vcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlLm1hdGNoKC97XFxcIkpTT05SZXN1bHRzXFxcIjouKn0vKVswXSk7XG5cbiAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuSlNPTlJlc3VsdHMgJiYgcmVzcG9uc2UuSlNPTlJlc3VsdHMuYXBwdmFycyAmJiByZXNwb25zZS5KU09OUmVzdWx0cy5hcHB2YXJzLnJlc3VsdCA9PSAnU3VjY2VzcycpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIClcblxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH0sXG5cbiAgY2xvbmVTbWFydENhbXBhaWduU3RhdGU6IGZ1bmN0aW9uIChvcmlnUHJvZ3JhbUNvbXBJZCwgbmV3UHJvZ3JhbUNvbXBJZCwgZm9yY2VBY3RpdmF0ZSkge1xuICAgIGxldCBnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2VcblxuICAgIGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbUFzc2V0RGV0YWlscyhvcmlnUHJvZ3JhbUNvbXBJZClcbiAgICBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbUFzc2V0RGV0YWlscyhuZXdQcm9ncmFtQ29tcElkKVxuXG4gICAgaWYgKGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UgJiYgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlKSB7XG4gICAgICBsZXQgc2V0U21hcnRDYW1wYWlnblN0YXRlXG5cbiAgICAgIHNldFNtYXJ0Q2FtcGFpZ25TdGF0ZSA9IGZ1bmN0aW9uIChnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UpIHtcbiAgICAgICAgbGV0IGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24sIGN1cnJOZXdQcm9ncmFtU21hcnRDYW1wYWlnbiwgZ2V0U2NoZWR1bGVSZXNwb25zZVxuXG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLnNtYXJ0Q2FtcGFpZ25zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24gPSBnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLnNtYXJ0Q2FtcGFpZ25zW2lpXVxuICAgICAgICAgIGN1cnJOZXdQcm9ncmFtU21hcnRDYW1wYWlnbiA9IGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5zbWFydENhbXBhaWduc1tpaV1cblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcFR5cGUgPT0gY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduLmNvbXBUeXBlICYmXG4gICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLmNvbXBUeXBlID09ICdTbWFydCBDYW1wYWlnbicgJiZcbiAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24ubmFtZSA9PSBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24ubmFtZVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgaWYgKGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uc3RhdHVzID09IDcgfHwgKGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uc3RhdHVzID09IDYgJiYgZm9yY2VBY3RpdmF0ZSkpIHtcbiAgICAgICAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgICAgICAgJy9zbWFydGNhbXBhaWducy90b2dnbGVBY3RpdmVTdGF0dXMnLFxuICAgICAgICAgICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgICAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAgICAgICAgICcmc21hcnRDYW1wYWlnbklkPScgK1xuICAgICAgICAgICAgICAgIGN1cnJOZXdQcm9ncmFtU21hcnRDYW1wYWlnbi5jb21wSWQgK1xuICAgICAgICAgICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5zdGF0dXMgPT0gMyB8fCBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLnN0YXR1cyA9PSA1KSB7XG4gICAgICAgICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICAgICAgICcvc21hcnRjYW1wYWlnbnMvZWRpdFNjaGVkdWxlUlMnLFxuICAgICAgICAgICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgICAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAgICAgICAgICcmaXNSZXF1ZXN0PTEnICtcbiAgICAgICAgICAgICAgICAnJnNtYXJ0Q2FtcGFpZ25JZD0nICtcbiAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLmNvbXBJZCArXG4gICAgICAgICAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgICAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UubWF0Y2goL01rdFBhZ2VcXC5hcHBWYXJzXFwuc2NoZWR1bGVEYXRhID0geyhbXj1dfFxcbnxcXFxcbikqfS8pWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UgPSBKU09OLnBhcnNlKFxuICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgICAgICAgICAubWF0Y2goL01rdFBhZ2VcXC5hcHBWYXJzXFwuc2NoZWR1bGVEYXRhID0geyhbXj1dfFxcbnxcXFxcbikqfS8pWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvTWt0UGFnZVxcLmFwcFZhcnNcXC5zY2hlZHVsZURhdGEgPSB7LywgJ3snKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcbiAqL2csICdcIicpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvOiArL2csICdcIjogJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cIlxcL1xcL1teXCJdK1wiL2csICdcIicpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCJ9JC8sICd9JylcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgIGlmIChnZXRTY2hlZHVsZVJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0QXREYXRlID0gbmV3IERhdGUoRGF0ZS5wYXJzZShnZXRTY2hlZHVsZVJlc3BvbnNlLnN0YXJ0X2F0KSksXG4gICAgICAgICAgICAgICAgICBzdGFydEF0ID1cbiAgICAgICAgICAgICAgICAgICAgc3RhcnRBdERhdGUuZ2V0RnVsbFllYXIoKSArXG4gICAgICAgICAgICAgICAgICAgICctJyArXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHN0YXJ0QXREYXRlLmdldE1vbnRoKCkgKyAxKSArXG4gICAgICAgICAgICAgICAgICAgICctJyArXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0QXREYXRlLmdldERhdGUoKSArXG4gICAgICAgICAgICAgICAgICAgICcgJyArXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0QXREYXRlLmdldEhvdXJzKCkgK1xuICAgICAgICAgICAgICAgICAgICAnOicgK1xuICAgICAgICAgICAgICAgICAgICBzdGFydEF0RGF0ZS5nZXRNaW51dGVzKCkgK1xuICAgICAgICAgICAgICAgICAgICAnOicgK1xuICAgICAgICAgICAgICAgICAgICBzdGFydEF0RGF0ZS5nZXRTZWNvbmRzKClcblxuICAgICAgICAgICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICAgICAgICAgJy9zbWFydGNhbXBhaWducy9yZWN1ckNhbXBTY2hlZHVsZScsXG4gICAgICAgICAgICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgICAgICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgICAgICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICAgICAgICAgICAnJnNtYXJ0Q2FtcGFpZ25JZD0nICtcbiAgICAgICAgICAgICAgICAgIGN1cnJOZXdQcm9ncmFtU21hcnRDYW1wYWlnbi5jb21wSWQgK1xuICAgICAgICAgICAgICAgICAgJyZyZWN1cnJlbmNlX3R5cGU9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLnJlY3VycmVuY2VfdHlwZSArXG4gICAgICAgICAgICAgICAgICAnJmV2ZXJ5X25fdW5pdD0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UuZXZlcnlfbl91bml0ICtcbiAgICAgICAgICAgICAgICAgICcmc3RhcnRfYXQ9JyArXG4gICAgICAgICAgICAgICAgICBzdGFydEF0ICtcbiAgICAgICAgICAgICAgICAgICcmZW5kX2F0PScgK1xuICAgICAgICAgICAgICAgICAgJyZldmVyeV93ZWVrZGF5PScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS5ldmVyeV93ZWVrZGF5ICtcbiAgICAgICAgICAgICAgICAgICcmd2Vla19tYXNrPScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS53ZWVrX21hc2sgK1xuICAgICAgICAgICAgICAgICAgJyZyZWN1ckRheV9vZl9tb250aD0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UucmVjdXJEYXlfb2ZfbW9udGggK1xuICAgICAgICAgICAgICAgICAgJyZyZWN1ck1vbnRoX2RheV90eXBlPScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS5yZWN1ck1vbnRoX2RheV90eXBlICtcbiAgICAgICAgICAgICAgICAgICcmcmVjdXJNb250aF93ZWVrX3R5cGU9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLnJlY3VyTW9udGhfd2Vla190eXBlICtcbiAgICAgICAgICAgICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICAgICAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICAgICAgICAgICAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLnNtYXJ0Q2FtcGFpZ25zLmxlbmd0aCA9PSBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2Uuc21hcnRDYW1wYWlnbnMubGVuZ3RoKSB7XG4gICAgICAgIHNldFNtYXJ0Q2FtcGFpZ25TdGF0ZShnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UpXG4gICAgICB9XG5cbiAgICAgIGlmIChnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlLmxlbmd0aCA9PSBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWUubGVuZ3RoKSB7XG4gICAgICAgIGxldCBjdXJyT3JpZ1Byb2dyYW1Bc3NldCwgY3Vyck5ld1Byb2dyYW1Bc3NldFxuXG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbUFzc2V0ID0gZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZVtpaV1cbiAgICAgICAgICBjdXJyTmV3UHJvZ3JhbUFzc2V0ID0gZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlW2lpXVxuXG4gICAgICAgICAgaWYgKGN1cnJPcmlnUHJvZ3JhbUFzc2V0Lm5hdlR5cGUgPT0gJ01BJyAmJiBjdXJyTmV3UHJvZ3JhbUFzc2V0Lm5hdlR5cGUgPT0gJ01BJykge1xuICAgICAgICAgICAgc2V0U21hcnRDYW1wYWlnblN0YXRlKFxuICAgICAgICAgICAgICBMSUIuZ2V0UHJvZ3JhbUFzc2V0RGV0YWlscyhjdXJyT3JpZ1Byb2dyYW1Bc3NldC5jb21wSWQpLFxuICAgICAgICAgICAgICBMSUIuZ2V0UHJvZ3JhbUFzc2V0RGV0YWlscyhjdXJyTmV3UHJvZ3JhbUFzc2V0LmNvbXBJZClcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlXG4gIH0sXG5cbiAgZ2V0SHVtYW5EYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gRGVtbyBBcHAgPiBHZXR0aW5nOiBEYXRlIDQgV2Vla3MgRnJvbSBOb3cnKVxuICAgIGxldCBkYXlOYW1lcyA9IFsnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J10sXG4gICAgICBtb250aE5hbWVzID0gWydKQU4nLCAnRkVCJywgJ01BUicsICdBUFInLCAnTUFZJywgJ0pVTkUnLCAnSlVMWScsICdBVUcnLCAnU0VQVCcsICdPQ1QnLCAnTk9WJywgJ0RFQyddLFxuICAgICAgZGF0ZSA9IG5ldyBEYXRlKCksXG4gICAgICBkYXlPZldlZWssXG4gICAgICBtb250aCxcbiAgICAgIGRheU9mTW9udGgsXG4gICAgICB5ZWFyXG5cbiAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyAyOClcbiAgICBkYXlPZldlZWsgPSBkYXlOYW1lc1tkYXRlLmdldERheSgpXVxuICAgIG1vbnRoID0gbW9udGhOYW1lc1tkYXRlLmdldE1vbnRoKCldXG4gICAgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKVxuXG4gICAgc3dpdGNoIChkYXRlLmdldERhdGUoKSkge1xuICAgICAgY2FzZSAxOlxuICAgICAgICBkYXlPZk1vbnRoID0gJzFzdCdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgZGF5T2ZNb250aCA9ICcybmQnXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDM6XG4gICAgICAgIGRheU9mTW9udGggPSAnM3JkJ1xuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgZGF5T2ZNb250aCA9IGRhdGUuZ2V0RGF0ZSgpICsgJ3RoJ1xuICAgICAgICBicmVha1xuICAgIH1cblxuICAgIHJldHVybiBkYXlPZldlZWsgKyAnLCAnICsgbW9udGggKyAnIHRoZSAnICsgZGF5T2ZNb250aCArICcgJyArIHllYXJcbiAgfSxcblxuICAvLyByZWxvYWRzIHRoZSBNYXJrZXRpbmcgQWN0aXZpdGVzIFRyZWVcbiAgcmVsb2FkTWFya2V0aW5nQWN0aXZpdGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGNvbnRleHQgPSB7XG4gICAgICBjb21wU3VidHlwZTogbnVsbCxcbiAgICAgIGN1c3RvbVRva2VuOiAnJyxcbiAgICAgIGRsQ29tcENvZGU6ICdNQScsXG4gICAgICB0eXBlOiAnTUEnXG4gICAgfVxuICAgICAgOyAoY3VzdG9tVG9rZW4gPSBNa3QzLkRsTWFuYWdlci5nZXRDdXN0b21Ub2tlbigpKSwgKHBhcmFtcyA9IEV4dC51cmxEZWNvZGUoY3VzdG9tVG9rZW4pKVxuXG4gICAgaWYgKFxuICAgICAgY29udGV4dCAmJlxuICAgICAgKGNvbnRleHQuY29tcFR5cGUgPT09ICdNYXJrZXRpbmcgRXZlbnQnIHx8XG4gICAgICAgIGNvbnRleHQuY29tcFR5cGUgPT09ICdNYXJrZXRpbmcgUHJvZ3JhbScgfHxcbiAgICAgICAgY29udGV4dC5jb21wU3VidHlwZSA9PT0gJ21hcmtldGluZ3Byb2dyYW0nIHx8XG4gICAgICAgIGNvbnRleHQuY29tcFN1YnR5cGUgPT09ICdtYXJrZXRpbmdldmVudCcpXG4gICAgKSB7XG4gICAgICBNa3QzLk1LTm9kZUNvbnRleHQudGltaW5nUmVwb3J0ID0ge1xuICAgICAgICBuYXZMb2FkQ2FsOiBFeHQ0LkRhdGUubm93KCksXG4gICAgICAgIGNhbGVuZGFyTW9kZTogJ1Byb2dyYW0nXG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGFscmVhZHlJbk1BID0gTWt0TWFpbk5hdi5hY3RpdmVOYXYgPT0gJ3RuTUEnLFxuICAgICAgYWpvcHRzID0gTWt0TWFpbk5hdi5jb21tb25QcmVMb2FkKCd0bk1BJywgY29udGV4dClcbiAgICBpZiAoTWt0UGFnZS5pbml0TmF2ID09ICd5ZXMnKSB7XG4gICAgICBNa3RFeHBsb3Jlci5jbGVhcigpXG4gICAgICBNa3RFeHBsb3Jlci5tYXNrKClcbiAgICAgIGxldCBwYXJtcyA9IGNvbnRleHRcbiAgICAgIGlmICghTWt0UGFnZS5zYXRlbGxpdGUpIHtcbiAgICAgICAgTWt0Vmlld3BvcnQuc2V0RXhwbG9yZXJWaXNpYmxlKHRydWUpXG5cbiAgICAgICAgTWt0RXhwbG9yZXIubG9hZFRyZWUoJ2V4cGxvcmVyL2dlbmVyYXRlRnVsbE1hRXhwbG9yZXInLCB7XG4gICAgICAgICAgc2VyaWFsaXplUGFybXM6IHBhcm1zLFxuICAgICAgICAgIG9uTXlGYWlsdXJlOiBNa3RNYWluTmF2LmV4cEZhaWx1cmVSZXNwb25zZS5jcmVhdGVEZWxlZ2F0ZSh0aGlzKVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBwYXJtcyA9IHt9XG4gICAgICBham9wdHMuc2VyaWFsaXplUGFybXMgPSBwYXJtc1xuICAgICAgaWYgKGlzRGVmaW5lZChjb250ZXh0LnBhbmVsSW5kZXgpKSB7XG4gICAgICAgIHBhcm1zLnBhbmVsSW5kZXggPSBjb250ZXh0LnBhbmVsSW5kZXhcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbnRleHQuaXNQcm9ncmFtSW1wb3J0KSB7XG4gICAgICAgIHBhcmFtcy5pZCA9IGNvbnRleHQuY29tcElkXG5cbiAgICAgICAgaWYgKE1rdFBhZ2UuaGFzV29ya3NwYWNlcygpKSB7XG4gICAgICAgICAgLy8gd2UgYXJlIGZvcmNlZCB0byBsb2FkIGRlZmF1bHQgTUEsIG90aGVyd2lzZSB0aGUgbW9kYWwgZm9ybSBpcyBub3QgYWxpZ25lZCBwcm9wZXJseVxuICAgICAgICAgIE1rdENhbnZhcy5jYW52YXNBamF4UmVxdWVzdCgnZXhwbG9yZXIvcHJvZ3JhbUNhbnZhcycsIHtcbiAgICAgICAgICAgIG9uTXlTdWNjZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIEV4dDQud2lkZ2V0KCdwcm9ncmFtT25lQ2xpY2tJbXBvcnRGb3JtJywge2Zvcm1EYXRhOiBwYXJhbXN9KVxuXG4gICAgICAgICAgICAgIE1rdFZpZXdwb3J0LnNldEFwcE1hc2soZmFsc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICBNa3RTZXNzaW9uLmFqYXhSZXF1ZXN0KCcvaW1wRXhwL2Rvd25sb2FkVGVtcGxhdGUnLCB7XG4gICAgICAgICAgc2VyaWFsaXplUGFybXM6IHBhcmFtcyxcbiAgICAgICAgICBvbk15U3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlLCByZXF1ZXN0KSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuSlNPTlJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkpTT05SZXN1bHRzLnNob3dJbXBvcnRTdGF0dXMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBNa3RDYW52YXMuY2FudmFzQWpheFJlcXVlc3QoJ2V4cGxvcmVyL3Byb2dyYW1DYW52YXMnLCB7XG4gICAgICAgICAgICAgICAgICBvbk15U3VjY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBNa3QuYXBwcy5pbXBFeHAuaW1wb3J0UHJvZ3JhbVN0YXR1cygpXG4gICAgICAgICAgICAgICAgICAgIE1rdFZpZXdwb3J0LnNldEFwcE1hc2soZmFsc2UpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5KU09OUmVzdWx0cy5lcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAvLyBqdXN0IGxvYWQgTUFcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcjTUEnXG4gICAgICAgICAgICAgICAgTWt0UGFnZS5zaG93QWxlcnRNZXNzYWdlKFxuICAgICAgICAgICAgICAgICAgTWt0TGFuZy5nZXRTdHIoJ3BhZ2UuSW1wb3J0X1dhcm5pbmcnKSxcbiAgICAgICAgICAgICAgICAgIE1rdExhbmcuZ2V0U3RyKCdwYWdlLkltcG9ydF9GYWlsZWQnKSArIHJlc3BvbnNlLkpTT05SZXN1bHRzLmVycm9yTWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICcvaW1hZ2VzL2ljb25zMzIvZXJyb3IucG5nJ1xuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5jb21wU3VidHlwZSA9PSAnbWFya2V0aW5nZm9sZGVyJyB8fCBjb250ZXh0LmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJyB8fCBjb250ZXh0LnN1YlR5cGUgPT0gJ21hcmtldGluZ2ZvbGRlcicpIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkUEUoY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5jb21wU3VidHlwZSA9PSAnc21hcnRjYW1wYWlnbicgfHwgY29udGV4dC5zdWJUeXBlID09ICdzbWFydGNhbXBhaWduJyB8fCBjb250ZXh0LmNvbXBUeXBlID09ICdTbWFydCBDYW1wYWlnbicpIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkU21hcnRDYW1wYWlnbihjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChjb250ZXh0LmNvbXBTdWJ0eXBlID09ICdtYXJrZXRpbmdldmVudCcgfHwgY29udGV4dC5zdWJUeXBlID09ICdtYXJrZXRpbmdldmVudCcgfHwgY29udGV4dC5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEV2ZW50Jykge1xuICAgICAgICBNa3RNYWluTmF2LmxvYWRNYXJrZXRpbmdFdmVudChjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgY29udGV4dC5jb21wU3VidHlwZSA9PSAnbWFya2V0aW5ncHJvZ3JhbScgfHxcbiAgICAgICAgY29udGV4dC5zdWJUeXBlID09ICdtYXJrZXRpbmdwcm9ncmFtJyB8fFxuICAgICAgICBjb250ZXh0LmNvbXBUeXBlID09ICdNYXJrZXRpbmcgUHJvZ3JhbSdcbiAgICAgICkge1xuICAgICAgICBNa3RNYWluTmF2LmxvYWRNYXJrZXRpbmdQcm9ncmFtKGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuY29tcFN1YnR5cGUgPT0gJ251cnR1cmVwcm9ncmFtJyB8fCBjb250ZXh0LnN1YlR5cGUgPT0gJ251cnR1cmVwcm9ncmFtJyB8fCBjb250ZXh0LmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZE51cnR1cmVQcm9ncmFtKGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBjb250ZXh0LmNvbXBTdWJ0eXBlID09PSAnZW1haWxiYXRjaHByb2dyYW0nIHx8XG4gICAgICAgIGNvbnRleHQuc3ViVHlwZSA9PT0gJ2VtYWlsYmF0Y2hwcm9ncmFtJyB8fFxuICAgICAgICBjb250ZXh0LmNvbXBUeXBlID09PSAnRW1haWwgQmF0Y2ggUHJvZ3JhbSdcbiAgICAgICkge1xuICAgICAgICBNa3RNYWluTmF2LmxvYWRFbWFpbEJhdGNoUHJvZ3JhbShjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChjb250ZXh0LmNvbXBTdWJ0eXBlID09PSAnaW5BcHAnIHx8IGNvbnRleHQuc3ViVHlwZSA9PT0gJ2luQXBwUHJvZ3JhbScgfHwgY29udGV4dC5jb21wVHlwZSA9PT0gJ0luLUFwcCBQcm9ncmFtJykge1xuICAgICAgICBNa3RNYWluTmF2LmxvYWRJbkFwcFByb2dyYW0oY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5ub2RlVHlwZSA9PSAnRmxvdycpIHtcbiAgICAgICAgLy9UaGlzIGlzIGp1c3QgdGVtcG9yYXJ5IHRpbGwgQ3Jhc2ggZ2V0IHRoZSBzdHVmZiBmb3IgbXkgdHJlZVxuICAgICAgICBNa3RNYWluTmF2LmxvYWRGbG93KClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFqb3B0cy5jYWNoZVJlcXVlc3QgPSB0cnVlXG4gICAgICAgIGFqb3B0cy5vbk15U3VjY2VzcyA9IE1rdE1haW5OYXYuY2FudmFzQWpheFJlcXVlc3RDb21wbGV0ZS5jcmVhdGVEZWxlZ2F0ZShNa3RNYWluTmF2KVxuICAgICAgICBham9wdHMub25NeUZhaWx1cmUgPSBNa3RNYWluTmF2LmNhbnZhc0FqYXhSZXF1ZXN0Q29tcGxldGUuY3JlYXRlRGVsZWdhdGUoTWt0TWFpbk5hdilcbiAgICAgICAgTWt0Q2FudmFzLmNhbnZhc0FqYXhSZXF1ZXN0KCdleHBsb3Jlci9wcm9ncmFtQ2FudmFzJywgYWpvcHRzKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9LFxuXG4gIC8vIGVkaXRzIHRoZSB2YXJpYWJsZXMgd2l0aGluIHRoZSBFbWFpbCBFZGl0b3IgZm9yIGN1c3RvbSBjb21wYW55XG4gIHNhdmVFbWFpbEVkaXRzOiBmdW5jdGlvbiAobW9kZSwgYXNzZXQpIHtcbiAgICBsZXQgc2F2ZUVkaXRzVG9nZ2xlID0gTElCLmdldENvb2tpZSgnc2F2ZUVkaXRzVG9nZ2xlU3RhdGUnKSxcbiAgICAgIGxvZ28gPSBMSUIuZ2V0Q29va2llKCdsb2dvJyksXG4gICAgICBoZXJvQmFja2dyb3VuZCA9IExJQi5nZXRDb29raWUoJ2hlcm9CYWNrZ3JvdW5kJyksXG4gICAgICBjb2xvciA9IExJQi5nZXRDb29raWUoJ2NvbG9yJylcblxuICAgIGlmIChzYXZlRWRpdHNUb2dnbGUgPT0gJ3RydWUnICYmIChsb2dvICE9IG51bGwgfHwgaGVyb0JhY2tncm91bmQgIT0gbnVsbCB8fCBjb2xvciAhPSBudWxsKSkge1xuICAgICAgbGV0IGh0dHBSZWdFeCA9IG5ldyBSZWdFeHAoJ15odHRwfF4kJywgJ2knKSxcbiAgICAgICAgLy90ZXh0UmVnZXggPSBuZXcgUmVnRXhwKFwiXlteI118XiRcIiwgXCJpXCIpLFxuICAgICAgICBjb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cCgnXiNbMC05YS1mXXszLDZ9JHxecmdifF4kJywgJ2knKSxcbiAgICAgICAgbG9nb0lkcyA9IFsnaGVyb0xvZ28nLCAnZm9vdGVyTG9nbycsICdoZWFkZXJMb2dvJywgJ2xvZ29Gb290ZXInLCAnbG9nbyddLFxuICAgICAgICBoZXJvQmdSZWdleCA9IG5ldyBSZWdFeHAoJ2hlcm9CYWNrZ3JvdW5kfGhlcm8tYmFja2dyb3VuZHxoZXJvQmtnfGhlcm8tYmtnfGhlcm9CZ3xoZXJvLWJnJywgJ2knKSxcbiAgICAgICAgLy90aXRsZUlkcyA9IFtcInRpdGxlXCIsIFwiaGVyb1RpdGxlXCIsIFwibWFpblRpdGxlXCJdLFxuICAgICAgICAvL3N1YnRpdGxlSWRzID0gW1wic3VidGl0bGVcIiwgXCJoZXJvc3ViVGl0bGVcIl0sXG4gICAgICAgIGhlYWRlckJnQ29sb3JSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ14oaGVhZGVyQmdDb2xvcnxoZWFkZXItYmctY29sb3J8aGVhZGVyQmFja2dyb3VuZENvbG9yfGhlYWRlci1iYWNrZ3JvdW5kLWNvbG9yfGhlYWRlckJrZ0NvbG9yfGhlYWRlci1ia2ctY29sb3J8KSQnLFxuICAgICAgICAgICdpJ1xuICAgICAgICApLFxuICAgICAgICBidXR0b25CZ0NvbG9yUmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICdeKGhlcm9CdXR0b25CZ0NvbG9yfGhlcm8tYnV0dG9uLWJnLWNvbG9yfGhlcm9CdXR0b25CYWNrZ3JvdW5kQ29sb3J8aGVyby1idXR0b24tYmFja2dyb3VuZC1jb2xvcnxoZXJvQmtnQ29sb3J8aGVyby1ia2ctY29sb3J8KSQnLFxuICAgICAgICAgICdpJ1xuICAgICAgICApLFxuICAgICAgICBidXR0b25Cb3JkZXJDb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cCgnXihoZXJvQnV0dG9uQm9yZGVyQ29sb3J8aGVyby1idXR0b24tYm9yZGVyLWNvbG9yfGhlcm9Cb3JkZXJDb2xvcnxoZXJvLWJvcmRlci1jb2xvcnwpJCcsICdpJyksXG4gICAgICAgIGxvZ28gPSBMSUIuZ2V0Q29va2llKCdsb2dvJyksXG4gICAgICAgIGhlcm9CYWNrZ3JvdW5kID0gTElCLmdldENvb2tpZSgnaGVyb0JhY2tncm91bmQnKSxcbiAgICAgICAgY29sb3IgPSBMSUIuZ2V0Q29va2llKCdjb2xvcicpLFxuICAgICAgICAvL3RpdGxlID0gXCJZb3UgVG88YnI+UFJFTUlFUiBCVVNJTkVTUyBFVkVOVDxicj5PRiBUSEUgWUVBUlwiLFxuICAgICAgICAvL3N1YnRpdGxlID0gTElCLmdldEh1bWFuRGF0ZSgpLFxuICAgICAgICAvL3RpdGxlTWF0Y2gsXG4gICAgICAgIC8vY29tcGFueSxcbiAgICAgICAgLy9jb21wYW55TmFtZSxcbiAgICAgICAgZWRpdEh0bWwsXG4gICAgICAgIGVkaXRBc3NldFZhcnMsXG4gICAgICAgIHdhaXRGb3JMb2FkTXNnLFxuICAgICAgICB3YWl0Rm9yUmVsb2FkTXNnXG5cbiAgICAgIHdhaXRGb3JMb2FkTXNnID0gbmV3IEV4dC5XaW5kb3coe1xuICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcbiAgICAgICAgbW9kYWw6IHRydWUsXG4gICAgICAgIHdpZHRoOiA1MDAsXG4gICAgICAgIGhlaWdodDogMjUwLFxuICAgICAgICBjbHM6ICdta3RNb2RhbEZvcm0nLFxuICAgICAgICB0aXRsZTogJ1BsZWFzZSBXYWl0IGZvciBQYWdlIHRvIExvYWQnLFxuICAgICAgICBodG1sOiAnPHU+U2F2aW5nIEVkaXRzIHRvIEhlcm8gQmFja2dyb3VuZCAmIEJ1dHRvbiBCYWNrZ3JvdW5kIENvbG9yPC91PiA8YnI+V2FpdCB1bnRpbCB0aGlzIHBhZ2UgY29tcGxldGVseSBsb2FkcyBiZWZvcmUgY2xvc2luZy4gPGJyPjxicj48dT5UbyBEaXNhYmxlIFRoaXMgRmVhdHVyZTo8L3U+IDxicj5DbGVhciB0aGUgc2VsZWN0ZWQgY29tcGFueSB2aWEgdGhlIE1hcmtldG9MaXZlIGV4dGVuc2lvbi4nXG4gICAgICB9KVxuICAgICAgd2FpdEZvclJlbG9hZE1zZyA9IG5ldyBFeHQuV2luZG93KHtcbiAgICAgICAgY2xvc2FibGU6IHRydWUsXG4gICAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgICB3aWR0aDogNTAwLFxuICAgICAgICBoZWlnaHQ6IDI1MCxcbiAgICAgICAgY2xzOiAnbWt0TW9kYWxGb3JtJyxcbiAgICAgICAgdGl0bGU6ICdQbGVhc2UgV2FpdCBmb3IgUGFnZSB0byBSZWxvYWQnLFxuICAgICAgICBodG1sOiAnPHU+U2F2aW5nIEVkaXRzIHRvIExvZ28sIFRpdGxlLCAmIFN1YnRpdGxlPC91PiA8YnI+V2FpdCBmb3IgdGhpcyBwYWdlIHRvIHJlbG9hZCBhdXRvbWF0aWNhbGx5LiA8YnI+PGJyPjx1PlRvIERpc2FibGUgVGhpcyBGZWF0dXJlOjwvdT4gPGJyPkNsZWFyIHRoZSBzZWxlY3RlZCBjb21wYW55IHZpYSB0aGUgTWFya2V0b0xpdmUgZXh0ZW5zaW9uLidcbiAgICAgIH0pXG5cbiAgICAgIGVkaXRIdG1sID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAnL2VtYWlsZWRpdG9yL2Rvd25sb2FkSHRtbEZpbGUyP3hzcmZJZD0nICsgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCkgKyAnJmVtYWlsSWQ9JyArIE1rdDMuREwuZGwuY29tcElkLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgJ0dFVCcsXG4gICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAnZG9jdW1lbnQnLFxuICAgICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgbGV0IGlzTG9nb1JlcGxhY2VkXG4gICAgICAgICAgICAvL2lzVGl0bGVSZXBsYWNlZCxcbiAgICAgICAgICAgIC8vaXNTdWJ0aXRsZVJlcGxhY2VkO1xuXG4gICAgICAgICAgICBpZiAobG9nbykge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbG9nb0lkcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3VyckVsZW1lbnQgPSByZXNwb25zZS5nZXRFbGVtZW50QnlJZChsb2dvSWRzW2lpXSlcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBjdXJyRWxlbWVudCAmJlxuICAgICAgICAgICAgICAgICAgY3VyckVsZW1lbnQuY2xhc3NOYW1lLnNlYXJjaCgnbWt0b0ltZycpICE9IC0xICYmXG4gICAgICAgICAgICAgICAgICBjdXJyRWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJylbMF0gJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKVswXS5nZXRBdHRyaWJ1dGUoJ3NyYycpICE9IGxvZ29cbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IFJlcGxhY2luZzogTG9nbyA+ICcgKyBsb2dvKVxuICAgICAgICAgICAgICAgICAgaXNMb2dvUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBjdXJyRWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJylbMF0uc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGlzTG9nb1JlcGxhY2VkXG4gICAgICAgICAgICAgIC8vfHwgaXNUaXRsZVJlcGxhY2VkXG4gICAgICAgICAgICAgIC8vfHwgaXNTdWJ0aXRsZVJlcGxhY2VkXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbGV0IHVwZGF0ZUh0bWxcblxuICAgICAgICAgICAgICB1cGRhdGVIdG1sID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICAgICAgICAgJy9lbWFpbGVkaXRvci91cGRhdGVDb250ZW50MicsXG4gICAgICAgICAgICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgICAgICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgICAgICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICAgICAgICAgICAnJmVtYWlsSWQ9JyArXG4gICAgICAgICAgICAgICAgICBNa3QzLkRMLmRsLmNvbXBJZCArXG4gICAgICAgICAgICAgICAgICAnJmNvbnRlbnQ9JyArXG4gICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQobmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhyZXNwb25zZSkpICtcbiAgICAgICAgICAgICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICAgICAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICAgICAgICAgICAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgICAgJycsXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnN0b3AoKVxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKClcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAod2FpdEZvckxvYWRNc2cuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5oaWRlKClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB3YWl0Rm9yUmVsb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICB1cGRhdGVIdG1sKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgZWRpdEFzc2V0VmFycyA9IGZ1bmN0aW9uIChhc3NldCkge1xuICAgICAgICBsZXQgYXNzZXRWYXJzID0gYXNzZXQuZ2V0VmFyaWFibGVWYWx1ZXMoKVxuXG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBPYmplY3Qua2V5cyhhc3NldFZhcnMpLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGxldCBjdXJyVmFyaWFibGVLZXkgPSBPYmplY3Qua2V5cyhhc3NldFZhcnMpW2lpXVxuICAgICAgICAgIGN1cnJWYXJpYWJsZVZhbHVlID0gT2JqZWN0LnZhbHVlcyhhc3NldFZhcnMpW2lpXVxuXG4gICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgIGN1cnJWYXJpYWJsZVZhbHVlID0gJydcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChoZXJvQmdSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZSAhPSBoZXJvQmFja2dyb3VuZCAmJiBjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goaHR0cFJlZ0V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0VmFyaWFibGVWYWx1ZShjdXJyVmFyaWFibGVLZXksIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChoZWFkZXJCZ0NvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgIT0gY29sb3IgJiYgY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRWYXJpYWJsZVZhbHVlKGN1cnJWYXJpYWJsZUtleSwgY29sb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGJ1dHRvbkJnQ29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZSAhPSBjb2xvciAmJiBjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goY29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFZhcmlhYmxlVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBjb2xvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goYnV0dG9uQm9yZGVyQ29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZSAhPSBjb2xvciAmJiBjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goY29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFZhcmlhYmxlVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBjb2xvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAod2FpdEZvckxvYWRNc2cuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykucmVsb2FkRW1haWwoKVxuICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuaGlkZSgpXG4gICAgICAgICAgfSwgNzUwMClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogRW1haWwgVmFyaWFibGVzJylcbiAgICAgIGlmIChtb2RlID09ICdlZGl0Jykge1xuICAgICAgICBsZXQgaXNXZWJSZXF1ZXN0U2Vzc2lvbiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJz4gV2FpdGluZzogV2ViIFJlcXVlc3QgU2Vzc2lvbiBEYXRhJylcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuREwuZGwuY29tcElkJykgJiZcbiAgICAgICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0U2VjdXJpdHkuZ2V0WHNyZklkJykgJiZcbiAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpICYmXG4gICAgICAgICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dC5pZCcpICYmXG4gICAgICAgICAgICBFeHQuaWQobnVsbCwgJzonKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRWRpdGluZzogRW1haWwgSFRNTCcpXG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc1dlYlJlcXVlc3RTZXNzaW9uKVxuXG4gICAgICAgICAgICBlZGl0SHRtbCgpXG4gICAgICAgICAgfVxuICAgICAgICB9LCAwKVxuXG4gICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgIGVkaXRBc3NldFZhcnMoYXNzZXQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGlzRW1haWxFZGl0b3JWYXJpYWJsZXMgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gV2FpdGluZzogRW1haWwgRWRpdG9yIFZhcmlhYmxlcycpXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICF3YWl0Rm9yUmVsb2FkTXNnLmlzVmlzaWJsZSgpICYmXG4gICAgICAgICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0JykgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5nZXRFbWFpbCgpICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5nZXRFbWFpbCgpLmdldFZhcmlhYmxlVmFsdWVzKCkgJiZcbiAgICAgICAgICAgICAgT2JqZWN0LmtleXMoTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLmdldEVtYWlsKCkuZ2V0VmFyaWFibGVWYWx1ZXMoKSkubGVuZ3RoICE9IDAgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLmdldEVtYWlsKCkuc2V0VmFyaWFibGVWYWx1ZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IEVkaXRpbmc6IEVtYWlsIEVkaXRvciBWYXJpYWJsZXMnKVxuICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0VtYWlsRWRpdG9yVmFyaWFibGVzKVxuXG4gICAgICAgICAgICAgIGVkaXRBc3NldFZhcnMoTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLmdldEVtYWlsKCkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgMClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChtb2RlID09ICdwcmV2aWV3Jykge1xuICAgICAgICBjb25zb2xlLmxvZygnPiBFZGl0aW5nOiBFbWFpbCBQcmV2aWV3ZXIgVmFyaWFibGVzJylcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gZWRpdHMgdGhlIHZhcmlhYmxlcyB3aXRoaW4gdGhlIExhbmRpbmcgUGFnZSBFZGl0b3IgZm9yIGN1c3RvbSBjb21wYW55XG4gIC8vIG1vZGUgdmlldyAoZWRpdCwgcHJldmlldyk7IGFzc2V0IHRvIGJlIGVkaXRlZFxuICBzYXZlTGFuZGluZ1BhZ2VFZGl0czogZnVuY3Rpb24gKG1vZGUsIGFzc2V0KSB7XG4gICAgbGV0IHNhdmVFZGl0c1RvZ2dsZSA9IExJQi5nZXRDb29raWUoJ3NhdmVFZGl0c1RvZ2dsZVN0YXRlJyksXG4gICAgICBsb2dvID0gTElCLmdldENvb2tpZSgnbG9nbycpLFxuICAgICAgaGVyb0JhY2tncm91bmQgPSBMSUIuZ2V0Q29va2llKCdoZXJvQmFja2dyb3VuZCcpLFxuICAgICAgY29sb3IgPSBMSUIuZ2V0Q29va2llKCdjb2xvcicpXG5cbiAgICBpZiAoc2F2ZUVkaXRzVG9nZ2xlID09ICd0cnVlJyAmJiAobG9nbyAhPSBudWxsIHx8IGhlcm9CYWNrZ3JvdW5kICE9IG51bGwgfHwgY29sb3IgIT0gbnVsbCkpIHtcbiAgICAgIGxldCBodHRwUmVnRXggPSBuZXcgUmVnRXhwKCdeaHR0cHxeJCcsICdpJyksXG4gICAgICAgIC8vdGV4dFJlZ2V4ID0gbmV3IFJlZ0V4cChcIl5bXiNdfF4kXCIsIFwiaVwiKSxcbiAgICAgICAgY29sb3JSZWdleCA9IG5ldyBSZWdFeHAoJ14jWzAtOWEtZl17Myw2fSR8XnJnYnxeJCcsICdpJyksXG4gICAgICAgIGxvZ29SZWdleCA9IG5ldyBSZWdFeHAoJ2xvZ298aGVhZGVyTG9nb3xoZWFkZXItbG9nb3xeJCcsICdpJyksXG4gICAgICAgIGhlcm9CZ1JlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAnaGVyb0JhY2tncm91bmR8aGVyby1iYWNrZ3JvdW5kfGhlcm9Ca2d8aGVyby1ia2d8aGVyb0JnfGhlcm8tYmd8aGVybzFCZ3xoZXJvLTEtYmd8aGVybzFCa2d8aGVyby0xLWJrZ3xoZXJvMUJhY2tncm91bmR8XiQnLFxuICAgICAgICAgICdpJ1xuICAgICAgICApLFxuICAgICAgICAvL3RpdGxlUmVnZXggPSBuZXcgUmVnRXhwKFwiXihtYWluVGl0bGV8bWFpbi10aXRsZXxoZXJvVGl0bGV8aGVyby10aXRsZXx0aXRsZXwpJFwiLCBcImlcIiksXG4gICAgICAgIC8vc3VidGl0bGVSZWdleCA9IG5ldyBSZWdFeHAoXCJeKHN1YnRpdGxlfHN1Yi10aXRsZXxoZXJvU3VidGl0bGV8aGVyby1zdWJ0aXRsZXwpJFwiLCBcImlcIiksXG4gICAgICAgIGJ1dHRvbkJnQ29sb3JSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ14oaGVyb0J1dHRvbkJnQ29sb3J8aGVyby1idXR0b24tYmctY29sb3J8aGVyb0J1dHRvbkJhY2tncm91bmRDb2xvcnxoZXJvLWJ1dHRvbi1iYWNrZ3JvdW5kLWNvbG9yfGhlcm9Ca2dDb2xvcnxoZXJvLWJrZy1jb2xvcnwpJCcsXG4gICAgICAgICAgJ2knXG4gICAgICAgICksXG4gICAgICAgIGJ1dHRvbkJvcmRlckNvbG9yUmVnZXggPSBuZXcgUmVnRXhwKCdeKGhlcm9CdXR0b25Cb3JkZXJDb2xvcnxoZXJvLWJ1dHRvbi1ib3JkZXItY29sb3J8aGVyb0JvcmRlckNvbG9yfGhlcm8tYm9yZGVyLWNvbG9yfCkkJywgJ2knKSxcbiAgICAgICAgaGVhZGVyQmdDb2xvciA9ICdoZWFkZXJCZ0NvbG9yJyxcbiAgICAgICAgaGVhZGVyTG9nb0ltZyA9ICdoZWFkZXJMb2dvSW1nJyxcbiAgICAgICAgaGVyb0JnSW1nID0gJ2hlcm9CZ0ltZycsXG4gICAgICAgIC8vaGVyb1RpdGxlID0gXCJoZXJvVGl0bGVcIixcbiAgICAgICAgLy9oZXJvU3VidGl0bGUgPSBcImhlcm9TdWJ0aXRsZVwiLFxuICAgICAgICBmb3JtQnV0dG9uQmdDb2xvciA9ICdmb3JtQnV0dG9uQmdDb2xvcicsXG4gICAgICAgIGZvb3RlckxvZ29JbWcgPSAnZm9vdGVyTG9nb0ltZycsXG4gICAgICAgIC8vdGl0bGUgPSBcIllvdSBUbyBPdXIgRXZlbnRcIixcbiAgICAgICAgLy9zdWJ0aXRsZSA9IExJQi5nZXRIdW1hbkRhdGUoKSxcbiAgICAgICAgLy9jb21wYW55LFxuICAgICAgICAvL2NvbXBhbnlOYW1lLFxuICAgICAgICBlZGl0QXNzZXRWYXJzLFxuICAgICAgICB3YWl0Rm9yTG9hZE1zZ1xuXG4gICAgICB3YWl0Rm9yTG9hZE1zZyA9IG5ldyBFeHQuV2luZG93KHtcbiAgICAgICAgY2xvc2FibGU6IHRydWUsXG4gICAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgICB3aWR0aDogNTAwLFxuICAgICAgICBoZWlnaHQ6IDI1MCxcbiAgICAgICAgY2xzOiAnbWt0TW9kYWxGb3JtJyxcbiAgICAgICAgdGl0bGU6ICdQbGVhc2UgV2FpdCBmb3IgUGFnZSB0byBMb2FkJyxcbiAgICAgICAgaHRtbDogJzx1PlNhdmluZyBFZGl0czwvdT4gPGJyPldhaXQgdW50aWwgdGhpcyBwYWdlIGNvbXBsZXRlbHkgbG9hZHMgYmVmb3JlIGNsb3NpbmcuIDxicj48YnI+PHU+VG8gRGlzYWJsZSBUaGlzIEZlYXR1cmU6PC91PiA8YnI+Q2xlYXIgdGhlIHNlbGVjdGVkIGNvbXBhbnkgdmlhIHRoZSBNYXJrZXRvTGl2ZSBleHRlbnNpb24uJ1xuICAgICAgfSlcblxuICAgICAgZWRpdEFzc2V0VmFycyA9IGZ1bmN0aW9uIChhc3NldCkge1xuICAgICAgICBsZXQgYXNzZXRWYXJzID0gYXNzZXQuZ2V0UmVzcG9uc2l2ZVZhclZhbHVlcygpXG4gICAgICAgIC8vaXNMYW5kaW5nUGFnZUVkaXRvckZyYWdtZW50U3RvcmUsXG4gICAgICAgIC8vY291bnQgPSAwLFxuICAgICAgICAvL2lzVGl0bGVVcGRhdGVkID0gaXNTdWJ0aXRsZVVwZGF0ZWQgPSBmYWxzZTtcblxuICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcblxuICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoaGVhZGVyQmdDb2xvciwgY29sb3IpXG4gICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShoZWFkZXJMb2dvSW1nLCBsb2dvKVxuICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoaGVyb0JnSW1nLCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgLy9hc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoaGVyb1RpdGxlLCB0aXRsZSk7XG4gICAgICAgIC8vYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGhlcm9TdWJ0aXRsZSwgc3VidGl0bGUpO1xuICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoZm9ybUJ1dHRvbkJnQ29sb3IsIGNvbG9yKVxuICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoZm9vdGVyTG9nb0ltZywgbG9nbylcblxuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgT2JqZWN0LmtleXMoYXNzZXRWYXJzKS5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBsZXQgY3VyclZhcmlhYmxlS2V5ID0gT2JqZWN0LmtleXMoYXNzZXRWYXJzKVtpaV0sXG4gICAgICAgICAgICBjdXJyVmFyaWFibGVWYWx1ZSA9IE9iamVjdC52YWx1ZXMoYXNzZXRWYXJzKVtpaV0udG9TdHJpbmcoKVxuXG4gICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgIGN1cnJWYXJpYWJsZVZhbHVlID0gJydcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChsb2dvUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGh0dHBSZWdFeCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShjdXJyVmFyaWFibGVLZXksIGxvZ28pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGhlcm9CZ1JlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChodHRwUmVnRXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goYnV0dG9uQmdDb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChjb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGN1cnJWYXJpYWJsZUtleSwgY29sb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGJ1dHRvbkJvcmRlckNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBjb2xvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAod2FpdEZvckxvYWRNc2cuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL01rdDMuYXBwLmNvbnRyb2xsZXJzLmdldChcIk1rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2VcIikubG9hZEVkaXRvclZpZXcoKTtcbiAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLmhpZGUoKVxuICAgICAgICAgIH0sIDc1MDApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKCc+IEVkaXRpbmc6IExhbmRpbmcgUGFnZSBWYXJpYWJsZXMnKVxuICAgICAgaWYgKG1vZGUgPT0gJ2VkaXQnKSB7XG4gICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgIGVkaXRBc3NldFZhcnMoYXNzZXQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IGlzTGFuZGluZ1BhZ2VFZGl0b3JWYXJpYWJsZXMgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCcpICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKCkgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKS5nZXRSZXNwb25zaXZlVmFyVmFsdWVzKCkgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKS5zZXRSZXNwb25zaXZlVmFyVmFsdWUgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IEVkaXRpbmc6IExhbmRpbmcgUGFnZSBFZGl0b3IgVmFyaWFibGVzJylcbiAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNMYW5kaW5nUGFnZUVkaXRvclZhcmlhYmxlcylcblxuICAgICAgICAgICAgICBlZGl0QXNzZXRWYXJzKE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKCkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgMClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChtb2RlID09ICdwcmV2aWV3Jykge1xuICAgICAgICBjb25zb2xlLmxvZygnPiBFZGl0aW5nOiBMYW5kaW5nIFBhZ2UgUHJldmlld2VyIFZhcmlhYmxlcycpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHNldFByb2dyYW1SZXBvcnRGaWx0ZXI6IGZ1bmN0aW9uIChnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZCwgbmV3UHJvZ3JhbUNvbXBJZCkge1xuICAgIGxldCBhcHBseVByb2dyYW1SZXBvcnRGaWx0ZXJcblxuICAgIGFwcGx5UHJvZ3JhbVJlcG9ydEZpbHRlciA9IGZ1bmN0aW9uIChnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZCkge1xuICAgICAgbGV0IGN1cnJOZXdSZXBvcnRcblxuICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZS5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgY3Vyck5ld1JlcG9ydCA9IGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZVtpaV1cblxuICAgICAgICBpZiAoY3Vyck5ld1JlcG9ydC5jb21wVHlwZSA9PSAnUmVwb3J0Jykge1xuICAgICAgICAgIGxldCByZXBvcnRGaWx0ZXJUeXBlLCBzZWxlY3RlZE5vZGVzXG5cbiAgICAgICAgICBpZiAoL15FbWFpbC9pLnRlc3QoY3Vyck5ld1JlcG9ydC50ZXh0KSkge1xuICAgICAgICAgICAgcmVwb3J0RmlsdGVyVHlwZSA9ICdtYUVtYWlsJ1xuICAgICAgICAgICAgc2VsZWN0ZWROb2RlcyA9ICdbXCInICsgY2xvbmVUb0ZvbGRlcklkICsgJ1wiXSdcbiAgICAgICAgICB9IGVsc2UgaWYgKC9eKEVuZ2FnZW1lbnR8TnVydHVyKS9pLnRlc3QoY3Vyck5ld1JlcG9ydC50ZXh0KSkge1xuICAgICAgICAgICAgcmVwb3J0RmlsdGVyVHlwZSA9ICdudXJ0dXJlcHJvZ3JhbSdcbiAgICAgICAgICAgIHNlbGVjdGVkTm9kZXMgPSAnW1wiJyArIGNsb25lVG9Gb2xkZXJJZCArICdcIl0nXG4gICAgICAgICAgfSBlbHNlIGlmICgvXkxhbmRpbmcvaS50ZXN0KGN1cnJOZXdSZXBvcnQudGV4dCkpIHtcbiAgICAgICAgICAgIHJlcG9ydEZpbHRlclR5cGUgPSAnbWFMYW5kaW5nJ1xuICAgICAgICAgICAgc2VsZWN0ZWROb2RlcyA9ICdbXCInICsgY2xvbmVUb0ZvbGRlcklkICsgJ1wiXSdcbiAgICAgICAgICB9IGVsc2UgaWYgKC9eUHJvZ3JhbS9pLnRlc3QoY3Vyck5ld1JlcG9ydC50ZXh0KSkge1xuICAgICAgICAgICAgcmVwb3J0RmlsdGVyVHlwZSA9ICdwcm9ncmFtJ1xuICAgICAgICAgICAgc2VsZWN0ZWROb2RlcyA9ICdbXCInICsgY2xvbmVUb0ZvbGRlcklkICsgJ1wiXSdcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocmVwb3J0RmlsdGVyVHlwZSAmJiBzZWxlY3RlZE5vZGVzKSB7XG4gICAgICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAgICAgJy9hbmFseXRpY3MvYXBwbHlDb21wb25lbnRGaWx0ZXInLFxuICAgICAgICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAgICAgICAnJm5vZGVJZHM9JyArXG4gICAgICAgICAgICAgIHNlbGVjdGVkTm9kZXMgK1xuICAgICAgICAgICAgICAnJmZpbHRlclR5cGU9JyArXG4gICAgICAgICAgICAgIHJlcG9ydEZpbHRlclR5cGUgK1xuICAgICAgICAgICAgICAnJnJlcG9ydElkPScgK1xuICAgICAgICAgICAgICBjdXJyTmV3UmVwb3J0LmNvbXBJZCArXG4gICAgICAgICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgJycsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNsb25lVG9Gb2xkZXJJZCkge1xuICAgICAgaWYgKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSkge1xuICAgICAgICBhcHBseVByb2dyYW1SZXBvcnRGaWx0ZXIoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQpXG4gICAgICB9IGVsc2UgaWYgKG5ld1Byb2dyYW1Db21wSWQpIHtcbiAgICAgICAgYXBwbHlQcm9ncmFtUmVwb3J0RmlsdGVyKExJQi5nZXRQcm9ncmFtQXNzZXREZXRhaWxzKG5ld1Byb2dyYW1Db21wSWQpLCBjbG9uZVRvRm9sZGVySWQpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHNldFByb2dyYW1UYWc6IGZ1bmN0aW9uIChvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YSwgbmV3UHJvZ3JhbUNvbXBJZCwgdGFnTmFtZSwgdGFnVmFsdWUpIHtcbiAgICBsZXQgY3VyclNldHRpbmcsIHRhZ0RhdGFcblxuICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YS5sZW5ndGg7IGlpKyspIHtcbiAgICAgIGN1cnJTZXR0aW5nID0gb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGFbaWldXG5cbiAgICAgIGlmIChjdXJyU2V0dGluZy5zdW1tYXJ5RGF0YS5uYW1lID09IHRhZ05hbWUpIHtcbiAgICAgICAgdGFnRGF0YSA9IGVuY29kZVVSSUNvbXBvbmVudChcbiAgICAgICAgICAne1wicHJvZ3JhbUlkXCI6JyArXG4gICAgICAgICAgbmV3UHJvZ3JhbUNvbXBJZCArXG4gICAgICAgICAgJyxcInByb2dyYW1EZXNjcmlwdG9ySWRcIjonICtcbiAgICAgICAgICBwYXJzZUludChjdXJyU2V0dGluZy5pZC5yZXBsYWNlKC9eUEQtLywgJycpKSArXG4gICAgICAgICAgJyxcImRlc2NyaXB0b3JJZFwiOicgK1xuICAgICAgICAgIGN1cnJTZXR0aW5nLmRlc2NyaXB0b3JJZCArXG4gICAgICAgICAgJyxcImRlc2NyaXB0b3JWYWx1ZVwiOlwiJyArXG4gICAgICAgICAgdGFnVmFsdWUgK1xuICAgICAgICAgICdcIn0nXG4gICAgICAgIClcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGFnRGF0YSkge1xuICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICcvbWFya2V0aW5nRXZlbnQvc2V0UHJvZ3JhbURlc2NyaXB0b3JTdWJtaXQnLFxuICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAnJmNvbXBJZD0nICtcbiAgICAgICAgbmV3UHJvZ3JhbUNvbXBJZCArXG4gICAgICAgICcmX2pzb249JyArXG4gICAgICAgIHRhZ0RhdGEgK1xuICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICdQT1NUJyxcbiAgICAgICAgZmFsc2UsXG4gICAgICAgICcnLFxuICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgfVxuICAgICAgKVxuICAgIH1cbiAgfVxuXG59XG4iLCJjb25zb2xlLmxvZygnR2xvYmFsIExhbmRpbmcgUGFnZSA+IFJ1bm5pbmcnKVxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXZhclxudmFyIE1BUktFVE9fTElWRV9MQU5ESU5HX1BBR0UgPSAnaHR0cHM6Ly9tYXJrZXRvbGl2ZS5jb20vbTMvcGx1Z2ludjMvbWFya2V0by1saXZlLWxhbmRpbmctcGFnZS5qcycsXG4gIG1rdG9MaXZlUHJvZExhbmRpbmdQYWdlRG9tYWluID0gJ2h0dHA6Ly9wYWdlcy5tYXJrZXRvbGl2ZS5jb20nLFxuICBta3RvTGl2ZURldkxhbmRpbmdQYWdlRG9tYWluID0gJ2h0dHA6Ly9kZXYucGFnZXMubWFya2V0b2xpdmUuY29tJyxcbiAgbWt0b0xpdmVMYW5kaW5nUGFnZUhvc3RzTWF0Y2ggPSAnaHR0cDovL25hLXNqZGVtbzEubWFya2V0by5jb20nLFxuICBta3RvTGl2ZURldk11bmNoa2luSWQgPSAnNjg1LUJUTi03NzInLFxuICBta3RvTGl2ZVByb2RNdW5jaGtpbklkID0gJzE4NS1OR1gtODExJyxcbiAgbWt0b0xpdmVOZXdQb2RNdW5jaGtpbklkID0gJzkyNC1MRkMtNTE0JyxcbiAgbWt0b0xpdmVNdW5jaGtpbklkc01hdGNoID0gJygnICsgbWt0b0xpdmVQcm9kTXVuY2hraW5JZCArICd8JyArIG1rdG9MaXZlRGV2TXVuY2hraW5JZCArICd8JyArIG1rdG9MaXZlTmV3UG9kTXVuY2hraW5JZCArICcpJyxcbiAgbWt0b0xpdmVMYW5kaW5nUGFnZURvbWFpbk1hdGNoID1cbiAgICAnXignICtcbiAgICBta3RvTGl2ZVByb2RMYW5kaW5nUGFnZURvbWFpbiArXG4gICAgJ3wnICtcbiAgICBta3RvTGl2ZURldkxhbmRpbmdQYWdlRG9tYWluICtcbiAgICAnfCcgK1xuICAgIG1rdG9MaXZlTGFuZGluZ1BhZ2VIb3N0c01hdGNoICtcbiAgICAnL2xwLycgK1xuICAgIG1rdG9MaXZlTXVuY2hraW5JZHNNYXRjaCArXG4gICAgJykvJ1xuXG5cbmlmICh3aW5kb3cubG9jYXRpb24uaHJlZi5zZWFyY2gobWt0b0xpdmVMYW5kaW5nUGFnZURvbWFpbk1hdGNoKSAhPSAtMSkge1xuICBjb25zb2xlLmxvZygnR2xvYmFsIExhbmRpbmcgUGFnZSA+IExvY2F0aW9uOiBNYXJrZXRvTGl2ZSBMYW5kaW5nIFBhZ2UnKVxuICBMSUIubG9hZFNjcmlwdChNQVJLRVRPX0xJVkVfTEFORElOR19QQUdFKVxufVxuIl19
