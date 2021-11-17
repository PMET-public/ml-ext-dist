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
                  OBJ.heapTrack('track', {
                    name: 'Mass Clone',
                    assetName: 'Tool'
                  })

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

console.log('Marketo App > Running')
/**************************************************************************************
 *  This script contains all of the functionality needed for the manipulation of the
 *  MarketoLive environments.
 **************************************************************************************/

// eslint-disable-next-line no-var
var prodExtensionId = 'onibnnoghllldiecboelbpcaeggfiohl',
  extensionId = prodExtensionId,
  extensionMinVersion = '5.0.0',
  mktoAppDomain = '^https://app-[a-z0-9]+.marketo.com',
  mktoDesignerDomain = '^https://[a-z0-9]+-[a-z0-9]+.marketodesigner.com',
  mktoDesignerHost = 'na-sjp.marketodesigner.com',
  mktoWizard = mktoAppDomain + '/m#',
  mktoEmailDesigner = mktoDesignerDomain + '/ds',
  mktoLandingPageDesigner = mktoDesignerDomain + '/lpeditor/',
  mktoEmailInsightsLink = 'https://insights.marketolive.com/email',
  mktoEmailDeliverabilityToolsLink = 'https://250ok.com/login?submit=true',
  mktoBizibleDiscoverLink = 'https://apps.bizible.com/Discover/3839',
  mktoBizibleRevPlanLink =
    'https://apps.bizible.com/MyAccount/Business/391?busView=false#!/MyAccount/Business/DecisionEngine.DecisionEngineHome',
  demoModelerLink = 'https://app-sjp.marketo.com/?preview=true&approved=true/#RCM83A1',
  mktoDemoAccountMatch = '^mktodemoaccount',
  mktoMyMarketoFragment = 'MM0A1',
  mktoMyMarketoSuperballFragment = 'MM',
  mktoCalendarFragment = 'CAL',
  mktoAnalyticsFragment = 'AR',
  mktoReportFragmentRegex = new RegExp('^AR[^!]+!$', 'i'),
  mktoModelerFragmentRegex = new RegExp('^RCM[^!]+!$', 'i'),
  mktoAnalyticsFragmentMatch = new RegExp('^AR[^!]+!$|^RCM[^!]+!$', 'i'),
  mktoModelerPreviewFragmentRegex = new RegExp('preview=true&approved=true/#RCM[^!]+!$', 'i'),
  mktoAnalyticsHomeFragment = 'AH0A1ZN',
  mktoAccountBasedMarketingFragment = 'ABM0A1',
  mktoAdBridgeSmartListFragment = 'SL1119566B2LA1',
  mktoAdminSalesforceFragment = 'SF0A1',
  mktoAdminDynamicsFragment = 'DY0A1',
  mktoAdminRcaCustomFieldSync = 'CFS0B2',
  mktoPersonDetailPath = '/leadDatabase/loadLeadDetail',
  mktoDefaultDiyLandingPageResponsiveEditFragment = 'LPE11822',
  waitAfterDiscard = 2000,
  mktoAccountStringMaster = 'mktodemolivemaster', //TODO temp change for testing back to mktodemolivemaster
  mktoAccountStringMasterMEUE = 'mktodemoaccount544', //abdemo1 clone of mktodemolivemaster
  mktoAccountStringQe = 'globalsales',
  mktoAccountString106 = 'mktodemoaccount106',
  mktoAccountString106d = 'mktodemoaccount106d',
  mktoAccountStringDynamics = 'mktodemoaccount408',
  mktoAccountStrings106Match = '^(' + mktoAccountString106 + '|' + mktoAccountString106d + ')$',
  mktoAccountStringsMatch =
    '^(' +
    mktoAccountStringMaster +
    '|' +
    mktoAccountStringMasterMEUE +
    '|' +
    mktoAccountString106 +
    '|' +
    mktoAccountString106d +
    '|' +
    mktoAccountStringDynamics +
    ')$', //TODO changed for MEUE
  mktoLaunchPointFolderToHide = new RegExp('^LaunchPoint$', 'i'),
  mktoOperationalFolders = new RegExp('^_Operational|^_Operations|\\(TEST\\)$', 'i'),
  mktoMasterMarketingActivitiesEnglishFragment = 'MA19A1',
  mktoMarketingActivitiesDefaultFragment = 'MA15A1',
  mktoMarketingActivitiesUserFragment = 'MA19802A1',
  mktoMarketingActivitiesJapaneseFragment = 'MA19848A1',
  mktoMarketingActivitiesFinservFragment = 'MA20806A1',
  mktoMarketingActivitiesHealthcareFragment = 'MA20826A1',
  mktoMarketingActivitiesHigherEdFragment = 'MA20846A1',
  mktoMarketingActivitiesManufacturingFragment = 'MA26410A1',
  mktoMarketingActivitiesTechnologyFragment = 'MA26489A1',
  mktoMarketingActivitiesTravelLeisureFragment = 'MA27588A1',
  mktoMasterLeadDatabaseEnglishFragment = 'ML0A1ZN5',
  mktoLeadDatabaseDefaultFragment = 'ML0A1ZN2',
  mktoLeadDatabaseUserFragment = 'ML0A1ZN19788',
  mktoLeadDatabaseJapaneseFragment = 'ML0A1ZN19834',
  mktoLeadDatabaseFinservFragment = 'ML0A1ZN20792',
  mktoLeadDatabaseHealthcareFragment = 'ML0A1ZN20812',
  mktoLeadDatabaseHigherEdFragment = 'ML0A1ZN20832',
  mktoLeadDatabaseManufacturingFragment = 'ML0A1ZN26396',
  mktoLeadDatabaseTechnologyFragment = 'ML0A1ZN26475',
  mktoLeadDatabaseTravelLeisureFragment = 'ML0A1ZN27574',
  mktoAdminEmailEmailFragment = 'EA0A1',
  mktoAdminWebServicesFragment = 'MW0A1',
  mktoAdminWebSkyFragment = 'HG0A1',
  mktoDisableButtonsFragmentMatch =
    '^(' +
    mktoMasterMarketingActivitiesEnglishFragment +
    '|' +
    mktoMarketingActivitiesDefaultFragment +
    '|' +
    mktoMarketingActivitiesUserFragment +
    '|' +
    mktoMarketingActivitiesJapaneseFragment +
    '|' +
    mktoMarketingActivitiesFinservFragment +
    '|' +
    mktoMarketingActivitiesHealthcareFragment +
    '|' +
    mktoMarketingActivitiesHigherEdFragment +
    '|' +
    mktoMarketingActivitiesManufacturingFragment +
    '|' +
    mktoMarketingActivitiesTechnologyFragment +
    '|' +
    mktoMarketingActivitiesTravelLeisureFragment +
    '|' +
    mktoMasterLeadDatabaseEnglishFragment +
    '|' +
    mktoLeadDatabaseDefaultFragment +
    '|' +
    mktoLeadDatabaseUserFragment +
    '|' +
    mktoLeadDatabaseJapaneseFragment +
    '|' +
    mktoLeadDatabaseFinservFragment +
    '|' +
    mktoLeadDatabaseHealthcareFragment +
    '|' +
    mktoLeadDatabaseHigherEdFragment +
    '|' +
    mktoLeadDatabaseManufacturingFragment +
    '|' +
    mktoLeadDatabaseTechnologyFragment +
    '|' +
    mktoLeadDatabaseTravelLeisureFragment +
    '|' +
    mktoAdminEmailEmailFragment +
    '|' +
    mktoAdminWebServicesFragment +
    ')$',
  mktoOppInfluenceAnalyzerFragment = 'AR1559A1!',
  mktoProgramAnalyzerFragment = 'AR1544A1!',
  mktoModelerFragment = 'RCM70A1!',
  mktoSuccessPathAnalyzerFragment = 'AR1682A1!',
  mktoAnalyzersFragmentMatch =
    '^(' +
    mktoOppInfluenceAnalyzerFragment +
    '|' +
    mktoProgramAnalyzerFragment +
    '|' +
    mktoModelerFragment +
    '|' +
    mktoSuccessPathAnalyzerFragment +
    ')$',
  mktoMobilePushNotificationFragment = 'MPN',
  mktoInAppMessageFragment = 'IAM',
  mktoSmsMessageFragment = 'SMS',
  mktoSocialAppFragment = 'SOA',
  mktoOtherAssetsFragmentMatch =
    '^(' +
    mktoMobilePushNotificationFragment +
    '|' +
    mktoInAppMessageFragment +
    '|' +
    mktoSmsMessageFragment +
    '|' +
    mktoSocialAppFragment +
    ')',
  mktoAbmDiscoverMarketoCompaniesFragment = 'ABMDM',
  mktoAbmDiscoverCrmAccountsFragment = 'ABMDC',
  mktoAbmNamedAccountFragment = 'NA',
  mktoAbmImportNamedAccountsFragment = 'ABMIA',
  mktoAbmFragmentMatch =
    '^(' +
    mktoAbmDiscoverMarketoCompaniesFragment +
    '|' +
    mktoAbmDiscoverCrmAccountsFragment +
    '|' +
    mktoAbmNamedAccountFragment +
    '|' +
    mktoAbmImportNamedAccountsFragment +
    ')$',
  mktoEmailEditFragment = 'EME',
  mktoEmailPreviewFragmentRegex = new RegExp('^EME[0-9]+&isPreview', 'i'),
  mktoEmailPreviewFragment2 = 'EME[0-9]+&isPreview',
  mktoEmailPreviewFragment = 'EMP',
  mktoEmailTemplateEditFragment = 'EMTE',
  mktoLandingPageEditFragment = 'LPE',
  mktoLandingPagePreviewFragment = 'LPP',
  mktoLandingPagePreviewDraftFragment = 'LPPD',
  mktoLandingPageTemplateEditFragment = 'LPTE',
  mktoLandingPageTemplatePreviewFragment = 'LPTPD',
  mktoFormEditFragment = 'FOE',
  mktoFormPreviewFragment = 'FOP',
  mktoFormPreviewDraftFragment = 'FOPD',
  mktoPushNotificationEditFragment = 'MPNE',
  mktoMobilePushNotificationPreviewFragment = 'MPNP',
  mktoInAppMessageEditFragment = 'IAME',
  mktoInAppMessagePreviewFragment = 'IAMP',
  mktoSmsMessageEditFragment = 'SME',
  mktoSocialAppEditFragment = 'SOAE',
  mktoSocialAppPreviewFragment = 'SOAP',
  mktoAbTestEditFragment = 'EBE',
  mktoEmailTestGroupEditFragment = 'CCE',
  mktoSnippetEditFragment = 'SNE',
  mktoSnippetPreviewFragment = 'SNP',
  mktoDesignersFragmentMatch =
    '^' +
    mktoEmailEditFragment +
    '$|^' +
    mktoEmailPreviewFragment2 +
    '|^' +
    mktoEmailPreviewFragment +
    '$|^' +
    mktoEmailTemplateEditFragment +
    '$|^' +
    mktoLandingPageEditFragment +
    '$|^' +
    mktoLandingPagePreviewFragment +
    '$|^' +
    mktoLandingPagePreviewDraftFragment +
    '$|^' +
    mktoLandingPageTemplateEditFragment +
    '$|^' +
    mktoLandingPageTemplatePreviewFragment +
    '$|^' +
    mktoFormEditFragment +
    '$|^' +
    mktoFormPreviewFragment +
    '$|^' +
    mktoFormPreviewDraftFragment +
    '$|^' +
    mktoPushNotificationEditFragment +
    '$|^' +
    mktoMobilePushNotificationPreviewFragment +
    '$|^' +
    mktoInAppMessageEditFragment +
    '$|^' +
    mktoInAppMessagePreviewFragment +
    '$|^' +
    mktoSmsMessageEditFragment +
    '$|^' +
    mktoSocialAppEditFragment +
    '$|^' +
    mktoSocialAppPreviewFragment +
    '$|^' +
    mktoAbTestEditFragment +
    '$|^' +
    mktoEmailTestGroupEditFragment +
    '$|^' +
    mktoSnippetEditFragment +
    '$|^' +
    mktoSnippetPreviewFragment +
    '$',
  mktoDefaultWorkspaceId,
  mktoJapaneseWorkspaceId,
  mktoFinservWorkspaceId,
  mktoHealthcareWorkspaceId,
  mktoHigherEdWorkspaceId,
  mktoManufacturingWorkspaceId,
  mktoTechnologyWorkspaceId,
  mktoTravelLesiureWorkspaceId,
  mktoUnknownWorkspaceId,
  mktoGoldenWorkspacesMatch,
  mktoMyWorkspaceEnId,
  mktoMyWorkspaceJpId,
  mktoMyWorkspaceIdMatch,
  mktoMyWorkspaceEnName,
  mktoMyWorkspaceJpName,
  mktoMyWorkspaceNameMatch,
  mktoOtherWorkspaceName,
  mktoEmailPerformanceReport,
  mktoPeoplePerformanceReport,
  mktoWebPageActivityReport,
  mktoOpportunityInfluenceAnalyzer,
  mktoProgramAnalyzer,
  mktoSuccessPathAnalyzer,
  mktoPerformanceInsightsLink,
  mktoEngagmentStreamPerformaceReport,
  mktoProgramPerformanceReport,
  mktoEmailLinkPerformanceReport,
  mktoPeopleByRevenueStageReport,
  mktoLandingPagePerformanceReport,
  mktoPeopleByStatusReport,
  mktoCompanyWebActivityReport,
  mktoSalesInsightEmailPerformanceReport,
  restoreEmailInsights,
  origEmailInsightsTileLink,
  origEmailInsightsMenuItemLink,
  currUrlFragment,
  currCompFragment,
  userName,
  accountString,
  origMenuShowAtFunc,
  origAjaxRequestFunc,
  origAssetSaveEdit,
  origFillCanvas,
  origExplorerPanelAddNode,
  origExplorerPanelRemoveNodes,
  origExplorerPanelUpdateNodeText,
  overrideTileTimerCount = true,
  APP = APP || {}

// set the instance specific variables with the proper values
APP.setInstanceInfo = function (accountString) {
  if (accountString == mktoAccountStringMaster) {
    mktoDefaultWorkspaceId = 1
    mktoJapaneseWorkspaceId = 3
    mktoUnknownWorkspaceId = -1
    mktoGoldenWorkspacesMatch = '^(' + mktoDefaultWorkspaceId + '|' + mktoJapaneseWorkspaceId + '|' + mktoUnknownWorkspaceId + ')$'

    mktoMyWorkspaceEnId
    mktoMyWorkspaceJpId
    mktoMyWorkspaceIdMatch = null

    mktoMyWorkspaceEnName
    mktoMyWorkspaceJpName
    mktoMyWorkspaceNameMatch = null

    mktoOtherWorkspaceName = 'User\'s Workspace'

    mktoEmailPerformanceReport = 'AR205B2'
    mktoPeoplePerformanceReport = 'AR23B2'
    mktoWebPageActivityReport = 'AR218B2'
    mktoOpportunityInfluenceAnalyzer = 'AR207A1'
    mktoProgramAnalyzer = 'AR223A1'
    mktoSuccessPathAnalyzer = 'AR208A1'
    mktoPerformanceInsightsLink = 'https://insights.marketolive.com/mpi'
    mktoEngagmentStreamPerformaceReport = 'AR209B2'
    mktoProgramPerformanceReport = 'AR216B2'
    mktoEmailLinkPerformanceReport = 'AR204B2'
    mktoPeopleByRevenueStageReport = 'AR26B2'
    mktoLandingPagePerformanceReport = 'AR210B2'
    mktoPeopleByStatusReport = 'AR225B2'
    mktoCompanyWebActivityReport = 'AR221B2'
    mktoSalesInsightEmailPerformanceReport = 'AR226B2'
  } else if (accountString == mktoAccountStringMasterMEUE) {
    mktoDefaultWorkspaceId = 1
    mktoJapaneseWorkspaceId = 3
    mktoUnknownWorkspaceId = -1
    mktoGoldenWorkspacesMatch = '^(' + mktoDefaultWorkspaceId + '|' + mktoJapaneseWorkspaceId + '|' + mktoUnknownWorkspaceId + ')$'

    mktoMyWorkspaceEnId
    mktoMyWorkspaceJpId
    mktoMyWorkspaceIdMatch = null

    mktoMyWorkspaceEnName
    mktoMyWorkspaceJpName
    mktoMyWorkspaceNameMatch = null

    mktoOtherWorkspaceName = 'User\'s Workspace'

    mktoEmailPerformanceReport = 'AR205B2'
    mktoPeoplePerformanceReport = 'AR23B2'
    mktoWebPageActivityReport = 'AR218B2'
    mktoOpportunityInfluenceAnalyzer = 'AR207A1'
    mktoProgramAnalyzer = 'AR223A1'
    mktoSuccessPathAnalyzer = 'AR208A1'
    mktoPerformanceInsightsLink = 'https://insights.marketolive.com/mpi'
    mktoEngagmentStreamPerformaceReport = 'AR209B2'
    mktoProgramPerformanceReport = 'AR216B2'
    mktoEmailLinkPerformanceReport = 'AR204B2'
    mktoPeopleByRevenueStageReport = 'AR26B2'
    mktoLandingPagePerformanceReport = 'AR210B2'
    mktoPeopleByStatusReport = 'AR225B2'
    mktoCompanyWebActivityReport = 'AR221B2'
    mktoSalesInsightEmailPerformanceReport = 'AR226B2'
  } else if (accountString.search(mktoAccountStrings106Match) != -1) {
    mktoDefaultWorkspaceId = 1
    mktoJapaneseWorkspaceId = 173
    mktoFinservWorkspaceId = 174
    mktoHealthcareWorkspaceId = 175
    mktoHigherEdWorkspaceId = 176
    mktoManufacturingWorkspaceId = 184
    mktoTechnologyWorkspaceId = 185
    mktoTravelLesiureWorkspaceId = 186
    mktoUnknownWorkspaceId = -1
    mktoGoldenWorkspacesMatch =
      '^(' +
      mktoDefaultWorkspaceId +
      '|' +
      mktoJapaneseWorkspaceId +
      '|' +
      mktoFinservWorkspaceId +
      '|' +
      mktoHealthcareWorkspaceId +
      '|' +
      mktoHigherEdWorkspaceId +
      '|' +
      mktoManufacturingWorkspaceId +
      '|' +
      mktoTechnologyWorkspaceId +
      '|' +
      mktoTravelLesiureWorkspaceId +
      '|' +
      mktoUnknownWorkspaceId +
      ')$'

    mktoMyWorkspaceEnId = 172
    mktoMyWorkspaceIdMatch = '^(' + mktoMyWorkspaceEnId + ')$'

    mktoMyWorkspaceEnName = 'My Workspace'
    mktoMyWorkspaceNameMatch = '^(' + mktoMyWorkspaceEnName + ')$'

    mktoOtherWorkspaceName = 'User\'s Workspace'

    mktoEmailPerformanceReport = 'AR3866B2'
    mktoPeoplePerformanceReport = 'AR3874B2'
    mktoWebPageActivityReport = 'AR3876B2'
    mktoOpportunityInfluenceAnalyzer = 'AR1559A1'
    mktoProgramAnalyzer = 'AR1544A1'
    mktoSuccessPathAnalyzer = 'AR1682A1'
    mktoPerformanceInsightsLink = 'https://insights.marketolive.com/mpi'
    mktoEngagmentStreamPerformaceReport = 'AR3881B2'
    mktoProgramPerformanceReport = 'AR3882B2'
    mktoEmailLinkPerformanceReport = 'AR3886B2'
    mktoPeopleByRevenueStageReport = 'AR3889B2'
    mktoLandingPagePerformanceReport = 'AR3891B2'
    mktoPeopleByStatusReport = 'AR3893B2'
    mktoCompanyWebActivityReport = 'AR3901B2'
    mktoSalesInsightEmailPerformanceReport = 'AR3903B2'
  } else if (accountString == mktoAccountStringDynamics) {
    mktoDefaultWorkspaceId = 1
    mktoUnknownWorkspaceId = -1
    mktoGoldenWorkspacesMatch = '^(' + mktoDefaultWorkspaceId + '|' + mktoUnknownWorkspaceId + ')$'

    mktoMyWorkspaceIdMatch = null
    mktoMyWorkspaceNameMatch = null

    mktoPerformanceInsightsLink = 'https://insights.marketolive.com/mpi'
  }
}

/**************************************************************************************
 *  This function sends a message to the extension in order to create a Chrome
 *  notification in a given instance and a user with a specific role.
 *  @param {String} accountString - Marketo instance
 *  @param {String} roleName - role of the current user (Optional)
 *  @param {String} mktoUserId - user name of the current user (Optional)
 **************************************************************************************/

APP.sendMktoMessage = function (accountString, roleName, mktoUserId) {
  let adTargetingMsg = {
      action: 'mktoLiveMessage',
      id: 'adTargeting',
      title: 'New Feature: Ad Targeting',
      notify: 'Now you can quickly capture ad targeting images or demo ad targeting live for:\n\nGoogle Search, Facebook, LinkedIn',
      requireInteraction: true,
      buttonTitle: '                        Learn More -->',
      buttonLink: 'http://www.marketolive.com/en/learn/videos',
      startDate: '',
      endDate: '07-27-2017',
      numOfTimesPerDay: 1
    },
    userWorkspaceMsg = {
      action: 'mktoLiveMessage',
      id: 'userWorkspace',
      title: 'New To Reloaded: User Workspace',
      notify:
        'Leverage your own SC workspace for creating any program/asset using the provided demo data of our shared partition in the MarketoLive Reloaded instance.\n\nUser ID: ',
      requireInteraction: true,
      startDate: '',
      endDate: '07-12-2017',
      numOfTimesPerDay: 2
    },
    extensionUpdateMsg = {
      action: 'mktoLiveMessage',
      id: 'extensionUpdate',
      title: 'Coming Soon: Extension v5.2.0',
      notify:
        'Within the next day or two your extension will automatically update and be disabled due to new permissions being requested. Approve the new permission by re-enabling the extension.',
      requireInteraction: true,
      buttonTitle: '                        How to Re-enable the Extension -->',
      buttonLink: 'http://www.marketolive.com/en/update/extension-update',
      startDate: '',
      endDate: '08-16-2017',
      numOfTimesPerDay: 1
    },
    changePasswordMsg = {
      action: 'mktoLiveMessage',
      id: 'changePasswordMsg',
      title: 'MANDATORY: Change Your Password',
      notify: 'As per IT security policy, passwords must expire every 60 days. Please change your password before August 18th.',
      requireInteraction: true,
      buttonTitle: '                        Change Your Password -->',
      buttonLink: 'https://app-sjdemo1.marketo.com/#MC0A1',
      startDate: '',
      endDate: '08-17-2017',
      numOfTimesPerDay: 1
    },
    issueMsg = {
      action: 'mktoLiveMessage',
      id: 'emailInsightsMsg',
      title: 'Email Insights Not Working',
      notify:
        'There is a known issue with Email Insights not displaying data after 07/15/17.\n\nAs a fix, I have deep linked it\'s tile and menu item to our Email Insights demo app.',
      requireInteraction: true,
      buttonTitle: '                        Email Insights Demo App -->',
      buttonLink: 'http://www.marketolive.com/en/analytics/email-insights-summit-demo-1',
      startDate: '',
      endDate: '08-09-2017',
      numOfTimesPerDay: 1
    }

  chrome.runtime.sendMessage(extensionId, extensionUpdateMsg)

}

APP.getWorkspaceName = function (workspaceId) {
  switch (parseInt(workspaceId)) {
    case mktoDefaultWorkspaceId:
      return 'Default'
    case mktoJapaneseWorkspaceId:
      return 'デモ'
    case mktoFinservWorkspaceId:
      return 'Financial Services'
    case mktoHealthcareWorkspaceId:
      return 'Healthcare'
    case mktoHigherEdWorkspaceId:
      return 'Higher Education'
    case mktoManufacturingWorkspaceId:
      return 'Manufacturing'
    case mktoTechnologyWorkspaceId:
      return 'Technology'
    case mktoTravelLesiureWorkspaceId:
      return 'Travel Leisure'
    case mktoMyWorkspaceEnId:
      return 'My Workspace'
    default:
      return 'Unknown'
  }
}

// returns the 2-3 letter asset code for the asset type provided.
APP.getAssetCompCode = function (compType) {
  switch (compType) {
    case 'Marketing Folder':
      return 'MF'
    case 'Marketing Program':
      return 'PG'
    case 'Marketing Event':
      return 'ME'
    case 'Nurture Program':
      return 'NP'
    case 'Email Batch Program':
      return 'EBP'
    case 'List':
      return 'ST'
    case 'Smart List':
      return 'SL'
    case 'Smart Campaign':
      return 'SC'
    case 'Landing Page Form':
      return 'FO'
    case 'Landing Page':
      return 'LP'
    case 'Landing Page Test Group':
      return 'LP'
    case 'Landing Page Template':
      return 'LT'
    case 'Email':
      return 'EM'
    case 'Test Group':
      return 'TG'
    case 'Email Template':
      return 'ET'
    case 'Social App':
      return 'SOA'
    case 'Mobile Push Notification':
      return 'MPN'
    case 'In-App Message':
      return 'IAM'
    case 'SMS Message':
      return 'SMS'
    case 'Segmentation':
      return 'SG'
    case 'Report':
      return 'AR'
    case 'Revenue Cycle Model':
      return 'RCM'
    case 'Snippet':
      return 'SN'
    case 'Image':
      return 'FI'
  }
}

/**************************************************************************************
 *  This function monitors changes to the Tree and tracks whenever a node is either
 *  added or renamed in a golden workspace and reports this to the user via an
 *  extension notification and to the Demo Services Team via marketolive-bugs private
 *  Slack channel.
 **************************************************************************************/
APP.trackTreeNodeEdits = function () {
  console.log('Marketo App > Tracking: Edits to Tree Nodes')
  let violationMsg = {
    action: 'mktoLiveMessage',
    id: 'Not Permitted',
    title: 'Not Permitted',
    notify: '',
    requireInteraction: true
  }

  if (LIB.isPropOfWindowObj('Mkt.main.ExplorerPanel.prototype.addNode')) {
    if (typeof origExplorerPanelAddNode !== 'function') {
      origExplorerPanelAddNode = Mkt.main.ExplorerPanel.prototype.addNode
    }
    Mkt.main.ExplorerPanel.prototype.addNode = function (parentId, nodeConfig, selected) {
      if (
        nodeConfig &&
        ((nodeConfig.z && nodeConfig.z.toString().search(mktoGoldenWorkspacesMatch) != -1) ||
          (nodeConfig.accessZoneId && nodeConfig.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1))
      ) {
        let changedNodeInfo =
            '\n>*Added Node:* ' +
            nodeConfig.compType +
            ' | ' +
            nodeConfig.text +
            ' | ' +
            'https://' +
            window.location.host +
            '/#' +
            APP.getAssetCompCode(nodeConfig.compType) +
            nodeConfig.compId,
          workspaceId,
          workspaceName,
          workspaceInfo,
          userInfo,
          parentNodeInfo

        if (nodeConfig.z) {
          workspaceId = nodeConfig.z
          workspaceName = APP.getWorkspaceName(nodeConfig.z)
        } else {
          workspaceId = nodeConfig.accessZoneId
          workspaceName = APP.getWorkspaceName(nodeConfig.accessZoneId)
        }
        workspaceInfo = '\n>*Workspace:* ' + workspaceName

        if (MktPage && MktPage.userName && MktPage.userid) {
          userInfo = '\n>*User:* ' + MktPage.userName + ' (' + MktPage.userid + ') '
        }
        if (
          this.getNodeById(parentId) &&
          this.getNodeById(parentId).attributes &&
          this.getNodeById(parentId).attributes.text &&
          this.getNodeById(parentId).attributes.compType &&
          this.getNodeById(parentId).attributes.compId
        ) {
          parentNodeInfo =
            '\n>*Parent Node:* ' +
            this.getNodeById(parentId).attributes.compType +
            ' | ' +
            this.getNodeById(parentId).attributes.text +
            ' | ' +
            'https://' +
            window.location.host +
            '/#' +
            APP.getAssetCompCode(this.getNodeById(parentId).attributes.compType) +
            this.getNodeById(parentId).attributes.compId
        }

        LIB.webRequest(
          'https://hooks.slack.com/services/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',
          '{"text": "*Unauthorized Changes*' + userInfo + workspaceInfo + parentNodeInfo + changedNodeInfo + '"}',
          'POST',
          true,
          ''
        )

        APP.heapTrack('track', {
          name: 'Unauthorized Node Added',
          assetName: nodeConfig.text,
          assetId: nodeConfig.compId,
          assetType: nodeConfig.compType,
          workspaceId: workspaceId,
          workspaceName: workspaceName
        })

        ;(violationMsg.notify = 'Do not make changes to the ' + workspaceName + ' Workspace!'),
        chrome.runtime.sendMessage(extensionId, violationMsg)
      }
      origExplorerPanelAddNode.apply(this, arguments)
    }
  } else {
    console.log('Marketo App > Skipping: Track Adding Tree Nodes')
  }

  if (LIB.isPropOfWindowObj('Mkt.main.ExplorerPanel.prototype.removeNodes')) {
    if (typeof origExplorerPanelRemoveNodes !== 'function') {
      origExplorerPanelRemoveNodes = Mkt.main.ExplorerPanel.prototype.removeNodes
    }

    Mkt.main.ExplorerPanel.prototype.removeNodes = function (nodeIds) {
      if (
        this.getNodeById(nodeIds[0]) &&
        this.getNodeById(nodeIds[0]).attributes &&
        this.getNodeById(nodeIds[0]).attributes.accessZoneId &&
        this.getNodeById(nodeIds[0]).attributes.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1
      ) {
        let nodeConfig = this.getNodeById(nodeIds[0]).attributes,
          workspaceName = APP.getWorkspaceName(nodeConfig.accessZoneId),
          workspaceInfo = '\n>*Workspace:* ' + workspaceName,
          changedNodeInfo =
            '\n>*Removed Node:* ' +
            nodeConfig.compType +
            ' | ' +
            nodeConfig.text +
            ' | ' +
            'https://' +
            window.location.host +
            '/#' +
            APP.getAssetCompCode(nodeConfig.compType) +
            nodeConfig.compId,
          userInfo

        if (MktPage && MktPage.userName && MktPage.userid) {
          userInfo = '\n>*User:* ' + MktPage.userName + ' (' + MktPage.userid + ') '
        }

        LIB.webRequest(
          'https://hooks.slack.com/services/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',
          '{"text": "*Unauthorized Changes*' + userInfo + workspaceInfo + changedNodeInfo + '"}',
          'POST',
          true,
          ''
        )

        APP.heapTrack('track', {
          name: 'Unauthorized Node Removed',
          assetName: nodeConfig.text,
          assetId: nodeConfig.compId,
          assetType: nodeConfig.compType,
          workspaceId: nodeConfig.accessZoneId,
          workspaceName: workspaceName
        })

        ;(violationMsg.notify = 'Do not make changes to the ' + workspaceName + ' Workspace!'),
        chrome.runtime.sendMessage(extensionId, violationMsg)
      }
      origExplorerPanelRemoveNodes.apply(this, arguments)
    }
  } else {
    console.log('Marketo App > Skipping: Track Removing Tree Nodes')
  }

  if (LIB.isPropOfWindowObj('Mkt.main.ExplorerPanel.prototype.updateNodeText')) {
    if (typeof origExplorerPanelUpdateNodeText !== 'function') {
      origExplorerPanelUpdateNodeText = Mkt.main.ExplorerPanel.prototype.updateNodeText
    }

    Mkt.main.ExplorerPanel.prototype.updateNodeText = function (nodeId, text) {
      if (
        this.getNodeById(nodeId) &&
        this.getNodeById(nodeId).attributes &&
        this.getNodeById(nodeId).attributes.accessZoneId &&
        this.getNodeById(nodeId).attributes.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1
      ) {
        let nodeConfig = this.getNodeById(nodeId).attributes,
          workspaceName = APP.getWorkspaceName(nodeConfig.accessZoneId),
          workspaceInfo = '\n>*Workspace:* ' + workspaceName,
          changedNodeInfo =
            '\n>*Renamed Node:* ' +
            nodeConfig.compType +
            ' | From \'' +
            nodeConfig.text +
            '\' to \'' +
            text +
            '\' | ' +
            'https://' +
            window.location.host +
            '/#' +
            APP.getAssetCompCode(nodeConfig.compType) +
            nodeConfig.compId,
          userInfo

        if (MktPage && MktPage.userName && MktPage.userid) {
          userInfo = '\n>*User:* ' + MktPage.userName + ' (' + MktPage.userid + ') '
        }

        LIB.webRequest(
          'https://hooks.slack.com/services/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',
          '{"text": "*Unauthorized Changes*' + userInfo + workspaceInfo + changedNodeInfo + '"}',
          'POST',
          true,
          ''
        )

        APP.heapTrack('track', {
          name: 'Unauthorized Node Renamed',
          assetName: nodeConfig.text,
          assetId: nodeConfig.compId,
          assetType: nodeConfig.compType,
          workspaceId: nodeConfig.accessZoneId,
          workspaceName: workspaceName
        })

        ;(violationMsg.notify =
          'You are not permitted to make changes to ' + workspaceName + '!\n\nThe Demo Services Team has been notified of this violation.'),
        chrome.runtime.sendMessage(extensionId, violationMsg)
      }
      origExplorerPanelUpdateNodeText.apply(this, arguments)
    }
  } else {
    console.log('Marketo App > Skipping: Track Renaming Tree Nodes')
  }
}

/**************************************************************************************
 *  This function disables saving of edits to the Landing Page Property Panel and also
 *  disables the system error message for sync errors on Landing Pages. These errors
 *  would occur when two users edit the same landing page simultaneously.
 **************************************************************************************/

APP.disablePropertyPanelSaving = function () {
  console.log('Marketo App > Disabling: Saving of Landing Page Property Panel & Sync Error Message')
  if (LIB.isPropOfWindowObj('Mkt3.controller.editor.LandingPagePropertyPanel.prototype.fireSyncProperties')) {
    Mkt3.controller.editor.LandingPagePropertyPanel.prototype.fireSyncProperties = function () {
      console.log('Marketo App > Executing: Disable Saving of Landing Page Property Panel & Sync Error Message')
    }
  }
}

/**************************************************************************************
 *  This function disables the confirmation message for deleting Triggers, Filters, and
 *  Flow Steps from a Smart Campaign or Smart List in the Default Worksapce.
 **************************************************************************************/

APP.disableConfirmationMessage = function () {
  console.log('Marketo App > Disabling: Smart Campaign Delete Confirmation Message')
  if (LIB.isPropOfWindowObj('Mkt.widgets.DataPanel.prototype.clickClose')) {
    Mkt.widgets.DataPanel.prototype.clickClose = function () {
      console.log('Marketo App > Executing: Disable Smart Campaign Delete Confirmation Message')
      let hasChanges = this.hasSettings(),
        showTriggerWarning = false
      if (this.isSmartlist && this.dpMeta.trigger) {
        let triggerCount = this.dpMgr.getTriggers().length
        if (triggerCount == 1) {
          showTriggerWarning = true
        }
      }

      if (hasChanges || showTriggerWarning) {
        let title = MktLang.getStr('DataFormPanel.Delete_arg0', [this.dpTypeName(true)]),
          name = this.dpMeta.displayName || this.dpMeta.name,
          msg = MktLang.getStr('DataFormPanel.Are_you_sure_you_want_to_delete_arg0_arg1', [this.dpTypeName(), MktLang.getDBStr(name)])

        if (showTriggerWarning) {
          msg += MktLang.getStr('DataFormPanel.Triggered_campaigns_must_contain_trigger_remain_active')
        }

        if (this.dpMgr.isSmartlist && !this.dpMeta.trigger && this.dpMgr.smartListRuleLogic.customMode()) {
          msg +=
            MktLang.getStr('DataFormPanel.Reminder') +
            MktLang.getStr('DataFormPanel.Check_your_advanced_filter_rules_after_any_insert_delete_reorder')
        }

        if (
          LIB.isPropOfWindowObj('MktCanvas.getActiveTab') &&
          MktCanvas.getActiveTab() &&
          MktCanvas.getActiveTab().config &&
          MktCanvas.getActiveTab().config.accessZoneId
        ) {
          console.log('Marketo App > Closing: Smart Campaign Delete Confirmation Message')
          this._doClose()
        } else {
          Ext4.Msg.confirmDelete({
            title: title,
            msg: msg,
            minHeight: 300,
            fn: function (buttonId) {
              if (buttonId === 'ok') {
                this._doClose()
              }
            },
            scope: this
          })
        }
      } else {
        this._doClose()
      }
    }
  }
}

APP.overrideHomeTilesResize = function () {
  //resizeFirstCall = false;
  let container = MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0],
    tilesTextContent = container.getElementsByTagName('span'),
    hrefMatch = new RegExp(' href="[^"]*" ', 'g'),
    performanceInsightsTile,
    emailInsightsTile,
    hiddenTile1,
    hiddenTile2,
    mpiRepeat = false,
    eiRepeat = false,
    toBeRemoved = []

  for (let ii = 0; ii < tilesTextContent.length; ii++) {
    let tile = tilesTextContent[ii]
    switch (tile.textContent) {
      case 'Performance Insights':
        if (tile.parentNode.parentNode.parentNode.style.display != 'none') {
          if (mpiRepeat) {
            toBeRemoved.push(tile.parentNode.parentNode.parentNode)
          } else {
            mpiRepeat = true
            performanceInsightsTile = tile.parentNode.parentNode.parentNode
          }
        }
        break
      case 'Email Insights':
        if (eiRepeat) {
          toBeRemoved.push(tile.parentNode.parentNode.parentNode)
        } else {
          eiRepeat = true
          emailInsightsTile = tile.parentNode.parentNode.parentNode
        }
        break
    }
  }

  for (let x = 0; x < toBeRemoved.length; x++) {
    toBeRemoved[x].remove()
  }
  if (performanceInsightsTile) {
    performanceInsightsTile.outerHTML = performanceInsightsTile.outerHTML.replace(hrefMatch, ' href="' + mktoPerformanceInsightsLink + '" ')

    document.getElementById(performanceInsightsTile.id).onclick = function () {
      APP.heapTrack('track', {
        name: 'Performance Insights',
        assetArea: 'Performance Insights',
        assetName: 'Demo App',
        assetType: 'Home Tile'
      })
    }
  } else {
    let performanceInsightsTileEl = document.createElement('div')
    performanceInsightsTileEl.className =
      'x4-btn mkt3-homeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left'
    performanceInsightsTileEl.style = 'height: 150px;'
    performanceInsightsTileEl.id = 'performanceInsightsTile'
    performanceInsightsTileEl.innerHTML =
      '<em id="performanceInsightsTile-btnWrap"><a id="performanceInsightsTile-btnEl" href="' +
      mktoPerformanceInsightsLink +
      '" class="x4-btn-center" target="_blank" role="link" style="width: 150px; height: 150px;"><span id="performanceInsightsTile-btnInnerEl" class="x4-btn-inner" style="width: 150px; height: 150px; line-height: 150px;">Performance Insights</span><span id="performanceInsightsTile-btnIconEl" class="x4-btn-icon mki3-mpi-logo-svg"></span></a></em>'

    container.insertBefore(performanceInsightsTileEl, container.childNodes[container.childNodes.length - 1])
    document.getElementById('performanceInsightsTile').onclick = function () {
      APP.heapTrack('track', {
        name: 'Performance Insights',
        assetArea: 'Performance Insights',
        assetName: 'Demo App',
        assetType: 'Home Tile'
      })
    }
  }
  if (emailInsightsTile) {
    emailInsightsTile.outerHTML = emailInsightsTile.outerHTML.replace(hrefMatch, ' href="' + mktoEmailInsightsLink + '" ')
    document.getElementById(emailInsightsTile.id).onclick = function () {
      APP.heapTrack('track', {
        name: 'Email Insights',
        assetArea: 'Email Insights',
        assetName: 'Home',
        assetType: 'Home Tile'
      })
    }
  } else {
    let emailInsightsTileEl = document.createElement('div')
    emailInsightsTileEl.className =
      'x4-btn mkt3-homeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left x-panel'
    emailInsightsTileEl.style = 'height: 150px;'
    emailInsightsTileEl.id = 'emailInsightsTile'
    emailInsightsTileEl.innerHTML =
      '<em id="emailInsightsTile-btnWrap"><a id="emailInsightsTile-btnEl" href="' +
      mktoEmailInsightsLink +
      '" class="x4-btn-center" target="_blank" role="link" style="width: 150px; height: 150px;"><span id="emailInsightsTile-btnInnerEl" class="x4-btn-inner" style="width: 150px; height: 150px; line-height: 150px;">Email Insights</span><span id="emailInsightsTile-btnIconEl" class="x4-btn-icon mki3-email-insights-svg"></span></a></em><div class="x-panel-bwrap" id="ext-gen164"><div class="x-panel-body x-panel-body-noheader" id="ext-gen165"></div></div>'
    console.log('**********INSIDE ELSE emailInsightsTile ' + emailInsightsTile)
    container.insertBefore(emailInsightsTileEl, container.childNodes[container.childNodes.length - 1])
    document.getElementById('emailInsightsTile').onclick = function () {
      APP.heapTrack('track', {
        name: 'Email Insights',
        assetArea: 'Email Insights',
        assetName: 'Demo App',
        assetType: 'Home Tile'
      })
    }
  }

  hiddenTile1 = container.querySelector('div[role="presentation"]')
  hiddenTile2 = container.querySelector('div[class="x-panel-bwrap x-panel"]')
  if (hiddenTile1) {
    hiddenTile1.remove()
  }
  if (hiddenTile2) {
    hiddenTile2.remove()
  }
}

/**************************************************************************************
 *  This function overrides the target links for the Deliverability Tools and Email
 *  Insights tiles if they exist, otherwise it creates the tiles. We only have a single
 *  instance that contains usable demo data for both 250ok and Email Insights, so the
 *  plugin directs people into that instance. This function directs users to the 250ok
 *  login page where the deliverability-tools.js script will automatically login and
 *  hide the necessary buttons. This function should also run inside of SC sandbox
 *  instances.
 **************************************************************************************/
APP.overrideHomeTiles = function (restoreEmailInsightsTile) {
  console.log('Marketo App > Overriding: My Marketo Home Tiles')
  if (
    LIB.isPropOfWindowObj('MktCanvas.getEl') &&
    MktCanvas.getEl() &&
    MktCanvas.getEl().dom &&
    MktCanvas.getEl().dom.nextSibling &&
    MktCanvas.getEl().dom.nextSibling.childNodes &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0] &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0] &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes[0] &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[0] &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0] &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0] &&
    MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes &&
    MktCanvas.getEl()
      .dom.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].id.toLowerCase()
      .indexOf('hometile') >= 0
  ) {
    console.log('Marketo App > Executing: Override My Marketo Home Tiles')
    let container = MktCanvas.getEl().dom.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0],
      tilesTextContent = container.getElementsByTagName('span'),
      hrefMatch = new RegExp(' href="[^"]*" ', 'g'),
      performanceInsightsTile,
      emailInsightsTile,
      deliverabilityToolsTile,
      seoTile,
      bizibleDiscover,
      bizibleRevPlan,
      demoModeler,
      hiddenTile1,
      hiddenTile2

    for (let ii = 0; ii < tilesTextContent.length; ii++) {
      let tile = tilesTextContent[ii]
      switch (tile.textContent) {
        case 'Performance Insights':
          if (tile.parentNode.parentNode.parentNode.style.display != 'none') {
            performanceInsightsTile = tile.parentNode.parentNode.parentNode
          }
          break
        case 'Email Insights':
          emailInsightsTile = tile.parentNode.parentNode.parentNode
          break
        case 'Deliverability Tools':
          deliverabilityToolsTile = tile.parentNode.parentNode.parentNode
          break
        case 'SEO':
          seoTile = tile.parentNode.parentNode.parentNode
          break
        case 'Bizible Discover':
          bizibleDiscover = tile.parentNode.parentNode.parentNode
          break
        case 'Bizible Revenue Planner':
          bizibleRevPlan = tile.parentNode.parentNode.parentNode
          break
        case 'Target Account Planning':
          targetAccountPlan = tile.parentNode.parentNode.parentNode
          break
        case 'Lifecycle Modeler':
          demoModeler = tile.parentNode.parentNode.parentNode
          break
      }
    }

    if (performanceInsightsTile) {
      performanceInsightsTile.outerHTML = performanceInsightsTile.outerHTML.replace(
        hrefMatch,
        ' href="' + mktoPerformanceInsightsLink + '" '
      )

      document.getElementById(performanceInsightsTile.id).onclick = function () {
        APP.heapTrack('track', {
          name: 'Performance Insights',
          assetArea: 'Performance Insights',
          assetName: 'Demo App',
          assetType: 'Home Tile'
        })
      }
    } else {
      let performanceInsightsTileEl = document.createElement('div')
      performanceInsightsTileEl.className =
        'x4-btn mkt3-homeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left'
      performanceInsightsTileEl.style = 'height: 150px;'
      performanceInsightsTileEl.id = 'performanceInsightsTile'
      performanceInsightsTileEl.innerHTML =
        '<em id="performanceInsightsTile-btnWrap"><a id="performanceInsightsTile-btnEl" href="' +
        mktoPerformanceInsightsLink +
        '" class="x4-btn-center" target="_blank" role="link" style="width: 150px; height: 150px;"><span id="performanceInsightsTile-btnInnerEl" class="x4-btn-inner" style="width: 150px; height: 150px; line-height: 150px;">Performance Insights</span><span id="performanceInsightsTile-btnIconEl" class="x4-btn-icon mki3-mpi-logo-svg"></span></a></em>'

      container.insertBefore(performanceInsightsTileEl, container.childNodes[container.childNodes.length - 1])
      document.getElementById('performanceInsightsTile').onclick = function () {
        APP.heapTrack('track', {
          name: 'Performance Insights',
          assetArea: 'Performance Insights',
          assetName: 'Demo App',
          assetType: 'Home Tile'
        })
      }
    }

    if (emailInsightsTile) {
      let assetName

      if (origEmailInsightsTileLink == null) {
        origEmailInsightsTileLink = emailInsightsTile.outerHTML.match(hrefMatch)[0].split('"')[1]
      }

      if (restoreEmailInsightsTile && origEmailInsightsTileLink != null) {
        emailInsightsTile.outerHTML = emailInsightsTile.outerHTML.replace(hrefMatch, ' href="' + origEmailInsightsTileLink + '" ')
        document.getElementById(emailInsightsTile.id).onclick = function () {
          APP.heapTrack('track', {
            name: 'Email Insights',
            assetArea: 'Email Insights',
            assetName: 'Home',
            assetType: 'Home Tile'
          })
        }
      } else {
        emailInsightsTile.outerHTML = emailInsightsTile.outerHTML.replace(hrefMatch, ' href="' + mktoEmailInsightsLink + '" ')
        document.getElementById(emailInsightsTile.id).onclick = function () {
          APP.heapTrack('track', {
            name: 'Email Insights',
            assetArea: 'Email Insights',
            assetName: 'Demo App',
            assetType: 'Home Tile'
          })
        }
      }
    } else {
      let emailInsightsTileEl = document.createElement('div')
      emailInsightsTileEl.className =
        'x4-btn mkt3-homeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left x-panel'
      emailInsightsTileEl.style = 'height: 150px;'
      emailInsightsTileEl.id = 'emailInsightsTile'
      emailInsightsTileEl.innerHTML =
        '<em id="emailInsightsTile-btnWrap"><a id="emailInsightsTile-btnEl" href="' +
        mktoEmailInsightsLink +
        '" class="x4-btn-center" target="_blank" role="link" style="width: 150px; height: 150px;"><span id="emailInsightsTile-btnInnerEl" class="x4-btn-inner" style="width: 150px; height: 150px; line-height: 150px;">Email Insights</span><span id="emailInsightsTile-btnIconEl" class="x4-btn-icon mki3-email-insights-svg"></span></a></em><div class="x-panel-bwrap" id="ext-gen164"><div class="x-panel-body x-panel-body-noheader" id="ext-gen165"></div></div>'

      container.insertBefore(emailInsightsTileEl, container.childNodes[container.childNodes.length - 1])
      document.getElementById('emailInsightsTile').onclick = function () {
        APP.heapTrack('track', {
          name: 'Email Insights',
          assetArea: 'Email Insights',
          assetName: 'Demo App',
          assetType: 'Home Tile'
        })
      }
    }

    if (deliverabilityToolsTile) {
      deliverabilityToolsTile.outerHTML = deliverabilityToolsTile.outerHTML.replace(
        hrefMatch,
        ' href="' + mktoEmailDeliverabilityToolsLink + '" '
      )

      document.getElementById(deliverabilityToolsTile.id).onclick = function () {
        APP.heapTrack('track', {
          name: 'Deliverability Tools',
          assetArea: 'Deliverability Tools',
          assetName: 'Demo Account',
          assetType: 'Home Tile'
        })
      }
    } else {
      let deliverabilityToolsTileEl = document.createElement('div')
      deliverabilityToolsTileEl.className =
        'x4-btn mkt3-homeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left'
      deliverabilityToolsTileEl.style = 'height: 150px;'
      deliverabilityToolsTileEl.id = 'deliverabilityToolsTile'
      deliverabilityToolsTileEl.innerHTML =
        '<em id="deliverabilityToolsTile-btnWrap"><a id="deliverabilityToolsTile-btnEl" href="' +
        mktoEmailDeliverabilityToolsLink +
        '" class="x4-btn-center" target="_blank" role="link" style="width: 150px; height: 150px;"><span id="deliverabilityToolsTile-btnInnerEl" class="x4-btn-inner" style="width: 150px; height: 150px; line-height: 150px;">Deliverability Tools</span><span id="deliverabilityToolsTile-btnIconEl" class="x4-btn-icon mki3-mail-sealed-svg"></span></a></em>'

      container.insertBefore(deliverabilityToolsTileEl, container.childNodes[container.childNodes.length - 1])
      document.getElementById('deliverabilityToolsTile').onclick = function () {
        APP.heapTrack('track', {
          name: 'Deliverability Tools',
          assetArea: 'Deliverability Tools',
          assetName: 'Demo Account',
          assetType: 'Home Tile'
        })
      }
    }

    if (!bizibleDiscover && MktPage.savedState.custPrefix == mktoAccountString106) {
      let bizibleDiscoverTileEl = document.createElement('div')
      bizibleDiscoverTileEl.className =
        'x4-btn mkt3-homeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left'
      bizibleDiscoverTileEl.style = 'height: 150px;'
      bizibleDiscoverTileEl.id = 'bizibleDiscoverToolsTile'
      bizibleDiscoverTileEl.innerHTML =
        '<em id="bizibleDiscoverToolsTile-btnWrap"><a id="bizibleDiscoverToolsTile-btnEl" href="' +
        mktoBizibleDiscoverLink +
        '" class="x4-btn-center" target="_blank" role="link" style="width: 150px; height: 150px;"><span id="bizibleDiscoverToolsTile-btnInnerEl" class="x4-btn-inner" style="width: 150px; height: 150px; line-height: 150px;">Bizible Discover</span><span id="bizibleDiscoverToolsTile-btnIconEl" class="x4-btn-icon"><img src="https://www.bizible.com/hs-fs/hub/233537/file-2495819411-png/bizible-logo-retina.png?t=1533581965699&amp;width=277&amp;name=bizible-logo-retina.png" style="width: 145px;margin-left:5px;margin-top:30px;"></span></a></em>'

      container.insertBefore(bizibleDiscoverTileEl, container.childNodes[container.childNodes.length - 1])
      document.getElementById('bizibleDiscoverToolsTile').onclick = function () {
        APP.heapTrack('track', {
          name: 'BizibleDiscover',
          assetArea: 'BizibleDiscover',
          assetName: 'Demo 106 Account',
          assetType: 'Home Tile'
        })
      }
    }

    if (!bizibleRevPlan && MktPage.savedState.custPrefix == mktoAccountString106) {
      let bizibleRevPlanTileEl = document.createElement('div')
      bizibleRevPlanTileEl.className =
        'x4-btn mkt3-homeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left'
      bizibleRevPlanTileEl.style = 'height: 150px;'
      bizibleRevPlanTileEl.id = 'bizibleRevPlanTile'
      bizibleRevPlanTileEl.innerHTML =
        '<em id="bizibleRevPlanTile-btnWrap"><a id="bizibleRevPlanTile-btnEl" href="' +
        mktoBizibleRevPlanLink +
        '" class="x4-btn-center" target="_blank" role="link" style="width: 150px; height: 150px;"><span id="bizibleRevPlanTile-btnInnerEl" class="x4-btn-inner" style="width: 150px; height: 150px; line-height: 150px;">Bizible Revenue Planner</span><span id="bizibleRevPlanTile-btnIconEl" class="x4-btn-icon"><img src="https://www.bizible.com/hs-fs/hub/233537/file-2495819411-png/bizible-logo-retina.png?t=1533581965699&amp;width=277&amp;name=bizible-logo-retina.png" style="width: 145px;margin-left:5px;margin-top:30px;"></span></a></em>'

      container.insertBefore(bizibleRevPlanTileEl, container.childNodes[container.childNodes.length - 1])
      document.getElementById('bizibleRevPlanTile').onclick = function () {
        APP.heapTrack('track', {
          name: 'Bizible Rev Plan ',
          assetArea: 'Bizible Rev Plan',
          assetName: 'Demo 106 Account',
          assetType: 'Home Tile'
        })
      }
    }

    if (!demoModeler && MktPage.savedState.custPrefix == mktoAccountString106) {
      let demoModelerTileEl = document.createElement('div')
      demoModelerTileEl.className =
        'x4-btn mkt3-homeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left'
      demoModelerTileEl.style = 'height: 150px;'
      demoModelerTileEl.id = 'demoModelerTile'
      demoModelerTileEl.innerHTML =
        '<em id="demoModelerTile-btnWrap"><a id="demoModelerTile-btnEl" href="' +
        demoModelerLink +
        '" class="x4-btn-center" target="_blank" role="link" style="width: 150px; height: 150px;"><span id="demoModelerTile-btnInnerEl" class="x4-btn-inner" style="width: 150px; height: 150px; line-height: 150px;">Lifecycle Modeler</span><span id="demoModelerTile-btnIconEl" class="x4-btn-icon mki3-success-path-svg"></span></a></em>'

      container.insertBefore(demoModelerTileEl, container.childNodes[container.childNodes.length - 1])
      document.getElementById('demoModelerTile').onclick = function () {
        APP.heapTrack('track', {
          name: 'Demo Modeler ',
          assetArea: 'Demo Modeler',
          assetName: 'Demo 106 Account',
          assetType: 'Home Tile'
        })
      }
    }

    if (seoTile) {
      //seoTile.el.dom.setAttribute("onclick", 'APP.heapTrack("track", {name: "SEO", assetName: "Home", assetType: "Home Tile"});');
      document.getElementById(seoTile.id).onclick = function () {
        APP.heapTrack('track', {
          name: 'SEO',
          assetArea: 'SEO',
          assetName: 'Home',
          assetType: 'Home Tile'
        })
      }
    }

    hiddenTile1 = container.querySelector('div[role="presentation"]')
    hiddenTile2 = container.querySelector('div[class="x-panel-bwrap x-panel"]')
    if (hiddenTile1) {
      hiddenTile1.remove()
    }
    if (hiddenTile2) {
      hiddenTile2.remove()
    }
  } else if (overrideTileTimerCount) {
    overrideTileTimerCount = false
    setTimeout(APP.overrideHomeTiles, 2000)
  }
}

/**************************************************************************************
 *  This function overrides the target links for the Email Insights and Deliverability
 *  Tools Superball menu items if they exist, otherwise it creates the menu items. By
 *  default, these menu items uses SSO to login, however, we only have one instance for
 *  each item that contains usable demo data, so the plugin directs people into that
 *  instance. This function directs users to the 250ok login page where the
 *  deliverability-tools.js script will automatically login and hide the necessary
 *  buttons. This function should also run inside of SC sandbox instances.
 **************************************************************************************/

APP.overrideSuperballMenuItems = function (restoreEmailInsightsMenuItem) {
  console.log('Marketo App > Overriding: Superball Menu Items')
  if (LIB.isPropOfWindowObj('MktPage.showSuperMenu')) {
    MktPage.showSuperMenu = function () {
      console.log('Marketo App > Executing: Override Superball Menu Items')
      let logoEl = Ext.get(Ext.DomQuery.selectNode('.mkt-app-logo')),
        {menu} = logoEl,
        menuTop = 55

      if (!menu) {
        menu = logoEl.menu = Ext4.widget('appNavigationMenu', {
          listeners: {
            boxready: function (view) {
              let logoRegion = logoEl.getRegion()

              // shift out of the ball way
              if (logoRegion.bottom > menuTop) {
                view.setBodyStyle('padding-top', logoRegion.bottom - menuTop + 10 + 'px')
                view.updateLayout()
              }

              // prevent layering in front of the logo
              menu.setZIndex(logoEl.getStyle('zIndex') - 5)
            },
            beforerender: function (view) {
              view.addCls(view.componentCls + '-hidden')
            },
            show: function (view) {
              view.removeCls(view.componentCls + '-hidden')

              logoEl.ignoreNextClick = true
              logoEl.removeClass(logoEl.attentionCls)

              if (!MktPage.savedState.isUsedSuperMenu) {
                MktPage.savedState.isUsedSuperMenu = true

                MktSession.ajaxRequest('user/saveUserPref', {
                  serializeParms: {
                    key: 'isUsedSuperMenu',
                    data: MktPage.savedState.isUsedSuperMenu
                  }
                })
              }
            },
            beforehide: function (view) {
              view.addCls(view.componentCls + '-hidden')
            },
            hide: function () {
              (function () {
                logoEl.ignoreNextClick = false
              }.defer(250))
            }
          }
        })
        if (typeof menu !== 'undefined' && menu && menu.items && menu.items.items) {
          console.log('Marketo App > Working: Override Superball Menu Items')
          let ii,
            currSuperBallMenuItem,
            performanceInsightsMenuItem,
            emailInsightsMenuItem,
            deliverabilityToolsMenuItem,
            seoMenuItem,
            clonedMenuItem

          for (ii = 0; ii < menu.items.items.length; ii++) {
            currSuperBallMenuItem = menu.items.items[ii]

            if (currSuperBallMenuItem.text == 'Performance Insights') {
              if (currSuperBallMenuItem.hidden != true) {
                performanceInsightsMenuItem = currSuperBallMenuItem
              }
            } else if (currSuperBallMenuItem.text == 'Email Insights') {
              emailInsightsMenuItem = currSuperBallMenuItem
            } else if (currSuperBallMenuItem.text == 'Deliverability Tools') {
              deliverabilityToolsMenuItem = currSuperBallMenuItem
            } else if (currSuperBallMenuItem.text == 'SEO') {
              seoMenuItem = currSuperBallMenuItem
            }
          }

          if (performanceInsightsMenuItem) {
            let origMenuItemOnClick = performanceInsightsMenuItem.onClick

            performanceInsightsMenuItem.onClick = function (e) {
              origMenuItemOnClick.apply(this, arguments)
              APP.heapTrack('track', {
                name: 'Performance Insights',
                assetArea: 'Performance Insights',
                assetName: 'Demo App',
                assetType: 'Home Tile'
              })
            }
            performanceInsightsMenuItem.href = mktoPerformanceInsightsLink
            performanceInsightsMenuItem.update()
          } else {
            clonedMenuItem = menu.items.items[4].cloneConfig()
            clonedMenuItem.setText('Performance Insights')
            clonedMenuItem.setIconCls('mki3-mpi-logo-svg')
            clonedMenuItem.href = mktoPerformanceInsightsLink
            clonedMenuItem.hrefTarget = '_blank'

            clonedMenuItem.onClick = function (e) {
              APP.heapTrack('track', {
                name: 'Performance Insights',
                assetArea: 'Performance Insights',
                assetName: 'Demo App',
                assetType: 'Home Tile'
              })
            }

            clonedMenuItem.update()
            menu.add(clonedMenuItem)
          }

          if (emailInsightsMenuItem) {
            if (origEmailInsightsMenuItemLink == null) {
              origEmailInsightsMenuItemLink = emailInsightsMenuItem.href
            }

            if (restoreEmailInsightsMenuItem && origEmailInsightsMenuItemLink != null) {
              emailInsightsMenuItem.href = origEmailInsightsMenuItemLink
            } else {
              emailInsightsMenuItem.href = mktoEmailInsightsLink
            }
            emailInsightsMenuItem.update()
          } else {
            clonedMenuItem = menu.items.items[4].cloneConfig()
            clonedMenuItem.setText('Email Insights')
            clonedMenuItem.setIconCls('mki3-email-insights-svg')
            clonedMenuItem.href = mktoEmailInsightsLink
            clonedMenuItem.hrefTarget = '_blank'
            clonedMenuItem.update()
            menu.add(clonedMenuItem)
          }

          if (deliverabilityToolsMenuItem) {
            var origMenuItemOnClick = deliverabilityToolsMenuItem.onClick

            deliverabilityToolsMenuItem.onClick = function (e) {
              origMenuItemOnClick.apply(this, arguments)
              APP.heapTrack('track', {
                name: 'Deliverability Tools',
                assetArea: 'Deliverability Tools',
                assetName: 'Demo Account',
                assetType: 'Home Tile'
              })
            }
            deliverabilityToolsMenuItem.href = mktoEmailDeliverabilityToolsLink
            deliverabilityToolsMenuItem.update()
          } else {
            clonedMenuItem = menu.items.items[3].cloneConfig()
            clonedMenuItem.setText('Deliverability Tools')
            clonedMenuItem.setIconCls('mki3-mail-sealed-svg')
            clonedMenuItem.href = mktoEmailDeliverabilityToolsLink
            clonedMenuItem.hrefTarget = '_blank'
            clonedMenuItem.onClick = function (e) {
              //origMenuItemOnClick.apply(this, arguments);
              APP.heapTrack('track', {
                name: 'Deliverability Tools',
                assetArea: 'Deliverability Tools',
                assetName: 'Demo Account',
                assetType: 'Home Tile'
              })
            }

            clonedMenuItem.update()
            menu.add(clonedMenuItem)
          }

          if (seoMenuItem) {
            var origMenuItemOnClick = seoMenuItem.onClick

            seoMenuItem.onClick = function (e) {
              origMenuItemOnClick.apply(this, arguments)
              APP.heapTrack('track', {
                name: 'SEO',
                assetArea: 'SEO',
                assetName: 'Home',
                assetType: 'Home Tile'
              })
            }
          }
        }
      }

      if (!menu.isVisible() && !logoEl.ignoreNextClick) {
        // position below app bar
        menu.showAt(0, menuTop)

        // prevent layering in front of the logo
        menu.setZIndex(logoEl.getStyle('zIndex') - 5)
      }
    }
  }
}

/**************************************************************************************
 *  This function overrides the target link of the Analytics tiles in order to link to
 *  the Group Reports within the Default Workspace as those report settings are saved
 **************************************************************************************/

APP.overrideAnalyticsTiles = function () {
  console.log('Marketo App > Overriding: Analytics Tiles')
  let isAnalyticsTiles = window.setInterval(function () {
    if (
      LIB.isPropOfWindowObj('MktCanvas.getActiveTab') &&
      MktCanvas.getActiveTab() &&
      MktCanvas.getActiveTab().config &&
      MktCanvas.getActiveTab().config.mkt3XType &&
      MktCanvas.getActiveTab().config.accessZoneId &&
      LIB.isPropOfWindowObj('MktPage.savedState.custPrefix')
    ) {
      window.clearInterval(isAnalyticsTiles)
      if (
        MktPage.savedState.custPrefix.search(mktoAccountStringsMatch) != -1 &&
        MktCanvas.getActiveTab().config.mkt3XType == 'analyticsHome' &&
        MktCanvas.getActiveTab().config.accessZoneId == mktoDefaultWorkspaceId &&
        MktCanvas.getActiveTab().el &&
        MktCanvas.getActiveTab().el.dom &&
        MktCanvas.getActiveTab().el.dom.childNodes &&
        MktCanvas.getActiveTab().el.dom.childNodes[0] &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1] &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1].childNodes &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1].childNodes[0] &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1].childNodes[0].childNodes &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1].childNodes[0].childNodes[0] &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0] &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0] &&
        MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes
      ) {
        console.log('Marketo App > Executing: Analytics Tiles')
        let container = MktCanvas.getActiveTab().el.dom.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0],
          tiles = container.childNodes,
          performanceInsightsTileExists = false

        for (let ii = 0; ii < tiles.length; ii++) {
          if (tiles[ii] && tiles[ii].outerHTML && tiles[ii].textContent) {
            let tileHTML = tiles[ii].outerHTML,
              hrefMatch
            switch (tiles[ii].textContent) {
              case 'Performance Insights':
                hrefMatch = new RegExp(' href="[^"]*" ', 'g')
                tiles[ii].outerHTML = tileHTML.replace(hrefMatch, ' href="' + mktoPerformanceInsightsLink + '" ')
                performanceInsightsTileExists = true
                break
              case 'Email Performance':
                tiles[ii].outerHTML = '<a href="/#' + mktoEmailPerformanceReport + '">' + tileHTML + '</a>'
                break
              case 'People Performance':
                tiles[ii].outerHTML = '<a href="/#' + mktoPeoplePerformanceReport + '">' + tileHTML + '</a>'
                break
              case 'Web Page Activity':
                tiles[ii].outerHTML = '<a href="/#' + mktoWebPageActivityReport + '">' + tileHTML + '</a>'
                break
              case 'Opportunity Influence Analyzer':
                tiles[ii].outerHTML = '<a href="/#' + mktoOpportunityInfluenceAnalyzer + '">' + tileHTML + '</a>'
                break
              case 'Program Analyzer':
                tiles[ii].outerHTML = '<a href="/#' + mktoProgramAnalyzer + '">' + tileHTML + '</a>'
                break
              case 'Success Path Analyzer':
                tiles[ii].outerHTML = '<a href="/#' + mktoSuccessPathAnalyzer + '">' + tileHTML + '</a>'
                break
              case 'Email Insights':
                if (!restoreEmailInsights) {
                  hrefMatch = new RegExp(' href="[^"]*" ', 'g')
                  tiles[ii].outerHTML = tileHTML.replace(hrefMatch, ' href="' + mktoEmailInsightsLink + '" ')
                }
                break
              case 'Engagement Stream Performance':
                tiles[ii].outerHTML = '<a href="/#' + mktoEngagmentStreamPerformaceReport + '">' + tileHTML + '</a>'
                break
              case 'Program Performance':
                tiles[ii].outerHTML = '<a href="/#' + mktoProgramPerformanceReport + '">' + tileHTML + '</a>'
                break
              case 'Email Link Performance':
                tiles[ii].outerHTML = '<a href="/#' + mktoEmailLinkPerformanceReport + '">' + tileHTML + '</a>'
                break
              case 'People By Revenue Stage':
                tiles[ii].outerHTML = '<a href="/#' + mktoPeopleByRevenueStageReport + '">' + tileHTML + '</a>'
                break
              case 'Landing Page Performance':
                tiles[ii].outerHTML = '<a href="/#' + mktoLandingPagePerformanceReport + '">' + tileHTML + '</a>'
                break
              case 'People By Status':
                tiles[ii].outerHTML = '<a href="/#' + mktoPeopleByStatusReport + '">' + tileHTML + '</a>'
                break
              case 'Company Web Activity':
                tiles[ii].outerHTML = '<a href="/#' + mktoCompanyWebActivityReport + '">' + tileHTML + '</a>'
                break
              case 'Sales Insight Email Performance':
                tiles[ii].outerHTML = '<a href="/#' + mktoSalesInsightEmailPerformanceReport + '">' + tileHTML + '</a>'
                break
            }
          }
        }

        if (!performanceInsightsTileExists) {
          let performanceInsightsTileOuterHTML =
              '<div class="x4-btn mkt3-analyticsTile mkt3-analyticsHomeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left" id="analyticsTile-1068"><em id="analyticsTile-1068-btnWrap"><a id="analyticsTile-1068-btnEl" href="' +
              mktoPerformanceInsightsLink +
              '" class="x4-btn-center" target="_blank" role="link" style="height: 160px;"><span id="analyticsTile-1068-btnInnerEl" class="x4-btn-inner">Performance Insights</span><span id="analyticsTile-1068-btnIconEl" class="x4-btn-icon mki3-mpi-logo-svg"></span></a></em></div>',
            idMatch = new RegExp('analyticsTile-1068', 'g'),
            spareTileClone = MktCanvas.lookupComponent(container.childNodes[container.childNodes.length - 1]).cloneConfig()

          spareTileClone.el.dom.outerHTML = performanceInsightsTileOuterHTML.replace(idMatch, spareTileClone.id)
          container.appendChild(spareTileClone.el.dom)
        }
      }
    }
  }, 0)
}

/**************************************************************************************
 *  This function overrides the save function of Smart Campaigns in order to disable
 *  saving within the Default Workspace at all times and within My Worksapce if the
 *  Smart Campaign is NOT within the user's root folder or if edit privileges is false
 **************************************************************************************/

APP.overrideSmartCampaignSaving = function () {
  console.log('Marketo App > Overriding: Saving for Smart Campaigns')
  if (LIB.isPropOfWindowObj('Mkt.widgets.DataPanelManager.prototype.save')) {
    Mkt.widgets.DataPanelManager.prototype.save = function (cause, dp, acceptUpdates) {
      console.log('Marketo App > Executing: Override Saving for Smart Campaigns')
      this._updateDataPanelOrder(true)
      let canvas = MktCanvas.getActiveTab()
      if (!APP.evaluateMenu('button', null, canvas, null) && toggleState != 'false') {
        if (this.saveQueue.blockingSaveInProgress) {
          this.saveQueue.pendingChangesCount++
          this.saveQueue.dataPanelMetas = this._serializeDataPanels()
          this.saveQueue.dataPanelCount = this.countDataPanels()
          return
        }

        let dataPanelMetas
        if (this.saveQueue.dataPanelMetas) {
          ({dataPanelMetas} = this.saveQueue.dataPanelMetas)
        } else {
          dataPanelMetas = this._serializeDataPanels()
        }

        this.saveQueue.pendingChangesCount = 0
        this.saveQueue.dataPanelMetas = null
        this.saveQueue.dataPanelCount = 0
        if (dataPanelMetas === null) {
          return
        }

        if (this.dpSubtype != DPConst.RUN_ACTION && dataPanelMetas) {
          if (this.lastSave.dataPanelMetas && this.lastSave.dataPanelMetas == dataPanelMetas) {
            return
          } else if (this.lastSave.dataPanelMetasUpdated && this.lastSave.dataPanelMetasUpdated == dataPanelMetas) {
            return
          }
        }

        console.debug('Saving ' + this.dpType + ':', MktFormat.formatJsonStr(dataPanelMetas))
        if (DPDEBUG) {
          console.debug('Current Save:', dataPanelMetas)

          if (this.lastSave.dataPanelMetas) {
            console.debug('Previous Save:', this.lastSave.dataPanelMetas)
          }

          if (this.lastSave.dataPanelMetasUpdated) {
            console.debug('Previous Update:', this.lastSave.dataPanelMetasUpdated)
          }
        }

        this.lastSave.acceptUpdates = acceptUpdates
        this.lastSave.dataPanelMetas = dataPanelMetas
        this.saveQueue.blockingSaveInProgress = true
        this.beforeSaveMessage()
        let params = Ext.apply(
          {
            dataPanelMetas: dataPanelMetas,
            accessZoneId: this.accessZoneId
          },
          this.baseSaveParams
        )

        if (this.isSmartlist && this.smartListRuleLogic.customMode()) {
          if (this.smartListRuleLogic.isCustomLogicValid()) {
            let smartListLogicParams = this.smartListRuleLogic.getSmartListLogicSaveParams()
            Ext.apply(params, smartListLogicParams)
          } else {
            console.debug('Data panel save successful. Custom rule logic is not valid')
          }
        }

        params[this.appVarsBase + 'Id'] = this.dataPanelStorageId
        this.beforeSaveHook()
        if (DPDEBUG) {
          console.debug('Saving... ', params)
        }

        MktSession.ajaxRequest(this.saveAction, {
          serializeParms: params,
          onMySuccess: this.saveSuccess.createDelegate(this),
          onMyFailure: this.saveFailure.createDelegate(this)
        })
      } else {
        console.log('Marketo App > Disabling: Saving for Smart Campaigns')
      }
    }
  }
}

/**************************************************************************************
 *  This function overrides the fillCanvas function for the Program > Assets tab in
 *  order to remove the new asset buttons within the Default Workspace at all times
 *  and within My Worksapce if the Program is NOT within the user's root folder.
 **************************************************************************************/

APP.overrideCanvas = function () {
  console.log('Marketo App > Overriding: Canvas')
  if (LIB.isPropOfWindowObj('MktCanvasPanelManager.prototype.fillCanvas')) {
    if (typeof origFillCanvas !== 'function') {
      origFillCanvas = MktCanvasPanelManager.prototype.fillCanvas
    }

    MktCanvasPanelManager.prototype.fillCanvas = function (items, tabId, isGrid) {
      let tab = this.getTabOrActive(tabId),
        disable = APP.evaluateMenu('button', null, tab, null)

      if (disable && tab && tab.title == 'Assets') {
        console.log('Marketo App > Executing: Override Assets Canvas > Removing New Asset Buttons')
        let newAssetButtons = items.find('cellCls', 'pickerButton')

        for (let ii = 0; ii < newAssetButtons.length; ii++) {
          newAssetButtons[ii].destroy()
        }
      }

      origFillCanvas.apply(this, arguments)
    }
  }
}

/**************************************************************************************
 *  This function overrides the updatePortletOrder function of Program > Assets tab in
 *  order to disable reordering of asset portlets within the Default Workspace at all
 *  times and within My Worksapce if the Program is NOT within the user's root folder
 **************************************************************************************/

APP.overrideUpdatePortletOrder = function () {
  console.log('Marketo App > Overriding: Updating of Portlet Order')
  if (LIB.isPropOfWindowObj('Mkt.apps.localasset.LocalAssetPortal.prototype.updatePortletOrder')) {
    console.log('Marketo App > Executing: Override Updating of Portlet Order')
    Mkt.apps.localasset.LocalAssetPortal.prototype.updatePortletOrder = function (e) {
      let canvas = MktCanvas.getActiveTab(),
        disable = APP.evaluateMenu('button', null, canvas, null)
      if (!disable) {
        let newPortletOrder = []
        for (let i = 0; i < this.items.length; i++) {
          let itemInfo = this.items.get(i).smartCampaignMetaData
          newPortletOrder.push(itemInfo.compTypeId + ':' + itemInfo.compId)
        }
        let params = {
          compId: this.programId,
          portletOrdering: Ext.encode(newPortletOrder)
        }
        MktSession.ajaxRequest('marketingEvent/orderLocalAssetPortlets', {
          serializeParms: params,
          localAssetManager: this,
          portletOrdering: newPortletOrder,
          onMySuccess: this.updatePortletOrderSuccess
        })
      } else {
        console.log('Marketo App > Disabling: Updating of Portlet Order')
      }
    }
  }
}

/**************************************************************************************
 *  This function overrides the expand function for a Marketo tree node in order to
 *  hide each non-system folder that is in the Marketing workspace except the user's
 *  own folder
 **************************************************************************************/

APP.overrideTreeNodeExpand = function () {
  console.log('Marketo App > Overriding: Tree Node Expand')
  if ( LIB.isPropOfWindowObj('MktAsyncTreeNode.prototype.expand') && userName) {
    MktAsyncTreeNode.prototype.expand = function () {
      let attr = this.attributes

      if (
        this.text.search(mktoMyWorkspaceNameMatch) != -1 ||
        (this.parentNode.text.search(mktoMyWorkspaceNameMatch) != -1 && this.attributes.system == true) ||
        (this.parentNode.parentNode != null &&
          this.parentNode.parentNode.text.search(mktoMyWorkspaceNameMatch) != -1 &&
          this.attributes.system == true)
      ) {
        for (let ii = 0; ii < this.childNodes.length; ii++) {
          let currFolder = this.childNodes[ii]

          if (currFolder.attributes.system == false && currFolder.text.toLowerCase() !== userName) {
            currFolder.ui.hide()
            currFolder.hidden = true
          }
        }
      } else if (
        (accountString == mktoAccountStringMaster || accountString == mktoAccountStringMasterMEUE) && //TODO
        this.attributes.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1 &&
        this.childNodes.length
      ) {
        for (let ii = 0; ii < this.childNodes.length; ii++) {
          let node = this.childNodes[ii]

          if (
            node.childNodes.length == 0 &&
            node.attributes &&
            node.attributes.children &&
            node.attributes.children.length == 1 &&
            (node.attributes.children[0].isDraftNode == 1 || node.attributes.children[0].isDraft)
          ) {
            if (node.ui && node.ui.ecNode && node.ui.ecNode.className) {
              node.ui.ecNode.className = 'x-tree-ec-icon x-tree-elbow'
              console.log('Removed Draft Node Of: ' + node.text)
            } else {
              node.allowChildren = false
              node.leaf = true
              console.log('Prevented Draft Node Of: ' + node.text)
            }
          } else if (
            node.childNodes.length == 1 &&
            node.childNodes[0].attributes &&
            (node.childNodes[0].attributes.isDraftNode == 1 || node.childNodes[0].attributes.isDraft)
          ) {
            node.removeAll(true)
            console.log('Removed Child Draft Node Of: ' + node.text)
          } else if (
            node.childNodes.length > 1 &&
            node.childNodes[0].attributes &&
            (node.childNodes[0].attributes.isDraftNode == 1 || node.childNodes[0].attributes.isDraft)
          ) {
            node.childNodes[0].remove(true)
            console.log('Removed Child Draft Node Of: ' + node.text)
          }
        }

        if (this.attributes.compType == 'Zone') {
          for (let ii = 0; ii < this.childNodes.length; ii++) {
            let currFolder = this.childNodes[ii]

            if (
              currFolder.attributes.system == false &&
              currFolder.attributes.compType == 'Marketing Folder' &&
              (currFolder.text.search(mktoOperationalFolders) != -1 ||
                (APP.getUserRole() == 'Partner' &&
                  APP.getUserId()
                    .split('@')[0]
                    .search(/\.infor$/) == -1 &&
                  currFolder.text.search(mktoLaunchPointFolderToHide) != -1))
            ) {
              currFolder.ui.hide()
              currFolder.hidden = true
            }
          }
        } else if (
          this.parentNode &&
          this.parentNode.attributes.compType == 'Zone' &&
          this.attributes.system == false &&
          this.hidden == false &&
          this.attributes.compType == 'Marketing Folder'
        ) {
          for (let ii = 0; ii < this.childNodes.length; ii++) {
            let currFolder = this.childNodes[ii]

            if (
              currFolder.attributes.system == false &&
              currFolder.attributes.compType == 'Marketing Folder' &&
              currFolder.text.search(mktoOperationalFolders) != -1
            ) {
              currFolder.ui.hide()
              currFolder.hidden = true
            }
          }
        } else if (
          this.parentNode &&
          this.parentNode.parentNode &&
          this.parentNode.parentNode.parentNode &&
          this.parentNode.parentNode.parentNode.attributes.compType == 'Zone' &&
          this.attributes.system == false &&
          this.hidden == false &&
          this.attributes.compType != 'Marketing Folder'
        ) {
          for (let ii = 0; ii < this.childNodes.length; ii++) {
            let currFolder = this.childNodes[ii]

            if (
              currFolder.attributes.system == false &&
              currFolder.attributes.compType == 'Marketing Folder' &&
              currFolder.text.search(mktoOperationalFolders) != -1
            ) {
              currFolder.ui.hide()
              currFolder.hidden = true
            }
          }
        }
      }

      if (attr.folder) {
        if (attr.cancelFirstExpand) {
          delete this.attributes.cancelFirstExpand
        } else if (this.childNodes && this.childNodes.length > 0 && !attr.mktExpanded && this.attributes && this.attributes.accessZoneId) {
          if (this.attributes.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) == -1) {
            MktFolder.saveExpandState(this, true)
          } else {
            console.log('Marketo App > NOT Saving: Folder Expand State')
          }
        }
      }
      MktAsyncTreeNode.superclass.expand.apply(this, arguments)
      attr.mktExpanded = true
    }
  }
}

/**************************************************************************************
 *  This function overrides the collapse function for a Marketo tree node in order to
 *  hide each non-system folder that is in the Marketing workspace except the user's
 *  own folder
 **************************************************************************************/

APP.overrideTreeNodeCollapse = function () {
  console.log('Marketo App > Overriding: Tree Node Collapse')
  if (LIB.isPropOfWindowObj('MktAsyncTreeNode.prototype.collapse') && userName) {
    MktAsyncTreeNode.prototype.collapse = function () {
      let attr = this.attributes

      if (
        this.text.search(mktoMyWorkspaceNameMatch) != -1 ||
        (this.parentNode.text.search(mktoMyWorkspaceNameMatch) != -1 && this.attributes.system == true) ||
        (this.parentNode.parentNode != null &&
          this.parentNode.parentNode.text.search(mktoMyWorkspaceNameMatch) != -1 &&
          this.attributes.system == true)
      ) {
        for (let ii = 0; ii < this.childNodes.length; ii++) {
          let currFolder = this.childNodes[ii]

          if (currFolder.attributes.system == false && currFolder.text.toLowerCase() !== userName) {
            currFolder.ui.hide()
            currFolder.hidden = currFolder.ui.elNode.hidden = true
          }
        }
      } else if (
        (accountString == mktoAccountStringMaster || accountString == mktoAccountStringMasterMEUE) && //TODO MEUE
        this.attributes.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1 &&
        this.childNodes.length
      ) {
        if (this.attributes.compType == 'Zone') {
          for (let ii = 0; ii < this.childNodes.length; ii++) {
            let currFolder = this.childNodes[ii]

            if (
              currFolder.attributes.system == false &&
              currFolder.attributes.compType == 'Marketing Folder' &&
              (currFolder.text.search(mktoOperationalFolders) != -1 ||
                (APP.getUserRole() == 'Partner' &&
                  APP.getUserId()
                    .split('@')[0]
                    .search(/\.infor$/) == -1 &&
                  currFolder.text.search(mktoLaunchPointFolderToHide) != -1))
            ) {
              currFolder.ui.hide()
              currFolder.hidden = true
            }
          }
        } else if (
          this.parentNode &&
          this.parentNode.attributes.compType == 'Zone' &&
          this.attributes.system == false &&
          this.hidden == false &&
          this.attributes.compType == 'Marketing Folder'
        ) {
          for (let ii = 0; ii < this.childNodes.length; ii++) {
            let currFolder = this.childNodes[ii]

            if (
              currFolder.attributes.system == false &&
              currFolder.attributes.compType == 'Marketing Folder' &&
              currFolder.text.search(mktoOperationalFolders) != -1
            ) {
              currFolder.ui.hide()
              currFolder.hidden = true
            }
          }
        } else if (
          this.parentNode &&
          this.parentNode.parentNode &&
          this.parentNode.parentNode.parentNode &&
          this.parentNode.parentNode.parentNode.attributes.compType == 'Zone' &&
          this.attributes.system == false &&
          this.hidden == false &&
          this.attributes.compType != 'Marketing Folder'
        ) {
          for (let ii = 0; ii < this.childNodes.length; ii++) {
            let currFolder = this.childNodes[ii]

            if (
              currFolder.attributes.system == false &&
              currFolder.attributes.compType == 'Marketing Folder' &&
              currFolder.text.search(mktoOperationalFolders) != -1
            ) {
              currFolder.ui.hide()
              currFolder.hidden = true
            }
          }
        }
      }

      if (attr.suppressAjaxCollapse) {
        delete this.attributes.suppressAjaxCollapse
      } else if (isDefined(attr.folder) && attr.folder && attr.mktExpanded === true) {
        MktFolder.saveExpandState(this, false)
      }
      MktTreeNode.superclass.collapse.apply(this, arguments)
      attr.mktExpanded = false
    }
  }
}

/**************************************************************************************
 *  This function overrides the create function for a new Program or Segmentation in
 *  order to enforce a naming convention by appending the user's username to the name
 *  of the new program or segmentation
 **************************************************************************************/

APP.overrideNewProgramCreate = function () {
  console.log('Marketo App > Overriding: New Program/Segmentation Creation')
  if (LIB.isPropOfWindowObj('Mkt.widgets.ModalForm.prototype.okButtonHandler') && userName) {
    Mkt.widgets.ModalForm.prototype.okButtonHandler = function () {
      console.log('Marketo App > Executing: New Program/Segmentation Creation')
      if (this.title == 'New Program' || this.title == 'New Segmentation') {
        let ii

        if (this.title == 'New Program') {
          if (this.getInputItems()) {
            if (this.getInputItems()[1] && this.getInputItems()[1].fieldLabel == 'Name') {
              if (
                this.getInputItems()[1]
                  .getValue()
                  .toLowerCase()
                  .search(userName + '$') == -1
              ) {
                this.getInputItems()[1].setValue(this.getInputItems()[1].getValue() + ' - ' + userName)
              }
            } else {
              for (ii = 0; ii < this.getInputItems().length; ii++) {
                if (this.getInputItems()[ii] && this.getInputItems()[ii].fieldLabel == 'Name') {
                  if (
                    this.getInputItems()[ii].getValue()
                      .toLowerCase()
                      .search(userName + '$') == -1
                  ) {
                    this.getInputItems()[ii].setValue(this.getInputItems()[ii].getValue() + ' - ' + userName)
                  }
                }
              }
            }
          }
        } else if (this.title == 'New Segmentation') {
          if (this.findByType('textfield')) {
            if (this.findByType('textfield')[0] && this.findByType('textfield')[0].fieldLabel == 'Name') {
              if (
                this.findByType('textfield')[0]
                  .getValue()
                  .toLowerCase()
                  .search(userName + '$') == -1
              ) {
                this.findByType('textfield')[0].setValue(this.findByType('textfield')[0].getValue() + ' - ' + userName)
              }
            } else {
              for (ii = 0; ii < this.findByType('textfield').length; ii++) {
                if (this.findByType('textfield')[ii] && this.findByType('textfield')[ii].fieldLabel == 'Name') {
                  if (
                    this.findByType('textfield')
                      [ii].getValue()
                      .toLowerCase()
                      .search(userName + '$') == -1
                  ) {
                    this.findByType('textfield')[ii].setValue(this.findByType('textfield')[ii].getValue() + ' - ' + userName)
                  }
                }
              }
            }
          }
        }
      }

      if (this.submitInProgress) {
        return
      }

      if (this.beforeSubmitCallback() === false) {
        return
      }

      if (this.okCallback && isFunction(this.okCallback)) {
        this.okCallback()
      }

      if (!this.submitUrl) {
        return
      }

      if (this.showProgressModal) {
        this.hide()

        this.progressModal = Ext.MessageBox.show({
          title: MktLang.getStr('ModalForm.Please_wait'),
          msg: this.progressMsg,
          progress: true,
          wait: true,
          width: 200,
          closable: false
        })
      } else {
        MktSession.clockCursor()
      }

      this.submitInProgress = true
      this.enableOkCancelButton(!this.submitInProgress)

      if (this.serializeJSON) {
        this.serializeParms = this.serializeParms || {}
        this.serializeParms._json = Ext.encode(this.serializeJSON)
      }

      let parms = Ext.apply({}, this.serializeParms, this.baseParams)
      MktSession.ajaxRequest(this.submitUrl, {
        serializeParms: parms,
        onMySuccess: this.submitSuccessHandler.createDelegate(this),
        onMyFailure: this.submitFailedHandler.createDelegate(this)
      })
    }
  }
}

/**************************************************************************************
 *  This function overrides the save edit function for renaming exisiting Programs,
 *  Smart Campaigns, Assets, and Folders in order to enforce a naming convention by
 *  appending the user's username to the name of the program, smart campaign, asset, or
 *  folder; additionally, it prevents the renaming of the user's root folder via the
 *  Marketo canvas tab
 **************************************************************************************/

APP.overrideAssetSaveEdit = function () {
  console.log('Marketo App > Overriding: Asset Save Edit')
  if (LIB.isPropOfWindowObj('Mkt.widgets.CanvasHeader.prototype.saveEdit')) {
    if (typeof origAssetSaveEdit !== 'function') {
      origAssetSaveEdit = Mkt.widgets.CanvasHeader.prototype.saveEdit
    }

    Mkt.widgets.CanvasHeader.prototype.saveEdit = function () {
      if (
        LIB.isPropOfWindowObj('MktCanvas.getActiveTab') &&
        MktCanvas.getActiveTab() &&
        MktCanvas.getActiveTab().config &&
        MktCanvas.getActiveTab().config.accessZoneId &&
        userName
      ) {
        console.log('Marketo App > Executing: Asset Save Edit')
        let currWorkspaceId = MktCanvas.getActiveTab().config.accessZoneId

        if (currWorkspaceId.toString().search(mktoMyWorkspaceIdMatch) != -1) {
          let isFolderEdit = false

          if (
            (MktExplorer.getEl().dom.ownerDocument.title.search('Marketing Activities') != -1 &&
              (this.titleId == 'mpTEName' || this.titleId == 'cdhTEName' || this.titleId == 'pname')) ||
            MktExplorer.getEl().dom.ownerDocument.title.search('Marketing Activities') == -1
          ) {
            if (this.titleId == 'pname') {
              if (this.titleValue == userName) {
                isFolderEdit = true
              }
            }

            if (
              this.getTitleField()
                .getValue()
                .toLowerCase()
                .search(userName + '$') == -1
            ) {
              this.getTitleField().setValue(this.getTitleField().getValue() + ' - ' + userName)
            }
          }

          if (isFolderEdit) {
            var toUpdateNodeText = false

            MktSession.clockCursor(true)
            this.getTitleField().setValue(this.titleValue)
            var canvasTab = MktCanvas.getActiveTab(),
              //canvasTab.updateTabTitle(this.titleValue);
              nodeId = null
            if (canvasTab.config.expNodeId) {
              var node = MktExplorer.getNodeById(canvasTab.config.expNodeId)
              if (node && node.attributes.compType) {
                var {compType} = node.attributes
                if (compType == 'Marketing Program') {
                  nodeId = canvasTab.config.expNodeId
                  //MktExplorer.lockSubTree(nodeId);
                }
                if (compType == 'Image') {
                  toUpdateNodeText = false
                }
              }
            }

            var el = this.getEl(),
              panelObj = this,
              {formPanel} = this,
              {viewPanel} = this
            formPanel.hide(true, 0.2)
            viewPanel.show(true, 0.2)
            viewPanel.body.update(panelObj.viewTemplate.apply(panelObj))

            el.animate(
              {
                height: {
                  from: this.getHeight(),
                  to: this.origHeight
                }
              },
              0.25,
              function () {
                panelObj.setHeight(panelObj.origHeight)
                panelObj.body.setHeight(panelObj.origHeight)
                if (isFunction(panelObj.savedCallback)) {
                  panelObj.savedCallback()
                }
              }
            )

            MktSession.unclockCursor()
            this._saveInProgress = false
          } else {
            var toUpdateNodeText = true

            MktSession.clockCursor(true)
            this.serializeParms[this.titleId] = this.getTitleField().getValue()
            this.serializeParms[this.descId] = this.getDescField().getValue()

            this.newTitleValue = MktPage.isFeatureEnabled('treeEncoding')
              ? this.serializeParms[this.titleId]
              : Ext.util.Format.htmlEncode(this.serializeParms[this.titleId])
            this.newDescValue = Ext.util.Format.htmlEncode(this.serializeParms[this.descId])
            this.updateCanvasConfig()

            this.prevTitleValue = this.titleValue
            this.titleValue = this.newTitleValue
            this.descValue = this.newDescValue
            MktPage.updateFullTitle()
            var canvasTab = MktCanvas.getActiveTab()
            canvasTab.updateTabTitle(this.titleValue)
            var nodeId = null
            if (canvasTab.config.expNodeId) {
              var node = MktExplorer.getNodeById(canvasTab.config.expNodeId)
              if (node && node.attributes.compType) {
                var {compType} = node.attributes
                if (compType == 'Marketing Program') {
                  nodeId = canvasTab.config.expNodeId
                  MktExplorer.lockSubTree(nodeId)
                }
                if (compType == 'Image') {
                  toUpdateNodeText = false
                }
              }
              if (toUpdateNodeText) {
                MktExplorer.updateNodeText(canvasTab.config.expNodeId, this.titleValue)
              }
            }

            var el = this.getEl(),
              panelObj = this,
              {formPanel} = this,
              {viewPanel} = this
            formPanel.hide(true, 0.2)
            viewPanel.show(true, 0.2)
            viewPanel.body.update(panelObj.viewTemplate.apply(panelObj))

            el.animate(
              {
                height: {
                  from: this.getHeight(),
                  to: this.origHeight
                }
              },
              0.25,
              function () {
                panelObj.setHeight(panelObj.origHeight)
                panelObj.body.setHeight(panelObj.origHeight)
                if (isFunction(panelObj.savedCallback)) {
                  panelObj.savedCallback()
                }
              }
            )

            MktSession.unclockCursor()
            this._saveInProgress = true
            MktSession.ajaxRequest(this.actionUrl, {
              serializeParms: this.serializeParms,
              containerId: this.id,
              onMySuccess: this.saveResponse.createDelegate(this, [nodeId], true),
              onMyError: this.saveError.createDelegate(this, [nodeId])
            })
          }
        } else if (currWorkspaceId.toString().search(mktoGoldenWorkspacesMatch) != -1) {
          var toUpdateNodeText = false

          MktSession.clockCursor(true)
          this.getTitleField().setValue(this.titleValue)
          let canvasTab = MktCanvas.getActiveTab(),
            nodeId = null
          if (canvasTab.config.expNodeId) {
            let node = MktExplorer.getNodeById(canvasTab.config.expNodeId)
            if (node && node.attributes.compType) {
              let {compType} = node.attributes
              if (compType == 'Marketing Program') {
                nodeId = canvasTab.config.expNodeId
              }
              if (compType == 'Image') {
                toUpdateNodeText = false
              }
            }
          }

          let el = this.getEl(),
            panelObj = this,
            {formPanel} = this,
            {viewPanel} = this
          formPanel.hide(true, 0.2)
          viewPanel.show(true, 0.2)
          viewPanel.body.update(panelObj.viewTemplate.apply(panelObj))

          el.animate({height: { from: this.getHeight(), to: this.origHeight}}, 0.25,
            function () {
              panelObj.setHeight(panelObj.origHeight)
              panelObj.body.setHeight(panelObj.origHeight)
              if (isFunction(panelObj.savedCallback)) {
                panelObj.savedCallback()
              }
            }
          )

          MktSession.unclockCursor()
          this._saveInProgress = false
        } else {
          origAssetSaveEdit.apply(this, arguments)
        }
      }
    }
  }
}

/**************************************************************************************
 *  This function overrides the create function for any new asset that is not a child
 *  of a program in order to enforce a naming convention by appending the user's
 *  username to the name of the new asset
 **************************************************************************************/

APP.overrideNewAssetCreate = function () {
  console.log('Marketo App > Overriding: New Asset Creation')
  if (LIB.isPropOfWindowObj('Mkt3.controller.lib.AbstractModalForm.prototype.onSubmit') && userName) {
    Mkt3.controller.lib.AbstractModalForm.prototype.onSubmit = function (form) {
      console.log('Marketo App > Executing: New Asset Creation')
      if (
        form == null ||
        form.ownerAsset == null ||
        form.ownerAsset.isOneOfProgramTypes == null ||
        form.ownerAsset.isOneOfProgramTypes() == false
      ) {
        if (
          form.getXType() != 'nurtureTrackForm' &&
          this != null &&
          this.getField('name') != null &&
          this.getField('name').getValue() != null
        ) {
          let assetName = this.getField('name').getValue()

          if (assetName.toLowerCase().search(userName + '$') == -1) {
            this.getField('name').setValue(assetName + ' - ' + userName)
          }
        }
      }

      form = !form.isXType('modalForm') ? form.up('modalForm') : form

      form.setSubmitting(true)

      if (this.validate(form)) {
        if (this.application.fireEvent(this.widgetId + 'BeforeSubmit', form ? form.getRecord() : null) !== false) {
          if (this.submit(form) !== false) {
            this.submitComplete(form)
          }
        } else {
          form.setSubmitting(false)
        }
      } else {
        form.showDefaultMessage()
        form.setSubmitting(false)
      }
    }
  }
}

/**************************************************************************************
 *  This function overrides the new folder create function via Right-click > New
 *  Campaign Folder, New Folder in order to enforce a naming convention by appending
 *  the user's username to the new name of any folder that is not a child of a program
 **************************************************************************************/

APP.overrideNewFolders = function () {
  console.log('Marketo App > Overriding: New Folders')
  if (LIB.isPropOfWindowObj('MktMa.newProgramFolderSubmit') && userName) {
    MktMa.newProgramFolderSubmit = function (text, parentId, tempNodeId) {
      console.log('Marketo App > Executing: New Folders in Marketing Activities')
      MktSession.clockCursor(true)
      let parms = {}

      if (
        (this.currNode.parentNode.attributes.compType.search('Folder$') != -1 && text.toLowerCase().search(userName + '$') == -1) ||
        text == userName
      ) {
        text = text + ' - ' + userName
      }
      parms.text = text
      parms.parentId = parentId
      parms.tempNodeId = tempNodeId
      MktSession.ajaxRequest('explorer/createProgramFolder', {
        serializeParms: parms,
        onMySuccess: MktMa.newProgramFolderDone,
        onMyFailure: function (tempNodeId) {
          let tempNode = MktExplorer.getNodeById(tempNodeId)
          if (tempNode) {
            tempNode.remove()
          }
        }.createDelegate(this, [tempNodeId])
      })
      if (MktMa.currNode) {
        MktMa.currNode.unselect()
      }
    }
  }

  if (LIB.isPropOfWindowObj('MktFolder.newFolderSubmit') && userName) {
    MktFolder.newFolderSubmit = function (text, parentNodeId, tempNodeId) {
      console.log('Marketo App > Executing: New Folders')
      MktSession.clockCursor(true)
      let parms = {}

      if (text.toLowerCase().search(userName + '$') == -1 || text == userName) {
        text = text + ' - ' + userName
      }
      parms.text = text
      parms.parentNodeId = parentNodeId
      parms.tempNodeId = tempNodeId
      MktSession.ajaxRequest('folder/createFolderSubmit', {
        serializeParms: parms,
        onMySuccess: MktFolder.newFolderSubmitDone.createDelegate(this, [tempNodeId]),
        onMyFailure: function (tempNodeId) {
          let tempNode = MktExplorer.getNodeById(tempNodeId)
          if (tempNode) {
            tempNode.remove()
          }
        }.createDelegate(this, [tempNodeId])
      })
    }
  }
}

/**************************************************************************************
 *  This function overrides the folder renaming functions in order to prevent renaming
 *  of the user's root folder via Right-click > Rename Folder and to enforce a naming
 *  convention by appending the user's username to the new name of any folder that is
 *  not a child of a program
 **************************************************************************************/

APP.overrideRenamingFolders = function () {
  console.log('Marketo App > Overriding: Renaming Folders')
  if (LIB.isPropOfWindowObj('MktMa.renameProgramFolderSubmit') && userName) {
    MktMa.renameProgramFolderSubmit = function (value, startValue, folderId) {
      console.log('Marketo App > Executing: Renaming Folders in Marketing Activities')
      MktSession.clockCursor(true)
      let folder = MktExplorer.getNodeById(folderId),
        parms = {}

      if (
        startValue == userName &&
        this.currNode.parentNode.attributes.system == true &&
        this.currNode.attributes.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1
      ) {
        if (folder) {
          folder.setText(startValue)
        }
        MktSession.unclockCursor()
      } else {
        if (
          (this.currNode.parentNode.attributes.compType.search('Folder$') != -1 && value.toLowerCase().search(userName + '$')) == -1 ||
          value == userName
        ) {
          value = value + ' - ' + userName
          if (folder) {
            folder.setText(value)
          }
        }
        parms.origProgramName = startValue
        parms.newProgramName = value
        parms.folderId = folderId
        MktSession.ajaxRequest('explorer/renameProgramFolder', {
          serializeParms: parms,
          onMySuccess: MktMa.renameProgramFolderSubmitDone,
          onMyFailure: function (folderId, origName) {
            let folder = MktExplorer.getNodeById(folderId)
            if (folder) {
              folder.setText(origName)
            }
          }.createDelegate(this, [folderId, startValue])
        })
      }
    }
  }

  if (LIB.isPropOfWindowObj('MktFolder.renameFolderSubmit') && userName) {
    MktFolder.renameFolderSubmit = function (text, startValue, nodeId) {
      console.log('Marketo App > Executing: Renaming Folders')
      MktSession.clockCursor(true)
      let parms = {}

      if (
        startValue == userName &&
        this.currNode.parentNode.attributes.system == true &&
        this.currNode.attributes.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1
      ) {
        MktFolder.currNode.setText(startValue)
        MktSession.unclockCursor()
      } else {
        if (text.toLowerCase().search(userName + '$') == -1 || text == userName) {
          text = text + ' - ' + userName
          MktFolder.currNode.setText(text)
        }
        parms.text = text
        parms.nodeId = nodeId
        MktSession.ajaxRequest('folder/renameFolderSubmit', {
          serializeParms: parms,
          onMySuccess: MktFolder.renameFolderSubmitDone.createDelegate({
            parms: parms,
            startValue: startValue
          }),
          onMyFailure: function () {
            MktFolder.currNode.setText(startValue)
          }.createDelegate(this)
        })
      }
    }
  }
}

/**************************************************************************************
 *  This function hides all folders in the drop down list when importing a program
 *  except the user's own folder
 **************************************************************************************/

APP.hideFoldersOnImport = function () {
  console.log('Marketo App > Hiding: Folders On Program Import via Override')
  if (LIB.isPropOfWindowObj('Ext.form.ComboBox.prototype.onTriggerClick') && userName) {
    Ext.form.ComboBox.prototype.onTriggerClick = function () {
      console.log('Marketo App > Executing: Hide Folders On Program Import via Override')
      if (this.readOnly || this.disabled) {
        return
      }
      if (this.isExpanded()) {
        this.collapse()
        this.el.focus()
      } else {
        this.onFocus({})
        if (this.triggerAction == 'all') {
          this.doQuery(this.allQuery, true)

          if (
            typeof this !== 'undefined' &&
            this &&
            this.label &&
            this.label.dom &&
            this.label.dom.textContent == 'Campaign Folder:' &&
            LIB.isPropOfWindowObj('MktCanvas.getActiveTab') &&
            MktCanvas.getActiveTab() &&
            MktCanvas.getActiveTab().config &&
            MktCanvas.getActiveTab().config.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1
          ) {
            console.log('Marketo App > Executing: Hide Campaign Folders On Program Import via Override')
            let ii

            for (ii = 0; ii < this.view.all.elements.length; ii++) {
              if (this.view.all.elements[ii].textContent.toLowerCase() != userName) {
                this.view.all.elements[ii].hidden = true
              }
            }
          }
        } else {
          this.doQuery(this.getRawValue())
        }
        this.el.focus()
      }
    }
  }
}

/**************************************************************************************
 *  This function disables the Default and Marketing Workspaces home buttons:
 *  New Program, New Smart Campaign, and New Smart List
 **************************************************************************************/

APP.disableButtons = function () {
  console.log('Marketo App > Disabling: Buttons')
  $jQ = jQuery.noConflict()
  if ($jQ && $jQ('.mktButtonPositive')) {
    $jQ('.mktButtonPositive').remove()
  }
}

APP.disableCheckboxes = function () {
  console.log('Marketo App > Disabling: Checkboxes')
  Mkt3.controller.admin.mercury.MercuryAdmin.prototype.getEnabledRoles = function () {
    let me = this
    MktSession.ajaxRequest('/mercury/getMercuryEnabledRoles', {
      params: {},
      onMySuccess: function (response) {
        me.enabledRoles = []
      }
    })
  }

  $jQ = jQuery.noConflict()
  if ($jQ) {
    $jQ('.x4-form-checkbox').attr('disabled', true)
  }
}
/**************************************************************************************
 *  This function evaluates the current node context being moved to determine if the
 *  item should be moved
 **************************************************************************************/

APP.evaluateMoveItem = function (nodeToMove, destNode) {
  console.log('Marketo App > Evaluating: Move Item')
  let mktoCenterOfExcellenceMovableEventCompIdsMatch = '^(1005|1003)$',
    mktoCenterOfExcellenceEventFolderCompIdsMatch = '^(3274|3275)$',
    mktoAssetManagementMovableEventCompIdsMatch = '^(1767|1785)$',
    mktoAssetManagementEventFolderCompIdsMatch = '^(3144|3145)$',
    mktoHealthcareMovableEventCompIdsMatch = '^(1671|1691)$',
    mktoHealthcareEventFolderCompIdsMatch = '^(2821|2822)$',
    mktoHigherEducationMovableEventCompIdsMatch = '^(1635|1655)$',
    mktoHigherEducationEventFolderCompIdsMatch = '^(2719|2720)$',
    mktoManufacturingMovableEventCompIdsMatch = '^(1793|1794)$',
    mktoManufacturingEventFolderCompIdsMatch = '^(3179|3180)$',
    mktoSportsMovableEventCompIdsMatch = '^(1704|1723)$',
    mktoSportsEventFolderCompIdsMatch = '^(2928|2929)$',
    mktoTechnologyMovableEventCompIdsMatch = '^(1072|1061)$',
    mktoTechnologyEventFolderCompIdsMatch = '^(2593|2594)$',
    mktoTravelMovableEventCompIdsMatch = '^(1736|1754)$',
    mktoTravelEventFolderCompIdsMatch = '^(3045|3046)$'

  if (userName) {
    let ii, currNode, depth

    if (
      (nodeToMove.attributes &&
        nodeToMove.attributes.accessZoneId &&
        nodeToMove.attributes.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1) ||
      (destNode.attributes &&
        destNode.attributes.accessZoneId &&
        destNode.attributes.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1)
    ) {
      if (nodeToMove.attributes.compType == 'Marketing Event' && destNode.attributes.compType == 'Marketing Folder') {
        if (
          (nodeToMove.attributes.compId.toString().search(mktoCenterOfExcellenceMovableEventCompIdsMatch) != -1 &&
            destNode.attributes.compId.toString().search(mktoCenterOfExcellenceEventFolderCompIdsMatch) != -1) ||
          (nodeToMove.attributes.compId.toString().search(mktoAssetManagementMovableEventCompIdsMatch) != -1 &&
            destNode.attributes.compId.toString().search(mktoAssetManagementEventFolderCompIdsMatch) != -1) ||
          (nodeToMove.attributes.compId.toString().search(mktoHealthcareMovableEventCompIdsMatch) != -1 &&
            destNode.attributes.compId.toString().search(mktoHealthcareEventFolderCompIdsMatch) != -1) ||
          (nodeToMove.attributes.compId.toString().search(mktoHigherEducationMovableEventCompIdsMatch) != -1 &&
            destNode.attributes.compId.toString().search(mktoHigherEducationEventFolderCompIdsMatch) != -1) ||
          (nodeToMove.attributes.compId.toString().search(mktoManufacturingMovableEventCompIdsMatch) != -1 &&
            destNode.attributes.compId.toString().search(mktoManufacturingEventFolderCompIdsMatch) != -1) ||
          (nodeToMove.attributes.compId.toString().search(mktoSportsMovableEventCompIdsMatch) != -1 &&
            destNode.attributes.compId.toString().search(mktoSportsEventFolderCompIdsMatch) != -1) ||
          (nodeToMove.attributes.compId.toString().search(mktoTechnologyMovableEventCompIdsMatch) != -1 &&
            destNode.attributes.compId.toString().search(mktoTechnologyEventFolderCompIdsMatch) != -1) ||
          (nodeToMove.attributes.compId.toString().search(mktoTravelMovableEventCompIdsMatch) != -1 &&
            destNode.attributes.compId.toString().search(mktoTravelEventFolderCompIdsMatch) != -1)
        ) {
          return true
        }
      } else {
        return false
      }
    } else if (
      nodeToMove.attributes.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1 &&
      destNode.attributes.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1
    ) {
      currNode = nodeToMove
      depth = currNode.getDepth()
      for (ii = 0; ii < depth; ii++) {
        if (currNode.text == userName) {
          currNode = destNode
          depth = currNode.getDepth()
          for (ii = 0; ii < depth; ii++) {
            if (currNode.text == userName) {
              return true
            }
            currNode = currNode.parentNode
          }
          return false
        }
        currNode = currNode.parentNode
      }
      return false
    } else if (nodeToMove.attributes.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1) {
      currNode = nodeToMove
      depth = currNode.getDepth()
      for (ii = 0; ii < depth; ii++) {
        if (currNode.text == userName) {
          return true
        }
        currNode = currNode.parentNode
      }
      return false
    } else if (destNode.attributes.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1) {
      currNode = destNode
      depth = currNode.getDepth()
      for (ii = 0; ii < depth; ii++) {
        if (currNode.text == userName) {
          return true
        }
        currNode = currNode.parentNode
      }
      return false
    } else {
      return true
    }
  }
}

/**************************************************************************************
 *  This function disables dragging and dropping tree node items other than those that
 *  originate and are destined for a location within the user's root folder
 **************************************************************************************/

APP.disableDragAndDrop = function () {
  console.log('Marketo App > Disabling: Tree Node Drop')
  if (LIB.isPropOfWindowObj('Ext.tree.TreeDropZone.prototype.processDrop')) {
    Ext.tree.TreeDropZone.prototype.processDrop = function (target, data, point, dd, e, dropNode) {
      console.log('Marketo App > Executing: Tree Node Drop')
      if (APP.evaluateMoveItem(dropNode, target)) {
        let dropEvent = {
            tree: this.tree,
            target: target,
            data: data,
            point: point,
            source: dd,
            rawEvent: e,
            dropNode: dropNode,
            cancel: !dropNode,
            dropStatus: false
          },
          retval = this.tree.fireEvent('beforenodedrop', dropEvent)
        if (retval === false || dropEvent.cancel === true || !dropEvent.dropNode) {
          target.ui.endDrop()
          return dropEvent.dropStatus
        }

        target = dropEvent.target
        if (point == 'append' && !target.isExpanded()) {
          target.expand(
            false,
            null,
            function () {
              this.completeDrop(dropEvent)
            }.createDelegate(this)
          )
        } else {
          this.completeDrop(dropEvent)
        }
        return true
      } else {
        return false
      }
    }
  }
}

/**************************************************************************************
 *  This function evaluates the current menu context to determine if items should be
 *  disabled
 **************************************************************************************/

APP.evaluateMenu = function (triggeredFrom, menu, canvas, toolbar) {
  console.log('Marketo App > Evaluating: Menu')
  if (userName) {
    let toBeDisabled = false

    switch (triggeredFrom) {
      case 'tree':
        if (
          menu &&
          menu.currNode &&
          menu.currNode.attributes &&
          menu.currNode.attributes.accessZoneId &&
          (menu.currNode.attributes.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1 ||
            menu.currNode.attributes.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1)
        ) {
          toBeDisabled = true

          if (menu.currNode.attributes.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1) {
            let ii,
              {currNode} = menu,
              depth = currNode.getDepth()

            for (ii = 0; ii < depth; ii++) {
              if (currNode.attributes.text == userName) {
                toBeDisabled = false
                break
              }
              currNode = currNode.parentNode
            }
          }
        } else if (
          (!menu || !menu.currNode || !menu.currNode.attributes || !menu.currNode.attributes.accessZoneId) &&
          canvas &&
          canvas.config &&
          canvas.config.accessZoneId &&
          (canvas.config.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1 ||
            (canvas.config.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1 &&
              ((canvas.config.expNodeId && MktExplorer.getNodeById(canvas.config.expNodeId)) ||
                (canvas.config.dlZoneFolderId && MktExplorer.getNodeById(canvas.config.dlZoneFolderId)))))
        ) {
          toBeDisabled = true

          if (canvas.config.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1) {
            let ii, currNode, depth

            if (canvas.config.expNodeId) {
              currNode = MktExplorer.getNodeById(canvas.config.expNodeId)
            } else {
              currNode = MktExplorer.getNodeById(canvas.config.dlZoneFolderId)
            }
            depth = currNode.getDepth()

            for (ii = 0; ii < depth; ii++) {
              if (currNode.attributes.text == userName) {
                toBeDisabled = false
                break
              }
              currNode = currNode.parentNode
            }
          }
        } else if (
          (!menu || !menu.currNode || !menu.currNode.attributes || !menu.currNode.attributes.accessZoneId) &&
          canvas &&
          canvas.config &&
          !canvas.config.accessZoneId
        ) {
          toBeDisabled = true
        }
        return toBeDisabled

      case 'button':
        if (
          canvas &&
          canvas.config &&
          canvas.config.accessZoneId &&
          (canvas.config.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1 ||
            (canvas.config.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1 &&
              ((canvas.config.expNodeId && MktExplorer.getNodeById(canvas.config.expNodeId)) ||
                (canvas.config.dlZoneFolderId && MktExplorer.getNodeById(canvas.config.dlZoneFolderId)))))
        ) {
          toBeDisabled = true

          if (canvas.config.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1) {
            var currNode, depth

            if (canvas.config.expNodeId) {
              currNode = MktExplorer.getNodeById(canvas.config.expNodeId)
            } else {
              currNode = MktExplorer.getNodeById(canvas.config.dlZoneFolderId)
            }
            depth = currNode.getDepth()

            for (let ii = 0; ii < depth; ii++) {
              if (currNode.attributes.text == userName) {
                toBeDisabled = false
                break
              }
              currNode = currNode.parentNode
            }
          }
        } else if ((!canvas || !canvas.config || !canvas.config.accessZoneId) && MktMainNav && MktMainNav.activeNav == 'tnCustAdmin') {
          toBeDisabled = true
        }
        return toBeDisabled

      case 'socialAppToolbar':
        if (
          (toolbar.getSocialApp() &&
            toolbar.getSocialApp().get('zoneId') &&
            toolbar.getSocialApp().get('zoneId').toString().search(mktoGoldenWorkspacesMatch) != -1) ||
          (toolbar.getSocialApp().get('zoneId').toString().search(mktoMyWorkspaceIdMatch) != -1 &&
            toolbar.getSocialApp().getNodeJson() &&
            toolbar.getSocialApp().getNodeJson().id &&
            MktExplorer.getNodeById(toolbar.getSocialApp().getNodeJson().id))
        ) {
          toBeDisabled = true

          if (toolbar.getSocialApp().get('zoneId').toString().search(mktoMyWorkspaceIdMatch) != -1) {
            let ii,
              currNode = MktExplorer.getNodeById(toolbar.getSocialApp().getNodeJson().id),
              depth = currNode.getDepth()

            for (ii = 0; ii < depth; ii++) {
              if (currNode.attributes.text == userName) {
                toBeDisabled = false
                break
              }
              currNode = currNode.parentNode
            }
          }
        }
        return toBeDisabled

      case 'mobilePushNotification':
        if (
          (toolbar.getMobilePushNotification() &&
            toolbar.getMobilePushNotification().get('zoneId') &&
            toolbar.getMobilePushNotification().get('zoneId').toString().search(mktoGoldenWorkspacesMatch) != -1) ||
          (toolbar.getMobilePushNotification().get('zoneId').toString().search(mktoMyWorkspaceIdMatch) != -1 &&
            toolbar.getMobilePushNotification().getNodeJson() &&
            toolbar.getMobilePushNotification().getNodeJson().id &&
            MktExplorer.getNodeById(toolbar.getMobilePushNotification().getNodeJson().id))
        ) {
          toBeDisabled = true

          if (toolbar.getMobilePushNotification().get('zoneId').toString().search(mktoMyWorkspaceIdMatch) != -1) {
            let ii,
              currNode = MktExplorer.getNodeById(toolbar.getMobilePushNotification().getNodeJson().id),
              depth = currNode.getDepth()

            for (ii = 0; ii < depth; ii++) {
              if (currNode.attributes.text == userName) {
                toBeDisabled = false
                break
              }
              currNode = currNode.parentNode
            }
          }
        }
        return toBeDisabled

      case 'inAppMessage':
        if (
          (toolbar.getInAppMessage() &&
            toolbar.getInAppMessage().get('zoneId') &&
            toolbar.getInAppMessage().get('zoneId').toString().search(mktoGoldenWorkspacesMatch) != -1) ||
          (toolbar.getInAppMessage().get('zoneId').toString().search(mktoMyWorkspaceIdMatch) != -1 &&
            toolbar.getInAppMessage().getNodeJson() &&
            toolbar.getInAppMessage().getNodeJson().id &&
            MktExplorer.getNodeById(toolbar.getInAppMessage().getNodeJson().id))
        ) {
          toBeDisabled = true

          if (toolbar.getInAppMessage().get('zoneId').toString().search(mktoMyWorkspaceIdMatch) != -1) {
            let ii,
              currNode = MktExplorer.getNodeById(toolbar.getInAppMessage().getNodeJson().id),
              depth = currNode.getDepth()

            for (ii = 0; ii < depth; ii++) {
              if (currNode.attributes.text == userName) {
                toBeDisabled = false
                break
              }
              currNode = currNode.parentNode
            }
          }
        }
        return toBeDisabled

      case 'smsMessage':
        if (
          (toolbar.getSmsMessage() &&
            toolbar.getSmsMessage().get('zoneId') &&
            toolbar.getSmsMessage().get('zoneId').toString().search(mktoGoldenWorkspacesMatch) != -1) ||
          (toolbar.getSmsMessage().get('zoneId').toString().search(mktoMyWorkspaceIdMatch) != -1 &&
            toolbar.getSmsMessage().getNodeJson() &&
            toolbar.getSmsMessage().getNodeJson().id &&
            MktExplorer.getNodeById(toolbar.getSmsMessage().getNodeJson().id))
        ) {
          toBeDisabled = true

          if (toolbar.getSmsMessage().get('zoneId').toString().search(mktoMyWorkspaceIdMatch) != -1) {
            let ii,
              currNode = MktExplorer.getNodeById(toolbar.getSmsMessage().getNodeJson().id),
              depth = currNode.getDepth()

            for (ii = 0; ii < depth; ii++) {
              if (currNode.attributes.text == userName) {
                toBeDisabled = false
                break
              }
              currNode = currNode.parentNode
            }
          }
        }
        return toBeDisabled

      default:
        return true
    }
  }
}

APP.disableAccountAI = function () {
  console.log('Marketo App > Disabling: Account AI')
  if (LIB.isPropOfWindowObj('Mkt3.controller.abm.icpModeling.DeleteModelForm.prototype.onSubmit')) {
    Mkt3.controller.abm.icpModeling.DeleteModelForm.prototype.onSubmit = function () {
      console.log('hijacked onDeleteModelClick click')
      return null
    }
  }
  if (LIB.isPropOfWindowObj('Mkt3.controller.abm.icpModeling.TuneModelForm.prototype.onSubmit')) {
    Mkt3.controller.abm.icpModeling.TuneModelForm.prototype.onSubmit = function () {
      console.log('hijacked onSubmit click')
      return null
    }
  }

  if (LIB.isPropOfWindowObj('Mkt3.controller.abm.icpModeling.UpdateAccountsForm.prototype.onSubmit')) {
    Mkt3.controller.abm.icpModeling.UpdateAccountsForm.prototype.onSubmit = function () {
      console.log('hijacked onBeforePushData click')
      return null
    }
  }
}

// for all asset types for all Actions Buttons and Right-click Tree menus in all areas.
APP.disableMenus = function () {
  console.log('Marketo App > Disabling: Menus')
  if (LIB.isPropOfWindowObj('Ext.menu.Menu.prototype.showAt')) {
    // Disable ALL areas > ALL assets > ALL Actions and Right-click menus except Social App, Push Notification, and In-App Message Actions Buttons
    Ext.menu.Menu.prototype.showAt = function (xy, parentMenu) {
      console.log('Marketo App > Executing: Disable Actions and Right-click menus for ALL in ALL')
      if (this.fireEvent('beforeshow', this) !== false) {
        let disable,
          menu = this,
          mItems = this.items,
          canvas = MktCanvas.getActiveTab(),
          itemsToDisable = [
            // Global > Form > Actions Button & Right-click Tree
            'formApprove', //Approve
            'formClone', //Clone Form
            'formDelete', //Delete Form
            'formMove', //Move
            'formDraftApprove', //Approve Draft
            // Global > Landing Page > Actions Button & Right-click Tree
            'pageApprove', //Approve
            'pageUnapprove', //Unapprove
            'pageConvertToTestGroup', //Convert to Test Group
            'pageClone', //Clone
            'pageDelete', //Delete
            'pageMove', //Move
            'pageDraftApprove', //Approve Draft
            // Global > Email > Actions Button & Right-click Tree
            'emailApprove', //Approve
            'emailUnapprove', //Unapprove
            'emailClone', //Clone
            'emailDelete', //Delete
            'emailMove', //Move
            'emailNewTest', //New Test
            'emailDraftApprove', //Approve Draft
            'emailApproveTest', //Approve Test
            // Global > Smart List, List, Segment > Actions Button & Right-click Tree
            'importList', //Import List
            'cloneSmartlist', //Clone Smart List
            'cloneList', //Clone List
            'deleteList', //Delete List
            'showSupportHistory', //Support Tools - History
            'showSupportUsagePerf', //Support Tools - Run Stats
            'showSmartListProcessorDiag', //Processor Diagnostics
            'showSmartListProcessorOverride', //Override Processor
            // Global > Report > Actions Button
            'cloneReport_atxCanvasOverview', //Clone Report
            'deleteReport', //Delete Report
            // Global > Report > Right-click Tree
            'cloneReport', //Clone Report
            'deleteReport', //Delete Report
            'moveReport', //Move Report
            // Global > Lead > Actions Button & Right-click Tree
            'blackCatDiag', //BlackCat Diagnostics
            'mergeLeads', //Merge Leads
            'sendEmail', //Send Email...
            'sendPushNotification', //Send Push Notification...
            'subscribeToVibesList', //Subscribe to Vibes List...
            'sendSMS', //Send SMS...
            'unsubscribeFromVibesList', //Unsubscribe from Vibes List...
            'addToList', //Add to List...
            'removeFromList', //Remove from List...
            'interestingMoment', //Interesting Moment...
            'sendAlert', //Send Alert...
            'changeScore', //Change Score...
            'changeDataValue', //Change Data Value...
            'addToNamedAccount', //Add to Named Account...
            'removeFromNamedAccount', //Remove from Named Account...
            'changeStatusInProgression', //Change Program Status...
            'addToNurture', //Add to Engagement Program...
            'changeNurtureCadence', //Change Engagement Program Cadence...
            'changeNurtureTrack', //Change Engagement Program Stream...
            'changeLeadPartition', //Change Lead Partition...
            'changeRevenueStage', //Change Revenue Stage...
            'deleteLead', //Delete Lead...
            'giveCreditToReferrer', //Give Credit to Referrer
            'requestCampaign', //Request Campaign...
            'removeFromFlow', //Remove from Flow...
            'pushLeadToSFDC', //Sync Lead to SFDC...
            'createTask', //Create Task...
            'convertLead', //Convert Lead...
            'changeOwner', //Change Owner...
            'deleteLeadFromSFDC', //Delete Lead from SFDC...
            'addToSFDCCampaign', //Add to SFDC Campaign...
            'changeStatusInSFDCCampaign', //Change Status in SFDC Campaign...
            'removeFromSFDCCampaign', //Remove from SFDC Campaign...
            'syncLeadToMicrosoft', //Sync Lead to Microsoft
            // Global > Programs, Analyzers, and Reports > Setup Right-click Tree
            'deleteItem', //Delete
            // Marketing Activities > New Button
            'createProgramFolder', //New Campaign Folder
            'newSmartCampaign', //New Smart Campaign
            'createNewMarketingProgram', //New Program
            'importProgram', //Import Program
            // Marketing Activities > Default & Email Send Programs > Actions Button
            'entryRescheduleEntries', //Reschedule Entries
            'sfdcCampaignSync', //Salesforce Campaign Sync
            'cloneMarketingProgram', //Clone
            'deleteMarketingProgram', //Delete
            // Marketing Activities > Event Program > Actions Button
            'eventSchedule', //Schedule
            'entryRescheduleEntries', //Reschedule Entries
            'webinarSettings', //Event Settings
            'sfdcCampaignSync', //Salesforce Campaign Sync
            'cloneMarketingEvent', //Clone
            'deleteMarketingEvent', //Delete
            'refreshFromWebinarProvider', //Refresh from Webinar Provider
            // Marketing Activities > Nurturing Program > Actions Button
            'sfdcCampaignSync', //Salesforce Campaign Sync
            'cloneNurtureProgram', //Clone
            'deleteNurtureProgram', //Delete
            'testNurtureProgram', //Test Stream
            // Marketing Activities > Smart Campaign > Actions Button
            // Default, Email Send, Event, and Nurturing Programs; Smart Campaign, Folder > Right-click Tree
            'newSmartCampaign', //New Smart Campaign
            'createNewMarketingProgram', //New Program
            'newLocalAsset', //New Local Asset
            'createProgramFolder', //New Campaign Folder
            'renameProgramFolder', //Rename Folder
            'deleteProgramFolder', //Delete Folder
            'convertToArchiveFolder', //Convert To Archive Folder
            'convertToCampaignFolder', //Convert To Campaign Folder
            'scClone', //Clone
            'scArchive', //Delete
            'scMove', //Move
            'cloneMarketingProgram', //Clone
            'deleteMarketingProgram', //Delete
            'cloneMarketingEvent', //Clone
            'deleteMarketingEvent', //Delete
            'cloneNurtureProgram', //Clone
            'deleteNurtureProgram', //Delete
            'cloneEmailBatchProgram', //Clone
            'deleteEmailBatchProgram', //Delete
            'cloneInAppProgram', //Clone
            'deleteInAppProgram', //Delete
            'shareProgramFolder', //Share Folder
            'scActivate', //Activate
            'scAbort', //Abort Campaign
            'scCampChangeHistory', //Support Tools - Change History
            'scCampRunHistory', //Support Tools - Run History
            'scClearPalette', //Clear Palette Cache
            'scClearSmartList', //Clear Smart List
            'scClearFlow', //Clear Flow
            'progGenerateRef', //Build Campaign References
            'checkForCorruptEmails', //Check For Corrupt Emails
            'socialAppApprove', //Approve
            'socialAppClone', //Clone
            'socialAppDelete', //Delete
            'socialAppDraftApprove', //Approve Draft
            // Marketing Activities > Push Notification > Right-click Tree
            'pushNotificationUnapprove', //Unapprove
            'pushNotificationApprove', //Approve
            'pushNotificationSendSample', //Send Sample
            'pushNotificationClone', //Clone
            'pushNotificationDelete', //Delete
            'pushNotificationDraftSendSample', //Send Sample of Draft
            'pushNotificationDraftApprove', //Approve Draft
            // Marketing Activities > In-App Message > Right-click Tree
            'inAppMessageUnapprove', //Unapprove
            'inAppMessageApprove', //Approve
            'inAppMessageSendSample', //Send Sample
            'inAppMessageClone', //Clone
            'inAppMessageDelete', //Delete
            'inAppMessageDraftSendSample', //Send Sample of Draft
            'inAppMessageDraftApprove', //Approve Draft
            // Marketing Activities > SMS Message > Right-click Tree
            'smsMessageUnapprove', //Unapprove
            'smsMessageApprove', //Approve
            'smsMessageClone', //Clone
            'smsMessageDelete', //Delete
            'smsMessageDraftApprove', //Approve Draft
            // Marketing Activities > ALL Programs & Folders > My Tokens Right-click Tree
            'deleteCustomToken', //Delete Token
            // Design Studio > Folder > Right-click Tree
            'newLandingPage', //New Landing Page
            'newTestGroup', //New Test Group
            'newPageTemplate', //New Landing Page Template
            'pageTemplateImport', //Import Template
            'newForm', //New Form
            'newVideoShare', //New YouTube Video
            'newShareButton', //New Social Button
            'newReferralOffer', //New Referral Offer
            'newEmail', //New Email
            'newEmailTemplate', //New Email Template
            'newSnippet', //New Snippet
            'uploadImage', //Upload Image or File
            'share', //Share Folder
            'createFolder', //New Folder
            'renameFolder', //Rename Folder
            'deleteFolder', //Delete Folder
            'convertToArchiveFolder', //Convert To Archive Folder
            'convertToFolder', //Convert To Folder
            // Design Studio > Landing Page Template > Actions Button & Right-click Tree
            'approvePageTemplate', //Approve
            'unapprovePageTemplate', //Unapprove
            'clonePageTemplate', //Clone
            'pageTemplateDelete', //Delete
            'approveDraftPageTemplate', //Approve Draft
            // Design Studio > Email Template > Actions Button & Right-click Tree
            'emailTemplateApprove', //Approve
            'emailTemplateUnapprove', //Unapprove
            'emailTemplateClone', //Clone
            'emailTemplateDelete', //Delete
            'emailTemplateDraftApprove', //Approve Draft
            // Design Studio > Snippet > Actions Button & Right-click Tree
            'snippetApprove', //Approve
            'snippetUnapprove', //Unapprove
            'snippetClone', //Clone
            'snippetDelete', //Delete
            'snippetDraftApprove', //Approve Draft
            // Design Studio > Image & File > Actions Button
            'uploadImage', //Upload Image or File
            'imageDelete', //Delete
            'replaceImage', //Replace Image or File
            // Lead Database > New Button
            'newSmartList', //New Smart List
            'newList', //New List
            'newSegmentation', //New Segmentation
            'importList', //Import List
            'newLead', //New Lead
            'newDataMgr', //New Field Organizer
            // Lead Database > Folder > Right-click Tree
            'newSegmentation', //New Segmentation
            'newSmartList', //New Smart List
            'share', //Share Folder
            'createFolder', //New Folder
            'renameFolder', //Rename Folder
            'deleteFolder', //Delete Folder
            'convertToArchiveFolder', //Convert To Archive Folder
            'convertToFolder', //Convert To Folder
            // Lead Database > Segmentation > Actions Button & Right-click Tree
            'createDraftSegmentation', //Create Draft
            'approveSegmentation', //Approve
            'unapproveSegmentation', //Unapprove
            'deleteSegmentation', //Delete
            'refreshSegmentation', //Refresh Status
            'approveDraftSegmentation', //Approve Draft
            // Analytics > New Button
            'newRcm_rcmCanvasOverview', //New Revenue Cycle Model
            'newRcm_atxCanvasOverview', //New Revenue Cycle Model
            'newRcm_atxCanvasDetailView', //New Revenue Cycle Model (Report Tab)
            'newRcm_atxCanvasSmartlist', //New Revenue Cycle Model (Smart List Tab)
            'newRcm_atxCanvasSetup', //New Revenue Cycle Model (Setup Tab)
            'newRcm_atxCanvasSubscriptions', //New Revenue Cycle Model (Subscriptions Tab)
            'newRcm_rcmMembersCanvas', //New Revenue Cycle Model (Members Tab)
            // Analytics > Folder > Right-click Tree
            'newRcm', //New Revenue Cycle Model
            'share', //Share Folder
            'createFolder', //New Folder
            'renameFolder', //Rename Folder
            'deleteFolder', //Delete Folder
            'convertToArchiveFolder', //Convert To Archive Folder
            'convertToFolder', //Convert To Folder
            // Analytics > Analyzer & Report > Actions Button
            'newReport_atxCanvasOverview', //Export Data
            'newReport_atxCanvasSetup', //Export Data (Setup Tab)
            'cloneReport_atxCanvasOverview', //Clone Analyzer
            'cloneReport_atxCanvasDetailView', //Clone Analyzer (Report Tab)
            'cloneReport_atxCanvasSmartlist', //Clone Analyzer (Smart List Tab)
            'cloneReport_atxCanvasSetup', //Clone Analyzer (Setup Tab)
            'cloneReport_atxCanvasSubscriptions', //Clone Analyzer (Subscriptions Tab)
            'deleteReport', //Delete Analyzer
            // Analytics > Analyzer > Right-click Tree
            'cloneReport', //Clone Analyzer
            'deleteReport', //Delete Analyzer
            // Analytics > Report > Right-click Tree
            'cloneReport', //Clone Report
            'deleteReport', //Delete Report
            'moveReport', //Move Report
            // Analytics > Model > Actions Button & Right-click Tree
            'rcmEdit', //Edit Draft
            'rcmApproveStages', //Approve Stages
            'rcmUnapproveStages', //Unapprove Stages
            'rcmApprove', //Approve Model
            'rcmUnapprove', //Unapprove Model
            'rcmClone', //Clone Model
            'rcmDelete', //Delete Model
            'rcmEditDraft', //Edit Draft
            'rcmApproveDraft', //Approve Model Draft
            'rcmAassignmentRules', //Assignment Rules
            // Analytics > Model > Stage > Actions Button & Right-click
            'Delete', //Delete
            // Analytics > Model > Transition > Actions Button & Right-click
            'Delete', //Delete
            // Admin > Tags > Tags > Actions Button & Right-click Tree
            'deleteDescriptor', //Delete
            'deleteDescriptorValue', //Delete
            'hideDescriptorValue', //Hide
            'unhideDescriptorValue', //Unhide
            // Admin > Tags > Calendar Entry Types > Actions Button
            'unhideEntry', //Unhide
            'hideEntry', //Hide
            // Admin > Field Management > Actions Button
            'hideFieldFmFields', //Hide field
            // Admin > Landing Pages > Rules > Actions Button
            'deleteRule', //Delete Rule
            // Admin > LaunchPoint > Actions Button
            'cloneWebinarLogin', //Clone Login
            'deleteWebinarLogin', //Delete Service
            // Admin > Webhooks > Actions Button
            'cloneWebhook', //Clone Webhook
            'deleteWebhook' //Delete Webhook
          ],
          itemsToDisableAlways = [
            // Default, Email Send, Event, and Nurturing Programs; Smart Campaign, Folder > Right-click Tree
            'shareProgramFolder', //Share Folder
            // Lead Database > Segmentation > Actions Button & Right-click Tree
            'approveSegmentation', //Approve
            'unapproveSegmentation', //Unapprove
            'refreshSegmentation', //Refresh Status
            'approveDraftSegmentation', //Approve Draft
            // Analytics > Folder > Right-click Tree
            'share', //Share Folder
            // Analytics > Model > Actions Button & Right-click Tree
            'rcmApproveStages', //Approve Stages
            'rcmUnapproveStages', //Unapprove Stages
            'rcmApprove', //Approve Model
            'rcmUnapprove', //Unapprove Model
            'rcmApproveDraft' //Approve Model Draft
          ]

        if (this.id == 'leadDbListMenu' || this.id == 'segmentationMenu') {
          disable = APP.evaluateMenu('tree', this, canvas, null)
        } else if (
          this.id == 'leadDbLeadMenu' ||
          (this.ownerCt && this.ownerCt.parentMenu && this.ownerCt.parentMenu.id == 'leadDbLeadMenu')
        ) {
          disable = true
        } else if (this.triggeredFrom != 'tree' && this.triggeredFrom != 'button') {
          disable = APP.evaluateMenu('tree', this, canvas, null)
        } else {
          disable = APP.evaluateMenu(this.triggeredFrom, this, canvas, null)
        }

        itemsToDisable.forEach(function (itemToDisable) {
          let item

          if (itemToDisable == 'Delete') {
            item = menu.find('text', itemToDisable)[0]
          } else {
            item = mItems.get(itemToDisable)
          }

          if (item) {
            item.setDisabled(disable)
          }
        })

        itemsToDisableAlways.forEach(function (itemToDisable) {
          let item
          if (itemToDisable == 'Delete') {
            item = menu.find('text', itemToDisable)[0]
          } else {
            item = mItems.get(itemToDisable)
          }
          if (item) {
            item.setDisabled(true)
          }
        })

        if (this.ownerCt && this.ownerCt.text) {
          switch (this.ownerCt.text) {
            case 'Change Status':
              for (let ii = 0; ii < this.items.items.length; ii++) {
                this.items.items[ii].setDisabled(true)
              }
              break
            case 'Field Actions':
              for (let ii = 0; ii < this.items.items.length; ii++) {
                if (this.items.items[ii].text == 'New Custom Field') {
                  this.items.items[ii].setDisabled(true)
                  break
                }
              }
          }

          if (this.ownerCt.text.search('^View:') != -1) {
            for (let ii = 0; ii < this.items.items.length; ii++) {
              switch (this.items.items[ii].text) {
                case 'Create View':
                  this.items.items[ii].setDisabled(true)
                  break
                case 'Edit Default':
                  this.items.items[ii].setDisabled(true)
                  break
                default:
                  break
              }
            }
          }
        }

        this.parentMenu = parentMenu
        if (!this.el) {
          this.render()
        }
        if (this.enableScrolling) {
          this.el.setXY(xy)
          xy[1] = this.constrainScroll(xy[1])
          xy = [this.el.adjustForConstraints(xy)[0], xy[1]]
        } else {
          xy = this.el.adjustForConstraints(xy)
        }
        this.el.setXY(xy)
        this.el.show()
        Ext.menu.Menu.superclass.onShow.call(this)
        if (Ext.isIE) {
          this.fireEvent('autosize', this)
          if (!Ext.isIE8) {
            this.el.repaint()
          }
        }
        this.hidden = false
        this.focus()
        this.fireEvent('show', this)
      }
    }
  } else {
    console.log('Marketo App > Skipped: Disable Actions and Right-click menus for ALL in ALL')
  }

  if (LIB.isPropOfWindowObj('Mkt3.controller.editor.wizard.Editor.prototype.loadStep')) {
    Mkt3.controller.editor.wizard.Editor.prototype.loadStep = function (step) {
      console.log('Marketo App > Executing: Disable Create button in Wizard Editors')
      let editor = this.getEditor(),
        tree = this.getTree(),
        previousStep = tree.getCurrentStep(),
        previousStepId = previousStep ? previousStep.getId() : null,
        stepId = step.getId(),
        titleItem = this.getNavBar().getComponent('title'),
        steps = editor.items.items,
        i = 0,
        il = steps.length

      Ext4.suspendLayouts()

      // update navigation title
      titleItem.setText(step.get('titleText') || step.get('text'))

      // update content
      for (; i < il; i++) {
        steps[i].setVisible(Ext4.Array.contains(Ext4.Array.from(steps[i].stepIds), stepId))
      }

      // update custom token
      Mkt3.DlManager.setCustomToken(step.getId())

      tree.expandPath(step.parentNode.getPath())
      tree.getView().getSelectionModel().select(step)

      this.updateFlowButtons()

      editor.fireEvent('stepchange', stepId, previousStepId)

      Ext4.resumeLayouts(true)

      if (editor.down) {
        if (editor.down('[action=create]') && editor.down('[action=create]').isVisible()) {
          editor.down('[action=create]').setDisabled(true)
        } else if (editor.down('[action=import]') && editor.down('[action=import]').isVisible()) {
          editor.down('[action=import]').setDisabled(true)
        }
      }
    }
  } else {
    console.log('Marketo App > Skipped: Disable Create button in Wizard Editors')
  }

  if (LIB.isPropOfWindowObj('Ext4.button.Button.prototype.showMenu')) {
    Ext4.button.Button.prototype.showMenu = function (fromEvent) {
      console.log('Marketo App > Executing: Disable Toolbar Buttons & Actions Menu in ABM & Admin Sections')
      let mItems = this.menu.items,
        menuItems,
        itemsToDisable = [
          // Account Based Marketing > Named Accounts > New Button
          // Account Based Marketing > Named Accounts > Actions Button
          'deleteNamedAccount', //Delete Named Account
          // Account Based Marketing > Named Accounts > Account Team Actions
          'deleteAccountMember', //Remove Account Member
          // Admin > Marketo Custom Objects > Marketo Custom Objects > Actions Button
          'mktoCustomObjectPublishBtn', //Approve Object
          'mktoCustomObjectDeleteBtn', //Delete Object
          // Admin > Marketo Custom Objects > Fields > Actions Button
          'mktoCustomObjectFieldDeleteBtn', // Delete Field
          // Admin > Marketo Custom Activities > Marketo Custom Activities > Actions Button
          'mktoCustomActivityPublishBtn', //Approve Activity
          'mktoCustomActivityDeleteBtn', //Delete Activity
          // Admin > Marketo Custom Activities > Fields > Actions Button
          'mktoCustomActivityFieldDeleteBtn' //Delete Field
        ]

      if (mItems) {
        itemsToDisable.forEach(function (itemToDisable) {
          let item = mItems.get(itemToDisable)
          if (item) {
            item.setDisabled(true)
          }
        })
      }
      menuItems = [
        // Account Based Marketing > Account Lists > New Button
        'contextMenu [action=deleteAccountList]', //Delete Account List
        'menu [action=delete]', //Delete Mobile App
        'menu [action=editTestDevice]', //Edit Test Device
        'menu [action=deleteTestDevice]' //Delete Test Device
      ]
      mItems = Ext4.ComponentQuery.query(menuItems.toString())

      if (mItems) {
        mItems.forEach(function (item) {
          if (item) {
            item.setDisabled(true)
          }
        })
      }

      let me = this,
        {menu} = me
      if (me.rendered) {
        if (me.tooltip && Ext.quickTipsActive && me.getTipAttr() != 'title') {
          Ext.tip.QuickTipManager.getQuickTip().cancelShow(me.btnEl)
        }
        if (menu.isVisible()) {
          menu.hide()
        }
        if (!fromEvent || me.showEmptyMenu || menu.items.getCount() > 0) {
          menu.showBy(me.el, me.menuAlign, (!Ext.isStrict && Ext.isIE) || Ext.isIE6 ? [-2, -2] : undefined)
        }
      }
      return me
    }
  } else {
    console.log('Marketo App > Skipped: Disable Toolbar Buttons & Actions Menu in ABM & Admin Sections')
  }

  if (LIB.isPropOfWindowObj('Mkt3.controller.abm.namedAccount.Dashboard.prototype.loadToolBar')) {
    Mkt3.controller.abm.namedAccount.Dashboard.prototype.loadToolBar = function () {
      console.log('Marketo App > Executing: Disable Toolbar Buttons for ABM > Named Accounts')
      let menuItems = [
          // Named Account Toolbar Buttons
          'abmNamedAccountToolbar [action=linkPeople]' //Add People to Named Account
        ],
        mItems = Ext4.ComponentQuery.query(menuItems.toString())

      if (mItems) {
        mItems.forEach(function (item) {
          if (item) {
            item.setDisabled(true)
          }
        })
      }

      let canvas = this.getCanvas(),
        toolbar = canvas.down('abmNamedAccountToolbar')

      toolbar.down('#newMenu').hide()
      toolbar.down('#peopleLink').hide()
      toolbar.down('#deleteNamedAccount').hide()
    }
  } else {
    console.log('Marketo App > Skipped: Disable Toolbar Buttons for ABM > Named Accounts')
  }

  if (LIB.isPropOfWindowObj('Mkt3.controller.abm.accountList.Dashboard.prototype.loadToolBar')) {
    Mkt3.controller.abm.accountList.Dashboard.prototype.loadToolBar = function () {
      console.log('Marketo App > Executing: Disable Toolbar Buttons for ABM > Account Lists > Named Accounts')
      let menuItems = [
          // Account Based Marketing > Account Lists > Named Account > Toolbar Buttons
          'abmAccountListToolbar [action=removeNamedAccount]' //Remove Named Accounts
        ],
        mItems = Ext4.ComponentQuery.query(menuItems.toString())

      if (mItems) {
        mItems.forEach(function (item) {
          if (item) {
            item.destroy()
          }
        })
      }

      let dashboard = this.getDashboard(),
        toolbar = dashboard.query('abmAccountListToolbar')

      for (let i = 0; i < toolbar.length; i++) {
        toolbar[i].down('#newMenu').hide()
      }
    }
  } else {
    console.log('Marketo App > Skipped: Disable Toolbar Buttons for ABM > Account Lists > Named Accounts')
  }

  if (LIB.isPropOfWindowObj('Mkt3.controller.socialApp.SocialApp.prototype.loadToolbar')) {
    // Disable Marketing Activities > Social App > Toolbar buttons & Actions menu
    let prevSocialAppToolbar = Mkt3.controller.socialApp.SocialApp.prototype.loadToolbar
    Mkt3.controller.socialApp.SocialApp.prototype.loadToolbar = function (menu, attr) {
      console.log('Marketo App > Executing: Disable Toolbar Buttons & Actions Menu for Marketing Activities > Social Apps')
      prevSocialAppToolbar.apply(this, arguments)

      let disable = APP.evaluateMenu('socialAppToolbar', null, null, this),
        menuItems = [
          'socialAppToolbar contextMenu [action=approve]', //Approve
          'socialAppToolbar contextMenu [action=clone]', //Clone
          'socialAppToolbar contextMenu [action=delete]', //Delete
          'socialAppToolbar contextMenu [action=approveDraft]' //Approve Draft
        ],
        mItems = Ext4.ComponentQuery.query(menuItems.toString())

      if (mItems) {
        mItems.forEach(function (item) {
          if (item) {
            item.setDisabled(disable)
          }
        })
      }

      return menu
    }
  } else {
    console.log('Marketo App > Skipped: Disable Toolbar Buttons & Actions Menu for Marketing Activities > Social Apps')
  }

  if (LIB.isPropOfWindowObj('Mkt3.controller.mobilePushNotification.MobilePushNotification.prototype.loadToolbar')) {
    // Disable Marketing Activities > Push Notification > Toolbar buttons & Actions menu
    let prevMobilePushNotificationToolbar = Mkt3.controller.mobilePushNotification.MobilePushNotification.prototype.loadToolbar
    Mkt3.controller.mobilePushNotification.MobilePushNotification.prototype.loadToolbar = function (menu, attr) {
      console.log('Marketo App > Executing: Disable Toolbar Buttons & Actions Menu for Marketing Activities > Push Notifications')
      prevMobilePushNotificationToolbar.apply(this, arguments)

      let disable = APP.evaluateMenu('mobilePushNotification', null, null, this),
        menuItems = [
          'mobilePushNotification contextMenu [action=sendSample]', //Send Sample
          'mobilePushNotification contextMenu [action=unapprove]', //Unapprove
          'mobilePushNotification contextMenu [action=approve]', //Approve
          'mobilePushNotification contextMenu [action=clone]', //Clone
          'mobilePushNotification contextMenu [action=delete]', //Delete
          'mobilePushNotification contextMenu [action=sendDraftSample]', //Send Sample of Draft
          'mobilePushNotification contextMenu [action=approveDraft]' //Approve Draft
        ],
        mItems = Ext4.ComponentQuery.query(menuItems.toString())

      if (mItems) {
        mItems.forEach(function (item) {
          if (item) {
            item.setDisabled(disable)
          }
        })
      }

      return menu
    }
  } else {
    console.log('Marketo App > Skipped: Disable Toolbar Buttons & Actions Menu for Marketing Activities > Push Notifications')
  }

  if (LIB.isPropOfWindowObj('Mkt3.controller.inAppMessage.InAppMessage.prototype.loadToolbar')) {
    // Disable Marketing Activities > In-App Messages > Toolbar buttons & Actions menu
    let prevInAppMessageToolbar = Mkt3.controller.inAppMessage.InAppMessage.prototype.loadToolbar
    Mkt3.controller.inAppMessage.InAppMessage.prototype.loadToolbar = function () {
      console.log('Marketo App > Executing: Disable Toolbar Buttons & Actions Menu for Marketing Activities > In-App Messages')
      prevInAppMessageToolbar.apply(this, arguments)

      let toolbar = this.getToolbar(),
        inAppMessage = this.getInAppMessage(),
        actionsMenu = toolbar.down('.contextMenu'),
        toolbarComponents = toolbar.query('component') || [],
        i = 0,
        il = toolbarComponents.length,
        toolbarComponent,
        text

      // set record
      actionsMenu.record = inAppMessage

      // update text and icons
      for (; i < il; i++) {
        toolbarComponent = toolbarComponents[i]

        // update icons
        if (Ext4.isDefined(toolbarComponent.iconCls) && Ext4.isFunction(toolbarComponent.setIconCls)) {
          toolbarComponent.setIconCls(toolbarComponent.iconCls)
        }

        // update text
        if (
          (Ext4.isDefined(toolbarComponent.text) || Ext4.isFunction(toolbarComponent.getText)) &&
          Ext4.isFunction(toolbarComponent.setText)
        ) {
          text = Ext4.isFunction(toolbarComponent.getText) ? toolbarComponent.getText() : toolbarComponent.text
          toolbarComponent.setText(text)
        }
      }

      let disable = APP.evaluateMenu('inAppMessage', null, null, this),
        menuItems = [
          'inAppMessage contextMenu [action=sendSample]', //Send Sample
          'inAppMessage contextMenu [action=unapprove]', //Unapprove
          'inAppMessage contextMenu [action=approve]', //Approve
          'inAppMessage contextMenu [action=clone]', //Clone
          'inAppMessage contextMenu [action=delete]', //Delete
          'inAppMessage contextMenu [action=sendDraftSample]', //Send Sample of Draft
          'inAppMessage contextMenu [action=approveDraft]' //Approve Draft
        ],
        mItems = Ext4.ComponentQuery.query(menuItems.toString())

      if (mItems) {
        mItems.forEach(function (item) {
          if (item) {
            item.setDisabled(disable)
          }
        })
      }
    }
  } else {
    console.log('Marketo App > Skipped: Disable Toolbar Buttons & Actions Menu for Marketing Activities > In-App Messages')
  }

  if (LIB.isPropOfWindowObj('Mkt3.controller.smsMessage.SmsMessage.prototype.loadToolbar')) {
    // Disable Marketing menuItemsActivities > SMS Messages > Toolbar buttons & Actions menu
    let prevSmsMessageToolbar = Mkt3.controller.smsMessage.SmsMessage.prototype.loadToolbar
    Mkt3.controller.smsMessage.SmsMessage.prototype.loadToolbar = function () {
      console.log('Marketo App > Executing: Disable Toolbar Buttons & Actions Menu for Marketing Activities > SMS Messages')
      prevSmsMessageToolbar.apply(this, arguments)

      let toolbar = this.getToolbar(),
        smsMessage = this.getSmsMessage(),
        actionsMenu = toolbar.down('.contextMenu'),
        toolbarComponents = toolbar.query('component') || [],
        i = 0,
        il = toolbarComponents.length,
        toolbarComponent,
        text

      actionsMenu.record = smsMessage

      for (; i < il; i++) {
        toolbarComponent = toolbarComponents[i]

        if (Ext4.isDefined(toolbarComponent.iconCls) && Ext4.isFunction(toolbarComponent.setIconCls)) {
          toolbarComponent.setIconCls(toolbarComponent.iconCls)
        }

        if (
          (Ext4.isDefined(toolbarComponent.text) || Ext4.isFunction(toolbarComponent.getText)) &&
          Ext4.isFunction(toolbarComponent.setText)
        ) {
          text = Ext4.isFunction(toolbarComponent.getText) ? toolbarComponent.getText() : toolbarComponent.text
          toolbarComponent.setText(text)
        }
      }

      let disable = APP.evaluateMenu('smsMessage', null, null, this),
        menuItems = [
          'smsMessage contextMenu [action=unapprove]', //Unapprove
          'smsMessage contextMenu [action=approve]', //Approve
          'smsMessage contextMenu [action=clone]', //Clone
          'smsMessage contextMenu [action=delete]', //Delete
          'smsMessage contextMenu [action=approveDraft]' //Approve Draft
        ],
        mItems = Ext4.ComponentQuery.query(menuItems.toString())

      if (mItems) {
        mItems.forEach(function (item) {
          if (item) {
            item.setDisabled(disable)
          }
        })
      }
    }
  } else {
    console.log('Marketo App > Skipped: Disable Toolbar Buttons & Actions Menu for Marketing Activities > SMS Messages')
  }

  if (LIB.isPropOfWindowObj('Ext4.Component.prototype.showAt')) {
    // Disable Marketing Activities > Nurture Program > Stream & Content Actions menus
    Ext4.Component.prototype.showAt = function (x, y, animate) {
      console.log('Marketo App > Executing: Disable Content & Actions Menus for Marketing Activities > Nurture Program Stream')
      let me = this
      if (!me.rendered && (me.autoRender || me.floating)) {
        me.doAutoRender()
        me.hidden = true
      }
      if (me.floating) {
        me.setPosition(x, y, animate)
      } else {
        me.setPagePosition(x, y, animate)
      }
      me.show()

      if (typeof MktCanvas !== 'undefined' && MktCanvas && MktCanvas.getActiveTab()) {
        let ii,
          disable = APP.evaluateMenu('button', null, MktCanvas.getActiveTab(), null)
        for (ii = 0; ii < me.items.items.length; ii++) {
          switch (me.items.items[ii].action) {
            // Marketing Activities > Nurture Program > Stream Actions
            case 'clone':
            case 'delete':
            case 'archive':
            case 'unarchive':
            case 'emailApproveDraft':
            case 'mobilePushApprove':
            case 'hide':
            case 'unhide':
              me.items.items[ii].setDisabled(disable)
              break
          }
        }
      } else {
        let ii,
          disable = APP.evaluateMenu('button', null, null, null)
        for (ii = 0; ii < me.items.items.length; ii++) {
          switch (me.items.items[ii].action) {
            // Admin > Marketo Custom Activities/Objects & Mobile Apps > Activities/Objects & Mobile Apps Tree > Right-click Menu
            case 'publish':
            case 'delete':
            case 'send':
            case 'verify':
              me.items.items[ii].setDisabled(disable)
              break
          }
        }
      }
    }
  } else {
    console.log('Marketo App > Skipped: Disable Content & Actions Menus for Marketing Activities > Nurture Program Stream')
  }
}

/**************************************************************************************
 *  This function override the draft edit menu items in all areas.
 **************************************************************************************/

APP.overrideDraftEdits = function () {
  console.log('Marketo App > Overriding: Draft Edit Menu Items')
  if (LIB.isPropOfWindowObj('MktDsMenu')) {
    console.log('Marketo App > Executing: Override Draft Edit Menu Items')
    let origExtMessageBoxShow = Ext.MessageBox.show
    origExt4MessageBoxShow = Ext4.MessageBox.show
    origMktMessageShow = MktMessage.show
    ;(origPageEditHandler = MktDsMenu.getPageMenu().get('pageEdit').handler),
    (origPageDraftEditHandler = MktDsMenu.getPageMenu().get('pageDraftEdit').handler),
    (origEmailEditHandler = MktDsMenu.getEmailMenu().get('emailEdit').handler),
    (origEmailDraftEditHandler = MktDsMenu.getEmailMenu().get('emailDraftEdit').handler)

    MktDsMenu.getPageMenu()
      .get('pageDraftEdit')
      .setHandler(function (el) {
        if (attr && attr.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1) {
          console.log('Marketo App > Executing: Override Draft Edit Menu Items > Landing Page Draft Edit')
          let {triggeredFrom} = this.parentMenu,
            {xtra} = el.parentMenu
          Mkt.app.DesignStudio.Pages.discardDraft({
            triggeredFrom: triggeredFrom,
            xtra: xtra
          })
          el.parentMenu.hide(true)
          Ext.MessageBox.hide()
          Mkt.app.DesignStudio.Pages.editPageDraft({
            triggeredFrom: triggeredFrom,
            xtra: xtra
          })
        } else {
          origPageDraftEditHandler.apply(this, arguments)
        }
      })

    // Email Edit
    MktDsMenu.getEmailMenu()
      .get('emailEdit')
      .setHandler(function (el) {
        if (attr && attr.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1) {
          console.log('Marketo App > Executing: Override Draft Edit Menu Items > Email Edit')
          let {triggeredFrom} = this.parentMenu,
            {xtra} = el.parentMenu,
            newEl = this.getEl()
          Ext.MessageBox.show = Ext4.MessageBox.show = MktMessage.show = function () {}
          Mkt.app.DesignStudio.Emails.discardDraft({
            triggeredFrom: triggeredFrom,
            xtra: xtra
          })
          el.parentMenu.hide(true)
          Mkt.app.DesignStudio.Emails.editDraft({
            triggeredFrom: triggeredFrom,
            xtra: xtra,
            el: newEl
          })
          window.setTimeout(function () {
            console.log('Marketo App > Restoring: System Messages')
            Ext.MessageBox.show = origExtMessageBoxShow
            Ext4.MessageBox.show = origExt4MessageBoxShow
            MktMessage.show = origMktMessageShow
          }, 5000)
        } else {
          origEmailEditHandler.apply(this, arguments)
        }
      })
    // Email Draft Edit
    MktDsMenu.getEmailMenu()
      .get('emailDraftEdit')
      .setHandler(function (el) {
        if (attr && attr.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1) {
          console.log('Marketo App > Executing: Override Draft Edit Menu Items > Email Draft Edit')
          let {triggeredFrom} = this.parentMenu,
            {xtra} = el.parentMenu,
            newEl = this.getEl()
          Mkt.app.DesignStudio.Emails.discardDraft({
            triggeredFrom: triggeredFrom,
            xtra: xtra
          })
          el.parentMenu.hide(true)
          Mkt.app.DesignStudio.Emails.editDraft({
            triggeredFrom: triggeredFrom,
            xtra: xtra,
            el: newEl
          })
        } else {
          origEmailDraftEditHandler.apply(this, arguments)
        }
      })
  } else {
    console.log('Marketo App > Skipping: Override Draft Edit Menu Items')
  }
}

/**************************************************************************************
 *  This function disables or hides Toolbar items for all asset types in all areas.
 **************************************************************************************/

APP.hideToolbarItems = function () {
  console.log('Marketo App > Hiding: Toolbar Items')
  if (LIB.isPropOfWindowObj('Ext.layout.ContainerLayout.prototype.renderItem')) {
    // Disable ALL areas > ALL assets > ALL Toolbar items except for Smart Campaigns, Smart Lists, Lists, Social Apps, and Push Notifications
    Ext.layout.ContainerLayout.prototype.renderItem = function (c, position, target) {
      if (c) {
        if (!c.rendered) {
          c.render(target, position)
          this.configureItem(c, position)
        } else if (!this.isValidParent(c, target)) {
          if (Ext.isNumber(position)) {
            position = target.dom.childNodes[position]
          }

          target.dom.insertBefore(c.getPositionEl().dom, position || null)
          c.container = target
          this.configureItem(c, position)
        }
      }

      if (typeof c !== 'undefined' && c && c.topToolbar && c.topToolbar.items) {
        console.log('Marketo App > Executing: Disable Toolbar items for ALL in ALL')
        let origExtMessageBoxShow = Ext.MessageBox.show,
          origExt4MessageBoxShow = Ext4.MessageBox.show,
          origMktMessageShow = MktMessage.show,
          item,
          canvas = MktCanvas.getActiveTab(),
          disable = APP.evaluateMenu('button', null, canvas, null),
          itemsToHide = [
            {
              id: 'deleteItem', //Delete
              action: 'setVisible'
            },
            {
              id: 'deleteSubscription_atxCanvasSubscriptions', //Delete Subscription
              action: 'setVisible'
            },
            // Global > Form
            {
              id: 'formEdit_landingFODetail', //Edit Form
              action: 'handler'
            },
            // Global > Landing Page
            {
              id: 'pageEdit_landingLPDetail', //Edit Draft
              action: 'handler'
            },
            // Global > Email
            {
              id: 'emailEdit_landingEMDetail', //Edit Draft
              action: 'handler'
            },
            {
              id: 'gotoDeliverability_landingEMDetail', //Deliverability Tools
              action: 'setVisible'
            },
            // Marketing Activities > Programs & Folders > My Tokens
            {
              id: 'deleteCustomToken', //Delete Token
              action: 'setVisible'
            },
            // Marketing Activities > Programs > Members
            {
              id: 'importMembers', //Import Members
              action: 'setDisabled'
            },
            {
              id: 'importTemplate_landingCanvasTM', //Import Template
              action: 'setDisabled'
            },
            {
              id: 'importTemplate_landingTMDetail', //Import Template
              action: 'setDisabled'
            },
            {
              id: 'gotoDeliverability_landingCanvasEM', //Deliverability Tools
              action: 'setVisible'
            },
            // Design Studio > Images and Files
            {
              id: 'imageUpload_landingCanvasIM', //Upload Image or File
              action: 'setDisabled'
            },
            {
              id: 'imageReplace_landingCanvasIM', //Replace Image or File
              action: 'setVisible'
            },
            {
              id: 'imageUpload_landingIMDetail', //Upload Image or File
              action: 'setDisabled'
            },
            {
              id: 'imageReplace_landingIMDetail', //Replace Image or File
              action: 'setVisible'
            },
            // Analytics > Model
            {
              id: 'editDraft_rcmCanvasOverview', //Edit Draft
              action: 'setVisible'
            },
            {
              id: 'editLicenses', //Issue License
              action: 'setVisible'
            },
            {
              id: 'deleteUser', //Delete User
              action: 'setVisible'
            },
            {
              id: 'resetPassword', //Reset Password
              action: 'setVisible'
            },
            {
              id: 'deleteRole', //Delete Role
              action: 'setVisible'
            },
            {
              id: 'deleteZone', //Delete Workspace
              action: 'setVisible'
            },
            {
              id: 'deletePartition', //Delete Lead Partition
              action: 'setVisible'
            },
            {
              id: 'deleteDomain', //Delete Domain
              action: 'setVisible'
            },
            {
              id: 'dkimDetails', //DKIM Details
              action: 'setDisabled'
            },
            {
              text: 'New Custom Field', //New Custom Field
              action: 'setDisabled'
            },
            // Admin > Salesforce Object Sync
            {
              id: 'refreshCadSfdcObjectSync', //Refresh Schema
              action: 'setDisabled'
            },
            // Admin > Salesforce
            {
              id: 'enableSync', //Enable/Disable Sync
              action: 'setVisible'
            },
            {
              id: 'revokeLicenseCadLisAdmin', //Revoke License
              action: 'setVisible'
            },
            {
              id: 'resendLicenseCadLisAdmin', //Resend Invitation
              action: 'setVisible'
            },
            {
              id: 'configAddinCadLisAdmin', //Config Add-in
              action: 'setVisible'
            },
            // Admin > Landing Pages > Rules
            {
              text: 'Rules Actions', //Rules Actions
              action: 'setVisible'
            },
            {
              id: 'deleteRule', //Delete Rule
              action: 'setVisible'
            },
            {
              id: 'launchpointActions', //Service Actions
              action: 'setVisible'
            },
            // Admin > Revenue Cycle Analytics > Custom Field Sync
            {
              id: 'cadChangeButton', //Edit Sync Option
              action: 'setVisible'
            }
          ]

        itemsToHide.forEach(function (itemToHide) {
          if (itemToHide.id) {
            item = c.topToolbar.items.get(itemToHide.id)
          } else if (itemToHide.text) {
            item = c.topToolbar.find('text', itemToHide.text)[0]
          }
          if (item) {
            if (itemToHide.id == 'gotoDeliverability_landingEMDetail') {
              item.setVisible(false)
            } else if (itemToHide.action == 'setVisible') {
              item.setVisible(!disable)
            } else if (itemToHide.action == 'setDisabled') {
              item.setDisabled(disable)
            }

            switch (itemToHide.id) {
              case 'pageEdit_landingLPDetail':
                var origHandler = item.handler
                item.setHandler(function () {
                  if (attr && attr.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1) {
                    console.log('Marketo App > Executing: Override Edit Draft Toolbar Button > Landing Page')
                    let discardMsg = Ext.MessageBox.show({
                      title: 'MarketoLive',
                      msg: 'Discarding Draft',
                      progress: false,
                      wait: false,
                      width: 270,
                      closable: true
                    })
                    Mkt.app.DesignStudio.Pages.discardDraft({
                      triggeredFrom: 'button',
                      xtra: attr
                    })
                    discardMsg.hide()
                    Mkt.app.DesignStudio.Pages.editPage({
                      triggeredFrom: 'button',
                      el: this.getEl()
                    })
                  } else {
                    origHandler.apply(this, arguments)
                  }
                })
                break
              case 'emailEdit_landingEMDetail':
                var origHandler = item.handler
                item.setHandler(function (button, e) {
                  if (attr && attr.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1) {
                    console.log('Marketo App > Executing: Override Edit Draft Toolbar Button > Email')
                    Ext.MessageBox.show = Ext4.MessageBox.show = MktMessage.show = function () {}
                    Mkt.app.DesignStudio.Emails.discardDraft({
                      triggeredFrom: 'button',
                      xtra: attr,
                      el: this.getEl()
                    })
                    Mkt.app.DesignStudio.Emails.editDraft({
                      triggeredFrom: 'button',
                      panelId: attr.panelId
                    })
                    window.setTimeout(function () {
                      console.log('Marketo App > Restoring: System Messages')
                      Ext.MessageBox.show = origExtMessageBoxShow
                      Ext4.MessageBox.show = origExt4MessageBoxShow
                      MktMessage.show = origMktMessageShow
                    }, 5000)
                  } else {
                    origHandler.apply(this, arguments)
                  }
                })
                break
            }
          }
        })
      }
    }
  }
}

/**************************************************************************************
 *  This function disables or hides toggled Toolbar items such as in Admin
 *  @param {Array} - An array of objects which contain the following attributes:
 *                   id - ID of the item to disable
 *                    OR
 *                   text - name of the item to disable
 *                   action - action to take on the item (setVisisble, setDisabled)
 **************************************************************************************/

APP.hideOtherToolbarItems = function (itemsToHide) {
  let isTopToolbarActive = window.setInterval(function () {
    console.log('Marketo App > Hiding: Other Toolbar Items')
    if (LIB.isPropOfWindowObj('MktCanvas.getActiveTab') && MktCanvas.getActiveTab() && MktCanvas.getActiveTab().getTopToolbar()) {
      console.log('Marketo App > Executing: Hiding Other Toolbar Items')
      window.clearInterval(isTopToolbarActive)
      let topToolbar = MktCanvas.getActiveTab().getTopToolbar()
      itemsToHide.forEach(function (itemToHide) {
        if (itemToHide.id) {
          item = topToolbar.items.get(itemToHide.id)
        } else if (itemToHide.text) {
          item = topToolbar.find('text', itemToHide.text)[0]
        }
        if (item) {
          if (itemToHide.action == 'setVisible') {
            item.setVisible(false)
          } else if (itemToHide.action == 'setDisabled') {
            item.setDisabled(true)
          }
        }
      })
    }
  }, 0)
}

/**************************************************************************************
 *  This function disables saving for Revenue Cycle Models and issues a tracking
 *  request to Heap Analytics.
 *  @param {String} assetType - Asset type (report, model)
 *  @param {String} mode - Mode view (edit, preview)
 **************************************************************************************/

APP.disableAnalyticsSaving = function (assetType, mode) {
  console.log('Marketo App > Disabling: Analytics Saving for ' + assetType)
  let isAnalyticsAsset

  isAnalyticsAsset = window.setInterval(function () {
    if (
      LIB.isPropOfWindowObj('MktCanvas.getActiveTab') &&
      MktCanvas.getActiveTab() &&
      MktCanvas.getActiveTab().config &&
      MktCanvas.getActiveTab().config.accessZoneId
    ) {
      window.clearInterval(isAnalyticsAsset)

      let assetNode = MktCanvas.getActiveTab().config,
        heapEvent = {
          name: '',
          assetName: '',
          assetType: assetNode.compType,
          assetId: assetNode.expNodeId,
          workspaceId: assetNode.accessZoneId,
          workspaceName: ''
        },
        titleReplaceRegex = new RegExp('\\([^\\)]+\\)$')

      switch (mode) {
        case 'edit':
          APP.disableSaving()
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          heapEvent.assetArea = 'Editor'
          break
        case 'preview':
          APP.disableFormSaveButtons()
          heapEvent.assetArea = 'Previewer'
          break
        default:
          APP.disableSaving()
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableHarmfulSaveButtons()
          heapEvent.assetArea = 'Full Screen'
      }

      switch (assetType) {
        case 'report':
          heapEvent.assetName = assetNode.title
          break
        case 'model':
          heapEvent.assetName = assetNode.satelliteTitle
          if (heapEvent.assetName.search(titleReplaceRegex) != -1) {
            heapEvent.assetName = heapEvent.assetName.replace(titleReplaceRegex, '').trimRight()
          }

          if (heapEvent.assetName.search(/"/) != -1) {
            heapEvent.assetName = heapEvent.assetName.replace(/"/g, '')
          }
          break
      }

      if (heapEvent.assetType.charAt(0).search(/[a-z]/) != -1) {
        let firstChar = heapEvent.assetType.charAt(0)

        heapEvent.assetType = firstChar.toUpperCase() + heapEvent.assetType.slice(1)
      }

      heapEvent.workspaceName = APP.getWorkspaceName(assetNode.accessZoneId)

      if (assetNode.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1) {
        heapEvent.name = heapEvent.workspaceName
      } else if (assetNode.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1) {
        heapEvent.name = heapEvent.workspaceName
        heapEvent.userFolder = userName
      } else {
        heapEvent.name = mktoOtherWorkspaceName
      }

      APP.heapTrack('track', heapEvent)
    }
  }, 0)
}

/**************************************************************************************
 *  This function disables saving for all asset types within the Designers edit mode
 *  and disables the harmful toolbar menu items and buttons in both edit and preview
 *  modes. It also issues a tracking request to Heap Analytics.
 *  @param {String} assetType - Asset type (landingPage, email, form, pushNotification,
 *                              inAppMessage, smsMessage, socialApp, abTest)
 *  @param {String} mode - Mode view (edit, preview)
 **************************************************************************************/

APP.disableDesignerSaving = function (assetType, mode) {
  console.log('Marketo App > Disabling: Designer (Edit/Preview) Saving & Toolbar Menus for ' + assetType)
  let isAppController = window.setInterval(function () {
    if (LIB.isPropOfWindowObj('Mkt3.app.controllers.get')) {
      window.clearInterval(isAppController)
      let disableDesignerAsset, assetNode, menuItems
      disableDesignerAsset = function (assetNode, menuItems, disableFunc) {
        console.log('Marketo App > Executing: Disabling Designer (Edit/Preview)')
        let heapEvent = {
          name: '',
          assetName: '',
          assetType: assetNode.compType,
          assetId: assetNode.id,
          workspaceId: assetNode.accessZoneId,
          workspaceName: ''
        }

        switch (mode) {
          case 'edit':
            heapEvent.assetArea = 'Editor'
            break
          case 'preview':
            heapEvent.assetArea = 'Previewer'
            break
          default:
            heapEvent.assetArea = 'Designer'
            break
        }

        heapEvent.workspaceName = APP.getWorkspaceName(assetNode.accessZoneId)

        if (assetNode.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1) {
          heapEvent.name = heapEvent.workspaceName
        } else if (assetNode.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1) {
          heapEvent.name = heapEvent.workspaceName
          heapEvent.userFolder = userName
        } else {
          heapEvent.name = mktoOtherWorkspaceName
        }

        if (assetNode.text.search('.') != -1) {
          heapEvent.assetName = assetNode.text.split('.')[1]
        } else {
          heapEvent.assetName = assetNode.text
        }

        APP.heapTrack('track', heapEvent)

        if (assetNode.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1 || toggleState == 'false') {
          if (disableFunc) {
            disableFunc()
          }

          if (LIB.isPropOfWindowObj('Ext4.ComponentQuery.query')) {
            let mItems = Ext4.ComponentQuery.query(menuItems.toString())

            if (mItems) {
              console.log('Marketo App > Disabling Designer Toolbar Menus')
              mItems.forEach(function (item) {
                if (item) {
                  if (item.itemId == 'createButton') {
                    item.setVisible(false)
                  } else {
                    item.setDisabled(true)
                  }
                }
              })
            }
          }
        }
      }
      let intervalRef
      switch (assetType) {
        case 'landingPage':
          switch (mode) {
            case 'edit':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage').getLandingPage() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage').getLandingPage().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Landing Page Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  let asset = Mkt3.app.controllers.get('Mkt3.controller.editor.LandingPage').getLandingPage()
                  assetNode = asset.getNodeJson()
                  menuItems = [
                    // Actions Menu
                    'lpEditor menu [action=approveAndClose]', // Approve and Close
                    'lpEditor menu [action=disableMobileVersion]', // Turn Off Mobile Version
                    'lpEditor menu [action=uploadImage]', // Upload Image or File
                    'lpEditor menu [action=grabImages]' // Grab Images from Web
                  ]
                  disableDesignerAsset(assetNode, menuItems, APP.disablePropertyPanelSaving)
                  LIB.overlayLandingPage('edit')
                  LIB.saveLandingPageEdits('edit', asset)
                }
              }, 0)
              break
            case 'preview':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPage') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPage') &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPage').getLandingPage() &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPage').getLandingPage().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Landing Page Previewer: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPage').getLandingPage().getNodeJson()
                  menuItems = [
                    // Actions Menu
                    'landingPagePreviewer menu [action=approveAndClose]' // Approve and Close
                  ]
                  disableDesignerAsset(assetNode, menuItems)
                  LIB.overlayLandingPage('preview')
                }
              }, 0)
              break
            case 'templateEdit':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.landingPageTemplate.LandingPageTemplate') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.landingPageTemplate.LandingPageTemplate') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.landingPageTemplate.LandingPageTemplate').getTemplate() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.landingPageTemplate.LandingPageTemplate').getTemplate().get &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.landingPageTemplate.LandingPageTemplate').getTemplate().getNodeJson
                ) {
                  console.log('Marketo App > Disabling: Landing Page Template Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  let asset = Mkt3.app.controllers.get('Mkt3.controller.editor.landingPageTemplate.LandingPageTemplate').getTemplate()
                  if (asset.get('zoneId')) {
                    assetNode = asset.getNodeJson()
                  } else {
                    assetNode = {
                      text: asset.get('name'),
                      compType: 'Landing Page Template',
                      id: 'LT' + asset.getId(),
                      accessZoneId: -1
                    }
                  }
                  menuItems = [
                    // Toolbar Menu
                    'toolbar [action=upgrade]', // Make Mobile Compatible
                    // Actions Menu
                    'menu [action=showMunchkinToggler]', // Disable Munchkin Tracking
                    'menu [action=approve]' // Approve and Close
                  ]
                  disableDesignerAsset(assetNode, menuItems, APP.disableSaving)
                }
              }, 0)
              break
            case 'templatePreview':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPageTemplate') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPageTemplate') &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPageTemplate').getTemplate() &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPageTemplate').getTemplate().get &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPageTemplate').getTemplate().getNodeJson
                ) {
                  console.log('Marketo App > Disabling: Landing Page Template Previewer: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  let asset = Mkt3.app.controllers.get('Mkt3.controller.previewer.LandingPageTemplate').getTemplate()
                  if (asset.get('zoneId')) {
                    assetNode = asset.getNodeJson()
                  } else {
                    assetNode = {
                      text: asset.get('name'),
                      compType: 'Landing Page Template',
                      id: 'LT' + asset.getId(),
                      accessZoneId: -1
                    }
                  }
                  menuItems = []
                  disableDesignerAsset(assetNode, menuItems)
                }
              }, 0)
              break
          }
          break
        case 'email':
          switch (mode) {
            case 'edit':
              intervalRef = window.setInterval(function () {
                try {
                  let asset = LIB.getMkt3CtlrAsset('Mkt3.controller.editor.email2.EmailEditor', 'getEmail'),
                    assetNode = asset.getNodeJson()
                  console.log('Marketo App > Disabling: Email Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  menuItems = [
                    // Actions Menu
                    'emailEditor2 menu [action=approveEmail]', // Approve and Close
                    'emailEditor2 menu [action=sendTestEmail]', // Send Sample
                    'emailEditor2 menu [action=uploadImage]', // Upload Image or File
                    'emailEditor2 menu [action=grabImages]', // Grab Images from Web
                    'emailEditor2 menu [action=saveAsTemplate]' // Save as Template
                  ]
                  disableDesignerAsset(assetNode, menuItems)
                  LIB.overlayEmail('edit')
                  LIB.saveEmailEdits('edit', asset)
                // eslint-disable-next-line no-empty
                } catch (e) {}
                // if (
                //   typeof Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor') !== 'undefined' &&
                //   Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor') &&
                //   Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail() &&
                //   Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail().getNodeJson()
                // ) {
                //   console.log('Marketo App > Disabling: Email Editor: Saving & Toolbar Menus')
                //   window.clearInterval(intervalRef)
                //   let asset = Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail()
                //   assetNode = asset.getNodeJson()
                //   menuItems = [
                //     // Actions Menu
                //     'emailEditor2 menu [action=approveEmail]', // Approve and Close
                //     'emailEditor2 menu [action=sendTestEmail]', // Send Sample
                //     'emailEditor2 menu [action=uploadImage]', // Upload Image or File
                //     'emailEditor2 menu [action=grabImages]', // Grab Images from Web
                //     'emailEditor2 menu [action=saveAsTemplate]' // Save as Template
                //   ]
                //   disableDesignerAsset(assetNode, menuItems)
                //   LIB.overlayEmail('edit')
                //   LIB.saveEmailEdits('edit', asset)
                // }
              }, 0)
              break
            case 'preview':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.email2.Preview') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.Preview') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.Preview').getEmail() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.Preview').getEmail().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Email Previewer: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.editor.email2.Preview').getEmail().getNodeJson()
                  menuItems = [
                    // Toolbar Menu
                    'email2EditorPreviewToolbar [action=sendSampleEmail]', // Send Sample
                    // Actions Menu
                    'emailPreview menu [action=approveEmail]', // Approve and Close
                    'emailPreview menu [action=sendSampleEmail]' // Send Sample
                  ]
                  disableDesignerAsset(assetNode, menuItems)
                  LIB.overlayEmail('preview')
                }
              }, 0)
              break
            case 'templateEdit':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailTemplate') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailTemplate') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailTemplate').getTemplate() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailTemplate').getTemplate().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Email Template Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  let asset = Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailTemplate').getTemplate()
                  assetNode = asset.getNodeJson()
                  menuItems = [
                    // Actions Menu
                    'menu [action=approveTemplate]', // Approve and Close
                    'menu [action=sendSample]', // Send Sample Email
                    'menu [action=inlineCss]' // Inline CSS
                  ]
                  disableDesignerAsset(assetNode, menuItems, APP.disableSaving)
                }
              }, 0)
              break
            case 'templatePicker':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailTemplatePicker') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailTemplatePicker') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailTemplatePicker').getEmailTemplatePicker() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailTemplatePicker').getEmailTemplatePicker().accessZoneId
                ) {
                  console.log('Marketo App > Disabling: Email Template Picker: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  let asset = Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailTemplatePicker').getEmailTemplatePicker()
                  assetNode = {
                    text: 'Email Template Picker',
                    compType: 'Email Template Picker',
                    id: 'EM',
                    accessZoneId: parseInt(asset.accessZoneId)
                  }
                  menuItems = [
                    // Toolbar Menu
                    'toolbar [itemId=createButton]' // Create
                  ]
                  disableDesignerAsset(assetNode, menuItems)
                }
              }, 0)
              break
          }
          break
        case 'form':
          switch (mode) {
            case 'edit':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.Form') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.Form') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.Form').getForm() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.Form').getForm().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Form Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.editor.Form').getForm().getNodeJson()
                  menuItems = [
                    // Navigation Menu
                    'formEditor toolbar [action=approveAndClose]', // Approve & Close
                    'formEditor toolbar [action=finish]' // Finish
                  ]
                  disableDesignerAsset(assetNode, menuItems, APP.disableSaving)
                }
              }, 0)
              break
            case 'preview':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.previewer.Form') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.Form') &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.Form').getForm() &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.Form').getForm().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Form Previewer: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.previewer.Form').getForm().getNodeJson()
                  menuItems = []
                  disableDesignerAsset(assetNode, menuItems)
                }
              }, 0)
              break
          }
          break
        case 'pushNotification':
          switch (mode) {
            case 'edit':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.mobilePushNotification.MobilePushNotification') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.mobilePushNotification.MobilePushNotification') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.mobilePushNotification.MobilePushNotification').getMobilePushNotification() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.mobilePushNotification.MobilePushNotification').getMobilePushNotification().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Push Notification Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)

                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.editor.mobilePushNotification.MobilePushNotification').getMobilePushNotification().getNodeJson()
                  menuItems = [
                    // Toolbar Menu
                    'mobilePushNotificationEditor toolbar [action=sendDraftSample]', // Send Sample
                    // Navigation Menu
                    'mobilePushNotificationEditor toolbar [action=finish]', // Finish
                    'mobilePushNotificationEditor toolbar [action=approveAndClose]' // Approve & Close
                  ]

                  disableDesignerAsset(assetNode, menuItems, APP.disableSaving)
                }
              }, 0)
              break
            case 'preview':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.previewer.MobilePushNotification') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.MobilePushNotification') &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.MobilePushNotification').getMobilePushNotification() &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.MobilePushNotification').getMobilePushNotification().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Push Notification Previewer: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.previewer.MobilePushNotification').getMobilePushNotification().getNodeJson()
                  menuItems = [
                    // Toolbar Menu
                    'mobilePushNotificationPreviewer toolbar [action=sendDraftSample]' // Send Sample
                  ]
                  disableDesignerAsset(assetNode, menuItems)
                }
              }, 0)
              break
          }
          break
        case 'inAppMessage':
          switch (mode) {
            case 'edit':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.inAppMessage.InAppMessage') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.inAppMessage.InAppMessage') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.inAppMessage.InAppMessage').getInAppMessage() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.inAppMessage.InAppMessage').getInAppMessage().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: In-App Message Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.editor.inAppMessage.InAppMessage').getInAppMessage().getNodeJson()
                  menuItems = [
                    // Toolbar Menu
                    'inAppMessageEditor toolbar [action=sendSample]', // Send Sample
                    // Actions Menu
                    'inAppMessageEditor menu [action=sendSample]', // Send Sample
                    'inAppMessageEditor menu [action=approveAndClose]' // Approve & Close
                  ]
                  disableDesignerAsset(assetNode, menuItems, APP.disableSaving)
                }
              }, 0)
              break
            case 'preview':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.previewer.InAppMessage') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.InAppMessage') &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.InAppMessage').getInAppMessage() &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.InAppMessage').getInAppMessage().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: In-App Message Previewer: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.previewer.InAppMessage').getInAppMessage().getNodeJson()
                  menuItems = [
                    // Toolbar Menu
                    'inAppMessagePreviewer toolbar [action=approveAndClose]' // Approve & Close
                  ]
                  disableDesignerAsset(assetNode, menuItems)
                }
              }, 0)
              break
            default:
              break
          }
          break
        case 'smsMessage':
          switch (mode) {
            case 'edit':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.SmsMessage') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.SmsMessage') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.SmsMessage').getSmsMessage() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.SmsMessage').getSmsMessage().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: SMS Message Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.editor.SmsMessage').getSmsMessage().getNodeJson()
                  menuItems = [
                    // Actions Menu
                    'smsMessageEditor menu [action=approveAndClose]' // Approve and Close
                  ]
                  disableDesignerAsset(assetNode, menuItems, APP.disableSaving)
                }
              }, 0)
              break
            case 'preview':
              break
          }
          break
        case 'socialApp':
          switch (mode) {
            case 'edit':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.SocialApp') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.SocialApp') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.SocialApp').getSocialApp() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.SocialApp').getSocialApp().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Social App Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)

                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.editor.SocialApp').getSocialApp().getNodeJson()
                  menuItems = [
                    'socialAppEditor toolbar [action=approveAndClose]', // Approve and Close
                    'socialAppEditor toolbar [action=finish]' // Finish
                  ]

                  disableDesignerAsset(assetNode, menuItems, APP.disableSaving)
                }
              }, 0)
              break
            case 'preview':
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.previewer.SocialApp') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.SocialApp') &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.SocialApp').getSocialApp() &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.SocialApp').getSocialApp().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Social App Previewer: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.previewer.SocialApp').getSocialApp().getNodeJson()
                  menuItems = []
                  disableDesignerAsset(assetNode, menuItems)
                }
              }, 0)
              break
          }
          break
        case 'abTest':
          switch (mode) {
            case 'edit':
              console.log('Marketo App > Executing: A/B Test Editor: Saving & Toolbar Menus')
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.testGroup.TestGroup') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.testGroup.TestGroup') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.testGroup.TestGroup').getTestGroup() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.testGroup.TestGroup').getTestGroup().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: A/B Test Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.editor.testGroup.TestGroup').getTestGroup().getNodeJson()
                  menuItems = [
                    'testGroupEditor toolbar [action=finish]' // Finish
                  ]
                  disableDesignerAsset(assetNode, menuItems, APP.disableSaving)
                }
              }, 0)
              break
            case 'preview':
              break
          }
          break
        case 'snippet':
          switch (mode) {
            case 'edit':
              console.log('Marketo App > Executing: Snippet Editor: Saving & Toolbar Menus')
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.Snippet') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.Snippet') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.Snippet').getSnippet() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.Snippet').getSnippet().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Snippet Editor: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.editor.Snippet').getSnippet().getNodeJson()
                  menuItems = []

                  disableDesignerAsset(assetNode, menuItems, APP.disableSaving)
                }
              }, 0)
              break
            case 'preview':
              console.log('Marketo App > Executing: Snippet Previewer: Saving & Toolbar Menus')
              intervalRef = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.previewer.Snippet') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.Snippet') &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.Snippet').getSnippet() &&
                  Mkt3.app.controllers.get('Mkt3.controller.previewer.Snippet').getSnippet().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Snippet Previewer: Saving & Toolbar Menus')
                  window.clearInterval(intervalRef)
                  assetNode = Mkt3.app.controllers.get('Mkt3.controller.previewer.Snippet').getSnippet().getNodeJson()
                  menuItems = []
                  disableDesignerAsset(assetNode, menuItems)
                }
              }, 0)
              break
          }
          break
      }
    }
  }, 0)
}

//  This function disables the Save, Create, Add ... buttons in Form windows.
//  It can be used to disable any generic Form save window.
APP.disableFormSaveButtons = function () {
  console.log('Marketo App > Disabling: Form Window Save Buttons')
  if (LIB.isPropOfWindowObj('Ext4.Component.prototype.show')) {
    Ext4.Component.prototype.show = function (animateTarget, cb, scope) {
      let me = this,
        menuItems,
        mItems,
        toDisable

      if (
        this.getXType() == 'createNamedAccountForm' || //ABM > Named Accounts > New Named Account
        this.getXType() == 'addToAccountListForm' || //ABM > Named Accounts > Add To Account List
        this.getXType() == 'assignTeamMemberForm' || //ABM > Named Accounts > Assign Account Member
        this.getXType() == 'createAccountListForm' || //ABM > Account Lists > Create New/Rename Account List
        this.getXType() == 'adBridgeForm' || //Global > List & Smart List > Actions > Send via Ad Bridge
        this.getXType() == 'smartlistReportSubscriptionForm' || //Global > List & Smart List > Actions > New Smart List Subscription
        this.getXType() == 'analyticsReportSubscriptionForm' || //Global > Report > New Actions & Subscriptions > New Report Subscription
        this.getXType() == 'emailBlastCommunicationLimitForm' || //Marketing Activities > Program > Setup > Edit Communication Limit Settings
        this.getXType() == 'calendarEntryRescheduleForm' || //Marketing Activities > Event > Actions > Reschedule Entries
        this.getXType() == 'programOperationalModeForm' || //Marketing Activities > Program > Setup > Edit Analytics Behavior Settings
        this.getXType() == 'trackCadenceForm' || //Marketing Activities > Nurture Program > Streams > Set Stream Cadence
        this.getXType() == 'fileUploadForm' || //Design Studio > Images & Files > Grab Images from Web
        this.getXType() == 'leadComponentForm' || //Database > ALL > New > New Person
        this.getXType() == 'analyticsReportSubscriptionForm' || //Analytics > Analyzer & Report > New Report Subscription
        this.getXType() == 'lpMetaDataForm' || //Designer > Landing Page Editor > Edit Page Meta Tags
        this.getXType() == 'lpFormSettings' || //Designer > Landing Page Editor > Edit Form Settings
        this.getXType() == 'emailSettingsForm' || //Designer > Email Editor > Edit Settings
        this.getXType() == 'adminUserInviteWizard' || //Admin > User & Roles > Users > Invite New User
        this.getXType() == 'adminEditLicensesForm' || //Admin > User & Roles > Users > Issue License
        this.getXType() == 'adminSalesUserInviteWizard' || //Admin > User & Roles > Sales Users > Invite New Sales User
        this.getXType() == 'adminEditLicensesForm' || //Admin > User & Roles > Sales Users > Manage License > Account Insight
        this.getXType() == 'adminSubscriptionInformationForm' || //Admin > My Account > Subcription Information
        this.getXType() == 'adminAccountSettingsForm' || //Admin > My Account > Account Settings
        //|| this.getXType() == "localePicker" //Admin > My Account/Location > Location Settings
        this.getXType() == 'deleteZoneForm' || //Admin > Workspaces & Partitions > Workspaces > Delete Workspace
        this.getXType() == 'adminTinyMceSettingForm' || //Admin > *Email > Email > Edit Text Editor Settings
        this.getXType() == 'emailEditorSettingsForm' || //Admin > Email > Email > Edit Email Editor Settings
        this.getXType() == 'emailAddMultipleDomainForm' || //Admin > Email > Email > Add/Edit Branding Domains
        this.getXType() == 'adminAddDomainForm' || //Admin > Email > SPF/DKIM > Add Domain
        this.getXType() == 'adminScoreSettingsForm' || //Admin > ABM > Account Score Settings
        this.getXType() == 'adminCrmFieldSettingsForm' || //Admin > ABM > CRM Mapping
        this.getXType() == 'adminAccountTeamForm' || //Admin > ABM > Account Team Settings
        this.getXType() == 'adminAccountInsightSettingsForm' || //Admin > ABM > ABM Sales > Account Insight Settings
        this.getXType() == 'adminAbmReportSettingsForm' || //Admin > ABM > Weekly Report
        this.getXType() == 'adminFieldHtmlEncodeForm' || //Admin > Field Management > Field Management > HTML Encode Settings
        this.getXType() == 'mktocustomactivityActivityTypeForm' || //Admin > Marketo Custom Activities > Marketo Custom Activities > New Custom Activity
        this.getXType() == 'mktocustomactivityActivityTypeEditForm' || //Admin > Marketo Custom Activities > Marketo Custom Activities > Edit Activity
        this.getXType() == 'mktocustomactivityActivityTypeFormStepThree' || //Admin > Marketo Custom Activities > Fields > New/Edit Field
        this.getXType() == 'mktocustomobjectObjectForm' || //Admin > Marketo Custom Objects > Marketo Custom Objects > New/Edit Custom Object
        this.getXType() == 'mktocustomobjectFieldForm' || //Admin > Marketo Custom Objects > Fields > New/Edit Field
        this.getXType() == 'crmEditCredentialsForm' || //Admin > Microsoft Dynamics > Credentials > Edit
        this.getXType() == 'adminSpecifyPluginContactForm' || //Admin > Sales Insight > Email Add-in > Specify Plugin Contact
        this.getXType() == 'wildcardRedirectForm' || //Admin > Landing Pages > New Wildcard Redirect
        this.getXType() == 'mktowsEditIpRestrictionForm' || //Admin > Web Services > IP Restrictions
        this.getXType() == 'launchpointServiceIntegrationSettingsForm' || //Admin > LaunchPoint > Installed Services > Edit Service
        this.getXType() == 'vespaAppForm' || //Admin > Mobile Apps & Devices > Mobile Apps > New/Edit Mobile App
        this.getXType() == 'vespaSendForm' || //Admin > Mobile Apps & Devices > Mobile Apps > Send To Developer
        this.getXType() == 'vespaConfigurePushAccessForm' || //Admin > Mobile Apps & Devices > Mobile Apps > Configure Push Access
        this.getXType() == 'vespaNewDeviceForm' || //Admin > Mobile Apps & Devices > Test Devices > New Test Device
        this.getXType() == 'adminTagsAddCalendarEntryTypeForm' || //Admin > Tags > Calendar Entry Types > New Entry Type
        this.getXType() == 'featureSwitchForm' //Admin > Feature Manager > Edit Feature
      ) {
        menuItems = [
          '[action=submit]', //Create, Add, Save
          '[action=import]' //Import
        ]
        mItems = this.query(menuItems.toString())
        toDisable = true
      } else if (
        LIB.isPropOfWindowObj('MktCanvas.getActiveTab') &&
        MktCanvas.getActiveTab() &&
        this.getXType() == 'nurtureTrackForm' && //Marketing Activities > Nurture Program > Streams > Edit Name
        this.getXType() == 'inAppMessageAssetForm' //Marketing Activities > Mobile In-App Program > Control Panel > New In-App Message
      ) {
        menuItems = [
          '[action=submit]' //Create, Add, Save
        ]
        mItems = this.query(menuItems.toString())
        toDisable = APP.evaluateMenu('button', null, MktCanvas.getActiveTab(), null)
      }

      if (toDisable && mItems) {
        console.log('Marketo App > Executing: Disable Form Window Save Buttons')
        mItems.forEach(function (item) {
          if (item) {
            item.setDisabled(toDisable)

            if (me.getXType() == 'emailAddMultipleDomainForm') {
              item.stayDisabled = true
            } else if (me.getXType() == 'adminEditLicensesForm') {
              item.setVisible(false)
            }
          }
        })
      }

      let {rendered} = me
      if (rendered && me.isVisible()) {
        if (me.toFrontOnShow && me.floating) {
          me.toFront()
        }
      } else {
        if (me.fireEvent('beforeshow', me) !== false) {
          me.hidden = false
          if (!rendered && (me.autoRender || me.floating)) {
            me.doAutoRender()
            rendered = me.rendered
          }
          if (rendered) {
            me.beforeShow()
            me.onShow.apply(me, arguments)
            me.afterShow.apply(me, arguments)
          }
        } else {
          me.onShowVeto()
        }
      }
      if (me.stayDisabled) {
        me.setVisible(false)
      }
      return me
    }
  }
}

//  disable the Delete buttons in Form windows.
//  It can be used to disable any generic Form save window.
APP.disableFormDeleteButtons = function () {
  console.log('Marketo App > Disabling: Form Window Delete Buttons')
  if (LIB.isPropOfWindowObj('Ext4.window.MessageBox.prototype.confirmDelete')) {
    Ext4.window.MessageBox.prototype.confirmDelete = function (cfg, msg, fn, scope) {
      let menuItems, mItems, toDisable

      if (
        cfg.title == 'Remove Named Accounts' //ABM > Account Lists > Select Account
      ) {
        menuItems = [
          '[itemId=ok]', //Delete
          '[text=Delete]' //Delete
        ]
        mItems = this.query(menuItems.toString())
        toDisable = true
      }

      if (toDisable && mItems) {
        console.log('Marketo App > Executing: Disable Form Window Delete Buttons')
        mItems.forEach(function (item) {
          if (item) {
            item.setDisabled(toDisable)
          }
        })
      }

      if (Ext4.isString(cfg)) {
        cfg = {
          title: cfg,
          msg: msg,
          fn: fn,
          scope: scope
        }
      }

      cfg = Ext4.apply(
        {
          icon: this.INFO,
          buttons: this.OKCANCEL,
          buttonText: {ok: MktLang.getStr('messagebox.Delete')}
        },
        cfg
      )

      // TODO-legacy
      if (!Mkt3.Config.isFeatureEnabled('mkt3Ds')) {
        cfg.fn = Ext4.Function.bind(cfg.fn, cfg.scope || this, ['ok'])
        return MktMessage.confirmDelete(cfg.title, cfg.msg, cfg.fn, cfg.animateTarget)
      }

      return this.show(cfg)
    }
  }
}


// This function disables the Save, Apply, Change ... buttons in the Admin Section.
//  It can be used to disable any generic Save window.
APP.disableHarmfulSaveButtons = function () {
  console.log('Marketo App > Disabling: Harmful Save Buttons')
  if (LIB.isPropOfWindowObj('Ext.Window.prototype.show')) {
    Ext.Window.prototype.show = function (animateTarget, cb, scope) {
      // Disable ALL areas > ALL assets > ALL Save windows

      if (
        typeof this !== 'undefined' &&
        this &&
        this.buttons &&
        this.buttons.length > 0 &&
        LIB.isPropOfWindowObj('MktCanvas.getActiveTab') &&
        MktCanvas.getActiveTab()
      ) {
        let toDisable

        if (typeof MktMainNav !== 'undefined' && MktMainNav && MktMainNav.activeNav == 'tnCustAdmin' && MktCanvas.getActiveTab().title) {
          let activeTabTitle = MktCanvas.getActiveTab().title
          // Admin
          switch (activeTabTitle) {
            case 'Login Settings':
            // Users & Roles
            case 'Users':
            case 'Roles':
            // Workspaces & Partitions
            case 'Workspaces':
            case 'Lead Partitions':
            case 'Person Partitions':
            case 'Location':
            case 'Smart Campaign':
            case 'Communication Limits':
            case 'Tags':
            case 'Field Management':
            case 'Salesforce Objects Sync':
            case 'Salesforce':
            case 'Microsoft Dynamics':
            case 'Dynamics Entities Sync':
            // Sales Insight
            case 'Sales Insight':
            case 'Email Add-in':
            // Landing Pages
            case 'Landing Pages':
            case 'Rules':
            case 'Munchkin':
            // LaunchPoint
            case 'Installed Services':
            //
            case 'Webhooks':
            case 'Single Sign-On':
            case 'Revenue Cycle Analytics':
            case 'Treasure Chest':
              toDisable = true
              break
          }
        } else if (this.title) {
          switch (this.title) {
            // Marketing Activities
            // Program > Actions
            case 'Salesforce Campaign Sync':
            case 'Event Settings':
            // Program > Setup
            case 'New Reporting':
            case 'Edit Reporting':
            case 'New Vertical':
            case 'Edit Vertical':
            // Program > Members & List > Actions
            case 'Import List':
            // Nurture Program > Setup
            case 'Program Status':
            case 'Edit Exhausted Content Notification Settings':
            // Smart Campaign > Schedule
            case 'Activate Triggered Campaign':
            case 'Schedule Recurrence':
            case 'Run Once':
            case 'Edit Qualification Rules':
            // Database
            // ALL > New
            case 'New Field Organizer':
              toDisable = true
              break
            // Program > Actions
            case 'Event Schedule':
            // Program > Setup
            case 'Edit Channel':
            case 'New Cost':
            case 'Edit Cost':
            // Marketing Activities & Analytics
            // Report
            case 'Date of Activity':
            case 'Group by Segmentations':
            case 'Global Reporting':
            case 'Export Rows Available':
            case 'Filter by Model':
            case 'Filter by Period Cost':
            // Email Performance Report
            case 'Sent Date':
            case 'Email Filter':
            case 'Archived Email Filter':
            // Email via MSI Performance Report
            case 'Group Emails by':
            // Engagement Stream Performance Report
            case 'Engagement Program Email Filter':
            // People Performance Report
            case 'Person Created At':
            case 'Group People by':
            case 'Opportunity Columns':
            case 'Manage Custom Smart List Columns':
            // Program Performance Report
            case 'Program Filter':
            case 'Archived Program Filter':
            // Web Activity Report
            case 'Activity Source':
            // Opp Influence Analyzer & Success Path Analyzer
            case 'Time Frame':
            // Opp Influence Analyzer
            case 'Show Interesting Moments':
              toDisable = APP.evaluateMenu('button', null, MktCanvas.getActiveTab(), null)
              break
          }

          if (this.title.search(/Filter by .+/) != -1) {
            toDisable = APP.evaluateMenu('button', null, MktCanvas.getActiveTab(), null)
          }
        }

        if (toDisable) {
          console.log('Marketo App > Executing: Disable Harmful Save Buttons')
          let currButton

          for (let ii = this.buttons.length - 1; ii >= 0; ii--) {
            currButton = this.buttons[ii]
            if (currButton.cls == 'mktButtonPositive' || currButton.iconCls == 'mkiOk') {
              currButton.setDisabled(true)
              break
            }
          }
        }
      }

      if (!this.rendered) {
        this.render(Ext.getBody())
      }
      if (this.hidden === false) {
        this.toFront()
        return this
      }
      if (this.fireEvent('beforeshow', this) === false) {
        return this
      }
      if (cb) {
        this.on('show', cb, scope, {single: true})
      }
      this.hidden = false
      if (Ext.isDefined(animateTarget)) {
        this.setAnimateTarget(animateTarget)
      }
      this.beforeShow()
      if (this.animateTarget) {
        this.animShow()
      } else {
        this.afterShow()
      }
      return this
    }
  }
}

// injecting the Analyzer Navigation Bar that allows for easy switching between analyzers without returning to the folder tree
APP.updateNavBar = function () {
  let isPodsLoaded = window.setInterval(function () {
    if (typeof PODS !== 'undefined') {
      console.log('Marketo App > Injecting: Analyzer Navigation Bar')
      window.clearInterval(isPodsLoaded)

      let pod = new LIB.getCookie('userPod')

      for (let y = 0; y < pod.valueSet.length; y++) {
        if (window.location.href == pod.valueSet[y].url) {
          console.log('Marketo App > Updating: CSS for Analyzer Navigation Bar')
          // This code block swaps the colors of the analyzer labels depending on which one the user is currently viewing.
          $j = jQuery.noConflict()
          let currPosition = '#' + pod.valueSet[y].position
          $j(currPosition).parent().css('display', 'block')
          $j(currPosition).parent().siblings().css('display', 'none')
          $j(currPosition).removeClass('analyzer-button').addClass('analyzer-title')
          $j(currPosition).siblings().removeClass('analyzer-title').addClass('analyzer-button')
          $j('#modeler,#success-path-analyzer,#opportunity-influence-analyzer,#program-analyzer').bind('click', function (e) {
            console.log('Marketo App > Identifying: Current Analyzer')
            // Updates the currPosition based on the div selected
            for (let x = 0; x < pod.valueSet.length; x++) {
              if (e.target.id == pod.valueSet[x].position) {
                currPosition = x
              }
            }
            window.location = pod.valueSet[currPosition].url
          })
        }
      }
    }
  }, 0)
}

// overrides the function for saving additions and deletions to Nurture Streams.
APP.overrideSaving = function () {
  console.log('Marketo App > Overriding: Saving for Nurture Streams')
  if (LIB.isPropOfWindowObj('Mkt3.data.Store.prototype.sync')) {
    let prevDataStoreSync = Mkt3.data.Store.prototype.sync
    Mkt3.data.Store.prototype.sync = function () {
      if (
        this.storeId == 'CalendarView' ||
        this.storeId == 'CalendarViewList' || //CalendarViewList is for the presentation
        window.location.href.search('/#' + mktoCalendarFragment) != -1 ||
        (window.location.href.search('#' + mktoAccountBasedMarketingFragment) != -1 && !this.storeId)
      ) {
        //added to take care of the error on the edit view in Named Accounts
        console.log('Marketo App > Restoring: Original sync Function')
        prevDataStoreSync.apply(this, arguments)
      } else {
        let disable
        if (typeof MktCanvas !== 'undefined' && MktCanvas && MktCanvas.getActiveTab() && toggleState != 'false') {
          disable = APP.evaluateMenu('button', null, MktCanvas.getActiveTab(), null)
        } else if (toggleState == 'false') {
          disable = true
        }

        if (!disable) {
          if (this.autoSyncSuspended) {
            this.autoSync = true
            this.autoSyncSuspended = false
          }

          if (this.getProxy() instanceof Mkt3.data.proxy.AjaxPost) {
            Mkt3.Synchronizer.sync(this)
          } else {
            //this is called on the calendar
            this.callParent(arguments)
          }
        }
      }
    }
  }

  if (LIB.isPropOfWindowObj('Ext4.data.Model.prototype.destroy')) {
    Ext4.data.Model.prototype.destroy = function (options) {
      let disable
      if (typeof MktCanvas !== 'undefined' && MktCanvas && MktCanvas.getActiveTab() && toggleState != 'false') {
        disable = APP.evaluateMenu('button', null, MktCanvas.getActiveTab(), null)
      } else if (toggleState == 'false') {
        disable = true
      }

      if (!disable) {
        options = Ext.apply(
          {
            records: [this],
            action: 'destroy'
          },
          options
        )

        let me = this,
          isNotPhantom = me.phantom !== true,
          scope = options.scope || me,
          {stores} = me,
          i = 0,
          storeCount,
          store,
          args,
          operation,
          callback

        operation = new Ext.data.Operation(options)

        callback = function (operation) {
          args = [me, operation]
          if (operation.wasSuccessful()) {
            for (storeCount = stores.length; i < storeCount; i++) {
              store = stores[i]
              store.remove(me, true)
              if (isNotPhantom) {
                store.fireEvent('write', store, operation)
              }
            }
            me.clearListeners()
            Ext.callback(options.success, scope, args)
          } else {
            Ext.callback(options.failure, scope, args)
          }
          Ext.callback(options.callback, scope, args)
        }

        if (isNotPhantom) {
          me.getProxy().destroy(operation, callback, me)
        } else {
          operation.complete = operation.success = true
          operation.resultSet = me.getProxy().reader.nullResultSet
          callback(operation)
        }
        return me
      }
    }
  }
}

// disables saving for the Editors (emails, forms, push notifications, and social apps) and the Nurture Streams.
APP.disableSaving = function () {
  console.log('Marketo App > Disabling: Saving for Editors')
  if (LIB.isPropOfWindowObj('Mkt3.data.Store.prototype.sync')) {
    Mkt3.data.Store.prototype.sync = function () {
      console.log('Marketo App > Executing: Disable Saving for Editors (sync)')
    }
  }

  if (LIB.isPropOfWindowObj('Ext4.data.Model.prototype.destroy')) {
    Ext4.data.Model.prototype.destroy = function () {
      console.log('Marketo App > Executing: Disable Saving for Editors (destroy)')
    }
  }

  if (LIB.isPropOfWindowObj('Mkt3.controller.editor')) {
    if (LIB.isPropOfWindowObj('Mkt3.controller.editor.email2.EmailEditor.prototype.changeModuleOrder')) {
      Mkt3.controller.editor.email2.EmailEditor.prototype.changeModuleOrder = function (moduleComponent, orderDelta) {
        console.log('Marketo App > Executing: Disable Saving for Editors (changeModuleOrder)')
      }
    }

    if (LIB.isPropOfWindowObj('Mkt3.controller.editor.form.settings.FieldSelection.prototype.deleteFormField')) {
      Mkt3.controller.editor.form.settings.FieldSelection.prototype.deleteFormField = function (formField) {
        console.log('Marketo App > Executing: Enable Deleting Form Field')
        let formFieldWidget = formField.getFieldWidget(),
          formFieldId,
          childFieldIndex,
          childFormField,
          allFormFields

        if (formFieldWidget && formFieldWidget.get('datatype') === 'fieldset') {
          allFormFields = this.getForm().getFormFields()
          formFieldId = formField.get('id')
          for (childFieldIndex = 0; childFieldIndex < allFormFields.getCount(); childFieldIndex++) {
            childFormField = allFormFields.getAt(childFieldIndex)
            if (childFormField.get('fieldsetFieldId') == formFieldId) {
              this.deleteFormField(childFormField)
            }
          }
        }

        formField.destroy({
          scope: this,
          callback: function (field, response) {
            if (response.success) {
              if (formFieldWidget) {
                formFieldWidget.destroy()
              }
            }
          }
        })
        // This allows for multiple form fields to be deleted
        this.renumberWidgets()
      }
    }
  }
}

// disables specific requests from completing to prevent saving.
APP.disableRequests = function () {
  console.log('Marketo App > Disabling: Specific Requests')
  if (LIB.isPropOfWindowObj('MktSession.ajaxRequest')) {
    if (typeof origAjaxRequestFunc !== 'function') {
      origAjaxRequestFunc = MktSession.ajaxRequest
    }
    MktSession.ajaxRequest = function (url, opts) {
      switch (url) {
        case 'crm/enableSync':
        case 'leadDatabase/updateLead':
        case 'fieldManagement/analyticsOptionsSubmit':
          console.log('Marketo App > Executing: Disable Specific Requests')
          return null
        case 'analytics/editReportSettings':
        case 'analytics/applyComponentFilter':
        case 'analytics/setReportSegmentation':
          if (typeof MktExplorer !== 'undefined' && MktExplorer && MktExplorer.getNodeById && opts && opts.serializeParms) {
            if (
              opts.serializeParms.nodeId &&
              MktExplorer.getNodeById(opts.serializeParms.nodeId) &&
              MktExplorer.getNodeById(opts.serializeParms.nodeId).attributes &&
              MktExplorer.getNodeById(opts.serializeParms.nodeId).attributes.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1
            ) {
              console.log('Marketo App > Executing: Disable Specific Requests')
              return null
            } else if (
              opts.serializeParms.reportId &&
              MktExplorer.getNodeById(mktoAnalyticsFragment + opts.serializeParms.reportId) &&
              MktExplorer.getNodeById(mktoAnalyticsFragment + opts.serializeParms.reportId).attributes &&
              MktExplorer.getNodeById(mktoAnalyticsFragment + opts.serializeParms.reportId)
                .attributes.accessZoneId.toString()
                .search(mktoGoldenWorkspacesMatch) != -1
            ) {
              console.log('Marketo App > Executing: Disable Specific Requests')
              return null
            }
          }
          break
      }

      if (url.search('^salesforce/enableSynch') != -1) {
        console.log('Marketo App > Executing: Disable Specific Requests')
        return null
      }
      origAjaxRequestFunc.apply(this, arguments)
    }
  }
}

// set the Program Status to off for Nurture Programs
APP.disableNurturePrograms = function () {
  console.log('Marketo App > Disabling: Nurture Programs')
  if (
    LIB.isPropOfWindowObj('MktCanvas.getActiveTab') &&
    MktCanvas.getActiveTab() &&
    MktCanvas.getActiveTab().config &&
    MktCanvas.getActiveTab().config.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) == -1 &&
    MktCanvas.getActiveTab().config.compId
  ) {
    let {compId} = MktCanvas.getActiveTab().config
    console.log('Marketo App > Executing: Disabling Nurture Program')
    LIB.webRequest(
      '/marketingEvent/setProgramStatusSubmit',
      'ajaxHandler=MktSession&mktReqUid=' +
        new Date().getTime() +
        Ext.id(null, ':') +
        '&compId=' + compId +
        '&_json={"programId":' + compId +
        ',"statusValue":"off"}&xsrfId=' + MktSecurity.getXsrfId(),
      'POST',
      true,
      'json',
      function (response) {
        let result = JSON.parse(response)
        if (result.JSONResults.appvars.result == 'Success') {
          console.log('Marketo App > Success: Disabled Nurture Program: ' + result.JSONResults.actions[0].parameters[0][0].text)
        }
      }
    )
  }
}

// opens the Send via Ad Bridge modal window
APP.openAdBridgeModal = function () {
  console.log('Marketo App > Opening: Ad Bridge Modal Window')
  let isAdBridgeSmartList = window.setInterval(function () {
    if (typeof document.getElementsByClassName('x-btn-text mkiUserTarget')[0] !== 'undefined') {
      window.clearInterval(isAdBridgeSmartList)
      if (
        document.getElementsByClassName('x-btn-text mkiUserTarget') &&
        document.getElementsByClassName('x-btn-text mkiUserTarget')[0] &&
        document.getElementsByClassName('x-btn-text mkiUserTarget')[0].type == 'button'
      ) {
        console.log('Marketo App > Executing: Open Ad Bridge Modal Window')
        document.getElementsByClassName('x-btn-text mkiUserTarget')[0].click()
      }
    }
  }, 0)
}

// resets the golden Landing Pages properties/variables
APP.resetGoldenLandingPageProps = function () {
  console.log('Marketo App > Resetting: Golden Landing Pages Properties/Variables')
  if (typeof MktSecurity !== 'undefined' && MktSecurity && MktSecurity.getXsrfId()) {
    switch (currUrlFragment) {
      case mktoDefaultDiyLandingPageResponsiveEditFragment:
        console.log('Marketo App > Executing: Resetting Landing Page Responsive Properties/Variables')
        LIB.webRequest(
          '/data/landingPage/update?context=LPE11822&data=%5B%7B%22id%22%3A11822%2C%22responsiveOptions%22%3A%7B%22variables%22%3A%7B%22gradient1%22%3A%22%232A5370%22%2C%22gradient2%22%3A%22%23F2F2F2%22%2C%22showSection2%22%3Atrue%2C%22showSection3%22%3Atrue%2C%22showSection4%22%3Atrue%2C%22showFooter%22%3Atrue%2C%22showSocialButtons%22%3Atrue%2C%22section4ButtonLabel%22%3A%22Need%20More%20Info%3F%22%2C%22section4ButtonLink%22%3A%22%23%22%2C%22section3LeftButtonLabel%22%3A%22Join%20Us%22%2C%22section4BgColor%22%3A%22%23F2F2F2%22%2C%22footerBgColor%22%3A%22%232A5370%22%2C%22section2BgColor%22%3A%22%23F2F2F2%22%2C%22section3BgColor%22%3A%22%232A5370%22%2C%22section3LeftButtonLink%22%3A%22https%3A%2F%2Fwww.marketo.com%22%2C%22section3RightButtonLabel%22%3A%22Sign%20Up%22%7D%7D%7D%5D&xsrfId=' +
            MktSecurity.getXsrfId(),
          null,
          'POST',
          true,
          '',
          function (result) {
            console.log(result)
          }
        )
        break
    }
  }
}

// track tree node clicks for Heap Analytics.
APP.trackNodeClick = function () {
  console.log('Marketo App > Tracking: Tree Node Click')
  if (LIB.isPropOfWindowObj('Ext.tree.TreeEventModel.prototype.onNodeClick')) {
    //console.log("Marketo App > Executing: Tracking Tree Node Click");
    Ext.tree.TreeEventModel.prototype.onNodeClick = function (e, node) {
      if (node && node.text && node.attributes && node.attributes.accessZoneId) {
        let currNode = node,
          heapEvent = {
            name: '',
            assetName: currNode.text,
            assetId: currNode.attributes.id,
            assetType: currNode.attributes.compType,
            assetPath: '',
            workspaceId: currNode.attributes.accessZoneId,
            workspaceName: ''
          }

        heapEvent.assetPath = currNode.text

        for (let ii = 0; ii < node.getDepth() - 1; ii++) {
          currNode = currNode.parentNode
          heapEvent.assetPath = currNode.text + ' > ' + heapEvent.assetPath
        }

        if (
          (accountString == mktoAccountStringMaster || accountString == mktoAccountStringMasterMEUE) &&
          node.getPath().search(/^\\\\\\Programsroot\\\\\\19\\\\\\7506\\\\\\/) != -1
        ) {
          //TODO
          try {
            heapEvent.workspaceName = MktExplorer.getNodeById(node.getPath().split('\\\\\\')[4]).text.replace('&amp; ', '')
          } catch (e) {
            console.log('Marketo App > Tracking: Tree Node Click Error: ' + e)
          }
        } else {
          heapEvent.workspaceName = APP.getWorkspaceName(currNode.attributes.accessZoneId)
        }

        if (currNode.attributes.accessZoneId.toString().search(mktoGoldenWorkspacesMatch) != -1) {
          heapEvent.name = heapEvent.workspaceName

          if (heapEvent.workspaceName == 'Admin') {
            heapEvent.assetType = 'Admin Area'
            heapEvent.workspaceId = 0
          }
        } else if (currNode.attributes.accessZoneId.toString().search(mktoMyWorkspaceIdMatch) != -1) {
          heapEvent.name = heapEvent.workspaceName
          heapEvent.userFolder = userName
        } else {
          heapEvent.name = mktoOtherWorkspaceName
        }
        APP.heapTrack('track', heapEvent)
      }
      node.ui.onClick(e)
    }
  }
}

APP.getUserRole = function () {
  if (MktPage && MktPage.userName) {
    let roleSubstring = MktPage.userName.search(/\[[^\]]+\]/)
    if (roleSubstring != -1) {
      return MktPage.userName.substring(roleSubstring).replace(/^\[([^\]]+)]$/, '$1')
    }
  }
  return ''
}

APP.getUserId = function () {
  if (MktPage && MktPage.userid) {
    return MktPage.userid
  }
  return ''
}

/**************************************************************************************
 *  This function tracks and identifies the current user via Heap Analytics
 *  @param {String} action - The desired action (id, track).
 *  @param {Object} event - The object of the event to be tracked.
 **************************************************************************************/
APP.heapTrack = function (action, event) {
  let isHeapAnalytics = window.setInterval(function () {
    if (LIB.isPropOfWindowObj('heap.loaded')) {
      window.clearInterval(isHeapAnalytics)
      let oktaEmail, oktaFirstName, oktaLastName, heapApp, heapArea, heapEventProps
      switch (action) {
        // Heap Analytics Identify User
        case 'id':
          oktaEmail = LIB.getCookie('okta_email')
          oktaFirstName = LIB.getCookie('okta_first_name')
          oktaLastName = LIB.getCookie('okta_last_name')

          if (MktPage && MktPage.userid) {
            console.log('Marketo App > Heap Analytics ID: ' + MktPage.userid)
            heap.identify(MktPage.userid)
          }

          if (oktaFirstName && oktaLastName) {
            heap.addUserProperties({Name: oktaFirstName + ' ' + oktaLastName})
          } else if (MktPage && MktPage.userName) {
            heap.addUserProperties({
              Name: MktPage.userName.replace(/ ?\[[^\]]+\]/, '')
            })
          }
          heap.addUserProperties({Role: APP.getUserRole()})
          if (oktaEmail) {
            heap.addUserProperties({Email: oktaEmail})
          }
          if (LIB.isPropOfWindowObj('MktPage.savedState.custPrefix')) {
            if (MktPage.savedState.custPrefix == mktoAccountString106) {
              heap.addEventProperties({Environment: 'Internal'})
            } else if (MktPage.savedState.custPrefix == mktoAccountString106d) {
              heap.addEventProperties({Environment: 'Partner'})
            } else if (
              MktPage.savedState.custPrefix == mktoAccountStringMaster ||
              MktPage.savedState.custPrefix == mktoAccountStringMasterMEUE
            ) {
              //TODO
              heap.addEventProperties({Environment: 'Master'})
            }
          }
          break
        // Heap Analytics Event Tracking
        case 'track':
          if (MktPage && MktPage.friendlyName) {
            heapApp = MktPage.friendlyName
          } else {
            heapApp = 'Marketo'
          }

          if (MktPage && MktPage.baseTitle) {
            heapArea = MktPage.baseTitle.split('•')[0].trimRight()
          } else {
            heapArea = 'Unknown'
          }

          if (event) {
            heapEventProps = {
              app: heapApp,
              assetName: event.assetName,
              assetId: event.assetId,
              assetType: event.assetType,
              assetPath: event.assetPath,
              workspaceId: event.workspaceId,
              workspaceName: event.workspaceName,
              userFolder: event.userFolder,
              area: '',
              environment: '',
              url: window.location.href
            }

            if (event.assetArea) {
              heapEventProps.area = event.assetArea
            } else {
              heapEventProps.area = heapArea
            }

            if (LIB.isPropOfWindowObj('MktPage.savedState.custPrefix')) {
              if (MktPage.savedState.custPrefix == mktoAccountString106) {
                heapEventProps.environment = 'Internal'
              } else if (MktPage.savedState.custPrefix == mktoAccountString106d) {
                heapEventProps.environment = 'Partner'
              } else if (
                MktPage.savedState.custPrefix == mktoAccountStringMaster ||
                MktPage.savedState.custPrefix == mktoAccountStringMasterMEUE
              ) {
                //TODO
                heapEventProps.environment = 'Master'
              }
            }
            console.log('Marketo App > Tracking: Heap Event: ' + event.name + '\n' + JSON.stringify(heapEventProps, null, 2))
            heap.track(event.name, heapEventProps)
          }
          break
        case 'addProp':
          console.log('Marketo App > Adding: Heap Event Properties: ' + JSON.stringify(event, null, 2))
          heap.addEventProperties(event)
          break
      }
    }
  }, 0)
}

/**************************************************************************************
 *  Main
 **************************************************************************************/

window.mkto_live_extension_state = 'MarketoLive extension is alive!'

let toggleState = LIB.getCookie('toggleState')

if (toggleState == null) {
  toggleState = 'true'
}

let isMktPageApp = window.setInterval(function () {
  if (typeof MktPage !== 'undefined') {
    console.log('Marketo App > Location: Marketo Page')
    let userId

    if (LIB.isPropOfWindowObj('MktPage.savedState.custPrefix') && MktPage.userid && LIB.isPropOfWindowObj('Mkt3.DL.getDlToken') && Mkt3.DL.getDlToken()) {
      window.clearInterval(isMktPageApp)
      accountString = MktPage.savedState.custPrefix
      userId = MktPage.userid.toLowerCase()
      currUrlFragment = Mkt3.DL.getDlToken()
      if (LIB.isPropOfWindowObj('Mkt3.DL.dl.dlCompCode')) {
        currCompFragment = Mkt3.DL.dl.dlCompCode
      }

      if (userId.search('.demo@(marketo.com|marketolive.com)$') != -1) {
        userName = userId.split('.demo')[0]
      } else {
        userName = userId.split('@')[0]
        if (userName == 'marketolive') {
          userName = userId.split('@')[1].split('.')[0]
        }
      }
    }

    APP.setInstanceInfo(accountString)

    chrome.runtime.sendMessage(
      extensionId,
      {
        action: 'checkExtensionVersion',
        minVersion: extensionMinVersion
      },
      null,
      function (response) {
        if (response && response.isValidExtension) {
          chrome.runtime.sendMessage(
            extensionId,
            {action: 'checkBadExtension'},
            null,
            function (response) {
              if (response && response.isValidExtension) {
                LIB.validateDemoExtensionCheck(response.isValidExtension)
                if (accountString == mktoAccountStringMaster || accountString == mktoAccountStringMasterMEUE) {
                  //TODO
                  APP.overrideSuperballMenuItems() //response.isValidExtension);
                  //restoreEmailInsights = true;
                  if (currUrlFragment && currUrlFragment == mktoMyMarketoFragment) {
                    overrideTileTimerCount = true
                    APP.overrideHomeTiles() //response.isValidExtension);
                  }
                }
                console.log('Marketo App > checkBadExtension Msg > Response: ' + JSON.stringify(response))
              } else {
                if (!response) {
                  LIB.validateDemoExtensionCheck(true)
                } else {
                  LIB.validateDemoExtensionCheck(false)
                }
              }
              if (chrome.runtime.lastError) {
                console.log('Marketo App > checkBadExtension Msg > Error: ' + JSON.stringify(chrome.runtime.lastError))
              }
            }
          )
        } else {
          if (!response) {
            LIB.validateDemoExtensionCheck(true)
          } else {
            LIB.validateDemoExtensionCheck(false)
          }
        }
        if (chrome.runtime.lastError) {
          console.log('Marketo App > checkExtensionVersion Msg > Error: ' + JSON.stringify(chrome.runtime.lastError))
        }
      }
    )

    if (MktPage.userid && MktPage.userName) {
      let mktoRole = MktPage.userName.match(/\[[^\]]+\]/)

      if (mktoRole != null) {
        mktoRole = mktoRole[0].replace(/^\[([^\]]+)]$/, '$1')
      }
      chrome.runtime.sendMessage(extensionId, {
        action: 'setMktoCookies',
        mktoUserId: MktPage.userid,
        mktoName: MktPage.userName.replace(/ ?\[[^\]]+\]/, ''),
        mktoRole: mktoRole
      })

      APP.sendMktoMessage(accountString, mktoRole, userName)
    }

    if (currUrlFragment) {
      if (currUrlFragment == mktoAccountBasedMarketingFragment) {
        APP.disableAccountAI()
        let navItems = document.getElementsByClassName('x4-tab-center'),
          origNavItemOnClick

        for (let ii = 0; ii < navItems.length; ii++) {
          let navButton = navItems[ii].parentNode.parentNode,
            navItem = navItems[ii].getElementsByClassName('x4-tab-inner')

          if (navItem.length > 0 && navItem[0].innerHTML) {
            if (typeof origNavItemOnClick !== 'function') {
              origNavItemOnClick = navButton.onclick
            }
            navButton.onclick = function () {
              //debugger;
              APP.heapTrack('addProp', {
                area: 'ABM',
                assetType: LIB.formatText(this.getElementsByClassName('x4-tab-inner')[0].innerHTML)
              })

              if (typeof origNavItemOnClick == 'function') {
                origNavItemOnClick.apply(this, arguments)
              }
            }
          }
        }

        if (
          document.getElementsByClassName('x4-tab-top-active').length > 0 &&
          document.getElementsByClassName('x4-tab-top-active')[0].getElementsByClassName('x4-tab-inner').length > 0
        ) {
          APP.heapTrack('addProp', {
            area: 'ABM',
            assetType: LIB.formatText(
              document.getElementsByClassName('x4-tab-top-active')[0].getElementsByClassName('x4-tab-inner')[0].innerHTML
            )
          })
        }
      } else if (currUrlFragment == mktoMyMarketoFragment) {
        overrideTileTimerCount = true
        APP.overrideHomeTiles() //restoreEmailInsights);
        APP.heapTrack('track', {
          name: 'My Marketo',
          assetName: 'Home'
        })
      } else if (currUrlFragment.search(mktoDisableButtonsFragmentMatch) != -1) {
        APP.disableButtons()
      } else if (currUrlFragment == mktoAdminWebSkyFragment) {
        APP.disableCheckboxes()
      } else if (currUrlFragment.search(mktoAnalyticsHomeFragment) != -1) {
        APP.overrideAnalyticsTiles()
      } else if (currUrlFragment.search('^' + APP.getAssetCompCode('Nurture Program') + '[0-9]+A1$') != -1) {
        APP.disableNurturePrograms()
      } else if (currUrlFragment == mktoAdBridgeSmartListFragment) {
        console.log('Marketo App > Location: Ad Bridge Smart List')
        APP.openAdBridgeModal()
      } else if (currUrlFragment == mktoAdminSalesforceFragment || currUrlFragment == mktoAdminDynamicsFragment) {
        console.log('Marketo App > Location: Admin > CRM')
        APP.hideOtherToolbarItems([
          {
            id: 'enableSync', //Enable/Disable Sync
            action: 'setVisible'
          }
        ])
      } else if (currUrlFragment == mktoAdminRcaCustomFieldSync) {
        console.log('Marketo App > Location: Admin > Revenue Cycle Analytics > Custom Field Sync')
        APP.hideOtherToolbarItems([
          {
            id: 'cadChangeButton', //Edit Sync Option
            action: 'setVisible'
          }
        ])
      }
    }

    // Only execute this block if the user is not on an editor page.
    if (
      currUrlFragment &&
      currUrlFragment.search(mktoAnalyticsFragmentMatch) == -1 &&
      (!currCompFragment ||
        (currCompFragment.search(mktoAbmFragmentMatch) == -1 && currCompFragment.search(mktoDesignersFragmentMatch) == -1))
    ) {
      if (accountString.search(mktoAccountStrings106Match) != -1) {
        //APP.discardDrafts(accountString, "landingPage");
        APP.overrideTreeNodeExpand()
        APP.overrideTreeNodeCollapse()
        APP.overrideSaving()
        APP.disableDragAndDrop()
        APP.disableMenus()
        APP.hideToolbarItems()
        APP.overrideDraftEdits()
        APP.disableFormSaveButtons()
        APP.disableFormDeleteButtons()
        APP.disableHarmfulSaveButtons()
        APP.overrideSmartCampaignSaving()
        APP.trackNodeClick()
        APP.trackTreeNodeEdits()
        APP.overrideAssetSaveEdit()
        APP.overrideRenamingFolders()
        APP.overrideCanvas()
        APP.overrideUpdatePortletOrder()
        APP.disableConfirmationMessage()
        APP.disableRequests()
        APP.overrideNewProgramCreate()
        APP.overrideNewAssetCreate()
        APP.overrideNewFolders()
        APP.hideFoldersOnImport()
        APP.heapTrack('track', {
          name: 'Last Loaded',
          assetName: 'Page'
        })
      } else if (accountString == mktoAccountStringMaster || accountString == mktoAccountStringMasterMEUE) {
        //TODO
        APP.overrideTreeNodeExpand()
        APP.overrideTreeNodeCollapse()
        APP.overrideSaving()
        APP.disableDragAndDrop()
        APP.disableMenus()
        APP.hideToolbarItems()
        APP.overrideDraftEdits()
        APP.disableFormSaveButtons()
        APP.disableFormDeleteButtons()
        APP.disableHarmfulSaveButtons()
        APP.overrideSmartCampaignSaving()
        APP.trackNodeClick()
        APP.trackTreeNodeEdits()
        APP.overrideAssetSaveEdit()
        APP.overrideRenamingFolders()
        APP.overrideCanvas()
        APP.overrideUpdatePortletOrder()
        APP.disableConfirmationMessage()
        APP.disableRequests()
        APP.heapTrack('track', {
          name: 'Last Loaded',
          assetName: 'Page'
        })
      } else if (accountString == mktoAccountStringDynamics) {
        APP.overrideTreeNodeExpand()
        APP.overrideTreeNodeCollapse()
        APP.overrideSaving()
        APP.disableDragAndDrop()
        APP.disableMenus()
        APP.hideToolbarItems()
        APP.overrideDraftEdits()
        APP.disableFormSaveButtons()
        APP.disableFormDeleteButtons()
        APP.disableHarmfulSaveButtons()
        APP.overrideSmartCampaignSaving()
        APP.trackTreeNodeEdits()
        APP.overrideAssetSaveEdit()
        APP.overrideRenamingFolders()
        APP.overrideCanvas()
        APP.overrideUpdatePortletOrder()
        APP.disableConfirmationMessage()
        APP.disableRequests()
        APP.heapTrack('track', {
          name: 'Last Loaded',
          assetName: 'Page'
        })
      } else if (accountString == mktoAccountStringQe) {
        APP.disableMenus()
        APP.hideToolbarItems()
        APP.disableFormSaveButtons()
        APP.disableFormDeleteButtons()
        APP.disableHarmfulSaveButtons()
        APP.overrideAssetSaveEdit()
        APP.overrideRenamingFolders()
      } else if (toggleState == 'false') {
        APP.overrideSaving()
        APP.overrideSmartCampaignSaving()
        APP.overrideUpdatePortletOrder()
        APP.disableConfirmationMessage()
      }
    } else if (currCompFragment) {
      console.log('Marketo App > Location: Designers, ABM Areas')
      switch (currCompFragment) {
        case mktoAbmDiscoverMarketoCompaniesFragment:
          console.log('Marketo App > Location: ABM > Discover Marketo Companies')
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableFormDeleteButtons()
          APP.disableHarmfulSaveButtons()
          APP.heapTrack('track', {
            name: 'Last Loaded',
            assetName: 'Page'
          })
          APP.heapTrack('addProp', {
            area: 'ABM',
            assetType: 'Discover Marketo Companies'
          })
          break
        case mktoAbmDiscoverCrmAccountsFragment:
          console.log('Marketo App > Location: ABM > Discover CRM Accounts')
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableFormDeleteButtons()
          APP.disableHarmfulSaveButtons()
          APP.heapTrack('track', {
            name: 'Last Loaded',
            assetName: 'Page'
          })
          APP.heapTrack('addProp', {
            area: 'ABM',
            assetType: 'Discover CRM Accounts'
          })
          break
        case mktoAbmNamedAccountFragment:
          console.log('Marketo App > Location: ABM > Named Account')
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableFormDeleteButtons()
          APP.disableHarmfulSaveButtons()
          APP.heapTrack('track', {
            name: 'Last Loaded',
            assetName: 'Page'
          })
          APP.heapTrack('addProp', {
            area: 'ABM',
            assetType: 'Named Account'
          })
          break
        case mktoAbmImportNamedAccountsFragment:
          console.log('Marketo App > Location: ABM > Import Named Accounts')
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableFormDeleteButtons()
          APP.disableHarmfulSaveButtons()
          APP.heapTrack('track', {
            name: 'Last Loaded',
            assetName: 'Page'
          })
          APP.heapTrack('addProp', {
            area: 'ABM',
            assetType: 'Import Named Accounts'
          })
          break
        case mktoLandingPageEditFragment:
          console.log('Marketo App > Location: Landing Page Editor')
          APP.resetGoldenLandingPageProps()
          APP.disableDesignerSaving('landingPage', 'edit')
          APP.disableFormSaveButtons()
          break
        case mktoLandingPagePreviewFragment:
          console.log('Marketo App > Location: Landing Page Previewer')
          APP.disableDesignerSaving('landingPage', 'preview')
          break
        case mktoLandingPagePreviewDraftFragment:
          console.log('Marketo App > Location: Landing Page Draft Previewer')
          APP.disableDesignerSaving('landingPage', 'preview')
          break
        case mktoLandingPageTemplateEditFragment:
          console.log('Marketo App > Location: Landing Page Template Editor')
          APP.disableDesignerSaving('landingPage', 'templateEdit')
          break
        case mktoLandingPageTemplatePreviewFragment:
          console.log('Marketo App > Location: Landing Page Template Previewer')
          APP.disableDesignerSaving('landingPage', 'templatePreview')
          break
        case mktoEmailEditFragment:
          if (currUrlFragment == mktoEmailEditFragment) {
            console.log('Marketo App > Location: Email Template Picker')
            APP.disableDesignerSaving('email', 'templatePicker')
          } else if (currUrlFragment.search(mktoEmailPreviewFragmentRegex) == -1) {
            console.log('Marketo App > Location: Email Editor')
            APP.disableDesignerSaving('email', 'edit')
            APP.disableFormSaveButtons()
          } else {
            console.log('Marketo App > Location: Email Previewer')
            APP.disableDesignerSaving('email', 'preview')
          }
          break
        case mktoEmailTemplateEditFragment:
          console.log('Marketo App > Location: Email Template Editor')
          APP.disableDesignerSaving('email', 'templateEdit')
          break
        case mktoFormEditFragment:
          console.log('Marketo App > Location: Form Editor')
          APP.disableDesignerSaving('form', 'edit')
          break
        case mktoFormPreviewFragment:
          console.log('Marketo App > Location: Form Previewer')
          APP.disableDesignerSaving('form', 'preview')
          break
        case mktoFormPreviewDraftFragment:
          console.log('Marketo App > Location: Form Draft Previewer')
          APP.disableDesignerSaving('form', 'preview')
          break
        case mktoPushNotificationEditFragment:
          console.log('Marketo App > Location: Push Notification Editor')
          APP.disableDesignerSaving('pushNotification', 'edit')
          break
        case mktoMobilePushNotificationPreviewFragment:
          console.log('Marketo App > Location: Push Notification Previewer')
          APP.disableDesignerSaving('pushNotification', 'preview')
          break
        case mktoInAppMessageEditFragment:
          console.log('Marketo App > Location: In-App Message Editor')
          APP.disableDesignerSaving('inAppMessage', 'edit')
          break
        case mktoInAppMessagePreviewFragment:
          console.log('Marketo App > Location: In-App Message Previewer')
          APP.disableDesignerSaving('inAppMessage', 'preview')
          break
        case mktoSmsMessageEditFragment:
          console.log('Marketo App > Location: SMS Message Editor')
          APP.disableDesignerSaving('smsMessage', 'edit')
          break
        case mktoSocialAppEditFragment:
          console.log('Marketo App > Location: Social App Editor')
          APP.disableDesignerSaving('socialApp', 'edit')
          break
        case mktoSocialAppPreviewFragment:
          console.log('Marketo App > Location: Social App Previewer')
          APP.disableDesignerSaving('socialApp', 'preview')
          break
        case mktoAbTestEditFragment:
          console.log('Marketo App > Location: A/B Test Wizard')
          APP.disableDesignerSaving('abTest', 'edit')
          break
        case mktoEmailTestGroupEditFragment:
          console.log('Marketo App > Location: Email Test Group Wizard')
          APP.disableDesignerSaving('abTest', 'edit')
          break
        case mktoSnippetEditFragment:
          console.log('Marketo App > Location: Snippet Editor')
          APP.disableDesignerSaving('snippet', 'edit')
          break
        case mktoSnippetPreviewFragment:
          console.log('Marketo App > Location: Snippet Previewer')
          APP.disableDesignerSaving('snippet', 'preview')
          break
        default:
          break
      }
    } else if (currUrlFragment && currUrlFragment.search(mktoAnalyticsFragmentMatch) != -1) {
      if (currUrlFragment.search(mktoAnalyzersFragmentMatch) != -1) {
        console.log('Marketo App > Location: Golden Analytics')
        APP.updateNavBar()
      }

      if (currUrlFragment.search(mktoReportFragmentRegex) != -1) {
        console.log('Marketo App > Location: Fullscreen Report')
        APP.disableAnalyticsSaving('report')
      } else if (currUrlFragment.search(mktoModelerFragmentRegex) != -1) {
        if (window.location.href.search(mktoModelerPreviewFragmentRegex) == -1) {
          console.log('Marketo App > Location: Revenue Cycle Model Editor')
          APP.disableAnalyticsSaving('model', 'edit')
        } else {
          console.log('Marketo App > Location: Revenue Cycle Model Previewer')
          APP.disableAnalyticsSaving('model', 'preview')
        }
      }
    } else if (document.location.pathname == mktoPersonDetailPath) {
      console.log('Marketo App > Location: Lead Database > Person Detail')
      window.clearInterval(isMktPageApp)
      if (MktPage.savedState && MktPage.savedState.munchkinId) {
        console.log('Marketo App > checkMktoCookie Msg')
        chrome.runtime.sendMessage(
          extensionId,
          {
            action: 'checkMktoCookie',
            munchkinId: MktPage.savedState.munchkinId
          },
          null,
          function (response) {
            if (!response || !response.isAdmin) {
              APP.disableRequests()
            } else {
              console.log('Marketo App > checkMktoCookie Msg > Saving Enabled for Admin')
            }
            if (chrome.runtime.lastError) {
              console.log('Marketo App > checkMktoCookie Msg > Error: ' + JSON.stringify(chrome.runtime.lastError))
            }
          }
        )
      } else {
        APP.disableRequests()
      }
      APP.heapTrack('track', {
        name: 'Last Loaded',
        assetName: 'Page'
      })
    }

    //var resizeFirstCall = false;
    window.onresize = function () {
      console.log('Marketo App > Window: Resize')
      if (window.location.href.indexOf(mktoMyMarketoFragment) >= 0) {
        setTimeout(APP.overrideHomeTilesResize, 1000)
      }
    }

    window.onhashchange = function () {
      console.log('Marketo App > Window: Hash Changed')
      // Getting the URL fragment, the part after the #
      let isNewUrlFragment = window.setInterval(function () {
        if (LIB.isPropOfWindowObj('Mkt3.DL.getDlToken') && Mkt3.DL.getDlToken()) {
          if (currUrlFragment != Mkt3.DL.getDlToken()) {
            window.clearInterval(isNewUrlFragment)

            if (currUrlFragment == mktoMyMarketoSuperballFragment && Mkt3.DL.getDlToken() == mktoMyMarketoFragment) {
              overrideTileTimerCount = true
              window.setTimeout(function () {
                APP.overrideHomeTiles() //restoreEmailInsights);
              }, 1000)
            }

            currUrlFragment = Mkt3.DL.getDlToken()
            console.log('Marketo App > Loaded: New URL Fragment = ' + currUrlFragment)
            if (currUrlFragment == mktoMyMarketoFragment) {
              overrideTileTimerCount = true
              APP.overrideHomeTiles() //restoreEmailInsights);
              APP.heapTrack('track', {
                name: 'My Marketo',
                assetName: 'Home'
              })
            } else if (currUrlFragment.search(mktoDisableButtonsFragmentMatch) != -1) {
              APP.disableButtons()
            } else if (currUrlFragment === mktoAdminWebSkyFragment) {
              APP.disableCheckboxes()
            } else if (currUrlFragment.search(mktoAccountBasedMarketingFragment) != -1) {
              APP.disableAccountAI()
            } else if (currUrlFragment.search(mktoAnalyticsHomeFragment) != -1) {
              APP.overrideAnalyticsTiles()
            } else if (currUrlFragment.search('^' + APP.getAssetCompCode('Nurture Program') + '[0-9]+A1$') != -1) {
              APP.disableNurturePrograms()
            } else if (currUrlFragment == mktoAdminSalesforceFragment || currUrlFragment == mktoAdminDynamicsFragment) {
              console.log('Marketo App > Location: Admin > CRM')
              APP.hideOtherToolbarItems([{
                id: 'enableSync', //Enable/Disable Sync
                action: 'setVisible'
              }])
            } else if (currUrlFragment == mktoAdminRcaCustomFieldSync) {
              console.log('Marketo App > Location: Admin > Revenue Cycle Analytics > Custom Field Sync')
              APP.hideOtherToolbarItems([{
                id: 'cadChangeButton', //Edit Sync Option
                action: 'setVisible'
              }])
            } else if (currUrlFragment.search(mktoAnalyzersFragmentMatch) != -1) {
              console.log('Marketo App > Location: Golden Analytics')
              APP.updateNavBar()
            }

            if (LIB.isPropOfWindowObj('Mkt3.DL.dl.dlCompCode')) {
              currCompFragment = Mkt3.DL.dl.dlCompCode
              if (currCompFragment.search(mktoDesignersFragmentMatch) != -1) {
                console.log('Marketo App > Location: Designers/Wizards')
                switch (currCompFragment) {
                  case mktoLandingPageEditFragment:
                    console.log('Marketo App > Location: Landing Page Editor')
                    APP.resetGoldenLandingPageProps()
                    APP.disableDesignerSaving('landingPage', 'edit')
                    APP.disableFormSaveButtons()
                    break
                  case mktoLandingPagePreviewFragment:
                    console.log('Marketo App > Location: Landing Page Previewer')
                    APP.disableDesignerSaving('landingPage', 'preview')
                    break
                  case mktoLandingPagePreviewDraftFragment:
                    console.log('Marketo App > Location: Landing Page Draft Previewer')
                    APP.disableDesignerSaving('landingPage', 'preview')
                    break
                  case mktoLandingPageTemplateEditFragment:
                    console.log('Marketo App > Location: Landing Page Template Editor')
                    APP.disableDesignerSaving('landingPage', 'templateEdit')
                    break
                  case mktoLandingPageTemplatePreviewFragment:
                    console.log('Marketo App > Location: Landing Page Template Previewer')
                    APP.disableDesignerSaving('landingPage', 'templatePreview')
                    break
                  case mktoEmailEditFragment:
                    if (currUrlFragment == mktoEmailEditFragment) {
                      console.log('Marketo App > Location: Email Template Picker')
                      APP.disableDesignerSaving('email', 'templatePicker')
                    } else if (currUrlFragment.search(mktoEmailPreviewFragmentRegex) == -1) {
                      console.log('Marketo App > Location: Email Editor')
                      APP.disableDesignerSaving('email', 'edit')
                      APP.disableFormSaveButtons()
                    } else {
                      console.log('Marketo App > Location: Email Previewer')
                      APP.disableDesignerSaving('email', 'preview')
                    }
                    break
                  case mktoEmailTemplateEditFragment:
                    console.log('Marketo App > Location: Email Template Editor')
                    APP.disableDesignerSaving('email', 'templateEdit')
                    break
                  case mktoFormEditFragment:
                    console.log('Marketo App > Location: Form Editor')
                    APP.disableDesignerSaving('form', 'edit')
                    break
                  case mktoFormPreviewFragment:
                    console.log('Marketo App > Location: Form Previewer')
                    APP.disableDesignerSaving('form', 'preview')
                    break
                  case mktoFormPreviewDraftFragment:
                    console.log('Marketo App > Location: Form Draft Previewer')
                    APP.disableDesignerSaving('form', 'preview')
                    break
                  case mktoPushNotificationEditFragment:
                    console.log('Marketo App > Location: Push Notification Editor')
                    APP.disableDesignerSaving('pushNotification', 'edit')
                    break
                  case mktoMobilePushNotificationPreviewFragment:
                    console.log('Marketo App > Location: Push Notification Previewer')
                    APP.disableDesignerSaving('pushNotification', 'preview')
                    break
                  case mktoInAppMessageEditFragment:
                    console.log('Marketo App > Location: In-App Message Editor')
                    APP.disableDesignerSaving('inAppMessage', 'edit')
                    break
                  case mktoInAppMessagePreviewFragment:
                    console.log('Marketo App > Location: In-App Message Previewer')
                    APP.disableDesignerSaving('inAppMessage', 'preview')
                    break
                  case mktoSmsMessageEditFragment:
                    console.log('Marketo App > Location: SMS Message Editor')
                    APP.disableDesignerSaving('smsMessage', 'edit')
                    break
                  case mktoSocialAppEditFragment:
                    console.log('Marketo App > Location: Social App Editor')
                    APP.disableDesignerSaving('socialApp', 'edit')
                    break
                  case mktoSocialAppPreviewFragment:
                    console.log('Marketo App > Location: Social App Previewer')
                    APP.disableDesignerSaving('socialApp', 'preview')
                    break
                  case mktoAbTestEditFragment:
                    console.log('Marketo App > Location: A/B Test Wizard')
                    APP.disableDesignerSaving('abTest', 'edit')
                    break
                  case mktoEmailTestGroupEditFragment:
                    console.log('Marketo App > Location: Email Test Group Wizard')
                    APP.disableDesignerSaving('abTest', 'edit')
                    break
                  case mktoSnippetEditFragment:
                    console.log('Marketo App > Location: Snippet Editor')
                    APP.disableDesignerSaving('snippet', 'edit')
                    break
                  case mktoSnippetPreviewFragment:
                    console.log('Marketo App > Location: Snippet Previewer')
                    APP.disableDesignerSaving('snippet', 'preview')
                    break
                }
              }
            }
          }
        }
      }, 0)
    }
    APP.overrideSuperballMenuItems()
    // Heap Analytics ID
    APP.heapTrack('id')
  }
}, 0)

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFsdC9saWIvY29uY2F0LW5vdGUuanMiLCJhbHQvbGliL2Rldi1tb2RlLmpzIiwiYWx0L2xpYi9saWIuanMiLCJhbHQvcGx1Z2ludjMvbWFya2V0by1hcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FDRkE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvcUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbHQvZGlzdC9jaHJvbWUtZXh0ZW5zaW9uL3dlYi1hY2Nlc3NpYmxlLXJlc291cmNlcy9tYXJrZXRvLWFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5UaGlzIGZpbGUgaXMgdGhlIGNvbWJpbmVkIG91dHB1dCBvZiBtdWx0aXBsZSBzcmMgZmlsZXMuIERvIG5vdCBlZGl0IGl0IGRpcmVjdGx5LlxuKi8iLCJpc0V4dERldk1vZGUgPSB0cnVlIiwiLy8gY2F0Y2ggYWxsIGZvciBnbG9iYWxseSBkZWZpbmVkIGZ1bmN0aW9ucyB1c2VkIGJ5IGFueSBmaWxlXG5cbi8vIHRoZSB3ZWIgYWNjZXNzaWJsZSByZXNvdXJjZXMgcHJlZml4IG5lZWRzIHRvIGV4aXN0IGluIHRoZSBjaHJvbWUgZXh0ZW5zaW9uIGNvbnRleHQgQU5EIHRoZSB3aW5kb3cgY29udGV4dFxuLy8gc28gaW5qZWN0ZWQgc2NyaXB0cyBjYW4gYWNjZXNzIG90aGVyIHNjcmlwdHNcbndpbmRvdy53YXJQcmVmaXhcbmlmICh0eXBlb2Ygd2FyUHJlZml4ID09PSAndW5kZWZpbmVkJyAmJlxuICB0eXBlb2YgY2hyb21lICE9PSAndW5kZWZpbmVkJyAmJlxuICB0eXBlb2YgY2hyb21lLnJ1bnRpbWUgIT09ICd1bmRlZmluZWQnICYmXG4gIHR5cGVvZiBjaHJvbWUucnVudGltZS5nZXRVUkwgIT09ICd1bmRlZmluZWQnKSB7XG4gIHdpbmRvdy53YXJQcmVmaXggPSBjaHJvbWUucnVudGltZS5nZXRVUkwoJ3dlYi1hY2Nlc3NpYmxlLXJlc291cmNlcycpXG5cbiAgLy8gZG8gbm90IGF0dGVtcHQgdG8gYWRkIHRoaXMgaW5saW5lIHNjcmlwdCB0byB0aGUgZXh0ZW5zaW9uIGJhY2tncm91bmQgb3IgcG9wdXAgcGFnZS5cbiAgLy8gaXQncyBub3QgYWxsb3dlZCBieSBDaHJvbWUncyBDU1AgYW5kIGl0J3Mgbm90IG5lZWRlZCBiL2MgdGhlIHdhclByZWZpeCB3aWxsIGJlIGFscmVhZHkgYmUgYXZhaWxhYmxlXG4gIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM3MjE4Njc4L2lzLWNvbnRlbnQtc2VjdXJpdHktcG9saWN5LXVuc2FmZS1pbmxpbmUtZGVwcmVjYXRlZFxuICBpZiAoIS9eY2hyb21lLWV4dGVuc2lvbjouKihcXC9fZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZVxcLmh0bWx8XFwvcG9wdXBcXC9wb3B1cC5odG1sKSQvLnRlc3QobG9jYXRpb24uaHJlZikpIHtcbiAgICBsZXQgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgcy5pbm5lckhUTUwgPSBgd2luZG93LndhclByZWZpeCA9ICcke3dhclByZWZpeH0nYFxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQocylcbiAgfVxufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdmFyXG52YXIgTElCID0ge1xuXG4gIE1BUktFVE9fTElWRV9BUFA6ICdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52My9tYXJrZXRvLWFwcC5qcycsXG4gIE1BUktFVE9fR0xPQkFMX0FQUDogJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzL21hcmtldG8tZ2xvYmFsLWFwcC5qcycsXG4gIEdMT0JBTF9MQU5ESU5HX1BBR0U6ICdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52My9nbG9iYWwtbGFuZGluZy1wYWdlLmpzJyxcbiAgSEVBUF9BTkFMWVRJQ1NfU0NSSVBUX0xPQ0FUSU9OOiAnaHR0cHM6Ly9tYXJrZXRvbGl2ZS5jb20vbTMvcGx1Z2ludjMvaGVhcC1hbmFseXRpY3MtZXh0LmpzJyxcblxuICBhZGRTdHlsZXM6IGZ1bmN0aW9uIChjc3MpIHtcbiAgICBsZXQgaCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG4gICAgICBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgIHMudHlwZSA9ICd0ZXh0L2NzcydcbiAgICBzLmlubmVySFRNTCA9IGNzc1xuICAgIGguYXBwZW5kQ2hpbGQocylcbiAgfSxcblxuICBpc1Byb3BPZldpbmRvd09iajogZnVuY3Rpb24gKHMpIHtcbiAgICBpZiAodHlwZW9mIHMgIT09ICdzdHJpbmcnIHx8IC9bWyhdXS8udGVzdChzKSkge1xuICAgICAgdGhyb3cgJ0ludmFsaWQgcGFyYW0gdG8gaXNQcm9wT2ZXaW5kb3dPYmonXG4gICAgfVxuICAgIGxldCBhID0gcy5zcGxpdCgnLicpLFxuICAgICAgb2JqID0gd2luZG93W2Euc2hpZnQoKV1cbiAgICB3aGlsZSAob2JqICYmIGEubGVuZ3RoKSB7XG4gICAgICBvYmogPSBvYmpbYS5zaGlmdCgpXVxuICAgIH1cbiAgICByZXR1cm4gISFvYmpcbiAgfSxcblxuICBnZXRFeHRlbnNpb25JZDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgY2hyb21lID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgY2hyb21lLnJ1bnRpbWUgPT09ICdvYmplY3QnICYmIGNocm9tZS5ydW50aW1lLmlkKSB7XG4gICAgICByZXR1cm4gY2hyb21lLnJ1bnRpbWUuaWRcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHdhclByZWZpeC5yZXBsYWNlKC8uKjpcXC9cXC8oW14vXSopLiovLCAnJDEnKVxuICAgIH1cbiAgfSxcblxuICByZWxvYWRUYWJzOiBmdW5jdGlvbiAodXJsTWF0Y2gpIHtcbiAgICBjaHJvbWUudGFicy5xdWVyeSh7dXJsOiB1cmxNYXRjaH0sXG4gICAgICBmdW5jdGlvbiAodGFicykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjaHJvbWUudGFicy5yZWxvYWQodGFic1tpXS5pZClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBnZXRDb29raWU6IGZ1bmN0aW9uIChjb29raWVOYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ0dldHRpbmc6IENvb2tpZSAnICsgY29va2llTmFtZSlcbiAgICBsZXQgbmFtZSA9IGNvb2tpZU5hbWUgKyAnPScsXG4gICAgICBjb29raWVzID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7JyksXG4gICAgICBjdXJyQ29va2llXG5cbiAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgY29va2llcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIGN1cnJDb29raWUgPSBjb29raWVzW2lpXS50cmltKClcbiAgICAgIGlmIChjdXJyQ29va2llLmluZGV4T2YobmFtZSkgPT0gMCkge1xuICAgICAgICByZXR1cm4gY3VyckNvb2tpZS5zdWJzdHJpbmcobmFtZS5sZW5ndGgsIGN1cnJDb29raWUubGVuZ3RoKVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZygnR2V0dGluZzogQ29va2llICcgKyBjb29raWVOYW1lICsgJyBub3QgZm91bmQnKVxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgcmVtb3ZlQ29va2llOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgbGV0IGNvb2tpZSA9IHtcbiAgICAgIHVybDogb2JqLnVybCxcbiAgICAgIG5hbWU6IG9iai5uYW1lXG4gICAgfVxuICAgIGNocm9tZS5jb29raWVzLnJlbW92ZShjb29raWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdSZW1vdmluZzogJyArIGNvb2tpZS5uYW1lICsgJyBDb29raWUgZm9yICcgKyBjb29raWUudXJsKVxuICAgIH0pXG4gIH0sXG5cbiAgc2V0Q29va2llOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgbGV0IGNvb2tpZSA9IHtcbiAgICAgIHVybDogb2JqLnVybCxcbiAgICAgIG5hbWU6IG9iai5uYW1lLFxuICAgICAgdmFsdWU6IG9iai52YWx1ZSxcbiAgICAgIGRvbWFpbjogb2JqLmRvbWFpblxuICAgIH1cblxuICAgIGlmIChvYmouZXhwaXJlc0luRGF5cykge1xuICAgICAgY29va2llLmV4cGlyYXRpb25EYXRlID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwICsgb2JqLmV4cGlyZXNJbkRheXMgKiAyNCAqIDYwICogNjBcbiAgICB9XG4gICAgaWYgKG9iai5zZWN1cmUpIHtcbiAgICAgIGNvb2tpZS5zZWN1cmUgPSBvYmouc2VjdXJlXG4gICAgfVxuXG4gICAgY2hyb21lLmNvb2tpZXMuc2V0KGNvb2tpZSwgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGNvb2tpZS52YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdTZXR0aW5nOiAnICsgY29va2llLm5hbWUgKyAnIENvb2tpZSBmb3IgJyArIGNvb2tpZS5kb21haW4gKyAnID0gJyArIGNvb2tpZS52YWx1ZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdTZXR0aW5nOiAnICsgY29va2llLm5hbWUgKyAnIENvb2tpZSBmb3IgJyArIGNvb2tpZS5kb21haW4gKyAnID0gbnVsbCcpXG4gICAgICB9XG4gICAgfSlcbiAgfSxcblxuICBmb3JtYXRUZXh0OiBmdW5jdGlvbiAodGV4dCkge1xuICAgIGxldCBzcGxpdFRleHQgPSB0ZXh0LnRyaW0oKS5zcGxpdCgnICcpLFxuICAgICAgZm9ybWF0dGVkVGV4dCA9ICcnXG5cbiAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgc3BsaXRUZXh0Lmxlbmd0aDsgaWkrKykge1xuICAgICAgaWYgKGlpICE9IDApIHtcbiAgICAgICAgZm9ybWF0dGVkVGV4dCArPSAnICdcbiAgICAgIH1cbiAgICAgIGZvcm1hdHRlZFRleHQgKz0gc3BsaXRUZXh0W2lpXS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHNwbGl0VGV4dFtpaV0uc3Vic3RyaW5nKDEpLnRvTG93ZXJDYXNlKClcbiAgICB9XG5cbiAgICByZXR1cm4gZm9ybWF0dGVkVGV4dFxuICB9LFxuXG4gIGdldFVybFBhcmFtOiBmdW5jdGlvbiAocGFyYW0pIHtcbiAgICBjb25zb2xlLmxvZygnR2V0dGluZzogVVJMIFBhcmFtZXRlcjogJyArIHBhcmFtKVxuICAgIGxldCBwYXJhbVN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCc/JylbMV1cblxuICAgIGlmIChwYXJhbVN0cmluZykge1xuICAgICAgbGV0IHBhcmFtcyA9IHBhcmFtU3RyaW5nLnNwbGl0KCcmJyksXG4gICAgICAgIHBhcmFtUGFpcixcbiAgICAgICAgcGFyYW1OYW1lLFxuICAgICAgICBwYXJhbVZhbHVlXG5cbiAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBwYXJhbXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIHBhcmFtUGFpciA9IHBhcmFtc1tpaV0uc3BsaXQoJz0nKVxuICAgICAgICBwYXJhbU5hbWUgPSBwYXJhbVBhaXJbMF1cbiAgICAgICAgcGFyYW1WYWx1ZSA9IHBhcmFtUGFpclsxXVxuXG4gICAgICAgIGlmIChwYXJhbU5hbWUgPT0gcGFyYW0pIHtcbiAgICAgICAgICBwYXJhbVZhbHVlID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhcmFtVmFsdWUpXG4gICAgICAgICAgaWYgKHBhcmFtVmFsdWUuc2VhcmNoKC9eaHR0cChzKT86XFwvXFwvLykgPT0gLTEpIHtcbiAgICAgICAgICAgIHBhcmFtVmFsdWUgPSBwYXJhbVZhbHVlLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUubG9nKCdVUkwgUGFyYW1ldGVyOiAnICsgcGFyYW1OYW1lICsgJyA9ICcgKyBwYXJhbVZhbHVlKVxuICAgICAgICAgIHJldHVybiBwYXJhbVZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICcnXG4gIH0sXG5cbiAgbG9hZFNjcmlwdDogZnVuY3Rpb24gKHNjcmlwdFNyYykge1xuICAgIHNjcmlwdFNyYyA9IHNjcmlwdFNyYy5yZXBsYWNlKCdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52MycsIHdhclByZWZpeClcbiAgICBjb25zb2xlLmxvZygnTG9hZGluZzogU2NyaXB0OiAnICsgc2NyaXB0U3JjKVxuICAgIGxldCBzY3JpcHRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0JylcbiAgICBzY3JpcHRFbGVtZW50LmFzeW5jID0gdHJ1ZVxuICAgIHNjcmlwdEVsZW1lbnQuc3JjID0gc2NyaXB0U3JjXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHRFbGVtZW50KVxuICB9LFxuXG4gIHdlYlJlcXVlc3Q6IGZ1bmN0aW9uICh1cmwsIHBhcmFtcywgbWV0aG9kLCBhc3luYywgcmVzcG9uc2VUeXBlLCBjYWxsYmFjaykge1xuICAgIHVybCA9IHVybC5yZXBsYWNlKCdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52MycsIHdhclByZWZpeClcbiAgICBjb25zb2xlLmxvZygnV2ViIFJlcXVlc3QgPiAnICsgdXJsICsgJ1xcbicgKyBwYXJhbXMpXG4gICAgbGV0IHhtbEh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcbiAgICAgIHJlc3VsdFxuICAgIHhtbEh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyAmJiB4bWxIdHRwLnJlYWR5U3RhdGUgPT0gNCAmJiB4bWxIdHRwLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2soeG1sSHR0cC5yZXNwb25zZSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGFzeW5jICYmIHhtbEh0dHAucmVzcG9uc2VUeXBlKSB7XG4gICAgICB4bWxIdHRwLnJlc3BvbnNlVHlwZSA9IHJlc3BvbnNlVHlwZVxuICAgIH1cbiAgICB4bWxIdHRwLm9wZW4obWV0aG9kLCB1cmwsIGFzeW5jKSAvLyB0cnVlIGZvciBhc3luY2hyb25vdXNcbiAgICB4bWxIdHRwLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLTgnKVxuXG4gICAgLy8ga2hiOiBpcyB0aGlzIGhlYWRlciBuZWNlc3Nhcnk/IHdoeSBub3Qgc2V0IGl0IGFsbCB0aGUgdGltZT9cbiAgICBpZiAodXJsLnNlYXJjaCgvXlxcLy8pICE9IC0xIHx8IHVybC5yZXBsYWNlKC9eW2Etel0rOlxcL1xcLyhbXi9dKylcXC8/LiokLywgJyQxJykgPT0gd2luZG93LmxvY2F0aW9uLmhvc3QpIHtcbiAgICAgIHhtbEh0dHAuc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpXG4gICAgfVxuXG4gICAgeG1sSHR0cC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG4gICAgeG1sSHR0cC5zZW5kKHBhcmFtcylcbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sXG5cbiAgdmFsaWRhdGVEZW1vRXh0ZW5zaW9uQ2hlY2s6IGZ1bmN0aW9uIChpc1ZhbGlkRXh0ZW5zaW9uKSB7XG4gICAgY29uc29sZS5sb2coJz4gVmFsaWRhdGluZzogRGVtbyBFeHRlbnNpb24gQ2hlY2snKVxuICAgIGlmIChpc1ZhbGlkRXh0ZW5zaW9uKSB7XG4gICAgICB3aW5kb3cubWt0b19saXZlX2V4dGVuc2lvbl9zdGF0ZSA9ICdNYXJrZXRvTGl2ZSBleHRlbnNpb24gaXMgYWxpdmUhJ1xuICAgICAgY29uc29sZS5sb2coJz4gVmFsaWRhdGluZzogRGVtbyBFeHRlbnNpb24gSVMgVmFsaWQnKVxuICAgIH0gZWxzZSBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RQYWdlLnZhbGlkYXRlRGVtb0V4dGVuc2lvbicpKSB7XG4gICAgICB3aW5kb3cubWt0b19saXZlX2V4dGVuc2lvbl9zdGF0ZSA9IG51bGxcbiAgICAgIE1rdFBhZ2UudmFsaWRhdGVEZW1vRXh0ZW5zaW9uKG5ldyBEYXRlKCkpXG4gICAgICBjb25zb2xlLmxvZygnPiBWYWxpZGF0aW5nOiBEZW1vIEV4dGVuc2lvbiBJUyBOT1QgVmFsaWQnKVxuICAgIH1cbiAgfSxcblxuICBnZXRNa3QzQ3RsckFzc2V0OiBmdW5jdGlvbihrZXksIG1ldGhvZCkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KGtleSlbbWV0aG9kXSgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9LFxuXG4gIC8vIG92ZXJsYXlzIGFuIGVtYWlsIHdpdGggdGhlIHVzZXIgc3VibWl0dGVkIGNvbXBhbnkgbG9nbyBhbmQgY29sb3JcbiAgLy8gYWN0aW9uIC0gbW9kZSBpbiB3aGljaCB0aGlzIGFzc2V0IGlzIGJlaW5nIHZpZXdlZCAoZWRpdC9wcmV2aWV3KVxuICBvdmVybGF5RW1haWw6IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCcpXG4gICAgbGV0IGlzRW1haWxFZGl0b3IyLFxuICAgICAgY2xlYXJPdmVybGF5VmFycyxcbiAgICAgIG92ZXJsYXksXG4gICAgICBpc01rdG9IZWFkZXJCZ0NvbG9yUmVwbGFjZWQgPVxuICAgICAgICAoaXNNa3RvSW1nUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b0hlcm9CZ1JlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9UZXh0UmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b1N1YlRleHRSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b0VtYWlsMVJlcGxhY2VkID1cbiAgICAgICAgICBlZGl0b3JQcmV2UmVhZHkgPVxuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPVxuICAgICAgICAgIHBob25lUHJldlJlYWR5ID1cbiAgICAgICAgICBpc0Rlc2t0b3BQcmV2aWV3UmVwbGFjZWQgPVxuICAgICAgICAgIGlzUGhvbmVQcmV2aWV3UmVwbGFjZWQgPVxuICAgICAgICAgIGZhbHNlKSxcbiAgICAgIGxvZ29Na3RvTmFtZVJlZ2V4ID0gbmV3IFJlZ0V4cCgnbG9nbycsICdpJyksXG4gICAgICBidXR0b25UZXh0UmVnZXggPSBuZXcgUmVnRXhwKCdzaWdudXB8c2lnbiB1cHxjYWxsIHRvIGFjdGlvbnxjdGF8cmVnaXN0ZXJ8bW9yZXxjb250cmlidXRlJywgJ2knKSxcbiAgICAgIHNhdmVFZGl0c1RvZ2dsZSA9IExJQi5nZXRDb29raWUoJ3NhdmVFZGl0c1RvZ2dsZVN0YXRlJyksXG4gICAgICBsb2dvID0gTElCLmdldENvb2tpZSgnbG9nbycpLFxuICAgICAgaGVyb0JhY2tncm91bmQgPSBMSUIuZ2V0Q29va2llKCdoZXJvQmFja2dyb3VuZCcpLFxuICAgICAgY29sb3IgPSBMSUIuZ2V0Q29va2llKCdjb2xvcicpLFxuICAgICAgZGVmYXVsdENvbG9yID0gJ3JnYig0MiwgODMsIDExMiknLFxuICAgICAgbG9nb01heEhlaWdodCA9ICc1NScsXG4gICAgICBta3RvTWFpblRleHQgPSAnWW91IFRvIFRoZTxicj48YnI+UFJFTUlFUiBCVVNJTkVTUyBFVkVOVDxicj5PRiBUSEUgWUVBUicsXG4gICAgICBta3RvU3ViVGV4dCA9IExJQi5nZXRIdW1hbkRhdGUoKSxcbiAgICAgIGNvbXBhbnksXG4gICAgICBjb21wYW55TmFtZSxcbiAgICAgIGVkaXRvclJlcGVhdFJlYWR5Q291bnQgPSAoZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAwKSxcbiAgICAgIG1heFJlcGVhdFJlYWR5ID0gMjAwMCxcbiAgICAgIG1heFByZXZpZXdSZXBlYXRSZWFkeSA9IDMwMDBcblxuICAgIGlmIChzYXZlRWRpdHNUb2dnbGUgPT0gJ3RydWUnIHx8IChsb2dvID09IG51bGwgJiYgaGVyb0JhY2tncm91bmQgPT0gbnVsbCAmJiBjb2xvciA9PSBudWxsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChsb2dvICE9IG51bGwpIHtcbiAgICAgIGNvbXBhbnkgPSBsb2dvLnNwbGl0KCdodHRwczovL2xvZ28uY2xlYXJiaXQuY29tLycpWzFdLnNwbGl0KCcuJylbMF1cbiAgICAgIGNvbXBhbnlOYW1lID0gY29tcGFueS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGNvbXBhbnkuc2xpY2UoMSlcbiAgICAgIG1rdG9NYWluVGV4dCA9IGNvbXBhbnlOYW1lICsgJyBJbnZpdGVzICcgKyBta3RvTWFpblRleHRcbiAgICB9IGVsc2Uge1xuICAgICAgbWt0b01haW5UZXh0ID0gJ1dlIEludml0ZSAnICsgbWt0b01haW5UZXh0XG4gICAgfVxuXG4gICAgY2xlYXJPdmVybGF5VmFycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlzTWt0b0hlYWRlckJnQ29sb3JSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvSGVyb0JnUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9UZXh0UmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9TdWJUZXh0UmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0VtYWlsMVJlcGxhY2VkID1cbiAgICAgICAgZmFsc2VcbiAgICAgIGVtYWlsQm9keSA9XG4gICAgICAgIG1rdG9JbWdzID1cbiAgICAgICAgbWt0b1RleHRzID1cbiAgICAgICAgbWt0b0J1dHRvbnMgPVxuICAgICAgICBsb2dvU3dhcENvbXBhbnkgPVxuICAgICAgICBsb2dvU3dhcENvbnRhaW5lciA9XG4gICAgICAgIGxvZ29Td2FwQ29tcGFueUNvbnRhaW5lciA9XG4gICAgICAgIGxvZ29Ca2cgPVxuICAgICAgICBidXR0b25Ca2cgPVxuICAgICAgICBudWxsXG4gICAgfVxuXG4gICAgb3ZlcmxheSA9IGZ1bmN0aW9uIChlbWFpbERvY3VtZW50KSB7XG4gICAgICBpZiAoZW1haWxEb2N1bWVudCkge1xuICAgICAgICBsZXQgZW1haWxCb2R5ID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLFxuICAgICAgICAgIGxvZ29Td2FwQ29tcGFueSA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ28tc3dhcC1jb21wYW55JyksXG4gICAgICAgICAgbG9nb1N3YXBDb250YWluZXIgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dvLXN3YXAtY29udGFpbmVyJyksXG4gICAgICAgICAgbG9nb1N3YXBDb21wYW55Q29udGFpbmVyID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nby1zd2FwLWNvbXBhbnktY29udGFpbmVyJyksXG4gICAgICAgICAgbG9nb0JrZyA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ28tYmtnJyksXG4gICAgICAgICAgYnV0dG9uQmtnID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnV0dG9uLWJrZycpXG5cbiAgICAgICAgaWYgKGVtYWlsQm9keSAmJiBlbWFpbEJvZHkuaW5uZXJIVE1MKSB7XG4gICAgICAgICAgbGV0IG1rdG9IZWFkZXIgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdoZWFkZXInKVswXSxcbiAgICAgICAgICAgIG1rdG9Mb2dvMSA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2xvZ28nKVswXSxcbiAgICAgICAgICAgIG1rdG9Mb2dvMiA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2xvZ28nKVsxXSxcbiAgICAgICAgICAgIG1rdG9JbWdzID0gZW1haWxCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21rdG9JbWcnKSxcbiAgICAgICAgICAgIG1rdG9IZXJvQmcgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdoZXJvQmFja2dyb3VuZCcpWzBdLFxuICAgICAgICAgICAgbWt0b1RkcyA9IGVtYWlsQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGQnKSxcbiAgICAgICAgICAgIG1rdG9UaXRsZSA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ3RpdGxlJylbMF0sXG4gICAgICAgICAgICBta3RvU3VidGl0bGUgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdzdWJ0aXRsZScpWzBdLFxuICAgICAgICAgICAgbWt0b1RleHRzID0gZW1haWxCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21rdG9UZXh0JyksXG4gICAgICAgICAgICBta3RvQnV0dG9uID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnYnV0dG9uJylbMF0sXG4gICAgICAgICAgICBta3RvQnV0dG9ucyA9IGVtYWlsQm9keS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzZWNvbmRhcnktZm9udCBidXR0b24nKVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9IZWFkZXJCZ0NvbG9yUmVwbGFjZWQgJiYgY29sb3IgJiYgbWt0b0hlYWRlcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIEhlYWRlciBCYWNrZ3JvdW5kIENvbXBhbnkgQ29sb3IgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICBta3RvSGVhZGVyLnN0eWxlLnNldFByb3BlcnR5KCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3IpXG4gICAgICAgICAgICBta3RvSGVhZGVyLnNldEF0dHJpYnV0ZSgnYmdDb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgaXNNa3RvSGVhZGVyQmdDb2xvclJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvSW1nUmVwbGFjZWQgJiYgbG9nbyAmJiAobWt0b0xvZ28xIHx8IG1rdG9Mb2dvMiB8fCBta3RvSW1ncy5sZW5ndGggIT0gMCkpIHtcbiAgICAgICAgICAgIGlmIChta3RvTG9nbzEgfHwgbWt0b0xvZ28yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBDb21wYW55IExvZ28gZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIGlmIChta3RvTG9nbzEgJiYgbWt0b0xvZ28xLmdldEF0dHJpYnV0ZSgnZGlzcGxheScpICE9ICdub25lJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBDb21wYW55IExvZ28gMScpXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMS5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAobWt0b0xvZ28yICYmIG1rdG9Mb2dvMi5nZXRBdHRyaWJ1dGUoJ2Rpc3BsYXknKSAhPSAnbm9uZScpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgQ29tcGFueSBMb2dvIDInKVxuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzIuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b0ltZ3MubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvSW1nID0gbWt0b0ltZ3NbaWldLFxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWdNa3RvTmFtZVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnbWt0b25hbWUnKSkge1xuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWdNa3RvTmFtZSA9IGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnbWt0b25hbWUnKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdpZCcpKSB7XG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZ01rdG9OYW1lID0gY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdpZCcpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvSW1nTWt0b05hbWUgJiYgY3Vyck1rdG9JbWdNa3RvTmFtZS5zZWFyY2gobG9nb01rdG9OYW1lUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9JbWdUYWcgPSBjdXJyTWt0b0ltZy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJylbMF1cblxuICAgICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvSW1nVGFnICYmIGN1cnJNa3RvSW1nVGFnLmdldEF0dHJpYnV0ZSgnc3JjJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIENvbXBhbnkgTG9nbycpXG4gICAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nVGFnLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nVGFnLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZ1RhZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvSGVyb0JnUmVwbGFjZWQgJiYgaGVyb0JhY2tncm91bmQgJiYgKG1rdG9IZXJvQmcgfHwgbWt0b1Rkcy5sZW5ndGggIT0gMCkpIHtcbiAgICAgICAgICAgIGlmIChta3RvSGVyb0JnKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBIZXJvIENvbXBhbnkgQmFja2dyb3VuZCBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgbWt0b0hlcm9CZy5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoXFwnJyArIGhlcm9CYWNrZ3JvdW5kICsgJ1xcJyknKVxuICAgICAgICAgICAgICBta3RvSGVyb0JnLnNldEF0dHJpYnV0ZSgnYmFja2dyb3VuZCcsIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgICAvL21rdG9IZXJvQmcuc3R5bGUuc2V0UHJvcGVydHkoXCJiYWNrZ3JvdW5kLXNpemVcIiwgXCJjb3ZlclwiKTtcbiAgICAgICAgICAgICAgaXNNa3RvSGVyb0JnUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b1Rkcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9UZCA9IG1rdG9UZHNbaWldXG5cbiAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9UZCAmJiBjdXJyTWt0b1RkLmdldEF0dHJpYnV0ZSgnYmFja2dyb3VuZCcpKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgSGVybyBDb21wYW55IEJhY2tncm91bmQnKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9UZC5zZXRBdHRyaWJ1dGUoJ2JhY2tncm91bmQnLCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvVGQuc3R5bGUuc2V0UHJvcGVydHkoJ2JhY2tncm91bmQtaW1hZ2UnLCAndXJsKFxcJycgKyBoZXJvQmFja2dyb3VuZCArICdcXCcpJylcbiAgICAgICAgICAgICAgICAgIC8vY3Vyck1rdG9UZC5zdHlsZS5zZXRQcm9wZXJ0eShcImJhY2tncm91bmQtc2l6ZVwiLCBcImNvdmVyXCIpO1xuICAgICAgICAgICAgICAgICAgaXNNa3RvSGVyb0JnUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvQnV0dG9uUmVwbGFjZWQgJiYgY29sb3IgJiYgKG1rdG9CdXR0b24gfHwgbWt0b0J1dHRvbnMubGVuZ3RoICE9IDApKSB7XG4gICAgICAgICAgICBpZiAobWt0b0J1dHRvbikge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgQnV0dG9uIENvbXBhbnkgQ29sb3IgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIG1rdG9CdXR0b24uc3R5bGUuc2V0UHJvcGVydHkoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvcilcbiAgICAgICAgICAgICAgbWt0b0J1dHRvbi5zdHlsZS5zZXRQcm9wZXJ0eSgnYm9yZGVyLWNvbG9yJywgY29sb3IpXG4gICAgICAgICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG1rdG9CdXR0b25zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b0J1dHRvbiA9IG1rdG9CdXR0b25zW2lpXVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvQnV0dG9uLmlubmVySFRNTCAmJiBjdXJyTWt0b0J1dHRvbi5pbm5lckhUTUwuc2VhcmNoKGJ1dHRvblRleHRSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXJyTWt0b0J1dHRvbi5zdHlsZSAmJiBjdXJyTWt0b0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIEJ1dHRvbiBDb21wYW55IENvbG9yJylcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3JcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uc3R5bGUuYm9yZGVyQ29sb3IgPSBjb2xvclxuICAgICAgICAgICAgICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobG9nb1N3YXBDb21wYW55Q29udGFpbmVyICYmIGxvZ29Td2FwQ29udGFpbmVyICYmIGxvZ29Td2FwQ29tcGFueSAmJiBsb2dvQmtnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMS4wIENvbXBhbnkgTG9nbyAmIENvbG9yJylcbiAgICAgICAgICBpZiAoY29sb3IpIHtcbiAgICAgICAgICAgIGxvZ29Ca2cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3JcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAobG9nbykge1xuICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcblxuICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgbGV0IGxvZ29IZWlnaHRzUmF0aW8sIGxvZ29XaWR0aCwgbG9nb05ld1dpZHRoLCBsb2dvTmV3SGVpZ2h0LCBsb2dvU3R5bGVcblxuICAgICAgICAgICAgICBpZiAobG9nb1N3YXBDb21wYW55Lm5hdHVyYWxIZWlnaHQgJiYgbG9nb1N3YXBDb21wYW55Lm5hdHVyYWxIZWlnaHQgPiBsb2dvTWF4SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgbG9nb0hlaWdodHNSYXRpbyA9IGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsSGVpZ2h0IC8gbG9nb01heEhlaWdodFxuICAgICAgICAgICAgICAgIGxvZ29XaWR0aCA9IGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsV2lkdGggLyBsb2dvSGVpZ2h0c1JhdGlvXG4gICAgICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LndpZHRoID0gbG9nb05ld1dpZHRoID0gbG9nb1dpZHRoXG4gICAgICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LmhlaWdodCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvTWF4SGVpZ2h0XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobG9nb1N3YXBDb21wYW55Lm5hdHVyYWxIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkud2lkdGggPSBsb2dvTmV3V2lkdGggPSBsb2dvU3dhcENvbXBhbnkubmF0dXJhbFdpZHRoXG4gICAgICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LmhlaWdodCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvU3dhcENvbXBhbnkubmF0dXJhbEhlaWdodFxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueS53aWR0aCA9IGxvZ29Td2FwQ29tcGFueS5oZWlnaHQgPSBsb2dvTmV3V2lkdGggPSBsb2dvTmV3SGVpZ2h0ID0gbG9nb01heEhlaWdodFxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKSAmJiBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0pIHtcbiAgICAgICAgICAgICAgICBsb2dvU3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gICAgICAgICAgICAgICAgbG9nb1N0eWxlLmlubmVySFRNTCA9XG4gICAgICAgICAgICAgICAgICAnIycgKyBsb2dvU3dhcENvbXBhbnkuaWQgKyAnIHt3aWR0aCA6ICcgKyBsb2dvTmV3V2lkdGggKyAncHggIWltcG9ydGFudDsgaGVpZ2h0IDogJyArIGxvZ29OZXdIZWlnaHQgKyAncHggIWltcG9ydGFudDt9J1xuICAgICAgICAgICAgICAgIGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChsb2dvU3R5bGUpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMS4wIENvbXBhbnkgTG9nbyBEaW1lbnNpb25zID0gJyArIGxvZ29OZXdXaWR0aCArICcgeCAnICsgbG9nb05ld0hlaWdodClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvZ29Td2FwQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueUNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChidXR0b25Ca2cgJiYgY29sb3IpIHtcbiAgICAgICAgICAgIGJ1dHRvbkJrZy5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgIH1cbiAgICAgICAgICBpc01rdG9FbWFpbDFSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAoaXNNa3RvQnV0dG9uUmVwbGFjZWQgJiZcbiAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkICYmXG4gICAgICAgICAgICBpc01rdG9IZXJvQmdSZXBsYWNlZCAmJlxuICAgICAgICAgICAgKCFta3RvSGVhZGVyIHx8IChta3RvSGVhZGVyICYmIGlzTWt0b0hlYWRlckJnQ29sb3JSZXBsYWNlZCkpKSB8fFxuICAgICAgICAgIGlzTWt0b0VtYWlsMVJlcGxhY2VkXG4gICAgICAgICkge1xuICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgaXNFbWFpbEVkaXRvcjIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGFjdGlvbiA9PSAnZWRpdCcpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgRGVzaWduZXInKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAob3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHwgZWRpdG9yUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBFbWFpbCBEZXNpZ25lciA9ICcgKyBlZGl0b3JSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgSW50ZXJ2YWwgaXMgQ2xlYXJlZCcpXG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0VtYWlsRWRpdG9yMilcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9IGVsc2UgaWYgKGVkaXRvclByZXZSZWFkeSkge1xuICAgICAgICAgICAgZWRpdG9yUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVkaXRvclJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIGVkaXRvclByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlZGl0b3JQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PSAncHJldmlldycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgUHJldmlld2VyJylcbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc0Rlc2t0b3BQcmV2aWV3UmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhQcmV2aWV3UmVwZWF0UmVhZHlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogRW1haWwgRGVza3RvcCBQcmV2aWV3ID0gJyArIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNEZXNrdG9wUHJldmlld1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChkZXNrdG9wUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc1Bob25lUHJldmlld1JlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAob3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHwgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID49IG1heFByZXZpZXdSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBFbWFpbCBQaG9uZSBQcmV2aWV3ID0gJyArIHBob25lUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzUGhvbmVQcmV2aWV3UmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKHBob25lUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBwaG9uZVJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIHBob25lUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBob25lUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1Bob25lUHJldmlld1JlcGxhY2VkICYmIGlzRGVza3RvcFByZXZpZXdSZXBsYWNlZCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIEludGVydmFsIGlzIENsZWFyZWQnKVxuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzRW1haWxFZGl0b3IyKVxuICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAwKVxuICB9LFxuXG4gIC8vIG92ZXJsYXlzIGEgbGFuZGluZyBwYWdlIHdpdGggdGhlIHVzZXIgc3VibWl0dGVkIGNvbXBhbnkgbG9nbyBhbmQgY29sb3JcbiAgLy8gYWN0aW9uIC0gbW9kZSBpbiB3aGljaCB0aGlzIGFzc2V0IGlzIGJlaW5nIHZpZXdlZCAoZWRpdC9wcmV2aWV3KVxuICBvdmVybGF5TGFuZGluZ1BhZ2U6IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UnKVxuICAgIGxldCBpc0xhbmRpbmdQYWdlRWRpdG9yLFxuICAgICAgY2xlYXJPdmVybGF5VmFycyxcbiAgICAgIG92ZXJsYXksXG4gICAgICBpc01rdG9GcmVlRm9ybSA9XG4gICAgICAgIChpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9UZXh0UmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b1N1YlRleHRSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b09yaWdSZXBsYWNlZCA9XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPVxuICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUHJldlJlYWR5ID1cbiAgICAgICAgICBzaWRlQnlTaWRlUGhvbmVQcmV2UmVhZHkgPVxuICAgICAgICAgIGlzRGVza3RvcFJlcGxhY2VkID1cbiAgICAgICAgICBpc1Bob25lUmVwbGFjZWQgPVxuICAgICAgICAgIGlzU2lkZUJ5U2lkZURlc2t0b3BSZXBsYWNlZCA9XG4gICAgICAgICAgaXNTaWRlQnlTaWRlUGhvbmVSZXBsYWNlZCA9XG4gICAgICAgICAgZmFsc2UpLFxuICAgICAgbWt0b0JvZHlJZCA9ICdib2R5SWQnLFxuICAgICAgbWt0b0ZyZWVGb3JtQ2xhc3NOYW1lID0gJ21rdG9Nb2JpbGVTaG93JyxcbiAgICAgIGxvZ29SZWdleCA9IG5ldyBSZWdFeHAoJ3ByaW1hcnlJbWFnZXxwcmltYXJ5X2ltYWdlfHByaW1hcnktaW1hZ2V8bG9nb3xpbWFnZV8xfGltYWdlLTF8aW1hZ2UxJywgJ2knKSxcbiAgICAgIGhlcm9CZ0ltZ0lkUmVnZXggPSBuZXcgUmVnRXhwKCdoZXJvJywgJ2knKSxcbiAgICAgIGJ1dHRvblRleHRSZWdleCA9IG5ldyBSZWdFeHAoJ3NpZ251cHxzaWduIHVwfGNhbGwgdG8gYWN0aW9ufGN0YXxyZWdpc3Rlcnxtb3JlfGNvbnRyaWJ1dGV8c3VibWl0JywgJ2knKSxcbiAgICAgIHNhdmVFZGl0c1RvZ2dsZSA9IExJQi5nZXRDb29raWUoJ3NhdmVFZGl0c1RvZ2dsZVN0YXRlJyksXG4gICAgICBsb2dvID0gTElCLmdldENvb2tpZSgnbG9nbycpLFxuICAgICAgaGVyb0JhY2tncm91bmQgPSBMSUIuZ2V0Q29va2llKCdoZXJvQmFja2dyb3VuZCcpLFxuICAgICAgY29sb3IgPSBMSUIuZ2V0Q29va2llKCdjb2xvcicpLFxuICAgICAgZGVmYXVsdENvbG9yID0gJ3JnYig0MiwgODMsIDExMiknLFxuICAgICAgbG9nb09yaWdNYXhIZWlnaHQgPSAnNTUnLFxuICAgICAgbWt0b01haW5UZXh0ID0gJ1lvdSBUbyBPdXIgRXZlbnQnLFxuICAgICAgbWt0b1N1YlRleHQgPSBMSUIuZ2V0SHVtYW5EYXRlKCksXG4gICAgICBjb21wYW55LFxuICAgICAgY29tcGFueU5hbWUsXG4gICAgICBsaW5lYXJHcmFkaWVudCxcbiAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gKHBob25lUmVwZWF0UmVhZHlDb3VudCA9IHNpZGVCeVNpZGVEZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IHNpZGVCeVNpZGVQaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAwKSxcbiAgICAgIG1heFJlcGVhdFJlYWR5ID0gMjAwMCxcbiAgICAgIG1heE90aGVyUmVwZWF0UmVhZHkgPSAyMDAwLFxuICAgICAgZm9ybWF0QnV0dG9uU3R5bGVcblxuICAgIGlmIChzYXZlRWRpdHNUb2dnbGUgPT0gJ3RydWUnIHx8IChsb2dvID09IG51bGwgJiYgaGVyb0JhY2tncm91bmQgPT0gbnVsbCAmJiBjb2xvciA9PSBudWxsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChsb2dvICE9IG51bGwpIHtcbiAgICAgIGNvbXBhbnkgPSBsb2dvLnNwbGl0KCdodHRwczovL2xvZ28uY2xlYXJiaXQuY29tLycpWzFdLnNwbGl0KCcuJylbMF1cbiAgICAgIGNvbXBhbnlOYW1lID0gY29tcGFueS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGNvbXBhbnkuc2xpY2UoMSlcbiAgICAgIG1rdG9NYWluVGV4dCA9IGNvbXBhbnlOYW1lICsgJyBJbnZpdGVzICcgKyBta3RvTWFpblRleHRcbiAgICB9IGVsc2Uge1xuICAgICAgbWt0b01haW5UZXh0ID0gJ1dlIEludml0ZSAnICsgbWt0b01haW5UZXh0XG4gICAgfVxuXG4gICAgaWYgKGNvbG9yKSB7XG4gICAgICBmb3JtQnV0dG9uU3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gICAgICBmb3JtQnV0dG9uU3R5bGUudHlwZSA9ICd0ZXh0L2NzcydcbiAgICAgIGZvcm1CdXR0b25TdHlsZS5pbm5lckhUTUwgPVxuICAgICAgICAnLm1rdG9CdXR0b24geyBiYWNrZ3JvdW5kLWltYWdlOiBub25lICFpbXBvcnRhbnQ7IGJvcmRlci1yYWRpdXM6IDAgIWltcG9ydGFudDsgYm9yZGVyOiBub25lICFpbXBvcnRhbnQ7IGJhY2tncm91bmQtY29sb3I6ICcgK1xuICAgICAgICBjb2xvciArXG4gICAgICAgICcgIWltcG9ydGFudDsgfSdcbiAgICAgIGxpbmVhckdyYWRpZW50ID0gJ2xpbmVhci1ncmFkaWVudCh0byBib3R0b20sICcgKyBjb2xvciArICcsIHJnYigyNDIsIDI0MiwgMjQyKSkgIWltcG9ydGFudCdcbiAgICB9XG5cbiAgICBjbGVhck92ZXJsYXlWYXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvVGV4dFJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvU3ViVGV4dFJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9PcmlnUmVwbGFjZWQgPVxuICAgICAgICBmYWxzZVxuICAgICAgaWZyYW1lQm9keSA9XG4gICAgICAgIGxvZ29JbWcgPVxuICAgICAgICB0ZXh0QmFja2dyb3VuZCA9XG4gICAgICAgIGJhbm5lckJhY2tncm91bmQgPVxuICAgICAgICBtYWluVGl0bGUgPVxuICAgICAgICBzdWJUaXRsZSA9XG4gICAgICAgIG1rdG9JbWdzID1cbiAgICAgICAgbWt0b1RleHRzID1cbiAgICAgICAgbWt0b1JpY2hUZXh0cyA9XG4gICAgICAgIG1rdG9CdXR0b25zID1cbiAgICAgICAgbnVsbFxuICAgIH1cblxuICAgIG92ZXJsYXkgPSBmdW5jdGlvbiAoaWZyYW1lRG9jdW1lbnQpIHtcbiAgICAgIGlmIChpZnJhbWVEb2N1bWVudCkge1xuICAgICAgICBsZXQgaWZyYW1lQm9keSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0sXG4gICAgICAgICAgbG9nb0ltZyA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdscC1sb2dvJyksXG4gICAgICAgICAgdGV4dEJhY2tncm91bmQgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFja2dyb3VuZC1jb2xvcicpLFxuICAgICAgICAgIGJhbm5lckJhY2tncm91bmQgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmlnZ2VyLWJhY2tncm91bmQnKSxcbiAgICAgICAgICBtYWluVGl0bGUgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGl0bGUnKSxcbiAgICAgICAgICBzdWJUaXRsZSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdWItdGl0bGUnKVxuXG4gICAgICAgIGlmIChpZnJhbWVCb2R5ICYmIGlmcmFtZUJvZHkuaW5uZXJIVE1MKSB7XG4gICAgICAgICAgbGV0IG1rdG9IZWFkZXIgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnaGVhZGVyJylbMF0sXG4gICAgICAgICAgICBta3RvTG9nbzEgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnbG9nbycpWzBdLFxuICAgICAgICAgICAgbWt0b0xvZ28yID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2xvZ28nKVsxXSxcbiAgICAgICAgICAgIG1rdG9JbWdzID0gaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdscGltZycpLFxuICAgICAgICAgICAgbWt0b0hlcm9CZyA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdoZXJvQmFja2dyb3VuZCcpWzBdLFxuICAgICAgICAgICAgbWt0b1RpdGxlID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ3RpdGxlJylbMF0sXG4gICAgICAgICAgICBta3RvU3VidGl0bGUgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnc3VidGl0bGUnKVswXSxcbiAgICAgICAgICAgIG1rdG9UZXh0cyA9IGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWt0b1RleHQnKSxcbiAgICAgICAgICAgIG1rdG9SaWNoVGV4dHMgPSBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3JpY2hUZXh0U3BhbicpLFxuICAgICAgICAgICAgbWt0b0J1dHRvbiA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdidXR0b24nKVswXSxcbiAgICAgICAgICAgIG1rdG9CdXR0b25zID0gaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYnV0dG9uJylcblxuICAgICAgICAgIGlmICghaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgJiYgY29sb3IgJiYgbWt0b0hlYWRlcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIEhlYWRlciBCYWNrZ3JvdW5kIENvbXBhbnkgQ29sb3IgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICBta3RvSGVhZGVyLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBta3RvSGVhZGVyLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSArICc7IGJhY2tncm91bmQ6ICcgKyBsaW5lYXJHcmFkaWVudCArICc7JylcbiAgICAgICAgICAgIGlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgaXNNa3RvRnJlZUZvcm0gPSBmYWxzZVxuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAhaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgJiZcbiAgICAgICAgICAgIGNvbG9yICYmXG4gICAgICAgICAgICAhYmFubmVyQmFja2dyb3VuZCAmJlxuICAgICAgICAgICAgaWZyYW1lQm9keS5pZCA9PSBta3RvQm9keUlkICYmXG4gICAgICAgICAgICBpZnJhbWVCb2R5LmNsYXNzTmFtZSAhPSBudWxsICYmXG4gICAgICAgICAgICBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKSAmJlxuICAgICAgICAgICAgaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JylbMF0gJiZcbiAgICAgICAgICAgIGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpWzBdLnN0eWxlXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAoaWZyYW1lQm9keS5jbGFzc05hbWUuc2VhcmNoKG1rdG9GcmVlRm9ybUNsYXNzTmFtZSkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRnJlZWZvcm0gTGFuZGluZyBQYWdlIEJhY2tncm91bmQgQ29tcGFueSBDb2xvcicpXG4gICAgICAgICAgICAgIGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpWzBdLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yICsgJyAhaW1wb3J0YW50J1xuICAgICAgICAgICAgICBpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCA9IGlzTWt0b0ZyZWVGb3JtID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogR3VpZGVkIExhbmRpbmcgUGFnZSBCYWNrZ3JvdW5kIENvbXBhbnkgQ29sb3InKVxuICAgICAgICAgICAgICBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKVswXS5zdHlsZS5iYWNrZ3JvdW5kID0gbGluZWFyR3JhZGllbnRcbiAgICAgICAgICAgICAgaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgIGlzTWt0b0ZyZWVGb3JtID0gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoZm9ybUJ1dHRvblN0eWxlKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvSW1nUmVwbGFjZWQgJiYgbG9nbyAmJiAobWt0b0xvZ28xIHx8IG1rdG9Mb2dvMiB8fCBta3RvSW1ncy5sZW5ndGggIT0gMCkpIHtcbiAgICAgICAgICAgIGlmIChta3RvTG9nbzEgfHwgbWt0b0xvZ28yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28gZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIGlmIChta3RvTG9nbzEgJiYgbWt0b0xvZ28xLmdldEF0dHJpYnV0ZSgnZGlzcGxheScpICE9ICdub25lJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28gMScpXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMS5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAobWt0b0xvZ28yICYmIG1rdG9Mb2dvMi5nZXRBdHRyaWJ1dGUoJ2Rpc3BsYXknKSAhPSAnbm9uZScpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvIDInKVxuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzIuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b0ltZ3MubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvSW1nID0gbWt0b0ltZ3NbaWldXG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc3JjICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlLnRhZ05hbWUgPT0gJ0RJVicgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUuaWQuc2VhcmNoKGxvZ29SZWdleCkgIT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEd1aWRlZCBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvJylcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnNyYyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZSAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZS50YWdOYW1lID09ICdTUEFOJyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZS5wYXJlbnROb2RlICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlLnBhcmVudE5vZGUuY2xhc3NOYW1lLnNlYXJjaChsb2dvUmVnZXgpICE9IC0xXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBGcmVlZm9ybSBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvJylcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkICYmIGhlcm9CYWNrZ3JvdW5kICYmIChta3RvSGVyb0JnIHx8IG1rdG9JbWdzLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9IZXJvQmcgJiYgbWt0b0hlcm9CZy5nZXRBdHRyaWJ1dGUoJ3NyYycpKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEd1aWRlZCBMYW5kaW5nIFBhZ2UgSGVybyBDb21wYW55IEJhY2tncm91bmQgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIG1rdG9IZXJvQmcuc2V0QXR0cmlidXRlKCdzcmMnLCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgICAgICAgaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b0ltZ3MubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvSW1nID0gbWt0b0ltZ3NbaWldXG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ3NyYycpICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ2lkJykgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnaWQnKS5zZWFyY2goaGVyb0JnSW1nSWRSZWdleCkgIT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEd1aWRlZCBMYW5kaW5nIFBhZ2UgSGVybyBDb21wYW55IEJhY2tncm91bmQnKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgICAgICAgICAgIGlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0J1dHRvblJlcGxhY2VkICYmIGNvbG9yICYmIChta3RvQnV0dG9uIHx8IG1rdG9CdXR0b25zLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9CdXR0b24pIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIEJ1dHRvbiBDb21wYW55IENvbG9yIGZvciBEZW1vIFN2Y3MgVGVtcGxhdGUnKVxuICAgICAgICAgICAgICBta3RvQnV0dG9uLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAnc3R5bGUnLFxuICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSArICc7IGJhY2tncm91bmQtY29sb3I6ICcgKyBjb2xvciArICcgIWltcG9ydGFudDsgYm9yZGVyLWNvbG9yOiAnICsgY29sb3IgKyAnICFpbXBvcnRhbnQ7J1xuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG1rdG9CdXR0b25zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b0J1dHRvbiA9IG1rdG9CdXR0b25zW2lpXVxuXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24gJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLnN0eWxlICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uaW5uZXJIVE1MICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5pbm5lckhUTUwuc2VhcmNoKGJ1dHRvblRleHRSZWdleCkgIT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBCdXR0b24gQ29tcGFueSBDb2xvcicpXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgICAgICdzdHlsZScsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSArXG4gICAgICAgICAgICAgICAgICAgICc7IGJhY2tncm91bmQtY29sb3I6ICcgK1xuICAgICAgICAgICAgICAgICAgICBjb2xvciArXG4gICAgICAgICAgICAgICAgICAgICcgIWltcG9ydGFudDsgYm9yZGVyLWNvbG9yOiAnICtcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgK1xuICAgICAgICAgICAgICAgICAgICAnICFpbXBvcnRhbnQ7J1xuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb2dvSW1nICYmIHRleHRCYWNrZ3JvdW5kICYmIHRleHRCYWNrZ3JvdW5kLnN0eWxlICYmIGJhbm5lckJhY2tncm91bmQgJiYgYmFubmVyQmFja2dyb3VuZC5zdHlsZSAmJiBtYWluVGl0bGUgJiYgc3ViVGl0bGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBPcmlnaW5hbCBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvICYgQ29sb3InKVxuICAgICAgICAgIGlmIChsb2dvKSB7XG4gICAgICAgICAgICBsb2dvSW1nLnNyYyA9IGxvZ29cblxuICAgICAgICAgICAgbG9nb0ltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGxldCBsb2dvSGVpZ2h0c1JhdGlvLCBsb2dvV2lkdGgsIGxvZ29OZXdXaWR0aCwgbG9nb05ld0hlaWdodCwgbG9nb1N0eWxlXG5cbiAgICAgICAgICAgICAgaWYgKGxvZ29JbWcubmF0dXJhbEhlaWdodCAmJiBsb2dvSW1nLm5hdHVyYWxIZWlnaHQgPiBsb2dvT3JpZ01heEhlaWdodCkge1xuICAgICAgICAgICAgICAgIGxvZ29IZWlnaHRzUmF0aW8gPSBsb2dvSW1nLm5hdHVyYWxIZWlnaHQgLyBsb2dvT3JpZ01heEhlaWdodFxuICAgICAgICAgICAgICAgIGxvZ29XaWR0aCA9IGxvZ29JbWcubmF0dXJhbFdpZHRoIC8gbG9nb0hlaWdodHNSYXRpb1xuICAgICAgICAgICAgICAgIGxvZ29JbWcud2lkdGggPSBsb2dvSW1nLnN0eWxlLndpZHRoID0gbG9nb05ld1dpZHRoID0gbG9nb1dpZHRoXG4gICAgICAgICAgICAgICAgbG9nb0ltZy5oZWlnaHQgPSBsb2dvSW1nLnN0eWxlLmhlaWdodCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvT3JpZ01heEhlaWdodFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxvZ29JbWcubmF0dXJhbEhlaWdodCkge1xuICAgICAgICAgICAgICAgIGxvZ29JbWcud2lkdGggPSBsb2dvSW1nLnN0eWxlLndpZHRoID0gbG9nb05ld1dpZHRoID0gbG9nb0ltZy5uYXR1cmFsV2lkdGhcbiAgICAgICAgICAgICAgICBsb2dvSW1nLmhlaWdodCA9IGxvZ29JbWcuc3R5bGUuaGVpZ2h0ID0gbG9nb05ld0hlaWdodCA9IGxvZ29JbWcubmF0dXJhbEhlaWdodFxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvZ29JbWcud2lkdGggPSBsb2dvSW1nLmhlaWdodCA9IGxvZ29JbWcuc3R5bGUud2lkdGggPSBsb2dvSW1nLnN0eWxlLmhlaWdodCA9IGxvZ29OZXdXaWR0aCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvT3JpZ01heEhlaWdodFxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJykgJiYgaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSkge1xuICAgICAgICAgICAgICAgIGxvZ29TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICAgICAgICAgICAgICBsb2dvU3R5bGUuaW5uZXJIVE1MID1cbiAgICAgICAgICAgICAgICAgICcjJyArIGxvZ29JbWcuaWQgKyAnIHt3aWR0aCA6ICcgKyBsb2dvTmV3V2lkdGggKyAncHggIWltcG9ydGFudDsgaGVpZ2h0IDogJyArIGxvZ29OZXdIZWlnaHQgKyAncHggIWltcG9ydGFudDt9J1xuICAgICAgICAgICAgICAgIGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQobG9nb1N0eWxlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IE9yaWdpbmFsIExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28gRGltZW5zaW9ucyA9ICcgKyBsb2dvTmV3V2lkdGggKyAnIHggJyArIGxvZ29OZXdIZWlnaHQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNvbG9yKSB7XG4gICAgICAgICAgICB0ZXh0QmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvclxuICAgICAgICAgICAgYmFubmVyQmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvclxuICAgICAgICAgICAgaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChmb3JtQnV0dG9uU3R5bGUpXG4gICAgICAgICAgfVxuICAgICAgICAgIG1haW5UaXRsZS5pbm5lckhUTUwgPSBta3RvTWFpblRleHRcbiAgICAgICAgICBzdWJUaXRsZS5pbm5lckhUTUwgPSBta3RvU3ViVGV4dFxuICAgICAgICAgIGlzTWt0b09yaWdSZXBsYWNlZCA9IGlzTWt0b0ZyZWVGb3JtID0gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIChpc01rdG9CdXR0b25SZXBsYWNlZCAmJlxuICAgICAgICAgICAgLy8mJiBpc01rdG9TdWJUZXh0UmVwbGFjZWRcbiAgICAgICAgICAgIC8vJiYgaXNNa3RvVGV4dFJlcGxhY2VkXG4gICAgICAgICAgICBpc01rdG9IZXJvQmdJbWdSZXBsYWNlZCAmJlxuICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgJiZcbiAgICAgICAgICAgIGlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkKSB8fFxuICAgICAgICAgIGlzTWt0b09yaWdSZXBsYWNlZFxuICAgICAgICApIHtcbiAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBpc0xhbmRpbmdQYWdlRWRpdG9yID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChhY3Rpb24gPT0gJ2VkaXQnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBEZXNpZ25lcicpXG4gICAgICAgIGlmIChcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fCBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBMYW5kaW5nIFBhZ2UgRGVza3RvcCBEZXNpZ25lciA9ICcgKyBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzRGVza3RvcFJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChkZXNrdG9wUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGlzTWt0b0ZyZWVGb3JtICYmXG4gICAgICAgICAgIWlzUGhvbmVSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8IHBob25lUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBGcmVlZm9ybSBMYW5kaW5nIFBhZ2UgUGhvbmUgRGVzaWduZXIgPSAnICsgcGhvbmVSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNQaG9uZVJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChwaG9uZVByZXZSZWFkeSkge1xuICAgICAgICAgICAgcGhvbmVSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgKCFpc01rdG9GcmVlRm9ybSAmJlxuICAgICAgICAgICAgaXNEZXNrdG9wUmVwbGFjZWQgJiZcbiAgICAgICAgICAgICFkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLmlubmVySFRNTCkgfHxcbiAgICAgICAgICAoaXNNa3RvRnJlZUZvcm0gJiYgaXNQaG9uZVJlcGxhY2VkICYmIGlzRGVza3RvcFJlcGxhY2VkKVxuICAgICAgICApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgSW50ZXJ2YWwgaXMgQ2xlYXJlZCcpXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNMYW5kaW5nUGFnZUVkaXRvcilcbiAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PSAncHJldmlldycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIFByZXZpZXdlcicpXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhaXNEZXNrdG9wUmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fCBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBMYW5kaW5nIFBhZ2UgRGVza3RvcCBQcmV2aWV3ID0gJyArIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNEZXNrdG9wUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlc2t0b3BQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWlzUGhvbmVSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8IHBob25lUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhPdGhlclJlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IExhbmRpbmcgUGFnZSBQaG9uZSBQcmV2aWV3ID0gJyArIHBob25lUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzUGhvbmVSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAocGhvbmVQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIHBob25lUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBob25lUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc1NpZGVCeVNpZGVEZXNrdG9wUmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8XG4gICAgICAgICAgICBzaWRlQnlTaWRlRGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPj0gbWF4T3RoZXJSZXBlYXRSZWFkeVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBMYW5kaW5nIFBhZ2UgU2lkZSBieSBTaWRlIERlc2t0b3AgUHJldmlldyA9ICcgKyBzaWRlQnlTaWRlRGVza3RvcFJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc1NpZGVCeVNpZGVEZXNrdG9wUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZGVCeVNpZGVEZXNrdG9wUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBzaWRlQnlTaWRlRGVza3RvcFJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzaWRlQnlTaWRlRGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhaXNTaWRlQnlTaWRlUGhvbmVSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgb3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHxcbiAgICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVJlcGVhdFJlYWR5Q291bnQgPj0gbWF4T3RoZXJSZXBlYXRSZWFkeVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBMYW5kaW5nIFBhZ2UgU2lkZSBieSBTaWRlIFBob25lIFByZXZpZXcgPSAnICsgc2lkZUJ5U2lkZVBob25lUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzU2lkZUJ5U2lkZVBob25lUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZGVCeVNpZGVQaG9uZVByZXZSZWFkeSkge1xuICAgICAgICAgICAgc2lkZUJ5U2lkZVBob25lUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzaWRlQnlTaWRlUGhvbmVQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzU2lkZUJ5U2lkZVBob25lUmVwbGFjZWQgJiYgaXNTaWRlQnlTaWRlRGVza3RvcFJlcGxhY2VkICYmIGlzUGhvbmVSZXBsYWNlZCAmJiBpc0Rlc2t0b3BSZXBsYWNlZCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBJbnRlcnZhbCBpcyBDbGVhcmVkJylcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0xhbmRpbmdQYWdlRWRpdG9yKVxuICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAwKVxuICB9LFxuXG4gIGdldFByb2dyYW1Bc3NldERldGFpbHM6IGZ1bmN0aW9uIChwcm9ncmFtQ29tcElkKSB7XG4gICAgbGV0IHJlc3VsdCA9IExJQi53ZWJSZXF1ZXN0KFxuICAgICAgJy9tYXJrZXRpbmdFdmVudC9nZXRMb2NhbEFzc2V0RGV0YWlscycsXG4gICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAnJmNvbXBJZD0nICtcbiAgICAgIHByb2dyYW1Db21wSWQgK1xuICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICdQT1NUJyxcbiAgICAgIGZhbHNlLFxuICAgICAgJycsXG4gICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHJlc3BvbnNlICYmXG4gICAgICAgICAgcmVzcG9uc2UuSlNPTlJlc3VsdHMgJiZcbiAgICAgICAgICByZXNwb25zZS5KU09OUmVzdWx0cy5sb2NhbEFzc2V0SW5mbyAmJlxuICAgICAgICAgIChyZXNwb25zZS5KU09OUmVzdWx0cy5sb2NhbEFzc2V0SW5mby5zbWFydENhbXBhaWducyB8fFxuICAgICAgICAgICAgKHJlc3BvbnNlLkpTT05SZXN1bHRzLmxvY2FsQXNzZXRJbmZvLmFzc2V0TGlzdFswXSAmJiByZXNwb25zZS5KU09OUmVzdWx0cy5sb2NhbEFzc2V0SW5mby5hc3NldExpc3RbMF0udHJlZSkpXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiByZXNwb25zZS5KU09OUmVzdWx0cy5sb2NhbEFzc2V0SW5mb1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICBnZXRQcm9ncmFtU2V0dGluZ3M6IGZ1bmN0aW9uIChwcm9ncmFtVHJlZU5vZGUpIHtcbiAgICBsZXQgcmVzdWx0ID0gTElCLndlYlJlcXVlc3QoXG4gICAgICAnL21hcmtldGluZ0V2ZW50L2dldFByb2dyYW1TZXR0aW5nc0RhdGEnLFxuICAgICAgJyZzdGFydD0wJyArXG4gICAgICAnJnF1ZXJ5PScgK1xuICAgICAgJyZjb21wSWQ9JyArXG4gICAgICBwcm9ncmFtVHJlZU5vZGUuY29tcElkICtcbiAgICAgICcmY29tcFR5cGU9JyArXG4gICAgICBwcm9ncmFtVHJlZU5vZGUuY29tcFR5cGUgK1xuICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICdQT1NUJyxcbiAgICAgIGZhbHNlLFxuICAgICAgJycsXG4gICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcbiAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sXG5cbiAgZ2V0VGFnczogZnVuY3Rpb24gKCkge1xuICAgIGxldCByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICcvbWFya2V0aW5nRXZlbnQvZ2V0QWxsRGVzY3JpcHRvcnMnLFxuICAgICAgJyZzdGFydD0wJyArICcmeHNyZklkPScgKyBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICdQT1NUJyxcbiAgICAgIGZhbHNlLFxuICAgICAgJycsXG4gICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgICBsZXQgY3VyclRhZyxcbiAgICAgICAgICAgIGpqID0gMCxcbiAgICAgICAgICAgIGN1c3RvbVRhZ3MgPSBbXVxuICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCByZXNwb25zZS5kYXRhLmRlc2NyaXB0b3JzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgY3VyclRhZyA9IHJlc3BvbnNlLmRhdGEuZGVzY3JpcHRvcnNbaWldXG4gICAgICAgICAgICBpZiAoY3VyclRhZy50eXBlICE9ICdjaGFubmVsJykge1xuICAgICAgICAgICAgICBjdXN0b21UYWdzW2pqXSA9IGN1cnJUYWdcbiAgICAgICAgICAgICAgamorK1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY3VzdG9tVGFnc1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICBhcHBseU1hc3NDbG9uZTogZnVuY3Rpb24gKE9CSiwgZm9yY2VSZWxvYWQpIHtcbiAgICBjb25zb2xlLmxvZygnPiBBcHBseWluZzogTWFzcyBDbG9uZSBNZW51IEl0ZW0nKVxuICAgIGxldCBtYXNzQ2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy50cmlnZ2VyZWRGcm9tID09ICd0cmVlJyAmJiB0aGlzLmdldCgnbmV3TG9jYWxBc3NldCcpKSB7XG4gICAgICAgIGxldCBtYXNzQ2xvbmVJdGVtID0gdGhpcy5nZXQoJ25ld0xvY2FsQXNzZXQnKS5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgIG1hc3NDbG9uZUl0ZW1JZCA9ICdjbG9uZVZlcnRpY2FsJyxcbiAgICAgICAgICBjdXJyRXhwTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5pZClcblxuICAgICAgICBpZiAoIXRoaXMuZ2V0KG1hc3NDbG9uZUl0ZW1JZCkpIHtcbiAgICAgICAgICBtYXNzQ2xvbmVJdGVtLml0ZW1JZCA9IG1hc3NDbG9uZUl0ZW1JZFxuICAgICAgICAgIG1hc3NDbG9uZUl0ZW0udGV4dCA9ICdNYXNzIENsb25lJ1xuICAgICAgICAgIG1hc3NDbG9uZUl0ZW0uc2V0SGFuZGxlcihmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGxldCBjbG9uZUZvcm0gPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgY2xvbmVGcm9tRmllbGQgPSBjbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBGcm9tJylbMF0uY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQgPSBjbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXRGaWVsZCA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe1xuICAgICAgICAgICAgICAgIGNsb25lRnJvbUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wSWQsXG4gICAgICAgICAgICAgICAgY2xvbmVOYW1lOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0LFxuICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmFtZScpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHRhZ05hbWVGaWVsZCA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe1xuICAgICAgICAgICAgICAgIGNsb25lRnJvbUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wSWQsXG4gICAgICAgICAgICAgICAgY2xvbmVOYW1lOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0LFxuICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2xvbmUgVG8nKVswXVxuICAgICAgICAgICAgICAgIC5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0gPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtjdXJyTm9kZTogdGhpcy5vd25lckN0LmN1cnJOb2RlfSksXG4gICAgICAgICAgICAgIGN1c3RvbVRhZ3MsXG4gICAgICAgICAgICAgIGN1cnJDdXN0b21UYWcsXG4gICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdOYW1lLFxuICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnVmFsdWVcbiAgICAgICAgICAgIGVsLnBhcmVudE1lbnUuaGlkZSh0cnVlKVxuXG4gICAgICAgICAgICBsZXQgaXNDbG9uZVZlcnRpY2FsRm9ybSA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5idXR0b25zWzFdICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5idXR0b25zWzFdLnNldEhhbmRsZXIgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbm5lbCcpWzBdICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5uZWwnKVswXS5kZXN0cm95ICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0Rlc2NyaXB0aW9uJylbMF0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnRGVzY3JpcHRpb24nKVswXS5kZXN0cm95ICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ1Byb2dyYW0gVHlwZScpWzBdICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ1Byb2dyYW0gVHlwZScpWzBdLmRlc3Ryb3kgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2FtcGFpZ24gRm9sZGVyJylbMF0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2FtcGFpZ24gRm9sZGVyJylbMF0uZmllbGRMYWJlbCAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdOYW1lJylbMF0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmFtZScpWzBdLmZpZWxkTGFiZWwgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLml0ZW1zLmxhc3QoKS5zZXRUZXh0ICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pdGVtcy5sYXN0KCkuc2V0VmlzaWJsZSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2V0V2lkdGggJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLnNldEhlaWdodFxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0Nsb25lVmVydGljYWxGb3JtKVxuXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5zZXRUaXRsZSgnTWFzcyBDbG9uZScpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5idXR0b25zWzFdLnNldFRleHQoJ0Nsb25lJylcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmJ1dHRvbnNbMV0uY3Vyck5vZGUgPSBtYXNzQ2xvbmVGb3JtLmN1cnJOb2RlXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5uZWwnKVswXS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnRGVzY3JpcHRpb24nKVswXS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUHJvZ3JhbSBUeXBlJylbMF0uZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0NhbXBhaWduIEZvbGRlcicpWzBdLmZpZWxkTGFiZWwgPSAnQ2xvbmUgVG8nXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ05hbWUnKVswXS5maWVsZExhYmVsID0gJ1Byb2dyYW0gU3VmZml4J1xuXG4gICAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQuZmllbGRMYWJlbCA9ICdTaG93IE1vcmUgT3B0aW9ucydcbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5pdGVtQ2xzID0gJydcbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLnNldCgndGV4dCcsICdObycpXG4gICAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQuc3RvcmUuZGF0YS5pdGVtc1sxXS5zZXQoJ3RleHQnLCAnWWVzJylcblxuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLmZpZWxkTGFiZWwgPSAnU0MgQWN0aXZhdGlvbiBTdGF0ZSdcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5pdGVtQ2xzID0gJydcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLnNldCgndGV4dCcsICdJbmhlcml0IFN0YXRlJylcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzFdLnNldCgndGV4dCcsICdGb3JjZSBBY3RpdmF0ZScpXG5cbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5maWVsZExhYmVsID0gJ1BlcmlvZCBDb3N0IERhdGEnXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQuaXRlbUNscyA9ICcnXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQuc3RvcmUuZGF0YS5pdGVtc1swXS5zZXQoJ3RleHQnLCAnSW5oZXJpdCBEYXRhJylcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzFdLnNldCgndGV4dCcsICdCYXNlbGluZSBEYXRhJylcblxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLmZpZWxkTGFiZWwgPSAnUGVyaW9kIENvc3QgTW9udGhzJ1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLml0ZW1DbHMgPSAnbWt0UmVxdWlyZWQnXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQuc3RvcmUuZGF0YS5pdGVtc1swXS5zZXQoJ3RleHQnLCAnMTIgTW9udGhzJylcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzFdLnNldCgndGV4dCcsICcyNCBNb250aHMnKVxuXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldEZpZWxkLmZpZWxkTGFiZWwgPSAnUGVyaW9kIENvc3QgT2Zmc2V0J1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXRGaWVsZC5pdGVtQ2xzID0gJydcblxuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5maWVsZExhYmVsID0gJ0NoYW5nZSBUYWcgVHlwZSdcbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQuaXRlbUNscyA9ICcnXG5cbiAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLmZpZWxkTGFiZWwgPSAnTmV3IFRhZyBWYWx1ZSdcbiAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLml0ZW1DbHMgPSAnbWt0UmVxdWlyZWQnXG5cbiAgICAgICAgICAgICAgICBsZXQgb3JpZ09uU2VsZWN0ID0gc2hvd01vcmVPcHRpb25zRmllbGQub25TZWxlY3RcbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5vblNlbGVjdCA9IGZ1bmN0aW9uIChkb0ZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICBvcmlnT25TZWxlY3QuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdTQyBBY3RpdmF0aW9uIFN0YXRlJylbMF0ubGFiZWwuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdTQyBBY3RpdmF0aW9uIFN0YXRlJylbMF0uc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBEYXRhJylbMF0ubGFiZWwuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBEYXRhJylbMF0uc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdDaGFuZ2UgVGFnIFR5cGUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5nZSBUYWcgVHlwZScpWzBdLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1NDIEFjdGl2YXRpb24gU3RhdGUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdTQyBBY3RpdmF0aW9uIFN0YXRlJylbMF0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgRGF0YScpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IERhdGEnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdDaGFuZ2UgVGFnIFR5cGUnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdDaGFuZ2UgVGFnIFR5cGUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5vblNlbGVjdCA9IGZ1bmN0aW9uIChkb0ZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICBvcmlnT25TZWxlY3QuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgT2Zmc2V0JylbMF0ubGFiZWwuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQub25TZWxlY3QgPSBmdW5jdGlvbiAoZG9Gb2N1cykge1xuICAgICAgICAgICAgICAgICAgb3JpZ09uU2VsZWN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ05ldyBUYWcgVmFsdWUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ05ldyBUYWcgVmFsdWUnKVswXS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdOZXcgVGFnIFZhbHVlJylbMF0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmV3IFRhZyBWYWx1ZScpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQoMCwgY2xvbmVGcm9tRmllbGQpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQobWFzc0Nsb25lRm9ybS5pdGVtcy5sZW5ndGggLSAxLCBzaG93TW9yZU9wdGlvbnNGaWVsZClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHNjQWN0aXZhdGlvbkZpZWxkKVxuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQobWFzc0Nsb25lRm9ybS5pdGVtcy5sZW5ndGggLSAxLCBwZXJpb2RDb3N0Q2xvbmVGaWVsZClcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgcGVyaW9kQ29zdE1vbnRoRmllbGQpXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHBlcmlvZENvc3RPZmZzZXRGaWVsZClcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0RmllbGQuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHRhZ05hbWVGaWVsZClcbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHRhZ1ZhbHVlRmllbGQpXG4gICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5idXR0b25zWzFdLnNldEhhbmRsZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgbGV0IHdhaXRNc2cgPSBuZXcgRXh0LldpbmRvdyh7XG4gICAgICAgICAgICAgICAgICAgIGNsb3NhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtb2RhbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDUyMCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAyMjUsXG4gICAgICAgICAgICAgICAgICAgIGNsczogJ21rdE1vZGFsRm9ybScsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnUGxlYXNlIFdhaXQgLi4uJyxcbiAgICAgICAgICAgICAgICAgICAgaHRtbDpcbiAgICAgICAgICAgICAgICAgICAgICAnPGI+TWFzcyBDbG9uaW5nOjwvYj4gIDxpPicgK1xuICAgICAgICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uY3Vyck5vZGUudGV4dCArXG4gICAgICAgICAgICAgICAgICAgICAgJzwvaT48YnI+PGJyPlRoaXMgbWF5IHRha2Ugc2V2ZXJhbCBtaW51dGVzIGRlcGVuZGluZyBvbiB0aGUgcXVhbnRpdHkgb2YgcHJvZ3JhbXMgYW5kIGFzc2V0cyBjb250YWluZWQgdGhlcmVpbi4nXG4gICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgY2xvbmVUb0ZvbGRlcklkID0gbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF0uZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgY2xvbmVUb1N1ZmZpeCA9IG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdQcm9ncmFtIFN1ZmZpeCcpWzBdLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIGNsb25lVG9UcmVlTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKGNsb25lVG9Gb2xkZXJJZCksXG4gICAgICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvblN0YXRlID0gc2NBY3RpdmF0aW9uRmllbGQuZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lID0gcGVyaW9kQ29zdENsb25lRmllbGQuZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldCA9IHBlcmlvZENvc3RPZmZzZXRGaWVsZC5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICB0YWdOYW1lID0gdGFnTmFtZUZpZWxkLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIHRhZ1ZhbHVlID0gdGFnVmFsdWVGaWVsZC5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGUsXG4gICAgICAgICAgICAgICAgICAgIGluaGVyaXRQZXJpb2RDb3N0LFxuICAgICAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGgsXG4gICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyxcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICB3YWl0TXNnU2hvd1xuXG4gICAgICAgICAgICAgICAgICBpZiAoc2NBY3RpdmF0aW9uU3RhdGUgPT0gMikge1xuICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGUgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAocGVyaW9kQ29zdENsb25lID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3QgPSB0cnVlXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aCA9IHBlcmlvZENvc3RNb250aEZpZWxkLmdldFZhbHVlKClcblxuICAgICAgICAgICAgICAgICAgICBpZiAocGVyaW9kQ29zdE1vbnRoID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMgPSAxMlxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBlcmlvZENvc3RNb250aCA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID0gMjRcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMgPSAwXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTnVtYmVyKHBhcnNlSW50KHBlcmlvZENvc3RPZmZzZXQpKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXQgPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5jbG9zZSgpXG4gICAgICAgICAgICAgICAgICB3YWl0TXNnU2hvdyA9IHdhaXRNc2cuc2hvdygpXG4gICAgICAgICAgICAgICAgICBPQkouaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ01hc3MgQ2xvbmUnLFxuICAgICAgICAgICAgICAgICAgICBhc3NldE5hbWU6ICdUb29sJ1xuICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgbGV0IGlzV2FpdE1zZ1Nob3cgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAod2FpdE1zZ1Nob3cpIHtcbiAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc1dhaXRNc2dTaG93KVxuICAgICAgICAgICAgICAgICAgICAgIGxldCBjdXJyVHJlZU5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9uZUZvbGRlclJlc3BvbnNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZVxuXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKF90aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXNzIENsb25lIEAgRm9sZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IF90aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY2hpbGRyZW4gJiYgaWkgPCBfdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNoaWxkcmVuLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyVHJlZU5vZGUgPSBfdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNoaWxkcmVuW2lpXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyVHJlZU5vZGUuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIEZvbGRlciB3aXRoIEZvbGRlciBjaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lRm9sZGVyUmVzcG9uc2UgPSBMSUIuY2xvbmVGb2xkZXIoY3VyclRyZWVOb2RlLnRleHQsIGNsb25lVG9TdWZmaXgsIGNsb25lVG9Gb2xkZXJJZClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZUZvbGRlclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqaiA9IDA7IGN1cnJUcmVlTm9kZS5jaGlsZHJlbiAmJiBqaiA8IGN1cnJUcmVlTm9kZS5jaGlsZHJlbi5sZW5ndGg7IGpqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJUcmVlTm9kZS5jaGlsZHJlbltqal0uY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIEZvbGRlciB3aXRoIEZvbGRlciBkZXB0aCBvZiAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJGb2xkZXJUcmVlTm9kZSA9IGN1cnJUcmVlTm9kZS5jaGlsZHJlbltqal1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lRm9sZGVyUmVzcG9uc2UgPSBMSUIuY2xvbmVGb2xkZXIoY3VyckZvbGRlclRyZWVOb2RlLnRleHQsIGNsb25lVG9TdWZmaXgsIGN1cnJGb2xkZXJUcmVlTm9kZS5pZClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZUZvbGRlclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGVcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2sgPSAwOyBjdXJyRm9sZGVyVHJlZU5vZGUuY2hpbGRyZW4gJiYga2sgPCBjdXJyRm9sZGVyVHJlZU5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBraysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlID0gY3VyckZvbGRlclRyZWVOb2RlLmNoaWxkcmVuW2trXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlID0gTElCLmNsb25lUHJvZ3JhbShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVRvU3VmZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lRm9sZGVyUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGluaGVyaXRQZXJpb2RDb3N0IHx8IG51bU9mUGVyaW9kQ29zdE1vbnRocyA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVQZXJpb2RDb3N0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludChwZXJpb2RDb3N0T2Zmc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcElkOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcFR5cGU6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiYgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJiB0YWdOYW1lICYmIHRhZ1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVRhZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVOdXJ0dXJlQ2FkZW5jZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmNsb25lU21hcnRDYW1wYWlnblN0YXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtUmVwb3J0RmlsdGVyKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3MgQ2xvbmUgQCBGb2xkZXIgd2l0aCBGb2xkZXIgZGVwdGggb2YgMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlID0gY3VyclRyZWVOb2RlLmNoaWxkcmVuW2pqXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UgPSBMSUIuY2xvbmVQcm9ncmFtKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVUb1N1ZmZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lRm9sZGVyUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3MoY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpbmhlcml0UGVyaW9kQ29zdCB8fCBudW1PZlBlcmlvZENvc3RNb250aHMgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZVBlcmlvZENvc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQocGVyaW9kQ29zdE9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wSWQ6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBUeXBlOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJiBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmIHRhZ05hbWUgJiYgdGFnVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1UYWcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZU51cnR1cmVDYWRlbmNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmNsb25lU21hcnRDYW1wYWlnblN0YXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVJlcG9ydEZpbHRlcihnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIEZvbGRlciB3aXRoIFByb2dyYW0gY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUgPSBjdXJyVHJlZU5vZGVcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlID0gTElCLmNsb25lUHJvZ3JhbShjbG9uZVRvU3VmZml4LCBjbG9uZVRvRm9sZGVySWQsIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lUHJvZ3JhbVJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5oZXJpdFBlcmlvZENvc3QgfHwgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVQZXJpb2RDb3N0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHBlcmlvZENvc3RPZmZzZXQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaGVyaXRQZXJpb2RDb3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcElkOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wVHlwZTogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiYgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJiB0YWdOYW1lICYmIHRhZ1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtVGFnKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ1ZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVOdXJ0dXJlQ2FkZW5jZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSA9IExJQi5jbG9uZVNtYXJ0Q2FtcGFpZ25TdGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1SZXBvcnRGaWx0ZXIoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3MgQ2xvbmUgQCBQcm9ncmFtXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUgPSBfdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlID0gTElCLmNsb25lUHJvZ3JhbShjbG9uZVRvU3VmZml4LCBjbG9uZVRvRm9sZGVySWQsIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyhjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5oZXJpdFBlcmlvZENvc3QgfHwgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lUGVyaW9kQ29zdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHBlcmlvZENvc3RPZmZzZXQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBJZDogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wVHlwZTogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiYgdGFnTmFtZSAmJiB0YWdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtVGFnKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lTnVydHVyZUNhZGVuY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmNsb25lU21hcnRDYW1wYWlnblN0YXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1SZXBvcnRGaWx0ZXIoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIExJQi5yZWxvYWRNYXJrZXRpbmdBY3Rpdml0ZXMoKVxuICAgICAgICAgICAgICAgICAgICAgIHdhaXRNc2cuY2xvc2UoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLnNob3coKVxuICAgICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkLm9uU2VsZWN0KHNob3dNb3JlT3B0aW9uc0ZpZWxkLmZpbmRSZWNvcmQoJ3RleHQnLCAnTm8nKSlcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5vblNlbGVjdChzY0FjdGl2YXRpb25GaWVsZC5maW5kUmVjb3JkKCd0ZXh0JywgJ0luaGVyaXQgU3RhdGUnKSlcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5vblNlbGVjdChwZXJpb2RDb3N0Q2xvbmVGaWVsZC5maW5kUmVjb3JkKCd0ZXh0JywgJ0luaGVyaXQgRGF0YScpKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2V0V2lkdGgoNTI1KVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2V0SGVpZ2h0KDU2MClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLml0ZW1zLmxhc3QoKS5zZXRUZXh0KCdQcm9ncmFtcyB0aGF0IGhhdmUgYSBmb2xkZXIgZGVwdGggZ3JlYXRlciB0aGFuIDIgd2lsbCBub3QgYmUgY2xvbmVkLicpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pdGVtcy5sYXN0KCkuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5sYWJlbC5kb20uaW5uZXJIVE1MID0gJyZuYnNwOyZuYnNwOyZuYnNwOyBNb250aHM6J1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldEZpZWxkLmxhYmVsLmRvbS5pbm5lckhUTUwgPSAnJm5ic3A7Jm5ic3A7Jm5ic3A7IENvc3QgT2Zmc2V0ICgrLy0pOidcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0RmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLmxhYmVsLmRvbS5pbm5lckhUTUwgPSAnJm5ic3A7Jm5ic3A7Jm5ic3A7IE5ldyBUYWcgVmFsdWU6J1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBjdXN0b21UYWdzID0gTElCLmdldFRhZ3MoKVxuICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdOYW1lID0gdGFnTmFtZUZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMF0uY29weSgwKVxuICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdWYWx1ZSA9IHRhZ1ZhbHVlRmllbGQuc3RvcmUuZGF0YS5pdGVtc1swXS5jb3B5KDApXG4gICAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkLnN0b3JlLnJlbW92ZUFsbCh0cnVlKVxuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQuc3RvcmUucmVtb3ZlQWxsKHRydWUpXG4gICAgICAgICAgICAgICAgbGV0IGlzQ3VzdG9tVGFncyA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoY3VzdG9tVGFncykge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0N1c3RvbVRhZ3MpXG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGN1c3RvbVRhZ3MubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZyA9IGN1c3RvbVRhZ3NbaWldXG4gICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ05hbWUgPSBjdXJyQ3VzdG9tVGFnTmFtZS5jb3B5KGN1cnJDdXN0b21UYWcubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnTmFtZS5zZXQoJ3RleHQnLCBjdXJyQ3VzdG9tVGFnLm5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ05hbWUuZGF0YS5pZCA9IGN1cnJDdXN0b21UYWcubmFtZVxuICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5zdG9yZS5hZGQoY3VyckN1c3RvbVRhZ05hbWUpXG5cbiAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqaiA9IDA7IGpqIDwgY3VyckN1c3RvbVRhZy52YWx1ZXMubGVuZ3RoOyBqaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnVmFsdWUgPSBjdXJyQ3VzdG9tVGFnVmFsdWUuY29weShjdXJyQ3VzdG9tVGFnLnZhbHVlc1tqal0udmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnVmFsdWUuc2V0KCd0ZXh0JywgY3VyckN1c3RvbVRhZy52YWx1ZXNbampdLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ1ZhbHVlLmRhdGEuaWQgPSBjdXJyQ3VzdG9tVGFnLnZhbHVlc1tqal0udmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQuc3RvcmUuYWRkKGN1cnJDdXN0b21UYWdWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAwKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5nZXQobWFzc0Nsb25lSXRlbUlkKSkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICh0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInICYmXG4gICAgICAgICAgICAgICF0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMubWFya2V0aW5nUHJvZ3JhbUlkICYmXG4gICAgICAgICAgICAgIGN1cnJFeHBOb2RlICYmXG4gICAgICAgICAgICAgIGN1cnJFeHBOb2RlLmlzRXhwYW5kYWJsZSgpKSB8fFxuICAgICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgUHJvZ3JhbScgfHxcbiAgICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJyB8fFxuICAgICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRXZlbnQnIHx8XG4gICAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ0VtYWlsIEJhdGNoIFByb2dyYW0nIHx8XG4gICAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ0luLUFwcCBQcm9ncmFtJ1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgaWYgKGZvcmNlUmVsb2FkKSB7XG4gICAgICAgICAgICAgIHRoaXMuZ2V0KG1hc3NDbG9uZUl0ZW1JZCkuZGVzdHJveSgpXG4gICAgICAgICAgICAgIHRoaXMuYWRkSXRlbShtYXNzQ2xvbmVJdGVtKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5nZXQobWFzc0Nsb25lSXRlbUlkKS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0KG1hc3NDbG9uZUl0ZW1JZCkuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgKHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgJiZcbiAgICAgICAgICAgICF0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMubWFya2V0aW5nUHJvZ3JhbUlkICYmXG4gICAgICAgICAgICBjdXJyRXhwTm9kZSAmJlxuICAgICAgICAgICAgY3VyckV4cE5vZGUuaXNFeHBhbmRhYmxlKCkpIHx8XG4gICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgUHJvZ3JhbScgfHxcbiAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScgfHxcbiAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBFdmVudCcgfHxcbiAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ0VtYWlsIEJhdGNoIFByb2dyYW0nIHx8XG4gICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdJbi1BcHAgUHJvZ3JhbSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy5hZGRJdGVtKG1hc3NDbG9uZUl0ZW0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdFeHQubWVudS5NZW51LnByb3RvdHlwZS5zaG93QXQnKSkge1xuICAgICAgY29uc29sZS5sb2coJz4gRXhlY3V0aW5nOiBBcHBseWluZyBNYXNzIENsb25lIE1lbnUgSXRlbScpXG4gICAgICBpZiAoIW9yaWdNZW51U2hvd0F0RnVuYykge1xuICAgICAgICBvcmlnTWVudVNob3dBdEZ1bmMgPSBFeHQubWVudS5NZW51LnByb3RvdHlwZS5zaG93QXRcbiAgICAgIH1cblxuICAgICAgRXh0Lm1lbnUuTWVudS5wcm90b3R5cGUuc2hvd0F0ID0gZnVuY3Rpb24gKHh5LCBwYXJlbnRNZW51KSB7XG4gICAgICAgIG1hc3NDbG9uZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpIC8vVE9ETyBjaGFuZ2VzIGhlcmUgSHVudGVyXG4gICAgICAgIG9yaWdNZW51U2hvd0F0RnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCc+IFNraXBwaW5nOiBBcHBseWluZyBNYXNzIENsb25lIE1lbnUgSXRlbScpXG4gICAgfVxuICB9LFxuXG4gIC8qXG4gICogIFRoaXMgZnVuY3Rpb24gYWRkcyBhIHJpZ2h0LWNsaWNrIG1lbnUgaXRlbSB0aGF0IHBlcmZvcm1zIGEgbWFzcyBjbG9uZSBvZiBhbGxcbiAgKiAgUHJvZ3JhbXMgZnJvbSB0aGUgc2VsZWN0ZWQgcm9vdCBmb2xkZXIgdGhhdCBoYXZlIGEgZm9sZGVyIGRlcHRoIGxldmVsIDEgb3IgbGVzczpcbiAgKiAgICBDbG9uZXMgdGhlIGZvbGRlciBzdHJ1Y3R1cmVcbiAgKiAgICBDbG9uZXMgYWxsIFByb2dyYW1zXG4gICogICAgU2V0cyBQZXJpb2QgQ29zdHMgZm9yIHRoZSBuZXh0IDI0IG1vbnRocyB1c2luZyB0aGUgc291cmNlIFByb2dyYW0ncyBmaXJzdCBDb3N0XG4gICogICAgU2V0cyB0aGUgVmVydGljYWwgVGFnIHVzaW5nIHRoZSBuYW1lIG9mIHRoZSBkZXN0aW5hdGlvbiBmb2xkZXJcbiAgKiAgICBDbG9uZXMgdGhlIFN0cmVhbSBDYWRlbmNlcyB1c2luZyB0aGUgc291cmNlIE51cnR1cmUgUHJvZ3JhbVxuICAqICAgIENsb25lcyB0aGUgYWN0aXZhdGlvbiBzdGF0ZSBvZiB0cmlnZ2VyIFNtYXJ0IENhbXBhaWduc1xuICAqICAgIENsb25lcyB0aGUgcmVjdXJyaW5nIHNjaGVkdWxlIG9mIGJhdGNoIFNtYXJ0IENhbXBhaWduc1xuICAqICAgIFNldHMgdGhlIGFzc2V0IGZpbHRlciBmb3IgY2xvbmVkIHJlcG9ydHMgdG8gdGhlIGRlc3RpbmF0aW9uIGZvbGRlclxuICAqL1xuICBjbG9uZUZvbGRlcjogZnVuY3Rpb24gKG9yaWdGb2xkZXJOYW1lLCBjbG9uZVRvU3VmZml4LCBjbG9uZVRvRm9sZGVySWQpIHtcbiAgICBsZXQgbmV3Rm9sZGVyTmFtZSwgcmVzdWx0XG5cbiAgICBpZiAob3JpZ0ZvbGRlck5hbWUuc2VhcmNoKC9cXChbXildKlxcKSQvKSAhPSAtMSkge1xuICAgICAgbmV3Rm9sZGVyTmFtZSA9IG9yaWdGb2xkZXJOYW1lLnJlcGxhY2UoL1xcKFteKV0qXFwpJC8sICcoJyArIGNsb25lVG9TdWZmaXggKyAnKScpXG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld0ZvbGRlck5hbWUgPSBvcmlnRm9sZGVyTmFtZS50ZXh0ICsgJyAoJyArIGNsb25lVG9TdWZmaXggKyAnKSdcbiAgICB9XG5cbiAgICByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICcvZXhwbG9yZXIvY3JlYXRlUHJvZ3JhbUZvbGRlcicsXG4gICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAnJnRleHQ9JyArXG4gICAgICBuZXdGb2xkZXJOYW1lICtcbiAgICAgICcmcGFyZW50SWQ9JyArXG4gICAgICBjbG9uZVRvRm9sZGVySWQgK1xuICAgICAgJyZ0ZW1wTm9kZUlkPWV4dC0nICtcbiAgICAgIGNsb25lVG9Gb2xkZXJJZCArXG4gICAgICAnJnhzcmZJZD0nICtcbiAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgJ1BPU1QnLFxuICAgICAgZmFsc2UsXG4gICAgICAnJyxcbiAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICByZXNwb25zZSAmJlxuICAgICAgICAgIHJlc3BvbnNlLkpTT05SZXN1bHRzICYmXG4gICAgICAgICAgcmVzcG9uc2UuSlNPTlJlc3VsdHMuYXBwdmFycyAmJlxuICAgICAgICAgIHJlc3BvbnNlLkpTT05SZXN1bHRzLmFwcHZhcnMuY3JlYXRlUHJvZ3JhbUZvbGRlclJlc3VsdCA9PSAnc3VjY2VzcydcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sXG5cbiAgY2xvbmVOdXJ0dXJlQ2FkZW5jZTogZnVuY3Rpb24gKG9yaWdQcm9ncmFtQ29tcElkLCBuZXdQcm9ncmFtQ29tcElkKSB7XG4gICAgbGV0IGdldE51cnR1cmVDYWRlbmNlLCBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZSwgZ2V0TmV3TnVydHVyZUNhZGVuY2VSZXNwb25zZVxuXG4gICAgZ2V0TnVydHVyZUNhZGVuY2UgPSBmdW5jdGlvbiAocHJvZ3JhbUNvbXBJZCkge1xuICAgICAgbGV0IHByb2dyYW1GaWx0ZXIgPSBlbmNvZGVVUklDb21wb25lbnQoJ1t7XCJwcm9wZXJ0eVwiOlwiaWRcIixcInZhbHVlXCI6JyArIHByb2dyYW1Db21wSWQgKyAnfV0nKSxcbiAgICAgICAgZmllbGRzID0gZW5jb2RlVVJJQ29tcG9uZW50KCdbXCIrdHJhY2tzXCJdJyksXG4gICAgICAgIHJlc3VsdFxuXG4gICAgICByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgJy9kYXRhL251cnR1cmUvcmV0cmlldmUnLFxuICAgICAgICAnZmlsdGVyPScgKyBwcm9ncmFtRmlsdGVyICsgJyZmaWVsZHM9JyArIGZpZWxkcyArICcmeHNyZklkPScgKyBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgJ1BPU1QnLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJycsXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcblxuICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApXG5cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9XG5cbiAgICBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZSA9IGdldE51cnR1cmVDYWRlbmNlKG9yaWdQcm9ncmFtQ29tcElkKVxuICAgIGdldE5ld051cnR1cmVDYWRlbmNlUmVzcG9uc2UgPSBnZXROdXJ0dXJlQ2FkZW5jZShuZXdQcm9ncmFtQ29tcElkKVxuXG4gICAgaWYgKFxuICAgICAgZ2V0T3JpZ051cnR1cmVDYWRlbmNlUmVzcG9uc2UgJiZcbiAgICAgIGdldE5ld051cnR1cmVDYWRlbmNlUmVzcG9uc2UgJiZcbiAgICAgIGdldE9yaWdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlLmRhdGFbMF0udHJhY2tzLmxlbmd0aCA9PSBnZXROZXdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlLmRhdGFbMF0udHJhY2tzLmxlbmd0aFxuICAgICkge1xuICAgICAgbGV0IGN1cnJPcmlnU3RyZWFtLFxuICAgICAgICBjdXJyTmV3U3RyZWFtLFxuICAgICAgICBzdHJlYW1DYWRlbmNlcyA9ICdbJ1xuXG4gICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgZ2V0T3JpZ051cnR1cmVDYWRlbmNlUmVzcG9uc2UuZGF0YVswXS50cmFja3MubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIGN1cnJPcmlnU3RyZWFtID0gZ2V0T3JpZ051cnR1cmVDYWRlbmNlUmVzcG9uc2UuZGF0YVswXS50cmFja3NbaWldXG4gICAgICAgIGN1cnJOZXdTdHJlYW0gPSBnZXROZXdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlLmRhdGFbMF0udHJhY2tzW2lpXVxuXG4gICAgICAgIGlmIChpaSAhPSAwKSB7XG4gICAgICAgICAgc3RyZWFtQ2FkZW5jZXMgKz0gJywnXG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtQ2FkZW5jZXMgKz1cbiAgICAgICAgICAne1wiaWRcIjonICtcbiAgICAgICAgICBjdXJyTmV3U3RyZWFtLmlkICtcbiAgICAgICAgICAnLFwicmVjdXJyZW5jZVR5cGVcIjpcIicgK1xuICAgICAgICAgIGN1cnJPcmlnU3RyZWFtLnJlY3VycmVuY2VUeXBlICtcbiAgICAgICAgICAnXCIsXCJldmVyeU5Vbml0XCI6JyArXG4gICAgICAgICAgY3Vyck9yaWdTdHJlYW0uZXZlcnlOVW5pdCArXG4gICAgICAgICAgJyxcIndlZWtNYXNrXCI6XCInICtcbiAgICAgICAgICBjdXJyT3JpZ1N0cmVhbS53ZWVrTWFzayArXG4gICAgICAgICAgJ1wiLFwic3RhcnREYXRlXCI6XCInICtcbiAgICAgICAgICBjdXJyT3JpZ1N0cmVhbS5zdGFydERhdGUgK1xuICAgICAgICAgICdcIn0nXG4gICAgICB9XG4gICAgICBzdHJlYW1DYWRlbmNlcyArPSAnXSdcbiAgICAgIHN0cmVhbUNhZGVuY2VzID0gc3RyZWFtQ2FkZW5jZXMucmVwbGFjZSgvXCJudWxsXCIvZywgJ251bGwnKVxuXG4gICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgJy9kYXRhL251cnR1cmVUcmFjay91cGRhdGUnLFxuICAgICAgICAnZGF0YT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmVhbUNhZGVuY2VzKSArICcmeHNyZklkPScgKyBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgJ1BPU1QnLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJycsXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICB9XG4gICAgICApXG4gICAgfVxuICB9LFxuXG4gIGNsb25lUGVyaW9kQ29zdDogZnVuY3Rpb24gKG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhLCBuZXdQcm9ncmFtQ29tcElkLCBudW1PZk1vbnRocywgb2Zmc2V0LCBpbmhlcml0KSB7XG4gICAgbGV0IGN1cnJZZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpLFxuICAgICAgY3Vyck1vbnRoID0gbmV3IERhdGUoKS5nZXRNb250aCgpICsgMSxcbiAgICAgIHNldFBlcmlvZENvc3RcblxuICAgIHNldFBlcmlvZENvc3QgPSBmdW5jdGlvbiAobmV3UHJvZ3JhbUNvbXBJZCwgY29zdERhdGUsIGNvc3RBbW91bnQpIHtcbiAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAnL21hcmtldGluZ0V2ZW50L3NldENvc3RTdWJtaXQnLFxuICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAnJmNvbXBJZD0nICtcbiAgICAgICAgbmV3UHJvZ3JhbUNvbXBJZCArXG4gICAgICAgICcmY29zdElkPScgK1xuICAgICAgICAnJnR5cGU9cGVyaW9kJyArXG4gICAgICAgICcmc3RhcnREYXRlPScgK1xuICAgICAgICBjb3N0RGF0ZSArXG4gICAgICAgICcmYW1vdW50PScgK1xuICAgICAgICBjb3N0QW1vdW50LnRvU3RyaW5nKCkgK1xuICAgICAgICAnJmRlc2NyaXB0aW9uPScgK1xuICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICdQT1NUJyxcbiAgICAgICAgZmFsc2UsXG4gICAgICAgICcnLFxuICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgfVxuICAgICAgKVxuICAgIH1cblxuICAgIGlmIChpbmhlcml0ICYmIG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhKSB7XG4gICAgICBsZXQgY3VyclBlcmlvZENvc3RcblxuICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhLmxlbmd0aDsgaWkrKykge1xuICAgICAgICBjdXJyUGVyaW9kQ29zdCA9IG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhW2lpXVxuXG4gICAgICAgIGlmIChjdXJyUGVyaW9kQ29zdC5pdGVtVHlwZSA9PSAncGVyaW9kJyAmJiBjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5hbW91bnQgJiYgY3VyclBlcmlvZENvc3Quc3VtbWFyeURhdGEuc3RhcnREYXRlKSB7XG4gICAgICAgICAgdmFyIGN1cnJDb3N0TW9udGggPSBjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5zdGFydERhdGUucmVwbGFjZSgvXlswLTldWzAtOV1bMC05XVswLTldLS8sICcnKSxcbiAgICAgICAgICAgIGN1cnJDb3N0QW1vdW50ID0gY3VyclBlcmlvZENvc3Quc3VtbWFyeURhdGEuYW1vdW50LFxuICAgICAgICAgICAgY3VyckNvc3RZZWFyLFxuICAgICAgICAgICAgY3VyckNvc3REYXRlXG5cbiAgICAgICAgICBpZiAoY3VyclllYXIgPiBwYXJzZUludChjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5zdGFydERhdGUubWF0Y2goL15bMC05XVswLTldWzAtOV1bMC05XS8pKSkge1xuICAgICAgICAgICAgY3VyckNvc3RZZWFyID0gY3VyclllYXIgKyAoY3VyclllYXIgLSBwYXJzZUludChjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5zdGFydERhdGUubWF0Y2goL15bMC05XVswLTldWzAtOV1bMC05XS8pKSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VyckNvc3RZZWFyID0gcGFyc2VJbnQoY3VyclBlcmlvZENvc3Quc3VtbWFyeURhdGEuc3RhcnREYXRlLm1hdGNoKC9eWzAtOV1bMC05XVswLTldWzAtOV0vKSlcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VyckNvc3REYXRlID0gY3VyckNvc3RZZWFyLnRvU3RyaW5nKCkgKyAnLScgKyBjdXJyQ29zdE1vbnRoLnRvU3RyaW5nKClcbiAgICAgICAgICBzZXRQZXJpb2RDb3N0KG5ld1Byb2dyYW1Db21wSWQsIGN1cnJDb3N0RGF0ZSwgY3VyckNvc3RBbW91bnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFxuICAgICAgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEgJiZcbiAgICAgIG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhWzBdICYmXG4gICAgICBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YVswXS5zdW1tYXJ5RGF0YSAmJlxuICAgICAgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGFbMF0uc3VtbWFyeURhdGEuYW1vdW50XG4gICAgKSB7XG4gICAgICBpZiAoIW51bU9mTW9udGhzKSB7XG4gICAgICAgIG51bU9mTW9udGhzID0gMjRcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG51bU9mTW9udGhzOyBpaSsrKSB7XG4gICAgICAgIHZhciBjdXJyQ29zdERhdGUsIGN1cnJDb3N0QW1vdW50XG5cbiAgICAgICAgaWYgKGN1cnJNb250aCA+IDEyKSB7XG4gICAgICAgICAgY3Vyck1vbnRoID0gMVxuICAgICAgICAgIGN1cnJZZWFyKytcbiAgICAgICAgfVxuICAgICAgICBjdXJyQ29zdERhdGUgPSBjdXJyWWVhci50b1N0cmluZygpICsgJy0nICsgY3Vyck1vbnRoLnRvU3RyaW5nKClcbiAgICAgICAgY3Vyck1vbnRoKytcbiAgICAgICAgY3VyckNvc3RBbW91bnQgPSBwYXJzZUludChvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YVswXS5zdW1tYXJ5RGF0YS5hbW91bnQpXG5cbiAgICAgICAgaWYgKG9mZnNldCkge1xuICAgICAgICAgIGlmIChNYXRoLnJhbmRvbSgpIDw9IDAuNSkge1xuICAgICAgICAgICAgY3VyckNvc3RBbW91bnQgKz0gTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiBvZmZzZXQpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJDb3N0QW1vdW50IC09IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogb2Zmc2V0KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNldFBlcmlvZENvc3QobmV3UHJvZ3JhbUNvbXBJZCwgY3VyckNvc3REYXRlLCBjdXJyQ29zdEFtb3VudClcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgY2xvbmVQcm9ncmFtOiBmdW5jdGlvbiAoY2xvbmVUb1N1ZmZpeCwgY2xvbmVUb0ZvbGRlcklkLCBvcmlnUHJvZ3JhbVRyZWVOb2RlKSB7XG4gICAgbGV0IG5ld1Byb2dyYW1OYW1lLCBuZXdQcm9ncmFtVHlwZSwgcmVzdWx0XG5cbiAgICBpZiAob3JpZ1Byb2dyYW1UcmVlTm9kZS50ZXh0LnNlYXJjaCgvXFwoW14pXSpcXCkkLykgIT0gLTEpIHtcbiAgICAgIG5ld1Byb2dyYW1OYW1lID0gb3JpZ1Byb2dyYW1UcmVlTm9kZS50ZXh0LnJlcGxhY2UoL1xcKFteKV0qXFwpJC8sICcoJyArIGNsb25lVG9TdWZmaXggKyAnKScpXG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld1Byb2dyYW1OYW1lID0gb3JpZ1Byb2dyYW1UcmVlTm9kZS50ZXh0ICsgJyAoJyArIGNsb25lVG9TdWZmaXggKyAnKSdcbiAgICB9XG5cbiAgICBzd2l0Y2ggKG9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcFR5cGUpIHtcbiAgICAgIGNhc2UgJ01hcmtldGluZyBQcm9ncmFtJzpcbiAgICAgICAgbmV3UHJvZ3JhbVR5cGUgPSAncHJvZ3JhbSdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ051cnR1cmUgUHJvZ3JhbSc6XG4gICAgICAgIG5ld1Byb2dyYW1UeXBlID0gJ251cnR1cmUnXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdNYXJrZXRpbmcgRXZlbnQnOlxuICAgICAgICBuZXdQcm9ncmFtVHlwZSA9ICdldmVudCdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ0VtYWlsIEJhdGNoIFByb2dyYW0nOlxuICAgICAgICBuZXdQcm9ncmFtVHlwZSA9ICdlbWFpbEJhdGNoUHJvZ3JhbSdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ0luLUFwcCBQcm9ncmFtJzpcbiAgICAgICAgbmV3UHJvZ3JhbVR5cGUgPSAnaW5BcHBQcm9ncmFtJ1xuICAgICAgICBicmVha1xuICAgIH1cblxuICAgIGlmIChuZXdQcm9ncmFtVHlwZSkge1xuICAgICAgcmVzdWx0ID0gTElCLndlYlJlcXVlc3QoXG4gICAgICAgICcvbWFya2V0aW5nRXZlbnQvY3JlYXRlTWFya2V0aW5nUHJvZ3JhbVN1Ym1pdCcsXG4gICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICcmbmFtZT0nICtcbiAgICAgICAgbmV3UHJvZ3JhbU5hbWUgK1xuICAgICAgICAnJmRlc2NyaXB0aW9uPScgK1xuICAgICAgICAnJnBhcmVudEZvbGRlcklkPScgK1xuICAgICAgICBjbG9uZVRvRm9sZGVySWQgK1xuICAgICAgICAnJmNsb25lRnJvbUlkPScgK1xuICAgICAgICBvcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCArXG4gICAgICAgICcmdHlwZT0nICtcbiAgICAgICAgbmV3UHJvZ3JhbVR5cGUgK1xuICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICdQT1NUJyxcbiAgICAgICAgZmFsc2UsXG4gICAgICAgICcnLFxuICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UpXG4gICAgICAgICAgLy9yZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UubWF0Y2goL3tcXFwiSlNPTlJlc3VsdHNcXFwiOi4qfS8pWzBdKTtcblxuICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5KU09OUmVzdWx0cyAmJiByZXNwb25zZS5KU09OUmVzdWx0cy5hcHB2YXJzICYmIHJlc3BvbnNlLkpTT05SZXN1bHRzLmFwcHZhcnMucmVzdWx0ID09ICdTdWNjZXNzJykge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKVxuXG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfSxcblxuICBjbG9uZVNtYXJ0Q2FtcGFpZ25TdGF0ZTogZnVuY3Rpb24gKG9yaWdQcm9ncmFtQ29tcElkLCBuZXdQcm9ncmFtQ29tcElkLCBmb3JjZUFjdGl2YXRlKSB7XG4gICAgbGV0IGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZVxuXG4gICAgZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtQXNzZXREZXRhaWxzKG9yaWdQcm9ncmFtQ29tcElkKVxuICAgIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtQXNzZXREZXRhaWxzKG5ld1Byb2dyYW1Db21wSWQpXG5cbiAgICBpZiAoZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSAmJiBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UpIHtcbiAgICAgIGxldCBzZXRTbWFydENhbXBhaWduU3RhdGVcblxuICAgICAgc2V0U21hcnRDYW1wYWlnblN0YXRlID0gZnVuY3Rpb24gKGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSkge1xuICAgICAgICBsZXQgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbiwgY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduLCBnZXRTY2hlZHVsZVJlc3BvbnNlXG5cbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2Uuc21hcnRDYW1wYWlnbnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbiA9IGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2Uuc21hcnRDYW1wYWlnbnNbaWldXG4gICAgICAgICAgY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduID0gZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLnNtYXJ0Q2FtcGFpZ25zW2lpXVxuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5jb21wVHlwZSA9PSBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcFR5cGUgJiZcbiAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcFR5cGUgPT0gJ1NtYXJ0IENhbXBhaWduJyAmJlxuICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5uYW1lID09IGN1cnJOZXdQcm9ncmFtU21hcnRDYW1wYWlnbi5uYW1lXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAoY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5zdGF0dXMgPT0gNyB8fCAoY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5zdGF0dXMgPT0gNiAmJiBmb3JjZUFjdGl2YXRlKSkge1xuICAgICAgICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAgICAgICAnL3NtYXJ0Y2FtcGFpZ25zL3RvZ2dsZUFjdGl2ZVN0YXR1cycsXG4gICAgICAgICAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICAgICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICAgICAgICAgJyZzbWFydENhbXBhaWduSWQ9JyArXG4gICAgICAgICAgICAgICAgY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduLmNvbXBJZCArXG4gICAgICAgICAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgICAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLnN0YXR1cyA9PSAzIHx8IGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uc3RhdHVzID09IDUpIHtcbiAgICAgICAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgICAgICAgJy9zbWFydGNhbXBhaWducy9lZGl0U2NoZWR1bGVSUycsXG4gICAgICAgICAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICAgICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICAgICAgICAgJyZpc1JlcXVlc3Q9MScgK1xuICAgICAgICAgICAgICAgICcmc21hcnRDYW1wYWlnbklkPScgK1xuICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcElkICtcbiAgICAgICAgICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgICAgICAgICAnUE9TVCcsXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgJycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5tYXRjaCgvTWt0UGFnZVxcLmFwcFZhcnNcXC5zY2hlZHVsZURhdGEgPSB7KFtePV18XFxufFxcXFxuKSp9LylbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZSA9IEpTT04ucGFyc2UoXG4gICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXRjaCgvTWt0UGFnZVxcLmFwcFZhcnNcXC5zY2hlZHVsZURhdGEgPSB7KFtePV18XFxufFxcXFxuKSp9LylbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9Na3RQYWdlXFwuYXBwVmFyc1xcLnNjaGVkdWxlRGF0YSA9IHsvLCAneycpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxuICovZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC86ICsvZywgJ1wiOiAnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wiXFwvXFwvW15cIl0rXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cIn0kLywgJ30nKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgaWYgKGdldFNjaGVkdWxlUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnRBdERhdGUgPSBuZXcgRGF0ZShEYXRlLnBhcnNlKGdldFNjaGVkdWxlUmVzcG9uc2Uuc3RhcnRfYXQpKSxcbiAgICAgICAgICAgICAgICAgIHN0YXJ0QXQgPVxuICAgICAgICAgICAgICAgICAgICBzdGFydEF0RGF0ZS5nZXRGdWxsWWVhcigpICtcbiAgICAgICAgICAgICAgICAgICAgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQoc3RhcnRBdERhdGUuZ2V0TW9udGgoKSArIDEpICtcbiAgICAgICAgICAgICAgICAgICAgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRBdERhdGUuZ2V0RGF0ZSgpICtcbiAgICAgICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRBdERhdGUuZ2V0SG91cnMoKSArXG4gICAgICAgICAgICAgICAgICAgICc6JyArXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0QXREYXRlLmdldE1pbnV0ZXMoKSArXG4gICAgICAgICAgICAgICAgICAgICc6JyArXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0QXREYXRlLmdldFNlY29uZHMoKVxuXG4gICAgICAgICAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgICAgICAgICAnL3NtYXJ0Y2FtcGFpZ25zL3JlY3VyQ2FtcFNjaGVkdWxlJyxcbiAgICAgICAgICAgICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgICAgICAgICAgICcmc21hcnRDYW1wYWlnbklkPScgK1xuICAgICAgICAgICAgICAgICAgY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduLmNvbXBJZCArXG4gICAgICAgICAgICAgICAgICAnJnJlY3VycmVuY2VfdHlwZT0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UucmVjdXJyZW5jZV90eXBlICtcbiAgICAgICAgICAgICAgICAgICcmZXZlcnlfbl91bml0PScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS5ldmVyeV9uX3VuaXQgK1xuICAgICAgICAgICAgICAgICAgJyZzdGFydF9hdD0nICtcbiAgICAgICAgICAgICAgICAgIHN0YXJ0QXQgK1xuICAgICAgICAgICAgICAgICAgJyZlbmRfYXQ9JyArXG4gICAgICAgICAgICAgICAgICAnJmV2ZXJ5X3dlZWtkYXk9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLmV2ZXJ5X3dlZWtkYXkgK1xuICAgICAgICAgICAgICAgICAgJyZ3ZWVrX21hc2s9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLndlZWtfbWFzayArXG4gICAgICAgICAgICAgICAgICAnJnJlY3VyRGF5X29mX21vbnRoPScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS5yZWN1ckRheV9vZl9tb250aCArXG4gICAgICAgICAgICAgICAgICAnJnJlY3VyTW9udGhfZGF5X3R5cGU9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLnJlY3VyTW9udGhfZGF5X3R5cGUgK1xuICAgICAgICAgICAgICAgICAgJyZyZWN1ck1vbnRoX3dlZWtfdHlwZT0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UucmVjdXJNb250aF93ZWVrX3R5cGUgK1xuICAgICAgICAgICAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgJycsXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2Uuc21hcnRDYW1wYWlnbnMubGVuZ3RoID09IGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5zbWFydENhbXBhaWducy5sZW5ndGgpIHtcbiAgICAgICAgc2V0U21hcnRDYW1wYWlnblN0YXRlKGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSlcbiAgICAgIH1cblxuICAgICAgaWYgKGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWUubGVuZ3RoID09IGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZS5sZW5ndGgpIHtcbiAgICAgICAgbGV0IGN1cnJPcmlnUHJvZ3JhbUFzc2V0LCBjdXJyTmV3UHJvZ3JhbUFzc2V0XG5cbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWUubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgY3Vyck9yaWdQcm9ncmFtQXNzZXQgPSBnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlW2lpXVxuICAgICAgICAgIGN1cnJOZXdQcm9ncmFtQXNzZXQgPSBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWVbaWldXG5cbiAgICAgICAgICBpZiAoY3Vyck9yaWdQcm9ncmFtQXNzZXQubmF2VHlwZSA9PSAnTUEnICYmIGN1cnJOZXdQcm9ncmFtQXNzZXQubmF2VHlwZSA9PSAnTUEnKSB7XG4gICAgICAgICAgICBzZXRTbWFydENhbXBhaWduU3RhdGUoXG4gICAgICAgICAgICAgIExJQi5nZXRQcm9ncmFtQXNzZXREZXRhaWxzKGN1cnJPcmlnUHJvZ3JhbUFzc2V0LmNvbXBJZCksXG4gICAgICAgICAgICAgIExJQi5nZXRQcm9ncmFtQXNzZXREZXRhaWxzKGN1cnJOZXdQcm9ncmFtQXNzZXQuY29tcElkKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2VcbiAgfSxcblxuICBnZXRIdW1hbkRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBEZW1vIEFwcCA+IEdldHRpbmc6IERhdGUgNCBXZWVrcyBGcm9tIE5vdycpXG4gICAgbGV0IGRheU5hbWVzID0gWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXSxcbiAgICAgIG1vbnRoTmFtZXMgPSBbJ0pBTicsICdGRUInLCAnTUFSJywgJ0FQUicsICdNQVknLCAnSlVORScsICdKVUxZJywgJ0FVRycsICdTRVBUJywgJ09DVCcsICdOT1YnLCAnREVDJ10sXG4gICAgICBkYXRlID0gbmV3IERhdGUoKSxcbiAgICAgIGRheU9mV2VlayxcbiAgICAgIG1vbnRoLFxuICAgICAgZGF5T2ZNb250aCxcbiAgICAgIHllYXJcblxuICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDI4KVxuICAgIGRheU9mV2VlayA9IGRheU5hbWVzW2RhdGUuZ2V0RGF5KCldXG4gICAgbW9udGggPSBtb250aE5hbWVzW2RhdGUuZ2V0TW9udGgoKV1cbiAgICB5ZWFyID0gZGF0ZS5nZXRGdWxsWWVhcigpXG5cbiAgICBzd2l0Y2ggKGRhdGUuZ2V0RGF0ZSgpKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGRheU9mTW9udGggPSAnMXN0J1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAyOlxuICAgICAgICBkYXlPZk1vbnRoID0gJzJuZCdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgZGF5T2ZNb250aCA9ICczcmQnXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBkYXlPZk1vbnRoID0gZGF0ZS5nZXREYXRlKCkgKyAndGgnXG4gICAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgcmV0dXJuIGRheU9mV2VlayArICcsICcgKyBtb250aCArICcgdGhlICcgKyBkYXlPZk1vbnRoICsgJyAnICsgeWVhclxuICB9LFxuXG4gIC8vIHJlbG9hZHMgdGhlIE1hcmtldGluZyBBY3Rpdml0ZXMgVHJlZVxuICByZWxvYWRNYXJrZXRpbmdBY3Rpdml0ZXM6IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgY29udGV4dCA9IHtcbiAgICAgIGNvbXBTdWJ0eXBlOiBudWxsLFxuICAgICAgY3VzdG9tVG9rZW46ICcnLFxuICAgICAgZGxDb21wQ29kZTogJ01BJyxcbiAgICAgIHR5cGU6ICdNQSdcbiAgICB9XG4gICAgICA7IChjdXN0b21Ub2tlbiA9IE1rdDMuRGxNYW5hZ2VyLmdldEN1c3RvbVRva2VuKCkpLCAocGFyYW1zID0gRXh0LnVybERlY29kZShjdXN0b21Ub2tlbikpXG5cbiAgICBpZiAoXG4gICAgICBjb250ZXh0ICYmXG4gICAgICAoY29udGV4dC5jb21wVHlwZSA9PT0gJ01hcmtldGluZyBFdmVudCcgfHxcbiAgICAgICAgY29udGV4dC5jb21wVHlwZSA9PT0gJ01hcmtldGluZyBQcm9ncmFtJyB8fFxuICAgICAgICBjb250ZXh0LmNvbXBTdWJ0eXBlID09PSAnbWFya2V0aW5ncHJvZ3JhbScgfHxcbiAgICAgICAgY29udGV4dC5jb21wU3VidHlwZSA9PT0gJ21hcmtldGluZ2V2ZW50JylcbiAgICApIHtcbiAgICAgIE1rdDMuTUtOb2RlQ29udGV4dC50aW1pbmdSZXBvcnQgPSB7XG4gICAgICAgIG5hdkxvYWRDYWw6IEV4dDQuRGF0ZS5ub3coKSxcbiAgICAgICAgY2FsZW5kYXJNb2RlOiAnUHJvZ3JhbSdcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgYWxyZWFkeUluTUEgPSBNa3RNYWluTmF2LmFjdGl2ZU5hdiA9PSAndG5NQScsXG4gICAgICBham9wdHMgPSBNa3RNYWluTmF2LmNvbW1vblByZUxvYWQoJ3RuTUEnLCBjb250ZXh0KVxuICAgIGlmIChNa3RQYWdlLmluaXROYXYgPT0gJ3llcycpIHtcbiAgICAgIE1rdEV4cGxvcmVyLmNsZWFyKClcbiAgICAgIE1rdEV4cGxvcmVyLm1hc2soKVxuICAgICAgbGV0IHBhcm1zID0gY29udGV4dFxuICAgICAgaWYgKCFNa3RQYWdlLnNhdGVsbGl0ZSkge1xuICAgICAgICBNa3RWaWV3cG9ydC5zZXRFeHBsb3JlclZpc2libGUodHJ1ZSlcblxuICAgICAgICBNa3RFeHBsb3Jlci5sb2FkVHJlZSgnZXhwbG9yZXIvZ2VuZXJhdGVGdWxsTWFFeHBsb3JlcicsIHtcbiAgICAgICAgICBzZXJpYWxpemVQYXJtczogcGFybXMsXG4gICAgICAgICAgb25NeUZhaWx1cmU6IE1rdE1haW5OYXYuZXhwRmFpbHVyZVJlc3BvbnNlLmNyZWF0ZURlbGVnYXRlKHRoaXMpXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHBhcm1zID0ge31cbiAgICAgIGFqb3B0cy5zZXJpYWxpemVQYXJtcyA9IHBhcm1zXG4gICAgICBpZiAoaXNEZWZpbmVkKGNvbnRleHQucGFuZWxJbmRleCkpIHtcbiAgICAgICAgcGFybXMucGFuZWxJbmRleCA9IGNvbnRleHQucGFuZWxJbmRleFxuICAgICAgfVxuXG4gICAgICBpZiAoY29udGV4dC5pc1Byb2dyYW1JbXBvcnQpIHtcbiAgICAgICAgcGFyYW1zLmlkID0gY29udGV4dC5jb21wSWRcblxuICAgICAgICBpZiAoTWt0UGFnZS5oYXNXb3Jrc3BhY2VzKCkpIHtcbiAgICAgICAgICAvLyB3ZSBhcmUgZm9yY2VkIHRvIGxvYWQgZGVmYXVsdCBNQSwgb3RoZXJ3aXNlIHRoZSBtb2RhbCBmb3JtIGlzIG5vdCBhbGlnbmVkIHByb3Blcmx5XG4gICAgICAgICAgTWt0Q2FudmFzLmNhbnZhc0FqYXhSZXF1ZXN0KCdleHBsb3Jlci9wcm9ncmFtQ2FudmFzJywge1xuICAgICAgICAgICAgb25NeVN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgRXh0NC53aWRnZXQoJ3Byb2dyYW1PbmVDbGlja0ltcG9ydEZvcm0nLCB7Zm9ybURhdGE6IHBhcmFtc30pXG5cbiAgICAgICAgICAgICAgTWt0Vmlld3BvcnQuc2V0QXBwTWFzayhmYWxzZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QoJy9pbXBFeHAvZG93bmxvYWRUZW1wbGF0ZScsIHtcbiAgICAgICAgICBzZXJpYWxpemVQYXJtczogcGFyYW1zLFxuICAgICAgICAgIG9uTXlTdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UsIHJlcXVlc3QpIHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5KU09OUmVzdWx0cykge1xuICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuSlNPTlJlc3VsdHMuc2hvd0ltcG9ydFN0YXR1cyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIE1rdENhbnZhcy5jYW52YXNBamF4UmVxdWVzdCgnZXhwbG9yZXIvcHJvZ3JhbUNhbnZhcycsIHtcbiAgICAgICAgICAgICAgICAgIG9uTXlTdWNjZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIE1rdC5hcHBzLmltcEV4cC5pbXBvcnRQcm9ncmFtU3RhdHVzKClcbiAgICAgICAgICAgICAgICAgICAgTWt0Vmlld3BvcnQuc2V0QXBwTWFzayhmYWxzZSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLkpTT05SZXN1bHRzLmVycm9yTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIC8vIGp1c3QgbG9hZCBNQVxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNNQSdcbiAgICAgICAgICAgICAgICBNa3RQYWdlLnNob3dBbGVydE1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgICBNa3RMYW5nLmdldFN0cigncGFnZS5JbXBvcnRfV2FybmluZycpLFxuICAgICAgICAgICAgICAgICAgTWt0TGFuZy5nZXRTdHIoJ3BhZ2UuSW1wb3J0X0ZhaWxlZCcpICsgcmVzcG9uc2UuSlNPTlJlc3VsdHMuZXJyb3JNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgJy9pbWFnZXMvaWNvbnMzMi9lcnJvci5wbmcnXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIGlmIChjb250ZXh0LmNvbXBTdWJ0eXBlID09ICdtYXJrZXRpbmdmb2xkZXInIHx8IGNvbnRleHQuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInIHx8IGNvbnRleHQuc3ViVHlwZSA9PSAnbWFya2V0aW5nZm9sZGVyJykge1xuICAgICAgICBNa3RNYWluTmF2LmxvYWRQRShjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChjb250ZXh0LmNvbXBTdWJ0eXBlID09ICdzbWFydGNhbXBhaWduJyB8fCBjb250ZXh0LnN1YlR5cGUgPT0gJ3NtYXJ0Y2FtcGFpZ24nIHx8IGNvbnRleHQuY29tcFR5cGUgPT0gJ1NtYXJ0IENhbXBhaWduJykge1xuICAgICAgICBNa3RNYWluTmF2LmxvYWRTbWFydENhbXBhaWduKGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuY29tcFN1YnR5cGUgPT0gJ21hcmtldGluZ2V2ZW50JyB8fCBjb250ZXh0LnN1YlR5cGUgPT0gJ21hcmtldGluZ2V2ZW50JyB8fCBjb250ZXh0LmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRXZlbnQnKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZE1hcmtldGluZ0V2ZW50KGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBjb250ZXh0LmNvbXBTdWJ0eXBlID09ICdtYXJrZXRpbmdwcm9ncmFtJyB8fFxuICAgICAgICBjb250ZXh0LnN1YlR5cGUgPT0gJ21hcmtldGluZ3Byb2dyYW0nIHx8XG4gICAgICAgIGNvbnRleHQuY29tcFR5cGUgPT0gJ01hcmtldGluZyBQcm9ncmFtJ1xuICAgICAgKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZE1hcmtldGluZ1Byb2dyYW0oY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5jb21wU3VidHlwZSA9PSAnbnVydHVyZXByb2dyYW0nIHx8IGNvbnRleHQuc3ViVHlwZSA9PSAnbnVydHVyZXByb2dyYW0nIHx8IGNvbnRleHQuY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScpIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkTnVydHVyZVByb2dyYW0oY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGNvbnRleHQuY29tcFN1YnR5cGUgPT09ICdlbWFpbGJhdGNocHJvZ3JhbScgfHxcbiAgICAgICAgY29udGV4dC5zdWJUeXBlID09PSAnZW1haWxiYXRjaHByb2dyYW0nIHx8XG4gICAgICAgIGNvbnRleHQuY29tcFR5cGUgPT09ICdFbWFpbCBCYXRjaCBQcm9ncmFtJ1xuICAgICAgKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZEVtYWlsQmF0Y2hQcm9ncmFtKGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuY29tcFN1YnR5cGUgPT09ICdpbkFwcCcgfHwgY29udGV4dC5zdWJUeXBlID09PSAnaW5BcHBQcm9ncmFtJyB8fCBjb250ZXh0LmNvbXBUeXBlID09PSAnSW4tQXBwIFByb2dyYW0nKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZEluQXBwUHJvZ3JhbShjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChjb250ZXh0Lm5vZGVUeXBlID09ICdGbG93Jykge1xuICAgICAgICAvL1RoaXMgaXMganVzdCB0ZW1wb3JhcnkgdGlsbCBDcmFzaCBnZXQgdGhlIHN0dWZmIGZvciBteSB0cmVlXG4gICAgICAgIE1rdE1haW5OYXYubG9hZEZsb3coKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWpvcHRzLmNhY2hlUmVxdWVzdCA9IHRydWVcbiAgICAgICAgYWpvcHRzLm9uTXlTdWNjZXNzID0gTWt0TWFpbk5hdi5jYW52YXNBamF4UmVxdWVzdENvbXBsZXRlLmNyZWF0ZURlbGVnYXRlKE1rdE1haW5OYXYpXG4gICAgICAgIGFqb3B0cy5vbk15RmFpbHVyZSA9IE1rdE1haW5OYXYuY2FudmFzQWpheFJlcXVlc3RDb21wbGV0ZS5jcmVhdGVEZWxlZ2F0ZShNa3RNYWluTmF2KVxuICAgICAgICBNa3RDYW52YXMuY2FudmFzQWpheFJlcXVlc3QoJ2V4cGxvcmVyL3Byb2dyYW1DYW52YXMnLCBham9wdHMpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH0sXG5cbiAgLy8gZWRpdHMgdGhlIHZhcmlhYmxlcyB3aXRoaW4gdGhlIEVtYWlsIEVkaXRvciBmb3IgY3VzdG9tIGNvbXBhbnlcbiAgc2F2ZUVtYWlsRWRpdHM6IGZ1bmN0aW9uIChtb2RlLCBhc3NldCkge1xuICAgIGxldCBzYXZlRWRpdHNUb2dnbGUgPSBMSUIuZ2V0Q29va2llKCdzYXZlRWRpdHNUb2dnbGVTdGF0ZScpLFxuICAgICAgbG9nbyA9IExJQi5nZXRDb29raWUoJ2xvZ28nKSxcbiAgICAgIGhlcm9CYWNrZ3JvdW5kID0gTElCLmdldENvb2tpZSgnaGVyb0JhY2tncm91bmQnKSxcbiAgICAgIGNvbG9yID0gTElCLmdldENvb2tpZSgnY29sb3InKVxuXG4gICAgaWYgKHNhdmVFZGl0c1RvZ2dsZSA9PSAndHJ1ZScgJiYgKGxvZ28gIT0gbnVsbCB8fCBoZXJvQmFja2dyb3VuZCAhPSBudWxsIHx8IGNvbG9yICE9IG51bGwpKSB7XG4gICAgICBsZXQgaHR0cFJlZ0V4ID0gbmV3IFJlZ0V4cCgnXmh0dHB8XiQnLCAnaScpLFxuICAgICAgICAvL3RleHRSZWdleCA9IG5ldyBSZWdFeHAoXCJeW14jXXxeJFwiLCBcImlcIiksXG4gICAgICAgIGNvbG9yUmVnZXggPSBuZXcgUmVnRXhwKCdeI1swLTlhLWZdezMsNn0kfF5yZ2J8XiQnLCAnaScpLFxuICAgICAgICBsb2dvSWRzID0gWydoZXJvTG9nbycsICdmb290ZXJMb2dvJywgJ2hlYWRlckxvZ28nLCAnbG9nb0Zvb3RlcicsICdsb2dvJ10sXG4gICAgICAgIGhlcm9CZ1JlZ2V4ID0gbmV3IFJlZ0V4cCgnaGVyb0JhY2tncm91bmR8aGVyby1iYWNrZ3JvdW5kfGhlcm9Ca2d8aGVyby1ia2d8aGVyb0JnfGhlcm8tYmcnLCAnaScpLFxuICAgICAgICAvL3RpdGxlSWRzID0gW1widGl0bGVcIiwgXCJoZXJvVGl0bGVcIiwgXCJtYWluVGl0bGVcIl0sXG4gICAgICAgIC8vc3VidGl0bGVJZHMgPSBbXCJzdWJ0aXRsZVwiLCBcImhlcm9zdWJUaXRsZVwiXSxcbiAgICAgICAgaGVhZGVyQmdDb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAnXihoZWFkZXJCZ0NvbG9yfGhlYWRlci1iZy1jb2xvcnxoZWFkZXJCYWNrZ3JvdW5kQ29sb3J8aGVhZGVyLWJhY2tncm91bmQtY29sb3J8aGVhZGVyQmtnQ29sb3J8aGVhZGVyLWJrZy1jb2xvcnwpJCcsXG4gICAgICAgICAgJ2knXG4gICAgICAgICksXG4gICAgICAgIGJ1dHRvbkJnQ29sb3JSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ14oaGVyb0J1dHRvbkJnQ29sb3J8aGVyby1idXR0b24tYmctY29sb3J8aGVyb0J1dHRvbkJhY2tncm91bmRDb2xvcnxoZXJvLWJ1dHRvbi1iYWNrZ3JvdW5kLWNvbG9yfGhlcm9Ca2dDb2xvcnxoZXJvLWJrZy1jb2xvcnwpJCcsXG4gICAgICAgICAgJ2knXG4gICAgICAgICksXG4gICAgICAgIGJ1dHRvbkJvcmRlckNvbG9yUmVnZXggPSBuZXcgUmVnRXhwKCdeKGhlcm9CdXR0b25Cb3JkZXJDb2xvcnxoZXJvLWJ1dHRvbi1ib3JkZXItY29sb3J8aGVyb0JvcmRlckNvbG9yfGhlcm8tYm9yZGVyLWNvbG9yfCkkJywgJ2knKSxcbiAgICAgICAgbG9nbyA9IExJQi5nZXRDb29raWUoJ2xvZ28nKSxcbiAgICAgICAgaGVyb0JhY2tncm91bmQgPSBMSUIuZ2V0Q29va2llKCdoZXJvQmFja2dyb3VuZCcpLFxuICAgICAgICBjb2xvciA9IExJQi5nZXRDb29raWUoJ2NvbG9yJyksXG4gICAgICAgIC8vdGl0bGUgPSBcIllvdSBUbzxicj5QUkVNSUVSIEJVU0lORVNTIEVWRU5UPGJyPk9GIFRIRSBZRUFSXCIsXG4gICAgICAgIC8vc3VidGl0bGUgPSBMSUIuZ2V0SHVtYW5EYXRlKCksXG4gICAgICAgIC8vdGl0bGVNYXRjaCxcbiAgICAgICAgLy9jb21wYW55LFxuICAgICAgICAvL2NvbXBhbnlOYW1lLFxuICAgICAgICBlZGl0SHRtbCxcbiAgICAgICAgZWRpdEFzc2V0VmFycyxcbiAgICAgICAgd2FpdEZvckxvYWRNc2csXG4gICAgICAgIHdhaXRGb3JSZWxvYWRNc2dcblxuICAgICAgd2FpdEZvckxvYWRNc2cgPSBuZXcgRXh0LldpbmRvdyh7XG4gICAgICAgIGNsb3NhYmxlOiB0cnVlLFxuICAgICAgICBtb2RhbDogdHJ1ZSxcbiAgICAgICAgd2lkdGg6IDUwMCxcbiAgICAgICAgaGVpZ2h0OiAyNTAsXG4gICAgICAgIGNsczogJ21rdE1vZGFsRm9ybScsXG4gICAgICAgIHRpdGxlOiAnUGxlYXNlIFdhaXQgZm9yIFBhZ2UgdG8gTG9hZCcsXG4gICAgICAgIGh0bWw6ICc8dT5TYXZpbmcgRWRpdHMgdG8gSGVybyBCYWNrZ3JvdW5kICYgQnV0dG9uIEJhY2tncm91bmQgQ29sb3I8L3U+IDxicj5XYWl0IHVudGlsIHRoaXMgcGFnZSBjb21wbGV0ZWx5IGxvYWRzIGJlZm9yZSBjbG9zaW5nLiA8YnI+PGJyPjx1PlRvIERpc2FibGUgVGhpcyBGZWF0dXJlOjwvdT4gPGJyPkNsZWFyIHRoZSBzZWxlY3RlZCBjb21wYW55IHZpYSB0aGUgTWFya2V0b0xpdmUgZXh0ZW5zaW9uLidcbiAgICAgIH0pXG4gICAgICB3YWl0Rm9yUmVsb2FkTXNnID0gbmV3IEV4dC5XaW5kb3coe1xuICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcbiAgICAgICAgbW9kYWw6IHRydWUsXG4gICAgICAgIHdpZHRoOiA1MDAsXG4gICAgICAgIGhlaWdodDogMjUwLFxuICAgICAgICBjbHM6ICdta3RNb2RhbEZvcm0nLFxuICAgICAgICB0aXRsZTogJ1BsZWFzZSBXYWl0IGZvciBQYWdlIHRvIFJlbG9hZCcsXG4gICAgICAgIGh0bWw6ICc8dT5TYXZpbmcgRWRpdHMgdG8gTG9nbywgVGl0bGUsICYgU3VidGl0bGU8L3U+IDxicj5XYWl0IGZvciB0aGlzIHBhZ2UgdG8gcmVsb2FkIGF1dG9tYXRpY2FsbHkuIDxicj48YnI+PHU+VG8gRGlzYWJsZSBUaGlzIEZlYXR1cmU6PC91PiA8YnI+Q2xlYXIgdGhlIHNlbGVjdGVkIGNvbXBhbnkgdmlhIHRoZSBNYXJrZXRvTGl2ZSBleHRlbnNpb24uJ1xuICAgICAgfSlcblxuICAgICAgZWRpdEh0bWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICcvZW1haWxlZGl0b3IvZG93bmxvYWRIdG1sRmlsZTI/eHNyZklkPScgKyBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSArICcmZW1haWxJZD0nICsgTWt0My5ETC5kbC5jb21wSWQsXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICAnR0VUJyxcbiAgICAgICAgICB0cnVlLFxuICAgICAgICAgICdkb2N1bWVudCcsXG4gICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBsZXQgaXNMb2dvUmVwbGFjZWRcbiAgICAgICAgICAgIC8vaXNUaXRsZVJlcGxhY2VkLFxuICAgICAgICAgICAgLy9pc1N1YnRpdGxlUmVwbGFjZWQ7XG5cbiAgICAgICAgICAgIGlmIChsb2dvKSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBsb2dvSWRzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyRWxlbWVudCA9IHJlc3BvbnNlLmdldEVsZW1lbnRCeUlkKGxvZ29JZHNbaWldKVxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIGN1cnJFbGVtZW50ICYmXG4gICAgICAgICAgICAgICAgICBjdXJyRWxlbWVudC5jbGFzc05hbWUuc2VhcmNoKCdta3RvSW1nJykgIT0gLTEgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKVswXSAmJlxuICAgICAgICAgICAgICAgICAgY3VyckVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpWzBdLmdldEF0dHJpYnV0ZSgnc3JjJykgIT0gbG9nb1xuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gUmVwbGFjaW5nOiBMb2dvID4gJyArIGxvZ28pXG4gICAgICAgICAgICAgICAgICBpc0xvZ29SZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIGN1cnJFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKVswXS5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgaXNMb2dvUmVwbGFjZWRcbiAgICAgICAgICAgICAgLy98fCBpc1RpdGxlUmVwbGFjZWRcbiAgICAgICAgICAgICAgLy98fCBpc1N1YnRpdGxlUmVwbGFjZWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBsZXQgdXBkYXRlSHRtbFxuXG4gICAgICAgICAgICAgIHVwZGF0ZUh0bWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgICAgICAgICAnL2VtYWlsZWRpdG9yL3VwZGF0ZUNvbnRlbnQyJyxcbiAgICAgICAgICAgICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgICAgICAgICAgICcmZW1haWxJZD0nICtcbiAgICAgICAgICAgICAgICAgIE1rdDMuREwuZGwuY29tcElkICtcbiAgICAgICAgICAgICAgICAgICcmY29udGVudD0nICtcbiAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKHJlc3BvbnNlKSkgK1xuICAgICAgICAgICAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc3RvcCgpXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh3YWl0Rm9yTG9hZE1zZy5pc1Zpc2libGUoKSkge1xuICAgICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLmhpZGUoKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHdhaXRGb3JSZWxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIHVwZGF0ZUh0bWwoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBlZGl0QXNzZXRWYXJzID0gZnVuY3Rpb24gKGFzc2V0KSB7XG4gICAgICAgIGxldCBhc3NldFZhcnMgPSBhc3NldC5nZXRWYXJpYWJsZVZhbHVlcygpXG5cbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IE9iamVjdC5rZXlzKGFzc2V0VmFycykubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgbGV0IGN1cnJWYXJpYWJsZUtleSA9IE9iamVjdC5rZXlzKGFzc2V0VmFycylbaWldXG4gICAgICAgICAgY3VyclZhcmlhYmxlVmFsdWUgPSBPYmplY3QudmFsdWVzKGFzc2V0VmFycylbaWldXG5cbiAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgY3VyclZhcmlhYmxlVmFsdWUgPSAnJ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGhlcm9CZ1JlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlICE9IGhlcm9CYWNrZ3JvdW5kICYmIGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChodHRwUmVnRXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRWYXJpYWJsZVZhbHVlKGN1cnJWYXJpYWJsZUtleSwgaGVyb0JhY2tncm91bmQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGhlYWRlckJnQ29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZSAhPSBjb2xvciAmJiBjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goY29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFZhcmlhYmxlVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBjb2xvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goYnV0dG9uQmdDb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlICE9IGNvbG9yICYmIGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChjb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0VmFyaWFibGVWYWx1ZShjdXJyVmFyaWFibGVLZXksIGNvbG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChidXR0b25Cb3JkZXJDb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlICE9IGNvbG9yICYmIGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChjb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0VmFyaWFibGVWYWx1ZShjdXJyVmFyaWFibGVLZXksIGNvbG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3YWl0Rm9yTG9hZE1zZy5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5yZWxvYWRFbWFpbCgpXG4gICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5oaWRlKClcbiAgICAgICAgICB9LCA3NTAwKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZygnPiBFZGl0aW5nOiBFbWFpbCBWYXJpYWJsZXMnKVxuICAgICAgaWYgKG1vZGUgPT0gJ2VkaXQnKSB7XG4gICAgICAgIGxldCBpc1dlYlJlcXVlc3RTZXNzaW9uID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnPiBXYWl0aW5nOiBXZWIgUmVxdWVzdCBTZXNzaW9uIERhdGEnKVxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5ETC5kbC5jb21wSWQnKSAmJlxuICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RTZWN1cml0eS5nZXRYc3JmSWQnKSAmJlxuICAgICAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCkgJiZcbiAgICAgICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0LmlkJykgJiZcbiAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFZGl0aW5nOiBFbWFpbCBIVE1MJylcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzV2ViUmVxdWVzdFNlc3Npb24pXG5cbiAgICAgICAgICAgIGVkaXRIdG1sKClcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDApXG5cbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgZWRpdEFzc2V0VmFycyhhc3NldClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgaXNFbWFpbEVkaXRvclZhcmlhYmxlcyA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBXYWl0aW5nOiBFbWFpbCBFZGl0b3IgVmFyaWFibGVzJylcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgIXdhaXRGb3JSZWxvYWRNc2cuaXNWaXNpYmxlKCkgJiZcbiAgICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmFwcC5jb250cm9sbGVycy5nZXQnKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLmdldEVtYWlsKCkgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLmdldEVtYWlsKCkuZ2V0VmFyaWFibGVWYWx1ZXMoKSAmJlxuICAgICAgICAgICAgICBPYmplY3Qua2V5cyhNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKS5nZXRWYXJpYWJsZVZhbHVlcygpKS5sZW5ndGggIT0gMCAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKS5zZXRWYXJpYWJsZVZhbHVlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogRW1haWwgRWRpdG9yIFZhcmlhYmxlcycpXG4gICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzRW1haWxFZGl0b3JWYXJpYWJsZXMpXG5cbiAgICAgICAgICAgICAgZWRpdEFzc2V0VmFycyhNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCAwKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT0gJ3ByZXZpZXcnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+IEVkaXRpbmc6IEVtYWlsIFByZXZpZXdlciBWYXJpYWJsZXMnKVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyBlZGl0cyB0aGUgdmFyaWFibGVzIHdpdGhpbiB0aGUgTGFuZGluZyBQYWdlIEVkaXRvciBmb3IgY3VzdG9tIGNvbXBhbnlcbiAgLy8gbW9kZSB2aWV3IChlZGl0LCBwcmV2aWV3KTsgYXNzZXQgdG8gYmUgZWRpdGVkXG4gIHNhdmVMYW5kaW5nUGFnZUVkaXRzOiBmdW5jdGlvbiAobW9kZSwgYXNzZXQpIHtcbiAgICBsZXQgc2F2ZUVkaXRzVG9nZ2xlID0gTElCLmdldENvb2tpZSgnc2F2ZUVkaXRzVG9nZ2xlU3RhdGUnKSxcbiAgICAgIGxvZ28gPSBMSUIuZ2V0Q29va2llKCdsb2dvJyksXG4gICAgICBoZXJvQmFja2dyb3VuZCA9IExJQi5nZXRDb29raWUoJ2hlcm9CYWNrZ3JvdW5kJyksXG4gICAgICBjb2xvciA9IExJQi5nZXRDb29raWUoJ2NvbG9yJylcblxuICAgIGlmIChzYXZlRWRpdHNUb2dnbGUgPT0gJ3RydWUnICYmIChsb2dvICE9IG51bGwgfHwgaGVyb0JhY2tncm91bmQgIT0gbnVsbCB8fCBjb2xvciAhPSBudWxsKSkge1xuICAgICAgbGV0IGh0dHBSZWdFeCA9IG5ldyBSZWdFeHAoJ15odHRwfF4kJywgJ2knKSxcbiAgICAgICAgLy90ZXh0UmVnZXggPSBuZXcgUmVnRXhwKFwiXlteI118XiRcIiwgXCJpXCIpLFxuICAgICAgICBjb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cCgnXiNbMC05YS1mXXszLDZ9JHxecmdifF4kJywgJ2knKSxcbiAgICAgICAgbG9nb1JlZ2V4ID0gbmV3IFJlZ0V4cCgnbG9nb3xoZWFkZXJMb2dvfGhlYWRlci1sb2dvfF4kJywgJ2knKSxcbiAgICAgICAgaGVyb0JnUmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICdoZXJvQmFja2dyb3VuZHxoZXJvLWJhY2tncm91bmR8aGVyb0JrZ3xoZXJvLWJrZ3xoZXJvQmd8aGVyby1iZ3xoZXJvMUJnfGhlcm8tMS1iZ3xoZXJvMUJrZ3xoZXJvLTEtYmtnfGhlcm8xQmFja2dyb3VuZHxeJCcsXG4gICAgICAgICAgJ2knXG4gICAgICAgICksXG4gICAgICAgIC8vdGl0bGVSZWdleCA9IG5ldyBSZWdFeHAoXCJeKG1haW5UaXRsZXxtYWluLXRpdGxlfGhlcm9UaXRsZXxoZXJvLXRpdGxlfHRpdGxlfCkkXCIsIFwiaVwiKSxcbiAgICAgICAgLy9zdWJ0aXRsZVJlZ2V4ID0gbmV3IFJlZ0V4cChcIl4oc3VidGl0bGV8c3ViLXRpdGxlfGhlcm9TdWJ0aXRsZXxoZXJvLXN1YnRpdGxlfCkkXCIsIFwiaVwiKSxcbiAgICAgICAgYnV0dG9uQmdDb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAnXihoZXJvQnV0dG9uQmdDb2xvcnxoZXJvLWJ1dHRvbi1iZy1jb2xvcnxoZXJvQnV0dG9uQmFja2dyb3VuZENvbG9yfGhlcm8tYnV0dG9uLWJhY2tncm91bmQtY29sb3J8aGVyb0JrZ0NvbG9yfGhlcm8tYmtnLWNvbG9yfCkkJyxcbiAgICAgICAgICAnaSdcbiAgICAgICAgKSxcbiAgICAgICAgYnV0dG9uQm9yZGVyQ29sb3JSZWdleCA9IG5ldyBSZWdFeHAoJ14oaGVyb0J1dHRvbkJvcmRlckNvbG9yfGhlcm8tYnV0dG9uLWJvcmRlci1jb2xvcnxoZXJvQm9yZGVyQ29sb3J8aGVyby1ib3JkZXItY29sb3J8KSQnLCAnaScpLFxuICAgICAgICBoZWFkZXJCZ0NvbG9yID0gJ2hlYWRlckJnQ29sb3InLFxuICAgICAgICBoZWFkZXJMb2dvSW1nID0gJ2hlYWRlckxvZ29JbWcnLFxuICAgICAgICBoZXJvQmdJbWcgPSAnaGVyb0JnSW1nJyxcbiAgICAgICAgLy9oZXJvVGl0bGUgPSBcImhlcm9UaXRsZVwiLFxuICAgICAgICAvL2hlcm9TdWJ0aXRsZSA9IFwiaGVyb1N1YnRpdGxlXCIsXG4gICAgICAgIGZvcm1CdXR0b25CZ0NvbG9yID0gJ2Zvcm1CdXR0b25CZ0NvbG9yJyxcbiAgICAgICAgZm9vdGVyTG9nb0ltZyA9ICdmb290ZXJMb2dvSW1nJyxcbiAgICAgICAgLy90aXRsZSA9IFwiWW91IFRvIE91ciBFdmVudFwiLFxuICAgICAgICAvL3N1YnRpdGxlID0gTElCLmdldEh1bWFuRGF0ZSgpLFxuICAgICAgICAvL2NvbXBhbnksXG4gICAgICAgIC8vY29tcGFueU5hbWUsXG4gICAgICAgIGVkaXRBc3NldFZhcnMsXG4gICAgICAgIHdhaXRGb3JMb2FkTXNnXG5cbiAgICAgIHdhaXRGb3JMb2FkTXNnID0gbmV3IEV4dC5XaW5kb3coe1xuICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcbiAgICAgICAgbW9kYWw6IHRydWUsXG4gICAgICAgIHdpZHRoOiA1MDAsXG4gICAgICAgIGhlaWdodDogMjUwLFxuICAgICAgICBjbHM6ICdta3RNb2RhbEZvcm0nLFxuICAgICAgICB0aXRsZTogJ1BsZWFzZSBXYWl0IGZvciBQYWdlIHRvIExvYWQnLFxuICAgICAgICBodG1sOiAnPHU+U2F2aW5nIEVkaXRzPC91PiA8YnI+V2FpdCB1bnRpbCB0aGlzIHBhZ2UgY29tcGxldGVseSBsb2FkcyBiZWZvcmUgY2xvc2luZy4gPGJyPjxicj48dT5UbyBEaXNhYmxlIFRoaXMgRmVhdHVyZTo8L3U+IDxicj5DbGVhciB0aGUgc2VsZWN0ZWQgY29tcGFueSB2aWEgdGhlIE1hcmtldG9MaXZlIGV4dGVuc2lvbi4nXG4gICAgICB9KVxuXG4gICAgICBlZGl0QXNzZXRWYXJzID0gZnVuY3Rpb24gKGFzc2V0KSB7XG4gICAgICAgIGxldCBhc3NldFZhcnMgPSBhc3NldC5nZXRSZXNwb25zaXZlVmFyVmFsdWVzKClcbiAgICAgICAgLy9pc0xhbmRpbmdQYWdlRWRpdG9yRnJhZ21lbnRTdG9yZSxcbiAgICAgICAgLy9jb3VudCA9IDAsXG4gICAgICAgIC8vaXNUaXRsZVVwZGF0ZWQgPSBpc1N1YnRpdGxlVXBkYXRlZCA9IGZhbHNlO1xuXG4gICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuXG4gICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShoZWFkZXJCZ0NvbG9yLCBjb2xvcilcbiAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGhlYWRlckxvZ29JbWcsIGxvZ28pXG4gICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShoZXJvQmdJbWcsIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAvL2Fzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShoZXJvVGl0bGUsIHRpdGxlKTtcbiAgICAgICAgLy9hc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoaGVyb1N1YnRpdGxlLCBzdWJ0aXRsZSk7XG4gICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShmb3JtQnV0dG9uQmdDb2xvciwgY29sb3IpXG4gICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShmb290ZXJMb2dvSW1nLCBsb2dvKVxuXG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBPYmplY3Qua2V5cyhhc3NldFZhcnMpLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGxldCBjdXJyVmFyaWFibGVLZXkgPSBPYmplY3Qua2V5cyhhc3NldFZhcnMpW2lpXSxcbiAgICAgICAgICAgIGN1cnJWYXJpYWJsZVZhbHVlID0gT2JqZWN0LnZhbHVlcyhhc3NldFZhcnMpW2lpXS50b1N0cmluZygpXG5cbiAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgY3VyclZhcmlhYmxlVmFsdWUgPSAnJ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGxvZ29SZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goaHR0cFJlZ0V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGN1cnJWYXJpYWJsZUtleSwgbG9nbylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goaGVyb0JnUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGh0dHBSZWdFeCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShjdXJyVmFyaWFibGVLZXksIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChidXR0b25CZ0NvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBjb2xvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goYnV0dG9uQm9yZGVyQ29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goY29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShjdXJyVmFyaWFibGVLZXksIGNvbG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3YWl0Rm9yTG9hZE1zZy5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KFwiTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZVwiKS5sb2FkRWRpdG9yVmlldygpO1xuICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuaGlkZSgpXG4gICAgICAgICAgfSwgNzUwMClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogTGFuZGluZyBQYWdlIFZhcmlhYmxlcycpXG4gICAgICBpZiAobW9kZSA9PSAnZWRpdCcpIHtcbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgZWRpdEFzc2V0VmFycyhhc3NldClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgaXNMYW5kaW5nUGFnZUVkaXRvclZhcmlhYmxlcyA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0JykgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpLmdldFJlc3BvbnNpdmVWYXJWYWx1ZXMoKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpLnNldFJlc3BvbnNpdmVWYXJWYWx1ZSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogTGFuZGluZyBQYWdlIEVkaXRvciBWYXJpYWJsZXMnKVxuICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0xhbmRpbmdQYWdlRWRpdG9yVmFyaWFibGVzKVxuXG4gICAgICAgICAgICAgIGVkaXRBc3NldFZhcnMoTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCAwKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT0gJ3ByZXZpZXcnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+IEVkaXRpbmc6IExhbmRpbmcgUGFnZSBQcmV2aWV3ZXIgVmFyaWFibGVzJylcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgc2V0UHJvZ3JhbVJlcG9ydEZpbHRlcjogZnVuY3Rpb24gKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkLCBuZXdQcm9ncmFtQ29tcElkKSB7XG4gICAgbGV0IGFwcGx5UHJvZ3JhbVJlcG9ydEZpbHRlclxuXG4gICAgYXBwbHlQcm9ncmFtUmVwb3J0RmlsdGVyID0gZnVuY3Rpb24gKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkKSB7XG4gICAgICBsZXQgY3Vyck5ld1JlcG9ydFxuXG4gICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlLmxlbmd0aDsgaWkrKykge1xuICAgICAgICBjdXJyTmV3UmVwb3J0ID0gZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlW2lpXVxuXG4gICAgICAgIGlmIChjdXJyTmV3UmVwb3J0LmNvbXBUeXBlID09ICdSZXBvcnQnKSB7XG4gICAgICAgICAgbGV0IHJlcG9ydEZpbHRlclR5cGUsIHNlbGVjdGVkTm9kZXNcblxuICAgICAgICAgIGlmICgvXkVtYWlsL2kudGVzdChjdXJyTmV3UmVwb3J0LnRleHQpKSB7XG4gICAgICAgICAgICByZXBvcnRGaWx0ZXJUeXBlID0gJ21hRW1haWwnXG4gICAgICAgICAgICBzZWxlY3RlZE5vZGVzID0gJ1tcIicgKyBjbG9uZVRvRm9sZGVySWQgKyAnXCJdJ1xuICAgICAgICAgIH0gZWxzZSBpZiAoL14oRW5nYWdlbWVudHxOdXJ0dXIpL2kudGVzdChjdXJyTmV3UmVwb3J0LnRleHQpKSB7XG4gICAgICAgICAgICByZXBvcnRGaWx0ZXJUeXBlID0gJ251cnR1cmVwcm9ncmFtJ1xuICAgICAgICAgICAgc2VsZWN0ZWROb2RlcyA9ICdbXCInICsgY2xvbmVUb0ZvbGRlcklkICsgJ1wiXSdcbiAgICAgICAgICB9IGVsc2UgaWYgKC9eTGFuZGluZy9pLnRlc3QoY3Vyck5ld1JlcG9ydC50ZXh0KSkge1xuICAgICAgICAgICAgcmVwb3J0RmlsdGVyVHlwZSA9ICdtYUxhbmRpbmcnXG4gICAgICAgICAgICBzZWxlY3RlZE5vZGVzID0gJ1tcIicgKyBjbG9uZVRvRm9sZGVySWQgKyAnXCJdJ1xuICAgICAgICAgIH0gZWxzZSBpZiAoL15Qcm9ncmFtL2kudGVzdChjdXJyTmV3UmVwb3J0LnRleHQpKSB7XG4gICAgICAgICAgICByZXBvcnRGaWx0ZXJUeXBlID0gJ3Byb2dyYW0nXG4gICAgICAgICAgICBzZWxlY3RlZE5vZGVzID0gJ1tcIicgKyBjbG9uZVRvRm9sZGVySWQgKyAnXCJdJ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChyZXBvcnRGaWx0ZXJUeXBlICYmIHNlbGVjdGVkTm9kZXMpIHtcbiAgICAgICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICAgICAnL2FuYWx5dGljcy9hcHBseUNvbXBvbmVudEZpbHRlcicsXG4gICAgICAgICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICAgICAgICcmbm9kZUlkcz0nICtcbiAgICAgICAgICAgICAgc2VsZWN0ZWROb2RlcyArXG4gICAgICAgICAgICAgICcmZmlsdGVyVHlwZT0nICtcbiAgICAgICAgICAgICAgcmVwb3J0RmlsdGVyVHlwZSArXG4gICAgICAgICAgICAgICcmcmVwb3J0SWQ9JyArXG4gICAgICAgICAgICAgIGN1cnJOZXdSZXBvcnQuY29tcElkICtcbiAgICAgICAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAgICAgICAnUE9TVCcsXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2xvbmVUb0ZvbGRlcklkKSB7XG4gICAgICBpZiAoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlKSB7XG4gICAgICAgIGFwcGx5UHJvZ3JhbVJlcG9ydEZpbHRlcihnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgIH0gZWxzZSBpZiAobmV3UHJvZ3JhbUNvbXBJZCkge1xuICAgICAgICBhcHBseVByb2dyYW1SZXBvcnRGaWx0ZXIoTElCLmdldFByb2dyYW1Bc3NldERldGFpbHMobmV3UHJvZ3JhbUNvbXBJZCksIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgc2V0UHJvZ3JhbVRhZzogZnVuY3Rpb24gKG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhLCBuZXdQcm9ncmFtQ29tcElkLCB0YWdOYW1lLCB0YWdWYWx1ZSkge1xuICAgIGxldCBjdXJyU2V0dGluZywgdGFnRGF0YVxuXG4gICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhLmxlbmd0aDsgaWkrKykge1xuICAgICAgY3VyclNldHRpbmcgPSBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YVtpaV1cblxuICAgICAgaWYgKGN1cnJTZXR0aW5nLnN1bW1hcnlEYXRhLm5hbWUgPT0gdGFnTmFtZSkge1xuICAgICAgICB0YWdEYXRhID0gZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgICAgICAgICd7XCJwcm9ncmFtSWRcIjonICtcbiAgICAgICAgICBuZXdQcm9ncmFtQ29tcElkICtcbiAgICAgICAgICAnLFwicHJvZ3JhbURlc2NyaXB0b3JJZFwiOicgK1xuICAgICAgICAgIHBhcnNlSW50KGN1cnJTZXR0aW5nLmlkLnJlcGxhY2UoL15QRC0vLCAnJykpICtcbiAgICAgICAgICAnLFwiZGVzY3JpcHRvcklkXCI6JyArXG4gICAgICAgICAgY3VyclNldHRpbmcuZGVzY3JpcHRvcklkICtcbiAgICAgICAgICAnLFwiZGVzY3JpcHRvclZhbHVlXCI6XCInICtcbiAgICAgICAgICB0YWdWYWx1ZSArXG4gICAgICAgICAgJ1wifSdcbiAgICAgICAgKVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0YWdEYXRhKSB7XG4gICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgJy9tYXJrZXRpbmdFdmVudC9zZXRQcm9ncmFtRGVzY3JpcHRvclN1Ym1pdCcsXG4gICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICcmY29tcElkPScgK1xuICAgICAgICBuZXdQcm9ncmFtQ29tcElkICtcbiAgICAgICAgJyZfanNvbj0nICtcbiAgICAgICAgdGFnRGF0YSArXG4gICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgJ1BPU1QnLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJycsXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICB9XG4gICAgICApXG4gICAgfVxuICB9XG5cbn1cbiIsImNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFJ1bm5pbmcnKVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBzY3JpcHQgY29udGFpbnMgYWxsIG9mIHRoZSBmdW5jdGlvbmFsaXR5IG5lZWRlZCBmb3IgdGhlIG1hbmlwdWxhdGlvbiBvZiB0aGVcbiAqICBNYXJrZXRvTGl2ZSBlbnZpcm9ubWVudHMuXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby12YXJcbnZhciBwcm9kRXh0ZW5zaW9uSWQgPSAnb25pYm5ub2dobGxsZGllY2JvZWxicGNhZWdnZmlvaGwnLFxuICBleHRlbnNpb25JZCA9IHByb2RFeHRlbnNpb25JZCxcbiAgZXh0ZW5zaW9uTWluVmVyc2lvbiA9ICc1LjAuMCcsXG4gIG1rdG9BcHBEb21haW4gPSAnXmh0dHBzOi8vYXBwLVthLXowLTldKy5tYXJrZXRvLmNvbScsXG4gIG1rdG9EZXNpZ25lckRvbWFpbiA9ICdeaHR0cHM6Ly9bYS16MC05XSstW2EtejAtOV0rLm1hcmtldG9kZXNpZ25lci5jb20nLFxuICBta3RvRGVzaWduZXJIb3N0ID0gJ25hLXNqcC5tYXJrZXRvZGVzaWduZXIuY29tJyxcbiAgbWt0b1dpemFyZCA9IG1rdG9BcHBEb21haW4gKyAnL20jJyxcbiAgbWt0b0VtYWlsRGVzaWduZXIgPSBta3RvRGVzaWduZXJEb21haW4gKyAnL2RzJyxcbiAgbWt0b0xhbmRpbmdQYWdlRGVzaWduZXIgPSBta3RvRGVzaWduZXJEb21haW4gKyAnL2xwZWRpdG9yLycsXG4gIG1rdG9FbWFpbEluc2lnaHRzTGluayA9ICdodHRwczovL2luc2lnaHRzLm1hcmtldG9saXZlLmNvbS9lbWFpbCcsXG4gIG1rdG9FbWFpbERlbGl2ZXJhYmlsaXR5VG9vbHNMaW5rID0gJ2h0dHBzOi8vMjUwb2suY29tL2xvZ2luP3N1Ym1pdD10cnVlJyxcbiAgbWt0b0JpemlibGVEaXNjb3ZlckxpbmsgPSAnaHR0cHM6Ly9hcHBzLmJpemlibGUuY29tL0Rpc2NvdmVyLzM4MzknLFxuICBta3RvQml6aWJsZVJldlBsYW5MaW5rID1cbiAgICAnaHR0cHM6Ly9hcHBzLmJpemlibGUuY29tL015QWNjb3VudC9CdXNpbmVzcy8zOTE/YnVzVmlldz1mYWxzZSMhL015QWNjb3VudC9CdXNpbmVzcy9EZWNpc2lvbkVuZ2luZS5EZWNpc2lvbkVuZ2luZUhvbWUnLFxuICBkZW1vTW9kZWxlckxpbmsgPSAnaHR0cHM6Ly9hcHAtc2pwLm1hcmtldG8uY29tLz9wcmV2aWV3PXRydWUmYXBwcm92ZWQ9dHJ1ZS8jUkNNODNBMScsXG4gIG1rdG9EZW1vQWNjb3VudE1hdGNoID0gJ15ta3RvZGVtb2FjY291bnQnLFxuICBta3RvTXlNYXJrZXRvRnJhZ21lbnQgPSAnTU0wQTEnLFxuICBta3RvTXlNYXJrZXRvU3VwZXJiYWxsRnJhZ21lbnQgPSAnTU0nLFxuICBta3RvQ2FsZW5kYXJGcmFnbWVudCA9ICdDQUwnLFxuICBta3RvQW5hbHl0aWNzRnJhZ21lbnQgPSAnQVInLFxuICBta3RvUmVwb3J0RnJhZ21lbnRSZWdleCA9IG5ldyBSZWdFeHAoJ15BUlteIV0rISQnLCAnaScpLFxuICBta3RvTW9kZWxlckZyYWdtZW50UmVnZXggPSBuZXcgUmVnRXhwKCdeUkNNW14hXSshJCcsICdpJyksXG4gIG1rdG9BbmFseXRpY3NGcmFnbWVudE1hdGNoID0gbmV3IFJlZ0V4cCgnXkFSW14hXSshJHxeUkNNW14hXSshJCcsICdpJyksXG4gIG1rdG9Nb2RlbGVyUHJldmlld0ZyYWdtZW50UmVnZXggPSBuZXcgUmVnRXhwKCdwcmV2aWV3PXRydWUmYXBwcm92ZWQ9dHJ1ZS8jUkNNW14hXSshJCcsICdpJyksXG4gIG1rdG9BbmFseXRpY3NIb21lRnJhZ21lbnQgPSAnQUgwQTFaTicsXG4gIG1rdG9BY2NvdW50QmFzZWRNYXJrZXRpbmdGcmFnbWVudCA9ICdBQk0wQTEnLFxuICBta3RvQWRCcmlkZ2VTbWFydExpc3RGcmFnbWVudCA9ICdTTDExMTk1NjZCMkxBMScsXG4gIG1rdG9BZG1pblNhbGVzZm9yY2VGcmFnbWVudCA9ICdTRjBBMScsXG4gIG1rdG9BZG1pbkR5bmFtaWNzRnJhZ21lbnQgPSAnRFkwQTEnLFxuICBta3RvQWRtaW5SY2FDdXN0b21GaWVsZFN5bmMgPSAnQ0ZTMEIyJyxcbiAgbWt0b1BlcnNvbkRldGFpbFBhdGggPSAnL2xlYWREYXRhYmFzZS9sb2FkTGVhZERldGFpbCcsXG4gIG1rdG9EZWZhdWx0RGl5TGFuZGluZ1BhZ2VSZXNwb25zaXZlRWRpdEZyYWdtZW50ID0gJ0xQRTExODIyJyxcbiAgd2FpdEFmdGVyRGlzY2FyZCA9IDIwMDAsXG4gIG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyID0gJ21rdG9kZW1vbGl2ZW1hc3RlcicsIC8vVE9ETyB0ZW1wIGNoYW5nZSBmb3IgdGVzdGluZyBiYWNrIHRvIG1rdG9kZW1vbGl2ZW1hc3RlclxuICBta3RvQWNjb3VudFN0cmluZ01hc3Rlck1FVUUgPSAnbWt0b2RlbW9hY2NvdW50NTQ0JywgLy9hYmRlbW8xIGNsb25lIG9mIG1rdG9kZW1vbGl2ZW1hc3RlclxuICBta3RvQWNjb3VudFN0cmluZ1FlID0gJ2dsb2JhbHNhbGVzJyxcbiAgbWt0b0FjY291bnRTdHJpbmcxMDYgPSAnbWt0b2RlbW9hY2NvdW50MTA2JyxcbiAgbWt0b0FjY291bnRTdHJpbmcxMDZkID0gJ21rdG9kZW1vYWNjb3VudDEwNmQnLFxuICBta3RvQWNjb3VudFN0cmluZ0R5bmFtaWNzID0gJ21rdG9kZW1vYWNjb3VudDQwOCcsXG4gIG1rdG9BY2NvdW50U3RyaW5nczEwNk1hdGNoID0gJ14oJyArIG1rdG9BY2NvdW50U3RyaW5nMTA2ICsgJ3wnICsgbWt0b0FjY291bnRTdHJpbmcxMDZkICsgJykkJyxcbiAgbWt0b0FjY291bnRTdHJpbmdzTWF0Y2ggPVxuICAgICdeKCcgK1xuICAgIG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyICtcbiAgICAnfCcgK1xuICAgIG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyTUVVRSArXG4gICAgJ3wnICtcbiAgICBta3RvQWNjb3VudFN0cmluZzEwNiArXG4gICAgJ3wnICtcbiAgICBta3RvQWNjb3VudFN0cmluZzEwNmQgK1xuICAgICd8JyArXG4gICAgbWt0b0FjY291bnRTdHJpbmdEeW5hbWljcyArXG4gICAgJykkJywgLy9UT0RPIGNoYW5nZWQgZm9yIE1FVUVcbiAgbWt0b0xhdW5jaFBvaW50Rm9sZGVyVG9IaWRlID0gbmV3IFJlZ0V4cCgnXkxhdW5jaFBvaW50JCcsICdpJyksXG4gIG1rdG9PcGVyYXRpb25hbEZvbGRlcnMgPSBuZXcgUmVnRXhwKCdeX09wZXJhdGlvbmFsfF5fT3BlcmF0aW9uc3xcXFxcKFRFU1RcXFxcKSQnLCAnaScpLFxuICBta3RvTWFzdGVyTWFya2V0aW5nQWN0aXZpdGllc0VuZ2xpc2hGcmFnbWVudCA9ICdNQTE5QTEnLFxuICBta3RvTWFya2V0aW5nQWN0aXZpdGllc0RlZmF1bHRGcmFnbWVudCA9ICdNQTE1QTEnLFxuICBta3RvTWFya2V0aW5nQWN0aXZpdGllc1VzZXJGcmFnbWVudCA9ICdNQTE5ODAyQTEnLFxuICBta3RvTWFya2V0aW5nQWN0aXZpdGllc0phcGFuZXNlRnJhZ21lbnQgPSAnTUExOTg0OEExJyxcbiAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNGaW5zZXJ2RnJhZ21lbnQgPSAnTUEyMDgwNkExJyxcbiAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNIZWFsdGhjYXJlRnJhZ21lbnQgPSAnTUEyMDgyNkExJyxcbiAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNIaWdoZXJFZEZyYWdtZW50ID0gJ01BMjA4NDZBMScsXG4gIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzTWFudWZhY3R1cmluZ0ZyYWdtZW50ID0gJ01BMjY0MTBBMScsXG4gIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzVGVjaG5vbG9neUZyYWdtZW50ID0gJ01BMjY0ODlBMScsXG4gIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzVHJhdmVsTGVpc3VyZUZyYWdtZW50ID0gJ01BMjc1ODhBMScsXG4gIG1rdG9NYXN0ZXJMZWFkRGF0YWJhc2VFbmdsaXNoRnJhZ21lbnQgPSAnTUwwQTFaTjUnLFxuICBta3RvTGVhZERhdGFiYXNlRGVmYXVsdEZyYWdtZW50ID0gJ01MMEExWk4yJyxcbiAgbWt0b0xlYWREYXRhYmFzZVVzZXJGcmFnbWVudCA9ICdNTDBBMVpOMTk3ODgnLFxuICBta3RvTGVhZERhdGFiYXNlSmFwYW5lc2VGcmFnbWVudCA9ICdNTDBBMVpOMTk4MzQnLFxuICBta3RvTGVhZERhdGFiYXNlRmluc2VydkZyYWdtZW50ID0gJ01MMEExWk4yMDc5MicsXG4gIG1rdG9MZWFkRGF0YWJhc2VIZWFsdGhjYXJlRnJhZ21lbnQgPSAnTUwwQTFaTjIwODEyJyxcbiAgbWt0b0xlYWREYXRhYmFzZUhpZ2hlckVkRnJhZ21lbnQgPSAnTUwwQTFaTjIwODMyJyxcbiAgbWt0b0xlYWREYXRhYmFzZU1hbnVmYWN0dXJpbmdGcmFnbWVudCA9ICdNTDBBMVpOMjYzOTYnLFxuICBta3RvTGVhZERhdGFiYXNlVGVjaG5vbG9neUZyYWdtZW50ID0gJ01MMEExWk4yNjQ3NScsXG4gIG1rdG9MZWFkRGF0YWJhc2VUcmF2ZWxMZWlzdXJlRnJhZ21lbnQgPSAnTUwwQTFaTjI3NTc0JyxcbiAgbWt0b0FkbWluRW1haWxFbWFpbEZyYWdtZW50ID0gJ0VBMEExJyxcbiAgbWt0b0FkbWluV2ViU2VydmljZXNGcmFnbWVudCA9ICdNVzBBMScsXG4gIG1rdG9BZG1pbldlYlNreUZyYWdtZW50ID0gJ0hHMEExJyxcbiAgbWt0b0Rpc2FibGVCdXR0b25zRnJhZ21lbnRNYXRjaCA9XG4gICAgJ14oJyArXG4gICAgbWt0b01hc3Rlck1hcmtldGluZ0FjdGl2aXRpZXNFbmdsaXNoRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNEZWZhdWx0RnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNVc2VyRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNKYXBhbmVzZUZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzRmluc2VydkZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzSGVhbHRoY2FyZUZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzSGlnaGVyRWRGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTWFya2V0aW5nQWN0aXZpdGllc01hbnVmYWN0dXJpbmdGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTWFya2V0aW5nQWN0aXZpdGllc1RlY2hub2xvZ3lGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTWFya2V0aW5nQWN0aXZpdGllc1RyYXZlbExlaXN1cmVGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTWFzdGVyTGVhZERhdGFiYXNlRW5nbGlzaEZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9MZWFkRGF0YWJhc2VEZWZhdWx0RnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0xlYWREYXRhYmFzZVVzZXJGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTGVhZERhdGFiYXNlSmFwYW5lc2VGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTGVhZERhdGFiYXNlRmluc2VydkZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9MZWFkRGF0YWJhc2VIZWFsdGhjYXJlRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0xlYWREYXRhYmFzZUhpZ2hlckVkRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0xlYWREYXRhYmFzZU1hbnVmYWN0dXJpbmdGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTGVhZERhdGFiYXNlVGVjaG5vbG9neUZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9MZWFkRGF0YWJhc2VUcmF2ZWxMZWlzdXJlRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0FkbWluRW1haWxFbWFpbEZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9BZG1pbldlYlNlcnZpY2VzRnJhZ21lbnQgK1xuICAgICcpJCcsXG4gIG1rdG9PcHBJbmZsdWVuY2VBbmFseXplckZyYWdtZW50ID0gJ0FSMTU1OUExIScsXG4gIG1rdG9Qcm9ncmFtQW5hbHl6ZXJGcmFnbWVudCA9ICdBUjE1NDRBMSEnLFxuICBta3RvTW9kZWxlckZyYWdtZW50ID0gJ1JDTTcwQTEhJyxcbiAgbWt0b1N1Y2Nlc3NQYXRoQW5hbHl6ZXJGcmFnbWVudCA9ICdBUjE2ODJBMSEnLFxuICBta3RvQW5hbHl6ZXJzRnJhZ21lbnRNYXRjaCA9XG4gICAgJ14oJyArXG4gICAgbWt0b09wcEluZmx1ZW5jZUFuYWx5emVyRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b1Byb2dyYW1BbmFseXplckZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9Nb2RlbGVyRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b1N1Y2Nlc3NQYXRoQW5hbHl6ZXJGcmFnbWVudCArXG4gICAgJykkJyxcbiAgbWt0b01vYmlsZVB1c2hOb3RpZmljYXRpb25GcmFnbWVudCA9ICdNUE4nLFxuICBta3RvSW5BcHBNZXNzYWdlRnJhZ21lbnQgPSAnSUFNJyxcbiAgbWt0b1Ntc01lc3NhZ2VGcmFnbWVudCA9ICdTTVMnLFxuICBta3RvU29jaWFsQXBwRnJhZ21lbnQgPSAnU09BJyxcbiAgbWt0b090aGVyQXNzZXRzRnJhZ21lbnRNYXRjaCA9XG4gICAgJ14oJyArXG4gICAgbWt0b01vYmlsZVB1c2hOb3RpZmljYXRpb25GcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvSW5BcHBNZXNzYWdlRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b1Ntc01lc3NhZ2VGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvU29jaWFsQXBwRnJhZ21lbnQgK1xuICAgICcpJyxcbiAgbWt0b0FibURpc2NvdmVyTWFya2V0b0NvbXBhbmllc0ZyYWdtZW50ID0gJ0FCTURNJyxcbiAgbWt0b0FibURpc2NvdmVyQ3JtQWNjb3VudHNGcmFnbWVudCA9ICdBQk1EQycsXG4gIG1rdG9BYm1OYW1lZEFjY291bnRGcmFnbWVudCA9ICdOQScsXG4gIG1rdG9BYm1JbXBvcnROYW1lZEFjY291bnRzRnJhZ21lbnQgPSAnQUJNSUEnLFxuICBta3RvQWJtRnJhZ21lbnRNYXRjaCA9XG4gICAgJ14oJyArXG4gICAgbWt0b0FibURpc2NvdmVyTWFya2V0b0NvbXBhbmllc0ZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9BYm1EaXNjb3ZlckNybUFjY291bnRzRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0FibU5hbWVkQWNjb3VudEZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9BYm1JbXBvcnROYW1lZEFjY291bnRzRnJhZ21lbnQgK1xuICAgICcpJCcsXG4gIG1rdG9FbWFpbEVkaXRGcmFnbWVudCA9ICdFTUUnLFxuICBta3RvRW1haWxQcmV2aWV3RnJhZ21lbnRSZWdleCA9IG5ldyBSZWdFeHAoJ15FTUVbMC05XSsmaXNQcmV2aWV3JywgJ2knKSxcbiAgbWt0b0VtYWlsUHJldmlld0ZyYWdtZW50MiA9ICdFTUVbMC05XSsmaXNQcmV2aWV3JyxcbiAgbWt0b0VtYWlsUHJldmlld0ZyYWdtZW50ID0gJ0VNUCcsXG4gIG1rdG9FbWFpbFRlbXBsYXRlRWRpdEZyYWdtZW50ID0gJ0VNVEUnLFxuICBta3RvTGFuZGluZ1BhZ2VFZGl0RnJhZ21lbnQgPSAnTFBFJyxcbiAgbWt0b0xhbmRpbmdQYWdlUHJldmlld0ZyYWdtZW50ID0gJ0xQUCcsXG4gIG1rdG9MYW5kaW5nUGFnZVByZXZpZXdEcmFmdEZyYWdtZW50ID0gJ0xQUEQnLFxuICBta3RvTGFuZGluZ1BhZ2VUZW1wbGF0ZUVkaXRGcmFnbWVudCA9ICdMUFRFJyxcbiAgbWt0b0xhbmRpbmdQYWdlVGVtcGxhdGVQcmV2aWV3RnJhZ21lbnQgPSAnTFBUUEQnLFxuICBta3RvRm9ybUVkaXRGcmFnbWVudCA9ICdGT0UnLFxuICBta3RvRm9ybVByZXZpZXdGcmFnbWVudCA9ICdGT1AnLFxuICBta3RvRm9ybVByZXZpZXdEcmFmdEZyYWdtZW50ID0gJ0ZPUEQnLFxuICBta3RvUHVzaE5vdGlmaWNhdGlvbkVkaXRGcmFnbWVudCA9ICdNUE5FJyxcbiAgbWt0b01vYmlsZVB1c2hOb3RpZmljYXRpb25QcmV2aWV3RnJhZ21lbnQgPSAnTVBOUCcsXG4gIG1rdG9JbkFwcE1lc3NhZ2VFZGl0RnJhZ21lbnQgPSAnSUFNRScsXG4gIG1rdG9JbkFwcE1lc3NhZ2VQcmV2aWV3RnJhZ21lbnQgPSAnSUFNUCcsXG4gIG1rdG9TbXNNZXNzYWdlRWRpdEZyYWdtZW50ID0gJ1NNRScsXG4gIG1rdG9Tb2NpYWxBcHBFZGl0RnJhZ21lbnQgPSAnU09BRScsXG4gIG1rdG9Tb2NpYWxBcHBQcmV2aWV3RnJhZ21lbnQgPSAnU09BUCcsXG4gIG1rdG9BYlRlc3RFZGl0RnJhZ21lbnQgPSAnRUJFJyxcbiAgbWt0b0VtYWlsVGVzdEdyb3VwRWRpdEZyYWdtZW50ID0gJ0NDRScsXG4gIG1rdG9TbmlwcGV0RWRpdEZyYWdtZW50ID0gJ1NORScsXG4gIG1rdG9TbmlwcGV0UHJldmlld0ZyYWdtZW50ID0gJ1NOUCcsXG4gIG1rdG9EZXNpZ25lcnNGcmFnbWVudE1hdGNoID1cbiAgICAnXicgK1xuICAgIG1rdG9FbWFpbEVkaXRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9FbWFpbFByZXZpZXdGcmFnbWVudDIgK1xuICAgICd8XicgK1xuICAgIG1rdG9FbWFpbFByZXZpZXdGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9FbWFpbFRlbXBsYXRlRWRpdEZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0xhbmRpbmdQYWdlRWRpdEZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0xhbmRpbmdQYWdlUHJldmlld0ZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0xhbmRpbmdQYWdlUHJldmlld0RyYWZ0RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvTGFuZGluZ1BhZ2VUZW1wbGF0ZUVkaXRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9MYW5kaW5nUGFnZVRlbXBsYXRlUHJldmlld0ZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0Zvcm1FZGl0RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvRm9ybVByZXZpZXdGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9Gb3JtUHJldmlld0RyYWZ0RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvUHVzaE5vdGlmaWNhdGlvbkVkaXRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9Nb2JpbGVQdXNoTm90aWZpY2F0aW9uUHJldmlld0ZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0luQXBwTWVzc2FnZUVkaXRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9JbkFwcE1lc3NhZ2VQcmV2aWV3RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvU21zTWVzc2FnZUVkaXRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9Tb2NpYWxBcHBFZGl0RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvU29jaWFsQXBwUHJldmlld0ZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0FiVGVzdEVkaXRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9FbWFpbFRlc3RHcm91cEVkaXRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9TbmlwcGV0RWRpdEZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b1NuaXBwZXRQcmV2aWV3RnJhZ21lbnQgK1xuICAgICckJyxcbiAgbWt0b0RlZmF1bHRXb3Jrc3BhY2VJZCxcbiAgbWt0b0phcGFuZXNlV29ya3NwYWNlSWQsXG4gIG1rdG9GaW5zZXJ2V29ya3NwYWNlSWQsXG4gIG1rdG9IZWFsdGhjYXJlV29ya3NwYWNlSWQsXG4gIG1rdG9IaWdoZXJFZFdvcmtzcGFjZUlkLFxuICBta3RvTWFudWZhY3R1cmluZ1dvcmtzcGFjZUlkLFxuICBta3RvVGVjaG5vbG9neVdvcmtzcGFjZUlkLFxuICBta3RvVHJhdmVsTGVzaXVyZVdvcmtzcGFjZUlkLFxuICBta3RvVW5rbm93bldvcmtzcGFjZUlkLFxuICBta3RvR29sZGVuV29ya3NwYWNlc01hdGNoLFxuICBta3RvTXlXb3Jrc3BhY2VFbklkLFxuICBta3RvTXlXb3Jrc3BhY2VKcElkLFxuICBta3RvTXlXb3Jrc3BhY2VJZE1hdGNoLFxuICBta3RvTXlXb3Jrc3BhY2VFbk5hbWUsXG4gIG1rdG9NeVdvcmtzcGFjZUpwTmFtZSxcbiAgbWt0b015V29ya3NwYWNlTmFtZU1hdGNoLFxuICBta3RvT3RoZXJXb3Jrc3BhY2VOYW1lLFxuICBta3RvRW1haWxQZXJmb3JtYW5jZVJlcG9ydCxcbiAgbWt0b1Blb3BsZVBlcmZvcm1hbmNlUmVwb3J0LFxuICBta3RvV2ViUGFnZUFjdGl2aXR5UmVwb3J0LFxuICBta3RvT3Bwb3J0dW5pdHlJbmZsdWVuY2VBbmFseXplcixcbiAgbWt0b1Byb2dyYW1BbmFseXplcixcbiAgbWt0b1N1Y2Nlc3NQYXRoQW5hbHl6ZXIsXG4gIG1rdG9QZXJmb3JtYW5jZUluc2lnaHRzTGluayxcbiAgbWt0b0VuZ2FnbWVudFN0cmVhbVBlcmZvcm1hY2VSZXBvcnQsXG4gIG1rdG9Qcm9ncmFtUGVyZm9ybWFuY2VSZXBvcnQsXG4gIG1rdG9FbWFpbExpbmtQZXJmb3JtYW5jZVJlcG9ydCxcbiAgbWt0b1Blb3BsZUJ5UmV2ZW51ZVN0YWdlUmVwb3J0LFxuICBta3RvTGFuZGluZ1BhZ2VQZXJmb3JtYW5jZVJlcG9ydCxcbiAgbWt0b1Blb3BsZUJ5U3RhdHVzUmVwb3J0LFxuICBta3RvQ29tcGFueVdlYkFjdGl2aXR5UmVwb3J0LFxuICBta3RvU2FsZXNJbnNpZ2h0RW1haWxQZXJmb3JtYW5jZVJlcG9ydCxcbiAgcmVzdG9yZUVtYWlsSW5zaWdodHMsXG4gIG9yaWdFbWFpbEluc2lnaHRzVGlsZUxpbmssXG4gIG9yaWdFbWFpbEluc2lnaHRzTWVudUl0ZW1MaW5rLFxuICBjdXJyVXJsRnJhZ21lbnQsXG4gIGN1cnJDb21wRnJhZ21lbnQsXG4gIHVzZXJOYW1lLFxuICBhY2NvdW50U3RyaW5nLFxuICBvcmlnTWVudVNob3dBdEZ1bmMsXG4gIG9yaWdBamF4UmVxdWVzdEZ1bmMsXG4gIG9yaWdBc3NldFNhdmVFZGl0LFxuICBvcmlnRmlsbENhbnZhcyxcbiAgb3JpZ0V4cGxvcmVyUGFuZWxBZGROb2RlLFxuICBvcmlnRXhwbG9yZXJQYW5lbFJlbW92ZU5vZGVzLFxuICBvcmlnRXhwbG9yZXJQYW5lbFVwZGF0ZU5vZGVUZXh0LFxuICBvdmVycmlkZVRpbGVUaW1lckNvdW50ID0gdHJ1ZSxcbiAgQVBQID0gQVBQIHx8IHt9XG5cbi8vIHNldCB0aGUgaW5zdGFuY2Ugc3BlY2lmaWMgdmFyaWFibGVzIHdpdGggdGhlIHByb3BlciB2YWx1ZXNcbkFQUC5zZXRJbnN0YW5jZUluZm8gPSBmdW5jdGlvbiAoYWNjb3VudFN0cmluZykge1xuICBpZiAoYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3Rlcikge1xuICAgIG1rdG9EZWZhdWx0V29ya3NwYWNlSWQgPSAxXG4gICAgbWt0b0phcGFuZXNlV29ya3NwYWNlSWQgPSAzXG4gICAgbWt0b1Vua25vd25Xb3Jrc3BhY2VJZCA9IC0xXG4gICAgbWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCA9ICdeKCcgKyBta3RvRGVmYXVsdFdvcmtzcGFjZUlkICsgJ3wnICsgbWt0b0phcGFuZXNlV29ya3NwYWNlSWQgKyAnfCcgKyBta3RvVW5rbm93bldvcmtzcGFjZUlkICsgJykkJ1xuXG4gICAgbWt0b015V29ya3NwYWNlRW5JZFxuICAgIG1rdG9NeVdvcmtzcGFjZUpwSWRcbiAgICBta3RvTXlXb3Jrc3BhY2VJZE1hdGNoID0gbnVsbFxuXG4gICAgbWt0b015V29ya3NwYWNlRW5OYW1lXG4gICAgbWt0b015V29ya3NwYWNlSnBOYW1lXG4gICAgbWt0b015V29ya3NwYWNlTmFtZU1hdGNoID0gbnVsbFxuXG4gICAgbWt0b090aGVyV29ya3NwYWNlTmFtZSA9ICdVc2VyXFwncyBXb3Jrc3BhY2UnXG5cbiAgICBta3RvRW1haWxQZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjIwNUIyJ1xuICAgIG1rdG9QZW9wbGVQZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjIzQjInXG4gICAgbWt0b1dlYlBhZ2VBY3Rpdml0eVJlcG9ydCA9ICdBUjIxOEIyJ1xuICAgIG1rdG9PcHBvcnR1bml0eUluZmx1ZW5jZUFuYWx5emVyID0gJ0FSMjA3QTEnXG4gICAgbWt0b1Byb2dyYW1BbmFseXplciA9ICdBUjIyM0ExJ1xuICAgIG1rdG9TdWNjZXNzUGF0aEFuYWx5emVyID0gJ0FSMjA4QTEnXG4gICAgbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rID0gJ2h0dHBzOi8vaW5zaWdodHMubWFya2V0b2xpdmUuY29tL21waSdcbiAgICBta3RvRW5nYWdtZW50U3RyZWFtUGVyZm9ybWFjZVJlcG9ydCA9ICdBUjIwOUIyJ1xuICAgIG1rdG9Qcm9ncmFtUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIyMTZCMidcbiAgICBta3RvRW1haWxMaW5rUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIyMDRCMidcbiAgICBta3RvUGVvcGxlQnlSZXZlbnVlU3RhZ2VSZXBvcnQgPSAnQVIyNkIyJ1xuICAgIG1rdG9MYW5kaW5nUGFnZVBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMjEwQjInXG4gICAgbWt0b1Blb3BsZUJ5U3RhdHVzUmVwb3J0ID0gJ0FSMjI1QjInXG4gICAgbWt0b0NvbXBhbnlXZWJBY3Rpdml0eVJlcG9ydCA9ICdBUjIyMUIyJ1xuICAgIG1rdG9TYWxlc0luc2lnaHRFbWFpbFBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMjI2QjInXG4gIH0gZWxzZSBpZiAoYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3Rlck1FVUUpIHtcbiAgICBta3RvRGVmYXVsdFdvcmtzcGFjZUlkID0gMVxuICAgIG1rdG9KYXBhbmVzZVdvcmtzcGFjZUlkID0gM1xuICAgIG1rdG9Vbmtub3duV29ya3NwYWNlSWQgPSAtMVxuICAgIG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2ggPSAnXignICsgbWt0b0RlZmF1bHRXb3Jrc3BhY2VJZCArICd8JyArIG1rdG9KYXBhbmVzZVdvcmtzcGFjZUlkICsgJ3wnICsgbWt0b1Vua25vd25Xb3Jrc3BhY2VJZCArICcpJCdcblxuICAgIG1rdG9NeVdvcmtzcGFjZUVuSWRcbiAgICBta3RvTXlXb3Jrc3BhY2VKcElkXG4gICAgbWt0b015V29ya3NwYWNlSWRNYXRjaCA9IG51bGxcblxuICAgIG1rdG9NeVdvcmtzcGFjZUVuTmFtZVxuICAgIG1rdG9NeVdvcmtzcGFjZUpwTmFtZVxuICAgIG1rdG9NeVdvcmtzcGFjZU5hbWVNYXRjaCA9IG51bGxcblxuICAgIG1rdG9PdGhlcldvcmtzcGFjZU5hbWUgPSAnVXNlclxcJ3MgV29ya3NwYWNlJ1xuXG4gICAgbWt0b0VtYWlsUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIyMDVCMidcbiAgICBta3RvUGVvcGxlUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIyM0IyJ1xuICAgIG1rdG9XZWJQYWdlQWN0aXZpdHlSZXBvcnQgPSAnQVIyMThCMidcbiAgICBta3RvT3Bwb3J0dW5pdHlJbmZsdWVuY2VBbmFseXplciA9ICdBUjIwN0ExJ1xuICAgIG1rdG9Qcm9ncmFtQW5hbHl6ZXIgPSAnQVIyMjNBMSdcbiAgICBta3RvU3VjY2Vzc1BhdGhBbmFseXplciA9ICdBUjIwOEExJ1xuICAgIG1rdG9QZXJmb3JtYW5jZUluc2lnaHRzTGluayA9ICdodHRwczovL2luc2lnaHRzLm1hcmtldG9saXZlLmNvbS9tcGknXG4gICAgbWt0b0VuZ2FnbWVudFN0cmVhbVBlcmZvcm1hY2VSZXBvcnQgPSAnQVIyMDlCMidcbiAgICBta3RvUHJvZ3JhbVBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMjE2QjInXG4gICAgbWt0b0VtYWlsTGlua1BlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMjA0QjInXG4gICAgbWt0b1Blb3BsZUJ5UmV2ZW51ZVN0YWdlUmVwb3J0ID0gJ0FSMjZCMidcbiAgICBta3RvTGFuZGluZ1BhZ2VQZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjIxMEIyJ1xuICAgIG1rdG9QZW9wbGVCeVN0YXR1c1JlcG9ydCA9ICdBUjIyNUIyJ1xuICAgIG1rdG9Db21wYW55V2ViQWN0aXZpdHlSZXBvcnQgPSAnQVIyMjFCMidcbiAgICBta3RvU2FsZXNJbnNpZ2h0RW1haWxQZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjIyNkIyJ1xuICB9IGVsc2UgaWYgKGFjY291bnRTdHJpbmcuc2VhcmNoKG1rdG9BY2NvdW50U3RyaW5nczEwNk1hdGNoKSAhPSAtMSkge1xuICAgIG1rdG9EZWZhdWx0V29ya3NwYWNlSWQgPSAxXG4gICAgbWt0b0phcGFuZXNlV29ya3NwYWNlSWQgPSAxNzNcbiAgICBta3RvRmluc2VydldvcmtzcGFjZUlkID0gMTc0XG4gICAgbWt0b0hlYWx0aGNhcmVXb3Jrc3BhY2VJZCA9IDE3NVxuICAgIG1rdG9IaWdoZXJFZFdvcmtzcGFjZUlkID0gMTc2XG4gICAgbWt0b01hbnVmYWN0dXJpbmdXb3Jrc3BhY2VJZCA9IDE4NFxuICAgIG1rdG9UZWNobm9sb2d5V29ya3NwYWNlSWQgPSAxODVcbiAgICBta3RvVHJhdmVsTGVzaXVyZVdvcmtzcGFjZUlkID0gMTg2XG4gICAgbWt0b1Vua25vd25Xb3Jrc3BhY2VJZCA9IC0xXG4gICAgbWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCA9XG4gICAgICAnXignICtcbiAgICAgIG1rdG9EZWZhdWx0V29ya3NwYWNlSWQgK1xuICAgICAgJ3wnICtcbiAgICAgIG1rdG9KYXBhbmVzZVdvcmtzcGFjZUlkICtcbiAgICAgICd8JyArXG4gICAgICBta3RvRmluc2VydldvcmtzcGFjZUlkICtcbiAgICAgICd8JyArXG4gICAgICBta3RvSGVhbHRoY2FyZVdvcmtzcGFjZUlkICtcbiAgICAgICd8JyArXG4gICAgICBta3RvSGlnaGVyRWRXb3Jrc3BhY2VJZCArXG4gICAgICAnfCcgK1xuICAgICAgbWt0b01hbnVmYWN0dXJpbmdXb3Jrc3BhY2VJZCArXG4gICAgICAnfCcgK1xuICAgICAgbWt0b1RlY2hub2xvZ3lXb3Jrc3BhY2VJZCArXG4gICAgICAnfCcgK1xuICAgICAgbWt0b1RyYXZlbExlc2l1cmVXb3Jrc3BhY2VJZCArXG4gICAgICAnfCcgK1xuICAgICAgbWt0b1Vua25vd25Xb3Jrc3BhY2VJZCArXG4gICAgICAnKSQnXG5cbiAgICBta3RvTXlXb3Jrc3BhY2VFbklkID0gMTcyXG4gICAgbWt0b015V29ya3NwYWNlSWRNYXRjaCA9ICdeKCcgKyBta3RvTXlXb3Jrc3BhY2VFbklkICsgJykkJ1xuXG4gICAgbWt0b015V29ya3NwYWNlRW5OYW1lID0gJ015IFdvcmtzcGFjZSdcbiAgICBta3RvTXlXb3Jrc3BhY2VOYW1lTWF0Y2ggPSAnXignICsgbWt0b015V29ya3NwYWNlRW5OYW1lICsgJykkJ1xuXG4gICAgbWt0b090aGVyV29ya3NwYWNlTmFtZSA9ICdVc2VyXFwncyBXb3Jrc3BhY2UnXG5cbiAgICBta3RvRW1haWxQZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjM4NjZCMidcbiAgICBta3RvUGVvcGxlUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIzODc0QjInXG4gICAgbWt0b1dlYlBhZ2VBY3Rpdml0eVJlcG9ydCA9ICdBUjM4NzZCMidcbiAgICBta3RvT3Bwb3J0dW5pdHlJbmZsdWVuY2VBbmFseXplciA9ICdBUjE1NTlBMSdcbiAgICBta3RvUHJvZ3JhbUFuYWx5emVyID0gJ0FSMTU0NEExJ1xuICAgIG1rdG9TdWNjZXNzUGF0aEFuYWx5emVyID0gJ0FSMTY4MkExJ1xuICAgIG1rdG9QZXJmb3JtYW5jZUluc2lnaHRzTGluayA9ICdodHRwczovL2luc2lnaHRzLm1hcmtldG9saXZlLmNvbS9tcGknXG4gICAgbWt0b0VuZ2FnbWVudFN0cmVhbVBlcmZvcm1hY2VSZXBvcnQgPSAnQVIzODgxQjInXG4gICAgbWt0b1Byb2dyYW1QZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjM4ODJCMidcbiAgICBta3RvRW1haWxMaW5rUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIzODg2QjInXG4gICAgbWt0b1Blb3BsZUJ5UmV2ZW51ZVN0YWdlUmVwb3J0ID0gJ0FSMzg4OUIyJ1xuICAgIG1rdG9MYW5kaW5nUGFnZVBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMzg5MUIyJ1xuICAgIG1rdG9QZW9wbGVCeVN0YXR1c1JlcG9ydCA9ICdBUjM4OTNCMidcbiAgICBta3RvQ29tcGFueVdlYkFjdGl2aXR5UmVwb3J0ID0gJ0FSMzkwMUIyJ1xuICAgIG1rdG9TYWxlc0luc2lnaHRFbWFpbFBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMzkwM0IyJ1xuICB9IGVsc2UgaWYgKGFjY291bnRTdHJpbmcgPT0gbWt0b0FjY291bnRTdHJpbmdEeW5hbWljcykge1xuICAgIG1rdG9EZWZhdWx0V29ya3NwYWNlSWQgPSAxXG4gICAgbWt0b1Vua25vd25Xb3Jrc3BhY2VJZCA9IC0xXG4gICAgbWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCA9ICdeKCcgKyBta3RvRGVmYXVsdFdvcmtzcGFjZUlkICsgJ3wnICsgbWt0b1Vua25vd25Xb3Jrc3BhY2VJZCArICcpJCdcblxuICAgIG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2ggPSBudWxsXG4gICAgbWt0b015V29ya3NwYWNlTmFtZU1hdGNoID0gbnVsbFxuXG4gICAgbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rID0gJ2h0dHBzOi8vaW5zaWdodHMubWFya2V0b2xpdmUuY29tL21waSdcbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIHNlbmRzIGEgbWVzc2FnZSB0byB0aGUgZXh0ZW5zaW9uIGluIG9yZGVyIHRvIGNyZWF0ZSBhIENocm9tZVxuICogIG5vdGlmaWNhdGlvbiBpbiBhIGdpdmVuIGluc3RhbmNlIGFuZCBhIHVzZXIgd2l0aCBhIHNwZWNpZmljIHJvbGUuXG4gKiAgQHBhcmFtIHtTdHJpbmd9IGFjY291bnRTdHJpbmcgLSBNYXJrZXRvIGluc3RhbmNlXG4gKiAgQHBhcmFtIHtTdHJpbmd9IHJvbGVOYW1lIC0gcm9sZSBvZiB0aGUgY3VycmVudCB1c2VyIChPcHRpb25hbClcbiAqICBAcGFyYW0ge1N0cmluZ30gbWt0b1VzZXJJZCAtIHVzZXIgbmFtZSBvZiB0aGUgY3VycmVudCB1c2VyIChPcHRpb25hbClcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLnNlbmRNa3RvTWVzc2FnZSA9IGZ1bmN0aW9uIChhY2NvdW50U3RyaW5nLCByb2xlTmFtZSwgbWt0b1VzZXJJZCkge1xuICBsZXQgYWRUYXJnZXRpbmdNc2cgPSB7XG4gICAgICBhY3Rpb246ICdta3RvTGl2ZU1lc3NhZ2UnLFxuICAgICAgaWQ6ICdhZFRhcmdldGluZycsXG4gICAgICB0aXRsZTogJ05ldyBGZWF0dXJlOiBBZCBUYXJnZXRpbmcnLFxuICAgICAgbm90aWZ5OiAnTm93IHlvdSBjYW4gcXVpY2tseSBjYXB0dXJlIGFkIHRhcmdldGluZyBpbWFnZXMgb3IgZGVtbyBhZCB0YXJnZXRpbmcgbGl2ZSBmb3I6XFxuXFxuR29vZ2xlIFNlYXJjaCwgRmFjZWJvb2ssIExpbmtlZEluJyxcbiAgICAgIHJlcXVpcmVJbnRlcmFjdGlvbjogdHJ1ZSxcbiAgICAgIGJ1dHRvblRpdGxlOiAnICAgICAgICAgICAgICAgICAgICAgICAgTGVhcm4gTW9yZSAtLT4nLFxuICAgICAgYnV0dG9uTGluazogJ2h0dHA6Ly93d3cubWFya2V0b2xpdmUuY29tL2VuL2xlYXJuL3ZpZGVvcycsXG4gICAgICBzdGFydERhdGU6ICcnLFxuICAgICAgZW5kRGF0ZTogJzA3LTI3LTIwMTcnLFxuICAgICAgbnVtT2ZUaW1lc1BlckRheTogMVxuICAgIH0sXG4gICAgdXNlcldvcmtzcGFjZU1zZyA9IHtcbiAgICAgIGFjdGlvbjogJ21rdG9MaXZlTWVzc2FnZScsXG4gICAgICBpZDogJ3VzZXJXb3Jrc3BhY2UnLFxuICAgICAgdGl0bGU6ICdOZXcgVG8gUmVsb2FkZWQ6IFVzZXIgV29ya3NwYWNlJyxcbiAgICAgIG5vdGlmeTpcbiAgICAgICAgJ0xldmVyYWdlIHlvdXIgb3duIFNDIHdvcmtzcGFjZSBmb3IgY3JlYXRpbmcgYW55IHByb2dyYW0vYXNzZXQgdXNpbmcgdGhlIHByb3ZpZGVkIGRlbW8gZGF0YSBvZiBvdXIgc2hhcmVkIHBhcnRpdGlvbiBpbiB0aGUgTWFya2V0b0xpdmUgUmVsb2FkZWQgaW5zdGFuY2UuXFxuXFxuVXNlciBJRDogJyxcbiAgICAgIHJlcXVpcmVJbnRlcmFjdGlvbjogdHJ1ZSxcbiAgICAgIHN0YXJ0RGF0ZTogJycsXG4gICAgICBlbmREYXRlOiAnMDctMTItMjAxNycsXG4gICAgICBudW1PZlRpbWVzUGVyRGF5OiAyXG4gICAgfSxcbiAgICBleHRlbnNpb25VcGRhdGVNc2cgPSB7XG4gICAgICBhY3Rpb246ICdta3RvTGl2ZU1lc3NhZ2UnLFxuICAgICAgaWQ6ICdleHRlbnNpb25VcGRhdGUnLFxuICAgICAgdGl0bGU6ICdDb21pbmcgU29vbjogRXh0ZW5zaW9uIHY1LjIuMCcsXG4gICAgICBub3RpZnk6XG4gICAgICAgICdXaXRoaW4gdGhlIG5leHQgZGF5IG9yIHR3byB5b3VyIGV4dGVuc2lvbiB3aWxsIGF1dG9tYXRpY2FsbHkgdXBkYXRlIGFuZCBiZSBkaXNhYmxlZCBkdWUgdG8gbmV3IHBlcm1pc3Npb25zIGJlaW5nIHJlcXVlc3RlZC4gQXBwcm92ZSB0aGUgbmV3IHBlcm1pc3Npb24gYnkgcmUtZW5hYmxpbmcgdGhlIGV4dGVuc2lvbi4nLFxuICAgICAgcmVxdWlyZUludGVyYWN0aW9uOiB0cnVlLFxuICAgICAgYnV0dG9uVGl0bGU6ICcgICAgICAgICAgICAgICAgICAgICAgICBIb3cgdG8gUmUtZW5hYmxlIHRoZSBFeHRlbnNpb24gLS0+JyxcbiAgICAgIGJ1dHRvbkxpbms6ICdodHRwOi8vd3d3Lm1hcmtldG9saXZlLmNvbS9lbi91cGRhdGUvZXh0ZW5zaW9uLXVwZGF0ZScsXG4gICAgICBzdGFydERhdGU6ICcnLFxuICAgICAgZW5kRGF0ZTogJzA4LTE2LTIwMTcnLFxuICAgICAgbnVtT2ZUaW1lc1BlckRheTogMVxuICAgIH0sXG4gICAgY2hhbmdlUGFzc3dvcmRNc2cgPSB7XG4gICAgICBhY3Rpb246ICdta3RvTGl2ZU1lc3NhZ2UnLFxuICAgICAgaWQ6ICdjaGFuZ2VQYXNzd29yZE1zZycsXG4gICAgICB0aXRsZTogJ01BTkRBVE9SWTogQ2hhbmdlIFlvdXIgUGFzc3dvcmQnLFxuICAgICAgbm90aWZ5OiAnQXMgcGVyIElUIHNlY3VyaXR5IHBvbGljeSwgcGFzc3dvcmRzIG11c3QgZXhwaXJlIGV2ZXJ5IDYwIGRheXMuIFBsZWFzZSBjaGFuZ2UgeW91ciBwYXNzd29yZCBiZWZvcmUgQXVndXN0IDE4dGguJyxcbiAgICAgIHJlcXVpcmVJbnRlcmFjdGlvbjogdHJ1ZSxcbiAgICAgIGJ1dHRvblRpdGxlOiAnICAgICAgICAgICAgICAgICAgICAgICAgQ2hhbmdlIFlvdXIgUGFzc3dvcmQgLS0+JyxcbiAgICAgIGJ1dHRvbkxpbms6ICdodHRwczovL2FwcC1zamRlbW8xLm1hcmtldG8uY29tLyNNQzBBMScsXG4gICAgICBzdGFydERhdGU6ICcnLFxuICAgICAgZW5kRGF0ZTogJzA4LTE3LTIwMTcnLFxuICAgICAgbnVtT2ZUaW1lc1BlckRheTogMVxuICAgIH0sXG4gICAgaXNzdWVNc2cgPSB7XG4gICAgICBhY3Rpb246ICdta3RvTGl2ZU1lc3NhZ2UnLFxuICAgICAgaWQ6ICdlbWFpbEluc2lnaHRzTXNnJyxcbiAgICAgIHRpdGxlOiAnRW1haWwgSW5zaWdodHMgTm90IFdvcmtpbmcnLFxuICAgICAgbm90aWZ5OlxuICAgICAgICAnVGhlcmUgaXMgYSBrbm93biBpc3N1ZSB3aXRoIEVtYWlsIEluc2lnaHRzIG5vdCBkaXNwbGF5aW5nIGRhdGEgYWZ0ZXIgMDcvMTUvMTcuXFxuXFxuQXMgYSBmaXgsIEkgaGF2ZSBkZWVwIGxpbmtlZCBpdFxcJ3MgdGlsZSBhbmQgbWVudSBpdGVtIHRvIG91ciBFbWFpbCBJbnNpZ2h0cyBkZW1vIGFwcC4nLFxuICAgICAgcmVxdWlyZUludGVyYWN0aW9uOiB0cnVlLFxuICAgICAgYnV0dG9uVGl0bGU6ICcgICAgICAgICAgICAgICAgICAgICAgICBFbWFpbCBJbnNpZ2h0cyBEZW1vIEFwcCAtLT4nLFxuICAgICAgYnV0dG9uTGluazogJ2h0dHA6Ly93d3cubWFya2V0b2xpdmUuY29tL2VuL2FuYWx5dGljcy9lbWFpbC1pbnNpZ2h0cy1zdW1taXQtZGVtby0xJyxcbiAgICAgIHN0YXJ0RGF0ZTogJycsXG4gICAgICBlbmREYXRlOiAnMDgtMDktMjAxNycsXG4gICAgICBudW1PZlRpbWVzUGVyRGF5OiAxXG4gICAgfVxuXG4gIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKGV4dGVuc2lvbklkLCBleHRlbnNpb25VcGRhdGVNc2cpXG5cbn1cblxuQVBQLmdldFdvcmtzcGFjZU5hbWUgPSBmdW5jdGlvbiAod29ya3NwYWNlSWQpIHtcbiAgc3dpdGNoIChwYXJzZUludCh3b3Jrc3BhY2VJZCkpIHtcbiAgICBjYXNlIG1rdG9EZWZhdWx0V29ya3NwYWNlSWQ6XG4gICAgICByZXR1cm4gJ0RlZmF1bHQnXG4gICAgY2FzZSBta3RvSmFwYW5lc2VXb3Jrc3BhY2VJZDpcbiAgICAgIHJldHVybiAn44OH44OiJ1xuICAgIGNhc2UgbWt0b0ZpbnNlcnZXb3Jrc3BhY2VJZDpcbiAgICAgIHJldHVybiAnRmluYW5jaWFsIFNlcnZpY2VzJ1xuICAgIGNhc2UgbWt0b0hlYWx0aGNhcmVXb3Jrc3BhY2VJZDpcbiAgICAgIHJldHVybiAnSGVhbHRoY2FyZSdcbiAgICBjYXNlIG1rdG9IaWdoZXJFZFdvcmtzcGFjZUlkOlxuICAgICAgcmV0dXJuICdIaWdoZXIgRWR1Y2F0aW9uJ1xuICAgIGNhc2UgbWt0b01hbnVmYWN0dXJpbmdXb3Jrc3BhY2VJZDpcbiAgICAgIHJldHVybiAnTWFudWZhY3R1cmluZydcbiAgICBjYXNlIG1rdG9UZWNobm9sb2d5V29ya3NwYWNlSWQ6XG4gICAgICByZXR1cm4gJ1RlY2hub2xvZ3knXG4gICAgY2FzZSBta3RvVHJhdmVsTGVzaXVyZVdvcmtzcGFjZUlkOlxuICAgICAgcmV0dXJuICdUcmF2ZWwgTGVpc3VyZSdcbiAgICBjYXNlIG1rdG9NeVdvcmtzcGFjZUVuSWQ6XG4gICAgICByZXR1cm4gJ015IFdvcmtzcGFjZSdcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICdVbmtub3duJ1xuICB9XG59XG5cbi8vIHJldHVybnMgdGhlIDItMyBsZXR0ZXIgYXNzZXQgY29kZSBmb3IgdGhlIGFzc2V0IHR5cGUgcHJvdmlkZWQuXG5BUFAuZ2V0QXNzZXRDb21wQ29kZSA9IGZ1bmN0aW9uIChjb21wVHlwZSkge1xuICBzd2l0Y2ggKGNvbXBUeXBlKSB7XG4gICAgY2FzZSAnTWFya2V0aW5nIEZvbGRlcic6XG4gICAgICByZXR1cm4gJ01GJ1xuICAgIGNhc2UgJ01hcmtldGluZyBQcm9ncmFtJzpcbiAgICAgIHJldHVybiAnUEcnXG4gICAgY2FzZSAnTWFya2V0aW5nIEV2ZW50JzpcbiAgICAgIHJldHVybiAnTUUnXG4gICAgY2FzZSAnTnVydHVyZSBQcm9ncmFtJzpcbiAgICAgIHJldHVybiAnTlAnXG4gICAgY2FzZSAnRW1haWwgQmF0Y2ggUHJvZ3JhbSc6XG4gICAgICByZXR1cm4gJ0VCUCdcbiAgICBjYXNlICdMaXN0JzpcbiAgICAgIHJldHVybiAnU1QnXG4gICAgY2FzZSAnU21hcnQgTGlzdCc6XG4gICAgICByZXR1cm4gJ1NMJ1xuICAgIGNhc2UgJ1NtYXJ0IENhbXBhaWduJzpcbiAgICAgIHJldHVybiAnU0MnXG4gICAgY2FzZSAnTGFuZGluZyBQYWdlIEZvcm0nOlxuICAgICAgcmV0dXJuICdGTydcbiAgICBjYXNlICdMYW5kaW5nIFBhZ2UnOlxuICAgICAgcmV0dXJuICdMUCdcbiAgICBjYXNlICdMYW5kaW5nIFBhZ2UgVGVzdCBHcm91cCc6XG4gICAgICByZXR1cm4gJ0xQJ1xuICAgIGNhc2UgJ0xhbmRpbmcgUGFnZSBUZW1wbGF0ZSc6XG4gICAgICByZXR1cm4gJ0xUJ1xuICAgIGNhc2UgJ0VtYWlsJzpcbiAgICAgIHJldHVybiAnRU0nXG4gICAgY2FzZSAnVGVzdCBHcm91cCc6XG4gICAgICByZXR1cm4gJ1RHJ1xuICAgIGNhc2UgJ0VtYWlsIFRlbXBsYXRlJzpcbiAgICAgIHJldHVybiAnRVQnXG4gICAgY2FzZSAnU29jaWFsIEFwcCc6XG4gICAgICByZXR1cm4gJ1NPQSdcbiAgICBjYXNlICdNb2JpbGUgUHVzaCBOb3RpZmljYXRpb24nOlxuICAgICAgcmV0dXJuICdNUE4nXG4gICAgY2FzZSAnSW4tQXBwIE1lc3NhZ2UnOlxuICAgICAgcmV0dXJuICdJQU0nXG4gICAgY2FzZSAnU01TIE1lc3NhZ2UnOlxuICAgICAgcmV0dXJuICdTTVMnXG4gICAgY2FzZSAnU2VnbWVudGF0aW9uJzpcbiAgICAgIHJldHVybiAnU0cnXG4gICAgY2FzZSAnUmVwb3J0JzpcbiAgICAgIHJldHVybiAnQVInXG4gICAgY2FzZSAnUmV2ZW51ZSBDeWNsZSBNb2RlbCc6XG4gICAgICByZXR1cm4gJ1JDTSdcbiAgICBjYXNlICdTbmlwcGV0JzpcbiAgICAgIHJldHVybiAnU04nXG4gICAgY2FzZSAnSW1hZ2UnOlxuICAgICAgcmV0dXJuICdGSSdcbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIG1vbml0b3JzIGNoYW5nZXMgdG8gdGhlIFRyZWUgYW5kIHRyYWNrcyB3aGVuZXZlciBhIG5vZGUgaXMgZWl0aGVyXG4gKiAgYWRkZWQgb3IgcmVuYW1lZCBpbiBhIGdvbGRlbiB3b3Jrc3BhY2UgYW5kIHJlcG9ydHMgdGhpcyB0byB0aGUgdXNlciB2aWEgYW5cbiAqICBleHRlbnNpb24gbm90aWZpY2F0aW9uIGFuZCB0byB0aGUgRGVtbyBTZXJ2aWNlcyBUZWFtIHZpYSBtYXJrZXRvbGl2ZS1idWdzIHByaXZhdGVcbiAqICBTbGFjayBjaGFubmVsLlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuQVBQLnRyYWNrVHJlZU5vZGVFZGl0cyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gVHJhY2tpbmc6IEVkaXRzIHRvIFRyZWUgTm9kZXMnKVxuICBsZXQgdmlvbGF0aW9uTXNnID0ge1xuICAgIGFjdGlvbjogJ21rdG9MaXZlTWVzc2FnZScsXG4gICAgaWQ6ICdOb3QgUGVybWl0dGVkJyxcbiAgICB0aXRsZTogJ05vdCBQZXJtaXR0ZWQnLFxuICAgIG5vdGlmeTogJycsXG4gICAgcmVxdWlyZUludGVyYWN0aW9uOiB0cnVlXG4gIH1cblxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QubWFpbi5FeHBsb3JlclBhbmVsLnByb3RvdHlwZS5hZGROb2RlJykpIHtcbiAgICBpZiAodHlwZW9mIG9yaWdFeHBsb3JlclBhbmVsQWRkTm9kZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgb3JpZ0V4cGxvcmVyUGFuZWxBZGROb2RlID0gTWt0Lm1haW4uRXhwbG9yZXJQYW5lbC5wcm90b3R5cGUuYWRkTm9kZVxuICAgIH1cbiAgICBNa3QubWFpbi5FeHBsb3JlclBhbmVsLnByb3RvdHlwZS5hZGROb2RlID0gZnVuY3Rpb24gKHBhcmVudElkLCBub2RlQ29uZmlnLCBzZWxlY3RlZCkge1xuICAgICAgaWYgKFxuICAgICAgICBub2RlQ29uZmlnICYmXG4gICAgICAgICgobm9kZUNvbmZpZy56ICYmIG5vZGVDb25maWcuei50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkgfHxcbiAgICAgICAgICAobm9kZUNvbmZpZy5hY2Nlc3Nab25lSWQgJiYgbm9kZUNvbmZpZy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEpKVxuICAgICAgKSB7XG4gICAgICAgIGxldCBjaGFuZ2VkTm9kZUluZm8gPVxuICAgICAgICAgICAgJ1xcbj4qQWRkZWQgTm9kZToqICcgK1xuICAgICAgICAgICAgbm9kZUNvbmZpZy5jb21wVHlwZSArXG4gICAgICAgICAgICAnIHwgJyArXG4gICAgICAgICAgICBub2RlQ29uZmlnLnRleHQgK1xuICAgICAgICAgICAgJyB8ICcgK1xuICAgICAgICAgICAgJ2h0dHBzOi8vJyArXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaG9zdCArXG4gICAgICAgICAgICAnLyMnICtcbiAgICAgICAgICAgIEFQUC5nZXRBc3NldENvbXBDb2RlKG5vZGVDb25maWcuY29tcFR5cGUpICtcbiAgICAgICAgICAgIG5vZGVDb25maWcuY29tcElkLFxuICAgICAgICAgIHdvcmtzcGFjZUlkLFxuICAgICAgICAgIHdvcmtzcGFjZU5hbWUsXG4gICAgICAgICAgd29ya3NwYWNlSW5mbyxcbiAgICAgICAgICB1c2VySW5mbyxcbiAgICAgICAgICBwYXJlbnROb2RlSW5mb1xuXG4gICAgICAgIGlmIChub2RlQ29uZmlnLnopIHtcbiAgICAgICAgICB3b3Jrc3BhY2VJZCA9IG5vZGVDb25maWcuelxuICAgICAgICAgIHdvcmtzcGFjZU5hbWUgPSBBUFAuZ2V0V29ya3NwYWNlTmFtZShub2RlQ29uZmlnLnopXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgd29ya3NwYWNlSWQgPSBub2RlQ29uZmlnLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgIHdvcmtzcGFjZU5hbWUgPSBBUFAuZ2V0V29ya3NwYWNlTmFtZShub2RlQ29uZmlnLmFjY2Vzc1pvbmVJZClcbiAgICAgICAgfVxuICAgICAgICB3b3Jrc3BhY2VJbmZvID0gJ1xcbj4qV29ya3NwYWNlOiogJyArIHdvcmtzcGFjZU5hbWVcblxuICAgICAgICBpZiAoTWt0UGFnZSAmJiBNa3RQYWdlLnVzZXJOYW1lICYmIE1rdFBhZ2UudXNlcmlkKSB7XG4gICAgICAgICAgdXNlckluZm8gPSAnXFxuPipVc2VyOiogJyArIE1rdFBhZ2UudXNlck5hbWUgKyAnICgnICsgTWt0UGFnZS51c2VyaWQgKyAnKSAnXG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMuZ2V0Tm9kZUJ5SWQocGFyZW50SWQpICYmXG4gICAgICAgICAgdGhpcy5nZXROb2RlQnlJZChwYXJlbnRJZCkuYXR0cmlidXRlcyAmJlxuICAgICAgICAgIHRoaXMuZ2V0Tm9kZUJ5SWQocGFyZW50SWQpLmF0dHJpYnV0ZXMudGV4dCAmJlxuICAgICAgICAgIHRoaXMuZ2V0Tm9kZUJ5SWQocGFyZW50SWQpLmF0dHJpYnV0ZXMuY29tcFR5cGUgJiZcbiAgICAgICAgICB0aGlzLmdldE5vZGVCeUlkKHBhcmVudElkKS5hdHRyaWJ1dGVzLmNvbXBJZFxuICAgICAgICApIHtcbiAgICAgICAgICBwYXJlbnROb2RlSW5mbyA9XG4gICAgICAgICAgICAnXFxuPipQYXJlbnQgTm9kZToqICcgK1xuICAgICAgICAgICAgdGhpcy5nZXROb2RlQnlJZChwYXJlbnRJZCkuYXR0cmlidXRlcy5jb21wVHlwZSArXG4gICAgICAgICAgICAnIHwgJyArXG4gICAgICAgICAgICB0aGlzLmdldE5vZGVCeUlkKHBhcmVudElkKS5hdHRyaWJ1dGVzLnRleHQgK1xuICAgICAgICAgICAgJyB8ICcgK1xuICAgICAgICAgICAgJ2h0dHBzOi8vJyArXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaG9zdCArXG4gICAgICAgICAgICAnLyMnICtcbiAgICAgICAgICAgIEFQUC5nZXRBc3NldENvbXBDb2RlKHRoaXMuZ2V0Tm9kZUJ5SWQocGFyZW50SWQpLmF0dHJpYnV0ZXMuY29tcFR5cGUpICtcbiAgICAgICAgICAgIHRoaXMuZ2V0Tm9kZUJ5SWQocGFyZW50SWQpLmF0dHJpYnV0ZXMuY29tcElkXG4gICAgICAgIH1cblxuICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAnaHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAyNUZIM1U4L0I1MUhNUTIyVy9pSkd2SDhOQzh6VlBCRGx2VTN0cVRsMTUnLFxuICAgICAgICAgICd7XCJ0ZXh0XCI6IFwiKlVuYXV0aG9yaXplZCBDaGFuZ2VzKicgKyB1c2VySW5mbyArIHdvcmtzcGFjZUluZm8gKyBwYXJlbnROb2RlSW5mbyArIGNoYW5nZWROb2RlSW5mbyArICdcIn0nLFxuICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICB0cnVlLFxuICAgICAgICAgICcnXG4gICAgICAgIClcblxuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgICBuYW1lOiAnVW5hdXRob3JpemVkIE5vZGUgQWRkZWQnLFxuICAgICAgICAgIGFzc2V0TmFtZTogbm9kZUNvbmZpZy50ZXh0LFxuICAgICAgICAgIGFzc2V0SWQ6IG5vZGVDb25maWcuY29tcElkLFxuICAgICAgICAgIGFzc2V0VHlwZTogbm9kZUNvbmZpZy5jb21wVHlwZSxcbiAgICAgICAgICB3b3Jrc3BhY2VJZDogd29ya3NwYWNlSWQsXG4gICAgICAgICAgd29ya3NwYWNlTmFtZTogd29ya3NwYWNlTmFtZVxuICAgICAgICB9KVxuXG4gICAgICAgIDsodmlvbGF0aW9uTXNnLm5vdGlmeSA9ICdEbyBub3QgbWFrZSBjaGFuZ2VzIHRvIHRoZSAnICsgd29ya3NwYWNlTmFtZSArICcgV29ya3NwYWNlIScpLFxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShleHRlbnNpb25JZCwgdmlvbGF0aW9uTXNnKVxuICAgICAgfVxuICAgICAgb3JpZ0V4cGxvcmVyUGFuZWxBZGROb2RlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBpbmc6IFRyYWNrIEFkZGluZyBUcmVlIE5vZGVzJylcbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdC5tYWluLkV4cGxvcmVyUGFuZWwucHJvdG90eXBlLnJlbW92ZU5vZGVzJykpIHtcbiAgICBpZiAodHlwZW9mIG9yaWdFeHBsb3JlclBhbmVsUmVtb3ZlTm9kZXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9yaWdFeHBsb3JlclBhbmVsUmVtb3ZlTm9kZXMgPSBNa3QubWFpbi5FeHBsb3JlclBhbmVsLnByb3RvdHlwZS5yZW1vdmVOb2Rlc1xuICAgIH1cblxuICAgIE1rdC5tYWluLkV4cGxvcmVyUGFuZWwucHJvdG90eXBlLnJlbW92ZU5vZGVzID0gZnVuY3Rpb24gKG5vZGVJZHMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5nZXROb2RlQnlJZChub2RlSWRzWzBdKSAmJlxuICAgICAgICB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZHNbMF0pLmF0dHJpYnV0ZXMgJiZcbiAgICAgICAgdGhpcy5nZXROb2RlQnlJZChub2RlSWRzWzBdKS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZCAmJlxuICAgICAgICB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZHNbMF0pLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xXG4gICAgICApIHtcbiAgICAgICAgbGV0IG5vZGVDb25maWcgPSB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZHNbMF0pLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgd29ya3NwYWNlTmFtZSA9IEFQUC5nZXRXb3Jrc3BhY2VOYW1lKG5vZGVDb25maWcuYWNjZXNzWm9uZUlkKSxcbiAgICAgICAgICB3b3Jrc3BhY2VJbmZvID0gJ1xcbj4qV29ya3NwYWNlOiogJyArIHdvcmtzcGFjZU5hbWUsXG4gICAgICAgICAgY2hhbmdlZE5vZGVJbmZvID1cbiAgICAgICAgICAgICdcXG4+KlJlbW92ZWQgTm9kZToqICcgK1xuICAgICAgICAgICAgbm9kZUNvbmZpZy5jb21wVHlwZSArXG4gICAgICAgICAgICAnIHwgJyArXG4gICAgICAgICAgICBub2RlQ29uZmlnLnRleHQgK1xuICAgICAgICAgICAgJyB8ICcgK1xuICAgICAgICAgICAgJ2h0dHBzOi8vJyArXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaG9zdCArXG4gICAgICAgICAgICAnLyMnICtcbiAgICAgICAgICAgIEFQUC5nZXRBc3NldENvbXBDb2RlKG5vZGVDb25maWcuY29tcFR5cGUpICtcbiAgICAgICAgICAgIG5vZGVDb25maWcuY29tcElkLFxuICAgICAgICAgIHVzZXJJbmZvXG5cbiAgICAgICAgaWYgKE1rdFBhZ2UgJiYgTWt0UGFnZS51c2VyTmFtZSAmJiBNa3RQYWdlLnVzZXJpZCkge1xuICAgICAgICAgIHVzZXJJbmZvID0gJ1xcbj4qVXNlcjoqICcgKyBNa3RQYWdlLnVzZXJOYW1lICsgJyAoJyArIE1rdFBhZ2UudXNlcmlkICsgJykgJ1xuICAgICAgICB9XG5cbiAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgJ2h0dHBzOi8vaG9va3Muc2xhY2suY29tL3NlcnZpY2VzL1QwMjVGSDNVOC9CNTFITVEyMlcvaUpHdkg4TkM4elZQQkRsdlUzdHFUbDE1JyxcbiAgICAgICAgICAne1widGV4dFwiOiBcIipVbmF1dGhvcml6ZWQgQ2hhbmdlcyonICsgdXNlckluZm8gKyB3b3Jrc3BhY2VJbmZvICsgY2hhbmdlZE5vZGVJbmZvICsgJ1wifScsXG4gICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgIHRydWUsXG4gICAgICAgICAgJydcbiAgICAgICAgKVxuXG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgIG5hbWU6ICdVbmF1dGhvcml6ZWQgTm9kZSBSZW1vdmVkJyxcbiAgICAgICAgICBhc3NldE5hbWU6IG5vZGVDb25maWcudGV4dCxcbiAgICAgICAgICBhc3NldElkOiBub2RlQ29uZmlnLmNvbXBJZCxcbiAgICAgICAgICBhc3NldFR5cGU6IG5vZGVDb25maWcuY29tcFR5cGUsXG4gICAgICAgICAgd29ya3NwYWNlSWQ6IG5vZGVDb25maWcuYWNjZXNzWm9uZUlkLFxuICAgICAgICAgIHdvcmtzcGFjZU5hbWU6IHdvcmtzcGFjZU5hbWVcbiAgICAgICAgfSlcblxuICAgICAgICA7KHZpb2xhdGlvbk1zZy5ub3RpZnkgPSAnRG8gbm90IG1ha2UgY2hhbmdlcyB0byB0aGUgJyArIHdvcmtzcGFjZU5hbWUgKyAnIFdvcmtzcGFjZSEnKSxcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSWQsIHZpb2xhdGlvbk1zZylcbiAgICAgIH1cbiAgICAgIG9yaWdFeHBsb3JlclBhbmVsUmVtb3ZlTm9kZXMuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBTa2lwcGluZzogVHJhY2sgUmVtb3ZpbmcgVHJlZSBOb2RlcycpXG4gIH1cblxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QubWFpbi5FeHBsb3JlclBhbmVsLnByb3RvdHlwZS51cGRhdGVOb2RlVGV4dCcpKSB7XG4gICAgaWYgKHR5cGVvZiBvcmlnRXhwbG9yZXJQYW5lbFVwZGF0ZU5vZGVUZXh0ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcmlnRXhwbG9yZXJQYW5lbFVwZGF0ZU5vZGVUZXh0ID0gTWt0Lm1haW4uRXhwbG9yZXJQYW5lbC5wcm90b3R5cGUudXBkYXRlTm9kZVRleHRcbiAgICB9XG5cbiAgICBNa3QubWFpbi5FeHBsb3JlclBhbmVsLnByb3RvdHlwZS51cGRhdGVOb2RlVGV4dCA9IGZ1bmN0aW9uIChub2RlSWQsIHRleHQpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5nZXROb2RlQnlJZChub2RlSWQpICYmXG4gICAgICAgIHRoaXMuZ2V0Tm9kZUJ5SWQobm9kZUlkKS5hdHRyaWJ1dGVzICYmXG4gICAgICAgIHRoaXMuZ2V0Tm9kZUJ5SWQobm9kZUlkKS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZCAmJlxuICAgICAgICB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZCkuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTFcbiAgICAgICkge1xuICAgICAgICBsZXQgbm9kZUNvbmZpZyA9IHRoaXMuZ2V0Tm9kZUJ5SWQobm9kZUlkKS5hdHRyaWJ1dGVzLFxuICAgICAgICAgIHdvcmtzcGFjZU5hbWUgPSBBUFAuZ2V0V29ya3NwYWNlTmFtZShub2RlQ29uZmlnLmFjY2Vzc1pvbmVJZCksXG4gICAgICAgICAgd29ya3NwYWNlSW5mbyA9ICdcXG4+KldvcmtzcGFjZToqICcgKyB3b3Jrc3BhY2VOYW1lLFxuICAgICAgICAgIGNoYW5nZWROb2RlSW5mbyA9XG4gICAgICAgICAgICAnXFxuPipSZW5hbWVkIE5vZGU6KiAnICtcbiAgICAgICAgICAgIG5vZGVDb25maWcuY29tcFR5cGUgK1xuICAgICAgICAgICAgJyB8IEZyb20gXFwnJyArXG4gICAgICAgICAgICBub2RlQ29uZmlnLnRleHQgK1xuICAgICAgICAgICAgJ1xcJyB0byBcXCcnICtcbiAgICAgICAgICAgIHRleHQgK1xuICAgICAgICAgICAgJ1xcJyB8ICcgK1xuICAgICAgICAgICAgJ2h0dHBzOi8vJyArXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaG9zdCArXG4gICAgICAgICAgICAnLyMnICtcbiAgICAgICAgICAgIEFQUC5nZXRBc3NldENvbXBDb2RlKG5vZGVDb25maWcuY29tcFR5cGUpICtcbiAgICAgICAgICAgIG5vZGVDb25maWcuY29tcElkLFxuICAgICAgICAgIHVzZXJJbmZvXG5cbiAgICAgICAgaWYgKE1rdFBhZ2UgJiYgTWt0UGFnZS51c2VyTmFtZSAmJiBNa3RQYWdlLnVzZXJpZCkge1xuICAgICAgICAgIHVzZXJJbmZvID0gJ1xcbj4qVXNlcjoqICcgKyBNa3RQYWdlLnVzZXJOYW1lICsgJyAoJyArIE1rdFBhZ2UudXNlcmlkICsgJykgJ1xuICAgICAgICB9XG5cbiAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgJ2h0dHBzOi8vaG9va3Muc2xhY2suY29tL3NlcnZpY2VzL1QwMjVGSDNVOC9CNTFITVEyMlcvaUpHdkg4TkM4elZQQkRsdlUzdHFUbDE1JyxcbiAgICAgICAgICAne1widGV4dFwiOiBcIipVbmF1dGhvcml6ZWQgQ2hhbmdlcyonICsgdXNlckluZm8gKyB3b3Jrc3BhY2VJbmZvICsgY2hhbmdlZE5vZGVJbmZvICsgJ1wifScsXG4gICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgIHRydWUsXG4gICAgICAgICAgJydcbiAgICAgICAgKVxuXG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgIG5hbWU6ICdVbmF1dGhvcml6ZWQgTm9kZSBSZW5hbWVkJyxcbiAgICAgICAgICBhc3NldE5hbWU6IG5vZGVDb25maWcudGV4dCxcbiAgICAgICAgICBhc3NldElkOiBub2RlQ29uZmlnLmNvbXBJZCxcbiAgICAgICAgICBhc3NldFR5cGU6IG5vZGVDb25maWcuY29tcFR5cGUsXG4gICAgICAgICAgd29ya3NwYWNlSWQ6IG5vZGVDb25maWcuYWNjZXNzWm9uZUlkLFxuICAgICAgICAgIHdvcmtzcGFjZU5hbWU6IHdvcmtzcGFjZU5hbWVcbiAgICAgICAgfSlcblxuICAgICAgICA7KHZpb2xhdGlvbk1zZy5ub3RpZnkgPVxuICAgICAgICAgICdZb3UgYXJlIG5vdCBwZXJtaXR0ZWQgdG8gbWFrZSBjaGFuZ2VzIHRvICcgKyB3b3Jrc3BhY2VOYW1lICsgJyFcXG5cXG5UaGUgRGVtbyBTZXJ2aWNlcyBUZWFtIGhhcyBiZWVuIG5vdGlmaWVkIG9mIHRoaXMgdmlvbGF0aW9uLicpLFxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShleHRlbnNpb25JZCwgdmlvbGF0aW9uTXNnKVxuICAgICAgfVxuICAgICAgb3JpZ0V4cGxvcmVyUGFuZWxVcGRhdGVOb2RlVGV4dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFNraXBwaW5nOiBUcmFjayBSZW5hbWluZyBUcmVlIE5vZGVzJylcbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIGRpc2FibGVzIHNhdmluZyBvZiBlZGl0cyB0byB0aGUgTGFuZGluZyBQYWdlIFByb3BlcnR5IFBhbmVsIGFuZCBhbHNvXG4gKiAgZGlzYWJsZXMgdGhlIHN5c3RlbSBlcnJvciBtZXNzYWdlIGZvciBzeW5jIGVycm9ycyBvbiBMYW5kaW5nIFBhZ2VzLiBUaGVzZSBlcnJvcnNcbiAqICB3b3VsZCBvY2N1ciB3aGVuIHR3byB1c2VycyBlZGl0IHRoZSBzYW1lIGxhbmRpbmcgcGFnZSBzaW11bHRhbmVvdXNseS5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLmRpc2FibGVQcm9wZXJ0eVBhbmVsU2F2aW5nID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IFNhdmluZyBvZiBMYW5kaW5nIFBhZ2UgUHJvcGVydHkgUGFuZWwgJiBTeW5jIEVycm9yIE1lc3NhZ2UnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlUHJvcGVydHlQYW5lbC5wcm90b3R5cGUuZmlyZVN5bmNQcm9wZXJ0aWVzJykpIHtcbiAgICBNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlUHJvcGVydHlQYW5lbC5wcm90b3R5cGUuZmlyZVN5bmNQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFNhdmluZyBvZiBMYW5kaW5nIFBhZ2UgUHJvcGVydHkgUGFuZWwgJiBTeW5jIEVycm9yIE1lc3NhZ2UnKVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIGRpc2FibGVzIHRoZSBjb25maXJtYXRpb24gbWVzc2FnZSBmb3IgZGVsZXRpbmcgVHJpZ2dlcnMsIEZpbHRlcnMsIGFuZFxuICogIEZsb3cgU3RlcHMgZnJvbSBhIFNtYXJ0IENhbXBhaWduIG9yIFNtYXJ0IExpc3QgaW4gdGhlIERlZmF1bHQgV29ya3NhcGNlLlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuZGlzYWJsZUNvbmZpcm1hdGlvbk1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogU21hcnQgQ2FtcGFpZ24gRGVsZXRlIENvbmZpcm1hdGlvbiBNZXNzYWdlJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0LndpZGdldHMuRGF0YVBhbmVsLnByb3RvdHlwZS5jbGlja0Nsb3NlJykpIHtcbiAgICBNa3Qud2lkZ2V0cy5EYXRhUGFuZWwucHJvdG90eXBlLmNsaWNrQ2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgU21hcnQgQ2FtcGFpZ24gRGVsZXRlIENvbmZpcm1hdGlvbiBNZXNzYWdlJylcbiAgICAgIGxldCBoYXNDaGFuZ2VzID0gdGhpcy5oYXNTZXR0aW5ncygpLFxuICAgICAgICBzaG93VHJpZ2dlcldhcm5pbmcgPSBmYWxzZVxuICAgICAgaWYgKHRoaXMuaXNTbWFydGxpc3QgJiYgdGhpcy5kcE1ldGEudHJpZ2dlcikge1xuICAgICAgICBsZXQgdHJpZ2dlckNvdW50ID0gdGhpcy5kcE1nci5nZXRUcmlnZ2VycygpLmxlbmd0aFxuICAgICAgICBpZiAodHJpZ2dlckNvdW50ID09IDEpIHtcbiAgICAgICAgICBzaG93VHJpZ2dlcldhcm5pbmcgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGhhc0NoYW5nZXMgfHwgc2hvd1RyaWdnZXJXYXJuaW5nKSB7XG4gICAgICAgIGxldCB0aXRsZSA9IE1rdExhbmcuZ2V0U3RyKCdEYXRhRm9ybVBhbmVsLkRlbGV0ZV9hcmcwJywgW3RoaXMuZHBUeXBlTmFtZSh0cnVlKV0pLFxuICAgICAgICAgIG5hbWUgPSB0aGlzLmRwTWV0YS5kaXNwbGF5TmFtZSB8fCB0aGlzLmRwTWV0YS5uYW1lLFxuICAgICAgICAgIG1zZyA9IE1rdExhbmcuZ2V0U3RyKCdEYXRhRm9ybVBhbmVsLkFyZV95b3Vfc3VyZV95b3Vfd2FudF90b19kZWxldGVfYXJnMF9hcmcxJywgW3RoaXMuZHBUeXBlTmFtZSgpLCBNa3RMYW5nLmdldERCU3RyKG5hbWUpXSlcblxuICAgICAgICBpZiAoc2hvd1RyaWdnZXJXYXJuaW5nKSB7XG4gICAgICAgICAgbXNnICs9IE1rdExhbmcuZ2V0U3RyKCdEYXRhRm9ybVBhbmVsLlRyaWdnZXJlZF9jYW1wYWlnbnNfbXVzdF9jb250YWluX3RyaWdnZXJfcmVtYWluX2FjdGl2ZScpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kcE1nci5pc1NtYXJ0bGlzdCAmJiAhdGhpcy5kcE1ldGEudHJpZ2dlciAmJiB0aGlzLmRwTWdyLnNtYXJ0TGlzdFJ1bGVMb2dpYy5jdXN0b21Nb2RlKCkpIHtcbiAgICAgICAgICBtc2cgKz1cbiAgICAgICAgICAgIE1rdExhbmcuZ2V0U3RyKCdEYXRhRm9ybVBhbmVsLlJlbWluZGVyJykgK1xuICAgICAgICAgICAgTWt0TGFuZy5nZXRTdHIoJ0RhdGFGb3JtUGFuZWwuQ2hlY2tfeW91cl9hZHZhbmNlZF9maWx0ZXJfcnVsZXNfYWZ0ZXJfYW55X2luc2VydF9kZWxldGVfcmVvcmRlcicpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RDYW52YXMuZ2V0QWN0aXZlVGFiJykgJiZcbiAgICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkgJiZcbiAgICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnICYmXG4gICAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZy5hY2Nlc3Nab25lSWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gQ2xvc2luZzogU21hcnQgQ2FtcGFpZ24gRGVsZXRlIENvbmZpcm1hdGlvbiBNZXNzYWdlJylcbiAgICAgICAgICB0aGlzLl9kb0Nsb3NlKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBFeHQ0Lk1zZy5jb25maXJtRGVsZXRlKHtcbiAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgICAgIG1zZzogbXNnLFxuICAgICAgICAgICAgbWluSGVpZ2h0OiAzMDAsXG4gICAgICAgICAgICBmbjogZnVuY3Rpb24gKGJ1dHRvbklkKSB7XG4gICAgICAgICAgICAgIGlmIChidXR0b25JZCA9PT0gJ29rJykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2RvQ2xvc2UoKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2NvcGU6IHRoaXNcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9kb0Nsb3NlKClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuQVBQLm92ZXJyaWRlSG9tZVRpbGVzUmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAvL3Jlc2l6ZUZpcnN0Q2FsbCA9IGZhbHNlO1xuICBsZXQgY29udGFpbmVyID0gTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLFxuICAgIHRpbGVzVGV4dENvbnRlbnQgPSBjb250YWluZXIuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NwYW4nKSxcbiAgICBocmVmTWF0Y2ggPSBuZXcgUmVnRXhwKCcgaHJlZj1cIlteXCJdKlwiICcsICdnJyksXG4gICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUsXG4gICAgZW1haWxJbnNpZ2h0c1RpbGUsXG4gICAgaGlkZGVuVGlsZTEsXG4gICAgaGlkZGVuVGlsZTIsXG4gICAgbXBpUmVwZWF0ID0gZmFsc2UsXG4gICAgZWlSZXBlYXQgPSBmYWxzZSxcbiAgICB0b0JlUmVtb3ZlZCA9IFtdXG5cbiAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHRpbGVzVGV4dENvbnRlbnQubGVuZ3RoOyBpaSsrKSB7XG4gICAgbGV0IHRpbGUgPSB0aWxlc1RleHRDb250ZW50W2lpXVxuICAgIHN3aXRjaCAodGlsZS50ZXh0Q29udGVudCkge1xuICAgICAgY2FzZSAnUGVyZm9ybWFuY2UgSW5zaWdodHMnOlxuICAgICAgICBpZiAodGlsZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5zdHlsZS5kaXNwbGF5ICE9ICdub25lJykge1xuICAgICAgICAgIGlmIChtcGlSZXBlYXQpIHtcbiAgICAgICAgICAgIHRvQmVSZW1vdmVkLnB1c2godGlsZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbXBpUmVwZWF0ID0gdHJ1ZVxuICAgICAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUgPSB0aWxlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdFbWFpbCBJbnNpZ2h0cyc6XG4gICAgICAgIGlmIChlaVJlcGVhdCkge1xuICAgICAgICAgIHRvQmVSZW1vdmVkLnB1c2godGlsZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlaVJlcGVhdCA9IHRydWVcbiAgICAgICAgICBlbWFpbEluc2lnaHRzVGlsZSA9IHRpbGUucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGVcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGZvciAobGV0IHggPSAwOyB4IDwgdG9CZVJlbW92ZWQubGVuZ3RoOyB4KyspIHtcbiAgICB0b0JlUmVtb3ZlZFt4XS5yZW1vdmUoKVxuICB9XG4gIGlmIChwZXJmb3JtYW5jZUluc2lnaHRzVGlsZSkge1xuICAgIHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlLm91dGVySFRNTCA9IHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlLm91dGVySFRNTC5yZXBsYWNlKGhyZWZNYXRjaCwgJyBocmVmPVwiJyArIG1rdG9QZXJmb3JtYW5jZUluc2lnaHRzTGluayArICdcIiAnKVxuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUuaWQpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgbmFtZTogJ1BlcmZvcm1hbmNlIEluc2lnaHRzJyxcbiAgICAgICAgYXNzZXRBcmVhOiAnUGVyZm9ybWFuY2UgSW5zaWdodHMnLFxuICAgICAgICBhc3NldE5hbWU6ICdEZW1vIEFwcCcsXG4gICAgICAgIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSdcbiAgICAgIH0pXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZUVsLmNsYXNzTmFtZSA9XG4gICAgICAneDQtYnRuIG1rdDMtaG9tZVRpbGUgeDQtYnRuLWRlZmF1bHQtc21hbGwgeDQtaWNvbi10ZXh0LWxlZnQgeDQtYnRuLWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1kZWZhdWx0LXNtYWxsLWljb24tdGV4dC1sZWZ0J1xuICAgIHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRWwuc3R5bGUgPSAnaGVpZ2h0OiAxNTBweDsnXG4gICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVFbC5pZCA9ICdwZXJmb3JtYW5jZUluc2lnaHRzVGlsZSdcbiAgICBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZUVsLmlubmVySFRNTCA9XG4gICAgICAnPGVtIGlkPVwicGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUtYnRuV3JhcFwiPjxhIGlkPVwicGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUtYnRuRWxcIiBocmVmPVwiJyArXG4gICAgICBta3RvUGVyZm9ybWFuY2VJbnNpZ2h0c0xpbmsgK1xuICAgICAgJ1wiIGNsYXNzPVwieDQtYnRuLWNlbnRlclwiIHRhcmdldD1cIl9ibGFua1wiIHJvbGU9XCJsaW5rXCIgc3R5bGU9XCJ3aWR0aDogMTUwcHg7IGhlaWdodDogMTUwcHg7XCI+PHNwYW4gaWQ9XCJwZXJmb3JtYW5jZUluc2lnaHRzVGlsZS1idG5Jbm5lckVsXCIgY2xhc3M9XCJ4NC1idG4taW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDsgbGluZS1oZWlnaHQ6IDE1MHB4O1wiPlBlcmZvcm1hbmNlIEluc2lnaHRzPC9zcGFuPjxzcGFuIGlkPVwicGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUtYnRuSWNvbkVsXCIgY2xhc3M9XCJ4NC1idG4taWNvbiBta2kzLW1waS1sb2dvLXN2Z1wiPjwvc3Bhbj48L2E+PC9lbT4nXG5cbiAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRWwsIGNvbnRhaW5lci5jaGlsZE5vZGVzW2NvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdKVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwZXJmb3JtYW5jZUluc2lnaHRzVGlsZScpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgbmFtZTogJ1BlcmZvcm1hbmNlIEluc2lnaHRzJyxcbiAgICAgICAgYXNzZXRBcmVhOiAnUGVyZm9ybWFuY2UgSW5zaWdodHMnLFxuICAgICAgICBhc3NldE5hbWU6ICdEZW1vIEFwcCcsXG4gICAgICAgIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSdcbiAgICAgIH0pXG4gICAgfVxuICB9XG4gIGlmIChlbWFpbEluc2lnaHRzVGlsZSkge1xuICAgIGVtYWlsSW5zaWdodHNUaWxlLm91dGVySFRNTCA9IGVtYWlsSW5zaWdodHNUaWxlLm91dGVySFRNTC5yZXBsYWNlKGhyZWZNYXRjaCwgJyBocmVmPVwiJyArIG1rdG9FbWFpbEluc2lnaHRzTGluayArICdcIiAnKVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVtYWlsSW5zaWdodHNUaWxlLmlkKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7XG4gICAgICAgIG5hbWU6ICdFbWFpbCBJbnNpZ2h0cycsXG4gICAgICAgIGFzc2V0QXJlYTogJ0VtYWlsIEluc2lnaHRzJyxcbiAgICAgICAgYXNzZXROYW1lOiAnSG9tZScsXG4gICAgICAgIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSdcbiAgICAgIH0pXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBlbWFpbEluc2lnaHRzVGlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICBlbWFpbEluc2lnaHRzVGlsZUVsLmNsYXNzTmFtZSA9XG4gICAgICAneDQtYnRuIG1rdDMtaG9tZVRpbGUgeDQtYnRuLWRlZmF1bHQtc21hbGwgeDQtaWNvbi10ZXh0LWxlZnQgeDQtYnRuLWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1kZWZhdWx0LXNtYWxsLWljb24tdGV4dC1sZWZ0IHgtcGFuZWwnXG4gICAgZW1haWxJbnNpZ2h0c1RpbGVFbC5zdHlsZSA9ICdoZWlnaHQ6IDE1MHB4OydcbiAgICBlbWFpbEluc2lnaHRzVGlsZUVsLmlkID0gJ2VtYWlsSW5zaWdodHNUaWxlJ1xuICAgIGVtYWlsSW5zaWdodHNUaWxlRWwuaW5uZXJIVE1MID1cbiAgICAgICc8ZW0gaWQ9XCJlbWFpbEluc2lnaHRzVGlsZS1idG5XcmFwXCI+PGEgaWQ9XCJlbWFpbEluc2lnaHRzVGlsZS1idG5FbFwiIGhyZWY9XCInICtcbiAgICAgIG1rdG9FbWFpbEluc2lnaHRzTGluayArXG4gICAgICAnXCIgY2xhc3M9XCJ4NC1idG4tY2VudGVyXCIgdGFyZ2V0PVwiX2JsYW5rXCIgcm9sZT1cImxpbmtcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDtcIj48c3BhbiBpZD1cImVtYWlsSW5zaWdodHNUaWxlLWJ0bklubmVyRWxcIiBjbGFzcz1cIng0LWJ0bi1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4OyBsaW5lLWhlaWdodDogMTUwcHg7XCI+RW1haWwgSW5zaWdodHM8L3NwYW4+PHNwYW4gaWQ9XCJlbWFpbEluc2lnaHRzVGlsZS1idG5JY29uRWxcIiBjbGFzcz1cIng0LWJ0bi1pY29uIG1raTMtZW1haWwtaW5zaWdodHMtc3ZnXCI+PC9zcGFuPjwvYT48L2VtPjxkaXYgY2xhc3M9XCJ4LXBhbmVsLWJ3cmFwXCIgaWQ9XCJleHQtZ2VuMTY0XCI+PGRpdiBjbGFzcz1cIngtcGFuZWwtYm9keSB4LXBhbmVsLWJvZHktbm9oZWFkZXJcIiBpZD1cImV4dC1nZW4xNjVcIj48L2Rpdj48L2Rpdj4nXG4gICAgY29uc29sZS5sb2coJyoqKioqKioqKipJTlNJREUgRUxTRSBlbWFpbEluc2lnaHRzVGlsZSAnICsgZW1haWxJbnNpZ2h0c1RpbGUpXG4gICAgY29udGFpbmVyLmluc2VydEJlZm9yZShlbWFpbEluc2lnaHRzVGlsZUVsLCBjb250YWluZXIuY2hpbGROb2Rlc1tjb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggLSAxXSlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZW1haWxJbnNpZ2h0c1RpbGUnKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7XG4gICAgICAgIG5hbWU6ICdFbWFpbCBJbnNpZ2h0cycsXG4gICAgICAgIGFzc2V0QXJlYTogJ0VtYWlsIEluc2lnaHRzJyxcbiAgICAgICAgYXNzZXROYW1lOiAnRGVtbyBBcHAnLFxuICAgICAgICBhc3NldFR5cGU6ICdIb21lIFRpbGUnXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGhpZGRlblRpbGUxID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2Rpdltyb2xlPVwicHJlc2VudGF0aW9uXCJdJylcbiAgaGlkZGVuVGlsZTIgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignZGl2W2NsYXNzPVwieC1wYW5lbC1id3JhcCB4LXBhbmVsXCJdJylcbiAgaWYgKGhpZGRlblRpbGUxKSB7XG4gICAgaGlkZGVuVGlsZTEucmVtb3ZlKClcbiAgfVxuICBpZiAoaGlkZGVuVGlsZTIpIHtcbiAgICBoaWRkZW5UaWxlMi5yZW1vdmUoKVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gb3ZlcnJpZGVzIHRoZSB0YXJnZXQgbGlua3MgZm9yIHRoZSBEZWxpdmVyYWJpbGl0eSBUb29scyBhbmQgRW1haWxcbiAqICBJbnNpZ2h0cyB0aWxlcyBpZiB0aGV5IGV4aXN0LCBvdGhlcndpc2UgaXQgY3JlYXRlcyB0aGUgdGlsZXMuIFdlIG9ubHkgaGF2ZSBhIHNpbmdsZVxuICogIGluc3RhbmNlIHRoYXQgY29udGFpbnMgdXNhYmxlIGRlbW8gZGF0YSBmb3IgYm90aCAyNTBvayBhbmQgRW1haWwgSW5zaWdodHMsIHNvIHRoZVxuICogIHBsdWdpbiBkaXJlY3RzIHBlb3BsZSBpbnRvIHRoYXQgaW5zdGFuY2UuIFRoaXMgZnVuY3Rpb24gZGlyZWN0cyB1c2VycyB0byB0aGUgMjUwb2tcbiAqICBsb2dpbiBwYWdlIHdoZXJlIHRoZSBkZWxpdmVyYWJpbGl0eS10b29scy5qcyBzY3JpcHQgd2lsbCBhdXRvbWF0aWNhbGx5IGxvZ2luIGFuZFxuICogIGhpZGUgdGhlIG5lY2Vzc2FyeSBidXR0b25zLiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBhbHNvIHJ1biBpbnNpZGUgb2YgU0Mgc2FuZGJveFxuICogIGluc3RhbmNlcy5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbkFQUC5vdmVycmlkZUhvbWVUaWxlcyA9IGZ1bmN0aW9uIChyZXN0b3JlRW1haWxJbnNpZ2h0c1RpbGUpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogTXkgTWFya2V0byBIb21lIFRpbGVzJylcbiAgaWYgKFxuICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0Q2FudmFzLmdldEVsJykgJiZcbiAgICBNa3RDYW52YXMuZ2V0RWwoKSAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbSAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbS5uZXh0U2libGluZyAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbS5uZXh0U2libGluZy5jaGlsZE5vZGVzICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0gJiZcbiAgICBNa3RDYW52YXMuZ2V0RWwoKS5kb20ubmV4dFNpYmxpbmcuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXSAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbS5uZXh0U2libGluZy5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2RlcyAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbS5uZXh0U2libGluZy5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXSAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbS5uZXh0U2libGluZy5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0gJiZcbiAgICBNa3RDYW52YXMuZ2V0RWwoKS5kb20ubmV4dFNpYmxpbmcuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXSAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbS5uZXh0U2libGluZy5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2RlcyAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbS5uZXh0U2libGluZy5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXSAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbS5uZXh0U2libGluZy5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKClcbiAgICAgIC5kb20ubmV4dFNpYmxpbmcuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5pZC50b0xvd2VyQ2FzZSgpXG4gICAgICAuaW5kZXhPZignaG9tZXRpbGUnKSA+PSAwXG4gICkge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogT3ZlcnJpZGUgTXkgTWFya2V0byBIb21lIFRpbGVzJylcbiAgICBsZXQgY29udGFpbmVyID0gTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLFxuICAgICAgdGlsZXNUZXh0Q29udGVudCA9IGNvbnRhaW5lci5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3BhbicpLFxuICAgICAgaHJlZk1hdGNoID0gbmV3IFJlZ0V4cCgnIGhyZWY9XCJbXlwiXSpcIiAnLCAnZycpLFxuICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUsXG4gICAgICBlbWFpbEluc2lnaHRzVGlsZSxcbiAgICAgIGRlbGl2ZXJhYmlsaXR5VG9vbHNUaWxlLFxuICAgICAgc2VvVGlsZSxcbiAgICAgIGJpemlibGVEaXNjb3ZlcixcbiAgICAgIGJpemlibGVSZXZQbGFuLFxuICAgICAgZGVtb01vZGVsZXIsXG4gICAgICBoaWRkZW5UaWxlMSxcbiAgICAgIGhpZGRlblRpbGUyXG5cbiAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgdGlsZXNUZXh0Q29udGVudC5sZW5ndGg7IGlpKyspIHtcbiAgICAgIGxldCB0aWxlID0gdGlsZXNUZXh0Q29udGVudFtpaV1cbiAgICAgIHN3aXRjaCAodGlsZS50ZXh0Q29udGVudCkge1xuICAgICAgICBjYXNlICdQZXJmb3JtYW5jZSBJbnNpZ2h0cyc6XG4gICAgICAgICAgaWYgKHRpbGUucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGUuc3R5bGUuZGlzcGxheSAhPSAnbm9uZScpIHtcbiAgICAgICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlID0gdGlsZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdFbWFpbCBJbnNpZ2h0cyc6XG4gICAgICAgICAgZW1haWxJbnNpZ2h0c1RpbGUgPSB0aWxlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnRGVsaXZlcmFiaWxpdHkgVG9vbHMnOlxuICAgICAgICAgIGRlbGl2ZXJhYmlsaXR5VG9vbHNUaWxlID0gdGlsZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ1NFTyc6XG4gICAgICAgICAgc2VvVGlsZSA9IHRpbGUucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdCaXppYmxlIERpc2NvdmVyJzpcbiAgICAgICAgICBiaXppYmxlRGlzY292ZXIgPSB0aWxlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnQml6aWJsZSBSZXZlbnVlIFBsYW5uZXInOlxuICAgICAgICAgIGJpemlibGVSZXZQbGFuID0gdGlsZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ1RhcmdldCBBY2NvdW50IFBsYW5uaW5nJzpcbiAgICAgICAgICB0YXJnZXRBY2NvdW50UGxhbiA9IHRpbGUucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdMaWZlY3ljbGUgTW9kZWxlcic6XG4gICAgICAgICAgZGVtb01vZGVsZXIgPSB0aWxlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUpIHtcbiAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlLm91dGVySFRNTCA9IHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlLm91dGVySFRNTC5yZXBsYWNlKFxuICAgICAgICBocmVmTWF0Y2gsXG4gICAgICAgICcgaHJlZj1cIicgKyBta3RvUGVyZm9ybWFuY2VJbnNpZ2h0c0xpbmsgKyAnXCIgJ1xuICAgICAgKVxuXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwZXJmb3JtYW5jZUluc2lnaHRzVGlsZS5pZCkub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7XG4gICAgICAgICAgbmFtZTogJ1BlcmZvcm1hbmNlIEluc2lnaHRzJyxcbiAgICAgICAgICBhc3NldEFyZWE6ICdQZXJmb3JtYW5jZSBJbnNpZ2h0cycsXG4gICAgICAgICAgYXNzZXROYW1lOiAnRGVtbyBBcHAnLFxuICAgICAgICAgIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSdcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVFbC5jbGFzc05hbWUgPVxuICAgICAgICAneDQtYnRuIG1rdDMtaG9tZVRpbGUgeDQtYnRuLWRlZmF1bHQtc21hbGwgeDQtaWNvbi10ZXh0LWxlZnQgeDQtYnRuLWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1kZWZhdWx0LXNtYWxsLWljb24tdGV4dC1sZWZ0J1xuICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVFbC5zdHlsZSA9ICdoZWlnaHQ6IDE1MHB4OydcbiAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRWwuaWQgPSAncGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUnXG4gICAgICBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZUVsLmlubmVySFRNTCA9XG4gICAgICAgICc8ZW0gaWQ9XCJwZXJmb3JtYW5jZUluc2lnaHRzVGlsZS1idG5XcmFwXCI+PGEgaWQ9XCJwZXJmb3JtYW5jZUluc2lnaHRzVGlsZS1idG5FbFwiIGhyZWY9XCInICtcbiAgICAgICAgbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rICtcbiAgICAgICAgJ1wiIGNsYXNzPVwieDQtYnRuLWNlbnRlclwiIHRhcmdldD1cIl9ibGFua1wiIHJvbGU9XCJsaW5rXCIgc3R5bGU9XCJ3aWR0aDogMTUwcHg7IGhlaWdodDogMTUwcHg7XCI+PHNwYW4gaWQ9XCJwZXJmb3JtYW5jZUluc2lnaHRzVGlsZS1idG5Jbm5lckVsXCIgY2xhc3M9XCJ4NC1idG4taW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDsgbGluZS1oZWlnaHQ6IDE1MHB4O1wiPlBlcmZvcm1hbmNlIEluc2lnaHRzPC9zcGFuPjxzcGFuIGlkPVwicGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUtYnRuSWNvbkVsXCIgY2xhc3M9XCJ4NC1idG4taWNvbiBta2kzLW1waS1sb2dvLXN2Z1wiPjwvc3Bhbj48L2E+PC9lbT4nXG5cbiAgICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUocGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVFbCwgY29udGFpbmVyLmNoaWxkTm9kZXNbY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV0pXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUnKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgICBuYW1lOiAnUGVyZm9ybWFuY2UgSW5zaWdodHMnLFxuICAgICAgICAgIGFzc2V0QXJlYTogJ1BlcmZvcm1hbmNlIEluc2lnaHRzJyxcbiAgICAgICAgICBhc3NldE5hbWU6ICdEZW1vIEFwcCcsXG4gICAgICAgICAgYXNzZXRUeXBlOiAnSG9tZSBUaWxlJ1xuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbWFpbEluc2lnaHRzVGlsZSkge1xuICAgICAgbGV0IGFzc2V0TmFtZVxuXG4gICAgICBpZiAob3JpZ0VtYWlsSW5zaWdodHNUaWxlTGluayA9PSBudWxsKSB7XG4gICAgICAgIG9yaWdFbWFpbEluc2lnaHRzVGlsZUxpbmsgPSBlbWFpbEluc2lnaHRzVGlsZS5vdXRlckhUTUwubWF0Y2goaHJlZk1hdGNoKVswXS5zcGxpdCgnXCInKVsxXVxuICAgICAgfVxuXG4gICAgICBpZiAocmVzdG9yZUVtYWlsSW5zaWdodHNUaWxlICYmIG9yaWdFbWFpbEluc2lnaHRzVGlsZUxpbmsgIT0gbnVsbCkge1xuICAgICAgICBlbWFpbEluc2lnaHRzVGlsZS5vdXRlckhUTUwgPSBlbWFpbEluc2lnaHRzVGlsZS5vdXRlckhUTUwucmVwbGFjZShocmVmTWF0Y2gsICcgaHJlZj1cIicgKyBvcmlnRW1haWxJbnNpZ2h0c1RpbGVMaW5rICsgJ1wiICcpXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVtYWlsSW5zaWdodHNUaWxlLmlkKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgICAgbmFtZTogJ0VtYWlsIEluc2lnaHRzJyxcbiAgICAgICAgICAgIGFzc2V0QXJlYTogJ0VtYWlsIEluc2lnaHRzJyxcbiAgICAgICAgICAgIGFzc2V0TmFtZTogJ0hvbWUnLFxuICAgICAgICAgICAgYXNzZXRUeXBlOiAnSG9tZSBUaWxlJ1xuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVtYWlsSW5zaWdodHNUaWxlLm91dGVySFRNTCA9IGVtYWlsSW5zaWdodHNUaWxlLm91dGVySFRNTC5yZXBsYWNlKGhyZWZNYXRjaCwgJyBocmVmPVwiJyArIG1rdG9FbWFpbEluc2lnaHRzTGluayArICdcIiAnKVxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbWFpbEluc2lnaHRzVGlsZS5pZCkub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgICAgIG5hbWU6ICdFbWFpbCBJbnNpZ2h0cycsXG4gICAgICAgICAgICBhc3NldEFyZWE6ICdFbWFpbCBJbnNpZ2h0cycsXG4gICAgICAgICAgICBhc3NldE5hbWU6ICdEZW1vIEFwcCcsXG4gICAgICAgICAgICBhc3NldFR5cGU6ICdIb21lIFRpbGUnXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgZW1haWxJbnNpZ2h0c1RpbGVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICBlbWFpbEluc2lnaHRzVGlsZUVsLmNsYXNzTmFtZSA9XG4gICAgICAgICd4NC1idG4gbWt0My1ob21lVGlsZSB4NC1idG4tZGVmYXVsdC1zbWFsbCB4NC1pY29uLXRleHQtbGVmdCB4NC1idG4taWNvbi10ZXh0LWxlZnQgeDQtYnRuLWRlZmF1bHQtc21hbGwtaWNvbi10ZXh0LWxlZnQgeC1wYW5lbCdcbiAgICAgIGVtYWlsSW5zaWdodHNUaWxlRWwuc3R5bGUgPSAnaGVpZ2h0OiAxNTBweDsnXG4gICAgICBlbWFpbEluc2lnaHRzVGlsZUVsLmlkID0gJ2VtYWlsSW5zaWdodHNUaWxlJ1xuICAgICAgZW1haWxJbnNpZ2h0c1RpbGVFbC5pbm5lckhUTUwgPVxuICAgICAgICAnPGVtIGlkPVwiZW1haWxJbnNpZ2h0c1RpbGUtYnRuV3JhcFwiPjxhIGlkPVwiZW1haWxJbnNpZ2h0c1RpbGUtYnRuRWxcIiBocmVmPVwiJyArXG4gICAgICAgIG1rdG9FbWFpbEluc2lnaHRzTGluayArXG4gICAgICAgICdcIiBjbGFzcz1cIng0LWJ0bi1jZW50ZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIiByb2xlPVwibGlua1wiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4O1wiPjxzcGFuIGlkPVwiZW1haWxJbnNpZ2h0c1RpbGUtYnRuSW5uZXJFbFwiIGNsYXNzPVwieDQtYnRuLWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTUwcHg7IGhlaWdodDogMTUwcHg7IGxpbmUtaGVpZ2h0OiAxNTBweDtcIj5FbWFpbCBJbnNpZ2h0czwvc3Bhbj48c3BhbiBpZD1cImVtYWlsSW5zaWdodHNUaWxlLWJ0bkljb25FbFwiIGNsYXNzPVwieDQtYnRuLWljb24gbWtpMy1lbWFpbC1pbnNpZ2h0cy1zdmdcIj48L3NwYW4+PC9hPjwvZW0+PGRpdiBjbGFzcz1cIngtcGFuZWwtYndyYXBcIiBpZD1cImV4dC1nZW4xNjRcIj48ZGl2IGNsYXNzPVwieC1wYW5lbC1ib2R5IHgtcGFuZWwtYm9keS1ub2hlYWRlclwiIGlkPVwiZXh0LWdlbjE2NVwiPjwvZGl2PjwvZGl2PidcblxuICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShlbWFpbEluc2lnaHRzVGlsZUVsLCBjb250YWluZXIuY2hpbGROb2Rlc1tjb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggLSAxXSlcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlbWFpbEluc2lnaHRzVGlsZScpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgIG5hbWU6ICdFbWFpbCBJbnNpZ2h0cycsXG4gICAgICAgICAgYXNzZXRBcmVhOiAnRW1haWwgSW5zaWdodHMnLFxuICAgICAgICAgIGFzc2V0TmFtZTogJ0RlbW8gQXBwJyxcbiAgICAgICAgICBhc3NldFR5cGU6ICdIb21lIFRpbGUnXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRlbGl2ZXJhYmlsaXR5VG9vbHNUaWxlKSB7XG4gICAgICBkZWxpdmVyYWJpbGl0eVRvb2xzVGlsZS5vdXRlckhUTUwgPSBkZWxpdmVyYWJpbGl0eVRvb2xzVGlsZS5vdXRlckhUTUwucmVwbGFjZShcbiAgICAgICAgaHJlZk1hdGNoLFxuICAgICAgICAnIGhyZWY9XCInICsgbWt0b0VtYWlsRGVsaXZlcmFiaWxpdHlUb29sc0xpbmsgKyAnXCIgJ1xuICAgICAgKVxuXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZWxpdmVyYWJpbGl0eVRvb2xzVGlsZS5pZCkub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7XG4gICAgICAgICAgbmFtZTogJ0RlbGl2ZXJhYmlsaXR5IFRvb2xzJyxcbiAgICAgICAgICBhc3NldEFyZWE6ICdEZWxpdmVyYWJpbGl0eSBUb29scycsXG4gICAgICAgICAgYXNzZXROYW1lOiAnRGVtbyBBY2NvdW50JyxcbiAgICAgICAgICBhc3NldFR5cGU6ICdIb21lIFRpbGUnXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBkZWxpdmVyYWJpbGl0eVRvb2xzVGlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGRlbGl2ZXJhYmlsaXR5VG9vbHNUaWxlRWwuY2xhc3NOYW1lID1cbiAgICAgICAgJ3g0LWJ0biBta3QzLWhvbWVUaWxlIHg0LWJ0bi1kZWZhdWx0LXNtYWxsIHg0LWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1pY29uLXRleHQtbGVmdCB4NC1idG4tZGVmYXVsdC1zbWFsbC1pY29uLXRleHQtbGVmdCdcbiAgICAgIGRlbGl2ZXJhYmlsaXR5VG9vbHNUaWxlRWwuc3R5bGUgPSAnaGVpZ2h0OiAxNTBweDsnXG4gICAgICBkZWxpdmVyYWJpbGl0eVRvb2xzVGlsZUVsLmlkID0gJ2RlbGl2ZXJhYmlsaXR5VG9vbHNUaWxlJ1xuICAgICAgZGVsaXZlcmFiaWxpdHlUb29sc1RpbGVFbC5pbm5lckhUTUwgPVxuICAgICAgICAnPGVtIGlkPVwiZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUtYnRuV3JhcFwiPjxhIGlkPVwiZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUtYnRuRWxcIiBocmVmPVwiJyArXG4gICAgICAgIG1rdG9FbWFpbERlbGl2ZXJhYmlsaXR5VG9vbHNMaW5rICtcbiAgICAgICAgJ1wiIGNsYXNzPVwieDQtYnRuLWNlbnRlclwiIHRhcmdldD1cIl9ibGFua1wiIHJvbGU9XCJsaW5rXCIgc3R5bGU9XCJ3aWR0aDogMTUwcHg7IGhlaWdodDogMTUwcHg7XCI+PHNwYW4gaWQ9XCJkZWxpdmVyYWJpbGl0eVRvb2xzVGlsZS1idG5Jbm5lckVsXCIgY2xhc3M9XCJ4NC1idG4taW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDsgbGluZS1oZWlnaHQ6IDE1MHB4O1wiPkRlbGl2ZXJhYmlsaXR5IFRvb2xzPC9zcGFuPjxzcGFuIGlkPVwiZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUtYnRuSWNvbkVsXCIgY2xhc3M9XCJ4NC1idG4taWNvbiBta2kzLW1haWwtc2VhbGVkLXN2Z1wiPjwvc3Bhbj48L2E+PC9lbT4nXG5cbiAgICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoZGVsaXZlcmFiaWxpdHlUb29sc1RpbGVFbCwgY29udGFpbmVyLmNoaWxkTm9kZXNbY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV0pXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUnKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgICBuYW1lOiAnRGVsaXZlcmFiaWxpdHkgVG9vbHMnLFxuICAgICAgICAgIGFzc2V0QXJlYTogJ0RlbGl2ZXJhYmlsaXR5IFRvb2xzJyxcbiAgICAgICAgICBhc3NldE5hbWU6ICdEZW1vIEFjY291bnQnLFxuICAgICAgICAgIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSdcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJpemlibGVEaXNjb3ZlciAmJiBNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeCA9PSBta3RvQWNjb3VudFN0cmluZzEwNikge1xuICAgICAgbGV0IGJpemlibGVEaXNjb3ZlclRpbGVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICBiaXppYmxlRGlzY292ZXJUaWxlRWwuY2xhc3NOYW1lID1cbiAgICAgICAgJ3g0LWJ0biBta3QzLWhvbWVUaWxlIHg0LWJ0bi1kZWZhdWx0LXNtYWxsIHg0LWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1pY29uLXRleHQtbGVmdCB4NC1idG4tZGVmYXVsdC1zbWFsbC1pY29uLXRleHQtbGVmdCdcbiAgICAgIGJpemlibGVEaXNjb3ZlclRpbGVFbC5zdHlsZSA9ICdoZWlnaHQ6IDE1MHB4OydcbiAgICAgIGJpemlibGVEaXNjb3ZlclRpbGVFbC5pZCA9ICdiaXppYmxlRGlzY292ZXJUb29sc1RpbGUnXG4gICAgICBiaXppYmxlRGlzY292ZXJUaWxlRWwuaW5uZXJIVE1MID1cbiAgICAgICAgJzxlbSBpZD1cImJpemlibGVEaXNjb3ZlclRvb2xzVGlsZS1idG5XcmFwXCI+PGEgaWQ9XCJiaXppYmxlRGlzY292ZXJUb29sc1RpbGUtYnRuRWxcIiBocmVmPVwiJyArXG4gICAgICAgIG1rdG9CaXppYmxlRGlzY292ZXJMaW5rICtcbiAgICAgICAgJ1wiIGNsYXNzPVwieDQtYnRuLWNlbnRlclwiIHRhcmdldD1cIl9ibGFua1wiIHJvbGU9XCJsaW5rXCIgc3R5bGU9XCJ3aWR0aDogMTUwcHg7IGhlaWdodDogMTUwcHg7XCI+PHNwYW4gaWQ9XCJiaXppYmxlRGlzY292ZXJUb29sc1RpbGUtYnRuSW5uZXJFbFwiIGNsYXNzPVwieDQtYnRuLWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTUwcHg7IGhlaWdodDogMTUwcHg7IGxpbmUtaGVpZ2h0OiAxNTBweDtcIj5CaXppYmxlIERpc2NvdmVyPC9zcGFuPjxzcGFuIGlkPVwiYml6aWJsZURpc2NvdmVyVG9vbHNUaWxlLWJ0bkljb25FbFwiIGNsYXNzPVwieDQtYnRuLWljb25cIj48aW1nIHNyYz1cImh0dHBzOi8vd3d3LmJpemlibGUuY29tL2hzLWZzL2h1Yi8yMzM1MzcvZmlsZS0yNDk1ODE5NDExLXBuZy9iaXppYmxlLWxvZ28tcmV0aW5hLnBuZz90PTE1MzM1ODE5NjU2OTkmYW1wO3dpZHRoPTI3NyZhbXA7bmFtZT1iaXppYmxlLWxvZ28tcmV0aW5hLnBuZ1wiIHN0eWxlPVwid2lkdGg6IDE0NXB4O21hcmdpbi1sZWZ0OjVweDttYXJnaW4tdG9wOjMwcHg7XCI+PC9zcGFuPjwvYT48L2VtPidcblxuICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShiaXppYmxlRGlzY292ZXJUaWxlRWwsIGNvbnRhaW5lci5jaGlsZE5vZGVzW2NvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdKVxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JpemlibGVEaXNjb3ZlclRvb2xzVGlsZScpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgIG5hbWU6ICdCaXppYmxlRGlzY292ZXInLFxuICAgICAgICAgIGFzc2V0QXJlYTogJ0JpemlibGVEaXNjb3ZlcicsXG4gICAgICAgICAgYXNzZXROYW1lOiAnRGVtbyAxMDYgQWNjb3VudCcsXG4gICAgICAgICAgYXNzZXRUeXBlOiAnSG9tZSBUaWxlJ1xuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYml6aWJsZVJldlBsYW4gJiYgTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXggPT0gbWt0b0FjY291bnRTdHJpbmcxMDYpIHtcbiAgICAgIGxldCBiaXppYmxlUmV2UGxhblRpbGVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICBiaXppYmxlUmV2UGxhblRpbGVFbC5jbGFzc05hbWUgPVxuICAgICAgICAneDQtYnRuIG1rdDMtaG9tZVRpbGUgeDQtYnRuLWRlZmF1bHQtc21hbGwgeDQtaWNvbi10ZXh0LWxlZnQgeDQtYnRuLWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1kZWZhdWx0LXNtYWxsLWljb24tdGV4dC1sZWZ0J1xuICAgICAgYml6aWJsZVJldlBsYW5UaWxlRWwuc3R5bGUgPSAnaGVpZ2h0OiAxNTBweDsnXG4gICAgICBiaXppYmxlUmV2UGxhblRpbGVFbC5pZCA9ICdiaXppYmxlUmV2UGxhblRpbGUnXG4gICAgICBiaXppYmxlUmV2UGxhblRpbGVFbC5pbm5lckhUTUwgPVxuICAgICAgICAnPGVtIGlkPVwiYml6aWJsZVJldlBsYW5UaWxlLWJ0bldyYXBcIj48YSBpZD1cImJpemlibGVSZXZQbGFuVGlsZS1idG5FbFwiIGhyZWY9XCInICtcbiAgICAgICAgbWt0b0JpemlibGVSZXZQbGFuTGluayArXG4gICAgICAgICdcIiBjbGFzcz1cIng0LWJ0bi1jZW50ZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIiByb2xlPVwibGlua1wiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4O1wiPjxzcGFuIGlkPVwiYml6aWJsZVJldlBsYW5UaWxlLWJ0bklubmVyRWxcIiBjbGFzcz1cIng0LWJ0bi1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4OyBsaW5lLWhlaWdodDogMTUwcHg7XCI+Qml6aWJsZSBSZXZlbnVlIFBsYW5uZXI8L3NwYW4+PHNwYW4gaWQ9XCJiaXppYmxlUmV2UGxhblRpbGUtYnRuSWNvbkVsXCIgY2xhc3M9XCJ4NC1idG4taWNvblwiPjxpbWcgc3JjPVwiaHR0cHM6Ly93d3cuYml6aWJsZS5jb20vaHMtZnMvaHViLzIzMzUzNy9maWxlLTI0OTU4MTk0MTEtcG5nL2JpemlibGUtbG9nby1yZXRpbmEucG5nP3Q9MTUzMzU4MTk2NTY5OSZhbXA7d2lkdGg9Mjc3JmFtcDtuYW1lPWJpemlibGUtbG9nby1yZXRpbmEucG5nXCIgc3R5bGU9XCJ3aWR0aDogMTQ1cHg7bWFyZ2luLWxlZnQ6NXB4O21hcmdpbi10b3A6MzBweDtcIj48L3NwYW4+PC9hPjwvZW0+J1xuXG4gICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGJpemlibGVSZXZQbGFuVGlsZUVsLCBjb250YWluZXIuY2hpbGROb2Rlc1tjb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggLSAxXSlcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiaXppYmxlUmV2UGxhblRpbGUnKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgICBuYW1lOiAnQml6aWJsZSBSZXYgUGxhbiAnLFxuICAgICAgICAgIGFzc2V0QXJlYTogJ0JpemlibGUgUmV2IFBsYW4nLFxuICAgICAgICAgIGFzc2V0TmFtZTogJ0RlbW8gMTA2IEFjY291bnQnLFxuICAgICAgICAgIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSdcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWRlbW9Nb2RlbGVyICYmIE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4ID09IG1rdG9BY2NvdW50U3RyaW5nMTA2KSB7XG4gICAgICBsZXQgZGVtb01vZGVsZXJUaWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgZGVtb01vZGVsZXJUaWxlRWwuY2xhc3NOYW1lID1cbiAgICAgICAgJ3g0LWJ0biBta3QzLWhvbWVUaWxlIHg0LWJ0bi1kZWZhdWx0LXNtYWxsIHg0LWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1pY29uLXRleHQtbGVmdCB4NC1idG4tZGVmYXVsdC1zbWFsbC1pY29uLXRleHQtbGVmdCdcbiAgICAgIGRlbW9Nb2RlbGVyVGlsZUVsLnN0eWxlID0gJ2hlaWdodDogMTUwcHg7J1xuICAgICAgZGVtb01vZGVsZXJUaWxlRWwuaWQgPSAnZGVtb01vZGVsZXJUaWxlJ1xuICAgICAgZGVtb01vZGVsZXJUaWxlRWwuaW5uZXJIVE1MID1cbiAgICAgICAgJzxlbSBpZD1cImRlbW9Nb2RlbGVyVGlsZS1idG5XcmFwXCI+PGEgaWQ9XCJkZW1vTW9kZWxlclRpbGUtYnRuRWxcIiBocmVmPVwiJyArXG4gICAgICAgIGRlbW9Nb2RlbGVyTGluayArXG4gICAgICAgICdcIiBjbGFzcz1cIng0LWJ0bi1jZW50ZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIiByb2xlPVwibGlua1wiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4O1wiPjxzcGFuIGlkPVwiZGVtb01vZGVsZXJUaWxlLWJ0bklubmVyRWxcIiBjbGFzcz1cIng0LWJ0bi1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4OyBsaW5lLWhlaWdodDogMTUwcHg7XCI+TGlmZWN5Y2xlIE1vZGVsZXI8L3NwYW4+PHNwYW4gaWQ9XCJkZW1vTW9kZWxlclRpbGUtYnRuSWNvbkVsXCIgY2xhc3M9XCJ4NC1idG4taWNvbiBta2kzLXN1Y2Nlc3MtcGF0aC1zdmdcIj48L3NwYW4+PC9hPjwvZW0+J1xuXG4gICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGRlbW9Nb2RlbGVyVGlsZUVsLCBjb250YWluZXIuY2hpbGROb2Rlc1tjb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggLSAxXSlcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZW1vTW9kZWxlclRpbGUnKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgICBuYW1lOiAnRGVtbyBNb2RlbGVyICcsXG4gICAgICAgICAgYXNzZXRBcmVhOiAnRGVtbyBNb2RlbGVyJyxcbiAgICAgICAgICBhc3NldE5hbWU6ICdEZW1vIDEwNiBBY2NvdW50JyxcbiAgICAgICAgICBhc3NldFR5cGU6ICdIb21lIFRpbGUnXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNlb1RpbGUpIHtcbiAgICAgIC8vc2VvVGlsZS5lbC5kb20uc2V0QXR0cmlidXRlKFwib25jbGlja1wiLCAnQVBQLmhlYXBUcmFjayhcInRyYWNrXCIsIHtuYW1lOiBcIlNFT1wiLCBhc3NldE5hbWU6IFwiSG9tZVwiLCBhc3NldFR5cGU6IFwiSG9tZSBUaWxlXCJ9KTsnKTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHNlb1RpbGUuaWQpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgIG5hbWU6ICdTRU8nLFxuICAgICAgICAgIGFzc2V0QXJlYTogJ1NFTycsXG4gICAgICAgICAgYXNzZXROYW1lOiAnSG9tZScsXG4gICAgICAgICAgYXNzZXRUeXBlOiAnSG9tZSBUaWxlJ1xuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGhpZGRlblRpbGUxID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ2Rpdltyb2xlPVwicHJlc2VudGF0aW9uXCJdJylcbiAgICBoaWRkZW5UaWxlMiA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdkaXZbY2xhc3M9XCJ4LXBhbmVsLWJ3cmFwIHgtcGFuZWxcIl0nKVxuICAgIGlmIChoaWRkZW5UaWxlMSkge1xuICAgICAgaGlkZGVuVGlsZTEucmVtb3ZlKClcbiAgICB9XG4gICAgaWYgKGhpZGRlblRpbGUyKSB7XG4gICAgICBoaWRkZW5UaWxlMi5yZW1vdmUoKVxuICAgIH1cbiAgfSBlbHNlIGlmIChvdmVycmlkZVRpbGVUaW1lckNvdW50KSB7XG4gICAgb3ZlcnJpZGVUaWxlVGltZXJDb3VudCA9IGZhbHNlXG4gICAgc2V0VGltZW91dChBUFAub3ZlcnJpZGVIb21lVGlsZXMsIDIwMDApXG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBvdmVycmlkZXMgdGhlIHRhcmdldCBsaW5rcyBmb3IgdGhlIEVtYWlsIEluc2lnaHRzIGFuZCBEZWxpdmVyYWJpbGl0eVxuICogIFRvb2xzIFN1cGVyYmFsbCBtZW51IGl0ZW1zIGlmIHRoZXkgZXhpc3QsIG90aGVyd2lzZSBpdCBjcmVhdGVzIHRoZSBtZW51IGl0ZW1zLiBCeVxuICogIGRlZmF1bHQsIHRoZXNlIG1lbnUgaXRlbXMgdXNlcyBTU08gdG8gbG9naW4sIGhvd2V2ZXIsIHdlIG9ubHkgaGF2ZSBvbmUgaW5zdGFuY2UgZm9yXG4gKiAgZWFjaCBpdGVtIHRoYXQgY29udGFpbnMgdXNhYmxlIGRlbW8gZGF0YSwgc28gdGhlIHBsdWdpbiBkaXJlY3RzIHBlb3BsZSBpbnRvIHRoYXRcbiAqICBpbnN0YW5jZS4gVGhpcyBmdW5jdGlvbiBkaXJlY3RzIHVzZXJzIHRvIHRoZSAyNTBvayBsb2dpbiBwYWdlIHdoZXJlIHRoZVxuICogIGRlbGl2ZXJhYmlsaXR5LXRvb2xzLmpzIHNjcmlwdCB3aWxsIGF1dG9tYXRpY2FsbHkgbG9naW4gYW5kIGhpZGUgdGhlIG5lY2Vzc2FyeVxuICogIGJ1dHRvbnMuIFRoaXMgZnVuY3Rpb24gc2hvdWxkIGFsc28gcnVuIGluc2lkZSBvZiBTQyBzYW5kYm94IGluc3RhbmNlcy5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlU3VwZXJiYWxsTWVudUl0ZW1zID0gZnVuY3Rpb24gKHJlc3RvcmVFbWFpbEluc2lnaHRzTWVudUl0ZW0pIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogU3VwZXJiYWxsIE1lbnUgSXRlbXMnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RQYWdlLnNob3dTdXBlck1lbnUnKSkge1xuICAgIE1rdFBhZ2Uuc2hvd1N1cGVyTWVudSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogT3ZlcnJpZGUgU3VwZXJiYWxsIE1lbnUgSXRlbXMnKVxuICAgICAgbGV0IGxvZ29FbCA9IEV4dC5nZXQoRXh0LkRvbVF1ZXJ5LnNlbGVjdE5vZGUoJy5ta3QtYXBwLWxvZ28nKSksXG4gICAgICAgIHttZW51fSA9IGxvZ29FbCxcbiAgICAgICAgbWVudVRvcCA9IDU1XG5cbiAgICAgIGlmICghbWVudSkge1xuICAgICAgICBtZW51ID0gbG9nb0VsLm1lbnUgPSBFeHQ0LndpZGdldCgnYXBwTmF2aWdhdGlvbk1lbnUnLCB7XG4gICAgICAgICAgbGlzdGVuZXJzOiB7XG4gICAgICAgICAgICBib3hyZWFkeTogZnVuY3Rpb24gKHZpZXcpIHtcbiAgICAgICAgICAgICAgbGV0IGxvZ29SZWdpb24gPSBsb2dvRWwuZ2V0UmVnaW9uKClcblxuICAgICAgICAgICAgICAvLyBzaGlmdCBvdXQgb2YgdGhlIGJhbGwgd2F5XG4gICAgICAgICAgICAgIGlmIChsb2dvUmVnaW9uLmJvdHRvbSA+IG1lbnVUb3ApIHtcbiAgICAgICAgICAgICAgICB2aWV3LnNldEJvZHlTdHlsZSgncGFkZGluZy10b3AnLCBsb2dvUmVnaW9uLmJvdHRvbSAtIG1lbnVUb3AgKyAxMCArICdweCcpXG4gICAgICAgICAgICAgICAgdmlldy51cGRhdGVMYXlvdXQoKVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gcHJldmVudCBsYXllcmluZyBpbiBmcm9udCBvZiB0aGUgbG9nb1xuICAgICAgICAgICAgICBtZW51LnNldFpJbmRleChsb2dvRWwuZ2V0U3R5bGUoJ3pJbmRleCcpIC0gNSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiZWZvcmVyZW5kZXI6IGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgICAgICAgICAgIHZpZXcuYWRkQ2xzKHZpZXcuY29tcG9uZW50Q2xzICsgJy1oaWRkZW4nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNob3c6IGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgICAgICAgICAgIHZpZXcucmVtb3ZlQ2xzKHZpZXcuY29tcG9uZW50Q2xzICsgJy1oaWRkZW4nKVxuXG4gICAgICAgICAgICAgIGxvZ29FbC5pZ25vcmVOZXh0Q2xpY2sgPSB0cnVlXG4gICAgICAgICAgICAgIGxvZ29FbC5yZW1vdmVDbGFzcyhsb2dvRWwuYXR0ZW50aW9uQ2xzKVxuXG4gICAgICAgICAgICAgIGlmICghTWt0UGFnZS5zYXZlZFN0YXRlLmlzVXNlZFN1cGVyTWVudSkge1xuICAgICAgICAgICAgICAgIE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5pc1VzZWRTdXBlck1lbnUgPSB0cnVlXG5cbiAgICAgICAgICAgICAgICBNa3RTZXNzaW9uLmFqYXhSZXF1ZXN0KCd1c2VyL3NhdmVVc2VyUHJlZicsIHtcbiAgICAgICAgICAgICAgICAgIHNlcmlhbGl6ZVBhcm1zOiB7XG4gICAgICAgICAgICAgICAgICAgIGtleTogJ2lzVXNlZFN1cGVyTWVudScsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5pc1VzZWRTdXBlck1lbnVcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmVmb3JlaGlkZTogZnVuY3Rpb24gKHZpZXcpIHtcbiAgICAgICAgICAgICAgdmlldy5hZGRDbHModmlldy5jb21wb25lbnRDbHMgKyAnLWhpZGRlbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGlkZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGxvZ29FbC5pZ25vcmVOZXh0Q2xpY2sgPSBmYWxzZVxuICAgICAgICAgICAgICB9LmRlZmVyKDI1MCkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICBpZiAodHlwZW9mIG1lbnUgIT09ICd1bmRlZmluZWQnICYmIG1lbnUgJiYgbWVudS5pdGVtcyAmJiBtZW51Lml0ZW1zLml0ZW1zKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gV29ya2luZzogT3ZlcnJpZGUgU3VwZXJiYWxsIE1lbnUgSXRlbXMnKVxuICAgICAgICAgIGxldCBpaSxcbiAgICAgICAgICAgIGN1cnJTdXBlckJhbGxNZW51SXRlbSxcbiAgICAgICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNNZW51SXRlbSxcbiAgICAgICAgICAgIGVtYWlsSW5zaWdodHNNZW51SXRlbSxcbiAgICAgICAgICAgIGRlbGl2ZXJhYmlsaXR5VG9vbHNNZW51SXRlbSxcbiAgICAgICAgICAgIHNlb01lbnVJdGVtLFxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW1cblxuICAgICAgICAgIGZvciAoaWkgPSAwOyBpaSA8IG1lbnUuaXRlbXMuaXRlbXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICBjdXJyU3VwZXJCYWxsTWVudUl0ZW0gPSBtZW51Lml0ZW1zLml0ZW1zW2lpXVxuXG4gICAgICAgICAgICBpZiAoY3VyclN1cGVyQmFsbE1lbnVJdGVtLnRleHQgPT0gJ1BlcmZvcm1hbmNlIEluc2lnaHRzJykge1xuICAgICAgICAgICAgICBpZiAoY3VyclN1cGVyQmFsbE1lbnVJdGVtLmhpZGRlbiAhPSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c01lbnVJdGVtID0gY3VyclN1cGVyQmFsbE1lbnVJdGVtXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclN1cGVyQmFsbE1lbnVJdGVtLnRleHQgPT0gJ0VtYWlsIEluc2lnaHRzJykge1xuICAgICAgICAgICAgICBlbWFpbEluc2lnaHRzTWVudUl0ZW0gPSBjdXJyU3VwZXJCYWxsTWVudUl0ZW1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclN1cGVyQmFsbE1lbnVJdGVtLnRleHQgPT0gJ0RlbGl2ZXJhYmlsaXR5IFRvb2xzJykge1xuICAgICAgICAgICAgICBkZWxpdmVyYWJpbGl0eVRvb2xzTWVudUl0ZW0gPSBjdXJyU3VwZXJCYWxsTWVudUl0ZW1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclN1cGVyQmFsbE1lbnVJdGVtLnRleHQgPT0gJ1NFTycpIHtcbiAgICAgICAgICAgICAgc2VvTWVudUl0ZW0gPSBjdXJyU3VwZXJCYWxsTWVudUl0ZW1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocGVyZm9ybWFuY2VJbnNpZ2h0c01lbnVJdGVtKSB7XG4gICAgICAgICAgICBsZXQgb3JpZ01lbnVJdGVtT25DbGljayA9IHBlcmZvcm1hbmNlSW5zaWdodHNNZW51SXRlbS5vbkNsaWNrXG5cbiAgICAgICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNNZW51SXRlbS5vbkNsaWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgb3JpZ01lbnVJdGVtT25DbGljay5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdQZXJmb3JtYW5jZSBJbnNpZ2h0cycsXG4gICAgICAgICAgICAgICAgYXNzZXRBcmVhOiAnUGVyZm9ybWFuY2UgSW5zaWdodHMnLFxuICAgICAgICAgICAgICAgIGFzc2V0TmFtZTogJ0RlbW8gQXBwJyxcbiAgICAgICAgICAgICAgICBhc3NldFR5cGU6ICdIb21lIFRpbGUnXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzTWVudUl0ZW0uaHJlZiA9IG1rdG9QZXJmb3JtYW5jZUluc2lnaHRzTGlua1xuICAgICAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c01lbnVJdGVtLnVwZGF0ZSgpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtID0gbWVudS5pdGVtcy5pdGVtc1s0XS5jbG9uZUNvbmZpZygpXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5zZXRUZXh0KCdQZXJmb3JtYW5jZSBJbnNpZ2h0cycpXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5zZXRJY29uQ2xzKCdta2kzLW1waS1sb2dvLXN2ZycpXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5ocmVmID0gbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5ocmVmVGFyZ2V0ID0gJ19ibGFuaydcblxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0ub25DbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdQZXJmb3JtYW5jZSBJbnNpZ2h0cycsXG4gICAgICAgICAgICAgICAgYXNzZXRBcmVhOiAnUGVyZm9ybWFuY2UgSW5zaWdodHMnLFxuICAgICAgICAgICAgICAgIGFzc2V0TmFtZTogJ0RlbW8gQXBwJyxcbiAgICAgICAgICAgICAgICBhc3NldFR5cGU6ICdIb21lIFRpbGUnXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtLnVwZGF0ZSgpXG4gICAgICAgICAgICBtZW51LmFkZChjbG9uZWRNZW51SXRlbSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZW1haWxJbnNpZ2h0c01lbnVJdGVtKSB7XG4gICAgICAgICAgICBpZiAob3JpZ0VtYWlsSW5zaWdodHNNZW51SXRlbUxpbmsgPT0gbnVsbCkge1xuICAgICAgICAgICAgICBvcmlnRW1haWxJbnNpZ2h0c01lbnVJdGVtTGluayA9IGVtYWlsSW5zaWdodHNNZW51SXRlbS5ocmVmXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXN0b3JlRW1haWxJbnNpZ2h0c01lbnVJdGVtICYmIG9yaWdFbWFpbEluc2lnaHRzTWVudUl0ZW1MaW5rICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgZW1haWxJbnNpZ2h0c01lbnVJdGVtLmhyZWYgPSBvcmlnRW1haWxJbnNpZ2h0c01lbnVJdGVtTGlua1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZW1haWxJbnNpZ2h0c01lbnVJdGVtLmhyZWYgPSBta3RvRW1haWxJbnNpZ2h0c0xpbmtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVtYWlsSW5zaWdodHNNZW51SXRlbS51cGRhdGUoKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbSA9IG1lbnUuaXRlbXMuaXRlbXNbNF0uY2xvbmVDb25maWcoKVxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0uc2V0VGV4dCgnRW1haWwgSW5zaWdodHMnKVxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0uc2V0SWNvbkNscygnbWtpMy1lbWFpbC1pbnNpZ2h0cy1zdmcnKVxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0uaHJlZiA9IG1rdG9FbWFpbEluc2lnaHRzTGlua1xuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0uaHJlZlRhcmdldCA9ICdfYmxhbmsnXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS51cGRhdGUoKVxuICAgICAgICAgICAgbWVudS5hZGQoY2xvbmVkTWVudUl0ZW0pXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGRlbGl2ZXJhYmlsaXR5VG9vbHNNZW51SXRlbSkge1xuICAgICAgICAgICAgdmFyIG9yaWdNZW51SXRlbU9uQ2xpY2sgPSBkZWxpdmVyYWJpbGl0eVRvb2xzTWVudUl0ZW0ub25DbGlja1xuXG4gICAgICAgICAgICBkZWxpdmVyYWJpbGl0eVRvb2xzTWVudUl0ZW0ub25DbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgIG9yaWdNZW51SXRlbU9uQ2xpY2suYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnRGVsaXZlcmFiaWxpdHkgVG9vbHMnLFxuICAgICAgICAgICAgICAgIGFzc2V0QXJlYTogJ0RlbGl2ZXJhYmlsaXR5IFRvb2xzJyxcbiAgICAgICAgICAgICAgICBhc3NldE5hbWU6ICdEZW1vIEFjY291bnQnLFxuICAgICAgICAgICAgICAgIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSdcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGl2ZXJhYmlsaXR5VG9vbHNNZW51SXRlbS5ocmVmID0gbWt0b0VtYWlsRGVsaXZlcmFiaWxpdHlUb29sc0xpbmtcbiAgICAgICAgICAgIGRlbGl2ZXJhYmlsaXR5VG9vbHNNZW51SXRlbS51cGRhdGUoKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbSA9IG1lbnUuaXRlbXMuaXRlbXNbM10uY2xvbmVDb25maWcoKVxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0uc2V0VGV4dCgnRGVsaXZlcmFiaWxpdHkgVG9vbHMnKVxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0uc2V0SWNvbkNscygnbWtpMy1tYWlsLXNlYWxlZC1zdmcnKVxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0uaHJlZiA9IG1rdG9FbWFpbERlbGl2ZXJhYmlsaXR5VG9vbHNMaW5rXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5ocmVmVGFyZ2V0ID0gJ19ibGFuaydcbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtLm9uQ2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAvL29yaWdNZW51SXRlbU9uQ2xpY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0RlbGl2ZXJhYmlsaXR5IFRvb2xzJyxcbiAgICAgICAgICAgICAgICBhc3NldEFyZWE6ICdEZWxpdmVyYWJpbGl0eSBUb29scycsXG4gICAgICAgICAgICAgICAgYXNzZXROYW1lOiAnRGVtbyBBY2NvdW50JyxcbiAgICAgICAgICAgICAgICBhc3NldFR5cGU6ICdIb21lIFRpbGUnXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtLnVwZGF0ZSgpXG4gICAgICAgICAgICBtZW51LmFkZChjbG9uZWRNZW51SXRlbSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2VvTWVudUl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBvcmlnTWVudUl0ZW1PbkNsaWNrID0gc2VvTWVudUl0ZW0ub25DbGlja1xuXG4gICAgICAgICAgICBzZW9NZW51SXRlbS5vbkNsaWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgb3JpZ01lbnVJdGVtT25DbGljay5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdTRU8nLFxuICAgICAgICAgICAgICAgIGFzc2V0QXJlYTogJ1NFTycsXG4gICAgICAgICAgICAgICAgYXNzZXROYW1lOiAnSG9tZScsXG4gICAgICAgICAgICAgICAgYXNzZXRUeXBlOiAnSG9tZSBUaWxlJ1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIW1lbnUuaXNWaXNpYmxlKCkgJiYgIWxvZ29FbC5pZ25vcmVOZXh0Q2xpY2spIHtcbiAgICAgICAgLy8gcG9zaXRpb24gYmVsb3cgYXBwIGJhclxuICAgICAgICBtZW51LnNob3dBdCgwLCBtZW51VG9wKVxuXG4gICAgICAgIC8vIHByZXZlbnQgbGF5ZXJpbmcgaW4gZnJvbnQgb2YgdGhlIGxvZ29cbiAgICAgICAgbWVudS5zZXRaSW5kZXgobG9nb0VsLmdldFN0eWxlKCd6SW5kZXgnKSAtIDUpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gb3ZlcnJpZGVzIHRoZSB0YXJnZXQgbGluayBvZiB0aGUgQW5hbHl0aWNzIHRpbGVzIGluIG9yZGVyIHRvIGxpbmsgdG9cbiAqICB0aGUgR3JvdXAgUmVwb3J0cyB3aXRoaW4gdGhlIERlZmF1bHQgV29ya3NwYWNlIGFzIHRob3NlIHJlcG9ydCBzZXR0aW5ncyBhcmUgc2F2ZWRcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlQW5hbHl0aWNzVGlsZXMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE92ZXJyaWRpbmc6IEFuYWx5dGljcyBUaWxlcycpXG4gIGxldCBpc0FuYWx5dGljc1RpbGVzID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoXG4gICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdENhbnZhcy5nZXRBY3RpdmVUYWInKSAmJlxuICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpICYmXG4gICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnICYmXG4gICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnLm1rdDNYVHlwZSAmJlxuICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZy5hY2Nlc3Nab25lSWQgJiZcbiAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXgnKVxuICAgICkge1xuICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNBbmFseXRpY3NUaWxlcylcbiAgICAgIGlmIChcbiAgICAgICAgTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXguc2VhcmNoKG1rdG9BY2NvdW50U3RyaW5nc01hdGNoKSAhPSAtMSAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnLm1rdDNYVHlwZSA9PSAnYW5hbHl0aWNzSG9tZScgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZy5hY2Nlc3Nab25lSWQgPT0gbWt0b0RlZmF1bHRXb3Jrc3BhY2VJZCAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmVsLmRvbSAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwuZG9tLmNoaWxkTm9kZXMgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmVsLmRvbS5jaGlsZE5vZGVzWzBdICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzFdICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzFdLmNoaWxkTm9kZXMgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmVsLmRvbS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXSAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwuZG9tLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1sxXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXMgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmVsLmRvbS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzFdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzFdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzFdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXMgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmVsLmRvbS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXSAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwuZG9tLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1sxXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNcbiAgICAgICkge1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IEFuYWx5dGljcyBUaWxlcycpXG4gICAgICAgIGxldCBjb250YWluZXIgPSBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwuZG9tLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1sxXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLFxuICAgICAgICAgIHRpbGVzID0gY29udGFpbmVyLmNoaWxkTm9kZXMsXG4gICAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVFeGlzdHMgPSBmYWxzZVxuXG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aWxlcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBpZiAodGlsZXNbaWldICYmIHRpbGVzW2lpXS5vdXRlckhUTUwgJiYgdGlsZXNbaWldLnRleHRDb250ZW50KSB7XG4gICAgICAgICAgICBsZXQgdGlsZUhUTUwgPSB0aWxlc1tpaV0ub3V0ZXJIVE1MLFxuICAgICAgICAgICAgICBocmVmTWF0Y2hcbiAgICAgICAgICAgIHN3aXRjaCAodGlsZXNbaWldLnRleHRDb250ZW50KSB7XG4gICAgICAgICAgICAgIGNhc2UgJ1BlcmZvcm1hbmNlIEluc2lnaHRzJzpcbiAgICAgICAgICAgICAgICBocmVmTWF0Y2ggPSBuZXcgUmVnRXhwKCcgaHJlZj1cIlteXCJdKlwiICcsICdnJylcbiAgICAgICAgICAgICAgICB0aWxlc1tpaV0ub3V0ZXJIVE1MID0gdGlsZUhUTUwucmVwbGFjZShocmVmTWF0Y2gsICcgaHJlZj1cIicgKyBta3RvUGVyZm9ybWFuY2VJbnNpZ2h0c0xpbmsgKyAnXCIgJylcbiAgICAgICAgICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZUV4aXN0cyA9IHRydWVcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdFbWFpbCBQZXJmb3JtYW5jZSc6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b0VtYWlsUGVyZm9ybWFuY2VSZXBvcnQgKyAnXCI+JyArIHRpbGVIVE1MICsgJzwvYT4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnUGVvcGxlIFBlcmZvcm1hbmNlJzpcbiAgICAgICAgICAgICAgICB0aWxlc1tpaV0ub3V0ZXJIVE1MID0gJzxhIGhyZWY9XCIvIycgKyBta3RvUGVvcGxlUGVyZm9ybWFuY2VSZXBvcnQgKyAnXCI+JyArIHRpbGVIVE1MICsgJzwvYT4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnV2ViIFBhZ2UgQWN0aXZpdHknOlxuICAgICAgICAgICAgICAgIHRpbGVzW2lpXS5vdXRlckhUTUwgPSAnPGEgaHJlZj1cIi8jJyArIG1rdG9XZWJQYWdlQWN0aXZpdHlSZXBvcnQgKyAnXCI+JyArIHRpbGVIVE1MICsgJzwvYT4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnT3Bwb3J0dW5pdHkgSW5mbHVlbmNlIEFuYWx5emVyJzpcbiAgICAgICAgICAgICAgICB0aWxlc1tpaV0ub3V0ZXJIVE1MID0gJzxhIGhyZWY9XCIvIycgKyBta3RvT3Bwb3J0dW5pdHlJbmZsdWVuY2VBbmFseXplciArICdcIj4nICsgdGlsZUhUTUwgKyAnPC9hPidcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdQcm9ncmFtIEFuYWx5emVyJzpcbiAgICAgICAgICAgICAgICB0aWxlc1tpaV0ub3V0ZXJIVE1MID0gJzxhIGhyZWY9XCIvIycgKyBta3RvUHJvZ3JhbUFuYWx5emVyICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ1N1Y2Nlc3MgUGF0aCBBbmFseXplcic6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b1N1Y2Nlc3NQYXRoQW5hbHl6ZXIgKyAnXCI+JyArIHRpbGVIVE1MICsgJzwvYT4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnRW1haWwgSW5zaWdodHMnOlxuICAgICAgICAgICAgICAgIGlmICghcmVzdG9yZUVtYWlsSW5zaWdodHMpIHtcbiAgICAgICAgICAgICAgICAgIGhyZWZNYXRjaCA9IG5ldyBSZWdFeHAoJyBocmVmPVwiW15cIl0qXCIgJywgJ2cnKVxuICAgICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9IHRpbGVIVE1MLnJlcGxhY2UoaHJlZk1hdGNoLCAnIGhyZWY9XCInICsgbWt0b0VtYWlsSW5zaWdodHNMaW5rICsgJ1wiICcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ0VuZ2FnZW1lbnQgU3RyZWFtIFBlcmZvcm1hbmNlJzpcbiAgICAgICAgICAgICAgICB0aWxlc1tpaV0ub3V0ZXJIVE1MID0gJzxhIGhyZWY9XCIvIycgKyBta3RvRW5nYWdtZW50U3RyZWFtUGVyZm9ybWFjZVJlcG9ydCArICdcIj4nICsgdGlsZUhUTUwgKyAnPC9hPidcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdQcm9ncmFtIFBlcmZvcm1hbmNlJzpcbiAgICAgICAgICAgICAgICB0aWxlc1tpaV0ub3V0ZXJIVE1MID0gJzxhIGhyZWY9XCIvIycgKyBta3RvUHJvZ3JhbVBlcmZvcm1hbmNlUmVwb3J0ICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ0VtYWlsIExpbmsgUGVyZm9ybWFuY2UnOlxuICAgICAgICAgICAgICAgIHRpbGVzW2lpXS5vdXRlckhUTUwgPSAnPGEgaHJlZj1cIi8jJyArIG1rdG9FbWFpbExpbmtQZXJmb3JtYW5jZVJlcG9ydCArICdcIj4nICsgdGlsZUhUTUwgKyAnPC9hPidcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdQZW9wbGUgQnkgUmV2ZW51ZSBTdGFnZSc6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b1Blb3BsZUJ5UmV2ZW51ZVN0YWdlUmVwb3J0ICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ0xhbmRpbmcgUGFnZSBQZXJmb3JtYW5jZSc6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b0xhbmRpbmdQYWdlUGVyZm9ybWFuY2VSZXBvcnQgKyAnXCI+JyArIHRpbGVIVE1MICsgJzwvYT4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnUGVvcGxlIEJ5IFN0YXR1cyc6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b1Blb3BsZUJ5U3RhdHVzUmVwb3J0ICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ0NvbXBhbnkgV2ViIEFjdGl2aXR5JzpcbiAgICAgICAgICAgICAgICB0aWxlc1tpaV0ub3V0ZXJIVE1MID0gJzxhIGhyZWY9XCIvIycgKyBta3RvQ29tcGFueVdlYkFjdGl2aXR5UmVwb3J0ICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ1NhbGVzIEluc2lnaHQgRW1haWwgUGVyZm9ybWFuY2UnOlxuICAgICAgICAgICAgICAgIHRpbGVzW2lpXS5vdXRlckhUTUwgPSAnPGEgaHJlZj1cIi8jJyArIG1rdG9TYWxlc0luc2lnaHRFbWFpbFBlcmZvcm1hbmNlUmVwb3J0ICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwZXJmb3JtYW5jZUluc2lnaHRzVGlsZUV4aXN0cykge1xuICAgICAgICAgIGxldCBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZU91dGVySFRNTCA9XG4gICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwieDQtYnRuIG1rdDMtYW5hbHl0aWNzVGlsZSBta3QzLWFuYWx5dGljc0hvbWVUaWxlIHg0LWJ0bi1kZWZhdWx0LXNtYWxsIHg0LWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1pY29uLXRleHQtbGVmdCB4NC1idG4tZGVmYXVsdC1zbWFsbC1pY29uLXRleHQtbGVmdFwiIGlkPVwiYW5hbHl0aWNzVGlsZS0xMDY4XCI+PGVtIGlkPVwiYW5hbHl0aWNzVGlsZS0xMDY4LWJ0bldyYXBcIj48YSBpZD1cImFuYWx5dGljc1RpbGUtMTA2OC1idG5FbFwiIGhyZWY9XCInICtcbiAgICAgICAgICAgICAgbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rICtcbiAgICAgICAgICAgICAgJ1wiIGNsYXNzPVwieDQtYnRuLWNlbnRlclwiIHRhcmdldD1cIl9ibGFua1wiIHJvbGU9XCJsaW5rXCIgc3R5bGU9XCJoZWlnaHQ6IDE2MHB4O1wiPjxzcGFuIGlkPVwiYW5hbHl0aWNzVGlsZS0xMDY4LWJ0bklubmVyRWxcIiBjbGFzcz1cIng0LWJ0bi1pbm5lclwiPlBlcmZvcm1hbmNlIEluc2lnaHRzPC9zcGFuPjxzcGFuIGlkPVwiYW5hbHl0aWNzVGlsZS0xMDY4LWJ0bkljb25FbFwiIGNsYXNzPVwieDQtYnRuLWljb24gbWtpMy1tcGktbG9nby1zdmdcIj48L3NwYW4+PC9hPjwvZW0+PC9kaXY+JyxcbiAgICAgICAgICAgIGlkTWF0Y2ggPSBuZXcgUmVnRXhwKCdhbmFseXRpY3NUaWxlLTEwNjgnLCAnZycpLFxuICAgICAgICAgICAgc3BhcmVUaWxlQ2xvbmUgPSBNa3RDYW52YXMubG9va3VwQ29tcG9uZW50KGNvbnRhaW5lci5jaGlsZE5vZGVzW2NvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdKS5jbG9uZUNvbmZpZygpXG5cbiAgICAgICAgICBzcGFyZVRpbGVDbG9uZS5lbC5kb20ub3V0ZXJIVE1MID0gcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVPdXRlckhUTUwucmVwbGFjZShpZE1hdGNoLCBzcGFyZVRpbGVDbG9uZS5pZClcbiAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoc3BhcmVUaWxlQ2xvbmUuZWwuZG9tKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LCAwKVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIG92ZXJyaWRlcyB0aGUgc2F2ZSBmdW5jdGlvbiBvZiBTbWFydCBDYW1wYWlnbnMgaW4gb3JkZXIgdG8gZGlzYWJsZVxuICogIHNhdmluZyB3aXRoaW4gdGhlIERlZmF1bHQgV29ya3NwYWNlIGF0IGFsbCB0aW1lcyBhbmQgd2l0aGluIE15IFdvcmtzYXBjZSBpZiB0aGVcbiAqICBTbWFydCBDYW1wYWlnbiBpcyBOT1Qgd2l0aGluIHRoZSB1c2VyJ3Mgcm9vdCBmb2xkZXIgb3IgaWYgZWRpdCBwcml2aWxlZ2VzIGlzIGZhbHNlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5vdmVycmlkZVNtYXJ0Q2FtcGFpZ25TYXZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE92ZXJyaWRpbmc6IFNhdmluZyBmb3IgU21hcnQgQ2FtcGFpZ25zJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0LndpZGdldHMuRGF0YVBhbmVsTWFuYWdlci5wcm90b3R5cGUuc2F2ZScpKSB7XG4gICAgTWt0LndpZGdldHMuRGF0YVBhbmVsTWFuYWdlci5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uIChjYXVzZSwgZHAsIGFjY2VwdFVwZGF0ZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogT3ZlcnJpZGUgU2F2aW5nIGZvciBTbWFydCBDYW1wYWlnbnMnKVxuICAgICAgdGhpcy5fdXBkYXRlRGF0YVBhbmVsT3JkZXIodHJ1ZSlcbiAgICAgIGxldCBjYW52YXMgPSBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKClcbiAgICAgIGlmICghQVBQLmV2YWx1YXRlTWVudSgnYnV0dG9uJywgbnVsbCwgY2FudmFzLCBudWxsKSAmJiB0b2dnbGVTdGF0ZSAhPSAnZmFsc2UnKSB7XG4gICAgICAgIGlmICh0aGlzLnNhdmVRdWV1ZS5ibG9ja2luZ1NhdmVJblByb2dyZXNzKSB7XG4gICAgICAgICAgdGhpcy5zYXZlUXVldWUucGVuZGluZ0NoYW5nZXNDb3VudCsrXG4gICAgICAgICAgdGhpcy5zYXZlUXVldWUuZGF0YVBhbmVsTWV0YXMgPSB0aGlzLl9zZXJpYWxpemVEYXRhUGFuZWxzKClcbiAgICAgICAgICB0aGlzLnNhdmVRdWV1ZS5kYXRhUGFuZWxDb3VudCA9IHRoaXMuY291bnREYXRhUGFuZWxzKClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkYXRhUGFuZWxNZXRhc1xuICAgICAgICBpZiAodGhpcy5zYXZlUXVldWUuZGF0YVBhbmVsTWV0YXMpIHtcbiAgICAgICAgICAoe2RhdGFQYW5lbE1ldGFzfSA9IHRoaXMuc2F2ZVF1ZXVlLmRhdGFQYW5lbE1ldGFzKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRhdGFQYW5lbE1ldGFzID0gdGhpcy5fc2VyaWFsaXplRGF0YVBhbmVscygpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNhdmVRdWV1ZS5wZW5kaW5nQ2hhbmdlc0NvdW50ID0gMFxuICAgICAgICB0aGlzLnNhdmVRdWV1ZS5kYXRhUGFuZWxNZXRhcyA9IG51bGxcbiAgICAgICAgdGhpcy5zYXZlUXVldWUuZGF0YVBhbmVsQ291bnQgPSAwXG4gICAgICAgIGlmIChkYXRhUGFuZWxNZXRhcyA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZHBTdWJ0eXBlICE9IERQQ29uc3QuUlVOX0FDVElPTiAmJiBkYXRhUGFuZWxNZXRhcykge1xuICAgICAgICAgIGlmICh0aGlzLmxhc3RTYXZlLmRhdGFQYW5lbE1ldGFzICYmIHRoaXMubGFzdFNhdmUuZGF0YVBhbmVsTWV0YXMgPT0gZGF0YVBhbmVsTWV0YXMpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5sYXN0U2F2ZS5kYXRhUGFuZWxNZXRhc1VwZGF0ZWQgJiYgdGhpcy5sYXN0U2F2ZS5kYXRhUGFuZWxNZXRhc1VwZGF0ZWQgPT0gZGF0YVBhbmVsTWV0YXMpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1NhdmluZyAnICsgdGhpcy5kcFR5cGUgKyAnOicsIE1rdEZvcm1hdC5mb3JtYXRKc29uU3RyKGRhdGFQYW5lbE1ldGFzKSlcbiAgICAgICAgaWYgKERQREVCVUcpIHtcbiAgICAgICAgICBjb25zb2xlLmRlYnVnKCdDdXJyZW50IFNhdmU6JywgZGF0YVBhbmVsTWV0YXMpXG5cbiAgICAgICAgICBpZiAodGhpcy5sYXN0U2F2ZS5kYXRhUGFuZWxNZXRhcykge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUHJldmlvdXMgU2F2ZTonLCB0aGlzLmxhc3RTYXZlLmRhdGFQYW5lbE1ldGFzKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLmxhc3RTYXZlLmRhdGFQYW5lbE1ldGFzVXBkYXRlZCkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUHJldmlvdXMgVXBkYXRlOicsIHRoaXMubGFzdFNhdmUuZGF0YVBhbmVsTWV0YXNVcGRhdGVkKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGFzdFNhdmUuYWNjZXB0VXBkYXRlcyA9IGFjY2VwdFVwZGF0ZXNcbiAgICAgICAgdGhpcy5sYXN0U2F2ZS5kYXRhUGFuZWxNZXRhcyA9IGRhdGFQYW5lbE1ldGFzXG4gICAgICAgIHRoaXMuc2F2ZVF1ZXVlLmJsb2NraW5nU2F2ZUluUHJvZ3Jlc3MgPSB0cnVlXG4gICAgICAgIHRoaXMuYmVmb3JlU2F2ZU1lc3NhZ2UoKVxuICAgICAgICBsZXQgcGFyYW1zID0gRXh0LmFwcGx5KFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRhdGFQYW5lbE1ldGFzOiBkYXRhUGFuZWxNZXRhcyxcbiAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRoaXMuYmFzZVNhdmVQYXJhbXNcbiAgICAgICAgKVxuXG4gICAgICAgIGlmICh0aGlzLmlzU21hcnRsaXN0ICYmIHRoaXMuc21hcnRMaXN0UnVsZUxvZ2ljLmN1c3RvbU1vZGUoKSkge1xuICAgICAgICAgIGlmICh0aGlzLnNtYXJ0TGlzdFJ1bGVMb2dpYy5pc0N1c3RvbUxvZ2ljVmFsaWQoKSkge1xuICAgICAgICAgICAgbGV0IHNtYXJ0TGlzdExvZ2ljUGFyYW1zID0gdGhpcy5zbWFydExpc3RSdWxlTG9naWMuZ2V0U21hcnRMaXN0TG9naWNTYXZlUGFyYW1zKClcbiAgICAgICAgICAgIEV4dC5hcHBseShwYXJhbXMsIHNtYXJ0TGlzdExvZ2ljUGFyYW1zKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdEYXRhIHBhbmVsIHNhdmUgc3VjY2Vzc2Z1bC4gQ3VzdG9tIHJ1bGUgbG9naWMgaXMgbm90IHZhbGlkJylcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwYXJhbXNbdGhpcy5hcHBWYXJzQmFzZSArICdJZCddID0gdGhpcy5kYXRhUGFuZWxTdG9yYWdlSWRcbiAgICAgICAgdGhpcy5iZWZvcmVTYXZlSG9vaygpXG4gICAgICAgIGlmIChEUERFQlVHKSB7XG4gICAgICAgICAgY29uc29sZS5kZWJ1ZygnU2F2aW5nLi4uICcsIHBhcmFtcylcbiAgICAgICAgfVxuXG4gICAgICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QodGhpcy5zYXZlQWN0aW9uLCB7XG4gICAgICAgICAgc2VyaWFsaXplUGFybXM6IHBhcmFtcyxcbiAgICAgICAgICBvbk15U3VjY2VzczogdGhpcy5zYXZlU3VjY2Vzcy5jcmVhdGVEZWxlZ2F0ZSh0aGlzKSxcbiAgICAgICAgICBvbk15RmFpbHVyZTogdGhpcy5zYXZlRmFpbHVyZS5jcmVhdGVEZWxlZ2F0ZSh0aGlzKVxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBTYXZpbmcgZm9yIFNtYXJ0IENhbXBhaWducycpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gb3ZlcnJpZGVzIHRoZSBmaWxsQ2FudmFzIGZ1bmN0aW9uIGZvciB0aGUgUHJvZ3JhbSA+IEFzc2V0cyB0YWIgaW5cbiAqICBvcmRlciB0byByZW1vdmUgdGhlIG5ldyBhc3NldCBidXR0b25zIHdpdGhpbiB0aGUgRGVmYXVsdCBXb3Jrc3BhY2UgYXQgYWxsIHRpbWVzXG4gKiAgYW5kIHdpdGhpbiBNeSBXb3Jrc2FwY2UgaWYgdGhlIFByb2dyYW0gaXMgTk9UIHdpdGhpbiB0aGUgdXNlcidzIHJvb3QgZm9sZGVyLlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAub3ZlcnJpZGVDYW52YXMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE92ZXJyaWRpbmc6IENhbnZhcycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdENhbnZhc1BhbmVsTWFuYWdlci5wcm90b3R5cGUuZmlsbENhbnZhcycpKSB7XG4gICAgaWYgKHR5cGVvZiBvcmlnRmlsbENhbnZhcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgb3JpZ0ZpbGxDYW52YXMgPSBNa3RDYW52YXNQYW5lbE1hbmFnZXIucHJvdG90eXBlLmZpbGxDYW52YXNcbiAgICB9XG5cbiAgICBNa3RDYW52YXNQYW5lbE1hbmFnZXIucHJvdG90eXBlLmZpbGxDYW52YXMgPSBmdW5jdGlvbiAoaXRlbXMsIHRhYklkLCBpc0dyaWQpIHtcbiAgICAgIGxldCB0YWIgPSB0aGlzLmdldFRhYk9yQWN0aXZlKHRhYklkKSxcbiAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ2J1dHRvbicsIG51bGwsIHRhYiwgbnVsbClcblxuICAgICAgaWYgKGRpc2FibGUgJiYgdGFiICYmIHRhYi50aXRsZSA9PSAnQXNzZXRzJykge1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IE92ZXJyaWRlIEFzc2V0cyBDYW52YXMgPiBSZW1vdmluZyBOZXcgQXNzZXQgQnV0dG9ucycpXG4gICAgICAgIGxldCBuZXdBc3NldEJ1dHRvbnMgPSBpdGVtcy5maW5kKCdjZWxsQ2xzJywgJ3BpY2tlckJ1dHRvbicpXG5cbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG5ld0Fzc2V0QnV0dG9ucy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBuZXdBc3NldEJ1dHRvbnNbaWldLmRlc3Ryb3koKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG9yaWdGaWxsQ2FudmFzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBvdmVycmlkZXMgdGhlIHVwZGF0ZVBvcnRsZXRPcmRlciBmdW5jdGlvbiBvZiBQcm9ncmFtID4gQXNzZXRzIHRhYiBpblxuICogIG9yZGVyIHRvIGRpc2FibGUgcmVvcmRlcmluZyBvZiBhc3NldCBwb3J0bGV0cyB3aXRoaW4gdGhlIERlZmF1bHQgV29ya3NwYWNlIGF0IGFsbFxuICogIHRpbWVzIGFuZCB3aXRoaW4gTXkgV29ya3NhcGNlIGlmIHRoZSBQcm9ncmFtIGlzIE5PVCB3aXRoaW4gdGhlIHVzZXIncyByb290IGZvbGRlclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAub3ZlcnJpZGVVcGRhdGVQb3J0bGV0T3JkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE92ZXJyaWRpbmc6IFVwZGF0aW5nIG9mIFBvcnRsZXQgT3JkZXInKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QuYXBwcy5sb2NhbGFzc2V0LkxvY2FsQXNzZXRQb3J0YWwucHJvdG90eXBlLnVwZGF0ZVBvcnRsZXRPcmRlcicpKSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBPdmVycmlkZSBVcGRhdGluZyBvZiBQb3J0bGV0IE9yZGVyJylcbiAgICBNa3QuYXBwcy5sb2NhbGFzc2V0LkxvY2FsQXNzZXRQb3J0YWwucHJvdG90eXBlLnVwZGF0ZVBvcnRsZXRPcmRlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICBsZXQgY2FudmFzID0gTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLFxuICAgICAgICBkaXNhYmxlID0gQVBQLmV2YWx1YXRlTWVudSgnYnV0dG9uJywgbnVsbCwgY2FudmFzLCBudWxsKVxuICAgICAgaWYgKCFkaXNhYmxlKSB7XG4gICAgICAgIGxldCBuZXdQb3J0bGV0T3JkZXIgPSBbXVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBsZXQgaXRlbUluZm8gPSB0aGlzLml0ZW1zLmdldChpKS5zbWFydENhbXBhaWduTWV0YURhdGFcbiAgICAgICAgICBuZXdQb3J0bGV0T3JkZXIucHVzaChpdGVtSW5mby5jb21wVHlwZUlkICsgJzonICsgaXRlbUluZm8uY29tcElkKVxuICAgICAgICB9XG4gICAgICAgIGxldCBwYXJhbXMgPSB7XG4gICAgICAgICAgY29tcElkOiB0aGlzLnByb2dyYW1JZCxcbiAgICAgICAgICBwb3J0bGV0T3JkZXJpbmc6IEV4dC5lbmNvZGUobmV3UG9ydGxldE9yZGVyKVxuICAgICAgICB9XG4gICAgICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QoJ21hcmtldGluZ0V2ZW50L29yZGVyTG9jYWxBc3NldFBvcnRsZXRzJywge1xuICAgICAgICAgIHNlcmlhbGl6ZVBhcm1zOiBwYXJhbXMsXG4gICAgICAgICAgbG9jYWxBc3NldE1hbmFnZXI6IHRoaXMsXG4gICAgICAgICAgcG9ydGxldE9yZGVyaW5nOiBuZXdQb3J0bGV0T3JkZXIsXG4gICAgICAgICAgb25NeVN1Y2Nlc3M6IHRoaXMudXBkYXRlUG9ydGxldE9yZGVyU3VjY2Vzc1xuICAgICAgICB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBVcGRhdGluZyBvZiBQb3J0bGV0IE9yZGVyJylcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBvdmVycmlkZXMgdGhlIGV4cGFuZCBmdW5jdGlvbiBmb3IgYSBNYXJrZXRvIHRyZWUgbm9kZSBpbiBvcmRlciB0b1xuICogIGhpZGUgZWFjaCBub24tc3lzdGVtIGZvbGRlciB0aGF0IGlzIGluIHRoZSBNYXJrZXRpbmcgd29ya3NwYWNlIGV4Y2VwdCB0aGUgdXNlcidzXG4gKiAgb3duIGZvbGRlclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAub3ZlcnJpZGVUcmVlTm9kZUV4cGFuZCA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogVHJlZSBOb2RlIEV4cGFuZCcpXG4gIGlmICggTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RBc3luY1RyZWVOb2RlLnByb3RvdHlwZS5leHBhbmQnKSAmJiB1c2VyTmFtZSkge1xuICAgIE1rdEFzeW5jVHJlZU5vZGUucHJvdG90eXBlLmV4cGFuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBhdHRyID0gdGhpcy5hdHRyaWJ1dGVzXG5cbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy50ZXh0LnNlYXJjaChta3RvTXlXb3Jrc3BhY2VOYW1lTWF0Y2gpICE9IC0xIHx8XG4gICAgICAgICh0aGlzLnBhcmVudE5vZGUudGV4dC5zZWFyY2gobWt0b015V29ya3NwYWNlTmFtZU1hdGNoKSAhPSAtMSAmJiB0aGlzLmF0dHJpYnV0ZXMuc3lzdGVtID09IHRydWUpIHx8XG4gICAgICAgICh0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZSAhPSBudWxsICYmXG4gICAgICAgICAgdGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUudGV4dC5zZWFyY2gobWt0b015V29ya3NwYWNlTmFtZU1hdGNoKSAhPSAtMSAmJlxuICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5zeXN0ZW0gPT0gdHJ1ZSlcbiAgICAgICkge1xuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgdGhpcy5jaGlsZE5vZGVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGxldCBjdXJyRm9sZGVyID0gdGhpcy5jaGlsZE5vZGVzW2lpXVxuXG4gICAgICAgICAgaWYgKGN1cnJGb2xkZXIuYXR0cmlidXRlcy5zeXN0ZW0gPT0gZmFsc2UgJiYgY3VyckZvbGRlci50ZXh0LnRvTG93ZXJDYXNlKCkgIT09IHVzZXJOYW1lKSB7XG4gICAgICAgICAgICBjdXJyRm9sZGVyLnVpLmhpZGUoKVxuICAgICAgICAgICAgY3VyckZvbGRlci5oaWRkZW4gPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAoYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3RlciB8fCBhY2NvdW50U3RyaW5nID09IG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyTUVVRSkgJiYgLy9UT0RPXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgdGhpcy5jaGlsZE5vZGVzLmxlbmd0aFxuICAgICAgKSB7XG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLmNoaWxkTm9kZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgbGV0IG5vZGUgPSB0aGlzLmNoaWxkTm9kZXNbaWldXG5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBub2RlLmNoaWxkTm9kZXMubGVuZ3RoID09IDAgJiZcbiAgICAgICAgICAgIG5vZGUuYXR0cmlidXRlcyAmJlxuICAgICAgICAgICAgbm9kZS5hdHRyaWJ1dGVzLmNoaWxkcmVuICYmXG4gICAgICAgICAgICBub2RlLmF0dHJpYnV0ZXMuY2hpbGRyZW4ubGVuZ3RoID09IDEgJiZcbiAgICAgICAgICAgIChub2RlLmF0dHJpYnV0ZXMuY2hpbGRyZW5bMF0uaXNEcmFmdE5vZGUgPT0gMSB8fCBub2RlLmF0dHJpYnV0ZXMuY2hpbGRyZW5bMF0uaXNEcmFmdClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChub2RlLnVpICYmIG5vZGUudWkuZWNOb2RlICYmIG5vZGUudWkuZWNOb2RlLmNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICBub2RlLnVpLmVjTm9kZS5jbGFzc05hbWUgPSAneC10cmVlLWVjLWljb24geC10cmVlLWVsYm93J1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVtb3ZlZCBEcmFmdCBOb2RlIE9mOiAnICsgbm9kZS50ZXh0KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbm9kZS5hbGxvd0NoaWxkcmVuID0gZmFsc2VcbiAgICAgICAgICAgICAgbm9kZS5sZWFmID0gdHJ1ZVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUHJldmVudGVkIERyYWZ0IE5vZGUgT2Y6ICcgKyBub2RlLnRleHQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIG5vZGUuY2hpbGROb2Rlcy5sZW5ndGggPT0gMSAmJlxuICAgICAgICAgICAgbm9kZS5jaGlsZE5vZGVzWzBdLmF0dHJpYnV0ZXMgJiZcbiAgICAgICAgICAgIChub2RlLmNoaWxkTm9kZXNbMF0uYXR0cmlidXRlcy5pc0RyYWZ0Tm9kZSA9PSAxIHx8IG5vZGUuY2hpbGROb2Rlc1swXS5hdHRyaWJ1dGVzLmlzRHJhZnQpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUFsbCh0cnVlKVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlbW92ZWQgQ2hpbGQgRHJhZnQgTm9kZSBPZjogJyArIG5vZGUudGV4dClcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aCA+IDEgJiZcbiAgICAgICAgICAgIG5vZGUuY2hpbGROb2Rlc1swXS5hdHRyaWJ1dGVzICYmXG4gICAgICAgICAgICAobm9kZS5jaGlsZE5vZGVzWzBdLmF0dHJpYnV0ZXMuaXNEcmFmdE5vZGUgPT0gMSB8fCBub2RlLmNoaWxkTm9kZXNbMF0uYXR0cmlidXRlcy5pc0RyYWZ0KVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgbm9kZS5jaGlsZE5vZGVzWzBdLnJlbW92ZSh0cnVlKVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlbW92ZWQgQ2hpbGQgRHJhZnQgTm9kZSBPZjogJyArIG5vZGUudGV4dClcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdab25lJykge1xuICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLmNoaWxkTm9kZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICBsZXQgY3VyckZvbGRlciA9IHRoaXMuY2hpbGROb2Rlc1tpaV1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmF0dHJpYnV0ZXMuc3lzdGVtID09IGZhbHNlICYmXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgJiZcbiAgICAgICAgICAgICAgKGN1cnJGb2xkZXIudGV4dC5zZWFyY2gobWt0b09wZXJhdGlvbmFsRm9sZGVycykgIT0gLTEgfHxcbiAgICAgICAgICAgICAgICAoQVBQLmdldFVzZXJSb2xlKCkgPT0gJ1BhcnRuZXInICYmXG4gICAgICAgICAgICAgICAgICBBUFAuZ2V0VXNlcklkKClcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCdAJylbMF1cbiAgICAgICAgICAgICAgICAgICAgLnNlYXJjaCgvXFwuaW5mb3IkLykgPT0gLTEgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJGb2xkZXIudGV4dC5zZWFyY2gobWt0b0xhdW5jaFBvaW50Rm9sZGVyVG9IaWRlKSAhPSAtMSkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY3VyckZvbGRlci51aS5oaWRlKClcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5oaWRkZW4gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZSAmJlxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdab25lJyAmJlxuICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5zeXN0ZW0gPT0gZmFsc2UgJiZcbiAgICAgICAgICB0aGlzLmhpZGRlbiA9PSBmYWxzZSAmJlxuICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcidcbiAgICAgICAgKSB7XG4gICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHRoaXMuY2hpbGROb2Rlcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgIGxldCBjdXJyRm9sZGVyID0gdGhpcy5jaGlsZE5vZGVzW2lpXVxuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuYXR0cmlidXRlcy5zeXN0ZW0gPT0gZmFsc2UgJiZcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJyAmJlxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLnRleHQuc2VhcmNoKG1rdG9PcGVyYXRpb25hbEZvbGRlcnMpICE9IC0xXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY3VyckZvbGRlci51aS5oaWRlKClcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5oaWRkZW4gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZSAmJlxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlICYmXG4gICAgICAgICAgdGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZSAmJlxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnWm9uZScgJiZcbiAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuc3lzdGVtID09IGZhbHNlICYmXG4gICAgICAgICAgdGhpcy5oaWRkZW4gPT0gZmFsc2UgJiZcbiAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuY29tcFR5cGUgIT0gJ01hcmtldGluZyBGb2xkZXInXG4gICAgICAgICkge1xuICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLmNoaWxkTm9kZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICBsZXQgY3VyckZvbGRlciA9IHRoaXMuY2hpbGROb2Rlc1tpaV1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmF0dHJpYnV0ZXMuc3lzdGVtID09IGZhbHNlICYmXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgJiZcbiAgICAgICAgICAgICAgY3VyckZvbGRlci50ZXh0LnNlYXJjaChta3RvT3BlcmF0aW9uYWxGb2xkZXJzKSAhPSAtMVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIudWkuaGlkZSgpXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuaGlkZGVuID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoYXR0ci5mb2xkZXIpIHtcbiAgICAgICAgaWYgKGF0dHIuY2FuY2VsRmlyc3RFeHBhbmQpIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5hdHRyaWJ1dGVzLmNhbmNlbEZpcnN0RXhwYW5kXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jaGlsZE5vZGVzICYmIHRoaXMuY2hpbGROb2Rlcy5sZW5ndGggPiAwICYmICFhdHRyLm1rdEV4cGFuZGVkICYmIHRoaXMuYXR0cmlidXRlcyAmJiB0aGlzLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkKSB7XG4gICAgICAgICAgaWYgKHRoaXMuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgPT0gLTEpIHtcbiAgICAgICAgICAgIE1rdEZvbGRlci5zYXZlRXhwYW5kU3RhdGUodGhpcywgdHJ1ZSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTk9UIFNhdmluZzogRm9sZGVyIEV4cGFuZCBTdGF0ZScpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBNa3RBc3luY1RyZWVOb2RlLnN1cGVyY2xhc3MuZXhwYW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgIGF0dHIubWt0RXhwYW5kZWQgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gb3ZlcnJpZGVzIHRoZSBjb2xsYXBzZSBmdW5jdGlvbiBmb3IgYSBNYXJrZXRvIHRyZWUgbm9kZSBpbiBvcmRlciB0b1xuICogIGhpZGUgZWFjaCBub24tc3lzdGVtIGZvbGRlciB0aGF0IGlzIGluIHRoZSBNYXJrZXRpbmcgd29ya3NwYWNlIGV4Y2VwdCB0aGUgdXNlcidzXG4gKiAgb3duIGZvbGRlclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAub3ZlcnJpZGVUcmVlTm9kZUNvbGxhcHNlID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBPdmVycmlkaW5nOiBUcmVlIE5vZGUgQ29sbGFwc2UnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RBc3luY1RyZWVOb2RlLnByb3RvdHlwZS5jb2xsYXBzZScpICYmIHVzZXJOYW1lKSB7XG4gICAgTWt0QXN5bmNUcmVlTm9kZS5wcm90b3R5cGUuY29sbGFwc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgYXR0ciA9IHRoaXMuYXR0cmlidXRlc1xuXG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMudGV4dC5zZWFyY2gobWt0b015V29ya3NwYWNlTmFtZU1hdGNoKSAhPSAtMSB8fFxuICAgICAgICAodGhpcy5wYXJlbnROb2RlLnRleHQuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZU5hbWVNYXRjaCkgIT0gLTEgJiYgdGhpcy5hdHRyaWJ1dGVzLnN5c3RlbSA9PSB0cnVlKSB8fFxuICAgICAgICAodGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUgIT0gbnVsbCAmJlxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlLnRleHQuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZU5hbWVNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuc3lzdGVtID09IHRydWUpXG4gICAgICApIHtcbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHRoaXMuY2hpbGROb2Rlcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBsZXQgY3VyckZvbGRlciA9IHRoaXMuY2hpbGROb2Rlc1tpaV1cblxuICAgICAgICAgIGlmIChjdXJyRm9sZGVyLmF0dHJpYnV0ZXMuc3lzdGVtID09IGZhbHNlICYmIGN1cnJGb2xkZXIudGV4dC50b0xvd2VyQ2FzZSgpICE9PSB1c2VyTmFtZSkge1xuICAgICAgICAgICAgY3VyckZvbGRlci51aS5oaWRlKClcbiAgICAgICAgICAgIGN1cnJGb2xkZXIuaGlkZGVuID0gY3VyckZvbGRlci51aS5lbE5vZGUuaGlkZGVuID0gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgKGFjY291bnRTdHJpbmcgPT0gbWt0b0FjY291bnRTdHJpbmdNYXN0ZXIgfHwgYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3Rlck1FVUUpICYmIC8vVE9ETyBNRVVFXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgdGhpcy5jaGlsZE5vZGVzLmxlbmd0aFxuICAgICAgKSB7XG4gICAgICAgIGlmICh0aGlzLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ1pvbmUnKSB7XG4gICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHRoaXMuY2hpbGROb2Rlcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgIGxldCBjdXJyRm9sZGVyID0gdGhpcy5jaGlsZE5vZGVzW2lpXVxuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuYXR0cmlidXRlcy5zeXN0ZW0gPT0gZmFsc2UgJiZcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJyAmJlxuICAgICAgICAgICAgICAoY3VyckZvbGRlci50ZXh0LnNlYXJjaChta3RvT3BlcmF0aW9uYWxGb2xkZXJzKSAhPSAtMSB8fFxuICAgICAgICAgICAgICAgIChBUFAuZ2V0VXNlclJvbGUoKSA9PSAnUGFydG5lcicgJiZcbiAgICAgICAgICAgICAgICAgIEFQUC5nZXRVc2VySWQoKVxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJ0AnKVswXVxuICAgICAgICAgICAgICAgICAgICAuc2VhcmNoKC9cXC5pbmZvciQvKSA9PSAtMSAmJlxuICAgICAgICAgICAgICAgICAgY3VyckZvbGRlci50ZXh0LnNlYXJjaChta3RvTGF1bmNoUG9pbnRGb2xkZXJUb0hpZGUpICE9IC0xKSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjdXJyRm9sZGVyLnVpLmhpZGUoKVxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmhpZGRlbiA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgdGhpcy5wYXJlbnROb2RlICYmXG4gICAgICAgICAgdGhpcy5wYXJlbnROb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ1pvbmUnICYmXG4gICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLnN5c3RlbSA9PSBmYWxzZSAmJlxuICAgICAgICAgIHRoaXMuaGlkZGVuID09IGZhbHNlICYmXG4gICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJ1xuICAgICAgICApIHtcbiAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgdGhpcy5jaGlsZE5vZGVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgbGV0IGN1cnJGb2xkZXIgPSB0aGlzLmNoaWxkTm9kZXNbaWldXG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5hdHRyaWJ1dGVzLnN5c3RlbSA9PSBmYWxzZSAmJlxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInICYmXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIudGV4dC5zZWFyY2gobWt0b09wZXJhdGlvbmFsRm9sZGVycykgIT0gLTFcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjdXJyRm9sZGVyLnVpLmhpZGUoKVxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmhpZGRlbiA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgdGhpcy5wYXJlbnROb2RlICYmXG4gICAgICAgICAgdGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICB0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlICYmXG4gICAgICAgICAgdGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdab25lJyAmJlxuICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5zeXN0ZW0gPT0gZmFsc2UgJiZcbiAgICAgICAgICB0aGlzLmhpZGRlbiA9PSBmYWxzZSAmJlxuICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5jb21wVHlwZSAhPSAnTWFya2V0aW5nIEZvbGRlcidcbiAgICAgICAgKSB7XG4gICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHRoaXMuY2hpbGROb2Rlcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgIGxldCBjdXJyRm9sZGVyID0gdGhpcy5jaGlsZE5vZGVzW2lpXVxuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuYXR0cmlidXRlcy5zeXN0ZW0gPT0gZmFsc2UgJiZcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJyAmJlxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLnRleHQuc2VhcmNoKG1rdG9PcGVyYXRpb25hbEZvbGRlcnMpICE9IC0xXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY3VyckZvbGRlci51aS5oaWRlKClcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5oaWRkZW4gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChhdHRyLnN1cHByZXNzQWpheENvbGxhcHNlKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmF0dHJpYnV0ZXMuc3VwcHJlc3NBamF4Q29sbGFwc2VcbiAgICAgIH0gZWxzZSBpZiAoaXNEZWZpbmVkKGF0dHIuZm9sZGVyKSAmJiBhdHRyLmZvbGRlciAmJiBhdHRyLm1rdEV4cGFuZGVkID09PSB0cnVlKSB7XG4gICAgICAgIE1rdEZvbGRlci5zYXZlRXhwYW5kU3RhdGUodGhpcywgZmFsc2UpXG4gICAgICB9XG4gICAgICBNa3RUcmVlTm9kZS5zdXBlcmNsYXNzLmNvbGxhcHNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgIGF0dHIubWt0RXhwYW5kZWQgPSBmYWxzZVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIG92ZXJyaWRlcyB0aGUgY3JlYXRlIGZ1bmN0aW9uIGZvciBhIG5ldyBQcm9ncmFtIG9yIFNlZ21lbnRhdGlvbiBpblxuICogIG9yZGVyIHRvIGVuZm9yY2UgYSBuYW1pbmcgY29udmVudGlvbiBieSBhcHBlbmRpbmcgdGhlIHVzZXIncyB1c2VybmFtZSB0byB0aGUgbmFtZVxuICogIG9mIHRoZSBuZXcgcHJvZ3JhbSBvciBzZWdtZW50YXRpb25cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlTmV3UHJvZ3JhbUNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogTmV3IFByb2dyYW0vU2VnbWVudGF0aW9uIENyZWF0aW9uJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0LndpZGdldHMuTW9kYWxGb3JtLnByb3RvdHlwZS5va0J1dHRvbkhhbmRsZXInKSAmJiB1c2VyTmFtZSkge1xuICAgIE1rdC53aWRnZXRzLk1vZGFsRm9ybS5wcm90b3R5cGUub2tCdXR0b25IYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBOZXcgUHJvZ3JhbS9TZWdtZW50YXRpb24gQ3JlYXRpb24nKVxuICAgICAgaWYgKHRoaXMudGl0bGUgPT0gJ05ldyBQcm9ncmFtJyB8fCB0aGlzLnRpdGxlID09ICdOZXcgU2VnbWVudGF0aW9uJykge1xuICAgICAgICBsZXQgaWlcblxuICAgICAgICBpZiAodGhpcy50aXRsZSA9PSAnTmV3IFByb2dyYW0nKSB7XG4gICAgICAgICAgaWYgKHRoaXMuZ2V0SW5wdXRJdGVtcygpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5nZXRJbnB1dEl0ZW1zKClbMV0gJiYgdGhpcy5nZXRJbnB1dEl0ZW1zKClbMV0uZmllbGRMYWJlbCA9PSAnTmFtZScpIHtcbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0SW5wdXRJdGVtcygpWzFdXG4gICAgICAgICAgICAgICAgICAuZ2V0VmFsdWUoKVxuICAgICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgIC5zZWFyY2godXNlck5hbWUgKyAnJCcpID09IC0xXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0SW5wdXRJdGVtcygpWzFdLnNldFZhbHVlKHRoaXMuZ2V0SW5wdXRJdGVtcygpWzFdLmdldFZhbHVlKCkgKyAnIC0gJyArIHVzZXJOYW1lKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGlpID0gMDsgaWkgPCB0aGlzLmdldElucHV0SXRlbXMoKS5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5nZXRJbnB1dEl0ZW1zKClbaWldICYmIHRoaXMuZ2V0SW5wdXRJdGVtcygpW2lpXS5maWVsZExhYmVsID09ICdOYW1lJykge1xuICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldElucHV0SXRlbXMoKVtpaV0uZ2V0VmFsdWUoKVxuICAgICAgICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgLnNlYXJjaCh1c2VyTmFtZSArICckJykgPT0gLTFcbiAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldElucHV0SXRlbXMoKVtpaV0uc2V0VmFsdWUodGhpcy5nZXRJbnB1dEl0ZW1zKClbaWldLmdldFZhbHVlKCkgKyAnIC0gJyArIHVzZXJOYW1lKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRpdGxlID09ICdOZXcgU2VnbWVudGF0aW9uJykge1xuICAgICAgICAgIGlmICh0aGlzLmZpbmRCeVR5cGUoJ3RleHRmaWVsZCcpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKVswXSAmJiB0aGlzLmZpbmRCeVR5cGUoJ3RleHRmaWVsZCcpWzBdLmZpZWxkTGFiZWwgPT0gJ05hbWUnKSB7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRCeVR5cGUoJ3RleHRmaWVsZCcpWzBdXG4gICAgICAgICAgICAgICAgICAuZ2V0VmFsdWUoKVxuICAgICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgIC5zZWFyY2godXNlck5hbWUgKyAnJCcpID09IC0xXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmluZEJ5VHlwZSgndGV4dGZpZWxkJylbMF0uc2V0VmFsdWUodGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKVswXS5nZXRWYWx1ZSgpICsgJyAtICcgKyB1c2VyTmFtZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgdGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKS5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKVtpaV0gJiYgdGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKVtpaV0uZmllbGRMYWJlbCA9PSAnTmFtZScpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKVxuICAgICAgICAgICAgICAgICAgICAgIFtpaV0uZ2V0VmFsdWUoKVxuICAgICAgICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgLnNlYXJjaCh1c2VyTmFtZSArICckJykgPT0gLTFcbiAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmRCeVR5cGUoJ3RleHRmaWVsZCcpW2lpXS5zZXRWYWx1ZSh0aGlzLmZpbmRCeVR5cGUoJ3RleHRmaWVsZCcpW2lpXS5nZXRWYWx1ZSgpICsgJyAtICcgKyB1c2VyTmFtZSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc3VibWl0SW5Qcm9ncmVzcykge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuYmVmb3JlU3VibWl0Q2FsbGJhY2soKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9rQ2FsbGJhY2sgJiYgaXNGdW5jdGlvbih0aGlzLm9rQ2FsbGJhY2spKSB7XG4gICAgICAgIHRoaXMub2tDYWxsYmFjaygpXG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5zdWJtaXRVcmwpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnNob3dQcm9ncmVzc01vZGFsKSB7XG4gICAgICAgIHRoaXMuaGlkZSgpXG5cbiAgICAgICAgdGhpcy5wcm9ncmVzc01vZGFsID0gRXh0Lk1lc3NhZ2VCb3guc2hvdyh7XG4gICAgICAgICAgdGl0bGU6IE1rdExhbmcuZ2V0U3RyKCdNb2RhbEZvcm0uUGxlYXNlX3dhaXQnKSxcbiAgICAgICAgICBtc2c6IHRoaXMucHJvZ3Jlc3NNc2csXG4gICAgICAgICAgcHJvZ3Jlc3M6IHRydWUsXG4gICAgICAgICAgd2FpdDogdHJ1ZSxcbiAgICAgICAgICB3aWR0aDogMjAwLFxuICAgICAgICAgIGNsb3NhYmxlOiBmYWxzZVxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgTWt0U2Vzc2lvbi5jbG9ja0N1cnNvcigpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3VibWl0SW5Qcm9ncmVzcyA9IHRydWVcbiAgICAgIHRoaXMuZW5hYmxlT2tDYW5jZWxCdXR0b24oIXRoaXMuc3VibWl0SW5Qcm9ncmVzcylcblxuICAgICAgaWYgKHRoaXMuc2VyaWFsaXplSlNPTikge1xuICAgICAgICB0aGlzLnNlcmlhbGl6ZVBhcm1zID0gdGhpcy5zZXJpYWxpemVQYXJtcyB8fCB7fVxuICAgICAgICB0aGlzLnNlcmlhbGl6ZVBhcm1zLl9qc29uID0gRXh0LmVuY29kZSh0aGlzLnNlcmlhbGl6ZUpTT04pXG4gICAgICB9XG5cbiAgICAgIGxldCBwYXJtcyA9IEV4dC5hcHBseSh7fSwgdGhpcy5zZXJpYWxpemVQYXJtcywgdGhpcy5iYXNlUGFyYW1zKVxuICAgICAgTWt0U2Vzc2lvbi5hamF4UmVxdWVzdCh0aGlzLnN1Ym1pdFVybCwge1xuICAgICAgICBzZXJpYWxpemVQYXJtczogcGFybXMsXG4gICAgICAgIG9uTXlTdWNjZXNzOiB0aGlzLnN1Ym1pdFN1Y2Nlc3NIYW5kbGVyLmNyZWF0ZURlbGVnYXRlKHRoaXMpLFxuICAgICAgICBvbk15RmFpbHVyZTogdGhpcy5zdWJtaXRGYWlsZWRIYW5kbGVyLmNyZWF0ZURlbGVnYXRlKHRoaXMpXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIG92ZXJyaWRlcyB0aGUgc2F2ZSBlZGl0IGZ1bmN0aW9uIGZvciByZW5hbWluZyBleGlzaXRpbmcgUHJvZ3JhbXMsXG4gKiAgU21hcnQgQ2FtcGFpZ25zLCBBc3NldHMsIGFuZCBGb2xkZXJzIGluIG9yZGVyIHRvIGVuZm9yY2UgYSBuYW1pbmcgY29udmVudGlvbiBieVxuICogIGFwcGVuZGluZyB0aGUgdXNlcidzIHVzZXJuYW1lIHRvIHRoZSBuYW1lIG9mIHRoZSBwcm9ncmFtLCBzbWFydCBjYW1wYWlnbiwgYXNzZXQsIG9yXG4gKiAgZm9sZGVyOyBhZGRpdGlvbmFsbHksIGl0IHByZXZlbnRzIHRoZSByZW5hbWluZyBvZiB0aGUgdXNlcidzIHJvb3QgZm9sZGVyIHZpYSB0aGVcbiAqICBNYXJrZXRvIGNhbnZhcyB0YWJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlQXNzZXRTYXZlRWRpdCA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogQXNzZXQgU2F2ZSBFZGl0JylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0LndpZGdldHMuQ2FudmFzSGVhZGVyLnByb3RvdHlwZS5zYXZlRWRpdCcpKSB7XG4gICAgaWYgKHR5cGVvZiBvcmlnQXNzZXRTYXZlRWRpdCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgb3JpZ0Fzc2V0U2F2ZUVkaXQgPSBNa3Qud2lkZ2V0cy5DYW52YXNIZWFkZXIucHJvdG90eXBlLnNhdmVFZGl0XG4gICAgfVxuXG4gICAgTWt0LndpZGdldHMuQ2FudmFzSGVhZGVyLnByb3RvdHlwZS5zYXZlRWRpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChcbiAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RDYW52YXMuZ2V0QWN0aXZlVGFiJykgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZy5hY2Nlc3Nab25lSWQgJiZcbiAgICAgICAgdXNlck5hbWVcbiAgICAgICkge1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IEFzc2V0IFNhdmUgRWRpdCcpXG4gICAgICAgIGxldCBjdXJyV29ya3NwYWNlSWQgPSBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnLmFjY2Vzc1pvbmVJZFxuXG4gICAgICAgIGlmIChjdXJyV29ya3NwYWNlSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICBsZXQgaXNGb2xkZXJFZGl0ID0gZmFsc2VcblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIChNa3RFeHBsb3Jlci5nZXRFbCgpLmRvbS5vd25lckRvY3VtZW50LnRpdGxlLnNlYXJjaCgnTWFya2V0aW5nIEFjdGl2aXRpZXMnKSAhPSAtMSAmJlxuICAgICAgICAgICAgICAodGhpcy50aXRsZUlkID09ICdtcFRFTmFtZScgfHwgdGhpcy50aXRsZUlkID09ICdjZGhURU5hbWUnIHx8IHRoaXMudGl0bGVJZCA9PSAncG5hbWUnKSkgfHxcbiAgICAgICAgICAgIE1rdEV4cGxvcmVyLmdldEVsKCkuZG9tLm93bmVyRG9jdW1lbnQudGl0bGUuc2VhcmNoKCdNYXJrZXRpbmcgQWN0aXZpdGllcycpID09IC0xXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50aXRsZUlkID09ICdwbmFtZScpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMudGl0bGVWYWx1ZSA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgIGlzRm9sZGVyRWRpdCA9IHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRoaXMuZ2V0VGl0bGVGaWVsZCgpXG4gICAgICAgICAgICAgICAgLmdldFZhbHVlKClcbiAgICAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIC5zZWFyY2godXNlck5hbWUgKyAnJCcpID09IC0xXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5nZXRUaXRsZUZpZWxkKCkuc2V0VmFsdWUodGhpcy5nZXRUaXRsZUZpZWxkKCkuZ2V0VmFsdWUoKSArICcgLSAnICsgdXNlck5hbWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGlzRm9sZGVyRWRpdCkge1xuICAgICAgICAgICAgdmFyIHRvVXBkYXRlTm9kZVRleHQgPSBmYWxzZVxuXG4gICAgICAgICAgICBNa3RTZXNzaW9uLmNsb2NrQ3Vyc29yKHRydWUpXG4gICAgICAgICAgICB0aGlzLmdldFRpdGxlRmllbGQoKS5zZXRWYWx1ZSh0aGlzLnRpdGxlVmFsdWUpXG4gICAgICAgICAgICB2YXIgY2FudmFzVGFiID0gTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLFxuICAgICAgICAgICAgICAvL2NhbnZhc1RhYi51cGRhdGVUYWJUaXRsZSh0aGlzLnRpdGxlVmFsdWUpO1xuICAgICAgICAgICAgICBub2RlSWQgPSBudWxsXG4gICAgICAgICAgICBpZiAoY2FudmFzVGFiLmNvbmZpZy5leHBOb2RlSWQpIHtcbiAgICAgICAgICAgICAgdmFyIG5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChjYW52YXNUYWIuY29uZmlnLmV4cE5vZGVJZClcbiAgICAgICAgICAgICAgaWYgKG5vZGUgJiYgbm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHtjb21wVHlwZX0gPSBub2RlLmF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICBpZiAoY29tcFR5cGUgPT0gJ01hcmtldGluZyBQcm9ncmFtJykge1xuICAgICAgICAgICAgICAgICAgbm9kZUlkID0gY2FudmFzVGFiLmNvbmZpZy5leHBOb2RlSWRcbiAgICAgICAgICAgICAgICAgIC8vTWt0RXhwbG9yZXIubG9ja1N1YlRyZWUobm9kZUlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBUeXBlID09ICdJbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgIHRvVXBkYXRlTm9kZVRleHQgPSBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZWwgPSB0aGlzLmdldEVsKCksXG4gICAgICAgICAgICAgIHBhbmVsT2JqID0gdGhpcyxcbiAgICAgICAgICAgICAge2Zvcm1QYW5lbH0gPSB0aGlzLFxuICAgICAgICAgICAgICB7dmlld1BhbmVsfSA9IHRoaXNcbiAgICAgICAgICAgIGZvcm1QYW5lbC5oaWRlKHRydWUsIDAuMilcbiAgICAgICAgICAgIHZpZXdQYW5lbC5zaG93KHRydWUsIDAuMilcbiAgICAgICAgICAgIHZpZXdQYW5lbC5ib2R5LnVwZGF0ZShwYW5lbE9iai52aWV3VGVtcGxhdGUuYXBwbHkocGFuZWxPYmopKVxuXG4gICAgICAgICAgICBlbC5hbmltYXRlKFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB7XG4gICAgICAgICAgICAgICAgICBmcm9tOiB0aGlzLmdldEhlaWdodCgpLFxuICAgICAgICAgICAgICAgICAgdG86IHRoaXMub3JpZ0hlaWdodFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgMC4yNSxcbiAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBhbmVsT2JqLnNldEhlaWdodChwYW5lbE9iai5vcmlnSGVpZ2h0KVxuICAgICAgICAgICAgICAgIHBhbmVsT2JqLmJvZHkuc2V0SGVpZ2h0KHBhbmVsT2JqLm9yaWdIZWlnaHQpXG4gICAgICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24ocGFuZWxPYmouc2F2ZWRDYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICAgIHBhbmVsT2JqLnNhdmVkQ2FsbGJhY2soKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICBNa3RTZXNzaW9uLnVuY2xvY2tDdXJzb3IoKVxuICAgICAgICAgICAgdGhpcy5fc2F2ZUluUHJvZ3Jlc3MgPSBmYWxzZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdG9VcGRhdGVOb2RlVGV4dCA9IHRydWVcblxuICAgICAgICAgICAgTWt0U2Vzc2lvbi5jbG9ja0N1cnNvcih0cnVlKVxuICAgICAgICAgICAgdGhpcy5zZXJpYWxpemVQYXJtc1t0aGlzLnRpdGxlSWRdID0gdGhpcy5nZXRUaXRsZUZpZWxkKCkuZ2V0VmFsdWUoKVxuICAgICAgICAgICAgdGhpcy5zZXJpYWxpemVQYXJtc1t0aGlzLmRlc2NJZF0gPSB0aGlzLmdldERlc2NGaWVsZCgpLmdldFZhbHVlKClcblxuICAgICAgICAgICAgdGhpcy5uZXdUaXRsZVZhbHVlID0gTWt0UGFnZS5pc0ZlYXR1cmVFbmFibGVkKCd0cmVlRW5jb2RpbmcnKVxuICAgICAgICAgICAgICA/IHRoaXMuc2VyaWFsaXplUGFybXNbdGhpcy50aXRsZUlkXVxuICAgICAgICAgICAgICA6IEV4dC51dGlsLkZvcm1hdC5odG1sRW5jb2RlKHRoaXMuc2VyaWFsaXplUGFybXNbdGhpcy50aXRsZUlkXSlcbiAgICAgICAgICAgIHRoaXMubmV3RGVzY1ZhbHVlID0gRXh0LnV0aWwuRm9ybWF0Lmh0bWxFbmNvZGUodGhpcy5zZXJpYWxpemVQYXJtc1t0aGlzLmRlc2NJZF0pXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNhbnZhc0NvbmZpZygpXG5cbiAgICAgICAgICAgIHRoaXMucHJldlRpdGxlVmFsdWUgPSB0aGlzLnRpdGxlVmFsdWVcbiAgICAgICAgICAgIHRoaXMudGl0bGVWYWx1ZSA9IHRoaXMubmV3VGl0bGVWYWx1ZVxuICAgICAgICAgICAgdGhpcy5kZXNjVmFsdWUgPSB0aGlzLm5ld0Rlc2NWYWx1ZVxuICAgICAgICAgICAgTWt0UGFnZS51cGRhdGVGdWxsVGl0bGUoKVxuICAgICAgICAgICAgdmFyIGNhbnZhc1RhYiA9IE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKVxuICAgICAgICAgICAgY2FudmFzVGFiLnVwZGF0ZVRhYlRpdGxlKHRoaXMudGl0bGVWYWx1ZSlcbiAgICAgICAgICAgIHZhciBub2RlSWQgPSBudWxsXG4gICAgICAgICAgICBpZiAoY2FudmFzVGFiLmNvbmZpZy5leHBOb2RlSWQpIHtcbiAgICAgICAgICAgICAgdmFyIG5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChjYW52YXNUYWIuY29uZmlnLmV4cE5vZGVJZClcbiAgICAgICAgICAgICAgaWYgKG5vZGUgJiYgbm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHtjb21wVHlwZX0gPSBub2RlLmF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICBpZiAoY29tcFR5cGUgPT0gJ01hcmtldGluZyBQcm9ncmFtJykge1xuICAgICAgICAgICAgICAgICAgbm9kZUlkID0gY2FudmFzVGFiLmNvbmZpZy5leHBOb2RlSWRcbiAgICAgICAgICAgICAgICAgIE1rdEV4cGxvcmVyLmxvY2tTdWJUcmVlKG5vZGVJZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBUeXBlID09ICdJbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgIHRvVXBkYXRlTm9kZVRleHQgPSBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodG9VcGRhdGVOb2RlVGV4dCkge1xuICAgICAgICAgICAgICAgIE1rdEV4cGxvcmVyLnVwZGF0ZU5vZGVUZXh0KGNhbnZhc1RhYi5jb25maWcuZXhwTm9kZUlkLCB0aGlzLnRpdGxlVmFsdWUpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGVsID0gdGhpcy5nZXRFbCgpLFxuICAgICAgICAgICAgICBwYW5lbE9iaiA9IHRoaXMsXG4gICAgICAgICAgICAgIHtmb3JtUGFuZWx9ID0gdGhpcyxcbiAgICAgICAgICAgICAge3ZpZXdQYW5lbH0gPSB0aGlzXG4gICAgICAgICAgICBmb3JtUGFuZWwuaGlkZSh0cnVlLCAwLjIpXG4gICAgICAgICAgICB2aWV3UGFuZWwuc2hvdyh0cnVlLCAwLjIpXG4gICAgICAgICAgICB2aWV3UGFuZWwuYm9keS51cGRhdGUocGFuZWxPYmoudmlld1RlbXBsYXRlLmFwcGx5KHBhbmVsT2JqKSlcblxuICAgICAgICAgICAgZWwuYW5pbWF0ZShcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGhlaWdodDoge1xuICAgICAgICAgICAgICAgICAgZnJvbTogdGhpcy5nZXRIZWlnaHQoKSxcbiAgICAgICAgICAgICAgICAgIHRvOiB0aGlzLm9yaWdIZWlnaHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIDAuMjUsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwYW5lbE9iai5zZXRIZWlnaHQocGFuZWxPYmoub3JpZ0hlaWdodClcbiAgICAgICAgICAgICAgICBwYW5lbE9iai5ib2R5LnNldEhlaWdodChwYW5lbE9iai5vcmlnSGVpZ2h0KVxuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHBhbmVsT2JqLnNhdmVkQ2FsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgICBwYW5lbE9iai5zYXZlZENhbGxiYWNrKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcblxuICAgICAgICAgICAgTWt0U2Vzc2lvbi51bmNsb2NrQ3Vyc29yKClcbiAgICAgICAgICAgIHRoaXMuX3NhdmVJblByb2dyZXNzID0gdHJ1ZVxuICAgICAgICAgICAgTWt0U2Vzc2lvbi5hamF4UmVxdWVzdCh0aGlzLmFjdGlvblVybCwge1xuICAgICAgICAgICAgICBzZXJpYWxpemVQYXJtczogdGhpcy5zZXJpYWxpemVQYXJtcyxcbiAgICAgICAgICAgICAgY29udGFpbmVySWQ6IHRoaXMuaWQsXG4gICAgICAgICAgICAgIG9uTXlTdWNjZXNzOiB0aGlzLnNhdmVSZXNwb25zZS5jcmVhdGVEZWxlZ2F0ZSh0aGlzLCBbbm9kZUlkXSwgdHJ1ZSksXG4gICAgICAgICAgICAgIG9uTXlFcnJvcjogdGhpcy5zYXZlRXJyb3IuY3JlYXRlRGVsZWdhdGUodGhpcywgW25vZGVJZF0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjdXJyV29ya3NwYWNlSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICB2YXIgdG9VcGRhdGVOb2RlVGV4dCA9IGZhbHNlXG5cbiAgICAgICAgICBNa3RTZXNzaW9uLmNsb2NrQ3Vyc29yKHRydWUpXG4gICAgICAgICAgdGhpcy5nZXRUaXRsZUZpZWxkKCkuc2V0VmFsdWUodGhpcy50aXRsZVZhbHVlKVxuICAgICAgICAgIGxldCBjYW52YXNUYWIgPSBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCksXG4gICAgICAgICAgICBub2RlSWQgPSBudWxsXG4gICAgICAgICAgaWYgKGNhbnZhc1RhYi5jb25maWcuZXhwTm9kZUlkKSB7XG4gICAgICAgICAgICBsZXQgbm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKGNhbnZhc1RhYi5jb25maWcuZXhwTm9kZUlkKVxuICAgICAgICAgICAgaWYgKG5vZGUgJiYgbm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlKSB7XG4gICAgICAgICAgICAgIGxldCB7Y29tcFR5cGV9ID0gbm9kZS5hdHRyaWJ1dGVzXG4gICAgICAgICAgICAgIGlmIChjb21wVHlwZSA9PSAnTWFya2V0aW5nIFByb2dyYW0nKSB7XG4gICAgICAgICAgICAgICAgbm9kZUlkID0gY2FudmFzVGFiLmNvbmZpZy5leHBOb2RlSWRcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoY29tcFR5cGUgPT0gJ0ltYWdlJykge1xuICAgICAgICAgICAgICAgIHRvVXBkYXRlTm9kZVRleHQgPSBmYWxzZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IGVsID0gdGhpcy5nZXRFbCgpLFxuICAgICAgICAgICAgcGFuZWxPYmogPSB0aGlzLFxuICAgICAgICAgICAge2Zvcm1QYW5lbH0gPSB0aGlzLFxuICAgICAgICAgICAge3ZpZXdQYW5lbH0gPSB0aGlzXG4gICAgICAgICAgZm9ybVBhbmVsLmhpZGUodHJ1ZSwgMC4yKVxuICAgICAgICAgIHZpZXdQYW5lbC5zaG93KHRydWUsIDAuMilcbiAgICAgICAgICB2aWV3UGFuZWwuYm9keS51cGRhdGUocGFuZWxPYmoudmlld1RlbXBsYXRlLmFwcGx5KHBhbmVsT2JqKSlcblxuICAgICAgICAgIGVsLmFuaW1hdGUoe2hlaWdodDogeyBmcm9tOiB0aGlzLmdldEhlaWdodCgpLCB0bzogdGhpcy5vcmlnSGVpZ2h0fX0sIDAuMjUsXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHBhbmVsT2JqLnNldEhlaWdodChwYW5lbE9iai5vcmlnSGVpZ2h0KVxuICAgICAgICAgICAgICBwYW5lbE9iai5ib2R5LnNldEhlaWdodChwYW5lbE9iai5vcmlnSGVpZ2h0KVxuICAgICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihwYW5lbE9iai5zYXZlZENhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIHBhbmVsT2JqLnNhdmVkQ2FsbGJhY2soKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKVxuXG4gICAgICAgICAgTWt0U2Vzc2lvbi51bmNsb2NrQ3Vyc29yKClcbiAgICAgICAgICB0aGlzLl9zYXZlSW5Qcm9ncmVzcyA9IGZhbHNlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3JpZ0Fzc2V0U2F2ZUVkaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gb3ZlcnJpZGVzIHRoZSBjcmVhdGUgZnVuY3Rpb24gZm9yIGFueSBuZXcgYXNzZXQgdGhhdCBpcyBub3QgYSBjaGlsZFxuICogIG9mIGEgcHJvZ3JhbSBpbiBvcmRlciB0byBlbmZvcmNlIGEgbmFtaW5nIGNvbnZlbnRpb24gYnkgYXBwZW5kaW5nIHRoZSB1c2VyJ3NcbiAqICB1c2VybmFtZSB0byB0aGUgbmFtZSBvZiB0aGUgbmV3IGFzc2V0XG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5vdmVycmlkZU5ld0Fzc2V0Q3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBPdmVycmlkaW5nOiBOZXcgQXNzZXQgQ3JlYXRpb24nKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIubGliLkFic3RyYWN0TW9kYWxGb3JtLnByb3RvdHlwZS5vblN1Ym1pdCcpICYmIHVzZXJOYW1lKSB7XG4gICAgTWt0My5jb250cm9sbGVyLmxpYi5BYnN0cmFjdE1vZGFsRm9ybS5wcm90b3R5cGUub25TdWJtaXQgPSBmdW5jdGlvbiAoZm9ybSkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBOZXcgQXNzZXQgQ3JlYXRpb24nKVxuICAgICAgaWYgKFxuICAgICAgICBmb3JtID09IG51bGwgfHxcbiAgICAgICAgZm9ybS5vd25lckFzc2V0ID09IG51bGwgfHxcbiAgICAgICAgZm9ybS5vd25lckFzc2V0LmlzT25lT2ZQcm9ncmFtVHlwZXMgPT0gbnVsbCB8fFxuICAgICAgICBmb3JtLm93bmVyQXNzZXQuaXNPbmVPZlByb2dyYW1UeXBlcygpID09IGZhbHNlXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGZvcm0uZ2V0WFR5cGUoKSAhPSAnbnVydHVyZVRyYWNrRm9ybScgJiZcbiAgICAgICAgICB0aGlzICE9IG51bGwgJiZcbiAgICAgICAgICB0aGlzLmdldEZpZWxkKCduYW1lJykgIT0gbnVsbCAmJlxuICAgICAgICAgIHRoaXMuZ2V0RmllbGQoJ25hbWUnKS5nZXRWYWx1ZSgpICE9IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgbGV0IGFzc2V0TmFtZSA9IHRoaXMuZ2V0RmllbGQoJ25hbWUnKS5nZXRWYWx1ZSgpXG5cbiAgICAgICAgICBpZiAoYXNzZXROYW1lLnRvTG93ZXJDYXNlKCkuc2VhcmNoKHVzZXJOYW1lICsgJyQnKSA9PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5nZXRGaWVsZCgnbmFtZScpLnNldFZhbHVlKGFzc2V0TmFtZSArICcgLSAnICsgdXNlck5hbWUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZvcm0gPSAhZm9ybS5pc1hUeXBlKCdtb2RhbEZvcm0nKSA/IGZvcm0udXAoJ21vZGFsRm9ybScpIDogZm9ybVxuXG4gICAgICBmb3JtLnNldFN1Ym1pdHRpbmcodHJ1ZSlcblxuICAgICAgaWYgKHRoaXMudmFsaWRhdGUoZm9ybSkpIHtcbiAgICAgICAgaWYgKHRoaXMuYXBwbGljYXRpb24uZmlyZUV2ZW50KHRoaXMud2lkZ2V0SWQgKyAnQmVmb3JlU3VibWl0JywgZm9ybSA/IGZvcm0uZ2V0UmVjb3JkKCkgOiBudWxsKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdWJtaXQoZm9ybSkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLnN1Ym1pdENvbXBsZXRlKGZvcm0pXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvcm0uc2V0U3VibWl0dGluZyhmYWxzZSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9ybS5zaG93RGVmYXVsdE1lc3NhZ2UoKVxuICAgICAgICBmb3JtLnNldFN1Ym1pdHRpbmcoZmFsc2UpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gb3ZlcnJpZGVzIHRoZSBuZXcgZm9sZGVyIGNyZWF0ZSBmdW5jdGlvbiB2aWEgUmlnaHQtY2xpY2sgPiBOZXdcbiAqICBDYW1wYWlnbiBGb2xkZXIsIE5ldyBGb2xkZXIgaW4gb3JkZXIgdG8gZW5mb3JjZSBhIG5hbWluZyBjb252ZW50aW9uIGJ5IGFwcGVuZGluZ1xuICogIHRoZSB1c2VyJ3MgdXNlcm5hbWUgdG8gdGhlIG5ldyBuYW1lIG9mIGFueSBmb2xkZXIgdGhhdCBpcyBub3QgYSBjaGlsZCBvZiBhIHByb2dyYW1cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlTmV3Rm9sZGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogTmV3IEZvbGRlcnMnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RNYS5uZXdQcm9ncmFtRm9sZGVyU3VibWl0JykgJiYgdXNlck5hbWUpIHtcbiAgICBNa3RNYS5uZXdQcm9ncmFtRm9sZGVyU3VibWl0ID0gZnVuY3Rpb24gKHRleHQsIHBhcmVudElkLCB0ZW1wTm9kZUlkKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IE5ldyBGb2xkZXJzIGluIE1hcmtldGluZyBBY3Rpdml0aWVzJylcbiAgICAgIE1rdFNlc3Npb24uY2xvY2tDdXJzb3IodHJ1ZSlcbiAgICAgIGxldCBwYXJtcyA9IHt9XG5cbiAgICAgIGlmIChcbiAgICAgICAgKHRoaXMuY3Vyck5vZGUucGFyZW50Tm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlLnNlYXJjaCgnRm9sZGVyJCcpICE9IC0xICYmIHRleHQudG9Mb3dlckNhc2UoKS5zZWFyY2godXNlck5hbWUgKyAnJCcpID09IC0xKSB8fFxuICAgICAgICB0ZXh0ID09IHVzZXJOYW1lXG4gICAgICApIHtcbiAgICAgICAgdGV4dCA9IHRleHQgKyAnIC0gJyArIHVzZXJOYW1lXG4gICAgICB9XG4gICAgICBwYXJtcy50ZXh0ID0gdGV4dFxuICAgICAgcGFybXMucGFyZW50SWQgPSBwYXJlbnRJZFxuICAgICAgcGFybXMudGVtcE5vZGVJZCA9IHRlbXBOb2RlSWRcbiAgICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QoJ2V4cGxvcmVyL2NyZWF0ZVByb2dyYW1Gb2xkZXInLCB7XG4gICAgICAgIHNlcmlhbGl6ZVBhcm1zOiBwYXJtcyxcbiAgICAgICAgb25NeVN1Y2Nlc3M6IE1rdE1hLm5ld1Byb2dyYW1Gb2xkZXJEb25lLFxuICAgICAgICBvbk15RmFpbHVyZTogZnVuY3Rpb24gKHRlbXBOb2RlSWQpIHtcbiAgICAgICAgICBsZXQgdGVtcE5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZCh0ZW1wTm9kZUlkKVxuICAgICAgICAgIGlmICh0ZW1wTm9kZSkge1xuICAgICAgICAgICAgdGVtcE5vZGUucmVtb3ZlKClcbiAgICAgICAgICB9XG4gICAgICAgIH0uY3JlYXRlRGVsZWdhdGUodGhpcywgW3RlbXBOb2RlSWRdKVxuICAgICAgfSlcbiAgICAgIGlmIChNa3RNYS5jdXJyTm9kZSkge1xuICAgICAgICBNa3RNYS5jdXJyTm9kZS51bnNlbGVjdCgpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0Rm9sZGVyLm5ld0ZvbGRlclN1Ym1pdCcpICYmIHVzZXJOYW1lKSB7XG4gICAgTWt0Rm9sZGVyLm5ld0ZvbGRlclN1Ym1pdCA9IGZ1bmN0aW9uICh0ZXh0LCBwYXJlbnROb2RlSWQsIHRlbXBOb2RlSWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogTmV3IEZvbGRlcnMnKVxuICAgICAgTWt0U2Vzc2lvbi5jbG9ja0N1cnNvcih0cnVlKVxuICAgICAgbGV0IHBhcm1zID0ge31cblxuICAgICAgaWYgKHRleHQudG9Mb3dlckNhc2UoKS5zZWFyY2godXNlck5hbWUgKyAnJCcpID09IC0xIHx8IHRleHQgPT0gdXNlck5hbWUpIHtcbiAgICAgICAgdGV4dCA9IHRleHQgKyAnIC0gJyArIHVzZXJOYW1lXG4gICAgICB9XG4gICAgICBwYXJtcy50ZXh0ID0gdGV4dFxuICAgICAgcGFybXMucGFyZW50Tm9kZUlkID0gcGFyZW50Tm9kZUlkXG4gICAgICBwYXJtcy50ZW1wTm9kZUlkID0gdGVtcE5vZGVJZFxuICAgICAgTWt0U2Vzc2lvbi5hamF4UmVxdWVzdCgnZm9sZGVyL2NyZWF0ZUZvbGRlclN1Ym1pdCcsIHtcbiAgICAgICAgc2VyaWFsaXplUGFybXM6IHBhcm1zLFxuICAgICAgICBvbk15U3VjY2VzczogTWt0Rm9sZGVyLm5ld0ZvbGRlclN1Ym1pdERvbmUuY3JlYXRlRGVsZWdhdGUodGhpcywgW3RlbXBOb2RlSWRdKSxcbiAgICAgICAgb25NeUZhaWx1cmU6IGZ1bmN0aW9uICh0ZW1wTm9kZUlkKSB7XG4gICAgICAgICAgbGV0IHRlbXBOb2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQodGVtcE5vZGVJZClcbiAgICAgICAgICBpZiAodGVtcE5vZGUpIHtcbiAgICAgICAgICAgIHRlbXBOb2RlLnJlbW92ZSgpXG4gICAgICAgICAgfVxuICAgICAgICB9LmNyZWF0ZURlbGVnYXRlKHRoaXMsIFt0ZW1wTm9kZUlkXSlcbiAgICAgIH0pXG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gb3ZlcnJpZGVzIHRoZSBmb2xkZXIgcmVuYW1pbmcgZnVuY3Rpb25zIGluIG9yZGVyIHRvIHByZXZlbnQgcmVuYW1pbmdcbiAqICBvZiB0aGUgdXNlcidzIHJvb3QgZm9sZGVyIHZpYSBSaWdodC1jbGljayA+IFJlbmFtZSBGb2xkZXIgYW5kIHRvIGVuZm9yY2UgYSBuYW1pbmdcbiAqICBjb252ZW50aW9uIGJ5IGFwcGVuZGluZyB0aGUgdXNlcidzIHVzZXJuYW1lIHRvIHRoZSBuZXcgbmFtZSBvZiBhbnkgZm9sZGVyIHRoYXQgaXNcbiAqICBub3QgYSBjaGlsZCBvZiBhIHByb2dyYW1cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlUmVuYW1pbmdGb2xkZXJzID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBPdmVycmlkaW5nOiBSZW5hbWluZyBGb2xkZXJzJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0TWEucmVuYW1lUHJvZ3JhbUZvbGRlclN1Ym1pdCcpICYmIHVzZXJOYW1lKSB7XG4gICAgTWt0TWEucmVuYW1lUHJvZ3JhbUZvbGRlclN1Ym1pdCA9IGZ1bmN0aW9uICh2YWx1ZSwgc3RhcnRWYWx1ZSwgZm9sZGVySWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogUmVuYW1pbmcgRm9sZGVycyBpbiBNYXJrZXRpbmcgQWN0aXZpdGllcycpXG4gICAgICBNa3RTZXNzaW9uLmNsb2NrQ3Vyc29yKHRydWUpXG4gICAgICBsZXQgZm9sZGVyID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoZm9sZGVySWQpLFxuICAgICAgICBwYXJtcyA9IHt9XG5cbiAgICAgIGlmIChcbiAgICAgICAgc3RhcnRWYWx1ZSA9PSB1c2VyTmFtZSAmJlxuICAgICAgICB0aGlzLmN1cnJOb2RlLnBhcmVudE5vZGUuYXR0cmlidXRlcy5zeXN0ZW0gPT0gdHJ1ZSAmJlxuICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xXG4gICAgICApIHtcbiAgICAgICAgaWYgKGZvbGRlcikge1xuICAgICAgICAgIGZvbGRlci5zZXRUZXh0KHN0YXJ0VmFsdWUpXG4gICAgICAgIH1cbiAgICAgICAgTWt0U2Vzc2lvbi51bmNsb2NrQ3Vyc29yKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAodGhpcy5jdXJyTm9kZS5wYXJlbnROb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUuc2VhcmNoKCdGb2xkZXIkJykgIT0gLTEgJiYgdmFsdWUudG9Mb3dlckNhc2UoKS5zZWFyY2godXNlck5hbWUgKyAnJCcpKSA9PSAtMSB8fFxuICAgICAgICAgIHZhbHVlID09IHVzZXJOYW1lXG4gICAgICAgICkge1xuICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyAnIC0gJyArIHVzZXJOYW1lXG4gICAgICAgICAgaWYgKGZvbGRlcikge1xuICAgICAgICAgICAgZm9sZGVyLnNldFRleHQodmFsdWUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBhcm1zLm9yaWdQcm9ncmFtTmFtZSA9IHN0YXJ0VmFsdWVcbiAgICAgICAgcGFybXMubmV3UHJvZ3JhbU5hbWUgPSB2YWx1ZVxuICAgICAgICBwYXJtcy5mb2xkZXJJZCA9IGZvbGRlcklkXG4gICAgICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QoJ2V4cGxvcmVyL3JlbmFtZVByb2dyYW1Gb2xkZXInLCB7XG4gICAgICAgICAgc2VyaWFsaXplUGFybXM6IHBhcm1zLFxuICAgICAgICAgIG9uTXlTdWNjZXNzOiBNa3RNYS5yZW5hbWVQcm9ncmFtRm9sZGVyU3VibWl0RG9uZSxcbiAgICAgICAgICBvbk15RmFpbHVyZTogZnVuY3Rpb24gKGZvbGRlcklkLCBvcmlnTmFtZSkge1xuICAgICAgICAgICAgbGV0IGZvbGRlciA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKGZvbGRlcklkKVxuICAgICAgICAgICAgaWYgKGZvbGRlcikge1xuICAgICAgICAgICAgICBmb2xkZXIuc2V0VGV4dChvcmlnTmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LmNyZWF0ZURlbGVnYXRlKHRoaXMsIFtmb2xkZXJJZCwgc3RhcnRWYWx1ZV0pXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0Rm9sZGVyLnJlbmFtZUZvbGRlclN1Ym1pdCcpICYmIHVzZXJOYW1lKSB7XG4gICAgTWt0Rm9sZGVyLnJlbmFtZUZvbGRlclN1Ym1pdCA9IGZ1bmN0aW9uICh0ZXh0LCBzdGFydFZhbHVlLCBub2RlSWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogUmVuYW1pbmcgRm9sZGVycycpXG4gICAgICBNa3RTZXNzaW9uLmNsb2NrQ3Vyc29yKHRydWUpXG4gICAgICBsZXQgcGFybXMgPSB7fVxuXG4gICAgICBpZiAoXG4gICAgICAgIHN0YXJ0VmFsdWUgPT0gdXNlck5hbWUgJiZcbiAgICAgICAgdGhpcy5jdXJyTm9kZS5wYXJlbnROb2RlLmF0dHJpYnV0ZXMuc3lzdGVtID09IHRydWUgJiZcbiAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMVxuICAgICAgKSB7XG4gICAgICAgIE1rdEZvbGRlci5jdXJyTm9kZS5zZXRUZXh0KHN0YXJ0VmFsdWUpXG4gICAgICAgIE1rdFNlc3Npb24udW5jbG9ja0N1cnNvcigpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGV4dC50b0xvd2VyQ2FzZSgpLnNlYXJjaCh1c2VyTmFtZSArICckJykgPT0gLTEgfHwgdGV4dCA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgIHRleHQgPSB0ZXh0ICsgJyAtICcgKyB1c2VyTmFtZVxuICAgICAgICAgIE1rdEZvbGRlci5jdXJyTm9kZS5zZXRUZXh0KHRleHQpXG4gICAgICAgIH1cbiAgICAgICAgcGFybXMudGV4dCA9IHRleHRcbiAgICAgICAgcGFybXMubm9kZUlkID0gbm9kZUlkXG4gICAgICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QoJ2ZvbGRlci9yZW5hbWVGb2xkZXJTdWJtaXQnLCB7XG4gICAgICAgICAgc2VyaWFsaXplUGFybXM6IHBhcm1zLFxuICAgICAgICAgIG9uTXlTdWNjZXNzOiBNa3RGb2xkZXIucmVuYW1lRm9sZGVyU3VibWl0RG9uZS5jcmVhdGVEZWxlZ2F0ZSh7XG4gICAgICAgICAgICBwYXJtczogcGFybXMsXG4gICAgICAgICAgICBzdGFydFZhbHVlOiBzdGFydFZhbHVlXG4gICAgICAgICAgfSksXG4gICAgICAgICAgb25NeUZhaWx1cmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIE1rdEZvbGRlci5jdXJyTm9kZS5zZXRUZXh0KHN0YXJ0VmFsdWUpXG4gICAgICAgICAgfS5jcmVhdGVEZWxlZ2F0ZSh0aGlzKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIGhpZGVzIGFsbCBmb2xkZXJzIGluIHRoZSBkcm9wIGRvd24gbGlzdCB3aGVuIGltcG9ydGluZyBhIHByb2dyYW1cbiAqICBleGNlcHQgdGhlIHVzZXIncyBvd24gZm9sZGVyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5oaWRlRm9sZGVyc09uSW1wb3J0ID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBIaWRpbmc6IEZvbGRlcnMgT24gUHJvZ3JhbSBJbXBvcnQgdmlhIE92ZXJyaWRlJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0LmZvcm0uQ29tYm9Cb3gucHJvdG90eXBlLm9uVHJpZ2dlckNsaWNrJykgJiYgdXNlck5hbWUpIHtcbiAgICBFeHQuZm9ybS5Db21ib0JveC5wcm90b3R5cGUub25UcmlnZ2VyQ2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IEhpZGUgRm9sZGVycyBPbiBQcm9ncmFtIEltcG9ydCB2aWEgT3ZlcnJpZGUnKVxuICAgICAgaWYgKHRoaXMucmVhZE9ubHkgfHwgdGhpcy5kaXNhYmxlZCkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmlzRXhwYW5kZWQoKSkge1xuICAgICAgICB0aGlzLmNvbGxhcHNlKClcbiAgICAgICAgdGhpcy5lbC5mb2N1cygpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9uRm9jdXMoe30pXG4gICAgICAgIGlmICh0aGlzLnRyaWdnZXJBY3Rpb24gPT0gJ2FsbCcpIHtcbiAgICAgICAgICB0aGlzLmRvUXVlcnkodGhpcy5hbGxRdWVyeSwgdHJ1ZSlcblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiB0aGlzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgdGhpcyAmJlxuICAgICAgICAgICAgdGhpcy5sYWJlbCAmJlxuICAgICAgICAgICAgdGhpcy5sYWJlbC5kb20gJiZcbiAgICAgICAgICAgIHRoaXMubGFiZWwuZG9tLnRleHRDb250ZW50ID09ICdDYW1wYWlnbiBGb2xkZXI6JyAmJlxuICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RDYW52YXMuZ2V0QWN0aXZlVGFiJykgJiZcbiAgICAgICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSAmJlxuICAgICAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZyAmJlxuICAgICAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTFcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogSGlkZSBDYW1wYWlnbiBGb2xkZXJzIE9uIFByb2dyYW0gSW1wb3J0IHZpYSBPdmVycmlkZScpXG4gICAgICAgICAgICBsZXQgaWlcblxuICAgICAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgdGhpcy52aWV3LmFsbC5lbGVtZW50cy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMudmlldy5hbGwuZWxlbWVudHNbaWldLnRleHRDb250ZW50LnRvTG93ZXJDYXNlKCkgIT0gdXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXcuYWxsLmVsZW1lbnRzW2lpXS5oaWRkZW4gPSB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5kb1F1ZXJ5KHRoaXMuZ2V0UmF3VmFsdWUoKSlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsLmZvY3VzKClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBkaXNhYmxlcyB0aGUgRGVmYXVsdCBhbmQgTWFya2V0aW5nIFdvcmtzcGFjZXMgaG9tZSBidXR0b25zOlxuICogIE5ldyBQcm9ncmFtLCBOZXcgU21hcnQgQ2FtcGFpZ24sIGFuZCBOZXcgU21hcnQgTGlzdFxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuZGlzYWJsZUJ1dHRvbnMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogQnV0dG9ucycpXG4gICRqUSA9IGpRdWVyeS5ub0NvbmZsaWN0KClcbiAgaWYgKCRqUSAmJiAkalEoJy5ta3RCdXR0b25Qb3NpdGl2ZScpKSB7XG4gICAgJGpRKCcubWt0QnV0dG9uUG9zaXRpdmUnKS5yZW1vdmUoKVxuICB9XG59XG5cbkFQUC5kaXNhYmxlQ2hlY2tib3hlcyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBDaGVja2JveGVzJylcbiAgTWt0My5jb250cm9sbGVyLmFkbWluLm1lcmN1cnkuTWVyY3VyeUFkbWluLnByb3RvdHlwZS5nZXRFbmFibGVkUm9sZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IG1lID0gdGhpc1xuICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QoJy9tZXJjdXJ5L2dldE1lcmN1cnlFbmFibGVkUm9sZXMnLCB7XG4gICAgICBwYXJhbXM6IHt9LFxuICAgICAgb25NeVN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBtZS5lbmFibGVkUm9sZXMgPSBbXVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICAkalEgPSBqUXVlcnkubm9Db25mbGljdCgpXG4gIGlmICgkalEpIHtcbiAgICAkalEoJy54NC1mb3JtLWNoZWNrYm94JykuYXR0cignZGlzYWJsZWQnLCB0cnVlKVxuICB9XG59XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIGV2YWx1YXRlcyB0aGUgY3VycmVudCBub2RlIGNvbnRleHQgYmVpbmcgbW92ZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZVxuICogIGl0ZW0gc2hvdWxkIGJlIG1vdmVkXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5ldmFsdWF0ZU1vdmVJdGVtID0gZnVuY3Rpb24gKG5vZGVUb01vdmUsIGRlc3ROb2RlKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV2YWx1YXRpbmc6IE1vdmUgSXRlbScpXG4gIGxldCBta3RvQ2VudGVyT2ZFeGNlbGxlbmNlTW92YWJsZUV2ZW50Q29tcElkc01hdGNoID0gJ14oMTAwNXwxMDAzKSQnLFxuICAgIG1rdG9DZW50ZXJPZkV4Y2VsbGVuY2VFdmVudEZvbGRlckNvbXBJZHNNYXRjaCA9ICdeKDMyNzR8MzI3NSkkJyxcbiAgICBta3RvQXNzZXRNYW5hZ2VtZW50TW92YWJsZUV2ZW50Q29tcElkc01hdGNoID0gJ14oMTc2N3wxNzg1KSQnLFxuICAgIG1rdG9Bc3NldE1hbmFnZW1lbnRFdmVudEZvbGRlckNvbXBJZHNNYXRjaCA9ICdeKDMxNDR8MzE0NSkkJyxcbiAgICBta3RvSGVhbHRoY2FyZU1vdmFibGVFdmVudENvbXBJZHNNYXRjaCA9ICdeKDE2NzF8MTY5MSkkJyxcbiAgICBta3RvSGVhbHRoY2FyZUV2ZW50Rm9sZGVyQ29tcElkc01hdGNoID0gJ14oMjgyMXwyODIyKSQnLFxuICAgIG1rdG9IaWdoZXJFZHVjYXRpb25Nb3ZhYmxlRXZlbnRDb21wSWRzTWF0Y2ggPSAnXigxNjM1fDE2NTUpJCcsXG4gICAgbWt0b0hpZ2hlckVkdWNhdGlvbkV2ZW50Rm9sZGVyQ29tcElkc01hdGNoID0gJ14oMjcxOXwyNzIwKSQnLFxuICAgIG1rdG9NYW51ZmFjdHVyaW5nTW92YWJsZUV2ZW50Q29tcElkc01hdGNoID0gJ14oMTc5M3wxNzk0KSQnLFxuICAgIG1rdG9NYW51ZmFjdHVyaW5nRXZlbnRGb2xkZXJDb21wSWRzTWF0Y2ggPSAnXigzMTc5fDMxODApJCcsXG4gICAgbWt0b1Nwb3J0c01vdmFibGVFdmVudENvbXBJZHNNYXRjaCA9ICdeKDE3MDR8MTcyMykkJyxcbiAgICBta3RvU3BvcnRzRXZlbnRGb2xkZXJDb21wSWRzTWF0Y2ggPSAnXigyOTI4fDI5MjkpJCcsXG4gICAgbWt0b1RlY2hub2xvZ3lNb3ZhYmxlRXZlbnRDb21wSWRzTWF0Y2ggPSAnXigxMDcyfDEwNjEpJCcsXG4gICAgbWt0b1RlY2hub2xvZ3lFdmVudEZvbGRlckNvbXBJZHNNYXRjaCA9ICdeKDI1OTN8MjU5NCkkJyxcbiAgICBta3RvVHJhdmVsTW92YWJsZUV2ZW50Q29tcElkc01hdGNoID0gJ14oMTczNnwxNzU0KSQnLFxuICAgIG1rdG9UcmF2ZWxFdmVudEZvbGRlckNvbXBJZHNNYXRjaCA9ICdeKDMwNDV8MzA0NikkJ1xuXG4gIGlmICh1c2VyTmFtZSkge1xuICAgIGxldCBpaSwgY3Vyck5vZGUsIGRlcHRoXG5cbiAgICBpZiAoXG4gICAgICAobm9kZVRvTW92ZS5hdHRyaWJ1dGVzICYmXG4gICAgICAgIG5vZGVUb01vdmUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQgJiZcbiAgICAgICAgbm9kZVRvTW92ZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkgfHxcbiAgICAgIChkZXN0Tm9kZS5hdHRyaWJ1dGVzICYmXG4gICAgICAgIGRlc3ROb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkICYmXG4gICAgICAgIGRlc3ROb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKVxuICAgICkge1xuICAgICAgaWYgKG5vZGVUb01vdmUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEV2ZW50JyAmJiBkZXN0Tm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgKG5vZGVUb01vdmUuYXR0cmlidXRlcy5jb21wSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0NlbnRlck9mRXhjZWxsZW5jZU1vdmFibGVFdmVudENvbXBJZHNNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICAgIGRlc3ROb2RlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9DZW50ZXJPZkV4Y2VsbGVuY2VFdmVudEZvbGRlckNvbXBJZHNNYXRjaCkgIT0gLTEpIHx8XG4gICAgICAgICAgKG5vZGVUb01vdmUuYXR0cmlidXRlcy5jb21wSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0Fzc2V0TWFuYWdlbWVudE1vdmFibGVFdmVudENvbXBJZHNNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICAgIGRlc3ROb2RlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Bc3NldE1hbmFnZW1lbnRFdmVudEZvbGRlckNvbXBJZHNNYXRjaCkgIT0gLTEpIHx8XG4gICAgICAgICAgKG5vZGVUb01vdmUuYXR0cmlidXRlcy5jb21wSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0hlYWx0aGNhcmVNb3ZhYmxlRXZlbnRDb21wSWRzTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICBkZXN0Tm9kZS5hdHRyaWJ1dGVzLmNvbXBJZC50b1N0cmluZygpLnNlYXJjaChta3RvSGVhbHRoY2FyZUV2ZW50Rm9sZGVyQ29tcElkc01hdGNoKSAhPSAtMSkgfHxcbiAgICAgICAgICAobm9kZVRvTW92ZS5hdHRyaWJ1dGVzLmNvbXBJZC50b1N0cmluZygpLnNlYXJjaChta3RvSGlnaGVyRWR1Y2F0aW9uTW92YWJsZUV2ZW50Q29tcElkc01hdGNoKSAhPSAtMSAmJlxuICAgICAgICAgICAgZGVzdE5vZGUuYXR0cmlidXRlcy5jb21wSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0hpZ2hlckVkdWNhdGlvbkV2ZW50Rm9sZGVyQ29tcElkc01hdGNoKSAhPSAtMSkgfHxcbiAgICAgICAgICAobm9kZVRvTW92ZS5hdHRyaWJ1dGVzLmNvbXBJZC50b1N0cmluZygpLnNlYXJjaChta3RvTWFudWZhY3R1cmluZ01vdmFibGVFdmVudENvbXBJZHNNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICAgIGRlc3ROb2RlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NYW51ZmFjdHVyaW5nRXZlbnRGb2xkZXJDb21wSWRzTWF0Y2gpICE9IC0xKSB8fFxuICAgICAgICAgIChub2RlVG9Nb3ZlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9TcG9ydHNNb3ZhYmxlRXZlbnRDb21wSWRzTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICBkZXN0Tm9kZS5hdHRyaWJ1dGVzLmNvbXBJZC50b1N0cmluZygpLnNlYXJjaChta3RvU3BvcnRzRXZlbnRGb2xkZXJDb21wSWRzTWF0Y2gpICE9IC0xKSB8fFxuICAgICAgICAgIChub2RlVG9Nb3ZlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9UZWNobm9sb2d5TW92YWJsZUV2ZW50Q29tcElkc01hdGNoKSAhPSAtMSAmJlxuICAgICAgICAgICAgZGVzdE5vZGUuYXR0cmlidXRlcy5jb21wSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b1RlY2hub2xvZ3lFdmVudEZvbGRlckNvbXBJZHNNYXRjaCkgIT0gLTEpIHx8XG4gICAgICAgICAgKG5vZGVUb01vdmUuYXR0cmlidXRlcy5jb21wSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b1RyYXZlbE1vdmFibGVFdmVudENvbXBJZHNNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICAgIGRlc3ROb2RlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9UcmF2ZWxFdmVudEZvbGRlckNvbXBJZHNNYXRjaCkgIT0gLTEpXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICBub2RlVG9Nb3ZlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xICYmXG4gICAgICBkZXN0Tm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMVxuICAgICkge1xuICAgICAgY3Vyck5vZGUgPSBub2RlVG9Nb3ZlXG4gICAgICBkZXB0aCA9IGN1cnJOb2RlLmdldERlcHRoKClcbiAgICAgIGZvciAoaWkgPSAwOyBpaSA8IGRlcHRoOyBpaSsrKSB7XG4gICAgICAgIGlmIChjdXJyTm9kZS50ZXh0ID09IHVzZXJOYW1lKSB7XG4gICAgICAgICAgY3Vyck5vZGUgPSBkZXN0Tm9kZVxuICAgICAgICAgIGRlcHRoID0gY3Vyck5vZGUuZ2V0RGVwdGgoKVxuICAgICAgICAgIGZvciAoaWkgPSAwOyBpaSA8IGRlcHRoOyBpaSsrKSB7XG4gICAgICAgICAgICBpZiAoY3Vyck5vZGUudGV4dCA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3Vyck5vZGUgPSBjdXJyTm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUucGFyZW50Tm9kZVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSBlbHNlIGlmIChub2RlVG9Nb3ZlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xKSB7XG4gICAgICBjdXJyTm9kZSA9IG5vZGVUb01vdmVcbiAgICAgIGRlcHRoID0gY3Vyck5vZGUuZ2V0RGVwdGgoKVxuICAgICAgZm9yIChpaSA9IDA7IGlpIDwgZGVwdGg7IGlpKyspIHtcbiAgICAgICAgaWYgKGN1cnJOb2RlLnRleHQgPT0gdXNlck5hbWUpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUucGFyZW50Tm9kZVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSBlbHNlIGlmIChkZXN0Tm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgY3Vyck5vZGUgPSBkZXN0Tm9kZVxuICAgICAgZGVwdGggPSBjdXJyTm9kZS5nZXREZXB0aCgpXG4gICAgICBmb3IgKGlpID0gMDsgaWkgPCBkZXB0aDsgaWkrKykge1xuICAgICAgICBpZiAoY3Vyck5vZGUudGV4dCA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgY3Vyck5vZGUgPSBjdXJyTm9kZS5wYXJlbnROb2RlXG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBkaXNhYmxlcyBkcmFnZ2luZyBhbmQgZHJvcHBpbmcgdHJlZSBub2RlIGl0ZW1zIG90aGVyIHRoYW4gdGhvc2UgdGhhdFxuICogIG9yaWdpbmF0ZSBhbmQgYXJlIGRlc3RpbmVkIGZvciBhIGxvY2F0aW9uIHdpdGhpbiB0aGUgdXNlcidzIHJvb3QgZm9sZGVyXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5kaXNhYmxlRHJhZ0FuZERyb3AgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogVHJlZSBOb2RlIERyb3AnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdFeHQudHJlZS5UcmVlRHJvcFpvbmUucHJvdG90eXBlLnByb2Nlc3NEcm9wJykpIHtcbiAgICBFeHQudHJlZS5UcmVlRHJvcFpvbmUucHJvdG90eXBlLnByb2Nlc3NEcm9wID0gZnVuY3Rpb24gKHRhcmdldCwgZGF0YSwgcG9pbnQsIGRkLCBlLCBkcm9wTm9kZSkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBUcmVlIE5vZGUgRHJvcCcpXG4gICAgICBpZiAoQVBQLmV2YWx1YXRlTW92ZUl0ZW0oZHJvcE5vZGUsIHRhcmdldCkpIHtcbiAgICAgICAgbGV0IGRyb3BFdmVudCA9IHtcbiAgICAgICAgICAgIHRyZWU6IHRoaXMudHJlZSxcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIHBvaW50OiBwb2ludCxcbiAgICAgICAgICAgIHNvdXJjZTogZGQsXG4gICAgICAgICAgICByYXdFdmVudDogZSxcbiAgICAgICAgICAgIGRyb3BOb2RlOiBkcm9wTm9kZSxcbiAgICAgICAgICAgIGNhbmNlbDogIWRyb3BOb2RlLFxuICAgICAgICAgICAgZHJvcFN0YXR1czogZmFsc2VcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJldHZhbCA9IHRoaXMudHJlZS5maXJlRXZlbnQoJ2JlZm9yZW5vZGVkcm9wJywgZHJvcEV2ZW50KVxuICAgICAgICBpZiAocmV0dmFsID09PSBmYWxzZSB8fCBkcm9wRXZlbnQuY2FuY2VsID09PSB0cnVlIHx8ICFkcm9wRXZlbnQuZHJvcE5vZGUpIHtcbiAgICAgICAgICB0YXJnZXQudWkuZW5kRHJvcCgpXG4gICAgICAgICAgcmV0dXJuIGRyb3BFdmVudC5kcm9wU3RhdHVzXG4gICAgICAgIH1cblxuICAgICAgICB0YXJnZXQgPSBkcm9wRXZlbnQudGFyZ2V0XG4gICAgICAgIGlmIChwb2ludCA9PSAnYXBwZW5kJyAmJiAhdGFyZ2V0LmlzRXhwYW5kZWQoKSkge1xuICAgICAgICAgIHRhcmdldC5leHBhbmQoXG4gICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHRoaXMuY29tcGxldGVEcm9wKGRyb3BFdmVudClcbiAgICAgICAgICAgIH0uY3JlYXRlRGVsZWdhdGUodGhpcylcbiAgICAgICAgICApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb21wbGV0ZURyb3AoZHJvcEV2ZW50KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBldmFsdWF0ZXMgdGhlIGN1cnJlbnQgbWVudSBjb250ZXh0IHRvIGRldGVybWluZSBpZiBpdGVtcyBzaG91bGQgYmVcbiAqICBkaXNhYmxlZFxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuZXZhbHVhdGVNZW51ID0gZnVuY3Rpb24gKHRyaWdnZXJlZEZyb20sIG1lbnUsIGNhbnZhcywgdG9vbGJhcikge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFdmFsdWF0aW5nOiBNZW51JylcbiAgaWYgKHVzZXJOYW1lKSB7XG4gICAgbGV0IHRvQmVEaXNhYmxlZCA9IGZhbHNlXG5cbiAgICBzd2l0Y2ggKHRyaWdnZXJlZEZyb20pIHtcbiAgICAgIGNhc2UgJ3RyZWUnOlxuICAgICAgICBpZiAoXG4gICAgICAgICAgbWVudSAmJlxuICAgICAgICAgIG1lbnUuY3Vyck5vZGUgJiZcbiAgICAgICAgICBtZW51LmN1cnJOb2RlLmF0dHJpYnV0ZXMgJiZcbiAgICAgICAgICBtZW51LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkICYmXG4gICAgICAgICAgKG1lbnUuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEgfHxcbiAgICAgICAgICAgIG1lbnUuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEpXG4gICAgICAgICkge1xuICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IHRydWVcblxuICAgICAgICAgIGlmIChtZW51LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgICBsZXQgaWksXG4gICAgICAgICAgICAgIHtjdXJyTm9kZX0gPSBtZW51LFxuICAgICAgICAgICAgICBkZXB0aCA9IGN1cnJOb2RlLmdldERlcHRoKClcblxuICAgICAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgZGVwdGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgaWYgKGN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjdXJyTm9kZSA9IGN1cnJOb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgKCFtZW51IHx8ICFtZW51LmN1cnJOb2RlIHx8ICFtZW51LmN1cnJOb2RlLmF0dHJpYnV0ZXMgfHwgIW1lbnUuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQpICYmXG4gICAgICAgICAgY2FudmFzICYmXG4gICAgICAgICAgY2FudmFzLmNvbmZpZyAmJlxuICAgICAgICAgIGNhbnZhcy5jb25maWcuYWNjZXNzWm9uZUlkICYmXG4gICAgICAgICAgKGNhbnZhcy5jb25maWcuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xIHx8XG4gICAgICAgICAgICAoY2FudmFzLmNvbmZpZy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICAgICAgKChjYW52YXMuY29uZmlnLmV4cE5vZGVJZCAmJiBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChjYW52YXMuY29uZmlnLmV4cE5vZGVJZCkpIHx8XG4gICAgICAgICAgICAgICAgKGNhbnZhcy5jb25maWcuZGxab25lRm9sZGVySWQgJiYgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2FudmFzLmNvbmZpZy5kbFpvbmVGb2xkZXJJZCkpKSkpXG4gICAgICAgICkge1xuICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IHRydWVcblxuICAgICAgICAgIGlmIChjYW52YXMuY29uZmlnLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgbGV0IGlpLCBjdXJyTm9kZSwgZGVwdGhcblxuICAgICAgICAgICAgaWYgKGNhbnZhcy5jb25maWcuZXhwTm9kZUlkKSB7XG4gICAgICAgICAgICAgIGN1cnJOb2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2FudmFzLmNvbmZpZy5leHBOb2RlSWQpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjdXJyTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKGNhbnZhcy5jb25maWcuZGxab25lRm9sZGVySWQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZXB0aCA9IGN1cnJOb2RlLmdldERlcHRoKClcblxuICAgICAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgZGVwdGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgaWYgKGN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjdXJyTm9kZSA9IGN1cnJOb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgKCFtZW51IHx8ICFtZW51LmN1cnJOb2RlIHx8ICFtZW51LmN1cnJOb2RlLmF0dHJpYnV0ZXMgfHwgIW1lbnUuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQpICYmXG4gICAgICAgICAgY2FudmFzICYmXG4gICAgICAgICAgY2FudmFzLmNvbmZpZyAmJlxuICAgICAgICAgICFjYW52YXMuY29uZmlnLmFjY2Vzc1pvbmVJZFxuICAgICAgICApIHtcbiAgICAgICAgICB0b0JlRGlzYWJsZWQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvQmVEaXNhYmxlZFxuXG4gICAgICBjYXNlICdidXR0b24nOlxuICAgICAgICBpZiAoXG4gICAgICAgICAgY2FudmFzICYmXG4gICAgICAgICAgY2FudmFzLmNvbmZpZyAmJlxuICAgICAgICAgIGNhbnZhcy5jb25maWcuYWNjZXNzWm9uZUlkICYmXG4gICAgICAgICAgKGNhbnZhcy5jb25maWcuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xIHx8XG4gICAgICAgICAgICAoY2FudmFzLmNvbmZpZy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICAgICAgKChjYW52YXMuY29uZmlnLmV4cE5vZGVJZCAmJiBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChjYW52YXMuY29uZmlnLmV4cE5vZGVJZCkpIHx8XG4gICAgICAgICAgICAgICAgKGNhbnZhcy5jb25maWcuZGxab25lRm9sZGVySWQgJiYgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2FudmFzLmNvbmZpZy5kbFpvbmVGb2xkZXJJZCkpKSkpXG4gICAgICAgICkge1xuICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IHRydWVcblxuICAgICAgICAgIGlmIChjYW52YXMuY29uZmlnLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgdmFyIGN1cnJOb2RlLCBkZXB0aFxuXG4gICAgICAgICAgICBpZiAoY2FudmFzLmNvbmZpZy5leHBOb2RlSWQpIHtcbiAgICAgICAgICAgICAgY3Vyck5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChjYW52YXMuY29uZmlnLmV4cE5vZGVJZClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGN1cnJOb2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2FudmFzLmNvbmZpZy5kbFpvbmVGb2xkZXJJZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlcHRoID0gY3Vyck5vZGUuZ2V0RGVwdGgoKVxuXG4gICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgZGVwdGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgaWYgKGN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjdXJyTm9kZSA9IGN1cnJOb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoKCFjYW52YXMgfHwgIWNhbnZhcy5jb25maWcgfHwgIWNhbnZhcy5jb25maWcuYWNjZXNzWm9uZUlkKSAmJiBNa3RNYWluTmF2ICYmIE1rdE1haW5OYXYuYWN0aXZlTmF2ID09ICd0bkN1c3RBZG1pbicpIHtcbiAgICAgICAgICB0b0JlRGlzYWJsZWQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvQmVEaXNhYmxlZFxuXG4gICAgICBjYXNlICdzb2NpYWxBcHBUb29sYmFyJzpcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0b29sYmFyLmdldFNvY2lhbEFwcCgpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNvY2lhbEFwcCgpLmdldCgnem9uZUlkJykgJiZcbiAgICAgICAgICAgIHRvb2xiYXIuZ2V0U29jaWFsQXBwKCkuZ2V0KCd6b25lSWQnKS50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkgfHxcbiAgICAgICAgICAodG9vbGJhci5nZXRTb2NpYWxBcHAoKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNvY2lhbEFwcCgpLmdldE5vZGVKc29uKCkgJiZcbiAgICAgICAgICAgIHRvb2xiYXIuZ2V0U29jaWFsQXBwKCkuZ2V0Tm9kZUpzb24oKS5pZCAmJlxuICAgICAgICAgICAgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQodG9vbGJhci5nZXRTb2NpYWxBcHAoKS5nZXROb2RlSnNvbigpLmlkKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdG9CZURpc2FibGVkID0gdHJ1ZVxuXG4gICAgICAgICAgaWYgKHRvb2xiYXIuZ2V0U29jaWFsQXBwKCkuZ2V0KCd6b25lSWQnKS50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgbGV0IGlpLFxuICAgICAgICAgICAgICBjdXJyTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKHRvb2xiYXIuZ2V0U29jaWFsQXBwKCkuZ2V0Tm9kZUpzb24oKS5pZCksXG4gICAgICAgICAgICAgIGRlcHRoID0gY3Vyck5vZGUuZ2V0RGVwdGgoKVxuXG4gICAgICAgICAgICBmb3IgKGlpID0gMDsgaWkgPCBkZXB0aDsgaWkrKykge1xuICAgICAgICAgICAgICBpZiAoY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0ID09IHVzZXJOYW1lKSB7XG4gICAgICAgICAgICAgICAgdG9CZURpc2FibGVkID0gZmFsc2VcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG9CZURpc2FibGVkXG5cbiAgICAgIGNhc2UgJ21vYmlsZVB1c2hOb3RpZmljYXRpb24nOlxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRvb2xiYXIuZ2V0TW9iaWxlUHVzaE5vdGlmaWNhdGlvbigpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXQoJ3pvbmVJZCcpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB8fFxuICAgICAgICAgICh0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXROb2RlSnNvbigpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXROb2RlSnNvbigpLmlkICYmXG4gICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZCh0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXROb2RlSnNvbigpLmlkKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdG9CZURpc2FibGVkID0gdHJ1ZVxuXG4gICAgICAgICAgaWYgKHRvb2xiYXIuZ2V0TW9iaWxlUHVzaE5vdGlmaWNhdGlvbigpLmdldCgnem9uZUlkJykudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGxldCBpaSxcbiAgICAgICAgICAgICAgY3Vyck5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZCh0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXROb2RlSnNvbigpLmlkKSxcbiAgICAgICAgICAgICAgZGVwdGggPSBjdXJyTm9kZS5nZXREZXB0aCgpXG5cbiAgICAgICAgICAgIGZvciAoaWkgPSAwOyBpaSA8IGRlcHRoOyBpaSsrKSB7XG4gICAgICAgICAgICAgIGlmIChjdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQgPT0gdXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICB0b0JlRGlzYWJsZWQgPSBmYWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY3Vyck5vZGUgPSBjdXJyTm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b0JlRGlzYWJsZWRcblxuICAgICAgY2FzZSAnaW5BcHBNZXNzYWdlJzpcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0b29sYmFyLmdldEluQXBwTWVzc2FnZSgpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldEluQXBwTWVzc2FnZSgpLmdldCgnem9uZUlkJykgJiZcbiAgICAgICAgICAgIHRvb2xiYXIuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0KCd6b25lSWQnKS50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkgfHxcbiAgICAgICAgICAodG9vbGJhci5nZXRJbkFwcE1lc3NhZ2UoKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldEluQXBwTWVzc2FnZSgpLmdldE5vZGVKc29uKCkgJiZcbiAgICAgICAgICAgIHRvb2xiYXIuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0Tm9kZUpzb24oKS5pZCAmJlxuICAgICAgICAgICAgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQodG9vbGJhci5nZXRJbkFwcE1lc3NhZ2UoKS5nZXROb2RlSnNvbigpLmlkKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdG9CZURpc2FibGVkID0gdHJ1ZVxuXG4gICAgICAgICAgaWYgKHRvb2xiYXIuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0KCd6b25lSWQnKS50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgbGV0IGlpLFxuICAgICAgICAgICAgICBjdXJyTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKHRvb2xiYXIuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0Tm9kZUpzb24oKS5pZCksXG4gICAgICAgICAgICAgIGRlcHRoID0gY3Vyck5vZGUuZ2V0RGVwdGgoKVxuXG4gICAgICAgICAgICBmb3IgKGlpID0gMDsgaWkgPCBkZXB0aDsgaWkrKykge1xuICAgICAgICAgICAgICBpZiAoY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0ID09IHVzZXJOYW1lKSB7XG4gICAgICAgICAgICAgICAgdG9CZURpc2FibGVkID0gZmFsc2VcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG9CZURpc2FibGVkXG5cbiAgICAgIGNhc2UgJ3Ntc01lc3NhZ2UnOlxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRvb2xiYXIuZ2V0U21zTWVzc2FnZSgpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXQoJ3pvbmVJZCcpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB8fFxuICAgICAgICAgICh0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXROb2RlSnNvbigpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXROb2RlSnNvbigpLmlkICYmXG4gICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZCh0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXROb2RlSnNvbigpLmlkKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdG9CZURpc2FibGVkID0gdHJ1ZVxuXG4gICAgICAgICAgaWYgKHRvb2xiYXIuZ2V0U21zTWVzc2FnZSgpLmdldCgnem9uZUlkJykudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGxldCBpaSxcbiAgICAgICAgICAgICAgY3Vyck5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZCh0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXROb2RlSnNvbigpLmlkKSxcbiAgICAgICAgICAgICAgZGVwdGggPSBjdXJyTm9kZS5nZXREZXB0aCgpXG5cbiAgICAgICAgICAgIGZvciAoaWkgPSAwOyBpaSA8IGRlcHRoOyBpaSsrKSB7XG4gICAgICAgICAgICAgIGlmIChjdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQgPT0gdXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICB0b0JlRGlzYWJsZWQgPSBmYWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY3Vyck5vZGUgPSBjdXJyTm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b0JlRGlzYWJsZWRcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbn1cblxuQVBQLmRpc2FibGVBY2NvdW50QUkgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogQWNjb3VudCBBSScpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuY29udHJvbGxlci5hYm0uaWNwTW9kZWxpbmcuRGVsZXRlTW9kZWxGb3JtLnByb3RvdHlwZS5vblN1Ym1pdCcpKSB7XG4gICAgTWt0My5jb250cm9sbGVyLmFibS5pY3BNb2RlbGluZy5EZWxldGVNb2RlbEZvcm0ucHJvdG90eXBlLm9uU3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ2hpamFja2VkIG9uRGVsZXRlTW9kZWxDbGljayBjbGljaycpXG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIuYWJtLmljcE1vZGVsaW5nLlR1bmVNb2RlbEZvcm0ucHJvdG90eXBlLm9uU3VibWl0JykpIHtcbiAgICBNa3QzLmNvbnRyb2xsZXIuYWJtLmljcE1vZGVsaW5nLlR1bmVNb2RlbEZvcm0ucHJvdG90eXBlLm9uU3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ2hpamFja2VkIG9uU3VibWl0IGNsaWNrJylcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5jb250cm9sbGVyLmFibS5pY3BNb2RlbGluZy5VcGRhdGVBY2NvdW50c0Zvcm0ucHJvdG90eXBlLm9uU3VibWl0JykpIHtcbiAgICBNa3QzLmNvbnRyb2xsZXIuYWJtLmljcE1vZGVsaW5nLlVwZGF0ZUFjY291bnRzRm9ybS5wcm90b3R5cGUub25TdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnaGlqYWNrZWQgb25CZWZvcmVQdXNoRGF0YSBjbGljaycpXG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxufVxuXG4vLyBmb3IgYWxsIGFzc2V0IHR5cGVzIGZvciBhbGwgQWN0aW9ucyBCdXR0b25zIGFuZCBSaWdodC1jbGljayBUcmVlIG1lbnVzIGluIGFsbCBhcmVhcy5cbkFQUC5kaXNhYmxlTWVudXMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogTWVudXMnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdFeHQubWVudS5NZW51LnByb3RvdHlwZS5zaG93QXQnKSkge1xuICAgIC8vIERpc2FibGUgQUxMIGFyZWFzID4gQUxMIGFzc2V0cyA+IEFMTCBBY3Rpb25zIGFuZCBSaWdodC1jbGljayBtZW51cyBleGNlcHQgU29jaWFsIEFwcCwgUHVzaCBOb3RpZmljYXRpb24sIGFuZCBJbi1BcHAgTWVzc2FnZSBBY3Rpb25zIEJ1dHRvbnNcbiAgICBFeHQubWVudS5NZW51LnByb3RvdHlwZS5zaG93QXQgPSBmdW5jdGlvbiAoeHksIHBhcmVudE1lbnUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBBY3Rpb25zIGFuZCBSaWdodC1jbGljayBtZW51cyBmb3IgQUxMIGluIEFMTCcpXG4gICAgICBpZiAodGhpcy5maXJlRXZlbnQoJ2JlZm9yZXNob3cnLCB0aGlzKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgbGV0IGRpc2FibGUsXG4gICAgICAgICAgbWVudSA9IHRoaXMsXG4gICAgICAgICAgbUl0ZW1zID0gdGhpcy5pdGVtcyxcbiAgICAgICAgICBjYW52YXMgPSBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCksXG4gICAgICAgICAgaXRlbXNUb0Rpc2FibGUgPSBbXG4gICAgICAgICAgICAvLyBHbG9iYWwgPiBGb3JtID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnZm9ybUFwcHJvdmUnLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICdmb3JtQ2xvbmUnLCAvL0Nsb25lIEZvcm1cbiAgICAgICAgICAgICdmb3JtRGVsZXRlJywgLy9EZWxldGUgRm9ybVxuICAgICAgICAgICAgJ2Zvcm1Nb3ZlJywgLy9Nb3ZlXG4gICAgICAgICAgICAnZm9ybURyYWZ0QXBwcm92ZScsIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICAgICAgLy8gR2xvYmFsID4gTGFuZGluZyBQYWdlID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAncGFnZUFwcHJvdmUnLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICdwYWdlVW5hcHByb3ZlJywgLy9VbmFwcHJvdmVcbiAgICAgICAgICAgICdwYWdlQ29udmVydFRvVGVzdEdyb3VwJywgLy9Db252ZXJ0IHRvIFRlc3QgR3JvdXBcbiAgICAgICAgICAgICdwYWdlQ2xvbmUnLCAvL0Nsb25lXG4gICAgICAgICAgICAncGFnZURlbGV0ZScsIC8vRGVsZXRlXG4gICAgICAgICAgICAncGFnZU1vdmUnLCAvL01vdmVcbiAgICAgICAgICAgICdwYWdlRHJhZnRBcHByb3ZlJywgLy9BcHByb3ZlIERyYWZ0XG4gICAgICAgICAgICAvLyBHbG9iYWwgPiBFbWFpbCA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ2VtYWlsQXBwcm92ZScsIC8vQXBwcm92ZVxuICAgICAgICAgICAgJ2VtYWlsVW5hcHByb3ZlJywgLy9VbmFwcHJvdmVcbiAgICAgICAgICAgICdlbWFpbENsb25lJywgLy9DbG9uZVxuICAgICAgICAgICAgJ2VtYWlsRGVsZXRlJywgLy9EZWxldGVcbiAgICAgICAgICAgICdlbWFpbE1vdmUnLCAvL01vdmVcbiAgICAgICAgICAgICdlbWFpbE5ld1Rlc3QnLCAvL05ldyBUZXN0XG4gICAgICAgICAgICAnZW1haWxEcmFmdEFwcHJvdmUnLCAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgICAgICdlbWFpbEFwcHJvdmVUZXN0JywgLy9BcHByb3ZlIFRlc3RcbiAgICAgICAgICAgIC8vIEdsb2JhbCA+IFNtYXJ0IExpc3QsIExpc3QsIFNlZ21lbnQgPiBBY3Rpb25zIEJ1dHRvbiAmIFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdpbXBvcnRMaXN0JywgLy9JbXBvcnQgTGlzdFxuICAgICAgICAgICAgJ2Nsb25lU21hcnRsaXN0JywgLy9DbG9uZSBTbWFydCBMaXN0XG4gICAgICAgICAgICAnY2xvbmVMaXN0JywgLy9DbG9uZSBMaXN0XG4gICAgICAgICAgICAnZGVsZXRlTGlzdCcsIC8vRGVsZXRlIExpc3RcbiAgICAgICAgICAgICdzaG93U3VwcG9ydEhpc3RvcnknLCAvL1N1cHBvcnQgVG9vbHMgLSBIaXN0b3J5XG4gICAgICAgICAgICAnc2hvd1N1cHBvcnRVc2FnZVBlcmYnLCAvL1N1cHBvcnQgVG9vbHMgLSBSdW4gU3RhdHNcbiAgICAgICAgICAgICdzaG93U21hcnRMaXN0UHJvY2Vzc29yRGlhZycsIC8vUHJvY2Vzc29yIERpYWdub3N0aWNzXG4gICAgICAgICAgICAnc2hvd1NtYXJ0TGlzdFByb2Nlc3Nvck92ZXJyaWRlJywgLy9PdmVycmlkZSBQcm9jZXNzb3JcbiAgICAgICAgICAgIC8vIEdsb2JhbCA+IFJlcG9ydCA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgICAnY2xvbmVSZXBvcnRfYXR4Q2FudmFzT3ZlcnZpZXcnLCAvL0Nsb25lIFJlcG9ydFxuICAgICAgICAgICAgJ2RlbGV0ZVJlcG9ydCcsIC8vRGVsZXRlIFJlcG9ydFxuICAgICAgICAgICAgLy8gR2xvYmFsID4gUmVwb3J0ID4gUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ2Nsb25lUmVwb3J0JywgLy9DbG9uZSBSZXBvcnRcbiAgICAgICAgICAgICdkZWxldGVSZXBvcnQnLCAvL0RlbGV0ZSBSZXBvcnRcbiAgICAgICAgICAgICdtb3ZlUmVwb3J0JywgLy9Nb3ZlIFJlcG9ydFxuICAgICAgICAgICAgLy8gR2xvYmFsID4gTGVhZCA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ2JsYWNrQ2F0RGlhZycsIC8vQmxhY2tDYXQgRGlhZ25vc3RpY3NcbiAgICAgICAgICAgICdtZXJnZUxlYWRzJywgLy9NZXJnZSBMZWFkc1xuICAgICAgICAgICAgJ3NlbmRFbWFpbCcsIC8vU2VuZCBFbWFpbC4uLlxuICAgICAgICAgICAgJ3NlbmRQdXNoTm90aWZpY2F0aW9uJywgLy9TZW5kIFB1c2ggTm90aWZpY2F0aW9uLi4uXG4gICAgICAgICAgICAnc3Vic2NyaWJlVG9WaWJlc0xpc3QnLCAvL1N1YnNjcmliZSB0byBWaWJlcyBMaXN0Li4uXG4gICAgICAgICAgICAnc2VuZFNNUycsIC8vU2VuZCBTTVMuLi5cbiAgICAgICAgICAgICd1bnN1YnNjcmliZUZyb21WaWJlc0xpc3QnLCAvL1Vuc3Vic2NyaWJlIGZyb20gVmliZXMgTGlzdC4uLlxuICAgICAgICAgICAgJ2FkZFRvTGlzdCcsIC8vQWRkIHRvIExpc3QuLi5cbiAgICAgICAgICAgICdyZW1vdmVGcm9tTGlzdCcsIC8vUmVtb3ZlIGZyb20gTGlzdC4uLlxuICAgICAgICAgICAgJ2ludGVyZXN0aW5nTW9tZW50JywgLy9JbnRlcmVzdGluZyBNb21lbnQuLi5cbiAgICAgICAgICAgICdzZW5kQWxlcnQnLCAvL1NlbmQgQWxlcnQuLi5cbiAgICAgICAgICAgICdjaGFuZ2VTY29yZScsIC8vQ2hhbmdlIFNjb3JlLi4uXG4gICAgICAgICAgICAnY2hhbmdlRGF0YVZhbHVlJywgLy9DaGFuZ2UgRGF0YSBWYWx1ZS4uLlxuICAgICAgICAgICAgJ2FkZFRvTmFtZWRBY2NvdW50JywgLy9BZGQgdG8gTmFtZWQgQWNjb3VudC4uLlxuICAgICAgICAgICAgJ3JlbW92ZUZyb21OYW1lZEFjY291bnQnLCAvL1JlbW92ZSBmcm9tIE5hbWVkIEFjY291bnQuLi5cbiAgICAgICAgICAgICdjaGFuZ2VTdGF0dXNJblByb2dyZXNzaW9uJywgLy9DaGFuZ2UgUHJvZ3JhbSBTdGF0dXMuLi5cbiAgICAgICAgICAgICdhZGRUb051cnR1cmUnLCAvL0FkZCB0byBFbmdhZ2VtZW50IFByb2dyYW0uLi5cbiAgICAgICAgICAgICdjaGFuZ2VOdXJ0dXJlQ2FkZW5jZScsIC8vQ2hhbmdlIEVuZ2FnZW1lbnQgUHJvZ3JhbSBDYWRlbmNlLi4uXG4gICAgICAgICAgICAnY2hhbmdlTnVydHVyZVRyYWNrJywgLy9DaGFuZ2UgRW5nYWdlbWVudCBQcm9ncmFtIFN0cmVhbS4uLlxuICAgICAgICAgICAgJ2NoYW5nZUxlYWRQYXJ0aXRpb24nLCAvL0NoYW5nZSBMZWFkIFBhcnRpdGlvbi4uLlxuICAgICAgICAgICAgJ2NoYW5nZVJldmVudWVTdGFnZScsIC8vQ2hhbmdlIFJldmVudWUgU3RhZ2UuLi5cbiAgICAgICAgICAgICdkZWxldGVMZWFkJywgLy9EZWxldGUgTGVhZC4uLlxuICAgICAgICAgICAgJ2dpdmVDcmVkaXRUb1JlZmVycmVyJywgLy9HaXZlIENyZWRpdCB0byBSZWZlcnJlclxuICAgICAgICAgICAgJ3JlcXVlc3RDYW1wYWlnbicsIC8vUmVxdWVzdCBDYW1wYWlnbi4uLlxuICAgICAgICAgICAgJ3JlbW92ZUZyb21GbG93JywgLy9SZW1vdmUgZnJvbSBGbG93Li4uXG4gICAgICAgICAgICAncHVzaExlYWRUb1NGREMnLCAvL1N5bmMgTGVhZCB0byBTRkRDLi4uXG4gICAgICAgICAgICAnY3JlYXRlVGFzaycsIC8vQ3JlYXRlIFRhc2suLi5cbiAgICAgICAgICAgICdjb252ZXJ0TGVhZCcsIC8vQ29udmVydCBMZWFkLi4uXG4gICAgICAgICAgICAnY2hhbmdlT3duZXInLCAvL0NoYW5nZSBPd25lci4uLlxuICAgICAgICAgICAgJ2RlbGV0ZUxlYWRGcm9tU0ZEQycsIC8vRGVsZXRlIExlYWQgZnJvbSBTRkRDLi4uXG4gICAgICAgICAgICAnYWRkVG9TRkRDQ2FtcGFpZ24nLCAvL0FkZCB0byBTRkRDIENhbXBhaWduLi4uXG4gICAgICAgICAgICAnY2hhbmdlU3RhdHVzSW5TRkRDQ2FtcGFpZ24nLCAvL0NoYW5nZSBTdGF0dXMgaW4gU0ZEQyBDYW1wYWlnbi4uLlxuICAgICAgICAgICAgJ3JlbW92ZUZyb21TRkRDQ2FtcGFpZ24nLCAvL1JlbW92ZSBmcm9tIFNGREMgQ2FtcGFpZ24uLi5cbiAgICAgICAgICAgICdzeW5jTGVhZFRvTWljcm9zb2Z0JywgLy9TeW5jIExlYWQgdG8gTWljcm9zb2Z0XG4gICAgICAgICAgICAvLyBHbG9iYWwgPiBQcm9ncmFtcywgQW5hbHl6ZXJzLCBhbmQgUmVwb3J0cyA+IFNldHVwIFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdkZWxldGVJdGVtJywgLy9EZWxldGVcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzID4gTmV3IEJ1dHRvblxuICAgICAgICAgICAgJ2NyZWF0ZVByb2dyYW1Gb2xkZXInLCAvL05ldyBDYW1wYWlnbiBGb2xkZXJcbiAgICAgICAgICAgICduZXdTbWFydENhbXBhaWduJywgLy9OZXcgU21hcnQgQ2FtcGFpZ25cbiAgICAgICAgICAgICdjcmVhdGVOZXdNYXJrZXRpbmdQcm9ncmFtJywgLy9OZXcgUHJvZ3JhbVxuICAgICAgICAgICAgJ2ltcG9ydFByb2dyYW0nLCAvL0ltcG9ydCBQcm9ncmFtXG4gICAgICAgICAgICAvLyBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IERlZmF1bHQgJiBFbWFpbCBTZW5kIFByb2dyYW1zID4gQWN0aW9ucyBCdXR0b25cbiAgICAgICAgICAgICdlbnRyeVJlc2NoZWR1bGVFbnRyaWVzJywgLy9SZXNjaGVkdWxlIEVudHJpZXNcbiAgICAgICAgICAgICdzZmRjQ2FtcGFpZ25TeW5jJywgLy9TYWxlc2ZvcmNlIENhbXBhaWduIFN5bmNcbiAgICAgICAgICAgICdjbG9uZU1hcmtldGluZ1Byb2dyYW0nLCAvL0Nsb25lXG4gICAgICAgICAgICAnZGVsZXRlTWFya2V0aW5nUHJvZ3JhbScsIC8vRGVsZXRlXG4gICAgICAgICAgICAvLyBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IEV2ZW50IFByb2dyYW0gPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICAgJ2V2ZW50U2NoZWR1bGUnLCAvL1NjaGVkdWxlXG4gICAgICAgICAgICAnZW50cnlSZXNjaGVkdWxlRW50cmllcycsIC8vUmVzY2hlZHVsZSBFbnRyaWVzXG4gICAgICAgICAgICAnd2ViaW5hclNldHRpbmdzJywgLy9FdmVudCBTZXR0aW5nc1xuICAgICAgICAgICAgJ3NmZGNDYW1wYWlnblN5bmMnLCAvL1NhbGVzZm9yY2UgQ2FtcGFpZ24gU3luY1xuICAgICAgICAgICAgJ2Nsb25lTWFya2V0aW5nRXZlbnQnLCAvL0Nsb25lXG4gICAgICAgICAgICAnZGVsZXRlTWFya2V0aW5nRXZlbnQnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ3JlZnJlc2hGcm9tV2ViaW5hclByb3ZpZGVyJywgLy9SZWZyZXNoIGZyb20gV2ViaW5hciBQcm92aWRlclxuICAgICAgICAgICAgLy8gTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBOdXJ0dXJpbmcgUHJvZ3JhbSA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgICAnc2ZkY0NhbXBhaWduU3luYycsIC8vU2FsZXNmb3JjZSBDYW1wYWlnbiBTeW5jXG4gICAgICAgICAgICAnY2xvbmVOdXJ0dXJlUHJvZ3JhbScsIC8vQ2xvbmVcbiAgICAgICAgICAgICdkZWxldGVOdXJ0dXJlUHJvZ3JhbScsIC8vRGVsZXRlXG4gICAgICAgICAgICAndGVzdE51cnR1cmVQcm9ncmFtJywgLy9UZXN0IFN0cmVhbVxuICAgICAgICAgICAgLy8gTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBTbWFydCBDYW1wYWlnbiA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgICAvLyBEZWZhdWx0LCBFbWFpbCBTZW5kLCBFdmVudCwgYW5kIE51cnR1cmluZyBQcm9ncmFtczsgU21hcnQgQ2FtcGFpZ24sIEZvbGRlciA+IFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICduZXdTbWFydENhbXBhaWduJywgLy9OZXcgU21hcnQgQ2FtcGFpZ25cbiAgICAgICAgICAgICdjcmVhdGVOZXdNYXJrZXRpbmdQcm9ncmFtJywgLy9OZXcgUHJvZ3JhbVxuICAgICAgICAgICAgJ25ld0xvY2FsQXNzZXQnLCAvL05ldyBMb2NhbCBBc3NldFxuICAgICAgICAgICAgJ2NyZWF0ZVByb2dyYW1Gb2xkZXInLCAvL05ldyBDYW1wYWlnbiBGb2xkZXJcbiAgICAgICAgICAgICdyZW5hbWVQcm9ncmFtRm9sZGVyJywgLy9SZW5hbWUgRm9sZGVyXG4gICAgICAgICAgICAnZGVsZXRlUHJvZ3JhbUZvbGRlcicsIC8vRGVsZXRlIEZvbGRlclxuICAgICAgICAgICAgJ2NvbnZlcnRUb0FyY2hpdmVGb2xkZXInLCAvL0NvbnZlcnQgVG8gQXJjaGl2ZSBGb2xkZXJcbiAgICAgICAgICAgICdjb252ZXJ0VG9DYW1wYWlnbkZvbGRlcicsIC8vQ29udmVydCBUbyBDYW1wYWlnbiBGb2xkZXJcbiAgICAgICAgICAgICdzY0Nsb25lJywgLy9DbG9uZVxuICAgICAgICAgICAgJ3NjQXJjaGl2ZScsIC8vRGVsZXRlXG4gICAgICAgICAgICAnc2NNb3ZlJywgLy9Nb3ZlXG4gICAgICAgICAgICAnY2xvbmVNYXJrZXRpbmdQcm9ncmFtJywgLy9DbG9uZVxuICAgICAgICAgICAgJ2RlbGV0ZU1hcmtldGluZ1Byb2dyYW0nLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ2Nsb25lTWFya2V0aW5nRXZlbnQnLCAvL0Nsb25lXG4gICAgICAgICAgICAnZGVsZXRlTWFya2V0aW5nRXZlbnQnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ2Nsb25lTnVydHVyZVByb2dyYW0nLCAvL0Nsb25lXG4gICAgICAgICAgICAnZGVsZXRlTnVydHVyZVByb2dyYW0nLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ2Nsb25lRW1haWxCYXRjaFByb2dyYW0nLCAvL0Nsb25lXG4gICAgICAgICAgICAnZGVsZXRlRW1haWxCYXRjaFByb2dyYW0nLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ2Nsb25lSW5BcHBQcm9ncmFtJywgLy9DbG9uZVxuICAgICAgICAgICAgJ2RlbGV0ZUluQXBwUHJvZ3JhbScsIC8vRGVsZXRlXG4gICAgICAgICAgICAnc2hhcmVQcm9ncmFtRm9sZGVyJywgLy9TaGFyZSBGb2xkZXJcbiAgICAgICAgICAgICdzY0FjdGl2YXRlJywgLy9BY3RpdmF0ZVxuICAgICAgICAgICAgJ3NjQWJvcnQnLCAvL0Fib3J0IENhbXBhaWduXG4gICAgICAgICAgICAnc2NDYW1wQ2hhbmdlSGlzdG9yeScsIC8vU3VwcG9ydCBUb29scyAtIENoYW5nZSBIaXN0b3J5XG4gICAgICAgICAgICAnc2NDYW1wUnVuSGlzdG9yeScsIC8vU3VwcG9ydCBUb29scyAtIFJ1biBIaXN0b3J5XG4gICAgICAgICAgICAnc2NDbGVhclBhbGV0dGUnLCAvL0NsZWFyIFBhbGV0dGUgQ2FjaGVcbiAgICAgICAgICAgICdzY0NsZWFyU21hcnRMaXN0JywgLy9DbGVhciBTbWFydCBMaXN0XG4gICAgICAgICAgICAnc2NDbGVhckZsb3cnLCAvL0NsZWFyIEZsb3dcbiAgICAgICAgICAgICdwcm9nR2VuZXJhdGVSZWYnLCAvL0J1aWxkIENhbXBhaWduIFJlZmVyZW5jZXNcbiAgICAgICAgICAgICdjaGVja0ZvckNvcnJ1cHRFbWFpbHMnLCAvL0NoZWNrIEZvciBDb3JydXB0IEVtYWlsc1xuICAgICAgICAgICAgJ3NvY2lhbEFwcEFwcHJvdmUnLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICdzb2NpYWxBcHBDbG9uZScsIC8vQ2xvbmVcbiAgICAgICAgICAgICdzb2NpYWxBcHBEZWxldGUnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ3NvY2lhbEFwcERyYWZ0QXBwcm92ZScsIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICAgICAgLy8gTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBQdXNoIE5vdGlmaWNhdGlvbiA+IFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdwdXNoTm90aWZpY2F0aW9uVW5hcHByb3ZlJywgLy9VbmFwcHJvdmVcbiAgICAgICAgICAgICdwdXNoTm90aWZpY2F0aW9uQXBwcm92ZScsIC8vQXBwcm92ZVxuICAgICAgICAgICAgJ3B1c2hOb3RpZmljYXRpb25TZW5kU2FtcGxlJywgLy9TZW5kIFNhbXBsZVxuICAgICAgICAgICAgJ3B1c2hOb3RpZmljYXRpb25DbG9uZScsIC8vQ2xvbmVcbiAgICAgICAgICAgICdwdXNoTm90aWZpY2F0aW9uRGVsZXRlJywgLy9EZWxldGVcbiAgICAgICAgICAgICdwdXNoTm90aWZpY2F0aW9uRHJhZnRTZW5kU2FtcGxlJywgLy9TZW5kIFNhbXBsZSBvZiBEcmFmdFxuICAgICAgICAgICAgJ3B1c2hOb3RpZmljYXRpb25EcmFmdEFwcHJvdmUnLCAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzID4gSW4tQXBwIE1lc3NhZ2UgPiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnaW5BcHBNZXNzYWdlVW5hcHByb3ZlJywgLy9VbmFwcHJvdmVcbiAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VBcHByb3ZlJywgLy9BcHByb3ZlXG4gICAgICAgICAgICAnaW5BcHBNZXNzYWdlU2VuZFNhbXBsZScsIC8vU2VuZCBTYW1wbGVcbiAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VDbG9uZScsIC8vQ2xvbmVcbiAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VEZWxldGUnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ2luQXBwTWVzc2FnZURyYWZ0U2VuZFNhbXBsZScsIC8vU2VuZCBTYW1wbGUgb2YgRHJhZnRcbiAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VEcmFmdEFwcHJvdmUnLCAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzID4gU01TIE1lc3NhZ2UgPiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnc21zTWVzc2FnZVVuYXBwcm92ZScsIC8vVW5hcHByb3ZlXG4gICAgICAgICAgICAnc21zTWVzc2FnZUFwcHJvdmUnLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICdzbXNNZXNzYWdlQ2xvbmUnLCAvL0Nsb25lXG4gICAgICAgICAgICAnc21zTWVzc2FnZURlbGV0ZScsIC8vRGVsZXRlXG4gICAgICAgICAgICAnc21zTWVzc2FnZURyYWZ0QXBwcm92ZScsIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICAgICAgLy8gTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBBTEwgUHJvZ3JhbXMgJiBGb2xkZXJzID4gTXkgVG9rZW5zIFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdkZWxldGVDdXN0b21Ub2tlbicsIC8vRGVsZXRlIFRva2VuXG4gICAgICAgICAgICAvLyBEZXNpZ24gU3R1ZGlvID4gRm9sZGVyID4gUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ25ld0xhbmRpbmdQYWdlJywgLy9OZXcgTGFuZGluZyBQYWdlXG4gICAgICAgICAgICAnbmV3VGVzdEdyb3VwJywgLy9OZXcgVGVzdCBHcm91cFxuICAgICAgICAgICAgJ25ld1BhZ2VUZW1wbGF0ZScsIC8vTmV3IExhbmRpbmcgUGFnZSBUZW1wbGF0ZVxuICAgICAgICAgICAgJ3BhZ2VUZW1wbGF0ZUltcG9ydCcsIC8vSW1wb3J0IFRlbXBsYXRlXG4gICAgICAgICAgICAnbmV3Rm9ybScsIC8vTmV3IEZvcm1cbiAgICAgICAgICAgICduZXdWaWRlb1NoYXJlJywgLy9OZXcgWW91VHViZSBWaWRlb1xuICAgICAgICAgICAgJ25ld1NoYXJlQnV0dG9uJywgLy9OZXcgU29jaWFsIEJ1dHRvblxuICAgICAgICAgICAgJ25ld1JlZmVycmFsT2ZmZXInLCAvL05ldyBSZWZlcnJhbCBPZmZlclxuICAgICAgICAgICAgJ25ld0VtYWlsJywgLy9OZXcgRW1haWxcbiAgICAgICAgICAgICduZXdFbWFpbFRlbXBsYXRlJywgLy9OZXcgRW1haWwgVGVtcGxhdGVcbiAgICAgICAgICAgICduZXdTbmlwcGV0JywgLy9OZXcgU25pcHBldFxuICAgICAgICAgICAgJ3VwbG9hZEltYWdlJywgLy9VcGxvYWQgSW1hZ2Ugb3IgRmlsZVxuICAgICAgICAgICAgJ3NoYXJlJywgLy9TaGFyZSBGb2xkZXJcbiAgICAgICAgICAgICdjcmVhdGVGb2xkZXInLCAvL05ldyBGb2xkZXJcbiAgICAgICAgICAgICdyZW5hbWVGb2xkZXInLCAvL1JlbmFtZSBGb2xkZXJcbiAgICAgICAgICAgICdkZWxldGVGb2xkZXInLCAvL0RlbGV0ZSBGb2xkZXJcbiAgICAgICAgICAgICdjb252ZXJ0VG9BcmNoaXZlRm9sZGVyJywgLy9Db252ZXJ0IFRvIEFyY2hpdmUgRm9sZGVyXG4gICAgICAgICAgICAnY29udmVydFRvRm9sZGVyJywgLy9Db252ZXJ0IFRvIEZvbGRlclxuICAgICAgICAgICAgLy8gRGVzaWduIFN0dWRpbyA+IExhbmRpbmcgUGFnZSBUZW1wbGF0ZSA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ2FwcHJvdmVQYWdlVGVtcGxhdGUnLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICd1bmFwcHJvdmVQYWdlVGVtcGxhdGUnLCAvL1VuYXBwcm92ZVxuICAgICAgICAgICAgJ2Nsb25lUGFnZVRlbXBsYXRlJywgLy9DbG9uZVxuICAgICAgICAgICAgJ3BhZ2VUZW1wbGF0ZURlbGV0ZScsIC8vRGVsZXRlXG4gICAgICAgICAgICAnYXBwcm92ZURyYWZ0UGFnZVRlbXBsYXRlJywgLy9BcHByb3ZlIERyYWZ0XG4gICAgICAgICAgICAvLyBEZXNpZ24gU3R1ZGlvID4gRW1haWwgVGVtcGxhdGUgPiBBY3Rpb25zIEJ1dHRvbiAmIFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdlbWFpbFRlbXBsYXRlQXBwcm92ZScsIC8vQXBwcm92ZVxuICAgICAgICAgICAgJ2VtYWlsVGVtcGxhdGVVbmFwcHJvdmUnLCAvL1VuYXBwcm92ZVxuICAgICAgICAgICAgJ2VtYWlsVGVtcGxhdGVDbG9uZScsIC8vQ2xvbmVcbiAgICAgICAgICAgICdlbWFpbFRlbXBsYXRlRGVsZXRlJywgLy9EZWxldGVcbiAgICAgICAgICAgICdlbWFpbFRlbXBsYXRlRHJhZnRBcHByb3ZlJywgLy9BcHByb3ZlIERyYWZ0XG4gICAgICAgICAgICAvLyBEZXNpZ24gU3R1ZGlvID4gU25pcHBldCA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ3NuaXBwZXRBcHByb3ZlJywgLy9BcHByb3ZlXG4gICAgICAgICAgICAnc25pcHBldFVuYXBwcm92ZScsIC8vVW5hcHByb3ZlXG4gICAgICAgICAgICAnc25pcHBldENsb25lJywgLy9DbG9uZVxuICAgICAgICAgICAgJ3NuaXBwZXREZWxldGUnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ3NuaXBwZXREcmFmdEFwcHJvdmUnLCAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgICAgIC8vIERlc2lnbiBTdHVkaW8gPiBJbWFnZSAmIEZpbGUgPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICAgJ3VwbG9hZEltYWdlJywgLy9VcGxvYWQgSW1hZ2Ugb3IgRmlsZVxuICAgICAgICAgICAgJ2ltYWdlRGVsZXRlJywgLy9EZWxldGVcbiAgICAgICAgICAgICdyZXBsYWNlSW1hZ2UnLCAvL1JlcGxhY2UgSW1hZ2Ugb3IgRmlsZVxuICAgICAgICAgICAgLy8gTGVhZCBEYXRhYmFzZSA+IE5ldyBCdXR0b25cbiAgICAgICAgICAgICduZXdTbWFydExpc3QnLCAvL05ldyBTbWFydCBMaXN0XG4gICAgICAgICAgICAnbmV3TGlzdCcsIC8vTmV3IExpc3RcbiAgICAgICAgICAgICduZXdTZWdtZW50YXRpb24nLCAvL05ldyBTZWdtZW50YXRpb25cbiAgICAgICAgICAgICdpbXBvcnRMaXN0JywgLy9JbXBvcnQgTGlzdFxuICAgICAgICAgICAgJ25ld0xlYWQnLCAvL05ldyBMZWFkXG4gICAgICAgICAgICAnbmV3RGF0YU1ncicsIC8vTmV3IEZpZWxkIE9yZ2FuaXplclxuICAgICAgICAgICAgLy8gTGVhZCBEYXRhYmFzZSA+IEZvbGRlciA+IFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICduZXdTZWdtZW50YXRpb24nLCAvL05ldyBTZWdtZW50YXRpb25cbiAgICAgICAgICAgICduZXdTbWFydExpc3QnLCAvL05ldyBTbWFydCBMaXN0XG4gICAgICAgICAgICAnc2hhcmUnLCAvL1NoYXJlIEZvbGRlclxuICAgICAgICAgICAgJ2NyZWF0ZUZvbGRlcicsIC8vTmV3IEZvbGRlclxuICAgICAgICAgICAgJ3JlbmFtZUZvbGRlcicsIC8vUmVuYW1lIEZvbGRlclxuICAgICAgICAgICAgJ2RlbGV0ZUZvbGRlcicsIC8vRGVsZXRlIEZvbGRlclxuICAgICAgICAgICAgJ2NvbnZlcnRUb0FyY2hpdmVGb2xkZXInLCAvL0NvbnZlcnQgVG8gQXJjaGl2ZSBGb2xkZXJcbiAgICAgICAgICAgICdjb252ZXJ0VG9Gb2xkZXInLCAvL0NvbnZlcnQgVG8gRm9sZGVyXG4gICAgICAgICAgICAvLyBMZWFkIERhdGFiYXNlID4gU2VnbWVudGF0aW9uID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnY3JlYXRlRHJhZnRTZWdtZW50YXRpb24nLCAvL0NyZWF0ZSBEcmFmdFxuICAgICAgICAgICAgJ2FwcHJvdmVTZWdtZW50YXRpb24nLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICd1bmFwcHJvdmVTZWdtZW50YXRpb24nLCAvL1VuYXBwcm92ZVxuICAgICAgICAgICAgJ2RlbGV0ZVNlZ21lbnRhdGlvbicsIC8vRGVsZXRlXG4gICAgICAgICAgICAncmVmcmVzaFNlZ21lbnRhdGlvbicsIC8vUmVmcmVzaCBTdGF0dXNcbiAgICAgICAgICAgICdhcHByb3ZlRHJhZnRTZWdtZW50YXRpb24nLCAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgICAgIC8vIEFuYWx5dGljcyA+IE5ldyBCdXR0b25cbiAgICAgICAgICAgICduZXdSY21fcmNtQ2FudmFzT3ZlcnZpZXcnLCAvL05ldyBSZXZlbnVlIEN5Y2xlIE1vZGVsXG4gICAgICAgICAgICAnbmV3UmNtX2F0eENhbnZhc092ZXJ2aWV3JywgLy9OZXcgUmV2ZW51ZSBDeWNsZSBNb2RlbFxuICAgICAgICAgICAgJ25ld1JjbV9hdHhDYW52YXNEZXRhaWxWaWV3JywgLy9OZXcgUmV2ZW51ZSBDeWNsZSBNb2RlbCAoUmVwb3J0IFRhYilcbiAgICAgICAgICAgICduZXdSY21fYXR4Q2FudmFzU21hcnRsaXN0JywgLy9OZXcgUmV2ZW51ZSBDeWNsZSBNb2RlbCAoU21hcnQgTGlzdCBUYWIpXG4gICAgICAgICAgICAnbmV3UmNtX2F0eENhbnZhc1NldHVwJywgLy9OZXcgUmV2ZW51ZSBDeWNsZSBNb2RlbCAoU2V0dXAgVGFiKVxuICAgICAgICAgICAgJ25ld1JjbV9hdHhDYW52YXNTdWJzY3JpcHRpb25zJywgLy9OZXcgUmV2ZW51ZSBDeWNsZSBNb2RlbCAoU3Vic2NyaXB0aW9ucyBUYWIpXG4gICAgICAgICAgICAnbmV3UmNtX3JjbU1lbWJlcnNDYW52YXMnLCAvL05ldyBSZXZlbnVlIEN5Y2xlIE1vZGVsIChNZW1iZXJzIFRhYilcbiAgICAgICAgICAgIC8vIEFuYWx5dGljcyA+IEZvbGRlciA+IFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICduZXdSY20nLCAvL05ldyBSZXZlbnVlIEN5Y2xlIE1vZGVsXG4gICAgICAgICAgICAnc2hhcmUnLCAvL1NoYXJlIEZvbGRlclxuICAgICAgICAgICAgJ2NyZWF0ZUZvbGRlcicsIC8vTmV3IEZvbGRlclxuICAgICAgICAgICAgJ3JlbmFtZUZvbGRlcicsIC8vUmVuYW1lIEZvbGRlclxuICAgICAgICAgICAgJ2RlbGV0ZUZvbGRlcicsIC8vRGVsZXRlIEZvbGRlclxuICAgICAgICAgICAgJ2NvbnZlcnRUb0FyY2hpdmVGb2xkZXInLCAvL0NvbnZlcnQgVG8gQXJjaGl2ZSBGb2xkZXJcbiAgICAgICAgICAgICdjb252ZXJ0VG9Gb2xkZXInLCAvL0NvbnZlcnQgVG8gRm9sZGVyXG4gICAgICAgICAgICAvLyBBbmFseXRpY3MgPiBBbmFseXplciAmIFJlcG9ydCA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgICAnbmV3UmVwb3J0X2F0eENhbnZhc092ZXJ2aWV3JywgLy9FeHBvcnQgRGF0YVxuICAgICAgICAgICAgJ25ld1JlcG9ydF9hdHhDYW52YXNTZXR1cCcsIC8vRXhwb3J0IERhdGEgKFNldHVwIFRhYilcbiAgICAgICAgICAgICdjbG9uZVJlcG9ydF9hdHhDYW52YXNPdmVydmlldycsIC8vQ2xvbmUgQW5hbHl6ZXJcbiAgICAgICAgICAgICdjbG9uZVJlcG9ydF9hdHhDYW52YXNEZXRhaWxWaWV3JywgLy9DbG9uZSBBbmFseXplciAoUmVwb3J0IFRhYilcbiAgICAgICAgICAgICdjbG9uZVJlcG9ydF9hdHhDYW52YXNTbWFydGxpc3QnLCAvL0Nsb25lIEFuYWx5emVyIChTbWFydCBMaXN0IFRhYilcbiAgICAgICAgICAgICdjbG9uZVJlcG9ydF9hdHhDYW52YXNTZXR1cCcsIC8vQ2xvbmUgQW5hbHl6ZXIgKFNldHVwIFRhYilcbiAgICAgICAgICAgICdjbG9uZVJlcG9ydF9hdHhDYW52YXNTdWJzY3JpcHRpb25zJywgLy9DbG9uZSBBbmFseXplciAoU3Vic2NyaXB0aW9ucyBUYWIpXG4gICAgICAgICAgICAnZGVsZXRlUmVwb3J0JywgLy9EZWxldGUgQW5hbHl6ZXJcbiAgICAgICAgICAgIC8vIEFuYWx5dGljcyA+IEFuYWx5emVyID4gUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ2Nsb25lUmVwb3J0JywgLy9DbG9uZSBBbmFseXplclxuICAgICAgICAgICAgJ2RlbGV0ZVJlcG9ydCcsIC8vRGVsZXRlIEFuYWx5emVyXG4gICAgICAgICAgICAvLyBBbmFseXRpY3MgPiBSZXBvcnQgPiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnY2xvbmVSZXBvcnQnLCAvL0Nsb25lIFJlcG9ydFxuICAgICAgICAgICAgJ2RlbGV0ZVJlcG9ydCcsIC8vRGVsZXRlIFJlcG9ydFxuICAgICAgICAgICAgJ21vdmVSZXBvcnQnLCAvL01vdmUgUmVwb3J0XG4gICAgICAgICAgICAvLyBBbmFseXRpY3MgPiBNb2RlbCA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ3JjbUVkaXQnLCAvL0VkaXQgRHJhZnRcbiAgICAgICAgICAgICdyY21BcHByb3ZlU3RhZ2VzJywgLy9BcHByb3ZlIFN0YWdlc1xuICAgICAgICAgICAgJ3JjbVVuYXBwcm92ZVN0YWdlcycsIC8vVW5hcHByb3ZlIFN0YWdlc1xuICAgICAgICAgICAgJ3JjbUFwcHJvdmUnLCAvL0FwcHJvdmUgTW9kZWxcbiAgICAgICAgICAgICdyY21VbmFwcHJvdmUnLCAvL1VuYXBwcm92ZSBNb2RlbFxuICAgICAgICAgICAgJ3JjbUNsb25lJywgLy9DbG9uZSBNb2RlbFxuICAgICAgICAgICAgJ3JjbURlbGV0ZScsIC8vRGVsZXRlIE1vZGVsXG4gICAgICAgICAgICAncmNtRWRpdERyYWZ0JywgLy9FZGl0IERyYWZ0XG4gICAgICAgICAgICAncmNtQXBwcm92ZURyYWZ0JywgLy9BcHByb3ZlIE1vZGVsIERyYWZ0XG4gICAgICAgICAgICAncmNtQWFzc2lnbm1lbnRSdWxlcycsIC8vQXNzaWdubWVudCBSdWxlc1xuICAgICAgICAgICAgLy8gQW5hbHl0aWNzID4gTW9kZWwgPiBTdGFnZSA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2tcbiAgICAgICAgICAgICdEZWxldGUnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgLy8gQW5hbHl0aWNzID4gTW9kZWwgPiBUcmFuc2l0aW9uID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGlja1xuICAgICAgICAgICAgJ0RlbGV0ZScsIC8vRGVsZXRlXG4gICAgICAgICAgICAvLyBBZG1pbiA+IFRhZ3MgPiBUYWdzID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnZGVsZXRlRGVzY3JpcHRvcicsIC8vRGVsZXRlXG4gICAgICAgICAgICAnZGVsZXRlRGVzY3JpcHRvclZhbHVlJywgLy9EZWxldGVcbiAgICAgICAgICAgICdoaWRlRGVzY3JpcHRvclZhbHVlJywgLy9IaWRlXG4gICAgICAgICAgICAndW5oaWRlRGVzY3JpcHRvclZhbHVlJywgLy9VbmhpZGVcbiAgICAgICAgICAgIC8vIEFkbWluID4gVGFncyA+IENhbGVuZGFyIEVudHJ5IFR5cGVzID4gQWN0aW9ucyBCdXR0b25cbiAgICAgICAgICAgICd1bmhpZGVFbnRyeScsIC8vVW5oaWRlXG4gICAgICAgICAgICAnaGlkZUVudHJ5JywgLy9IaWRlXG4gICAgICAgICAgICAvLyBBZG1pbiA+IEZpZWxkIE1hbmFnZW1lbnQgPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICAgJ2hpZGVGaWVsZEZtRmllbGRzJywgLy9IaWRlIGZpZWxkXG4gICAgICAgICAgICAvLyBBZG1pbiA+IExhbmRpbmcgUGFnZXMgPiBSdWxlcyA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgICAnZGVsZXRlUnVsZScsIC8vRGVsZXRlIFJ1bGVcbiAgICAgICAgICAgIC8vIEFkbWluID4gTGF1bmNoUG9pbnQgPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICAgJ2Nsb25lV2ViaW5hckxvZ2luJywgLy9DbG9uZSBMb2dpblxuICAgICAgICAgICAgJ2RlbGV0ZVdlYmluYXJMb2dpbicsIC8vRGVsZXRlIFNlcnZpY2VcbiAgICAgICAgICAgIC8vIEFkbWluID4gV2ViaG9va3MgPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICAgJ2Nsb25lV2ViaG9vaycsIC8vQ2xvbmUgV2ViaG9va1xuICAgICAgICAgICAgJ2RlbGV0ZVdlYmhvb2snIC8vRGVsZXRlIFdlYmhvb2tcbiAgICAgICAgICBdLFxuICAgICAgICAgIGl0ZW1zVG9EaXNhYmxlQWx3YXlzID0gW1xuICAgICAgICAgICAgLy8gRGVmYXVsdCwgRW1haWwgU2VuZCwgRXZlbnQsIGFuZCBOdXJ0dXJpbmcgUHJvZ3JhbXM7IFNtYXJ0IENhbXBhaWduLCBGb2xkZXIgPiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnc2hhcmVQcm9ncmFtRm9sZGVyJywgLy9TaGFyZSBGb2xkZXJcbiAgICAgICAgICAgIC8vIExlYWQgRGF0YWJhc2UgPiBTZWdtZW50YXRpb24gPiBBY3Rpb25zIEJ1dHRvbiAmIFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdhcHByb3ZlU2VnbWVudGF0aW9uJywgLy9BcHByb3ZlXG4gICAgICAgICAgICAndW5hcHByb3ZlU2VnbWVudGF0aW9uJywgLy9VbmFwcHJvdmVcbiAgICAgICAgICAgICdyZWZyZXNoU2VnbWVudGF0aW9uJywgLy9SZWZyZXNoIFN0YXR1c1xuICAgICAgICAgICAgJ2FwcHJvdmVEcmFmdFNlZ21lbnRhdGlvbicsIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICAgICAgLy8gQW5hbHl0aWNzID4gRm9sZGVyID4gUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ3NoYXJlJywgLy9TaGFyZSBGb2xkZXJcbiAgICAgICAgICAgIC8vIEFuYWx5dGljcyA+IE1vZGVsID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAncmNtQXBwcm92ZVN0YWdlcycsIC8vQXBwcm92ZSBTdGFnZXNcbiAgICAgICAgICAgICdyY21VbmFwcHJvdmVTdGFnZXMnLCAvL1VuYXBwcm92ZSBTdGFnZXNcbiAgICAgICAgICAgICdyY21BcHByb3ZlJywgLy9BcHByb3ZlIE1vZGVsXG4gICAgICAgICAgICAncmNtVW5hcHByb3ZlJywgLy9VbmFwcHJvdmUgTW9kZWxcbiAgICAgICAgICAgICdyY21BcHByb3ZlRHJhZnQnIC8vQXBwcm92ZSBNb2RlbCBEcmFmdFxuICAgICAgICAgIF1cblxuICAgICAgICBpZiAodGhpcy5pZCA9PSAnbGVhZERiTGlzdE1lbnUnIHx8IHRoaXMuaWQgPT0gJ3NlZ21lbnRhdGlvbk1lbnUnKSB7XG4gICAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ3RyZWUnLCB0aGlzLCBjYW52YXMsIG51bGwpXG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgdGhpcy5pZCA9PSAnbGVhZERiTGVhZE1lbnUnIHx8XG4gICAgICAgICAgKHRoaXMub3duZXJDdCAmJiB0aGlzLm93bmVyQ3QucGFyZW50TWVudSAmJiB0aGlzLm93bmVyQ3QucGFyZW50TWVudS5pZCA9PSAnbGVhZERiTGVhZE1lbnUnKVxuICAgICAgICApIHtcbiAgICAgICAgICBkaXNhYmxlID0gdHJ1ZVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMudHJpZ2dlcmVkRnJvbSAhPSAndHJlZScgJiYgdGhpcy50cmlnZ2VyZWRGcm9tICE9ICdidXR0b24nKSB7XG4gICAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ3RyZWUnLCB0aGlzLCBjYW52YXMsIG51bGwpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUodGhpcy50cmlnZ2VyZWRGcm9tLCB0aGlzLCBjYW52YXMsIG51bGwpXG4gICAgICAgIH1cblxuICAgICAgICBpdGVtc1RvRGlzYWJsZS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtVG9EaXNhYmxlKSB7XG4gICAgICAgICAgbGV0IGl0ZW1cblxuICAgICAgICAgIGlmIChpdGVtVG9EaXNhYmxlID09ICdEZWxldGUnKSB7XG4gICAgICAgICAgICBpdGVtID0gbWVudS5maW5kKCd0ZXh0JywgaXRlbVRvRGlzYWJsZSlbMF1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXRlbSA9IG1JdGVtcy5nZXQoaXRlbVRvRGlzYWJsZSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaXRlbS5zZXREaXNhYmxlZChkaXNhYmxlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBpdGVtc1RvRGlzYWJsZUFsd2F5cy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtVG9EaXNhYmxlKSB7XG4gICAgICAgICAgbGV0IGl0ZW1cbiAgICAgICAgICBpZiAoaXRlbVRvRGlzYWJsZSA9PSAnRGVsZXRlJykge1xuICAgICAgICAgICAgaXRlbSA9IG1lbnUuZmluZCgndGV4dCcsIGl0ZW1Ub0Rpc2FibGUpWzBdXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGl0ZW0gPSBtSXRlbXMuZ2V0KGl0ZW1Ub0Rpc2FibGUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGlmICh0aGlzLm93bmVyQ3QgJiYgdGhpcy5vd25lckN0LnRleHQpIHtcbiAgICAgICAgICBzd2l0Y2ggKHRoaXMub3duZXJDdC50ZXh0KSB7XG4gICAgICAgICAgICBjYXNlICdDaGFuZ2UgU3RhdHVzJzpcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHRoaXMuaXRlbXMuaXRlbXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5pdGVtc1tpaV0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAnRmllbGQgQWN0aW9ucyc6XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLml0ZW1zLml0ZW1zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLml0ZW1zLml0ZW1zW2lpXS50ZXh0ID09ICdOZXcgQ3VzdG9tIEZpZWxkJykge1xuICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5pdGVtc1tpaV0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMub3duZXJDdC50ZXh0LnNlYXJjaCgnXlZpZXc6JykgIT0gLTEpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLml0ZW1zLml0ZW1zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICBzd2l0Y2ggKHRoaXMuaXRlbXMuaXRlbXNbaWldLnRleHQpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdDcmVhdGUgVmlldyc6XG4gICAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLml0ZW1zW2lpXS5zZXREaXNhYmxlZCh0cnVlKVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBjYXNlICdFZGl0IERlZmF1bHQnOlxuICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5pdGVtc1tpaV0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBhcmVudE1lbnUgPSBwYXJlbnRNZW51XG4gICAgICAgIGlmICghdGhpcy5lbCkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKClcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lbmFibGVTY3JvbGxpbmcpIHtcbiAgICAgICAgICB0aGlzLmVsLnNldFhZKHh5KVxuICAgICAgICAgIHh5WzFdID0gdGhpcy5jb25zdHJhaW5TY3JvbGwoeHlbMV0pXG4gICAgICAgICAgeHkgPSBbdGhpcy5lbC5hZGp1c3RGb3JDb25zdHJhaW50cyh4eSlbMF0sIHh5WzFdXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHh5ID0gdGhpcy5lbC5hZGp1c3RGb3JDb25zdHJhaW50cyh4eSlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsLnNldFhZKHh5KVxuICAgICAgICB0aGlzLmVsLnNob3coKVxuICAgICAgICBFeHQubWVudS5NZW51LnN1cGVyY2xhc3Mub25TaG93LmNhbGwodGhpcylcbiAgICAgICAgaWYgKEV4dC5pc0lFKSB7XG4gICAgICAgICAgdGhpcy5maXJlRXZlbnQoJ2F1dG9zaXplJywgdGhpcylcbiAgICAgICAgICBpZiAoIUV4dC5pc0lFOCkge1xuICAgICAgICAgICAgdGhpcy5lbC5yZXBhaW50KClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5oaWRkZW4gPSBmYWxzZVxuICAgICAgICB0aGlzLmZvY3VzKClcbiAgICAgICAgdGhpcy5maXJlRXZlbnQoJ3Nob3cnLCB0aGlzKVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBTa2lwcGVkOiBEaXNhYmxlIEFjdGlvbnMgYW5kIFJpZ2h0LWNsaWNrIG1lbnVzIGZvciBBTEwgaW4gQUxMJylcbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuY29udHJvbGxlci5lZGl0b3Iud2l6YXJkLkVkaXRvci5wcm90b3R5cGUubG9hZFN0ZXAnKSkge1xuICAgIE1rdDMuY29udHJvbGxlci5lZGl0b3Iud2l6YXJkLkVkaXRvci5wcm90b3R5cGUubG9hZFN0ZXAgPSBmdW5jdGlvbiAoc3RlcCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIENyZWF0ZSBidXR0b24gaW4gV2l6YXJkIEVkaXRvcnMnKVxuICAgICAgbGV0IGVkaXRvciA9IHRoaXMuZ2V0RWRpdG9yKCksXG4gICAgICAgIHRyZWUgPSB0aGlzLmdldFRyZWUoKSxcbiAgICAgICAgcHJldmlvdXNTdGVwID0gdHJlZS5nZXRDdXJyZW50U3RlcCgpLFxuICAgICAgICBwcmV2aW91c1N0ZXBJZCA9IHByZXZpb3VzU3RlcCA/IHByZXZpb3VzU3RlcC5nZXRJZCgpIDogbnVsbCxcbiAgICAgICAgc3RlcElkID0gc3RlcC5nZXRJZCgpLFxuICAgICAgICB0aXRsZUl0ZW0gPSB0aGlzLmdldE5hdkJhcigpLmdldENvbXBvbmVudCgndGl0bGUnKSxcbiAgICAgICAgc3RlcHMgPSBlZGl0b3IuaXRlbXMuaXRlbXMsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBpbCA9IHN0ZXBzLmxlbmd0aFxuXG4gICAgICBFeHQ0LnN1c3BlbmRMYXlvdXRzKClcblxuICAgICAgLy8gdXBkYXRlIG5hdmlnYXRpb24gdGl0bGVcbiAgICAgIHRpdGxlSXRlbS5zZXRUZXh0KHN0ZXAuZ2V0KCd0aXRsZVRleHQnKSB8fCBzdGVwLmdldCgndGV4dCcpKVxuXG4gICAgICAvLyB1cGRhdGUgY29udGVudFxuICAgICAgZm9yICg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgIHN0ZXBzW2ldLnNldFZpc2libGUoRXh0NC5BcnJheS5jb250YWlucyhFeHQ0LkFycmF5LmZyb20oc3RlcHNbaV0uc3RlcElkcyksIHN0ZXBJZCkpXG4gICAgICB9XG5cbiAgICAgIC8vIHVwZGF0ZSBjdXN0b20gdG9rZW5cbiAgICAgIE1rdDMuRGxNYW5hZ2VyLnNldEN1c3RvbVRva2VuKHN0ZXAuZ2V0SWQoKSlcblxuICAgICAgdHJlZS5leHBhbmRQYXRoKHN0ZXAucGFyZW50Tm9kZS5nZXRQYXRoKCkpXG4gICAgICB0cmVlLmdldFZpZXcoKS5nZXRTZWxlY3Rpb25Nb2RlbCgpLnNlbGVjdChzdGVwKVxuXG4gICAgICB0aGlzLnVwZGF0ZUZsb3dCdXR0b25zKClcblxuICAgICAgZWRpdG9yLmZpcmVFdmVudCgnc3RlcGNoYW5nZScsIHN0ZXBJZCwgcHJldmlvdXNTdGVwSWQpXG5cbiAgICAgIEV4dDQucmVzdW1lTGF5b3V0cyh0cnVlKVxuXG4gICAgICBpZiAoZWRpdG9yLmRvd24pIHtcbiAgICAgICAgaWYgKGVkaXRvci5kb3duKCdbYWN0aW9uPWNyZWF0ZV0nKSAmJiBlZGl0b3IuZG93bignW2FjdGlvbj1jcmVhdGVdJykuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICBlZGl0b3IuZG93bignW2FjdGlvbj1jcmVhdGVdJykuc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgfSBlbHNlIGlmIChlZGl0b3IuZG93bignW2FjdGlvbj1pbXBvcnRdJykgJiYgZWRpdG9yLmRvd24oJ1thY3Rpb249aW1wb3J0XScpLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgZWRpdG9yLmRvd24oJ1thY3Rpb249aW1wb3J0XScpLnNldERpc2FibGVkKHRydWUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBlZDogRGlzYWJsZSBDcmVhdGUgYnV0dG9uIGluIFdpemFyZCBFZGl0b3JzJylcbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dDQuYnV0dG9uLkJ1dHRvbi5wcm90b3R5cGUuc2hvd01lbnUnKSkge1xuICAgIEV4dDQuYnV0dG9uLkJ1dHRvbi5wcm90b3R5cGUuc2hvd01lbnUgPSBmdW5jdGlvbiAoZnJvbUV2ZW50KSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgVG9vbGJhciBCdXR0b25zICYgQWN0aW9ucyBNZW51IGluIEFCTSAmIEFkbWluIFNlY3Rpb25zJylcbiAgICAgIGxldCBtSXRlbXMgPSB0aGlzLm1lbnUuaXRlbXMsXG4gICAgICAgIG1lbnVJdGVtcyxcbiAgICAgICAgaXRlbXNUb0Rpc2FibGUgPSBbXG4gICAgICAgICAgLy8gQWNjb3VudCBCYXNlZCBNYXJrZXRpbmcgPiBOYW1lZCBBY2NvdW50cyA+IE5ldyBCdXR0b25cbiAgICAgICAgICAvLyBBY2NvdW50IEJhc2VkIE1hcmtldGluZyA+IE5hbWVkIEFjY291bnRzID4gQWN0aW9ucyBCdXR0b25cbiAgICAgICAgICAnZGVsZXRlTmFtZWRBY2NvdW50JywgLy9EZWxldGUgTmFtZWQgQWNjb3VudFxuICAgICAgICAgIC8vIEFjY291bnQgQmFzZWQgTWFya2V0aW5nID4gTmFtZWQgQWNjb3VudHMgPiBBY2NvdW50IFRlYW0gQWN0aW9uc1xuICAgICAgICAgICdkZWxldGVBY2NvdW50TWVtYmVyJywgLy9SZW1vdmUgQWNjb3VudCBNZW1iZXJcbiAgICAgICAgICAvLyBBZG1pbiA+IE1hcmtldG8gQ3VzdG9tIE9iamVjdHMgPiBNYXJrZXRvIEN1c3RvbSBPYmplY3RzID4gQWN0aW9ucyBCdXR0b25cbiAgICAgICAgICAnbWt0b0N1c3RvbU9iamVjdFB1Ymxpc2hCdG4nLCAvL0FwcHJvdmUgT2JqZWN0XG4gICAgICAgICAgJ21rdG9DdXN0b21PYmplY3REZWxldGVCdG4nLCAvL0RlbGV0ZSBPYmplY3RcbiAgICAgICAgICAvLyBBZG1pbiA+IE1hcmtldG8gQ3VzdG9tIE9iamVjdHMgPiBGaWVsZHMgPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICdta3RvQ3VzdG9tT2JqZWN0RmllbGREZWxldGVCdG4nLCAvLyBEZWxldGUgRmllbGRcbiAgICAgICAgICAvLyBBZG1pbiA+IE1hcmtldG8gQ3VzdG9tIEFjdGl2aXRpZXMgPiBNYXJrZXRvIEN1c3RvbSBBY3Rpdml0aWVzID4gQWN0aW9ucyBCdXR0b25cbiAgICAgICAgICAnbWt0b0N1c3RvbUFjdGl2aXR5UHVibGlzaEJ0bicsIC8vQXBwcm92ZSBBY3Rpdml0eVxuICAgICAgICAgICdta3RvQ3VzdG9tQWN0aXZpdHlEZWxldGVCdG4nLCAvL0RlbGV0ZSBBY3Rpdml0eVxuICAgICAgICAgIC8vIEFkbWluID4gTWFya2V0byBDdXN0b20gQWN0aXZpdGllcyA+IEZpZWxkcyA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgJ21rdG9DdXN0b21BY3Rpdml0eUZpZWxkRGVsZXRlQnRuJyAvL0RlbGV0ZSBGaWVsZFxuICAgICAgICBdXG5cbiAgICAgIGlmIChtSXRlbXMpIHtcbiAgICAgICAgaXRlbXNUb0Rpc2FibGUuZm9yRWFjaChmdW5jdGlvbiAoaXRlbVRvRGlzYWJsZSkge1xuICAgICAgICAgIGxldCBpdGVtID0gbUl0ZW1zLmdldChpdGVtVG9EaXNhYmxlKVxuICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAvLyBBY2NvdW50IEJhc2VkIE1hcmtldGluZyA+IEFjY291bnQgTGlzdHMgPiBOZXcgQnV0dG9uXG4gICAgICAgICdjb250ZXh0TWVudSBbYWN0aW9uPWRlbGV0ZUFjY291bnRMaXN0XScsIC8vRGVsZXRlIEFjY291bnQgTGlzdFxuICAgICAgICAnbWVudSBbYWN0aW9uPWRlbGV0ZV0nLCAvL0RlbGV0ZSBNb2JpbGUgQXBwXG4gICAgICAgICdtZW51IFthY3Rpb249ZWRpdFRlc3REZXZpY2VdJywgLy9FZGl0IFRlc3QgRGV2aWNlXG4gICAgICAgICdtZW51IFthY3Rpb249ZGVsZXRlVGVzdERldmljZV0nIC8vRGVsZXRlIFRlc3QgRGV2aWNlXG4gICAgICBdXG4gICAgICBtSXRlbXMgPSBFeHQ0LkNvbXBvbmVudFF1ZXJ5LnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuXG4gICAgICBpZiAobUl0ZW1zKSB7XG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGxldCBtZSA9IHRoaXMsXG4gICAgICAgIHttZW51fSA9IG1lXG4gICAgICBpZiAobWUucmVuZGVyZWQpIHtcbiAgICAgICAgaWYgKG1lLnRvb2x0aXAgJiYgRXh0LnF1aWNrVGlwc0FjdGl2ZSAmJiBtZS5nZXRUaXBBdHRyKCkgIT0gJ3RpdGxlJykge1xuICAgICAgICAgIEV4dC50aXAuUXVpY2tUaXBNYW5hZ2VyLmdldFF1aWNrVGlwKCkuY2FuY2VsU2hvdyhtZS5idG5FbClcbiAgICAgICAgfVxuICAgICAgICBpZiAobWVudS5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIG1lbnUuaGlkZSgpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFmcm9tRXZlbnQgfHwgbWUuc2hvd0VtcHR5TWVudSB8fCBtZW51Lml0ZW1zLmdldENvdW50KCkgPiAwKSB7XG4gICAgICAgICAgbWVudS5zaG93QnkobWUuZWwsIG1lLm1lbnVBbGlnbiwgKCFFeHQuaXNTdHJpY3QgJiYgRXh0LmlzSUUpIHx8IEV4dC5pc0lFNiA/IFstMiwgLTJdIDogdW5kZWZpbmVkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBlZDogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgJiBBY3Rpb25zIE1lbnUgaW4gQUJNICYgQWRtaW4gU2VjdGlvbnMnKVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5jb250cm9sbGVyLmFibS5uYW1lZEFjY291bnQuRGFzaGJvYXJkLnByb3RvdHlwZS5sb2FkVG9vbEJhcicpKSB7XG4gICAgTWt0My5jb250cm9sbGVyLmFibS5uYW1lZEFjY291bnQuRGFzaGJvYXJkLnByb3RvdHlwZS5sb2FkVG9vbEJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgZm9yIEFCTSA+IE5hbWVkIEFjY291bnRzJylcbiAgICAgIGxldCBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgLy8gTmFtZWQgQWNjb3VudCBUb29sYmFyIEJ1dHRvbnNcbiAgICAgICAgICAnYWJtTmFtZWRBY2NvdW50VG9vbGJhciBbYWN0aW9uPWxpbmtQZW9wbGVdJyAvL0FkZCBQZW9wbGUgdG8gTmFtZWQgQWNjb3VudFxuICAgICAgICBdLFxuICAgICAgICBtSXRlbXMgPSBFeHQ0LkNvbXBvbmVudFF1ZXJ5LnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuXG4gICAgICBpZiAobUl0ZW1zKSB7XG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGxldCBjYW52YXMgPSB0aGlzLmdldENhbnZhcygpLFxuICAgICAgICB0b29sYmFyID0gY2FudmFzLmRvd24oJ2FibU5hbWVkQWNjb3VudFRvb2xiYXInKVxuXG4gICAgICB0b29sYmFyLmRvd24oJyNuZXdNZW51JykuaGlkZSgpXG4gICAgICB0b29sYmFyLmRvd24oJyNwZW9wbGVMaW5rJykuaGlkZSgpXG4gICAgICB0b29sYmFyLmRvd24oJyNkZWxldGVOYW1lZEFjY291bnQnKS5oaWRlKClcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBlZDogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgZm9yIEFCTSA+IE5hbWVkIEFjY291bnRzJylcbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuY29udHJvbGxlci5hYm0uYWNjb3VudExpc3QuRGFzaGJvYXJkLnByb3RvdHlwZS5sb2FkVG9vbEJhcicpKSB7XG4gICAgTWt0My5jb250cm9sbGVyLmFibS5hY2NvdW50TGlzdC5EYXNoYm9hcmQucHJvdG90eXBlLmxvYWRUb29sQmFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFRvb2xiYXIgQnV0dG9ucyBmb3IgQUJNID4gQWNjb3VudCBMaXN0cyA+IE5hbWVkIEFjY291bnRzJylcbiAgICAgIGxldCBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgLy8gQWNjb3VudCBCYXNlZCBNYXJrZXRpbmcgPiBBY2NvdW50IExpc3RzID4gTmFtZWQgQWNjb3VudCA+IFRvb2xiYXIgQnV0dG9uc1xuICAgICAgICAgICdhYm1BY2NvdW50TGlzdFRvb2xiYXIgW2FjdGlvbj1yZW1vdmVOYW1lZEFjY291bnRdJyAvL1JlbW92ZSBOYW1lZCBBY2NvdW50c1xuICAgICAgICBdLFxuICAgICAgICBtSXRlbXMgPSBFeHQ0LkNvbXBvbmVudFF1ZXJ5LnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuXG4gICAgICBpZiAobUl0ZW1zKSB7XG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uZGVzdHJveSgpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBsZXQgZGFzaGJvYXJkID0gdGhpcy5nZXREYXNoYm9hcmQoKSxcbiAgICAgICAgdG9vbGJhciA9IGRhc2hib2FyZC5xdWVyeSgnYWJtQWNjb3VudExpc3RUb29sYmFyJylcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b29sYmFyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvb2xiYXJbaV0uZG93bignI25ld01lbnUnKS5oaWRlKClcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBlZDogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgZm9yIEFCTSA+IEFjY291bnQgTGlzdHMgPiBOYW1lZCBBY2NvdW50cycpXG4gIH1cblxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIuc29jaWFsQXBwLlNvY2lhbEFwcC5wcm90b3R5cGUubG9hZFRvb2xiYXInKSkge1xuICAgIC8vIERpc2FibGUgTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBTb2NpYWwgQXBwID4gVG9vbGJhciBidXR0b25zICYgQWN0aW9ucyBtZW51XG4gICAgbGV0IHByZXZTb2NpYWxBcHBUb29sYmFyID0gTWt0My5jb250cm9sbGVyLnNvY2lhbEFwcC5Tb2NpYWxBcHAucHJvdG90eXBlLmxvYWRUb29sYmFyXG4gICAgTWt0My5jb250cm9sbGVyLnNvY2lhbEFwcC5Tb2NpYWxBcHAucHJvdG90eXBlLmxvYWRUb29sYmFyID0gZnVuY3Rpb24gKG1lbnUsIGF0dHIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgJiBBY3Rpb25zIE1lbnUgZm9yIE1hcmtldGluZyBBY3Rpdml0aWVzID4gU29jaWFsIEFwcHMnKVxuICAgICAgcHJldlNvY2lhbEFwcFRvb2xiYXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuXG4gICAgICBsZXQgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ3NvY2lhbEFwcFRvb2xiYXInLCBudWxsLCBudWxsLCB0aGlzKSxcbiAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICdzb2NpYWxBcHBUb29sYmFyIGNvbnRleHRNZW51IFthY3Rpb249YXBwcm92ZV0nLCAvL0FwcHJvdmVcbiAgICAgICAgICAnc29jaWFsQXBwVG9vbGJhciBjb250ZXh0TWVudSBbYWN0aW9uPWNsb25lXScsIC8vQ2xvbmVcbiAgICAgICAgICAnc29jaWFsQXBwVG9vbGJhciBjb250ZXh0TWVudSBbYWN0aW9uPWRlbGV0ZV0nLCAvL0RlbGV0ZVxuICAgICAgICAgICdzb2NpYWxBcHBUb29sYmFyIGNvbnRleHRNZW51IFthY3Rpb249YXBwcm92ZURyYWZ0XScgLy9BcHByb3ZlIERyYWZ0XG4gICAgICAgIF0sXG4gICAgICAgIG1JdGVtcyA9IEV4dDQuQ29tcG9uZW50UXVlcnkucXVlcnkobWVudUl0ZW1zLnRvU3RyaW5nKCkpXG5cbiAgICAgIGlmIChtSXRlbXMpIHtcbiAgICAgICAgbUl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaXRlbS5zZXREaXNhYmxlZChkaXNhYmxlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1lbnVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBlZDogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgJiBBY3Rpb25zIE1lbnUgZm9yIE1hcmtldGluZyBBY3Rpdml0aWVzID4gU29jaWFsIEFwcHMnKVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5jb250cm9sbGVyLm1vYmlsZVB1c2hOb3RpZmljYXRpb24uTW9iaWxlUHVzaE5vdGlmaWNhdGlvbi5wcm90b3R5cGUubG9hZFRvb2xiYXInKSkge1xuICAgIC8vIERpc2FibGUgTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBQdXNoIE5vdGlmaWNhdGlvbiA+IFRvb2xiYXIgYnV0dG9ucyAmIEFjdGlvbnMgbWVudVxuICAgIGxldCBwcmV2TW9iaWxlUHVzaE5vdGlmaWNhdGlvblRvb2xiYXIgPSBNa3QzLmNvbnRyb2xsZXIubW9iaWxlUHVzaE5vdGlmaWNhdGlvbi5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uLnByb3RvdHlwZS5sb2FkVG9vbGJhclxuICAgIE1rdDMuY29udHJvbGxlci5tb2JpbGVQdXNoTm90aWZpY2F0aW9uLk1vYmlsZVB1c2hOb3RpZmljYXRpb24ucHJvdG90eXBlLmxvYWRUb29sYmFyID0gZnVuY3Rpb24gKG1lbnUsIGF0dHIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgJiBBY3Rpb25zIE1lbnUgZm9yIE1hcmtldGluZyBBY3Rpdml0aWVzID4gUHVzaCBOb3RpZmljYXRpb25zJylcbiAgICAgIHByZXZNb2JpbGVQdXNoTm90aWZpY2F0aW9uVG9vbGJhci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICAgIGxldCBkaXNhYmxlID0gQVBQLmV2YWx1YXRlTWVudSgnbW9iaWxlUHVzaE5vdGlmaWNhdGlvbicsIG51bGwsIG51bGwsIHRoaXMpLFxuICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgJ21vYmlsZVB1c2hOb3RpZmljYXRpb24gY29udGV4dE1lbnUgW2FjdGlvbj1zZW5kU2FtcGxlXScsIC8vU2VuZCBTYW1wbGVcbiAgICAgICAgICAnbW9iaWxlUHVzaE5vdGlmaWNhdGlvbiBjb250ZXh0TWVudSBbYWN0aW9uPXVuYXBwcm92ZV0nLCAvL1VuYXBwcm92ZVxuICAgICAgICAgICdtb2JpbGVQdXNoTm90aWZpY2F0aW9uIGNvbnRleHRNZW51IFthY3Rpb249YXBwcm92ZV0nLCAvL0FwcHJvdmVcbiAgICAgICAgICAnbW9iaWxlUHVzaE5vdGlmaWNhdGlvbiBjb250ZXh0TWVudSBbYWN0aW9uPWNsb25lXScsIC8vQ2xvbmVcbiAgICAgICAgICAnbW9iaWxlUHVzaE5vdGlmaWNhdGlvbiBjb250ZXh0TWVudSBbYWN0aW9uPWRlbGV0ZV0nLCAvL0RlbGV0ZVxuICAgICAgICAgICdtb2JpbGVQdXNoTm90aWZpY2F0aW9uIGNvbnRleHRNZW51IFthY3Rpb249c2VuZERyYWZ0U2FtcGxlXScsIC8vU2VuZCBTYW1wbGUgb2YgRHJhZnRcbiAgICAgICAgICAnbW9iaWxlUHVzaE5vdGlmaWNhdGlvbiBjb250ZXh0TWVudSBbYWN0aW9uPWFwcHJvdmVEcmFmdF0nIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICBdLFxuICAgICAgICBtSXRlbXMgPSBFeHQ0LkNvbXBvbmVudFF1ZXJ5LnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuXG4gICAgICBpZiAobUl0ZW1zKSB7XG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0RGlzYWJsZWQoZGlzYWJsZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtZW51XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFNraXBwZWQ6IERpc2FibGUgVG9vbGJhciBCdXR0b25zICYgQWN0aW9ucyBNZW51IGZvciBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IFB1c2ggTm90aWZpY2F0aW9ucycpXG4gIH1cblxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIuaW5BcHBNZXNzYWdlLkluQXBwTWVzc2FnZS5wcm90b3R5cGUubG9hZFRvb2xiYXInKSkge1xuICAgIC8vIERpc2FibGUgTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBJbi1BcHAgTWVzc2FnZXMgPiBUb29sYmFyIGJ1dHRvbnMgJiBBY3Rpb25zIG1lbnVcbiAgICBsZXQgcHJldkluQXBwTWVzc2FnZVRvb2xiYXIgPSBNa3QzLmNvbnRyb2xsZXIuaW5BcHBNZXNzYWdlLkluQXBwTWVzc2FnZS5wcm90b3R5cGUubG9hZFRvb2xiYXJcbiAgICBNa3QzLmNvbnRyb2xsZXIuaW5BcHBNZXNzYWdlLkluQXBwTWVzc2FnZS5wcm90b3R5cGUubG9hZFRvb2xiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgVG9vbGJhciBCdXR0b25zICYgQWN0aW9ucyBNZW51IGZvciBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IEluLUFwcCBNZXNzYWdlcycpXG4gICAgICBwcmV2SW5BcHBNZXNzYWdlVG9vbGJhci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICAgIGxldCB0b29sYmFyID0gdGhpcy5nZXRUb29sYmFyKCksXG4gICAgICAgIGluQXBwTWVzc2FnZSA9IHRoaXMuZ2V0SW5BcHBNZXNzYWdlKCksXG4gICAgICAgIGFjdGlvbnNNZW51ID0gdG9vbGJhci5kb3duKCcuY29udGV4dE1lbnUnKSxcbiAgICAgICAgdG9vbGJhckNvbXBvbmVudHMgPSB0b29sYmFyLnF1ZXJ5KCdjb21wb25lbnQnKSB8fCBbXSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIGlsID0gdG9vbGJhckNvbXBvbmVudHMubGVuZ3RoLFxuICAgICAgICB0b29sYmFyQ29tcG9uZW50LFxuICAgICAgICB0ZXh0XG5cbiAgICAgIC8vIHNldCByZWNvcmRcbiAgICAgIGFjdGlvbnNNZW51LnJlY29yZCA9IGluQXBwTWVzc2FnZVxuXG4gICAgICAvLyB1cGRhdGUgdGV4dCBhbmQgaWNvbnNcbiAgICAgIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICB0b29sYmFyQ29tcG9uZW50ID0gdG9vbGJhckNvbXBvbmVudHNbaV1cblxuICAgICAgICAvLyB1cGRhdGUgaWNvbnNcbiAgICAgICAgaWYgKEV4dDQuaXNEZWZpbmVkKHRvb2xiYXJDb21wb25lbnQuaWNvbkNscykgJiYgRXh0NC5pc0Z1bmN0aW9uKHRvb2xiYXJDb21wb25lbnQuc2V0SWNvbkNscykpIHtcbiAgICAgICAgICB0b29sYmFyQ29tcG9uZW50LnNldEljb25DbHModG9vbGJhckNvbXBvbmVudC5pY29uQ2xzKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIHRleHRcbiAgICAgICAgaWYgKFxuICAgICAgICAgIChFeHQ0LmlzRGVmaW5lZCh0b29sYmFyQ29tcG9uZW50LnRleHQpIHx8IEV4dDQuaXNGdW5jdGlvbih0b29sYmFyQ29tcG9uZW50LmdldFRleHQpKSAmJlxuICAgICAgICAgIEV4dDQuaXNGdW5jdGlvbih0b29sYmFyQ29tcG9uZW50LnNldFRleHQpXG4gICAgICAgICkge1xuICAgICAgICAgIHRleHQgPSBFeHQ0LmlzRnVuY3Rpb24odG9vbGJhckNvbXBvbmVudC5nZXRUZXh0KSA/IHRvb2xiYXJDb21wb25lbnQuZ2V0VGV4dCgpIDogdG9vbGJhckNvbXBvbmVudC50ZXh0XG4gICAgICAgICAgdG9vbGJhckNvbXBvbmVudC5zZXRUZXh0KHRleHQpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGV0IGRpc2FibGUgPSBBUFAuZXZhbHVhdGVNZW51KCdpbkFwcE1lc3NhZ2UnLCBudWxsLCBudWxsLCB0aGlzKSxcbiAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICdpbkFwcE1lc3NhZ2UgY29udGV4dE1lbnUgW2FjdGlvbj1zZW5kU2FtcGxlXScsIC8vU2VuZCBTYW1wbGVcbiAgICAgICAgICAnaW5BcHBNZXNzYWdlIGNvbnRleHRNZW51IFthY3Rpb249dW5hcHByb3ZlXScsIC8vVW5hcHByb3ZlXG4gICAgICAgICAgJ2luQXBwTWVzc2FnZSBjb250ZXh0TWVudSBbYWN0aW9uPWFwcHJvdmVdJywgLy9BcHByb3ZlXG4gICAgICAgICAgJ2luQXBwTWVzc2FnZSBjb250ZXh0TWVudSBbYWN0aW9uPWNsb25lXScsIC8vQ2xvbmVcbiAgICAgICAgICAnaW5BcHBNZXNzYWdlIGNvbnRleHRNZW51IFthY3Rpb249ZGVsZXRlXScsIC8vRGVsZXRlXG4gICAgICAgICAgJ2luQXBwTWVzc2FnZSBjb250ZXh0TWVudSBbYWN0aW9uPXNlbmREcmFmdFNhbXBsZV0nLCAvL1NlbmQgU2FtcGxlIG9mIERyYWZ0XG4gICAgICAgICAgJ2luQXBwTWVzc2FnZSBjb250ZXh0TWVudSBbYWN0aW9uPWFwcHJvdmVEcmFmdF0nIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICBdLFxuICAgICAgICBtSXRlbXMgPSBFeHQ0LkNvbXBvbmVudFF1ZXJ5LnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuXG4gICAgICBpZiAobUl0ZW1zKSB7XG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0RGlzYWJsZWQoZGlzYWJsZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFNraXBwZWQ6IERpc2FibGUgVG9vbGJhciBCdXR0b25zICYgQWN0aW9ucyBNZW51IGZvciBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IEluLUFwcCBNZXNzYWdlcycpXG4gIH1cblxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIuc21zTWVzc2FnZS5TbXNNZXNzYWdlLnByb3RvdHlwZS5sb2FkVG9vbGJhcicpKSB7XG4gICAgLy8gRGlzYWJsZSBNYXJrZXRpbmcgbWVudUl0ZW1zQWN0aXZpdGllcyA+IFNNUyBNZXNzYWdlcyA+IFRvb2xiYXIgYnV0dG9ucyAmIEFjdGlvbnMgbWVudVxuICAgIGxldCBwcmV2U21zTWVzc2FnZVRvb2xiYXIgPSBNa3QzLmNvbnRyb2xsZXIuc21zTWVzc2FnZS5TbXNNZXNzYWdlLnByb3RvdHlwZS5sb2FkVG9vbGJhclxuICAgIE1rdDMuY29udHJvbGxlci5zbXNNZXNzYWdlLlNtc01lc3NhZ2UucHJvdG90eXBlLmxvYWRUb29sYmFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFRvb2xiYXIgQnV0dG9ucyAmIEFjdGlvbnMgTWVudSBmb3IgTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBTTVMgTWVzc2FnZXMnKVxuICAgICAgcHJldlNtc01lc3NhZ2VUb29sYmFyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuICAgICAgbGV0IHRvb2xiYXIgPSB0aGlzLmdldFRvb2xiYXIoKSxcbiAgICAgICAgc21zTWVzc2FnZSA9IHRoaXMuZ2V0U21zTWVzc2FnZSgpLFxuICAgICAgICBhY3Rpb25zTWVudSA9IHRvb2xiYXIuZG93bignLmNvbnRleHRNZW51JyksXG4gICAgICAgIHRvb2xiYXJDb21wb25lbnRzID0gdG9vbGJhci5xdWVyeSgnY29tcG9uZW50JykgfHwgW10sXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBpbCA9IHRvb2xiYXJDb21wb25lbnRzLmxlbmd0aCxcbiAgICAgICAgdG9vbGJhckNvbXBvbmVudCxcbiAgICAgICAgdGV4dFxuXG4gICAgICBhY3Rpb25zTWVudS5yZWNvcmQgPSBzbXNNZXNzYWdlXG5cbiAgICAgIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICB0b29sYmFyQ29tcG9uZW50ID0gdG9vbGJhckNvbXBvbmVudHNbaV1cblxuICAgICAgICBpZiAoRXh0NC5pc0RlZmluZWQodG9vbGJhckNvbXBvbmVudC5pY29uQ2xzKSAmJiBFeHQ0LmlzRnVuY3Rpb24odG9vbGJhckNvbXBvbmVudC5zZXRJY29uQ2xzKSkge1xuICAgICAgICAgIHRvb2xiYXJDb21wb25lbnQuc2V0SWNvbkNscyh0b29sYmFyQ29tcG9uZW50Lmljb25DbHMpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgKEV4dDQuaXNEZWZpbmVkKHRvb2xiYXJDb21wb25lbnQudGV4dCkgfHwgRXh0NC5pc0Z1bmN0aW9uKHRvb2xiYXJDb21wb25lbnQuZ2V0VGV4dCkpICYmXG4gICAgICAgICAgRXh0NC5pc0Z1bmN0aW9uKHRvb2xiYXJDb21wb25lbnQuc2V0VGV4dClcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGV4dCA9IEV4dDQuaXNGdW5jdGlvbih0b29sYmFyQ29tcG9uZW50LmdldFRleHQpID8gdG9vbGJhckNvbXBvbmVudC5nZXRUZXh0KCkgOiB0b29sYmFyQ29tcG9uZW50LnRleHRcbiAgICAgICAgICB0b29sYmFyQ29tcG9uZW50LnNldFRleHQodGV4dClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXQgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ3Ntc01lc3NhZ2UnLCBudWxsLCBudWxsLCB0aGlzKSxcbiAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICdzbXNNZXNzYWdlIGNvbnRleHRNZW51IFthY3Rpb249dW5hcHByb3ZlXScsIC8vVW5hcHByb3ZlXG4gICAgICAgICAgJ3Ntc01lc3NhZ2UgY29udGV4dE1lbnUgW2FjdGlvbj1hcHByb3ZlXScsIC8vQXBwcm92ZVxuICAgICAgICAgICdzbXNNZXNzYWdlIGNvbnRleHRNZW51IFthY3Rpb249Y2xvbmVdJywgLy9DbG9uZVxuICAgICAgICAgICdzbXNNZXNzYWdlIGNvbnRleHRNZW51IFthY3Rpb249ZGVsZXRlXScsIC8vRGVsZXRlXG4gICAgICAgICAgJ3Ntc01lc3NhZ2UgY29udGV4dE1lbnUgW2FjdGlvbj1hcHByb3ZlRHJhZnRdJyAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgXSxcbiAgICAgICAgbUl0ZW1zID0gRXh0NC5Db21wb25lbnRRdWVyeS5xdWVyeShtZW51SXRlbXMudG9TdHJpbmcoKSlcblxuICAgICAgaWYgKG1JdGVtcykge1xuICAgICAgICBtSXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKGRpc2FibGUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBTa2lwcGVkOiBEaXNhYmxlIFRvb2xiYXIgQnV0dG9ucyAmIEFjdGlvbnMgTWVudSBmb3IgTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBTTVMgTWVzc2FnZXMnKVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0NC5Db21wb25lbnQucHJvdG90eXBlLnNob3dBdCcpKSB7XG4gICAgLy8gRGlzYWJsZSBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IE51cnR1cmUgUHJvZ3JhbSA+IFN0cmVhbSAmIENvbnRlbnQgQWN0aW9ucyBtZW51c1xuICAgIEV4dDQuQ29tcG9uZW50LnByb3RvdHlwZS5zaG93QXQgPSBmdW5jdGlvbiAoeCwgeSwgYW5pbWF0ZSkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIENvbnRlbnQgJiBBY3Rpb25zIE1lbnVzIGZvciBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IE51cnR1cmUgUHJvZ3JhbSBTdHJlYW0nKVxuICAgICAgbGV0IG1lID0gdGhpc1xuICAgICAgaWYgKCFtZS5yZW5kZXJlZCAmJiAobWUuYXV0b1JlbmRlciB8fCBtZS5mbG9hdGluZykpIHtcbiAgICAgICAgbWUuZG9BdXRvUmVuZGVyKClcbiAgICAgICAgbWUuaGlkZGVuID0gdHJ1ZVxuICAgICAgfVxuICAgICAgaWYgKG1lLmZsb2F0aW5nKSB7XG4gICAgICAgIG1lLnNldFBvc2l0aW9uKHgsIHksIGFuaW1hdGUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZS5zZXRQYWdlUG9zaXRpb24oeCwgeSwgYW5pbWF0ZSlcbiAgICAgIH1cbiAgICAgIG1lLnNob3coKVxuXG4gICAgICBpZiAodHlwZW9mIE1rdENhbnZhcyAhPT0gJ3VuZGVmaW5lZCcgJiYgTWt0Q2FudmFzICYmIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSkge1xuICAgICAgICBsZXQgaWksXG4gICAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ2J1dHRvbicsIG51bGwsIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSwgbnVsbClcbiAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgbWUuaXRlbXMuaXRlbXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgc3dpdGNoIChtZS5pdGVtcy5pdGVtc1tpaV0uYWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IE51cnR1cmUgUHJvZ3JhbSA+IFN0cmVhbSBBY3Rpb25zXG4gICAgICAgICAgICBjYXNlICdjbG9uZSc6XG4gICAgICAgICAgICBjYXNlICdkZWxldGUnOlxuICAgICAgICAgICAgY2FzZSAnYXJjaGl2ZSc6XG4gICAgICAgICAgICBjYXNlICd1bmFyY2hpdmUnOlxuICAgICAgICAgICAgY2FzZSAnZW1haWxBcHByb3ZlRHJhZnQnOlxuICAgICAgICAgICAgY2FzZSAnbW9iaWxlUHVzaEFwcHJvdmUnOlxuICAgICAgICAgICAgY2FzZSAnaGlkZSc6XG4gICAgICAgICAgICBjYXNlICd1bmhpZGUnOlxuICAgICAgICAgICAgICBtZS5pdGVtcy5pdGVtc1tpaV0uc2V0RGlzYWJsZWQoZGlzYWJsZSlcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBpaSxcbiAgICAgICAgICBkaXNhYmxlID0gQVBQLmV2YWx1YXRlTWVudSgnYnV0dG9uJywgbnVsbCwgbnVsbCwgbnVsbClcbiAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgbWUuaXRlbXMuaXRlbXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgc3dpdGNoIChtZS5pdGVtcy5pdGVtc1tpaV0uYWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBBZG1pbiA+IE1hcmtldG8gQ3VzdG9tIEFjdGl2aXRpZXMvT2JqZWN0cyAmIE1vYmlsZSBBcHBzID4gQWN0aXZpdGllcy9PYmplY3RzICYgTW9iaWxlIEFwcHMgVHJlZSA+IFJpZ2h0LWNsaWNrIE1lbnVcbiAgICAgICAgICAgIGNhc2UgJ3B1Ymxpc2gnOlxuICAgICAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICAgIGNhc2UgJ3NlbmQnOlxuICAgICAgICAgICAgY2FzZSAndmVyaWZ5JzpcbiAgICAgICAgICAgICAgbWUuaXRlbXMuaXRlbXNbaWldLnNldERpc2FibGVkKGRpc2FibGUpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFNraXBwZWQ6IERpc2FibGUgQ29udGVudCAmIEFjdGlvbnMgTWVudXMgZm9yIE1hcmtldGluZyBBY3Rpdml0aWVzID4gTnVydHVyZSBQcm9ncmFtIFN0cmVhbScpXG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBvdmVycmlkZSB0aGUgZHJhZnQgZWRpdCBtZW51IGl0ZW1zIGluIGFsbCBhcmVhcy5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlRHJhZnRFZGl0cyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogRHJhZnQgRWRpdCBNZW51IEl0ZW1zJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0RHNNZW51JykpIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IE92ZXJyaWRlIERyYWZ0IEVkaXQgTWVudSBJdGVtcycpXG4gICAgbGV0IG9yaWdFeHRNZXNzYWdlQm94U2hvdyA9IEV4dC5NZXNzYWdlQm94LnNob3dcbiAgICBvcmlnRXh0NE1lc3NhZ2VCb3hTaG93ID0gRXh0NC5NZXNzYWdlQm94LnNob3dcbiAgICBvcmlnTWt0TWVzc2FnZVNob3cgPSBNa3RNZXNzYWdlLnNob3dcbiAgICA7KG9yaWdQYWdlRWRpdEhhbmRsZXIgPSBNa3REc01lbnUuZ2V0UGFnZU1lbnUoKS5nZXQoJ3BhZ2VFZGl0JykuaGFuZGxlciksXG4gICAgKG9yaWdQYWdlRHJhZnRFZGl0SGFuZGxlciA9IE1rdERzTWVudS5nZXRQYWdlTWVudSgpLmdldCgncGFnZURyYWZ0RWRpdCcpLmhhbmRsZXIpLFxuICAgIChvcmlnRW1haWxFZGl0SGFuZGxlciA9IE1rdERzTWVudS5nZXRFbWFpbE1lbnUoKS5nZXQoJ2VtYWlsRWRpdCcpLmhhbmRsZXIpLFxuICAgIChvcmlnRW1haWxEcmFmdEVkaXRIYW5kbGVyID0gTWt0RHNNZW51LmdldEVtYWlsTWVudSgpLmdldCgnZW1haWxEcmFmdEVkaXQnKS5oYW5kbGVyKVxuXG4gICAgTWt0RHNNZW51LmdldFBhZ2VNZW51KClcbiAgICAgIC5nZXQoJ3BhZ2VEcmFmdEVkaXQnKVxuICAgICAgLnNldEhhbmRsZXIoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGlmIChhdHRyICYmIGF0dHIuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBPdmVycmlkZSBEcmFmdCBFZGl0IE1lbnUgSXRlbXMgPiBMYW5kaW5nIFBhZ2UgRHJhZnQgRWRpdCcpXG4gICAgICAgICAgbGV0IHt0cmlnZ2VyZWRGcm9tfSA9IHRoaXMucGFyZW50TWVudSxcbiAgICAgICAgICAgIHt4dHJhfSA9IGVsLnBhcmVudE1lbnVcbiAgICAgICAgICBNa3QuYXBwLkRlc2lnblN0dWRpby5QYWdlcy5kaXNjYXJkRHJhZnQoe1xuICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogdHJpZ2dlcmVkRnJvbSxcbiAgICAgICAgICAgIHh0cmE6IHh0cmFcbiAgICAgICAgICB9KVxuICAgICAgICAgIGVsLnBhcmVudE1lbnUuaGlkZSh0cnVlKVxuICAgICAgICAgIEV4dC5NZXNzYWdlQm94LmhpZGUoKVxuICAgICAgICAgIE1rdC5hcHAuRGVzaWduU3R1ZGlvLlBhZ2VzLmVkaXRQYWdlRHJhZnQoe1xuICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogdHJpZ2dlcmVkRnJvbSxcbiAgICAgICAgICAgIHh0cmE6IHh0cmFcbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9yaWdQYWdlRHJhZnRFZGl0SGFuZGxlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAvLyBFbWFpbCBFZGl0XG4gICAgTWt0RHNNZW51LmdldEVtYWlsTWVudSgpXG4gICAgICAuZ2V0KCdlbWFpbEVkaXQnKVxuICAgICAgLnNldEhhbmRsZXIoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGlmIChhdHRyICYmIGF0dHIuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBPdmVycmlkZSBEcmFmdCBFZGl0IE1lbnUgSXRlbXMgPiBFbWFpbCBFZGl0JylcbiAgICAgICAgICBsZXQge3RyaWdnZXJlZEZyb219ID0gdGhpcy5wYXJlbnRNZW51LFxuICAgICAgICAgICAge3h0cmF9ID0gZWwucGFyZW50TWVudSxcbiAgICAgICAgICAgIG5ld0VsID0gdGhpcy5nZXRFbCgpXG4gICAgICAgICAgRXh0Lk1lc3NhZ2VCb3guc2hvdyA9IEV4dDQuTWVzc2FnZUJveC5zaG93ID0gTWt0TWVzc2FnZS5zaG93ID0gZnVuY3Rpb24gKCkge31cbiAgICAgICAgICBNa3QuYXBwLkRlc2lnblN0dWRpby5FbWFpbHMuZGlzY2FyZERyYWZ0KHtcbiAgICAgICAgICAgIHRyaWdnZXJlZEZyb206IHRyaWdnZXJlZEZyb20sXG4gICAgICAgICAgICB4dHJhOiB4dHJhXG4gICAgICAgICAgfSlcbiAgICAgICAgICBlbC5wYXJlbnRNZW51LmhpZGUodHJ1ZSlcbiAgICAgICAgICBNa3QuYXBwLkRlc2lnblN0dWRpby5FbWFpbHMuZWRpdERyYWZ0KHtcbiAgICAgICAgICAgIHRyaWdnZXJlZEZyb206IHRyaWdnZXJlZEZyb20sXG4gICAgICAgICAgICB4dHJhOiB4dHJhLFxuICAgICAgICAgICAgZWw6IG5ld0VsXG4gICAgICAgICAgfSlcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBSZXN0b3Jpbmc6IFN5c3RlbSBNZXNzYWdlcycpXG4gICAgICAgICAgICBFeHQuTWVzc2FnZUJveC5zaG93ID0gb3JpZ0V4dE1lc3NhZ2VCb3hTaG93XG4gICAgICAgICAgICBFeHQ0Lk1lc3NhZ2VCb3guc2hvdyA9IG9yaWdFeHQ0TWVzc2FnZUJveFNob3dcbiAgICAgICAgICAgIE1rdE1lc3NhZ2Uuc2hvdyA9IG9yaWdNa3RNZXNzYWdlU2hvd1xuICAgICAgICAgIH0sIDUwMDApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3JpZ0VtYWlsRWRpdEhhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIC8vIEVtYWlsIERyYWZ0IEVkaXRcbiAgICBNa3REc01lbnUuZ2V0RW1haWxNZW51KClcbiAgICAgIC5nZXQoJ2VtYWlsRHJhZnRFZGl0JylcbiAgICAgIC5zZXRIYW5kbGVyKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBpZiAoYXR0ciAmJiBhdHRyLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogT3ZlcnJpZGUgRHJhZnQgRWRpdCBNZW51IEl0ZW1zID4gRW1haWwgRHJhZnQgRWRpdCcpXG4gICAgICAgICAgbGV0IHt0cmlnZ2VyZWRGcm9tfSA9IHRoaXMucGFyZW50TWVudSxcbiAgICAgICAgICAgIHt4dHJhfSA9IGVsLnBhcmVudE1lbnUsXG4gICAgICAgICAgICBuZXdFbCA9IHRoaXMuZ2V0RWwoKVxuICAgICAgICAgIE1rdC5hcHAuRGVzaWduU3R1ZGlvLkVtYWlscy5kaXNjYXJkRHJhZnQoe1xuICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogdHJpZ2dlcmVkRnJvbSxcbiAgICAgICAgICAgIHh0cmE6IHh0cmFcbiAgICAgICAgICB9KVxuICAgICAgICAgIGVsLnBhcmVudE1lbnUuaGlkZSh0cnVlKVxuICAgICAgICAgIE1rdC5hcHAuRGVzaWduU3R1ZGlvLkVtYWlscy5lZGl0RHJhZnQoe1xuICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogdHJpZ2dlcmVkRnJvbSxcbiAgICAgICAgICAgIHh0cmE6IHh0cmEsXG4gICAgICAgICAgICBlbDogbmV3RWxcbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9yaWdFbWFpbERyYWZ0RWRpdEhhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9KVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFNraXBwaW5nOiBPdmVycmlkZSBEcmFmdCBFZGl0IE1lbnUgSXRlbXMnKVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gZGlzYWJsZXMgb3IgaGlkZXMgVG9vbGJhciBpdGVtcyBmb3IgYWxsIGFzc2V0IHR5cGVzIGluIGFsbCBhcmVhcy5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLmhpZGVUb29sYmFySXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEhpZGluZzogVG9vbGJhciBJdGVtcycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dC5sYXlvdXQuQ29udGFpbmVyTGF5b3V0LnByb3RvdHlwZS5yZW5kZXJJdGVtJykpIHtcbiAgICAvLyBEaXNhYmxlIEFMTCBhcmVhcyA+IEFMTCBhc3NldHMgPiBBTEwgVG9vbGJhciBpdGVtcyBleGNlcHQgZm9yIFNtYXJ0IENhbXBhaWducywgU21hcnQgTGlzdHMsIExpc3RzLCBTb2NpYWwgQXBwcywgYW5kIFB1c2ggTm90aWZpY2F0aW9uc1xuICAgIEV4dC5sYXlvdXQuQ29udGFpbmVyTGF5b3V0LnByb3RvdHlwZS5yZW5kZXJJdGVtID0gZnVuY3Rpb24gKGMsIHBvc2l0aW9uLCB0YXJnZXQpIHtcbiAgICAgIGlmIChjKSB7XG4gICAgICAgIGlmICghYy5yZW5kZXJlZCkge1xuICAgICAgICAgIGMucmVuZGVyKHRhcmdldCwgcG9zaXRpb24pXG4gICAgICAgICAgdGhpcy5jb25maWd1cmVJdGVtKGMsIHBvc2l0aW9uKVxuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLmlzVmFsaWRQYXJlbnQoYywgdGFyZ2V0KSkge1xuICAgICAgICAgIGlmIChFeHQuaXNOdW1iZXIocG9zaXRpb24pKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRhcmdldC5kb20uY2hpbGROb2Rlc1twb3NpdGlvbl1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0YXJnZXQuZG9tLmluc2VydEJlZm9yZShjLmdldFBvc2l0aW9uRWwoKS5kb20sIHBvc2l0aW9uIHx8IG51bGwpXG4gICAgICAgICAgYy5jb250YWluZXIgPSB0YXJnZXRcbiAgICAgICAgICB0aGlzLmNvbmZpZ3VyZUl0ZW0oYywgcG9zaXRpb24pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBjICE9PSAndW5kZWZpbmVkJyAmJiBjICYmIGMudG9wVG9vbGJhciAmJiBjLnRvcFRvb2xiYXIuaXRlbXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFRvb2xiYXIgaXRlbXMgZm9yIEFMTCBpbiBBTEwnKVxuICAgICAgICBsZXQgb3JpZ0V4dE1lc3NhZ2VCb3hTaG93ID0gRXh0Lk1lc3NhZ2VCb3guc2hvdyxcbiAgICAgICAgICBvcmlnRXh0NE1lc3NhZ2VCb3hTaG93ID0gRXh0NC5NZXNzYWdlQm94LnNob3csXG4gICAgICAgICAgb3JpZ01rdE1lc3NhZ2VTaG93ID0gTWt0TWVzc2FnZS5zaG93LFxuICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgY2FudmFzID0gTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLFxuICAgICAgICAgIGRpc2FibGUgPSBBUFAuZXZhbHVhdGVNZW51KCdidXR0b24nLCBudWxsLCBjYW52YXMsIG51bGwpLFxuICAgICAgICAgIGl0ZW1zVG9IaWRlID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2RlbGV0ZUl0ZW0nLCAvL0RlbGV0ZVxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdkZWxldGVTdWJzY3JpcHRpb25fYXR4Q2FudmFzU3Vic2NyaXB0aW9ucycsIC8vRGVsZXRlIFN1YnNjcmlwdGlvblxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEdsb2JhbCA+IEZvcm1cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdmb3JtRWRpdF9sYW5kaW5nRk9EZXRhaWwnLCAvL0VkaXQgRm9ybVxuICAgICAgICAgICAgICBhY3Rpb246ICdoYW5kbGVyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEdsb2JhbCA+IExhbmRpbmcgUGFnZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ3BhZ2VFZGl0X2xhbmRpbmdMUERldGFpbCcsIC8vRWRpdCBEcmFmdFxuICAgICAgICAgICAgICBhY3Rpb246ICdoYW5kbGVyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEdsb2JhbCA+IEVtYWlsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZW1haWxFZGl0X2xhbmRpbmdFTURldGFpbCcsIC8vRWRpdCBEcmFmdFxuICAgICAgICAgICAgICBhY3Rpb246ICdoYW5kbGVyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdnb3RvRGVsaXZlcmFiaWxpdHlfbGFuZGluZ0VNRGV0YWlsJywgLy9EZWxpdmVyYWJpbGl0eSBUb29sc1xuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzID4gUHJvZ3JhbXMgJiBGb2xkZXJzID4gTXkgVG9rZW5zXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZGVsZXRlQ3VzdG9tVG9rZW4nLCAvL0RlbGV0ZSBUb2tlblxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzID4gUHJvZ3JhbXMgPiBNZW1iZXJzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnaW1wb3J0TWVtYmVycycsIC8vSW1wb3J0IE1lbWJlcnNcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0RGlzYWJsZWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2ltcG9ydFRlbXBsYXRlX2xhbmRpbmdDYW52YXNUTScsIC8vSW1wb3J0IFRlbXBsYXRlXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldERpc2FibGVkJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdpbXBvcnRUZW1wbGF0ZV9sYW5kaW5nVE1EZXRhaWwnLCAvL0ltcG9ydCBUZW1wbGF0ZVxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXREaXNhYmxlZCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZ290b0RlbGl2ZXJhYmlsaXR5X2xhbmRpbmdDYW52YXNFTScsIC8vRGVsaXZlcmFiaWxpdHkgVG9vbHNcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBEZXNpZ24gU3R1ZGlvID4gSW1hZ2VzIGFuZCBGaWxlc1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2ltYWdlVXBsb2FkX2xhbmRpbmdDYW52YXNJTScsIC8vVXBsb2FkIEltYWdlIG9yIEZpbGVcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0RGlzYWJsZWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2ltYWdlUmVwbGFjZV9sYW5kaW5nQ2FudmFzSU0nLCAvL1JlcGxhY2UgSW1hZ2Ugb3IgRmlsZVxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdpbWFnZVVwbG9hZF9sYW5kaW5nSU1EZXRhaWwnLCAvL1VwbG9hZCBJbWFnZSBvciBGaWxlXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldERpc2FibGVkJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdpbWFnZVJlcGxhY2VfbGFuZGluZ0lNRGV0YWlsJywgLy9SZXBsYWNlIEltYWdlIG9yIEZpbGVcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBBbmFseXRpY3MgPiBNb2RlbFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2VkaXREcmFmdF9yY21DYW52YXNPdmVydmlldycsIC8vRWRpdCBEcmFmdFxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdlZGl0TGljZW5zZXMnLCAvL0lzc3VlIExpY2Vuc2VcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZGVsZXRlVXNlcicsIC8vRGVsZXRlIFVzZXJcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAncmVzZXRQYXNzd29yZCcsIC8vUmVzZXQgUGFzc3dvcmRcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZGVsZXRlUm9sZScsIC8vRGVsZXRlIFJvbGVcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZGVsZXRlWm9uZScsIC8vRGVsZXRlIFdvcmtzcGFjZVxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdkZWxldGVQYXJ0aXRpb24nLCAvL0RlbGV0ZSBMZWFkIFBhcnRpdGlvblxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdkZWxldGVEb21haW4nLCAvL0RlbGV0ZSBEb21haW5cbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZGtpbURldGFpbHMnLCAvL0RLSU0gRGV0YWlsc1xuICAgICAgICAgICAgICBhY3Rpb246ICdzZXREaXNhYmxlZCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHRleHQ6ICdOZXcgQ3VzdG9tIEZpZWxkJywgLy9OZXcgQ3VzdG9tIEZpZWxkXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldERpc2FibGVkJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEFkbWluID4gU2FsZXNmb3JjZSBPYmplY3QgU3luY1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ3JlZnJlc2hDYWRTZmRjT2JqZWN0U3luYycsIC8vUmVmcmVzaCBTY2hlbWFcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0RGlzYWJsZWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQWRtaW4gPiBTYWxlc2ZvcmNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZW5hYmxlU3luYycsIC8vRW5hYmxlL0Rpc2FibGUgU3luY1xuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdyZXZva2VMaWNlbnNlQ2FkTGlzQWRtaW4nLCAvL1Jldm9rZSBMaWNlbnNlXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ3Jlc2VuZExpY2Vuc2VDYWRMaXNBZG1pbicsIC8vUmVzZW5kIEludml0YXRpb25cbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnY29uZmlnQWRkaW5DYWRMaXNBZG1pbicsIC8vQ29uZmlnIEFkZC1pblxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEFkbWluID4gTGFuZGluZyBQYWdlcyA+IFJ1bGVzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHRleHQ6ICdSdWxlcyBBY3Rpb25zJywgLy9SdWxlcyBBY3Rpb25zXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2RlbGV0ZVJ1bGUnLCAvL0RlbGV0ZSBSdWxlXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2xhdW5jaHBvaW50QWN0aW9ucycsIC8vU2VydmljZSBBY3Rpb25zXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQWRtaW4gPiBSZXZlbnVlIEN5Y2xlIEFuYWx5dGljcyA+IEN1c3RvbSBGaWVsZCBTeW5jXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnY2FkQ2hhbmdlQnV0dG9uJywgLy9FZGl0IFN5bmMgT3B0aW9uXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuXG4gICAgICAgIGl0ZW1zVG9IaWRlLmZvckVhY2goZnVuY3Rpb24gKGl0ZW1Ub0hpZGUpIHtcbiAgICAgICAgICBpZiAoaXRlbVRvSGlkZS5pZCkge1xuICAgICAgICAgICAgaXRlbSA9IGMudG9wVG9vbGJhci5pdGVtcy5nZXQoaXRlbVRvSGlkZS5pZClcbiAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW1Ub0hpZGUudGV4dCkge1xuICAgICAgICAgICAgaXRlbSA9IGMudG9wVG9vbGJhci5maW5kKCd0ZXh0JywgaXRlbVRvSGlkZS50ZXh0KVswXVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaWYgKGl0ZW1Ub0hpZGUuaWQgPT0gJ2dvdG9EZWxpdmVyYWJpbGl0eV9sYW5kaW5nRU1EZXRhaWwnKSB7XG4gICAgICAgICAgICAgIGl0ZW0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbVRvSGlkZS5hY3Rpb24gPT0gJ3NldFZpc2libGUnKSB7XG4gICAgICAgICAgICAgIGl0ZW0uc2V0VmlzaWJsZSghZGlzYWJsZSlcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbVRvSGlkZS5hY3Rpb24gPT0gJ3NldERpc2FibGVkJykge1xuICAgICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKGRpc2FibGUpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAoaXRlbVRvSGlkZS5pZCkge1xuICAgICAgICAgICAgICBjYXNlICdwYWdlRWRpdF9sYW5kaW5nTFBEZXRhaWwnOlxuICAgICAgICAgICAgICAgIHZhciBvcmlnSGFuZGxlciA9IGl0ZW0uaGFuZGxlclxuICAgICAgICAgICAgICAgIGl0ZW0uc2V0SGFuZGxlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoYXR0ciAmJiBhdHRyLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IE92ZXJyaWRlIEVkaXQgRHJhZnQgVG9vbGJhciBCdXR0b24gPiBMYW5kaW5nIFBhZ2UnKVxuICAgICAgICAgICAgICAgICAgICBsZXQgZGlzY2FyZE1zZyA9IEV4dC5NZXNzYWdlQm94LnNob3coe1xuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnTWFya2V0b0xpdmUnLFxuICAgICAgICAgICAgICAgICAgICAgIG1zZzogJ0Rpc2NhcmRpbmcgRHJhZnQnLFxuICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICB3YWl0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMjcwLFxuICAgICAgICAgICAgICAgICAgICAgIGNsb3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIE1rdC5hcHAuRGVzaWduU3R1ZGlvLlBhZ2VzLmRpc2NhcmREcmFmdCh7XG4gICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgICAgeHRyYTogYXR0clxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBkaXNjYXJkTXNnLmhpZGUoKVxuICAgICAgICAgICAgICAgICAgICBNa3QuYXBwLkRlc2lnblN0dWRpby5QYWdlcy5lZGl0UGFnZSh7XG4gICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgICAgZWw6IHRoaXMuZ2V0RWwoKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ0hhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnZW1haWxFZGl0X2xhbmRpbmdFTURldGFpbCc6XG4gICAgICAgICAgICAgICAgdmFyIG9yaWdIYW5kbGVyID0gaXRlbS5oYW5kbGVyXG4gICAgICAgICAgICAgICAgaXRlbS5zZXRIYW5kbGVyKGZ1bmN0aW9uIChidXR0b24sIGUpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChhdHRyICYmIGF0dHIuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogT3ZlcnJpZGUgRWRpdCBEcmFmdCBUb29sYmFyIEJ1dHRvbiA+IEVtYWlsJylcbiAgICAgICAgICAgICAgICAgICAgRXh0Lk1lc3NhZ2VCb3guc2hvdyA9IEV4dDQuTWVzc2FnZUJveC5zaG93ID0gTWt0TWVzc2FnZS5zaG93ID0gZnVuY3Rpb24gKCkge31cbiAgICAgICAgICAgICAgICAgICAgTWt0LmFwcC5EZXNpZ25TdHVkaW8uRW1haWxzLmRpc2NhcmREcmFmdCh7XG4gICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgICAgeHRyYTogYXR0cixcbiAgICAgICAgICAgICAgICAgICAgICBlbDogdGhpcy5nZXRFbCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIE1rdC5hcHAuRGVzaWduU3R1ZGlvLkVtYWlscy5lZGl0RHJhZnQoe1xuICAgICAgICAgICAgICAgICAgICAgIHRyaWdnZXJlZEZyb206ICdidXR0b24nLFxuICAgICAgICAgICAgICAgICAgICAgIHBhbmVsSWQ6IGF0dHIucGFuZWxJZFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gUmVzdG9yaW5nOiBTeXN0ZW0gTWVzc2FnZXMnKVxuICAgICAgICAgICAgICAgICAgICAgIEV4dC5NZXNzYWdlQm94LnNob3cgPSBvcmlnRXh0TWVzc2FnZUJveFNob3dcbiAgICAgICAgICAgICAgICAgICAgICBFeHQ0Lk1lc3NhZ2VCb3guc2hvdyA9IG9yaWdFeHQ0TWVzc2FnZUJveFNob3dcbiAgICAgICAgICAgICAgICAgICAgICBNa3RNZXNzYWdlLnNob3cgPSBvcmlnTWt0TWVzc2FnZVNob3dcbiAgICAgICAgICAgICAgICAgICAgfSwgNTAwMClcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9yaWdIYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIGRpc2FibGVzIG9yIGhpZGVzIHRvZ2dsZWQgVG9vbGJhciBpdGVtcyBzdWNoIGFzIGluIEFkbWluXG4gKiAgQHBhcmFtIHtBcnJheX0gLSBBbiBhcnJheSBvZiBvYmplY3RzIHdoaWNoIGNvbnRhaW4gdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGVzOlxuICogICAgICAgICAgICAgICAgICAgaWQgLSBJRCBvZiB0aGUgaXRlbSB0byBkaXNhYmxlXG4gKiAgICAgICAgICAgICAgICAgICAgT1JcbiAqICAgICAgICAgICAgICAgICAgIHRleHQgLSBuYW1lIG9mIHRoZSBpdGVtIHRvIGRpc2FibGVcbiAqICAgICAgICAgICAgICAgICAgIGFjdGlvbiAtIGFjdGlvbiB0byB0YWtlIG9uIHRoZSBpdGVtIChzZXRWaXNpc2JsZSwgc2V0RGlzYWJsZWQpXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5oaWRlT3RoZXJUb29sYmFySXRlbXMgPSBmdW5jdGlvbiAoaXRlbXNUb0hpZGUpIHtcbiAgbGV0IGlzVG9wVG9vbGJhckFjdGl2ZSA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gSGlkaW5nOiBPdGhlciBUb29sYmFyIEl0ZW1zJylcbiAgICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RDYW52YXMuZ2V0QWN0aXZlVGFiJykgJiYgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpICYmIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5nZXRUb3BUb29sYmFyKCkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogSGlkaW5nIE90aGVyIFRvb2xiYXIgSXRlbXMnKVxuICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNUb3BUb29sYmFyQWN0aXZlKVxuICAgICAgbGV0IHRvcFRvb2xiYXIgPSBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZ2V0VG9wVG9vbGJhcigpXG4gICAgICBpdGVtc1RvSGlkZS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtVG9IaWRlKSB7XG4gICAgICAgIGlmIChpdGVtVG9IaWRlLmlkKSB7XG4gICAgICAgICAgaXRlbSA9IHRvcFRvb2xiYXIuaXRlbXMuZ2V0KGl0ZW1Ub0hpZGUuaWQpXG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbVRvSGlkZS50ZXh0KSB7XG4gICAgICAgICAgaXRlbSA9IHRvcFRvb2xiYXIuZmluZCgndGV4dCcsIGl0ZW1Ub0hpZGUudGV4dClbMF1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgIGlmIChpdGVtVG9IaWRlLmFjdGlvbiA9PSAnc2V0VmlzaWJsZScpIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW1Ub0hpZGUuYWN0aW9uID09ICdzZXREaXNhYmxlZCcpIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9LCAwKVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIGRpc2FibGVzIHNhdmluZyBmb3IgUmV2ZW51ZSBDeWNsZSBNb2RlbHMgYW5kIGlzc3VlcyBhIHRyYWNraW5nXG4gKiAgcmVxdWVzdCB0byBIZWFwIEFuYWx5dGljcy5cbiAqICBAcGFyYW0ge1N0cmluZ30gYXNzZXRUeXBlIC0gQXNzZXQgdHlwZSAocmVwb3J0LCBtb2RlbClcbiAqICBAcGFyYW0ge1N0cmluZ30gbW9kZSAtIE1vZGUgdmlldyAoZWRpdCwgcHJldmlldylcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLmRpc2FibGVBbmFseXRpY3NTYXZpbmcgPSBmdW5jdGlvbiAoYXNzZXRUeXBlLCBtb2RlKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogQW5hbHl0aWNzIFNhdmluZyBmb3IgJyArIGFzc2V0VHlwZSlcbiAgbGV0IGlzQW5hbHl0aWNzQXNzZXRcblxuICBpc0FuYWx5dGljc0Fzc2V0ID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoXG4gICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdENhbnZhcy5nZXRBY3RpdmVUYWInKSAmJlxuICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpICYmXG4gICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnICYmXG4gICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnLmFjY2Vzc1pvbmVJZFxuICAgICkge1xuICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNBbmFseXRpY3NBc3NldClcblxuICAgICAgbGV0IGFzc2V0Tm9kZSA9IE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcsXG4gICAgICAgIGhlYXBFdmVudCA9IHtcbiAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICBhc3NldE5hbWU6ICcnLFxuICAgICAgICAgIGFzc2V0VHlwZTogYXNzZXROb2RlLmNvbXBUeXBlLFxuICAgICAgICAgIGFzc2V0SWQ6IGFzc2V0Tm9kZS5leHBOb2RlSWQsXG4gICAgICAgICAgd29ya3NwYWNlSWQ6IGFzc2V0Tm9kZS5hY2Nlc3Nab25lSWQsXG4gICAgICAgICAgd29ya3NwYWNlTmFtZTogJydcbiAgICAgICAgfSxcbiAgICAgICAgdGl0bGVSZXBsYWNlUmVnZXggPSBuZXcgUmVnRXhwKCdcXFxcKFteXFxcXCldK1xcXFwpJCcpXG5cbiAgICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgICBjYXNlICdlZGl0JzpcbiAgICAgICAgICBBUFAuZGlzYWJsZVNhdmluZygpXG4gICAgICAgICAgQVBQLmRpc2FibGVNZW51cygpXG4gICAgICAgICAgQVBQLmhpZGVUb29sYmFySXRlbXMoKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgICBoZWFwRXZlbnQuYXNzZXRBcmVhID0gJ0VkaXRvcidcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdwcmV2aWV3JzpcbiAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgICAgaGVhcEV2ZW50LmFzc2V0QXJlYSA9ICdQcmV2aWV3ZXInXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBBUFAuZGlzYWJsZVNhdmluZygpXG4gICAgICAgICAgQVBQLmRpc2FibGVNZW51cygpXG4gICAgICAgICAgQVBQLmhpZGVUb29sYmFySXRlbXMoKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUhhcm1mdWxTYXZlQnV0dG9ucygpXG4gICAgICAgICAgaGVhcEV2ZW50LmFzc2V0QXJlYSA9ICdGdWxsIFNjcmVlbidcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChhc3NldFR5cGUpIHtcbiAgICAgICAgY2FzZSAncmVwb3J0JzpcbiAgICAgICAgICBoZWFwRXZlbnQuYXNzZXROYW1lID0gYXNzZXROb2RlLnRpdGxlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnbW9kZWwnOlxuICAgICAgICAgIGhlYXBFdmVudC5hc3NldE5hbWUgPSBhc3NldE5vZGUuc2F0ZWxsaXRlVGl0bGVcbiAgICAgICAgICBpZiAoaGVhcEV2ZW50LmFzc2V0TmFtZS5zZWFyY2godGl0bGVSZXBsYWNlUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBoZWFwRXZlbnQuYXNzZXROYW1lID0gaGVhcEV2ZW50LmFzc2V0TmFtZS5yZXBsYWNlKHRpdGxlUmVwbGFjZVJlZ2V4LCAnJykudHJpbVJpZ2h0KClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaGVhcEV2ZW50LmFzc2V0TmFtZS5zZWFyY2goL1wiLykgIT0gLTEpIHtcbiAgICAgICAgICAgIGhlYXBFdmVudC5hc3NldE5hbWUgPSBoZWFwRXZlbnQuYXNzZXROYW1lLnJlcGxhY2UoL1wiL2csICcnKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBpZiAoaGVhcEV2ZW50LmFzc2V0VHlwZS5jaGFyQXQoMCkuc2VhcmNoKC9bYS16XS8pICE9IC0xKSB7XG4gICAgICAgIGxldCBmaXJzdENoYXIgPSBoZWFwRXZlbnQuYXNzZXRUeXBlLmNoYXJBdCgwKVxuXG4gICAgICAgIGhlYXBFdmVudC5hc3NldFR5cGUgPSBmaXJzdENoYXIudG9VcHBlckNhc2UoKSArIGhlYXBFdmVudC5hc3NldFR5cGUuc2xpY2UoMSlcbiAgICAgIH1cblxuICAgICAgaGVhcEV2ZW50LndvcmtzcGFjZU5hbWUgPSBBUFAuZ2V0V29ya3NwYWNlTmFtZShhc3NldE5vZGUuYWNjZXNzWm9uZUlkKVxuXG4gICAgICBpZiAoYXNzZXROb2RlLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkge1xuICAgICAgICBoZWFwRXZlbnQubmFtZSA9IGhlYXBFdmVudC53b3Jrc3BhY2VOYW1lXG4gICAgICB9IGVsc2UgaWYgKGFzc2V0Tm9kZS5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgaGVhcEV2ZW50Lm5hbWUgPSBoZWFwRXZlbnQud29ya3NwYWNlTmFtZVxuICAgICAgICBoZWFwRXZlbnQudXNlckZvbGRlciA9IHVzZXJOYW1lXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoZWFwRXZlbnQubmFtZSA9IG1rdG9PdGhlcldvcmtzcGFjZU5hbWVcbiAgICAgIH1cblxuICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCBoZWFwRXZlbnQpXG4gICAgfVxuICB9LCAwKVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIGRpc2FibGVzIHNhdmluZyBmb3IgYWxsIGFzc2V0IHR5cGVzIHdpdGhpbiB0aGUgRGVzaWduZXJzIGVkaXQgbW9kZVxuICogIGFuZCBkaXNhYmxlcyB0aGUgaGFybWZ1bCB0b29sYmFyIG1lbnUgaXRlbXMgYW5kIGJ1dHRvbnMgaW4gYm90aCBlZGl0IGFuZCBwcmV2aWV3XG4gKiAgbW9kZXMuIEl0IGFsc28gaXNzdWVzIGEgdHJhY2tpbmcgcmVxdWVzdCB0byBIZWFwIEFuYWx5dGljcy5cbiAqICBAcGFyYW0ge1N0cmluZ30gYXNzZXRUeXBlIC0gQXNzZXQgdHlwZSAobGFuZGluZ1BhZ2UsIGVtYWlsLCBmb3JtLCBwdXNoTm90aWZpY2F0aW9uLFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbkFwcE1lc3NhZ2UsIHNtc01lc3NhZ2UsIHNvY2lhbEFwcCwgYWJUZXN0KVxuICogIEBwYXJhbSB7U3RyaW5nfSBtb2RlIC0gTW9kZSB2aWV3IChlZGl0LCBwcmV2aWV3KVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nID0gZnVuY3Rpb24gKGFzc2V0VHlwZSwgbW9kZSkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IERlc2lnbmVyIChFZGl0L1ByZXZpZXcpIFNhdmluZyAmIFRvb2xiYXIgTWVudXMgZm9yICcgKyBhc3NldFR5cGUpXG4gIGxldCBpc0FwcENvbnRyb2xsZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCcpKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0FwcENvbnRyb2xsZXIpXG4gICAgICBsZXQgZGlzYWJsZURlc2lnbmVyQXNzZXQsIGFzc2V0Tm9kZSwgbWVudUl0ZW1zXG4gICAgICBkaXNhYmxlRGVzaWduZXJBc3NldCA9IGZ1bmN0aW9uIChhc3NldE5vZGUsIG1lbnVJdGVtcywgZGlzYWJsZUZ1bmMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxpbmcgRGVzaWduZXIgKEVkaXQvUHJldmlldyknKVxuICAgICAgICBsZXQgaGVhcEV2ZW50ID0ge1xuICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgIGFzc2V0TmFtZTogJycsXG4gICAgICAgICAgYXNzZXRUeXBlOiBhc3NldE5vZGUuY29tcFR5cGUsXG4gICAgICAgICAgYXNzZXRJZDogYXNzZXROb2RlLmlkLFxuICAgICAgICAgIHdvcmtzcGFjZUlkOiBhc3NldE5vZGUuYWNjZXNzWm9uZUlkLFxuICAgICAgICAgIHdvcmtzcGFjZU5hbWU6ICcnXG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgICAgICBjYXNlICdlZGl0JzpcbiAgICAgICAgICAgIGhlYXBFdmVudC5hc3NldEFyZWEgPSAnRWRpdG9yJ1xuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlICdwcmV2aWV3JzpcbiAgICAgICAgICAgIGhlYXBFdmVudC5hc3NldEFyZWEgPSAnUHJldmlld2VyJ1xuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaGVhcEV2ZW50LmFzc2V0QXJlYSA9ICdEZXNpZ25lcidcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cblxuICAgICAgICBoZWFwRXZlbnQud29ya3NwYWNlTmFtZSA9IEFQUC5nZXRXb3Jrc3BhY2VOYW1lKGFzc2V0Tm9kZS5hY2Nlc3Nab25lSWQpXG5cbiAgICAgICAgaWYgKGFzc2V0Tm9kZS5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICBoZWFwRXZlbnQubmFtZSA9IGhlYXBFdmVudC53b3Jrc3BhY2VOYW1lXG4gICAgICAgIH0gZWxzZSBpZiAoYXNzZXROb2RlLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgIGhlYXBFdmVudC5uYW1lID0gaGVhcEV2ZW50LndvcmtzcGFjZU5hbWVcbiAgICAgICAgICBoZWFwRXZlbnQudXNlckZvbGRlciA9IHVzZXJOYW1lXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaGVhcEV2ZW50Lm5hbWUgPSBta3RvT3RoZXJXb3Jrc3BhY2VOYW1lXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXNzZXROb2RlLnRleHQuc2VhcmNoKCcuJykgIT0gLTEpIHtcbiAgICAgICAgICBoZWFwRXZlbnQuYXNzZXROYW1lID0gYXNzZXROb2RlLnRleHQuc3BsaXQoJy4nKVsxXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhlYXBFdmVudC5hc3NldE5hbWUgPSBhc3NldE5vZGUudGV4dFxuICAgICAgICB9XG5cbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCBoZWFwRXZlbnQpXG5cbiAgICAgICAgaWYgKGFzc2V0Tm9kZS5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEgfHwgdG9nZ2xlU3RhdGUgPT0gJ2ZhbHNlJykge1xuICAgICAgICAgIGlmIChkaXNhYmxlRnVuYykge1xuICAgICAgICAgICAgZGlzYWJsZUZ1bmMoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dDQuQ29tcG9uZW50UXVlcnkucXVlcnknKSkge1xuICAgICAgICAgICAgbGV0IG1JdGVtcyA9IEV4dDQuQ29tcG9uZW50UXVlcnkucXVlcnkobWVudUl0ZW1zLnRvU3RyaW5nKCkpXG5cbiAgICAgICAgICAgIGlmIChtSXRlbXMpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nIERlc2lnbmVyIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICBtSXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoaXRlbS5pdGVtSWQgPT0gJ2NyZWF0ZUJ1dHRvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zZXREaXNhYmxlZCh0cnVlKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCBpbnRlcnZhbFJlZlxuICAgICAgc3dpdGNoIChhc3NldFR5cGUpIHtcbiAgICAgICAgY2FzZSAnbGFuZGluZ1BhZ2UnOlxuICAgICAgICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IExhbmRpbmcgUGFnZSBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBsZXQgYXNzZXQgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBhc3NldC5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIEFjdGlvbnMgTWVudVxuICAgICAgICAgICAgICAgICAgICAnbHBFZGl0b3IgbWVudSBbYWN0aW9uPWFwcHJvdmVBbmRDbG9zZV0nLCAvLyBBcHByb3ZlIGFuZCBDbG9zZVxuICAgICAgICAgICAgICAgICAgICAnbHBFZGl0b3IgbWVudSBbYWN0aW9uPWRpc2FibGVNb2JpbGVWZXJzaW9uXScsIC8vIFR1cm4gT2ZmIE1vYmlsZSBWZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgICdscEVkaXRvciBtZW51IFthY3Rpb249dXBsb2FkSW1hZ2VdJywgLy8gVXBsb2FkIEltYWdlIG9yIEZpbGVcbiAgICAgICAgICAgICAgICAgICAgJ2xwRWRpdG9yIG1lbnUgW2FjdGlvbj1ncmFiSW1hZ2VzXScgLy8gR3JhYiBJbWFnZXMgZnJvbSBXZWJcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zLCBBUFAuZGlzYWJsZVByb3BlcnR5UGFuZWxTYXZpbmcpXG4gICAgICAgICAgICAgICAgICBMSUIub3ZlcmxheUxhbmRpbmdQYWdlKCdlZGl0JylcbiAgICAgICAgICAgICAgICAgIExJQi5zYXZlTGFuZGluZ1BhZ2VFZGl0cygnZWRpdCcsIGFzc2V0KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ3ByZXZpZXcnOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5MYW5kaW5nUGFnZScpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkxhbmRpbmdQYWdlJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBMYW5kaW5nIFBhZ2UgUHJldmlld2VyOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIEFjdGlvbnMgTWVudVxuICAgICAgICAgICAgICAgICAgICAnbGFuZGluZ1BhZ2VQcmV2aWV3ZXIgbWVudSBbYWN0aW9uPWFwcHJvdmVBbmRDbG9zZV0nIC8vIEFwcHJvdmUgYW5kIENsb3NlXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcylcbiAgICAgICAgICAgICAgICAgIExJQi5vdmVybGF5TGFuZGluZ1BhZ2UoJ3ByZXZpZXcnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ3RlbXBsYXRlRWRpdCc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmxhbmRpbmdQYWdlVGVtcGxhdGUuTGFuZGluZ1BhZ2VUZW1wbGF0ZScpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmxhbmRpbmdQYWdlVGVtcGxhdGUuTGFuZGluZ1BhZ2VUZW1wbGF0ZScpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubGFuZGluZ1BhZ2VUZW1wbGF0ZS5MYW5kaW5nUGFnZVRlbXBsYXRlJykuZ2V0VGVtcGxhdGUoKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmxhbmRpbmdQYWdlVGVtcGxhdGUuTGFuZGluZ1BhZ2VUZW1wbGF0ZScpLmdldFRlbXBsYXRlKCkuZ2V0ICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubGFuZGluZ1BhZ2VUZW1wbGF0ZS5MYW5kaW5nUGFnZVRlbXBsYXRlJykuZ2V0VGVtcGxhdGUoKS5nZXROb2RlSnNvblxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBMYW5kaW5nIFBhZ2UgVGVtcGxhdGUgRWRpdG9yOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgbGV0IGFzc2V0ID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmxhbmRpbmdQYWdlVGVtcGxhdGUuTGFuZGluZ1BhZ2VUZW1wbGF0ZScpLmdldFRlbXBsYXRlKClcbiAgICAgICAgICAgICAgICAgIGlmIChhc3NldC5nZXQoJ3pvbmVJZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IGFzc2V0LmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBhc3NldC5nZXQoJ25hbWUnKSxcbiAgICAgICAgICAgICAgICAgICAgICBjb21wVHlwZTogJ0xhbmRpbmcgUGFnZSBUZW1wbGF0ZScsXG4gICAgICAgICAgICAgICAgICAgICAgaWQ6ICdMVCcgKyBhc3NldC5nZXRJZCgpLFxuICAgICAgICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogLTFcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICAgICAgICAgICAvLyBUb29sYmFyIE1lbnVcbiAgICAgICAgICAgICAgICAgICAgJ3Rvb2xiYXIgW2FjdGlvbj11cGdyYWRlXScsIC8vIE1ha2UgTW9iaWxlIENvbXBhdGlibGVcbiAgICAgICAgICAgICAgICAgICAgLy8gQWN0aW9ucyBNZW51XG4gICAgICAgICAgICAgICAgICAgICdtZW51IFthY3Rpb249c2hvd011bmNoa2luVG9nZ2xlcl0nLCAvLyBEaXNhYmxlIE11bmNoa2luIFRyYWNraW5nXG4gICAgICAgICAgICAgICAgICAgICdtZW51IFthY3Rpb249YXBwcm92ZV0nIC8vIEFwcHJvdmUgYW5kIENsb3NlXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcywgQVBQLmRpc2FibGVTYXZpbmcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAndGVtcGxhdGVQcmV2aWV3JzpcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTGFuZGluZ1BhZ2VUZW1wbGF0ZScpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkxhbmRpbmdQYWdlVGVtcGxhdGUnKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkxhbmRpbmdQYWdlVGVtcGxhdGUnKS5nZXRUZW1wbGF0ZSgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTGFuZGluZ1BhZ2VUZW1wbGF0ZScpLmdldFRlbXBsYXRlKCkuZ2V0ICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTGFuZGluZ1BhZ2VUZW1wbGF0ZScpLmdldFRlbXBsYXRlKCkuZ2V0Tm9kZUpzb25cbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogTGFuZGluZyBQYWdlIFRlbXBsYXRlIFByZXZpZXdlcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcbiAgICAgICAgICAgICAgICAgIGxldCBhc3NldCA9IE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5MYW5kaW5nUGFnZVRlbXBsYXRlJykuZ2V0VGVtcGxhdGUoKVxuICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0LmdldCgnem9uZUlkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gYXNzZXQuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0ge1xuICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IGFzc2V0LmdldCgnbmFtZScpLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbXBUeXBlOiAnTGFuZGluZyBQYWdlIFRlbXBsYXRlJyxcbiAgICAgICAgICAgICAgICAgICAgICBpZDogJ0xUJyArIGFzc2V0LmdldElkKCksXG4gICAgICAgICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiAtMVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdlbWFpbCc6XG4gICAgICAgICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICAgICAgICBjYXNlICdlZGl0JzpcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBsZXQgYXNzZXQgPSBMSUIuZ2V0TWt0M0N0bHJBc3NldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InLCAnZ2V0RW1haWwnKSxcbiAgICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gYXNzZXQuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBFbWFpbCBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIEFjdGlvbnMgTWVudVxuICAgICAgICAgICAgICAgICAgICAnZW1haWxFZGl0b3IyIG1lbnUgW2FjdGlvbj1hcHByb3ZlRW1haWxdJywgLy8gQXBwcm92ZSBhbmQgQ2xvc2VcbiAgICAgICAgICAgICAgICAgICAgJ2VtYWlsRWRpdG9yMiBtZW51IFthY3Rpb249c2VuZFRlc3RFbWFpbF0nLCAvLyBTZW5kIFNhbXBsZVxuICAgICAgICAgICAgICAgICAgICAnZW1haWxFZGl0b3IyIG1lbnUgW2FjdGlvbj11cGxvYWRJbWFnZV0nLCAvLyBVcGxvYWQgSW1hZ2Ugb3IgRmlsZVxuICAgICAgICAgICAgICAgICAgICAnZW1haWxFZGl0b3IyIG1lbnUgW2FjdGlvbj1ncmFiSW1hZ2VzXScsIC8vIEdyYWIgSW1hZ2VzIGZyb20gV2ViXG4gICAgICAgICAgICAgICAgICAgICdlbWFpbEVkaXRvcjIgbWVudSBbYWN0aW9uPXNhdmVBc1RlbXBsYXRlXScgLy8gU2F2ZSBhcyBUZW1wbGF0ZVxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMpXG4gICAgICAgICAgICAgICAgICBMSUIub3ZlcmxheUVtYWlsKCdlZGl0JylcbiAgICAgICAgICAgICAgICAgIExJQi5zYXZlRW1haWxFZGl0cygnZWRpdCcsIGFzc2V0KVxuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1lbXB0eVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICAgICAgLy8gaWYgKFxuICAgICAgICAgICAgICAgIC8vICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAvLyAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKSAmJlxuICAgICAgICAgICAgICAgIC8vICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLmdldEVtYWlsKCkgJiZcbiAgICAgICAgICAgICAgICAvLyAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5nZXRFbWFpbCgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAvLyApIHtcbiAgICAgICAgICAgICAgICAvLyAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogRW1haWwgRWRpdG9yOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAvLyAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgIC8vICAgbGV0IGFzc2V0ID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLmdldEVtYWlsKClcbiAgICAgICAgICAgICAgICAvLyAgIGFzc2V0Tm9kZSA9IGFzc2V0LmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAvLyAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAvLyAgICAgLy8gQWN0aW9ucyBNZW51XG4gICAgICAgICAgICAgICAgLy8gICAgICdlbWFpbEVkaXRvcjIgbWVudSBbYWN0aW9uPWFwcHJvdmVFbWFpbF0nLCAvLyBBcHByb3ZlIGFuZCBDbG9zZVxuICAgICAgICAgICAgICAgIC8vICAgICAnZW1haWxFZGl0b3IyIG1lbnUgW2FjdGlvbj1zZW5kVGVzdEVtYWlsXScsIC8vIFNlbmQgU2FtcGxlXG4gICAgICAgICAgICAgICAgLy8gICAgICdlbWFpbEVkaXRvcjIgbWVudSBbYWN0aW9uPXVwbG9hZEltYWdlXScsIC8vIFVwbG9hZCBJbWFnZSBvciBGaWxlXG4gICAgICAgICAgICAgICAgLy8gICAgICdlbWFpbEVkaXRvcjIgbWVudSBbYWN0aW9uPWdyYWJJbWFnZXNdJywgLy8gR3JhYiBJbWFnZXMgZnJvbSBXZWJcbiAgICAgICAgICAgICAgICAvLyAgICAgJ2VtYWlsRWRpdG9yMiBtZW51IFthY3Rpb249c2F2ZUFzVGVtcGxhdGVdJyAvLyBTYXZlIGFzIFRlbXBsYXRlXG4gICAgICAgICAgICAgICAgLy8gICBdXG4gICAgICAgICAgICAgICAgLy8gICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcylcbiAgICAgICAgICAgICAgICAvLyAgIExJQi5vdmVybGF5RW1haWwoJ2VkaXQnKVxuICAgICAgICAgICAgICAgIC8vICAgTElCLnNhdmVFbWFpbEVkaXRzKCdlZGl0JywgYXNzZXQpXG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAncHJldmlldyc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5QcmV2aWV3JykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLlByZXZpZXcnKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5QcmV2aWV3JykuZ2V0RW1haWwoKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5QcmV2aWV3JykuZ2V0RW1haWwoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IEVtYWlsIFByZXZpZXdlcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcbiAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuUHJldmlldycpLmdldEVtYWlsKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICAgICAgICAgICAvLyBUb29sYmFyIE1lbnVcbiAgICAgICAgICAgICAgICAgICAgJ2VtYWlsMkVkaXRvclByZXZpZXdUb29sYmFyIFthY3Rpb249c2VuZFNhbXBsZUVtYWlsXScsIC8vIFNlbmQgU2FtcGxlXG4gICAgICAgICAgICAgICAgICAgIC8vIEFjdGlvbnMgTWVudVxuICAgICAgICAgICAgICAgICAgICAnZW1haWxQcmV2aWV3IG1lbnUgW2FjdGlvbj1hcHByb3ZlRW1haWxdJywgLy8gQXBwcm92ZSBhbmQgQ2xvc2VcbiAgICAgICAgICAgICAgICAgICAgJ2VtYWlsUHJldmlldyBtZW51IFthY3Rpb249c2VuZFNhbXBsZUVtYWlsXScgLy8gU2VuZCBTYW1wbGVcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zKVxuICAgICAgICAgICAgICAgICAgTElCLm92ZXJsYXlFbWFpbCgncHJldmlldycpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAndGVtcGxhdGVFZGl0JzpcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsVGVtcGxhdGUnKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxUZW1wbGF0ZScpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsVGVtcGxhdGUnKS5nZXRUZW1wbGF0ZSgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsVGVtcGxhdGUnKS5nZXRUZW1wbGF0ZSgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogRW1haWwgVGVtcGxhdGUgRWRpdG9yOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgbGV0IGFzc2V0ID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbFRlbXBsYXRlJykuZ2V0VGVtcGxhdGUoKVxuICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gYXNzZXQuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICAgICAgICAgICAvLyBBY3Rpb25zIE1lbnVcbiAgICAgICAgICAgICAgICAgICAgJ21lbnUgW2FjdGlvbj1hcHByb3ZlVGVtcGxhdGVdJywgLy8gQXBwcm92ZSBhbmQgQ2xvc2VcbiAgICAgICAgICAgICAgICAgICAgJ21lbnUgW2FjdGlvbj1zZW5kU2FtcGxlXScsIC8vIFNlbmQgU2FtcGxlIEVtYWlsXG4gICAgICAgICAgICAgICAgICAgICdtZW51IFthY3Rpb249aW5saW5lQ3NzXScgLy8gSW5saW5lIENTU1xuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMsIEFQUC5kaXNhYmxlU2F2aW5nKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ3RlbXBsYXRlUGlja2VyJzpcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsVGVtcGxhdGVQaWNrZXInKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxUZW1wbGF0ZVBpY2tlcicpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsVGVtcGxhdGVQaWNrZXInKS5nZXRFbWFpbFRlbXBsYXRlUGlja2VyKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxUZW1wbGF0ZVBpY2tlcicpLmdldEVtYWlsVGVtcGxhdGVQaWNrZXIoKS5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogRW1haWwgVGVtcGxhdGUgUGlja2VyOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgbGV0IGFzc2V0ID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbFRlbXBsYXRlUGlja2VyJykuZ2V0RW1haWxUZW1wbGF0ZVBpY2tlcigpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdFbWFpbCBUZW1wbGF0ZSBQaWNrZXInLFxuICAgICAgICAgICAgICAgICAgICBjb21wVHlwZTogJ0VtYWlsIFRlbXBsYXRlIFBpY2tlcicsXG4gICAgICAgICAgICAgICAgICAgIGlkOiAnRU0nLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHBhcnNlSW50KGFzc2V0LmFjY2Vzc1pvbmVJZClcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gVG9vbGJhciBNZW51XG4gICAgICAgICAgICAgICAgICAgICd0b29sYmFyIFtpdGVtSWQ9Y3JlYXRlQnV0dG9uXScgLy8gQ3JlYXRlXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2Zvcm0nOlxuICAgICAgICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkZvcm0nKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5Gb3JtJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5Gb3JtJykuZ2V0Rm9ybSgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuRm9ybScpLmdldEZvcm0oKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IEZvcm0gRWRpdG9yOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkZvcm0nKS5nZXRGb3JtKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICAgICAgICAgICAvLyBOYXZpZ2F0aW9uIE1lbnVcbiAgICAgICAgICAgICAgICAgICAgJ2Zvcm1FZGl0b3IgdG9vbGJhciBbYWN0aW9uPWFwcHJvdmVBbmRDbG9zZV0nLCAvLyBBcHByb3ZlICYgQ2xvc2VcbiAgICAgICAgICAgICAgICAgICAgJ2Zvcm1FZGl0b3IgdG9vbGJhciBbYWN0aW9uPWZpbmlzaF0nIC8vIEZpbmlzaFxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMsIEFQUC5kaXNhYmxlU2F2aW5nKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ3ByZXZpZXcnOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5Gb3JtJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuRm9ybScpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuRm9ybScpLmdldEZvcm0oKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkZvcm0nKS5nZXRGb3JtKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBGb3JtIFByZXZpZXdlcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcbiAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5Gb3JtJykuZ2V0Rm9ybSgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ3B1c2hOb3RpZmljYXRpb24nOlxuICAgICAgICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLm1vYmlsZVB1c2hOb3RpZmljYXRpb24uTW9iaWxlUHVzaE5vdGlmaWNhdGlvbicpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLm1vYmlsZVB1c2hOb3RpZmljYXRpb24uTW9iaWxlUHVzaE5vdGlmaWNhdGlvbicpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubW9iaWxlUHVzaE5vdGlmaWNhdGlvbi5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uJykuZ2V0TW9iaWxlUHVzaE5vdGlmaWNhdGlvbigpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubW9iaWxlUHVzaE5vdGlmaWNhdGlvbi5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uJykuZ2V0TW9iaWxlUHVzaE5vdGlmaWNhdGlvbigpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogUHVzaCBOb3RpZmljYXRpb24gRWRpdG9yOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubW9iaWxlUHVzaE5vdGlmaWNhdGlvbi5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uJykuZ2V0TW9iaWxlUHVzaE5vdGlmaWNhdGlvbigpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gVG9vbGJhciBNZW51XG4gICAgICAgICAgICAgICAgICAgICdtb2JpbGVQdXNoTm90aWZpY2F0aW9uRWRpdG9yIHRvb2xiYXIgW2FjdGlvbj1zZW5kRHJhZnRTYW1wbGVdJywgLy8gU2VuZCBTYW1wbGVcbiAgICAgICAgICAgICAgICAgICAgLy8gTmF2aWdhdGlvbiBNZW51XG4gICAgICAgICAgICAgICAgICAgICdtb2JpbGVQdXNoTm90aWZpY2F0aW9uRWRpdG9yIHRvb2xiYXIgW2FjdGlvbj1maW5pc2hdJywgLy8gRmluaXNoXG4gICAgICAgICAgICAgICAgICAgICdtb2JpbGVQdXNoTm90aWZpY2F0aW9uRWRpdG9yIHRvb2xiYXIgW2FjdGlvbj1hcHByb3ZlQW5kQ2xvc2VdJyAvLyBBcHByb3ZlICYgQ2xvc2VcbiAgICAgICAgICAgICAgICAgIF1cblxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMsIEFQUC5kaXNhYmxlU2F2aW5nKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ3ByZXZpZXcnOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTW9iaWxlUHVzaE5vdGlmaWNhdGlvbicpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTW9iaWxlUHVzaE5vdGlmaWNhdGlvbicpLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLk1vYmlsZVB1c2hOb3RpZmljYXRpb24nKS5nZXRNb2JpbGVQdXNoTm90aWZpY2F0aW9uKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBQdXNoIE5vdGlmaWNhdGlvbiBQcmV2aWV3ZXI6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTW9iaWxlUHVzaE5vdGlmaWNhdGlvbicpLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIFRvb2xiYXIgTWVudVxuICAgICAgICAgICAgICAgICAgICAnbW9iaWxlUHVzaE5vdGlmaWNhdGlvblByZXZpZXdlciB0b29sYmFyIFthY3Rpb249c2VuZERyYWZ0U2FtcGxlXScgLy8gU2VuZCBTYW1wbGVcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnaW5BcHBNZXNzYWdlJzpcbiAgICAgICAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5pbkFwcE1lc3NhZ2UuSW5BcHBNZXNzYWdlJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuaW5BcHBNZXNzYWdlLkluQXBwTWVzc2FnZScpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuaW5BcHBNZXNzYWdlLkluQXBwTWVzc2FnZScpLmdldEluQXBwTWVzc2FnZSgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuaW5BcHBNZXNzYWdlLkluQXBwTWVzc2FnZScpLmdldEluQXBwTWVzc2FnZSgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogSW4tQXBwIE1lc3NhZ2UgRWRpdG9yOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmluQXBwTWVzc2FnZS5JbkFwcE1lc3NhZ2UnKS5nZXRJbkFwcE1lc3NhZ2UoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIFRvb2xiYXIgTWVudVxuICAgICAgICAgICAgICAgICAgICAnaW5BcHBNZXNzYWdlRWRpdG9yIHRvb2xiYXIgW2FjdGlvbj1zZW5kU2FtcGxlXScsIC8vIFNlbmQgU2FtcGxlXG4gICAgICAgICAgICAgICAgICAgIC8vIEFjdGlvbnMgTWVudVxuICAgICAgICAgICAgICAgICAgICAnaW5BcHBNZXNzYWdlRWRpdG9yIG1lbnUgW2FjdGlvbj1zZW5kU2FtcGxlXScsIC8vIFNlbmQgU2FtcGxlXG4gICAgICAgICAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VFZGl0b3IgbWVudSBbYWN0aW9uPWFwcHJvdmVBbmRDbG9zZV0nIC8vIEFwcHJvdmUgJiBDbG9zZVxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMsIEFQUC5kaXNhYmxlU2F2aW5nKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ3ByZXZpZXcnOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5JbkFwcE1lc3NhZ2UnKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5JbkFwcE1lc3NhZ2UnKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkluQXBwTWVzc2FnZScpLmdldEluQXBwTWVzc2FnZSgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuSW5BcHBNZXNzYWdlJykuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBJbi1BcHAgTWVzc2FnZSBQcmV2aWV3ZXI6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuSW5BcHBNZXNzYWdlJykuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICAgICAgICAgICAvLyBUb29sYmFyIE1lbnVcbiAgICAgICAgICAgICAgICAgICAgJ2luQXBwTWVzc2FnZVByZXZpZXdlciB0b29sYmFyIFthY3Rpb249YXBwcm92ZUFuZENsb3NlXScgLy8gQXBwcm92ZSAmIENsb3NlXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdzbXNNZXNzYWdlJzpcbiAgICAgICAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5TbXNNZXNzYWdlJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU21zTWVzc2FnZScpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU21zTWVzc2FnZScpLmdldFNtc01lc3NhZ2UoKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLlNtc01lc3NhZ2UnKS5nZXRTbXNNZXNzYWdlKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBTTVMgTWVzc2FnZSBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU21zTWVzc2FnZScpLmdldFNtc01lc3NhZ2UoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIEFjdGlvbnMgTWVudVxuICAgICAgICAgICAgICAgICAgICAnc21zTWVzc2FnZUVkaXRvciBtZW51IFthY3Rpb249YXBwcm92ZUFuZENsb3NlXScgLy8gQXBwcm92ZSBhbmQgQ2xvc2VcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zLCBBUFAuZGlzYWJsZVNhdmluZylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdwcmV2aWV3JzpcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnc29jaWFsQXBwJzpcbiAgICAgICAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5Tb2NpYWxBcHAnKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5Tb2NpYWxBcHAnKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLlNvY2lhbEFwcCcpLmdldFNvY2lhbEFwcCgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU29jaWFsQXBwJykuZ2V0U29jaWFsQXBwKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBTb2NpYWwgQXBwIEVkaXRvcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcblxuICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLlNvY2lhbEFwcCcpLmdldFNvY2lhbEFwcCgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3NvY2lhbEFwcEVkaXRvciB0b29sYmFyIFthY3Rpb249YXBwcm92ZUFuZENsb3NlXScsIC8vIEFwcHJvdmUgYW5kIENsb3NlXG4gICAgICAgICAgICAgICAgICAgICdzb2NpYWxBcHBFZGl0b3IgdG9vbGJhciBbYWN0aW9uPWZpbmlzaF0nIC8vIEZpbmlzaFxuICAgICAgICAgICAgICAgICAgXVxuXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcywgQVBQLmRpc2FibGVTYXZpbmcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAncHJldmlldyc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLlNvY2lhbEFwcCcpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLlNvY2lhbEFwcCcpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuU29jaWFsQXBwJykuZ2V0U29jaWFsQXBwKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5Tb2NpYWxBcHAnKS5nZXRTb2NpYWxBcHAoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IFNvY2lhbCBBcHAgUHJldmlld2VyOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLlNvY2lhbEFwcCcpLmdldFNvY2lhbEFwcCgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2FiVGVzdCc6XG4gICAgICAgICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICAgICAgICBjYXNlICdlZGl0JzpcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBBL0IgVGVzdCBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci50ZXN0R3JvdXAuVGVzdEdyb3VwJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IudGVzdEdyb3VwLlRlc3RHcm91cCcpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IudGVzdEdyb3VwLlRlc3RHcm91cCcpLmdldFRlc3RHcm91cCgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IudGVzdEdyb3VwLlRlc3RHcm91cCcpLmdldFRlc3RHcm91cCgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogQS9CIFRlc3QgRWRpdG9yOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLnRlc3RHcm91cC5UZXN0R3JvdXAnKS5nZXRUZXN0R3JvdXAoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICd0ZXN0R3JvdXBFZGl0b3IgdG9vbGJhciBbYWN0aW9uPWZpbmlzaF0nIC8vIEZpbmlzaFxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMsIEFQUC5kaXNhYmxlU2F2aW5nKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ3ByZXZpZXcnOlxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdzbmlwcGV0JzpcbiAgICAgICAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IFNuaXBwZXQgRWRpdG9yOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU25pcHBldCcpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLlNuaXBwZXQnKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLlNuaXBwZXQnKS5nZXRTbmlwcGV0KCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5TbmlwcGV0JykuZ2V0U25pcHBldCgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogU25pcHBldCBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU25pcHBldCcpLmdldFNuaXBwZXQoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXVxuXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcywgQVBQLmRpc2FibGVTYXZpbmcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAncHJldmlldyc6XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogU25pcHBldCBQcmV2aWV3ZXI6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5TbmlwcGV0JykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuU25pcHBldCcpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuU25pcHBldCcpLmdldFNuaXBwZXQoKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLlNuaXBwZXQnKS5nZXRTbmlwcGV0KCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBTbmlwcGV0IFByZXZpZXdlcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcbiAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5TbmlwcGV0JykuZ2V0U25pcHBldCgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICB9LCAwKVxufVxuXG4vLyAgVGhpcyBmdW5jdGlvbiBkaXNhYmxlcyB0aGUgU2F2ZSwgQ3JlYXRlLCBBZGQgLi4uIGJ1dHRvbnMgaW4gRm9ybSB3aW5kb3dzLlxuLy8gIEl0IGNhbiBiZSB1c2VkIHRvIGRpc2FibGUgYW55IGdlbmVyaWMgRm9ybSBzYXZlIHdpbmRvdy5cbkFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IEZvcm0gV2luZG93IFNhdmUgQnV0dG9ucycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dDQuQ29tcG9uZW50LnByb3RvdHlwZS5zaG93JykpIHtcbiAgICBFeHQ0LkNvbXBvbmVudC5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIChhbmltYXRlVGFyZ2V0LCBjYiwgc2NvcGUpIHtcbiAgICAgIGxldCBtZSA9IHRoaXMsXG4gICAgICAgIG1lbnVJdGVtcyxcbiAgICAgICAgbUl0ZW1zLFxuICAgICAgICB0b0Rpc2FibGVcblxuICAgICAgaWYgKFxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2NyZWF0ZU5hbWVkQWNjb3VudEZvcm0nIHx8IC8vQUJNID4gTmFtZWQgQWNjb3VudHMgPiBOZXcgTmFtZWQgQWNjb3VudFxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkZFRvQWNjb3VudExpc3RGb3JtJyB8fCAvL0FCTSA+IE5hbWVkIEFjY291bnRzID4gQWRkIFRvIEFjY291bnQgTGlzdFxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2Fzc2lnblRlYW1NZW1iZXJGb3JtJyB8fCAvL0FCTSA+IE5hbWVkIEFjY291bnRzID4gQXNzaWduIEFjY291bnQgTWVtYmVyXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnY3JlYXRlQWNjb3VudExpc3RGb3JtJyB8fCAvL0FCTSA+IEFjY291bnQgTGlzdHMgPiBDcmVhdGUgTmV3L1JlbmFtZSBBY2NvdW50IExpc3RcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZEJyaWRnZUZvcm0nIHx8IC8vR2xvYmFsID4gTGlzdCAmIFNtYXJ0IExpc3QgPiBBY3Rpb25zID4gU2VuZCB2aWEgQWQgQnJpZGdlXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnc21hcnRsaXN0UmVwb3J0U3Vic2NyaXB0aW9uRm9ybScgfHwgLy9HbG9iYWwgPiBMaXN0ICYgU21hcnQgTGlzdCA+IEFjdGlvbnMgPiBOZXcgU21hcnQgTGlzdCBTdWJzY3JpcHRpb25cbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhbmFseXRpY3NSZXBvcnRTdWJzY3JpcHRpb25Gb3JtJyB8fCAvL0dsb2JhbCA+IFJlcG9ydCA+IE5ldyBBY3Rpb25zICYgU3Vic2NyaXB0aW9ucyA+IE5ldyBSZXBvcnQgU3Vic2NyaXB0aW9uXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnZW1haWxCbGFzdENvbW11bmljYXRpb25MaW1pdEZvcm0nIHx8IC8vTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBQcm9ncmFtID4gU2V0dXAgPiBFZGl0IENvbW11bmljYXRpb24gTGltaXQgU2V0dGluZ3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdjYWxlbmRhckVudHJ5UmVzY2hlZHVsZUZvcm0nIHx8IC8vTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBFdmVudCA+IEFjdGlvbnMgPiBSZXNjaGVkdWxlIEVudHJpZXNcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdwcm9ncmFtT3BlcmF0aW9uYWxNb2RlRm9ybScgfHwgLy9NYXJrZXRpbmcgQWN0aXZpdGllcyA+IFByb2dyYW0gPiBTZXR1cCA+IEVkaXQgQW5hbHl0aWNzIEJlaGF2aW9yIFNldHRpbmdzXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAndHJhY2tDYWRlbmNlRm9ybScgfHwgLy9NYXJrZXRpbmcgQWN0aXZpdGllcyA+IE51cnR1cmUgUHJvZ3JhbSA+IFN0cmVhbXMgPiBTZXQgU3RyZWFtIENhZGVuY2VcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdmaWxlVXBsb2FkRm9ybScgfHwgLy9EZXNpZ24gU3R1ZGlvID4gSW1hZ2VzICYgRmlsZXMgPiBHcmFiIEltYWdlcyBmcm9tIFdlYlxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2xlYWRDb21wb25lbnRGb3JtJyB8fCAvL0RhdGFiYXNlID4gQUxMID4gTmV3ID4gTmV3IFBlcnNvblxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FuYWx5dGljc1JlcG9ydFN1YnNjcmlwdGlvbkZvcm0nIHx8IC8vQW5hbHl0aWNzID4gQW5hbHl6ZXIgJiBSZXBvcnQgPiBOZXcgUmVwb3J0IFN1YnNjcmlwdGlvblxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2xwTWV0YURhdGFGb3JtJyB8fCAvL0Rlc2lnbmVyID4gTGFuZGluZyBQYWdlIEVkaXRvciA+IEVkaXQgUGFnZSBNZXRhIFRhZ3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdscEZvcm1TZXR0aW5ncycgfHwgLy9EZXNpZ25lciA+IExhbmRpbmcgUGFnZSBFZGl0b3IgPiBFZGl0IEZvcm0gU2V0dGluZ3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdlbWFpbFNldHRpbmdzRm9ybScgfHwgLy9EZXNpZ25lciA+IEVtYWlsIEVkaXRvciA+IEVkaXQgU2V0dGluZ3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pblVzZXJJbnZpdGVXaXphcmQnIHx8IC8vQWRtaW4gPiBVc2VyICYgUm9sZXMgPiBVc2VycyA+IEludml0ZSBOZXcgVXNlclxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluRWRpdExpY2Vuc2VzRm9ybScgfHwgLy9BZG1pbiA+IFVzZXIgJiBSb2xlcyA+IFVzZXJzID4gSXNzdWUgTGljZW5zZVxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluU2FsZXNVc2VySW52aXRlV2l6YXJkJyB8fCAvL0FkbWluID4gVXNlciAmIFJvbGVzID4gU2FsZXMgVXNlcnMgPiBJbnZpdGUgTmV3IFNhbGVzIFVzZXJcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pbkVkaXRMaWNlbnNlc0Zvcm0nIHx8IC8vQWRtaW4gPiBVc2VyICYgUm9sZXMgPiBTYWxlcyBVc2VycyA+IE1hbmFnZSBMaWNlbnNlID4gQWNjb3VudCBJbnNpZ2h0XG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnYWRtaW5TdWJzY3JpcHRpb25JbmZvcm1hdGlvbkZvcm0nIHx8IC8vQWRtaW4gPiBNeSBBY2NvdW50ID4gU3ViY3JpcHRpb24gSW5mb3JtYXRpb25cbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pbkFjY291bnRTZXR0aW5nc0Zvcm0nIHx8IC8vQWRtaW4gPiBNeSBBY2NvdW50ID4gQWNjb3VudCBTZXR0aW5nc1xuICAgICAgICAvL3x8IHRoaXMuZ2V0WFR5cGUoKSA9PSBcImxvY2FsZVBpY2tlclwiIC8vQWRtaW4gPiBNeSBBY2NvdW50L0xvY2F0aW9uID4gTG9jYXRpb24gU2V0dGluZ3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdkZWxldGVab25lRm9ybScgfHwgLy9BZG1pbiA+IFdvcmtzcGFjZXMgJiBQYXJ0aXRpb25zID4gV29ya3NwYWNlcyA+IERlbGV0ZSBXb3Jrc3BhY2VcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pblRpbnlNY2VTZXR0aW5nRm9ybScgfHwgLy9BZG1pbiA+ICpFbWFpbCA+IEVtYWlsID4gRWRpdCBUZXh0IEVkaXRvciBTZXR0aW5nc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2VtYWlsRWRpdG9yU2V0dGluZ3NGb3JtJyB8fCAvL0FkbWluID4gRW1haWwgPiBFbWFpbCA+IEVkaXQgRW1haWwgRWRpdG9yIFNldHRpbmdzXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnZW1haWxBZGRNdWx0aXBsZURvbWFpbkZvcm0nIHx8IC8vQWRtaW4gPiBFbWFpbCA+IEVtYWlsID4gQWRkL0VkaXQgQnJhbmRpbmcgRG9tYWluc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluQWRkRG9tYWluRm9ybScgfHwgLy9BZG1pbiA+IEVtYWlsID4gU1BGL0RLSU0gPiBBZGQgRG9tYWluXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnYWRtaW5TY29yZVNldHRpbmdzRm9ybScgfHwgLy9BZG1pbiA+IEFCTSA+IEFjY291bnQgU2NvcmUgU2V0dGluZ3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pbkNybUZpZWxkU2V0dGluZ3NGb3JtJyB8fCAvL0FkbWluID4gQUJNID4gQ1JNIE1hcHBpbmdcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pbkFjY291bnRUZWFtRm9ybScgfHwgLy9BZG1pbiA+IEFCTSA+IEFjY291bnQgVGVhbSBTZXR0aW5nc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluQWNjb3VudEluc2lnaHRTZXR0aW5nc0Zvcm0nIHx8IC8vQWRtaW4gPiBBQk0gPiBBQk0gU2FsZXMgPiBBY2NvdW50IEluc2lnaHQgU2V0dGluZ3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pbkFibVJlcG9ydFNldHRpbmdzRm9ybScgfHwgLy9BZG1pbiA+IEFCTSA+IFdlZWtseSBSZXBvcnRcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pbkZpZWxkSHRtbEVuY29kZUZvcm0nIHx8IC8vQWRtaW4gPiBGaWVsZCBNYW5hZ2VtZW50ID4gRmllbGQgTWFuYWdlbWVudCA+IEhUTUwgRW5jb2RlIFNldHRpbmdzXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnbWt0b2N1c3RvbWFjdGl2aXR5QWN0aXZpdHlUeXBlRm9ybScgfHwgLy9BZG1pbiA+IE1hcmtldG8gQ3VzdG9tIEFjdGl2aXRpZXMgPiBNYXJrZXRvIEN1c3RvbSBBY3Rpdml0aWVzID4gTmV3IEN1c3RvbSBBY3Rpdml0eVxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ21rdG9jdXN0b21hY3Rpdml0eUFjdGl2aXR5VHlwZUVkaXRGb3JtJyB8fCAvL0FkbWluID4gTWFya2V0byBDdXN0b20gQWN0aXZpdGllcyA+IE1hcmtldG8gQ3VzdG9tIEFjdGl2aXRpZXMgPiBFZGl0IEFjdGl2aXR5XG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnbWt0b2N1c3RvbWFjdGl2aXR5QWN0aXZpdHlUeXBlRm9ybVN0ZXBUaHJlZScgfHwgLy9BZG1pbiA+IE1hcmtldG8gQ3VzdG9tIEFjdGl2aXRpZXMgPiBGaWVsZHMgPiBOZXcvRWRpdCBGaWVsZFxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ21rdG9jdXN0b21vYmplY3RPYmplY3RGb3JtJyB8fCAvL0FkbWluID4gTWFya2V0byBDdXN0b20gT2JqZWN0cyA+IE1hcmtldG8gQ3VzdG9tIE9iamVjdHMgPiBOZXcvRWRpdCBDdXN0b20gT2JqZWN0XG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnbWt0b2N1c3RvbW9iamVjdEZpZWxkRm9ybScgfHwgLy9BZG1pbiA+IE1hcmtldG8gQ3VzdG9tIE9iamVjdHMgPiBGaWVsZHMgPiBOZXcvRWRpdCBGaWVsZFxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2NybUVkaXRDcmVkZW50aWFsc0Zvcm0nIHx8IC8vQWRtaW4gPiBNaWNyb3NvZnQgRHluYW1pY3MgPiBDcmVkZW50aWFscyA+IEVkaXRcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pblNwZWNpZnlQbHVnaW5Db250YWN0Rm9ybScgfHwgLy9BZG1pbiA+IFNhbGVzIEluc2lnaHQgPiBFbWFpbCBBZGQtaW4gPiBTcGVjaWZ5IFBsdWdpbiBDb250YWN0XG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnd2lsZGNhcmRSZWRpcmVjdEZvcm0nIHx8IC8vQWRtaW4gPiBMYW5kaW5nIFBhZ2VzID4gTmV3IFdpbGRjYXJkIFJlZGlyZWN0XG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnbWt0b3dzRWRpdElwUmVzdHJpY3Rpb25Gb3JtJyB8fCAvL0FkbWluID4gV2ViIFNlcnZpY2VzID4gSVAgUmVzdHJpY3Rpb25zXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnbGF1bmNocG9pbnRTZXJ2aWNlSW50ZWdyYXRpb25TZXR0aW5nc0Zvcm0nIHx8IC8vQWRtaW4gPiBMYXVuY2hQb2ludCA+IEluc3RhbGxlZCBTZXJ2aWNlcyA+IEVkaXQgU2VydmljZVxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ3Zlc3BhQXBwRm9ybScgfHwgLy9BZG1pbiA+IE1vYmlsZSBBcHBzICYgRGV2aWNlcyA+IE1vYmlsZSBBcHBzID4gTmV3L0VkaXQgTW9iaWxlIEFwcFxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ3Zlc3BhU2VuZEZvcm0nIHx8IC8vQWRtaW4gPiBNb2JpbGUgQXBwcyAmIERldmljZXMgPiBNb2JpbGUgQXBwcyA+IFNlbmQgVG8gRGV2ZWxvcGVyXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAndmVzcGFDb25maWd1cmVQdXNoQWNjZXNzRm9ybScgfHwgLy9BZG1pbiA+IE1vYmlsZSBBcHBzICYgRGV2aWNlcyA+IE1vYmlsZSBBcHBzID4gQ29uZmlndXJlIFB1c2ggQWNjZXNzXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAndmVzcGFOZXdEZXZpY2VGb3JtJyB8fCAvL0FkbWluID4gTW9iaWxlIEFwcHMgJiBEZXZpY2VzID4gVGVzdCBEZXZpY2VzID4gTmV3IFRlc3QgRGV2aWNlXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnYWRtaW5UYWdzQWRkQ2FsZW5kYXJFbnRyeVR5cGVGb3JtJyB8fCAvL0FkbWluID4gVGFncyA+IENhbGVuZGFyIEVudHJ5IFR5cGVzID4gTmV3IEVudHJ5IFR5cGVcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdmZWF0dXJlU3dpdGNoRm9ybScgLy9BZG1pbiA+IEZlYXR1cmUgTWFuYWdlciA+IEVkaXQgRmVhdHVyZVxuICAgICAgKSB7XG4gICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAnW2FjdGlvbj1zdWJtaXRdJywgLy9DcmVhdGUsIEFkZCwgU2F2ZVxuICAgICAgICAgICdbYWN0aW9uPWltcG9ydF0nIC8vSW1wb3J0XG4gICAgICAgIF1cbiAgICAgICAgbUl0ZW1zID0gdGhpcy5xdWVyeShtZW51SXRlbXMudG9TdHJpbmcoKSlcbiAgICAgICAgdG9EaXNhYmxlID0gdHJ1ZVxuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RDYW52YXMuZ2V0QWN0aXZlVGFiJykgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpICYmXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnbnVydHVyZVRyYWNrRm9ybScgJiYgLy9NYXJrZXRpbmcgQWN0aXZpdGllcyA+IE51cnR1cmUgUHJvZ3JhbSA+IFN0cmVhbXMgPiBFZGl0IE5hbWVcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdpbkFwcE1lc3NhZ2VBc3NldEZvcm0nIC8vTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBNb2JpbGUgSW4tQXBwIFByb2dyYW0gPiBDb250cm9sIFBhbmVsID4gTmV3IEluLUFwcCBNZXNzYWdlXG4gICAgICApIHtcbiAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICdbYWN0aW9uPXN1Ym1pdF0nIC8vQ3JlYXRlLCBBZGQsIFNhdmVcbiAgICAgICAgXVxuICAgICAgICBtSXRlbXMgPSB0aGlzLnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuICAgICAgICB0b0Rpc2FibGUgPSBBUFAuZXZhbHVhdGVNZW51KCdidXR0b24nLCBudWxsLCBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCksIG51bGwpXG4gICAgICB9XG5cbiAgICAgIGlmICh0b0Rpc2FibGUgJiYgbUl0ZW1zKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBGb3JtIFdpbmRvdyBTYXZlIEJ1dHRvbnMnKVxuICAgICAgICBtSXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKHRvRGlzYWJsZSlcblxuICAgICAgICAgICAgaWYgKG1lLmdldFhUeXBlKCkgPT0gJ2VtYWlsQWRkTXVsdGlwbGVEb21haW5Gb3JtJykge1xuICAgICAgICAgICAgICBpdGVtLnN0YXlEaXNhYmxlZCA9IHRydWVcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWUuZ2V0WFR5cGUoKSA9PSAnYWRtaW5FZGl0TGljZW5zZXNGb3JtJykge1xuICAgICAgICAgICAgICBpdGVtLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBsZXQge3JlbmRlcmVkfSA9IG1lXG4gICAgICBpZiAocmVuZGVyZWQgJiYgbWUuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgaWYgKG1lLnRvRnJvbnRPblNob3cgJiYgbWUuZmxvYXRpbmcpIHtcbiAgICAgICAgICBtZS50b0Zyb250KClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1lLmZpcmVFdmVudCgnYmVmb3Jlc2hvdycsIG1lKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBtZS5oaWRkZW4gPSBmYWxzZVxuICAgICAgICAgIGlmICghcmVuZGVyZWQgJiYgKG1lLmF1dG9SZW5kZXIgfHwgbWUuZmxvYXRpbmcpKSB7XG4gICAgICAgICAgICBtZS5kb0F1dG9SZW5kZXIoKVxuICAgICAgICAgICAgcmVuZGVyZWQgPSBtZS5yZW5kZXJlZFxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVuZGVyZWQpIHtcbiAgICAgICAgICAgIG1lLmJlZm9yZVNob3coKVxuICAgICAgICAgICAgbWUub25TaG93LmFwcGx5KG1lLCBhcmd1bWVudHMpXG4gICAgICAgICAgICBtZS5hZnRlclNob3cuYXBwbHkobWUsIGFyZ3VtZW50cylcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWUub25TaG93VmV0bygpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChtZS5zdGF5RGlzYWJsZWQpIHtcbiAgICAgICAgbWUuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZVxuICAgIH1cbiAgfVxufVxuXG4vLyAgZGlzYWJsZSB0aGUgRGVsZXRlIGJ1dHRvbnMgaW4gRm9ybSB3aW5kb3dzLlxuLy8gIEl0IGNhbiBiZSB1c2VkIHRvIGRpc2FibGUgYW55IGdlbmVyaWMgRm9ybSBzYXZlIHdpbmRvdy5cbkFQUC5kaXNhYmxlRm9ybURlbGV0ZUJ1dHRvbnMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogRm9ybSBXaW5kb3cgRGVsZXRlIEJ1dHRvbnMnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdFeHQ0LndpbmRvdy5NZXNzYWdlQm94LnByb3RvdHlwZS5jb25maXJtRGVsZXRlJykpIHtcbiAgICBFeHQ0LndpbmRvdy5NZXNzYWdlQm94LnByb3RvdHlwZS5jb25maXJtRGVsZXRlID0gZnVuY3Rpb24gKGNmZywgbXNnLCBmbiwgc2NvcGUpIHtcbiAgICAgIGxldCBtZW51SXRlbXMsIG1JdGVtcywgdG9EaXNhYmxlXG5cbiAgICAgIGlmIChcbiAgICAgICAgY2ZnLnRpdGxlID09ICdSZW1vdmUgTmFtZWQgQWNjb3VudHMnIC8vQUJNID4gQWNjb3VudCBMaXN0cyA+IFNlbGVjdCBBY2NvdW50XG4gICAgICApIHtcbiAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICdbaXRlbUlkPW9rXScsIC8vRGVsZXRlXG4gICAgICAgICAgJ1t0ZXh0PURlbGV0ZV0nIC8vRGVsZXRlXG4gICAgICAgIF1cbiAgICAgICAgbUl0ZW1zID0gdGhpcy5xdWVyeShtZW51SXRlbXMudG9TdHJpbmcoKSlcbiAgICAgICAgdG9EaXNhYmxlID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBpZiAodG9EaXNhYmxlICYmIG1JdGVtcykge1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgRm9ybSBXaW5kb3cgRGVsZXRlIEJ1dHRvbnMnKVxuICAgICAgICBtSXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKHRvRGlzYWJsZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGlmIChFeHQ0LmlzU3RyaW5nKGNmZykpIHtcbiAgICAgICAgY2ZnID0ge1xuICAgICAgICAgIHRpdGxlOiBjZmcsXG4gICAgICAgICAgbXNnOiBtc2csXG4gICAgICAgICAgZm46IGZuLFxuICAgICAgICAgIHNjb3BlOiBzY29wZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNmZyA9IEV4dDQuYXBwbHkoXG4gICAgICAgIHtcbiAgICAgICAgICBpY29uOiB0aGlzLklORk8sXG4gICAgICAgICAgYnV0dG9uczogdGhpcy5PS0NBTkNFTCxcbiAgICAgICAgICBidXR0b25UZXh0OiB7b2s6IE1rdExhbmcuZ2V0U3RyKCdtZXNzYWdlYm94LkRlbGV0ZScpfVxuICAgICAgICB9LFxuICAgICAgICBjZmdcbiAgICAgIClcblxuICAgICAgLy8gVE9ETy1sZWdhY3lcbiAgICAgIGlmICghTWt0My5Db25maWcuaXNGZWF0dXJlRW5hYmxlZCgnbWt0M0RzJykpIHtcbiAgICAgICAgY2ZnLmZuID0gRXh0NC5GdW5jdGlvbi5iaW5kKGNmZy5mbiwgY2ZnLnNjb3BlIHx8IHRoaXMsIFsnb2snXSlcbiAgICAgICAgcmV0dXJuIE1rdE1lc3NhZ2UuY29uZmlybURlbGV0ZShjZmcudGl0bGUsIGNmZy5tc2csIGNmZy5mbiwgY2ZnLmFuaW1hdGVUYXJnZXQpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLnNob3coY2ZnKVxuICAgIH1cbiAgfVxufVxuXG5cbi8vIFRoaXMgZnVuY3Rpb24gZGlzYWJsZXMgdGhlIFNhdmUsIEFwcGx5LCBDaGFuZ2UgLi4uIGJ1dHRvbnMgaW4gdGhlIEFkbWluIFNlY3Rpb24uXG4vLyAgSXQgY2FuIGJlIHVzZWQgdG8gZGlzYWJsZSBhbnkgZ2VuZXJpYyBTYXZlIHdpbmRvdy5cbkFQUC5kaXNhYmxlSGFybWZ1bFNhdmVCdXR0b25zID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IEhhcm1mdWwgU2F2ZSBCdXR0b25zJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0LldpbmRvdy5wcm90b3R5cGUuc2hvdycpKSB7XG4gICAgRXh0LldpbmRvdy5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIChhbmltYXRlVGFyZ2V0LCBjYiwgc2NvcGUpIHtcbiAgICAgIC8vIERpc2FibGUgQUxMIGFyZWFzID4gQUxMIGFzc2V0cyA+IEFMTCBTYXZlIHdpbmRvd3NcblxuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgdGhpcyAmJlxuICAgICAgICB0aGlzLmJ1dHRvbnMgJiZcbiAgICAgICAgdGhpcy5idXR0b25zLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RDYW52YXMuZ2V0QWN0aXZlVGFiJykgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpXG4gICAgICApIHtcbiAgICAgICAgbGV0IHRvRGlzYWJsZVxuXG4gICAgICAgIGlmICh0eXBlb2YgTWt0TWFpbk5hdiAhPT0gJ3VuZGVmaW5lZCcgJiYgTWt0TWFpbk5hdiAmJiBNa3RNYWluTmF2LmFjdGl2ZU5hdiA9PSAndG5DdXN0QWRtaW4nICYmIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS50aXRsZSkge1xuICAgICAgICAgIGxldCBhY3RpdmVUYWJUaXRsZSA9IE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS50aXRsZVxuICAgICAgICAgIC8vIEFkbWluXG4gICAgICAgICAgc3dpdGNoIChhY3RpdmVUYWJUaXRsZSkge1xuICAgICAgICAgICAgY2FzZSAnTG9naW4gU2V0dGluZ3MnOlxuICAgICAgICAgICAgLy8gVXNlcnMgJiBSb2xlc1xuICAgICAgICAgICAgY2FzZSAnVXNlcnMnOlxuICAgICAgICAgICAgY2FzZSAnUm9sZXMnOlxuICAgICAgICAgICAgLy8gV29ya3NwYWNlcyAmIFBhcnRpdGlvbnNcbiAgICAgICAgICAgIGNhc2UgJ1dvcmtzcGFjZXMnOlxuICAgICAgICAgICAgY2FzZSAnTGVhZCBQYXJ0aXRpb25zJzpcbiAgICAgICAgICAgIGNhc2UgJ1BlcnNvbiBQYXJ0aXRpb25zJzpcbiAgICAgICAgICAgIGNhc2UgJ0xvY2F0aW9uJzpcbiAgICAgICAgICAgIGNhc2UgJ1NtYXJ0IENhbXBhaWduJzpcbiAgICAgICAgICAgIGNhc2UgJ0NvbW11bmljYXRpb24gTGltaXRzJzpcbiAgICAgICAgICAgIGNhc2UgJ1RhZ3MnOlxuICAgICAgICAgICAgY2FzZSAnRmllbGQgTWFuYWdlbWVudCc6XG4gICAgICAgICAgICBjYXNlICdTYWxlc2ZvcmNlIE9iamVjdHMgU3luYyc6XG4gICAgICAgICAgICBjYXNlICdTYWxlc2ZvcmNlJzpcbiAgICAgICAgICAgIGNhc2UgJ01pY3Jvc29mdCBEeW5hbWljcyc6XG4gICAgICAgICAgICBjYXNlICdEeW5hbWljcyBFbnRpdGllcyBTeW5jJzpcbiAgICAgICAgICAgIC8vIFNhbGVzIEluc2lnaHRcbiAgICAgICAgICAgIGNhc2UgJ1NhbGVzIEluc2lnaHQnOlxuICAgICAgICAgICAgY2FzZSAnRW1haWwgQWRkLWluJzpcbiAgICAgICAgICAgIC8vIExhbmRpbmcgUGFnZXNcbiAgICAgICAgICAgIGNhc2UgJ0xhbmRpbmcgUGFnZXMnOlxuICAgICAgICAgICAgY2FzZSAnUnVsZXMnOlxuICAgICAgICAgICAgY2FzZSAnTXVuY2hraW4nOlxuICAgICAgICAgICAgLy8gTGF1bmNoUG9pbnRcbiAgICAgICAgICAgIGNhc2UgJ0luc3RhbGxlZCBTZXJ2aWNlcyc6XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgY2FzZSAnV2ViaG9va3MnOlxuICAgICAgICAgICAgY2FzZSAnU2luZ2xlIFNpZ24tT24nOlxuICAgICAgICAgICAgY2FzZSAnUmV2ZW51ZSBDeWNsZSBBbmFseXRpY3MnOlxuICAgICAgICAgICAgY2FzZSAnVHJlYXN1cmUgQ2hlc3QnOlxuICAgICAgICAgICAgICB0b0Rpc2FibGUgPSB0cnVlXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMudGl0bGUpIHtcbiAgICAgICAgICBzd2l0Y2ggKHRoaXMudGl0bGUpIHtcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzXG4gICAgICAgICAgICAvLyBQcm9ncmFtID4gQWN0aW9uc1xuICAgICAgICAgICAgY2FzZSAnU2FsZXNmb3JjZSBDYW1wYWlnbiBTeW5jJzpcbiAgICAgICAgICAgIGNhc2UgJ0V2ZW50IFNldHRpbmdzJzpcbiAgICAgICAgICAgIC8vIFByb2dyYW0gPiBTZXR1cFxuICAgICAgICAgICAgY2FzZSAnTmV3IFJlcG9ydGluZyc6XG4gICAgICAgICAgICBjYXNlICdFZGl0IFJlcG9ydGluZyc6XG4gICAgICAgICAgICBjYXNlICdOZXcgVmVydGljYWwnOlxuICAgICAgICAgICAgY2FzZSAnRWRpdCBWZXJ0aWNhbCc6XG4gICAgICAgICAgICAvLyBQcm9ncmFtID4gTWVtYmVycyAmIExpc3QgPiBBY3Rpb25zXG4gICAgICAgICAgICBjYXNlICdJbXBvcnQgTGlzdCc6XG4gICAgICAgICAgICAvLyBOdXJ0dXJlIFByb2dyYW0gPiBTZXR1cFxuICAgICAgICAgICAgY2FzZSAnUHJvZ3JhbSBTdGF0dXMnOlxuICAgICAgICAgICAgY2FzZSAnRWRpdCBFeGhhdXN0ZWQgQ29udGVudCBOb3RpZmljYXRpb24gU2V0dGluZ3MnOlxuICAgICAgICAgICAgLy8gU21hcnQgQ2FtcGFpZ24gPiBTY2hlZHVsZVxuICAgICAgICAgICAgY2FzZSAnQWN0aXZhdGUgVHJpZ2dlcmVkIENhbXBhaWduJzpcbiAgICAgICAgICAgIGNhc2UgJ1NjaGVkdWxlIFJlY3VycmVuY2UnOlxuICAgICAgICAgICAgY2FzZSAnUnVuIE9uY2UnOlxuICAgICAgICAgICAgY2FzZSAnRWRpdCBRdWFsaWZpY2F0aW9uIFJ1bGVzJzpcbiAgICAgICAgICAgIC8vIERhdGFiYXNlXG4gICAgICAgICAgICAvLyBBTEwgPiBOZXdcbiAgICAgICAgICAgIGNhc2UgJ05ldyBGaWVsZCBPcmdhbml6ZXInOlxuICAgICAgICAgICAgICB0b0Rpc2FibGUgPSB0cnVlXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAvLyBQcm9ncmFtID4gQWN0aW9uc1xuICAgICAgICAgICAgY2FzZSAnRXZlbnQgU2NoZWR1bGUnOlxuICAgICAgICAgICAgLy8gUHJvZ3JhbSA+IFNldHVwXG4gICAgICAgICAgICBjYXNlICdFZGl0IENoYW5uZWwnOlxuICAgICAgICAgICAgY2FzZSAnTmV3IENvc3QnOlxuICAgICAgICAgICAgY2FzZSAnRWRpdCBDb3N0JzpcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzICYgQW5hbHl0aWNzXG4gICAgICAgICAgICAvLyBSZXBvcnRcbiAgICAgICAgICAgIGNhc2UgJ0RhdGUgb2YgQWN0aXZpdHknOlxuICAgICAgICAgICAgY2FzZSAnR3JvdXAgYnkgU2VnbWVudGF0aW9ucyc6XG4gICAgICAgICAgICBjYXNlICdHbG9iYWwgUmVwb3J0aW5nJzpcbiAgICAgICAgICAgIGNhc2UgJ0V4cG9ydCBSb3dzIEF2YWlsYWJsZSc6XG4gICAgICAgICAgICBjYXNlICdGaWx0ZXIgYnkgTW9kZWwnOlxuICAgICAgICAgICAgY2FzZSAnRmlsdGVyIGJ5IFBlcmlvZCBDb3N0JzpcbiAgICAgICAgICAgIC8vIEVtYWlsIFBlcmZvcm1hbmNlIFJlcG9ydFxuICAgICAgICAgICAgY2FzZSAnU2VudCBEYXRlJzpcbiAgICAgICAgICAgIGNhc2UgJ0VtYWlsIEZpbHRlcic6XG4gICAgICAgICAgICBjYXNlICdBcmNoaXZlZCBFbWFpbCBGaWx0ZXInOlxuICAgICAgICAgICAgLy8gRW1haWwgdmlhIE1TSSBQZXJmb3JtYW5jZSBSZXBvcnRcbiAgICAgICAgICAgIGNhc2UgJ0dyb3VwIEVtYWlscyBieSc6XG4gICAgICAgICAgICAvLyBFbmdhZ2VtZW50IFN0cmVhbSBQZXJmb3JtYW5jZSBSZXBvcnRcbiAgICAgICAgICAgIGNhc2UgJ0VuZ2FnZW1lbnQgUHJvZ3JhbSBFbWFpbCBGaWx0ZXInOlxuICAgICAgICAgICAgLy8gUGVvcGxlIFBlcmZvcm1hbmNlIFJlcG9ydFxuICAgICAgICAgICAgY2FzZSAnUGVyc29uIENyZWF0ZWQgQXQnOlxuICAgICAgICAgICAgY2FzZSAnR3JvdXAgUGVvcGxlIGJ5JzpcbiAgICAgICAgICAgIGNhc2UgJ09wcG9ydHVuaXR5IENvbHVtbnMnOlxuICAgICAgICAgICAgY2FzZSAnTWFuYWdlIEN1c3RvbSBTbWFydCBMaXN0IENvbHVtbnMnOlxuICAgICAgICAgICAgLy8gUHJvZ3JhbSBQZXJmb3JtYW5jZSBSZXBvcnRcbiAgICAgICAgICAgIGNhc2UgJ1Byb2dyYW0gRmlsdGVyJzpcbiAgICAgICAgICAgIGNhc2UgJ0FyY2hpdmVkIFByb2dyYW0gRmlsdGVyJzpcbiAgICAgICAgICAgIC8vIFdlYiBBY3Rpdml0eSBSZXBvcnRcbiAgICAgICAgICAgIGNhc2UgJ0FjdGl2aXR5IFNvdXJjZSc6XG4gICAgICAgICAgICAvLyBPcHAgSW5mbHVlbmNlIEFuYWx5emVyICYgU3VjY2VzcyBQYXRoIEFuYWx5emVyXG4gICAgICAgICAgICBjYXNlICdUaW1lIEZyYW1lJzpcbiAgICAgICAgICAgIC8vIE9wcCBJbmZsdWVuY2UgQW5hbHl6ZXJcbiAgICAgICAgICAgIGNhc2UgJ1Nob3cgSW50ZXJlc3RpbmcgTW9tZW50cyc6XG4gICAgICAgICAgICAgIHRvRGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ2J1dHRvbicsIG51bGwsIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSwgbnVsbClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy50aXRsZS5zZWFyY2goL0ZpbHRlciBieSAuKy8pICE9IC0xKSB7XG4gICAgICAgICAgICB0b0Rpc2FibGUgPSBBUFAuZXZhbHVhdGVNZW51KCdidXR0b24nLCBudWxsLCBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCksIG51bGwpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvRGlzYWJsZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBIYXJtZnVsIFNhdmUgQnV0dG9ucycpXG4gICAgICAgICAgbGV0IGN1cnJCdXR0b25cblxuICAgICAgICAgIGZvciAobGV0IGlpID0gdGhpcy5idXR0b25zLmxlbmd0aCAtIDE7IGlpID49IDA7IGlpLS0pIHtcbiAgICAgICAgICAgIGN1cnJCdXR0b24gPSB0aGlzLmJ1dHRvbnNbaWldXG4gICAgICAgICAgICBpZiAoY3VyckJ1dHRvbi5jbHMgPT0gJ21rdEJ1dHRvblBvc2l0aXZlJyB8fCBjdXJyQnV0dG9uLmljb25DbHMgPT0gJ21raU9rJykge1xuICAgICAgICAgICAgICBjdXJyQnV0dG9uLnNldERpc2FibGVkKHRydWUpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5yZW5kZXJlZCkge1xuICAgICAgICB0aGlzLnJlbmRlcihFeHQuZ2V0Qm9keSgpKVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaGlkZGVuID09PSBmYWxzZSkge1xuICAgICAgICB0aGlzLnRvRnJvbnQoKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZmlyZUV2ZW50KCdiZWZvcmVzaG93JywgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgICB9XG4gICAgICBpZiAoY2IpIHtcbiAgICAgICAgdGhpcy5vbignc2hvdycsIGNiLCBzY29wZSwge3NpbmdsZTogdHJ1ZX0pXG4gICAgICB9XG4gICAgICB0aGlzLmhpZGRlbiA9IGZhbHNlXG4gICAgICBpZiAoRXh0LmlzRGVmaW5lZChhbmltYXRlVGFyZ2V0KSkge1xuICAgICAgICB0aGlzLnNldEFuaW1hdGVUYXJnZXQoYW5pbWF0ZVRhcmdldClcbiAgICAgIH1cbiAgICAgIHRoaXMuYmVmb3JlU2hvdygpXG4gICAgICBpZiAodGhpcy5hbmltYXRlVGFyZ2V0KSB7XG4gICAgICAgIHRoaXMuYW5pbVNob3coKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hZnRlclNob3coKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gIH1cbn1cblxuLy8gaW5qZWN0aW5nIHRoZSBBbmFseXplciBOYXZpZ2F0aW9uIEJhciB0aGF0IGFsbG93cyBmb3IgZWFzeSBzd2l0Y2hpbmcgYmV0d2VlbiBhbmFseXplcnMgd2l0aG91dCByZXR1cm5pbmcgdG8gdGhlIGZvbGRlciB0cmVlXG5BUFAudXBkYXRlTmF2QmFyID0gZnVuY3Rpb24gKCkge1xuICBsZXQgaXNQb2RzTG9hZGVkID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIFBPRFMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBJbmplY3Rpbmc6IEFuYWx5emVyIE5hdmlnYXRpb24gQmFyJylcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzUG9kc0xvYWRlZClcblxuICAgICAgbGV0IHBvZCA9IG5ldyBMSUIuZ2V0Q29va2llKCd1c2VyUG9kJylcblxuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBwb2QudmFsdWVTZXQubGVuZ3RoOyB5KyspIHtcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ocmVmID09IHBvZC52YWx1ZVNldFt5XS51cmwpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBVcGRhdGluZzogQ1NTIGZvciBBbmFseXplciBOYXZpZ2F0aW9uIEJhcicpXG4gICAgICAgICAgLy8gVGhpcyBjb2RlIGJsb2NrIHN3YXBzIHRoZSBjb2xvcnMgb2YgdGhlIGFuYWx5emVyIGxhYmVscyBkZXBlbmRpbmcgb24gd2hpY2ggb25lIHRoZSB1c2VyIGlzIGN1cnJlbnRseSB2aWV3aW5nLlxuICAgICAgICAgICRqID0galF1ZXJ5Lm5vQ29uZmxpY3QoKVxuICAgICAgICAgIGxldCBjdXJyUG9zaXRpb24gPSAnIycgKyBwb2QudmFsdWVTZXRbeV0ucG9zaXRpb25cbiAgICAgICAgICAkaihjdXJyUG9zaXRpb24pLnBhcmVudCgpLmNzcygnZGlzcGxheScsICdibG9jaycpXG4gICAgICAgICAgJGooY3VyclBvc2l0aW9uKS5wYXJlbnQoKS5zaWJsaW5ncygpLmNzcygnZGlzcGxheScsICdub25lJylcbiAgICAgICAgICAkaihjdXJyUG9zaXRpb24pLnJlbW92ZUNsYXNzKCdhbmFseXplci1idXR0b24nKS5hZGRDbGFzcygnYW5hbHl6ZXItdGl0bGUnKVxuICAgICAgICAgICRqKGN1cnJQb3NpdGlvbikuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYW5hbHl6ZXItdGl0bGUnKS5hZGRDbGFzcygnYW5hbHl6ZXItYnV0dG9uJylcbiAgICAgICAgICAkaignI21vZGVsZXIsI3N1Y2Nlc3MtcGF0aC1hbmFseXplciwjb3Bwb3J0dW5pdHktaW5mbHVlbmNlLWFuYWx5emVyLCNwcm9ncmFtLWFuYWx5emVyJykuYmluZCgnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gSWRlbnRpZnlpbmc6IEN1cnJlbnQgQW5hbHl6ZXInKVxuICAgICAgICAgICAgLy8gVXBkYXRlcyB0aGUgY3VyclBvc2l0aW9uIGJhc2VkIG9uIHRoZSBkaXYgc2VsZWN0ZWRcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgcG9kLnZhbHVlU2V0Lmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAgIGlmIChlLnRhcmdldC5pZCA9PSBwb2QudmFsdWVTZXRbeF0ucG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICBjdXJyUG9zaXRpb24gPSB4XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHBvZC52YWx1ZVNldFtjdXJyUG9zaXRpb25dLnVybFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sIDApXG59XG5cbi8vIG92ZXJyaWRlcyB0aGUgZnVuY3Rpb24gZm9yIHNhdmluZyBhZGRpdGlvbnMgYW5kIGRlbGV0aW9ucyB0byBOdXJ0dXJlIFN0cmVhbXMuXG5BUFAub3ZlcnJpZGVTYXZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE92ZXJyaWRpbmc6IFNhdmluZyBmb3IgTnVydHVyZSBTdHJlYW1zJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5kYXRhLlN0b3JlLnByb3RvdHlwZS5zeW5jJykpIHtcbiAgICBsZXQgcHJldkRhdGFTdG9yZVN5bmMgPSBNa3QzLmRhdGEuU3RvcmUucHJvdG90eXBlLnN5bmNcbiAgICBNa3QzLmRhdGEuU3RvcmUucHJvdG90eXBlLnN5bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuc3RvcmVJZCA9PSAnQ2FsZW5kYXJWaWV3JyB8fFxuICAgICAgICB0aGlzLnN0b3JlSWQgPT0gJ0NhbGVuZGFyVmlld0xpc3QnIHx8IC8vQ2FsZW5kYXJWaWV3TGlzdCBpcyBmb3IgdGhlIHByZXNlbnRhdGlvblxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZi5zZWFyY2goJy8jJyArIG1rdG9DYWxlbmRhckZyYWdtZW50KSAhPSAtMSB8fFxuICAgICAgICAod2luZG93LmxvY2F0aW9uLmhyZWYuc2VhcmNoKCcjJyArIG1rdG9BY2NvdW50QmFzZWRNYXJrZXRpbmdGcmFnbWVudCkgIT0gLTEgJiYgIXRoaXMuc3RvcmVJZClcbiAgICAgICkge1xuICAgICAgICAvL2FkZGVkIHRvIHRha2UgY2FyZSBvZiB0aGUgZXJyb3Igb24gdGhlIGVkaXQgdmlldyBpbiBOYW1lZCBBY2NvdW50c1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBSZXN0b3Jpbmc6IE9yaWdpbmFsIHN5bmMgRnVuY3Rpb24nKVxuICAgICAgICBwcmV2RGF0YVN0b3JlU3luYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgZGlzYWJsZVxuICAgICAgICBpZiAodHlwZW9mIE1rdENhbnZhcyAhPT0gJ3VuZGVmaW5lZCcgJiYgTWt0Q2FudmFzICYmIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSAmJiB0b2dnbGVTdGF0ZSAhPSAnZmFsc2UnKSB7XG4gICAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ2J1dHRvbicsIG51bGwsIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSwgbnVsbClcbiAgICAgICAgfSBlbHNlIGlmICh0b2dnbGVTdGF0ZSA9PSAnZmFsc2UnKSB7XG4gICAgICAgICAgZGlzYWJsZSA9IHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZGlzYWJsZSkge1xuICAgICAgICAgIGlmICh0aGlzLmF1dG9TeW5jU3VzcGVuZGVkKSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9TeW5jID0gdHJ1ZVxuICAgICAgICAgICAgdGhpcy5hdXRvU3luY1N1c3BlbmRlZCA9IGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMuZ2V0UHJveHkoKSBpbnN0YW5jZW9mIE1rdDMuZGF0YS5wcm94eS5BamF4UG9zdCkge1xuICAgICAgICAgICAgTWt0My5TeW5jaHJvbml6ZXIuc3luYyh0aGlzKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL3RoaXMgaXMgY2FsbGVkIG9uIHRoZSBjYWxlbmRhclxuICAgICAgICAgICAgdGhpcy5jYWxsUGFyZW50KGFyZ3VtZW50cylcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdFeHQ0LmRhdGEuTW9kZWwucHJvdG90eXBlLmRlc3Ryb3knKSkge1xuICAgIEV4dDQuZGF0YS5Nb2RlbC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICBsZXQgZGlzYWJsZVxuICAgICAgaWYgKHR5cGVvZiBNa3RDYW52YXMgIT09ICd1bmRlZmluZWQnICYmIE1rdENhbnZhcyAmJiBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkgJiYgdG9nZ2xlU3RhdGUgIT0gJ2ZhbHNlJykge1xuICAgICAgICBkaXNhYmxlID0gQVBQLmV2YWx1YXRlTWVudSgnYnV0dG9uJywgbnVsbCwgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLCBudWxsKVxuICAgICAgfSBlbHNlIGlmICh0b2dnbGVTdGF0ZSA9PSAnZmFsc2UnKSB7XG4gICAgICAgIGRpc2FibGUgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIGlmICghZGlzYWJsZSkge1xuICAgICAgICBvcHRpb25zID0gRXh0LmFwcGx5KFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlY29yZHM6IFt0aGlzXSxcbiAgICAgICAgICAgIGFjdGlvbjogJ2Rlc3Ryb3knXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvcHRpb25zXG4gICAgICAgIClcblxuICAgICAgICBsZXQgbWUgPSB0aGlzLFxuICAgICAgICAgIGlzTm90UGhhbnRvbSA9IG1lLnBoYW50b20gIT09IHRydWUsXG4gICAgICAgICAgc2NvcGUgPSBvcHRpb25zLnNjb3BlIHx8IG1lLFxuICAgICAgICAgIHtzdG9yZXN9ID0gbWUsXG4gICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgc3RvcmVDb3VudCxcbiAgICAgICAgICBzdG9yZSxcbiAgICAgICAgICBhcmdzLFxuICAgICAgICAgIG9wZXJhdGlvbixcbiAgICAgICAgICBjYWxsYmFja1xuXG4gICAgICAgIG9wZXJhdGlvbiA9IG5ldyBFeHQuZGF0YS5PcGVyYXRpb24ob3B0aW9ucylcblxuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uIChvcGVyYXRpb24pIHtcbiAgICAgICAgICBhcmdzID0gW21lLCBvcGVyYXRpb25dXG4gICAgICAgICAgaWYgKG9wZXJhdGlvbi53YXNTdWNjZXNzZnVsKCkpIHtcbiAgICAgICAgICAgIGZvciAoc3RvcmVDb3VudCA9IHN0b3Jlcy5sZW5ndGg7IGkgPCBzdG9yZUNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgc3RvcmUgPSBzdG9yZXNbaV1cbiAgICAgICAgICAgICAgc3RvcmUucmVtb3ZlKG1lLCB0cnVlKVxuICAgICAgICAgICAgICBpZiAoaXNOb3RQaGFudG9tKSB7XG4gICAgICAgICAgICAgICAgc3RvcmUuZmlyZUV2ZW50KCd3cml0ZScsIHN0b3JlLCBvcGVyYXRpb24pXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1lLmNsZWFyTGlzdGVuZXJzKClcbiAgICAgICAgICAgIEV4dC5jYWxsYmFjayhvcHRpb25zLnN1Y2Nlc3MsIHNjb3BlLCBhcmdzKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFeHQuY2FsbGJhY2sob3B0aW9ucy5mYWlsdXJlLCBzY29wZSwgYXJncylcbiAgICAgICAgICB9XG4gICAgICAgICAgRXh0LmNhbGxiYWNrKG9wdGlvbnMuY2FsbGJhY2ssIHNjb3BlLCBhcmdzKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzTm90UGhhbnRvbSkge1xuICAgICAgICAgIG1lLmdldFByb3h5KCkuZGVzdHJveShvcGVyYXRpb24sIGNhbGxiYWNrLCBtZSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvcGVyYXRpb24uY29tcGxldGUgPSBvcGVyYXRpb24uc3VjY2VzcyA9IHRydWVcbiAgICAgICAgICBvcGVyYXRpb24ucmVzdWx0U2V0ID0gbWUuZ2V0UHJveHkoKS5yZWFkZXIubnVsbFJlc3VsdFNldFxuICAgICAgICAgIGNhbGxiYWNrKG9wZXJhdGlvbilcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gZGlzYWJsZXMgc2F2aW5nIGZvciB0aGUgRWRpdG9ycyAoZW1haWxzLCBmb3JtcywgcHVzaCBub3RpZmljYXRpb25zLCBhbmQgc29jaWFsIGFwcHMpIGFuZCB0aGUgTnVydHVyZSBTdHJlYW1zLlxuQVBQLmRpc2FibGVTYXZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogU2F2aW5nIGZvciBFZGl0b3JzJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5kYXRhLlN0b3JlLnByb3RvdHlwZS5zeW5jJykpIHtcbiAgICBNa3QzLmRhdGEuU3RvcmUucHJvdG90eXBlLnN5bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgU2F2aW5nIGZvciBFZGl0b3JzIChzeW5jKScpXG4gICAgfVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0NC5kYXRhLk1vZGVsLnByb3RvdHlwZS5kZXN0cm95JykpIHtcbiAgICBFeHQ0LmRhdGEuTW9kZWwucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgU2F2aW5nIGZvciBFZGl0b3JzIChkZXN0cm95KScpXG4gICAgfVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5jb250cm9sbGVyLmVkaXRvcicpKSB7XG4gICAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3IucHJvdG90eXBlLmNoYW5nZU1vZHVsZU9yZGVyJykpIHtcbiAgICAgIE1rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yLnByb3RvdHlwZS5jaGFuZ2VNb2R1bGVPcmRlciA9IGZ1bmN0aW9uIChtb2R1bGVDb21wb25lbnQsIG9yZGVyRGVsdGEpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFNhdmluZyBmb3IgRWRpdG9ycyAoY2hhbmdlTW9kdWxlT3JkZXIpJylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmZvcm0uc2V0dGluZ3MuRmllbGRTZWxlY3Rpb24ucHJvdG90eXBlLmRlbGV0ZUZvcm1GaWVsZCcpKSB7XG4gICAgICBNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmZvcm0uc2V0dGluZ3MuRmllbGRTZWxlY3Rpb24ucHJvdG90eXBlLmRlbGV0ZUZvcm1GaWVsZCA9IGZ1bmN0aW9uIChmb3JtRmllbGQpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBFbmFibGUgRGVsZXRpbmcgRm9ybSBGaWVsZCcpXG4gICAgICAgIGxldCBmb3JtRmllbGRXaWRnZXQgPSBmb3JtRmllbGQuZ2V0RmllbGRXaWRnZXQoKSxcbiAgICAgICAgICBmb3JtRmllbGRJZCxcbiAgICAgICAgICBjaGlsZEZpZWxkSW5kZXgsXG4gICAgICAgICAgY2hpbGRGb3JtRmllbGQsXG4gICAgICAgICAgYWxsRm9ybUZpZWxkc1xuXG4gICAgICAgIGlmIChmb3JtRmllbGRXaWRnZXQgJiYgZm9ybUZpZWxkV2lkZ2V0LmdldCgnZGF0YXR5cGUnKSA9PT0gJ2ZpZWxkc2V0Jykge1xuICAgICAgICAgIGFsbEZvcm1GaWVsZHMgPSB0aGlzLmdldEZvcm0oKS5nZXRGb3JtRmllbGRzKClcbiAgICAgICAgICBmb3JtRmllbGRJZCA9IGZvcm1GaWVsZC5nZXQoJ2lkJylcbiAgICAgICAgICBmb3IgKGNoaWxkRmllbGRJbmRleCA9IDA7IGNoaWxkRmllbGRJbmRleCA8IGFsbEZvcm1GaWVsZHMuZ2V0Q291bnQoKTsgY2hpbGRGaWVsZEluZGV4KyspIHtcbiAgICAgICAgICAgIGNoaWxkRm9ybUZpZWxkID0gYWxsRm9ybUZpZWxkcy5nZXRBdChjaGlsZEZpZWxkSW5kZXgpXG4gICAgICAgICAgICBpZiAoY2hpbGRGb3JtRmllbGQuZ2V0KCdmaWVsZHNldEZpZWxkSWQnKSA9PSBmb3JtRmllbGRJZCkge1xuICAgICAgICAgICAgICB0aGlzLmRlbGV0ZUZvcm1GaWVsZChjaGlsZEZvcm1GaWVsZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3JtRmllbGQuZGVzdHJveSh7XG4gICAgICAgICAgc2NvcGU6IHRoaXMsXG4gICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uIChmaWVsZCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgIGlmIChmb3JtRmllbGRXaWRnZXQpIHtcbiAgICAgICAgICAgICAgICBmb3JtRmllbGRXaWRnZXQuZGVzdHJveSgpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC8vIFRoaXMgYWxsb3dzIGZvciBtdWx0aXBsZSBmb3JtIGZpZWxkcyB0byBiZSBkZWxldGVkXG4gICAgICAgIHRoaXMucmVudW1iZXJXaWRnZXRzKClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gZGlzYWJsZXMgc3BlY2lmaWMgcmVxdWVzdHMgZnJvbSBjb21wbGV0aW5nIHRvIHByZXZlbnQgc2F2aW5nLlxuQVBQLmRpc2FibGVSZXF1ZXN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBTcGVjaWZpYyBSZXF1ZXN0cycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdFNlc3Npb24uYWpheFJlcXVlc3QnKSkge1xuICAgIGlmICh0eXBlb2Ygb3JpZ0FqYXhSZXF1ZXN0RnVuYyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgb3JpZ0FqYXhSZXF1ZXN0RnVuYyA9IE1rdFNlc3Npb24uYWpheFJlcXVlc3RcbiAgICB9XG4gICAgTWt0U2Vzc2lvbi5hamF4UmVxdWVzdCA9IGZ1bmN0aW9uICh1cmwsIG9wdHMpIHtcbiAgICAgIHN3aXRjaCAodXJsKSB7XG4gICAgICAgIGNhc2UgJ2NybS9lbmFibGVTeW5jJzpcbiAgICAgICAgY2FzZSAnbGVhZERhdGFiYXNlL3VwZGF0ZUxlYWQnOlxuICAgICAgICBjYXNlICdmaWVsZE1hbmFnZW1lbnQvYW5hbHl0aWNzT3B0aW9uc1N1Ym1pdCc6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFNwZWNpZmljIFJlcXVlc3RzJylcbiAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICBjYXNlICdhbmFseXRpY3MvZWRpdFJlcG9ydFNldHRpbmdzJzpcbiAgICAgICAgY2FzZSAnYW5hbHl0aWNzL2FwcGx5Q29tcG9uZW50RmlsdGVyJzpcbiAgICAgICAgY2FzZSAnYW5hbHl0aWNzL3NldFJlcG9ydFNlZ21lbnRhdGlvbic6XG4gICAgICAgICAgaWYgKHR5cGVvZiBNa3RFeHBsb3JlciAhPT0gJ3VuZGVmaW5lZCcgJiYgTWt0RXhwbG9yZXIgJiYgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQgJiYgb3B0cyAmJiBvcHRzLnNlcmlhbGl6ZVBhcm1zKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIG9wdHMuc2VyaWFsaXplUGFybXMubm9kZUlkICYmXG4gICAgICAgICAgICAgIE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKG9wdHMuc2VyaWFsaXplUGFybXMubm9kZUlkKSAmJlxuICAgICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChvcHRzLnNlcmlhbGl6ZVBhcm1zLm5vZGVJZCkuYXR0cmlidXRlcyAmJlxuICAgICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChvcHRzLnNlcmlhbGl6ZVBhcm1zLm5vZGVJZCkuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTFcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgU3BlY2lmaWMgUmVxdWVzdHMnKVxuICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgb3B0cy5zZXJpYWxpemVQYXJtcy5yZXBvcnRJZCAmJlxuICAgICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChta3RvQW5hbHl0aWNzRnJhZ21lbnQgKyBvcHRzLnNlcmlhbGl6ZVBhcm1zLnJlcG9ydElkKSAmJlxuICAgICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChta3RvQW5hbHl0aWNzRnJhZ21lbnQgKyBvcHRzLnNlcmlhbGl6ZVBhcm1zLnJlcG9ydElkKS5hdHRyaWJ1dGVzICYmXG4gICAgICAgICAgICAgIE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKG1rdG9BbmFseXRpY3NGcmFnbWVudCArIG9wdHMuc2VyaWFsaXplUGFybXMucmVwb3J0SWQpXG4gICAgICAgICAgICAgICAgLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFNwZWNpZmljIFJlcXVlc3RzJylcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgIH1cblxuICAgICAgaWYgKHVybC5zZWFyY2goJ15zYWxlc2ZvcmNlL2VuYWJsZVN5bmNoJykgIT0gLTEpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFNwZWNpZmljIFJlcXVlc3RzJylcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cbiAgICAgIG9yaWdBamF4UmVxdWVzdEZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH1cbiAgfVxufVxuXG4vLyBzZXQgdGhlIFByb2dyYW0gU3RhdHVzIHRvIG9mZiBmb3IgTnVydHVyZSBQcm9ncmFtc1xuQVBQLmRpc2FibGVOdXJ0dXJlUHJvZ3JhbXMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogTnVydHVyZSBQcm9ncmFtcycpXG4gIGlmIChcbiAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdENhbnZhcy5nZXRBY3RpdmVUYWInKSAmJlxuICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSAmJlxuICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcgJiZcbiAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSA9PSAtMSAmJlxuICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcuY29tcElkXG4gICkge1xuICAgIGxldCB7Y29tcElkfSA9IE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWdcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGluZyBOdXJ0dXJlIFByb2dyYW0nKVxuICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgJy9tYXJrZXRpbmdFdmVudC9zZXRQcm9ncmFtU3RhdHVzU3VibWl0JyxcbiAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICcmY29tcElkPScgKyBjb21wSWQgK1xuICAgICAgICAnJl9qc29uPXtcInByb2dyYW1JZFwiOicgKyBjb21wSWQgK1xuICAgICAgICAnLFwic3RhdHVzVmFsdWVcIjpcIm9mZlwifSZ4c3JmSWQ9JyArIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgJ1BPU1QnLFxuICAgICAgdHJ1ZSxcbiAgICAgICdqc29uJyxcbiAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXNwb25zZSlcbiAgICAgICAgaWYgKHJlc3VsdC5KU09OUmVzdWx0cy5hcHB2YXJzLnJlc3VsdCA9PSAnU3VjY2VzcycpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBTdWNjZXNzOiBEaXNhYmxlZCBOdXJ0dXJlIFByb2dyYW06ICcgKyByZXN1bHQuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLnRleHQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gIH1cbn1cblxuLy8gb3BlbnMgdGhlIFNlbmQgdmlhIEFkIEJyaWRnZSBtb2RhbCB3aW5kb3dcbkFQUC5vcGVuQWRCcmlkZ2VNb2RhbCA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3BlbmluZzogQWQgQnJpZGdlIE1vZGFsIFdpbmRvdycpXG4gIGxldCBpc0FkQnJpZGdlU21hcnRMaXN0ID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3gtYnRuLXRleHQgbWtpVXNlclRhcmdldCcpWzBdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNBZEJyaWRnZVNtYXJ0TGlzdClcbiAgICAgIGlmIChcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgneC1idG4tdGV4dCBta2lVc2VyVGFyZ2V0JykgJiZcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgneC1idG4tdGV4dCBta2lVc2VyVGFyZ2V0JylbMF0gJiZcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgneC1idG4tdGV4dCBta2lVc2VyVGFyZ2V0JylbMF0udHlwZSA9PSAnYnV0dG9uJ1xuICAgICAgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogT3BlbiBBZCBCcmlkZ2UgTW9kYWwgV2luZG93JylcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgneC1idG4tdGV4dCBta2lVc2VyVGFyZ2V0JylbMF0uY2xpY2soKVxuICAgICAgfVxuICAgIH1cbiAgfSwgMClcbn1cblxuLy8gcmVzZXRzIHRoZSBnb2xkZW4gTGFuZGluZyBQYWdlcyBwcm9wZXJ0aWVzL3ZhcmlhYmxlc1xuQVBQLnJlc2V0R29sZGVuTGFuZGluZ1BhZ2VQcm9wcyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gUmVzZXR0aW5nOiBHb2xkZW4gTGFuZGluZyBQYWdlcyBQcm9wZXJ0aWVzL1ZhcmlhYmxlcycpXG4gIGlmICh0eXBlb2YgTWt0U2VjdXJpdHkgIT09ICd1bmRlZmluZWQnICYmIE1rdFNlY3VyaXR5ICYmIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpKSB7XG4gICAgc3dpdGNoIChjdXJyVXJsRnJhZ21lbnQpIHtcbiAgICAgIGNhc2UgbWt0b0RlZmF1bHREaXlMYW5kaW5nUGFnZVJlc3BvbnNpdmVFZGl0RnJhZ21lbnQ6XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogUmVzZXR0aW5nIExhbmRpbmcgUGFnZSBSZXNwb25zaXZlIFByb3BlcnRpZXMvVmFyaWFibGVzJylcbiAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgJy9kYXRhL2xhbmRpbmdQYWdlL3VwZGF0ZT9jb250ZXh0PUxQRTExODIyJmRhdGE9JTVCJTdCJTIyaWQlMjIlM0ExMTgyMiUyQyUyMnJlc3BvbnNpdmVPcHRpb25zJTIyJTNBJTdCJTIydmFyaWFibGVzJTIyJTNBJTdCJTIyZ3JhZGllbnQxJTIyJTNBJTIyJTIzMkE1MzcwJTIyJTJDJTIyZ3JhZGllbnQyJTIyJTNBJTIyJTIzRjJGMkYyJTIyJTJDJTIyc2hvd1NlY3Rpb24yJTIyJTNBdHJ1ZSUyQyUyMnNob3dTZWN0aW9uMyUyMiUzQXRydWUlMkMlMjJzaG93U2VjdGlvbjQlMjIlM0F0cnVlJTJDJTIyc2hvd0Zvb3RlciUyMiUzQXRydWUlMkMlMjJzaG93U29jaWFsQnV0dG9ucyUyMiUzQXRydWUlMkMlMjJzZWN0aW9uNEJ1dHRvbkxhYmVsJTIyJTNBJTIyTmVlZCUyME1vcmUlMjBJbmZvJTNGJTIyJTJDJTIyc2VjdGlvbjRCdXR0b25MaW5rJTIyJTNBJTIyJTIzJTIyJTJDJTIyc2VjdGlvbjNMZWZ0QnV0dG9uTGFiZWwlMjIlM0ElMjJKb2luJTIwVXMlMjIlMkMlMjJzZWN0aW9uNEJnQ29sb3IlMjIlM0ElMjIlMjNGMkYyRjIlMjIlMkMlMjJmb290ZXJCZ0NvbG9yJTIyJTNBJTIyJTIzMkE1MzcwJTIyJTJDJTIyc2VjdGlvbjJCZ0NvbG9yJTIyJTNBJTIyJTIzRjJGMkYyJTIyJTJDJTIyc2VjdGlvbjNCZ0NvbG9yJTIyJTNBJTIyJTIzMkE1MzcwJTIyJTJDJTIyc2VjdGlvbjNMZWZ0QnV0dG9uTGluayUyMiUzQSUyMmh0dHBzJTNBJTJGJTJGd3d3Lm1hcmtldG8uY29tJTIyJTJDJTIyc2VjdGlvbjNSaWdodEJ1dHRvbkxhYmVsJTIyJTNBJTIyU2lnbiUyMFVwJTIyJTdEJTdEJTdEJTVEJnhzcmZJZD0nICtcbiAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgIHRydWUsXG4gICAgICAgICAgJycsXG4gICAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxufVxuXG4vLyB0cmFjayB0cmVlIG5vZGUgY2xpY2tzIGZvciBIZWFwIEFuYWx5dGljcy5cbkFQUC50cmFja05vZGVDbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gVHJhY2tpbmc6IFRyZWUgTm9kZSBDbGljaycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dC50cmVlLlRyZWVFdmVudE1vZGVsLnByb3RvdHlwZS5vbk5vZGVDbGljaycpKSB7XG4gICAgLy9jb25zb2xlLmxvZyhcIk1hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBUcmFja2luZyBUcmVlIE5vZGUgQ2xpY2tcIik7XG4gICAgRXh0LnRyZWUuVHJlZUV2ZW50TW9kZWwucHJvdG90eXBlLm9uTm9kZUNsaWNrID0gZnVuY3Rpb24gKGUsIG5vZGUpIHtcbiAgICAgIGlmIChub2RlICYmIG5vZGUudGV4dCAmJiBub2RlLmF0dHJpYnV0ZXMgJiYgbm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZCkge1xuICAgICAgICBsZXQgY3Vyck5vZGUgPSBub2RlLFxuICAgICAgICAgIGhlYXBFdmVudCA9IHtcbiAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgYXNzZXROYW1lOiBjdXJyTm9kZS50ZXh0LFxuICAgICAgICAgICAgYXNzZXRJZDogY3Vyck5vZGUuYXR0cmlidXRlcy5pZCxcbiAgICAgICAgICAgIGFzc2V0VHlwZTogY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSxcbiAgICAgICAgICAgIGFzc2V0UGF0aDogJycsXG4gICAgICAgICAgICB3b3Jrc3BhY2VJZDogY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQsXG4gICAgICAgICAgICB3b3Jrc3BhY2VOYW1lOiAnJ1xuICAgICAgICAgIH1cblxuICAgICAgICBoZWFwRXZlbnQuYXNzZXRQYXRoID0gY3Vyck5vZGUudGV4dFxuXG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBub2RlLmdldERlcHRoKCkgLSAxOyBpaSsrKSB7XG4gICAgICAgICAgY3Vyck5vZGUgPSBjdXJyTm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgaGVhcEV2ZW50LmFzc2V0UGF0aCA9IGN1cnJOb2RlLnRleHQgKyAnID4gJyArIGhlYXBFdmVudC5hc3NldFBhdGhcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAoYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3RlciB8fCBhY2NvdW50U3RyaW5nID09IG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyTUVVRSkgJiZcbiAgICAgICAgICBub2RlLmdldFBhdGgoKS5zZWFyY2goL15cXFxcXFxcXFxcXFxQcm9ncmFtc3Jvb3RcXFxcXFxcXFxcXFwxOVxcXFxcXFxcXFxcXDc1MDZcXFxcXFxcXFxcXFwvKSAhPSAtMVxuICAgICAgICApIHtcbiAgICAgICAgICAvL1RPRE9cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaGVhcEV2ZW50LndvcmtzcGFjZU5hbWUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChub2RlLmdldFBhdGgoKS5zcGxpdCgnXFxcXFxcXFxcXFxcJylbNF0pLnRleHQucmVwbGFjZSgnJmFtcDsgJywgJycpXG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gVHJhY2tpbmc6IFRyZWUgTm9kZSBDbGljayBFcnJvcjogJyArIGUpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhlYXBFdmVudC53b3Jrc3BhY2VOYW1lID0gQVBQLmdldFdvcmtzcGFjZU5hbWUoY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICBoZWFwRXZlbnQubmFtZSA9IGhlYXBFdmVudC53b3Jrc3BhY2VOYW1lXG5cbiAgICAgICAgICBpZiAoaGVhcEV2ZW50LndvcmtzcGFjZU5hbWUgPT0gJ0FkbWluJykge1xuICAgICAgICAgICAgaGVhcEV2ZW50LmFzc2V0VHlwZSA9ICdBZG1pbiBBcmVhJ1xuICAgICAgICAgICAgaGVhcEV2ZW50LndvcmtzcGFjZUlkID0gMFxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgIGhlYXBFdmVudC5uYW1lID0gaGVhcEV2ZW50LndvcmtzcGFjZU5hbWVcbiAgICAgICAgICBoZWFwRXZlbnQudXNlckZvbGRlciA9IHVzZXJOYW1lXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaGVhcEV2ZW50Lm5hbWUgPSBta3RvT3RoZXJXb3Jrc3BhY2VOYW1lXG4gICAgICAgIH1cbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCBoZWFwRXZlbnQpXG4gICAgICB9XG4gICAgICBub2RlLnVpLm9uQ2xpY2soZSlcbiAgICB9XG4gIH1cbn1cblxuQVBQLmdldFVzZXJSb2xlID0gZnVuY3Rpb24gKCkge1xuICBpZiAoTWt0UGFnZSAmJiBNa3RQYWdlLnVzZXJOYW1lKSB7XG4gICAgbGV0IHJvbGVTdWJzdHJpbmcgPSBNa3RQYWdlLnVzZXJOYW1lLnNlYXJjaCgvXFxbW15cXF1dK1xcXS8pXG4gICAgaWYgKHJvbGVTdWJzdHJpbmcgIT0gLTEpIHtcbiAgICAgIHJldHVybiBNa3RQYWdlLnVzZXJOYW1lLnN1YnN0cmluZyhyb2xlU3Vic3RyaW5nKS5yZXBsYWNlKC9eXFxbKFteXFxdXSspXSQvLCAnJDEnKVxuICAgIH1cbiAgfVxuICByZXR1cm4gJydcbn1cblxuQVBQLmdldFVzZXJJZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKE1rdFBhZ2UgJiYgTWt0UGFnZS51c2VyaWQpIHtcbiAgICByZXR1cm4gTWt0UGFnZS51c2VyaWRcbiAgfVxuICByZXR1cm4gJydcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiB0cmFja3MgYW5kIGlkZW50aWZpZXMgdGhlIGN1cnJlbnQgdXNlciB2aWEgSGVhcCBBbmFseXRpY3NcbiAqICBAcGFyYW0ge1N0cmluZ30gYWN0aW9uIC0gVGhlIGRlc2lyZWQgYWN0aW9uIChpZCwgdHJhY2spLlxuICogIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIFRoZSBvYmplY3Qgb2YgdGhlIGV2ZW50IHRvIGJlIHRyYWNrZWQuXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5BUFAuaGVhcFRyYWNrID0gZnVuY3Rpb24gKGFjdGlvbiwgZXZlbnQpIHtcbiAgbGV0IGlzSGVhcEFuYWx5dGljcyA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignaGVhcC5sb2FkZWQnKSkge1xuICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNIZWFwQW5hbHl0aWNzKVxuICAgICAgbGV0IG9rdGFFbWFpbCwgb2t0YUZpcnN0TmFtZSwgb2t0YUxhc3ROYW1lLCBoZWFwQXBwLCBoZWFwQXJlYSwgaGVhcEV2ZW50UHJvcHNcbiAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgIC8vIEhlYXAgQW5hbHl0aWNzIElkZW50aWZ5IFVzZXJcbiAgICAgICAgY2FzZSAnaWQnOlxuICAgICAgICAgIG9rdGFFbWFpbCA9IExJQi5nZXRDb29raWUoJ29rdGFfZW1haWwnKVxuICAgICAgICAgIG9rdGFGaXJzdE5hbWUgPSBMSUIuZ2V0Q29va2llKCdva3RhX2ZpcnN0X25hbWUnKVxuICAgICAgICAgIG9rdGFMYXN0TmFtZSA9IExJQi5nZXRDb29raWUoJ29rdGFfbGFzdF9uYW1lJylcblxuICAgICAgICAgIGlmIChNa3RQYWdlICYmIE1rdFBhZ2UudXNlcmlkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBIZWFwIEFuYWx5dGljcyBJRDogJyArIE1rdFBhZ2UudXNlcmlkKVxuICAgICAgICAgICAgaGVhcC5pZGVudGlmeShNa3RQYWdlLnVzZXJpZClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAob2t0YUZpcnN0TmFtZSAmJiBva3RhTGFzdE5hbWUpIHtcbiAgICAgICAgICAgIGhlYXAuYWRkVXNlclByb3BlcnRpZXMoe05hbWU6IG9rdGFGaXJzdE5hbWUgKyAnICcgKyBva3RhTGFzdE5hbWV9KVxuICAgICAgICAgIH0gZWxzZSBpZiAoTWt0UGFnZSAmJiBNa3RQYWdlLnVzZXJOYW1lKSB7XG4gICAgICAgICAgICBoZWFwLmFkZFVzZXJQcm9wZXJ0aWVzKHtcbiAgICAgICAgICAgICAgTmFtZTogTWt0UGFnZS51c2VyTmFtZS5yZXBsYWNlKC8gP1xcW1teXFxdXStcXF0vLCAnJylcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGhlYXAuYWRkVXNlclByb3BlcnRpZXMoe1JvbGU6IEFQUC5nZXRVc2VyUm9sZSgpfSlcbiAgICAgICAgICBpZiAob2t0YUVtYWlsKSB7XG4gICAgICAgICAgICBoZWFwLmFkZFVzZXJQcm9wZXJ0aWVzKHtFbWFpbDogb2t0YUVtYWlsfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXgnKSkge1xuICAgICAgICAgICAgaWYgKE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4ID09IG1rdG9BY2NvdW50U3RyaW5nMTA2KSB7XG4gICAgICAgICAgICAgIGhlYXAuYWRkRXZlbnRQcm9wZXJ0aWVzKHtFbnZpcm9ubWVudDogJ0ludGVybmFsJ30pXG4gICAgICAgICAgICB9IGVsc2UgaWYgKE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4ID09IG1rdG9BY2NvdW50U3RyaW5nMTA2ZCkge1xuICAgICAgICAgICAgICBoZWFwLmFkZEV2ZW50UHJvcGVydGllcyh7RW52aXJvbm1lbnQ6ICdQYXJ0bmVyJ30pXG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICBNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeCA9PSBta3RvQWNjb3VudFN0cmluZ01hc3RlciB8fFxuICAgICAgICAgICAgICBNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeCA9PSBta3RvQWNjb3VudFN0cmluZ01hc3Rlck1FVUVcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAvL1RPRE9cbiAgICAgICAgICAgICAgaGVhcC5hZGRFdmVudFByb3BlcnRpZXMoe0Vudmlyb25tZW50OiAnTWFzdGVyJ30pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIC8vIEhlYXAgQW5hbHl0aWNzIEV2ZW50IFRyYWNraW5nXG4gICAgICAgIGNhc2UgJ3RyYWNrJzpcbiAgICAgICAgICBpZiAoTWt0UGFnZSAmJiBNa3RQYWdlLmZyaWVuZGx5TmFtZSkge1xuICAgICAgICAgICAgaGVhcEFwcCA9IE1rdFBhZ2UuZnJpZW5kbHlOYW1lXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhlYXBBcHAgPSAnTWFya2V0bydcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoTWt0UGFnZSAmJiBNa3RQYWdlLmJhc2VUaXRsZSkge1xuICAgICAgICAgICAgaGVhcEFyZWEgPSBNa3RQYWdlLmJhc2VUaXRsZS5zcGxpdCgn4oCiJylbMF0udHJpbVJpZ2h0KClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaGVhcEFyZWEgPSAnVW5rbm93bidcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGhlYXBFdmVudFByb3BzID0ge1xuICAgICAgICAgICAgICBhcHA6IGhlYXBBcHAsXG4gICAgICAgICAgICAgIGFzc2V0TmFtZTogZXZlbnQuYXNzZXROYW1lLFxuICAgICAgICAgICAgICBhc3NldElkOiBldmVudC5hc3NldElkLFxuICAgICAgICAgICAgICBhc3NldFR5cGU6IGV2ZW50LmFzc2V0VHlwZSxcbiAgICAgICAgICAgICAgYXNzZXRQYXRoOiBldmVudC5hc3NldFBhdGgsXG4gICAgICAgICAgICAgIHdvcmtzcGFjZUlkOiBldmVudC53b3Jrc3BhY2VJZCxcbiAgICAgICAgICAgICAgd29ya3NwYWNlTmFtZTogZXZlbnQud29ya3NwYWNlTmFtZSxcbiAgICAgICAgICAgICAgdXNlckZvbGRlcjogZXZlbnQudXNlckZvbGRlcixcbiAgICAgICAgICAgICAgYXJlYTogJycsXG4gICAgICAgICAgICAgIGVudmlyb25tZW50OiAnJyxcbiAgICAgICAgICAgICAgdXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZlxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZlbnQuYXNzZXRBcmVhKSB7XG4gICAgICAgICAgICAgIGhlYXBFdmVudFByb3BzLmFyZWEgPSBldmVudC5hc3NldEFyZWFcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGhlYXBFdmVudFByb3BzLmFyZWEgPSBoZWFwQXJlYVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeCcpKSB7XG4gICAgICAgICAgICAgIGlmIChNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeCA9PSBta3RvQWNjb3VudFN0cmluZzEwNikge1xuICAgICAgICAgICAgICAgIGhlYXBFdmVudFByb3BzLmVudmlyb25tZW50ID0gJ0ludGVybmFsJ1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4ID09IG1rdG9BY2NvdW50U3RyaW5nMTA2ZCkge1xuICAgICAgICAgICAgICAgIGhlYXBFdmVudFByb3BzLmVudmlyb25tZW50ID0gJ1BhcnRuZXInXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXggPT0gbWt0b0FjY291bnRTdHJpbmdNYXN0ZXIgfHxcbiAgICAgICAgICAgICAgICBNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeCA9PSBta3RvQWNjb3VudFN0cmluZ01hc3Rlck1FVUVcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgLy9UT0RPXG4gICAgICAgICAgICAgICAgaGVhcEV2ZW50UHJvcHMuZW52aXJvbm1lbnQgPSAnTWFzdGVyJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBUcmFja2luZzogSGVhcCBFdmVudDogJyArIGV2ZW50Lm5hbWUgKyAnXFxuJyArIEpTT04uc3RyaW5naWZ5KGhlYXBFdmVudFByb3BzLCBudWxsLCAyKSlcbiAgICAgICAgICAgIGhlYXAudHJhY2soZXZlbnQubmFtZSwgaGVhcEV2ZW50UHJvcHMpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2FkZFByb3AnOlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEFkZGluZzogSGVhcCBFdmVudCBQcm9wZXJ0aWVzOiAnICsgSlNPTi5zdHJpbmdpZnkoZXZlbnQsIG51bGwsIDIpKVxuICAgICAgICAgIGhlYXAuYWRkRXZlbnRQcm9wZXJ0aWVzKGV2ZW50KVxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICB9LCAwKVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBNYWluXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbndpbmRvdy5ta3RvX2xpdmVfZXh0ZW5zaW9uX3N0YXRlID0gJ01hcmtldG9MaXZlIGV4dGVuc2lvbiBpcyBhbGl2ZSEnXG5cbmxldCB0b2dnbGVTdGF0ZSA9IExJQi5nZXRDb29raWUoJ3RvZ2dsZVN0YXRlJylcblxuaWYgKHRvZ2dsZVN0YXRlID09IG51bGwpIHtcbiAgdG9nZ2xlU3RhdGUgPSAndHJ1ZSdcbn1cblxubGV0IGlzTWt0UGFnZUFwcCA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgTWt0UGFnZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogTWFya2V0byBQYWdlJylcbiAgICBsZXQgdXNlcklkXG5cbiAgICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeCcpICYmIE1rdFBhZ2UudXNlcmlkICYmIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5ETC5nZXREbFRva2VuJykgJiYgTWt0My5ETC5nZXREbFRva2VuKCkpIHtcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzTWt0UGFnZUFwcClcbiAgICAgIGFjY291bnRTdHJpbmcgPSBNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeFxuICAgICAgdXNlcklkID0gTWt0UGFnZS51c2VyaWQudG9Mb3dlckNhc2UoKVxuICAgICAgY3VyclVybEZyYWdtZW50ID0gTWt0My5ETC5nZXREbFRva2VuKClcbiAgICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuREwuZGwuZGxDb21wQ29kZScpKSB7XG4gICAgICAgIGN1cnJDb21wRnJhZ21lbnQgPSBNa3QzLkRMLmRsLmRsQ29tcENvZGVcbiAgICAgIH1cblxuICAgICAgaWYgKHVzZXJJZC5zZWFyY2goJy5kZW1vQChtYXJrZXRvLmNvbXxtYXJrZXRvbGl2ZS5jb20pJCcpICE9IC0xKSB7XG4gICAgICAgIHVzZXJOYW1lID0gdXNlcklkLnNwbGl0KCcuZGVtbycpWzBdXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1c2VyTmFtZSA9IHVzZXJJZC5zcGxpdCgnQCcpWzBdXG4gICAgICAgIGlmICh1c2VyTmFtZSA9PSAnbWFya2V0b2xpdmUnKSB7XG4gICAgICAgICAgdXNlck5hbWUgPSB1c2VySWQuc3BsaXQoJ0AnKVsxXS5zcGxpdCgnLicpWzBdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBBUFAuc2V0SW5zdGFuY2VJbmZvKGFjY291bnRTdHJpbmcpXG5cbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgIGV4dGVuc2lvbklkLFxuICAgICAge1xuICAgICAgICBhY3Rpb246ICdjaGVja0V4dGVuc2lvblZlcnNpb24nLFxuICAgICAgICBtaW5WZXJzaW9uOiBleHRlbnNpb25NaW5WZXJzaW9uXG4gICAgICB9LFxuICAgICAgbnVsbCxcbiAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuaXNWYWxpZEV4dGVuc2lvbikge1xuICAgICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKFxuICAgICAgICAgICAgZXh0ZW5zaW9uSWQsXG4gICAgICAgICAgICB7YWN0aW9uOiAnY2hlY2tCYWRFeHRlbnNpb24nfSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmlzVmFsaWRFeHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICBMSUIudmFsaWRhdGVEZW1vRXh0ZW5zaW9uQ2hlY2socmVzcG9uc2UuaXNWYWxpZEV4dGVuc2lvbilcbiAgICAgICAgICAgICAgICBpZiAoYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3RlciB8fCBhY2NvdW50U3RyaW5nID09IG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyTUVVRSkge1xuICAgICAgICAgICAgICAgICAgLy9UT0RPXG4gICAgICAgICAgICAgICAgICBBUFAub3ZlcnJpZGVTdXBlcmJhbGxNZW51SXRlbXMoKSAvL3Jlc3BvbnNlLmlzVmFsaWRFeHRlbnNpb24pO1xuICAgICAgICAgICAgICAgICAgLy9yZXN0b3JlRW1haWxJbnNpZ2h0cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICBpZiAoY3VyclVybEZyYWdtZW50ICYmIGN1cnJVcmxGcmFnbWVudCA9PSBta3RvTXlNYXJrZXRvRnJhZ21lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnJpZGVUaWxlVGltZXJDb3VudCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgQVBQLm92ZXJyaWRlSG9tZVRpbGVzKCkgLy9yZXNwb25zZS5pc1ZhbGlkRXh0ZW5zaW9uKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gY2hlY2tCYWRFeHRlbnNpb24gTXNnID4gUmVzcG9uc2U6ICcgKyBKU09OLnN0cmluZ2lmeShyZXNwb25zZSkpXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgTElCLnZhbGlkYXRlRGVtb0V4dGVuc2lvbkNoZWNrKHRydWUpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIExJQi52YWxpZGF0ZURlbW9FeHRlbnNpb25DaGVjayhmYWxzZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IGNoZWNrQmFkRXh0ZW5zaW9uIE1zZyA+IEVycm9yOiAnICsgSlNPTi5zdHJpbmdpZnkoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIXJlc3BvbnNlKSB7XG4gICAgICAgICAgICBMSUIudmFsaWRhdGVEZW1vRXh0ZW5zaW9uQ2hlY2sodHJ1ZSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgTElCLnZhbGlkYXRlRGVtb0V4dGVuc2lvbkNoZWNrKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gY2hlY2tFeHRlbnNpb25WZXJzaW9uIE1zZyA+IEVycm9yOiAnICsgSlNPTi5zdHJpbmdpZnkoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcblxuICAgIGlmIChNa3RQYWdlLnVzZXJpZCAmJiBNa3RQYWdlLnVzZXJOYW1lKSB7XG4gICAgICBsZXQgbWt0b1JvbGUgPSBNa3RQYWdlLnVzZXJOYW1lLm1hdGNoKC9cXFtbXlxcXV0rXFxdLylcblxuICAgICAgaWYgKG1rdG9Sb2xlICE9IG51bGwpIHtcbiAgICAgICAgbWt0b1JvbGUgPSBta3RvUm9sZVswXS5yZXBsYWNlKC9eXFxbKFteXFxdXSspXSQvLCAnJDEnKVxuICAgICAgfVxuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSWQsIHtcbiAgICAgICAgYWN0aW9uOiAnc2V0TWt0b0Nvb2tpZXMnLFxuICAgICAgICBta3RvVXNlcklkOiBNa3RQYWdlLnVzZXJpZCxcbiAgICAgICAgbWt0b05hbWU6IE1rdFBhZ2UudXNlck5hbWUucmVwbGFjZSgvID9cXFtbXlxcXV0rXFxdLywgJycpLFxuICAgICAgICBta3RvUm9sZTogbWt0b1JvbGVcbiAgICAgIH0pXG5cbiAgICAgIEFQUC5zZW5kTWt0b01lc3NhZ2UoYWNjb3VudFN0cmluZywgbWt0b1JvbGUsIHVzZXJOYW1lKVxuICAgIH1cblxuICAgIGlmIChjdXJyVXJsRnJhZ21lbnQpIHtcbiAgICAgIGlmIChjdXJyVXJsRnJhZ21lbnQgPT0gbWt0b0FjY291bnRCYXNlZE1hcmtldGluZ0ZyYWdtZW50KSB7XG4gICAgICAgIEFQUC5kaXNhYmxlQWNjb3VudEFJKClcbiAgICAgICAgbGV0IG5hdkl0ZW1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgneDQtdGFiLWNlbnRlcicpLFxuICAgICAgICAgIG9yaWdOYXZJdGVtT25DbGlja1xuXG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBuYXZJdGVtcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBsZXQgbmF2QnV0dG9uID0gbmF2SXRlbXNbaWldLnBhcmVudE5vZGUucGFyZW50Tm9kZSxcbiAgICAgICAgICAgIG5hdkl0ZW0gPSBuYXZJdGVtc1tpaV0uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgneDQtdGFiLWlubmVyJylcblxuICAgICAgICAgIGlmIChuYXZJdGVtLmxlbmd0aCA+IDAgJiYgbmF2SXRlbVswXS5pbm5lckhUTUwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3JpZ05hdkl0ZW1PbkNsaWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIG9yaWdOYXZJdGVtT25DbGljayA9IG5hdkJ1dHRvbi5vbmNsaWNrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuYXZCdXR0b24ub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgLy9kZWJ1Z2dlcjtcbiAgICAgICAgICAgICAgQVBQLmhlYXBUcmFjaygnYWRkUHJvcCcsIHtcbiAgICAgICAgICAgICAgICBhcmVhOiAnQUJNJyxcbiAgICAgICAgICAgICAgICBhc3NldFR5cGU6IExJQi5mb3JtYXRUZXh0KHRoaXMuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgneDQtdGFiLWlubmVyJylbMF0uaW5uZXJIVE1MKVxuICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgIGlmICh0eXBlb2Ygb3JpZ05hdkl0ZW1PbkNsaWNrID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBvcmlnTmF2SXRlbU9uQ2xpY2suYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3g0LXRhYi10b3AtYWN0aXZlJykubGVuZ3RoID4gMCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3g0LXRhYi10b3AtYWN0aXZlJylbMF0uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgneDQtdGFiLWlubmVyJykubGVuZ3RoID4gMFxuICAgICAgICApIHtcbiAgICAgICAgICBBUFAuaGVhcFRyYWNrKCdhZGRQcm9wJywge1xuICAgICAgICAgICAgYXJlYTogJ0FCTScsXG4gICAgICAgICAgICBhc3NldFR5cGU6IExJQi5mb3JtYXRUZXh0KFxuICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCd4NC10YWItdG9wLWFjdGl2ZScpWzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3g0LXRhYi1pbm5lcicpWzBdLmlubmVySFRNTFxuICAgICAgICAgICAgKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50ID09IG1rdG9NeU1hcmtldG9GcmFnbWVudCkge1xuICAgICAgICBvdmVycmlkZVRpbGVUaW1lckNvdW50ID0gdHJ1ZVxuICAgICAgICBBUFAub3ZlcnJpZGVIb21lVGlsZXMoKSAvL3Jlc3RvcmVFbWFpbEluc2lnaHRzKTtcbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7XG4gICAgICAgICAgbmFtZTogJ015IE1hcmtldG8nLFxuICAgICAgICAgIGFzc2V0TmFtZTogJ0hvbWUnXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudC5zZWFyY2gobWt0b0Rpc2FibGVCdXR0b25zRnJhZ21lbnRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgQVBQLmRpc2FibGVCdXR0b25zKClcbiAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50ID09IG1rdG9BZG1pbldlYlNreUZyYWdtZW50KSB7XG4gICAgICAgIEFQUC5kaXNhYmxlQ2hlY2tib3hlcygpXG4gICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudC5zZWFyY2gobWt0b0FuYWx5dGljc0hvbWVGcmFnbWVudCkgIT0gLTEpIHtcbiAgICAgICAgQVBQLm92ZXJyaWRlQW5hbHl0aWNzVGlsZXMoKVxuICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKCdeJyArIEFQUC5nZXRBc3NldENvbXBDb2RlKCdOdXJ0dXJlIFByb2dyYW0nKSArICdbMC05XStBMSQnKSAhPSAtMSkge1xuICAgICAgICBBUFAuZGlzYWJsZU51cnR1cmVQcm9ncmFtcygpXG4gICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudCA9PSBta3RvQWRCcmlkZ2VTbWFydExpc3RGcmFnbWVudCkge1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogQWQgQnJpZGdlIFNtYXJ0IExpc3QnKVxuICAgICAgICBBUFAub3BlbkFkQnJpZGdlTW9kYWwoKVxuICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQgPT0gbWt0b0FkbWluU2FsZXNmb3JjZUZyYWdtZW50IHx8IGN1cnJVcmxGcmFnbWVudCA9PSBta3RvQWRtaW5EeW5hbWljc0ZyYWdtZW50KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBBZG1pbiA+IENSTScpXG4gICAgICAgIEFQUC5oaWRlT3RoZXJUb29sYmFySXRlbXMoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlkOiAnZW5hYmxlU3luYycsIC8vRW5hYmxlL0Rpc2FibGUgU3luY1xuICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICB9XG4gICAgICAgIF0pXG4gICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudCA9PSBta3RvQWRtaW5SY2FDdXN0b21GaWVsZFN5bmMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEFkbWluID4gUmV2ZW51ZSBDeWNsZSBBbmFseXRpY3MgPiBDdXN0b20gRmllbGQgU3luYycpXG4gICAgICAgIEFQUC5oaWRlT3RoZXJUb29sYmFySXRlbXMoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlkOiAnY2FkQ2hhbmdlQnV0dG9uJywgLy9FZGl0IFN5bmMgT3B0aW9uXG4gICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgIH1cbiAgICAgICAgXSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPbmx5IGV4ZWN1dGUgdGhpcyBibG9jayBpZiB0aGUgdXNlciBpcyBub3Qgb24gYW4gZWRpdG9yIHBhZ2UuXG4gICAgaWYgKFxuICAgICAgY3VyclVybEZyYWdtZW50ICYmXG4gICAgICBjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9BbmFseXRpY3NGcmFnbWVudE1hdGNoKSA9PSAtMSAmJlxuICAgICAgKCFjdXJyQ29tcEZyYWdtZW50IHx8XG4gICAgICAgIChjdXJyQ29tcEZyYWdtZW50LnNlYXJjaChta3RvQWJtRnJhZ21lbnRNYXRjaCkgPT0gLTEgJiYgY3VyckNvbXBGcmFnbWVudC5zZWFyY2gobWt0b0Rlc2lnbmVyc0ZyYWdtZW50TWF0Y2gpID09IC0xKSlcbiAgICApIHtcbiAgICAgIGlmIChhY2NvdW50U3RyaW5nLnNlYXJjaChta3RvQWNjb3VudFN0cmluZ3MxMDZNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgLy9BUFAuZGlzY2FyZERyYWZ0cyhhY2NvdW50U3RyaW5nLCBcImxhbmRpbmdQYWdlXCIpO1xuICAgICAgICBBUFAub3ZlcnJpZGVUcmVlTm9kZUV4cGFuZCgpXG4gICAgICAgIEFQUC5vdmVycmlkZVRyZWVOb2RlQ29sbGFwc2UoKVxuICAgICAgICBBUFAub3ZlcnJpZGVTYXZpbmcoKVxuICAgICAgICBBUFAuZGlzYWJsZURyYWdBbmREcm9wKClcbiAgICAgICAgQVBQLmRpc2FibGVNZW51cygpXG4gICAgICAgIEFQUC5oaWRlVG9vbGJhckl0ZW1zKClcbiAgICAgICAgQVBQLm92ZXJyaWRlRHJhZnRFZGl0cygpXG4gICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgQVBQLmRpc2FibGVGb3JtRGVsZXRlQnV0dG9ucygpXG4gICAgICAgIEFQUC5kaXNhYmxlSGFybWZ1bFNhdmVCdXR0b25zKClcbiAgICAgICAgQVBQLm92ZXJyaWRlU21hcnRDYW1wYWlnblNhdmluZygpXG4gICAgICAgIEFQUC50cmFja05vZGVDbGljaygpXG4gICAgICAgIEFQUC50cmFja1RyZWVOb2RlRWRpdHMoKVxuICAgICAgICBBUFAub3ZlcnJpZGVBc3NldFNhdmVFZGl0KClcbiAgICAgICAgQVBQLm92ZXJyaWRlUmVuYW1pbmdGb2xkZXJzKClcbiAgICAgICAgQVBQLm92ZXJyaWRlQ2FudmFzKClcbiAgICAgICAgQVBQLm92ZXJyaWRlVXBkYXRlUG9ydGxldE9yZGVyKClcbiAgICAgICAgQVBQLmRpc2FibGVDb25maXJtYXRpb25NZXNzYWdlKClcbiAgICAgICAgQVBQLmRpc2FibGVSZXF1ZXN0cygpXG4gICAgICAgIEFQUC5vdmVycmlkZU5ld1Byb2dyYW1DcmVhdGUoKVxuICAgICAgICBBUFAub3ZlcnJpZGVOZXdBc3NldENyZWF0ZSgpXG4gICAgICAgIEFQUC5vdmVycmlkZU5ld0ZvbGRlcnMoKVxuICAgICAgICBBUFAuaGlkZUZvbGRlcnNPbkltcG9ydCgpXG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgIG5hbWU6ICdMYXN0IExvYWRlZCcsXG4gICAgICAgICAgYXNzZXROYW1lOiAnUGFnZSdcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAoYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3RlciB8fCBhY2NvdW50U3RyaW5nID09IG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyTUVVRSkge1xuICAgICAgICAvL1RPRE9cbiAgICAgICAgQVBQLm92ZXJyaWRlVHJlZU5vZGVFeHBhbmQoKVxuICAgICAgICBBUFAub3ZlcnJpZGVUcmVlTm9kZUNvbGxhcHNlKClcbiAgICAgICAgQVBQLm92ZXJyaWRlU2F2aW5nKClcbiAgICAgICAgQVBQLmRpc2FibGVEcmFnQW5kRHJvcCgpXG4gICAgICAgIEFQUC5kaXNhYmxlTWVudXMoKVxuICAgICAgICBBUFAuaGlkZVRvb2xiYXJJdGVtcygpXG4gICAgICAgIEFQUC5vdmVycmlkZURyYWZ0RWRpdHMoKVxuICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgIEFQUC5kaXNhYmxlRm9ybURlbGV0ZUJ1dHRvbnMoKVxuICAgICAgICBBUFAuZGlzYWJsZUhhcm1mdWxTYXZlQnV0dG9ucygpXG4gICAgICAgIEFQUC5vdmVycmlkZVNtYXJ0Q2FtcGFpZ25TYXZpbmcoKVxuICAgICAgICBBUFAudHJhY2tOb2RlQ2xpY2soKVxuICAgICAgICBBUFAudHJhY2tUcmVlTm9kZUVkaXRzKClcbiAgICAgICAgQVBQLm92ZXJyaWRlQXNzZXRTYXZlRWRpdCgpXG4gICAgICAgIEFQUC5vdmVycmlkZVJlbmFtaW5nRm9sZGVycygpXG4gICAgICAgIEFQUC5vdmVycmlkZUNhbnZhcygpXG4gICAgICAgIEFQUC5vdmVycmlkZVVwZGF0ZVBvcnRsZXRPcmRlcigpXG4gICAgICAgIEFQUC5kaXNhYmxlQ29uZmlybWF0aW9uTWVzc2FnZSgpXG4gICAgICAgIEFQUC5kaXNhYmxlUmVxdWVzdHMoKVxuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgICBuYW1lOiAnTGFzdCBMb2FkZWQnLFxuICAgICAgICAgIGFzc2V0TmFtZTogJ1BhZ2UnXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2UgaWYgKGFjY291bnRTdHJpbmcgPT0gbWt0b0FjY291bnRTdHJpbmdEeW5hbWljcykge1xuICAgICAgICBBUFAub3ZlcnJpZGVUcmVlTm9kZUV4cGFuZCgpXG4gICAgICAgIEFQUC5vdmVycmlkZVRyZWVOb2RlQ29sbGFwc2UoKVxuICAgICAgICBBUFAub3ZlcnJpZGVTYXZpbmcoKVxuICAgICAgICBBUFAuZGlzYWJsZURyYWdBbmREcm9wKClcbiAgICAgICAgQVBQLmRpc2FibGVNZW51cygpXG4gICAgICAgIEFQUC5oaWRlVG9vbGJhckl0ZW1zKClcbiAgICAgICAgQVBQLm92ZXJyaWRlRHJhZnRFZGl0cygpXG4gICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgQVBQLmRpc2FibGVGb3JtRGVsZXRlQnV0dG9ucygpXG4gICAgICAgIEFQUC5kaXNhYmxlSGFybWZ1bFNhdmVCdXR0b25zKClcbiAgICAgICAgQVBQLm92ZXJyaWRlU21hcnRDYW1wYWlnblNhdmluZygpXG4gICAgICAgIEFQUC50cmFja1RyZWVOb2RlRWRpdHMoKVxuICAgICAgICBBUFAub3ZlcnJpZGVBc3NldFNhdmVFZGl0KClcbiAgICAgICAgQVBQLm92ZXJyaWRlUmVuYW1pbmdGb2xkZXJzKClcbiAgICAgICAgQVBQLm92ZXJyaWRlQ2FudmFzKClcbiAgICAgICAgQVBQLm92ZXJyaWRlVXBkYXRlUG9ydGxldE9yZGVyKClcbiAgICAgICAgQVBQLmRpc2FibGVDb25maXJtYXRpb25NZXNzYWdlKClcbiAgICAgICAgQVBQLmRpc2FibGVSZXF1ZXN0cygpXG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgIG5hbWU6ICdMYXN0IExvYWRlZCcsXG4gICAgICAgICAgYXNzZXROYW1lOiAnUGFnZSdcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAoYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ1FlKSB7XG4gICAgICAgIEFQUC5kaXNhYmxlTWVudXMoKVxuICAgICAgICBBUFAuaGlkZVRvb2xiYXJJdGVtcygpXG4gICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgQVBQLmRpc2FibGVGb3JtRGVsZXRlQnV0dG9ucygpXG4gICAgICAgIEFQUC5kaXNhYmxlSGFybWZ1bFNhdmVCdXR0b25zKClcbiAgICAgICAgQVBQLm92ZXJyaWRlQXNzZXRTYXZlRWRpdCgpXG4gICAgICAgIEFQUC5vdmVycmlkZVJlbmFtaW5nRm9sZGVycygpXG4gICAgICB9IGVsc2UgaWYgKHRvZ2dsZVN0YXRlID09ICdmYWxzZScpIHtcbiAgICAgICAgQVBQLm92ZXJyaWRlU2F2aW5nKClcbiAgICAgICAgQVBQLm92ZXJyaWRlU21hcnRDYW1wYWlnblNhdmluZygpXG4gICAgICAgIEFQUC5vdmVycmlkZVVwZGF0ZVBvcnRsZXRPcmRlcigpXG4gICAgICAgIEFQUC5kaXNhYmxlQ29uZmlybWF0aW9uTWVzc2FnZSgpXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjdXJyQ29tcEZyYWdtZW50KSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogRGVzaWduZXJzLCBBQk0gQXJlYXMnKVxuICAgICAgc3dpdGNoIChjdXJyQ29tcEZyYWdtZW50KSB7XG4gICAgICAgIGNhc2UgbWt0b0FibURpc2NvdmVyTWFya2V0b0NvbXBhbmllc0ZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBBQk0gPiBEaXNjb3ZlciBNYXJrZXRvIENvbXBhbmllcycpXG4gICAgICAgICAgQVBQLmRpc2FibGVNZW51cygpXG4gICAgICAgICAgQVBQLmhpZGVUb29sYmFySXRlbXMoKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1EZWxldGVCdXR0b25zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUhhcm1mdWxTYXZlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7XG4gICAgICAgICAgICBuYW1lOiAnTGFzdCBMb2FkZWQnLFxuICAgICAgICAgICAgYXNzZXROYW1lOiAnUGFnZSdcbiAgICAgICAgICB9KVxuICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ2FkZFByb3AnLCB7XG4gICAgICAgICAgICBhcmVhOiAnQUJNJyxcbiAgICAgICAgICAgIGFzc2V0VHlwZTogJ0Rpc2NvdmVyIE1hcmtldG8gQ29tcGFuaWVzJ1xuICAgICAgICAgIH0pXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvQWJtRGlzY292ZXJDcm1BY2NvdW50c0ZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBBQk0gPiBEaXNjb3ZlciBDUk0gQWNjb3VudHMnKVxuICAgICAgICAgIEFQUC5kaXNhYmxlTWVudXMoKVxuICAgICAgICAgIEFQUC5oaWRlVG9vbGJhckl0ZW1zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmRpc2FibGVGb3JtRGVsZXRlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmRpc2FibGVIYXJtZnVsU2F2ZUJ1dHRvbnMoKVxuICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge1xuICAgICAgICAgICAgbmFtZTogJ0xhc3QgTG9hZGVkJyxcbiAgICAgICAgICAgIGFzc2V0TmFtZTogJ1BhZ2UnXG4gICAgICAgICAgfSlcbiAgICAgICAgICBBUFAuaGVhcFRyYWNrKCdhZGRQcm9wJywge1xuICAgICAgICAgICAgYXJlYTogJ0FCTScsXG4gICAgICAgICAgICBhc3NldFR5cGU6ICdEaXNjb3ZlciBDUk0gQWNjb3VudHMnXG4gICAgICAgICAgfSlcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9BYm1OYW1lZEFjY291bnRGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogQUJNID4gTmFtZWQgQWNjb3VudCcpXG4gICAgICAgICAgQVBQLmRpc2FibGVNZW51cygpXG4gICAgICAgICAgQVBQLmhpZGVUb29sYmFySXRlbXMoKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1EZWxldGVCdXR0b25zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUhhcm1mdWxTYXZlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7XG4gICAgICAgICAgICBuYW1lOiAnTGFzdCBMb2FkZWQnLFxuICAgICAgICAgICAgYXNzZXROYW1lOiAnUGFnZSdcbiAgICAgICAgICB9KVxuICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ2FkZFByb3AnLCB7XG4gICAgICAgICAgICBhcmVhOiAnQUJNJyxcbiAgICAgICAgICAgIGFzc2V0VHlwZTogJ05hbWVkIEFjY291bnQnXG4gICAgICAgICAgfSlcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9BYm1JbXBvcnROYW1lZEFjY291bnRzRnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEFCTSA+IEltcG9ydCBOYW1lZCBBY2NvdW50cycpXG4gICAgICAgICAgQVBQLmRpc2FibGVNZW51cygpXG4gICAgICAgICAgQVBQLmhpZGVUb29sYmFySXRlbXMoKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1EZWxldGVCdXR0b25zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUhhcm1mdWxTYXZlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7XG4gICAgICAgICAgICBuYW1lOiAnTGFzdCBMb2FkZWQnLFxuICAgICAgICAgICAgYXNzZXROYW1lOiAnUGFnZSdcbiAgICAgICAgICB9KVxuICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ2FkZFByb3AnLCB7XG4gICAgICAgICAgICBhcmVhOiAnQUJNJyxcbiAgICAgICAgICAgIGFzc2V0VHlwZTogJ0ltcG9ydCBOYW1lZCBBY2NvdW50cydcbiAgICAgICAgICB9KVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0xhbmRpbmdQYWdlRWRpdEZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBMYW5kaW5nIFBhZ2UgRWRpdG9yJylcbiAgICAgICAgICBBUFAucmVzZXRHb2xkZW5MYW5kaW5nUGFnZVByb3BzKClcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdsYW5kaW5nUGFnZScsICdlZGl0JylcbiAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvTGFuZGluZ1BhZ2VQcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IExhbmRpbmcgUGFnZSBQcmV2aWV3ZXInKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2xhbmRpbmdQYWdlJywgJ3ByZXZpZXcnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0xhbmRpbmdQYWdlUHJldmlld0RyYWZ0RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IExhbmRpbmcgUGFnZSBEcmFmdCBQcmV2aWV3ZXInKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2xhbmRpbmdQYWdlJywgJ3ByZXZpZXcnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0xhbmRpbmdQYWdlVGVtcGxhdGVFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IExhbmRpbmcgUGFnZSBUZW1wbGF0ZSBFZGl0b3InKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2xhbmRpbmdQYWdlJywgJ3RlbXBsYXRlRWRpdCcpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvTGFuZGluZ1BhZ2VUZW1wbGF0ZVByZXZpZXdGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogTGFuZGluZyBQYWdlIFRlbXBsYXRlIFByZXZpZXdlcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnbGFuZGluZ1BhZ2UnLCAndGVtcGxhdGVQcmV2aWV3JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9FbWFpbEVkaXRGcmFnbWVudDpcbiAgICAgICAgICBpZiAoY3VyclVybEZyYWdtZW50ID09IG1rdG9FbWFpbEVkaXRGcmFnbWVudCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEVtYWlsIFRlbXBsYXRlIFBpY2tlcicpXG4gICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdlbWFpbCcsICd0ZW1wbGF0ZVBpY2tlcicpXG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9FbWFpbFByZXZpZXdGcmFnbWVudFJlZ2V4KSA9PSAtMSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEVtYWlsIEVkaXRvcicpXG4gICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdlbWFpbCcsICdlZGl0JylcbiAgICAgICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEVtYWlsIFByZXZpZXdlcicpXG4gICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdlbWFpbCcsICdwcmV2aWV3JylcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvRW1haWxUZW1wbGF0ZUVkaXRGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogRW1haWwgVGVtcGxhdGUgRWRpdG9yJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdlbWFpbCcsICd0ZW1wbGF0ZUVkaXQnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0Zvcm1FZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEZvcm0gRWRpdG9yJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdmb3JtJywgJ2VkaXQnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0Zvcm1QcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEZvcm0gUHJldmlld2VyJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdmb3JtJywgJ3ByZXZpZXcnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0Zvcm1QcmV2aWV3RHJhZnRGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogRm9ybSBEcmFmdCBQcmV2aWV3ZXInKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2Zvcm0nLCAncHJldmlldycpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvUHVzaE5vdGlmaWNhdGlvbkVkaXRGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogUHVzaCBOb3RpZmljYXRpb24gRWRpdG9yJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdwdXNoTm90aWZpY2F0aW9uJywgJ2VkaXQnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b01vYmlsZVB1c2hOb3RpZmljYXRpb25QcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFB1c2ggTm90aWZpY2F0aW9uIFByZXZpZXdlcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygncHVzaE5vdGlmaWNhdGlvbicsICdwcmV2aWV3JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9JbkFwcE1lc3NhZ2VFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEluLUFwcCBNZXNzYWdlIEVkaXRvcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnaW5BcHBNZXNzYWdlJywgJ2VkaXQnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0luQXBwTWVzc2FnZVByZXZpZXdGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogSW4tQXBwIE1lc3NhZ2UgUHJldmlld2VyJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdpbkFwcE1lc3NhZ2UnLCAncHJldmlldycpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvU21zTWVzc2FnZUVkaXRGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogU01TIE1lc3NhZ2UgRWRpdG9yJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdzbXNNZXNzYWdlJywgJ2VkaXQnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b1NvY2lhbEFwcEVkaXRGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogU29jaWFsIEFwcCBFZGl0b3InKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ3NvY2lhbEFwcCcsICdlZGl0JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9Tb2NpYWxBcHBQcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFNvY2lhbCBBcHAgUHJldmlld2VyJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdzb2NpYWxBcHAnLCAncHJldmlldycpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvQWJUZXN0RWRpdEZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBBL0IgVGVzdCBXaXphcmQnKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2FiVGVzdCcsICdlZGl0JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9FbWFpbFRlc3RHcm91cEVkaXRGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogRW1haWwgVGVzdCBHcm91cCBXaXphcmQnKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2FiVGVzdCcsICdlZGl0JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9TbmlwcGV0RWRpdEZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBTbmlwcGV0IEVkaXRvcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnc25pcHBldCcsICdlZGl0JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9TbmlwcGV0UHJldmlld0ZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBTbmlwcGV0IFByZXZpZXdlcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnc25pcHBldCcsICdwcmV2aWV3JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQgJiYgY3VyclVybEZyYWdtZW50LnNlYXJjaChta3RvQW5hbHl0aWNzRnJhZ21lbnRNYXRjaCkgIT0gLTEpIHtcbiAgICAgIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9BbmFseXplcnNGcmFnbWVudE1hdGNoKSAhPSAtMSkge1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogR29sZGVuIEFuYWx5dGljcycpXG4gICAgICAgIEFQUC51cGRhdGVOYXZCYXIoKVxuICAgICAgfVxuXG4gICAgICBpZiAoY3VyclVybEZyYWdtZW50LnNlYXJjaChta3RvUmVwb3J0RnJhZ21lbnRSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEZ1bGxzY3JlZW4gUmVwb3J0JylcbiAgICAgICAgQVBQLmRpc2FibGVBbmFseXRpY3NTYXZpbmcoJ3JlcG9ydCcpXG4gICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudC5zZWFyY2gobWt0b01vZGVsZXJGcmFnbWVudFJlZ2V4KSAhPSAtMSkge1xuICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhyZWYuc2VhcmNoKG1rdG9Nb2RlbGVyUHJldmlld0ZyYWdtZW50UmVnZXgpID09IC0xKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFJldmVudWUgQ3ljbGUgTW9kZWwgRWRpdG9yJylcbiAgICAgICAgICBBUFAuZGlzYWJsZUFuYWx5dGljc1NhdmluZygnbW9kZWwnLCAnZWRpdCcpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFJldmVudWUgQ3ljbGUgTW9kZWwgUHJldmlld2VyJylcbiAgICAgICAgICBBUFAuZGlzYWJsZUFuYWx5dGljc1NhdmluZygnbW9kZWwnLCAncHJldmlldycpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LmxvY2F0aW9uLnBhdGhuYW1lID09IG1rdG9QZXJzb25EZXRhaWxQYXRoKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogTGVhZCBEYXRhYmFzZSA+IFBlcnNvbiBEZXRhaWwnKVxuICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNNa3RQYWdlQXBwKVxuICAgICAgaWYgKE1rdFBhZ2Uuc2F2ZWRTdGF0ZSAmJiBNa3RQYWdlLnNhdmVkU3RhdGUubXVuY2hraW5JZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBjaGVja01rdG9Db29raWUgTXNnJylcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICAgICAgZXh0ZW5zaW9uSWQsXG4gICAgICAgICAge1xuICAgICAgICAgICAgYWN0aW9uOiAnY2hlY2tNa3RvQ29va2llJyxcbiAgICAgICAgICAgIG11bmNoa2luSWQ6IE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5tdW5jaGtpbklkXG4gICAgICAgICAgfSxcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UuaXNBZG1pbikge1xuICAgICAgICAgICAgICBBUFAuZGlzYWJsZVJlcXVlc3RzKClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IGNoZWNrTWt0b0Nvb2tpZSBNc2cgPiBTYXZpbmcgRW5hYmxlZCBmb3IgQWRtaW4nKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBjaGVja01rdG9Db29raWUgTXNnID4gRXJyb3I6ICcgKyBKU09OLnN0cmluZ2lmeShjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQVBQLmRpc2FibGVSZXF1ZXN0cygpXG4gICAgICB9XG4gICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtcbiAgICAgICAgbmFtZTogJ0xhc3QgTG9hZGVkJyxcbiAgICAgICAgYXNzZXROYW1lOiAnUGFnZSdcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy92YXIgcmVzaXplRmlyc3RDYWxsID0gZmFsc2U7XG4gICAgd2luZG93Lm9ucmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gV2luZG93OiBSZXNpemUnKVxuICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YobWt0b015TWFya2V0b0ZyYWdtZW50KSA+PSAwKSB7XG4gICAgICAgIHNldFRpbWVvdXQoQVBQLm92ZXJyaWRlSG9tZVRpbGVzUmVzaXplLCAxMDAwKVxuICAgICAgfVxuICAgIH1cblxuICAgIHdpbmRvdy5vbmhhc2hjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBXaW5kb3c6IEhhc2ggQ2hhbmdlZCcpXG4gICAgICAvLyBHZXR0aW5nIHRoZSBVUkwgZnJhZ21lbnQsIHRoZSBwYXJ0IGFmdGVyIHRoZSAjXG4gICAgICBsZXQgaXNOZXdVcmxGcmFnbWVudCA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuREwuZ2V0RGxUb2tlbicpICYmIE1rdDMuREwuZ2V0RGxUb2tlbigpKSB7XG4gICAgICAgICAgaWYgKGN1cnJVcmxGcmFnbWVudCAhPSBNa3QzLkRMLmdldERsVG9rZW4oKSkge1xuICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNOZXdVcmxGcmFnbWVudClcblxuICAgICAgICAgICAgaWYgKGN1cnJVcmxGcmFnbWVudCA9PSBta3RvTXlNYXJrZXRvU3VwZXJiYWxsRnJhZ21lbnQgJiYgTWt0My5ETC5nZXREbFRva2VuKCkgPT0gbWt0b015TWFya2V0b0ZyYWdtZW50KSB7XG4gICAgICAgICAgICAgIG92ZXJyaWRlVGlsZVRpbWVyQ291bnQgPSB0cnVlXG4gICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBUFAub3ZlcnJpZGVIb21lVGlsZXMoKSAvL3Jlc3RvcmVFbWFpbEluc2lnaHRzKTtcbiAgICAgICAgICAgICAgfSwgMTAwMClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VyclVybEZyYWdtZW50ID0gTWt0My5ETC5nZXREbFRva2VuKClcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvYWRlZDogTmV3IFVSTCBGcmFnbWVudCA9ICcgKyBjdXJyVXJsRnJhZ21lbnQpXG4gICAgICAgICAgICBpZiAoY3VyclVybEZyYWdtZW50ID09IG1rdG9NeU1hcmtldG9GcmFnbWVudCkge1xuICAgICAgICAgICAgICBvdmVycmlkZVRpbGVUaW1lckNvdW50ID0gdHJ1ZVxuICAgICAgICAgICAgICBBUFAub3ZlcnJpZGVIb21lVGlsZXMoKSAvL3Jlc3RvcmVFbWFpbEluc2lnaHRzKTtcbiAgICAgICAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ015IE1hcmtldG8nLFxuICAgICAgICAgICAgICAgIGFzc2V0TmFtZTogJ0hvbWUnXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudC5zZWFyY2gobWt0b0Rpc2FibGVCdXR0b25zRnJhZ21lbnRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgQVBQLmRpc2FibGVCdXR0b25zKClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50ID09PSBta3RvQWRtaW5XZWJTa3lGcmFnbWVudCkge1xuICAgICAgICAgICAgICBBUFAuZGlzYWJsZUNoZWNrYm94ZXMoKVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9BY2NvdW50QmFzZWRNYXJrZXRpbmdGcmFnbWVudCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgQVBQLmRpc2FibGVBY2NvdW50QUkoKVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9BbmFseXRpY3NIb21lRnJhZ21lbnQpICE9IC0xKSB7XG4gICAgICAgICAgICAgIEFQUC5vdmVycmlkZUFuYWx5dGljc1RpbGVzKClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50LnNlYXJjaCgnXicgKyBBUFAuZ2V0QXNzZXRDb21wQ29kZSgnTnVydHVyZSBQcm9ncmFtJykgKyAnWzAtOV0rQTEkJykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgQVBQLmRpc2FibGVOdXJ0dXJlUHJvZ3JhbXMoKVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQgPT0gbWt0b0FkbWluU2FsZXNmb3JjZUZyYWdtZW50IHx8IGN1cnJVcmxGcmFnbWVudCA9PSBta3RvQWRtaW5EeW5hbWljc0ZyYWdtZW50KSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBBZG1pbiA+IENSTScpXG4gICAgICAgICAgICAgIEFQUC5oaWRlT3RoZXJUb29sYmFySXRlbXMoW3tcbiAgICAgICAgICAgICAgICBpZDogJ2VuYWJsZVN5bmMnLCAvL0VuYWJsZS9EaXNhYmxlIFN5bmNcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgICB9XSlcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50ID09IG1rdG9BZG1pblJjYUN1c3RvbUZpZWxkU3luYykge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogQWRtaW4gPiBSZXZlbnVlIEN5Y2xlIEFuYWx5dGljcyA+IEN1c3RvbSBGaWVsZCBTeW5jJylcbiAgICAgICAgICAgICAgQVBQLmhpZGVPdGhlclRvb2xiYXJJdGVtcyhbe1xuICAgICAgICAgICAgICAgIGlkOiAnY2FkQ2hhbmdlQnV0dG9uJywgLy9FZGl0IFN5bmMgT3B0aW9uXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgICAgfV0pXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudC5zZWFyY2gobWt0b0FuYWx5emVyc0ZyYWdtZW50TWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBHb2xkZW4gQW5hbHl0aWNzJylcbiAgICAgICAgICAgICAgQVBQLnVwZGF0ZU5hdkJhcigpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuREwuZGwuZGxDb21wQ29kZScpKSB7XG4gICAgICAgICAgICAgIGN1cnJDb21wRnJhZ21lbnQgPSBNa3QzLkRMLmRsLmRsQ29tcENvZGVcbiAgICAgICAgICAgICAgaWYgKGN1cnJDb21wRnJhZ21lbnQuc2VhcmNoKG1rdG9EZXNpZ25lcnNGcmFnbWVudE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBEZXNpZ25lcnMvV2l6YXJkcycpXG4gICAgICAgICAgICAgICAgc3dpdGNoIChjdXJyQ29tcEZyYWdtZW50KSB7XG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9MYW5kaW5nUGFnZUVkaXRGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IExhbmRpbmcgUGFnZSBFZGl0b3InKVxuICAgICAgICAgICAgICAgICAgICBBUFAucmVzZXRHb2xkZW5MYW5kaW5nUGFnZVByb3BzKClcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnbGFuZGluZ1BhZ2UnLCAnZWRpdCcpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b0xhbmRpbmdQYWdlUHJldmlld0ZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogTGFuZGluZyBQYWdlIFByZXZpZXdlcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2xhbmRpbmdQYWdlJywgJ3ByZXZpZXcnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvTGFuZGluZ1BhZ2VQcmV2aWV3RHJhZnRGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IExhbmRpbmcgUGFnZSBEcmFmdCBQcmV2aWV3ZXInKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdsYW5kaW5nUGFnZScsICdwcmV2aWV3JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b0xhbmRpbmdQYWdlVGVtcGxhdGVFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBMYW5kaW5nIFBhZ2UgVGVtcGxhdGUgRWRpdG9yJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnbGFuZGluZ1BhZ2UnLCAndGVtcGxhdGVFZGl0JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b0xhbmRpbmdQYWdlVGVtcGxhdGVQcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBMYW5kaW5nIFBhZ2UgVGVtcGxhdGUgUHJldmlld2VyJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnbGFuZGluZ1BhZ2UnLCAndGVtcGxhdGVQcmV2aWV3JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b0VtYWlsRWRpdEZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VyclVybEZyYWdtZW50ID09IG1rdG9FbWFpbEVkaXRGcmFnbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBFbWFpbCBUZW1wbGF0ZSBQaWNrZXInKVxuICAgICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2VtYWlsJywgJ3RlbXBsYXRlUGlja2VyJylcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9FbWFpbFByZXZpZXdGcmFnbWVudFJlZ2V4KSA9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBFbWFpbCBFZGl0b3InKVxuICAgICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2VtYWlsJywgJ2VkaXQnKVxuICAgICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogRW1haWwgUHJldmlld2VyJylcbiAgICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdlbWFpbCcsICdwcmV2aWV3JylcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvRW1haWxUZW1wbGF0ZUVkaXRGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEVtYWlsIFRlbXBsYXRlIEVkaXRvcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2VtYWlsJywgJ3RlbXBsYXRlRWRpdCcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9Gb3JtRWRpdEZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogRm9ybSBFZGl0b3InKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdmb3JtJywgJ2VkaXQnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvRm9ybVByZXZpZXdGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEZvcm0gUHJldmlld2VyJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnZm9ybScsICdwcmV2aWV3JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b0Zvcm1QcmV2aWV3RHJhZnRGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEZvcm0gRHJhZnQgUHJldmlld2VyJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnZm9ybScsICdwcmV2aWV3JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b1B1c2hOb3RpZmljYXRpb25FZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBQdXNoIE5vdGlmaWNhdGlvbiBFZGl0b3InKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdwdXNoTm90aWZpY2F0aW9uJywgJ2VkaXQnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvTW9iaWxlUHVzaE5vdGlmaWNhdGlvblByZXZpZXdGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFB1c2ggTm90aWZpY2F0aW9uIFByZXZpZXdlcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ3B1c2hOb3RpZmljYXRpb24nLCAncHJldmlldycpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9JbkFwcE1lc3NhZ2VFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBJbi1BcHAgTWVzc2FnZSBFZGl0b3InKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdpbkFwcE1lc3NhZ2UnLCAnZWRpdCcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9JbkFwcE1lc3NhZ2VQcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBJbi1BcHAgTWVzc2FnZSBQcmV2aWV3ZXInKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdpbkFwcE1lc3NhZ2UnLCAncHJldmlldycpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9TbXNNZXNzYWdlRWRpdEZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogU01TIE1lc3NhZ2UgRWRpdG9yJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnc21zTWVzc2FnZScsICdlZGl0JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b1NvY2lhbEFwcEVkaXRGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFNvY2lhbCBBcHAgRWRpdG9yJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnc29jaWFsQXBwJywgJ2VkaXQnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvU29jaWFsQXBwUHJldmlld0ZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogU29jaWFsIEFwcCBQcmV2aWV3ZXInKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdzb2NpYWxBcHAnLCAncHJldmlldycpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9BYlRlc3RFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBBL0IgVGVzdCBXaXphcmQnKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdhYlRlc3QnLCAnZWRpdCcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9FbWFpbFRlc3RHcm91cEVkaXRGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEVtYWlsIFRlc3QgR3JvdXAgV2l6YXJkJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnYWJUZXN0JywgJ2VkaXQnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvU25pcHBldEVkaXRGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFNuaXBwZXQgRWRpdG9yJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnc25pcHBldCcsICdlZGl0JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b1NuaXBwZXRQcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBTbmlwcGV0IFByZXZpZXdlcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ3NuaXBwZXQnLCAncHJldmlldycpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LCAwKVxuICAgIH1cbiAgICBBUFAub3ZlcnJpZGVTdXBlcmJhbGxNZW51SXRlbXMoKVxuICAgIC8vIEhlYXAgQW5hbHl0aWNzIElEXG4gICAgQVBQLmhlYXBUcmFjaygnaWQnKVxuICB9XG59LCAwKVxuIl19
