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

        APP.heapTrack('track', {name: 'Unauthorized Node Added', assetName: nodeConfig.text, assetId: nodeConfig.compId, assetType: nodeConfig.compType, workspaceId: workspaceId, workspaceName: workspaceName})

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

        APP.heapTrack('track', {name: 'Unauthorized Node Removed', assetName: nodeConfig.text, assetId: nodeConfig.compId, assetType: nodeConfig.compType, workspaceId: nodeConfig.accessZoneId, workspaceName: workspaceName})

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

        APP.heapTrack('track', {name: 'Unauthorized Node Renamed', assetName: nodeConfig.text, assetId: nodeConfig.compId, assetType: nodeConfig.compType, workspaceId: nodeConfig.accessZoneId, workspaceName: workspaceName})

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
      APP.heapTrack('track', {name: 'Performance Insights', assetArea: 'Performance Insights', assetName: 'Demo App', assetType: 'Home Tile'})
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
      APP.heapTrack('track', {name: 'Performance Insights', assetArea: 'Performance Insights', assetName: 'Demo App', assetType: 'Home Tile'})
    }
  }
  if (emailInsightsTile) {
    emailInsightsTile.outerHTML = emailInsightsTile.outerHTML.replace(hrefMatch, ' href="' + mktoEmailInsightsLink + '" ')
    document.getElementById(emailInsightsTile.id).onclick = function () {
      APP.heapTrack('track', {name: 'Email Insights', assetArea: 'Email Insights', assetName: 'Home', assetType: 'Home Tile'})
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
      APP.heapTrack('track', {name: 'Email Insights', assetArea: 'Email Insights', assetName: 'Demo App', assetType: 'Home Tile'})
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
        APP.heapTrack('track', {name: 'Performance Insights', assetArea: 'Performance Insights', assetName: 'Demo App', assetType: 'Home Tile'})
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
        APP.heapTrack('track', {name: 'Performance Insights', assetArea: 'Performance Insights', assetName: 'Demo App', assetType: 'Home Tile'})
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
          APP.heapTrack('track', {name: 'Email Insights', assetArea: 'Email Insights', assetName: 'Home', assetType: 'Home Tile'})
        }
      } else {
        emailInsightsTile.outerHTML = emailInsightsTile.outerHTML.replace(hrefMatch, ' href="' + mktoEmailInsightsLink + '" ')
        document.getElementById(emailInsightsTile.id).onclick = function () {
          APP.heapTrack('track', {name: 'Email Insights', assetArea: 'Email Insights', assetName: 'Demo App', assetType: 'Home Tile'})
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
        APP.heapTrack('track', {name: 'Email Insights', assetArea: 'Email Insights', assetName: 'Demo App', assetType: 'Home Tile'})
      }
    }

    if (deliverabilityToolsTile) {
      deliverabilityToolsTile.outerHTML = deliverabilityToolsTile.outerHTML.replace(
        hrefMatch,
        ' href="' + mktoEmailDeliverabilityToolsLink + '" '
      )

      document.getElementById(deliverabilityToolsTile.id).onclick = function () {
        APP.heapTrack('track', {name: 'Deliverability Tools', assetArea: 'Deliverability Tools', assetName: 'Demo Account', assetType: 'Home Tile'})
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
        APP.heapTrack('track', {name: 'Deliverability Tools', assetArea: 'Deliverability Tools', assetName: 'Demo Account', assetType: 'Home Tile'})
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
        APP.heapTrack('track', {name: 'BizibleDiscover', assetArea: 'BizibleDiscover', assetName: 'Demo 106 Account', assetType: 'Home Tile'})
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
        APP.heapTrack('track', {name: 'Bizible Rev Plan ', assetArea: 'Bizible Rev Plan', assetName: 'Demo 106 Account', assetType: 'Home Tile'})
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
        APP.heapTrack('track', {name: 'Demo Modeler ', assetArea: 'Demo Modeler', assetName: 'Demo 106 Account', assetType: 'Home Tile'})
      }
    }

    if (seoTile) {
      document.getElementById(seoTile.id).onclick = function () {
        APP.heapTrack('track', {name: 'SEO', assetArea: 'SEO', assetName: 'Home', assetType: 'Home Tile'})
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
              APP.heapTrack('track', {name: 'Performance Insights', assetArea: 'Performance Insights', assetName: 'Demo App', assetType: 'Home Tile'})
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
              APP.heapTrack('track', {name: 'Performance Insights', assetArea: 'Performance Insights', assetName: 'Demo App', assetType: 'Home Tile'})
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
            let origMenuItemOnClick = deliverabilityToolsMenuItem.onClick

            deliverabilityToolsMenuItem.onClick = function (e) {
              origMenuItemOnClick.apply(this, arguments)
              APP.heapTrack('track', {name: 'Deliverability Tools', assetArea: 'Deliverability Tools', assetName: 'Demo Account', assetType: 'Home Tile'})
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
              APP.heapTrack('track', {name: 'Deliverability Tools', assetArea: 'Deliverability Tools', assetName: 'Demo Account', assetType: 'Home Tile'})
            }

            clonedMenuItem.update()
            menu.add(clonedMenuItem)
          }

          if (seoMenuItem) {
            let origMenuItemOnClick = seoMenuItem.onClick

            seoMenuItem.onClick = function (e) {
              origMenuItemOnClick.apply(this, arguments)
              APP.heapTrack('track', {name: 'SEO', assetArea: 'SEO', assetName: 'Home', assetType: 'Home Tile'})
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
                    this.findByType('textfield')[ii].getValue()
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
            let toUpdateNodeText = false

            MktSession.clockCursor(true)
            this.getTitleField().setValue(this.titleValue)
            let canvasTab = MktCanvas.getActiveTab(),
              //canvasTab.updateTabTitle(this.titleValue);
              nodeId = null
            if (canvasTab.config.expNodeId) {
              let node = MktExplorer.getNodeById(canvasTab.config.expNodeId)
              if (node && node.attributes.compType) {
                let {compType} = node.attributes
                if (compType == 'Marketing Program') {
                  nodeId = canvasTab.config.expNodeId
                  //MktExplorer.lockSubTree(nodeId);
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
            let toUpdateNodeText = true

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
            let canvasTab = MktCanvas.getActiveTab()
            canvasTab.updateTabTitle(this.titleValue)
            let nodeId = null
            if (canvasTab.config.expNodeId) {
              let node = MktExplorer.getNodeById(canvasTab.config.expNodeId)
              if (node && node.attributes.compType) {
                let {compType} = node.attributes
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

            let el = this.getEl(),
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
          let toUpdateNodeText = false

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

        let {target} = dropEvent
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
            let currNode, depth

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
            let origHandler = item.handler

            switch (itemToHide.id) {
              case 'pageEdit_landingLPDetail':
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
            ;({rendered} = me.rendered)
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

// window.mkto_live_extension_state = 'MarketoLive extension is alive!'

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
              APP.heapTrack('addProp', {area: 'ABM', assetType: LIB.formatText(this.getElementsByClassName('x4-tab-inner')[0].innerHTML)})

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
          APP.heapTrack('addProp', {area: 'ABM', assetType: LIB.formatText(document.getElementsByClassName('x4-tab-top-active')[0].getElementsByClassName('x4-tab-inner')[0].innerHTML)})
        }
      } else if (currUrlFragment == mktoMyMarketoFragment) {
        overrideTileTimerCount = true
        APP.overrideHomeTiles() //restoreEmailInsights);
        APP.heapTrack('track', {name: 'My Marketo', assetName: 'Home'})
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
        APP.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
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
        APP.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
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
        APP.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
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
          APP.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
          APP.heapTrack('addProp', {area: 'ABM', assetType: 'Discover Marketo Companies'})
          break
        case mktoAbmDiscoverCrmAccountsFragment:
          console.log('Marketo App > Location: ABM > Discover CRM Accounts')
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableFormDeleteButtons()
          APP.disableHarmfulSaveButtons()
          APP.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
          APP.heapTrack('addProp', {area: 'ABM', assetType: 'Discover CRM Accounts'})
          break
        case mktoAbmNamedAccountFragment:
          console.log('Marketo App > Location: ABM > Named Account')
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableFormDeleteButtons()
          APP.disableHarmfulSaveButtons()
          APP.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
          APP.heapTrack('addProp', {area: 'ABM', assetType: 'Named Account'})
          break
        case mktoAbmImportNamedAccountsFragment:
          console.log('Marketo App > Location: ABM > Import Named Accounts')
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableFormDeleteButtons()
          APP.disableHarmfulSaveButtons()
          APP.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
          APP.heapTrack('addProp', {area: 'ABM', assetType: 'Import Named Accounts'})
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
      APP.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
    }

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
              APP.heapTrack('track', {name: 'My Marketo', assetName: 'Home'})
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFsdC9saWIvY29uY2F0LW5vdGUuanMiLCJhbHQvbGliL2Rldi1tb2RlLmpzIiwiYWx0L2xpYi9saWIuanMiLCJhbHQvcGx1Z2ludjMvbWFya2V0by1hcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FDRkE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1cUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsdC9kaXN0L2Nocm9tZS1leHRlbnNpb24vd2ViLWFjY2Vzc2libGUtcmVzb3VyY2VzL21hcmtldG8tYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcblRoaXMgZmlsZSBpcyB0aGUgY29tYmluZWQgb3V0cHV0IG9mIG11bHRpcGxlIHNyYyBmaWxlcy4gRG8gbm90IGVkaXQgaXQgZGlyZWN0bHkuXG4qLyIsImlzRXh0RGV2TW9kZSA9IHRydWUiLCIvLyBjYXRjaCBhbGwgZm9yIGdsb2JhbGx5IGRlZmluZWQgZnVuY3Rpb25zIHVzZWQgYnkgYW55IGZpbGVcblxuLy8gdGhlIHdlYiBhY2Nlc3NpYmxlIHJlc291cmNlcyBwcmVmaXggbmVlZHMgdG8gZXhpc3QgaW4gdGhlIGNocm9tZSBleHRlbnNpb24gY29udGV4dCBBTkQgdGhlIHdpbmRvdyBjb250ZXh0XG4vLyBzbyBpbmplY3RlZCBzY3JpcHRzIGNhbiBhY2Nlc3Mgb3RoZXIgc2NyaXB0c1xud2luZG93LndhclByZWZpeFxuaWYgKHR5cGVvZiB3YXJQcmVmaXggPT09ICd1bmRlZmluZWQnICYmXG4gIHR5cGVvZiBjaHJvbWUgIT09ICd1bmRlZmluZWQnICYmXG4gIHR5cGVvZiBjaHJvbWUucnVudGltZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgdHlwZW9mIGNocm9tZS5ydW50aW1lLmdldFVSTCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgd2luZG93LndhclByZWZpeCA9IGNocm9tZS5ydW50aW1lLmdldFVSTCgnd2ViLWFjY2Vzc2libGUtcmVzb3VyY2VzJylcblxuICAvLyBkbyBub3QgYXR0ZW1wdCB0byBhZGQgdGhpcyBpbmxpbmUgc2NyaXB0IHRvIHRoZSBleHRlbnNpb24gYmFja2dyb3VuZCBvciBwb3B1cCBwYWdlLlxuICAvLyBpdCdzIG5vdCBhbGxvd2VkIGJ5IENocm9tZSdzIENTUCBhbmQgaXQncyBub3QgbmVlZGVkIGIvYyB0aGUgd2FyUHJlZml4IHdpbGwgYmUgYWxyZWFkeSBiZSBhdmFpbGFibGVcbiAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzcyMTg2NzgvaXMtY29udGVudC1zZWN1cml0eS1wb2xpY3ktdW5zYWZlLWlubGluZS1kZXByZWNhdGVkXG4gIGlmICghL15jaHJvbWUtZXh0ZW5zaW9uOi4qKFxcL19nZW5lcmF0ZWRfYmFja2dyb3VuZF9wYWdlXFwuaHRtbHxcXC9wb3B1cFxcL3BvcHVwLmh0bWwpJC8udGVzdChsb2NhdGlvbi5ocmVmKSkge1xuICAgIGxldCBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0JylcbiAgICBzLmlubmVySFRNTCA9IGB3aW5kb3cud2FyUHJlZml4ID0gJyR7d2FyUHJlZml4fSdgXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzKVxuICB9XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby12YXJcbnZhciBMSUIgPSB7XG5cbiAgTUFSS0VUT19MSVZFX0FQUDogJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzL21hcmtldG8tYXBwLmpzJyxcbiAgTUFSS0VUT19HTE9CQUxfQVBQOiAnaHR0cHM6Ly9tYXJrZXRvbGl2ZS5jb20vbTMvcGx1Z2ludjMvbWFya2V0by1nbG9iYWwtYXBwLmpzJyxcbiAgR0xPQkFMX0xBTkRJTkdfUEFHRTogJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzL2dsb2JhbC1sYW5kaW5nLXBhZ2UuanMnLFxuICBIRUFQX0FOQUxZVElDU19TQ1JJUFRfTE9DQVRJT046ICdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52My9oZWFwLWFuYWx5dGljcy1leHQuanMnLFxuXG4gIGFkZFN0eWxlczogZnVuY3Rpb24gKGNzcykge1xuICAgIGxldCBoID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcbiAgICAgIHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gICAgcy50eXBlID0gJ3RleHQvY3NzJ1xuICAgIHMuaW5uZXJIVE1MID0gY3NzXG4gICAgaC5hcHBlbmRDaGlsZChzKVxuICB9LFxuXG4gIGlzUHJvcE9mV2luZG93T2JqOiBmdW5jdGlvbiAocykge1xuICAgIGlmICh0eXBlb2YgcyAhPT0gJ3N0cmluZycgfHwgL1tbKF1dLy50ZXN0KHMpKSB7XG4gICAgICB0aHJvdyAnSW52YWxpZCBwYXJhbSB0byBpc1Byb3BPZldpbmRvd09iaidcbiAgICB9XG4gICAgbGV0IGEgPSBzLnNwbGl0KCcuJyksXG4gICAgICBvYmogPSB3aW5kb3dbYS5zaGlmdCgpXVxuICAgIHdoaWxlIChvYmogJiYgYS5sZW5ndGgpIHtcbiAgICAgIG9iaiA9IG9ialthLnNoaWZ0KCldXG4gICAgfVxuICAgIHJldHVybiAhIW9ialxuICB9LFxuXG4gIGdldEV4dGVuc2lvbklkOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBjaHJvbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBjaHJvbWUucnVudGltZSA9PT0gJ29iamVjdCcgJiYgY2hyb21lLnJ1bnRpbWUuaWQpIHtcbiAgICAgIHJldHVybiBjaHJvbWUucnVudGltZS5pZFxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gd2FyUHJlZml4LnJlcGxhY2UoLy4qOlxcL1xcLyhbXi9dKikuKi8sICckMScpXG4gICAgfVxuICB9LFxuXG4gIHJlbG9hZFRhYnM6IGZ1bmN0aW9uICh1cmxNYXRjaCkge1xuICAgIGNocm9tZS50YWJzLnF1ZXJ5KHt1cmw6IHVybE1hdGNofSxcbiAgICAgIGZ1bmN0aW9uICh0YWJzKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFicy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNocm9tZS50YWJzLnJlbG9hZCh0YWJzW2ldLmlkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9LFxuXG4gIGdldENvb2tpZTogZnVuY3Rpb24gKGNvb2tpZU5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnR2V0dGluZzogQ29va2llICcgKyBjb29raWVOYW1lKVxuICAgIGxldCBuYW1lID0gY29va2llTmFtZSArICc9JyxcbiAgICAgIGNvb2tpZXMgPSBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsnKSxcbiAgICAgIGN1cnJDb29raWVcblxuICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBjb29raWVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgY3VyckNvb2tpZSA9IGNvb2tpZXNbaWldLnRyaW0oKVxuICAgICAgaWYgKGN1cnJDb29raWUuaW5kZXhPZihuYW1lKSA9PSAwKSB7XG4gICAgICAgIHJldHVybiBjdXJyQ29va2llLnN1YnN0cmluZyhuYW1lLmxlbmd0aCwgY3VyckNvb2tpZS5sZW5ndGgpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nOiBDb29raWUgJyArIGNvb2tpZU5hbWUgKyAnIG5vdCBmb3VuZCcpXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICByZW1vdmVDb29raWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICBsZXQgY29va2llID0ge1xuICAgICAgdXJsOiBvYmoudXJsLFxuICAgICAgbmFtZTogb2JqLm5hbWVcbiAgICB9XG4gICAgY2hyb21lLmNvb2tpZXMucmVtb3ZlKGNvb2tpZSwgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ1JlbW92aW5nOiAnICsgY29va2llLm5hbWUgKyAnIENvb2tpZSBmb3IgJyArIGNvb2tpZS51cmwpXG4gICAgfSlcbiAgfSxcblxuICBzZXRDb29raWU6IGZ1bmN0aW9uIChvYmopIHtcbiAgICBsZXQgY29va2llID0ge1xuICAgICAgdXJsOiBvYmoudXJsLFxuICAgICAgbmFtZTogb2JqLm5hbWUsXG4gICAgICB2YWx1ZTogb2JqLnZhbHVlLFxuICAgICAgZG9tYWluOiBvYmouZG9tYWluXG4gICAgfVxuXG4gICAgaWYgKG9iai5leHBpcmVzSW5EYXlzKSB7XG4gICAgICBjb29raWUuZXhwaXJhdGlvbkRhdGUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDAgKyBvYmouZXhwaXJlc0luRGF5cyAqIDI0ICogNjAgKiA2MFxuICAgIH1cbiAgICBpZiAob2JqLnNlY3VyZSkge1xuICAgICAgY29va2llLnNlY3VyZSA9IG9iai5zZWN1cmVcbiAgICB9XG5cbiAgICBjaHJvbWUuY29va2llcy5zZXQoY29va2llLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoY29va2llLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1NldHRpbmc6ICcgKyBjb29raWUubmFtZSArICcgQ29va2llIGZvciAnICsgY29va2llLmRvbWFpbiArICcgPSAnICsgY29va2llLnZhbHVlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1NldHRpbmc6ICcgKyBjb29raWUubmFtZSArICcgQ29va2llIGZvciAnICsgY29va2llLmRvbWFpbiArICcgPSBudWxsJylcbiAgICAgIH1cbiAgICB9KVxuICB9LFxuXG4gIGZvcm1hdFRleHQ6IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgbGV0IHNwbGl0VGV4dCA9IHRleHQudHJpbSgpLnNwbGl0KCcgJyksXG4gICAgICBmb3JtYXR0ZWRUZXh0ID0gJydcblxuICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBzcGxpdFRleHQubGVuZ3RoOyBpaSsrKSB7XG4gICAgICBpZiAoaWkgIT0gMCkge1xuICAgICAgICBmb3JtYXR0ZWRUZXh0ICs9ICcgJ1xuICAgICAgfVxuICAgICAgZm9ybWF0dGVkVGV4dCArPSBzcGxpdFRleHRbaWldLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3BsaXRUZXh0W2lpXS5zdWJzdHJpbmcoMSkudG9Mb3dlckNhc2UoKVxuICAgIH1cblxuICAgIHJldHVybiBmb3JtYXR0ZWRUZXh0XG4gIH0sXG5cbiAgZ2V0VXJsUGFyYW06IGZ1bmN0aW9uIChwYXJhbSkge1xuICAgIGNvbnNvbGUubG9nKCdHZXR0aW5nOiBVUkwgUGFyYW1ldGVyOiAnICsgcGFyYW0pXG4gICAgbGV0IHBhcmFtU3RyaW5nID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJz8nKVsxXVxuXG4gICAgaWYgKHBhcmFtU3RyaW5nKSB7XG4gICAgICBsZXQgcGFyYW1zID0gcGFyYW1TdHJpbmcuc3BsaXQoJyYnKSxcbiAgICAgICAgcGFyYW1QYWlyLFxuICAgICAgICBwYXJhbU5hbWUsXG4gICAgICAgIHBhcmFtVmFsdWVcblxuICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHBhcmFtcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgcGFyYW1QYWlyID0gcGFyYW1zW2lpXS5zcGxpdCgnPScpXG4gICAgICAgIHBhcmFtTmFtZSA9IHBhcmFtUGFpclswXVxuICAgICAgICBwYXJhbVZhbHVlID0gcGFyYW1QYWlyWzFdXG5cbiAgICAgICAgaWYgKHBhcmFtTmFtZSA9PSBwYXJhbSkge1xuICAgICAgICAgIHBhcmFtVmFsdWUgPSBkZWNvZGVVUklDb21wb25lbnQocGFyYW1WYWx1ZSlcbiAgICAgICAgICBpZiAocGFyYW1WYWx1ZS5zZWFyY2goL15odHRwKHMpPzpcXC9cXC8vKSA9PSAtMSkge1xuICAgICAgICAgICAgcGFyYW1WYWx1ZSA9IHBhcmFtVmFsdWUucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc29sZS5sb2coJ1VSTCBQYXJhbWV0ZXI6ICcgKyBwYXJhbU5hbWUgKyAnID0gJyArIHBhcmFtVmFsdWUpXG4gICAgICAgICAgcmV0dXJuIHBhcmFtVmFsdWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJydcbiAgfSxcblxuICBsb2FkU2NyaXB0OiBmdW5jdGlvbiAoc2NyaXB0U3JjKSB7XG4gICAgc2NyaXB0U3JjID0gc2NyaXB0U3JjLnJlcGxhY2UoJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzJywgd2FyUHJlZml4KVxuICAgIGNvbnNvbGUubG9nKCdMb2FkaW5nOiBTY3JpcHQ6ICcgKyBzY3JpcHRTcmMpXG4gICAgbGV0IHNjcmlwdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgIHNjcmlwdEVsZW1lbnQuYXN5bmMgPSB0cnVlXG4gICAgc2NyaXB0RWxlbWVudC5zcmMgPSBzY3JpcHRTcmNcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdEVsZW1lbnQpXG4gIH0sXG5cbiAgd2ViUmVxdWVzdDogZnVuY3Rpb24gKHVybCwgcGFyYW1zLCBtZXRob2QsIGFzeW5jLCByZXNwb25zZVR5cGUsIGNhbGxiYWNrKSB7XG4gICAgdXJsID0gdXJsLnJlcGxhY2UoJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzJywgd2FyUHJlZml4KVxuICAgIGNvbnNvbGUubG9nKCdXZWIgUmVxdWVzdCA+ICcgKyB1cmwgKyAnXFxuJyArIHBhcmFtcylcbiAgICBsZXQgeG1sSHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpLFxuICAgICAgcmVzdWx0XG4gICAgeG1sSHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nICYmIHhtbEh0dHAucmVhZHlTdGF0ZSA9PSA0ICYmIHhtbEh0dHAuc3RhdHVzID09IDIwMCkge1xuICAgICAgICByZXN1bHQgPSBjYWxsYmFjayh4bWxIdHRwLnJlc3BvbnNlKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYXN5bmMgJiYgeG1sSHR0cC5yZXNwb25zZVR5cGUpIHtcbiAgICAgIHhtbEh0dHAucmVzcG9uc2VUeXBlID0gcmVzcG9uc2VUeXBlXG4gICAgfVxuICAgIHhtbEh0dHAub3BlbihtZXRob2QsIHVybCwgYXN5bmMpIC8vIHRydWUgZm9yIGFzeW5jaHJvbm91c1xuICAgIHhtbEh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOCcpXG5cbiAgICAvLyBraGI6IGlzIHRoaXMgaGVhZGVyIG5lY2Vzc2FyeT8gd2h5IG5vdCBzZXQgaXQgYWxsIHRoZSB0aW1lP1xuICAgIGlmICh1cmwuc2VhcmNoKC9eXFwvLykgIT0gLTEgfHwgdXJsLnJlcGxhY2UoL15bYS16XSs6XFwvXFwvKFteL10rKVxcLz8uKiQvLCAnJDEnKSA9PSB3aW5kb3cubG9jYXRpb24uaG9zdCkge1xuICAgICAgeG1sSHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0JylcbiAgICB9XG5cbiAgICB4bWxIdHRwLndpdGhDcmVkZW50aWFscyA9IHRydWVcbiAgICB4bWxIdHRwLnNlbmQocGFyYW1zKVxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICB2YWxpZGF0ZURlbW9FeHRlbnNpb25DaGVjazogZnVuY3Rpb24gKGlzVmFsaWRFeHRlbnNpb24pIHtcbiAgICBjb25zb2xlLmxvZygnPiBWYWxpZGF0aW5nOiBEZW1vIEV4dGVuc2lvbiBDaGVjaycpXG4gICAgaWYgKGlzVmFsaWRFeHRlbnNpb24pIHtcbiAgICAgIHdpbmRvdy5ta3RvX2xpdmVfZXh0ZW5zaW9uX3N0YXRlID0gJ01hcmtldG9MaXZlIGV4dGVuc2lvbiBpcyBhbGl2ZSEnXG4gICAgICBjb25zb2xlLmxvZygnPiBWYWxpZGF0aW5nOiBEZW1vIEV4dGVuc2lvbiBJUyBWYWxpZCcpXG4gICAgfSBlbHNlIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdFBhZ2UudmFsaWRhdGVEZW1vRXh0ZW5zaW9uJykpIHtcbiAgICAgIHdpbmRvdy5ta3RvX2xpdmVfZXh0ZW5zaW9uX3N0YXRlID0gbnVsbFxuICAgICAgTWt0UGFnZS52YWxpZGF0ZURlbW9FeHRlbnNpb24obmV3IERhdGUoKSlcbiAgICAgIGNvbnNvbGUubG9nKCc+IFZhbGlkYXRpbmc6IERlbW8gRXh0ZW5zaW9uIElTIE5PVCBWYWxpZCcpXG4gICAgfVxuICB9LFxuXG4gIGdldE1rdDNDdGxyQXNzZXQ6IGZ1bmN0aW9uKGtleSwgbWV0aG9kKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoa2V5KVttZXRob2RdKClcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH0sXG5cbiAgLy8gb3ZlcmxheXMgYW4gZW1haWwgd2l0aCB0aGUgdXNlciBzdWJtaXR0ZWQgY29tcGFueSBsb2dvIGFuZCBjb2xvclxuICAvLyBhY3Rpb24gLSBtb2RlIGluIHdoaWNoIHRoaXMgYXNzZXQgaXMgYmVpbmcgdmlld2VkIChlZGl0L3ByZXZpZXcpXG4gIG92ZXJsYXlFbWFpbDogZnVuY3Rpb24gKGFjdGlvbikge1xuICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsJylcbiAgICBsZXQgaXNFbWFpbEVkaXRvcjIsXG4gICAgICBjbGVhck92ZXJsYXlWYXJzLFxuICAgICAgb3ZlcmxheSxcbiAgICAgIGlzTWt0b0hlYWRlckJnQ29sb3JSZXBsYWNlZCA9XG4gICAgICAgIChpc01rdG9JbWdSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvSGVyb0JnUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b1RleHRSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvU3ViVGV4dFJlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvRW1haWwxUmVwbGFjZWQgPVxuICAgICAgICAgIGVkaXRvclByZXZSZWFkeSA9XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPVxuICAgICAgICAgIGlzRGVza3RvcFByZXZpZXdSZXBsYWNlZCA9XG4gICAgICAgICAgaXNQaG9uZVByZXZpZXdSZXBsYWNlZCA9XG4gICAgICAgICAgZmFsc2UpLFxuICAgICAgbG9nb01rdG9OYW1lUmVnZXggPSBuZXcgUmVnRXhwKCdsb2dvJywgJ2knKSxcbiAgICAgIGJ1dHRvblRleHRSZWdleCA9IG5ldyBSZWdFeHAoJ3NpZ251cHxzaWduIHVwfGNhbGwgdG8gYWN0aW9ufGN0YXxyZWdpc3Rlcnxtb3JlfGNvbnRyaWJ1dGUnLCAnaScpLFxuICAgICAgc2F2ZUVkaXRzVG9nZ2xlID0gTElCLmdldENvb2tpZSgnc2F2ZUVkaXRzVG9nZ2xlU3RhdGUnKSxcbiAgICAgIGxvZ28gPSBMSUIuZ2V0Q29va2llKCdsb2dvJyksXG4gICAgICBoZXJvQmFja2dyb3VuZCA9IExJQi5nZXRDb29raWUoJ2hlcm9CYWNrZ3JvdW5kJyksXG4gICAgICBjb2xvciA9IExJQi5nZXRDb29raWUoJ2NvbG9yJyksXG4gICAgICBkZWZhdWx0Q29sb3IgPSAncmdiKDQyLCA4MywgMTEyKScsXG4gICAgICBsb2dvTWF4SGVpZ2h0ID0gJzU1JyxcbiAgICAgIG1rdG9NYWluVGV4dCA9ICdZb3UgVG8gVGhlPGJyPjxicj5QUkVNSUVSIEJVU0lORVNTIEVWRU5UPGJyPk9GIFRIRSBZRUFSJyxcbiAgICAgIG1rdG9TdWJUZXh0ID0gTElCLmdldEh1bWFuRGF0ZSgpLFxuICAgICAgY29tcGFueSxcbiAgICAgIGNvbXBhbnlOYW1lLFxuICAgICAgZWRpdG9yUmVwZWF0UmVhZHlDb3VudCA9IChkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IHBob25lUmVwZWF0UmVhZHlDb3VudCA9IDApLFxuICAgICAgbWF4UmVwZWF0UmVhZHkgPSAyMDAwLFxuICAgICAgbWF4UHJldmlld1JlcGVhdFJlYWR5ID0gMzAwMFxuXG4gICAgaWYgKHNhdmVFZGl0c1RvZ2dsZSA9PSAndHJ1ZScgfHwgKGxvZ28gPT0gbnVsbCAmJiBoZXJvQmFja2dyb3VuZCA9PSBudWxsICYmIGNvbG9yID09IG51bGwpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgaWYgKGxvZ28gIT0gbnVsbCkge1xuICAgICAgY29tcGFueSA9IGxvZ28uc3BsaXQoJ2h0dHBzOi8vbG9nby5jbGVhcmJpdC5jb20vJylbMV0uc3BsaXQoJy4nKVswXVxuICAgICAgY29tcGFueU5hbWUgPSBjb21wYW55LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY29tcGFueS5zbGljZSgxKVxuICAgICAgbWt0b01haW5UZXh0ID0gY29tcGFueU5hbWUgKyAnIEludml0ZXMgJyArIG1rdG9NYWluVGV4dFxuICAgIH0gZWxzZSB7XG4gICAgICBta3RvTWFpblRleHQgPSAnV2UgSW52aXRlICcgKyBta3RvTWFpblRleHRcbiAgICB9XG5cbiAgICBjbGVhck92ZXJsYXlWYXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgaXNNa3RvSGVhZGVyQmdDb2xvclJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9IZXJvQmdSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b1RleHRSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b1N1YlRleHRSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvRW1haWwxUmVwbGFjZWQgPVxuICAgICAgICBmYWxzZVxuICAgICAgZW1haWxCb2R5ID1cbiAgICAgICAgbWt0b0ltZ3MgPVxuICAgICAgICBta3RvVGV4dHMgPVxuICAgICAgICBta3RvQnV0dG9ucyA9XG4gICAgICAgIGxvZ29Td2FwQ29tcGFueSA9XG4gICAgICAgIGxvZ29Td2FwQ29udGFpbmVyID1cbiAgICAgICAgbG9nb1N3YXBDb21wYW55Q29udGFpbmVyID1cbiAgICAgICAgbG9nb0JrZyA9XG4gICAgICAgIGJ1dHRvbkJrZyA9XG4gICAgICAgIG51bGxcbiAgICB9XG5cbiAgICBvdmVybGF5ID0gZnVuY3Rpb24gKGVtYWlsRG9jdW1lbnQpIHtcbiAgICAgIGlmIChlbWFpbERvY3VtZW50KSB7XG4gICAgICAgIGxldCBlbWFpbEJvZHkgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0sXG4gICAgICAgICAgbG9nb1N3YXBDb21wYW55ID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nby1zd2FwLWNvbXBhbnknKSxcbiAgICAgICAgICBsb2dvU3dhcENvbnRhaW5lciA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ28tc3dhcC1jb250YWluZXInKSxcbiAgICAgICAgICBsb2dvU3dhcENvbXBhbnlDb250YWluZXIgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dvLXN3YXAtY29tcGFueS1jb250YWluZXInKSxcbiAgICAgICAgICBsb2dvQmtnID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nby1ia2cnKSxcbiAgICAgICAgICBidXR0b25Ca2cgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidXR0b24tYmtnJylcblxuICAgICAgICBpZiAoZW1haWxCb2R5ICYmIGVtYWlsQm9keS5pbm5lckhUTUwpIHtcbiAgICAgICAgICBsZXQgbWt0b0hlYWRlciA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2hlYWRlcicpWzBdLFxuICAgICAgICAgICAgbWt0b0xvZ28xID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnbG9nbycpWzBdLFxuICAgICAgICAgICAgbWt0b0xvZ28yID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnbG9nbycpWzFdLFxuICAgICAgICAgICAgbWt0b0ltZ3MgPSBlbWFpbEJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWt0b0ltZycpLFxuICAgICAgICAgICAgbWt0b0hlcm9CZyA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2hlcm9CYWNrZ3JvdW5kJylbMF0sXG4gICAgICAgICAgICBta3RvVGRzID0gZW1haWxCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0ZCcpLFxuICAgICAgICAgICAgbWt0b1RpdGxlID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgndGl0bGUnKVswXSxcbiAgICAgICAgICAgIG1rdG9TdWJ0aXRsZSA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ3N1YnRpdGxlJylbMF0sXG4gICAgICAgICAgICBta3RvVGV4dHMgPSBlbWFpbEJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWt0b1RleHQnKSxcbiAgICAgICAgICAgIG1rdG9CdXR0b24gPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdidXR0b24nKVswXSxcbiAgICAgICAgICAgIG1rdG9CdXR0b25zID0gZW1haWxCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NlY29uZGFyeS1mb250IGJ1dHRvbicpXG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0hlYWRlckJnQ29sb3JSZXBsYWNlZCAmJiBjb2xvciAmJiBta3RvSGVhZGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgSGVhZGVyIEJhY2tncm91bmQgQ29tcGFueSBDb2xvciBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgIG1rdG9IZWFkZXIuc3R5bGUuc2V0UHJvcGVydHkoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvcilcbiAgICAgICAgICAgIG1rdG9IZWFkZXIuc2V0QXR0cmlidXRlKCdiZ0NvbG9yJywgY29sb3IpXG4gICAgICAgICAgICBpc01rdG9IZWFkZXJCZ0NvbG9yUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9JbWdSZXBsYWNlZCAmJiBsb2dvICYmIChta3RvTG9nbzEgfHwgbWt0b0xvZ28yIHx8IG1rdG9JbWdzLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9Mb2dvMSB8fCBta3RvTG9nbzIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIENvbXBhbnkgTG9nbyBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgaWYgKG1rdG9Mb2dvMSAmJiBta3RvTG9nbzEuZ2V0QXR0cmlidXRlKCdkaXNwbGF5JykgIT0gJ25vbmUnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIENvbXBhbnkgTG9nbyAxJylcbiAgICAgICAgICAgICAgICBta3RvTG9nbzEuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzEuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChta3RvTG9nbzIgJiYgbWt0b0xvZ28yLmdldEF0dHJpYnV0ZSgnZGlzcGxheScpICE9ICdub25lJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBDb21wYW55IExvZ28gMicpXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28yLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28yLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBta3RvSW1ncy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9JbWcgPSBta3RvSW1nc1tpaV0sXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZ01rdG9OYW1lXG5cbiAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdta3RvbmFtZScpKSB7XG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZ01rdG9OYW1lID0gY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdta3RvbmFtZScpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ2lkJykpIHtcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nTWt0b05hbWUgPSBjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ2lkJylcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9JbWdNa3RvTmFtZSAmJiBjdXJyTWt0b0ltZ01rdG9OYW1lLnNlYXJjaChsb2dvTWt0b05hbWVSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b0ltZ1RhZyA9IGN1cnJNa3RvSW1nLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKVswXVxuXG4gICAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9JbWdUYWcgJiYgY3Vyck1rdG9JbWdUYWcuZ2V0QXR0cmlidXRlKCdzcmMnKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgQ29tcGFueSBMb2dvJylcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWdUYWcuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWdUYWcuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nVGFnLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9IZXJvQmdSZXBsYWNlZCAmJiBoZXJvQmFja2dyb3VuZCAmJiAobWt0b0hlcm9CZyB8fCBta3RvVGRzLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9IZXJvQmcpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIEhlcm8gQ29tcGFueSBCYWNrZ3JvdW5kIGZvciBEZW1vIFN2Y3MgVGVtcGxhdGUnKVxuICAgICAgICAgICAgICBta3RvSGVyb0JnLnN0eWxlLnNldFByb3BlcnR5KCdiYWNrZ3JvdW5kLWltYWdlJywgJ3VybChcXCcnICsgaGVyb0JhY2tncm91bmQgKyAnXFwnKScpXG4gICAgICAgICAgICAgIG1rdG9IZXJvQmcuc2V0QXR0cmlidXRlKCdiYWNrZ3JvdW5kJywgaGVyb0JhY2tncm91bmQpXG4gICAgICAgICAgICAgIC8vbWt0b0hlcm9CZy5zdHlsZS5zZXRQcm9wZXJ0eShcImJhY2tncm91bmQtc2l6ZVwiLCBcImNvdmVyXCIpO1xuICAgICAgICAgICAgICBpc01rdG9IZXJvQmdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBta3RvVGRzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b1RkID0gbWt0b1Rkc1tpaV1cblxuICAgICAgICAgICAgICAgIGlmIChjdXJyTWt0b1RkICYmIGN1cnJNa3RvVGQuZ2V0QXR0cmlidXRlKCdiYWNrZ3JvdW5kJykpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBIZXJvIENvbXBhbnkgQmFja2dyb3VuZCcpXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b1RkLnNldEF0dHJpYnV0ZSgnYmFja2dyb3VuZCcsIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9UZC5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoXFwnJyArIGhlcm9CYWNrZ3JvdW5kICsgJ1xcJyknKVxuICAgICAgICAgICAgICAgICAgLy9jdXJyTWt0b1RkLnN0eWxlLnNldFByb3BlcnR5KFwiYmFja2dyb3VuZC1zaXplXCIsIFwiY292ZXJcIik7XG4gICAgICAgICAgICAgICAgICBpc01rdG9IZXJvQmdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9CdXR0b25SZXBsYWNlZCAmJiBjb2xvciAmJiAobWt0b0J1dHRvbiB8fCBta3RvQnV0dG9ucy5sZW5ndGggIT0gMCkpIHtcbiAgICAgICAgICAgIGlmIChta3RvQnV0dG9uKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBCdXR0b24gQ29tcGFueSBDb2xvciBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgbWt0b0J1dHRvbi5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgICBta3RvQnV0dG9uLnN0eWxlLnNldFByb3BlcnR5KCdib3JkZXItY29sb3InLCBjb2xvcilcbiAgICAgICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b0J1dHRvbnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvQnV0dG9uID0gbWt0b0J1dHRvbnNbaWldXG5cbiAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9CdXR0b24uaW5uZXJIVE1MICYmIGN1cnJNa3RvQnV0dG9uLmlubmVySFRNTC5zZWFyY2goYnV0dG9uVGV4dFJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvQnV0dG9uLnN0eWxlICYmIGN1cnJNa3RvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgQnV0dG9uIENvbXBhbnkgQ29sb3InKVxuICAgICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvclxuICAgICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbG9yXG4gICAgICAgICAgICAgICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb2dvU3dhcENvbXBhbnlDb250YWluZXIgJiYgbG9nb1N3YXBDb250YWluZXIgJiYgbG9nb1N3YXBDb21wYW55ICYmIGxvZ29Ca2cpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAxLjAgQ29tcGFueSBMb2dvICYgQ29sb3InKVxuICAgICAgICAgIGlmIChjb2xvcikge1xuICAgICAgICAgICAgbG9nb0JrZy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvclxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChsb2dvKSB7XG4gICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuXG4gICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBsZXQgbG9nb0hlaWdodHNSYXRpbywgbG9nb1dpZHRoLCBsb2dvTmV3V2lkdGgsIGxvZ29OZXdIZWlnaHQsIGxvZ29TdHlsZVxuXG4gICAgICAgICAgICAgIGlmIChsb2dvU3dhcENvbXBhbnkubmF0dXJhbEhlaWdodCAmJiBsb2dvU3dhcENvbXBhbnkubmF0dXJhbEhlaWdodCA+IGxvZ29NYXhIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICBsb2dvSGVpZ2h0c1JhdGlvID0gbG9nb1N3YXBDb21wYW55Lm5hdHVyYWxIZWlnaHQgLyBsb2dvTWF4SGVpZ2h0XG4gICAgICAgICAgICAgICAgbG9nb1dpZHRoID0gbG9nb1N3YXBDb21wYW55Lm5hdHVyYWxXaWR0aCAvIGxvZ29IZWlnaHRzUmF0aW9cbiAgICAgICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkud2lkdGggPSBsb2dvTmV3V2lkdGggPSBsb2dvV2lkdGhcbiAgICAgICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkuaGVpZ2h0ID0gbG9nb05ld0hlaWdodCA9IGxvZ29NYXhIZWlnaHRcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChsb2dvU3dhcENvbXBhbnkubmF0dXJhbEhlaWdodCkge1xuICAgICAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueS53aWR0aCA9IGxvZ29OZXdXaWR0aCA9IGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsV2lkdGhcbiAgICAgICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkuaGVpZ2h0ID0gbG9nb05ld0hlaWdodCA9IGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsSGVpZ2h0XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LndpZHRoID0gbG9nb1N3YXBDb21wYW55LmhlaWdodCA9IGxvZ29OZXdXaWR0aCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvTWF4SGVpZ2h0XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpICYmIGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSkge1xuICAgICAgICAgICAgICAgIGxvZ29TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICAgICAgICAgICAgICBsb2dvU3R5bGUuaW5uZXJIVE1MID1cbiAgICAgICAgICAgICAgICAgICcjJyArIGxvZ29Td2FwQ29tcGFueS5pZCArICcge3dpZHRoIDogJyArIGxvZ29OZXdXaWR0aCArICdweCAhaW1wb3J0YW50OyBoZWlnaHQgOiAnICsgbG9nb05ld0hlaWdodCArICdweCAhaW1wb3J0YW50O30nXG4gICAgICAgICAgICAgICAgZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGxvZ29TdHlsZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAxLjAgQ29tcGFueSBMb2dvIERpbWVuc2lvbnMgPSAnICsgbG9nb05ld1dpZHRoICsgJyB4ICcgKyBsb2dvTmV3SGVpZ2h0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9nb1N3YXBDb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55Q29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGJ1dHRvbkJrZyAmJiBjb2xvcikge1xuICAgICAgICAgICAgYnV0dG9uQmtnLnN0eWxlLnNldFByb3BlcnR5KCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3IpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlzTWt0b0VtYWlsMVJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIChpc01rdG9CdXR0b25SZXBsYWNlZCAmJlxuICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgJiZcbiAgICAgICAgICAgIGlzTWt0b0hlcm9CZ1JlcGxhY2VkICYmXG4gICAgICAgICAgICAoIW1rdG9IZWFkZXIgfHwgKG1rdG9IZWFkZXIgJiYgaXNNa3RvSGVhZGVyQmdDb2xvclJlcGxhY2VkKSkpIHx8XG4gICAgICAgICAgaXNNa3RvRW1haWwxUmVwbGFjZWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBpc0VtYWlsRWRpdG9yMiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoYWN0aW9uID09ICdlZGl0Jykge1xuICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCBEZXNpZ25lcicpXG4gICAgICAgIGlmIChcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fCBlZGl0b3JSZXBlYXRSZWFkeUNvdW50ID49IG1heFJlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IEVtYWlsIERlc2lnbmVyID0gJyArIGVkaXRvclJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCBJbnRlcnZhbCBpcyBDbGVhcmVkJylcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzRW1haWxFZGl0b3IyKVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH0gZWxzZSBpZiAoZWRpdG9yUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBlZGl0b3JSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWRpdG9yUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgZWRpdG9yUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVkaXRvclByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09ICdwcmV2aWV3Jykge1xuICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCBQcmV2aWV3ZXInKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWlzRGVza3RvcFByZXZpZXdSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgb3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHxcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID49IG1heFByZXZpZXdSZXBlYXRSZWFkeVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBFbWFpbCBEZXNrdG9wIFByZXZpZXcgPSAnICsgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc0Rlc2t0b3BQcmV2aWV3UmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlc2t0b3BQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWlzUGhvbmVQcmV2aWV3UmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fCBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPj0gbWF4UHJldmlld1JlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IEVtYWlsIFBob25lIFByZXZpZXcgPSAnICsgcGhvbmVSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNQaG9uZVByZXZpZXdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAocGhvbmVQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIHBob25lUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBob25lUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzUGhvbmVQcmV2aWV3UmVwbGFjZWQgJiYgaXNEZXNrdG9wUHJldmlld1JlcGxhY2VkKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgSW50ZXJ2YWwgaXMgQ2xlYXJlZCcpXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNFbWFpbEVkaXRvcjIpXG4gICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIDApXG4gIH0sXG5cbiAgLy8gb3ZlcmxheXMgYSBsYW5kaW5nIHBhZ2Ugd2l0aCB0aGUgdXNlciBzdWJtaXR0ZWQgY29tcGFueSBsb2dvIGFuZCBjb2xvclxuICAvLyBhY3Rpb24gLSBtb2RlIGluIHdoaWNoIHRoaXMgYXNzZXQgaXMgYmVpbmcgdmlld2VkIChlZGl0L3ByZXZpZXcpXG4gIG92ZXJsYXlMYW5kaW5nUGFnZTogZnVuY3Rpb24gKGFjdGlvbikge1xuICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZScpXG4gICAgbGV0IGlzTGFuZGluZ1BhZ2VFZGl0b3IsXG4gICAgICBjbGVhck92ZXJsYXlWYXJzLFxuICAgICAgb3ZlcmxheSxcbiAgICAgIGlzTWt0b0ZyZWVGb3JtID1cbiAgICAgICAgKGlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b1RleHRSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvU3ViVGV4dFJlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvT3JpZ1JlcGxhY2VkID1cbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID1cbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9XG4gICAgICAgICAgc2lkZUJ5U2lkZURlc2t0b3BQcmV2UmVhZHkgPVxuICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVByZXZSZWFkeSA9XG4gICAgICAgICAgaXNEZXNrdG9wUmVwbGFjZWQgPVxuICAgICAgICAgIGlzUGhvbmVSZXBsYWNlZCA9XG4gICAgICAgICAgaXNTaWRlQnlTaWRlRGVza3RvcFJlcGxhY2VkID1cbiAgICAgICAgICBpc1NpZGVCeVNpZGVQaG9uZVJlcGxhY2VkID1cbiAgICAgICAgICBmYWxzZSksXG4gICAgICBta3RvQm9keUlkID0gJ2JvZHlJZCcsXG4gICAgICBta3RvRnJlZUZvcm1DbGFzc05hbWUgPSAnbWt0b01vYmlsZVNob3cnLFxuICAgICAgbG9nb1JlZ2V4ID0gbmV3IFJlZ0V4cCgncHJpbWFyeUltYWdlfHByaW1hcnlfaW1hZ2V8cHJpbWFyeS1pbWFnZXxsb2dvfGltYWdlXzF8aW1hZ2UtMXxpbWFnZTEnLCAnaScpLFxuICAgICAgaGVyb0JnSW1nSWRSZWdleCA9IG5ldyBSZWdFeHAoJ2hlcm8nLCAnaScpLFxuICAgICAgYnV0dG9uVGV4dFJlZ2V4ID0gbmV3IFJlZ0V4cCgnc2lnbnVwfHNpZ24gdXB8Y2FsbCB0byBhY3Rpb258Y3RhfHJlZ2lzdGVyfG1vcmV8Y29udHJpYnV0ZXxzdWJtaXQnLCAnaScpLFxuICAgICAgc2F2ZUVkaXRzVG9nZ2xlID0gTElCLmdldENvb2tpZSgnc2F2ZUVkaXRzVG9nZ2xlU3RhdGUnKSxcbiAgICAgIGxvZ28gPSBMSUIuZ2V0Q29va2llKCdsb2dvJyksXG4gICAgICBoZXJvQmFja2dyb3VuZCA9IExJQi5nZXRDb29raWUoJ2hlcm9CYWNrZ3JvdW5kJyksXG4gICAgICBjb2xvciA9IExJQi5nZXRDb29raWUoJ2NvbG9yJyksXG4gICAgICBkZWZhdWx0Q29sb3IgPSAncmdiKDQyLCA4MywgMTEyKScsXG4gICAgICBsb2dvT3JpZ01heEhlaWdodCA9ICc1NScsXG4gICAgICBta3RvTWFpblRleHQgPSAnWW91IFRvIE91ciBFdmVudCcsXG4gICAgICBta3RvU3ViVGV4dCA9IExJQi5nZXRIdW1hbkRhdGUoKSxcbiAgICAgIGNvbXBhbnksXG4gICAgICBjb21wYW55TmFtZSxcbiAgICAgIGxpbmVhckdyYWRpZW50LFxuICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSAocGhvbmVSZXBlYXRSZWFkeUNvdW50ID0gc2lkZUJ5U2lkZURlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gc2lkZUJ5U2lkZVBob25lUmVwZWF0UmVhZHlDb3VudCA9IDApLFxuICAgICAgbWF4UmVwZWF0UmVhZHkgPSAyMDAwLFxuICAgICAgbWF4T3RoZXJSZXBlYXRSZWFkeSA9IDIwMDAsXG4gICAgICBmb3JtYXRCdXR0b25TdHlsZVxuXG4gICAgaWYgKHNhdmVFZGl0c1RvZ2dsZSA9PSAndHJ1ZScgfHwgKGxvZ28gPT0gbnVsbCAmJiBoZXJvQmFja2dyb3VuZCA9PSBudWxsICYmIGNvbG9yID09IG51bGwpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgaWYgKGxvZ28gIT0gbnVsbCkge1xuICAgICAgY29tcGFueSA9IGxvZ28uc3BsaXQoJ2h0dHBzOi8vbG9nby5jbGVhcmJpdC5jb20vJylbMV0uc3BsaXQoJy4nKVswXVxuICAgICAgY29tcGFueU5hbWUgPSBjb21wYW55LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY29tcGFueS5zbGljZSgxKVxuICAgICAgbWt0b01haW5UZXh0ID0gY29tcGFueU5hbWUgKyAnIEludml0ZXMgJyArIG1rdG9NYWluVGV4dFxuICAgIH0gZWxzZSB7XG4gICAgICBta3RvTWFpblRleHQgPSAnV2UgSW52aXRlICcgKyBta3RvTWFpblRleHRcbiAgICB9XG5cbiAgICBpZiAoY29sb3IpIHtcbiAgICAgIGZvcm1CdXR0b25TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICAgIGZvcm1CdXR0b25TdHlsZS50eXBlID0gJ3RleHQvY3NzJ1xuICAgICAgZm9ybUJ1dHRvblN0eWxlLmlubmVySFRNTCA9XG4gICAgICAgICcubWt0b0J1dHRvbiB7IGJhY2tncm91bmQtaW1hZ2U6IG5vbmUgIWltcG9ydGFudDsgYm9yZGVyLXJhZGl1czogMCAhaW1wb3J0YW50OyBib3JkZXI6IG5vbmUgIWltcG9ydGFudDsgYmFja2dyb3VuZC1jb2xvcjogJyArXG4gICAgICAgIGNvbG9yICtcbiAgICAgICAgJyAhaW1wb3J0YW50OyB9J1xuICAgICAgbGluZWFyR3JhZGllbnQgPSAnbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgJyArIGNvbG9yICsgJywgcmdiKDI0MiwgMjQyLCAyNDIpKSAhaW1wb3J0YW50J1xuICAgIH1cblxuICAgIGNsZWFyT3ZlcmxheVZhcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9UZXh0UmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9TdWJUZXh0UmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b09yaWdSZXBsYWNlZCA9XG4gICAgICAgIGZhbHNlXG4gICAgICBpZnJhbWVCb2R5ID1cbiAgICAgICAgbG9nb0ltZyA9XG4gICAgICAgIHRleHRCYWNrZ3JvdW5kID1cbiAgICAgICAgYmFubmVyQmFja2dyb3VuZCA9XG4gICAgICAgIG1haW5UaXRsZSA9XG4gICAgICAgIHN1YlRpdGxlID1cbiAgICAgICAgbWt0b0ltZ3MgPVxuICAgICAgICBta3RvVGV4dHMgPVxuICAgICAgICBta3RvUmljaFRleHRzID1cbiAgICAgICAgbWt0b0J1dHRvbnMgPVxuICAgICAgICBudWxsXG4gICAgfVxuXG4gICAgb3ZlcmxheSA9IGZ1bmN0aW9uIChpZnJhbWVEb2N1bWVudCkge1xuICAgICAgaWYgKGlmcmFtZURvY3VtZW50KSB7XG4gICAgICAgIGxldCBpZnJhbWVCb2R5ID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXSxcbiAgICAgICAgICBsb2dvSW1nID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xwLWxvZ28nKSxcbiAgICAgICAgICB0ZXh0QmFja2dyb3VuZCA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYWNrZ3JvdW5kLWNvbG9yJyksXG4gICAgICAgICAgYmFubmVyQmFja2dyb3VuZCA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiaWdnZXItYmFja2dyb3VuZCcpLFxuICAgICAgICAgIG1haW5UaXRsZSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aXRsZScpLFxuICAgICAgICAgIHN1YlRpdGxlID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N1Yi10aXRsZScpXG5cbiAgICAgICAgaWYgKGlmcmFtZUJvZHkgJiYgaWZyYW1lQm9keS5pbm5lckhUTUwpIHtcbiAgICAgICAgICBsZXQgbWt0b0hlYWRlciA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdoZWFkZXInKVswXSxcbiAgICAgICAgICAgIG1rdG9Mb2dvMSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdsb2dvJylbMF0sXG4gICAgICAgICAgICBta3RvTG9nbzIgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnbG9nbycpWzFdLFxuICAgICAgICAgICAgbWt0b0ltZ3MgPSBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2xwaW1nJyksXG4gICAgICAgICAgICBta3RvSGVyb0JnID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2hlcm9CYWNrZ3JvdW5kJylbMF0sXG4gICAgICAgICAgICBta3RvVGl0bGUgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgndGl0bGUnKVswXSxcbiAgICAgICAgICAgIG1rdG9TdWJ0aXRsZSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdzdWJ0aXRsZScpWzBdLFxuICAgICAgICAgICAgbWt0b1RleHRzID0gaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdta3RvVGV4dCcpLFxuICAgICAgICAgICAgbWt0b1JpY2hUZXh0cyA9IGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgncmljaFRleHRTcGFuJyksXG4gICAgICAgICAgICBta3RvQnV0dG9uID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2J1dHRvbicpWzBdLFxuICAgICAgICAgICAgbWt0b0J1dHRvbnMgPSBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdidXR0b24nKVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCAmJiBjb2xvciAmJiBta3RvSGVhZGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgSGVhZGVyIEJhY2tncm91bmQgQ29tcGFueSBDb2xvciBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgIG1rdG9IZWFkZXIuc2V0QXR0cmlidXRlKCdzdHlsZScsIG1rdG9IZWFkZXIuZ2V0QXR0cmlidXRlKCdzdHlsZScpICsgJzsgYmFja2dyb3VuZDogJyArIGxpbmVhckdyYWRpZW50ICsgJzsnKVxuICAgICAgICAgICAgaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBpc01rdG9GcmVlRm9ybSA9IGZhbHNlXG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICFpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCAmJlxuICAgICAgICAgICAgY29sb3IgJiZcbiAgICAgICAgICAgICFiYW5uZXJCYWNrZ3JvdW5kICYmXG4gICAgICAgICAgICBpZnJhbWVCb2R5LmlkID09IG1rdG9Cb2R5SWQgJiZcbiAgICAgICAgICAgIGlmcmFtZUJvZHkuY2xhc3NOYW1lICE9IG51bGwgJiZcbiAgICAgICAgICAgIGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpICYmXG4gICAgICAgICAgICBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKVswXSAmJlxuICAgICAgICAgICAgaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JylbMF0uc3R5bGVcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChpZnJhbWVCb2R5LmNsYXNzTmFtZS5zZWFyY2gobWt0b0ZyZWVGb3JtQ2xhc3NOYW1lKSAhPSAtMSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBGcmVlZm9ybSBMYW5kaW5nIFBhZ2UgQmFja2dyb3VuZCBDb21wYW55IENvbG9yJylcbiAgICAgICAgICAgICAgaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JylbMF0uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IgKyAnICFpbXBvcnRhbnQnXG4gICAgICAgICAgICAgIGlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkID0gaXNNa3RvRnJlZUZvcm0gPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBHdWlkZWQgTGFuZGluZyBQYWdlIEJhY2tncm91bmQgQ29tcGFueSBDb2xvcicpXG4gICAgICAgICAgICAgIGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpWzBdLnN0eWxlLmJhY2tncm91bmQgPSBsaW5lYXJHcmFkaWVudFxuICAgICAgICAgICAgICBpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgaXNNa3RvRnJlZUZvcm0gPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChmb3JtQnV0dG9uU3R5bGUpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9JbWdSZXBsYWNlZCAmJiBsb2dvICYmIChta3RvTG9nbzEgfHwgbWt0b0xvZ28yIHx8IG1rdG9JbWdzLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9Mb2dvMSB8fCBta3RvTG9nbzIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIENvbXBhbnkgTG9nbyBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgaWYgKG1rdG9Mb2dvMSAmJiBta3RvTG9nbzEuZ2V0QXR0cmlidXRlKCdkaXNwbGF5JykgIT0gJ25vbmUnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIENvbXBhbnkgTG9nbyAxJylcbiAgICAgICAgICAgICAgICBta3RvTG9nbzEuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzEuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChta3RvTG9nbzIgJiYgbWt0b0xvZ28yLmdldEF0dHJpYnV0ZSgnZGlzcGxheScpICE9ICdub25lJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28gMicpXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28yLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28yLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBta3RvSW1ncy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9JbWcgPSBta3RvSW1nc1tpaV1cblxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zcmMgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUudGFnTmFtZSA9PSAnRElWJyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZS5pZC5zZWFyY2gobG9nb1JlZ2V4KSAhPSAtMVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogR3VpZGVkIExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28nKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc3JjICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlLnRhZ05hbWUgPT0gJ1NQQU4nICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUucGFyZW50Tm9kZS5jbGFzc05hbWUuc2VhcmNoKGxvZ29SZWdleCkgIT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEZyZWVmb3JtIExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28nKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc3R5bGUud2lkdGggPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgJiYgaGVyb0JhY2tncm91bmQgJiYgKG1rdG9IZXJvQmcgfHwgbWt0b0ltZ3MubGVuZ3RoICE9IDApKSB7XG4gICAgICAgICAgICBpZiAobWt0b0hlcm9CZyAmJiBta3RvSGVyb0JnLmdldEF0dHJpYnV0ZSgnc3JjJykpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogR3VpZGVkIExhbmRpbmcgUGFnZSBIZXJvIENvbXBhbnkgQmFja2dyb3VuZCBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgbWt0b0hlcm9CZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgICBpc01rdG9IZXJvQmdJbWdSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBta3RvSW1ncy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9JbWcgPSBta3RvSW1nc1tpaV1cblxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnc3JjJykgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnaWQnKSAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdpZCcpLnNlYXJjaChoZXJvQmdJbWdJZFJlZ2V4KSAhPSAtMVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogR3VpZGVkIExhbmRpbmcgUGFnZSBIZXJvIENvbXBhbnkgQmFja2dyb3VuZCcpXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgICAgICAgaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvQnV0dG9uUmVwbGFjZWQgJiYgY29sb3IgJiYgKG1rdG9CdXR0b24gfHwgbWt0b0J1dHRvbnMubGVuZ3RoICE9IDApKSB7XG4gICAgICAgICAgICBpZiAobWt0b0J1dHRvbikge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgQnV0dG9uIENvbXBhbnkgQ29sb3IgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIG1rdG9CdXR0b24uc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICdzdHlsZScsXG4gICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uZ2V0QXR0cmlidXRlKCdzdHlsZScpICsgJzsgYmFja2dyb3VuZC1jb2xvcjogJyArIGNvbG9yICsgJyAhaW1wb3J0YW50OyBib3JkZXItY29sb3I6ICcgKyBjb2xvciArICcgIWltcG9ydGFudDsnXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b0J1dHRvbnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvQnV0dG9uID0gbWt0b0J1dHRvbnNbaWldXG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbiAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uc3R5bGUgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLnN0eWxlLmJhY2tncm91bmRDb2xvciAhPSBudWxsICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5pbm5lckhUTUwgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLmlubmVySFRNTC5zZWFyY2goYnV0dG9uVGV4dFJlZ2V4KSAhPSAtMVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIEJ1dHRvbiBDb21wYW55IENvbG9yJylcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAgICAgJ3N0eWxlJyxcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uZ2V0QXR0cmlidXRlKCdzdHlsZScpICtcbiAgICAgICAgICAgICAgICAgICAgJzsgYmFja2dyb3VuZC1jb2xvcjogJyArXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yICtcbiAgICAgICAgICAgICAgICAgICAgJyAhaW1wb3J0YW50OyBib3JkZXItY29sb3I6ICcgK1xuICAgICAgICAgICAgICAgICAgICBjb2xvciArXG4gICAgICAgICAgICAgICAgICAgICcgIWltcG9ydGFudDsnXG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxvZ29JbWcgJiYgdGV4dEJhY2tncm91bmQgJiYgdGV4dEJhY2tncm91bmQuc3R5bGUgJiYgYmFubmVyQmFja2dyb3VuZCAmJiBiYW5uZXJCYWNrZ3JvdW5kLnN0eWxlICYmIG1haW5UaXRsZSAmJiBzdWJUaXRsZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IE9yaWdpbmFsIExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28gJiBDb2xvcicpXG4gICAgICAgICAgaWYgKGxvZ28pIHtcbiAgICAgICAgICAgIGxvZ29JbWcuc3JjID0gbG9nb1xuXG4gICAgICAgICAgICBsb2dvSW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgbGV0IGxvZ29IZWlnaHRzUmF0aW8sIGxvZ29XaWR0aCwgbG9nb05ld1dpZHRoLCBsb2dvTmV3SGVpZ2h0LCBsb2dvU3R5bGVcblxuICAgICAgICAgICAgICBpZiAobG9nb0ltZy5uYXR1cmFsSGVpZ2h0ICYmIGxvZ29JbWcubmF0dXJhbEhlaWdodCA+IGxvZ29PcmlnTWF4SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgbG9nb0hlaWdodHNSYXRpbyA9IGxvZ29JbWcubmF0dXJhbEhlaWdodCAvIGxvZ29PcmlnTWF4SGVpZ2h0XG4gICAgICAgICAgICAgICAgbG9nb1dpZHRoID0gbG9nb0ltZy5uYXR1cmFsV2lkdGggLyBsb2dvSGVpZ2h0c1JhdGlvXG4gICAgICAgICAgICAgICAgbG9nb0ltZy53aWR0aCA9IGxvZ29JbWcuc3R5bGUud2lkdGggPSBsb2dvTmV3V2lkdGggPSBsb2dvV2lkdGhcbiAgICAgICAgICAgICAgICBsb2dvSW1nLmhlaWdodCA9IGxvZ29JbWcuc3R5bGUuaGVpZ2h0ID0gbG9nb05ld0hlaWdodCA9IGxvZ29PcmlnTWF4SGVpZ2h0XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobG9nb0ltZy5uYXR1cmFsSGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgbG9nb0ltZy53aWR0aCA9IGxvZ29JbWcuc3R5bGUud2lkdGggPSBsb2dvTmV3V2lkdGggPSBsb2dvSW1nLm5hdHVyYWxXaWR0aFxuICAgICAgICAgICAgICAgIGxvZ29JbWcuaGVpZ2h0ID0gbG9nb0ltZy5zdHlsZS5oZWlnaHQgPSBsb2dvTmV3SGVpZ2h0ID0gbG9nb0ltZy5uYXR1cmFsSGVpZ2h0XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9nb0ltZy53aWR0aCA9IGxvZ29JbWcuaGVpZ2h0ID0gbG9nb0ltZy5zdHlsZS53aWR0aCA9IGxvZ29JbWcuc3R5bGUuaGVpZ2h0ID0gbG9nb05ld1dpZHRoID0gbG9nb05ld0hlaWdodCA9IGxvZ29PcmlnTWF4SGVpZ2h0XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKSAmJiBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdKSB7XG4gICAgICAgICAgICAgICAgbG9nb1N0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgICAgICAgICAgICAgIGxvZ29TdHlsZS5pbm5lckhUTUwgPVxuICAgICAgICAgICAgICAgICAgJyMnICsgbG9nb0ltZy5pZCArICcge3dpZHRoIDogJyArIGxvZ29OZXdXaWR0aCArICdweCAhaW1wb3J0YW50OyBoZWlnaHQgOiAnICsgbG9nb05ld0hlaWdodCArICdweCAhaW1wb3J0YW50O30nXG4gICAgICAgICAgICAgICAgaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChsb2dvU3R5bGUpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogT3JpZ2luYWwgTGFuZGluZyBQYWdlIENvbXBhbnkgTG9nbyBEaW1lbnNpb25zID0gJyArIGxvZ29OZXdXaWR0aCArICcgeCAnICsgbG9nb05ld0hlaWdodClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29sb3IpIHtcbiAgICAgICAgICAgIHRleHRCYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yXG4gICAgICAgICAgICBiYW5uZXJCYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yXG4gICAgICAgICAgICBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGZvcm1CdXR0b25TdHlsZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgbWFpblRpdGxlLmlubmVySFRNTCA9IG1rdG9NYWluVGV4dFxuICAgICAgICAgIHN1YlRpdGxlLmlubmVySFRNTCA9IG1rdG9TdWJUZXh0XG4gICAgICAgICAgaXNNa3RvT3JpZ1JlcGxhY2VkID0gaXNNa3RvRnJlZUZvcm0gPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgKGlzTWt0b0J1dHRvblJlcGxhY2VkICYmXG4gICAgICAgICAgICAvLyYmIGlzTWt0b1N1YlRleHRSZXBsYWNlZFxuICAgICAgICAgICAgLy8mJiBpc01rdG9UZXh0UmVwbGFjZWRcbiAgICAgICAgICAgIGlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkICYmXG4gICAgICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCAmJlxuICAgICAgICAgICAgaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQpIHx8XG4gICAgICAgICAgaXNNa3RvT3JpZ1JlcGxhY2VkXG4gICAgICAgICkge1xuICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGlzTGFuZGluZ1BhZ2VFZGl0b3IgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGFjdGlvbiA9PSAnZWRpdCcpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIERlc2lnbmVyJylcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8IGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID49IG1heFJlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IExhbmRpbmcgUGFnZSBEZXNrdG9wIERlc2lnbmVyID0gJyArIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNEZXNrdG9wUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlc2t0b3BQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgaXNNa3RvRnJlZUZvcm0gJiZcbiAgICAgICAgICAhaXNQaG9uZVJlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAob3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHwgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID49IG1heFJlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IEZyZWVmb3JtIExhbmRpbmcgUGFnZSBQaG9uZSBEZXNpZ25lciA9ICcgKyBwaG9uZVJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc1Bob25lUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKHBob25lUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBwaG9uZVJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIHBob25lUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBob25lUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAoIWlzTWt0b0ZyZWVGb3JtICYmXG4gICAgICAgICAgICBpc0Rlc2t0b3BSZXBsYWNlZCAmJlxuICAgICAgICAgICAgIWRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0uaW5uZXJIVE1MKSB8fFxuICAgICAgICAgIChpc01rdG9GcmVlRm9ybSAmJiBpc1Bob25lUmVwbGFjZWQgJiYgaXNEZXNrdG9wUmVwbGFjZWQpXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBJbnRlcnZhbCBpcyBDbGVhcmVkJylcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0xhbmRpbmdQYWdlRWRpdG9yKVxuICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09ICdwcmV2aWV3Jykge1xuICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgUHJldmlld2VyJylcbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc0Rlc2t0b3BSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8IGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID49IG1heFJlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IExhbmRpbmcgUGFnZSBEZXNrdG9wIFByZXZpZXcgPSAnICsgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc0Rlc2t0b3BSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAoZGVza3RvcFByZXZSZWFkeSkge1xuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhaXNQaG9uZVJlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAob3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHwgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID49IG1heE90aGVyUmVwZWF0UmVhZHkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogTGFuZGluZyBQYWdlIFBob25lIFByZXZpZXcgPSAnICsgcGhvbmVSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNQaG9uZVJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChwaG9uZVByZXZSZWFkeSkge1xuICAgICAgICAgICAgcGhvbmVSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWlzU2lkZUJ5U2lkZURlc2t0b3BSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgb3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHxcbiAgICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhPdGhlclJlcGVhdFJlYWR5XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IExhbmRpbmcgUGFnZSBTaWRlIGJ5IFNpZGUgRGVza3RvcCBQcmV2aWV3ID0gJyArIHNpZGVCeVNpZGVEZXNrdG9wUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzU2lkZUJ5U2lkZURlc2t0b3BSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lkZUJ5U2lkZURlc2t0b3BQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgc2lkZUJ5U2lkZURlc2t0b3BQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2lkZUJ5U2lkZURlc2t0b3BQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc1NpZGVCeVNpZGVQaG9uZVJlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fFxuICAgICAgICAgICAgc2lkZUJ5U2lkZVBob25lUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhPdGhlclJlcGVhdFJlYWR5XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IExhbmRpbmcgUGFnZSBTaWRlIGJ5IFNpZGUgUGhvbmUgUHJldmlldyA9ICcgKyBzaWRlQnlTaWRlUGhvbmVSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNTaWRlQnlTaWRlUGhvbmVSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAoc2lkZUJ5U2lkZVBob25lUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBzaWRlQnlTaWRlUGhvbmVSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2lkZUJ5U2lkZVBob25lUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgc2lkZUJ5U2lkZVBob25lUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNTaWRlQnlTaWRlUGhvbmVSZXBsYWNlZCAmJiBpc1NpZGVCeVNpZGVEZXNrdG9wUmVwbGFjZWQgJiYgaXNQaG9uZVJlcGxhY2VkICYmIGlzRGVza3RvcFJlcGxhY2VkKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIEludGVydmFsIGlzIENsZWFyZWQnKVxuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzTGFuZGluZ1BhZ2VFZGl0b3IpXG4gICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sIDApXG4gIH0sXG5cbiAgZ2V0UHJvZ3JhbUFzc2V0RGV0YWlsczogZnVuY3Rpb24gKHByb2dyYW1Db21wSWQpIHtcbiAgICBsZXQgcmVzdWx0ID0gTElCLndlYlJlcXVlc3QoXG4gICAgICAnL21hcmtldGluZ0V2ZW50L2dldExvY2FsQXNzZXREZXRhaWxzJyxcbiAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICcmY29tcElkPScgK1xuICAgICAgcHJvZ3JhbUNvbXBJZCArXG4gICAgICAnJnhzcmZJZD0nICtcbiAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgJ1BPU1QnLFxuICAgICAgZmFsc2UsXG4gICAgICAnJyxcbiAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgcmVzcG9uc2UgJiZcbiAgICAgICAgICByZXNwb25zZS5KU09OUmVzdWx0cyAmJlxuICAgICAgICAgIHJlc3BvbnNlLkpTT05SZXN1bHRzLmxvY2FsQXNzZXRJbmZvICYmXG4gICAgICAgICAgKHJlc3BvbnNlLkpTT05SZXN1bHRzLmxvY2FsQXNzZXRJbmZvLnNtYXJ0Q2FtcGFpZ25zIHx8XG4gICAgICAgICAgICAocmVzcG9uc2UuSlNPTlJlc3VsdHMubG9jYWxBc3NldEluZm8uYXNzZXRMaXN0WzBdICYmIHJlc3BvbnNlLkpTT05SZXN1bHRzLmxvY2FsQXNzZXRJbmZvLmFzc2V0TGlzdFswXS50cmVlKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLkpTT05SZXN1bHRzLmxvY2FsQXNzZXRJbmZvXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LFxuXG4gIGdldFByb2dyYW1TZXR0aW5nczogZnVuY3Rpb24gKHByb2dyYW1UcmVlTm9kZSkge1xuICAgIGxldCByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICcvbWFya2V0aW5nRXZlbnQvZ2V0UHJvZ3JhbVNldHRpbmdzRGF0YScsXG4gICAgICAnJnN0YXJ0PTAnICtcbiAgICAgICcmcXVlcnk9JyArXG4gICAgICAnJmNvbXBJZD0nICtcbiAgICAgIHByb2dyYW1UcmVlTm9kZS5jb21wSWQgK1xuICAgICAgJyZjb21wVHlwZT0nICtcbiAgICAgIHByb2dyYW1UcmVlTm9kZS5jb21wVHlwZSArXG4gICAgICAnJnhzcmZJZD0nICtcbiAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgJ1BPU1QnLFxuICAgICAgZmFsc2UsXG4gICAgICAnJyxcbiAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICAgIHJldHVybiByZXNwb25zZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICBnZXRUYWdzOiBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHJlc3VsdCA9IExJQi53ZWJSZXF1ZXN0KFxuICAgICAgJy9tYXJrZXRpbmdFdmVudC9nZXRBbGxEZXNjcmlwdG9ycycsXG4gICAgICAnJnN0YXJ0PTAnICsgJyZ4c3JmSWQ9JyArIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgJ1BPU1QnLFxuICAgICAgZmFsc2UsXG4gICAgICAnJyxcbiAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuICAgICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICAgIGxldCBjdXJyVGFnLFxuICAgICAgICAgICAgamogPSAwLFxuICAgICAgICAgICAgY3VzdG9tVGFncyA9IFtdXG4gICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHJlc3BvbnNlLmRhdGEuZGVzY3JpcHRvcnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICBjdXJyVGFnID0gcmVzcG9uc2UuZGF0YS5kZXNjcmlwdG9yc1tpaV1cbiAgICAgICAgICAgIGlmIChjdXJyVGFnLnR5cGUgIT0gJ2NoYW5uZWwnKSB7XG4gICAgICAgICAgICAgIGN1c3RvbVRhZ3NbampdID0gY3VyclRhZ1xuICAgICAgICAgICAgICBqaisrXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjdXN0b21UYWdzXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LFxuXG4gIGFwcGx5TWFzc0Nsb25lOiBmdW5jdGlvbiAoT0JKLCBmb3JjZVJlbG9hZCkge1xuICAgIGNvbnNvbGUubG9nKCc+IEFwcGx5aW5nOiBNYXNzIENsb25lIE1lbnUgSXRlbScpXG4gICAgbGV0IG1hc3NDbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLnRyaWdnZXJlZEZyb20gPT0gJ3RyZWUnICYmIHRoaXMuZ2V0KCduZXdMb2NhbEFzc2V0JykpIHtcbiAgICAgICAgbGV0IG1hc3NDbG9uZUl0ZW0gPSB0aGlzLmdldCgnbmV3TG9jYWxBc3NldCcpLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgbWFzc0Nsb25lSXRlbUlkID0gJ2Nsb25lVmVydGljYWwnLFxuICAgICAgICAgIGN1cnJFeHBOb2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQodGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmlkKVxuXG4gICAgICAgIGlmICghdGhpcy5nZXQobWFzc0Nsb25lSXRlbUlkKSkge1xuICAgICAgICAgIG1hc3NDbG9uZUl0ZW0uaXRlbUlkID0gbWFzc0Nsb25lSXRlbUlkXG4gICAgICAgICAgbWFzc0Nsb25lSXRlbS50ZXh0ID0gJ01hc3MgQ2xvbmUnXG4gICAgICAgICAgbWFzc0Nsb25lSXRlbS5zZXRIYW5kbGVyKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgbGV0IGNsb25lRm9ybSA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe1xuICAgICAgICAgICAgICAgIGNsb25lRnJvbUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wSWQsXG4gICAgICAgICAgICAgICAgY2xvbmVOYW1lOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0LFxuICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBjbG9uZUZyb21GaWVsZCA9IGNsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIEZyb20nKVswXS5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZCA9IGNsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF0uY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQgPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQgPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQgPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldEZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdOYW1lJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQgPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF1cbiAgICAgICAgICAgICAgICAuY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybSA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe2N1cnJOb2RlOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGV9KSxcbiAgICAgICAgICAgICAgY3VzdG9tVGFncyxcbiAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZyxcbiAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ05hbWUsXG4gICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdWYWx1ZVxuICAgICAgICAgICAgZWwucGFyZW50TWVudS5oaWRlKHRydWUpXG5cbiAgICAgICAgICAgIGxldCBpc0Nsb25lVmVydGljYWxGb3JtID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmJ1dHRvbnNbMV0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmJ1dHRvbnNbMV0uc2V0SGFuZGxlciAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDaGFubmVsJylbMF0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbm5lbCcpWzBdLmRlc3Ryb3kgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnRGVzY3JpcHRpb24nKVswXSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdEZXNjcmlwdGlvbicpWzBdLmRlc3Ryb3kgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUHJvZ3JhbSBUeXBlJylbMF0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUHJvZ3JhbSBUeXBlJylbMF0uZGVzdHJveSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDYW1wYWlnbiBGb2xkZXInKVswXSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDYW1wYWlnbiBGb2xkZXInKVswXS5maWVsZExhYmVsICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ05hbWUnKVswXSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdOYW1lJylbMF0uZmllbGRMYWJlbCAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaXRlbXMubGFzdCgpLnNldFRleHQgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLml0ZW1zLmxhc3QoKS5zZXRWaXNpYmxlICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5zZXRXaWR0aCAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2V0SGVpZ2h0XG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzQ2xvbmVWZXJ0aWNhbEZvcm0pXG5cbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLnNldFRpdGxlKCdNYXNzIENsb25lJylcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmJ1dHRvbnNbMV0uc2V0VGV4dCgnQ2xvbmUnKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uYnV0dG9uc1sxXS5jdXJyTm9kZSA9IG1hc3NDbG9uZUZvcm0uY3Vyck5vZGVcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbm5lbCcpWzBdLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdEZXNjcmlwdGlvbicpWzBdLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdQcm9ncmFtIFR5cGUnKVswXS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2FtcGFpZ24gRm9sZGVyJylbMF0uZmllbGRMYWJlbCA9ICdDbG9uZSBUbydcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmFtZScpWzBdLmZpZWxkTGFiZWwgPSAnUHJvZ3JhbSBTdWZmaXgnXG5cbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5maWVsZExhYmVsID0gJ1Nob3cgTW9yZSBPcHRpb25zJ1xuICAgICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkLml0ZW1DbHMgPSAnJ1xuICAgICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMF0uc2V0KCd0ZXh0JywgJ05vJylcbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzFdLnNldCgndGV4dCcsICdZZXMnKVxuXG4gICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQuZmllbGRMYWJlbCA9ICdTQyBBY3RpdmF0aW9uIFN0YXRlJ1xuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLml0ZW1DbHMgPSAnJ1xuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMF0uc2V0KCd0ZXh0JywgJ0luaGVyaXQgU3RhdGUnKVxuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMV0uc2V0KCd0ZXh0JywgJ0ZvcmNlIEFjdGl2YXRlJylcblxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLmZpZWxkTGFiZWwgPSAnUGVyaW9kIENvc3QgRGF0YSdcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5pdGVtQ2xzID0gJydcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLnNldCgndGV4dCcsICdJbmhlcml0IERhdGEnKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMV0uc2V0KCd0ZXh0JywgJ0Jhc2VsaW5lIERhdGEnKVxuXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQuZmllbGRMYWJlbCA9ICdQZXJpb2QgQ29zdCBNb250aHMnXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQuaXRlbUNscyA9ICdta3RSZXF1aXJlZCdcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLnNldCgndGV4dCcsICcxMiBNb250aHMnKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMV0uc2V0KCd0ZXh0JywgJzI0IE1vbnRocycpXG5cbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0RmllbGQuZmllbGRMYWJlbCA9ICdQZXJpb2QgQ29zdCBPZmZzZXQnXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldEZpZWxkLml0ZW1DbHMgPSAnJ1xuXG4gICAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkLmZpZWxkTGFiZWwgPSAnQ2hhbmdlIFRhZyBUeXBlJ1xuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5pdGVtQ2xzID0gJydcblxuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQuZmllbGRMYWJlbCA9ICdOZXcgVGFnIFZhbHVlJ1xuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQuaXRlbUNscyA9ICdta3RSZXF1aXJlZCdcblxuICAgICAgICAgICAgICAgIGxldCBvcmlnT25TZWxlY3QgPSBzaG93TW9yZU9wdGlvbnNGaWVsZC5vblNlbGVjdFxuICAgICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkLm9uU2VsZWN0ID0gZnVuY3Rpb24gKGRvRm9jdXMpIHtcbiAgICAgICAgICAgICAgICAgIG9yaWdPblNlbGVjdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1NDIEFjdGl2YXRpb24gU3RhdGUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1NDIEFjdGl2YXRpb24gU3RhdGUnKVswXS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IERhdGEnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IERhdGEnKVswXS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5nZSBUYWcgVHlwZScpWzBdLmxhYmVsLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbmdlIFRhZyBUeXBlJylbMF0uc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnU0MgQWN0aXZhdGlvbiBTdGF0ZScpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1NDIEFjdGl2YXRpb24gU3RhdGUnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBEYXRhJylbMF0ubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgRGF0YScpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5nZSBUYWcgVHlwZScpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5nZSBUYWcgVHlwZScpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLm9uU2VsZWN0ID0gZnVuY3Rpb24gKGRvRm9jdXMpIHtcbiAgICAgICAgICAgICAgICAgIG9yaWdPblNlbGVjdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLmxhYmVsLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgTW9udGhzJylbMF0uc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE9mZnNldCcpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5vblNlbGVjdCA9IGZ1bmN0aW9uIChkb0ZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICBvcmlnT25TZWxlY3QuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmV3IFRhZyBWYWx1ZScpWzBdLmxhYmVsLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmV3IFRhZyBWYWx1ZScpWzBdLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ05ldyBUYWcgVmFsdWUnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdOZXcgVGFnIFZhbHVlJylbMF0ubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydCgwLCBjbG9uZUZyb21GaWVsZClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHNob3dNb3JlT3B0aW9uc0ZpZWxkKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgc2NBY3RpdmF0aW9uRmllbGQpXG4gICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHBlcmlvZENvc3RDbG9uZUZpZWxkKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQobWFzc0Nsb25lRm9ybS5pdGVtcy5sZW5ndGggLSAxLCBwZXJpb2RDb3N0TW9udGhGaWVsZClcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgcGVyaW9kQ29zdE9mZnNldEZpZWxkKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXRGaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgdGFnTmFtZUZpZWxkKVxuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgdGFnVmFsdWVGaWVsZClcbiAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLnNldFZpc2libGUoZmFsc2UpXG5cbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmJ1dHRvbnNbMV0uc2V0SGFuZGxlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgd2FpdE1zZyA9IG5ldyBFeHQuV2luZG93KHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2FibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogNTIwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDIyNSxcbiAgICAgICAgICAgICAgICAgICAgY2xzOiAnbWt0TW9kYWxGb3JtJyxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdQbGVhc2UgV2FpdCAuLi4nLFxuICAgICAgICAgICAgICAgICAgICBodG1sOlxuICAgICAgICAgICAgICAgICAgICAgICc8Yj5NYXNzIENsb25pbmc6PC9iPiAgPGk+JyArXG4gICAgICAgICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5jdXJyTm9kZS50ZXh0ICtcbiAgICAgICAgICAgICAgICAgICAgICAnPC9pPjxicj48YnI+VGhpcyBtYXkgdGFrZSBzZXZlcmFsIG1pbnV0ZXMgZGVwZW5kaW5nIG9uIHRoZSBxdWFudGl0eSBvZiBwcm9ncmFtcyBhbmQgYXNzZXRzIGNvbnRhaW5lZCB0aGVyZWluLidcbiAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBjbG9uZVRvRm9sZGVySWQgPSBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2xvbmUgVG8nKVswXS5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICBjbG9uZVRvU3VmZml4ID0gbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ1Byb2dyYW0gU3VmZml4JylbMF0uZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgY2xvbmVUb1RyZWVOb2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2xvbmVUb0ZvbGRlcklkKSxcbiAgICAgICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uU3RhdGUgPSBzY0FjdGl2YXRpb25GaWVsZC5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmUgPSBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0ID0gcGVyaW9kQ29zdE9mZnNldEZpZWxkLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIHRhZ05hbWUgPSB0YWdOYW1lRmllbGQuZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWUgPSB0YWdWYWx1ZUZpZWxkLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3QsXG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aCxcbiAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzLFxuICAgICAgICAgICAgICAgICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIHdhaXRNc2dTaG93XG5cbiAgICAgICAgICAgICAgICAgIGlmIChzY0FjdGl2YXRpb25TdGF0ZSA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmIChwZXJpb2RDb3N0Q2xvbmUgPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluaGVyaXRQZXJpb2RDb3N0ID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoID0gcGVyaW9kQ29zdE1vbnRoRmllbGQuZ2V0VmFsdWUoKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwZXJpb2RDb3N0TW9udGggPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyA9IDEyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGVyaW9kQ29zdE1vbnRoID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMgPSAyNFxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyA9IDBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNOdW1iZXIocGFyc2VJbnQocGVyaW9kQ29zdE9mZnNldCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldCA9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmNsb3NlKClcbiAgICAgICAgICAgICAgICAgIHdhaXRNc2dTaG93ID0gd2FpdE1zZy5zaG93KClcbiAgICAgICAgICAgICAgICAgIE9CSi5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdNYXNzIENsb25lJywgYXNzZXROYW1lOiAnVG9vbCd9KVxuXG4gICAgICAgICAgICAgICAgICBsZXQgaXNXYWl0TXNnU2hvdyA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3YWl0TXNnU2hvdykge1xuICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzV2FpdE1zZ1Nob3cpXG4gICAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJUcmVlTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lRm9sZGVyUmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlXG5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoX3RoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3MgQ2xvbmUgQCBGb2xkZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgX3RoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jaGlsZHJlbiAmJiBpaSA8IF90aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY2hpbGRyZW4ubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJUcmVlTm9kZSA9IF90aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY2hpbGRyZW5baWldXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJUcmVlTm9kZS5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXNzIENsb25lIEAgRm9sZGVyIHdpdGggRm9sZGVyIGNoaWxkcmVuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVGb2xkZXJSZXNwb25zZSA9IExJQi5jbG9uZUZvbGRlcihjdXJyVHJlZU5vZGUudGV4dCwgY2xvbmVUb1N1ZmZpeCwgY2xvbmVUb0ZvbGRlcklkKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lRm9sZGVyUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGpqID0gMDsgY3VyclRyZWVOb2RlLmNoaWxkcmVuICYmIGpqIDwgY3VyclRyZWVOb2RlLmNoaWxkcmVuLmxlbmd0aDsgamorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VyclRyZWVOb2RlLmNoaWxkcmVuW2pqXS5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXNzIENsb25lIEAgRm9sZGVyIHdpdGggRm9sZGVyIGRlcHRoIG9mIDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY3VyckZvbGRlclRyZWVOb2RlID0gY3VyclRyZWVOb2RlLmNoaWxkcmVuW2pqXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVGb2xkZXJSZXNwb25zZSA9IExJQi5jbG9uZUZvbGRlcihjdXJyRm9sZGVyVHJlZU5vZGUudGV4dCwgY2xvbmVUb1N1ZmZpeCwgY3VyckZvbGRlclRyZWVOb2RlLmlkKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lRm9sZGVyUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrayA9IDA7IGN1cnJGb2xkZXJUcmVlTm9kZS5jaGlsZHJlbiAmJiBrayA8IGN1cnJGb2xkZXJUcmVlTm9kZS5jaGlsZHJlbi5sZW5ndGg7IGtrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUgPSBjdXJyRm9sZGVyVHJlZU5vZGUuY2hpbGRyZW5ba2tdXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UgPSBMSUIuY2xvbmVQcm9ncmFtKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lVG9TdWZmaXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVGb2xkZXJSZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3MoY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5oZXJpdFBlcmlvZENvc3QgfHwgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZVBlcmlvZENvc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHBlcmlvZENvc3RPZmZzZXQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wSWQ6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wVHlwZTogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJiBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmIHRhZ05hbWUgJiYgdGFnVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtVGFnKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZU51cnR1cmVDYWRlbmNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UgPSBMSUIuY2xvbmVTbWFydENhbXBhaWduU3RhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NGb3JjZUFjdGl2YXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1SZXBvcnRGaWx0ZXIoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIEZvbGRlciB3aXRoIEZvbGRlciBkZXB0aCBvZiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUgPSBjdXJyVHJlZU5vZGUuY2hpbGRyZW5bampdXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZSA9IExJQi5jbG9uZVByb2dyYW0oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVRvU3VmZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVGb2xkZXJSZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyhjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGluaGVyaXRQZXJpb2RDb3N0IHx8IG51bU9mUGVyaW9kQ29zdE1vbnRocyA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lUGVyaW9kQ29zdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludChwZXJpb2RDb3N0T2Zmc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBJZDogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcFR5cGU6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiYgdGFnTmFtZSAmJiB0YWdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVRhZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lTnVydHVyZUNhZGVuY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UgPSBMSUIuY2xvbmVTbWFydENhbXBhaWduU3RhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NGb3JjZUFjdGl2YXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtUmVwb3J0RmlsdGVyKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXNzIENsb25lIEAgRm9sZGVyIHdpdGggUHJvZ3JhbSBjaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSA9IGN1cnJUcmVlTm9kZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UgPSBMSUIuY2xvbmVQcm9ncmFtKGNsb25lVG9TdWZmaXgsIGNsb25lVG9Gb2xkZXJJZCwgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3MoY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpbmhlcml0UGVyaW9kQ29zdCB8fCBudW1PZlBlcmlvZENvc3RNb250aHMgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZVBlcmlvZENvc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQocGVyaW9kQ29zdE9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wSWQ6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBUeXBlOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJiBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmIHRhZ05hbWUgJiYgdGFnVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1UYWcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZU51cnR1cmVDYWRlbmNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmNsb25lU21hcnRDYW1wYWlnblN0YXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVJlcG9ydEZpbHRlcihnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIFByb2dyYW1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSA9IF90aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXNcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UgPSBMSUIuY2xvbmVQcm9ncmFtKGNsb25lVG9TdWZmaXgsIGNsb25lVG9Gb2xkZXJJZCwgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpbmhlcml0UGVyaW9kQ29zdCB8fCBudW1PZlBlcmlvZENvc3RNb250aHMgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVQZXJpb2RDb3N0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQocGVyaW9kQ29zdE9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcElkOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBUeXBlOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiYgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJiB0YWdOYW1lICYmIHRhZ1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1UYWcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVOdXJ0dXJlQ2FkZW5jZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UgPSBMSUIuY2xvbmVTbWFydENhbXBhaWduU3RhdGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NGb3JjZUFjdGl2YXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVJlcG9ydEZpbHRlcihnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgTElCLnJlbG9hZE1hcmtldGluZ0FjdGl2aXRlcygpXG4gICAgICAgICAgICAgICAgICAgICAgd2FpdE1zZy5jbG9zZSgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2hvdygpXG4gICAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQub25TZWxlY3Qoc2hvd01vcmVPcHRpb25zRmllbGQuZmluZFJlY29yZCgndGV4dCcsICdObycpKVxuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLm9uU2VsZWN0KHNjQWN0aXZhdGlvbkZpZWxkLmZpbmRSZWNvcmQoJ3RleHQnLCAnSW5oZXJpdCBTdGF0ZScpKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLm9uU2VsZWN0KHBlcmlvZENvc3RDbG9uZUZpZWxkLmZpbmRSZWNvcmQoJ3RleHQnLCAnSW5oZXJpdCBEYXRhJykpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5zZXRXaWR0aCg1MjUpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5zZXRIZWlnaHQoNTYwKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaXRlbXMubGFzdCgpLnNldFRleHQoJ1Byb2dyYW1zIHRoYXQgaGF2ZSBhIGZvbGRlciBkZXB0aCBncmVhdGVyIHRoYW4gMiB3aWxsIG5vdCBiZSBjbG9uZWQuJylcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLml0ZW1zLmxhc3QoKS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLmxhYmVsLmRvbS5pbm5lckhUTUwgPSAnJm5ic3A7Jm5ic3A7Jm5ic3A7IE1vbnRoczonXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0RmllbGQubGFiZWwuZG9tLmlubmVySFRNTCA9ICcmbmJzcDsmbmJzcDsmbmJzcDsgQ29zdCBPZmZzZXQgKCsvLSk6J1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXRGaWVsZC5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQubGFiZWwuZG9tLmlubmVySFRNTCA9ICcmbmJzcDsmbmJzcDsmbmJzcDsgTmV3IFRhZyBWYWx1ZTonXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIGN1c3RvbVRhZ3MgPSBMSUIuZ2V0VGFncygpXG4gICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ05hbWUgPSB0YWdOYW1lRmllbGQuc3RvcmUuZGF0YS5pdGVtc1swXS5jb3B5KDApXG4gICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ1ZhbHVlID0gdGFnVmFsdWVGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLmNvcHkoMClcbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQuc3RvcmUucmVtb3ZlQWxsKHRydWUpXG4gICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5zdG9yZS5yZW1vdmVBbGwodHJ1ZSlcbiAgICAgICAgICAgICAgICBsZXQgaXNDdXN0b21UYWdzID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXN0b21UYWdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzQ3VzdG9tVGFncylcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgY3VzdG9tVGFncy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnID0gY3VzdG9tVGFnc1tpaV1cbiAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnTmFtZSA9IGN1cnJDdXN0b21UYWdOYW1lLmNvcHkoY3VyckN1c3RvbVRhZy5uYW1lKVxuICAgICAgICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdOYW1lLnNldCgndGV4dCcsIGN1cnJDdXN0b21UYWcubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnTmFtZS5kYXRhLmlkID0gY3VyckN1c3RvbVRhZy5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkLnN0b3JlLmFkZChjdXJyQ3VzdG9tVGFnTmFtZSlcblxuICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGpqID0gMDsgamogPCBjdXJyQ3VzdG9tVGFnLnZhbHVlcy5sZW5ndGg7IGpqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdWYWx1ZSA9IGN1cnJDdXN0b21UYWdWYWx1ZS5jb3B5KGN1cnJDdXN0b21UYWcudmFsdWVzW2pqXS52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdWYWx1ZS5zZXQoJ3RleHQnLCBjdXJyQ3VzdG9tVGFnLnZhbHVlc1tqal0udmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnVmFsdWUuZGF0YS5pZCA9IGN1cnJDdXN0b21UYWcudmFsdWVzW2pqXS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5zdG9yZS5hZGQoY3VyckN1c3RvbVRhZ1ZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdldChtYXNzQ2xvbmVJdGVtSWQpKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgKHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgJiZcbiAgICAgICAgICAgICAgIXRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5tYXJrZXRpbmdQcm9ncmFtSWQgJiZcbiAgICAgICAgICAgICAgY3VyckV4cE5vZGUgJiZcbiAgICAgICAgICAgICAgY3VyckV4cE5vZGUuaXNFeHBhbmRhYmxlKCkpIHx8XG4gICAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBQcm9ncmFtJyB8fFxuICAgICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nIHx8XG4gICAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBFdmVudCcgfHxcbiAgICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnRW1haWwgQmF0Y2ggUHJvZ3JhbScgfHxcbiAgICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnSW4tQXBwIFByb2dyYW0nXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAoZm9yY2VSZWxvYWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5nZXQobWFzc0Nsb25lSXRlbUlkKS5kZXN0cm95KClcbiAgICAgICAgICAgICAgdGhpcy5hZGRJdGVtKG1hc3NDbG9uZUl0ZW0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLmdldChtYXNzQ2xvbmVJdGVtSWQpLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5nZXQobWFzc0Nsb25lSXRlbUlkKS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAodGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJyAmJlxuICAgICAgICAgICAgIXRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5tYXJrZXRpbmdQcm9ncmFtSWQgJiZcbiAgICAgICAgICAgIGN1cnJFeHBOb2RlICYmXG4gICAgICAgICAgICBjdXJyRXhwTm9kZS5pc0V4cGFuZGFibGUoKSkgfHxcbiAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBQcm9ncmFtJyB8fFxuICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJyB8fFxuICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEV2ZW50JyB8fFxuICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnRW1haWwgQmF0Y2ggUHJvZ3JhbScgfHxcbiAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ0luLUFwcCBQcm9ncmFtJ1xuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLmFkZEl0ZW0obWFzc0Nsb25lSXRlbSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dC5tZW51Lk1lbnUucHJvdG90eXBlLnNob3dBdCcpKSB7XG4gICAgICBjb25zb2xlLmxvZygnPiBFeGVjdXRpbmc6IEFwcGx5aW5nIE1hc3MgQ2xvbmUgTWVudSBJdGVtJylcbiAgICAgIGlmICghb3JpZ01lbnVTaG93QXRGdW5jKSB7XG4gICAgICAgIG9yaWdNZW51U2hvd0F0RnVuYyA9IEV4dC5tZW51Lk1lbnUucHJvdG90eXBlLnNob3dBdFxuICAgICAgfVxuXG4gICAgICBFeHQubWVudS5NZW51LnByb3RvdHlwZS5zaG93QXQgPSBmdW5jdGlvbiAoeHksIHBhcmVudE1lbnUpIHtcbiAgICAgICAgbWFzc0Nsb25lLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgLy9UT0RPIGNoYW5nZXMgaGVyZSBIdW50ZXJcbiAgICAgICAgb3JpZ01lbnVTaG93QXRGdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJz4gU2tpcHBpbmc6IEFwcGx5aW5nIE1hc3MgQ2xvbmUgTWVudSBJdGVtJylcbiAgICB9XG4gIH0sXG5cbiAgLypcbiAgKiAgVGhpcyBmdW5jdGlvbiBhZGRzIGEgcmlnaHQtY2xpY2sgbWVudSBpdGVtIHRoYXQgcGVyZm9ybXMgYSBtYXNzIGNsb25lIG9mIGFsbFxuICAqICBQcm9ncmFtcyBmcm9tIHRoZSBzZWxlY3RlZCByb290IGZvbGRlciB0aGF0IGhhdmUgYSBmb2xkZXIgZGVwdGggbGV2ZWwgMSBvciBsZXNzOlxuICAqICAgIENsb25lcyB0aGUgZm9sZGVyIHN0cnVjdHVyZVxuICAqICAgIENsb25lcyBhbGwgUHJvZ3JhbXNcbiAgKiAgICBTZXRzIFBlcmlvZCBDb3N0cyBmb3IgdGhlIG5leHQgMjQgbW9udGhzIHVzaW5nIHRoZSBzb3VyY2UgUHJvZ3JhbSdzIGZpcnN0IENvc3RcbiAgKiAgICBTZXRzIHRoZSBWZXJ0aWNhbCBUYWcgdXNpbmcgdGhlIG5hbWUgb2YgdGhlIGRlc3RpbmF0aW9uIGZvbGRlclxuICAqICAgIENsb25lcyB0aGUgU3RyZWFtIENhZGVuY2VzIHVzaW5nIHRoZSBzb3VyY2UgTnVydHVyZSBQcm9ncmFtXG4gICogICAgQ2xvbmVzIHRoZSBhY3RpdmF0aW9uIHN0YXRlIG9mIHRyaWdnZXIgU21hcnQgQ2FtcGFpZ25zXG4gICogICAgQ2xvbmVzIHRoZSByZWN1cnJpbmcgc2NoZWR1bGUgb2YgYmF0Y2ggU21hcnQgQ2FtcGFpZ25zXG4gICogICAgU2V0cyB0aGUgYXNzZXQgZmlsdGVyIGZvciBjbG9uZWQgcmVwb3J0cyB0byB0aGUgZGVzdGluYXRpb24gZm9sZGVyXG4gICovXG4gIGNsb25lRm9sZGVyOiBmdW5jdGlvbiAob3JpZ0ZvbGRlck5hbWUsIGNsb25lVG9TdWZmaXgsIGNsb25lVG9Gb2xkZXJJZCkge1xuICAgIGxldCBuZXdGb2xkZXJOYW1lLCByZXN1bHRcblxuICAgIGlmIChvcmlnRm9sZGVyTmFtZS5zZWFyY2goL1xcKFteKV0qXFwpJC8pICE9IC0xKSB7XG4gICAgICBuZXdGb2xkZXJOYW1lID0gb3JpZ0ZvbGRlck5hbWUucmVwbGFjZSgvXFwoW14pXSpcXCkkLywgJygnICsgY2xvbmVUb1N1ZmZpeCArICcpJylcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3Rm9sZGVyTmFtZSA9IG9yaWdGb2xkZXJOYW1lLnRleHQgKyAnICgnICsgY2xvbmVUb1N1ZmZpeCArICcpJ1xuICAgIH1cblxuICAgIHJlc3VsdCA9IExJQi53ZWJSZXF1ZXN0KFxuICAgICAgJy9leHBsb3Jlci9jcmVhdGVQcm9ncmFtRm9sZGVyJyxcbiAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICcmdGV4dD0nICtcbiAgICAgIG5ld0ZvbGRlck5hbWUgK1xuICAgICAgJyZwYXJlbnRJZD0nICtcbiAgICAgIGNsb25lVG9Gb2xkZXJJZCArXG4gICAgICAnJnRlbXBOb2RlSWQ9ZXh0LScgK1xuICAgICAgY2xvbmVUb0ZvbGRlcklkICtcbiAgICAgICcmeHNyZklkPScgK1xuICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAnUE9TVCcsXG4gICAgICBmYWxzZSxcbiAgICAgICcnLFxuICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UpXG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHJlc3BvbnNlICYmXG4gICAgICAgICAgcmVzcG9uc2UuSlNPTlJlc3VsdHMgJiZcbiAgICAgICAgICByZXNwb25zZS5KU09OUmVzdWx0cy5hcHB2YXJzICYmXG4gICAgICAgICAgcmVzcG9uc2UuSlNPTlJlc3VsdHMuYXBwdmFycy5jcmVhdGVQcm9ncmFtRm9sZGVyUmVzdWx0ID09ICdzdWNjZXNzJ1xuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcblxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICBjbG9uZU51cnR1cmVDYWRlbmNlOiBmdW5jdGlvbiAob3JpZ1Byb2dyYW1Db21wSWQsIG5ld1Byb2dyYW1Db21wSWQpIHtcbiAgICBsZXQgZ2V0TnVydHVyZUNhZGVuY2UsIGdldE9yaWdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlLCBnZXROZXdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlXG5cbiAgICBnZXROdXJ0dXJlQ2FkZW5jZSA9IGZ1bmN0aW9uIChwcm9ncmFtQ29tcElkKSB7XG4gICAgICBsZXQgcHJvZ3JhbUZpbHRlciA9IGVuY29kZVVSSUNvbXBvbmVudCgnW3tcInByb3BlcnR5XCI6XCJpZFwiLFwidmFsdWVcIjonICsgcHJvZ3JhbUNvbXBJZCArICd9XScpLFxuICAgICAgICBmaWVsZHMgPSBlbmNvZGVVUklDb21wb25lbnQoJ1tcIit0cmFja3NcIl0nKSxcbiAgICAgICAgcmVzdWx0XG5cbiAgICAgIHJlc3VsdCA9IExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAnL2RhdGEvbnVydHVyZS9yZXRyaWV2ZScsXG4gICAgICAgICdmaWx0ZXI9JyArIHByb2dyYW1GaWx0ZXIgKyAnJmZpZWxkcz0nICsgZmllbGRzICsgJyZ4c3JmSWQ9JyArIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAnUE9TVCcsXG4gICAgICAgIGZhbHNlLFxuICAgICAgICAnJyxcbiAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuXG4gICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIClcblxuICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH1cblxuICAgIGdldE9yaWdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlID0gZ2V0TnVydHVyZUNhZGVuY2Uob3JpZ1Byb2dyYW1Db21wSWQpXG4gICAgZ2V0TmV3TnVydHVyZUNhZGVuY2VSZXNwb25zZSA9IGdldE51cnR1cmVDYWRlbmNlKG5ld1Byb2dyYW1Db21wSWQpXG5cbiAgICBpZiAoXG4gICAgICBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZSAmJlxuICAgICAgZ2V0TmV3TnVydHVyZUNhZGVuY2VSZXNwb25zZSAmJlxuICAgICAgZ2V0T3JpZ051cnR1cmVDYWRlbmNlUmVzcG9uc2UuZGF0YVswXS50cmFja3MubGVuZ3RoID09IGdldE5ld051cnR1cmVDYWRlbmNlUmVzcG9uc2UuZGF0YVswXS50cmFja3MubGVuZ3RoXG4gICAgKSB7XG4gICAgICBsZXQgY3Vyck9yaWdTdHJlYW0sXG4gICAgICAgIGN1cnJOZXdTdHJlYW0sXG4gICAgICAgIHN0cmVhbUNhZGVuY2VzID0gJ1snXG5cbiAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZS5kYXRhWzBdLnRyYWNrcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgY3Vyck9yaWdTdHJlYW0gPSBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZS5kYXRhWzBdLnRyYWNrc1tpaV1cbiAgICAgICAgY3Vyck5ld1N0cmVhbSA9IGdldE5ld051cnR1cmVDYWRlbmNlUmVzcG9uc2UuZGF0YVswXS50cmFja3NbaWldXG5cbiAgICAgICAgaWYgKGlpICE9IDApIHtcbiAgICAgICAgICBzdHJlYW1DYWRlbmNlcyArPSAnLCdcbiAgICAgICAgfVxuICAgICAgICBzdHJlYW1DYWRlbmNlcyArPVxuICAgICAgICAgICd7XCJpZFwiOicgK1xuICAgICAgICAgIGN1cnJOZXdTdHJlYW0uaWQgK1xuICAgICAgICAgICcsXCJyZWN1cnJlbmNlVHlwZVwiOlwiJyArXG4gICAgICAgICAgY3Vyck9yaWdTdHJlYW0ucmVjdXJyZW5jZVR5cGUgK1xuICAgICAgICAgICdcIixcImV2ZXJ5TlVuaXRcIjonICtcbiAgICAgICAgICBjdXJyT3JpZ1N0cmVhbS5ldmVyeU5Vbml0ICtcbiAgICAgICAgICAnLFwid2Vla01hc2tcIjpcIicgK1xuICAgICAgICAgIGN1cnJPcmlnU3RyZWFtLndlZWtNYXNrICtcbiAgICAgICAgICAnXCIsXCJzdGFydERhdGVcIjpcIicgK1xuICAgICAgICAgIGN1cnJPcmlnU3RyZWFtLnN0YXJ0RGF0ZSArXG4gICAgICAgICAgJ1wifSdcbiAgICAgIH1cbiAgICAgIHN0cmVhbUNhZGVuY2VzICs9ICddJ1xuICAgICAgc3RyZWFtQ2FkZW5jZXMgPSBzdHJlYW1DYWRlbmNlcy5yZXBsYWNlKC9cIm51bGxcIi9nLCAnbnVsbCcpXG5cbiAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAnL2RhdGEvbnVydHVyZVRyYWNrL3VwZGF0ZScsXG4gICAgICAgICdkYXRhPScgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyZWFtQ2FkZW5jZXMpICsgJyZ4c3JmSWQ9JyArIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAnUE9TVCcsXG4gICAgICAgIGZhbHNlLFxuICAgICAgICAnJyxcbiAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIH1cbiAgICAgIClcbiAgICB9XG4gIH0sXG5cbiAgY2xvbmVQZXJpb2RDb3N0OiBmdW5jdGlvbiAob3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEsIG5ld1Byb2dyYW1Db21wSWQsIG51bU9mTW9udGhzLCBvZmZzZXQsIGluaGVyaXQpIHtcbiAgICBsZXQgY3VyclllYXIgPSBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCksXG4gICAgICBjdXJyTW9udGggPSBuZXcgRGF0ZSgpLmdldE1vbnRoKCkgKyAxLFxuICAgICAgc2V0UGVyaW9kQ29zdFxuXG4gICAgc2V0UGVyaW9kQ29zdCA9IGZ1bmN0aW9uIChuZXdQcm9ncmFtQ29tcElkLCBjb3N0RGF0ZSwgY29zdEFtb3VudCkge1xuICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICcvbWFya2V0aW5nRXZlbnQvc2V0Q29zdFN1Ym1pdCcsXG4gICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICcmY29tcElkPScgK1xuICAgICAgICBuZXdQcm9ncmFtQ29tcElkICtcbiAgICAgICAgJyZjb3N0SWQ9JyArXG4gICAgICAgICcmdHlwZT1wZXJpb2QnICtcbiAgICAgICAgJyZzdGFydERhdGU9JyArXG4gICAgICAgIGNvc3REYXRlICtcbiAgICAgICAgJyZhbW91bnQ9JyArXG4gICAgICAgIGNvc3RBbW91bnQudG9TdHJpbmcoKSArXG4gICAgICAgICcmZGVzY3JpcHRpb249JyArXG4gICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgJ1BPU1QnLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJycsXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICB9XG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKGluaGVyaXQgJiYgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEpIHtcbiAgICAgIGxldCBjdXJyUGVyaW9kQ29zdFxuXG4gICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIGN1cnJQZXJpb2RDb3N0ID0gb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGFbaWldXG5cbiAgICAgICAgaWYgKGN1cnJQZXJpb2RDb3N0Lml0ZW1UeXBlID09ICdwZXJpb2QnICYmIGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLmFtb3VudCAmJiBjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5zdGFydERhdGUpIHtcbiAgICAgICAgICB2YXIgY3VyckNvc3RNb250aCA9IGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLnN0YXJ0RGF0ZS5yZXBsYWNlKC9eWzAtOV1bMC05XVswLTldWzAtOV0tLywgJycpLFxuICAgICAgICAgICAgY3VyckNvc3RBbW91bnQgPSBjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5hbW91bnQsXG4gICAgICAgICAgICBjdXJyQ29zdFllYXIsXG4gICAgICAgICAgICBjdXJyQ29zdERhdGVcblxuICAgICAgICAgIGlmIChjdXJyWWVhciA+IHBhcnNlSW50KGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLnN0YXJ0RGF0ZS5tYXRjaCgvXlswLTldWzAtOV1bMC05XVswLTldLykpKSB7XG4gICAgICAgICAgICBjdXJyQ29zdFllYXIgPSBjdXJyWWVhciArIChjdXJyWWVhciAtIHBhcnNlSW50KGN1cnJQZXJpb2RDb3N0LnN1bW1hcnlEYXRhLnN0YXJ0RGF0ZS5tYXRjaCgvXlswLTldWzAtOV1bMC05XVswLTldLykpKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyQ29zdFllYXIgPSBwYXJzZUludChjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5zdGFydERhdGUubWF0Y2goL15bMC05XVswLTldWzAtOV1bMC05XS8pKVxuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJyQ29zdERhdGUgPSBjdXJyQ29zdFllYXIudG9TdHJpbmcoKSArICctJyArIGN1cnJDb3N0TW9udGgudG9TdHJpbmcoKVxuICAgICAgICAgIHNldFBlcmlvZENvc3QobmV3UHJvZ3JhbUNvbXBJZCwgY3VyckNvc3REYXRlLCBjdXJyQ29zdEFtb3VudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YSAmJlxuICAgICAgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGFbMF0gJiZcbiAgICAgIG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhWzBdLnN1bW1hcnlEYXRhICYmXG4gICAgICBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YVswXS5zdW1tYXJ5RGF0YS5hbW91bnRcbiAgICApIHtcbiAgICAgIGlmICghbnVtT2ZNb250aHMpIHtcbiAgICAgICAgbnVtT2ZNb250aHMgPSAyNFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbnVtT2ZNb250aHM7IGlpKyspIHtcbiAgICAgICAgdmFyIGN1cnJDb3N0RGF0ZSwgY3VyckNvc3RBbW91bnRcblxuICAgICAgICBpZiAoY3Vyck1vbnRoID4gMTIpIHtcbiAgICAgICAgICBjdXJyTW9udGggPSAxXG4gICAgICAgICAgY3VyclllYXIrK1xuICAgICAgICB9XG4gICAgICAgIGN1cnJDb3N0RGF0ZSA9IGN1cnJZZWFyLnRvU3RyaW5nKCkgKyAnLScgKyBjdXJyTW9udGgudG9TdHJpbmcoKVxuICAgICAgICBjdXJyTW9udGgrK1xuICAgICAgICBjdXJyQ29zdEFtb3VudCA9IHBhcnNlSW50KG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhWzBdLnN1bW1hcnlEYXRhLmFtb3VudClcblxuICAgICAgICBpZiAob2Zmc2V0KSB7XG4gICAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPD0gMC41KSB7XG4gICAgICAgICAgICBjdXJyQ29zdEFtb3VudCArPSBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIG9mZnNldClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VyckNvc3RBbW91bnQgLT0gTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiBvZmZzZXQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2V0UGVyaW9kQ29zdChuZXdQcm9ncmFtQ29tcElkLCBjdXJyQ29zdERhdGUsIGN1cnJDb3N0QW1vdW50KVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBjbG9uZVByb2dyYW06IGZ1bmN0aW9uIChjbG9uZVRvU3VmZml4LCBjbG9uZVRvRm9sZGVySWQsIG9yaWdQcm9ncmFtVHJlZU5vZGUpIHtcbiAgICBsZXQgbmV3UHJvZ3JhbU5hbWUsIG5ld1Byb2dyYW1UeXBlLCByZXN1bHRcblxuICAgIGlmIChvcmlnUHJvZ3JhbVRyZWVOb2RlLnRleHQuc2VhcmNoKC9cXChbXildKlxcKSQvKSAhPSAtMSkge1xuICAgICAgbmV3UHJvZ3JhbU5hbWUgPSBvcmlnUHJvZ3JhbVRyZWVOb2RlLnRleHQucmVwbGFjZSgvXFwoW14pXSpcXCkkLywgJygnICsgY2xvbmVUb1N1ZmZpeCArICcpJylcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3UHJvZ3JhbU5hbWUgPSBvcmlnUHJvZ3JhbVRyZWVOb2RlLnRleHQgKyAnICgnICsgY2xvbmVUb1N1ZmZpeCArICcpJ1xuICAgIH1cblxuICAgIHN3aXRjaCAob3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wVHlwZSkge1xuICAgICAgY2FzZSAnTWFya2V0aW5nIFByb2dyYW0nOlxuICAgICAgICBuZXdQcm9ncmFtVHlwZSA9ICdwcm9ncmFtJ1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnTnVydHVyZSBQcm9ncmFtJzpcbiAgICAgICAgbmV3UHJvZ3JhbVR5cGUgPSAnbnVydHVyZSdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ01hcmtldGluZyBFdmVudCc6XG4gICAgICAgIG5ld1Byb2dyYW1UeXBlID0gJ2V2ZW50J1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnRW1haWwgQmF0Y2ggUHJvZ3JhbSc6XG4gICAgICAgIG5ld1Byb2dyYW1UeXBlID0gJ2VtYWlsQmF0Y2hQcm9ncmFtJ1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnSW4tQXBwIFByb2dyYW0nOlxuICAgICAgICBuZXdQcm9ncmFtVHlwZSA9ICdpbkFwcFByb2dyYW0nXG4gICAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgaWYgKG5ld1Byb2dyYW1UeXBlKSB7XG4gICAgICByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgJy9tYXJrZXRpbmdFdmVudC9jcmVhdGVNYXJrZXRpbmdQcm9ncmFtU3VibWl0JyxcbiAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgJyZuYW1lPScgK1xuICAgICAgICBuZXdQcm9ncmFtTmFtZSArXG4gICAgICAgICcmZGVzY3JpcHRpb249JyArXG4gICAgICAgICcmcGFyZW50Rm9sZGVySWQ9JyArXG4gICAgICAgIGNsb25lVG9Gb2xkZXJJZCArXG4gICAgICAgICcmY2xvbmVGcm9tSWQ9JyArXG4gICAgICAgIG9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkICtcbiAgICAgICAgJyZ0eXBlPScgK1xuICAgICAgICBuZXdQcm9ncmFtVHlwZSArXG4gICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgJ1BPU1QnLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJycsXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcbiAgICAgICAgICAvL3Jlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZS5tYXRjaCgve1xcXCJKU09OUmVzdWx0c1xcXCI6Lip9LylbMF0pO1xuXG4gICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLkpTT05SZXN1bHRzICYmIHJlc3BvbnNlLkpTT05SZXN1bHRzLmFwcHZhcnMgJiYgcmVzcG9uc2UuSlNPTlJlc3VsdHMuYXBwdmFycy5yZXN1bHQgPT0gJ1N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApXG5cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9LFxuXG4gIGNsb25lU21hcnRDYW1wYWlnblN0YXRlOiBmdW5jdGlvbiAob3JpZ1Byb2dyYW1Db21wSWQsIG5ld1Byb2dyYW1Db21wSWQsIGZvcmNlQWN0aXZhdGUpIHtcbiAgICBsZXQgZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlXG5cbiAgICBnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1Bc3NldERldGFpbHMob3JpZ1Byb2dyYW1Db21wSWQpXG4gICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1Bc3NldERldGFpbHMobmV3UHJvZ3JhbUNvbXBJZClcblxuICAgIGlmIChnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlICYmIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSkge1xuICAgICAgbGV0IHNldFNtYXJ0Q2FtcGFpZ25TdGF0ZVxuXG4gICAgICBzZXRTbWFydENhbXBhaWduU3RhdGUgPSBmdW5jdGlvbiAoZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlKSB7XG4gICAgICAgIGxldCBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLCBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24sIGdldFNjaGVkdWxlUmVzcG9uc2VcblxuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5zbWFydENhbXBhaWducy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduID0gZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5zbWFydENhbXBhaWduc1tpaV1cbiAgICAgICAgICBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24gPSBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2Uuc21hcnRDYW1wYWlnbnNbaWldXG5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLmNvbXBUeXBlID09IGN1cnJOZXdQcm9ncmFtU21hcnRDYW1wYWlnbi5jb21wVHlwZSAmJlxuICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5jb21wVHlwZSA9PSAnU21hcnQgQ2FtcGFpZ24nICYmXG4gICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLm5hbWUgPT0gY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduLm5hbWVcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLnN0YXR1cyA9PSA3IHx8IChjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLnN0YXR1cyA9PSA2ICYmIGZvcmNlQWN0aXZhdGUpKSB7XG4gICAgICAgICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICAgICAgICcvc21hcnRjYW1wYWlnbnMvdG9nZ2xlQWN0aXZlU3RhdHVzJyxcbiAgICAgICAgICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgICAgICAgICAnJnNtYXJ0Q2FtcGFpZ25JZD0nICtcbiAgICAgICAgICAgICAgICBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcElkICtcbiAgICAgICAgICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgICAgICAgICAnUE9TVCcsXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgJycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uc3RhdHVzID09IDMgfHwgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5zdGF0dXMgPT0gNSkge1xuICAgICAgICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAgICAgICAnL3NtYXJ0Y2FtcGFpZ25zL2VkaXRTY2hlZHVsZVJTJyxcbiAgICAgICAgICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgICAgICAgICAnJmlzUmVxdWVzdD0xJyArXG4gICAgICAgICAgICAgICAgJyZzbWFydENhbXBhaWduSWQ9JyArXG4gICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5jb21wSWQgK1xuICAgICAgICAgICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm1hdGNoKC9Na3RQYWdlXFwuYXBwVmFyc1xcLnNjaGVkdWxlRGF0YSA9IHsoW149XXxcXG58XFxcXG4pKn0vKVswXSkge1xuICAgICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlID0gSlNPTi5wYXJzZShcbiAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hdGNoKC9Na3RQYWdlXFwuYXBwVmFyc1xcLnNjaGVkdWxlRGF0YSA9IHsoW149XXxcXG58XFxcXG4pKn0vKVswXVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL01rdFBhZ2VcXC5hcHBWYXJzXFwuc2NoZWR1bGVEYXRhID0gey8sICd7JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csICdcIicpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXG4gKi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLzogKy9nLCAnXCI6ICcpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCJcXC9cXC9bXlwiXStcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wifSQvLCAnfScpXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICBpZiAoZ2V0U2NoZWR1bGVSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGxldCBzdGFydEF0RGF0ZSA9IG5ldyBEYXRlKERhdGUucGFyc2UoZ2V0U2NoZWR1bGVSZXNwb25zZS5zdGFydF9hdCkpLFxuICAgICAgICAgICAgICAgICAgc3RhcnRBdCA9XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0QXREYXRlLmdldEZ1bGxZZWFyKCkgK1xuICAgICAgICAgICAgICAgICAgICAnLScgK1xuICAgICAgICAgICAgICAgICAgICBwYXJzZUludChzdGFydEF0RGF0ZS5nZXRNb250aCgpICsgMSkgK1xuICAgICAgICAgICAgICAgICAgICAnLScgK1xuICAgICAgICAgICAgICAgICAgICBzdGFydEF0RGF0ZS5nZXREYXRlKCkgK1xuICAgICAgICAgICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgICAgICAgICBzdGFydEF0RGF0ZS5nZXRIb3VycygpICtcbiAgICAgICAgICAgICAgICAgICAgJzonICtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRBdERhdGUuZ2V0TWludXRlcygpICtcbiAgICAgICAgICAgICAgICAgICAgJzonICtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRBdERhdGUuZ2V0U2Vjb25kcygpXG5cbiAgICAgICAgICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAgICAgICAgICcvc21hcnRjYW1wYWlnbnMvcmVjdXJDYW1wU2NoZWR1bGUnLFxuICAgICAgICAgICAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICAgICAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAgICAgICAgICAgJyZzbWFydENhbXBhaWduSWQ9JyArXG4gICAgICAgICAgICAgICAgICBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcElkICtcbiAgICAgICAgICAgICAgICAgICcmcmVjdXJyZW5jZV90eXBlPScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS5yZWN1cnJlbmNlX3R5cGUgK1xuICAgICAgICAgICAgICAgICAgJyZldmVyeV9uX3VuaXQ9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLmV2ZXJ5X25fdW5pdCArXG4gICAgICAgICAgICAgICAgICAnJnN0YXJ0X2F0PScgK1xuICAgICAgICAgICAgICAgICAgc3RhcnRBdCArXG4gICAgICAgICAgICAgICAgICAnJmVuZF9hdD0nICtcbiAgICAgICAgICAgICAgICAgICcmZXZlcnlfd2Vla2RheT0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UuZXZlcnlfd2Vla2RheSArXG4gICAgICAgICAgICAgICAgICAnJndlZWtfbWFzaz0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2Uud2Vla19tYXNrICtcbiAgICAgICAgICAgICAgICAgICcmcmVjdXJEYXlfb2ZfbW9udGg9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLnJlY3VyRGF5X29mX21vbnRoICtcbiAgICAgICAgICAgICAgICAgICcmcmVjdXJNb250aF9kYXlfdHlwZT0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UucmVjdXJNb250aF9kYXlfdHlwZSArXG4gICAgICAgICAgICAgICAgICAnJnJlY3VyTW9udGhfd2Vla190eXBlPScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS5yZWN1ck1vbnRoX3dlZWtfdHlwZSArXG4gICAgICAgICAgICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAgICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5zbWFydENhbXBhaWducy5sZW5ndGggPT0gZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLnNtYXJ0Q2FtcGFpZ25zLmxlbmd0aCkge1xuICAgICAgICBzZXRTbWFydENhbXBhaWduU3RhdGUoZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlKVxuICAgICAgfVxuXG4gICAgICBpZiAoZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZS5sZW5ndGggPT0gZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlLmxlbmd0aCkge1xuICAgICAgICBsZXQgY3Vyck9yaWdQcm9ncmFtQXNzZXQsIGN1cnJOZXdQcm9ncmFtQXNzZXRcblxuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZS5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1Bc3NldCA9IGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWVbaWldXG4gICAgICAgICAgY3Vyck5ld1Byb2dyYW1Bc3NldCA9IGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZVtpaV1cblxuICAgICAgICAgIGlmIChjdXJyT3JpZ1Byb2dyYW1Bc3NldC5uYXZUeXBlID09ICdNQScgJiYgY3Vyck5ld1Byb2dyYW1Bc3NldC5uYXZUeXBlID09ICdNQScpIHtcbiAgICAgICAgICAgIHNldFNtYXJ0Q2FtcGFpZ25TdGF0ZShcbiAgICAgICAgICAgICAgTElCLmdldFByb2dyYW1Bc3NldERldGFpbHMoY3Vyck9yaWdQcm9ncmFtQXNzZXQuY29tcElkKSxcbiAgICAgICAgICAgICAgTElCLmdldFByb2dyYW1Bc3NldERldGFpbHMoY3Vyck5ld1Byb2dyYW1Bc3NldC5jb21wSWQpXG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZVxuICB9LFxuXG4gIGdldEh1bWFuRGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIERlbW8gQXBwID4gR2V0dGluZzogRGF0ZSA0IFdlZWtzIEZyb20gTm93JylcbiAgICBsZXQgZGF5TmFtZXMgPSBbJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCddLFxuICAgICAgbW9udGhOYW1lcyA9IFsnSkFOJywgJ0ZFQicsICdNQVInLCAnQVBSJywgJ01BWScsICdKVU5FJywgJ0pVTFknLCAnQVVHJywgJ1NFUFQnLCAnT0NUJywgJ05PVicsICdERUMnXSxcbiAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpLFxuICAgICAgZGF5T2ZXZWVrLFxuICAgICAgbW9udGgsXG4gICAgICBkYXlPZk1vbnRoLFxuICAgICAgeWVhclxuXG4gICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgMjgpXG4gICAgZGF5T2ZXZWVrID0gZGF5TmFtZXNbZGF0ZS5nZXREYXkoKV1cbiAgICBtb250aCA9IG1vbnRoTmFtZXNbZGF0ZS5nZXRNb250aCgpXVxuICAgIHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKClcblxuICAgIHN3aXRjaCAoZGF0ZS5nZXREYXRlKCkpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgZGF5T2ZNb250aCA9ICcxc3QnXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIDI6XG4gICAgICAgIGRheU9mTW9udGggPSAnMm5kJ1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAzOlxuICAgICAgICBkYXlPZk1vbnRoID0gJzNyZCdcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGRheU9mTW9udGggPSBkYXRlLmdldERhdGUoKSArICd0aCdcbiAgICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF5T2ZXZWVrICsgJywgJyArIG1vbnRoICsgJyB0aGUgJyArIGRheU9mTW9udGggKyAnICcgKyB5ZWFyXG4gIH0sXG5cbiAgLy8gcmVsb2FkcyB0aGUgTWFya2V0aW5nIEFjdGl2aXRlcyBUcmVlXG4gIHJlbG9hZE1hcmtldGluZ0FjdGl2aXRlczogZnVuY3Rpb24gKCkge1xuICAgIGxldCBjb250ZXh0ID0ge1xuICAgICAgY29tcFN1YnR5cGU6IG51bGwsXG4gICAgICBjdXN0b21Ub2tlbjogJycsXG4gICAgICBkbENvbXBDb2RlOiAnTUEnLFxuICAgICAgdHlwZTogJ01BJ1xuICAgIH1cbiAgICAgIDsgKGN1c3RvbVRva2VuID0gTWt0My5EbE1hbmFnZXIuZ2V0Q3VzdG9tVG9rZW4oKSksIChwYXJhbXMgPSBFeHQudXJsRGVjb2RlKGN1c3RvbVRva2VuKSlcblxuICAgIGlmIChcbiAgICAgIGNvbnRleHQgJiZcbiAgICAgIChjb250ZXh0LmNvbXBUeXBlID09PSAnTWFya2V0aW5nIEV2ZW50JyB8fFxuICAgICAgICBjb250ZXh0LmNvbXBUeXBlID09PSAnTWFya2V0aW5nIFByb2dyYW0nIHx8XG4gICAgICAgIGNvbnRleHQuY29tcFN1YnR5cGUgPT09ICdtYXJrZXRpbmdwcm9ncmFtJyB8fFxuICAgICAgICBjb250ZXh0LmNvbXBTdWJ0eXBlID09PSAnbWFya2V0aW5nZXZlbnQnKVxuICAgICkge1xuICAgICAgTWt0My5NS05vZGVDb250ZXh0LnRpbWluZ1JlcG9ydCA9IHtcbiAgICAgICAgbmF2TG9hZENhbDogRXh0NC5EYXRlLm5vdygpLFxuICAgICAgICBjYWxlbmRhck1vZGU6ICdQcm9ncmFtJ1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBhbHJlYWR5SW5NQSA9IE1rdE1haW5OYXYuYWN0aXZlTmF2ID09ICd0bk1BJyxcbiAgICAgIGFqb3B0cyA9IE1rdE1haW5OYXYuY29tbW9uUHJlTG9hZCgndG5NQScsIGNvbnRleHQpXG4gICAgaWYgKE1rdFBhZ2UuaW5pdE5hdiA9PSAneWVzJykge1xuICAgICAgTWt0RXhwbG9yZXIuY2xlYXIoKVxuICAgICAgTWt0RXhwbG9yZXIubWFzaygpXG4gICAgICBsZXQgcGFybXMgPSBjb250ZXh0XG4gICAgICBpZiAoIU1rdFBhZ2Uuc2F0ZWxsaXRlKSB7XG4gICAgICAgIE1rdFZpZXdwb3J0LnNldEV4cGxvcmVyVmlzaWJsZSh0cnVlKVxuXG4gICAgICAgIE1rdEV4cGxvcmVyLmxvYWRUcmVlKCdleHBsb3Jlci9nZW5lcmF0ZUZ1bGxNYUV4cGxvcmVyJywge1xuICAgICAgICAgIHNlcmlhbGl6ZVBhcm1zOiBwYXJtcyxcbiAgICAgICAgICBvbk15RmFpbHVyZTogTWt0TWFpbk5hdi5leHBGYWlsdXJlUmVzcG9uc2UuY3JlYXRlRGVsZWdhdGUodGhpcylcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgcGFybXMgPSB7fVxuICAgICAgYWpvcHRzLnNlcmlhbGl6ZVBhcm1zID0gcGFybXNcbiAgICAgIGlmIChpc0RlZmluZWQoY29udGV4dC5wYW5lbEluZGV4KSkge1xuICAgICAgICBwYXJtcy5wYW5lbEluZGV4ID0gY29udGV4dC5wYW5lbEluZGV4XG4gICAgICB9XG5cbiAgICAgIGlmIChjb250ZXh0LmlzUHJvZ3JhbUltcG9ydCkge1xuICAgICAgICBwYXJhbXMuaWQgPSBjb250ZXh0LmNvbXBJZFxuXG4gICAgICAgIGlmIChNa3RQYWdlLmhhc1dvcmtzcGFjZXMoKSkge1xuICAgICAgICAgIC8vIHdlIGFyZSBmb3JjZWQgdG8gbG9hZCBkZWZhdWx0IE1BLCBvdGhlcndpc2UgdGhlIG1vZGFsIGZvcm0gaXMgbm90IGFsaWduZWQgcHJvcGVybHlcbiAgICAgICAgICBNa3RDYW52YXMuY2FudmFzQWpheFJlcXVlc3QoJ2V4cGxvcmVyL3Byb2dyYW1DYW52YXMnLCB7XG4gICAgICAgICAgICBvbk15U3VjY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBFeHQ0LndpZGdldCgncHJvZ3JhbU9uZUNsaWNrSW1wb3J0Rm9ybScsIHtmb3JtRGF0YTogcGFyYW1zfSlcblxuICAgICAgICAgICAgICBNa3RWaWV3cG9ydC5zZXRBcHBNYXNrKGZhbHNlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgTWt0U2Vzc2lvbi5hamF4UmVxdWVzdCgnL2ltcEV4cC9kb3dubG9hZFRlbXBsYXRlJywge1xuICAgICAgICAgIHNlcmlhbGl6ZVBhcm1zOiBwYXJhbXMsXG4gICAgICAgICAgb25NeVN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSwgcmVxdWVzdCkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLkpTT05SZXN1bHRzKSB7XG4gICAgICAgICAgICAgIGlmIChyZXNwb25zZS5KU09OUmVzdWx0cy5zaG93SW1wb3J0U3RhdHVzID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgTWt0Q2FudmFzLmNhbnZhc0FqYXhSZXF1ZXN0KCdleHBsb3Jlci9wcm9ncmFtQ2FudmFzJywge1xuICAgICAgICAgICAgICAgICAgb25NeVN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgTWt0LmFwcHMuaW1wRXhwLmltcG9ydFByb2dyYW1TdGF0dXMoKVxuICAgICAgICAgICAgICAgICAgICBNa3RWaWV3cG9ydC5zZXRBcHBNYXNrKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UuSlNPTlJlc3VsdHMuZXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgLy8ganVzdCBsb2FkIE1BXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnI01BJ1xuICAgICAgICAgICAgICAgIE1rdFBhZ2Uuc2hvd0FsZXJ0TWVzc2FnZShcbiAgICAgICAgICAgICAgICAgIE1rdExhbmcuZ2V0U3RyKCdwYWdlLkltcG9ydF9XYXJuaW5nJyksXG4gICAgICAgICAgICAgICAgICBNa3RMYW5nLmdldFN0cigncGFnZS5JbXBvcnRfRmFpbGVkJykgKyByZXNwb25zZS5KU09OUmVzdWx0cy5lcnJvck1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAnL2ltYWdlcy9pY29uczMyL2Vycm9yLnBuZydcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuY29tcFN1YnR5cGUgPT0gJ21hcmtldGluZ2ZvbGRlcicgfHwgY29udGV4dC5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgfHwgY29udGV4dC5zdWJUeXBlID09ICdtYXJrZXRpbmdmb2xkZXInKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZFBFKGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuY29tcFN1YnR5cGUgPT0gJ3NtYXJ0Y2FtcGFpZ24nIHx8IGNvbnRleHQuc3ViVHlwZSA9PSAnc21hcnRjYW1wYWlnbicgfHwgY29udGV4dC5jb21wVHlwZSA9PSAnU21hcnQgQ2FtcGFpZ24nKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZFNtYXJ0Q2FtcGFpZ24oY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5jb21wU3VidHlwZSA9PSAnbWFya2V0aW5nZXZlbnQnIHx8IGNvbnRleHQuc3ViVHlwZSA9PSAnbWFya2V0aW5nZXZlbnQnIHx8IGNvbnRleHQuY29tcFR5cGUgPT0gJ01hcmtldGluZyBFdmVudCcpIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkTWFya2V0aW5nRXZlbnQoY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGNvbnRleHQuY29tcFN1YnR5cGUgPT0gJ21hcmtldGluZ3Byb2dyYW0nIHx8XG4gICAgICAgIGNvbnRleHQuc3ViVHlwZSA9PSAnbWFya2V0aW5ncHJvZ3JhbScgfHxcbiAgICAgICAgY29udGV4dC5jb21wVHlwZSA9PSAnTWFya2V0aW5nIFByb2dyYW0nXG4gICAgICApIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkTWFya2V0aW5nUHJvZ3JhbShjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChjb250ZXh0LmNvbXBTdWJ0eXBlID09ICdudXJ0dXJlcHJvZ3JhbScgfHwgY29udGV4dC5zdWJUeXBlID09ICdudXJ0dXJlcHJvZ3JhbScgfHwgY29udGV4dC5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJykge1xuICAgICAgICBNa3RNYWluTmF2LmxvYWROdXJ0dXJlUHJvZ3JhbShjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgY29udGV4dC5jb21wU3VidHlwZSA9PT0gJ2VtYWlsYmF0Y2hwcm9ncmFtJyB8fFxuICAgICAgICBjb250ZXh0LnN1YlR5cGUgPT09ICdlbWFpbGJhdGNocHJvZ3JhbScgfHxcbiAgICAgICAgY29udGV4dC5jb21wVHlwZSA9PT0gJ0VtYWlsIEJhdGNoIFByb2dyYW0nXG4gICAgICApIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkRW1haWxCYXRjaFByb2dyYW0oY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5jb21wU3VidHlwZSA9PT0gJ2luQXBwJyB8fCBjb250ZXh0LnN1YlR5cGUgPT09ICdpbkFwcFByb2dyYW0nIHx8IGNvbnRleHQuY29tcFR5cGUgPT09ICdJbi1BcHAgUHJvZ3JhbScpIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkSW5BcHBQcm9ncmFtKGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQubm9kZVR5cGUgPT0gJ0Zsb3cnKSB7XG4gICAgICAgIC8vVGhpcyBpcyBqdXN0IHRlbXBvcmFyeSB0aWxsIENyYXNoIGdldCB0aGUgc3R1ZmYgZm9yIG15IHRyZWVcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkRmxvdygpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBham9wdHMuY2FjaGVSZXF1ZXN0ID0gdHJ1ZVxuICAgICAgICBham9wdHMub25NeVN1Y2Nlc3MgPSBNa3RNYWluTmF2LmNhbnZhc0FqYXhSZXF1ZXN0Q29tcGxldGUuY3JlYXRlRGVsZWdhdGUoTWt0TWFpbk5hdilcbiAgICAgICAgYWpvcHRzLm9uTXlGYWlsdXJlID0gTWt0TWFpbk5hdi5jYW52YXNBamF4UmVxdWVzdENvbXBsZXRlLmNyZWF0ZURlbGVnYXRlKE1rdE1haW5OYXYpXG4gICAgICAgIE1rdENhbnZhcy5jYW52YXNBamF4UmVxdWVzdCgnZXhwbG9yZXIvcHJvZ3JhbUNhbnZhcycsIGFqb3B0cylcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfSxcblxuICAvLyBlZGl0cyB0aGUgdmFyaWFibGVzIHdpdGhpbiB0aGUgRW1haWwgRWRpdG9yIGZvciBjdXN0b20gY29tcGFueVxuICBzYXZlRW1haWxFZGl0czogZnVuY3Rpb24gKG1vZGUsIGFzc2V0KSB7XG4gICAgbGV0IHNhdmVFZGl0c1RvZ2dsZSA9IExJQi5nZXRDb29raWUoJ3NhdmVFZGl0c1RvZ2dsZVN0YXRlJyksXG4gICAgICBsb2dvID0gTElCLmdldENvb2tpZSgnbG9nbycpLFxuICAgICAgaGVyb0JhY2tncm91bmQgPSBMSUIuZ2V0Q29va2llKCdoZXJvQmFja2dyb3VuZCcpLFxuICAgICAgY29sb3IgPSBMSUIuZ2V0Q29va2llKCdjb2xvcicpXG5cbiAgICBpZiAoc2F2ZUVkaXRzVG9nZ2xlID09ICd0cnVlJyAmJiAobG9nbyAhPSBudWxsIHx8IGhlcm9CYWNrZ3JvdW5kICE9IG51bGwgfHwgY29sb3IgIT0gbnVsbCkpIHtcbiAgICAgIGxldCBodHRwUmVnRXggPSBuZXcgUmVnRXhwKCdeaHR0cHxeJCcsICdpJyksXG4gICAgICAgIC8vdGV4dFJlZ2V4ID0gbmV3IFJlZ0V4cChcIl5bXiNdfF4kXCIsIFwiaVwiKSxcbiAgICAgICAgY29sb3JSZWdleCA9IG5ldyBSZWdFeHAoJ14jWzAtOWEtZl17Myw2fSR8XnJnYnxeJCcsICdpJyksXG4gICAgICAgIGxvZ29JZHMgPSBbJ2hlcm9Mb2dvJywgJ2Zvb3RlckxvZ28nLCAnaGVhZGVyTG9nbycsICdsb2dvRm9vdGVyJywgJ2xvZ28nXSxcbiAgICAgICAgaGVyb0JnUmVnZXggPSBuZXcgUmVnRXhwKCdoZXJvQmFja2dyb3VuZHxoZXJvLWJhY2tncm91bmR8aGVyb0JrZ3xoZXJvLWJrZ3xoZXJvQmd8aGVyby1iZycsICdpJyksXG4gICAgICAgIC8vdGl0bGVJZHMgPSBbXCJ0aXRsZVwiLCBcImhlcm9UaXRsZVwiLCBcIm1haW5UaXRsZVwiXSxcbiAgICAgICAgLy9zdWJ0aXRsZUlkcyA9IFtcInN1YnRpdGxlXCIsIFwiaGVyb3N1YlRpdGxlXCJdLFxuICAgICAgICBoZWFkZXJCZ0NvbG9yUmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICdeKGhlYWRlckJnQ29sb3J8aGVhZGVyLWJnLWNvbG9yfGhlYWRlckJhY2tncm91bmRDb2xvcnxoZWFkZXItYmFja2dyb3VuZC1jb2xvcnxoZWFkZXJCa2dDb2xvcnxoZWFkZXItYmtnLWNvbG9yfCkkJyxcbiAgICAgICAgICAnaSdcbiAgICAgICAgKSxcbiAgICAgICAgYnV0dG9uQmdDb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAnXihoZXJvQnV0dG9uQmdDb2xvcnxoZXJvLWJ1dHRvbi1iZy1jb2xvcnxoZXJvQnV0dG9uQmFja2dyb3VuZENvbG9yfGhlcm8tYnV0dG9uLWJhY2tncm91bmQtY29sb3J8aGVyb0JrZ0NvbG9yfGhlcm8tYmtnLWNvbG9yfCkkJyxcbiAgICAgICAgICAnaSdcbiAgICAgICAgKSxcbiAgICAgICAgYnV0dG9uQm9yZGVyQ29sb3JSZWdleCA9IG5ldyBSZWdFeHAoJ14oaGVyb0J1dHRvbkJvcmRlckNvbG9yfGhlcm8tYnV0dG9uLWJvcmRlci1jb2xvcnxoZXJvQm9yZGVyQ29sb3J8aGVyby1ib3JkZXItY29sb3J8KSQnLCAnaScpLFxuICAgICAgICBsb2dvID0gTElCLmdldENvb2tpZSgnbG9nbycpLFxuICAgICAgICBoZXJvQmFja2dyb3VuZCA9IExJQi5nZXRDb29raWUoJ2hlcm9CYWNrZ3JvdW5kJyksXG4gICAgICAgIGNvbG9yID0gTElCLmdldENvb2tpZSgnY29sb3InKSxcbiAgICAgICAgLy90aXRsZSA9IFwiWW91IFRvPGJyPlBSRU1JRVIgQlVTSU5FU1MgRVZFTlQ8YnI+T0YgVEhFIFlFQVJcIixcbiAgICAgICAgLy9zdWJ0aXRsZSA9IExJQi5nZXRIdW1hbkRhdGUoKSxcbiAgICAgICAgLy90aXRsZU1hdGNoLFxuICAgICAgICAvL2NvbXBhbnksXG4gICAgICAgIC8vY29tcGFueU5hbWUsXG4gICAgICAgIGVkaXRIdG1sLFxuICAgICAgICBlZGl0QXNzZXRWYXJzLFxuICAgICAgICB3YWl0Rm9yTG9hZE1zZyxcbiAgICAgICAgd2FpdEZvclJlbG9hZE1zZ1xuXG4gICAgICB3YWl0Rm9yTG9hZE1zZyA9IG5ldyBFeHQuV2luZG93KHtcbiAgICAgICAgY2xvc2FibGU6IHRydWUsXG4gICAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgICB3aWR0aDogNTAwLFxuICAgICAgICBoZWlnaHQ6IDI1MCxcbiAgICAgICAgY2xzOiAnbWt0TW9kYWxGb3JtJyxcbiAgICAgICAgdGl0bGU6ICdQbGVhc2UgV2FpdCBmb3IgUGFnZSB0byBMb2FkJyxcbiAgICAgICAgaHRtbDogJzx1PlNhdmluZyBFZGl0cyB0byBIZXJvIEJhY2tncm91bmQgJiBCdXR0b24gQmFja2dyb3VuZCBDb2xvcjwvdT4gPGJyPldhaXQgdW50aWwgdGhpcyBwYWdlIGNvbXBsZXRlbHkgbG9hZHMgYmVmb3JlIGNsb3NpbmcuIDxicj48YnI+PHU+VG8gRGlzYWJsZSBUaGlzIEZlYXR1cmU6PC91PiA8YnI+Q2xlYXIgdGhlIHNlbGVjdGVkIGNvbXBhbnkgdmlhIHRoZSBNYXJrZXRvTGl2ZSBleHRlbnNpb24uJ1xuICAgICAgfSlcbiAgICAgIHdhaXRGb3JSZWxvYWRNc2cgPSBuZXcgRXh0LldpbmRvdyh7XG4gICAgICAgIGNsb3NhYmxlOiB0cnVlLFxuICAgICAgICBtb2RhbDogdHJ1ZSxcbiAgICAgICAgd2lkdGg6IDUwMCxcbiAgICAgICAgaGVpZ2h0OiAyNTAsXG4gICAgICAgIGNsczogJ21rdE1vZGFsRm9ybScsXG4gICAgICAgIHRpdGxlOiAnUGxlYXNlIFdhaXQgZm9yIFBhZ2UgdG8gUmVsb2FkJyxcbiAgICAgICAgaHRtbDogJzx1PlNhdmluZyBFZGl0cyB0byBMb2dvLCBUaXRsZSwgJiBTdWJ0aXRsZTwvdT4gPGJyPldhaXQgZm9yIHRoaXMgcGFnZSB0byByZWxvYWQgYXV0b21hdGljYWxseS4gPGJyPjxicj48dT5UbyBEaXNhYmxlIFRoaXMgRmVhdHVyZTo8L3U+IDxicj5DbGVhciB0aGUgc2VsZWN0ZWQgY29tcGFueSB2aWEgdGhlIE1hcmtldG9MaXZlIGV4dGVuc2lvbi4nXG4gICAgICB9KVxuXG4gICAgICBlZGl0SHRtbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgJy9lbWFpbGVkaXRvci9kb3dubG9hZEh0bWxGaWxlMj94c3JmSWQ9JyArIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpICsgJyZlbWFpbElkPScgKyBNa3QzLkRMLmRsLmNvbXBJZCxcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgICdHRVQnLFxuICAgICAgICAgIHRydWUsXG4gICAgICAgICAgJ2RvY3VtZW50JyxcbiAgICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGxldCBpc0xvZ29SZXBsYWNlZFxuICAgICAgICAgICAgLy9pc1RpdGxlUmVwbGFjZWQsXG4gICAgICAgICAgICAvL2lzU3VidGl0bGVSZXBsYWNlZDtcblxuICAgICAgICAgICAgaWYgKGxvZ28pIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGxvZ29JZHMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJFbGVtZW50ID0gcmVzcG9uc2UuZ2V0RWxlbWVudEJ5SWQobG9nb0lkc1tpaV0pXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgY3VyckVsZW1lbnQgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJFbGVtZW50LmNsYXNzTmFtZS5zZWFyY2goJ21rdG9JbWcnKSAhPSAtMSAmJlxuICAgICAgICAgICAgICAgICAgY3VyckVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpWzBdICYmXG4gICAgICAgICAgICAgICAgICBjdXJyRWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJylbMF0uZ2V0QXR0cmlidXRlKCdzcmMnKSAhPSBsb2dvXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBSZXBsYWNpbmc6IExvZ28gPiAnICsgbG9nbylcbiAgICAgICAgICAgICAgICAgIGlzTG9nb1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgY3VyckVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpWzBdLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBpc0xvZ29SZXBsYWNlZFxuICAgICAgICAgICAgICAvL3x8IGlzVGl0bGVSZXBsYWNlZFxuICAgICAgICAgICAgICAvL3x8IGlzU3VidGl0bGVSZXBsYWNlZFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGxldCB1cGRhdGVIdG1sXG5cbiAgICAgICAgICAgICAgdXBkYXRlSHRtbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAgICAgICAgICcvZW1haWxlZGl0b3IvdXBkYXRlQ29udGVudDInLFxuICAgICAgICAgICAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICAgICAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAgICAgICAgICAgJyZlbWFpbElkPScgK1xuICAgICAgICAgICAgICAgICAgTWt0My5ETC5kbC5jb21wSWQgK1xuICAgICAgICAgICAgICAgICAgJyZjb250ZW50PScgK1xuICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcocmVzcG9uc2UpKSArXG4gICAgICAgICAgICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAgICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zdG9wKClcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHdhaXRGb3JMb2FkTXNnLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuaGlkZSgpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgd2FpdEZvclJlbG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgdXBkYXRlSHRtbCgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGVkaXRBc3NldFZhcnMgPSBmdW5jdGlvbiAoYXNzZXQpIHtcbiAgICAgICAgbGV0IGFzc2V0VmFycyA9IGFzc2V0LmdldFZhcmlhYmxlVmFsdWVzKClcblxuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgT2JqZWN0LmtleXMoYXNzZXRWYXJzKS5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBsZXQgY3VyclZhcmlhYmxlS2V5ID0gT2JqZWN0LmtleXMoYXNzZXRWYXJzKVtpaV1cbiAgICAgICAgICBjdXJyVmFyaWFibGVWYWx1ZSA9IE9iamVjdC52YWx1ZXMoYXNzZXRWYXJzKVtpaV1cblxuICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjdXJyVmFyaWFibGVWYWx1ZSA9ICcnXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goaGVyb0JnUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgIT0gaGVyb0JhY2tncm91bmQgJiYgY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGh0dHBSZWdFeCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFZhcmlhYmxlVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goaGVhZGVyQmdDb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlICE9IGNvbG9yICYmIGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChjb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0VmFyaWFibGVWYWx1ZShjdXJyVmFyaWFibGVLZXksIGNvbG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChidXR0b25CZ0NvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgIT0gY29sb3IgJiYgY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRWYXJpYWJsZVZhbHVlKGN1cnJWYXJpYWJsZUtleSwgY29sb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGJ1dHRvbkJvcmRlckNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgIT0gY29sb3IgJiYgY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRWYXJpYWJsZVZhbHVlKGN1cnJWYXJpYWJsZUtleSwgY29sb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHdhaXRGb3JMb2FkTXNnLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLnJlbG9hZEVtYWlsKClcbiAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLmhpZGUoKVxuICAgICAgICAgIH0sIDc1MDApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKCc+IEVkaXRpbmc6IEVtYWlsIFZhcmlhYmxlcycpXG4gICAgICBpZiAobW9kZSA9PSAnZWRpdCcpIHtcbiAgICAgICAgbGV0IGlzV2ViUmVxdWVzdFNlc3Npb24gPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IFdhaXRpbmc6IFdlYiBSZXF1ZXN0IFNlc3Npb24gRGF0YScpXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLkRMLmRsLmNvbXBJZCcpICYmXG4gICAgICAgICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdFNlY3VyaXR5LmdldFhzcmZJZCcpICYmXG4gICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSAmJlxuICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdFeHQuaWQnKSAmJlxuICAgICAgICAgICAgRXh0LmlkKG51bGwsICc6JylcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEVkaXRpbmc6IEVtYWlsIEhUTUwnKVxuICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNXZWJSZXF1ZXN0U2Vzc2lvbilcblxuICAgICAgICAgICAgZWRpdEh0bWwoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgMClcblxuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICBlZGl0QXNzZXRWYXJzKGFzc2V0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBpc0VtYWlsRWRpdG9yVmFyaWFibGVzID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IFdhaXRpbmc6IEVtYWlsIEVkaXRvciBWYXJpYWJsZXMnKVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAhd2FpdEZvclJlbG9hZE1zZy5pc1Zpc2libGUoKSAmJlxuICAgICAgICAgICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCcpICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKS5nZXRWYXJpYWJsZVZhbHVlcygpICYmXG4gICAgICAgICAgICAgIE9iamVjdC5rZXlzKE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5nZXRFbWFpbCgpLmdldFZhcmlhYmxlVmFsdWVzKCkpLmxlbmd0aCAhPSAwICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5nZXRFbWFpbCgpLnNldFZhcmlhYmxlVmFsdWVcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBFZGl0aW5nOiBFbWFpbCBFZGl0b3IgVmFyaWFibGVzJylcbiAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNFbWFpbEVkaXRvclZhcmlhYmxlcylcblxuICAgICAgICAgICAgICBlZGl0QXNzZXRWYXJzKE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5nZXRFbWFpbCgpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIDApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobW9kZSA9PSAncHJldmlldycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogRW1haWwgUHJldmlld2VyIFZhcmlhYmxlcycpXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIGVkaXRzIHRoZSB2YXJpYWJsZXMgd2l0aGluIHRoZSBMYW5kaW5nIFBhZ2UgRWRpdG9yIGZvciBjdXN0b20gY29tcGFueVxuICAvLyBtb2RlIHZpZXcgKGVkaXQsIHByZXZpZXcpOyBhc3NldCB0byBiZSBlZGl0ZWRcbiAgc2F2ZUxhbmRpbmdQYWdlRWRpdHM6IGZ1bmN0aW9uIChtb2RlLCBhc3NldCkge1xuICAgIGxldCBzYXZlRWRpdHNUb2dnbGUgPSBMSUIuZ2V0Q29va2llKCdzYXZlRWRpdHNUb2dnbGVTdGF0ZScpLFxuICAgICAgbG9nbyA9IExJQi5nZXRDb29raWUoJ2xvZ28nKSxcbiAgICAgIGhlcm9CYWNrZ3JvdW5kID0gTElCLmdldENvb2tpZSgnaGVyb0JhY2tncm91bmQnKSxcbiAgICAgIGNvbG9yID0gTElCLmdldENvb2tpZSgnY29sb3InKVxuXG4gICAgaWYgKHNhdmVFZGl0c1RvZ2dsZSA9PSAndHJ1ZScgJiYgKGxvZ28gIT0gbnVsbCB8fCBoZXJvQmFja2dyb3VuZCAhPSBudWxsIHx8IGNvbG9yICE9IG51bGwpKSB7XG4gICAgICBsZXQgaHR0cFJlZ0V4ID0gbmV3IFJlZ0V4cCgnXmh0dHB8XiQnLCAnaScpLFxuICAgICAgICAvL3RleHRSZWdleCA9IG5ldyBSZWdFeHAoXCJeW14jXXxeJFwiLCBcImlcIiksXG4gICAgICAgIGNvbG9yUmVnZXggPSBuZXcgUmVnRXhwKCdeI1swLTlhLWZdezMsNn0kfF5yZ2J8XiQnLCAnaScpLFxuICAgICAgICBsb2dvUmVnZXggPSBuZXcgUmVnRXhwKCdsb2dvfGhlYWRlckxvZ298aGVhZGVyLWxvZ298XiQnLCAnaScpLFxuICAgICAgICBoZXJvQmdSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ2hlcm9CYWNrZ3JvdW5kfGhlcm8tYmFja2dyb3VuZHxoZXJvQmtnfGhlcm8tYmtnfGhlcm9CZ3xoZXJvLWJnfGhlcm8xQmd8aGVyby0xLWJnfGhlcm8xQmtnfGhlcm8tMS1ia2d8aGVybzFCYWNrZ3JvdW5kfF4kJyxcbiAgICAgICAgICAnaSdcbiAgICAgICAgKSxcbiAgICAgICAgLy90aXRsZVJlZ2V4ID0gbmV3IFJlZ0V4cChcIl4obWFpblRpdGxlfG1haW4tdGl0bGV8aGVyb1RpdGxlfGhlcm8tdGl0bGV8dGl0bGV8KSRcIiwgXCJpXCIpLFxuICAgICAgICAvL3N1YnRpdGxlUmVnZXggPSBuZXcgUmVnRXhwKFwiXihzdWJ0aXRsZXxzdWItdGl0bGV8aGVyb1N1YnRpdGxlfGhlcm8tc3VidGl0bGV8KSRcIiwgXCJpXCIpLFxuICAgICAgICBidXR0b25CZ0NvbG9yUmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICdeKGhlcm9CdXR0b25CZ0NvbG9yfGhlcm8tYnV0dG9uLWJnLWNvbG9yfGhlcm9CdXR0b25CYWNrZ3JvdW5kQ29sb3J8aGVyby1idXR0b24tYmFja2dyb3VuZC1jb2xvcnxoZXJvQmtnQ29sb3J8aGVyby1ia2ctY29sb3J8KSQnLFxuICAgICAgICAgICdpJ1xuICAgICAgICApLFxuICAgICAgICBidXR0b25Cb3JkZXJDb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cCgnXihoZXJvQnV0dG9uQm9yZGVyQ29sb3J8aGVyby1idXR0b24tYm9yZGVyLWNvbG9yfGhlcm9Cb3JkZXJDb2xvcnxoZXJvLWJvcmRlci1jb2xvcnwpJCcsICdpJyksXG4gICAgICAgIGhlYWRlckJnQ29sb3IgPSAnaGVhZGVyQmdDb2xvcicsXG4gICAgICAgIGhlYWRlckxvZ29JbWcgPSAnaGVhZGVyTG9nb0ltZycsXG4gICAgICAgIGhlcm9CZ0ltZyA9ICdoZXJvQmdJbWcnLFxuICAgICAgICAvL2hlcm9UaXRsZSA9IFwiaGVyb1RpdGxlXCIsXG4gICAgICAgIC8vaGVyb1N1YnRpdGxlID0gXCJoZXJvU3VidGl0bGVcIixcbiAgICAgICAgZm9ybUJ1dHRvbkJnQ29sb3IgPSAnZm9ybUJ1dHRvbkJnQ29sb3InLFxuICAgICAgICBmb290ZXJMb2dvSW1nID0gJ2Zvb3RlckxvZ29JbWcnLFxuICAgICAgICAvL3RpdGxlID0gXCJZb3UgVG8gT3VyIEV2ZW50XCIsXG4gICAgICAgIC8vc3VidGl0bGUgPSBMSUIuZ2V0SHVtYW5EYXRlKCksXG4gICAgICAgIC8vY29tcGFueSxcbiAgICAgICAgLy9jb21wYW55TmFtZSxcbiAgICAgICAgZWRpdEFzc2V0VmFycyxcbiAgICAgICAgd2FpdEZvckxvYWRNc2dcblxuICAgICAgd2FpdEZvckxvYWRNc2cgPSBuZXcgRXh0LldpbmRvdyh7XG4gICAgICAgIGNsb3NhYmxlOiB0cnVlLFxuICAgICAgICBtb2RhbDogdHJ1ZSxcbiAgICAgICAgd2lkdGg6IDUwMCxcbiAgICAgICAgaGVpZ2h0OiAyNTAsXG4gICAgICAgIGNsczogJ21rdE1vZGFsRm9ybScsXG4gICAgICAgIHRpdGxlOiAnUGxlYXNlIFdhaXQgZm9yIFBhZ2UgdG8gTG9hZCcsXG4gICAgICAgIGh0bWw6ICc8dT5TYXZpbmcgRWRpdHM8L3U+IDxicj5XYWl0IHVudGlsIHRoaXMgcGFnZSBjb21wbGV0ZWx5IGxvYWRzIGJlZm9yZSBjbG9zaW5nLiA8YnI+PGJyPjx1PlRvIERpc2FibGUgVGhpcyBGZWF0dXJlOjwvdT4gPGJyPkNsZWFyIHRoZSBzZWxlY3RlZCBjb21wYW55IHZpYSB0aGUgTWFya2V0b0xpdmUgZXh0ZW5zaW9uLidcbiAgICAgIH0pXG5cbiAgICAgIGVkaXRBc3NldFZhcnMgPSBmdW5jdGlvbiAoYXNzZXQpIHtcbiAgICAgICAgbGV0IGFzc2V0VmFycyA9IGFzc2V0LmdldFJlc3BvbnNpdmVWYXJWYWx1ZXMoKVxuICAgICAgICAvL2lzTGFuZGluZ1BhZ2VFZGl0b3JGcmFnbWVudFN0b3JlLFxuICAgICAgICAvL2NvdW50ID0gMCxcbiAgICAgICAgLy9pc1RpdGxlVXBkYXRlZCA9IGlzU3VidGl0bGVVcGRhdGVkID0gZmFsc2U7XG5cbiAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG5cbiAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGhlYWRlckJnQ29sb3IsIGNvbG9yKVxuICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoaGVhZGVyTG9nb0ltZywgbG9nbylcbiAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGhlcm9CZ0ltZywgaGVyb0JhY2tncm91bmQpXG4gICAgICAgIC8vYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGhlcm9UaXRsZSwgdGl0bGUpO1xuICAgICAgICAvL2Fzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShoZXJvU3VidGl0bGUsIHN1YnRpdGxlKTtcbiAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGZvcm1CdXR0b25CZ0NvbG9yLCBjb2xvcilcbiAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGZvb3RlckxvZ29JbWcsIGxvZ28pXG5cbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IE9iamVjdC5rZXlzKGFzc2V0VmFycykubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgbGV0IGN1cnJWYXJpYWJsZUtleSA9IE9iamVjdC5rZXlzKGFzc2V0VmFycylbaWldLFxuICAgICAgICAgICAgY3VyclZhcmlhYmxlVmFsdWUgPSBPYmplY3QudmFsdWVzKGFzc2V0VmFycylbaWldLnRvU3RyaW5nKClcblxuICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjdXJyVmFyaWFibGVWYWx1ZSA9ICcnXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2gobG9nb1JlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChodHRwUmVnRXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBsb2dvKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChoZXJvQmdSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goaHR0cFJlZ0V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGN1cnJWYXJpYWJsZUtleSwgaGVyb0JhY2tncm91bmQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGJ1dHRvbkJnQ29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goY29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShjdXJyVmFyaWFibGVLZXksIGNvbG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChidXR0b25Cb3JkZXJDb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChjb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGN1cnJWYXJpYWJsZUtleSwgY29sb3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHdhaXRGb3JMb2FkTXNnLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9Na3QzLmFwcC5jb250cm9sbGVycy5nZXQoXCJNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlXCIpLmxvYWRFZGl0b3JWaWV3KCk7XG4gICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5oaWRlKClcbiAgICAgICAgICB9LCA3NTAwKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZygnPiBFZGl0aW5nOiBMYW5kaW5nIFBhZ2UgVmFyaWFibGVzJylcbiAgICAgIGlmIChtb2RlID09ICdlZGl0Jykge1xuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICBlZGl0QXNzZXRWYXJzKGFzc2V0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBpc0xhbmRpbmdQYWdlRWRpdG9yVmFyaWFibGVzID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmFwcC5jb250cm9sbGVycy5nZXQnKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKCkuZ2V0UmVzcG9uc2l2ZVZhclZhbHVlcygpICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKCkuc2V0UmVzcG9uc2l2ZVZhclZhbHVlICYmXG4gICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBFZGl0aW5nOiBMYW5kaW5nIFBhZ2UgRWRpdG9yIFZhcmlhYmxlcycpXG4gICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzTGFuZGluZ1BhZ2VFZGl0b3JWYXJpYWJsZXMpXG5cbiAgICAgICAgICAgICAgZWRpdEFzc2V0VmFycyhNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIDApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobW9kZSA9PSAncHJldmlldycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogTGFuZGluZyBQYWdlIFByZXZpZXdlciBWYXJpYWJsZXMnKVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBzZXRQcm9ncmFtUmVwb3J0RmlsdGVyOiBmdW5jdGlvbiAoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQsIG5ld1Byb2dyYW1Db21wSWQpIHtcbiAgICBsZXQgYXBwbHlQcm9ncmFtUmVwb3J0RmlsdGVyXG5cbiAgICBhcHBseVByb2dyYW1SZXBvcnRGaWx0ZXIgPSBmdW5jdGlvbiAoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQpIHtcbiAgICAgIGxldCBjdXJyTmV3UmVwb3J0XG5cbiAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWUubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIGN1cnJOZXdSZXBvcnQgPSBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWVbaWldXG5cbiAgICAgICAgaWYgKGN1cnJOZXdSZXBvcnQuY29tcFR5cGUgPT0gJ1JlcG9ydCcpIHtcbiAgICAgICAgICBsZXQgcmVwb3J0RmlsdGVyVHlwZSwgc2VsZWN0ZWROb2Rlc1xuXG4gICAgICAgICAgaWYgKC9eRW1haWwvaS50ZXN0KGN1cnJOZXdSZXBvcnQudGV4dCkpIHtcbiAgICAgICAgICAgIHJlcG9ydEZpbHRlclR5cGUgPSAnbWFFbWFpbCdcbiAgICAgICAgICAgIHNlbGVjdGVkTm9kZXMgPSAnW1wiJyArIGNsb25lVG9Gb2xkZXJJZCArICdcIl0nXG4gICAgICAgICAgfSBlbHNlIGlmICgvXihFbmdhZ2VtZW50fE51cnR1cikvaS50ZXN0KGN1cnJOZXdSZXBvcnQudGV4dCkpIHtcbiAgICAgICAgICAgIHJlcG9ydEZpbHRlclR5cGUgPSAnbnVydHVyZXByb2dyYW0nXG4gICAgICAgICAgICBzZWxlY3RlZE5vZGVzID0gJ1tcIicgKyBjbG9uZVRvRm9sZGVySWQgKyAnXCJdJ1xuICAgICAgICAgIH0gZWxzZSBpZiAoL15MYW5kaW5nL2kudGVzdChjdXJyTmV3UmVwb3J0LnRleHQpKSB7XG4gICAgICAgICAgICByZXBvcnRGaWx0ZXJUeXBlID0gJ21hTGFuZGluZydcbiAgICAgICAgICAgIHNlbGVjdGVkTm9kZXMgPSAnW1wiJyArIGNsb25lVG9Gb2xkZXJJZCArICdcIl0nXG4gICAgICAgICAgfSBlbHNlIGlmICgvXlByb2dyYW0vaS50ZXN0KGN1cnJOZXdSZXBvcnQudGV4dCkpIHtcbiAgICAgICAgICAgIHJlcG9ydEZpbHRlclR5cGUgPSAncHJvZ3JhbSdcbiAgICAgICAgICAgIHNlbGVjdGVkTm9kZXMgPSAnW1wiJyArIGNsb25lVG9Gb2xkZXJJZCArICdcIl0nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlcG9ydEZpbHRlclR5cGUgJiYgc2VsZWN0ZWROb2Rlcykge1xuICAgICAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgICAgICcvYW5hbHl0aWNzL2FwcGx5Q29tcG9uZW50RmlsdGVyJyxcbiAgICAgICAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgICAgICAgJyZub2RlSWRzPScgK1xuICAgICAgICAgICAgICBzZWxlY3RlZE5vZGVzICtcbiAgICAgICAgICAgICAgJyZmaWx0ZXJUeXBlPScgK1xuICAgICAgICAgICAgICByZXBvcnRGaWx0ZXJUeXBlICtcbiAgICAgICAgICAgICAgJyZyZXBvcnRJZD0nICtcbiAgICAgICAgICAgICAgY3Vyck5ld1JlcG9ydC5jb21wSWQgK1xuICAgICAgICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjbG9uZVRvRm9sZGVySWQpIHtcbiAgICAgIGlmIChnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UpIHtcbiAgICAgICAgYXBwbHlQcm9ncmFtUmVwb3J0RmlsdGVyKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkKVxuICAgICAgfSBlbHNlIGlmIChuZXdQcm9ncmFtQ29tcElkKSB7XG4gICAgICAgIGFwcGx5UHJvZ3JhbVJlcG9ydEZpbHRlcihMSUIuZ2V0UHJvZ3JhbUFzc2V0RGV0YWlscyhuZXdQcm9ncmFtQ29tcElkKSwgY2xvbmVUb0ZvbGRlcklkKVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBzZXRQcm9ncmFtVGFnOiBmdW5jdGlvbiAob3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEsIG5ld1Byb2dyYW1Db21wSWQsIHRhZ05hbWUsIHRhZ1ZhbHVlKSB7XG4gICAgbGV0IGN1cnJTZXR0aW5nLCB0YWdEYXRhXG5cbiAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEubGVuZ3RoOyBpaSsrKSB7XG4gICAgICBjdXJyU2V0dGluZyA9IG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhW2lpXVxuXG4gICAgICBpZiAoY3VyclNldHRpbmcuc3VtbWFyeURhdGEubmFtZSA9PSB0YWdOYW1lKSB7XG4gICAgICAgIHRhZ0RhdGEgPSBlbmNvZGVVUklDb21wb25lbnQoXG4gICAgICAgICAgJ3tcInByb2dyYW1JZFwiOicgK1xuICAgICAgICAgIG5ld1Byb2dyYW1Db21wSWQgK1xuICAgICAgICAgICcsXCJwcm9ncmFtRGVzY3JpcHRvcklkXCI6JyArXG4gICAgICAgICAgcGFyc2VJbnQoY3VyclNldHRpbmcuaWQucmVwbGFjZSgvXlBELS8sICcnKSkgK1xuICAgICAgICAgICcsXCJkZXNjcmlwdG9ySWRcIjonICtcbiAgICAgICAgICBjdXJyU2V0dGluZy5kZXNjcmlwdG9ySWQgK1xuICAgICAgICAgICcsXCJkZXNjcmlwdG9yVmFsdWVcIjpcIicgK1xuICAgICAgICAgIHRhZ1ZhbHVlICtcbiAgICAgICAgICAnXCJ9J1xuICAgICAgICApXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRhZ0RhdGEpIHtcbiAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAnL21hcmtldGluZ0V2ZW50L3NldFByb2dyYW1EZXNjcmlwdG9yU3VibWl0JyxcbiAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgJyZjb21wSWQ9JyArXG4gICAgICAgIG5ld1Byb2dyYW1Db21wSWQgK1xuICAgICAgICAnJl9qc29uPScgK1xuICAgICAgICB0YWdEYXRhICtcbiAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAnUE9TVCcsXG4gICAgICAgIGZhbHNlLFxuICAgICAgICAnJyxcbiAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIH1cbiAgICAgIClcbiAgICB9XG4gIH1cblxufVxuIiwiY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gUnVubmluZycpXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIHNjcmlwdCBjb250YWlucyBhbGwgb2YgdGhlIGZ1bmN0aW9uYWxpdHkgbmVlZGVkIGZvciB0aGUgbWFuaXB1bGF0aW9uIG9mIHRoZVxuICogIE1hcmtldG9MaXZlIGVudmlyb25tZW50cy5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXZhclxudmFyIHByb2RFeHRlbnNpb25JZCA9ICdvbmlibm5vZ2hsbGxkaWVjYm9lbGJwY2FlZ2dmaW9obCcsXG4gIGV4dGVuc2lvbklkID0gcHJvZEV4dGVuc2lvbklkLFxuICBleHRlbnNpb25NaW5WZXJzaW9uID0gJzUuMC4wJyxcbiAgbWt0b0FwcERvbWFpbiA9ICdeaHR0cHM6Ly9hcHAtW2EtejAtOV0rLm1hcmtldG8uY29tJyxcbiAgbWt0b0Rlc2lnbmVyRG9tYWluID0gJ15odHRwczovL1thLXowLTldKy1bYS16MC05XSsubWFya2V0b2Rlc2lnbmVyLmNvbScsXG4gIG1rdG9EZXNpZ25lckhvc3QgPSAnbmEtc2pwLm1hcmtldG9kZXNpZ25lci5jb20nLFxuICBta3RvV2l6YXJkID0gbWt0b0FwcERvbWFpbiArICcvbSMnLFxuICBta3RvRW1haWxEZXNpZ25lciA9IG1rdG9EZXNpZ25lckRvbWFpbiArICcvZHMnLFxuICBta3RvTGFuZGluZ1BhZ2VEZXNpZ25lciA9IG1rdG9EZXNpZ25lckRvbWFpbiArICcvbHBlZGl0b3IvJyxcbiAgbWt0b0VtYWlsSW5zaWdodHNMaW5rID0gJ2h0dHBzOi8vaW5zaWdodHMubWFya2V0b2xpdmUuY29tL2VtYWlsJyxcbiAgbWt0b0VtYWlsRGVsaXZlcmFiaWxpdHlUb29sc0xpbmsgPSAnaHR0cHM6Ly8yNTBvay5jb20vbG9naW4/c3VibWl0PXRydWUnLFxuICBta3RvQml6aWJsZURpc2NvdmVyTGluayA9ICdodHRwczovL2FwcHMuYml6aWJsZS5jb20vRGlzY292ZXIvMzgzOScsXG4gIG1rdG9CaXppYmxlUmV2UGxhbkxpbmsgPVxuICAgICdodHRwczovL2FwcHMuYml6aWJsZS5jb20vTXlBY2NvdW50L0J1c2luZXNzLzM5MT9idXNWaWV3PWZhbHNlIyEvTXlBY2NvdW50L0J1c2luZXNzL0RlY2lzaW9uRW5naW5lLkRlY2lzaW9uRW5naW5lSG9tZScsXG4gIGRlbW9Nb2RlbGVyTGluayA9ICdodHRwczovL2FwcC1zanAubWFya2V0by5jb20vP3ByZXZpZXc9dHJ1ZSZhcHByb3ZlZD10cnVlLyNSQ004M0ExJyxcbiAgbWt0b0RlbW9BY2NvdW50TWF0Y2ggPSAnXm1rdG9kZW1vYWNjb3VudCcsXG4gIG1rdG9NeU1hcmtldG9GcmFnbWVudCA9ICdNTTBBMScsXG4gIG1rdG9NeU1hcmtldG9TdXBlcmJhbGxGcmFnbWVudCA9ICdNTScsXG4gIG1rdG9DYWxlbmRhckZyYWdtZW50ID0gJ0NBTCcsXG4gIG1rdG9BbmFseXRpY3NGcmFnbWVudCA9ICdBUicsXG4gIG1rdG9SZXBvcnRGcmFnbWVudFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXkFSW14hXSshJCcsICdpJyksXG4gIG1rdG9Nb2RlbGVyRnJhZ21lbnRSZWdleCA9IG5ldyBSZWdFeHAoJ15SQ01bXiFdKyEkJywgJ2knKSxcbiAgbWt0b0FuYWx5dGljc0ZyYWdtZW50TWF0Y2ggPSBuZXcgUmVnRXhwKCdeQVJbXiFdKyEkfF5SQ01bXiFdKyEkJywgJ2knKSxcbiAgbWt0b01vZGVsZXJQcmV2aWV3RnJhZ21lbnRSZWdleCA9IG5ldyBSZWdFeHAoJ3ByZXZpZXc9dHJ1ZSZhcHByb3ZlZD10cnVlLyNSQ01bXiFdKyEkJywgJ2knKSxcbiAgbWt0b0FuYWx5dGljc0hvbWVGcmFnbWVudCA9ICdBSDBBMVpOJyxcbiAgbWt0b0FjY291bnRCYXNlZE1hcmtldGluZ0ZyYWdtZW50ID0gJ0FCTTBBMScsXG4gIG1rdG9BZEJyaWRnZVNtYXJ0TGlzdEZyYWdtZW50ID0gJ1NMMTExOTU2NkIyTEExJyxcbiAgbWt0b0FkbWluU2FsZXNmb3JjZUZyYWdtZW50ID0gJ1NGMEExJyxcbiAgbWt0b0FkbWluRHluYW1pY3NGcmFnbWVudCA9ICdEWTBBMScsXG4gIG1rdG9BZG1pblJjYUN1c3RvbUZpZWxkU3luYyA9ICdDRlMwQjInLFxuICBta3RvUGVyc29uRGV0YWlsUGF0aCA9ICcvbGVhZERhdGFiYXNlL2xvYWRMZWFkRGV0YWlsJyxcbiAgbWt0b0RlZmF1bHREaXlMYW5kaW5nUGFnZVJlc3BvbnNpdmVFZGl0RnJhZ21lbnQgPSAnTFBFMTE4MjInLFxuICB3YWl0QWZ0ZXJEaXNjYXJkID0gMjAwMCxcbiAgbWt0b0FjY291bnRTdHJpbmdNYXN0ZXIgPSAnbWt0b2RlbW9saXZlbWFzdGVyJywgLy9UT0RPIHRlbXAgY2hhbmdlIGZvciB0ZXN0aW5nIGJhY2sgdG8gbWt0b2RlbW9saXZlbWFzdGVyXG4gIG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyTUVVRSA9ICdta3RvZGVtb2FjY291bnQ1NDQnLCAvL2FiZGVtbzEgY2xvbmUgb2YgbWt0b2RlbW9saXZlbWFzdGVyXG4gIG1rdG9BY2NvdW50U3RyaW5nUWUgPSAnZ2xvYmFsc2FsZXMnLFxuICBta3RvQWNjb3VudFN0cmluZzEwNiA9ICdta3RvZGVtb2FjY291bnQxMDYnLFxuICBta3RvQWNjb3VudFN0cmluZzEwNmQgPSAnbWt0b2RlbW9hY2NvdW50MTA2ZCcsXG4gIG1rdG9BY2NvdW50U3RyaW5nRHluYW1pY3MgPSAnbWt0b2RlbW9hY2NvdW50NDA4JyxcbiAgbWt0b0FjY291bnRTdHJpbmdzMTA2TWF0Y2ggPSAnXignICsgbWt0b0FjY291bnRTdHJpbmcxMDYgKyAnfCcgKyBta3RvQWNjb3VudFN0cmluZzEwNmQgKyAnKSQnLFxuICBta3RvQWNjb3VudFN0cmluZ3NNYXRjaCA9XG4gICAgJ14oJyArXG4gICAgbWt0b0FjY291bnRTdHJpbmdNYXN0ZXIgK1xuICAgICd8JyArXG4gICAgbWt0b0FjY291bnRTdHJpbmdNYXN0ZXJNRVVFICtcbiAgICAnfCcgK1xuICAgIG1rdG9BY2NvdW50U3RyaW5nMTA2ICtcbiAgICAnfCcgK1xuICAgIG1rdG9BY2NvdW50U3RyaW5nMTA2ZCArXG4gICAgJ3wnICtcbiAgICBta3RvQWNjb3VudFN0cmluZ0R5bmFtaWNzICtcbiAgICAnKSQnLCAvL1RPRE8gY2hhbmdlZCBmb3IgTUVVRVxuICBta3RvTGF1bmNoUG9pbnRGb2xkZXJUb0hpZGUgPSBuZXcgUmVnRXhwKCdeTGF1bmNoUG9pbnQkJywgJ2knKSxcbiAgbWt0b09wZXJhdGlvbmFsRm9sZGVycyA9IG5ldyBSZWdFeHAoJ15fT3BlcmF0aW9uYWx8Xl9PcGVyYXRpb25zfFxcXFwoVEVTVFxcXFwpJCcsICdpJyksXG4gIG1rdG9NYXN0ZXJNYXJrZXRpbmdBY3Rpdml0aWVzRW5nbGlzaEZyYWdtZW50ID0gJ01BMTlBMScsXG4gIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzRGVmYXVsdEZyYWdtZW50ID0gJ01BMTVBMScsXG4gIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzVXNlckZyYWdtZW50ID0gJ01BMTk4MDJBMScsXG4gIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzSmFwYW5lc2VGcmFnbWVudCA9ICdNQTE5ODQ4QTEnLFxuICBta3RvTWFya2V0aW5nQWN0aXZpdGllc0ZpbnNlcnZGcmFnbWVudCA9ICdNQTIwODA2QTEnLFxuICBta3RvTWFya2V0aW5nQWN0aXZpdGllc0hlYWx0aGNhcmVGcmFnbWVudCA9ICdNQTIwODI2QTEnLFxuICBta3RvTWFya2V0aW5nQWN0aXZpdGllc0hpZ2hlckVkRnJhZ21lbnQgPSAnTUEyMDg0NkExJyxcbiAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNNYW51ZmFjdHVyaW5nRnJhZ21lbnQgPSAnTUEyNjQxMEExJyxcbiAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNUZWNobm9sb2d5RnJhZ21lbnQgPSAnTUEyNjQ4OUExJyxcbiAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNUcmF2ZWxMZWlzdXJlRnJhZ21lbnQgPSAnTUEyNzU4OEExJyxcbiAgbWt0b01hc3RlckxlYWREYXRhYmFzZUVuZ2xpc2hGcmFnbWVudCA9ICdNTDBBMVpONScsXG4gIG1rdG9MZWFkRGF0YWJhc2VEZWZhdWx0RnJhZ21lbnQgPSAnTUwwQTFaTjInLFxuICBta3RvTGVhZERhdGFiYXNlVXNlckZyYWdtZW50ID0gJ01MMEExWk4xOTc4OCcsXG4gIG1rdG9MZWFkRGF0YWJhc2VKYXBhbmVzZUZyYWdtZW50ID0gJ01MMEExWk4xOTgzNCcsXG4gIG1rdG9MZWFkRGF0YWJhc2VGaW5zZXJ2RnJhZ21lbnQgPSAnTUwwQTFaTjIwNzkyJyxcbiAgbWt0b0xlYWREYXRhYmFzZUhlYWx0aGNhcmVGcmFnbWVudCA9ICdNTDBBMVpOMjA4MTInLFxuICBta3RvTGVhZERhdGFiYXNlSGlnaGVyRWRGcmFnbWVudCA9ICdNTDBBMVpOMjA4MzInLFxuICBta3RvTGVhZERhdGFiYXNlTWFudWZhY3R1cmluZ0ZyYWdtZW50ID0gJ01MMEExWk4yNjM5NicsXG4gIG1rdG9MZWFkRGF0YWJhc2VUZWNobm9sb2d5RnJhZ21lbnQgPSAnTUwwQTFaTjI2NDc1JyxcbiAgbWt0b0xlYWREYXRhYmFzZVRyYXZlbExlaXN1cmVGcmFnbWVudCA9ICdNTDBBMVpOMjc1NzQnLFxuICBta3RvQWRtaW5FbWFpbEVtYWlsRnJhZ21lbnQgPSAnRUEwQTEnLFxuICBta3RvQWRtaW5XZWJTZXJ2aWNlc0ZyYWdtZW50ID0gJ01XMEExJyxcbiAgbWt0b0FkbWluV2ViU2t5RnJhZ21lbnQgPSAnSEcwQTEnLFxuICBta3RvRGlzYWJsZUJ1dHRvbnNGcmFnbWVudE1hdGNoID1cbiAgICAnXignICtcbiAgICBta3RvTWFzdGVyTWFya2V0aW5nQWN0aXZpdGllc0VuZ2xpc2hGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTWFya2V0aW5nQWN0aXZpdGllc0RlZmF1bHRGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTWFya2V0aW5nQWN0aXZpdGllc1VzZXJGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTWFya2V0aW5nQWN0aXZpdGllc0phcGFuZXNlRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNGaW5zZXJ2RnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNIZWFsdGhjYXJlRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b01hcmtldGluZ0FjdGl2aXRpZXNIaWdoZXJFZEZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzTWFudWZhY3R1cmluZ0ZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzVGVjaG5vbG9neUZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9NYXJrZXRpbmdBY3Rpdml0aWVzVHJhdmVsTGVpc3VyZUZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9NYXN0ZXJMZWFkRGF0YWJhc2VFbmdsaXNoRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0xlYWREYXRhYmFzZURlZmF1bHRGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTGVhZERhdGFiYXNlVXNlckZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9MZWFkRGF0YWJhc2VKYXBhbmVzZUZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9MZWFkRGF0YWJhc2VGaW5zZXJ2RnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0xlYWREYXRhYmFzZUhlYWx0aGNhcmVGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTGVhZERhdGFiYXNlSGlnaGVyRWRGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvTGVhZERhdGFiYXNlTWFudWZhY3R1cmluZ0ZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9MZWFkRGF0YWJhc2VUZWNobm9sb2d5RnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0xlYWREYXRhYmFzZVRyYXZlbExlaXN1cmVGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvQWRtaW5FbWFpbEVtYWlsRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0FkbWluV2ViU2VydmljZXNGcmFnbWVudCArXG4gICAgJykkJyxcbiAgbWt0b09wcEluZmx1ZW5jZUFuYWx5emVyRnJhZ21lbnQgPSAnQVIxNTU5QTEhJyxcbiAgbWt0b1Byb2dyYW1BbmFseXplckZyYWdtZW50ID0gJ0FSMTU0NEExIScsXG4gIG1rdG9Nb2RlbGVyRnJhZ21lbnQgPSAnUkNNNzBBMSEnLFxuICBta3RvU3VjY2Vzc1BhdGhBbmFseXplckZyYWdtZW50ID0gJ0FSMTY4MkExIScsXG4gIG1rdG9BbmFseXplcnNGcmFnbWVudE1hdGNoID1cbiAgICAnXignICtcbiAgICBta3RvT3BwSW5mbHVlbmNlQW5hbHl6ZXJGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvUHJvZ3JhbUFuYWx5emVyRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b01vZGVsZXJGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvU3VjY2Vzc1BhdGhBbmFseXplckZyYWdtZW50ICtcbiAgICAnKSQnLFxuICBta3RvTW9iaWxlUHVzaE5vdGlmaWNhdGlvbkZyYWdtZW50ID0gJ01QTicsXG4gIG1rdG9JbkFwcE1lc3NhZ2VGcmFnbWVudCA9ICdJQU0nLFxuICBta3RvU21zTWVzc2FnZUZyYWdtZW50ID0gJ1NNUycsXG4gIG1rdG9Tb2NpYWxBcHBGcmFnbWVudCA9ICdTT0EnLFxuICBta3RvT3RoZXJBc3NldHNGcmFnbWVudE1hdGNoID1cbiAgICAnXignICtcbiAgICBta3RvTW9iaWxlUHVzaE5vdGlmaWNhdGlvbkZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9JbkFwcE1lc3NhZ2VGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvU21zTWVzc2FnZUZyYWdtZW50ICtcbiAgICAnfCcgK1xuICAgIG1rdG9Tb2NpYWxBcHBGcmFnbWVudCArXG4gICAgJyknLFxuICBta3RvQWJtRGlzY292ZXJNYXJrZXRvQ29tcGFuaWVzRnJhZ21lbnQgPSAnQUJNRE0nLFxuICBta3RvQWJtRGlzY292ZXJDcm1BY2NvdW50c0ZyYWdtZW50ID0gJ0FCTURDJyxcbiAgbWt0b0FibU5hbWVkQWNjb3VudEZyYWdtZW50ID0gJ05BJyxcbiAgbWt0b0FibUltcG9ydE5hbWVkQWNjb3VudHNGcmFnbWVudCA9ICdBQk1JQScsXG4gIG1rdG9BYm1GcmFnbWVudE1hdGNoID1cbiAgICAnXignICtcbiAgICBta3RvQWJtRGlzY292ZXJNYXJrZXRvQ29tcGFuaWVzRnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0FibURpc2NvdmVyQ3JtQWNjb3VudHNGcmFnbWVudCArXG4gICAgJ3wnICtcbiAgICBta3RvQWJtTmFtZWRBY2NvdW50RnJhZ21lbnQgK1xuICAgICd8JyArXG4gICAgbWt0b0FibUltcG9ydE5hbWVkQWNjb3VudHNGcmFnbWVudCArXG4gICAgJykkJyxcbiAgbWt0b0VtYWlsRWRpdEZyYWdtZW50ID0gJ0VNRScsXG4gIG1rdG9FbWFpbFByZXZpZXdGcmFnbWVudFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXkVNRVswLTldKyZpc1ByZXZpZXcnLCAnaScpLFxuICBta3RvRW1haWxQcmV2aWV3RnJhZ21lbnQyID0gJ0VNRVswLTldKyZpc1ByZXZpZXcnLFxuICBta3RvRW1haWxQcmV2aWV3RnJhZ21lbnQgPSAnRU1QJyxcbiAgbWt0b0VtYWlsVGVtcGxhdGVFZGl0RnJhZ21lbnQgPSAnRU1URScsXG4gIG1rdG9MYW5kaW5nUGFnZUVkaXRGcmFnbWVudCA9ICdMUEUnLFxuICBta3RvTGFuZGluZ1BhZ2VQcmV2aWV3RnJhZ21lbnQgPSAnTFBQJyxcbiAgbWt0b0xhbmRpbmdQYWdlUHJldmlld0RyYWZ0RnJhZ21lbnQgPSAnTFBQRCcsXG4gIG1rdG9MYW5kaW5nUGFnZVRlbXBsYXRlRWRpdEZyYWdtZW50ID0gJ0xQVEUnLFxuICBta3RvTGFuZGluZ1BhZ2VUZW1wbGF0ZVByZXZpZXdGcmFnbWVudCA9ICdMUFRQRCcsXG4gIG1rdG9Gb3JtRWRpdEZyYWdtZW50ID0gJ0ZPRScsXG4gIG1rdG9Gb3JtUHJldmlld0ZyYWdtZW50ID0gJ0ZPUCcsXG4gIG1rdG9Gb3JtUHJldmlld0RyYWZ0RnJhZ21lbnQgPSAnRk9QRCcsXG4gIG1rdG9QdXNoTm90aWZpY2F0aW9uRWRpdEZyYWdtZW50ID0gJ01QTkUnLFxuICBta3RvTW9iaWxlUHVzaE5vdGlmaWNhdGlvblByZXZpZXdGcmFnbWVudCA9ICdNUE5QJyxcbiAgbWt0b0luQXBwTWVzc2FnZUVkaXRGcmFnbWVudCA9ICdJQU1FJyxcbiAgbWt0b0luQXBwTWVzc2FnZVByZXZpZXdGcmFnbWVudCA9ICdJQU1QJyxcbiAgbWt0b1Ntc01lc3NhZ2VFZGl0RnJhZ21lbnQgPSAnU01FJyxcbiAgbWt0b1NvY2lhbEFwcEVkaXRGcmFnbWVudCA9ICdTT0FFJyxcbiAgbWt0b1NvY2lhbEFwcFByZXZpZXdGcmFnbWVudCA9ICdTT0FQJyxcbiAgbWt0b0FiVGVzdEVkaXRGcmFnbWVudCA9ICdFQkUnLFxuICBta3RvRW1haWxUZXN0R3JvdXBFZGl0RnJhZ21lbnQgPSAnQ0NFJyxcbiAgbWt0b1NuaXBwZXRFZGl0RnJhZ21lbnQgPSAnU05FJyxcbiAgbWt0b1NuaXBwZXRQcmV2aWV3RnJhZ21lbnQgPSAnU05QJyxcbiAgbWt0b0Rlc2lnbmVyc0ZyYWdtZW50TWF0Y2ggPVxuICAgICdeJyArXG4gICAgbWt0b0VtYWlsRWRpdEZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0VtYWlsUHJldmlld0ZyYWdtZW50MiArXG4gICAgJ3xeJyArXG4gICAgbWt0b0VtYWlsUHJldmlld0ZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0VtYWlsVGVtcGxhdGVFZGl0RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvTGFuZGluZ1BhZ2VFZGl0RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvTGFuZGluZ1BhZ2VQcmV2aWV3RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvTGFuZGluZ1BhZ2VQcmV2aWV3RHJhZnRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9MYW5kaW5nUGFnZVRlbXBsYXRlRWRpdEZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0xhbmRpbmdQYWdlVGVtcGxhdGVQcmV2aWV3RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvRm9ybUVkaXRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9Gb3JtUHJldmlld0ZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0Zvcm1QcmV2aWV3RHJhZnRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9QdXNoTm90aWZpY2F0aW9uRWRpdEZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b01vYmlsZVB1c2hOb3RpZmljYXRpb25QcmV2aWV3RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvSW5BcHBNZXNzYWdlRWRpdEZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0luQXBwTWVzc2FnZVByZXZpZXdGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9TbXNNZXNzYWdlRWRpdEZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b1NvY2lhbEFwcEVkaXRGcmFnbWVudCArXG4gICAgJyR8XicgK1xuICAgIG1rdG9Tb2NpYWxBcHBQcmV2aWV3RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvQWJUZXN0RWRpdEZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b0VtYWlsVGVzdEdyb3VwRWRpdEZyYWdtZW50ICtcbiAgICAnJHxeJyArXG4gICAgbWt0b1NuaXBwZXRFZGl0RnJhZ21lbnQgK1xuICAgICckfF4nICtcbiAgICBta3RvU25pcHBldFByZXZpZXdGcmFnbWVudCArXG4gICAgJyQnLFxuICBta3RvRGVmYXVsdFdvcmtzcGFjZUlkLFxuICBta3RvSmFwYW5lc2VXb3Jrc3BhY2VJZCxcbiAgbWt0b0ZpbnNlcnZXb3Jrc3BhY2VJZCxcbiAgbWt0b0hlYWx0aGNhcmVXb3Jrc3BhY2VJZCxcbiAgbWt0b0hpZ2hlckVkV29ya3NwYWNlSWQsXG4gIG1rdG9NYW51ZmFjdHVyaW5nV29ya3NwYWNlSWQsXG4gIG1rdG9UZWNobm9sb2d5V29ya3NwYWNlSWQsXG4gIG1rdG9UcmF2ZWxMZXNpdXJlV29ya3NwYWNlSWQsXG4gIG1rdG9Vbmtub3duV29ya3NwYWNlSWQsXG4gIG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gsXG4gIG1rdG9NeVdvcmtzcGFjZUVuSWQsXG4gIG1rdG9NeVdvcmtzcGFjZUpwSWQsXG4gIG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gsXG4gIG1rdG9NeVdvcmtzcGFjZUVuTmFtZSxcbiAgbWt0b015V29ya3NwYWNlSnBOYW1lLFxuICBta3RvTXlXb3Jrc3BhY2VOYW1lTWF0Y2gsXG4gIG1rdG9PdGhlcldvcmtzcGFjZU5hbWUsXG4gIG1rdG9FbWFpbFBlcmZvcm1hbmNlUmVwb3J0LFxuICBta3RvUGVvcGxlUGVyZm9ybWFuY2VSZXBvcnQsXG4gIG1rdG9XZWJQYWdlQWN0aXZpdHlSZXBvcnQsXG4gIG1rdG9PcHBvcnR1bml0eUluZmx1ZW5jZUFuYWx5emVyLFxuICBta3RvUHJvZ3JhbUFuYWx5emVyLFxuICBta3RvU3VjY2Vzc1BhdGhBbmFseXplcixcbiAgbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rLFxuICBta3RvRW5nYWdtZW50U3RyZWFtUGVyZm9ybWFjZVJlcG9ydCxcbiAgbWt0b1Byb2dyYW1QZXJmb3JtYW5jZVJlcG9ydCxcbiAgbWt0b0VtYWlsTGlua1BlcmZvcm1hbmNlUmVwb3J0LFxuICBta3RvUGVvcGxlQnlSZXZlbnVlU3RhZ2VSZXBvcnQsXG4gIG1rdG9MYW5kaW5nUGFnZVBlcmZvcm1hbmNlUmVwb3J0LFxuICBta3RvUGVvcGxlQnlTdGF0dXNSZXBvcnQsXG4gIG1rdG9Db21wYW55V2ViQWN0aXZpdHlSZXBvcnQsXG4gIG1rdG9TYWxlc0luc2lnaHRFbWFpbFBlcmZvcm1hbmNlUmVwb3J0LFxuICByZXN0b3JlRW1haWxJbnNpZ2h0cyxcbiAgb3JpZ0VtYWlsSW5zaWdodHNUaWxlTGluayxcbiAgb3JpZ0VtYWlsSW5zaWdodHNNZW51SXRlbUxpbmssXG4gIGN1cnJVcmxGcmFnbWVudCxcbiAgY3VyckNvbXBGcmFnbWVudCxcbiAgdXNlck5hbWUsXG4gIGFjY291bnRTdHJpbmcsXG4gIG9yaWdNZW51U2hvd0F0RnVuYyxcbiAgb3JpZ0FqYXhSZXF1ZXN0RnVuYyxcbiAgb3JpZ0Fzc2V0U2F2ZUVkaXQsXG4gIG9yaWdGaWxsQ2FudmFzLFxuICBvcmlnRXhwbG9yZXJQYW5lbEFkZE5vZGUsXG4gIG9yaWdFeHBsb3JlclBhbmVsUmVtb3ZlTm9kZXMsXG4gIG9yaWdFeHBsb3JlclBhbmVsVXBkYXRlTm9kZVRleHQsXG4gIG92ZXJyaWRlVGlsZVRpbWVyQ291bnQgPSB0cnVlLFxuICBBUFAgPSBBUFAgfHwge31cblxuLy8gc2V0IHRoZSBpbnN0YW5jZSBzcGVjaWZpYyB2YXJpYWJsZXMgd2l0aCB0aGUgcHJvcGVyIHZhbHVlc1xuQVBQLnNldEluc3RhbmNlSW5mbyA9IGZ1bmN0aW9uIChhY2NvdW50U3RyaW5nKSB7XG4gIGlmIChhY2NvdW50U3RyaW5nID09IG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyKSB7XG4gICAgbWt0b0RlZmF1bHRXb3Jrc3BhY2VJZCA9IDFcbiAgICBta3RvSmFwYW5lc2VXb3Jrc3BhY2VJZCA9IDNcbiAgICBta3RvVW5rbm93bldvcmtzcGFjZUlkID0gLTFcbiAgICBta3RvR29sZGVuV29ya3NwYWNlc01hdGNoID0gJ14oJyArIG1rdG9EZWZhdWx0V29ya3NwYWNlSWQgKyAnfCcgKyBta3RvSmFwYW5lc2VXb3Jrc3BhY2VJZCArICd8JyArIG1rdG9Vbmtub3duV29ya3NwYWNlSWQgKyAnKSQnXG5cbiAgICBta3RvTXlXb3Jrc3BhY2VFbklkXG4gICAgbWt0b015V29ya3NwYWNlSnBJZFxuICAgIG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2ggPSBudWxsXG5cbiAgICBta3RvTXlXb3Jrc3BhY2VFbk5hbWVcbiAgICBta3RvTXlXb3Jrc3BhY2VKcE5hbWVcbiAgICBta3RvTXlXb3Jrc3BhY2VOYW1lTWF0Y2ggPSBudWxsXG5cbiAgICBta3RvT3RoZXJXb3Jrc3BhY2VOYW1lID0gJ1VzZXJcXCdzIFdvcmtzcGFjZSdcblxuICAgIG1rdG9FbWFpbFBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMjA1QjInXG4gICAgbWt0b1Blb3BsZVBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMjNCMidcbiAgICBta3RvV2ViUGFnZUFjdGl2aXR5UmVwb3J0ID0gJ0FSMjE4QjInXG4gICAgbWt0b09wcG9ydHVuaXR5SW5mbHVlbmNlQW5hbHl6ZXIgPSAnQVIyMDdBMSdcbiAgICBta3RvUHJvZ3JhbUFuYWx5emVyID0gJ0FSMjIzQTEnXG4gICAgbWt0b1N1Y2Nlc3NQYXRoQW5hbHl6ZXIgPSAnQVIyMDhBMSdcbiAgICBta3RvUGVyZm9ybWFuY2VJbnNpZ2h0c0xpbmsgPSAnaHR0cHM6Ly9pbnNpZ2h0cy5tYXJrZXRvbGl2ZS5jb20vbXBpJ1xuICAgIG1rdG9FbmdhZ21lbnRTdHJlYW1QZXJmb3JtYWNlUmVwb3J0ID0gJ0FSMjA5QjInXG4gICAgbWt0b1Byb2dyYW1QZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjIxNkIyJ1xuICAgIG1rdG9FbWFpbExpbmtQZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjIwNEIyJ1xuICAgIG1rdG9QZW9wbGVCeVJldmVudWVTdGFnZVJlcG9ydCA9ICdBUjI2QjInXG4gICAgbWt0b0xhbmRpbmdQYWdlUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIyMTBCMidcbiAgICBta3RvUGVvcGxlQnlTdGF0dXNSZXBvcnQgPSAnQVIyMjVCMidcbiAgICBta3RvQ29tcGFueVdlYkFjdGl2aXR5UmVwb3J0ID0gJ0FSMjIxQjInXG4gICAgbWt0b1NhbGVzSW5zaWdodEVtYWlsUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIyMjZCMidcbiAgfSBlbHNlIGlmIChhY2NvdW50U3RyaW5nID09IG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyTUVVRSkge1xuICAgIG1rdG9EZWZhdWx0V29ya3NwYWNlSWQgPSAxXG4gICAgbWt0b0phcGFuZXNlV29ya3NwYWNlSWQgPSAzXG4gICAgbWt0b1Vua25vd25Xb3Jrc3BhY2VJZCA9IC0xXG4gICAgbWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCA9ICdeKCcgKyBta3RvRGVmYXVsdFdvcmtzcGFjZUlkICsgJ3wnICsgbWt0b0phcGFuZXNlV29ya3NwYWNlSWQgKyAnfCcgKyBta3RvVW5rbm93bldvcmtzcGFjZUlkICsgJykkJ1xuXG4gICAgbWt0b015V29ya3NwYWNlRW5JZFxuICAgIG1rdG9NeVdvcmtzcGFjZUpwSWRcbiAgICBta3RvTXlXb3Jrc3BhY2VJZE1hdGNoID0gbnVsbFxuXG4gICAgbWt0b015V29ya3NwYWNlRW5OYW1lXG4gICAgbWt0b015V29ya3NwYWNlSnBOYW1lXG4gICAgbWt0b015V29ya3NwYWNlTmFtZU1hdGNoID0gbnVsbFxuXG4gICAgbWt0b090aGVyV29ya3NwYWNlTmFtZSA9ICdVc2VyXFwncyBXb3Jrc3BhY2UnXG5cbiAgICBta3RvRW1haWxQZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjIwNUIyJ1xuICAgIG1rdG9QZW9wbGVQZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjIzQjInXG4gICAgbWt0b1dlYlBhZ2VBY3Rpdml0eVJlcG9ydCA9ICdBUjIxOEIyJ1xuICAgIG1rdG9PcHBvcnR1bml0eUluZmx1ZW5jZUFuYWx5emVyID0gJ0FSMjA3QTEnXG4gICAgbWt0b1Byb2dyYW1BbmFseXplciA9ICdBUjIyM0ExJ1xuICAgIG1rdG9TdWNjZXNzUGF0aEFuYWx5emVyID0gJ0FSMjA4QTEnXG4gICAgbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rID0gJ2h0dHBzOi8vaW5zaWdodHMubWFya2V0b2xpdmUuY29tL21waSdcbiAgICBta3RvRW5nYWdtZW50U3RyZWFtUGVyZm9ybWFjZVJlcG9ydCA9ICdBUjIwOUIyJ1xuICAgIG1rdG9Qcm9ncmFtUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIyMTZCMidcbiAgICBta3RvRW1haWxMaW5rUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIyMDRCMidcbiAgICBta3RvUGVvcGxlQnlSZXZlbnVlU3RhZ2VSZXBvcnQgPSAnQVIyNkIyJ1xuICAgIG1rdG9MYW5kaW5nUGFnZVBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMjEwQjInXG4gICAgbWt0b1Blb3BsZUJ5U3RhdHVzUmVwb3J0ID0gJ0FSMjI1QjInXG4gICAgbWt0b0NvbXBhbnlXZWJBY3Rpdml0eVJlcG9ydCA9ICdBUjIyMUIyJ1xuICAgIG1rdG9TYWxlc0luc2lnaHRFbWFpbFBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMjI2QjInXG4gIH0gZWxzZSBpZiAoYWNjb3VudFN0cmluZy5zZWFyY2gobWt0b0FjY291bnRTdHJpbmdzMTA2TWF0Y2gpICE9IC0xKSB7XG4gICAgbWt0b0RlZmF1bHRXb3Jrc3BhY2VJZCA9IDFcbiAgICBta3RvSmFwYW5lc2VXb3Jrc3BhY2VJZCA9IDE3M1xuICAgIG1rdG9GaW5zZXJ2V29ya3NwYWNlSWQgPSAxNzRcbiAgICBta3RvSGVhbHRoY2FyZVdvcmtzcGFjZUlkID0gMTc1XG4gICAgbWt0b0hpZ2hlckVkV29ya3NwYWNlSWQgPSAxNzZcbiAgICBta3RvTWFudWZhY3R1cmluZ1dvcmtzcGFjZUlkID0gMTg0XG4gICAgbWt0b1RlY2hub2xvZ3lXb3Jrc3BhY2VJZCA9IDE4NVxuICAgIG1rdG9UcmF2ZWxMZXNpdXJlV29ya3NwYWNlSWQgPSAxODZcbiAgICBta3RvVW5rbm93bldvcmtzcGFjZUlkID0gLTFcbiAgICBta3RvR29sZGVuV29ya3NwYWNlc01hdGNoID1cbiAgICAgICdeKCcgK1xuICAgICAgbWt0b0RlZmF1bHRXb3Jrc3BhY2VJZCArXG4gICAgICAnfCcgK1xuICAgICAgbWt0b0phcGFuZXNlV29ya3NwYWNlSWQgK1xuICAgICAgJ3wnICtcbiAgICAgIG1rdG9GaW5zZXJ2V29ya3NwYWNlSWQgK1xuICAgICAgJ3wnICtcbiAgICAgIG1rdG9IZWFsdGhjYXJlV29ya3NwYWNlSWQgK1xuICAgICAgJ3wnICtcbiAgICAgIG1rdG9IaWdoZXJFZFdvcmtzcGFjZUlkICtcbiAgICAgICd8JyArXG4gICAgICBta3RvTWFudWZhY3R1cmluZ1dvcmtzcGFjZUlkICtcbiAgICAgICd8JyArXG4gICAgICBta3RvVGVjaG5vbG9neVdvcmtzcGFjZUlkICtcbiAgICAgICd8JyArXG4gICAgICBta3RvVHJhdmVsTGVzaXVyZVdvcmtzcGFjZUlkICtcbiAgICAgICd8JyArXG4gICAgICBta3RvVW5rbm93bldvcmtzcGFjZUlkICtcbiAgICAgICcpJCdcblxuICAgIG1rdG9NeVdvcmtzcGFjZUVuSWQgPSAxNzJcbiAgICBta3RvTXlXb3Jrc3BhY2VJZE1hdGNoID0gJ14oJyArIG1rdG9NeVdvcmtzcGFjZUVuSWQgKyAnKSQnXG5cbiAgICBta3RvTXlXb3Jrc3BhY2VFbk5hbWUgPSAnTXkgV29ya3NwYWNlJ1xuICAgIG1rdG9NeVdvcmtzcGFjZU5hbWVNYXRjaCA9ICdeKCcgKyBta3RvTXlXb3Jrc3BhY2VFbk5hbWUgKyAnKSQnXG5cbiAgICBta3RvT3RoZXJXb3Jrc3BhY2VOYW1lID0gJ1VzZXJcXCdzIFdvcmtzcGFjZSdcblxuICAgIG1rdG9FbWFpbFBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMzg2NkIyJ1xuICAgIG1rdG9QZW9wbGVQZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjM4NzRCMidcbiAgICBta3RvV2ViUGFnZUFjdGl2aXR5UmVwb3J0ID0gJ0FSMzg3NkIyJ1xuICAgIG1rdG9PcHBvcnR1bml0eUluZmx1ZW5jZUFuYWx5emVyID0gJ0FSMTU1OUExJ1xuICAgIG1rdG9Qcm9ncmFtQW5hbHl6ZXIgPSAnQVIxNTQ0QTEnXG4gICAgbWt0b1N1Y2Nlc3NQYXRoQW5hbHl6ZXIgPSAnQVIxNjgyQTEnXG4gICAgbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rID0gJ2h0dHBzOi8vaW5zaWdodHMubWFya2V0b2xpdmUuY29tL21waSdcbiAgICBta3RvRW5nYWdtZW50U3RyZWFtUGVyZm9ybWFjZVJlcG9ydCA9ICdBUjM4ODFCMidcbiAgICBta3RvUHJvZ3JhbVBlcmZvcm1hbmNlUmVwb3J0ID0gJ0FSMzg4MkIyJ1xuICAgIG1rdG9FbWFpbExpbmtQZXJmb3JtYW5jZVJlcG9ydCA9ICdBUjM4ODZCMidcbiAgICBta3RvUGVvcGxlQnlSZXZlbnVlU3RhZ2VSZXBvcnQgPSAnQVIzODg5QjInXG4gICAgbWt0b0xhbmRpbmdQYWdlUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIzODkxQjInXG4gICAgbWt0b1Blb3BsZUJ5U3RhdHVzUmVwb3J0ID0gJ0FSMzg5M0IyJ1xuICAgIG1rdG9Db21wYW55V2ViQWN0aXZpdHlSZXBvcnQgPSAnQVIzOTAxQjInXG4gICAgbWt0b1NhbGVzSW5zaWdodEVtYWlsUGVyZm9ybWFuY2VSZXBvcnQgPSAnQVIzOTAzQjInXG4gIH0gZWxzZSBpZiAoYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ0R5bmFtaWNzKSB7XG4gICAgbWt0b0RlZmF1bHRXb3Jrc3BhY2VJZCA9IDFcbiAgICBta3RvVW5rbm93bldvcmtzcGFjZUlkID0gLTFcbiAgICBta3RvR29sZGVuV29ya3NwYWNlc01hdGNoID0gJ14oJyArIG1rdG9EZWZhdWx0V29ya3NwYWNlSWQgKyAnfCcgKyBta3RvVW5rbm93bldvcmtzcGFjZUlkICsgJykkJ1xuXG4gICAgbWt0b015V29ya3NwYWNlSWRNYXRjaCA9IG51bGxcbiAgICBta3RvTXlXb3Jrc3BhY2VOYW1lTWF0Y2ggPSBudWxsXG5cbiAgICBta3RvUGVyZm9ybWFuY2VJbnNpZ2h0c0xpbmsgPSAnaHR0cHM6Ly9pbnNpZ2h0cy5tYXJrZXRvbGl2ZS5jb20vbXBpJ1xuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gc2VuZHMgYSBtZXNzYWdlIHRvIHRoZSBleHRlbnNpb24gaW4gb3JkZXIgdG8gY3JlYXRlIGEgQ2hyb21lXG4gKiAgbm90aWZpY2F0aW9uIGluIGEgZ2l2ZW4gaW5zdGFuY2UgYW5kIGEgdXNlciB3aXRoIGEgc3BlY2lmaWMgcm9sZS5cbiAqICBAcGFyYW0ge1N0cmluZ30gYWNjb3VudFN0cmluZyAtIE1hcmtldG8gaW5zdGFuY2VcbiAqICBAcGFyYW0ge1N0cmluZ30gcm9sZU5hbWUgLSByb2xlIG9mIHRoZSBjdXJyZW50IHVzZXIgKE9wdGlvbmFsKVxuICogIEBwYXJhbSB7U3RyaW5nfSBta3RvVXNlcklkIC0gdXNlciBuYW1lIG9mIHRoZSBjdXJyZW50IHVzZXIgKE9wdGlvbmFsKVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuc2VuZE1rdG9NZXNzYWdlID0gZnVuY3Rpb24gKGFjY291bnRTdHJpbmcsIHJvbGVOYW1lLCBta3RvVXNlcklkKSB7XG4gIGxldCBhZFRhcmdldGluZ01zZyA9IHtcbiAgICAgIGFjdGlvbjogJ21rdG9MaXZlTWVzc2FnZScsXG4gICAgICBpZDogJ2FkVGFyZ2V0aW5nJyxcbiAgICAgIHRpdGxlOiAnTmV3IEZlYXR1cmU6IEFkIFRhcmdldGluZycsXG4gICAgICBub3RpZnk6ICdOb3cgeW91IGNhbiBxdWlja2x5IGNhcHR1cmUgYWQgdGFyZ2V0aW5nIGltYWdlcyBvciBkZW1vIGFkIHRhcmdldGluZyBsaXZlIGZvcjpcXG5cXG5Hb29nbGUgU2VhcmNoLCBGYWNlYm9vaywgTGlua2VkSW4nLFxuICAgICAgcmVxdWlyZUludGVyYWN0aW9uOiB0cnVlLFxuICAgICAgYnV0dG9uVGl0bGU6ICcgICAgICAgICAgICAgICAgICAgICAgICBMZWFybiBNb3JlIC0tPicsXG4gICAgICBidXR0b25MaW5rOiAnaHR0cDovL3d3dy5tYXJrZXRvbGl2ZS5jb20vZW4vbGVhcm4vdmlkZW9zJyxcbiAgICAgIHN0YXJ0RGF0ZTogJycsXG4gICAgICBlbmREYXRlOiAnMDctMjctMjAxNycsXG4gICAgICBudW1PZlRpbWVzUGVyRGF5OiAxXG4gICAgfSxcbiAgICB1c2VyV29ya3NwYWNlTXNnID0ge1xuICAgICAgYWN0aW9uOiAnbWt0b0xpdmVNZXNzYWdlJyxcbiAgICAgIGlkOiAndXNlcldvcmtzcGFjZScsXG4gICAgICB0aXRsZTogJ05ldyBUbyBSZWxvYWRlZDogVXNlciBXb3Jrc3BhY2UnLFxuICAgICAgbm90aWZ5OlxuICAgICAgICAnTGV2ZXJhZ2UgeW91ciBvd24gU0Mgd29ya3NwYWNlIGZvciBjcmVhdGluZyBhbnkgcHJvZ3JhbS9hc3NldCB1c2luZyB0aGUgcHJvdmlkZWQgZGVtbyBkYXRhIG9mIG91ciBzaGFyZWQgcGFydGl0aW9uIGluIHRoZSBNYXJrZXRvTGl2ZSBSZWxvYWRlZCBpbnN0YW5jZS5cXG5cXG5Vc2VyIElEOiAnLFxuICAgICAgcmVxdWlyZUludGVyYWN0aW9uOiB0cnVlLFxuICAgICAgc3RhcnREYXRlOiAnJyxcbiAgICAgIGVuZERhdGU6ICcwNy0xMi0yMDE3JyxcbiAgICAgIG51bU9mVGltZXNQZXJEYXk6IDJcbiAgICB9LFxuICAgIGV4dGVuc2lvblVwZGF0ZU1zZyA9IHtcbiAgICAgIGFjdGlvbjogJ21rdG9MaXZlTWVzc2FnZScsXG4gICAgICBpZDogJ2V4dGVuc2lvblVwZGF0ZScsXG4gICAgICB0aXRsZTogJ0NvbWluZyBTb29uOiBFeHRlbnNpb24gdjUuMi4wJyxcbiAgICAgIG5vdGlmeTpcbiAgICAgICAgJ1dpdGhpbiB0aGUgbmV4dCBkYXkgb3IgdHdvIHlvdXIgZXh0ZW5zaW9uIHdpbGwgYXV0b21hdGljYWxseSB1cGRhdGUgYW5kIGJlIGRpc2FibGVkIGR1ZSB0byBuZXcgcGVybWlzc2lvbnMgYmVpbmcgcmVxdWVzdGVkLiBBcHByb3ZlIHRoZSBuZXcgcGVybWlzc2lvbiBieSByZS1lbmFibGluZyB0aGUgZXh0ZW5zaW9uLicsXG4gICAgICByZXF1aXJlSW50ZXJhY3Rpb246IHRydWUsXG4gICAgICBidXR0b25UaXRsZTogJyAgICAgICAgICAgICAgICAgICAgICAgIEhvdyB0byBSZS1lbmFibGUgdGhlIEV4dGVuc2lvbiAtLT4nLFxuICAgICAgYnV0dG9uTGluazogJ2h0dHA6Ly93d3cubWFya2V0b2xpdmUuY29tL2VuL3VwZGF0ZS9leHRlbnNpb24tdXBkYXRlJyxcbiAgICAgIHN0YXJ0RGF0ZTogJycsXG4gICAgICBlbmREYXRlOiAnMDgtMTYtMjAxNycsXG4gICAgICBudW1PZlRpbWVzUGVyRGF5OiAxXG4gICAgfSxcbiAgICBjaGFuZ2VQYXNzd29yZE1zZyA9IHtcbiAgICAgIGFjdGlvbjogJ21rdG9MaXZlTWVzc2FnZScsXG4gICAgICBpZDogJ2NoYW5nZVBhc3N3b3JkTXNnJyxcbiAgICAgIHRpdGxlOiAnTUFOREFUT1JZOiBDaGFuZ2UgWW91ciBQYXNzd29yZCcsXG4gICAgICBub3RpZnk6ICdBcyBwZXIgSVQgc2VjdXJpdHkgcG9saWN5LCBwYXNzd29yZHMgbXVzdCBleHBpcmUgZXZlcnkgNjAgZGF5cy4gUGxlYXNlIGNoYW5nZSB5b3VyIHBhc3N3b3JkIGJlZm9yZSBBdWd1c3QgMTh0aC4nLFxuICAgICAgcmVxdWlyZUludGVyYWN0aW9uOiB0cnVlLFxuICAgICAgYnV0dG9uVGl0bGU6ICcgICAgICAgICAgICAgICAgICAgICAgICBDaGFuZ2UgWW91ciBQYXNzd29yZCAtLT4nLFxuICAgICAgYnV0dG9uTGluazogJ2h0dHBzOi8vYXBwLXNqZGVtbzEubWFya2V0by5jb20vI01DMEExJyxcbiAgICAgIHN0YXJ0RGF0ZTogJycsXG4gICAgICBlbmREYXRlOiAnMDgtMTctMjAxNycsXG4gICAgICBudW1PZlRpbWVzUGVyRGF5OiAxXG4gICAgfSxcbiAgICBpc3N1ZU1zZyA9IHtcbiAgICAgIGFjdGlvbjogJ21rdG9MaXZlTWVzc2FnZScsXG4gICAgICBpZDogJ2VtYWlsSW5zaWdodHNNc2cnLFxuICAgICAgdGl0bGU6ICdFbWFpbCBJbnNpZ2h0cyBOb3QgV29ya2luZycsXG4gICAgICBub3RpZnk6XG4gICAgICAgICdUaGVyZSBpcyBhIGtub3duIGlzc3VlIHdpdGggRW1haWwgSW5zaWdodHMgbm90IGRpc3BsYXlpbmcgZGF0YSBhZnRlciAwNy8xNS8xNy5cXG5cXG5BcyBhIGZpeCwgSSBoYXZlIGRlZXAgbGlua2VkIGl0XFwncyB0aWxlIGFuZCBtZW51IGl0ZW0gdG8gb3VyIEVtYWlsIEluc2lnaHRzIGRlbW8gYXBwLicsXG4gICAgICByZXF1aXJlSW50ZXJhY3Rpb246IHRydWUsXG4gICAgICBidXR0b25UaXRsZTogJyAgICAgICAgICAgICAgICAgICAgICAgIEVtYWlsIEluc2lnaHRzIERlbW8gQXBwIC0tPicsXG4gICAgICBidXR0b25MaW5rOiAnaHR0cDovL3d3dy5tYXJrZXRvbGl2ZS5jb20vZW4vYW5hbHl0aWNzL2VtYWlsLWluc2lnaHRzLXN1bW1pdC1kZW1vLTEnLFxuICAgICAgc3RhcnREYXRlOiAnJyxcbiAgICAgIGVuZERhdGU6ICcwOC0wOS0yMDE3JyxcbiAgICAgIG51bU9mVGltZXNQZXJEYXk6IDFcbiAgICB9XG5cbiAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSWQsIGV4dGVuc2lvblVwZGF0ZU1zZylcblxufVxuXG5BUFAuZ2V0V29ya3NwYWNlTmFtZSA9IGZ1bmN0aW9uICh3b3Jrc3BhY2VJZCkge1xuICBzd2l0Y2ggKHBhcnNlSW50KHdvcmtzcGFjZUlkKSkge1xuICAgIGNhc2UgbWt0b0RlZmF1bHRXb3Jrc3BhY2VJZDpcbiAgICAgIHJldHVybiAnRGVmYXVsdCdcbiAgICBjYXNlIG1rdG9KYXBhbmVzZVdvcmtzcGFjZUlkOlxuICAgICAgcmV0dXJuICfjg4fjg6InXG4gICAgY2FzZSBta3RvRmluc2VydldvcmtzcGFjZUlkOlxuICAgICAgcmV0dXJuICdGaW5hbmNpYWwgU2VydmljZXMnXG4gICAgY2FzZSBta3RvSGVhbHRoY2FyZVdvcmtzcGFjZUlkOlxuICAgICAgcmV0dXJuICdIZWFsdGhjYXJlJ1xuICAgIGNhc2UgbWt0b0hpZ2hlckVkV29ya3NwYWNlSWQ6XG4gICAgICByZXR1cm4gJ0hpZ2hlciBFZHVjYXRpb24nXG4gICAgY2FzZSBta3RvTWFudWZhY3R1cmluZ1dvcmtzcGFjZUlkOlxuICAgICAgcmV0dXJuICdNYW51ZmFjdHVyaW5nJ1xuICAgIGNhc2UgbWt0b1RlY2hub2xvZ3lXb3Jrc3BhY2VJZDpcbiAgICAgIHJldHVybiAnVGVjaG5vbG9neSdcbiAgICBjYXNlIG1rdG9UcmF2ZWxMZXNpdXJlV29ya3NwYWNlSWQ6XG4gICAgICByZXR1cm4gJ1RyYXZlbCBMZWlzdXJlJ1xuICAgIGNhc2UgbWt0b015V29ya3NwYWNlRW5JZDpcbiAgICAgIHJldHVybiAnTXkgV29ya3NwYWNlJ1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ1Vua25vd24nXG4gIH1cbn1cblxuLy8gcmV0dXJucyB0aGUgMi0zIGxldHRlciBhc3NldCBjb2RlIGZvciB0aGUgYXNzZXQgdHlwZSBwcm92aWRlZC5cbkFQUC5nZXRBc3NldENvbXBDb2RlID0gZnVuY3Rpb24gKGNvbXBUeXBlKSB7XG4gIHN3aXRjaCAoY29tcFR5cGUpIHtcbiAgICBjYXNlICdNYXJrZXRpbmcgRm9sZGVyJzpcbiAgICAgIHJldHVybiAnTUYnXG4gICAgY2FzZSAnTWFya2V0aW5nIFByb2dyYW0nOlxuICAgICAgcmV0dXJuICdQRydcbiAgICBjYXNlICdNYXJrZXRpbmcgRXZlbnQnOlxuICAgICAgcmV0dXJuICdNRSdcbiAgICBjYXNlICdOdXJ0dXJlIFByb2dyYW0nOlxuICAgICAgcmV0dXJuICdOUCdcbiAgICBjYXNlICdFbWFpbCBCYXRjaCBQcm9ncmFtJzpcbiAgICAgIHJldHVybiAnRUJQJ1xuICAgIGNhc2UgJ0xpc3QnOlxuICAgICAgcmV0dXJuICdTVCdcbiAgICBjYXNlICdTbWFydCBMaXN0JzpcbiAgICAgIHJldHVybiAnU0wnXG4gICAgY2FzZSAnU21hcnQgQ2FtcGFpZ24nOlxuICAgICAgcmV0dXJuICdTQydcbiAgICBjYXNlICdMYW5kaW5nIFBhZ2UgRm9ybSc6XG4gICAgICByZXR1cm4gJ0ZPJ1xuICAgIGNhc2UgJ0xhbmRpbmcgUGFnZSc6XG4gICAgICByZXR1cm4gJ0xQJ1xuICAgIGNhc2UgJ0xhbmRpbmcgUGFnZSBUZXN0IEdyb3VwJzpcbiAgICAgIHJldHVybiAnTFAnXG4gICAgY2FzZSAnTGFuZGluZyBQYWdlIFRlbXBsYXRlJzpcbiAgICAgIHJldHVybiAnTFQnXG4gICAgY2FzZSAnRW1haWwnOlxuICAgICAgcmV0dXJuICdFTSdcbiAgICBjYXNlICdUZXN0IEdyb3VwJzpcbiAgICAgIHJldHVybiAnVEcnXG4gICAgY2FzZSAnRW1haWwgVGVtcGxhdGUnOlxuICAgICAgcmV0dXJuICdFVCdcbiAgICBjYXNlICdTb2NpYWwgQXBwJzpcbiAgICAgIHJldHVybiAnU09BJ1xuICAgIGNhc2UgJ01vYmlsZSBQdXNoIE5vdGlmaWNhdGlvbic6XG4gICAgICByZXR1cm4gJ01QTidcbiAgICBjYXNlICdJbi1BcHAgTWVzc2FnZSc6XG4gICAgICByZXR1cm4gJ0lBTSdcbiAgICBjYXNlICdTTVMgTWVzc2FnZSc6XG4gICAgICByZXR1cm4gJ1NNUydcbiAgICBjYXNlICdTZWdtZW50YXRpb24nOlxuICAgICAgcmV0dXJuICdTRydcbiAgICBjYXNlICdSZXBvcnQnOlxuICAgICAgcmV0dXJuICdBUidcbiAgICBjYXNlICdSZXZlbnVlIEN5Y2xlIE1vZGVsJzpcbiAgICAgIHJldHVybiAnUkNNJ1xuICAgIGNhc2UgJ1NuaXBwZXQnOlxuICAgICAgcmV0dXJuICdTTidcbiAgICBjYXNlICdJbWFnZSc6XG4gICAgICByZXR1cm4gJ0ZJJ1xuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gbW9uaXRvcnMgY2hhbmdlcyB0byB0aGUgVHJlZSBhbmQgdHJhY2tzIHdoZW5ldmVyIGEgbm9kZSBpcyBlaXRoZXJcbiAqICBhZGRlZCBvciByZW5hbWVkIGluIGEgZ29sZGVuIHdvcmtzcGFjZSBhbmQgcmVwb3J0cyB0aGlzIHRvIHRoZSB1c2VyIHZpYSBhblxuICogIGV4dGVuc2lvbiBub3RpZmljYXRpb24gYW5kIHRvIHRoZSBEZW1vIFNlcnZpY2VzIFRlYW0gdmlhIG1hcmtldG9saXZlLWJ1Z3MgcHJpdmF0ZVxuICogIFNsYWNrIGNoYW5uZWwuXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5BUFAudHJhY2tUcmVlTm9kZUVkaXRzID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBUcmFja2luZzogRWRpdHMgdG8gVHJlZSBOb2RlcycpXG4gIGxldCB2aW9sYXRpb25Nc2cgPSB7XG4gICAgYWN0aW9uOiAnbWt0b0xpdmVNZXNzYWdlJyxcbiAgICBpZDogJ05vdCBQZXJtaXR0ZWQnLFxuICAgIHRpdGxlOiAnTm90IFBlcm1pdHRlZCcsXG4gICAgbm90aWZ5OiAnJyxcbiAgICByZXF1aXJlSW50ZXJhY3Rpb246IHRydWVcbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdC5tYWluLkV4cGxvcmVyUGFuZWwucHJvdG90eXBlLmFkZE5vZGUnKSkge1xuICAgIGlmICh0eXBlb2Ygb3JpZ0V4cGxvcmVyUGFuZWxBZGROb2RlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcmlnRXhwbG9yZXJQYW5lbEFkZE5vZGUgPSBNa3QubWFpbi5FeHBsb3JlclBhbmVsLnByb3RvdHlwZS5hZGROb2RlXG4gICAgfVxuICAgIE1rdC5tYWluLkV4cGxvcmVyUGFuZWwucHJvdG90eXBlLmFkZE5vZGUgPSBmdW5jdGlvbiAocGFyZW50SWQsIG5vZGVDb25maWcsIHNlbGVjdGVkKSB7XG4gICAgICBpZiAoXG4gICAgICAgIG5vZGVDb25maWcgJiZcbiAgICAgICAgKChub2RlQ29uZmlnLnogJiYgbm9kZUNvbmZpZy56LnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB8fFxuICAgICAgICAgIChub2RlQ29uZmlnLmFjY2Vzc1pvbmVJZCAmJiBub2RlQ29uZmlnLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkpXG4gICAgICApIHtcbiAgICAgICAgbGV0IGNoYW5nZWROb2RlSW5mbyA9XG4gICAgICAgICAgICAnXFxuPipBZGRlZCBOb2RlOiogJyArXG4gICAgICAgICAgICBub2RlQ29uZmlnLmNvbXBUeXBlICtcbiAgICAgICAgICAgICcgfCAnICtcbiAgICAgICAgICAgIG5vZGVDb25maWcudGV4dCArXG4gICAgICAgICAgICAnIHwgJyArXG4gICAgICAgICAgICAnaHR0cHM6Ly8nICtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICtcbiAgICAgICAgICAgICcvIycgK1xuICAgICAgICAgICAgQVBQLmdldEFzc2V0Q29tcENvZGUobm9kZUNvbmZpZy5jb21wVHlwZSkgK1xuICAgICAgICAgICAgbm9kZUNvbmZpZy5jb21wSWQsXG4gICAgICAgICAgd29ya3NwYWNlSWQsXG4gICAgICAgICAgd29ya3NwYWNlTmFtZSxcbiAgICAgICAgICB3b3Jrc3BhY2VJbmZvLFxuICAgICAgICAgIHVzZXJJbmZvLFxuICAgICAgICAgIHBhcmVudE5vZGVJbmZvXG5cbiAgICAgICAgaWYgKG5vZGVDb25maWcueikge1xuICAgICAgICAgIHdvcmtzcGFjZUlkID0gbm9kZUNvbmZpZy56XG4gICAgICAgICAgd29ya3NwYWNlTmFtZSA9IEFQUC5nZXRXb3Jrc3BhY2VOYW1lKG5vZGVDb25maWcueilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB3b3Jrc3BhY2VJZCA9IG5vZGVDb25maWcuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgd29ya3NwYWNlTmFtZSA9IEFQUC5nZXRXb3Jrc3BhY2VOYW1lKG5vZGVDb25maWcuYWNjZXNzWm9uZUlkKVxuICAgICAgICB9XG4gICAgICAgIHdvcmtzcGFjZUluZm8gPSAnXFxuPipXb3Jrc3BhY2U6KiAnICsgd29ya3NwYWNlTmFtZVxuXG4gICAgICAgIGlmIChNa3RQYWdlICYmIE1rdFBhZ2UudXNlck5hbWUgJiYgTWt0UGFnZS51c2VyaWQpIHtcbiAgICAgICAgICB1c2VySW5mbyA9ICdcXG4+KlVzZXI6KiAnICsgTWt0UGFnZS51c2VyTmFtZSArICcgKCcgKyBNa3RQYWdlLnVzZXJpZCArICcpICdcbiAgICAgICAgfVxuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy5nZXROb2RlQnlJZChwYXJlbnRJZCkgJiZcbiAgICAgICAgICB0aGlzLmdldE5vZGVCeUlkKHBhcmVudElkKS5hdHRyaWJ1dGVzICYmXG4gICAgICAgICAgdGhpcy5nZXROb2RlQnlJZChwYXJlbnRJZCkuYXR0cmlidXRlcy50ZXh0ICYmXG4gICAgICAgICAgdGhpcy5nZXROb2RlQnlJZChwYXJlbnRJZCkuYXR0cmlidXRlcy5jb21wVHlwZSAmJlxuICAgICAgICAgIHRoaXMuZ2V0Tm9kZUJ5SWQocGFyZW50SWQpLmF0dHJpYnV0ZXMuY29tcElkXG4gICAgICAgICkge1xuICAgICAgICAgIHBhcmVudE5vZGVJbmZvID1cbiAgICAgICAgICAgICdcXG4+KlBhcmVudCBOb2RlOiogJyArXG4gICAgICAgICAgICB0aGlzLmdldE5vZGVCeUlkKHBhcmVudElkKS5hdHRyaWJ1dGVzLmNvbXBUeXBlICtcbiAgICAgICAgICAgICcgfCAnICtcbiAgICAgICAgICAgIHRoaXMuZ2V0Tm9kZUJ5SWQocGFyZW50SWQpLmF0dHJpYnV0ZXMudGV4dCArXG4gICAgICAgICAgICAnIHwgJyArXG4gICAgICAgICAgICAnaHR0cHM6Ly8nICtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICtcbiAgICAgICAgICAgICcvIycgK1xuICAgICAgICAgICAgQVBQLmdldEFzc2V0Q29tcENvZGUodGhpcy5nZXROb2RlQnlJZChwYXJlbnRJZCkuYXR0cmlidXRlcy5jb21wVHlwZSkgK1xuICAgICAgICAgICAgdGhpcy5nZXROb2RlQnlJZChwYXJlbnRJZCkuYXR0cmlidXRlcy5jb21wSWRcbiAgICAgICAgfVxuXG4gICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICdodHRwczovL2hvb2tzLnNsYWNrLmNvbS9zZXJ2aWNlcy9UMDI1RkgzVTgvQjUxSE1RMjJXL2lKR3ZIOE5DOHpWUEJEbHZVM3RxVGwxNScsXG4gICAgICAgICAgJ3tcInRleHRcIjogXCIqVW5hdXRob3JpemVkIENoYW5nZXMqJyArIHVzZXJJbmZvICsgd29ya3NwYWNlSW5mbyArIHBhcmVudE5vZGVJbmZvICsgY2hhbmdlZE5vZGVJbmZvICsgJ1wifScsXG4gICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgIHRydWUsXG4gICAgICAgICAgJydcbiAgICAgICAgKVxuXG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdVbmF1dGhvcml6ZWQgTm9kZSBBZGRlZCcsIGFzc2V0TmFtZTogbm9kZUNvbmZpZy50ZXh0LCBhc3NldElkOiBub2RlQ29uZmlnLmNvbXBJZCwgYXNzZXRUeXBlOiBub2RlQ29uZmlnLmNvbXBUeXBlLCB3b3Jrc3BhY2VJZDogd29ya3NwYWNlSWQsIHdvcmtzcGFjZU5hbWU6IHdvcmtzcGFjZU5hbWV9KVxuXG4gICAgICAgIDsodmlvbGF0aW9uTXNnLm5vdGlmeSA9ICdEbyBub3QgbWFrZSBjaGFuZ2VzIHRvIHRoZSAnICsgd29ya3NwYWNlTmFtZSArICcgV29ya3NwYWNlIScpLFxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShleHRlbnNpb25JZCwgdmlvbGF0aW9uTXNnKVxuICAgICAgfVxuICAgICAgb3JpZ0V4cGxvcmVyUGFuZWxBZGROb2RlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBpbmc6IFRyYWNrIEFkZGluZyBUcmVlIE5vZGVzJylcbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdC5tYWluLkV4cGxvcmVyUGFuZWwucHJvdG90eXBlLnJlbW92ZU5vZGVzJykpIHtcbiAgICBpZiAodHlwZW9mIG9yaWdFeHBsb3JlclBhbmVsUmVtb3ZlTm9kZXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9yaWdFeHBsb3JlclBhbmVsUmVtb3ZlTm9kZXMgPSBNa3QubWFpbi5FeHBsb3JlclBhbmVsLnByb3RvdHlwZS5yZW1vdmVOb2Rlc1xuICAgIH1cblxuICAgIE1rdC5tYWluLkV4cGxvcmVyUGFuZWwucHJvdG90eXBlLnJlbW92ZU5vZGVzID0gZnVuY3Rpb24gKG5vZGVJZHMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5nZXROb2RlQnlJZChub2RlSWRzWzBdKSAmJlxuICAgICAgICB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZHNbMF0pLmF0dHJpYnV0ZXMgJiZcbiAgICAgICAgdGhpcy5nZXROb2RlQnlJZChub2RlSWRzWzBdKS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZCAmJlxuICAgICAgICB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZHNbMF0pLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xXG4gICAgICApIHtcbiAgICAgICAgbGV0IG5vZGVDb25maWcgPSB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZHNbMF0pLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgd29ya3NwYWNlTmFtZSA9IEFQUC5nZXRXb3Jrc3BhY2VOYW1lKG5vZGVDb25maWcuYWNjZXNzWm9uZUlkKSxcbiAgICAgICAgICB3b3Jrc3BhY2VJbmZvID0gJ1xcbj4qV29ya3NwYWNlOiogJyArIHdvcmtzcGFjZU5hbWUsXG4gICAgICAgICAgY2hhbmdlZE5vZGVJbmZvID1cbiAgICAgICAgICAgICdcXG4+KlJlbW92ZWQgTm9kZToqICcgK1xuICAgICAgICAgICAgbm9kZUNvbmZpZy5jb21wVHlwZSArXG4gICAgICAgICAgICAnIHwgJyArXG4gICAgICAgICAgICBub2RlQ29uZmlnLnRleHQgK1xuICAgICAgICAgICAgJyB8ICcgK1xuICAgICAgICAgICAgJ2h0dHBzOi8vJyArXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaG9zdCArXG4gICAgICAgICAgICAnLyMnICtcbiAgICAgICAgICAgIEFQUC5nZXRBc3NldENvbXBDb2RlKG5vZGVDb25maWcuY29tcFR5cGUpICtcbiAgICAgICAgICAgIG5vZGVDb25maWcuY29tcElkLFxuICAgICAgICAgIHVzZXJJbmZvXG5cbiAgICAgICAgaWYgKE1rdFBhZ2UgJiYgTWt0UGFnZS51c2VyTmFtZSAmJiBNa3RQYWdlLnVzZXJpZCkge1xuICAgICAgICAgIHVzZXJJbmZvID0gJ1xcbj4qVXNlcjoqICcgKyBNa3RQYWdlLnVzZXJOYW1lICsgJyAoJyArIE1rdFBhZ2UudXNlcmlkICsgJykgJ1xuICAgICAgICB9XG5cbiAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgJ2h0dHBzOi8vaG9va3Muc2xhY2suY29tL3NlcnZpY2VzL1QwMjVGSDNVOC9CNTFITVEyMlcvaUpHdkg4TkM4elZQQkRsdlUzdHFUbDE1JyxcbiAgICAgICAgICAne1widGV4dFwiOiBcIipVbmF1dGhvcml6ZWQgQ2hhbmdlcyonICsgdXNlckluZm8gKyB3b3Jrc3BhY2VJbmZvICsgY2hhbmdlZE5vZGVJbmZvICsgJ1wifScsXG4gICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgIHRydWUsXG4gICAgICAgICAgJydcbiAgICAgICAgKVxuXG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdVbmF1dGhvcml6ZWQgTm9kZSBSZW1vdmVkJywgYXNzZXROYW1lOiBub2RlQ29uZmlnLnRleHQsIGFzc2V0SWQ6IG5vZGVDb25maWcuY29tcElkLCBhc3NldFR5cGU6IG5vZGVDb25maWcuY29tcFR5cGUsIHdvcmtzcGFjZUlkOiBub2RlQ29uZmlnLmFjY2Vzc1pvbmVJZCwgd29ya3NwYWNlTmFtZTogd29ya3NwYWNlTmFtZX0pXG5cbiAgICAgICAgOyh2aW9sYXRpb25Nc2cubm90aWZ5ID0gJ0RvIG5vdCBtYWtlIGNoYW5nZXMgdG8gdGhlICcgKyB3b3Jrc3BhY2VOYW1lICsgJyBXb3Jrc3BhY2UhJyksXG4gICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKGV4dGVuc2lvbklkLCB2aW9sYXRpb25Nc2cpXG4gICAgICB9XG4gICAgICBvcmlnRXhwbG9yZXJQYW5lbFJlbW92ZU5vZGVzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBpbmc6IFRyYWNrIFJlbW92aW5nIFRyZWUgTm9kZXMnKVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0Lm1haW4uRXhwbG9yZXJQYW5lbC5wcm90b3R5cGUudXBkYXRlTm9kZVRleHQnKSkge1xuICAgIGlmICh0eXBlb2Ygb3JpZ0V4cGxvcmVyUGFuZWxVcGRhdGVOb2RlVGV4dCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgb3JpZ0V4cGxvcmVyUGFuZWxVcGRhdGVOb2RlVGV4dCA9IE1rdC5tYWluLkV4cGxvcmVyUGFuZWwucHJvdG90eXBlLnVwZGF0ZU5vZGVUZXh0XG4gICAgfVxuXG4gICAgTWt0Lm1haW4uRXhwbG9yZXJQYW5lbC5wcm90b3R5cGUudXBkYXRlTm9kZVRleHQgPSBmdW5jdGlvbiAobm9kZUlkLCB0ZXh0KSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuZ2V0Tm9kZUJ5SWQobm9kZUlkKSAmJlxuICAgICAgICB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZCkuYXR0cmlidXRlcyAmJlxuICAgICAgICB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZCkuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQgJiZcbiAgICAgICAgdGhpcy5nZXROb2RlQnlJZChub2RlSWQpLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xXG4gICAgICApIHtcbiAgICAgICAgbGV0IG5vZGVDb25maWcgPSB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZCkuYXR0cmlidXRlcyxcbiAgICAgICAgICB3b3Jrc3BhY2VOYW1lID0gQVBQLmdldFdvcmtzcGFjZU5hbWUobm9kZUNvbmZpZy5hY2Nlc3Nab25lSWQpLFxuICAgICAgICAgIHdvcmtzcGFjZUluZm8gPSAnXFxuPipXb3Jrc3BhY2U6KiAnICsgd29ya3NwYWNlTmFtZSxcbiAgICAgICAgICBjaGFuZ2VkTm9kZUluZm8gPVxuICAgICAgICAgICAgJ1xcbj4qUmVuYW1lZCBOb2RlOiogJyArXG4gICAgICAgICAgICBub2RlQ29uZmlnLmNvbXBUeXBlICtcbiAgICAgICAgICAgICcgfCBGcm9tIFxcJycgK1xuICAgICAgICAgICAgbm9kZUNvbmZpZy50ZXh0ICtcbiAgICAgICAgICAgICdcXCcgdG8gXFwnJyArXG4gICAgICAgICAgICB0ZXh0ICtcbiAgICAgICAgICAgICdcXCcgfCAnICtcbiAgICAgICAgICAgICdodHRwczovLycgK1xuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhvc3QgK1xuICAgICAgICAgICAgJy8jJyArXG4gICAgICAgICAgICBBUFAuZ2V0QXNzZXRDb21wQ29kZShub2RlQ29uZmlnLmNvbXBUeXBlKSArXG4gICAgICAgICAgICBub2RlQ29uZmlnLmNvbXBJZCxcbiAgICAgICAgICB1c2VySW5mb1xuXG4gICAgICAgIGlmIChNa3RQYWdlICYmIE1rdFBhZ2UudXNlck5hbWUgJiYgTWt0UGFnZS51c2VyaWQpIHtcbiAgICAgICAgICB1c2VySW5mbyA9ICdcXG4+KlVzZXI6KiAnICsgTWt0UGFnZS51c2VyTmFtZSArICcgKCcgKyBNa3RQYWdlLnVzZXJpZCArICcpICdcbiAgICAgICAgfVxuXG4gICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICdodHRwczovL2hvb2tzLnNsYWNrLmNvbS9zZXJ2aWNlcy9UMDI1RkgzVTgvQjUxSE1RMjJXL2lKR3ZIOE5DOHpWUEJEbHZVM3RxVGwxNScsXG4gICAgICAgICAgJ3tcInRleHRcIjogXCIqVW5hdXRob3JpemVkIENoYW5nZXMqJyArIHVzZXJJbmZvICsgd29ya3NwYWNlSW5mbyArIGNoYW5nZWROb2RlSW5mbyArICdcIn0nLFxuICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICB0cnVlLFxuICAgICAgICAgICcnXG4gICAgICAgIClcblxuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnVW5hdXRob3JpemVkIE5vZGUgUmVuYW1lZCcsIGFzc2V0TmFtZTogbm9kZUNvbmZpZy50ZXh0LCBhc3NldElkOiBub2RlQ29uZmlnLmNvbXBJZCwgYXNzZXRUeXBlOiBub2RlQ29uZmlnLmNvbXBUeXBlLCB3b3Jrc3BhY2VJZDogbm9kZUNvbmZpZy5hY2Nlc3Nab25lSWQsIHdvcmtzcGFjZU5hbWU6IHdvcmtzcGFjZU5hbWV9KVxuXG4gICAgICAgIDsodmlvbGF0aW9uTXNnLm5vdGlmeSA9XG4gICAgICAgICAgJ1lvdSBhcmUgbm90IHBlcm1pdHRlZCB0byBtYWtlIGNoYW5nZXMgdG8gJyArIHdvcmtzcGFjZU5hbWUgKyAnIVxcblxcblRoZSBEZW1vIFNlcnZpY2VzIFRlYW0gaGFzIGJlZW4gbm90aWZpZWQgb2YgdGhpcyB2aW9sYXRpb24uJyksXG4gICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKGV4dGVuc2lvbklkLCB2aW9sYXRpb25Nc2cpXG4gICAgICB9XG4gICAgICBvcmlnRXhwbG9yZXJQYW5lbFVwZGF0ZU5vZGVUZXh0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBpbmc6IFRyYWNrIFJlbmFtaW5nIFRyZWUgTm9kZXMnKVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gZGlzYWJsZXMgc2F2aW5nIG9mIGVkaXRzIHRvIHRoZSBMYW5kaW5nIFBhZ2UgUHJvcGVydHkgUGFuZWwgYW5kIGFsc29cbiAqICBkaXNhYmxlcyB0aGUgc3lzdGVtIGVycm9yIG1lc3NhZ2UgZm9yIHN5bmMgZXJyb3JzIG9uIExhbmRpbmcgUGFnZXMuIFRoZXNlIGVycm9yc1xuICogIHdvdWxkIG9jY3VyIHdoZW4gdHdvIHVzZXJzIGVkaXQgdGhlIHNhbWUgbGFuZGluZyBwYWdlIHNpbXVsdGFuZW91c2x5LlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuZGlzYWJsZVByb3BlcnR5UGFuZWxTYXZpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogU2F2aW5nIG9mIExhbmRpbmcgUGFnZSBQcm9wZXJ0eSBQYW5lbCAmIFN5bmMgRXJyb3IgTWVzc2FnZScpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2VQcm9wZXJ0eVBhbmVsLnByb3RvdHlwZS5maXJlU3luY1Byb3BlcnRpZXMnKSkge1xuICAgIE1rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2VQcm9wZXJ0eVBhbmVsLnByb3RvdHlwZS5maXJlU3luY1Byb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgU2F2aW5nIG9mIExhbmRpbmcgUGFnZSBQcm9wZXJ0eSBQYW5lbCAmIFN5bmMgRXJyb3IgTWVzc2FnZScpXG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gZGlzYWJsZXMgdGhlIGNvbmZpcm1hdGlvbiBtZXNzYWdlIGZvciBkZWxldGluZyBUcmlnZ2VycywgRmlsdGVycywgYW5kXG4gKiAgRmxvdyBTdGVwcyBmcm9tIGEgU21hcnQgQ2FtcGFpZ24gb3IgU21hcnQgTGlzdCBpbiB0aGUgRGVmYXVsdCBXb3Jrc2FwY2UuXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5kaXNhYmxlQ29uZmlybWF0aW9uTWVzc2FnZSA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBTbWFydCBDYW1wYWlnbiBEZWxldGUgQ29uZmlybWF0aW9uIE1lc3NhZ2UnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3Qud2lkZ2V0cy5EYXRhUGFuZWwucHJvdG90eXBlLmNsaWNrQ2xvc2UnKSkge1xuICAgIE1rdC53aWRnZXRzLkRhdGFQYW5lbC5wcm90b3R5cGUuY2xpY2tDbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBTbWFydCBDYW1wYWlnbiBEZWxldGUgQ29uZmlybWF0aW9uIE1lc3NhZ2UnKVxuICAgICAgbGV0IGhhc0NoYW5nZXMgPSB0aGlzLmhhc1NldHRpbmdzKCksXG4gICAgICAgIHNob3dUcmlnZ2VyV2FybmluZyA9IGZhbHNlXG4gICAgICBpZiAodGhpcy5pc1NtYXJ0bGlzdCAmJiB0aGlzLmRwTWV0YS50cmlnZ2VyKSB7XG4gICAgICAgIGxldCB0cmlnZ2VyQ291bnQgPSB0aGlzLmRwTWdyLmdldFRyaWdnZXJzKCkubGVuZ3RoXG4gICAgICAgIGlmICh0cmlnZ2VyQ291bnQgPT0gMSkge1xuICAgICAgICAgIHNob3dUcmlnZ2VyV2FybmluZyA9IHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaGFzQ2hhbmdlcyB8fCBzaG93VHJpZ2dlcldhcm5pbmcpIHtcbiAgICAgICAgbGV0IHRpdGxlID0gTWt0TGFuZy5nZXRTdHIoJ0RhdGFGb3JtUGFuZWwuRGVsZXRlX2FyZzAnLCBbdGhpcy5kcFR5cGVOYW1lKHRydWUpXSksXG4gICAgICAgICAgbmFtZSA9IHRoaXMuZHBNZXRhLmRpc3BsYXlOYW1lIHx8IHRoaXMuZHBNZXRhLm5hbWUsXG4gICAgICAgICAgbXNnID0gTWt0TGFuZy5nZXRTdHIoJ0RhdGFGb3JtUGFuZWwuQXJlX3lvdV9zdXJlX3lvdV93YW50X3RvX2RlbGV0ZV9hcmcwX2FyZzEnLCBbdGhpcy5kcFR5cGVOYW1lKCksIE1rdExhbmcuZ2V0REJTdHIobmFtZSldKVxuXG4gICAgICAgIGlmIChzaG93VHJpZ2dlcldhcm5pbmcpIHtcbiAgICAgICAgICBtc2cgKz0gTWt0TGFuZy5nZXRTdHIoJ0RhdGFGb3JtUGFuZWwuVHJpZ2dlcmVkX2NhbXBhaWduc19tdXN0X2NvbnRhaW5fdHJpZ2dlcl9yZW1haW5fYWN0aXZlJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRwTWdyLmlzU21hcnRsaXN0ICYmICF0aGlzLmRwTWV0YS50cmlnZ2VyICYmIHRoaXMuZHBNZ3Iuc21hcnRMaXN0UnVsZUxvZ2ljLmN1c3RvbU1vZGUoKSkge1xuICAgICAgICAgIG1zZyArPVxuICAgICAgICAgICAgTWt0TGFuZy5nZXRTdHIoJ0RhdGFGb3JtUGFuZWwuUmVtaW5kZXInKSArXG4gICAgICAgICAgICBNa3RMYW5nLmdldFN0cignRGF0YUZvcm1QYW5lbC5DaGVja195b3VyX2FkdmFuY2VkX2ZpbHRlcl9ydWxlc19hZnRlcl9hbnlfaW5zZXJ0X2RlbGV0ZV9yZW9yZGVyJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdENhbnZhcy5nZXRBY3RpdmVUYWInKSAmJlxuICAgICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSAmJlxuICAgICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcgJiZcbiAgICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnLmFjY2Vzc1pvbmVJZFxuICAgICAgICApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBDbG9zaW5nOiBTbWFydCBDYW1wYWlnbiBEZWxldGUgQ29uZmlybWF0aW9uIE1lc3NhZ2UnKVxuICAgICAgICAgIHRoaXMuX2RvQ2xvc2UoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIEV4dDQuTXNnLmNvbmZpcm1EZWxldGUoe1xuICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAgICAgbXNnOiBtc2csXG4gICAgICAgICAgICBtaW5IZWlnaHQ6IDMwMCxcbiAgICAgICAgICAgIGZuOiBmdW5jdGlvbiAoYnV0dG9uSWQpIHtcbiAgICAgICAgICAgICAgaWYgKGJ1dHRvbklkID09PSAnb2snKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZG9DbG9zZSgpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzY29wZTogdGhpc1xuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2RvQ2xvc2UoKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5BUFAub3ZlcnJpZGVIb21lVGlsZXNSZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gIC8vcmVzaXplRmlyc3RDYWxsID0gZmFsc2U7XG4gIGxldCBjb250YWluZXIgPSBNa3RDYW52YXMuZ2V0RWwoKS5kb20ubmV4dFNpYmxpbmcuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0sXG4gICAgdGlsZXNUZXh0Q29udGVudCA9IGNvbnRhaW5lci5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3BhbicpLFxuICAgIGhyZWZNYXRjaCA9IG5ldyBSZWdFeHAoJyBocmVmPVwiW15cIl0qXCIgJywgJ2cnKSxcbiAgICBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZSxcbiAgICBlbWFpbEluc2lnaHRzVGlsZSxcbiAgICBoaWRkZW5UaWxlMSxcbiAgICBoaWRkZW5UaWxlMixcbiAgICBtcGlSZXBlYXQgPSBmYWxzZSxcbiAgICBlaVJlcGVhdCA9IGZhbHNlLFxuICAgIHRvQmVSZW1vdmVkID0gW11cblxuICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgdGlsZXNUZXh0Q29udGVudC5sZW5ndGg7IGlpKyspIHtcbiAgICBsZXQgdGlsZSA9IHRpbGVzVGV4dENvbnRlbnRbaWldXG4gICAgc3dpdGNoICh0aWxlLnRleHRDb250ZW50KSB7XG4gICAgICBjYXNlICdQZXJmb3JtYW5jZSBJbnNpZ2h0cyc6XG4gICAgICAgIGlmICh0aWxlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlLnN0eWxlLmRpc3BsYXkgIT0gJ25vbmUnKSB7XG4gICAgICAgICAgaWYgKG1waVJlcGVhdCkge1xuICAgICAgICAgICAgdG9CZVJlbW92ZWQucHVzaCh0aWxlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtcGlSZXBlYXQgPSB0cnVlXG4gICAgICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZSA9IHRpbGUucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ0VtYWlsIEluc2lnaHRzJzpcbiAgICAgICAgaWYgKGVpUmVwZWF0KSB7XG4gICAgICAgICAgdG9CZVJlbW92ZWQucHVzaCh0aWxlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVpUmVwZWF0ID0gdHJ1ZVxuICAgICAgICAgIGVtYWlsSW5zaWdodHNUaWxlID0gdGlsZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCB0b0JlUmVtb3ZlZC5sZW5ndGg7IHgrKykge1xuICAgIHRvQmVSZW1vdmVkW3hdLnJlbW92ZSgpXG4gIH1cbiAgaWYgKHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlKSB7XG4gICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUub3V0ZXJIVE1MID0gcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUub3V0ZXJIVE1MLnJlcGxhY2UoaHJlZk1hdGNoLCAnIGhyZWY9XCInICsgbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rICsgJ1wiICcpXG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwZXJmb3JtYW5jZUluc2lnaHRzVGlsZS5pZCkub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdQZXJmb3JtYW5jZSBJbnNpZ2h0cycsIGFzc2V0QXJlYTogJ1BlcmZvcm1hbmNlIEluc2lnaHRzJywgYXNzZXROYW1lOiAnRGVtbyBBcHAnLCBhc3NldFR5cGU6ICdIb21lIFRpbGUnfSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbGV0IHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRWwuY2xhc3NOYW1lID1cbiAgICAgICd4NC1idG4gbWt0My1ob21lVGlsZSB4NC1idG4tZGVmYXVsdC1zbWFsbCB4NC1pY29uLXRleHQtbGVmdCB4NC1idG4taWNvbi10ZXh0LWxlZnQgeDQtYnRuLWRlZmF1bHQtc21hbGwtaWNvbi10ZXh0LWxlZnQnXG4gICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVFbC5zdHlsZSA9ICdoZWlnaHQ6IDE1MHB4OydcbiAgICBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZUVsLmlkID0gJ3BlcmZvcm1hbmNlSW5zaWdodHNUaWxlJ1xuICAgIHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRWwuaW5uZXJIVE1MID1cbiAgICAgICc8ZW0gaWQ9XCJwZXJmb3JtYW5jZUluc2lnaHRzVGlsZS1idG5XcmFwXCI+PGEgaWQ9XCJwZXJmb3JtYW5jZUluc2lnaHRzVGlsZS1idG5FbFwiIGhyZWY9XCInICtcbiAgICAgIG1rdG9QZXJmb3JtYW5jZUluc2lnaHRzTGluayArXG4gICAgICAnXCIgY2xhc3M9XCJ4NC1idG4tY2VudGVyXCIgdGFyZ2V0PVwiX2JsYW5rXCIgcm9sZT1cImxpbmtcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDtcIj48c3BhbiBpZD1cInBlcmZvcm1hbmNlSW5zaWdodHNUaWxlLWJ0bklubmVyRWxcIiBjbGFzcz1cIng0LWJ0bi1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4OyBsaW5lLWhlaWdodDogMTUwcHg7XCI+UGVyZm9ybWFuY2UgSW5zaWdodHM8L3NwYW4+PHNwYW4gaWQ9XCJwZXJmb3JtYW5jZUluc2lnaHRzVGlsZS1idG5JY29uRWxcIiBjbGFzcz1cIng0LWJ0bi1pY29uIG1raTMtbXBpLWxvZ28tc3ZnXCI+PC9zcGFuPjwvYT48L2VtPidcblxuICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUocGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVFbCwgY29udGFpbmVyLmNoaWxkTm9kZXNbY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV0pXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BlcmZvcm1hbmNlSW5zaWdodHNUaWxlJykub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdQZXJmb3JtYW5jZSBJbnNpZ2h0cycsIGFzc2V0QXJlYTogJ1BlcmZvcm1hbmNlIEluc2lnaHRzJywgYXNzZXROYW1lOiAnRGVtbyBBcHAnLCBhc3NldFR5cGU6ICdIb21lIFRpbGUnfSlcbiAgICB9XG4gIH1cbiAgaWYgKGVtYWlsSW5zaWdodHNUaWxlKSB7XG4gICAgZW1haWxJbnNpZ2h0c1RpbGUub3V0ZXJIVE1MID0gZW1haWxJbnNpZ2h0c1RpbGUub3V0ZXJIVE1MLnJlcGxhY2UoaHJlZk1hdGNoLCAnIGhyZWY9XCInICsgbWt0b0VtYWlsSW5zaWdodHNMaW5rICsgJ1wiICcpXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZW1haWxJbnNpZ2h0c1RpbGUuaWQpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnRW1haWwgSW5zaWdodHMnLCBhc3NldEFyZWE6ICdFbWFpbCBJbnNpZ2h0cycsIGFzc2V0TmFtZTogJ0hvbWUnLCBhc3NldFR5cGU6ICdIb21lIFRpbGUnfSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbGV0IGVtYWlsSW5zaWdodHNUaWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIGVtYWlsSW5zaWdodHNUaWxlRWwuY2xhc3NOYW1lID1cbiAgICAgICd4NC1idG4gbWt0My1ob21lVGlsZSB4NC1idG4tZGVmYXVsdC1zbWFsbCB4NC1pY29uLXRleHQtbGVmdCB4NC1idG4taWNvbi10ZXh0LWxlZnQgeDQtYnRuLWRlZmF1bHQtc21hbGwtaWNvbi10ZXh0LWxlZnQgeC1wYW5lbCdcbiAgICBlbWFpbEluc2lnaHRzVGlsZUVsLnN0eWxlID0gJ2hlaWdodDogMTUwcHg7J1xuICAgIGVtYWlsSW5zaWdodHNUaWxlRWwuaWQgPSAnZW1haWxJbnNpZ2h0c1RpbGUnXG4gICAgZW1haWxJbnNpZ2h0c1RpbGVFbC5pbm5lckhUTUwgPVxuICAgICAgJzxlbSBpZD1cImVtYWlsSW5zaWdodHNUaWxlLWJ0bldyYXBcIj48YSBpZD1cImVtYWlsSW5zaWdodHNUaWxlLWJ0bkVsXCIgaHJlZj1cIicgK1xuICAgICAgbWt0b0VtYWlsSW5zaWdodHNMaW5rICtcbiAgICAgICdcIiBjbGFzcz1cIng0LWJ0bi1jZW50ZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIiByb2xlPVwibGlua1wiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4O1wiPjxzcGFuIGlkPVwiZW1haWxJbnNpZ2h0c1RpbGUtYnRuSW5uZXJFbFwiIGNsYXNzPVwieDQtYnRuLWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTUwcHg7IGhlaWdodDogMTUwcHg7IGxpbmUtaGVpZ2h0OiAxNTBweDtcIj5FbWFpbCBJbnNpZ2h0czwvc3Bhbj48c3BhbiBpZD1cImVtYWlsSW5zaWdodHNUaWxlLWJ0bkljb25FbFwiIGNsYXNzPVwieDQtYnRuLWljb24gbWtpMy1lbWFpbC1pbnNpZ2h0cy1zdmdcIj48L3NwYW4+PC9hPjwvZW0+PGRpdiBjbGFzcz1cIngtcGFuZWwtYndyYXBcIiBpZD1cImV4dC1nZW4xNjRcIj48ZGl2IGNsYXNzPVwieC1wYW5lbC1ib2R5IHgtcGFuZWwtYm9keS1ub2hlYWRlclwiIGlkPVwiZXh0LWdlbjE2NVwiPjwvZGl2PjwvZGl2PidcbiAgICBjb25zb2xlLmxvZygnKioqKioqKioqKklOU0lERSBFTFNFIGVtYWlsSW5zaWdodHNUaWxlICcgKyBlbWFpbEluc2lnaHRzVGlsZSlcbiAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGVtYWlsSW5zaWdodHNUaWxlRWwsIGNvbnRhaW5lci5jaGlsZE5vZGVzW2NvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdKVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlbWFpbEluc2lnaHRzVGlsZScpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnRW1haWwgSW5zaWdodHMnLCBhc3NldEFyZWE6ICdFbWFpbCBJbnNpZ2h0cycsIGFzc2V0TmFtZTogJ0RlbW8gQXBwJywgYXNzZXRUeXBlOiAnSG9tZSBUaWxlJ30pXG4gICAgfVxuICB9XG5cbiAgaGlkZGVuVGlsZTEgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignZGl2W3JvbGU9XCJwcmVzZW50YXRpb25cIl0nKVxuICBoaWRkZW5UaWxlMiA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdkaXZbY2xhc3M9XCJ4LXBhbmVsLWJ3cmFwIHgtcGFuZWxcIl0nKVxuICBpZiAoaGlkZGVuVGlsZTEpIHtcbiAgICBoaWRkZW5UaWxlMS5yZW1vdmUoKVxuICB9XG4gIGlmIChoaWRkZW5UaWxlMikge1xuICAgIGhpZGRlblRpbGUyLnJlbW92ZSgpXG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBvdmVycmlkZXMgdGhlIHRhcmdldCBsaW5rcyBmb3IgdGhlIERlbGl2ZXJhYmlsaXR5IFRvb2xzIGFuZCBFbWFpbFxuICogIEluc2lnaHRzIHRpbGVzIGlmIHRoZXkgZXhpc3QsIG90aGVyd2lzZSBpdCBjcmVhdGVzIHRoZSB0aWxlcy4gV2Ugb25seSBoYXZlIGEgc2luZ2xlXG4gKiAgaW5zdGFuY2UgdGhhdCBjb250YWlucyB1c2FibGUgZGVtbyBkYXRhIGZvciBib3RoIDI1MG9rIGFuZCBFbWFpbCBJbnNpZ2h0cywgc28gdGhlXG4gKiAgcGx1Z2luIGRpcmVjdHMgcGVvcGxlIGludG8gdGhhdCBpbnN0YW5jZS4gVGhpcyBmdW5jdGlvbiBkaXJlY3RzIHVzZXJzIHRvIHRoZSAyNTBva1xuICogIGxvZ2luIHBhZ2Ugd2hlcmUgdGhlIGRlbGl2ZXJhYmlsaXR5LXRvb2xzLmpzIHNjcmlwdCB3aWxsIGF1dG9tYXRpY2FsbHkgbG9naW4gYW5kXG4gKiAgaGlkZSB0aGUgbmVjZXNzYXJ5IGJ1dHRvbnMuIFRoaXMgZnVuY3Rpb24gc2hvdWxkIGFsc28gcnVuIGluc2lkZSBvZiBTQyBzYW5kYm94XG4gKiAgaW5zdGFuY2VzLlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuQVBQLm92ZXJyaWRlSG9tZVRpbGVzID0gZnVuY3Rpb24gKHJlc3RvcmVFbWFpbEluc2lnaHRzVGlsZSkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBPdmVycmlkaW5nOiBNeSBNYXJrZXRvIEhvbWUgVGlsZXMnKVxuICBpZiAoXG4gICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RDYW52YXMuZ2V0RWwnKSAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXMgJiZcbiAgICBNa3RDYW52YXMuZ2V0RWwoKS5kb20ubmV4dFNpYmxpbmcuY2hpbGROb2Rlc1swXSAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbS5uZXh0U2libGluZy5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXMgJiZcbiAgICBNa3RDYW52YXMuZ2V0RWwoKS5kb20ubmV4dFNpYmxpbmcuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXMgJiZcbiAgICBNa3RDYW52YXMuZ2V0RWwoKS5kb20ubmV4dFNpYmxpbmcuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXSAmJlxuICAgIE1rdENhbnZhcy5nZXRFbCgpLmRvbS5uZXh0U2libGluZy5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXMgJiZcbiAgICBNa3RDYW52YXMuZ2V0RWwoKS5kb20ubmV4dFNpYmxpbmcuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdICYmXG4gICAgTWt0Q2FudmFzLmdldEVsKCkuZG9tLm5leHRTaWJsaW5nLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXMgJiZcbiAgICBNa3RDYW52YXMuZ2V0RWwoKVxuICAgICAgLmRvbS5uZXh0U2libGluZy5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmlkLnRvTG93ZXJDYXNlKClcbiAgICAgIC5pbmRleE9mKCdob21ldGlsZScpID49IDBcbiAgKSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBPdmVycmlkZSBNeSBNYXJrZXRvIEhvbWUgVGlsZXMnKVxuICAgIGxldCBjb250YWluZXIgPSBNa3RDYW52YXMuZ2V0RWwoKS5kb20ubmV4dFNpYmxpbmcuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0sXG4gICAgICB0aWxlc1RleHRDb250ZW50ID0gY29udGFpbmVyLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzcGFuJyksXG4gICAgICBocmVmTWF0Y2ggPSBuZXcgUmVnRXhwKCcgaHJlZj1cIlteXCJdKlwiICcsICdnJyksXG4gICAgICBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZSxcbiAgICAgIGVtYWlsSW5zaWdodHNUaWxlLFxuICAgICAgZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUsXG4gICAgICBzZW9UaWxlLFxuICAgICAgYml6aWJsZURpc2NvdmVyLFxuICAgICAgYml6aWJsZVJldlBsYW4sXG4gICAgICBkZW1vTW9kZWxlcixcbiAgICAgIGhpZGRlblRpbGUxLFxuICAgICAgaGlkZGVuVGlsZTJcblxuICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aWxlc1RleHRDb250ZW50Lmxlbmd0aDsgaWkrKykge1xuICAgICAgbGV0IHRpbGUgPSB0aWxlc1RleHRDb250ZW50W2lpXVxuICAgICAgc3dpdGNoICh0aWxlLnRleHRDb250ZW50KSB7XG4gICAgICAgIGNhc2UgJ1BlcmZvcm1hbmNlIEluc2lnaHRzJzpcbiAgICAgICAgICBpZiAodGlsZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5zdHlsZS5kaXNwbGF5ICE9ICdub25lJykge1xuICAgICAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUgPSB0aWxlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ0VtYWlsIEluc2lnaHRzJzpcbiAgICAgICAgICBlbWFpbEluc2lnaHRzVGlsZSA9IHRpbGUucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdEZWxpdmVyYWJpbGl0eSBUb29scyc6XG4gICAgICAgICAgZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUgPSB0aWxlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnU0VPJzpcbiAgICAgICAgICBzZW9UaWxlID0gdGlsZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ0JpemlibGUgRGlzY292ZXInOlxuICAgICAgICAgIGJpemlibGVEaXNjb3ZlciA9IHRpbGUucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdCaXppYmxlIFJldmVudWUgUGxhbm5lcic6XG4gICAgICAgICAgYml6aWJsZVJldlBsYW4gPSB0aWxlLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnVGFyZ2V0IEFjY291bnQgUGxhbm5pbmcnOlxuICAgICAgICAgIHRhcmdldEFjY291bnRQbGFuID0gdGlsZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ0xpZmVjeWNsZSBNb2RlbGVyJzpcbiAgICAgICAgICBkZW1vTW9kZWxlciA9IHRpbGUucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwZXJmb3JtYW5jZUluc2lnaHRzVGlsZSkge1xuICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUub3V0ZXJIVE1MID0gcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUub3V0ZXJIVE1MLnJlcGxhY2UoXG4gICAgICAgIGhyZWZNYXRjaCxcbiAgICAgICAgJyBocmVmPVwiJyArIG1rdG9QZXJmb3JtYW5jZUluc2lnaHRzTGluayArICdcIiAnXG4gICAgICApXG5cbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlLmlkKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnUGVyZm9ybWFuY2UgSW5zaWdodHMnLCBhc3NldEFyZWE6ICdQZXJmb3JtYW5jZSBJbnNpZ2h0cycsIGFzc2V0TmFtZTogJ0RlbW8gQXBwJywgYXNzZXRUeXBlOiAnSG9tZSBUaWxlJ30pXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRWwuY2xhc3NOYW1lID1cbiAgICAgICAgJ3g0LWJ0biBta3QzLWhvbWVUaWxlIHg0LWJ0bi1kZWZhdWx0LXNtYWxsIHg0LWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1pY29uLXRleHQtbGVmdCB4NC1idG4tZGVmYXVsdC1zbWFsbC1pY29uLXRleHQtbGVmdCdcbiAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRWwuc3R5bGUgPSAnaGVpZ2h0OiAxNTBweDsnXG4gICAgICBwZXJmb3JtYW5jZUluc2lnaHRzVGlsZUVsLmlkID0gJ3BlcmZvcm1hbmNlSW5zaWdodHNUaWxlJ1xuICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVFbC5pbm5lckhUTUwgPVxuICAgICAgICAnPGVtIGlkPVwicGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUtYnRuV3JhcFwiPjxhIGlkPVwicGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUtYnRuRWxcIiBocmVmPVwiJyArXG4gICAgICAgIG1rdG9QZXJmb3JtYW5jZUluc2lnaHRzTGluayArXG4gICAgICAgICdcIiBjbGFzcz1cIng0LWJ0bi1jZW50ZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIiByb2xlPVwibGlua1wiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4O1wiPjxzcGFuIGlkPVwicGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGUtYnRuSW5uZXJFbFwiIGNsYXNzPVwieDQtYnRuLWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTUwcHg7IGhlaWdodDogMTUwcHg7IGxpbmUtaGVpZ2h0OiAxNTBweDtcIj5QZXJmb3JtYW5jZSBJbnNpZ2h0czwvc3Bhbj48c3BhbiBpZD1cInBlcmZvcm1hbmNlSW5zaWdodHNUaWxlLWJ0bkljb25FbFwiIGNsYXNzPVwieDQtYnRuLWljb24gbWtpMy1tcGktbG9nby1zdmdcIj48L3NwYW4+PC9hPjwvZW0+J1xuXG4gICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRWwsIGNvbnRhaW5lci5jaGlsZE5vZGVzW2NvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdKVxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BlcmZvcm1hbmNlSW5zaWdodHNUaWxlJykub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ1BlcmZvcm1hbmNlIEluc2lnaHRzJywgYXNzZXRBcmVhOiAnUGVyZm9ybWFuY2UgSW5zaWdodHMnLCBhc3NldE5hbWU6ICdEZW1vIEFwcCcsIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSd9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbWFpbEluc2lnaHRzVGlsZSkge1xuICAgICAgbGV0IGFzc2V0TmFtZVxuXG4gICAgICBpZiAob3JpZ0VtYWlsSW5zaWdodHNUaWxlTGluayA9PSBudWxsKSB7XG4gICAgICAgIG9yaWdFbWFpbEluc2lnaHRzVGlsZUxpbmsgPSBlbWFpbEluc2lnaHRzVGlsZS5vdXRlckhUTUwubWF0Y2goaHJlZk1hdGNoKVswXS5zcGxpdCgnXCInKVsxXVxuICAgICAgfVxuXG4gICAgICBpZiAocmVzdG9yZUVtYWlsSW5zaWdodHNUaWxlICYmIG9yaWdFbWFpbEluc2lnaHRzVGlsZUxpbmsgIT0gbnVsbCkge1xuICAgICAgICBlbWFpbEluc2lnaHRzVGlsZS5vdXRlckhUTUwgPSBlbWFpbEluc2lnaHRzVGlsZS5vdXRlckhUTUwucmVwbGFjZShocmVmTWF0Y2gsICcgaHJlZj1cIicgKyBvcmlnRW1haWxJbnNpZ2h0c1RpbGVMaW5rICsgJ1wiICcpXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVtYWlsSW5zaWdodHNUaWxlLmlkKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdFbWFpbCBJbnNpZ2h0cycsIGFzc2V0QXJlYTogJ0VtYWlsIEluc2lnaHRzJywgYXNzZXROYW1lOiAnSG9tZScsIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSd9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbWFpbEluc2lnaHRzVGlsZS5vdXRlckhUTUwgPSBlbWFpbEluc2lnaHRzVGlsZS5vdXRlckhUTUwucmVwbGFjZShocmVmTWF0Y2gsICcgaHJlZj1cIicgKyBta3RvRW1haWxJbnNpZ2h0c0xpbmsgKyAnXCIgJylcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZW1haWxJbnNpZ2h0c1RpbGUuaWQpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ0VtYWlsIEluc2lnaHRzJywgYXNzZXRBcmVhOiAnRW1haWwgSW5zaWdodHMnLCBhc3NldE5hbWU6ICdEZW1vIEFwcCcsIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSd9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBlbWFpbEluc2lnaHRzVGlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGVtYWlsSW5zaWdodHNUaWxlRWwuY2xhc3NOYW1lID1cbiAgICAgICAgJ3g0LWJ0biBta3QzLWhvbWVUaWxlIHg0LWJ0bi1kZWZhdWx0LXNtYWxsIHg0LWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1pY29uLXRleHQtbGVmdCB4NC1idG4tZGVmYXVsdC1zbWFsbC1pY29uLXRleHQtbGVmdCB4LXBhbmVsJ1xuICAgICAgZW1haWxJbnNpZ2h0c1RpbGVFbC5zdHlsZSA9ICdoZWlnaHQ6IDE1MHB4OydcbiAgICAgIGVtYWlsSW5zaWdodHNUaWxlRWwuaWQgPSAnZW1haWxJbnNpZ2h0c1RpbGUnXG4gICAgICBlbWFpbEluc2lnaHRzVGlsZUVsLmlubmVySFRNTCA9XG4gICAgICAgICc8ZW0gaWQ9XCJlbWFpbEluc2lnaHRzVGlsZS1idG5XcmFwXCI+PGEgaWQ9XCJlbWFpbEluc2lnaHRzVGlsZS1idG5FbFwiIGhyZWY9XCInICtcbiAgICAgICAgbWt0b0VtYWlsSW5zaWdodHNMaW5rICtcbiAgICAgICAgJ1wiIGNsYXNzPVwieDQtYnRuLWNlbnRlclwiIHRhcmdldD1cIl9ibGFua1wiIHJvbGU9XCJsaW5rXCIgc3R5bGU9XCJ3aWR0aDogMTUwcHg7IGhlaWdodDogMTUwcHg7XCI+PHNwYW4gaWQ9XCJlbWFpbEluc2lnaHRzVGlsZS1idG5Jbm5lckVsXCIgY2xhc3M9XCJ4NC1idG4taW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDsgbGluZS1oZWlnaHQ6IDE1MHB4O1wiPkVtYWlsIEluc2lnaHRzPC9zcGFuPjxzcGFuIGlkPVwiZW1haWxJbnNpZ2h0c1RpbGUtYnRuSWNvbkVsXCIgY2xhc3M9XCJ4NC1idG4taWNvbiBta2kzLWVtYWlsLWluc2lnaHRzLXN2Z1wiPjwvc3Bhbj48L2E+PC9lbT48ZGl2IGNsYXNzPVwieC1wYW5lbC1id3JhcFwiIGlkPVwiZXh0LWdlbjE2NFwiPjxkaXYgY2xhc3M9XCJ4LXBhbmVsLWJvZHkgeC1wYW5lbC1ib2R5LW5vaGVhZGVyXCIgaWQ9XCJleHQtZ2VuMTY1XCI+PC9kaXY+PC9kaXY+J1xuXG4gICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGVtYWlsSW5zaWdodHNUaWxlRWwsIGNvbnRhaW5lci5jaGlsZE5vZGVzW2NvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdKVxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VtYWlsSW5zaWdodHNUaWxlJykub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ0VtYWlsIEluc2lnaHRzJywgYXNzZXRBcmVhOiAnRW1haWwgSW5zaWdodHMnLCBhc3NldE5hbWU6ICdEZW1vIEFwcCcsIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSd9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkZWxpdmVyYWJpbGl0eVRvb2xzVGlsZSkge1xuICAgICAgZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUub3V0ZXJIVE1MID0gZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUub3V0ZXJIVE1MLnJlcGxhY2UoXG4gICAgICAgIGhyZWZNYXRjaCxcbiAgICAgICAgJyBocmVmPVwiJyArIG1rdG9FbWFpbERlbGl2ZXJhYmlsaXR5VG9vbHNMaW5rICsgJ1wiICdcbiAgICAgIClcblxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUuaWQpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdEZWxpdmVyYWJpbGl0eSBUb29scycsIGFzc2V0QXJlYTogJ0RlbGl2ZXJhYmlsaXR5IFRvb2xzJywgYXNzZXROYW1lOiAnRGVtbyBBY2NvdW50JywgYXNzZXRUeXBlOiAnSG9tZSBUaWxlJ30pXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBkZWxpdmVyYWJpbGl0eVRvb2xzVGlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGRlbGl2ZXJhYmlsaXR5VG9vbHNUaWxlRWwuY2xhc3NOYW1lID1cbiAgICAgICAgJ3g0LWJ0biBta3QzLWhvbWVUaWxlIHg0LWJ0bi1kZWZhdWx0LXNtYWxsIHg0LWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1pY29uLXRleHQtbGVmdCB4NC1idG4tZGVmYXVsdC1zbWFsbC1pY29uLXRleHQtbGVmdCdcbiAgICAgIGRlbGl2ZXJhYmlsaXR5VG9vbHNUaWxlRWwuc3R5bGUgPSAnaGVpZ2h0OiAxNTBweDsnXG4gICAgICBkZWxpdmVyYWJpbGl0eVRvb2xzVGlsZUVsLmlkID0gJ2RlbGl2ZXJhYmlsaXR5VG9vbHNUaWxlJ1xuICAgICAgZGVsaXZlcmFiaWxpdHlUb29sc1RpbGVFbC5pbm5lckhUTUwgPVxuICAgICAgICAnPGVtIGlkPVwiZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUtYnRuV3JhcFwiPjxhIGlkPVwiZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUtYnRuRWxcIiBocmVmPVwiJyArXG4gICAgICAgIG1rdG9FbWFpbERlbGl2ZXJhYmlsaXR5VG9vbHNMaW5rICtcbiAgICAgICAgJ1wiIGNsYXNzPVwieDQtYnRuLWNlbnRlclwiIHRhcmdldD1cIl9ibGFua1wiIHJvbGU9XCJsaW5rXCIgc3R5bGU9XCJ3aWR0aDogMTUwcHg7IGhlaWdodDogMTUwcHg7XCI+PHNwYW4gaWQ9XCJkZWxpdmVyYWJpbGl0eVRvb2xzVGlsZS1idG5Jbm5lckVsXCIgY2xhc3M9XCJ4NC1idG4taW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDsgbGluZS1oZWlnaHQ6IDE1MHB4O1wiPkRlbGl2ZXJhYmlsaXR5IFRvb2xzPC9zcGFuPjxzcGFuIGlkPVwiZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUtYnRuSWNvbkVsXCIgY2xhc3M9XCJ4NC1idG4taWNvbiBta2kzLW1haWwtc2VhbGVkLXN2Z1wiPjwvc3Bhbj48L2E+PC9lbT4nXG5cbiAgICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoZGVsaXZlcmFiaWxpdHlUb29sc1RpbGVFbCwgY29udGFpbmVyLmNoaWxkTm9kZXNbY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV0pXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVsaXZlcmFiaWxpdHlUb29sc1RpbGUnKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnRGVsaXZlcmFiaWxpdHkgVG9vbHMnLCBhc3NldEFyZWE6ICdEZWxpdmVyYWJpbGl0eSBUb29scycsIGFzc2V0TmFtZTogJ0RlbW8gQWNjb3VudCcsIGFzc2V0VHlwZTogJ0hvbWUgVGlsZSd9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYml6aWJsZURpc2NvdmVyICYmIE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4ID09IG1rdG9BY2NvdW50U3RyaW5nMTA2KSB7XG4gICAgICBsZXQgYml6aWJsZURpc2NvdmVyVGlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGJpemlibGVEaXNjb3ZlclRpbGVFbC5jbGFzc05hbWUgPVxuICAgICAgICAneDQtYnRuIG1rdDMtaG9tZVRpbGUgeDQtYnRuLWRlZmF1bHQtc21hbGwgeDQtaWNvbi10ZXh0LWxlZnQgeDQtYnRuLWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1kZWZhdWx0LXNtYWxsLWljb24tdGV4dC1sZWZ0J1xuICAgICAgYml6aWJsZURpc2NvdmVyVGlsZUVsLnN0eWxlID0gJ2hlaWdodDogMTUwcHg7J1xuICAgICAgYml6aWJsZURpc2NvdmVyVGlsZUVsLmlkID0gJ2JpemlibGVEaXNjb3ZlclRvb2xzVGlsZSdcbiAgICAgIGJpemlibGVEaXNjb3ZlclRpbGVFbC5pbm5lckhUTUwgPVxuICAgICAgICAnPGVtIGlkPVwiYml6aWJsZURpc2NvdmVyVG9vbHNUaWxlLWJ0bldyYXBcIj48YSBpZD1cImJpemlibGVEaXNjb3ZlclRvb2xzVGlsZS1idG5FbFwiIGhyZWY9XCInICtcbiAgICAgICAgbWt0b0JpemlibGVEaXNjb3ZlckxpbmsgK1xuICAgICAgICAnXCIgY2xhc3M9XCJ4NC1idG4tY2VudGVyXCIgdGFyZ2V0PVwiX2JsYW5rXCIgcm9sZT1cImxpbmtcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDtcIj48c3BhbiBpZD1cImJpemlibGVEaXNjb3ZlclRvb2xzVGlsZS1idG5Jbm5lckVsXCIgY2xhc3M9XCJ4NC1idG4taW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDsgbGluZS1oZWlnaHQ6IDE1MHB4O1wiPkJpemlibGUgRGlzY292ZXI8L3NwYW4+PHNwYW4gaWQ9XCJiaXppYmxlRGlzY292ZXJUb29sc1RpbGUtYnRuSWNvbkVsXCIgY2xhc3M9XCJ4NC1idG4taWNvblwiPjxpbWcgc3JjPVwiaHR0cHM6Ly93d3cuYml6aWJsZS5jb20vaHMtZnMvaHViLzIzMzUzNy9maWxlLTI0OTU4MTk0MTEtcG5nL2JpemlibGUtbG9nby1yZXRpbmEucG5nP3Q9MTUzMzU4MTk2NTY5OSZhbXA7d2lkdGg9Mjc3JmFtcDtuYW1lPWJpemlibGUtbG9nby1yZXRpbmEucG5nXCIgc3R5bGU9XCJ3aWR0aDogMTQ1cHg7bWFyZ2luLWxlZnQ6NXB4O21hcmdpbi10b3A6MzBweDtcIj48L3NwYW4+PC9hPjwvZW0+J1xuXG4gICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGJpemlibGVEaXNjb3ZlclRpbGVFbCwgY29udGFpbmVyLmNoaWxkTm9kZXNbY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV0pXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYml6aWJsZURpc2NvdmVyVG9vbHNUaWxlJykub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ0JpemlibGVEaXNjb3ZlcicsIGFzc2V0QXJlYTogJ0JpemlibGVEaXNjb3ZlcicsIGFzc2V0TmFtZTogJ0RlbW8gMTA2IEFjY291bnQnLCBhc3NldFR5cGU6ICdIb21lIFRpbGUnfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJpemlibGVSZXZQbGFuICYmIE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4ID09IG1rdG9BY2NvdW50U3RyaW5nMTA2KSB7XG4gICAgICBsZXQgYml6aWJsZVJldlBsYW5UaWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgYml6aWJsZVJldlBsYW5UaWxlRWwuY2xhc3NOYW1lID1cbiAgICAgICAgJ3g0LWJ0biBta3QzLWhvbWVUaWxlIHg0LWJ0bi1kZWZhdWx0LXNtYWxsIHg0LWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1pY29uLXRleHQtbGVmdCB4NC1idG4tZGVmYXVsdC1zbWFsbC1pY29uLXRleHQtbGVmdCdcbiAgICAgIGJpemlibGVSZXZQbGFuVGlsZUVsLnN0eWxlID0gJ2hlaWdodDogMTUwcHg7J1xuICAgICAgYml6aWJsZVJldlBsYW5UaWxlRWwuaWQgPSAnYml6aWJsZVJldlBsYW5UaWxlJ1xuICAgICAgYml6aWJsZVJldlBsYW5UaWxlRWwuaW5uZXJIVE1MID1cbiAgICAgICAgJzxlbSBpZD1cImJpemlibGVSZXZQbGFuVGlsZS1idG5XcmFwXCI+PGEgaWQ9XCJiaXppYmxlUmV2UGxhblRpbGUtYnRuRWxcIiBocmVmPVwiJyArXG4gICAgICAgIG1rdG9CaXppYmxlUmV2UGxhbkxpbmsgK1xuICAgICAgICAnXCIgY2xhc3M9XCJ4NC1idG4tY2VudGVyXCIgdGFyZ2V0PVwiX2JsYW5rXCIgcm9sZT1cImxpbmtcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDtcIj48c3BhbiBpZD1cImJpemlibGVSZXZQbGFuVGlsZS1idG5Jbm5lckVsXCIgY2xhc3M9XCJ4NC1idG4taW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxNTBweDsgaGVpZ2h0OiAxNTBweDsgbGluZS1oZWlnaHQ6IDE1MHB4O1wiPkJpemlibGUgUmV2ZW51ZSBQbGFubmVyPC9zcGFuPjxzcGFuIGlkPVwiYml6aWJsZVJldlBsYW5UaWxlLWJ0bkljb25FbFwiIGNsYXNzPVwieDQtYnRuLWljb25cIj48aW1nIHNyYz1cImh0dHBzOi8vd3d3LmJpemlibGUuY29tL2hzLWZzL2h1Yi8yMzM1MzcvZmlsZS0yNDk1ODE5NDExLXBuZy9iaXppYmxlLWxvZ28tcmV0aW5hLnBuZz90PTE1MzM1ODE5NjU2OTkmYW1wO3dpZHRoPTI3NyZhbXA7bmFtZT1iaXppYmxlLWxvZ28tcmV0aW5hLnBuZ1wiIHN0eWxlPVwid2lkdGg6IDE0NXB4O21hcmdpbi1sZWZ0OjVweDttYXJnaW4tdG9wOjMwcHg7XCI+PC9zcGFuPjwvYT48L2VtPidcblxuICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShiaXppYmxlUmV2UGxhblRpbGVFbCwgY29udGFpbmVyLmNoaWxkTm9kZXNbY29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV0pXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYml6aWJsZVJldlBsYW5UaWxlJykub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ0JpemlibGUgUmV2IFBsYW4gJywgYXNzZXRBcmVhOiAnQml6aWJsZSBSZXYgUGxhbicsIGFzc2V0TmFtZTogJ0RlbW8gMTA2IEFjY291bnQnLCBhc3NldFR5cGU6ICdIb21lIFRpbGUnfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWRlbW9Nb2RlbGVyICYmIE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4ID09IG1rdG9BY2NvdW50U3RyaW5nMTA2KSB7XG4gICAgICBsZXQgZGVtb01vZGVsZXJUaWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgZGVtb01vZGVsZXJUaWxlRWwuY2xhc3NOYW1lID1cbiAgICAgICAgJ3g0LWJ0biBta3QzLWhvbWVUaWxlIHg0LWJ0bi1kZWZhdWx0LXNtYWxsIHg0LWljb24tdGV4dC1sZWZ0IHg0LWJ0bi1pY29uLXRleHQtbGVmdCB4NC1idG4tZGVmYXVsdC1zbWFsbC1pY29uLXRleHQtbGVmdCdcbiAgICAgIGRlbW9Nb2RlbGVyVGlsZUVsLnN0eWxlID0gJ2hlaWdodDogMTUwcHg7J1xuICAgICAgZGVtb01vZGVsZXJUaWxlRWwuaWQgPSAnZGVtb01vZGVsZXJUaWxlJ1xuICAgICAgZGVtb01vZGVsZXJUaWxlRWwuaW5uZXJIVE1MID1cbiAgICAgICAgJzxlbSBpZD1cImRlbW9Nb2RlbGVyVGlsZS1idG5XcmFwXCI+PGEgaWQ9XCJkZW1vTW9kZWxlclRpbGUtYnRuRWxcIiBocmVmPVwiJyArXG4gICAgICAgIGRlbW9Nb2RlbGVyTGluayArXG4gICAgICAgICdcIiBjbGFzcz1cIng0LWJ0bi1jZW50ZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIiByb2xlPVwibGlua1wiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4O1wiPjxzcGFuIGlkPVwiZGVtb01vZGVsZXJUaWxlLWJ0bklubmVyRWxcIiBjbGFzcz1cIng0LWJ0bi1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDE1MHB4OyBoZWlnaHQ6IDE1MHB4OyBsaW5lLWhlaWdodDogMTUwcHg7XCI+TGlmZWN5Y2xlIE1vZGVsZXI8L3NwYW4+PHNwYW4gaWQ9XCJkZW1vTW9kZWxlclRpbGUtYnRuSWNvbkVsXCIgY2xhc3M9XCJ4NC1idG4taWNvbiBta2kzLXN1Y2Nlc3MtcGF0aC1zdmdcIj48L3NwYW4+PC9hPjwvZW0+J1xuXG4gICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGRlbW9Nb2RlbGVyVGlsZUVsLCBjb250YWluZXIuY2hpbGROb2Rlc1tjb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggLSAxXSlcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZW1vTW9kZWxlclRpbGUnKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnRGVtbyBNb2RlbGVyICcsIGFzc2V0QXJlYTogJ0RlbW8gTW9kZWxlcicsIGFzc2V0TmFtZTogJ0RlbW8gMTA2IEFjY291bnQnLCBhc3NldFR5cGU6ICdIb21lIFRpbGUnfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc2VvVGlsZSkge1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc2VvVGlsZS5pZCkub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ1NFTycsIGFzc2V0QXJlYTogJ1NFTycsIGFzc2V0TmFtZTogJ0hvbWUnLCBhc3NldFR5cGU6ICdIb21lIFRpbGUnfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBoaWRkZW5UaWxlMSA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdkaXZbcm9sZT1cInByZXNlbnRhdGlvblwiXScpXG4gICAgaGlkZGVuVGlsZTIgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignZGl2W2NsYXNzPVwieC1wYW5lbC1id3JhcCB4LXBhbmVsXCJdJylcbiAgICBpZiAoaGlkZGVuVGlsZTEpIHtcbiAgICAgIGhpZGRlblRpbGUxLnJlbW92ZSgpXG4gICAgfVxuICAgIGlmIChoaWRkZW5UaWxlMikge1xuICAgICAgaGlkZGVuVGlsZTIucmVtb3ZlKClcbiAgICB9XG4gIH0gZWxzZSBpZiAob3ZlcnJpZGVUaWxlVGltZXJDb3VudCkge1xuICAgIG92ZXJyaWRlVGlsZVRpbWVyQ291bnQgPSBmYWxzZVxuICAgIHNldFRpbWVvdXQoQVBQLm92ZXJyaWRlSG9tZVRpbGVzLCAyMDAwKVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gb3ZlcnJpZGVzIHRoZSB0YXJnZXQgbGlua3MgZm9yIHRoZSBFbWFpbCBJbnNpZ2h0cyBhbmQgRGVsaXZlcmFiaWxpdHlcbiAqICBUb29scyBTdXBlcmJhbGwgbWVudSBpdGVtcyBpZiB0aGV5IGV4aXN0LCBvdGhlcndpc2UgaXQgY3JlYXRlcyB0aGUgbWVudSBpdGVtcy4gQnlcbiAqICBkZWZhdWx0LCB0aGVzZSBtZW51IGl0ZW1zIHVzZXMgU1NPIHRvIGxvZ2luLCBob3dldmVyLCB3ZSBvbmx5IGhhdmUgb25lIGluc3RhbmNlIGZvclxuICogIGVhY2ggaXRlbSB0aGF0IGNvbnRhaW5zIHVzYWJsZSBkZW1vIGRhdGEsIHNvIHRoZSBwbHVnaW4gZGlyZWN0cyBwZW9wbGUgaW50byB0aGF0XG4gKiAgaW5zdGFuY2UuIFRoaXMgZnVuY3Rpb24gZGlyZWN0cyB1c2VycyB0byB0aGUgMjUwb2sgbG9naW4gcGFnZSB3aGVyZSB0aGVcbiAqICBkZWxpdmVyYWJpbGl0eS10b29scy5qcyBzY3JpcHQgd2lsbCBhdXRvbWF0aWNhbGx5IGxvZ2luIGFuZCBoaWRlIHRoZSBuZWNlc3NhcnlcbiAqICBidXR0b25zLiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBhbHNvIHJ1biBpbnNpZGUgb2YgU0Mgc2FuZGJveCBpbnN0YW5jZXMuXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5vdmVycmlkZVN1cGVyYmFsbE1lbnVJdGVtcyA9IGZ1bmN0aW9uIChyZXN0b3JlRW1haWxJbnNpZ2h0c01lbnVJdGVtKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE92ZXJyaWRpbmc6IFN1cGVyYmFsbCBNZW51IEl0ZW1zJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0UGFnZS5zaG93U3VwZXJNZW51JykpIHtcbiAgICBNa3RQYWdlLnNob3dTdXBlck1lbnUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IE92ZXJyaWRlIFN1cGVyYmFsbCBNZW51IEl0ZW1zJylcbiAgICAgIGxldCBsb2dvRWwgPSBFeHQuZ2V0KEV4dC5Eb21RdWVyeS5zZWxlY3ROb2RlKCcubWt0LWFwcC1sb2dvJykpLFxuICAgICAgICB7bWVudX0gPSBsb2dvRWwsXG4gICAgICAgIG1lbnVUb3AgPSA1NVxuXG4gICAgICBpZiAoIW1lbnUpIHtcbiAgICAgICAgbWVudSA9IGxvZ29FbC5tZW51ID0gRXh0NC53aWRnZXQoJ2FwcE5hdmlnYXRpb25NZW51Jywge1xuICAgICAgICAgIGxpc3RlbmVyczoge1xuICAgICAgICAgICAgYm94cmVhZHk6IGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgICAgICAgICAgIGxldCBsb2dvUmVnaW9uID0gbG9nb0VsLmdldFJlZ2lvbigpXG5cbiAgICAgICAgICAgICAgLy8gc2hpZnQgb3V0IG9mIHRoZSBiYWxsIHdheVxuICAgICAgICAgICAgICBpZiAobG9nb1JlZ2lvbi5ib3R0b20gPiBtZW51VG9wKSB7XG4gICAgICAgICAgICAgICAgdmlldy5zZXRCb2R5U3R5bGUoJ3BhZGRpbmctdG9wJywgbG9nb1JlZ2lvbi5ib3R0b20gLSBtZW51VG9wICsgMTAgKyAncHgnKVxuICAgICAgICAgICAgICAgIHZpZXcudXBkYXRlTGF5b3V0KClcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIHByZXZlbnQgbGF5ZXJpbmcgaW4gZnJvbnQgb2YgdGhlIGxvZ29cbiAgICAgICAgICAgICAgbWVudS5zZXRaSW5kZXgobG9nb0VsLmdldFN0eWxlKCd6SW5kZXgnKSAtIDUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmVmb3JlcmVuZGVyOiBmdW5jdGlvbiAodmlldykge1xuICAgICAgICAgICAgICB2aWV3LmFkZENscyh2aWV3LmNvbXBvbmVudENscyArICctaGlkZGVuJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93OiBmdW5jdGlvbiAodmlldykge1xuICAgICAgICAgICAgICB2aWV3LnJlbW92ZUNscyh2aWV3LmNvbXBvbmVudENscyArICctaGlkZGVuJylcblxuICAgICAgICAgICAgICBsb2dvRWwuaWdub3JlTmV4dENsaWNrID0gdHJ1ZVxuICAgICAgICAgICAgICBsb2dvRWwucmVtb3ZlQ2xhc3MobG9nb0VsLmF0dGVudGlvbkNscylcblxuICAgICAgICAgICAgICBpZiAoIU1rdFBhZ2Uuc2F2ZWRTdGF0ZS5pc1VzZWRTdXBlck1lbnUpIHtcbiAgICAgICAgICAgICAgICBNa3RQYWdlLnNhdmVkU3RhdGUuaXNVc2VkU3VwZXJNZW51ID0gdHJ1ZVxuXG4gICAgICAgICAgICAgICAgTWt0U2Vzc2lvbi5hamF4UmVxdWVzdCgndXNlci9zYXZlVXNlclByZWYnLCB7XG4gICAgICAgICAgICAgICAgICBzZXJpYWxpemVQYXJtczoge1xuICAgICAgICAgICAgICAgICAgICBrZXk6ICdpc1VzZWRTdXBlck1lbnUnLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBNa3RQYWdlLnNhdmVkU3RhdGUuaXNVc2VkU3VwZXJNZW51XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJlZm9yZWhpZGU6IGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgICAgICAgICAgIHZpZXcuYWRkQ2xzKHZpZXcuY29tcG9uZW50Q2xzICsgJy1oaWRkZW4nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBsb2dvRWwuaWdub3JlTmV4dENsaWNrID0gZmFsc2VcbiAgICAgICAgICAgICAgfS5kZWZlcigyNTApKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgaWYgKHR5cGVvZiBtZW51ICE9PSAndW5kZWZpbmVkJyAmJiBtZW51ICYmIG1lbnUuaXRlbXMgJiYgbWVudS5pdGVtcy5pdGVtcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFdvcmtpbmc6IE92ZXJyaWRlIFN1cGVyYmFsbCBNZW51IEl0ZW1zJylcbiAgICAgICAgICBsZXQgaWksXG4gICAgICAgICAgICBjdXJyU3VwZXJCYWxsTWVudUl0ZW0sXG4gICAgICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzTWVudUl0ZW0sXG4gICAgICAgICAgICBlbWFpbEluc2lnaHRzTWVudUl0ZW0sXG4gICAgICAgICAgICBkZWxpdmVyYWJpbGl0eVRvb2xzTWVudUl0ZW0sXG4gICAgICAgICAgICBzZW9NZW51SXRlbSxcbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtXG5cbiAgICAgICAgICBmb3IgKGlpID0gMDsgaWkgPCBtZW51Lml0ZW1zLml0ZW1zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgY3VyclN1cGVyQmFsbE1lbnVJdGVtID0gbWVudS5pdGVtcy5pdGVtc1tpaV1cblxuICAgICAgICAgICAgaWYgKGN1cnJTdXBlckJhbGxNZW51SXRlbS50ZXh0ID09ICdQZXJmb3JtYW5jZSBJbnNpZ2h0cycpIHtcbiAgICAgICAgICAgICAgaWYgKGN1cnJTdXBlckJhbGxNZW51SXRlbS5oaWRkZW4gIT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNNZW51SXRlbSA9IGN1cnJTdXBlckJhbGxNZW51SXRlbVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJTdXBlckJhbGxNZW51SXRlbS50ZXh0ID09ICdFbWFpbCBJbnNpZ2h0cycpIHtcbiAgICAgICAgICAgICAgZW1haWxJbnNpZ2h0c01lbnVJdGVtID0gY3VyclN1cGVyQmFsbE1lbnVJdGVtXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJTdXBlckJhbGxNZW51SXRlbS50ZXh0ID09ICdEZWxpdmVyYWJpbGl0eSBUb29scycpIHtcbiAgICAgICAgICAgICAgZGVsaXZlcmFiaWxpdHlUb29sc01lbnVJdGVtID0gY3VyclN1cGVyQmFsbE1lbnVJdGVtXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJTdXBlckJhbGxNZW51SXRlbS50ZXh0ID09ICdTRU8nKSB7XG4gICAgICAgICAgICAgIHNlb01lbnVJdGVtID0gY3VyclN1cGVyQmFsbE1lbnVJdGVtXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHBlcmZvcm1hbmNlSW5zaWdodHNNZW51SXRlbSkge1xuICAgICAgICAgICAgbGV0IG9yaWdNZW51SXRlbU9uQ2xpY2sgPSBwZXJmb3JtYW5jZUluc2lnaHRzTWVudUl0ZW0ub25DbGlja1xuXG4gICAgICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzTWVudUl0ZW0ub25DbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgIG9yaWdNZW51SXRlbU9uQ2xpY2suYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnUGVyZm9ybWFuY2UgSW5zaWdodHMnLCBhc3NldEFyZWE6ICdQZXJmb3JtYW5jZSBJbnNpZ2h0cycsIGFzc2V0TmFtZTogJ0RlbW8gQXBwJywgYXNzZXRUeXBlOiAnSG9tZSBUaWxlJ30pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzTWVudUl0ZW0uaHJlZiA9IG1rdG9QZXJmb3JtYW5jZUluc2lnaHRzTGlua1xuICAgICAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c01lbnVJdGVtLnVwZGF0ZSgpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtID0gbWVudS5pdGVtcy5pdGVtc1s0XS5jbG9uZUNvbmZpZygpXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5zZXRUZXh0KCdQZXJmb3JtYW5jZSBJbnNpZ2h0cycpXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5zZXRJY29uQ2xzKCdta2kzLW1waS1sb2dvLXN2ZycpXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5ocmVmID0gbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5ocmVmVGFyZ2V0ID0gJ19ibGFuaydcblxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0ub25DbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdQZXJmb3JtYW5jZSBJbnNpZ2h0cycsIGFzc2V0QXJlYTogJ1BlcmZvcm1hbmNlIEluc2lnaHRzJywgYXNzZXROYW1lOiAnRGVtbyBBcHAnLCBhc3NldFR5cGU6ICdIb21lIFRpbGUnfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0udXBkYXRlKClcbiAgICAgICAgICAgIG1lbnUuYWRkKGNsb25lZE1lbnVJdGVtKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChlbWFpbEluc2lnaHRzTWVudUl0ZW0pIHtcbiAgICAgICAgICAgIGlmIChvcmlnRW1haWxJbnNpZ2h0c01lbnVJdGVtTGluayA9PSBudWxsKSB7XG4gICAgICAgICAgICAgIG9yaWdFbWFpbEluc2lnaHRzTWVudUl0ZW1MaW5rID0gZW1haWxJbnNpZ2h0c01lbnVJdGVtLmhyZWZcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlc3RvcmVFbWFpbEluc2lnaHRzTWVudUl0ZW0gJiYgb3JpZ0VtYWlsSW5zaWdodHNNZW51SXRlbUxpbmsgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBlbWFpbEluc2lnaHRzTWVudUl0ZW0uaHJlZiA9IG9yaWdFbWFpbEluc2lnaHRzTWVudUl0ZW1MaW5rXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBlbWFpbEluc2lnaHRzTWVudUl0ZW0uaHJlZiA9IG1rdG9FbWFpbEluc2lnaHRzTGlua1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW1haWxJbnNpZ2h0c01lbnVJdGVtLnVwZGF0ZSgpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtID0gbWVudS5pdGVtcy5pdGVtc1s0XS5jbG9uZUNvbmZpZygpXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5zZXRUZXh0KCdFbWFpbCBJbnNpZ2h0cycpXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5zZXRJY29uQ2xzKCdta2kzLWVtYWlsLWluc2lnaHRzLXN2ZycpXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5ocmVmID0gbWt0b0VtYWlsSW5zaWdodHNMaW5rXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5ocmVmVGFyZ2V0ID0gJ19ibGFuaydcbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtLnVwZGF0ZSgpXG4gICAgICAgICAgICBtZW51LmFkZChjbG9uZWRNZW51SXRlbSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZGVsaXZlcmFiaWxpdHlUb29sc01lbnVJdGVtKSB7XG4gICAgICAgICAgICBsZXQgb3JpZ01lbnVJdGVtT25DbGljayA9IGRlbGl2ZXJhYmlsaXR5VG9vbHNNZW51SXRlbS5vbkNsaWNrXG5cbiAgICAgICAgICAgIGRlbGl2ZXJhYmlsaXR5VG9vbHNNZW51SXRlbS5vbkNsaWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgb3JpZ01lbnVJdGVtT25DbGljay5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdEZWxpdmVyYWJpbGl0eSBUb29scycsIGFzc2V0QXJlYTogJ0RlbGl2ZXJhYmlsaXR5IFRvb2xzJywgYXNzZXROYW1lOiAnRGVtbyBBY2NvdW50JywgYXNzZXRUeXBlOiAnSG9tZSBUaWxlJ30pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxpdmVyYWJpbGl0eVRvb2xzTWVudUl0ZW0uaHJlZiA9IG1rdG9FbWFpbERlbGl2ZXJhYmlsaXR5VG9vbHNMaW5rXG4gICAgICAgICAgICBkZWxpdmVyYWJpbGl0eVRvb2xzTWVudUl0ZW0udXBkYXRlKClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0gPSBtZW51Lml0ZW1zLml0ZW1zWzNdLmNsb25lQ29uZmlnKClcbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtLnNldFRleHQoJ0RlbGl2ZXJhYmlsaXR5IFRvb2xzJylcbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtLnNldEljb25DbHMoJ21raTMtbWFpbC1zZWFsZWQtc3ZnJylcbiAgICAgICAgICAgIGNsb25lZE1lbnVJdGVtLmhyZWYgPSBta3RvRW1haWxEZWxpdmVyYWJpbGl0eVRvb2xzTGlua1xuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0uaHJlZlRhcmdldCA9ICdfYmxhbmsnXG4gICAgICAgICAgICBjbG9uZWRNZW51SXRlbS5vbkNsaWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ0RlbGl2ZXJhYmlsaXR5IFRvb2xzJywgYXNzZXRBcmVhOiAnRGVsaXZlcmFiaWxpdHkgVG9vbHMnLCBhc3NldE5hbWU6ICdEZW1vIEFjY291bnQnLCBhc3NldFR5cGU6ICdIb21lIFRpbGUnfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2xvbmVkTWVudUl0ZW0udXBkYXRlKClcbiAgICAgICAgICAgIG1lbnUuYWRkKGNsb25lZE1lbnVJdGVtKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzZW9NZW51SXRlbSkge1xuICAgICAgICAgICAgbGV0IG9yaWdNZW51SXRlbU9uQ2xpY2sgPSBzZW9NZW51SXRlbS5vbkNsaWNrXG5cbiAgICAgICAgICAgIHNlb01lbnVJdGVtLm9uQ2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICBvcmlnTWVudUl0ZW1PbkNsaWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ1NFTycsIGFzc2V0QXJlYTogJ1NFTycsIGFzc2V0TmFtZTogJ0hvbWUnLCBhc3NldFR5cGU6ICdIb21lIFRpbGUnfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFtZW51LmlzVmlzaWJsZSgpICYmICFsb2dvRWwuaWdub3JlTmV4dENsaWNrKSB7XG4gICAgICAgIC8vIHBvc2l0aW9uIGJlbG93IGFwcCBiYXJcbiAgICAgICAgbWVudS5zaG93QXQoMCwgbWVudVRvcClcblxuICAgICAgICAvLyBwcmV2ZW50IGxheWVyaW5nIGluIGZyb250IG9mIHRoZSBsb2dvXG4gICAgICAgIG1lbnUuc2V0WkluZGV4KGxvZ29FbC5nZXRTdHlsZSgnekluZGV4JykgLSA1KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIG92ZXJyaWRlcyB0aGUgdGFyZ2V0IGxpbmsgb2YgdGhlIEFuYWx5dGljcyB0aWxlcyBpbiBvcmRlciB0byBsaW5rIHRvXG4gKiAgdGhlIEdyb3VwIFJlcG9ydHMgd2l0aGluIHRoZSBEZWZhdWx0IFdvcmtzcGFjZSBhcyB0aG9zZSByZXBvcnQgc2V0dGluZ3MgYXJlIHNhdmVkXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5vdmVycmlkZUFuYWx5dGljc1RpbGVzID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBPdmVycmlkaW5nOiBBbmFseXRpY3MgVGlsZXMnKVxuICBsZXQgaXNBbmFseXRpY3NUaWxlcyA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKFxuICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RDYW52YXMuZ2V0QWN0aXZlVGFiJykgJiZcbiAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSAmJlxuICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZyAmJlxuICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZy5ta3QzWFR5cGUgJiZcbiAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcuYWNjZXNzWm9uZUlkICYmXG4gICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4JylcbiAgICApIHtcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzQW5hbHl0aWNzVGlsZXMpXG4gICAgICBpZiAoXG4gICAgICAgIE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4LnNlYXJjaChta3RvQWNjb3VudFN0cmluZ3NNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZy5ta3QzWFR5cGUgPT0gJ2FuYWx5dGljc0hvbWUnICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcuYWNjZXNzWm9uZUlkID09IG1rdG9EZWZhdWx0V29ya3NwYWNlSWQgJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmVsICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20gJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmVsLmRvbS5jaGlsZE5vZGVzICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20uY2hpbGROb2Rlc1swXSAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwuZG9tLmNoaWxkTm9kZXNbMF0uY2hpbGROb2RlcyAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwuZG9tLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1sxXSAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwuZG9tLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1sxXS5jaGlsZE5vZGVzICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzFdLmNoaWxkTm9kZXNbMF0gJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmVsLmRvbS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzFdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXSAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwuZG9tLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1sxXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2RlcyAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwuZG9tLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1sxXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXSAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuZWwuZG9tLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1sxXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5lbC5kb20uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzFdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0gJiZcbiAgICAgICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmVsLmRvbS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzXG4gICAgICApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBBbmFseXRpY3MgVGlsZXMnKVxuICAgICAgICBsZXQgY29udGFpbmVyID0gTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmVsLmRvbS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMV0uY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXNbMF0uY2hpbGROb2Rlc1swXSxcbiAgICAgICAgICB0aWxlcyA9IGNvbnRhaW5lci5jaGlsZE5vZGVzLFxuICAgICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlRXhpc3RzID0gZmFsc2VcblxuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgdGlsZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgaWYgKHRpbGVzW2lpXSAmJiB0aWxlc1tpaV0ub3V0ZXJIVE1MICYmIHRpbGVzW2lpXS50ZXh0Q29udGVudCkge1xuICAgICAgICAgICAgbGV0IHRpbGVIVE1MID0gdGlsZXNbaWldLm91dGVySFRNTCxcbiAgICAgICAgICAgICAgaHJlZk1hdGNoXG4gICAgICAgICAgICBzd2l0Y2ggKHRpbGVzW2lpXS50ZXh0Q29udGVudCkge1xuICAgICAgICAgICAgICBjYXNlICdQZXJmb3JtYW5jZSBJbnNpZ2h0cyc6XG4gICAgICAgICAgICAgICAgaHJlZk1hdGNoID0gbmV3IFJlZ0V4cCgnIGhyZWY9XCJbXlwiXSpcIiAnLCAnZycpXG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9IHRpbGVIVE1MLnJlcGxhY2UoaHJlZk1hdGNoLCAnIGhyZWY9XCInICsgbWt0b1BlcmZvcm1hbmNlSW5zaWdodHNMaW5rICsgJ1wiICcpXG4gICAgICAgICAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVFeGlzdHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnRW1haWwgUGVyZm9ybWFuY2UnOlxuICAgICAgICAgICAgICAgIHRpbGVzW2lpXS5vdXRlckhUTUwgPSAnPGEgaHJlZj1cIi8jJyArIG1rdG9FbWFpbFBlcmZvcm1hbmNlUmVwb3J0ICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ1Blb3BsZSBQZXJmb3JtYW5jZSc6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b1Blb3BsZVBlcmZvcm1hbmNlUmVwb3J0ICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ1dlYiBQYWdlIEFjdGl2aXR5JzpcbiAgICAgICAgICAgICAgICB0aWxlc1tpaV0ub3V0ZXJIVE1MID0gJzxhIGhyZWY9XCIvIycgKyBta3RvV2ViUGFnZUFjdGl2aXR5UmVwb3J0ICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ09wcG9ydHVuaXR5IEluZmx1ZW5jZSBBbmFseXplcic6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b09wcG9ydHVuaXR5SW5mbHVlbmNlQW5hbHl6ZXIgKyAnXCI+JyArIHRpbGVIVE1MICsgJzwvYT4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnUHJvZ3JhbSBBbmFseXplcic6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b1Byb2dyYW1BbmFseXplciArICdcIj4nICsgdGlsZUhUTUwgKyAnPC9hPidcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdTdWNjZXNzIFBhdGggQW5hbHl6ZXInOlxuICAgICAgICAgICAgICAgIHRpbGVzW2lpXS5vdXRlckhUTUwgPSAnPGEgaHJlZj1cIi8jJyArIG1rdG9TdWNjZXNzUGF0aEFuYWx5emVyICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ0VtYWlsIEluc2lnaHRzJzpcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3RvcmVFbWFpbEluc2lnaHRzKSB7XG4gICAgICAgICAgICAgICAgICBocmVmTWF0Y2ggPSBuZXcgUmVnRXhwKCcgaHJlZj1cIlteXCJdKlwiICcsICdnJylcbiAgICAgICAgICAgICAgICAgIHRpbGVzW2lpXS5vdXRlckhUTUwgPSB0aWxlSFRNTC5yZXBsYWNlKGhyZWZNYXRjaCwgJyBocmVmPVwiJyArIG1rdG9FbWFpbEluc2lnaHRzTGluayArICdcIiAnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdFbmdhZ2VtZW50IFN0cmVhbSBQZXJmb3JtYW5jZSc6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b0VuZ2FnbWVudFN0cmVhbVBlcmZvcm1hY2VSZXBvcnQgKyAnXCI+JyArIHRpbGVIVE1MICsgJzwvYT4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnUHJvZ3JhbSBQZXJmb3JtYW5jZSc6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b1Byb2dyYW1QZXJmb3JtYW5jZVJlcG9ydCArICdcIj4nICsgdGlsZUhUTUwgKyAnPC9hPidcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdFbWFpbCBMaW5rIFBlcmZvcm1hbmNlJzpcbiAgICAgICAgICAgICAgICB0aWxlc1tpaV0ub3V0ZXJIVE1MID0gJzxhIGhyZWY9XCIvIycgKyBta3RvRW1haWxMaW5rUGVyZm9ybWFuY2VSZXBvcnQgKyAnXCI+JyArIHRpbGVIVE1MICsgJzwvYT4nXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgY2FzZSAnUGVvcGxlIEJ5IFJldmVudWUgU3RhZ2UnOlxuICAgICAgICAgICAgICAgIHRpbGVzW2lpXS5vdXRlckhUTUwgPSAnPGEgaHJlZj1cIi8jJyArIG1rdG9QZW9wbGVCeVJldmVudWVTdGFnZVJlcG9ydCArICdcIj4nICsgdGlsZUhUTUwgKyAnPC9hPidcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdMYW5kaW5nIFBhZ2UgUGVyZm9ybWFuY2UnOlxuICAgICAgICAgICAgICAgIHRpbGVzW2lpXS5vdXRlckhUTUwgPSAnPGEgaHJlZj1cIi8jJyArIG1rdG9MYW5kaW5nUGFnZVBlcmZvcm1hbmNlUmVwb3J0ICsgJ1wiPicgKyB0aWxlSFRNTCArICc8L2E+J1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIGNhc2UgJ1Blb3BsZSBCeSBTdGF0dXMnOlxuICAgICAgICAgICAgICAgIHRpbGVzW2lpXS5vdXRlckhUTUwgPSAnPGEgaHJlZj1cIi8jJyArIG1rdG9QZW9wbGVCeVN0YXR1c1JlcG9ydCArICdcIj4nICsgdGlsZUhUTUwgKyAnPC9hPidcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdDb21wYW55IFdlYiBBY3Rpdml0eSc6XG4gICAgICAgICAgICAgICAgdGlsZXNbaWldLm91dGVySFRNTCA9ICc8YSBocmVmPVwiLyMnICsgbWt0b0NvbXBhbnlXZWJBY3Rpdml0eVJlcG9ydCArICdcIj4nICsgdGlsZUhUTUwgKyAnPC9hPidcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdTYWxlcyBJbnNpZ2h0IEVtYWlsIFBlcmZvcm1hbmNlJzpcbiAgICAgICAgICAgICAgICB0aWxlc1tpaV0ub3V0ZXJIVE1MID0gJzxhIGhyZWY9XCIvIycgKyBta3RvU2FsZXNJbnNpZ2h0RW1haWxQZXJmb3JtYW5jZVJlcG9ydCArICdcIj4nICsgdGlsZUhUTUwgKyAnPC9hPidcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVFeGlzdHMpIHtcbiAgICAgICAgICBsZXQgcGVyZm9ybWFuY2VJbnNpZ2h0c1RpbGVPdXRlckhUTUwgPVxuICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIng0LWJ0biBta3QzLWFuYWx5dGljc1RpbGUgbWt0My1hbmFseXRpY3NIb21lVGlsZSB4NC1idG4tZGVmYXVsdC1zbWFsbCB4NC1pY29uLXRleHQtbGVmdCB4NC1idG4taWNvbi10ZXh0LWxlZnQgeDQtYnRuLWRlZmF1bHQtc21hbGwtaWNvbi10ZXh0LWxlZnRcIiBpZD1cImFuYWx5dGljc1RpbGUtMTA2OFwiPjxlbSBpZD1cImFuYWx5dGljc1RpbGUtMTA2OC1idG5XcmFwXCI+PGEgaWQ9XCJhbmFseXRpY3NUaWxlLTEwNjgtYnRuRWxcIiBocmVmPVwiJyArXG4gICAgICAgICAgICAgIG1rdG9QZXJmb3JtYW5jZUluc2lnaHRzTGluayArXG4gICAgICAgICAgICAgICdcIiBjbGFzcz1cIng0LWJ0bi1jZW50ZXJcIiB0YXJnZXQ9XCJfYmxhbmtcIiByb2xlPVwibGlua1wiIHN0eWxlPVwiaGVpZ2h0OiAxNjBweDtcIj48c3BhbiBpZD1cImFuYWx5dGljc1RpbGUtMTA2OC1idG5Jbm5lckVsXCIgY2xhc3M9XCJ4NC1idG4taW5uZXJcIj5QZXJmb3JtYW5jZSBJbnNpZ2h0czwvc3Bhbj48c3BhbiBpZD1cImFuYWx5dGljc1RpbGUtMTA2OC1idG5JY29uRWxcIiBjbGFzcz1cIng0LWJ0bi1pY29uIG1raTMtbXBpLWxvZ28tc3ZnXCI+PC9zcGFuPjwvYT48L2VtPjwvZGl2PicsXG4gICAgICAgICAgICBpZE1hdGNoID0gbmV3IFJlZ0V4cCgnYW5hbHl0aWNzVGlsZS0xMDY4JywgJ2cnKSxcbiAgICAgICAgICAgIHNwYXJlVGlsZUNsb25lID0gTWt0Q2FudmFzLmxvb2t1cENvbXBvbmVudChjb250YWluZXIuY2hpbGROb2Rlc1tjb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggLSAxXSkuY2xvbmVDb25maWcoKVxuXG4gICAgICAgICAgc3BhcmVUaWxlQ2xvbmUuZWwuZG9tLm91dGVySFRNTCA9IHBlcmZvcm1hbmNlSW5zaWdodHNUaWxlT3V0ZXJIVE1MLnJlcGxhY2UoaWRNYXRjaCwgc3BhcmVUaWxlQ2xvbmUuaWQpXG4gICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHNwYXJlVGlsZUNsb25lLmVsLmRvbSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSwgMClcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBvdmVycmlkZXMgdGhlIHNhdmUgZnVuY3Rpb24gb2YgU21hcnQgQ2FtcGFpZ25zIGluIG9yZGVyIHRvIGRpc2FibGVcbiAqICBzYXZpbmcgd2l0aGluIHRoZSBEZWZhdWx0IFdvcmtzcGFjZSBhdCBhbGwgdGltZXMgYW5kIHdpdGhpbiBNeSBXb3Jrc2FwY2UgaWYgdGhlXG4gKiAgU21hcnQgQ2FtcGFpZ24gaXMgTk9UIHdpdGhpbiB0aGUgdXNlcidzIHJvb3QgZm9sZGVyIG9yIGlmIGVkaXQgcHJpdmlsZWdlcyBpcyBmYWxzZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAub3ZlcnJpZGVTbWFydENhbXBhaWduU2F2aW5nID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBPdmVycmlkaW5nOiBTYXZpbmcgZm9yIFNtYXJ0IENhbXBhaWducycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdC53aWRnZXRzLkRhdGFQYW5lbE1hbmFnZXIucHJvdG90eXBlLnNhdmUnKSkge1xuICAgIE1rdC53aWRnZXRzLkRhdGFQYW5lbE1hbmFnZXIucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbiAoY2F1c2UsIGRwLCBhY2NlcHRVcGRhdGVzKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IE92ZXJyaWRlIFNhdmluZyBmb3IgU21hcnQgQ2FtcGFpZ25zJylcbiAgICAgIHRoaXMuX3VwZGF0ZURhdGFQYW5lbE9yZGVyKHRydWUpXG4gICAgICBsZXQgY2FudmFzID0gTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpXG4gICAgICBpZiAoIUFQUC5ldmFsdWF0ZU1lbnUoJ2J1dHRvbicsIG51bGwsIGNhbnZhcywgbnVsbCkgJiYgdG9nZ2xlU3RhdGUgIT0gJ2ZhbHNlJykge1xuICAgICAgICBpZiAodGhpcy5zYXZlUXVldWUuYmxvY2tpbmdTYXZlSW5Qcm9ncmVzcykge1xuICAgICAgICAgIHRoaXMuc2F2ZVF1ZXVlLnBlbmRpbmdDaGFuZ2VzQ291bnQrK1xuICAgICAgICAgIHRoaXMuc2F2ZVF1ZXVlLmRhdGFQYW5lbE1ldGFzID0gdGhpcy5fc2VyaWFsaXplRGF0YVBhbmVscygpXG4gICAgICAgICAgdGhpcy5zYXZlUXVldWUuZGF0YVBhbmVsQ291bnQgPSB0aGlzLmNvdW50RGF0YVBhbmVscygpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGF0YVBhbmVsTWV0YXNcbiAgICAgICAgaWYgKHRoaXMuc2F2ZVF1ZXVlLmRhdGFQYW5lbE1ldGFzKSB7XG4gICAgICAgICAgKHtkYXRhUGFuZWxNZXRhc30gPSB0aGlzLnNhdmVRdWV1ZS5kYXRhUGFuZWxNZXRhcylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhUGFuZWxNZXRhcyA9IHRoaXMuX3NlcmlhbGl6ZURhdGFQYW5lbHMoKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zYXZlUXVldWUucGVuZGluZ0NoYW5nZXNDb3VudCA9IDBcbiAgICAgICAgdGhpcy5zYXZlUXVldWUuZGF0YVBhbmVsTWV0YXMgPSBudWxsXG4gICAgICAgIHRoaXMuc2F2ZVF1ZXVlLmRhdGFQYW5lbENvdW50ID0gMFxuICAgICAgICBpZiAoZGF0YVBhbmVsTWV0YXMgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRwU3VidHlwZSAhPSBEUENvbnN0LlJVTl9BQ1RJT04gJiYgZGF0YVBhbmVsTWV0YXMpIHtcbiAgICAgICAgICBpZiAodGhpcy5sYXN0U2F2ZS5kYXRhUGFuZWxNZXRhcyAmJiB0aGlzLmxhc3RTYXZlLmRhdGFQYW5lbE1ldGFzID09IGRhdGFQYW5lbE1ldGFzKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubGFzdFNhdmUuZGF0YVBhbmVsTWV0YXNVcGRhdGVkICYmIHRoaXMubGFzdFNhdmUuZGF0YVBhbmVsTWV0YXNVcGRhdGVkID09IGRhdGFQYW5lbE1ldGFzKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmRlYnVnKCdTYXZpbmcgJyArIHRoaXMuZHBUeXBlICsgJzonLCBNa3RGb3JtYXQuZm9ybWF0SnNvblN0cihkYXRhUGFuZWxNZXRhcykpXG4gICAgICAgIGlmIChEUERFQlVHKSB7XG4gICAgICAgICAgY29uc29sZS5kZWJ1ZygnQ3VycmVudCBTYXZlOicsIGRhdGFQYW5lbE1ldGFzKVxuXG4gICAgICAgICAgaWYgKHRoaXMubGFzdFNhdmUuZGF0YVBhbmVsTWV0YXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1ByZXZpb3VzIFNhdmU6JywgdGhpcy5sYXN0U2F2ZS5kYXRhUGFuZWxNZXRhcylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy5sYXN0U2F2ZS5kYXRhUGFuZWxNZXRhc1VwZGF0ZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1ByZXZpb3VzIFVwZGF0ZTonLCB0aGlzLmxhc3RTYXZlLmRhdGFQYW5lbE1ldGFzVXBkYXRlZClcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxhc3RTYXZlLmFjY2VwdFVwZGF0ZXMgPSBhY2NlcHRVcGRhdGVzXG4gICAgICAgIHRoaXMubGFzdFNhdmUuZGF0YVBhbmVsTWV0YXMgPSBkYXRhUGFuZWxNZXRhc1xuICAgICAgICB0aGlzLnNhdmVRdWV1ZS5ibG9ja2luZ1NhdmVJblByb2dyZXNzID0gdHJ1ZVxuICAgICAgICB0aGlzLmJlZm9yZVNhdmVNZXNzYWdlKClcbiAgICAgICAgbGV0IHBhcmFtcyA9IEV4dC5hcHBseShcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkYXRhUGFuZWxNZXRhczogZGF0YVBhbmVsTWV0YXMsXG4gICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0aGlzLmJhc2VTYXZlUGFyYW1zXG4gICAgICAgIClcblxuICAgICAgICBpZiAodGhpcy5pc1NtYXJ0bGlzdCAmJiB0aGlzLnNtYXJ0TGlzdFJ1bGVMb2dpYy5jdXN0b21Nb2RlKCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5zbWFydExpc3RSdWxlTG9naWMuaXNDdXN0b21Mb2dpY1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIGxldCBzbWFydExpc3RMb2dpY1BhcmFtcyA9IHRoaXMuc21hcnRMaXN0UnVsZUxvZ2ljLmdldFNtYXJ0TGlzdExvZ2ljU2F2ZVBhcmFtcygpXG4gICAgICAgICAgICBFeHQuYXBwbHkocGFyYW1zLCBzbWFydExpc3RMb2dpY1BhcmFtcylcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnRGF0YSBwYW5lbCBzYXZlIHN1Y2Nlc3NmdWwuIEN1c3RvbSBydWxlIGxvZ2ljIGlzIG5vdCB2YWxpZCcpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcGFyYW1zW3RoaXMuYXBwVmFyc0Jhc2UgKyAnSWQnXSA9IHRoaXMuZGF0YVBhbmVsU3RvcmFnZUlkXG4gICAgICAgIHRoaXMuYmVmb3JlU2F2ZUhvb2soKVxuICAgICAgICBpZiAoRFBERUJVRykge1xuICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1NhdmluZy4uLiAnLCBwYXJhbXMpXG4gICAgICAgIH1cblxuICAgICAgICBNa3RTZXNzaW9uLmFqYXhSZXF1ZXN0KHRoaXMuc2F2ZUFjdGlvbiwge1xuICAgICAgICAgIHNlcmlhbGl6ZVBhcm1zOiBwYXJhbXMsXG4gICAgICAgICAgb25NeVN1Y2Nlc3M6IHRoaXMuc2F2ZVN1Y2Nlc3MuY3JlYXRlRGVsZWdhdGUodGhpcyksXG4gICAgICAgICAgb25NeUZhaWx1cmU6IHRoaXMuc2F2ZUZhaWx1cmUuY3JlYXRlRGVsZWdhdGUodGhpcylcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogU2F2aW5nIGZvciBTbWFydCBDYW1wYWlnbnMnKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIG92ZXJyaWRlcyB0aGUgZmlsbENhbnZhcyBmdW5jdGlvbiBmb3IgdGhlIFByb2dyYW0gPiBBc3NldHMgdGFiIGluXG4gKiAgb3JkZXIgdG8gcmVtb3ZlIHRoZSBuZXcgYXNzZXQgYnV0dG9ucyB3aXRoaW4gdGhlIERlZmF1bHQgV29ya3NwYWNlIGF0IGFsbCB0aW1lc1xuICogIGFuZCB3aXRoaW4gTXkgV29ya3NhcGNlIGlmIHRoZSBQcm9ncmFtIGlzIE5PVCB3aXRoaW4gdGhlIHVzZXIncyByb290IGZvbGRlci5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlQ2FudmFzID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBPdmVycmlkaW5nOiBDYW52YXMnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RDYW52YXNQYW5lbE1hbmFnZXIucHJvdG90eXBlLmZpbGxDYW52YXMnKSkge1xuICAgIGlmICh0eXBlb2Ygb3JpZ0ZpbGxDYW52YXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9yaWdGaWxsQ2FudmFzID0gTWt0Q2FudmFzUGFuZWxNYW5hZ2VyLnByb3RvdHlwZS5maWxsQ2FudmFzXG4gICAgfVxuXG4gICAgTWt0Q2FudmFzUGFuZWxNYW5hZ2VyLnByb3RvdHlwZS5maWxsQ2FudmFzID0gZnVuY3Rpb24gKGl0ZW1zLCB0YWJJZCwgaXNHcmlkKSB7XG4gICAgICBsZXQgdGFiID0gdGhpcy5nZXRUYWJPckFjdGl2ZSh0YWJJZCksXG4gICAgICAgIGRpc2FibGUgPSBBUFAuZXZhbHVhdGVNZW51KCdidXR0b24nLCBudWxsLCB0YWIsIG51bGwpXG5cbiAgICAgIGlmIChkaXNhYmxlICYmIHRhYiAmJiB0YWIudGl0bGUgPT0gJ0Fzc2V0cycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBPdmVycmlkZSBBc3NldHMgQ2FudmFzID4gUmVtb3ZpbmcgTmV3IEFzc2V0IEJ1dHRvbnMnKVxuICAgICAgICBsZXQgbmV3QXNzZXRCdXR0b25zID0gaXRlbXMuZmluZCgnY2VsbENscycsICdwaWNrZXJCdXR0b24nKVxuXG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBuZXdBc3NldEJ1dHRvbnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgbmV3QXNzZXRCdXR0b25zW2lpXS5kZXN0cm95KClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBvcmlnRmlsbENhbnZhcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gb3ZlcnJpZGVzIHRoZSB1cGRhdGVQb3J0bGV0T3JkZXIgZnVuY3Rpb24gb2YgUHJvZ3JhbSA+IEFzc2V0cyB0YWIgaW5cbiAqICBvcmRlciB0byBkaXNhYmxlIHJlb3JkZXJpbmcgb2YgYXNzZXQgcG9ydGxldHMgd2l0aGluIHRoZSBEZWZhdWx0IFdvcmtzcGFjZSBhdCBhbGxcbiAqICB0aW1lcyBhbmQgd2l0aGluIE15IFdvcmtzYXBjZSBpZiB0aGUgUHJvZ3JhbSBpcyBOT1Qgd2l0aGluIHRoZSB1c2VyJ3Mgcm9vdCBmb2xkZXJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlVXBkYXRlUG9ydGxldE9yZGVyID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBPdmVycmlkaW5nOiBVcGRhdGluZyBvZiBQb3J0bGV0IE9yZGVyJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0LmFwcHMubG9jYWxhc3NldC5Mb2NhbEFzc2V0UG9ydGFsLnByb3RvdHlwZS51cGRhdGVQb3J0bGV0T3JkZXInKSkge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogT3ZlcnJpZGUgVXBkYXRpbmcgb2YgUG9ydGxldCBPcmRlcicpXG4gICAgTWt0LmFwcHMubG9jYWxhc3NldC5Mb2NhbEFzc2V0UG9ydGFsLnByb3RvdHlwZS51cGRhdGVQb3J0bGV0T3JkZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgbGV0IGNhbnZhcyA9IE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSxcbiAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ2J1dHRvbicsIG51bGwsIGNhbnZhcywgbnVsbClcbiAgICAgIGlmICghZGlzYWJsZSkge1xuICAgICAgICBsZXQgbmV3UG9ydGxldE9yZGVyID0gW11cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbGV0IGl0ZW1JbmZvID0gdGhpcy5pdGVtcy5nZXQoaSkuc21hcnRDYW1wYWlnbk1ldGFEYXRhXG4gICAgICAgICAgbmV3UG9ydGxldE9yZGVyLnB1c2goaXRlbUluZm8uY29tcFR5cGVJZCArICc6JyArIGl0ZW1JbmZvLmNvbXBJZClcbiAgICAgICAgfVxuICAgICAgICBsZXQgcGFyYW1zID0ge1xuICAgICAgICAgIGNvbXBJZDogdGhpcy5wcm9ncmFtSWQsXG4gICAgICAgICAgcG9ydGxldE9yZGVyaW5nOiBFeHQuZW5jb2RlKG5ld1BvcnRsZXRPcmRlcilcbiAgICAgICAgfVxuICAgICAgICBNa3RTZXNzaW9uLmFqYXhSZXF1ZXN0KCdtYXJrZXRpbmdFdmVudC9vcmRlckxvY2FsQXNzZXRQb3J0bGV0cycsIHtcbiAgICAgICAgICBzZXJpYWxpemVQYXJtczogcGFyYW1zLFxuICAgICAgICAgIGxvY2FsQXNzZXRNYW5hZ2VyOiB0aGlzLFxuICAgICAgICAgIHBvcnRsZXRPcmRlcmluZzogbmV3UG9ydGxldE9yZGVyLFxuICAgICAgICAgIG9uTXlTdWNjZXNzOiB0aGlzLnVwZGF0ZVBvcnRsZXRPcmRlclN1Y2Nlc3NcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogVXBkYXRpbmcgb2YgUG9ydGxldCBPcmRlcicpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gb3ZlcnJpZGVzIHRoZSBleHBhbmQgZnVuY3Rpb24gZm9yIGEgTWFya2V0byB0cmVlIG5vZGUgaW4gb3JkZXIgdG9cbiAqICBoaWRlIGVhY2ggbm9uLXN5c3RlbSBmb2xkZXIgdGhhdCBpcyBpbiB0aGUgTWFya2V0aW5nIHdvcmtzcGFjZSBleGNlcHQgdGhlIHVzZXInc1xuICogIG93biBmb2xkZXJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlVHJlZU5vZGVFeHBhbmQgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE92ZXJyaWRpbmc6IFRyZWUgTm9kZSBFeHBhbmQnKVxuICBpZiAoIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0QXN5bmNUcmVlTm9kZS5wcm90b3R5cGUuZXhwYW5kJykgJiYgdXNlck5hbWUpIHtcbiAgICBNa3RBc3luY1RyZWVOb2RlLnByb3RvdHlwZS5leHBhbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgYXR0ciA9IHRoaXMuYXR0cmlidXRlc1xuXG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMudGV4dC5zZWFyY2gobWt0b015V29ya3NwYWNlTmFtZU1hdGNoKSAhPSAtMSB8fFxuICAgICAgICAodGhpcy5wYXJlbnROb2RlLnRleHQuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZU5hbWVNYXRjaCkgIT0gLTEgJiYgdGhpcy5hdHRyaWJ1dGVzLnN5c3RlbSA9PSB0cnVlKSB8fFxuICAgICAgICAodGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUgIT0gbnVsbCAmJlxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlLnRleHQuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZU5hbWVNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuc3lzdGVtID09IHRydWUpXG4gICAgICApIHtcbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHRoaXMuY2hpbGROb2Rlcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICBsZXQgY3VyckZvbGRlciA9IHRoaXMuY2hpbGROb2Rlc1tpaV1cblxuICAgICAgICAgIGlmIChjdXJyRm9sZGVyLmF0dHJpYnV0ZXMuc3lzdGVtID09IGZhbHNlICYmIGN1cnJGb2xkZXIudGV4dC50b0xvd2VyQ2FzZSgpICE9PSB1c2VyTmFtZSkge1xuICAgICAgICAgICAgY3VyckZvbGRlci51aS5oaWRlKClcbiAgICAgICAgICAgIGN1cnJGb2xkZXIuaGlkZGVuID0gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgKGFjY291bnRTdHJpbmcgPT0gbWt0b0FjY291bnRTdHJpbmdNYXN0ZXIgfHwgYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3Rlck1FVUUpICYmIC8vVE9ET1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xICYmXG4gICAgICAgIHRoaXMuY2hpbGROb2Rlcy5sZW5ndGhcbiAgICAgICkge1xuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgdGhpcy5jaGlsZE5vZGVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGxldCBub2RlID0gdGhpcy5jaGlsZE5vZGVzW2lpXVxuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aCA9PSAwICYmXG4gICAgICAgICAgICBub2RlLmF0dHJpYnV0ZXMgJiZcbiAgICAgICAgICAgIG5vZGUuYXR0cmlidXRlcy5jaGlsZHJlbiAmJlxuICAgICAgICAgICAgbm9kZS5hdHRyaWJ1dGVzLmNoaWxkcmVuLmxlbmd0aCA9PSAxICYmXG4gICAgICAgICAgICAobm9kZS5hdHRyaWJ1dGVzLmNoaWxkcmVuWzBdLmlzRHJhZnROb2RlID09IDEgfHwgbm9kZS5hdHRyaWJ1dGVzLmNoaWxkcmVuWzBdLmlzRHJhZnQpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAobm9kZS51aSAmJiBub2RlLnVpLmVjTm9kZSAmJiBub2RlLnVpLmVjTm9kZS5jbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgbm9kZS51aS5lY05vZGUuY2xhc3NOYW1lID0gJ3gtdHJlZS1lYy1pY29uIHgtdHJlZS1lbGJvdydcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlbW92ZWQgRHJhZnQgTm9kZSBPZjogJyArIG5vZGUudGV4dClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5vZGUuYWxsb3dDaGlsZHJlbiA9IGZhbHNlXG4gICAgICAgICAgICAgIG5vZGUubGVhZiA9IHRydWVcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1ByZXZlbnRlZCBEcmFmdCBOb2RlIE9mOiAnICsgbm9kZS50ZXh0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBub2RlLmNoaWxkTm9kZXMubGVuZ3RoID09IDEgJiZcbiAgICAgICAgICAgIG5vZGUuY2hpbGROb2Rlc1swXS5hdHRyaWJ1dGVzICYmXG4gICAgICAgICAgICAobm9kZS5jaGlsZE5vZGVzWzBdLmF0dHJpYnV0ZXMuaXNEcmFmdE5vZGUgPT0gMSB8fCBub2RlLmNoaWxkTm9kZXNbMF0uYXR0cmlidXRlcy5pc0RyYWZ0KVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVBbGwodHJ1ZSlcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZW1vdmVkIENoaWxkIERyYWZ0IE5vZGUgT2Y6ICcgKyBub2RlLnRleHQpXG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIG5vZGUuY2hpbGROb2Rlcy5sZW5ndGggPiAxICYmXG4gICAgICAgICAgICBub2RlLmNoaWxkTm9kZXNbMF0uYXR0cmlidXRlcyAmJlxuICAgICAgICAgICAgKG5vZGUuY2hpbGROb2Rlc1swXS5hdHRyaWJ1dGVzLmlzRHJhZnROb2RlID09IDEgfHwgbm9kZS5jaGlsZE5vZGVzWzBdLmF0dHJpYnV0ZXMuaXNEcmFmdClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIG5vZGUuY2hpbGROb2Rlc1swXS5yZW1vdmUodHJ1ZSlcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZW1vdmVkIENoaWxkIERyYWZ0IE5vZGUgT2Y6ICcgKyBub2RlLnRleHQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnWm9uZScpIHtcbiAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgdGhpcy5jaGlsZE5vZGVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgbGV0IGN1cnJGb2xkZXIgPSB0aGlzLmNoaWxkTm9kZXNbaWldXG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5hdHRyaWJ1dGVzLnN5c3RlbSA9PSBmYWxzZSAmJlxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInICYmXG4gICAgICAgICAgICAgIChjdXJyRm9sZGVyLnRleHQuc2VhcmNoKG1rdG9PcGVyYXRpb25hbEZvbGRlcnMpICE9IC0xIHx8XG4gICAgICAgICAgICAgICAgKEFQUC5nZXRVc2VyUm9sZSgpID09ICdQYXJ0bmVyJyAmJlxuICAgICAgICAgICAgICAgICAgQVBQLmdldFVzZXJJZCgpXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnQCcpWzBdXG4gICAgICAgICAgICAgICAgICAgIC5zZWFyY2goL1xcLmluZm9yJC8pID09IC0xICYmXG4gICAgICAgICAgICAgICAgICBjdXJyRm9sZGVyLnRleHQuc2VhcmNoKG1rdG9MYXVuY2hQb2ludEZvbGRlclRvSGlkZSkgIT0gLTEpKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIudWkuaGlkZSgpXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuaGlkZGVuID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICB0aGlzLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICB0aGlzLnBhcmVudE5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnWm9uZScgJiZcbiAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuc3lzdGVtID09IGZhbHNlICYmXG4gICAgICAgICAgdGhpcy5oaWRkZW4gPT0gZmFsc2UgJiZcbiAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInXG4gICAgICAgICkge1xuICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLmNoaWxkTm9kZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICBsZXQgY3VyckZvbGRlciA9IHRoaXMuY2hpbGROb2Rlc1tpaV1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmF0dHJpYnV0ZXMuc3lzdGVtID09IGZhbHNlICYmXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgJiZcbiAgICAgICAgICAgICAgY3VyckZvbGRlci50ZXh0LnNlYXJjaChta3RvT3BlcmF0aW9uYWxGb2xkZXJzKSAhPSAtMVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIudWkuaGlkZSgpXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuaGlkZGVuID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICB0aGlzLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICB0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZSAmJlxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICB0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZS5wYXJlbnROb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ1pvbmUnICYmXG4gICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLnN5c3RlbSA9PSBmYWxzZSAmJlxuICAgICAgICAgIHRoaXMuaGlkZGVuID09IGZhbHNlICYmXG4gICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLmNvbXBUeXBlICE9ICdNYXJrZXRpbmcgRm9sZGVyJ1xuICAgICAgICApIHtcbiAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgdGhpcy5jaGlsZE5vZGVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgbGV0IGN1cnJGb2xkZXIgPSB0aGlzLmNoaWxkTm9kZXNbaWldXG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5hdHRyaWJ1dGVzLnN5c3RlbSA9PSBmYWxzZSAmJlxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInICYmXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIudGV4dC5zZWFyY2gobWt0b09wZXJhdGlvbmFsRm9sZGVycykgIT0gLTFcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjdXJyRm9sZGVyLnVpLmhpZGUoKVxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmhpZGRlbiA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGF0dHIuZm9sZGVyKSB7XG4gICAgICAgIGlmIChhdHRyLmNhbmNlbEZpcnN0RXhwYW5kKSB7XG4gICAgICAgICAgZGVsZXRlIHRoaXMuYXR0cmlidXRlcy5jYW5jZWxGaXJzdEV4cGFuZFxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY2hpbGROb2RlcyAmJiB0aGlzLmNoaWxkTm9kZXMubGVuZ3RoID4gMCAmJiAhYXR0ci5ta3RFeHBhbmRlZCAmJiB0aGlzLmF0dHJpYnV0ZXMgJiYgdGhpcy5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZCkge1xuICAgICAgICAgIGlmICh0aGlzLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpID09IC0xKSB7XG4gICAgICAgICAgICBNa3RGb2xkZXIuc2F2ZUV4cGFuZFN0YXRlKHRoaXMsIHRydWUpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE5PVCBTYXZpbmc6IEZvbGRlciBFeHBhbmQgU3RhdGUnKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgTWt0QXN5bmNUcmVlTm9kZS5zdXBlcmNsYXNzLmV4cGFuZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICBhdHRyLm1rdEV4cGFuZGVkID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIG92ZXJyaWRlcyB0aGUgY29sbGFwc2UgZnVuY3Rpb24gZm9yIGEgTWFya2V0byB0cmVlIG5vZGUgaW4gb3JkZXIgdG9cbiAqICBoaWRlIGVhY2ggbm9uLXN5c3RlbSBmb2xkZXIgdGhhdCBpcyBpbiB0aGUgTWFya2V0aW5nIHdvcmtzcGFjZSBleGNlcHQgdGhlIHVzZXInc1xuICogIG93biBmb2xkZXJcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlVHJlZU5vZGVDb2xsYXBzZSA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogVHJlZSBOb2RlIENvbGxhcHNlJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0QXN5bmNUcmVlTm9kZS5wcm90b3R5cGUuY29sbGFwc2UnKSAmJiB1c2VyTmFtZSkge1xuICAgIE1rdEFzeW5jVHJlZU5vZGUucHJvdG90eXBlLmNvbGxhcHNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGF0dHIgPSB0aGlzLmF0dHJpYnV0ZXNcblxuICAgICAgaWYgKFxuICAgICAgICB0aGlzLnRleHQuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZU5hbWVNYXRjaCkgIT0gLTEgfHxcbiAgICAgICAgKHRoaXMucGFyZW50Tm9kZS50ZXh0LnNlYXJjaChta3RvTXlXb3Jrc3BhY2VOYW1lTWF0Y2gpICE9IC0xICYmIHRoaXMuYXR0cmlidXRlcy5zeXN0ZW0gPT0gdHJ1ZSkgfHxcbiAgICAgICAgKHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlICE9IG51bGwgJiZcbiAgICAgICAgICB0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZS50ZXh0LnNlYXJjaChta3RvTXlXb3Jrc3BhY2VOYW1lTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLnN5c3RlbSA9PSB0cnVlKVxuICAgICAgKSB7XG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLmNoaWxkTm9kZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgbGV0IGN1cnJGb2xkZXIgPSB0aGlzLmNoaWxkTm9kZXNbaWldXG5cbiAgICAgICAgICBpZiAoY3VyckZvbGRlci5hdHRyaWJ1dGVzLnN5c3RlbSA9PSBmYWxzZSAmJiBjdXJyRm9sZGVyLnRleHQudG9Mb3dlckNhc2UoKSAhPT0gdXNlck5hbWUpIHtcbiAgICAgICAgICAgIGN1cnJGb2xkZXIudWkuaGlkZSgpXG4gICAgICAgICAgICBjdXJyRm9sZGVyLmhpZGRlbiA9IGN1cnJGb2xkZXIudWkuZWxOb2RlLmhpZGRlbiA9IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIChhY2NvdW50U3RyaW5nID09IG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyIHx8IGFjY291bnRTdHJpbmcgPT0gbWt0b0FjY291bnRTdHJpbmdNYXN0ZXJNRVVFKSAmJiAvL1RPRE8gTUVVRVxuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xICYmXG4gICAgICAgIHRoaXMuY2hpbGROb2Rlcy5sZW5ndGhcbiAgICAgICkge1xuICAgICAgICBpZiAodGhpcy5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdab25lJykge1xuICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLmNoaWxkTm9kZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICBsZXQgY3VyckZvbGRlciA9IHRoaXMuY2hpbGROb2Rlc1tpaV1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmF0dHJpYnV0ZXMuc3lzdGVtID09IGZhbHNlICYmXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgJiZcbiAgICAgICAgICAgICAgKGN1cnJGb2xkZXIudGV4dC5zZWFyY2gobWt0b09wZXJhdGlvbmFsRm9sZGVycykgIT0gLTEgfHxcbiAgICAgICAgICAgICAgICAoQVBQLmdldFVzZXJSb2xlKCkgPT0gJ1BhcnRuZXInICYmXG4gICAgICAgICAgICAgICAgICBBUFAuZ2V0VXNlcklkKClcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCdAJylbMF1cbiAgICAgICAgICAgICAgICAgICAgLnNlYXJjaCgvXFwuaW5mb3IkLykgPT0gLTEgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJGb2xkZXIudGV4dC5zZWFyY2gobWt0b0xhdW5jaFBvaW50Rm9sZGVyVG9IaWRlKSAhPSAtMSkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY3VyckZvbGRlci51aS5oaWRlKClcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5oaWRkZW4gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZSAmJlxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdab25lJyAmJlxuICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5zeXN0ZW0gPT0gZmFsc2UgJiZcbiAgICAgICAgICB0aGlzLmhpZGRlbiA9PSBmYWxzZSAmJlxuICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcidcbiAgICAgICAgKSB7XG4gICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHRoaXMuY2hpbGROb2Rlcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgIGxldCBjdXJyRm9sZGVyID0gdGhpcy5jaGlsZE5vZGVzW2lpXVxuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuYXR0cmlidXRlcy5zeXN0ZW0gPT0gZmFsc2UgJiZcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRm9sZGVyJyAmJlxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLnRleHQuc2VhcmNoKG1rdG9PcGVyYXRpb25hbEZvbGRlcnMpICE9IC0xXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY3VyckZvbGRlci51aS5oaWRlKClcbiAgICAgICAgICAgICAgY3VyckZvbGRlci5oaWRkZW4gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZSAmJlxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlICYmXG4gICAgICAgICAgdGhpcy5wYXJlbnROb2RlLnBhcmVudE5vZGUucGFyZW50Tm9kZSAmJlxuICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnWm9uZScgJiZcbiAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuc3lzdGVtID09IGZhbHNlICYmXG4gICAgICAgICAgdGhpcy5oaWRkZW4gPT0gZmFsc2UgJiZcbiAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuY29tcFR5cGUgIT0gJ01hcmtldGluZyBGb2xkZXInXG4gICAgICAgICkge1xuICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLmNoaWxkTm9kZXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICBsZXQgY3VyckZvbGRlciA9IHRoaXMuY2hpbGROb2Rlc1tpaV1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBjdXJyRm9sZGVyLmF0dHJpYnV0ZXMuc3lzdGVtID09IGZhbHNlICYmXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgJiZcbiAgICAgICAgICAgICAgY3VyckZvbGRlci50ZXh0LnNlYXJjaChta3RvT3BlcmF0aW9uYWxGb2xkZXJzKSAhPSAtMVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIudWkuaGlkZSgpXG4gICAgICAgICAgICAgIGN1cnJGb2xkZXIuaGlkZGVuID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoYXR0ci5zdXBwcmVzc0FqYXhDb2xsYXBzZSkge1xuICAgICAgICBkZWxldGUgdGhpcy5hdHRyaWJ1dGVzLnN1cHByZXNzQWpheENvbGxhcHNlXG4gICAgICB9IGVsc2UgaWYgKGlzRGVmaW5lZChhdHRyLmZvbGRlcikgJiYgYXR0ci5mb2xkZXIgJiYgYXR0ci5ta3RFeHBhbmRlZCA9PT0gdHJ1ZSkge1xuICAgICAgICBNa3RGb2xkZXIuc2F2ZUV4cGFuZFN0YXRlKHRoaXMsIGZhbHNlKVxuICAgICAgfVxuICAgICAgTWt0VHJlZU5vZGUuc3VwZXJjbGFzcy5jb2xsYXBzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICBhdHRyLm1rdEV4cGFuZGVkID0gZmFsc2VcbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBvdmVycmlkZXMgdGhlIGNyZWF0ZSBmdW5jdGlvbiBmb3IgYSBuZXcgUHJvZ3JhbSBvciBTZWdtZW50YXRpb24gaW5cbiAqICBvcmRlciB0byBlbmZvcmNlIGEgbmFtaW5nIGNvbnZlbnRpb24gYnkgYXBwZW5kaW5nIHRoZSB1c2VyJ3MgdXNlcm5hbWUgdG8gdGhlIG5hbWVcbiAqICBvZiB0aGUgbmV3IHByb2dyYW0gb3Igc2VnbWVudGF0aW9uXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5vdmVycmlkZU5ld1Byb2dyYW1DcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE92ZXJyaWRpbmc6IE5ldyBQcm9ncmFtL1NlZ21lbnRhdGlvbiBDcmVhdGlvbicpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdC53aWRnZXRzLk1vZGFsRm9ybS5wcm90b3R5cGUub2tCdXR0b25IYW5kbGVyJykgJiYgdXNlck5hbWUpIHtcbiAgICBNa3Qud2lkZ2V0cy5Nb2RhbEZvcm0ucHJvdG90eXBlLm9rQnV0dG9uSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogTmV3IFByb2dyYW0vU2VnbWVudGF0aW9uIENyZWF0aW9uJylcbiAgICAgIGlmICh0aGlzLnRpdGxlID09ICdOZXcgUHJvZ3JhbScgfHwgdGhpcy50aXRsZSA9PSAnTmV3IFNlZ21lbnRhdGlvbicpIHtcbiAgICAgICAgbGV0IGlpXG5cbiAgICAgICAgaWYgKHRoaXMudGl0bGUgPT0gJ05ldyBQcm9ncmFtJykge1xuICAgICAgICAgIGlmICh0aGlzLmdldElucHV0SXRlbXMoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0SW5wdXRJdGVtcygpWzFdICYmIHRoaXMuZ2V0SW5wdXRJdGVtcygpWzFdLmZpZWxkTGFiZWwgPT0gJ05hbWUnKSB7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLmdldElucHV0SXRlbXMoKVsxXVxuICAgICAgICAgICAgICAgICAgLmdldFZhbHVlKClcbiAgICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAuc2VhcmNoKHVzZXJOYW1lICsgJyQnKSA9PSAtMVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdldElucHV0SXRlbXMoKVsxXS5zZXRWYWx1ZSh0aGlzLmdldElucHV0SXRlbXMoKVsxXS5nZXRWYWx1ZSgpICsgJyAtICcgKyB1c2VyTmFtZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgdGhpcy5nZXRJbnB1dEl0ZW1zKCkubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2V0SW5wdXRJdGVtcygpW2lpXSAmJiB0aGlzLmdldElucHV0SXRlbXMoKVtpaV0uZmllbGRMYWJlbCA9PSAnTmFtZScpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRJbnB1dEl0ZW1zKClbaWldLmdldFZhbHVlKClcbiAgICAgICAgICAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgIC5zZWFyY2godXNlck5hbWUgKyAnJCcpID09IC0xXG4gICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRJbnB1dEl0ZW1zKClbaWldLnNldFZhbHVlKHRoaXMuZ2V0SW5wdXRJdGVtcygpW2lpXS5nZXRWYWx1ZSgpICsgJyAtICcgKyB1c2VyTmFtZSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy50aXRsZSA9PSAnTmV3IFNlZ21lbnRhdGlvbicpIHtcbiAgICAgICAgICBpZiAodGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZmluZEJ5VHlwZSgndGV4dGZpZWxkJylbMF0gJiYgdGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKVswXS5maWVsZExhYmVsID09ICdOYW1lJykge1xuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgdGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKVswXVxuICAgICAgICAgICAgICAgICAgLmdldFZhbHVlKClcbiAgICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgICAuc2VhcmNoKHVzZXJOYW1lICsgJyQnKSA9PSAtMVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpbmRCeVR5cGUoJ3RleHRmaWVsZCcpWzBdLnNldFZhbHVlKHRoaXMuZmluZEJ5VHlwZSgndGV4dGZpZWxkJylbMF0uZ2V0VmFsdWUoKSArICcgLSAnICsgdXNlck5hbWUpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAoaWkgPSAwOyBpaSA8IHRoaXMuZmluZEJ5VHlwZSgndGV4dGZpZWxkJykubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmluZEJ5VHlwZSgndGV4dGZpZWxkJylbaWldICYmIHRoaXMuZmluZEJ5VHlwZSgndGV4dGZpZWxkJylbaWldLmZpZWxkTGFiZWwgPT0gJ05hbWUnKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmluZEJ5VHlwZSgndGV4dGZpZWxkJylbaWldLmdldFZhbHVlKClcbiAgICAgICAgICAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgIC5zZWFyY2godXNlck5hbWUgKyAnJCcpID09IC0xXG4gICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKVtpaV0uc2V0VmFsdWUodGhpcy5maW5kQnlUeXBlKCd0ZXh0ZmllbGQnKVtpaV0uZ2V0VmFsdWUoKSArICcgLSAnICsgdXNlck5hbWUpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnN1Ym1pdEluUHJvZ3Jlc3MpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmJlZm9yZVN1Ym1pdENhbGxiYWNrKCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5va0NhbGxiYWNrICYmIGlzRnVuY3Rpb24odGhpcy5va0NhbGxiYWNrKSkge1xuICAgICAgICB0aGlzLm9rQ2FsbGJhY2soKVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuc3VibWl0VXJsKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zaG93UHJvZ3Jlc3NNb2RhbCkge1xuICAgICAgICB0aGlzLmhpZGUoKVxuXG4gICAgICAgIHRoaXMucHJvZ3Jlc3NNb2RhbCA9IEV4dC5NZXNzYWdlQm94LnNob3coe1xuICAgICAgICAgIHRpdGxlOiBNa3RMYW5nLmdldFN0cignTW9kYWxGb3JtLlBsZWFzZV93YWl0JyksXG4gICAgICAgICAgbXNnOiB0aGlzLnByb2dyZXNzTXNnLFxuICAgICAgICAgIHByb2dyZXNzOiB0cnVlLFxuICAgICAgICAgIHdhaXQ6IHRydWUsXG4gICAgICAgICAgd2lkdGg6IDIwMCxcbiAgICAgICAgICBjbG9zYWJsZTogZmFsc2VcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE1rdFNlc3Npb24uY2xvY2tDdXJzb3IoKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnN1Ym1pdEluUHJvZ3Jlc3MgPSB0cnVlXG4gICAgICB0aGlzLmVuYWJsZU9rQ2FuY2VsQnV0dG9uKCF0aGlzLnN1Ym1pdEluUHJvZ3Jlc3MpXG5cbiAgICAgIGlmICh0aGlzLnNlcmlhbGl6ZUpTT04pIHtcbiAgICAgICAgdGhpcy5zZXJpYWxpemVQYXJtcyA9IHRoaXMuc2VyaWFsaXplUGFybXMgfHwge31cbiAgICAgICAgdGhpcy5zZXJpYWxpemVQYXJtcy5fanNvbiA9IEV4dC5lbmNvZGUodGhpcy5zZXJpYWxpemVKU09OKVxuICAgICAgfVxuXG4gICAgICBsZXQgcGFybXMgPSBFeHQuYXBwbHkoe30sIHRoaXMuc2VyaWFsaXplUGFybXMsIHRoaXMuYmFzZVBhcmFtcylcbiAgICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QodGhpcy5zdWJtaXRVcmwsIHtcbiAgICAgICAgc2VyaWFsaXplUGFybXM6IHBhcm1zLFxuICAgICAgICBvbk15U3VjY2VzczogdGhpcy5zdWJtaXRTdWNjZXNzSGFuZGxlci5jcmVhdGVEZWxlZ2F0ZSh0aGlzKSxcbiAgICAgICAgb25NeUZhaWx1cmU6IHRoaXMuc3VibWl0RmFpbGVkSGFuZGxlci5jcmVhdGVEZWxlZ2F0ZSh0aGlzKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBvdmVycmlkZXMgdGhlIHNhdmUgZWRpdCBmdW5jdGlvbiBmb3IgcmVuYW1pbmcgZXhpc2l0aW5nIFByb2dyYW1zLFxuICogIFNtYXJ0IENhbXBhaWducywgQXNzZXRzLCBhbmQgRm9sZGVycyBpbiBvcmRlciB0byBlbmZvcmNlIGEgbmFtaW5nIGNvbnZlbnRpb24gYnlcbiAqICBhcHBlbmRpbmcgdGhlIHVzZXIncyB1c2VybmFtZSB0byB0aGUgbmFtZSBvZiB0aGUgcHJvZ3JhbSwgc21hcnQgY2FtcGFpZ24sIGFzc2V0LCBvclxuICogIGZvbGRlcjsgYWRkaXRpb25hbGx5LCBpdCBwcmV2ZW50cyB0aGUgcmVuYW1pbmcgb2YgdGhlIHVzZXIncyByb290IGZvbGRlciB2aWEgdGhlXG4gKiAgTWFya2V0byBjYW52YXMgdGFiXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5vdmVycmlkZUFzc2V0U2F2ZUVkaXQgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE92ZXJyaWRpbmc6IEFzc2V0IFNhdmUgRWRpdCcpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdC53aWRnZXRzLkNhbnZhc0hlYWRlci5wcm90b3R5cGUuc2F2ZUVkaXQnKSkge1xuICAgIGlmICh0eXBlb2Ygb3JpZ0Fzc2V0U2F2ZUVkaXQgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9yaWdBc3NldFNhdmVFZGl0ID0gTWt0LndpZGdldHMuQ2FudmFzSGVhZGVyLnByb3RvdHlwZS5zYXZlRWRpdFxuICAgIH1cblxuICAgIE1rdC53aWRnZXRzLkNhbnZhc0hlYWRlci5wcm90b3R5cGUuc2F2ZUVkaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoXG4gICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0Q2FudmFzLmdldEFjdGl2ZVRhYicpICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcuYWNjZXNzWm9uZUlkICYmXG4gICAgICAgIHVzZXJOYW1lXG4gICAgICApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBBc3NldCBTYXZlIEVkaXQnKVxuICAgICAgICBsZXQgY3VycldvcmtzcGFjZUlkID0gTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZy5hY2Nlc3Nab25lSWRcblxuICAgICAgICBpZiAoY3VycldvcmtzcGFjZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgbGV0IGlzRm9sZGVyRWRpdCA9IGZhbHNlXG5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAoTWt0RXhwbG9yZXIuZ2V0RWwoKS5kb20ub3duZXJEb2N1bWVudC50aXRsZS5zZWFyY2goJ01hcmtldGluZyBBY3Rpdml0aWVzJykgIT0gLTEgJiZcbiAgICAgICAgICAgICAgKHRoaXMudGl0bGVJZCA9PSAnbXBURU5hbWUnIHx8IHRoaXMudGl0bGVJZCA9PSAnY2RoVEVOYW1lJyB8fCB0aGlzLnRpdGxlSWQgPT0gJ3BuYW1lJykpIHx8XG4gICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXRFbCgpLmRvbS5vd25lckRvY3VtZW50LnRpdGxlLnNlYXJjaCgnTWFya2V0aW5nIEFjdGl2aXRpZXMnKSA9PSAtMVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHRoaXMudGl0bGVJZCA9PSAncG5hbWUnKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnRpdGxlVmFsdWUgPT0gdXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICBpc0ZvbGRlckVkaXQgPSB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0aGlzLmdldFRpdGxlRmllbGQoKVxuICAgICAgICAgICAgICAgIC5nZXRWYWx1ZSgpXG4gICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAuc2VhcmNoKHVzZXJOYW1lICsgJyQnKSA9PSAtMVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMuZ2V0VGl0bGVGaWVsZCgpLnNldFZhbHVlKHRoaXMuZ2V0VGl0bGVGaWVsZCgpLmdldFZhbHVlKCkgKyAnIC0gJyArIHVzZXJOYW1lKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpc0ZvbGRlckVkaXQpIHtcbiAgICAgICAgICAgIGxldCB0b1VwZGF0ZU5vZGVUZXh0ID0gZmFsc2VcblxuICAgICAgICAgICAgTWt0U2Vzc2lvbi5jbG9ja0N1cnNvcih0cnVlKVxuICAgICAgICAgICAgdGhpcy5nZXRUaXRsZUZpZWxkKCkuc2V0VmFsdWUodGhpcy50aXRsZVZhbHVlKVxuICAgICAgICAgICAgbGV0IGNhbnZhc1RhYiA9IE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSxcbiAgICAgICAgICAgICAgLy9jYW52YXNUYWIudXBkYXRlVGFiVGl0bGUodGhpcy50aXRsZVZhbHVlKTtcbiAgICAgICAgICAgICAgbm9kZUlkID0gbnVsbFxuICAgICAgICAgICAgaWYgKGNhbnZhc1RhYi5jb25maWcuZXhwTm9kZUlkKSB7XG4gICAgICAgICAgICAgIGxldCBub2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2FudmFzVGFiLmNvbmZpZy5leHBOb2RlSWQpXG4gICAgICAgICAgICAgIGlmIChub2RlICYmIG5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSkge1xuICAgICAgICAgICAgICAgIGxldCB7Y29tcFR5cGV9ID0gbm9kZS5hdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICAgaWYgKGNvbXBUeXBlID09ICdNYXJrZXRpbmcgUHJvZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgIG5vZGVJZCA9IGNhbnZhc1RhYi5jb25maWcuZXhwTm9kZUlkXG4gICAgICAgICAgICAgICAgICAvL01rdEV4cGxvcmVyLmxvY2tTdWJUcmVlKG5vZGVJZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjb21wVHlwZSA9PSAnSW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICB0b1VwZGF0ZU5vZGVUZXh0ID0gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGVsID0gdGhpcy5nZXRFbCgpLFxuICAgICAgICAgICAgICBwYW5lbE9iaiA9IHRoaXMsXG4gICAgICAgICAgICAgIHtmb3JtUGFuZWx9ID0gdGhpcyxcbiAgICAgICAgICAgICAge3ZpZXdQYW5lbH0gPSB0aGlzXG4gICAgICAgICAgICBmb3JtUGFuZWwuaGlkZSh0cnVlLCAwLjIpXG4gICAgICAgICAgICB2aWV3UGFuZWwuc2hvdyh0cnVlLCAwLjIpXG4gICAgICAgICAgICB2aWV3UGFuZWwuYm9keS51cGRhdGUocGFuZWxPYmoudmlld1RlbXBsYXRlLmFwcGx5KHBhbmVsT2JqKSlcblxuICAgICAgICAgICAgZWwuYW5pbWF0ZShcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGhlaWdodDoge1xuICAgICAgICAgICAgICAgICAgZnJvbTogdGhpcy5nZXRIZWlnaHQoKSxcbiAgICAgICAgICAgICAgICAgIHRvOiB0aGlzLm9yaWdIZWlnaHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIDAuMjUsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwYW5lbE9iai5zZXRIZWlnaHQocGFuZWxPYmoub3JpZ0hlaWdodClcbiAgICAgICAgICAgICAgICBwYW5lbE9iai5ib2R5LnNldEhlaWdodChwYW5lbE9iai5vcmlnSGVpZ2h0KVxuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHBhbmVsT2JqLnNhdmVkQ2FsbGJhY2spKSB7XG4gICAgICAgICAgICAgICAgICBwYW5lbE9iai5zYXZlZENhbGxiYWNrKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcblxuICAgICAgICAgICAgTWt0U2Vzc2lvbi51bmNsb2NrQ3Vyc29yKClcbiAgICAgICAgICAgIHRoaXMuX3NhdmVJblByb2dyZXNzID0gZmFsc2VcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHRvVXBkYXRlTm9kZVRleHQgPSB0cnVlXG5cbiAgICAgICAgICAgIE1rdFNlc3Npb24uY2xvY2tDdXJzb3IodHJ1ZSlcbiAgICAgICAgICAgIHRoaXMuc2VyaWFsaXplUGFybXNbdGhpcy50aXRsZUlkXSA9IHRoaXMuZ2V0VGl0bGVGaWVsZCgpLmdldFZhbHVlKClcbiAgICAgICAgICAgIHRoaXMuc2VyaWFsaXplUGFybXNbdGhpcy5kZXNjSWRdID0gdGhpcy5nZXREZXNjRmllbGQoKS5nZXRWYWx1ZSgpXG5cbiAgICAgICAgICAgIHRoaXMubmV3VGl0bGVWYWx1ZSA9IE1rdFBhZ2UuaXNGZWF0dXJlRW5hYmxlZCgndHJlZUVuY29kaW5nJylcbiAgICAgICAgICAgICAgPyB0aGlzLnNlcmlhbGl6ZVBhcm1zW3RoaXMudGl0bGVJZF1cbiAgICAgICAgICAgICAgOiBFeHQudXRpbC5Gb3JtYXQuaHRtbEVuY29kZSh0aGlzLnNlcmlhbGl6ZVBhcm1zW3RoaXMudGl0bGVJZF0pXG4gICAgICAgICAgICB0aGlzLm5ld0Rlc2NWYWx1ZSA9IEV4dC51dGlsLkZvcm1hdC5odG1sRW5jb2RlKHRoaXMuc2VyaWFsaXplUGFybXNbdGhpcy5kZXNjSWRdKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVDYW52YXNDb25maWcoKVxuXG4gICAgICAgICAgICB0aGlzLnByZXZUaXRsZVZhbHVlID0gdGhpcy50aXRsZVZhbHVlXG4gICAgICAgICAgICB0aGlzLnRpdGxlVmFsdWUgPSB0aGlzLm5ld1RpdGxlVmFsdWVcbiAgICAgICAgICAgIHRoaXMuZGVzY1ZhbHVlID0gdGhpcy5uZXdEZXNjVmFsdWVcbiAgICAgICAgICAgIE1rdFBhZ2UudXBkYXRlRnVsbFRpdGxlKClcbiAgICAgICAgICAgIGxldCBjYW52YXNUYWIgPSBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKClcbiAgICAgICAgICAgIGNhbnZhc1RhYi51cGRhdGVUYWJUaXRsZSh0aGlzLnRpdGxlVmFsdWUpXG4gICAgICAgICAgICBsZXQgbm9kZUlkID0gbnVsbFxuICAgICAgICAgICAgaWYgKGNhbnZhc1RhYi5jb25maWcuZXhwTm9kZUlkKSB7XG4gICAgICAgICAgICAgIGxldCBub2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2FudmFzVGFiLmNvbmZpZy5leHBOb2RlSWQpXG4gICAgICAgICAgICAgIGlmIChub2RlICYmIG5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSkge1xuICAgICAgICAgICAgICAgIGxldCB7Y29tcFR5cGV9ID0gbm9kZS5hdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICAgaWYgKGNvbXBUeXBlID09ICdNYXJrZXRpbmcgUHJvZ3JhbScpIHtcbiAgICAgICAgICAgICAgICAgIG5vZGVJZCA9IGNhbnZhc1RhYi5jb25maWcuZXhwTm9kZUlkXG4gICAgICAgICAgICAgICAgICBNa3RFeHBsb3Jlci5sb2NrU3ViVHJlZShub2RlSWQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjb21wVHlwZSA9PSAnSW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICB0b1VwZGF0ZU5vZGVUZXh0ID0gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHRvVXBkYXRlTm9kZVRleHQpIHtcbiAgICAgICAgICAgICAgICBNa3RFeHBsb3Jlci51cGRhdGVOb2RlVGV4dChjYW52YXNUYWIuY29uZmlnLmV4cE5vZGVJZCwgdGhpcy50aXRsZVZhbHVlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBlbCA9IHRoaXMuZ2V0RWwoKSxcbiAgICAgICAgICAgICAgcGFuZWxPYmogPSB0aGlzLFxuICAgICAgICAgICAgICB7Zm9ybVBhbmVsfSA9IHRoaXMsXG4gICAgICAgICAgICAgIHt2aWV3UGFuZWx9ID0gdGhpc1xuICAgICAgICAgICAgZm9ybVBhbmVsLmhpZGUodHJ1ZSwgMC4yKVxuICAgICAgICAgICAgdmlld1BhbmVsLnNob3codHJ1ZSwgMC4yKVxuICAgICAgICAgICAgdmlld1BhbmVsLmJvZHkudXBkYXRlKHBhbmVsT2JqLnZpZXdUZW1wbGF0ZS5hcHBseShwYW5lbE9iaikpXG5cbiAgICAgICAgICAgIGVsLmFuaW1hdGUoXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHtcbiAgICAgICAgICAgICAgICAgIGZyb206IHRoaXMuZ2V0SGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgICB0bzogdGhpcy5vcmlnSGVpZ2h0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAwLjI1LFxuICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxPYmouc2V0SGVpZ2h0KHBhbmVsT2JqLm9yaWdIZWlnaHQpXG4gICAgICAgICAgICAgICAgcGFuZWxPYmouYm9keS5zZXRIZWlnaHQocGFuZWxPYmoub3JpZ0hlaWdodClcbiAgICAgICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihwYW5lbE9iai5zYXZlZENhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgICAgcGFuZWxPYmouc2F2ZWRDYWxsYmFjaygpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApXG5cbiAgICAgICAgICAgIE1rdFNlc3Npb24udW5jbG9ja0N1cnNvcigpXG4gICAgICAgICAgICB0aGlzLl9zYXZlSW5Qcm9ncmVzcyA9IHRydWVcbiAgICAgICAgICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QodGhpcy5hY3Rpb25VcmwsIHtcbiAgICAgICAgICAgICAgc2VyaWFsaXplUGFybXM6IHRoaXMuc2VyaWFsaXplUGFybXMsXG4gICAgICAgICAgICAgIGNvbnRhaW5lcklkOiB0aGlzLmlkLFxuICAgICAgICAgICAgICBvbk15U3VjY2VzczogdGhpcy5zYXZlUmVzcG9uc2UuY3JlYXRlRGVsZWdhdGUodGhpcywgW25vZGVJZF0sIHRydWUpLFxuICAgICAgICAgICAgICBvbk15RXJyb3I6IHRoaXMuc2F2ZUVycm9yLmNyZWF0ZURlbGVnYXRlKHRoaXMsIFtub2RlSWRdKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoY3VycldvcmtzcGFjZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgbGV0IHRvVXBkYXRlTm9kZVRleHQgPSBmYWxzZVxuXG4gICAgICAgICAgTWt0U2Vzc2lvbi5jbG9ja0N1cnNvcih0cnVlKVxuICAgICAgICAgIHRoaXMuZ2V0VGl0bGVGaWVsZCgpLnNldFZhbHVlKHRoaXMudGl0bGVWYWx1ZSlcbiAgICAgICAgICBsZXQgY2FudmFzVGFiID0gTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLFxuICAgICAgICAgICAgbm9kZUlkID0gbnVsbFxuICAgICAgICAgIGlmIChjYW52YXNUYWIuY29uZmlnLmV4cE5vZGVJZCkge1xuICAgICAgICAgICAgbGV0IG5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChjYW52YXNUYWIuY29uZmlnLmV4cE5vZGVJZClcbiAgICAgICAgICAgIGlmIChub2RlICYmIG5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSkge1xuICAgICAgICAgICAgICBsZXQge2NvbXBUeXBlfSA9IG5vZGUuYXR0cmlidXRlc1xuICAgICAgICAgICAgICBpZiAoY29tcFR5cGUgPT0gJ01hcmtldGluZyBQcm9ncmFtJykge1xuICAgICAgICAgICAgICAgIG5vZGVJZCA9IGNhbnZhc1RhYi5jb25maWcuZXhwTm9kZUlkXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGNvbXBUeXBlID09ICdJbWFnZScpIHtcbiAgICAgICAgICAgICAgICB0b1VwZGF0ZU5vZGVUZXh0ID0gZmFsc2VcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBlbCA9IHRoaXMuZ2V0RWwoKSxcbiAgICAgICAgICAgIHBhbmVsT2JqID0gdGhpcyxcbiAgICAgICAgICAgIHtmb3JtUGFuZWx9ID0gdGhpcyxcbiAgICAgICAgICAgIHt2aWV3UGFuZWx9ID0gdGhpc1xuICAgICAgICAgIGZvcm1QYW5lbC5oaWRlKHRydWUsIDAuMilcbiAgICAgICAgICB2aWV3UGFuZWwuc2hvdyh0cnVlLCAwLjIpXG4gICAgICAgICAgdmlld1BhbmVsLmJvZHkudXBkYXRlKHBhbmVsT2JqLnZpZXdUZW1wbGF0ZS5hcHBseShwYW5lbE9iaikpXG5cbiAgICAgICAgICBlbC5hbmltYXRlKHtoZWlnaHQ6IHsgZnJvbTogdGhpcy5nZXRIZWlnaHQoKSwgdG86IHRoaXMub3JpZ0hlaWdodH19LCAwLjI1LFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBwYW5lbE9iai5zZXRIZWlnaHQocGFuZWxPYmoub3JpZ0hlaWdodClcbiAgICAgICAgICAgICAgcGFuZWxPYmouYm9keS5zZXRIZWlnaHQocGFuZWxPYmoub3JpZ0hlaWdodClcbiAgICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24ocGFuZWxPYmouc2F2ZWRDYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICBwYW5lbE9iai5zYXZlZENhbGxiYWNrKClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIClcblxuICAgICAgICAgIE1rdFNlc3Npb24udW5jbG9ja0N1cnNvcigpXG4gICAgICAgICAgdGhpcy5fc2F2ZUluUHJvZ3Jlc3MgPSBmYWxzZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9yaWdBc3NldFNhdmVFZGl0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIG92ZXJyaWRlcyB0aGUgY3JlYXRlIGZ1bmN0aW9uIGZvciBhbnkgbmV3IGFzc2V0IHRoYXQgaXMgbm90IGEgY2hpbGRcbiAqICBvZiBhIHByb2dyYW0gaW4gb3JkZXIgdG8gZW5mb3JjZSBhIG5hbWluZyBjb252ZW50aW9uIGJ5IGFwcGVuZGluZyB0aGUgdXNlcidzXG4gKiAgdXNlcm5hbWUgdG8gdGhlIG5hbWUgb2YgdGhlIG5ldyBhc3NldFxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAub3ZlcnJpZGVOZXdBc3NldENyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogTmV3IEFzc2V0IENyZWF0aW9uJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5jb250cm9sbGVyLmxpYi5BYnN0cmFjdE1vZGFsRm9ybS5wcm90b3R5cGUub25TdWJtaXQnKSAmJiB1c2VyTmFtZSkge1xuICAgIE1rdDMuY29udHJvbGxlci5saWIuQWJzdHJhY3RNb2RhbEZvcm0ucHJvdG90eXBlLm9uU3VibWl0ID0gZnVuY3Rpb24gKGZvcm0pIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogTmV3IEFzc2V0IENyZWF0aW9uJylcbiAgICAgIGlmIChcbiAgICAgICAgZm9ybSA9PSBudWxsIHx8XG4gICAgICAgIGZvcm0ub3duZXJBc3NldCA9PSBudWxsIHx8XG4gICAgICAgIGZvcm0ub3duZXJBc3NldC5pc09uZU9mUHJvZ3JhbVR5cGVzID09IG51bGwgfHxcbiAgICAgICAgZm9ybS5vd25lckFzc2V0LmlzT25lT2ZQcm9ncmFtVHlwZXMoKSA9PSBmYWxzZVxuICAgICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBmb3JtLmdldFhUeXBlKCkgIT0gJ251cnR1cmVUcmFja0Zvcm0nICYmXG4gICAgICAgICAgdGhpcyAhPSBudWxsICYmXG4gICAgICAgICAgdGhpcy5nZXRGaWVsZCgnbmFtZScpICE9IG51bGwgJiZcbiAgICAgICAgICB0aGlzLmdldEZpZWxkKCduYW1lJykuZ2V0VmFsdWUoKSAhPSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgIGxldCBhc3NldE5hbWUgPSB0aGlzLmdldEZpZWxkKCduYW1lJykuZ2V0VmFsdWUoKVxuXG4gICAgICAgICAgaWYgKGFzc2V0TmFtZS50b0xvd2VyQ2FzZSgpLnNlYXJjaCh1c2VyTmFtZSArICckJykgPT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0RmllbGQoJ25hbWUnKS5zZXRWYWx1ZShhc3NldE5hbWUgKyAnIC0gJyArIHVzZXJOYW1lKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3JtID0gIWZvcm0uaXNYVHlwZSgnbW9kYWxGb3JtJykgPyBmb3JtLnVwKCdtb2RhbEZvcm0nKSA6IGZvcm1cblxuICAgICAgZm9ybS5zZXRTdWJtaXR0aW5nKHRydWUpXG5cbiAgICAgIGlmICh0aGlzLnZhbGlkYXRlKGZvcm0pKSB7XG4gICAgICAgIGlmICh0aGlzLmFwcGxpY2F0aW9uLmZpcmVFdmVudCh0aGlzLndpZGdldElkICsgJ0JlZm9yZVN1Ym1pdCcsIGZvcm0gPyBmb3JtLmdldFJlY29yZCgpIDogbnVsbCkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc3VibWl0KGZvcm0pICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5zdWJtaXRDb21wbGV0ZShmb3JtKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3JtLnNldFN1Ym1pdHRpbmcoZmFsc2UpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvcm0uc2hvd0RlZmF1bHRNZXNzYWdlKClcbiAgICAgICAgZm9ybS5zZXRTdWJtaXR0aW5nKGZhbHNlKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIG92ZXJyaWRlcyB0aGUgbmV3IGZvbGRlciBjcmVhdGUgZnVuY3Rpb24gdmlhIFJpZ2h0LWNsaWNrID4gTmV3XG4gKiAgQ2FtcGFpZ24gRm9sZGVyLCBOZXcgRm9sZGVyIGluIG9yZGVyIHRvIGVuZm9yY2UgYSBuYW1pbmcgY29udmVudGlvbiBieSBhcHBlbmRpbmdcbiAqICB0aGUgdXNlcidzIHVzZXJuYW1lIHRvIHRoZSBuZXcgbmFtZSBvZiBhbnkgZm9sZGVyIHRoYXQgaXMgbm90IGEgY2hpbGQgb2YgYSBwcm9ncmFtXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5vdmVycmlkZU5ld0ZvbGRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE92ZXJyaWRpbmc6IE5ldyBGb2xkZXJzJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0TWEubmV3UHJvZ3JhbUZvbGRlclN1Ym1pdCcpICYmIHVzZXJOYW1lKSB7XG4gICAgTWt0TWEubmV3UHJvZ3JhbUZvbGRlclN1Ym1pdCA9IGZ1bmN0aW9uICh0ZXh0LCBwYXJlbnRJZCwgdGVtcE5vZGVJZCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBOZXcgRm9sZGVycyBpbiBNYXJrZXRpbmcgQWN0aXZpdGllcycpXG4gICAgICBNa3RTZXNzaW9uLmNsb2NrQ3Vyc29yKHRydWUpXG4gICAgICBsZXQgcGFybXMgPSB7fVxuXG4gICAgICBpZiAoXG4gICAgICAgICh0aGlzLmN1cnJOb2RlLnBhcmVudE5vZGUuYXR0cmlidXRlcy5jb21wVHlwZS5zZWFyY2goJ0ZvbGRlciQnKSAhPSAtMSAmJiB0ZXh0LnRvTG93ZXJDYXNlKCkuc2VhcmNoKHVzZXJOYW1lICsgJyQnKSA9PSAtMSkgfHxcbiAgICAgICAgdGV4dCA9PSB1c2VyTmFtZVxuICAgICAgKSB7XG4gICAgICAgIHRleHQgPSB0ZXh0ICsgJyAtICcgKyB1c2VyTmFtZVxuICAgICAgfVxuICAgICAgcGFybXMudGV4dCA9IHRleHRcbiAgICAgIHBhcm1zLnBhcmVudElkID0gcGFyZW50SWRcbiAgICAgIHBhcm1zLnRlbXBOb2RlSWQgPSB0ZW1wTm9kZUlkXG4gICAgICBNa3RTZXNzaW9uLmFqYXhSZXF1ZXN0KCdleHBsb3Jlci9jcmVhdGVQcm9ncmFtRm9sZGVyJywge1xuICAgICAgICBzZXJpYWxpemVQYXJtczogcGFybXMsXG4gICAgICAgIG9uTXlTdWNjZXNzOiBNa3RNYS5uZXdQcm9ncmFtRm9sZGVyRG9uZSxcbiAgICAgICAgb25NeUZhaWx1cmU6IGZ1bmN0aW9uICh0ZW1wTm9kZUlkKSB7XG4gICAgICAgICAgbGV0IHRlbXBOb2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQodGVtcE5vZGVJZClcbiAgICAgICAgICBpZiAodGVtcE5vZGUpIHtcbiAgICAgICAgICAgIHRlbXBOb2RlLnJlbW92ZSgpXG4gICAgICAgICAgfVxuICAgICAgICB9LmNyZWF0ZURlbGVnYXRlKHRoaXMsIFt0ZW1wTm9kZUlkXSlcbiAgICAgIH0pXG4gICAgICBpZiAoTWt0TWEuY3Vyck5vZGUpIHtcbiAgICAgICAgTWt0TWEuY3Vyck5vZGUudW5zZWxlY3QoKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdEZvbGRlci5uZXdGb2xkZXJTdWJtaXQnKSAmJiB1c2VyTmFtZSkge1xuICAgIE1rdEZvbGRlci5uZXdGb2xkZXJTdWJtaXQgPSBmdW5jdGlvbiAodGV4dCwgcGFyZW50Tm9kZUlkLCB0ZW1wTm9kZUlkKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IE5ldyBGb2xkZXJzJylcbiAgICAgIE1rdFNlc3Npb24uY2xvY2tDdXJzb3IodHJ1ZSlcbiAgICAgIGxldCBwYXJtcyA9IHt9XG5cbiAgICAgIGlmICh0ZXh0LnRvTG93ZXJDYXNlKCkuc2VhcmNoKHVzZXJOYW1lICsgJyQnKSA9PSAtMSB8fCB0ZXh0ID09IHVzZXJOYW1lKSB7XG4gICAgICAgIHRleHQgPSB0ZXh0ICsgJyAtICcgKyB1c2VyTmFtZVxuICAgICAgfVxuICAgICAgcGFybXMudGV4dCA9IHRleHRcbiAgICAgIHBhcm1zLnBhcmVudE5vZGVJZCA9IHBhcmVudE5vZGVJZFxuICAgICAgcGFybXMudGVtcE5vZGVJZCA9IHRlbXBOb2RlSWRcbiAgICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QoJ2ZvbGRlci9jcmVhdGVGb2xkZXJTdWJtaXQnLCB7XG4gICAgICAgIHNlcmlhbGl6ZVBhcm1zOiBwYXJtcyxcbiAgICAgICAgb25NeVN1Y2Nlc3M6IE1rdEZvbGRlci5uZXdGb2xkZXJTdWJtaXREb25lLmNyZWF0ZURlbGVnYXRlKHRoaXMsIFt0ZW1wTm9kZUlkXSksXG4gICAgICAgIG9uTXlGYWlsdXJlOiBmdW5jdGlvbiAodGVtcE5vZGVJZCkge1xuICAgICAgICAgIGxldCB0ZW1wTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKHRlbXBOb2RlSWQpXG4gICAgICAgICAgaWYgKHRlbXBOb2RlKSB7XG4gICAgICAgICAgICB0ZW1wTm9kZS5yZW1vdmUoKVxuICAgICAgICAgIH1cbiAgICAgICAgfS5jcmVhdGVEZWxlZ2F0ZSh0aGlzLCBbdGVtcE5vZGVJZF0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIGZ1bmN0aW9uIG92ZXJyaWRlcyB0aGUgZm9sZGVyIHJlbmFtaW5nIGZ1bmN0aW9ucyBpbiBvcmRlciB0byBwcmV2ZW50IHJlbmFtaW5nXG4gKiAgb2YgdGhlIHVzZXIncyByb290IGZvbGRlciB2aWEgUmlnaHQtY2xpY2sgPiBSZW5hbWUgRm9sZGVyIGFuZCB0byBlbmZvcmNlIGEgbmFtaW5nXG4gKiAgY29udmVudGlvbiBieSBhcHBlbmRpbmcgdGhlIHVzZXIncyB1c2VybmFtZSB0byB0aGUgbmV3IG5hbWUgb2YgYW55IGZvbGRlciB0aGF0IGlzXG4gKiAgbm90IGEgY2hpbGQgb2YgYSBwcm9ncmFtXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5vdmVycmlkZVJlbmFtaW5nRm9sZGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogUmVuYW1pbmcgRm9sZGVycycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdE1hLnJlbmFtZVByb2dyYW1Gb2xkZXJTdWJtaXQnKSAmJiB1c2VyTmFtZSkge1xuICAgIE1rdE1hLnJlbmFtZVByb2dyYW1Gb2xkZXJTdWJtaXQgPSBmdW5jdGlvbiAodmFsdWUsIHN0YXJ0VmFsdWUsIGZvbGRlcklkKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IFJlbmFtaW5nIEZvbGRlcnMgaW4gTWFya2V0aW5nIEFjdGl2aXRpZXMnKVxuICAgICAgTWt0U2Vzc2lvbi5jbG9ja0N1cnNvcih0cnVlKVxuICAgICAgbGV0IGZvbGRlciA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKGZvbGRlcklkKSxcbiAgICAgICAgcGFybXMgPSB7fVxuXG4gICAgICBpZiAoXG4gICAgICAgIHN0YXJ0VmFsdWUgPT0gdXNlck5hbWUgJiZcbiAgICAgICAgdGhpcy5jdXJyTm9kZS5wYXJlbnROb2RlLmF0dHJpYnV0ZXMuc3lzdGVtID09IHRydWUgJiZcbiAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMVxuICAgICAgKSB7XG4gICAgICAgIGlmIChmb2xkZXIpIHtcbiAgICAgICAgICBmb2xkZXIuc2V0VGV4dChzdGFydFZhbHVlKVxuICAgICAgICB9XG4gICAgICAgIE1rdFNlc3Npb24udW5jbG9ja0N1cnNvcigpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRoaXMuY3Vyck5vZGUucGFyZW50Tm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlLnNlYXJjaCgnRm9sZGVyJCcpICE9IC0xICYmIHZhbHVlLnRvTG93ZXJDYXNlKCkuc2VhcmNoKHVzZXJOYW1lICsgJyQnKSkgPT0gLTEgfHxcbiAgICAgICAgICB2YWx1ZSA9PSB1c2VyTmFtZVxuICAgICAgICApIHtcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgJyAtICcgKyB1c2VyTmFtZVxuICAgICAgICAgIGlmIChmb2xkZXIpIHtcbiAgICAgICAgICAgIGZvbGRlci5zZXRUZXh0KHZhbHVlKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwYXJtcy5vcmlnUHJvZ3JhbU5hbWUgPSBzdGFydFZhbHVlXG4gICAgICAgIHBhcm1zLm5ld1Byb2dyYW1OYW1lID0gdmFsdWVcbiAgICAgICAgcGFybXMuZm9sZGVySWQgPSBmb2xkZXJJZFxuICAgICAgICBNa3RTZXNzaW9uLmFqYXhSZXF1ZXN0KCdleHBsb3Jlci9yZW5hbWVQcm9ncmFtRm9sZGVyJywge1xuICAgICAgICAgIHNlcmlhbGl6ZVBhcm1zOiBwYXJtcyxcbiAgICAgICAgICBvbk15U3VjY2VzczogTWt0TWEucmVuYW1lUHJvZ3JhbUZvbGRlclN1Ym1pdERvbmUsXG4gICAgICAgICAgb25NeUZhaWx1cmU6IGZ1bmN0aW9uIChmb2xkZXJJZCwgb3JpZ05hbWUpIHtcbiAgICAgICAgICAgIGxldCBmb2xkZXIgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChmb2xkZXJJZClcbiAgICAgICAgICAgIGlmIChmb2xkZXIpIHtcbiAgICAgICAgICAgICAgZm9sZGVyLnNldFRleHQob3JpZ05hbWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfS5jcmVhdGVEZWxlZ2F0ZSh0aGlzLCBbZm9sZGVySWQsIHN0YXJ0VmFsdWVdKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdEZvbGRlci5yZW5hbWVGb2xkZXJTdWJtaXQnKSAmJiB1c2VyTmFtZSkge1xuICAgIE1rdEZvbGRlci5yZW5hbWVGb2xkZXJTdWJtaXQgPSBmdW5jdGlvbiAodGV4dCwgc3RhcnRWYWx1ZSwgbm9kZUlkKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IFJlbmFtaW5nIEZvbGRlcnMnKVxuICAgICAgTWt0U2Vzc2lvbi5jbG9ja0N1cnNvcih0cnVlKVxuICAgICAgbGV0IHBhcm1zID0ge31cblxuICAgICAgaWYgKFxuICAgICAgICBzdGFydFZhbHVlID09IHVzZXJOYW1lICYmXG4gICAgICAgIHRoaXMuY3Vyck5vZGUucGFyZW50Tm9kZS5hdHRyaWJ1dGVzLnN5c3RlbSA9PSB0cnVlICYmXG4gICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTFcbiAgICAgICkge1xuICAgICAgICBNa3RGb2xkZXIuY3Vyck5vZGUuc2V0VGV4dChzdGFydFZhbHVlKVxuICAgICAgICBNa3RTZXNzaW9uLnVuY2xvY2tDdXJzb3IoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRleHQudG9Mb3dlckNhc2UoKS5zZWFyY2godXNlck5hbWUgKyAnJCcpID09IC0xIHx8IHRleHQgPT0gdXNlck5hbWUpIHtcbiAgICAgICAgICB0ZXh0ID0gdGV4dCArICcgLSAnICsgdXNlck5hbWVcbiAgICAgICAgICBNa3RGb2xkZXIuY3Vyck5vZGUuc2V0VGV4dCh0ZXh0KVxuICAgICAgICB9XG4gICAgICAgIHBhcm1zLnRleHQgPSB0ZXh0XG4gICAgICAgIHBhcm1zLm5vZGVJZCA9IG5vZGVJZFxuICAgICAgICBNa3RTZXNzaW9uLmFqYXhSZXF1ZXN0KCdmb2xkZXIvcmVuYW1lRm9sZGVyU3VibWl0Jywge1xuICAgICAgICAgIHNlcmlhbGl6ZVBhcm1zOiBwYXJtcyxcbiAgICAgICAgICBvbk15U3VjY2VzczogTWt0Rm9sZGVyLnJlbmFtZUZvbGRlclN1Ym1pdERvbmUuY3JlYXRlRGVsZWdhdGUoe1xuICAgICAgICAgICAgcGFybXM6IHBhcm1zLFxuICAgICAgICAgICAgc3RhcnRWYWx1ZTogc3RhcnRWYWx1ZVxuICAgICAgICAgIH0pLFxuICAgICAgICAgIG9uTXlGYWlsdXJlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBNa3RGb2xkZXIuY3Vyck5vZGUuc2V0VGV4dChzdGFydFZhbHVlKVxuICAgICAgICAgIH0uY3JlYXRlRGVsZWdhdGUodGhpcylcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBoaWRlcyBhbGwgZm9sZGVycyBpbiB0aGUgZHJvcCBkb3duIGxpc3Qgd2hlbiBpbXBvcnRpbmcgYSBwcm9ncmFtXG4gKiAgZXhjZXB0IHRoZSB1c2VyJ3Mgb3duIGZvbGRlclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuaGlkZUZvbGRlcnNPbkltcG9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gSGlkaW5nOiBGb2xkZXJzIE9uIFByb2dyYW0gSW1wb3J0IHZpYSBPdmVycmlkZScpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dC5mb3JtLkNvbWJvQm94LnByb3RvdHlwZS5vblRyaWdnZXJDbGljaycpICYmIHVzZXJOYW1lKSB7XG4gICAgRXh0LmZvcm0uQ29tYm9Cb3gucHJvdG90eXBlLm9uVHJpZ2dlckNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBIaWRlIEZvbGRlcnMgT24gUHJvZ3JhbSBJbXBvcnQgdmlhIE92ZXJyaWRlJylcbiAgICAgIGlmICh0aGlzLnJlYWRPbmx5IHx8IHRoaXMuZGlzYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pc0V4cGFuZGVkKCkpIHtcbiAgICAgICAgdGhpcy5jb2xsYXBzZSgpXG4gICAgICAgIHRoaXMuZWwuZm9jdXMoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vbkZvY3VzKHt9KVxuICAgICAgICBpZiAodGhpcy50cmlnZ2VyQWN0aW9uID09ICdhbGwnKSB7XG4gICAgICAgICAgdGhpcy5kb1F1ZXJ5KHRoaXMuYWxsUXVlcnksIHRydWUpXG5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgIHRoaXMgJiZcbiAgICAgICAgICAgIHRoaXMubGFiZWwgJiZcbiAgICAgICAgICAgIHRoaXMubGFiZWwuZG9tICYmXG4gICAgICAgICAgICB0aGlzLmxhYmVsLmRvbS50ZXh0Q29udGVudCA9PSAnQ2FtcGFpZ24gRm9sZGVyOicgJiZcbiAgICAgICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0Q2FudmFzLmdldEFjdGl2ZVRhYicpICYmXG4gICAgICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkgJiZcbiAgICAgICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcgJiZcbiAgICAgICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IEhpZGUgQ2FtcGFpZ24gRm9sZGVycyBPbiBQcm9ncmFtIEltcG9ydCB2aWEgT3ZlcnJpZGUnKVxuICAgICAgICAgICAgbGV0IGlpXG5cbiAgICAgICAgICAgIGZvciAoaWkgPSAwOyBpaSA8IHRoaXMudmlldy5hbGwuZWxlbWVudHMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnZpZXcuYWxsLmVsZW1lbnRzW2lpXS50ZXh0Q29udGVudC50b0xvd2VyQ2FzZSgpICE9IHVzZXJOYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3LmFsbC5lbGVtZW50c1tpaV0uaGlkZGVuID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZG9RdWVyeSh0aGlzLmdldFJhd1ZhbHVlKCkpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbC5mb2N1cygpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gZGlzYWJsZXMgdGhlIERlZmF1bHQgYW5kIE1hcmtldGluZyBXb3Jrc3BhY2VzIGhvbWUgYnV0dG9uczpcbiAqICBOZXcgUHJvZ3JhbSwgTmV3IFNtYXJ0IENhbXBhaWduLCBhbmQgTmV3IFNtYXJ0IExpc3RcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLmRpc2FibGVCdXR0b25zID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IEJ1dHRvbnMnKVxuICAkalEgPSBqUXVlcnkubm9Db25mbGljdCgpXG4gIGlmICgkalEgJiYgJGpRKCcubWt0QnV0dG9uUG9zaXRpdmUnKSkge1xuICAgICRqUSgnLm1rdEJ1dHRvblBvc2l0aXZlJykucmVtb3ZlKClcbiAgfVxufVxuXG5BUFAuZGlzYWJsZUNoZWNrYm94ZXMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogQ2hlY2tib3hlcycpXG4gIE1rdDMuY29udHJvbGxlci5hZG1pbi5tZXJjdXJ5Lk1lcmN1cnlBZG1pbi5wcm90b3R5cGUuZ2V0RW5hYmxlZFJvbGVzID0gZnVuY3Rpb24gKCkge1xuICAgIGxldCBtZSA9IHRoaXNcbiAgICBNa3RTZXNzaW9uLmFqYXhSZXF1ZXN0KCcvbWVyY3VyeS9nZXRNZXJjdXJ5RW5hYmxlZFJvbGVzJywge1xuICAgICAgcGFyYW1zOiB7fSxcbiAgICAgIG9uTXlTdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgbWUuZW5hYmxlZFJvbGVzID0gW11cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgJGpRID0galF1ZXJ5Lm5vQ29uZmxpY3QoKVxuICBpZiAoJGpRKSB7XG4gICAgJGpRKCcueDQtZm9ybS1jaGVja2JveCcpLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSlcbiAgfVxufVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBldmFsdWF0ZXMgdGhlIGN1cnJlbnQgbm9kZSBjb250ZXh0IGJlaW5nIG1vdmVkIHRvIGRldGVybWluZSBpZiB0aGVcbiAqICBpdGVtIHNob3VsZCBiZSBtb3ZlZFxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuZXZhbHVhdGVNb3ZlSXRlbSA9IGZ1bmN0aW9uIChub2RlVG9Nb3ZlLCBkZXN0Tm9kZSkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFdmFsdWF0aW5nOiBNb3ZlIEl0ZW0nKVxuICBsZXQgbWt0b0NlbnRlck9mRXhjZWxsZW5jZU1vdmFibGVFdmVudENvbXBJZHNNYXRjaCA9ICdeKDEwMDV8MTAwMykkJyxcbiAgICBta3RvQ2VudGVyT2ZFeGNlbGxlbmNlRXZlbnRGb2xkZXJDb21wSWRzTWF0Y2ggPSAnXigzMjc0fDMyNzUpJCcsXG4gICAgbWt0b0Fzc2V0TWFuYWdlbWVudE1vdmFibGVFdmVudENvbXBJZHNNYXRjaCA9ICdeKDE3Njd8MTc4NSkkJyxcbiAgICBta3RvQXNzZXRNYW5hZ2VtZW50RXZlbnRGb2xkZXJDb21wSWRzTWF0Y2ggPSAnXigzMTQ0fDMxNDUpJCcsXG4gICAgbWt0b0hlYWx0aGNhcmVNb3ZhYmxlRXZlbnRDb21wSWRzTWF0Y2ggPSAnXigxNjcxfDE2OTEpJCcsXG4gICAgbWt0b0hlYWx0aGNhcmVFdmVudEZvbGRlckNvbXBJZHNNYXRjaCA9ICdeKDI4MjF8MjgyMikkJyxcbiAgICBta3RvSGlnaGVyRWR1Y2F0aW9uTW92YWJsZUV2ZW50Q29tcElkc01hdGNoID0gJ14oMTYzNXwxNjU1KSQnLFxuICAgIG1rdG9IaWdoZXJFZHVjYXRpb25FdmVudEZvbGRlckNvbXBJZHNNYXRjaCA9ICdeKDI3MTl8MjcyMCkkJyxcbiAgICBta3RvTWFudWZhY3R1cmluZ01vdmFibGVFdmVudENvbXBJZHNNYXRjaCA9ICdeKDE3OTN8MTc5NCkkJyxcbiAgICBta3RvTWFudWZhY3R1cmluZ0V2ZW50Rm9sZGVyQ29tcElkc01hdGNoID0gJ14oMzE3OXwzMTgwKSQnLFxuICAgIG1rdG9TcG9ydHNNb3ZhYmxlRXZlbnRDb21wSWRzTWF0Y2ggPSAnXigxNzA0fDE3MjMpJCcsXG4gICAgbWt0b1Nwb3J0c0V2ZW50Rm9sZGVyQ29tcElkc01hdGNoID0gJ14oMjkyOHwyOTI5KSQnLFxuICAgIG1rdG9UZWNobm9sb2d5TW92YWJsZUV2ZW50Q29tcElkc01hdGNoID0gJ14oMTA3MnwxMDYxKSQnLFxuICAgIG1rdG9UZWNobm9sb2d5RXZlbnRGb2xkZXJDb21wSWRzTWF0Y2ggPSAnXigyNTkzfDI1OTQpJCcsXG4gICAgbWt0b1RyYXZlbE1vdmFibGVFdmVudENvbXBJZHNNYXRjaCA9ICdeKDE3MzZ8MTc1NCkkJyxcbiAgICBta3RvVHJhdmVsRXZlbnRGb2xkZXJDb21wSWRzTWF0Y2ggPSAnXigzMDQ1fDMwNDYpJCdcblxuICBpZiAodXNlck5hbWUpIHtcbiAgICBsZXQgaWksIGN1cnJOb2RlLCBkZXB0aFxuXG4gICAgaWYgKFxuICAgICAgKG5vZGVUb01vdmUuYXR0cmlidXRlcyAmJlxuICAgICAgICBub2RlVG9Nb3ZlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkICYmXG4gICAgICAgIG5vZGVUb01vdmUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEpIHx8XG4gICAgICAoZGVzdE5vZGUuYXR0cmlidXRlcyAmJlxuICAgICAgICBkZXN0Tm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZCAmJlxuICAgICAgICBkZXN0Tm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSlcbiAgICApIHtcbiAgICAgIGlmIChub2RlVG9Nb3ZlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBFdmVudCcgJiYgZGVzdE5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIChub2RlVG9Nb3ZlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9DZW50ZXJPZkV4Y2VsbGVuY2VNb3ZhYmxlRXZlbnRDb21wSWRzTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICBkZXN0Tm9kZS5hdHRyaWJ1dGVzLmNvbXBJZC50b1N0cmluZygpLnNlYXJjaChta3RvQ2VudGVyT2ZFeGNlbGxlbmNlRXZlbnRGb2xkZXJDb21wSWRzTWF0Y2gpICE9IC0xKSB8fFxuICAgICAgICAgIChub2RlVG9Nb3ZlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Bc3NldE1hbmFnZW1lbnRNb3ZhYmxlRXZlbnRDb21wSWRzTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICBkZXN0Tm9kZS5hdHRyaWJ1dGVzLmNvbXBJZC50b1N0cmluZygpLnNlYXJjaChta3RvQXNzZXRNYW5hZ2VtZW50RXZlbnRGb2xkZXJDb21wSWRzTWF0Y2gpICE9IC0xKSB8fFxuICAgICAgICAgIChub2RlVG9Nb3ZlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9IZWFsdGhjYXJlTW92YWJsZUV2ZW50Q29tcElkc01hdGNoKSAhPSAtMSAmJlxuICAgICAgICAgICAgZGVzdE5vZGUuYXR0cmlidXRlcy5jb21wSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0hlYWx0aGNhcmVFdmVudEZvbGRlckNvbXBJZHNNYXRjaCkgIT0gLTEpIHx8XG4gICAgICAgICAgKG5vZGVUb01vdmUuYXR0cmlidXRlcy5jb21wSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0hpZ2hlckVkdWNhdGlvbk1vdmFibGVFdmVudENvbXBJZHNNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICAgIGRlc3ROb2RlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9IaWdoZXJFZHVjYXRpb25FdmVudEZvbGRlckNvbXBJZHNNYXRjaCkgIT0gLTEpIHx8XG4gICAgICAgICAgKG5vZGVUb01vdmUuYXR0cmlidXRlcy5jb21wSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b01hbnVmYWN0dXJpbmdNb3ZhYmxlRXZlbnRDb21wSWRzTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICBkZXN0Tm9kZS5hdHRyaWJ1dGVzLmNvbXBJZC50b1N0cmluZygpLnNlYXJjaChta3RvTWFudWZhY3R1cmluZ0V2ZW50Rm9sZGVyQ29tcElkc01hdGNoKSAhPSAtMSkgfHxcbiAgICAgICAgICAobm9kZVRvTW92ZS5hdHRyaWJ1dGVzLmNvbXBJZC50b1N0cmluZygpLnNlYXJjaChta3RvU3BvcnRzTW92YWJsZUV2ZW50Q29tcElkc01hdGNoKSAhPSAtMSAmJlxuICAgICAgICAgICAgZGVzdE5vZGUuYXR0cmlidXRlcy5jb21wSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b1Nwb3J0c0V2ZW50Rm9sZGVyQ29tcElkc01hdGNoKSAhPSAtMSkgfHxcbiAgICAgICAgICAobm9kZVRvTW92ZS5hdHRyaWJ1dGVzLmNvbXBJZC50b1N0cmluZygpLnNlYXJjaChta3RvVGVjaG5vbG9neU1vdmFibGVFdmVudENvbXBJZHNNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICAgIGRlc3ROb2RlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9UZWNobm9sb2d5RXZlbnRGb2xkZXJDb21wSWRzTWF0Y2gpICE9IC0xKSB8fFxuICAgICAgICAgIChub2RlVG9Nb3ZlLmF0dHJpYnV0ZXMuY29tcElkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9UcmF2ZWxNb3ZhYmxlRXZlbnRDb21wSWRzTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICBkZXN0Tm9kZS5hdHRyaWJ1dGVzLmNvbXBJZC50b1N0cmluZygpLnNlYXJjaChta3RvVHJhdmVsRXZlbnRGb2xkZXJDb21wSWRzTWF0Y2gpICE9IC0xKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbm9kZVRvTW92ZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSAmJlxuICAgICAgZGVzdE5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTFcbiAgICApIHtcbiAgICAgIGN1cnJOb2RlID0gbm9kZVRvTW92ZVxuICAgICAgZGVwdGggPSBjdXJyTm9kZS5nZXREZXB0aCgpXG4gICAgICBmb3IgKGlpID0gMDsgaWkgPCBkZXB0aDsgaWkrKykge1xuICAgICAgICBpZiAoY3Vyck5vZGUudGV4dCA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgIGN1cnJOb2RlID0gZGVzdE5vZGVcbiAgICAgICAgICBkZXB0aCA9IGN1cnJOb2RlLmdldERlcHRoKClcbiAgICAgICAgICBmb3IgKGlpID0gMDsgaWkgPCBkZXB0aDsgaWkrKykge1xuICAgICAgICAgICAgaWYgKGN1cnJOb2RlLnRleHQgPT0gdXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBjdXJyTm9kZSA9IGN1cnJOb2RlLnBhcmVudE5vZGVcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0gZWxzZSBpZiAobm9kZVRvTW92ZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgY3Vyck5vZGUgPSBub2RlVG9Nb3ZlXG4gICAgICBkZXB0aCA9IGN1cnJOb2RlLmdldERlcHRoKClcbiAgICAgIGZvciAoaWkgPSAwOyBpaSA8IGRlcHRoOyBpaSsrKSB7XG4gICAgICAgIGlmIChjdXJyTm9kZS50ZXh0ID09IHVzZXJOYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBjdXJyTm9kZSA9IGN1cnJOb2RlLnBhcmVudE5vZGVcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0gZWxzZSBpZiAoZGVzdE5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEpIHtcbiAgICAgIGN1cnJOb2RlID0gZGVzdE5vZGVcbiAgICAgIGRlcHRoID0gY3Vyck5vZGUuZ2V0RGVwdGgoKVxuICAgICAgZm9yIChpaSA9IDA7IGlpIDwgZGVwdGg7IGlpKyspIHtcbiAgICAgICAgaWYgKGN1cnJOb2RlLnRleHQgPT0gdXNlck5hbWUpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUucGFyZW50Tm9kZVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gZGlzYWJsZXMgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nIHRyZWUgbm9kZSBpdGVtcyBvdGhlciB0aGFuIHRob3NlIHRoYXRcbiAqICBvcmlnaW5hdGUgYW5kIGFyZSBkZXN0aW5lZCBmb3IgYSBsb2NhdGlvbiB3aXRoaW4gdGhlIHVzZXIncyByb290IGZvbGRlclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuZGlzYWJsZURyYWdBbmREcm9wID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IFRyZWUgTm9kZSBEcm9wJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0LnRyZWUuVHJlZURyb3Bab25lLnByb3RvdHlwZS5wcm9jZXNzRHJvcCcpKSB7XG4gICAgRXh0LnRyZWUuVHJlZURyb3Bab25lLnByb3RvdHlwZS5wcm9jZXNzRHJvcCA9IGZ1bmN0aW9uICh0YXJnZXQsIGRhdGEsIHBvaW50LCBkZCwgZSwgZHJvcE5vZGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogVHJlZSBOb2RlIERyb3AnKVxuICAgICAgaWYgKEFQUC5ldmFsdWF0ZU1vdmVJdGVtKGRyb3BOb2RlLCB0YXJnZXQpKSB7XG4gICAgICAgIGxldCBkcm9wRXZlbnQgPSB7XG4gICAgICAgICAgICB0cmVlOiB0aGlzLnRyZWUsXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBwb2ludDogcG9pbnQsXG4gICAgICAgICAgICBzb3VyY2U6IGRkLFxuICAgICAgICAgICAgcmF3RXZlbnQ6IGUsXG4gICAgICAgICAgICBkcm9wTm9kZTogZHJvcE5vZGUsXG4gICAgICAgICAgICBjYW5jZWw6ICFkcm9wTm9kZSxcbiAgICAgICAgICAgIGRyb3BTdGF0dXM6IGZhbHNlXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXR2YWwgPSB0aGlzLnRyZWUuZmlyZUV2ZW50KCdiZWZvcmVub2RlZHJvcCcsIGRyb3BFdmVudClcbiAgICAgICAgaWYgKHJldHZhbCA9PT0gZmFsc2UgfHwgZHJvcEV2ZW50LmNhbmNlbCA9PT0gdHJ1ZSB8fCAhZHJvcEV2ZW50LmRyb3BOb2RlKSB7XG4gICAgICAgICAgdGFyZ2V0LnVpLmVuZERyb3AoKVxuICAgICAgICAgIHJldHVybiBkcm9wRXZlbnQuZHJvcFN0YXR1c1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHt0YXJnZXR9ID0gZHJvcEV2ZW50XG4gICAgICAgIGlmIChwb2ludCA9PSAnYXBwZW5kJyAmJiAhdGFyZ2V0LmlzRXhwYW5kZWQoKSkge1xuICAgICAgICAgIHRhcmdldC5leHBhbmQoXG4gICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHRoaXMuY29tcGxldGVEcm9wKGRyb3BFdmVudClcbiAgICAgICAgICAgIH0uY3JlYXRlRGVsZWdhdGUodGhpcylcbiAgICAgICAgICApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb21wbGV0ZURyb3AoZHJvcEV2ZW50KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBldmFsdWF0ZXMgdGhlIGN1cnJlbnQgbWVudSBjb250ZXh0IHRvIGRldGVybWluZSBpZiBpdGVtcyBzaG91bGQgYmVcbiAqICBkaXNhYmxlZFxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuZXZhbHVhdGVNZW51ID0gZnVuY3Rpb24gKHRyaWdnZXJlZEZyb20sIG1lbnUsIGNhbnZhcywgdG9vbGJhcikge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFdmFsdWF0aW5nOiBNZW51JylcbiAgaWYgKHVzZXJOYW1lKSB7XG4gICAgbGV0IHRvQmVEaXNhYmxlZCA9IGZhbHNlXG5cbiAgICBzd2l0Y2ggKHRyaWdnZXJlZEZyb20pIHtcbiAgICAgIGNhc2UgJ3RyZWUnOlxuICAgICAgICBpZiAoXG4gICAgICAgICAgbWVudSAmJlxuICAgICAgICAgIG1lbnUuY3Vyck5vZGUgJiZcbiAgICAgICAgICBtZW51LmN1cnJOb2RlLmF0dHJpYnV0ZXMgJiZcbiAgICAgICAgICBtZW51LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkICYmXG4gICAgICAgICAgKG1lbnUuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEgfHxcbiAgICAgICAgICAgIG1lbnUuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEpXG4gICAgICAgICkge1xuICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IHRydWVcblxuICAgICAgICAgIGlmIChtZW51LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgICBsZXQgaWksXG4gICAgICAgICAgICAgIHtjdXJyTm9kZX0gPSBtZW51LFxuICAgICAgICAgICAgICBkZXB0aCA9IGN1cnJOb2RlLmdldERlcHRoKClcblxuICAgICAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgZGVwdGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgaWYgKGN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjdXJyTm9kZSA9IGN1cnJOb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgKCFtZW51IHx8ICFtZW51LmN1cnJOb2RlIHx8ICFtZW51LmN1cnJOb2RlLmF0dHJpYnV0ZXMgfHwgIW1lbnUuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQpICYmXG4gICAgICAgICAgY2FudmFzICYmXG4gICAgICAgICAgY2FudmFzLmNvbmZpZyAmJlxuICAgICAgICAgIGNhbnZhcy5jb25maWcuYWNjZXNzWm9uZUlkICYmXG4gICAgICAgICAgKGNhbnZhcy5jb25maWcuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xIHx8XG4gICAgICAgICAgICAoY2FudmFzLmNvbmZpZy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICAgICAgKChjYW52YXMuY29uZmlnLmV4cE5vZGVJZCAmJiBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChjYW52YXMuY29uZmlnLmV4cE5vZGVJZCkpIHx8XG4gICAgICAgICAgICAgICAgKGNhbnZhcy5jb25maWcuZGxab25lRm9sZGVySWQgJiYgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2FudmFzLmNvbmZpZy5kbFpvbmVGb2xkZXJJZCkpKSkpXG4gICAgICAgICkge1xuICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IHRydWVcblxuICAgICAgICAgIGlmIChjYW52YXMuY29uZmlnLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgbGV0IGlpLCBjdXJyTm9kZSwgZGVwdGhcblxuICAgICAgICAgICAgaWYgKGNhbnZhcy5jb25maWcuZXhwTm9kZUlkKSB7XG4gICAgICAgICAgICAgIGN1cnJOb2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2FudmFzLmNvbmZpZy5leHBOb2RlSWQpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjdXJyTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKGNhbnZhcy5jb25maWcuZGxab25lRm9sZGVySWQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZXB0aCA9IGN1cnJOb2RlLmdldERlcHRoKClcblxuICAgICAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgZGVwdGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgaWYgKGN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjdXJyTm9kZSA9IGN1cnJOb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgKCFtZW51IHx8ICFtZW51LmN1cnJOb2RlIHx8ICFtZW51LmN1cnJOb2RlLmF0dHJpYnV0ZXMgfHwgIW1lbnUuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQpICYmXG4gICAgICAgICAgY2FudmFzICYmXG4gICAgICAgICAgY2FudmFzLmNvbmZpZyAmJlxuICAgICAgICAgICFjYW52YXMuY29uZmlnLmFjY2Vzc1pvbmVJZFxuICAgICAgICApIHtcbiAgICAgICAgICB0b0JlRGlzYWJsZWQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvQmVEaXNhYmxlZFxuXG4gICAgICBjYXNlICdidXR0b24nOlxuICAgICAgICBpZiAoXG4gICAgICAgICAgY2FudmFzICYmXG4gICAgICAgICAgY2FudmFzLmNvbmZpZyAmJlxuICAgICAgICAgIGNhbnZhcy5jb25maWcuYWNjZXNzWm9uZUlkICYmXG4gICAgICAgICAgKGNhbnZhcy5jb25maWcuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xIHx8XG4gICAgICAgICAgICAoY2FudmFzLmNvbmZpZy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEgJiZcbiAgICAgICAgICAgICAgKChjYW52YXMuY29uZmlnLmV4cE5vZGVJZCAmJiBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChjYW52YXMuY29uZmlnLmV4cE5vZGVJZCkpIHx8XG4gICAgICAgICAgICAgICAgKGNhbnZhcy5jb25maWcuZGxab25lRm9sZGVySWQgJiYgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2FudmFzLmNvbmZpZy5kbFpvbmVGb2xkZXJJZCkpKSkpXG4gICAgICAgICkge1xuICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IHRydWVcblxuICAgICAgICAgIGlmIChjYW52YXMuY29uZmlnLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgbGV0IGN1cnJOb2RlLCBkZXB0aFxuXG4gICAgICAgICAgICBpZiAoY2FudmFzLmNvbmZpZy5leHBOb2RlSWQpIHtcbiAgICAgICAgICAgICAgY3Vyck5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChjYW52YXMuY29uZmlnLmV4cE5vZGVJZClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGN1cnJOb2RlID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQoY2FudmFzLmNvbmZpZy5kbFpvbmVGb2xkZXJJZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlcHRoID0gY3Vyck5vZGUuZ2V0RGVwdGgoKVxuXG4gICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgZGVwdGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgaWYgKGN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCA9PSB1c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgIHRvQmVEaXNhYmxlZCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjdXJyTm9kZSA9IGN1cnJOb2RlLnBhcmVudE5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoKCFjYW52YXMgfHwgIWNhbnZhcy5jb25maWcgfHwgIWNhbnZhcy5jb25maWcuYWNjZXNzWm9uZUlkKSAmJiBNa3RNYWluTmF2ICYmIE1rdE1haW5OYXYuYWN0aXZlTmF2ID09ICd0bkN1c3RBZG1pbicpIHtcbiAgICAgICAgICB0b0JlRGlzYWJsZWQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvQmVEaXNhYmxlZFxuXG4gICAgICBjYXNlICdzb2NpYWxBcHBUb29sYmFyJzpcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0b29sYmFyLmdldFNvY2lhbEFwcCgpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNvY2lhbEFwcCgpLmdldCgnem9uZUlkJykgJiZcbiAgICAgICAgICAgIHRvb2xiYXIuZ2V0U29jaWFsQXBwKCkuZ2V0KCd6b25lSWQnKS50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkgfHxcbiAgICAgICAgICAodG9vbGJhci5nZXRTb2NpYWxBcHAoKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNvY2lhbEFwcCgpLmdldE5vZGVKc29uKCkgJiZcbiAgICAgICAgICAgIHRvb2xiYXIuZ2V0U29jaWFsQXBwKCkuZ2V0Tm9kZUpzb24oKS5pZCAmJlxuICAgICAgICAgICAgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQodG9vbGJhci5nZXRTb2NpYWxBcHAoKS5nZXROb2RlSnNvbigpLmlkKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdG9CZURpc2FibGVkID0gdHJ1ZVxuXG4gICAgICAgICAgaWYgKHRvb2xiYXIuZ2V0U29jaWFsQXBwKCkuZ2V0KCd6b25lSWQnKS50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgbGV0IGlpLFxuICAgICAgICAgICAgICBjdXJyTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKHRvb2xiYXIuZ2V0U29jaWFsQXBwKCkuZ2V0Tm9kZUpzb24oKS5pZCksXG4gICAgICAgICAgICAgIGRlcHRoID0gY3Vyck5vZGUuZ2V0RGVwdGgoKVxuXG4gICAgICAgICAgICBmb3IgKGlpID0gMDsgaWkgPCBkZXB0aDsgaWkrKykge1xuICAgICAgICAgICAgICBpZiAoY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0ID09IHVzZXJOYW1lKSB7XG4gICAgICAgICAgICAgICAgdG9CZURpc2FibGVkID0gZmFsc2VcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG9CZURpc2FibGVkXG5cbiAgICAgIGNhc2UgJ21vYmlsZVB1c2hOb3RpZmljYXRpb24nOlxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRvb2xiYXIuZ2V0TW9iaWxlUHVzaE5vdGlmaWNhdGlvbigpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXQoJ3pvbmVJZCcpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB8fFxuICAgICAgICAgICh0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXROb2RlSnNvbigpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXROb2RlSnNvbigpLmlkICYmXG4gICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZCh0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXROb2RlSnNvbigpLmlkKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdG9CZURpc2FibGVkID0gdHJ1ZVxuXG4gICAgICAgICAgaWYgKHRvb2xiYXIuZ2V0TW9iaWxlUHVzaE5vdGlmaWNhdGlvbigpLmdldCgnem9uZUlkJykudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGxldCBpaSxcbiAgICAgICAgICAgICAgY3Vyck5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZCh0b29sYmFyLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXROb2RlSnNvbigpLmlkKSxcbiAgICAgICAgICAgICAgZGVwdGggPSBjdXJyTm9kZS5nZXREZXB0aCgpXG5cbiAgICAgICAgICAgIGZvciAoaWkgPSAwOyBpaSA8IGRlcHRoOyBpaSsrKSB7XG4gICAgICAgICAgICAgIGlmIChjdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQgPT0gdXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICB0b0JlRGlzYWJsZWQgPSBmYWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY3Vyck5vZGUgPSBjdXJyTm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b0JlRGlzYWJsZWRcblxuICAgICAgY2FzZSAnaW5BcHBNZXNzYWdlJzpcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0b29sYmFyLmdldEluQXBwTWVzc2FnZSgpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldEluQXBwTWVzc2FnZSgpLmdldCgnem9uZUlkJykgJiZcbiAgICAgICAgICAgIHRvb2xiYXIuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0KCd6b25lSWQnKS50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkgfHxcbiAgICAgICAgICAodG9vbGJhci5nZXRJbkFwcE1lc3NhZ2UoKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldEluQXBwTWVzc2FnZSgpLmdldE5vZGVKc29uKCkgJiZcbiAgICAgICAgICAgIHRvb2xiYXIuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0Tm9kZUpzb24oKS5pZCAmJlxuICAgICAgICAgICAgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQodG9vbGJhci5nZXRJbkFwcE1lc3NhZ2UoKS5nZXROb2RlSnNvbigpLmlkKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdG9CZURpc2FibGVkID0gdHJ1ZVxuXG4gICAgICAgICAgaWYgKHRvb2xiYXIuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0KCd6b25lSWQnKS50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgbGV0IGlpLFxuICAgICAgICAgICAgICBjdXJyTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKHRvb2xiYXIuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0Tm9kZUpzb24oKS5pZCksXG4gICAgICAgICAgICAgIGRlcHRoID0gY3Vyck5vZGUuZ2V0RGVwdGgoKVxuXG4gICAgICAgICAgICBmb3IgKGlpID0gMDsgaWkgPCBkZXB0aDsgaWkrKykge1xuICAgICAgICAgICAgICBpZiAoY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0ID09IHVzZXJOYW1lKSB7XG4gICAgICAgICAgICAgICAgdG9CZURpc2FibGVkID0gZmFsc2VcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG9CZURpc2FibGVkXG5cbiAgICAgIGNhc2UgJ3Ntc01lc3NhZ2UnOlxuICAgICAgICBpZiAoXG4gICAgICAgICAgKHRvb2xiYXIuZ2V0U21zTWVzc2FnZSgpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXQoJ3pvbmVJZCcpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB8fFxuICAgICAgICAgICh0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXQoJ3pvbmVJZCcpLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXROb2RlSnNvbigpICYmXG4gICAgICAgICAgICB0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXROb2RlSnNvbigpLmlkICYmXG4gICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZCh0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXROb2RlSnNvbigpLmlkKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgdG9CZURpc2FibGVkID0gdHJ1ZVxuXG4gICAgICAgICAgaWYgKHRvb2xiYXIuZ2V0U21zTWVzc2FnZSgpLmdldCgnem9uZUlkJykudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGxldCBpaSxcbiAgICAgICAgICAgICAgY3Vyck5vZGUgPSBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZCh0b29sYmFyLmdldFNtc01lc3NhZ2UoKS5nZXROb2RlSnNvbigpLmlkKSxcbiAgICAgICAgICAgICAgZGVwdGggPSBjdXJyTm9kZS5nZXREZXB0aCgpXG5cbiAgICAgICAgICAgIGZvciAoaWkgPSAwOyBpaSA8IGRlcHRoOyBpaSsrKSB7XG4gICAgICAgICAgICAgIGlmIChjdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQgPT0gdXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICB0b0JlRGlzYWJsZWQgPSBmYWxzZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY3Vyck5vZGUgPSBjdXJyTm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b0JlRGlzYWJsZWRcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbn1cblxuQVBQLmRpc2FibGVBY2NvdW50QUkgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogQWNjb3VudCBBSScpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuY29udHJvbGxlci5hYm0uaWNwTW9kZWxpbmcuRGVsZXRlTW9kZWxGb3JtLnByb3RvdHlwZS5vblN1Ym1pdCcpKSB7XG4gICAgTWt0My5jb250cm9sbGVyLmFibS5pY3BNb2RlbGluZy5EZWxldGVNb2RlbEZvcm0ucHJvdG90eXBlLm9uU3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ2hpamFja2VkIG9uRGVsZXRlTW9kZWxDbGljayBjbGljaycpXG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIuYWJtLmljcE1vZGVsaW5nLlR1bmVNb2RlbEZvcm0ucHJvdG90eXBlLm9uU3VibWl0JykpIHtcbiAgICBNa3QzLmNvbnRyb2xsZXIuYWJtLmljcE1vZGVsaW5nLlR1bmVNb2RlbEZvcm0ucHJvdG90eXBlLm9uU3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ2hpamFja2VkIG9uU3VibWl0IGNsaWNrJylcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5jb250cm9sbGVyLmFibS5pY3BNb2RlbGluZy5VcGRhdGVBY2NvdW50c0Zvcm0ucHJvdG90eXBlLm9uU3VibWl0JykpIHtcbiAgICBNa3QzLmNvbnRyb2xsZXIuYWJtLmljcE1vZGVsaW5nLlVwZGF0ZUFjY291bnRzRm9ybS5wcm90b3R5cGUub25TdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnaGlqYWNrZWQgb25CZWZvcmVQdXNoRGF0YSBjbGljaycpXG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxufVxuXG4vLyBmb3IgYWxsIGFzc2V0IHR5cGVzIGZvciBhbGwgQWN0aW9ucyBCdXR0b25zIGFuZCBSaWdodC1jbGljayBUcmVlIG1lbnVzIGluIGFsbCBhcmVhcy5cbkFQUC5kaXNhYmxlTWVudXMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogTWVudXMnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdFeHQubWVudS5NZW51LnByb3RvdHlwZS5zaG93QXQnKSkge1xuICAgIC8vIERpc2FibGUgQUxMIGFyZWFzID4gQUxMIGFzc2V0cyA+IEFMTCBBY3Rpb25zIGFuZCBSaWdodC1jbGljayBtZW51cyBleGNlcHQgU29jaWFsIEFwcCwgUHVzaCBOb3RpZmljYXRpb24sIGFuZCBJbi1BcHAgTWVzc2FnZSBBY3Rpb25zIEJ1dHRvbnNcbiAgICBFeHQubWVudS5NZW51LnByb3RvdHlwZS5zaG93QXQgPSBmdW5jdGlvbiAoeHksIHBhcmVudE1lbnUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBBY3Rpb25zIGFuZCBSaWdodC1jbGljayBtZW51cyBmb3IgQUxMIGluIEFMTCcpXG4gICAgICBpZiAodGhpcy5maXJlRXZlbnQoJ2JlZm9yZXNob3cnLCB0aGlzKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgbGV0IGRpc2FibGUsXG4gICAgICAgICAgbWVudSA9IHRoaXMsXG4gICAgICAgICAgbUl0ZW1zID0gdGhpcy5pdGVtcyxcbiAgICAgICAgICBjYW52YXMgPSBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCksXG4gICAgICAgICAgaXRlbXNUb0Rpc2FibGUgPSBbXG4gICAgICAgICAgICAvLyBHbG9iYWwgPiBGb3JtID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnZm9ybUFwcHJvdmUnLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICdmb3JtQ2xvbmUnLCAvL0Nsb25lIEZvcm1cbiAgICAgICAgICAgICdmb3JtRGVsZXRlJywgLy9EZWxldGUgRm9ybVxuICAgICAgICAgICAgJ2Zvcm1Nb3ZlJywgLy9Nb3ZlXG4gICAgICAgICAgICAnZm9ybURyYWZ0QXBwcm92ZScsIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICAgICAgLy8gR2xvYmFsID4gTGFuZGluZyBQYWdlID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAncGFnZUFwcHJvdmUnLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICdwYWdlVW5hcHByb3ZlJywgLy9VbmFwcHJvdmVcbiAgICAgICAgICAgICdwYWdlQ29udmVydFRvVGVzdEdyb3VwJywgLy9Db252ZXJ0IHRvIFRlc3QgR3JvdXBcbiAgICAgICAgICAgICdwYWdlQ2xvbmUnLCAvL0Nsb25lXG4gICAgICAgICAgICAncGFnZURlbGV0ZScsIC8vRGVsZXRlXG4gICAgICAgICAgICAncGFnZU1vdmUnLCAvL01vdmVcbiAgICAgICAgICAgICdwYWdlRHJhZnRBcHByb3ZlJywgLy9BcHByb3ZlIERyYWZ0XG4gICAgICAgICAgICAvLyBHbG9iYWwgPiBFbWFpbCA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ2VtYWlsQXBwcm92ZScsIC8vQXBwcm92ZVxuICAgICAgICAgICAgJ2VtYWlsVW5hcHByb3ZlJywgLy9VbmFwcHJvdmVcbiAgICAgICAgICAgICdlbWFpbENsb25lJywgLy9DbG9uZVxuICAgICAgICAgICAgJ2VtYWlsRGVsZXRlJywgLy9EZWxldGVcbiAgICAgICAgICAgICdlbWFpbE1vdmUnLCAvL01vdmVcbiAgICAgICAgICAgICdlbWFpbE5ld1Rlc3QnLCAvL05ldyBUZXN0XG4gICAgICAgICAgICAnZW1haWxEcmFmdEFwcHJvdmUnLCAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgICAgICdlbWFpbEFwcHJvdmVUZXN0JywgLy9BcHByb3ZlIFRlc3RcbiAgICAgICAgICAgIC8vIEdsb2JhbCA+IFNtYXJ0IExpc3QsIExpc3QsIFNlZ21lbnQgPiBBY3Rpb25zIEJ1dHRvbiAmIFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdpbXBvcnRMaXN0JywgLy9JbXBvcnQgTGlzdFxuICAgICAgICAgICAgJ2Nsb25lU21hcnRsaXN0JywgLy9DbG9uZSBTbWFydCBMaXN0XG4gICAgICAgICAgICAnY2xvbmVMaXN0JywgLy9DbG9uZSBMaXN0XG4gICAgICAgICAgICAnZGVsZXRlTGlzdCcsIC8vRGVsZXRlIExpc3RcbiAgICAgICAgICAgICdzaG93U3VwcG9ydEhpc3RvcnknLCAvL1N1cHBvcnQgVG9vbHMgLSBIaXN0b3J5XG4gICAgICAgICAgICAnc2hvd1N1cHBvcnRVc2FnZVBlcmYnLCAvL1N1cHBvcnQgVG9vbHMgLSBSdW4gU3RhdHNcbiAgICAgICAgICAgICdzaG93U21hcnRMaXN0UHJvY2Vzc29yRGlhZycsIC8vUHJvY2Vzc29yIERpYWdub3N0aWNzXG4gICAgICAgICAgICAnc2hvd1NtYXJ0TGlzdFByb2Nlc3Nvck92ZXJyaWRlJywgLy9PdmVycmlkZSBQcm9jZXNzb3JcbiAgICAgICAgICAgIC8vIEdsb2JhbCA+IFJlcG9ydCA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgICAnY2xvbmVSZXBvcnRfYXR4Q2FudmFzT3ZlcnZpZXcnLCAvL0Nsb25lIFJlcG9ydFxuICAgICAgICAgICAgJ2RlbGV0ZVJlcG9ydCcsIC8vRGVsZXRlIFJlcG9ydFxuICAgICAgICAgICAgLy8gR2xvYmFsID4gUmVwb3J0ID4gUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ2Nsb25lUmVwb3J0JywgLy9DbG9uZSBSZXBvcnRcbiAgICAgICAgICAgICdkZWxldGVSZXBvcnQnLCAvL0RlbGV0ZSBSZXBvcnRcbiAgICAgICAgICAgICdtb3ZlUmVwb3J0JywgLy9Nb3ZlIFJlcG9ydFxuICAgICAgICAgICAgLy8gR2xvYmFsID4gTGVhZCA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ2JsYWNrQ2F0RGlhZycsIC8vQmxhY2tDYXQgRGlhZ25vc3RpY3NcbiAgICAgICAgICAgICdtZXJnZUxlYWRzJywgLy9NZXJnZSBMZWFkc1xuICAgICAgICAgICAgJ3NlbmRFbWFpbCcsIC8vU2VuZCBFbWFpbC4uLlxuICAgICAgICAgICAgJ3NlbmRQdXNoTm90aWZpY2F0aW9uJywgLy9TZW5kIFB1c2ggTm90aWZpY2F0aW9uLi4uXG4gICAgICAgICAgICAnc3Vic2NyaWJlVG9WaWJlc0xpc3QnLCAvL1N1YnNjcmliZSB0byBWaWJlcyBMaXN0Li4uXG4gICAgICAgICAgICAnc2VuZFNNUycsIC8vU2VuZCBTTVMuLi5cbiAgICAgICAgICAgICd1bnN1YnNjcmliZUZyb21WaWJlc0xpc3QnLCAvL1Vuc3Vic2NyaWJlIGZyb20gVmliZXMgTGlzdC4uLlxuICAgICAgICAgICAgJ2FkZFRvTGlzdCcsIC8vQWRkIHRvIExpc3QuLi5cbiAgICAgICAgICAgICdyZW1vdmVGcm9tTGlzdCcsIC8vUmVtb3ZlIGZyb20gTGlzdC4uLlxuICAgICAgICAgICAgJ2ludGVyZXN0aW5nTW9tZW50JywgLy9JbnRlcmVzdGluZyBNb21lbnQuLi5cbiAgICAgICAgICAgICdzZW5kQWxlcnQnLCAvL1NlbmQgQWxlcnQuLi5cbiAgICAgICAgICAgICdjaGFuZ2VTY29yZScsIC8vQ2hhbmdlIFNjb3JlLi4uXG4gICAgICAgICAgICAnY2hhbmdlRGF0YVZhbHVlJywgLy9DaGFuZ2UgRGF0YSBWYWx1ZS4uLlxuICAgICAgICAgICAgJ2FkZFRvTmFtZWRBY2NvdW50JywgLy9BZGQgdG8gTmFtZWQgQWNjb3VudC4uLlxuICAgICAgICAgICAgJ3JlbW92ZUZyb21OYW1lZEFjY291bnQnLCAvL1JlbW92ZSBmcm9tIE5hbWVkIEFjY291bnQuLi5cbiAgICAgICAgICAgICdjaGFuZ2VTdGF0dXNJblByb2dyZXNzaW9uJywgLy9DaGFuZ2UgUHJvZ3JhbSBTdGF0dXMuLi5cbiAgICAgICAgICAgICdhZGRUb051cnR1cmUnLCAvL0FkZCB0byBFbmdhZ2VtZW50IFByb2dyYW0uLi5cbiAgICAgICAgICAgICdjaGFuZ2VOdXJ0dXJlQ2FkZW5jZScsIC8vQ2hhbmdlIEVuZ2FnZW1lbnQgUHJvZ3JhbSBDYWRlbmNlLi4uXG4gICAgICAgICAgICAnY2hhbmdlTnVydHVyZVRyYWNrJywgLy9DaGFuZ2UgRW5nYWdlbWVudCBQcm9ncmFtIFN0cmVhbS4uLlxuICAgICAgICAgICAgJ2NoYW5nZUxlYWRQYXJ0aXRpb24nLCAvL0NoYW5nZSBMZWFkIFBhcnRpdGlvbi4uLlxuICAgICAgICAgICAgJ2NoYW5nZVJldmVudWVTdGFnZScsIC8vQ2hhbmdlIFJldmVudWUgU3RhZ2UuLi5cbiAgICAgICAgICAgICdkZWxldGVMZWFkJywgLy9EZWxldGUgTGVhZC4uLlxuICAgICAgICAgICAgJ2dpdmVDcmVkaXRUb1JlZmVycmVyJywgLy9HaXZlIENyZWRpdCB0byBSZWZlcnJlclxuICAgICAgICAgICAgJ3JlcXVlc3RDYW1wYWlnbicsIC8vUmVxdWVzdCBDYW1wYWlnbi4uLlxuICAgICAgICAgICAgJ3JlbW92ZUZyb21GbG93JywgLy9SZW1vdmUgZnJvbSBGbG93Li4uXG4gICAgICAgICAgICAncHVzaExlYWRUb1NGREMnLCAvL1N5bmMgTGVhZCB0byBTRkRDLi4uXG4gICAgICAgICAgICAnY3JlYXRlVGFzaycsIC8vQ3JlYXRlIFRhc2suLi5cbiAgICAgICAgICAgICdjb252ZXJ0TGVhZCcsIC8vQ29udmVydCBMZWFkLi4uXG4gICAgICAgICAgICAnY2hhbmdlT3duZXInLCAvL0NoYW5nZSBPd25lci4uLlxuICAgICAgICAgICAgJ2RlbGV0ZUxlYWRGcm9tU0ZEQycsIC8vRGVsZXRlIExlYWQgZnJvbSBTRkRDLi4uXG4gICAgICAgICAgICAnYWRkVG9TRkRDQ2FtcGFpZ24nLCAvL0FkZCB0byBTRkRDIENhbXBhaWduLi4uXG4gICAgICAgICAgICAnY2hhbmdlU3RhdHVzSW5TRkRDQ2FtcGFpZ24nLCAvL0NoYW5nZSBTdGF0dXMgaW4gU0ZEQyBDYW1wYWlnbi4uLlxuICAgICAgICAgICAgJ3JlbW92ZUZyb21TRkRDQ2FtcGFpZ24nLCAvL1JlbW92ZSBmcm9tIFNGREMgQ2FtcGFpZ24uLi5cbiAgICAgICAgICAgICdzeW5jTGVhZFRvTWljcm9zb2Z0JywgLy9TeW5jIExlYWQgdG8gTWljcm9zb2Z0XG4gICAgICAgICAgICAvLyBHbG9iYWwgPiBQcm9ncmFtcywgQW5hbHl6ZXJzLCBhbmQgUmVwb3J0cyA+IFNldHVwIFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdkZWxldGVJdGVtJywgLy9EZWxldGVcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzID4gTmV3IEJ1dHRvblxuICAgICAgICAgICAgJ2NyZWF0ZVByb2dyYW1Gb2xkZXInLCAvL05ldyBDYW1wYWlnbiBGb2xkZXJcbiAgICAgICAgICAgICduZXdTbWFydENhbXBhaWduJywgLy9OZXcgU21hcnQgQ2FtcGFpZ25cbiAgICAgICAgICAgICdjcmVhdGVOZXdNYXJrZXRpbmdQcm9ncmFtJywgLy9OZXcgUHJvZ3JhbVxuICAgICAgICAgICAgJ2ltcG9ydFByb2dyYW0nLCAvL0ltcG9ydCBQcm9ncmFtXG4gICAgICAgICAgICAvLyBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IERlZmF1bHQgJiBFbWFpbCBTZW5kIFByb2dyYW1zID4gQWN0aW9ucyBCdXR0b25cbiAgICAgICAgICAgICdlbnRyeVJlc2NoZWR1bGVFbnRyaWVzJywgLy9SZXNjaGVkdWxlIEVudHJpZXNcbiAgICAgICAgICAgICdzZmRjQ2FtcGFpZ25TeW5jJywgLy9TYWxlc2ZvcmNlIENhbXBhaWduIFN5bmNcbiAgICAgICAgICAgICdjbG9uZU1hcmtldGluZ1Byb2dyYW0nLCAvL0Nsb25lXG4gICAgICAgICAgICAnZGVsZXRlTWFya2V0aW5nUHJvZ3JhbScsIC8vRGVsZXRlXG4gICAgICAgICAgICAvLyBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IEV2ZW50IFByb2dyYW0gPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICAgJ2V2ZW50U2NoZWR1bGUnLCAvL1NjaGVkdWxlXG4gICAgICAgICAgICAnZW50cnlSZXNjaGVkdWxlRW50cmllcycsIC8vUmVzY2hlZHVsZSBFbnRyaWVzXG4gICAgICAgICAgICAnd2ViaW5hclNldHRpbmdzJywgLy9FdmVudCBTZXR0aW5nc1xuICAgICAgICAgICAgJ3NmZGNDYW1wYWlnblN5bmMnLCAvL1NhbGVzZm9yY2UgQ2FtcGFpZ24gU3luY1xuICAgICAgICAgICAgJ2Nsb25lTWFya2V0aW5nRXZlbnQnLCAvL0Nsb25lXG4gICAgICAgICAgICAnZGVsZXRlTWFya2V0aW5nRXZlbnQnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ3JlZnJlc2hGcm9tV2ViaW5hclByb3ZpZGVyJywgLy9SZWZyZXNoIGZyb20gV2ViaW5hciBQcm92aWRlclxuICAgICAgICAgICAgLy8gTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBOdXJ0dXJpbmcgUHJvZ3JhbSA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgICAnc2ZkY0NhbXBhaWduU3luYycsIC8vU2FsZXNmb3JjZSBDYW1wYWlnbiBTeW5jXG4gICAgICAgICAgICAnY2xvbmVOdXJ0dXJlUHJvZ3JhbScsIC8vQ2xvbmVcbiAgICAgICAgICAgICdkZWxldGVOdXJ0dXJlUHJvZ3JhbScsIC8vRGVsZXRlXG4gICAgICAgICAgICAndGVzdE51cnR1cmVQcm9ncmFtJywgLy9UZXN0IFN0cmVhbVxuICAgICAgICAgICAgLy8gTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBTbWFydCBDYW1wYWlnbiA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgICAvLyBEZWZhdWx0LCBFbWFpbCBTZW5kLCBFdmVudCwgYW5kIE51cnR1cmluZyBQcm9ncmFtczsgU21hcnQgQ2FtcGFpZ24sIEZvbGRlciA+IFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICduZXdTbWFydENhbXBhaWduJywgLy9OZXcgU21hcnQgQ2FtcGFpZ25cbiAgICAgICAgICAgICdjcmVhdGVOZXdNYXJrZXRpbmdQcm9ncmFtJywgLy9OZXcgUHJvZ3JhbVxuICAgICAgICAgICAgJ25ld0xvY2FsQXNzZXQnLCAvL05ldyBMb2NhbCBBc3NldFxuICAgICAgICAgICAgJ2NyZWF0ZVByb2dyYW1Gb2xkZXInLCAvL05ldyBDYW1wYWlnbiBGb2xkZXJcbiAgICAgICAgICAgICdyZW5hbWVQcm9ncmFtRm9sZGVyJywgLy9SZW5hbWUgRm9sZGVyXG4gICAgICAgICAgICAnZGVsZXRlUHJvZ3JhbUZvbGRlcicsIC8vRGVsZXRlIEZvbGRlclxuICAgICAgICAgICAgJ2NvbnZlcnRUb0FyY2hpdmVGb2xkZXInLCAvL0NvbnZlcnQgVG8gQXJjaGl2ZSBGb2xkZXJcbiAgICAgICAgICAgICdjb252ZXJ0VG9DYW1wYWlnbkZvbGRlcicsIC8vQ29udmVydCBUbyBDYW1wYWlnbiBGb2xkZXJcbiAgICAgICAgICAgICdzY0Nsb25lJywgLy9DbG9uZVxuICAgICAgICAgICAgJ3NjQXJjaGl2ZScsIC8vRGVsZXRlXG4gICAgICAgICAgICAnc2NNb3ZlJywgLy9Nb3ZlXG4gICAgICAgICAgICAnY2xvbmVNYXJrZXRpbmdQcm9ncmFtJywgLy9DbG9uZVxuICAgICAgICAgICAgJ2RlbGV0ZU1hcmtldGluZ1Byb2dyYW0nLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ2Nsb25lTWFya2V0aW5nRXZlbnQnLCAvL0Nsb25lXG4gICAgICAgICAgICAnZGVsZXRlTWFya2V0aW5nRXZlbnQnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ2Nsb25lTnVydHVyZVByb2dyYW0nLCAvL0Nsb25lXG4gICAgICAgICAgICAnZGVsZXRlTnVydHVyZVByb2dyYW0nLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ2Nsb25lRW1haWxCYXRjaFByb2dyYW0nLCAvL0Nsb25lXG4gICAgICAgICAgICAnZGVsZXRlRW1haWxCYXRjaFByb2dyYW0nLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ2Nsb25lSW5BcHBQcm9ncmFtJywgLy9DbG9uZVxuICAgICAgICAgICAgJ2RlbGV0ZUluQXBwUHJvZ3JhbScsIC8vRGVsZXRlXG4gICAgICAgICAgICAnc2hhcmVQcm9ncmFtRm9sZGVyJywgLy9TaGFyZSBGb2xkZXJcbiAgICAgICAgICAgICdzY0FjdGl2YXRlJywgLy9BY3RpdmF0ZVxuICAgICAgICAgICAgJ3NjQWJvcnQnLCAvL0Fib3J0IENhbXBhaWduXG4gICAgICAgICAgICAnc2NDYW1wQ2hhbmdlSGlzdG9yeScsIC8vU3VwcG9ydCBUb29scyAtIENoYW5nZSBIaXN0b3J5XG4gICAgICAgICAgICAnc2NDYW1wUnVuSGlzdG9yeScsIC8vU3VwcG9ydCBUb29scyAtIFJ1biBIaXN0b3J5XG4gICAgICAgICAgICAnc2NDbGVhclBhbGV0dGUnLCAvL0NsZWFyIFBhbGV0dGUgQ2FjaGVcbiAgICAgICAgICAgICdzY0NsZWFyU21hcnRMaXN0JywgLy9DbGVhciBTbWFydCBMaXN0XG4gICAgICAgICAgICAnc2NDbGVhckZsb3cnLCAvL0NsZWFyIEZsb3dcbiAgICAgICAgICAgICdwcm9nR2VuZXJhdGVSZWYnLCAvL0J1aWxkIENhbXBhaWduIFJlZmVyZW5jZXNcbiAgICAgICAgICAgICdjaGVja0ZvckNvcnJ1cHRFbWFpbHMnLCAvL0NoZWNrIEZvciBDb3JydXB0IEVtYWlsc1xuICAgICAgICAgICAgJ3NvY2lhbEFwcEFwcHJvdmUnLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICdzb2NpYWxBcHBDbG9uZScsIC8vQ2xvbmVcbiAgICAgICAgICAgICdzb2NpYWxBcHBEZWxldGUnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ3NvY2lhbEFwcERyYWZ0QXBwcm92ZScsIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICAgICAgLy8gTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBQdXNoIE5vdGlmaWNhdGlvbiA+IFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdwdXNoTm90aWZpY2F0aW9uVW5hcHByb3ZlJywgLy9VbmFwcHJvdmVcbiAgICAgICAgICAgICdwdXNoTm90aWZpY2F0aW9uQXBwcm92ZScsIC8vQXBwcm92ZVxuICAgICAgICAgICAgJ3B1c2hOb3RpZmljYXRpb25TZW5kU2FtcGxlJywgLy9TZW5kIFNhbXBsZVxuICAgICAgICAgICAgJ3B1c2hOb3RpZmljYXRpb25DbG9uZScsIC8vQ2xvbmVcbiAgICAgICAgICAgICdwdXNoTm90aWZpY2F0aW9uRGVsZXRlJywgLy9EZWxldGVcbiAgICAgICAgICAgICdwdXNoTm90aWZpY2F0aW9uRHJhZnRTZW5kU2FtcGxlJywgLy9TZW5kIFNhbXBsZSBvZiBEcmFmdFxuICAgICAgICAgICAgJ3B1c2hOb3RpZmljYXRpb25EcmFmdEFwcHJvdmUnLCAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzID4gSW4tQXBwIE1lc3NhZ2UgPiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnaW5BcHBNZXNzYWdlVW5hcHByb3ZlJywgLy9VbmFwcHJvdmVcbiAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VBcHByb3ZlJywgLy9BcHByb3ZlXG4gICAgICAgICAgICAnaW5BcHBNZXNzYWdlU2VuZFNhbXBsZScsIC8vU2VuZCBTYW1wbGVcbiAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VDbG9uZScsIC8vQ2xvbmVcbiAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VEZWxldGUnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ2luQXBwTWVzc2FnZURyYWZ0U2VuZFNhbXBsZScsIC8vU2VuZCBTYW1wbGUgb2YgRHJhZnRcbiAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VEcmFmdEFwcHJvdmUnLCAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzID4gU01TIE1lc3NhZ2UgPiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnc21zTWVzc2FnZVVuYXBwcm92ZScsIC8vVW5hcHByb3ZlXG4gICAgICAgICAgICAnc21zTWVzc2FnZUFwcHJvdmUnLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICdzbXNNZXNzYWdlQ2xvbmUnLCAvL0Nsb25lXG4gICAgICAgICAgICAnc21zTWVzc2FnZURlbGV0ZScsIC8vRGVsZXRlXG4gICAgICAgICAgICAnc21zTWVzc2FnZURyYWZ0QXBwcm92ZScsIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICAgICAgLy8gTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBBTEwgUHJvZ3JhbXMgJiBGb2xkZXJzID4gTXkgVG9rZW5zIFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdkZWxldGVDdXN0b21Ub2tlbicsIC8vRGVsZXRlIFRva2VuXG4gICAgICAgICAgICAvLyBEZXNpZ24gU3R1ZGlvID4gRm9sZGVyID4gUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ25ld0xhbmRpbmdQYWdlJywgLy9OZXcgTGFuZGluZyBQYWdlXG4gICAgICAgICAgICAnbmV3VGVzdEdyb3VwJywgLy9OZXcgVGVzdCBHcm91cFxuICAgICAgICAgICAgJ25ld1BhZ2VUZW1wbGF0ZScsIC8vTmV3IExhbmRpbmcgUGFnZSBUZW1wbGF0ZVxuICAgICAgICAgICAgJ3BhZ2VUZW1wbGF0ZUltcG9ydCcsIC8vSW1wb3J0IFRlbXBsYXRlXG4gICAgICAgICAgICAnbmV3Rm9ybScsIC8vTmV3IEZvcm1cbiAgICAgICAgICAgICduZXdWaWRlb1NoYXJlJywgLy9OZXcgWW91VHViZSBWaWRlb1xuICAgICAgICAgICAgJ25ld1NoYXJlQnV0dG9uJywgLy9OZXcgU29jaWFsIEJ1dHRvblxuICAgICAgICAgICAgJ25ld1JlZmVycmFsT2ZmZXInLCAvL05ldyBSZWZlcnJhbCBPZmZlclxuICAgICAgICAgICAgJ25ld0VtYWlsJywgLy9OZXcgRW1haWxcbiAgICAgICAgICAgICduZXdFbWFpbFRlbXBsYXRlJywgLy9OZXcgRW1haWwgVGVtcGxhdGVcbiAgICAgICAgICAgICduZXdTbmlwcGV0JywgLy9OZXcgU25pcHBldFxuICAgICAgICAgICAgJ3VwbG9hZEltYWdlJywgLy9VcGxvYWQgSW1hZ2Ugb3IgRmlsZVxuICAgICAgICAgICAgJ3NoYXJlJywgLy9TaGFyZSBGb2xkZXJcbiAgICAgICAgICAgICdjcmVhdGVGb2xkZXInLCAvL05ldyBGb2xkZXJcbiAgICAgICAgICAgICdyZW5hbWVGb2xkZXInLCAvL1JlbmFtZSBGb2xkZXJcbiAgICAgICAgICAgICdkZWxldGVGb2xkZXInLCAvL0RlbGV0ZSBGb2xkZXJcbiAgICAgICAgICAgICdjb252ZXJ0VG9BcmNoaXZlRm9sZGVyJywgLy9Db252ZXJ0IFRvIEFyY2hpdmUgRm9sZGVyXG4gICAgICAgICAgICAnY29udmVydFRvRm9sZGVyJywgLy9Db252ZXJ0IFRvIEZvbGRlclxuICAgICAgICAgICAgLy8gRGVzaWduIFN0dWRpbyA+IExhbmRpbmcgUGFnZSBUZW1wbGF0ZSA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ2FwcHJvdmVQYWdlVGVtcGxhdGUnLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICd1bmFwcHJvdmVQYWdlVGVtcGxhdGUnLCAvL1VuYXBwcm92ZVxuICAgICAgICAgICAgJ2Nsb25lUGFnZVRlbXBsYXRlJywgLy9DbG9uZVxuICAgICAgICAgICAgJ3BhZ2VUZW1wbGF0ZURlbGV0ZScsIC8vRGVsZXRlXG4gICAgICAgICAgICAnYXBwcm92ZURyYWZ0UGFnZVRlbXBsYXRlJywgLy9BcHByb3ZlIERyYWZ0XG4gICAgICAgICAgICAvLyBEZXNpZ24gU3R1ZGlvID4gRW1haWwgVGVtcGxhdGUgPiBBY3Rpb25zIEJ1dHRvbiAmIFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdlbWFpbFRlbXBsYXRlQXBwcm92ZScsIC8vQXBwcm92ZVxuICAgICAgICAgICAgJ2VtYWlsVGVtcGxhdGVVbmFwcHJvdmUnLCAvL1VuYXBwcm92ZVxuICAgICAgICAgICAgJ2VtYWlsVGVtcGxhdGVDbG9uZScsIC8vQ2xvbmVcbiAgICAgICAgICAgICdlbWFpbFRlbXBsYXRlRGVsZXRlJywgLy9EZWxldGVcbiAgICAgICAgICAgICdlbWFpbFRlbXBsYXRlRHJhZnRBcHByb3ZlJywgLy9BcHByb3ZlIERyYWZ0XG4gICAgICAgICAgICAvLyBEZXNpZ24gU3R1ZGlvID4gU25pcHBldCA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ3NuaXBwZXRBcHByb3ZlJywgLy9BcHByb3ZlXG4gICAgICAgICAgICAnc25pcHBldFVuYXBwcm92ZScsIC8vVW5hcHByb3ZlXG4gICAgICAgICAgICAnc25pcHBldENsb25lJywgLy9DbG9uZVxuICAgICAgICAgICAgJ3NuaXBwZXREZWxldGUnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgJ3NuaXBwZXREcmFmdEFwcHJvdmUnLCAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgICAgIC8vIERlc2lnbiBTdHVkaW8gPiBJbWFnZSAmIEZpbGUgPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICAgJ3VwbG9hZEltYWdlJywgLy9VcGxvYWQgSW1hZ2Ugb3IgRmlsZVxuICAgICAgICAgICAgJ2ltYWdlRGVsZXRlJywgLy9EZWxldGVcbiAgICAgICAgICAgICdyZXBsYWNlSW1hZ2UnLCAvL1JlcGxhY2UgSW1hZ2Ugb3IgRmlsZVxuICAgICAgICAgICAgLy8gTGVhZCBEYXRhYmFzZSA+IE5ldyBCdXR0b25cbiAgICAgICAgICAgICduZXdTbWFydExpc3QnLCAvL05ldyBTbWFydCBMaXN0XG4gICAgICAgICAgICAnbmV3TGlzdCcsIC8vTmV3IExpc3RcbiAgICAgICAgICAgICduZXdTZWdtZW50YXRpb24nLCAvL05ldyBTZWdtZW50YXRpb25cbiAgICAgICAgICAgICdpbXBvcnRMaXN0JywgLy9JbXBvcnQgTGlzdFxuICAgICAgICAgICAgJ25ld0xlYWQnLCAvL05ldyBMZWFkXG4gICAgICAgICAgICAnbmV3RGF0YU1ncicsIC8vTmV3IEZpZWxkIE9yZ2FuaXplclxuICAgICAgICAgICAgLy8gTGVhZCBEYXRhYmFzZSA+IEZvbGRlciA+IFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICduZXdTZWdtZW50YXRpb24nLCAvL05ldyBTZWdtZW50YXRpb25cbiAgICAgICAgICAgICduZXdTbWFydExpc3QnLCAvL05ldyBTbWFydCBMaXN0XG4gICAgICAgICAgICAnc2hhcmUnLCAvL1NoYXJlIEZvbGRlclxuICAgICAgICAgICAgJ2NyZWF0ZUZvbGRlcicsIC8vTmV3IEZvbGRlclxuICAgICAgICAgICAgJ3JlbmFtZUZvbGRlcicsIC8vUmVuYW1lIEZvbGRlclxuICAgICAgICAgICAgJ2RlbGV0ZUZvbGRlcicsIC8vRGVsZXRlIEZvbGRlclxuICAgICAgICAgICAgJ2NvbnZlcnRUb0FyY2hpdmVGb2xkZXInLCAvL0NvbnZlcnQgVG8gQXJjaGl2ZSBGb2xkZXJcbiAgICAgICAgICAgICdjb252ZXJ0VG9Gb2xkZXInLCAvL0NvbnZlcnQgVG8gRm9sZGVyXG4gICAgICAgICAgICAvLyBMZWFkIERhdGFiYXNlID4gU2VnbWVudGF0aW9uID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnY3JlYXRlRHJhZnRTZWdtZW50YXRpb24nLCAvL0NyZWF0ZSBEcmFmdFxuICAgICAgICAgICAgJ2FwcHJvdmVTZWdtZW50YXRpb24nLCAvL0FwcHJvdmVcbiAgICAgICAgICAgICd1bmFwcHJvdmVTZWdtZW50YXRpb24nLCAvL1VuYXBwcm92ZVxuICAgICAgICAgICAgJ2RlbGV0ZVNlZ21lbnRhdGlvbicsIC8vRGVsZXRlXG4gICAgICAgICAgICAncmVmcmVzaFNlZ21lbnRhdGlvbicsIC8vUmVmcmVzaCBTdGF0dXNcbiAgICAgICAgICAgICdhcHByb3ZlRHJhZnRTZWdtZW50YXRpb24nLCAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgICAgIC8vIEFuYWx5dGljcyA+IE5ldyBCdXR0b25cbiAgICAgICAgICAgICduZXdSY21fcmNtQ2FudmFzT3ZlcnZpZXcnLCAvL05ldyBSZXZlbnVlIEN5Y2xlIE1vZGVsXG4gICAgICAgICAgICAnbmV3UmNtX2F0eENhbnZhc092ZXJ2aWV3JywgLy9OZXcgUmV2ZW51ZSBDeWNsZSBNb2RlbFxuICAgICAgICAgICAgJ25ld1JjbV9hdHhDYW52YXNEZXRhaWxWaWV3JywgLy9OZXcgUmV2ZW51ZSBDeWNsZSBNb2RlbCAoUmVwb3J0IFRhYilcbiAgICAgICAgICAgICduZXdSY21fYXR4Q2FudmFzU21hcnRsaXN0JywgLy9OZXcgUmV2ZW51ZSBDeWNsZSBNb2RlbCAoU21hcnQgTGlzdCBUYWIpXG4gICAgICAgICAgICAnbmV3UmNtX2F0eENhbnZhc1NldHVwJywgLy9OZXcgUmV2ZW51ZSBDeWNsZSBNb2RlbCAoU2V0dXAgVGFiKVxuICAgICAgICAgICAgJ25ld1JjbV9hdHhDYW52YXNTdWJzY3JpcHRpb25zJywgLy9OZXcgUmV2ZW51ZSBDeWNsZSBNb2RlbCAoU3Vic2NyaXB0aW9ucyBUYWIpXG4gICAgICAgICAgICAnbmV3UmNtX3JjbU1lbWJlcnNDYW52YXMnLCAvL05ldyBSZXZlbnVlIEN5Y2xlIE1vZGVsIChNZW1iZXJzIFRhYilcbiAgICAgICAgICAgIC8vIEFuYWx5dGljcyA+IEZvbGRlciA+IFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICduZXdSY20nLCAvL05ldyBSZXZlbnVlIEN5Y2xlIE1vZGVsXG4gICAgICAgICAgICAnc2hhcmUnLCAvL1NoYXJlIEZvbGRlclxuICAgICAgICAgICAgJ2NyZWF0ZUZvbGRlcicsIC8vTmV3IEZvbGRlclxuICAgICAgICAgICAgJ3JlbmFtZUZvbGRlcicsIC8vUmVuYW1lIEZvbGRlclxuICAgICAgICAgICAgJ2RlbGV0ZUZvbGRlcicsIC8vRGVsZXRlIEZvbGRlclxuICAgICAgICAgICAgJ2NvbnZlcnRUb0FyY2hpdmVGb2xkZXInLCAvL0NvbnZlcnQgVG8gQXJjaGl2ZSBGb2xkZXJcbiAgICAgICAgICAgICdjb252ZXJ0VG9Gb2xkZXInLCAvL0NvbnZlcnQgVG8gRm9sZGVyXG4gICAgICAgICAgICAvLyBBbmFseXRpY3MgPiBBbmFseXplciAmIFJlcG9ydCA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgICAnbmV3UmVwb3J0X2F0eENhbnZhc092ZXJ2aWV3JywgLy9FeHBvcnQgRGF0YVxuICAgICAgICAgICAgJ25ld1JlcG9ydF9hdHhDYW52YXNTZXR1cCcsIC8vRXhwb3J0IERhdGEgKFNldHVwIFRhYilcbiAgICAgICAgICAgICdjbG9uZVJlcG9ydF9hdHhDYW52YXNPdmVydmlldycsIC8vQ2xvbmUgQW5hbHl6ZXJcbiAgICAgICAgICAgICdjbG9uZVJlcG9ydF9hdHhDYW52YXNEZXRhaWxWaWV3JywgLy9DbG9uZSBBbmFseXplciAoUmVwb3J0IFRhYilcbiAgICAgICAgICAgICdjbG9uZVJlcG9ydF9hdHhDYW52YXNTbWFydGxpc3QnLCAvL0Nsb25lIEFuYWx5emVyIChTbWFydCBMaXN0IFRhYilcbiAgICAgICAgICAgICdjbG9uZVJlcG9ydF9hdHhDYW52YXNTZXR1cCcsIC8vQ2xvbmUgQW5hbHl6ZXIgKFNldHVwIFRhYilcbiAgICAgICAgICAgICdjbG9uZVJlcG9ydF9hdHhDYW52YXNTdWJzY3JpcHRpb25zJywgLy9DbG9uZSBBbmFseXplciAoU3Vic2NyaXB0aW9ucyBUYWIpXG4gICAgICAgICAgICAnZGVsZXRlUmVwb3J0JywgLy9EZWxldGUgQW5hbHl6ZXJcbiAgICAgICAgICAgIC8vIEFuYWx5dGljcyA+IEFuYWx5emVyID4gUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ2Nsb25lUmVwb3J0JywgLy9DbG9uZSBBbmFseXplclxuICAgICAgICAgICAgJ2RlbGV0ZVJlcG9ydCcsIC8vRGVsZXRlIEFuYWx5emVyXG4gICAgICAgICAgICAvLyBBbmFseXRpY3MgPiBSZXBvcnQgPiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnY2xvbmVSZXBvcnQnLCAvL0Nsb25lIFJlcG9ydFxuICAgICAgICAgICAgJ2RlbGV0ZVJlcG9ydCcsIC8vRGVsZXRlIFJlcG9ydFxuICAgICAgICAgICAgJ21vdmVSZXBvcnQnLCAvL01vdmUgUmVwb3J0XG4gICAgICAgICAgICAvLyBBbmFseXRpY3MgPiBNb2RlbCA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ3JjbUVkaXQnLCAvL0VkaXQgRHJhZnRcbiAgICAgICAgICAgICdyY21BcHByb3ZlU3RhZ2VzJywgLy9BcHByb3ZlIFN0YWdlc1xuICAgICAgICAgICAgJ3JjbVVuYXBwcm92ZVN0YWdlcycsIC8vVW5hcHByb3ZlIFN0YWdlc1xuICAgICAgICAgICAgJ3JjbUFwcHJvdmUnLCAvL0FwcHJvdmUgTW9kZWxcbiAgICAgICAgICAgICdyY21VbmFwcHJvdmUnLCAvL1VuYXBwcm92ZSBNb2RlbFxuICAgICAgICAgICAgJ3JjbUNsb25lJywgLy9DbG9uZSBNb2RlbFxuICAgICAgICAgICAgJ3JjbURlbGV0ZScsIC8vRGVsZXRlIE1vZGVsXG4gICAgICAgICAgICAncmNtRWRpdERyYWZ0JywgLy9FZGl0IERyYWZ0XG4gICAgICAgICAgICAncmNtQXBwcm92ZURyYWZ0JywgLy9BcHByb3ZlIE1vZGVsIERyYWZ0XG4gICAgICAgICAgICAncmNtQWFzc2lnbm1lbnRSdWxlcycsIC8vQXNzaWdubWVudCBSdWxlc1xuICAgICAgICAgICAgLy8gQW5hbHl0aWNzID4gTW9kZWwgPiBTdGFnZSA+IEFjdGlvbnMgQnV0dG9uICYgUmlnaHQtY2xpY2tcbiAgICAgICAgICAgICdEZWxldGUnLCAvL0RlbGV0ZVxuICAgICAgICAgICAgLy8gQW5hbHl0aWNzID4gTW9kZWwgPiBUcmFuc2l0aW9uID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGlja1xuICAgICAgICAgICAgJ0RlbGV0ZScsIC8vRGVsZXRlXG4gICAgICAgICAgICAvLyBBZG1pbiA+IFRhZ3MgPiBUYWdzID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnZGVsZXRlRGVzY3JpcHRvcicsIC8vRGVsZXRlXG4gICAgICAgICAgICAnZGVsZXRlRGVzY3JpcHRvclZhbHVlJywgLy9EZWxldGVcbiAgICAgICAgICAgICdoaWRlRGVzY3JpcHRvclZhbHVlJywgLy9IaWRlXG4gICAgICAgICAgICAndW5oaWRlRGVzY3JpcHRvclZhbHVlJywgLy9VbmhpZGVcbiAgICAgICAgICAgIC8vIEFkbWluID4gVGFncyA+IENhbGVuZGFyIEVudHJ5IFR5cGVzID4gQWN0aW9ucyBCdXR0b25cbiAgICAgICAgICAgICd1bmhpZGVFbnRyeScsIC8vVW5oaWRlXG4gICAgICAgICAgICAnaGlkZUVudHJ5JywgLy9IaWRlXG4gICAgICAgICAgICAvLyBBZG1pbiA+IEZpZWxkIE1hbmFnZW1lbnQgPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICAgJ2hpZGVGaWVsZEZtRmllbGRzJywgLy9IaWRlIGZpZWxkXG4gICAgICAgICAgICAvLyBBZG1pbiA+IExhbmRpbmcgUGFnZXMgPiBSdWxlcyA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgICAnZGVsZXRlUnVsZScsIC8vRGVsZXRlIFJ1bGVcbiAgICAgICAgICAgIC8vIEFkbWluID4gTGF1bmNoUG9pbnQgPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICAgJ2Nsb25lV2ViaW5hckxvZ2luJywgLy9DbG9uZSBMb2dpblxuICAgICAgICAgICAgJ2RlbGV0ZVdlYmluYXJMb2dpbicsIC8vRGVsZXRlIFNlcnZpY2VcbiAgICAgICAgICAgIC8vIEFkbWluID4gV2ViaG9va3MgPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICAgJ2Nsb25lV2ViaG9vaycsIC8vQ2xvbmUgV2ViaG9va1xuICAgICAgICAgICAgJ2RlbGV0ZVdlYmhvb2snIC8vRGVsZXRlIFdlYmhvb2tcbiAgICAgICAgICBdLFxuICAgICAgICAgIGl0ZW1zVG9EaXNhYmxlQWx3YXlzID0gW1xuICAgICAgICAgICAgLy8gRGVmYXVsdCwgRW1haWwgU2VuZCwgRXZlbnQsIGFuZCBOdXJ0dXJpbmcgUHJvZ3JhbXM7IFNtYXJ0IENhbXBhaWduLCBGb2xkZXIgPiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAnc2hhcmVQcm9ncmFtRm9sZGVyJywgLy9TaGFyZSBGb2xkZXJcbiAgICAgICAgICAgIC8vIExlYWQgRGF0YWJhc2UgPiBTZWdtZW50YXRpb24gPiBBY3Rpb25zIEJ1dHRvbiAmIFJpZ2h0LWNsaWNrIFRyZWVcbiAgICAgICAgICAgICdhcHByb3ZlU2VnbWVudGF0aW9uJywgLy9BcHByb3ZlXG4gICAgICAgICAgICAndW5hcHByb3ZlU2VnbWVudGF0aW9uJywgLy9VbmFwcHJvdmVcbiAgICAgICAgICAgICdyZWZyZXNoU2VnbWVudGF0aW9uJywgLy9SZWZyZXNoIFN0YXR1c1xuICAgICAgICAgICAgJ2FwcHJvdmVEcmFmdFNlZ21lbnRhdGlvbicsIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICAgICAgLy8gQW5hbHl0aWNzID4gRm9sZGVyID4gUmlnaHQtY2xpY2sgVHJlZVxuICAgICAgICAgICAgJ3NoYXJlJywgLy9TaGFyZSBGb2xkZXJcbiAgICAgICAgICAgIC8vIEFuYWx5dGljcyA+IE1vZGVsID4gQWN0aW9ucyBCdXR0b24gJiBSaWdodC1jbGljayBUcmVlXG4gICAgICAgICAgICAncmNtQXBwcm92ZVN0YWdlcycsIC8vQXBwcm92ZSBTdGFnZXNcbiAgICAgICAgICAgICdyY21VbmFwcHJvdmVTdGFnZXMnLCAvL1VuYXBwcm92ZSBTdGFnZXNcbiAgICAgICAgICAgICdyY21BcHByb3ZlJywgLy9BcHByb3ZlIE1vZGVsXG4gICAgICAgICAgICAncmNtVW5hcHByb3ZlJywgLy9VbmFwcHJvdmUgTW9kZWxcbiAgICAgICAgICAgICdyY21BcHByb3ZlRHJhZnQnIC8vQXBwcm92ZSBNb2RlbCBEcmFmdFxuICAgICAgICAgIF1cblxuICAgICAgICBpZiAodGhpcy5pZCA9PSAnbGVhZERiTGlzdE1lbnUnIHx8IHRoaXMuaWQgPT0gJ3NlZ21lbnRhdGlvbk1lbnUnKSB7XG4gICAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ3RyZWUnLCB0aGlzLCBjYW52YXMsIG51bGwpXG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgdGhpcy5pZCA9PSAnbGVhZERiTGVhZE1lbnUnIHx8XG4gICAgICAgICAgKHRoaXMub3duZXJDdCAmJiB0aGlzLm93bmVyQ3QucGFyZW50TWVudSAmJiB0aGlzLm93bmVyQ3QucGFyZW50TWVudS5pZCA9PSAnbGVhZERiTGVhZE1lbnUnKVxuICAgICAgICApIHtcbiAgICAgICAgICBkaXNhYmxlID0gdHJ1ZVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMudHJpZ2dlcmVkRnJvbSAhPSAndHJlZScgJiYgdGhpcy50cmlnZ2VyZWRGcm9tICE9ICdidXR0b24nKSB7XG4gICAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ3RyZWUnLCB0aGlzLCBjYW52YXMsIG51bGwpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUodGhpcy50cmlnZ2VyZWRGcm9tLCB0aGlzLCBjYW52YXMsIG51bGwpXG4gICAgICAgIH1cblxuICAgICAgICBpdGVtc1RvRGlzYWJsZS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtVG9EaXNhYmxlKSB7XG4gICAgICAgICAgbGV0IGl0ZW1cblxuICAgICAgICAgIGlmIChpdGVtVG9EaXNhYmxlID09ICdEZWxldGUnKSB7XG4gICAgICAgICAgICBpdGVtID0gbWVudS5maW5kKCd0ZXh0JywgaXRlbVRvRGlzYWJsZSlbMF1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXRlbSA9IG1JdGVtcy5nZXQoaXRlbVRvRGlzYWJsZSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaXRlbS5zZXREaXNhYmxlZChkaXNhYmxlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBpdGVtc1RvRGlzYWJsZUFsd2F5cy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtVG9EaXNhYmxlKSB7XG4gICAgICAgICAgbGV0IGl0ZW1cbiAgICAgICAgICBpZiAoaXRlbVRvRGlzYWJsZSA9PSAnRGVsZXRlJykge1xuICAgICAgICAgICAgaXRlbSA9IG1lbnUuZmluZCgndGV4dCcsIGl0ZW1Ub0Rpc2FibGUpWzBdXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGl0ZW0gPSBtSXRlbXMuZ2V0KGl0ZW1Ub0Rpc2FibGUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGlmICh0aGlzLm93bmVyQ3QgJiYgdGhpcy5vd25lckN0LnRleHQpIHtcbiAgICAgICAgICBzd2l0Y2ggKHRoaXMub3duZXJDdC50ZXh0KSB7XG4gICAgICAgICAgICBjYXNlICdDaGFuZ2UgU3RhdHVzJzpcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IHRoaXMuaXRlbXMuaXRlbXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5pdGVtc1tpaV0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAnRmllbGQgQWN0aW9ucyc6XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLml0ZW1zLml0ZW1zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLml0ZW1zLml0ZW1zW2lpXS50ZXh0ID09ICdOZXcgQ3VzdG9tIEZpZWxkJykge1xuICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5pdGVtc1tpaV0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMub3duZXJDdC50ZXh0LnNlYXJjaCgnXlZpZXc6JykgIT0gLTEpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCB0aGlzLml0ZW1zLml0ZW1zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICBzd2l0Y2ggKHRoaXMuaXRlbXMuaXRlbXNbaWldLnRleHQpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdDcmVhdGUgVmlldyc6XG4gICAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLml0ZW1zW2lpXS5zZXREaXNhYmxlZCh0cnVlKVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBjYXNlICdFZGl0IERlZmF1bHQnOlxuICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5pdGVtc1tpaV0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBhcmVudE1lbnUgPSBwYXJlbnRNZW51XG4gICAgICAgIGlmICghdGhpcy5lbCkge1xuICAgICAgICAgIHRoaXMucmVuZGVyKClcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5lbmFibGVTY3JvbGxpbmcpIHtcbiAgICAgICAgICB0aGlzLmVsLnNldFhZKHh5KVxuICAgICAgICAgIHh5WzFdID0gdGhpcy5jb25zdHJhaW5TY3JvbGwoeHlbMV0pXG4gICAgICAgICAgeHkgPSBbdGhpcy5lbC5hZGp1c3RGb3JDb25zdHJhaW50cyh4eSlbMF0sIHh5WzFdXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHh5ID0gdGhpcy5lbC5hZGp1c3RGb3JDb25zdHJhaW50cyh4eSlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsLnNldFhZKHh5KVxuICAgICAgICB0aGlzLmVsLnNob3coKVxuICAgICAgICBFeHQubWVudS5NZW51LnN1cGVyY2xhc3Mub25TaG93LmNhbGwodGhpcylcbiAgICAgICAgaWYgKEV4dC5pc0lFKSB7XG4gICAgICAgICAgdGhpcy5maXJlRXZlbnQoJ2F1dG9zaXplJywgdGhpcylcbiAgICAgICAgICBpZiAoIUV4dC5pc0lFOCkge1xuICAgICAgICAgICAgdGhpcy5lbC5yZXBhaW50KClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5oaWRkZW4gPSBmYWxzZVxuICAgICAgICB0aGlzLmZvY3VzKClcbiAgICAgICAgdGhpcy5maXJlRXZlbnQoJ3Nob3cnLCB0aGlzKVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBTa2lwcGVkOiBEaXNhYmxlIEFjdGlvbnMgYW5kIFJpZ2h0LWNsaWNrIG1lbnVzIGZvciBBTEwgaW4gQUxMJylcbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuY29udHJvbGxlci5lZGl0b3Iud2l6YXJkLkVkaXRvci5wcm90b3R5cGUubG9hZFN0ZXAnKSkge1xuICAgIE1rdDMuY29udHJvbGxlci5lZGl0b3Iud2l6YXJkLkVkaXRvci5wcm90b3R5cGUubG9hZFN0ZXAgPSBmdW5jdGlvbiAoc3RlcCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIENyZWF0ZSBidXR0b24gaW4gV2l6YXJkIEVkaXRvcnMnKVxuICAgICAgbGV0IGVkaXRvciA9IHRoaXMuZ2V0RWRpdG9yKCksXG4gICAgICAgIHRyZWUgPSB0aGlzLmdldFRyZWUoKSxcbiAgICAgICAgcHJldmlvdXNTdGVwID0gdHJlZS5nZXRDdXJyZW50U3RlcCgpLFxuICAgICAgICBwcmV2aW91c1N0ZXBJZCA9IHByZXZpb3VzU3RlcCA/IHByZXZpb3VzU3RlcC5nZXRJZCgpIDogbnVsbCxcbiAgICAgICAgc3RlcElkID0gc3RlcC5nZXRJZCgpLFxuICAgICAgICB0aXRsZUl0ZW0gPSB0aGlzLmdldE5hdkJhcigpLmdldENvbXBvbmVudCgndGl0bGUnKSxcbiAgICAgICAgc3RlcHMgPSBlZGl0b3IuaXRlbXMuaXRlbXMsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBpbCA9IHN0ZXBzLmxlbmd0aFxuXG4gICAgICBFeHQ0LnN1c3BlbmRMYXlvdXRzKClcblxuICAgICAgLy8gdXBkYXRlIG5hdmlnYXRpb24gdGl0bGVcbiAgICAgIHRpdGxlSXRlbS5zZXRUZXh0KHN0ZXAuZ2V0KCd0aXRsZVRleHQnKSB8fCBzdGVwLmdldCgndGV4dCcpKVxuXG4gICAgICAvLyB1cGRhdGUgY29udGVudFxuICAgICAgZm9yICg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgIHN0ZXBzW2ldLnNldFZpc2libGUoRXh0NC5BcnJheS5jb250YWlucyhFeHQ0LkFycmF5LmZyb20oc3RlcHNbaV0uc3RlcElkcyksIHN0ZXBJZCkpXG4gICAgICB9XG5cbiAgICAgIC8vIHVwZGF0ZSBjdXN0b20gdG9rZW5cbiAgICAgIE1rdDMuRGxNYW5hZ2VyLnNldEN1c3RvbVRva2VuKHN0ZXAuZ2V0SWQoKSlcblxuICAgICAgdHJlZS5leHBhbmRQYXRoKHN0ZXAucGFyZW50Tm9kZS5nZXRQYXRoKCkpXG4gICAgICB0cmVlLmdldFZpZXcoKS5nZXRTZWxlY3Rpb25Nb2RlbCgpLnNlbGVjdChzdGVwKVxuXG4gICAgICB0aGlzLnVwZGF0ZUZsb3dCdXR0b25zKClcblxuICAgICAgZWRpdG9yLmZpcmVFdmVudCgnc3RlcGNoYW5nZScsIHN0ZXBJZCwgcHJldmlvdXNTdGVwSWQpXG5cbiAgICAgIEV4dDQucmVzdW1lTGF5b3V0cyh0cnVlKVxuXG4gICAgICBpZiAoZWRpdG9yLmRvd24pIHtcbiAgICAgICAgaWYgKGVkaXRvci5kb3duKCdbYWN0aW9uPWNyZWF0ZV0nKSAmJiBlZGl0b3IuZG93bignW2FjdGlvbj1jcmVhdGVdJykuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICBlZGl0b3IuZG93bignW2FjdGlvbj1jcmVhdGVdJykuc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgfSBlbHNlIGlmIChlZGl0b3IuZG93bignW2FjdGlvbj1pbXBvcnRdJykgJiYgZWRpdG9yLmRvd24oJ1thY3Rpb249aW1wb3J0XScpLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgZWRpdG9yLmRvd24oJ1thY3Rpb249aW1wb3J0XScpLnNldERpc2FibGVkKHRydWUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBlZDogRGlzYWJsZSBDcmVhdGUgYnV0dG9uIGluIFdpemFyZCBFZGl0b3JzJylcbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dDQuYnV0dG9uLkJ1dHRvbi5wcm90b3R5cGUuc2hvd01lbnUnKSkge1xuICAgIEV4dDQuYnV0dG9uLkJ1dHRvbi5wcm90b3R5cGUuc2hvd01lbnUgPSBmdW5jdGlvbiAoZnJvbUV2ZW50KSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgVG9vbGJhciBCdXR0b25zICYgQWN0aW9ucyBNZW51IGluIEFCTSAmIEFkbWluIFNlY3Rpb25zJylcbiAgICAgIGxldCBtSXRlbXMgPSB0aGlzLm1lbnUuaXRlbXMsXG4gICAgICAgIG1lbnVJdGVtcyxcbiAgICAgICAgaXRlbXNUb0Rpc2FibGUgPSBbXG4gICAgICAgICAgLy8gQWNjb3VudCBCYXNlZCBNYXJrZXRpbmcgPiBOYW1lZCBBY2NvdW50cyA+IE5ldyBCdXR0b25cbiAgICAgICAgICAvLyBBY2NvdW50IEJhc2VkIE1hcmtldGluZyA+IE5hbWVkIEFjY291bnRzID4gQWN0aW9ucyBCdXR0b25cbiAgICAgICAgICAnZGVsZXRlTmFtZWRBY2NvdW50JywgLy9EZWxldGUgTmFtZWQgQWNjb3VudFxuICAgICAgICAgIC8vIEFjY291bnQgQmFzZWQgTWFya2V0aW5nID4gTmFtZWQgQWNjb3VudHMgPiBBY2NvdW50IFRlYW0gQWN0aW9uc1xuICAgICAgICAgICdkZWxldGVBY2NvdW50TWVtYmVyJywgLy9SZW1vdmUgQWNjb3VudCBNZW1iZXJcbiAgICAgICAgICAvLyBBZG1pbiA+IE1hcmtldG8gQ3VzdG9tIE9iamVjdHMgPiBNYXJrZXRvIEN1c3RvbSBPYmplY3RzID4gQWN0aW9ucyBCdXR0b25cbiAgICAgICAgICAnbWt0b0N1c3RvbU9iamVjdFB1Ymxpc2hCdG4nLCAvL0FwcHJvdmUgT2JqZWN0XG4gICAgICAgICAgJ21rdG9DdXN0b21PYmplY3REZWxldGVCdG4nLCAvL0RlbGV0ZSBPYmplY3RcbiAgICAgICAgICAvLyBBZG1pbiA+IE1hcmtldG8gQ3VzdG9tIE9iamVjdHMgPiBGaWVsZHMgPiBBY3Rpb25zIEJ1dHRvblxuICAgICAgICAgICdta3RvQ3VzdG9tT2JqZWN0RmllbGREZWxldGVCdG4nLCAvLyBEZWxldGUgRmllbGRcbiAgICAgICAgICAvLyBBZG1pbiA+IE1hcmtldG8gQ3VzdG9tIEFjdGl2aXRpZXMgPiBNYXJrZXRvIEN1c3RvbSBBY3Rpdml0aWVzID4gQWN0aW9ucyBCdXR0b25cbiAgICAgICAgICAnbWt0b0N1c3RvbUFjdGl2aXR5UHVibGlzaEJ0bicsIC8vQXBwcm92ZSBBY3Rpdml0eVxuICAgICAgICAgICdta3RvQ3VzdG9tQWN0aXZpdHlEZWxldGVCdG4nLCAvL0RlbGV0ZSBBY3Rpdml0eVxuICAgICAgICAgIC8vIEFkbWluID4gTWFya2V0byBDdXN0b20gQWN0aXZpdGllcyA+IEZpZWxkcyA+IEFjdGlvbnMgQnV0dG9uXG4gICAgICAgICAgJ21rdG9DdXN0b21BY3Rpdml0eUZpZWxkRGVsZXRlQnRuJyAvL0RlbGV0ZSBGaWVsZFxuICAgICAgICBdXG5cbiAgICAgIGlmIChtSXRlbXMpIHtcbiAgICAgICAgaXRlbXNUb0Rpc2FibGUuZm9yRWFjaChmdW5jdGlvbiAoaXRlbVRvRGlzYWJsZSkge1xuICAgICAgICAgIGxldCBpdGVtID0gbUl0ZW1zLmdldChpdGVtVG9EaXNhYmxlKVxuICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAvLyBBY2NvdW50IEJhc2VkIE1hcmtldGluZyA+IEFjY291bnQgTGlzdHMgPiBOZXcgQnV0dG9uXG4gICAgICAgICdjb250ZXh0TWVudSBbYWN0aW9uPWRlbGV0ZUFjY291bnRMaXN0XScsIC8vRGVsZXRlIEFjY291bnQgTGlzdFxuICAgICAgICAnbWVudSBbYWN0aW9uPWRlbGV0ZV0nLCAvL0RlbGV0ZSBNb2JpbGUgQXBwXG4gICAgICAgICdtZW51IFthY3Rpb249ZWRpdFRlc3REZXZpY2VdJywgLy9FZGl0IFRlc3QgRGV2aWNlXG4gICAgICAgICdtZW51IFthY3Rpb249ZGVsZXRlVGVzdERldmljZV0nIC8vRGVsZXRlIFRlc3QgRGV2aWNlXG4gICAgICBdXG4gICAgICBtSXRlbXMgPSBFeHQ0LkNvbXBvbmVudFF1ZXJ5LnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuXG4gICAgICBpZiAobUl0ZW1zKSB7XG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGxldCBtZSA9IHRoaXMsXG4gICAgICAgIHttZW51fSA9IG1lXG4gICAgICBpZiAobWUucmVuZGVyZWQpIHtcbiAgICAgICAgaWYgKG1lLnRvb2x0aXAgJiYgRXh0LnF1aWNrVGlwc0FjdGl2ZSAmJiBtZS5nZXRUaXBBdHRyKCkgIT0gJ3RpdGxlJykge1xuICAgICAgICAgIEV4dC50aXAuUXVpY2tUaXBNYW5hZ2VyLmdldFF1aWNrVGlwKCkuY2FuY2VsU2hvdyhtZS5idG5FbClcbiAgICAgICAgfVxuICAgICAgICBpZiAobWVudS5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIG1lbnUuaGlkZSgpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFmcm9tRXZlbnQgfHwgbWUuc2hvd0VtcHR5TWVudSB8fCBtZW51Lml0ZW1zLmdldENvdW50KCkgPiAwKSB7XG4gICAgICAgICAgbWVudS5zaG93QnkobWUuZWwsIG1lLm1lbnVBbGlnbiwgKCFFeHQuaXNTdHJpY3QgJiYgRXh0LmlzSUUpIHx8IEV4dC5pc0lFNiA/IFstMiwgLTJdIDogdW5kZWZpbmVkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBlZDogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgJiBBY3Rpb25zIE1lbnUgaW4gQUJNICYgQWRtaW4gU2VjdGlvbnMnKVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5jb250cm9sbGVyLmFibS5uYW1lZEFjY291bnQuRGFzaGJvYXJkLnByb3RvdHlwZS5sb2FkVG9vbEJhcicpKSB7XG4gICAgTWt0My5jb250cm9sbGVyLmFibS5uYW1lZEFjY291bnQuRGFzaGJvYXJkLnByb3RvdHlwZS5sb2FkVG9vbEJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgZm9yIEFCTSA+IE5hbWVkIEFjY291bnRzJylcbiAgICAgIGxldCBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgLy8gTmFtZWQgQWNjb3VudCBUb29sYmFyIEJ1dHRvbnNcbiAgICAgICAgICAnYWJtTmFtZWRBY2NvdW50VG9vbGJhciBbYWN0aW9uPWxpbmtQZW9wbGVdJyAvL0FkZCBQZW9wbGUgdG8gTmFtZWQgQWNjb3VudFxuICAgICAgICBdLFxuICAgICAgICBtSXRlbXMgPSBFeHQ0LkNvbXBvbmVudFF1ZXJ5LnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuXG4gICAgICBpZiAobUl0ZW1zKSB7XG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodHJ1ZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGxldCBjYW52YXMgPSB0aGlzLmdldENhbnZhcygpLFxuICAgICAgICB0b29sYmFyID0gY2FudmFzLmRvd24oJ2FibU5hbWVkQWNjb3VudFRvb2xiYXInKVxuXG4gICAgICB0b29sYmFyLmRvd24oJyNuZXdNZW51JykuaGlkZSgpXG4gICAgICB0b29sYmFyLmRvd24oJyNwZW9wbGVMaW5rJykuaGlkZSgpXG4gICAgICB0b29sYmFyLmRvd24oJyNkZWxldGVOYW1lZEFjY291bnQnKS5oaWRlKClcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBlZDogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgZm9yIEFCTSA+IE5hbWVkIEFjY291bnRzJylcbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuY29udHJvbGxlci5hYm0uYWNjb3VudExpc3QuRGFzaGJvYXJkLnByb3RvdHlwZS5sb2FkVG9vbEJhcicpKSB7XG4gICAgTWt0My5jb250cm9sbGVyLmFibS5hY2NvdW50TGlzdC5EYXNoYm9hcmQucHJvdG90eXBlLmxvYWRUb29sQmFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFRvb2xiYXIgQnV0dG9ucyBmb3IgQUJNID4gQWNjb3VudCBMaXN0cyA+IE5hbWVkIEFjY291bnRzJylcbiAgICAgIGxldCBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgLy8gQWNjb3VudCBCYXNlZCBNYXJrZXRpbmcgPiBBY2NvdW50IExpc3RzID4gTmFtZWQgQWNjb3VudCA+IFRvb2xiYXIgQnV0dG9uc1xuICAgICAgICAgICdhYm1BY2NvdW50TGlzdFRvb2xiYXIgW2FjdGlvbj1yZW1vdmVOYW1lZEFjY291bnRdJyAvL1JlbW92ZSBOYW1lZCBBY2NvdW50c1xuICAgICAgICBdLFxuICAgICAgICBtSXRlbXMgPSBFeHQ0LkNvbXBvbmVudFF1ZXJ5LnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuXG4gICAgICBpZiAobUl0ZW1zKSB7XG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uZGVzdHJveSgpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBsZXQgZGFzaGJvYXJkID0gdGhpcy5nZXREYXNoYm9hcmQoKSxcbiAgICAgICAgdG9vbGJhciA9IGRhc2hib2FyZC5xdWVyeSgnYWJtQWNjb3VudExpc3RUb29sYmFyJylcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b29sYmFyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvb2xiYXJbaV0uZG93bignI25ld01lbnUnKS5oaWRlKClcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBlZDogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgZm9yIEFCTSA+IEFjY291bnQgTGlzdHMgPiBOYW1lZCBBY2NvdW50cycpXG4gIH1cblxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIuc29jaWFsQXBwLlNvY2lhbEFwcC5wcm90b3R5cGUubG9hZFRvb2xiYXInKSkge1xuICAgIC8vIERpc2FibGUgTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBTb2NpYWwgQXBwID4gVG9vbGJhciBidXR0b25zICYgQWN0aW9ucyBtZW51XG4gICAgbGV0IHByZXZTb2NpYWxBcHBUb29sYmFyID0gTWt0My5jb250cm9sbGVyLnNvY2lhbEFwcC5Tb2NpYWxBcHAucHJvdG90eXBlLmxvYWRUb29sYmFyXG4gICAgTWt0My5jb250cm9sbGVyLnNvY2lhbEFwcC5Tb2NpYWxBcHAucHJvdG90eXBlLmxvYWRUb29sYmFyID0gZnVuY3Rpb24gKG1lbnUsIGF0dHIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgJiBBY3Rpb25zIE1lbnUgZm9yIE1hcmtldGluZyBBY3Rpdml0aWVzID4gU29jaWFsIEFwcHMnKVxuICAgICAgcHJldlNvY2lhbEFwcFRvb2xiYXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuXG4gICAgICBsZXQgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ3NvY2lhbEFwcFRvb2xiYXInLCBudWxsLCBudWxsLCB0aGlzKSxcbiAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICdzb2NpYWxBcHBUb29sYmFyIGNvbnRleHRNZW51IFthY3Rpb249YXBwcm92ZV0nLCAvL0FwcHJvdmVcbiAgICAgICAgICAnc29jaWFsQXBwVG9vbGJhciBjb250ZXh0TWVudSBbYWN0aW9uPWNsb25lXScsIC8vQ2xvbmVcbiAgICAgICAgICAnc29jaWFsQXBwVG9vbGJhciBjb250ZXh0TWVudSBbYWN0aW9uPWRlbGV0ZV0nLCAvL0RlbGV0ZVxuICAgICAgICAgICdzb2NpYWxBcHBUb29sYmFyIGNvbnRleHRNZW51IFthY3Rpb249YXBwcm92ZURyYWZ0XScgLy9BcHByb3ZlIERyYWZ0XG4gICAgICAgIF0sXG4gICAgICAgIG1JdGVtcyA9IEV4dDQuQ29tcG9uZW50UXVlcnkucXVlcnkobWVudUl0ZW1zLnRvU3RyaW5nKCkpXG5cbiAgICAgIGlmIChtSXRlbXMpIHtcbiAgICAgICAgbUl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaXRlbS5zZXREaXNhYmxlZChkaXNhYmxlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1lbnVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU2tpcHBlZDogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgJiBBY3Rpb25zIE1lbnUgZm9yIE1hcmtldGluZyBBY3Rpdml0aWVzID4gU29jaWFsIEFwcHMnKVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5jb250cm9sbGVyLm1vYmlsZVB1c2hOb3RpZmljYXRpb24uTW9iaWxlUHVzaE5vdGlmaWNhdGlvbi5wcm90b3R5cGUubG9hZFRvb2xiYXInKSkge1xuICAgIC8vIERpc2FibGUgTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBQdXNoIE5vdGlmaWNhdGlvbiA+IFRvb2xiYXIgYnV0dG9ucyAmIEFjdGlvbnMgbWVudVxuICAgIGxldCBwcmV2TW9iaWxlUHVzaE5vdGlmaWNhdGlvblRvb2xiYXIgPSBNa3QzLmNvbnRyb2xsZXIubW9iaWxlUHVzaE5vdGlmaWNhdGlvbi5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uLnByb3RvdHlwZS5sb2FkVG9vbGJhclxuICAgIE1rdDMuY29udHJvbGxlci5tb2JpbGVQdXNoTm90aWZpY2F0aW9uLk1vYmlsZVB1c2hOb3RpZmljYXRpb24ucHJvdG90eXBlLmxvYWRUb29sYmFyID0gZnVuY3Rpb24gKG1lbnUsIGF0dHIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBUb29sYmFyIEJ1dHRvbnMgJiBBY3Rpb25zIE1lbnUgZm9yIE1hcmtldGluZyBBY3Rpdml0aWVzID4gUHVzaCBOb3RpZmljYXRpb25zJylcbiAgICAgIHByZXZNb2JpbGVQdXNoTm90aWZpY2F0aW9uVG9vbGJhci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICAgIGxldCBkaXNhYmxlID0gQVBQLmV2YWx1YXRlTWVudSgnbW9iaWxlUHVzaE5vdGlmaWNhdGlvbicsIG51bGwsIG51bGwsIHRoaXMpLFxuICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgJ21vYmlsZVB1c2hOb3RpZmljYXRpb24gY29udGV4dE1lbnUgW2FjdGlvbj1zZW5kU2FtcGxlXScsIC8vU2VuZCBTYW1wbGVcbiAgICAgICAgICAnbW9iaWxlUHVzaE5vdGlmaWNhdGlvbiBjb250ZXh0TWVudSBbYWN0aW9uPXVuYXBwcm92ZV0nLCAvL1VuYXBwcm92ZVxuICAgICAgICAgICdtb2JpbGVQdXNoTm90aWZpY2F0aW9uIGNvbnRleHRNZW51IFthY3Rpb249YXBwcm92ZV0nLCAvL0FwcHJvdmVcbiAgICAgICAgICAnbW9iaWxlUHVzaE5vdGlmaWNhdGlvbiBjb250ZXh0TWVudSBbYWN0aW9uPWNsb25lXScsIC8vQ2xvbmVcbiAgICAgICAgICAnbW9iaWxlUHVzaE5vdGlmaWNhdGlvbiBjb250ZXh0TWVudSBbYWN0aW9uPWRlbGV0ZV0nLCAvL0RlbGV0ZVxuICAgICAgICAgICdtb2JpbGVQdXNoTm90aWZpY2F0aW9uIGNvbnRleHRNZW51IFthY3Rpb249c2VuZERyYWZ0U2FtcGxlXScsIC8vU2VuZCBTYW1wbGUgb2YgRHJhZnRcbiAgICAgICAgICAnbW9iaWxlUHVzaE5vdGlmaWNhdGlvbiBjb250ZXh0TWVudSBbYWN0aW9uPWFwcHJvdmVEcmFmdF0nIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICBdLFxuICAgICAgICBtSXRlbXMgPSBFeHQ0LkNvbXBvbmVudFF1ZXJ5LnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuXG4gICAgICBpZiAobUl0ZW1zKSB7XG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0RGlzYWJsZWQoZGlzYWJsZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtZW51XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFNraXBwZWQ6IERpc2FibGUgVG9vbGJhciBCdXR0b25zICYgQWN0aW9ucyBNZW51IGZvciBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IFB1c2ggTm90aWZpY2F0aW9ucycpXG4gIH1cblxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIuaW5BcHBNZXNzYWdlLkluQXBwTWVzc2FnZS5wcm90b3R5cGUubG9hZFRvb2xiYXInKSkge1xuICAgIC8vIERpc2FibGUgTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBJbi1BcHAgTWVzc2FnZXMgPiBUb29sYmFyIGJ1dHRvbnMgJiBBY3Rpb25zIG1lbnVcbiAgICBsZXQgcHJldkluQXBwTWVzc2FnZVRvb2xiYXIgPSBNa3QzLmNvbnRyb2xsZXIuaW5BcHBNZXNzYWdlLkluQXBwTWVzc2FnZS5wcm90b3R5cGUubG9hZFRvb2xiYXJcbiAgICBNa3QzLmNvbnRyb2xsZXIuaW5BcHBNZXNzYWdlLkluQXBwTWVzc2FnZS5wcm90b3R5cGUubG9hZFRvb2xiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgVG9vbGJhciBCdXR0b25zICYgQWN0aW9ucyBNZW51IGZvciBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IEluLUFwcCBNZXNzYWdlcycpXG4gICAgICBwcmV2SW5BcHBNZXNzYWdlVG9vbGJhci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICAgIGxldCB0b29sYmFyID0gdGhpcy5nZXRUb29sYmFyKCksXG4gICAgICAgIGluQXBwTWVzc2FnZSA9IHRoaXMuZ2V0SW5BcHBNZXNzYWdlKCksXG4gICAgICAgIGFjdGlvbnNNZW51ID0gdG9vbGJhci5kb3duKCcuY29udGV4dE1lbnUnKSxcbiAgICAgICAgdG9vbGJhckNvbXBvbmVudHMgPSB0b29sYmFyLnF1ZXJ5KCdjb21wb25lbnQnKSB8fCBbXSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIGlsID0gdG9vbGJhckNvbXBvbmVudHMubGVuZ3RoLFxuICAgICAgICB0b29sYmFyQ29tcG9uZW50LFxuICAgICAgICB0ZXh0XG5cbiAgICAgIC8vIHNldCByZWNvcmRcbiAgICAgIGFjdGlvbnNNZW51LnJlY29yZCA9IGluQXBwTWVzc2FnZVxuXG4gICAgICAvLyB1cGRhdGUgdGV4dCBhbmQgaWNvbnNcbiAgICAgIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICB0b29sYmFyQ29tcG9uZW50ID0gdG9vbGJhckNvbXBvbmVudHNbaV1cblxuICAgICAgICAvLyB1cGRhdGUgaWNvbnNcbiAgICAgICAgaWYgKEV4dDQuaXNEZWZpbmVkKHRvb2xiYXJDb21wb25lbnQuaWNvbkNscykgJiYgRXh0NC5pc0Z1bmN0aW9uKHRvb2xiYXJDb21wb25lbnQuc2V0SWNvbkNscykpIHtcbiAgICAgICAgICB0b29sYmFyQ29tcG9uZW50LnNldEljb25DbHModG9vbGJhckNvbXBvbmVudC5pY29uQ2xzKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIHRleHRcbiAgICAgICAgaWYgKFxuICAgICAgICAgIChFeHQ0LmlzRGVmaW5lZCh0b29sYmFyQ29tcG9uZW50LnRleHQpIHx8IEV4dDQuaXNGdW5jdGlvbih0b29sYmFyQ29tcG9uZW50LmdldFRleHQpKSAmJlxuICAgICAgICAgIEV4dDQuaXNGdW5jdGlvbih0b29sYmFyQ29tcG9uZW50LnNldFRleHQpXG4gICAgICAgICkge1xuICAgICAgICAgIHRleHQgPSBFeHQ0LmlzRnVuY3Rpb24odG9vbGJhckNvbXBvbmVudC5nZXRUZXh0KSA/IHRvb2xiYXJDb21wb25lbnQuZ2V0VGV4dCgpIDogdG9vbGJhckNvbXBvbmVudC50ZXh0XG4gICAgICAgICAgdG9vbGJhckNvbXBvbmVudC5zZXRUZXh0KHRleHQpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGV0IGRpc2FibGUgPSBBUFAuZXZhbHVhdGVNZW51KCdpbkFwcE1lc3NhZ2UnLCBudWxsLCBudWxsLCB0aGlzKSxcbiAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICdpbkFwcE1lc3NhZ2UgY29udGV4dE1lbnUgW2FjdGlvbj1zZW5kU2FtcGxlXScsIC8vU2VuZCBTYW1wbGVcbiAgICAgICAgICAnaW5BcHBNZXNzYWdlIGNvbnRleHRNZW51IFthY3Rpb249dW5hcHByb3ZlXScsIC8vVW5hcHByb3ZlXG4gICAgICAgICAgJ2luQXBwTWVzc2FnZSBjb250ZXh0TWVudSBbYWN0aW9uPWFwcHJvdmVdJywgLy9BcHByb3ZlXG4gICAgICAgICAgJ2luQXBwTWVzc2FnZSBjb250ZXh0TWVudSBbYWN0aW9uPWNsb25lXScsIC8vQ2xvbmVcbiAgICAgICAgICAnaW5BcHBNZXNzYWdlIGNvbnRleHRNZW51IFthY3Rpb249ZGVsZXRlXScsIC8vRGVsZXRlXG4gICAgICAgICAgJ2luQXBwTWVzc2FnZSBjb250ZXh0TWVudSBbYWN0aW9uPXNlbmREcmFmdFNhbXBsZV0nLCAvL1NlbmQgU2FtcGxlIG9mIERyYWZ0XG4gICAgICAgICAgJ2luQXBwTWVzc2FnZSBjb250ZXh0TWVudSBbYWN0aW9uPWFwcHJvdmVEcmFmdF0nIC8vQXBwcm92ZSBEcmFmdFxuICAgICAgICBdLFxuICAgICAgICBtSXRlbXMgPSBFeHQ0LkNvbXBvbmVudFF1ZXJ5LnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuXG4gICAgICBpZiAobUl0ZW1zKSB7XG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0RGlzYWJsZWQoZGlzYWJsZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFNraXBwZWQ6IERpc2FibGUgVG9vbGJhciBCdXR0b25zICYgQWN0aW9ucyBNZW51IGZvciBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IEluLUFwcCBNZXNzYWdlcycpXG4gIH1cblxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmNvbnRyb2xsZXIuc21zTWVzc2FnZS5TbXNNZXNzYWdlLnByb3RvdHlwZS5sb2FkVG9vbGJhcicpKSB7XG4gICAgLy8gRGlzYWJsZSBNYXJrZXRpbmcgbWVudUl0ZW1zQWN0aXZpdGllcyA+IFNNUyBNZXNzYWdlcyA+IFRvb2xiYXIgYnV0dG9ucyAmIEFjdGlvbnMgbWVudVxuICAgIGxldCBwcmV2U21zTWVzc2FnZVRvb2xiYXIgPSBNa3QzLmNvbnRyb2xsZXIuc21zTWVzc2FnZS5TbXNNZXNzYWdlLnByb3RvdHlwZS5sb2FkVG9vbGJhclxuICAgIE1rdDMuY29udHJvbGxlci5zbXNNZXNzYWdlLlNtc01lc3NhZ2UucHJvdG90eXBlLmxvYWRUb29sYmFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFRvb2xiYXIgQnV0dG9ucyAmIEFjdGlvbnMgTWVudSBmb3IgTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBTTVMgTWVzc2FnZXMnKVxuICAgICAgcHJldlNtc01lc3NhZ2VUb29sYmFyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuICAgICAgbGV0IHRvb2xiYXIgPSB0aGlzLmdldFRvb2xiYXIoKSxcbiAgICAgICAgc21zTWVzc2FnZSA9IHRoaXMuZ2V0U21zTWVzc2FnZSgpLFxuICAgICAgICBhY3Rpb25zTWVudSA9IHRvb2xiYXIuZG93bignLmNvbnRleHRNZW51JyksXG4gICAgICAgIHRvb2xiYXJDb21wb25lbnRzID0gdG9vbGJhci5xdWVyeSgnY29tcG9uZW50JykgfHwgW10sXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBpbCA9IHRvb2xiYXJDb21wb25lbnRzLmxlbmd0aCxcbiAgICAgICAgdG9vbGJhckNvbXBvbmVudCxcbiAgICAgICAgdGV4dFxuXG4gICAgICBhY3Rpb25zTWVudS5yZWNvcmQgPSBzbXNNZXNzYWdlXG5cbiAgICAgIGZvciAoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICB0b29sYmFyQ29tcG9uZW50ID0gdG9vbGJhckNvbXBvbmVudHNbaV1cblxuICAgICAgICBpZiAoRXh0NC5pc0RlZmluZWQodG9vbGJhckNvbXBvbmVudC5pY29uQ2xzKSAmJiBFeHQ0LmlzRnVuY3Rpb24odG9vbGJhckNvbXBvbmVudC5zZXRJY29uQ2xzKSkge1xuICAgICAgICAgIHRvb2xiYXJDb21wb25lbnQuc2V0SWNvbkNscyh0b29sYmFyQ29tcG9uZW50Lmljb25DbHMpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgKEV4dDQuaXNEZWZpbmVkKHRvb2xiYXJDb21wb25lbnQudGV4dCkgfHwgRXh0NC5pc0Z1bmN0aW9uKHRvb2xiYXJDb21wb25lbnQuZ2V0VGV4dCkpICYmXG4gICAgICAgICAgRXh0NC5pc0Z1bmN0aW9uKHRvb2xiYXJDb21wb25lbnQuc2V0VGV4dClcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGV4dCA9IEV4dDQuaXNGdW5jdGlvbih0b29sYmFyQ29tcG9uZW50LmdldFRleHQpID8gdG9vbGJhckNvbXBvbmVudC5nZXRUZXh0KCkgOiB0b29sYmFyQ29tcG9uZW50LnRleHRcbiAgICAgICAgICB0b29sYmFyQ29tcG9uZW50LnNldFRleHQodGV4dClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXQgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ3Ntc01lc3NhZ2UnLCBudWxsLCBudWxsLCB0aGlzKSxcbiAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICdzbXNNZXNzYWdlIGNvbnRleHRNZW51IFthY3Rpb249dW5hcHByb3ZlXScsIC8vVW5hcHByb3ZlXG4gICAgICAgICAgJ3Ntc01lc3NhZ2UgY29udGV4dE1lbnUgW2FjdGlvbj1hcHByb3ZlXScsIC8vQXBwcm92ZVxuICAgICAgICAgICdzbXNNZXNzYWdlIGNvbnRleHRNZW51IFthY3Rpb249Y2xvbmVdJywgLy9DbG9uZVxuICAgICAgICAgICdzbXNNZXNzYWdlIGNvbnRleHRNZW51IFthY3Rpb249ZGVsZXRlXScsIC8vRGVsZXRlXG4gICAgICAgICAgJ3Ntc01lc3NhZ2UgY29udGV4dE1lbnUgW2FjdGlvbj1hcHByb3ZlRHJhZnRdJyAvL0FwcHJvdmUgRHJhZnRcbiAgICAgICAgXSxcbiAgICAgICAgbUl0ZW1zID0gRXh0NC5Db21wb25lbnRRdWVyeS5xdWVyeShtZW51SXRlbXMudG9TdHJpbmcoKSlcblxuICAgICAgaWYgKG1JdGVtcykge1xuICAgICAgICBtSXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKGRpc2FibGUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBTa2lwcGVkOiBEaXNhYmxlIFRvb2xiYXIgQnV0dG9ucyAmIEFjdGlvbnMgTWVudSBmb3IgTWFya2V0aW5nIEFjdGl2aXRpZXMgPiBTTVMgTWVzc2FnZXMnKVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0NC5Db21wb25lbnQucHJvdG90eXBlLnNob3dBdCcpKSB7XG4gICAgLy8gRGlzYWJsZSBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IE51cnR1cmUgUHJvZ3JhbSA+IFN0cmVhbSAmIENvbnRlbnQgQWN0aW9ucyBtZW51c1xuICAgIEV4dDQuQ29tcG9uZW50LnByb3RvdHlwZS5zaG93QXQgPSBmdW5jdGlvbiAoeCwgeSwgYW5pbWF0ZSkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIENvbnRlbnQgJiBBY3Rpb25zIE1lbnVzIGZvciBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IE51cnR1cmUgUHJvZ3JhbSBTdHJlYW0nKVxuICAgICAgbGV0IG1lID0gdGhpc1xuICAgICAgaWYgKCFtZS5yZW5kZXJlZCAmJiAobWUuYXV0b1JlbmRlciB8fCBtZS5mbG9hdGluZykpIHtcbiAgICAgICAgbWUuZG9BdXRvUmVuZGVyKClcbiAgICAgICAgbWUuaGlkZGVuID0gdHJ1ZVxuICAgICAgfVxuICAgICAgaWYgKG1lLmZsb2F0aW5nKSB7XG4gICAgICAgIG1lLnNldFBvc2l0aW9uKHgsIHksIGFuaW1hdGUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZS5zZXRQYWdlUG9zaXRpb24oeCwgeSwgYW5pbWF0ZSlcbiAgICAgIH1cbiAgICAgIG1lLnNob3coKVxuXG4gICAgICBpZiAodHlwZW9mIE1rdENhbnZhcyAhPT0gJ3VuZGVmaW5lZCcgJiYgTWt0Q2FudmFzICYmIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSkge1xuICAgICAgICBsZXQgaWksXG4gICAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ2J1dHRvbicsIG51bGwsIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSwgbnVsbClcbiAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgbWUuaXRlbXMuaXRlbXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgc3dpdGNoIChtZS5pdGVtcy5pdGVtc1tpaV0uYWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBNYXJrZXRpbmcgQWN0aXZpdGllcyA+IE51cnR1cmUgUHJvZ3JhbSA+IFN0cmVhbSBBY3Rpb25zXG4gICAgICAgICAgICBjYXNlICdjbG9uZSc6XG4gICAgICAgICAgICBjYXNlICdkZWxldGUnOlxuICAgICAgICAgICAgY2FzZSAnYXJjaGl2ZSc6XG4gICAgICAgICAgICBjYXNlICd1bmFyY2hpdmUnOlxuICAgICAgICAgICAgY2FzZSAnZW1haWxBcHByb3ZlRHJhZnQnOlxuICAgICAgICAgICAgY2FzZSAnbW9iaWxlUHVzaEFwcHJvdmUnOlxuICAgICAgICAgICAgY2FzZSAnaGlkZSc6XG4gICAgICAgICAgICBjYXNlICd1bmhpZGUnOlxuICAgICAgICAgICAgICBtZS5pdGVtcy5pdGVtc1tpaV0uc2V0RGlzYWJsZWQoZGlzYWJsZSlcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBpaSxcbiAgICAgICAgICBkaXNhYmxlID0gQVBQLmV2YWx1YXRlTWVudSgnYnV0dG9uJywgbnVsbCwgbnVsbCwgbnVsbClcbiAgICAgICAgZm9yIChpaSA9IDA7IGlpIDwgbWUuaXRlbXMuaXRlbXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgc3dpdGNoIChtZS5pdGVtcy5pdGVtc1tpaV0uYWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBBZG1pbiA+IE1hcmtldG8gQ3VzdG9tIEFjdGl2aXRpZXMvT2JqZWN0cyAmIE1vYmlsZSBBcHBzID4gQWN0aXZpdGllcy9PYmplY3RzICYgTW9iaWxlIEFwcHMgVHJlZSA+IFJpZ2h0LWNsaWNrIE1lbnVcbiAgICAgICAgICAgIGNhc2UgJ3B1Ymxpc2gnOlxuICAgICAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICAgIGNhc2UgJ3NlbmQnOlxuICAgICAgICAgICAgY2FzZSAndmVyaWZ5JzpcbiAgICAgICAgICAgICAgbWUuaXRlbXMuaXRlbXNbaWldLnNldERpc2FibGVkKGRpc2FibGUpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFNraXBwZWQ6IERpc2FibGUgQ29udGVudCAmIEFjdGlvbnMgTWVudXMgZm9yIE1hcmtldGluZyBBY3Rpdml0aWVzID4gTnVydHVyZSBQcm9ncmFtIFN0cmVhbScpXG4gIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgVGhpcyBmdW5jdGlvbiBvdmVycmlkZSB0aGUgZHJhZnQgZWRpdCBtZW51IGl0ZW1zIGluIGFsbCBhcmVhcy5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLm92ZXJyaWRlRHJhZnRFZGl0cyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gT3ZlcnJpZGluZzogRHJhZnQgRWRpdCBNZW51IEl0ZW1zJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0RHNNZW51JykpIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IE92ZXJyaWRlIERyYWZ0IEVkaXQgTWVudSBJdGVtcycpXG4gICAgbGV0IG9yaWdFeHRNZXNzYWdlQm94U2hvdyA9IEV4dC5NZXNzYWdlQm94LnNob3dcbiAgICBvcmlnRXh0NE1lc3NhZ2VCb3hTaG93ID0gRXh0NC5NZXNzYWdlQm94LnNob3dcbiAgICBvcmlnTWt0TWVzc2FnZVNob3cgPSBNa3RNZXNzYWdlLnNob3dcbiAgICA7KG9yaWdQYWdlRWRpdEhhbmRsZXIgPSBNa3REc01lbnUuZ2V0UGFnZU1lbnUoKS5nZXQoJ3BhZ2VFZGl0JykuaGFuZGxlciksXG4gICAgKG9yaWdQYWdlRHJhZnRFZGl0SGFuZGxlciA9IE1rdERzTWVudS5nZXRQYWdlTWVudSgpLmdldCgncGFnZURyYWZ0RWRpdCcpLmhhbmRsZXIpLFxuICAgIChvcmlnRW1haWxFZGl0SGFuZGxlciA9IE1rdERzTWVudS5nZXRFbWFpbE1lbnUoKS5nZXQoJ2VtYWlsRWRpdCcpLmhhbmRsZXIpLFxuICAgIChvcmlnRW1haWxEcmFmdEVkaXRIYW5kbGVyID0gTWt0RHNNZW51LmdldEVtYWlsTWVudSgpLmdldCgnZW1haWxEcmFmdEVkaXQnKS5oYW5kbGVyKVxuXG4gICAgTWt0RHNNZW51LmdldFBhZ2VNZW51KClcbiAgICAgIC5nZXQoJ3BhZ2VEcmFmdEVkaXQnKVxuICAgICAgLnNldEhhbmRsZXIoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGlmIChhdHRyICYmIGF0dHIuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBPdmVycmlkZSBEcmFmdCBFZGl0IE1lbnUgSXRlbXMgPiBMYW5kaW5nIFBhZ2UgRHJhZnQgRWRpdCcpXG4gICAgICAgICAgbGV0IHt0cmlnZ2VyZWRGcm9tfSA9IHRoaXMucGFyZW50TWVudSxcbiAgICAgICAgICAgIHt4dHJhfSA9IGVsLnBhcmVudE1lbnVcbiAgICAgICAgICBNa3QuYXBwLkRlc2lnblN0dWRpby5QYWdlcy5kaXNjYXJkRHJhZnQoe1xuICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogdHJpZ2dlcmVkRnJvbSxcbiAgICAgICAgICAgIHh0cmE6IHh0cmFcbiAgICAgICAgICB9KVxuICAgICAgICAgIGVsLnBhcmVudE1lbnUuaGlkZSh0cnVlKVxuICAgICAgICAgIEV4dC5NZXNzYWdlQm94LmhpZGUoKVxuICAgICAgICAgIE1rdC5hcHAuRGVzaWduU3R1ZGlvLlBhZ2VzLmVkaXRQYWdlRHJhZnQoe1xuICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogdHJpZ2dlcmVkRnJvbSxcbiAgICAgICAgICAgIHh0cmE6IHh0cmFcbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9yaWdQYWdlRHJhZnRFZGl0SGFuZGxlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAvLyBFbWFpbCBFZGl0XG4gICAgTWt0RHNNZW51LmdldEVtYWlsTWVudSgpXG4gICAgICAuZ2V0KCdlbWFpbEVkaXQnKVxuICAgICAgLnNldEhhbmRsZXIoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGlmIChhdHRyICYmIGF0dHIuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBPdmVycmlkZSBEcmFmdCBFZGl0IE1lbnUgSXRlbXMgPiBFbWFpbCBFZGl0JylcbiAgICAgICAgICBsZXQge3RyaWdnZXJlZEZyb219ID0gdGhpcy5wYXJlbnRNZW51LFxuICAgICAgICAgICAge3h0cmF9ID0gZWwucGFyZW50TWVudSxcbiAgICAgICAgICAgIG5ld0VsID0gdGhpcy5nZXRFbCgpXG4gICAgICAgICAgRXh0Lk1lc3NhZ2VCb3guc2hvdyA9IEV4dDQuTWVzc2FnZUJveC5zaG93ID0gTWt0TWVzc2FnZS5zaG93ID0gZnVuY3Rpb24gKCkge31cbiAgICAgICAgICBNa3QuYXBwLkRlc2lnblN0dWRpby5FbWFpbHMuZGlzY2FyZERyYWZ0KHtcbiAgICAgICAgICAgIHRyaWdnZXJlZEZyb206IHRyaWdnZXJlZEZyb20sXG4gICAgICAgICAgICB4dHJhOiB4dHJhXG4gICAgICAgICAgfSlcbiAgICAgICAgICBlbC5wYXJlbnRNZW51LmhpZGUodHJ1ZSlcbiAgICAgICAgICBNa3QuYXBwLkRlc2lnblN0dWRpby5FbWFpbHMuZWRpdERyYWZ0KHtcbiAgICAgICAgICAgIHRyaWdnZXJlZEZyb206IHRyaWdnZXJlZEZyb20sXG4gICAgICAgICAgICB4dHJhOiB4dHJhLFxuICAgICAgICAgICAgZWw6IG5ld0VsXG4gICAgICAgICAgfSlcbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBSZXN0b3Jpbmc6IFN5c3RlbSBNZXNzYWdlcycpXG4gICAgICAgICAgICBFeHQuTWVzc2FnZUJveC5zaG93ID0gb3JpZ0V4dE1lc3NhZ2VCb3hTaG93XG4gICAgICAgICAgICBFeHQ0Lk1lc3NhZ2VCb3guc2hvdyA9IG9yaWdFeHQ0TWVzc2FnZUJveFNob3dcbiAgICAgICAgICAgIE1rdE1lc3NhZ2Uuc2hvdyA9IG9yaWdNa3RNZXNzYWdlU2hvd1xuICAgICAgICAgIH0sIDUwMDApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3JpZ0VtYWlsRWRpdEhhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIC8vIEVtYWlsIERyYWZ0IEVkaXRcbiAgICBNa3REc01lbnUuZ2V0RW1haWxNZW51KClcbiAgICAgIC5nZXQoJ2VtYWlsRHJhZnRFZGl0JylcbiAgICAgIC5zZXRIYW5kbGVyKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBpZiAoYXR0ciAmJiBhdHRyLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogT3ZlcnJpZGUgRHJhZnQgRWRpdCBNZW51IEl0ZW1zID4gRW1haWwgRHJhZnQgRWRpdCcpXG4gICAgICAgICAgbGV0IHt0cmlnZ2VyZWRGcm9tfSA9IHRoaXMucGFyZW50TWVudSxcbiAgICAgICAgICAgIHt4dHJhfSA9IGVsLnBhcmVudE1lbnUsXG4gICAgICAgICAgICBuZXdFbCA9IHRoaXMuZ2V0RWwoKVxuICAgICAgICAgIE1rdC5hcHAuRGVzaWduU3R1ZGlvLkVtYWlscy5kaXNjYXJkRHJhZnQoe1xuICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogdHJpZ2dlcmVkRnJvbSxcbiAgICAgICAgICAgIHh0cmE6IHh0cmFcbiAgICAgICAgICB9KVxuICAgICAgICAgIGVsLnBhcmVudE1lbnUuaGlkZSh0cnVlKVxuICAgICAgICAgIE1rdC5hcHAuRGVzaWduU3R1ZGlvLkVtYWlscy5lZGl0RHJhZnQoe1xuICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogdHJpZ2dlcmVkRnJvbSxcbiAgICAgICAgICAgIHh0cmE6IHh0cmEsXG4gICAgICAgICAgICBlbDogbmV3RWxcbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9yaWdFbWFpbERyYWZ0RWRpdEhhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9XG4gICAgICB9KVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFNraXBwaW5nOiBPdmVycmlkZSBEcmFmdCBFZGl0IE1lbnUgSXRlbXMnKVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gZGlzYWJsZXMgb3IgaGlkZXMgVG9vbGJhciBpdGVtcyBmb3IgYWxsIGFzc2V0IHR5cGVzIGluIGFsbCBhcmVhcy5cbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLmhpZGVUb29sYmFySXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEhpZGluZzogVG9vbGJhciBJdGVtcycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dC5sYXlvdXQuQ29udGFpbmVyTGF5b3V0LnByb3RvdHlwZS5yZW5kZXJJdGVtJykpIHtcbiAgICAvLyBEaXNhYmxlIEFMTCBhcmVhcyA+IEFMTCBhc3NldHMgPiBBTEwgVG9vbGJhciBpdGVtcyBleGNlcHQgZm9yIFNtYXJ0IENhbXBhaWducywgU21hcnQgTGlzdHMsIExpc3RzLCBTb2NpYWwgQXBwcywgYW5kIFB1c2ggTm90aWZpY2F0aW9uc1xuICAgIEV4dC5sYXlvdXQuQ29udGFpbmVyTGF5b3V0LnByb3RvdHlwZS5yZW5kZXJJdGVtID0gZnVuY3Rpb24gKGMsIHBvc2l0aW9uLCB0YXJnZXQpIHtcbiAgICAgIGlmIChjKSB7XG4gICAgICAgIGlmICghYy5yZW5kZXJlZCkge1xuICAgICAgICAgIGMucmVuZGVyKHRhcmdldCwgcG9zaXRpb24pXG4gICAgICAgICAgdGhpcy5jb25maWd1cmVJdGVtKGMsIHBvc2l0aW9uKVxuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLmlzVmFsaWRQYXJlbnQoYywgdGFyZ2V0KSkge1xuICAgICAgICAgIGlmIChFeHQuaXNOdW1iZXIocG9zaXRpb24pKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRhcmdldC5kb20uY2hpbGROb2Rlc1twb3NpdGlvbl1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0YXJnZXQuZG9tLmluc2VydEJlZm9yZShjLmdldFBvc2l0aW9uRWwoKS5kb20sIHBvc2l0aW9uIHx8IG51bGwpXG4gICAgICAgICAgYy5jb250YWluZXIgPSB0YXJnZXRcbiAgICAgICAgICB0aGlzLmNvbmZpZ3VyZUl0ZW0oYywgcG9zaXRpb24pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBjICE9PSAndW5kZWZpbmVkJyAmJiBjICYmIGMudG9wVG9vbGJhciAmJiBjLnRvcFRvb2xiYXIuaXRlbXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFRvb2xiYXIgaXRlbXMgZm9yIEFMTCBpbiBBTEwnKVxuICAgICAgICBsZXQgb3JpZ0V4dE1lc3NhZ2VCb3hTaG93ID0gRXh0Lk1lc3NhZ2VCb3guc2hvdyxcbiAgICAgICAgICBvcmlnRXh0NE1lc3NhZ2VCb3hTaG93ID0gRXh0NC5NZXNzYWdlQm94LnNob3csXG4gICAgICAgICAgb3JpZ01rdE1lc3NhZ2VTaG93ID0gTWt0TWVzc2FnZS5zaG93LFxuICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgY2FudmFzID0gTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLFxuICAgICAgICAgIGRpc2FibGUgPSBBUFAuZXZhbHVhdGVNZW51KCdidXR0b24nLCBudWxsLCBjYW52YXMsIG51bGwpLFxuICAgICAgICAgIGl0ZW1zVG9IaWRlID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2RlbGV0ZUl0ZW0nLCAvL0RlbGV0ZVxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdkZWxldGVTdWJzY3JpcHRpb25fYXR4Q2FudmFzU3Vic2NyaXB0aW9ucycsIC8vRGVsZXRlIFN1YnNjcmlwdGlvblxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEdsb2JhbCA+IEZvcm1cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdmb3JtRWRpdF9sYW5kaW5nRk9EZXRhaWwnLCAvL0VkaXQgRm9ybVxuICAgICAgICAgICAgICBhY3Rpb246ICdoYW5kbGVyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEdsb2JhbCA+IExhbmRpbmcgUGFnZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ3BhZ2VFZGl0X2xhbmRpbmdMUERldGFpbCcsIC8vRWRpdCBEcmFmdFxuICAgICAgICAgICAgICBhY3Rpb246ICdoYW5kbGVyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEdsb2JhbCA+IEVtYWlsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZW1haWxFZGl0X2xhbmRpbmdFTURldGFpbCcsIC8vRWRpdCBEcmFmdFxuICAgICAgICAgICAgICBhY3Rpb246ICdoYW5kbGVyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdnb3RvRGVsaXZlcmFiaWxpdHlfbGFuZGluZ0VNRGV0YWlsJywgLy9EZWxpdmVyYWJpbGl0eSBUb29sc1xuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzID4gUHJvZ3JhbXMgJiBGb2xkZXJzID4gTXkgVG9rZW5zXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZGVsZXRlQ3VzdG9tVG9rZW4nLCAvL0RlbGV0ZSBUb2tlblxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1hcmtldGluZyBBY3Rpdml0aWVzID4gUHJvZ3JhbXMgPiBNZW1iZXJzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnaW1wb3J0TWVtYmVycycsIC8vSW1wb3J0IE1lbWJlcnNcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0RGlzYWJsZWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2ltcG9ydFRlbXBsYXRlX2xhbmRpbmdDYW52YXNUTScsIC8vSW1wb3J0IFRlbXBsYXRlXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldERpc2FibGVkJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdpbXBvcnRUZW1wbGF0ZV9sYW5kaW5nVE1EZXRhaWwnLCAvL0ltcG9ydCBUZW1wbGF0ZVxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXREaXNhYmxlZCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZ290b0RlbGl2ZXJhYmlsaXR5X2xhbmRpbmdDYW52YXNFTScsIC8vRGVsaXZlcmFiaWxpdHkgVG9vbHNcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBEZXNpZ24gU3R1ZGlvID4gSW1hZ2VzIGFuZCBGaWxlc1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2ltYWdlVXBsb2FkX2xhbmRpbmdDYW52YXNJTScsIC8vVXBsb2FkIEltYWdlIG9yIEZpbGVcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0RGlzYWJsZWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2ltYWdlUmVwbGFjZV9sYW5kaW5nQ2FudmFzSU0nLCAvL1JlcGxhY2UgSW1hZ2Ugb3IgRmlsZVxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdpbWFnZVVwbG9hZF9sYW5kaW5nSU1EZXRhaWwnLCAvL1VwbG9hZCBJbWFnZSBvciBGaWxlXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldERpc2FibGVkJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdpbWFnZVJlcGxhY2VfbGFuZGluZ0lNRGV0YWlsJywgLy9SZXBsYWNlIEltYWdlIG9yIEZpbGVcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBBbmFseXRpY3MgPiBNb2RlbFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2VkaXREcmFmdF9yY21DYW52YXNPdmVydmlldycsIC8vRWRpdCBEcmFmdFxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdlZGl0TGljZW5zZXMnLCAvL0lzc3VlIExpY2Vuc2VcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZGVsZXRlVXNlcicsIC8vRGVsZXRlIFVzZXJcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAncmVzZXRQYXNzd29yZCcsIC8vUmVzZXQgUGFzc3dvcmRcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZGVsZXRlUm9sZScsIC8vRGVsZXRlIFJvbGVcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZGVsZXRlWm9uZScsIC8vRGVsZXRlIFdvcmtzcGFjZVxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdkZWxldGVQYXJ0aXRpb24nLCAvL0RlbGV0ZSBMZWFkIFBhcnRpdGlvblxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdkZWxldGVEb21haW4nLCAvL0RlbGV0ZSBEb21haW5cbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZGtpbURldGFpbHMnLCAvL0RLSU0gRGV0YWlsc1xuICAgICAgICAgICAgICBhY3Rpb246ICdzZXREaXNhYmxlZCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHRleHQ6ICdOZXcgQ3VzdG9tIEZpZWxkJywgLy9OZXcgQ3VzdG9tIEZpZWxkXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldERpc2FibGVkJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEFkbWluID4gU2FsZXNmb3JjZSBPYmplY3QgU3luY1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ3JlZnJlc2hDYWRTZmRjT2JqZWN0U3luYycsIC8vUmVmcmVzaCBTY2hlbWFcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0RGlzYWJsZWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQWRtaW4gPiBTYWxlc2ZvcmNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnZW5hYmxlU3luYycsIC8vRW5hYmxlL0Rpc2FibGUgU3luY1xuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaWQ6ICdyZXZva2VMaWNlbnNlQ2FkTGlzQWRtaW4nLCAvL1Jldm9rZSBMaWNlbnNlXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ3Jlc2VuZExpY2Vuc2VDYWRMaXNBZG1pbicsIC8vUmVzZW5kIEludml0YXRpb25cbiAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnY29uZmlnQWRkaW5DYWRMaXNBZG1pbicsIC8vQ29uZmlnIEFkZC1pblxuICAgICAgICAgICAgICBhY3Rpb246ICdzZXRWaXNpYmxlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEFkbWluID4gTGFuZGluZyBQYWdlcyA+IFJ1bGVzXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHRleHQ6ICdSdWxlcyBBY3Rpb25zJywgLy9SdWxlcyBBY3Rpb25zXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2RlbGV0ZVJ1bGUnLCAvL0RlbGV0ZSBSdWxlXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2xhdW5jaHBvaW50QWN0aW9ucycsIC8vU2VydmljZSBBY3Rpb25zXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gQWRtaW4gPiBSZXZlbnVlIEN5Y2xlIEFuYWx5dGljcyA+IEN1c3RvbSBGaWVsZCBTeW5jXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGlkOiAnY2FkQ2hhbmdlQnV0dG9uJywgLy9FZGl0IFN5bmMgT3B0aW9uXG4gICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuXG4gICAgICAgIGl0ZW1zVG9IaWRlLmZvckVhY2goZnVuY3Rpb24gKGl0ZW1Ub0hpZGUpIHtcbiAgICAgICAgICBpZiAoaXRlbVRvSGlkZS5pZCkge1xuICAgICAgICAgICAgaXRlbSA9IGMudG9wVG9vbGJhci5pdGVtcy5nZXQoaXRlbVRvSGlkZS5pZClcbiAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW1Ub0hpZGUudGV4dCkge1xuICAgICAgICAgICAgaXRlbSA9IGMudG9wVG9vbGJhci5maW5kKCd0ZXh0JywgaXRlbVRvSGlkZS50ZXh0KVswXVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaWYgKGl0ZW1Ub0hpZGUuaWQgPT0gJ2dvdG9EZWxpdmVyYWJpbGl0eV9sYW5kaW5nRU1EZXRhaWwnKSB7XG4gICAgICAgICAgICAgIGl0ZW0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbVRvSGlkZS5hY3Rpb24gPT0gJ3NldFZpc2libGUnKSB7XG4gICAgICAgICAgICAgIGl0ZW0uc2V0VmlzaWJsZSghZGlzYWJsZSlcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbVRvSGlkZS5hY3Rpb24gPT0gJ3NldERpc2FibGVkJykge1xuICAgICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKGRpc2FibGUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgb3JpZ0hhbmRsZXIgPSBpdGVtLmhhbmRsZXJcblxuICAgICAgICAgICAgc3dpdGNoIChpdGVtVG9IaWRlLmlkKSB7XG4gICAgICAgICAgICAgIGNhc2UgJ3BhZ2VFZGl0X2xhbmRpbmdMUERldGFpbCc6XG4gICAgICAgICAgICAgICAgaXRlbS5zZXRIYW5kbGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChhdHRyICYmIGF0dHIuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogT3ZlcnJpZGUgRWRpdCBEcmFmdCBUb29sYmFyIEJ1dHRvbiA+IExhbmRpbmcgUGFnZScpXG4gICAgICAgICAgICAgICAgICAgIGxldCBkaXNjYXJkTXNnID0gRXh0Lk1lc3NhZ2VCb3guc2hvdyh7XG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdNYXJrZXRvTGl2ZScsXG4gICAgICAgICAgICAgICAgICAgICAgbXNnOiAnRGlzY2FyZGluZyBEcmFmdCcsXG4gICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgIHdhaXQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyNzAsXG4gICAgICAgICAgICAgICAgICAgICAgY2xvc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgTWt0LmFwcC5EZXNpZ25TdHVkaW8uUGFnZXMuZGlzY2FyZERyYWZ0KHtcbiAgICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyZWRGcm9tOiAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICB4dHJhOiBhdHRyXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIGRpc2NhcmRNc2cuaGlkZSgpXG4gICAgICAgICAgICAgICAgICAgIE1rdC5hcHAuRGVzaWduU3R1ZGlvLlBhZ2VzLmVkaXRQYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyZWRGcm9tOiAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICBlbDogdGhpcy5nZXRFbCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvcmlnSGFuZGxlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdlbWFpbEVkaXRfbGFuZGluZ0VNRGV0YWlsJzpcbiAgICAgICAgICAgICAgICBpdGVtLnNldEhhbmRsZXIoZnVuY3Rpb24gKGJ1dHRvbiwgZSkge1xuICAgICAgICAgICAgICAgICAgaWYgKGF0dHIgJiYgYXR0ci5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBPdmVycmlkZSBFZGl0IERyYWZ0IFRvb2xiYXIgQnV0dG9uID4gRW1haWwnKVxuICAgICAgICAgICAgICAgICAgICBFeHQuTWVzc2FnZUJveC5zaG93ID0gRXh0NC5NZXNzYWdlQm94LnNob3cgPSBNa3RNZXNzYWdlLnNob3cgPSBmdW5jdGlvbiAoKSB7fVxuICAgICAgICAgICAgICAgICAgICBNa3QuYXBwLkRlc2lnblN0dWRpby5FbWFpbHMuZGlzY2FyZERyYWZ0KHtcbiAgICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyZWRGcm9tOiAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICB4dHJhOiBhdHRyLFxuICAgICAgICAgICAgICAgICAgICAgIGVsOiB0aGlzLmdldEVsKClcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgTWt0LmFwcC5EZXNpZ25TdHVkaW8uRW1haWxzLmVkaXREcmFmdCh7XG4gICAgICAgICAgICAgICAgICAgICAgdHJpZ2dlcmVkRnJvbTogJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgICAgcGFuZWxJZDogYXR0ci5wYW5lbElkXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBSZXN0b3Jpbmc6IFN5c3RlbSBNZXNzYWdlcycpXG4gICAgICAgICAgICAgICAgICAgICAgRXh0Lk1lc3NhZ2VCb3guc2hvdyA9IG9yaWdFeHRNZXNzYWdlQm94U2hvd1xuICAgICAgICAgICAgICAgICAgICAgIEV4dDQuTWVzc2FnZUJveC5zaG93ID0gb3JpZ0V4dDRNZXNzYWdlQm94U2hvd1xuICAgICAgICAgICAgICAgICAgICAgIE1rdE1lc3NhZ2Uuc2hvdyA9IG9yaWdNa3RNZXNzYWdlU2hvd1xuICAgICAgICAgICAgICAgICAgICB9LCA1MDAwKVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ0hhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gZGlzYWJsZXMgb3IgaGlkZXMgdG9nZ2xlZCBUb29sYmFyIGl0ZW1zIHN1Y2ggYXMgaW4gQWRtaW5cbiAqICBAcGFyYW0ge0FycmF5fSAtIEFuIGFycmF5IG9mIG9iamVjdHMgd2hpY2ggY29udGFpbiB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZXM6XG4gKiAgICAgICAgICAgICAgICAgICBpZCAtIElEIG9mIHRoZSBpdGVtIHRvIGRpc2FibGVcbiAqICAgICAgICAgICAgICAgICAgICBPUlxuICogICAgICAgICAgICAgICAgICAgdGV4dCAtIG5hbWUgb2YgdGhlIGl0ZW0gdG8gZGlzYWJsZVxuICogICAgICAgICAgICAgICAgICAgYWN0aW9uIC0gYWN0aW9uIHRvIHRha2Ugb24gdGhlIGl0ZW0gKHNldFZpc2lzYmxlLCBzZXREaXNhYmxlZClcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuQVBQLmhpZGVPdGhlclRvb2xiYXJJdGVtcyA9IGZ1bmN0aW9uIChpdGVtc1RvSGlkZSkge1xuICBsZXQgaXNUb3BUb29sYmFyQWN0aXZlID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBIaWRpbmc6IE90aGVyIFRvb2xiYXIgSXRlbXMnKVxuICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdENhbnZhcy5nZXRBY3RpdmVUYWInKSAmJiBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkgJiYgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmdldFRvcFRvb2xiYXIoKSkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBIaWRpbmcgT3RoZXIgVG9vbGJhciBJdGVtcycpXG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc1RvcFRvb2xiYXJBY3RpdmUpXG4gICAgICBsZXQgdG9wVG9vbGJhciA9IE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5nZXRUb3BUb29sYmFyKClcbiAgICAgIGl0ZW1zVG9IaWRlLmZvckVhY2goZnVuY3Rpb24gKGl0ZW1Ub0hpZGUpIHtcbiAgICAgICAgaWYgKGl0ZW1Ub0hpZGUuaWQpIHtcbiAgICAgICAgICBpdGVtID0gdG9wVG9vbGJhci5pdGVtcy5nZXQoaXRlbVRvSGlkZS5pZClcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtVG9IaWRlLnRleHQpIHtcbiAgICAgICAgICBpdGVtID0gdG9wVG9vbGJhci5maW5kKCd0ZXh0JywgaXRlbVRvSGlkZS50ZXh0KVswXVxuICAgICAgICB9XG4gICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW1Ub0hpZGUuYWN0aW9uID09ICdzZXRWaXNpYmxlJykge1xuICAgICAgICAgICAgaXRlbS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbVRvSGlkZS5hY3Rpb24gPT0gJ3NldERpc2FibGVkJykge1xuICAgICAgICAgICAgaXRlbS5zZXREaXNhYmxlZCh0cnVlKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH0sIDApXG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gZGlzYWJsZXMgc2F2aW5nIGZvciBSZXZlbnVlIEN5Y2xlIE1vZGVscyBhbmQgaXNzdWVzIGEgdHJhY2tpbmdcbiAqICByZXF1ZXN0IHRvIEhlYXAgQW5hbHl0aWNzLlxuICogIEBwYXJhbSB7U3RyaW5nfSBhc3NldFR5cGUgLSBBc3NldCB0eXBlIChyZXBvcnQsIG1vZGVsKVxuICogIEBwYXJhbSB7U3RyaW5nfSBtb2RlIC0gTW9kZSB2aWV3IChlZGl0LCBwcmV2aWV3KVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5BUFAuZGlzYWJsZUFuYWx5dGljc1NhdmluZyA9IGZ1bmN0aW9uIChhc3NldFR5cGUsIG1vZGUpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBBbmFseXRpY3MgU2F2aW5nIGZvciAnICsgYXNzZXRUeXBlKVxuICBsZXQgaXNBbmFseXRpY3NBc3NldFxuXG4gIGlzQW5hbHl0aWNzQXNzZXQgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgIGlmIChcbiAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0Q2FudmFzLmdldEFjdGl2ZVRhYicpICYmXG4gICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkgJiZcbiAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcgJiZcbiAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKS5jb25maWcuYWNjZXNzWm9uZUlkXG4gICAgKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0FuYWx5dGljc0Fzc2V0KVxuXG4gICAgICBsZXQgYXNzZXROb2RlID0gTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZyxcbiAgICAgICAgaGVhcEV2ZW50ID0ge1xuICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgIGFzc2V0TmFtZTogJycsXG4gICAgICAgICAgYXNzZXRUeXBlOiBhc3NldE5vZGUuY29tcFR5cGUsXG4gICAgICAgICAgYXNzZXRJZDogYXNzZXROb2RlLmV4cE5vZGVJZCxcbiAgICAgICAgICB3b3Jrc3BhY2VJZDogYXNzZXROb2RlLmFjY2Vzc1pvbmVJZCxcbiAgICAgICAgICB3b3Jrc3BhY2VOYW1lOiAnJ1xuICAgICAgICB9LFxuICAgICAgICB0aXRsZVJlcGxhY2VSZWdleCA9IG5ldyBSZWdFeHAoJ1xcXFwoW15cXFxcKV0rXFxcXCkkJylcblxuICAgICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgICAgIEFQUC5kaXNhYmxlU2F2aW5nKClcbiAgICAgICAgICBBUFAuZGlzYWJsZU1lbnVzKClcbiAgICAgICAgICBBUFAuaGlkZVRvb2xiYXJJdGVtcygpXG4gICAgICAgICAgQVBQLmRpc2FibGVGb3JtU2F2ZUJ1dHRvbnMoKVxuICAgICAgICAgIGhlYXBFdmVudC5hc3NldEFyZWEgPSAnRWRpdG9yJ1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ3ByZXZpZXcnOlxuICAgICAgICAgIEFQUC5kaXNhYmxlRm9ybVNhdmVCdXR0b25zKClcbiAgICAgICAgICBoZWFwRXZlbnQuYXNzZXRBcmVhID0gJ1ByZXZpZXdlcidcbiAgICAgICAgICBicmVha1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIEFQUC5kaXNhYmxlU2F2aW5nKClcbiAgICAgICAgICBBUFAuZGlzYWJsZU1lbnVzKClcbiAgICAgICAgICBBUFAuaGlkZVRvb2xiYXJJdGVtcygpXG4gICAgICAgICAgQVBQLmRpc2FibGVGb3JtU2F2ZUJ1dHRvbnMoKVxuICAgICAgICAgIEFQUC5kaXNhYmxlSGFybWZ1bFNhdmVCdXR0b25zKClcbiAgICAgICAgICBoZWFwRXZlbnQuYXNzZXRBcmVhID0gJ0Z1bGwgU2NyZWVuJ1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKGFzc2V0VHlwZSkge1xuICAgICAgICBjYXNlICdyZXBvcnQnOlxuICAgICAgICAgIGhlYXBFdmVudC5hc3NldE5hbWUgPSBhc3NldE5vZGUudGl0bGVcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdtb2RlbCc6XG4gICAgICAgICAgaGVhcEV2ZW50LmFzc2V0TmFtZSA9IGFzc2V0Tm9kZS5zYXRlbGxpdGVUaXRsZVxuICAgICAgICAgIGlmIChoZWFwRXZlbnQuYXNzZXROYW1lLnNlYXJjaCh0aXRsZVJlcGxhY2VSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGhlYXBFdmVudC5hc3NldE5hbWUgPSBoZWFwRXZlbnQuYXNzZXROYW1lLnJlcGxhY2UodGl0bGVSZXBsYWNlUmVnZXgsICcnKS50cmltUmlnaHQoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChoZWFwRXZlbnQuYXNzZXROYW1lLnNlYXJjaCgvXCIvKSAhPSAtMSkge1xuICAgICAgICAgICAgaGVhcEV2ZW50LmFzc2V0TmFtZSA9IGhlYXBFdmVudC5hc3NldE5hbWUucmVwbGFjZSgvXCIvZywgJycpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGlmIChoZWFwRXZlbnQuYXNzZXRUeXBlLmNoYXJBdCgwKS5zZWFyY2goL1thLXpdLykgIT0gLTEpIHtcbiAgICAgICAgbGV0IGZpcnN0Q2hhciA9IGhlYXBFdmVudC5hc3NldFR5cGUuY2hhckF0KDApXG5cbiAgICAgICAgaGVhcEV2ZW50LmFzc2V0VHlwZSA9IGZpcnN0Q2hhci50b1VwcGVyQ2FzZSgpICsgaGVhcEV2ZW50LmFzc2V0VHlwZS5zbGljZSgxKVxuICAgICAgfVxuXG4gICAgICBoZWFwRXZlbnQud29ya3NwYWNlTmFtZSA9IEFQUC5nZXRXb3Jrc3BhY2VOYW1lKGFzc2V0Tm9kZS5hY2Nlc3Nab25lSWQpXG5cbiAgICAgIGlmIChhc3NldE5vZGUuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgIGhlYXBFdmVudC5uYW1lID0gaGVhcEV2ZW50LndvcmtzcGFjZU5hbWVcbiAgICAgIH0gZWxzZSBpZiAoYXNzZXROb2RlLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvTXlXb3Jrc3BhY2VJZE1hdGNoKSAhPSAtMSkge1xuICAgICAgICBoZWFwRXZlbnQubmFtZSA9IGhlYXBFdmVudC53b3Jrc3BhY2VOYW1lXG4gICAgICAgIGhlYXBFdmVudC51c2VyRm9sZGVyID0gdXNlck5hbWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhlYXBFdmVudC5uYW1lID0gbWt0b090aGVyV29ya3NwYWNlTmFtZVxuICAgICAgfVxuXG4gICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIGhlYXBFdmVudClcbiAgICB9XG4gIH0sIDApXG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gZGlzYWJsZXMgc2F2aW5nIGZvciBhbGwgYXNzZXQgdHlwZXMgd2l0aGluIHRoZSBEZXNpZ25lcnMgZWRpdCBtb2RlXG4gKiAgYW5kIGRpc2FibGVzIHRoZSBoYXJtZnVsIHRvb2xiYXIgbWVudSBpdGVtcyBhbmQgYnV0dG9ucyBpbiBib3RoIGVkaXQgYW5kIHByZXZpZXdcbiAqICBtb2Rlcy4gSXQgYWxzbyBpc3N1ZXMgYSB0cmFja2luZyByZXF1ZXN0IHRvIEhlYXAgQW5hbHl0aWNzLlxuICogIEBwYXJhbSB7U3RyaW5nfSBhc3NldFR5cGUgLSBBc3NldCB0eXBlIChsYW5kaW5nUGFnZSwgZW1haWwsIGZvcm0sIHB1c2hOb3RpZmljYXRpb24sXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluQXBwTWVzc2FnZSwgc21zTWVzc2FnZSwgc29jaWFsQXBwLCBhYlRlc3QpXG4gKiAgQHBhcmFtIHtTdHJpbmd9IG1vZGUgLSBNb2RlIHZpZXcgKGVkaXQsIHByZXZpZXcpXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcgPSBmdW5jdGlvbiAoYXNzZXRUeXBlLCBtb2RlKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogRGVzaWduZXIgKEVkaXQvUHJldmlldykgU2F2aW5nICYgVG9vbGJhciBNZW51cyBmb3IgJyArIGFzc2V0VHlwZSlcbiAgbGV0IGlzQXBwQ29udHJvbGxlciA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0JykpIHtcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzQXBwQ29udHJvbGxlcilcbiAgICAgIGxldCBkaXNhYmxlRGVzaWduZXJBc3NldCwgYXNzZXROb2RlLCBtZW51SXRlbXNcbiAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0ID0gZnVuY3Rpb24gKGFzc2V0Tm9kZSwgbWVudUl0ZW1zLCBkaXNhYmxlRnVuYykge1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGluZyBEZXNpZ25lciAoRWRpdC9QcmV2aWV3KScpXG4gICAgICAgIGxldCBoZWFwRXZlbnQgPSB7XG4gICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgYXNzZXROYW1lOiAnJyxcbiAgICAgICAgICBhc3NldFR5cGU6IGFzc2V0Tm9kZS5jb21wVHlwZSxcbiAgICAgICAgICBhc3NldElkOiBhc3NldE5vZGUuaWQsXG4gICAgICAgICAgd29ya3NwYWNlSWQ6IGFzc2V0Tm9kZS5hY2Nlc3Nab25lSWQsXG4gICAgICAgICAgd29ya3NwYWNlTmFtZTogJydcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgICAgICAgaGVhcEV2ZW50LmFzc2V0QXJlYSA9ICdFZGl0b3InXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ3ByZXZpZXcnOlxuICAgICAgICAgICAgaGVhcEV2ZW50LmFzc2V0QXJlYSA9ICdQcmV2aWV3ZXInXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBoZWFwRXZlbnQuYXNzZXRBcmVhID0gJ0Rlc2lnbmVyJ1xuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYXBFdmVudC53b3Jrc3BhY2VOYW1lID0gQVBQLmdldFdvcmtzcGFjZU5hbWUoYXNzZXROb2RlLmFjY2Vzc1pvbmVJZClcblxuICAgICAgICBpZiAoYXNzZXROb2RlLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSkge1xuICAgICAgICAgIGhlYXBFdmVudC5uYW1lID0gaGVhcEV2ZW50LndvcmtzcGFjZU5hbWVcbiAgICAgICAgfSBlbHNlIGlmIChhc3NldE5vZGUuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9NeVdvcmtzcGFjZUlkTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgaGVhcEV2ZW50Lm5hbWUgPSBoZWFwRXZlbnQud29ya3NwYWNlTmFtZVxuICAgICAgICAgIGhlYXBFdmVudC51c2VyRm9sZGVyID0gdXNlck5hbWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoZWFwRXZlbnQubmFtZSA9IG1rdG9PdGhlcldvcmtzcGFjZU5hbWVcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NldE5vZGUudGV4dC5zZWFyY2goJy4nKSAhPSAtMSkge1xuICAgICAgICAgIGhlYXBFdmVudC5hc3NldE5hbWUgPSBhc3NldE5vZGUudGV4dC5zcGxpdCgnLicpWzFdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaGVhcEV2ZW50LmFzc2V0TmFtZSA9IGFzc2V0Tm9kZS50ZXh0XG4gICAgICAgIH1cblxuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIGhlYXBFdmVudClcblxuICAgICAgICBpZiAoYXNzZXROb2RlLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMSB8fCB0b2dnbGVTdGF0ZSA9PSAnZmFsc2UnKSB7XG4gICAgICAgICAgaWYgKGRpc2FibGVGdW5jKSB7XG4gICAgICAgICAgICBkaXNhYmxlRnVuYygpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0NC5Db21wb25lbnRRdWVyeS5xdWVyeScpKSB7XG4gICAgICAgICAgICBsZXQgbUl0ZW1zID0gRXh0NC5Db21wb25lbnRRdWVyeS5xdWVyeShtZW51SXRlbXMudG9TdHJpbmcoKSlcblxuICAgICAgICAgICAgaWYgKG1JdGVtcykge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmcgRGVzaWduZXIgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgIGlmIChpdGVtLml0ZW1JZCA9PSAnY3JlYXRlQnV0dG9uJykge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnNldERpc2FibGVkKHRydWUpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGV0IGludGVydmFsUmVmXG4gICAgICBzd2l0Y2ggKGFzc2V0VHlwZSkge1xuICAgICAgICBjYXNlICdsYW5kaW5nUGFnZSc6XG4gICAgICAgICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICAgICAgICBjYXNlICdlZGl0JzpcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogTGFuZGluZyBQYWdlIEVkaXRvcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcbiAgICAgICAgICAgICAgICAgIGxldCBhc3NldCA9IE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZScpLmdldExhbmRpbmdQYWdlKClcbiAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IGFzc2V0LmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWN0aW9ucyBNZW51XG4gICAgICAgICAgICAgICAgICAgICdscEVkaXRvciBtZW51IFthY3Rpb249YXBwcm92ZUFuZENsb3NlXScsIC8vIEFwcHJvdmUgYW5kIENsb3NlXG4gICAgICAgICAgICAgICAgICAgICdscEVkaXRvciBtZW51IFthY3Rpb249ZGlzYWJsZU1vYmlsZVZlcnNpb25dJywgLy8gVHVybiBPZmYgTW9iaWxlIFZlcnNpb25cbiAgICAgICAgICAgICAgICAgICAgJ2xwRWRpdG9yIG1lbnUgW2FjdGlvbj11cGxvYWRJbWFnZV0nLCAvLyBVcGxvYWQgSW1hZ2Ugb3IgRmlsZVxuICAgICAgICAgICAgICAgICAgICAnbHBFZGl0b3IgbWVudSBbYWN0aW9uPWdyYWJJbWFnZXNdJyAvLyBHcmFiIEltYWdlcyBmcm9tIFdlYlxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMsIEFQUC5kaXNhYmxlUHJvcGVydHlQYW5lbFNhdmluZylcbiAgICAgICAgICAgICAgICAgIExJQi5vdmVybGF5TGFuZGluZ1BhZ2UoJ2VkaXQnKVxuICAgICAgICAgICAgICAgICAgTElCLnNhdmVMYW5kaW5nUGFnZUVkaXRzKCdlZGl0JywgYXNzZXQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAncHJldmlldyc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkxhbmRpbmdQYWdlJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTGFuZGluZ1BhZ2UnKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IExhbmRpbmcgUGFnZSBQcmV2aWV3ZXI6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWN0aW9ucyBNZW51XG4gICAgICAgICAgICAgICAgICAgICdsYW5kaW5nUGFnZVByZXZpZXdlciBtZW51IFthY3Rpb249YXBwcm92ZUFuZENsb3NlXScgLy8gQXBwcm92ZSBhbmQgQ2xvc2VcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zKVxuICAgICAgICAgICAgICAgICAgTElCLm92ZXJsYXlMYW5kaW5nUGFnZSgncHJldmlldycpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAndGVtcGxhdGVFZGl0JzpcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubGFuZGluZ1BhZ2VUZW1wbGF0ZS5MYW5kaW5nUGFnZVRlbXBsYXRlJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubGFuZGluZ1BhZ2VUZW1wbGF0ZS5MYW5kaW5nUGFnZVRlbXBsYXRlJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5sYW5kaW5nUGFnZVRlbXBsYXRlLkxhbmRpbmdQYWdlVGVtcGxhdGUnKS5nZXRUZW1wbGF0ZSgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubGFuZGluZ1BhZ2VUZW1wbGF0ZS5MYW5kaW5nUGFnZVRlbXBsYXRlJykuZ2V0VGVtcGxhdGUoKS5nZXQgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5sYW5kaW5nUGFnZVRlbXBsYXRlLkxhbmRpbmdQYWdlVGVtcGxhdGUnKS5nZXRUZW1wbGF0ZSgpLmdldE5vZGVKc29uXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IExhbmRpbmcgUGFnZSBUZW1wbGF0ZSBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBsZXQgYXNzZXQgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubGFuZGluZ1BhZ2VUZW1wbGF0ZS5MYW5kaW5nUGFnZVRlbXBsYXRlJykuZ2V0VGVtcGxhdGUoKVxuICAgICAgICAgICAgICAgICAgaWYgKGFzc2V0LmdldCgnem9uZUlkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gYXNzZXQuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0ge1xuICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IGFzc2V0LmdldCgnbmFtZScpLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbXBUeXBlOiAnTGFuZGluZyBQYWdlIFRlbXBsYXRlJyxcbiAgICAgICAgICAgICAgICAgICAgICBpZDogJ0xUJyArIGFzc2V0LmdldElkKCksXG4gICAgICAgICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiAtMVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIFRvb2xiYXIgTWVudVxuICAgICAgICAgICAgICAgICAgICAndG9vbGJhciBbYWN0aW9uPXVwZ3JhZGVdJywgLy8gTWFrZSBNb2JpbGUgQ29tcGF0aWJsZVxuICAgICAgICAgICAgICAgICAgICAvLyBBY3Rpb25zIE1lbnVcbiAgICAgICAgICAgICAgICAgICAgJ21lbnUgW2FjdGlvbj1zaG93TXVuY2hraW5Ub2dnbGVyXScsIC8vIERpc2FibGUgTXVuY2hraW4gVHJhY2tpbmdcbiAgICAgICAgICAgICAgICAgICAgJ21lbnUgW2FjdGlvbj1hcHByb3ZlXScgLy8gQXBwcm92ZSBhbmQgQ2xvc2VcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zLCBBUFAuZGlzYWJsZVNhdmluZylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICd0ZW1wbGF0ZVByZXZpZXcnOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5MYW5kaW5nUGFnZVRlbXBsYXRlJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTGFuZGluZ1BhZ2VUZW1wbGF0ZScpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTGFuZGluZ1BhZ2VUZW1wbGF0ZScpLmdldFRlbXBsYXRlKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5MYW5kaW5nUGFnZVRlbXBsYXRlJykuZ2V0VGVtcGxhdGUoKS5nZXQgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5MYW5kaW5nUGFnZVRlbXBsYXRlJykuZ2V0VGVtcGxhdGUoKS5nZXROb2RlSnNvblxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBMYW5kaW5nIFBhZ2UgVGVtcGxhdGUgUHJldmlld2VyOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgbGV0IGFzc2V0ID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkxhbmRpbmdQYWdlVGVtcGxhdGUnKS5nZXRUZW1wbGF0ZSgpXG4gICAgICAgICAgICAgICAgICBpZiAoYXNzZXQuZ2V0KCd6b25lSWQnKSkge1xuICAgICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBhc3NldC5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGV4dDogYXNzZXQuZ2V0KCduYW1lJyksXG4gICAgICAgICAgICAgICAgICAgICAgY29tcFR5cGU6ICdMYW5kaW5nIFBhZ2UgVGVtcGxhdGUnLFxuICAgICAgICAgICAgICAgICAgICAgIGlkOiAnTFQnICsgYXNzZXQuZ2V0SWQoKSxcbiAgICAgICAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IC0xXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2VtYWlsJzpcbiAgICAgICAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgIGxldCBhc3NldCA9IExJQi5nZXRNa3QzQ3RsckFzc2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicsICdnZXRFbWFpbCcpLFxuICAgICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBhc3NldC5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IEVtYWlsIEVkaXRvcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWN0aW9ucyBNZW51XG4gICAgICAgICAgICAgICAgICAgICdlbWFpbEVkaXRvcjIgbWVudSBbYWN0aW9uPWFwcHJvdmVFbWFpbF0nLCAvLyBBcHByb3ZlIGFuZCBDbG9zZVxuICAgICAgICAgICAgICAgICAgICAnZW1haWxFZGl0b3IyIG1lbnUgW2FjdGlvbj1zZW5kVGVzdEVtYWlsXScsIC8vIFNlbmQgU2FtcGxlXG4gICAgICAgICAgICAgICAgICAgICdlbWFpbEVkaXRvcjIgbWVudSBbYWN0aW9uPXVwbG9hZEltYWdlXScsIC8vIFVwbG9hZCBJbWFnZSBvciBGaWxlXG4gICAgICAgICAgICAgICAgICAgICdlbWFpbEVkaXRvcjIgbWVudSBbYWN0aW9uPWdyYWJJbWFnZXNdJywgLy8gR3JhYiBJbWFnZXMgZnJvbSBXZWJcbiAgICAgICAgICAgICAgICAgICAgJ2VtYWlsRWRpdG9yMiBtZW51IFthY3Rpb249c2F2ZUFzVGVtcGxhdGVdJyAvLyBTYXZlIGFzIFRlbXBsYXRlXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcylcbiAgICAgICAgICAgICAgICAgIExJQi5vdmVybGF5RW1haWwoJ2VkaXQnKVxuICAgICAgICAgICAgICAgICAgTElCLnNhdmVFbWFpbEVkaXRzKCdlZGl0JywgYXNzZXQpXG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWVtcHR5XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgICAgICAvLyBpZiAoXG4gICAgICAgICAgICAgICAgLy8gICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgIC8vICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpICYmXG4gICAgICAgICAgICAgICAgLy8gICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKSAmJlxuICAgICAgICAgICAgICAgIC8vICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLmdldEVtYWlsKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgIC8vICkge1xuICAgICAgICAgICAgICAgIC8vICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBFbWFpbCBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgIC8vICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgLy8gICBsZXQgYXNzZXQgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKVxuICAgICAgICAgICAgICAgIC8vICAgYXNzZXROb2RlID0gYXNzZXQuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgIC8vICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICAgICAgIC8vICAgICAvLyBBY3Rpb25zIE1lbnVcbiAgICAgICAgICAgICAgICAvLyAgICAgJ2VtYWlsRWRpdG9yMiBtZW51IFthY3Rpb249YXBwcm92ZUVtYWlsXScsIC8vIEFwcHJvdmUgYW5kIENsb3NlXG4gICAgICAgICAgICAgICAgLy8gICAgICdlbWFpbEVkaXRvcjIgbWVudSBbYWN0aW9uPXNlbmRUZXN0RW1haWxdJywgLy8gU2VuZCBTYW1wbGVcbiAgICAgICAgICAgICAgICAvLyAgICAgJ2VtYWlsRWRpdG9yMiBtZW51IFthY3Rpb249dXBsb2FkSW1hZ2VdJywgLy8gVXBsb2FkIEltYWdlIG9yIEZpbGVcbiAgICAgICAgICAgICAgICAvLyAgICAgJ2VtYWlsRWRpdG9yMiBtZW51IFthY3Rpb249Z3JhYkltYWdlc10nLCAvLyBHcmFiIEltYWdlcyBmcm9tIFdlYlxuICAgICAgICAgICAgICAgIC8vICAgICAnZW1haWxFZGl0b3IyIG1lbnUgW2FjdGlvbj1zYXZlQXNUZW1wbGF0ZV0nIC8vIFNhdmUgYXMgVGVtcGxhdGVcbiAgICAgICAgICAgICAgICAvLyAgIF1cbiAgICAgICAgICAgICAgICAvLyAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zKVxuICAgICAgICAgICAgICAgIC8vICAgTElCLm92ZXJsYXlFbWFpbCgnZWRpdCcpXG4gICAgICAgICAgICAgICAgLy8gICBMSUIuc2F2ZUVtYWlsRWRpdHMoJ2VkaXQnLCBhc3NldClcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdwcmV2aWV3JzpcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLlByZXZpZXcnKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuUHJldmlldycpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLlByZXZpZXcnKS5nZXRFbWFpbCgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLlByZXZpZXcnKS5nZXRFbWFpbCgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogRW1haWwgUHJldmlld2VyOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5QcmV2aWV3JykuZ2V0RW1haWwoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIFRvb2xiYXIgTWVudVxuICAgICAgICAgICAgICAgICAgICAnZW1haWwyRWRpdG9yUHJldmlld1Rvb2xiYXIgW2FjdGlvbj1zZW5kU2FtcGxlRW1haWxdJywgLy8gU2VuZCBTYW1wbGVcbiAgICAgICAgICAgICAgICAgICAgLy8gQWN0aW9ucyBNZW51XG4gICAgICAgICAgICAgICAgICAgICdlbWFpbFByZXZpZXcgbWVudSBbYWN0aW9uPWFwcHJvdmVFbWFpbF0nLCAvLyBBcHByb3ZlIGFuZCBDbG9zZVxuICAgICAgICAgICAgICAgICAgICAnZW1haWxQcmV2aWV3IG1lbnUgW2FjdGlvbj1zZW5kU2FtcGxlRW1haWxdJyAvLyBTZW5kIFNhbXBsZVxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMpXG4gICAgICAgICAgICAgICAgICBMSUIub3ZlcmxheUVtYWlsKCdwcmV2aWV3JylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICd0ZW1wbGF0ZUVkaXQnOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxUZW1wbGF0ZScpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbFRlbXBsYXRlJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxUZW1wbGF0ZScpLmdldFRlbXBsYXRlKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxUZW1wbGF0ZScpLmdldFRlbXBsYXRlKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBFbWFpbCBUZW1wbGF0ZSBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBsZXQgYXNzZXQgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsVGVtcGxhdGUnKS5nZXRUZW1wbGF0ZSgpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBhc3NldC5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIEFjdGlvbnMgTWVudVxuICAgICAgICAgICAgICAgICAgICAnbWVudSBbYWN0aW9uPWFwcHJvdmVUZW1wbGF0ZV0nLCAvLyBBcHByb3ZlIGFuZCBDbG9zZVxuICAgICAgICAgICAgICAgICAgICAnbWVudSBbYWN0aW9uPXNlbmRTYW1wbGVdJywgLy8gU2VuZCBTYW1wbGUgRW1haWxcbiAgICAgICAgICAgICAgICAgICAgJ21lbnUgW2FjdGlvbj1pbmxpbmVDc3NdJyAvLyBJbmxpbmUgQ1NTXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcywgQVBQLmRpc2FibGVTYXZpbmcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAndGVtcGxhdGVQaWNrZXInOlxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxUZW1wbGF0ZVBpY2tlcicpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbFRlbXBsYXRlUGlja2VyJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxUZW1wbGF0ZVBpY2tlcicpLmdldEVtYWlsVGVtcGxhdGVQaWNrZXIoKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbFRlbXBsYXRlUGlja2VyJykuZ2V0RW1haWxUZW1wbGF0ZVBpY2tlcigpLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBFbWFpbCBUZW1wbGF0ZSBQaWNrZXI6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBsZXQgYXNzZXQgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsVGVtcGxhdGVQaWNrZXInKS5nZXRFbWFpbFRlbXBsYXRlUGlja2VyKClcbiAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0VtYWlsIFRlbXBsYXRlIFBpY2tlcicsXG4gICAgICAgICAgICAgICAgICAgIGNvbXBUeXBlOiAnRW1haWwgVGVtcGxhdGUgUGlja2VyJyxcbiAgICAgICAgICAgICAgICAgICAgaWQ6ICdFTScsXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogcGFyc2VJbnQoYXNzZXQuYWNjZXNzWm9uZUlkKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICAgICAgICAgICAvLyBUb29sYmFyIE1lbnVcbiAgICAgICAgICAgICAgICAgICAgJ3Rvb2xiYXIgW2l0ZW1JZD1jcmVhdGVCdXR0b25dJyAvLyBDcmVhdGVcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnZm9ybSc6XG4gICAgICAgICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICAgICAgICBjYXNlICdlZGl0JzpcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuRm9ybScpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkZvcm0nKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkZvcm0nKS5nZXRGb3JtKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5Gb3JtJykuZ2V0Rm9ybSgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogRm9ybSBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuRm9ybScpLmdldEZvcm0oKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIE5hdmlnYXRpb24gTWVudVxuICAgICAgICAgICAgICAgICAgICAnZm9ybUVkaXRvciB0b29sYmFyIFthY3Rpb249YXBwcm92ZUFuZENsb3NlXScsIC8vIEFwcHJvdmUgJiBDbG9zZVxuICAgICAgICAgICAgICAgICAgICAnZm9ybUVkaXRvciB0b29sYmFyIFthY3Rpb249ZmluaXNoXScgLy8gRmluaXNoXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcywgQVBQLmRpc2FibGVTYXZpbmcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAncHJldmlldyc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkZvcm0nKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5Gb3JtJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5Gb3JtJykuZ2V0Rm9ybSgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuRm9ybScpLmdldEZvcm0oKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IEZvcm0gUHJldmlld2VyOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkZvcm0nKS5nZXRGb3JtKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW11cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAncHVzaE5vdGlmaWNhdGlvbic6XG4gICAgICAgICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICAgICAgICBjYXNlICdlZGl0JzpcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubW9iaWxlUHVzaE5vdGlmaWNhdGlvbi5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IubW9iaWxlUHVzaE5vdGlmaWNhdGlvbi5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5tb2JpbGVQdXNoTm90aWZpY2F0aW9uLk1vYmlsZVB1c2hOb3RpZmljYXRpb24nKS5nZXRNb2JpbGVQdXNoTm90aWZpY2F0aW9uKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5tb2JpbGVQdXNoTm90aWZpY2F0aW9uLk1vYmlsZVB1c2hOb3RpZmljYXRpb24nKS5nZXRNb2JpbGVQdXNoTm90aWZpY2F0aW9uKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBQdXNoIE5vdGlmaWNhdGlvbiBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG5cbiAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5tb2JpbGVQdXNoTm90aWZpY2F0aW9uLk1vYmlsZVB1c2hOb3RpZmljYXRpb24nKS5nZXRNb2JpbGVQdXNoTm90aWZpY2F0aW9uKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICAgICAgICAgICAvLyBUb29sYmFyIE1lbnVcbiAgICAgICAgICAgICAgICAgICAgJ21vYmlsZVB1c2hOb3RpZmljYXRpb25FZGl0b3IgdG9vbGJhciBbYWN0aW9uPXNlbmREcmFmdFNhbXBsZV0nLCAvLyBTZW5kIFNhbXBsZVxuICAgICAgICAgICAgICAgICAgICAvLyBOYXZpZ2F0aW9uIE1lbnVcbiAgICAgICAgICAgICAgICAgICAgJ21vYmlsZVB1c2hOb3RpZmljYXRpb25FZGl0b3IgdG9vbGJhciBbYWN0aW9uPWZpbmlzaF0nLCAvLyBGaW5pc2hcbiAgICAgICAgICAgICAgICAgICAgJ21vYmlsZVB1c2hOb3RpZmljYXRpb25FZGl0b3IgdG9vbGJhciBbYWN0aW9uPWFwcHJvdmVBbmRDbG9zZV0nIC8vIEFwcHJvdmUgJiBDbG9zZVxuICAgICAgICAgICAgICAgICAgXVxuXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcywgQVBQLmRpc2FibGVTYXZpbmcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAncHJldmlldyc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLk1vYmlsZVB1c2hOb3RpZmljYXRpb24nKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uJykuZ2V0TW9iaWxlUHVzaE5vdGlmaWNhdGlvbigpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuTW9iaWxlUHVzaE5vdGlmaWNhdGlvbicpLmdldE1vYmlsZVB1c2hOb3RpZmljYXRpb24oKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IFB1c2ggTm90aWZpY2F0aW9uIFByZXZpZXdlcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcbiAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5Nb2JpbGVQdXNoTm90aWZpY2F0aW9uJykuZ2V0TW9iaWxlUHVzaE5vdGlmaWNhdGlvbigpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gVG9vbGJhciBNZW51XG4gICAgICAgICAgICAgICAgICAgICdtb2JpbGVQdXNoTm90aWZpY2F0aW9uUHJldmlld2VyIHRvb2xiYXIgW2FjdGlvbj1zZW5kRHJhZnRTYW1wbGVdJyAvLyBTZW5kIFNhbXBsZVxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdpbkFwcE1lc3NhZ2UnOlxuICAgICAgICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmluQXBwTWVzc2FnZS5JbkFwcE1lc3NhZ2UnKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5pbkFwcE1lc3NhZ2UuSW5BcHBNZXNzYWdlJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5pbkFwcE1lc3NhZ2UuSW5BcHBNZXNzYWdlJykuZ2V0SW5BcHBNZXNzYWdlKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5pbkFwcE1lc3NhZ2UuSW5BcHBNZXNzYWdlJykuZ2V0SW5BcHBNZXNzYWdlKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBJbi1BcHAgTWVzc2FnZSBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuaW5BcHBNZXNzYWdlLkluQXBwTWVzc2FnZScpLmdldEluQXBwTWVzc2FnZSgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gVG9vbGJhciBNZW51XG4gICAgICAgICAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VFZGl0b3IgdG9vbGJhciBbYWN0aW9uPXNlbmRTYW1wbGVdJywgLy8gU2VuZCBTYW1wbGVcbiAgICAgICAgICAgICAgICAgICAgLy8gQWN0aW9ucyBNZW51XG4gICAgICAgICAgICAgICAgICAgICdpbkFwcE1lc3NhZ2VFZGl0b3IgbWVudSBbYWN0aW9uPXNlbmRTYW1wbGVdJywgLy8gU2VuZCBTYW1wbGVcbiAgICAgICAgICAgICAgICAgICAgJ2luQXBwTWVzc2FnZUVkaXRvciBtZW51IFthY3Rpb249YXBwcm92ZUFuZENsb3NlXScgLy8gQXBwcm92ZSAmIENsb3NlXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcywgQVBQLmRpc2FibGVTYXZpbmcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAncHJldmlldyc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkluQXBwTWVzc2FnZScpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLkluQXBwTWVzc2FnZScpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuSW5BcHBNZXNzYWdlJykuZ2V0SW5BcHBNZXNzYWdlKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5JbkFwcE1lc3NhZ2UnKS5nZXRJbkFwcE1lc3NhZ2UoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IEluLUFwcCBNZXNzYWdlIFByZXZpZXdlcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcbiAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5JbkFwcE1lc3NhZ2UnKS5nZXRJbkFwcE1lc3NhZ2UoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIFRvb2xiYXIgTWVudVxuICAgICAgICAgICAgICAgICAgICAnaW5BcHBNZXNzYWdlUHJldmlld2VyIHRvb2xiYXIgW2FjdGlvbj1hcHByb3ZlQW5kQ2xvc2VdJyAvLyBBcHByb3ZlICYgQ2xvc2VcbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ3Ntc01lc3NhZ2UnOlxuICAgICAgICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLlNtc01lc3NhZ2UnKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5TbXNNZXNzYWdlJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5TbXNNZXNzYWdlJykuZ2V0U21zTWVzc2FnZSgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU21zTWVzc2FnZScpLmdldFNtc01lc3NhZ2UoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IFNNUyBNZXNzYWdlIEVkaXRvcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcbiAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5TbXNNZXNzYWdlJykuZ2V0U21zTWVzc2FnZSgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWN0aW9ucyBNZW51XG4gICAgICAgICAgICAgICAgICAgICdzbXNNZXNzYWdlRWRpdG9yIG1lbnUgW2FjdGlvbj1hcHByb3ZlQW5kQ2xvc2VdJyAvLyBBcHByb3ZlIGFuZCBDbG9zZVxuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgZGlzYWJsZURlc2lnbmVyQXNzZXQoYXNzZXROb2RlLCBtZW51SXRlbXMsIEFQUC5kaXNhYmxlU2F2aW5nKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ3ByZXZpZXcnOlxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdzb2NpYWxBcHAnOlxuICAgICAgICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLlNvY2lhbEFwcCcpICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLlNvY2lhbEFwcCcpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU29jaWFsQXBwJykuZ2V0U29jaWFsQXBwKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5Tb2NpYWxBcHAnKS5nZXRTb2NpYWxBcHAoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IFNvY2lhbCBBcHAgRWRpdG9yOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU29jaWFsQXBwJykuZ2V0U29jaWFsQXBwKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICAgICAgICAgICAnc29jaWFsQXBwRWRpdG9yIHRvb2xiYXIgW2FjdGlvbj1hcHByb3ZlQW5kQ2xvc2VdJywgLy8gQXBwcm92ZSBhbmQgQ2xvc2VcbiAgICAgICAgICAgICAgICAgICAgJ3NvY2lhbEFwcEVkaXRvciB0b29sYmFyIFthY3Rpb249ZmluaXNoXScgLy8gRmluaXNoXG4gICAgICAgICAgICAgICAgICBdXG5cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zLCBBUFAuZGlzYWJsZVNhdmluZylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdwcmV2aWV3JzpcbiAgICAgICAgICAgICAgaW50ZXJ2YWxSZWYgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuU29jaWFsQXBwJykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuU29jaWFsQXBwJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5Tb2NpYWxBcHAnKS5nZXRTb2NpYWxBcHAoKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLlNvY2lhbEFwcCcpLmdldFNvY2lhbEFwcCgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogU29jaWFsIEFwcCBQcmV2aWV3ZXI6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuU29jaWFsQXBwJykuZ2V0U29jaWFsQXBwKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW11cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnYWJUZXN0JzpcbiAgICAgICAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IEEvQiBUZXN0IEVkaXRvcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLnRlc3RHcm91cC5UZXN0R3JvdXAnKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci50ZXN0R3JvdXAuVGVzdEdyb3VwJykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci50ZXN0R3JvdXAuVGVzdEdyb3VwJykuZ2V0VGVzdEdyb3VwKCkgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci50ZXN0R3JvdXAuVGVzdEdyb3VwJykuZ2V0VGVzdEdyb3VwKCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBBL0IgVGVzdCBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxSZWYpXG4gICAgICAgICAgICAgICAgICBhc3NldE5vZGUgPSBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IudGVzdEdyb3VwLlRlc3RHcm91cCcpLmdldFRlc3RHcm91cCgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ3Rlc3RHcm91cEVkaXRvciB0b29sYmFyIFthY3Rpb249ZmluaXNoXScgLy8gRmluaXNoXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICBkaXNhYmxlRGVzaWduZXJBc3NldChhc3NldE5vZGUsIG1lbnVJdGVtcywgQVBQLmRpc2FibGVTYXZpbmcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAncHJldmlldyc6XG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ3NuaXBwZXQnOlxuICAgICAgICAgIHN3aXRjaCAobW9kZSkge1xuICAgICAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogU25pcHBldCBFZGl0b3I6IFNhdmluZyAmIFRvb2xiYXIgTWVudXMnKVxuICAgICAgICAgICAgICBpbnRlcnZhbFJlZiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5TbmlwcGV0JykgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU25pcHBldCcpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuU25pcHBldCcpLmdldFNuaXBwZXQoKSAmJlxuICAgICAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLlNuaXBwZXQnKS5nZXRTbmlwcGV0KCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBTbmlwcGV0IEVkaXRvcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbFJlZilcbiAgICAgICAgICAgICAgICAgIGFzc2V0Tm9kZSA9IE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5TbmlwcGV0JykuZ2V0U25pcHBldCgpLmdldE5vZGVKc29uKClcbiAgICAgICAgICAgICAgICAgIG1lbnVJdGVtcyA9IFtdXG5cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zLCBBUFAuZGlzYWJsZVNhdmluZylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIDApXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlICdwcmV2aWV3JzpcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBTbmlwcGV0IFByZXZpZXdlcjogU2F2aW5nICYgVG9vbGJhciBNZW51cycpXG4gICAgICAgICAgICAgIGludGVydmFsUmVmID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLlNuaXBwZXQnKSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5TbmlwcGV0JykgJiZcbiAgICAgICAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLnByZXZpZXdlci5TbmlwcGV0JykuZ2V0U25pcHBldCgpICYmXG4gICAgICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5wcmV2aWV3ZXIuU25pcHBldCcpLmdldFNuaXBwZXQoKS5nZXROb2RlSnNvbigpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IFNuaXBwZXQgUHJldmlld2VyOiBTYXZpbmcgJiBUb29sYmFyIE1lbnVzJylcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsUmVmKVxuICAgICAgICAgICAgICAgICAgYXNzZXROb2RlID0gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIucHJldmlld2VyLlNuaXBwZXQnKS5nZXRTbmlwcGV0KCkuZ2V0Tm9kZUpzb24oKVxuICAgICAgICAgICAgICAgICAgbWVudUl0ZW1zID0gW11cbiAgICAgICAgICAgICAgICAgIGRpc2FibGVEZXNpZ25lckFzc2V0KGFzc2V0Tm9kZSwgbWVudUl0ZW1zKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSwgMClcbiAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gIH0sIDApXG59XG5cbi8vICBUaGlzIGZ1bmN0aW9uIGRpc2FibGVzIHRoZSBTYXZlLCBDcmVhdGUsIEFkZCAuLi4gYnV0dG9ucyBpbiBGb3JtIHdpbmRvd3MuXG4vLyAgSXQgY2FuIGJlIHVzZWQgdG8gZGlzYWJsZSBhbnkgZ2VuZXJpYyBGb3JtIHNhdmUgd2luZG93LlxuQVBQLmRpc2FibGVGb3JtU2F2ZUJ1dHRvbnMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogRm9ybSBXaW5kb3cgU2F2ZSBCdXR0b25zJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0NC5Db21wb25lbnQucHJvdG90eXBlLnNob3cnKSkge1xuICAgIEV4dDQuQ29tcG9uZW50LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKGFuaW1hdGVUYXJnZXQsIGNiLCBzY29wZSkge1xuICAgICAgbGV0IG1lID0gdGhpcyxcbiAgICAgICAgbWVudUl0ZW1zLFxuICAgICAgICBtSXRlbXMsXG4gICAgICAgIHRvRGlzYWJsZVxuXG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnY3JlYXRlTmFtZWRBY2NvdW50Rm9ybScgfHwgLy9BQk0gPiBOYW1lZCBBY2NvdW50cyA+IE5ldyBOYW1lZCBBY2NvdW50XG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnYWRkVG9BY2NvdW50TGlzdEZvcm0nIHx8IC8vQUJNID4gTmFtZWQgQWNjb3VudHMgPiBBZGQgVG8gQWNjb3VudCBMaXN0XG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnYXNzaWduVGVhbU1lbWJlckZvcm0nIHx8IC8vQUJNID4gTmFtZWQgQWNjb3VudHMgPiBBc3NpZ24gQWNjb3VudCBNZW1iZXJcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdjcmVhdGVBY2NvdW50TGlzdEZvcm0nIHx8IC8vQUJNID4gQWNjb3VudCBMaXN0cyA+IENyZWF0ZSBOZXcvUmVuYW1lIEFjY291bnQgTGlzdFxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkQnJpZGdlRm9ybScgfHwgLy9HbG9iYWwgPiBMaXN0ICYgU21hcnQgTGlzdCA+IEFjdGlvbnMgPiBTZW5kIHZpYSBBZCBCcmlkZ2VcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdzbWFydGxpc3RSZXBvcnRTdWJzY3JpcHRpb25Gb3JtJyB8fCAvL0dsb2JhbCA+IExpc3QgJiBTbWFydCBMaXN0ID4gQWN0aW9ucyA+IE5ldyBTbWFydCBMaXN0IFN1YnNjcmlwdGlvblxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FuYWx5dGljc1JlcG9ydFN1YnNjcmlwdGlvbkZvcm0nIHx8IC8vR2xvYmFsID4gUmVwb3J0ID4gTmV3IEFjdGlvbnMgJiBTdWJzY3JpcHRpb25zID4gTmV3IFJlcG9ydCBTdWJzY3JpcHRpb25cbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdlbWFpbEJsYXN0Q29tbXVuaWNhdGlvbkxpbWl0Rm9ybScgfHwgLy9NYXJrZXRpbmcgQWN0aXZpdGllcyA+IFByb2dyYW0gPiBTZXR1cCA+IEVkaXQgQ29tbXVuaWNhdGlvbiBMaW1pdCBTZXR0aW5nc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2NhbGVuZGFyRW50cnlSZXNjaGVkdWxlRm9ybScgfHwgLy9NYXJrZXRpbmcgQWN0aXZpdGllcyA+IEV2ZW50ID4gQWN0aW9ucyA+IFJlc2NoZWR1bGUgRW50cmllc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ3Byb2dyYW1PcGVyYXRpb25hbE1vZGVGb3JtJyB8fCAvL01hcmtldGluZyBBY3Rpdml0aWVzID4gUHJvZ3JhbSA+IFNldHVwID4gRWRpdCBBbmFseXRpY3MgQmVoYXZpb3IgU2V0dGluZ3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICd0cmFja0NhZGVuY2VGb3JtJyB8fCAvL01hcmtldGluZyBBY3Rpdml0aWVzID4gTnVydHVyZSBQcm9ncmFtID4gU3RyZWFtcyA+IFNldCBTdHJlYW0gQ2FkZW5jZVxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2ZpbGVVcGxvYWRGb3JtJyB8fCAvL0Rlc2lnbiBTdHVkaW8gPiBJbWFnZXMgJiBGaWxlcyA+IEdyYWIgSW1hZ2VzIGZyb20gV2ViXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnbGVhZENvbXBvbmVudEZvcm0nIHx8IC8vRGF0YWJhc2UgPiBBTEwgPiBOZXcgPiBOZXcgUGVyc29uXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnYW5hbHl0aWNzUmVwb3J0U3Vic2NyaXB0aW9uRm9ybScgfHwgLy9BbmFseXRpY3MgPiBBbmFseXplciAmIFJlcG9ydCA+IE5ldyBSZXBvcnQgU3Vic2NyaXB0aW9uXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnbHBNZXRhRGF0YUZvcm0nIHx8IC8vRGVzaWduZXIgPiBMYW5kaW5nIFBhZ2UgRWRpdG9yID4gRWRpdCBQYWdlIE1ldGEgVGFnc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2xwRm9ybVNldHRpbmdzJyB8fCAvL0Rlc2lnbmVyID4gTGFuZGluZyBQYWdlIEVkaXRvciA+IEVkaXQgRm9ybSBTZXR0aW5nc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2VtYWlsU2V0dGluZ3NGb3JtJyB8fCAvL0Rlc2lnbmVyID4gRW1haWwgRWRpdG9yID4gRWRpdCBTZXR0aW5nc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluVXNlckludml0ZVdpemFyZCcgfHwgLy9BZG1pbiA+IFVzZXIgJiBSb2xlcyA+IFVzZXJzID4gSW52aXRlIE5ldyBVc2VyXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnYWRtaW5FZGl0TGljZW5zZXNGb3JtJyB8fCAvL0FkbWluID4gVXNlciAmIFJvbGVzID4gVXNlcnMgPiBJc3N1ZSBMaWNlbnNlXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnYWRtaW5TYWxlc1VzZXJJbnZpdGVXaXphcmQnIHx8IC8vQWRtaW4gPiBVc2VyICYgUm9sZXMgPiBTYWxlcyBVc2VycyA+IEludml0ZSBOZXcgU2FsZXMgVXNlclxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluRWRpdExpY2Vuc2VzRm9ybScgfHwgLy9BZG1pbiA+IFVzZXIgJiBSb2xlcyA+IFNhbGVzIFVzZXJzID4gTWFuYWdlIExpY2Vuc2UgPiBBY2NvdW50IEluc2lnaHRcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pblN1YnNjcmlwdGlvbkluZm9ybWF0aW9uRm9ybScgfHwgLy9BZG1pbiA+IE15IEFjY291bnQgPiBTdWJjcmlwdGlvbiBJbmZvcm1hdGlvblxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluQWNjb3VudFNldHRpbmdzRm9ybScgfHwgLy9BZG1pbiA+IE15IEFjY291bnQgPiBBY2NvdW50IFNldHRpbmdzXG4gICAgICAgIC8vfHwgdGhpcy5nZXRYVHlwZSgpID09IFwibG9jYWxlUGlja2VyXCIgLy9BZG1pbiA+IE15IEFjY291bnQvTG9jYXRpb24gPiBMb2NhdGlvbiBTZXR0aW5nc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2RlbGV0ZVpvbmVGb3JtJyB8fCAvL0FkbWluID4gV29ya3NwYWNlcyAmIFBhcnRpdGlvbnMgPiBXb3Jrc3BhY2VzID4gRGVsZXRlIFdvcmtzcGFjZVxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluVGlueU1jZVNldHRpbmdGb3JtJyB8fCAvL0FkbWluID4gKkVtYWlsID4gRW1haWwgPiBFZGl0IFRleHQgRWRpdG9yIFNldHRpbmdzXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnZW1haWxFZGl0b3JTZXR0aW5nc0Zvcm0nIHx8IC8vQWRtaW4gPiBFbWFpbCA+IEVtYWlsID4gRWRpdCBFbWFpbCBFZGl0b3IgU2V0dGluZ3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdlbWFpbEFkZE11bHRpcGxlRG9tYWluRm9ybScgfHwgLy9BZG1pbiA+IEVtYWlsID4gRW1haWwgPiBBZGQvRWRpdCBCcmFuZGluZyBEb21haW5zXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnYWRtaW5BZGREb21haW5Gb3JtJyB8fCAvL0FkbWluID4gRW1haWwgPiBTUEYvREtJTSA+IEFkZCBEb21haW5cbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pblNjb3JlU2V0dGluZ3NGb3JtJyB8fCAvL0FkbWluID4gQUJNID4gQWNjb3VudCBTY29yZSBTZXR0aW5nc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluQ3JtRmllbGRTZXR0aW5nc0Zvcm0nIHx8IC8vQWRtaW4gPiBBQk0gPiBDUk0gTWFwcGluZ1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluQWNjb3VudFRlYW1Gb3JtJyB8fCAvL0FkbWluID4gQUJNID4gQWNjb3VudCBUZWFtIFNldHRpbmdzXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnYWRtaW5BY2NvdW50SW5zaWdodFNldHRpbmdzRm9ybScgfHwgLy9BZG1pbiA+IEFCTSA+IEFCTSBTYWxlcyA+IEFjY291bnQgSW5zaWdodCBTZXR0aW5nc1xuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluQWJtUmVwb3J0U2V0dGluZ3NGb3JtJyB8fCAvL0FkbWluID4gQUJNID4gV2Vla2x5IFJlcG9ydFxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluRmllbGRIdG1sRW5jb2RlRm9ybScgfHwgLy9BZG1pbiA+IEZpZWxkIE1hbmFnZW1lbnQgPiBGaWVsZCBNYW5hZ2VtZW50ID4gSFRNTCBFbmNvZGUgU2V0dGluZ3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdta3RvY3VzdG9tYWN0aXZpdHlBY3Rpdml0eVR5cGVGb3JtJyB8fCAvL0FkbWluID4gTWFya2V0byBDdXN0b20gQWN0aXZpdGllcyA+IE1hcmtldG8gQ3VzdG9tIEFjdGl2aXRpZXMgPiBOZXcgQ3VzdG9tIEFjdGl2aXR5XG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnbWt0b2N1c3RvbWFjdGl2aXR5QWN0aXZpdHlUeXBlRWRpdEZvcm0nIHx8IC8vQWRtaW4gPiBNYXJrZXRvIEN1c3RvbSBBY3Rpdml0aWVzID4gTWFya2V0byBDdXN0b20gQWN0aXZpdGllcyA+IEVkaXQgQWN0aXZpdHlcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdta3RvY3VzdG9tYWN0aXZpdHlBY3Rpdml0eVR5cGVGb3JtU3RlcFRocmVlJyB8fCAvL0FkbWluID4gTWFya2V0byBDdXN0b20gQWN0aXZpdGllcyA+IEZpZWxkcyA+IE5ldy9FZGl0IEZpZWxkXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnbWt0b2N1c3RvbW9iamVjdE9iamVjdEZvcm0nIHx8IC8vQWRtaW4gPiBNYXJrZXRvIEN1c3RvbSBPYmplY3RzID4gTWFya2V0byBDdXN0b20gT2JqZWN0cyA+IE5ldy9FZGl0IEN1c3RvbSBPYmplY3RcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdta3RvY3VzdG9tb2JqZWN0RmllbGRGb3JtJyB8fCAvL0FkbWluID4gTWFya2V0byBDdXN0b20gT2JqZWN0cyA+IEZpZWxkcyA+IE5ldy9FZGl0IEZpZWxkXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAnY3JtRWRpdENyZWRlbnRpYWxzRm9ybScgfHwgLy9BZG1pbiA+IE1pY3Jvc29mdCBEeW5hbWljcyA+IENyZWRlbnRpYWxzID4gRWRpdFxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2FkbWluU3BlY2lmeVBsdWdpbkNvbnRhY3RGb3JtJyB8fCAvL0FkbWluID4gU2FsZXMgSW5zaWdodCA+IEVtYWlsIEFkZC1pbiA+IFNwZWNpZnkgUGx1Z2luIENvbnRhY3RcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICd3aWxkY2FyZFJlZGlyZWN0Rm9ybScgfHwgLy9BZG1pbiA+IExhbmRpbmcgUGFnZXMgPiBOZXcgV2lsZGNhcmQgUmVkaXJlY3RcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdta3Rvd3NFZGl0SXBSZXN0cmljdGlvbkZvcm0nIHx8IC8vQWRtaW4gPiBXZWIgU2VydmljZXMgPiBJUCBSZXN0cmljdGlvbnNcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdsYXVuY2hwb2ludFNlcnZpY2VJbnRlZ3JhdGlvblNldHRpbmdzRm9ybScgfHwgLy9BZG1pbiA+IExhdW5jaFBvaW50ID4gSW5zdGFsbGVkIFNlcnZpY2VzID4gRWRpdCBTZXJ2aWNlXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAndmVzcGFBcHBGb3JtJyB8fCAvL0FkbWluID4gTW9iaWxlIEFwcHMgJiBEZXZpY2VzID4gTW9iaWxlIEFwcHMgPiBOZXcvRWRpdCBNb2JpbGUgQXBwXG4gICAgICAgIHRoaXMuZ2V0WFR5cGUoKSA9PSAndmVzcGFTZW5kRm9ybScgfHwgLy9BZG1pbiA+IE1vYmlsZSBBcHBzICYgRGV2aWNlcyA+IE1vYmlsZSBBcHBzID4gU2VuZCBUbyBEZXZlbG9wZXJcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICd2ZXNwYUNvbmZpZ3VyZVB1c2hBY2Nlc3NGb3JtJyB8fCAvL0FkbWluID4gTW9iaWxlIEFwcHMgJiBEZXZpY2VzID4gTW9iaWxlIEFwcHMgPiBDb25maWd1cmUgUHVzaCBBY2Nlc3NcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICd2ZXNwYU5ld0RldmljZUZvcm0nIHx8IC8vQWRtaW4gPiBNb2JpbGUgQXBwcyAmIERldmljZXMgPiBUZXN0IERldmljZXMgPiBOZXcgVGVzdCBEZXZpY2VcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdhZG1pblRhZ3NBZGRDYWxlbmRhckVudHJ5VHlwZUZvcm0nIHx8IC8vQWRtaW4gPiBUYWdzID4gQ2FsZW5kYXIgRW50cnkgVHlwZXMgPiBOZXcgRW50cnkgVHlwZVxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2ZlYXR1cmVTd2l0Y2hGb3JtJyAvL0FkbWluID4gRmVhdHVyZSBNYW5hZ2VyID4gRWRpdCBGZWF0dXJlXG4gICAgICApIHtcbiAgICAgICAgbWVudUl0ZW1zID0gW1xuICAgICAgICAgICdbYWN0aW9uPXN1Ym1pdF0nLCAvL0NyZWF0ZSwgQWRkLCBTYXZlXG4gICAgICAgICAgJ1thY3Rpb249aW1wb3J0XScgLy9JbXBvcnRcbiAgICAgICAgXVxuICAgICAgICBtSXRlbXMgPSB0aGlzLnF1ZXJ5KG1lbnVJdGVtcy50b1N0cmluZygpKVxuICAgICAgICB0b0Rpc2FibGUgPSB0cnVlXG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdENhbnZhcy5nZXRBY3RpdmVUYWInKSAmJlxuICAgICAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkgJiZcbiAgICAgICAgdGhpcy5nZXRYVHlwZSgpID09ICdudXJ0dXJlVHJhY2tGb3JtJyAmJiAvL01hcmtldGluZyBBY3Rpdml0aWVzID4gTnVydHVyZSBQcm9ncmFtID4gU3RyZWFtcyA+IEVkaXQgTmFtZVxuICAgICAgICB0aGlzLmdldFhUeXBlKCkgPT0gJ2luQXBwTWVzc2FnZUFzc2V0Rm9ybScgLy9NYXJrZXRpbmcgQWN0aXZpdGllcyA+IE1vYmlsZSBJbi1BcHAgUHJvZ3JhbSA+IENvbnRyb2wgUGFuZWwgPiBOZXcgSW4tQXBwIE1lc3NhZ2VcbiAgICAgICkge1xuICAgICAgICBtZW51SXRlbXMgPSBbXG4gICAgICAgICAgJ1thY3Rpb249c3VibWl0XScgLy9DcmVhdGUsIEFkZCwgU2F2ZVxuICAgICAgICBdXG4gICAgICAgIG1JdGVtcyA9IHRoaXMucXVlcnkobWVudUl0ZW1zLnRvU3RyaW5nKCkpXG4gICAgICAgIHRvRGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ2J1dHRvbicsIG51bGwsIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSwgbnVsbClcbiAgICAgIH1cblxuICAgICAgaWYgKHRvRGlzYWJsZSAmJiBtSXRlbXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIEZvcm0gV2luZG93IFNhdmUgQnV0dG9ucycpXG4gICAgICAgIG1JdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIGl0ZW0uc2V0RGlzYWJsZWQodG9EaXNhYmxlKVxuXG4gICAgICAgICAgICBpZiAobWUuZ2V0WFR5cGUoKSA9PSAnZW1haWxBZGRNdWx0aXBsZURvbWFpbkZvcm0nKSB7XG4gICAgICAgICAgICAgIGl0ZW0uc3RheURpc2FibGVkID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZS5nZXRYVHlwZSgpID09ICdhZG1pbkVkaXRMaWNlbnNlc0Zvcm0nKSB7XG4gICAgICAgICAgICAgIGl0ZW0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIGxldCB7cmVuZGVyZWR9ID0gbWVcbiAgICAgIGlmIChyZW5kZXJlZCAmJiBtZS5pc1Zpc2libGUoKSkge1xuICAgICAgICBpZiAobWUudG9Gcm9udE9uU2hvdyAmJiBtZS5mbG9hdGluZykge1xuICAgICAgICAgIG1lLnRvRnJvbnQoKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobWUuZmlyZUV2ZW50KCdiZWZvcmVzaG93JywgbWUpICE9PSBmYWxzZSkge1xuICAgICAgICAgIG1lLmhpZGRlbiA9IGZhbHNlXG4gICAgICAgICAgaWYgKCFyZW5kZXJlZCAmJiAobWUuYXV0b1JlbmRlciB8fCBtZS5mbG9hdGluZykpIHtcbiAgICAgICAgICAgIG1lLmRvQXV0b1JlbmRlcigpXG4gICAgICAgICAgICA7KHtyZW5kZXJlZH0gPSBtZS5yZW5kZXJlZClcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlbmRlcmVkKSB7XG4gICAgICAgICAgICBtZS5iZWZvcmVTaG93KClcbiAgICAgICAgICAgIG1lLm9uU2hvdy5hcHBseShtZSwgYXJndW1lbnRzKVxuICAgICAgICAgICAgbWUuYWZ0ZXJTaG93LmFwcGx5KG1lLCBhcmd1bWVudHMpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1lLm9uU2hvd1ZldG8oKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobWUuc3RheURpc2FibGVkKSB7XG4gICAgICAgIG1lLnNldFZpc2libGUoZmFsc2UpXG4gICAgICB9XG4gICAgICByZXR1cm4gbWVcbiAgICB9XG4gIH1cbn1cblxuLy8gIGRpc2FibGUgdGhlIERlbGV0ZSBidXR0b25zIGluIEZvcm0gd2luZG93cy5cbi8vICBJdCBjYW4gYmUgdXNlZCB0byBkaXNhYmxlIGFueSBnZW5lcmljIEZvcm0gc2F2ZSB3aW5kb3cuXG5BUFAuZGlzYWJsZUZvcm1EZWxldGVCdXR0b25zID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IEZvcm0gV2luZG93IERlbGV0ZSBCdXR0b25zJylcbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0NC53aW5kb3cuTWVzc2FnZUJveC5wcm90b3R5cGUuY29uZmlybURlbGV0ZScpKSB7XG4gICAgRXh0NC53aW5kb3cuTWVzc2FnZUJveC5wcm90b3R5cGUuY29uZmlybURlbGV0ZSA9IGZ1bmN0aW9uIChjZmcsIG1zZywgZm4sIHNjb3BlKSB7XG4gICAgICBsZXQgbWVudUl0ZW1zLCBtSXRlbXMsIHRvRGlzYWJsZVxuXG4gICAgICBpZiAoXG4gICAgICAgIGNmZy50aXRsZSA9PSAnUmVtb3ZlIE5hbWVkIEFjY291bnRzJyAvL0FCTSA+IEFjY291bnQgTGlzdHMgPiBTZWxlY3QgQWNjb3VudFxuICAgICAgKSB7XG4gICAgICAgIG1lbnVJdGVtcyA9IFtcbiAgICAgICAgICAnW2l0ZW1JZD1va10nLCAvL0RlbGV0ZVxuICAgICAgICAgICdbdGV4dD1EZWxldGVdJyAvL0RlbGV0ZVxuICAgICAgICBdXG4gICAgICAgIG1JdGVtcyA9IHRoaXMucXVlcnkobWVudUl0ZW1zLnRvU3RyaW5nKCkpXG4gICAgICAgIHRvRGlzYWJsZSA9IHRydWVcbiAgICAgIH1cblxuICAgICAgaWYgKHRvRGlzYWJsZSAmJiBtSXRlbXMpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIEZvcm0gV2luZG93IERlbGV0ZSBCdXR0b25zJylcbiAgICAgICAgbUl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaXRlbS5zZXREaXNhYmxlZCh0b0Rpc2FibGUpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBpZiAoRXh0NC5pc1N0cmluZyhjZmcpKSB7XG4gICAgICAgIGNmZyA9IHtcbiAgICAgICAgICB0aXRsZTogY2ZnLFxuICAgICAgICAgIG1zZzogbXNnLFxuICAgICAgICAgIGZuOiBmbixcbiAgICAgICAgICBzY29wZTogc2NvcGVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjZmcgPSBFeHQ0LmFwcGx5KFxuICAgICAgICB7XG4gICAgICAgICAgaWNvbjogdGhpcy5JTkZPLFxuICAgICAgICAgIGJ1dHRvbnM6IHRoaXMuT0tDQU5DRUwsXG4gICAgICAgICAgYnV0dG9uVGV4dDoge29rOiBNa3RMYW5nLmdldFN0cignbWVzc2FnZWJveC5EZWxldGUnKX1cbiAgICAgICAgfSxcbiAgICAgICAgY2ZnXG4gICAgICApXG5cbiAgICAgIC8vIFRPRE8tbGVnYWN5XG4gICAgICBpZiAoIU1rdDMuQ29uZmlnLmlzRmVhdHVyZUVuYWJsZWQoJ21rdDNEcycpKSB7XG4gICAgICAgIGNmZy5mbiA9IEV4dDQuRnVuY3Rpb24uYmluZChjZmcuZm4sIGNmZy5zY29wZSB8fCB0aGlzLCBbJ29rJ10pXG4gICAgICAgIHJldHVybiBNa3RNZXNzYWdlLmNvbmZpcm1EZWxldGUoY2ZnLnRpdGxlLCBjZmcubXNnLCBjZmcuZm4sIGNmZy5hbmltYXRlVGFyZ2V0KVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5zaG93KGNmZylcbiAgICB9XG4gIH1cbn1cblxuXG4vLyBUaGlzIGZ1bmN0aW9uIGRpc2FibGVzIHRoZSBTYXZlLCBBcHBseSwgQ2hhbmdlIC4uLiBidXR0b25zIGluIHRoZSBBZG1pbiBTZWN0aW9uLlxuLy8gIEl0IGNhbiBiZSB1c2VkIHRvIGRpc2FibGUgYW55IGdlbmVyaWMgU2F2ZSB3aW5kb3cuXG5BUFAuZGlzYWJsZUhhcm1mdWxTYXZlQnV0dG9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRGlzYWJsaW5nOiBIYXJtZnVsIFNhdmUgQnV0dG9ucycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dC5XaW5kb3cucHJvdG90eXBlLnNob3cnKSkge1xuICAgIEV4dC5XaW5kb3cucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoYW5pbWF0ZVRhcmdldCwgY2IsIHNjb3BlKSB7XG4gICAgICAvLyBEaXNhYmxlIEFMTCBhcmVhcyA+IEFMTCBhc3NldHMgPiBBTEwgU2F2ZSB3aW5kb3dzXG5cbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIHRoaXMgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgIHRoaXMgJiZcbiAgICAgICAgdGhpcy5idXR0b25zICYmXG4gICAgICAgIHRoaXMuYnV0dG9ucy5sZW5ndGggPiAwICYmXG4gICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0Q2FudmFzLmdldEFjdGl2ZVRhYicpICYmXG4gICAgICAgIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKVxuICAgICAgKSB7XG4gICAgICAgIGxldCB0b0Rpc2FibGVcblxuICAgICAgICBpZiAodHlwZW9mIE1rdE1haW5OYXYgIT09ICd1bmRlZmluZWQnICYmIE1rdE1haW5OYXYgJiYgTWt0TWFpbk5hdi5hY3RpdmVOYXYgPT0gJ3RuQ3VzdEFkbWluJyAmJiBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkudGl0bGUpIHtcbiAgICAgICAgICBsZXQgYWN0aXZlVGFiVGl0bGUgPSBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkudGl0bGVcbiAgICAgICAgICAvLyBBZG1pblxuICAgICAgICAgIHN3aXRjaCAoYWN0aXZlVGFiVGl0bGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ0xvZ2luIFNldHRpbmdzJzpcbiAgICAgICAgICAgIC8vIFVzZXJzICYgUm9sZXNcbiAgICAgICAgICAgIGNhc2UgJ1VzZXJzJzpcbiAgICAgICAgICAgIGNhc2UgJ1JvbGVzJzpcbiAgICAgICAgICAgIC8vIFdvcmtzcGFjZXMgJiBQYXJ0aXRpb25zXG4gICAgICAgICAgICBjYXNlICdXb3Jrc3BhY2VzJzpcbiAgICAgICAgICAgIGNhc2UgJ0xlYWQgUGFydGl0aW9ucyc6XG4gICAgICAgICAgICBjYXNlICdQZXJzb24gUGFydGl0aW9ucyc6XG4gICAgICAgICAgICBjYXNlICdMb2NhdGlvbic6XG4gICAgICAgICAgICBjYXNlICdTbWFydCBDYW1wYWlnbic6XG4gICAgICAgICAgICBjYXNlICdDb21tdW5pY2F0aW9uIExpbWl0cyc6XG4gICAgICAgICAgICBjYXNlICdUYWdzJzpcbiAgICAgICAgICAgIGNhc2UgJ0ZpZWxkIE1hbmFnZW1lbnQnOlxuICAgICAgICAgICAgY2FzZSAnU2FsZXNmb3JjZSBPYmplY3RzIFN5bmMnOlxuICAgICAgICAgICAgY2FzZSAnU2FsZXNmb3JjZSc6XG4gICAgICAgICAgICBjYXNlICdNaWNyb3NvZnQgRHluYW1pY3MnOlxuICAgICAgICAgICAgY2FzZSAnRHluYW1pY3MgRW50aXRpZXMgU3luYyc6XG4gICAgICAgICAgICAvLyBTYWxlcyBJbnNpZ2h0XG4gICAgICAgICAgICBjYXNlICdTYWxlcyBJbnNpZ2h0JzpcbiAgICAgICAgICAgIGNhc2UgJ0VtYWlsIEFkZC1pbic6XG4gICAgICAgICAgICAvLyBMYW5kaW5nIFBhZ2VzXG4gICAgICAgICAgICBjYXNlICdMYW5kaW5nIFBhZ2VzJzpcbiAgICAgICAgICAgIGNhc2UgJ1J1bGVzJzpcbiAgICAgICAgICAgIGNhc2UgJ011bmNoa2luJzpcbiAgICAgICAgICAgIC8vIExhdW5jaFBvaW50XG4gICAgICAgICAgICBjYXNlICdJbnN0YWxsZWQgU2VydmljZXMnOlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIGNhc2UgJ1dlYmhvb2tzJzpcbiAgICAgICAgICAgIGNhc2UgJ1NpbmdsZSBTaWduLU9uJzpcbiAgICAgICAgICAgIGNhc2UgJ1JldmVudWUgQ3ljbGUgQW5hbHl0aWNzJzpcbiAgICAgICAgICAgIGNhc2UgJ1RyZWFzdXJlIENoZXN0JzpcbiAgICAgICAgICAgICAgdG9EaXNhYmxlID0gdHJ1ZVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRpdGxlKSB7XG4gICAgICAgICAgc3dpdGNoICh0aGlzLnRpdGxlKSB7XG4gICAgICAgICAgICAvLyBNYXJrZXRpbmcgQWN0aXZpdGllc1xuICAgICAgICAgICAgLy8gUHJvZ3JhbSA+IEFjdGlvbnNcbiAgICAgICAgICAgIGNhc2UgJ1NhbGVzZm9yY2UgQ2FtcGFpZ24gU3luYyc6XG4gICAgICAgICAgICBjYXNlICdFdmVudCBTZXR0aW5ncyc6XG4gICAgICAgICAgICAvLyBQcm9ncmFtID4gU2V0dXBcbiAgICAgICAgICAgIGNhc2UgJ05ldyBSZXBvcnRpbmcnOlxuICAgICAgICAgICAgY2FzZSAnRWRpdCBSZXBvcnRpbmcnOlxuICAgICAgICAgICAgY2FzZSAnTmV3IFZlcnRpY2FsJzpcbiAgICAgICAgICAgIGNhc2UgJ0VkaXQgVmVydGljYWwnOlxuICAgICAgICAgICAgLy8gUHJvZ3JhbSA+IE1lbWJlcnMgJiBMaXN0ID4gQWN0aW9uc1xuICAgICAgICAgICAgY2FzZSAnSW1wb3J0IExpc3QnOlxuICAgICAgICAgICAgLy8gTnVydHVyZSBQcm9ncmFtID4gU2V0dXBcbiAgICAgICAgICAgIGNhc2UgJ1Byb2dyYW0gU3RhdHVzJzpcbiAgICAgICAgICAgIGNhc2UgJ0VkaXQgRXhoYXVzdGVkIENvbnRlbnQgTm90aWZpY2F0aW9uIFNldHRpbmdzJzpcbiAgICAgICAgICAgIC8vIFNtYXJ0IENhbXBhaWduID4gU2NoZWR1bGVcbiAgICAgICAgICAgIGNhc2UgJ0FjdGl2YXRlIFRyaWdnZXJlZCBDYW1wYWlnbic6XG4gICAgICAgICAgICBjYXNlICdTY2hlZHVsZSBSZWN1cnJlbmNlJzpcbiAgICAgICAgICAgIGNhc2UgJ1J1biBPbmNlJzpcbiAgICAgICAgICAgIGNhc2UgJ0VkaXQgUXVhbGlmaWNhdGlvbiBSdWxlcyc6XG4gICAgICAgICAgICAvLyBEYXRhYmFzZVxuICAgICAgICAgICAgLy8gQUxMID4gTmV3XG4gICAgICAgICAgICBjYXNlICdOZXcgRmllbGQgT3JnYW5pemVyJzpcbiAgICAgICAgICAgICAgdG9EaXNhYmxlID0gdHJ1ZVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgLy8gUHJvZ3JhbSA+IEFjdGlvbnNcbiAgICAgICAgICAgIGNhc2UgJ0V2ZW50IFNjaGVkdWxlJzpcbiAgICAgICAgICAgIC8vIFByb2dyYW0gPiBTZXR1cFxuICAgICAgICAgICAgY2FzZSAnRWRpdCBDaGFubmVsJzpcbiAgICAgICAgICAgIGNhc2UgJ05ldyBDb3N0JzpcbiAgICAgICAgICAgIGNhc2UgJ0VkaXQgQ29zdCc6XG4gICAgICAgICAgICAvLyBNYXJrZXRpbmcgQWN0aXZpdGllcyAmIEFuYWx5dGljc1xuICAgICAgICAgICAgLy8gUmVwb3J0XG4gICAgICAgICAgICBjYXNlICdEYXRlIG9mIEFjdGl2aXR5JzpcbiAgICAgICAgICAgIGNhc2UgJ0dyb3VwIGJ5IFNlZ21lbnRhdGlvbnMnOlxuICAgICAgICAgICAgY2FzZSAnR2xvYmFsIFJlcG9ydGluZyc6XG4gICAgICAgICAgICBjYXNlICdFeHBvcnQgUm93cyBBdmFpbGFibGUnOlxuICAgICAgICAgICAgY2FzZSAnRmlsdGVyIGJ5IE1vZGVsJzpcbiAgICAgICAgICAgIGNhc2UgJ0ZpbHRlciBieSBQZXJpb2QgQ29zdCc6XG4gICAgICAgICAgICAvLyBFbWFpbCBQZXJmb3JtYW5jZSBSZXBvcnRcbiAgICAgICAgICAgIGNhc2UgJ1NlbnQgRGF0ZSc6XG4gICAgICAgICAgICBjYXNlICdFbWFpbCBGaWx0ZXInOlxuICAgICAgICAgICAgY2FzZSAnQXJjaGl2ZWQgRW1haWwgRmlsdGVyJzpcbiAgICAgICAgICAgIC8vIEVtYWlsIHZpYSBNU0kgUGVyZm9ybWFuY2UgUmVwb3J0XG4gICAgICAgICAgICBjYXNlICdHcm91cCBFbWFpbHMgYnknOlxuICAgICAgICAgICAgLy8gRW5nYWdlbWVudCBTdHJlYW0gUGVyZm9ybWFuY2UgUmVwb3J0XG4gICAgICAgICAgICBjYXNlICdFbmdhZ2VtZW50IFByb2dyYW0gRW1haWwgRmlsdGVyJzpcbiAgICAgICAgICAgIC8vIFBlb3BsZSBQZXJmb3JtYW5jZSBSZXBvcnRcbiAgICAgICAgICAgIGNhc2UgJ1BlcnNvbiBDcmVhdGVkIEF0JzpcbiAgICAgICAgICAgIGNhc2UgJ0dyb3VwIFBlb3BsZSBieSc6XG4gICAgICAgICAgICBjYXNlICdPcHBvcnR1bml0eSBDb2x1bW5zJzpcbiAgICAgICAgICAgIGNhc2UgJ01hbmFnZSBDdXN0b20gU21hcnQgTGlzdCBDb2x1bW5zJzpcbiAgICAgICAgICAgIC8vIFByb2dyYW0gUGVyZm9ybWFuY2UgUmVwb3J0XG4gICAgICAgICAgICBjYXNlICdQcm9ncmFtIEZpbHRlcic6XG4gICAgICAgICAgICBjYXNlICdBcmNoaXZlZCBQcm9ncmFtIEZpbHRlcic6XG4gICAgICAgICAgICAvLyBXZWIgQWN0aXZpdHkgUmVwb3J0XG4gICAgICAgICAgICBjYXNlICdBY3Rpdml0eSBTb3VyY2UnOlxuICAgICAgICAgICAgLy8gT3BwIEluZmx1ZW5jZSBBbmFseXplciAmIFN1Y2Nlc3MgUGF0aCBBbmFseXplclxuICAgICAgICAgICAgY2FzZSAnVGltZSBGcmFtZSc6XG4gICAgICAgICAgICAvLyBPcHAgSW5mbHVlbmNlIEFuYWx5emVyXG4gICAgICAgICAgICBjYXNlICdTaG93IEludGVyZXN0aW5nIE1vbWVudHMnOlxuICAgICAgICAgICAgICB0b0Rpc2FibGUgPSBBUFAuZXZhbHVhdGVNZW51KCdidXR0b24nLCBudWxsLCBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCksIG51bGwpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMudGl0bGUuc2VhcmNoKC9GaWx0ZXIgYnkgLisvKSAhPSAtMSkge1xuICAgICAgICAgICAgdG9EaXNhYmxlID0gQVBQLmV2YWx1YXRlTWVudSgnYnV0dG9uJywgbnVsbCwgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLCBudWxsKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b0Rpc2FibGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IERpc2FibGUgSGFybWZ1bCBTYXZlIEJ1dHRvbnMnKVxuICAgICAgICAgIGxldCBjdXJyQnV0dG9uXG5cbiAgICAgICAgICBmb3IgKGxldCBpaSA9IHRoaXMuYnV0dG9ucy5sZW5ndGggLSAxOyBpaSA+PSAwOyBpaS0tKSB7XG4gICAgICAgICAgICBjdXJyQnV0dG9uID0gdGhpcy5idXR0b25zW2lpXVxuICAgICAgICAgICAgaWYgKGN1cnJCdXR0b24uY2xzID09ICdta3RCdXR0b25Qb3NpdGl2ZScgfHwgY3VyckJ1dHRvbi5pY29uQ2xzID09ICdta2lPaycpIHtcbiAgICAgICAgICAgICAgY3VyckJ1dHRvbi5zZXREaXNhYmxlZCh0cnVlKVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMucmVuZGVyZWQpIHtcbiAgICAgICAgdGhpcy5yZW5kZXIoRXh0LmdldEJvZHkoKSlcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmhpZGRlbiA9PT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy50b0Zyb250KClcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmZpcmVFdmVudCgnYmVmb3Jlc2hvdycsIHRoaXMpID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgfVxuICAgICAgaWYgKGNiKSB7XG4gICAgICAgIHRoaXMub24oJ3Nob3cnLCBjYiwgc2NvcGUsIHtzaW5nbGU6IHRydWV9KVxuICAgICAgfVxuICAgICAgdGhpcy5oaWRkZW4gPSBmYWxzZVxuICAgICAgaWYgKEV4dC5pc0RlZmluZWQoYW5pbWF0ZVRhcmdldCkpIHtcbiAgICAgICAgdGhpcy5zZXRBbmltYXRlVGFyZ2V0KGFuaW1hdGVUYXJnZXQpXG4gICAgICB9XG4gICAgICB0aGlzLmJlZm9yZVNob3coKVxuICAgICAgaWYgKHRoaXMuYW5pbWF0ZVRhcmdldCkge1xuICAgICAgICB0aGlzLmFuaW1TaG93KClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYWZ0ZXJTaG93KClcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICB9XG59XG5cbi8vIGluamVjdGluZyB0aGUgQW5hbHl6ZXIgTmF2aWdhdGlvbiBCYXIgdGhhdCBhbGxvd3MgZm9yIGVhc3kgc3dpdGNoaW5nIGJldHdlZW4gYW5hbHl6ZXJzIHdpdGhvdXQgcmV0dXJuaW5nIHRvIHRoZSBmb2xkZXIgdHJlZVxuQVBQLnVwZGF0ZU5hdkJhciA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IGlzUG9kc0xvYWRlZCA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBQT0RTICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gSW5qZWN0aW5nOiBBbmFseXplciBOYXZpZ2F0aW9uIEJhcicpXG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc1BvZHNMb2FkZWQpXG5cbiAgICAgIGxldCBwb2QgPSBuZXcgTElCLmdldENvb2tpZSgndXNlclBvZCcpXG5cbiAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgcG9kLnZhbHVlU2V0Lmxlbmd0aDsgeSsrKSB7XG4gICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaHJlZiA9PSBwb2QudmFsdWVTZXRbeV0udXJsKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gVXBkYXRpbmc6IENTUyBmb3IgQW5hbHl6ZXIgTmF2aWdhdGlvbiBCYXInKVxuICAgICAgICAgIC8vIFRoaXMgY29kZSBibG9jayBzd2FwcyB0aGUgY29sb3JzIG9mIHRoZSBhbmFseXplciBsYWJlbHMgZGVwZW5kaW5nIG9uIHdoaWNoIG9uZSB0aGUgdXNlciBpcyBjdXJyZW50bHkgdmlld2luZy5cbiAgICAgICAgICAkaiA9IGpRdWVyeS5ub0NvbmZsaWN0KClcbiAgICAgICAgICBsZXQgY3VyclBvc2l0aW9uID0gJyMnICsgcG9kLnZhbHVlU2V0W3ldLnBvc2l0aW9uXG4gICAgICAgICAgJGooY3VyclBvc2l0aW9uKS5wYXJlbnQoKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgICAgICAgICRqKGN1cnJQb3NpdGlvbikucGFyZW50KCkuc2libGluZ3MoKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgICAgJGooY3VyclBvc2l0aW9uKS5yZW1vdmVDbGFzcygnYW5hbHl6ZXItYnV0dG9uJykuYWRkQ2xhc3MoJ2FuYWx5emVyLXRpdGxlJylcbiAgICAgICAgICAkaihjdXJyUG9zaXRpb24pLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ2FuYWx5emVyLXRpdGxlJykuYWRkQ2xhc3MoJ2FuYWx5emVyLWJ1dHRvbicpXG4gICAgICAgICAgJGooJyNtb2RlbGVyLCNzdWNjZXNzLXBhdGgtYW5hbHl6ZXIsI29wcG9ydHVuaXR5LWluZmx1ZW5jZS1hbmFseXplciwjcHJvZ3JhbS1hbmFseXplcicpLmJpbmQoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IElkZW50aWZ5aW5nOiBDdXJyZW50IEFuYWx5emVyJylcbiAgICAgICAgICAgIC8vIFVwZGF0ZXMgdGhlIGN1cnJQb3NpdGlvbiBiYXNlZCBvbiB0aGUgZGl2IHNlbGVjdGVkXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBvZC52YWx1ZVNldC5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgICBpZiAoZS50YXJnZXQuaWQgPT0gcG9kLnZhbHVlU2V0W3hdLnBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgY3VyclBvc2l0aW9uID0geFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24gPSBwb2QudmFsdWVTZXRbY3VyclBvc2l0aW9uXS51cmxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LCAwKVxufVxuXG4vLyBvdmVycmlkZXMgdGhlIGZ1bmN0aW9uIGZvciBzYXZpbmcgYWRkaXRpb25zIGFuZCBkZWxldGlvbnMgdG8gTnVydHVyZSBTdHJlYW1zLlxuQVBQLm92ZXJyaWRlU2F2aW5nID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBPdmVycmlkaW5nOiBTYXZpbmcgZm9yIE51cnR1cmUgU3RyZWFtcycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuZGF0YS5TdG9yZS5wcm90b3R5cGUuc3luYycpKSB7XG4gICAgbGV0IHByZXZEYXRhU3RvcmVTeW5jID0gTWt0My5kYXRhLlN0b3JlLnByb3RvdHlwZS5zeW5jXG4gICAgTWt0My5kYXRhLlN0b3JlLnByb3RvdHlwZS5zeW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLnN0b3JlSWQgPT0gJ0NhbGVuZGFyVmlldycgfHxcbiAgICAgICAgdGhpcy5zdG9yZUlkID09ICdDYWxlbmRhclZpZXdMaXN0JyB8fCAvL0NhbGVuZGFyVmlld0xpc3QgaXMgZm9yIHRoZSBwcmVzZW50YXRpb25cbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYuc2VhcmNoKCcvIycgKyBta3RvQ2FsZW5kYXJGcmFnbWVudCkgIT0gLTEgfHxcbiAgICAgICAgKHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNlYXJjaCgnIycgKyBta3RvQWNjb3VudEJhc2VkTWFya2V0aW5nRnJhZ21lbnQpICE9IC0xICYmICF0aGlzLnN0b3JlSWQpXG4gICAgICApIHtcbiAgICAgICAgLy9hZGRlZCB0byB0YWtlIGNhcmUgb2YgdGhlIGVycm9yIG9uIHRoZSBlZGl0IHZpZXcgaW4gTmFtZWQgQWNjb3VudHNcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gUmVzdG9yaW5nOiBPcmlnaW5hbCBzeW5jIEZ1bmN0aW9uJylcbiAgICAgICAgcHJldkRhdGFTdG9yZVN5bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGRpc2FibGVcbiAgICAgICAgaWYgKHR5cGVvZiBNa3RDYW52YXMgIT09ICd1bmRlZmluZWQnICYmIE1rdENhbnZhcyAmJiBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkgJiYgdG9nZ2xlU3RhdGUgIT0gJ2ZhbHNlJykge1xuICAgICAgICAgIGRpc2FibGUgPSBBUFAuZXZhbHVhdGVNZW51KCdidXR0b24nLCBudWxsLCBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCksIG51bGwpXG4gICAgICAgIH0gZWxzZSBpZiAodG9nZ2xlU3RhdGUgPT0gJ2ZhbHNlJykge1xuICAgICAgICAgIGRpc2FibGUgPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWRpc2FibGUpIHtcbiAgICAgICAgICBpZiAodGhpcy5hdXRvU3luY1N1c3BlbmRlZCkge1xuICAgICAgICAgICAgdGhpcy5hdXRvU3luYyA9IHRydWVcbiAgICAgICAgICAgIHRoaXMuYXV0b1N5bmNTdXNwZW5kZWQgPSBmYWxzZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLmdldFByb3h5KCkgaW5zdGFuY2VvZiBNa3QzLmRhdGEucHJveHkuQWpheFBvc3QpIHtcbiAgICAgICAgICAgIE1rdDMuU3luY2hyb25pemVyLnN5bmModGhpcylcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy90aGlzIGlzIGNhbGxlZCBvbiB0aGUgY2FsZW5kYXJcbiAgICAgICAgICAgIHRoaXMuY2FsbFBhcmVudChhcmd1bWVudHMpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0NC5kYXRhLk1vZGVsLnByb3RvdHlwZS5kZXN0cm95JykpIHtcbiAgICBFeHQ0LmRhdGEuTW9kZWwucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgbGV0IGRpc2FibGVcbiAgICAgIGlmICh0eXBlb2YgTWt0Q2FudmFzICE9PSAndW5kZWZpbmVkJyAmJiBNa3RDYW52YXMgJiYgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpICYmIHRvZ2dsZVN0YXRlICE9ICdmYWxzZScpIHtcbiAgICAgICAgZGlzYWJsZSA9IEFQUC5ldmFsdWF0ZU1lbnUoJ2J1dHRvbicsIG51bGwsIE1rdENhbnZhcy5nZXRBY3RpdmVUYWIoKSwgbnVsbClcbiAgICAgIH0gZWxzZSBpZiAodG9nZ2xlU3RhdGUgPT0gJ2ZhbHNlJykge1xuICAgICAgICBkaXNhYmxlID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBpZiAoIWRpc2FibGUpIHtcbiAgICAgICAgb3B0aW9ucyA9IEV4dC5hcHBseShcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWNvcmRzOiBbdGhpc10sXG4gICAgICAgICAgICBhY3Rpb246ICdkZXN0cm95J1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb3B0aW9uc1xuICAgICAgICApXG5cbiAgICAgICAgbGV0IG1lID0gdGhpcyxcbiAgICAgICAgICBpc05vdFBoYW50b20gPSBtZS5waGFudG9tICE9PSB0cnVlLFxuICAgICAgICAgIHNjb3BlID0gb3B0aW9ucy5zY29wZSB8fCBtZSxcbiAgICAgICAgICB7c3RvcmVzfSA9IG1lLFxuICAgICAgICAgIGkgPSAwLFxuICAgICAgICAgIHN0b3JlQ291bnQsXG4gICAgICAgICAgc3RvcmUsXG4gICAgICAgICAgYXJncyxcbiAgICAgICAgICBvcGVyYXRpb24sXG4gICAgICAgICAgY2FsbGJhY2tcblxuICAgICAgICBvcGVyYXRpb24gPSBuZXcgRXh0LmRhdGEuT3BlcmF0aW9uKG9wdGlvbnMpXG5cbiAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAob3BlcmF0aW9uKSB7XG4gICAgICAgICAgYXJncyA9IFttZSwgb3BlcmF0aW9uXVxuICAgICAgICAgIGlmIChvcGVyYXRpb24ud2FzU3VjY2Vzc2Z1bCgpKSB7XG4gICAgICAgICAgICBmb3IgKHN0b3JlQ291bnQgPSBzdG9yZXMubGVuZ3RoOyBpIDwgc3RvcmVDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgIHN0b3JlID0gc3RvcmVzW2ldXG4gICAgICAgICAgICAgIHN0b3JlLnJlbW92ZShtZSwgdHJ1ZSlcbiAgICAgICAgICAgICAgaWYgKGlzTm90UGhhbnRvbSkge1xuICAgICAgICAgICAgICAgIHN0b3JlLmZpcmVFdmVudCgnd3JpdGUnLCBzdG9yZSwgb3BlcmF0aW9uKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZS5jbGVhckxpc3RlbmVycygpXG4gICAgICAgICAgICBFeHQuY2FsbGJhY2sob3B0aW9ucy5zdWNjZXNzLCBzY29wZSwgYXJncylcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRXh0LmNhbGxiYWNrKG9wdGlvbnMuZmFpbHVyZSwgc2NvcGUsIGFyZ3MpXG4gICAgICAgICAgfVxuICAgICAgICAgIEV4dC5jYWxsYmFjayhvcHRpb25zLmNhbGxiYWNrLCBzY29wZSwgYXJncylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc05vdFBoYW50b20pIHtcbiAgICAgICAgICBtZS5nZXRQcm94eSgpLmRlc3Ryb3kob3BlcmF0aW9uLCBjYWxsYmFjaywgbWUpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3BlcmF0aW9uLmNvbXBsZXRlID0gb3BlcmF0aW9uLnN1Y2Nlc3MgPSB0cnVlXG4gICAgICAgICAgb3BlcmF0aW9uLnJlc3VsdFNldCA9IG1lLmdldFByb3h5KCkucmVhZGVyLm51bGxSZXN1bHRTZXRcbiAgICAgICAgICBjYWxsYmFjayhvcGVyYXRpb24pXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIGRpc2FibGVzIHNhdmluZyBmb3IgdGhlIEVkaXRvcnMgKGVtYWlscywgZm9ybXMsIHB1c2ggbm90aWZpY2F0aW9ucywgYW5kIHNvY2lhbCBhcHBzKSBhbmQgdGhlIE51cnR1cmUgU3RyZWFtcy5cbkFQUC5kaXNhYmxlU2F2aW5nID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IFNhdmluZyBmb3IgRWRpdG9ycycpXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuZGF0YS5TdG9yZS5wcm90b3R5cGUuc3luYycpKSB7XG4gICAgTWt0My5kYXRhLlN0b3JlLnByb3RvdHlwZS5zeW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFNhdmluZyBmb3IgRWRpdG9ycyAoc3luYyknKVxuICAgIH1cbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ0V4dDQuZGF0YS5Nb2RlbC5wcm90b3R5cGUuZGVzdHJveScpKSB7XG4gICAgRXh0NC5kYXRhLk1vZGVsLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFNhdmluZyBmb3IgRWRpdG9ycyAoZGVzdHJveSknKVxuICAgIH1cbiAgfVxuXG4gIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuY29udHJvbGxlci5lZGl0b3InKSkge1xuICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yLnByb3RvdHlwZS5jaGFuZ2VNb2R1bGVPcmRlcicpKSB7XG4gICAgICBNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvci5wcm90b3R5cGUuY2hhbmdlTW9kdWxlT3JkZXIgPSBmdW5jdGlvbiAobW9kdWxlQ29tcG9uZW50LCBvcmRlckRlbHRhKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBTYXZpbmcgZm9yIEVkaXRvcnMgKGNoYW5nZU1vZHVsZU9yZGVyKScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5jb250cm9sbGVyLmVkaXRvci5mb3JtLnNldHRpbmdzLkZpZWxkU2VsZWN0aW9uLnByb3RvdHlwZS5kZWxldGVGb3JtRmllbGQnKSkge1xuICAgICAgTWt0My5jb250cm9sbGVyLmVkaXRvci5mb3JtLnNldHRpbmdzLkZpZWxkU2VsZWN0aW9uLnByb3RvdHlwZS5kZWxldGVGb3JtRmllbGQgPSBmdW5jdGlvbiAoZm9ybUZpZWxkKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRW5hYmxlIERlbGV0aW5nIEZvcm0gRmllbGQnKVxuICAgICAgICBsZXQgZm9ybUZpZWxkV2lkZ2V0ID0gZm9ybUZpZWxkLmdldEZpZWxkV2lkZ2V0KCksXG4gICAgICAgICAgZm9ybUZpZWxkSWQsXG4gICAgICAgICAgY2hpbGRGaWVsZEluZGV4LFxuICAgICAgICAgIGNoaWxkRm9ybUZpZWxkLFxuICAgICAgICAgIGFsbEZvcm1GaWVsZHNcblxuICAgICAgICBpZiAoZm9ybUZpZWxkV2lkZ2V0ICYmIGZvcm1GaWVsZFdpZGdldC5nZXQoJ2RhdGF0eXBlJykgPT09ICdmaWVsZHNldCcpIHtcbiAgICAgICAgICBhbGxGb3JtRmllbGRzID0gdGhpcy5nZXRGb3JtKCkuZ2V0Rm9ybUZpZWxkcygpXG4gICAgICAgICAgZm9ybUZpZWxkSWQgPSBmb3JtRmllbGQuZ2V0KCdpZCcpXG4gICAgICAgICAgZm9yIChjaGlsZEZpZWxkSW5kZXggPSAwOyBjaGlsZEZpZWxkSW5kZXggPCBhbGxGb3JtRmllbGRzLmdldENvdW50KCk7IGNoaWxkRmllbGRJbmRleCsrKSB7XG4gICAgICAgICAgICBjaGlsZEZvcm1GaWVsZCA9IGFsbEZvcm1GaWVsZHMuZ2V0QXQoY2hpbGRGaWVsZEluZGV4KVxuICAgICAgICAgICAgaWYgKGNoaWxkRm9ybUZpZWxkLmdldCgnZmllbGRzZXRGaWVsZElkJykgPT0gZm9ybUZpZWxkSWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5kZWxldGVGb3JtRmllbGQoY2hpbGRGb3JtRmllbGQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9ybUZpZWxkLmRlc3Ryb3koe1xuICAgICAgICAgIHNjb3BlOiB0aGlzLFxuICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbiAoZmllbGQsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgICAgICAgICBpZiAoZm9ybUZpZWxkV2lkZ2V0KSB7XG4gICAgICAgICAgICAgICAgZm9ybUZpZWxkV2lkZ2V0LmRlc3Ryb3koKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAvLyBUaGlzIGFsbG93cyBmb3IgbXVsdGlwbGUgZm9ybSBmaWVsZHMgdG8gYmUgZGVsZXRlZFxuICAgICAgICB0aGlzLnJlbnVtYmVyV2lkZ2V0cygpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIGRpc2FibGVzIHNwZWNpZmljIHJlcXVlc3RzIGZyb20gY29tcGxldGluZyB0byBwcmV2ZW50IHNhdmluZy5cbkFQUC5kaXNhYmxlUmVxdWVzdHMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IERpc2FibGluZzogU3BlY2lmaWMgUmVxdWVzdHMnKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RTZXNzaW9uLmFqYXhSZXF1ZXN0JykpIHtcbiAgICBpZiAodHlwZW9mIG9yaWdBamF4UmVxdWVzdEZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9yaWdBamF4UmVxdWVzdEZ1bmMgPSBNa3RTZXNzaW9uLmFqYXhSZXF1ZXN0XG4gICAgfVxuICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QgPSBmdW5jdGlvbiAodXJsLCBvcHRzKSB7XG4gICAgICBzd2l0Y2ggKHVybCkge1xuICAgICAgICBjYXNlICdjcm0vZW5hYmxlU3luYyc6XG4gICAgICAgIGNhc2UgJ2xlYWREYXRhYmFzZS91cGRhdGVMZWFkJzpcbiAgICAgICAgY2FzZSAnZmllbGRNYW5hZ2VtZW50L2FuYWx5dGljc09wdGlvbnNTdWJtaXQnOlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBTcGVjaWZpYyBSZXF1ZXN0cycpXG4gICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgY2FzZSAnYW5hbHl0aWNzL2VkaXRSZXBvcnRTZXR0aW5ncyc6XG4gICAgICAgIGNhc2UgJ2FuYWx5dGljcy9hcHBseUNvbXBvbmVudEZpbHRlcic6XG4gICAgICAgIGNhc2UgJ2FuYWx5dGljcy9zZXRSZXBvcnRTZWdtZW50YXRpb24nOlxuICAgICAgICAgIGlmICh0eXBlb2YgTWt0RXhwbG9yZXIgIT09ICd1bmRlZmluZWQnICYmIE1rdEV4cGxvcmVyICYmIE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkICYmIG9wdHMgJiYgb3B0cy5zZXJpYWxpemVQYXJtcykge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBvcHRzLnNlcmlhbGl6ZVBhcm1zLm5vZGVJZCAmJlxuICAgICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChvcHRzLnNlcmlhbGl6ZVBhcm1zLm5vZGVJZCkgJiZcbiAgICAgICAgICAgICAgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQob3B0cy5zZXJpYWxpemVQYXJtcy5ub2RlSWQpLmF0dHJpYnV0ZXMgJiZcbiAgICAgICAgICAgICAgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQob3B0cy5zZXJpYWxpemVQYXJtcy5ub2RlSWQpLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxlIFNwZWNpZmljIFJlcXVlc3RzJylcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgIG9wdHMuc2VyaWFsaXplUGFybXMucmVwb3J0SWQgJiZcbiAgICAgICAgICAgICAgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQobWt0b0FuYWx5dGljc0ZyYWdtZW50ICsgb3B0cy5zZXJpYWxpemVQYXJtcy5yZXBvcnRJZCkgJiZcbiAgICAgICAgICAgICAgTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQobWt0b0FuYWx5dGljc0ZyYWdtZW50ICsgb3B0cy5zZXJpYWxpemVQYXJtcy5yZXBvcnRJZCkuYXR0cmlidXRlcyAmJlxuICAgICAgICAgICAgICBNa3RFeHBsb3Jlci5nZXROb2RlQnlJZChta3RvQW5hbHl0aWNzRnJhZ21lbnQgKyBvcHRzLnNlcmlhbGl6ZVBhcm1zLnJlcG9ydElkKVxuICAgICAgICAgICAgICAgIC5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZC50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgLnNlYXJjaChta3RvR29sZGVuV29ya3NwYWNlc01hdGNoKSAhPSAtMVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBTcGVjaWZpYyBSZXF1ZXN0cycpXG4gICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGlmICh1cmwuc2VhcmNoKCdec2FsZXNmb3JjZS9lbmFibGVTeW5jaCcpICE9IC0xKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogRGlzYWJsZSBTcGVjaWZpYyBSZXF1ZXN0cycpXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9XG4gICAgICBvcmlnQWpheFJlcXVlc3RGdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH1cbn1cblxuLy8gc2V0IHRoZSBQcm9ncmFtIFN0YXR1cyB0byBvZmYgZm9yIE51cnR1cmUgUHJvZ3JhbXNcbkFQUC5kaXNhYmxlTnVydHVyZVByb2dyYW1zID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBEaXNhYmxpbmc6IE51cnR1cmUgUHJvZ3JhbXMnKVxuICBpZiAoXG4gICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RDYW52YXMuZ2V0QWN0aXZlVGFiJykgJiZcbiAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkgJiZcbiAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnICYmXG4gICAgTWt0Q2FudmFzLmdldEFjdGl2ZVRhYigpLmNvbmZpZy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b0dvbGRlbldvcmtzcGFjZXNNYXRjaCkgPT0gLTEgJiZcbiAgICBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnLmNvbXBJZFxuICApIHtcbiAgICBsZXQge2NvbXBJZH0gPSBNa3RDYW52YXMuZ2V0QWN0aXZlVGFiKCkuY29uZmlnXG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gRXhlY3V0aW5nOiBEaXNhYmxpbmcgTnVydHVyZSBQcm9ncmFtJylcbiAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICcvbWFya2V0aW5nRXZlbnQvc2V0UHJvZ3JhbVN0YXR1c1N1Ym1pdCcsXG4gICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAnJmNvbXBJZD0nICsgY29tcElkICtcbiAgICAgICAgJyZfanNvbj17XCJwcm9ncmFtSWRcIjonICsgY29tcElkICtcbiAgICAgICAgJyxcInN0YXR1c1ZhbHVlXCI6XCJvZmZcIn0meHNyZklkPScgKyBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICdQT1NUJyxcbiAgICAgIHRydWUsXG4gICAgICAnanNvbicsXG4gICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IEpTT04ucGFyc2UocmVzcG9uc2UpXG4gICAgICAgIGlmIChyZXN1bHQuSlNPTlJlc3VsdHMuYXBwdmFycy5yZXN1bHQgPT0gJ1N1Y2Nlc3MnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gU3VjY2VzczogRGlzYWJsZWQgTnVydHVyZSBQcm9ncmFtOiAnICsgcmVzdWx0LkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS50ZXh0KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9XG59XG5cbi8vIG9wZW5zIHRoZSBTZW5kIHZpYSBBZCBCcmlkZ2UgbW9kYWwgd2luZG93XG5BUFAub3BlbkFkQnJpZGdlTW9kYWwgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IE9wZW5pbmc6IEFkIEJyaWRnZSBNb2RhbCBXaW5kb3cnKVxuICBsZXQgaXNBZEJyaWRnZVNtYXJ0TGlzdCA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCd4LWJ0bi10ZXh0IG1raVVzZXJUYXJnZXQnKVswXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzQWRCcmlkZ2VTbWFydExpc3QpXG4gICAgICBpZiAoXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3gtYnRuLXRleHQgbWtpVXNlclRhcmdldCcpICYmXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3gtYnRuLXRleHQgbWtpVXNlclRhcmdldCcpWzBdICYmXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3gtYnRuLXRleHQgbWtpVXNlclRhcmdldCcpWzBdLnR5cGUgPT0gJ2J1dHRvbidcbiAgICAgICkge1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IE9wZW4gQWQgQnJpZGdlIE1vZGFsIFdpbmRvdycpXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3gtYnRuLXRleHQgbWtpVXNlclRhcmdldCcpWzBdLmNsaWNrKClcbiAgICAgIH1cbiAgICB9XG4gIH0sIDApXG59XG5cbi8vIHJlc2V0cyB0aGUgZ29sZGVuIExhbmRpbmcgUGFnZXMgcHJvcGVydGllcy92YXJpYWJsZXNcbkFQUC5yZXNldEdvbGRlbkxhbmRpbmdQYWdlUHJvcHMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFJlc2V0dGluZzogR29sZGVuIExhbmRpbmcgUGFnZXMgUHJvcGVydGllcy9WYXJpYWJsZXMnKVxuICBpZiAodHlwZW9mIE1rdFNlY3VyaXR5ICE9PSAndW5kZWZpbmVkJyAmJiBNa3RTZWN1cml0eSAmJiBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSkge1xuICAgIHN3aXRjaCAoY3VyclVybEZyYWdtZW50KSB7XG4gICAgICBjYXNlIG1rdG9EZWZhdWx0RGl5TGFuZGluZ1BhZ2VSZXNwb25zaXZlRWRpdEZyYWdtZW50OlxuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFeGVjdXRpbmc6IFJlc2V0dGluZyBMYW5kaW5nIFBhZ2UgUmVzcG9uc2l2ZSBQcm9wZXJ0aWVzL1ZhcmlhYmxlcycpXG4gICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICcvZGF0YS9sYW5kaW5nUGFnZS91cGRhdGU/Y29udGV4dD1MUEUxMTgyMiZkYXRhPSU1QiU3QiUyMmlkJTIyJTNBMTE4MjIlMkMlMjJyZXNwb25zaXZlT3B0aW9ucyUyMiUzQSU3QiUyMnZhcmlhYmxlcyUyMiUzQSU3QiUyMmdyYWRpZW50MSUyMiUzQSUyMiUyMzJBNTM3MCUyMiUyQyUyMmdyYWRpZW50MiUyMiUzQSUyMiUyM0YyRjJGMiUyMiUyQyUyMnNob3dTZWN0aW9uMiUyMiUzQXRydWUlMkMlMjJzaG93U2VjdGlvbjMlMjIlM0F0cnVlJTJDJTIyc2hvd1NlY3Rpb240JTIyJTNBdHJ1ZSUyQyUyMnNob3dGb290ZXIlMjIlM0F0cnVlJTJDJTIyc2hvd1NvY2lhbEJ1dHRvbnMlMjIlM0F0cnVlJTJDJTIyc2VjdGlvbjRCdXR0b25MYWJlbCUyMiUzQSUyMk5lZWQlMjBNb3JlJTIwSW5mbyUzRiUyMiUyQyUyMnNlY3Rpb240QnV0dG9uTGluayUyMiUzQSUyMiUyMyUyMiUyQyUyMnNlY3Rpb24zTGVmdEJ1dHRvbkxhYmVsJTIyJTNBJTIySm9pbiUyMFVzJTIyJTJDJTIyc2VjdGlvbjRCZ0NvbG9yJTIyJTNBJTIyJTIzRjJGMkYyJTIyJTJDJTIyZm9vdGVyQmdDb2xvciUyMiUzQSUyMiUyMzJBNTM3MCUyMiUyQyUyMnNlY3Rpb24yQmdDb2xvciUyMiUzQSUyMiUyM0YyRjJGMiUyMiUyQyUyMnNlY3Rpb24zQmdDb2xvciUyMiUzQSUyMiUyMzJBNTM3MCUyMiUyQyUyMnNlY3Rpb24zTGVmdEJ1dHRvbkxpbmslMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy5tYXJrZXRvLmNvbSUyMiUyQyUyMnNlY3Rpb24zUmlnaHRCdXR0b25MYWJlbCUyMiUzQSUyMlNpZ24lMjBVcCUyMiU3RCU3RCU3RCU1RCZ4c3JmSWQ9JyArXG4gICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICB0cnVlLFxuICAgICAgICAgICcnLFxuICAgICAgICAgIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbn1cblxuLy8gdHJhY2sgdHJlZSBub2RlIGNsaWNrcyBmb3IgSGVhcCBBbmFseXRpY3MuXG5BUFAudHJhY2tOb2RlQ2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFRyYWNraW5nOiBUcmVlIE5vZGUgQ2xpY2snKVxuICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdFeHQudHJlZS5UcmVlRXZlbnRNb2RlbC5wcm90b3R5cGUub25Ob2RlQ2xpY2snKSkge1xuICAgIC8vY29uc29sZS5sb2coXCJNYXJrZXRvIEFwcCA+IEV4ZWN1dGluZzogVHJhY2tpbmcgVHJlZSBOb2RlIENsaWNrXCIpO1xuICAgIEV4dC50cmVlLlRyZWVFdmVudE1vZGVsLnByb3RvdHlwZS5vbk5vZGVDbGljayA9IGZ1bmN0aW9uIChlLCBub2RlKSB7XG4gICAgICBpZiAobm9kZSAmJiBub2RlLnRleHQgJiYgbm9kZS5hdHRyaWJ1dGVzICYmIG5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQpIHtcbiAgICAgICAgbGV0IGN1cnJOb2RlID0gbm9kZSxcbiAgICAgICAgICBoZWFwRXZlbnQgPSB7XG4gICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgIGFzc2V0TmFtZTogY3Vyck5vZGUudGV4dCxcbiAgICAgICAgICAgIGFzc2V0SWQ6IGN1cnJOb2RlLmF0dHJpYnV0ZXMuaWQsXG4gICAgICAgICAgICBhc3NldFR5cGU6IGN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUsXG4gICAgICAgICAgICBhc3NldFBhdGg6ICcnLFxuICAgICAgICAgICAgd29ya3NwYWNlSWQ6IGN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLFxuICAgICAgICAgICAgd29ya3NwYWNlTmFtZTogJydcbiAgICAgICAgICB9XG5cbiAgICAgICAgaGVhcEV2ZW50LmFzc2V0UGF0aCA9IGN1cnJOb2RlLnRleHRcblxuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbm9kZS5nZXREZXB0aCgpIC0gMTsgaWkrKykge1xuICAgICAgICAgIGN1cnJOb2RlID0gY3Vyck5vZGUucGFyZW50Tm9kZVxuICAgICAgICAgIGhlYXBFdmVudC5hc3NldFBhdGggPSBjdXJyTm9kZS50ZXh0ICsgJyA+ICcgKyBoZWFwRXZlbnQuYXNzZXRQYXRoXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgKGFjY291bnRTdHJpbmcgPT0gbWt0b0FjY291bnRTdHJpbmdNYXN0ZXIgfHwgYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3Rlck1FVUUpICYmXG4gICAgICAgICAgbm9kZS5nZXRQYXRoKCkuc2VhcmNoKC9eXFxcXFxcXFxcXFxcUHJvZ3JhbXNyb290XFxcXFxcXFxcXFxcMTlcXFxcXFxcXFxcXFw3NTA2XFxcXFxcXFxcXFxcLykgIT0gLTFcbiAgICAgICAgKSB7XG4gICAgICAgICAgLy9UT0RPXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGhlYXBFdmVudC53b3Jrc3BhY2VOYW1lID0gTWt0RXhwbG9yZXIuZ2V0Tm9kZUJ5SWQobm9kZS5nZXRQYXRoKCkuc3BsaXQoJ1xcXFxcXFxcXFxcXCcpWzRdKS50ZXh0LnJlcGxhY2UoJyZhbXA7ICcsICcnKVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFRyYWNraW5nOiBUcmVlIE5vZGUgQ2xpY2sgRXJyb3I6ICcgKyBlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoZWFwRXZlbnQud29ya3NwYWNlTmFtZSA9IEFQUC5nZXRXb3Jrc3BhY2VOYW1lKGN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkLnRvU3RyaW5nKCkuc2VhcmNoKG1rdG9Hb2xkZW5Xb3Jrc3BhY2VzTWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgaGVhcEV2ZW50Lm5hbWUgPSBoZWFwRXZlbnQud29ya3NwYWNlTmFtZVxuXG4gICAgICAgICAgaWYgKGhlYXBFdmVudC53b3Jrc3BhY2VOYW1lID09ICdBZG1pbicpIHtcbiAgICAgICAgICAgIGhlYXBFdmVudC5hc3NldFR5cGUgPSAnQWRtaW4gQXJlYSdcbiAgICAgICAgICAgIGhlYXBFdmVudC53b3Jrc3BhY2VJZCA9IDBcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWQudG9TdHJpbmcoKS5zZWFyY2gobWt0b015V29ya3NwYWNlSWRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICBoZWFwRXZlbnQubmFtZSA9IGhlYXBFdmVudC53b3Jrc3BhY2VOYW1lXG4gICAgICAgICAgaGVhcEV2ZW50LnVzZXJGb2xkZXIgPSB1c2VyTmFtZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhlYXBFdmVudC5uYW1lID0gbWt0b090aGVyV29ya3NwYWNlTmFtZVxuICAgICAgICB9XG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywgaGVhcEV2ZW50KVxuICAgICAgfVxuICAgICAgbm9kZS51aS5vbkNsaWNrKGUpXG4gICAgfVxuICB9XG59XG5cbkFQUC5nZXRVc2VyUm9sZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKE1rdFBhZ2UgJiYgTWt0UGFnZS51c2VyTmFtZSkge1xuICAgIGxldCByb2xlU3Vic3RyaW5nID0gTWt0UGFnZS51c2VyTmFtZS5zZWFyY2goL1xcW1teXFxdXStcXF0vKVxuICAgIGlmIChyb2xlU3Vic3RyaW5nICE9IC0xKSB7XG4gICAgICByZXR1cm4gTWt0UGFnZS51c2VyTmFtZS5zdWJzdHJpbmcocm9sZVN1YnN0cmluZykucmVwbGFjZSgvXlxcWyhbXlxcXV0rKV0kLywgJyQxJylcbiAgICB9XG4gIH1cbiAgcmV0dXJuICcnXG59XG5cbkFQUC5nZXRVc2VySWQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChNa3RQYWdlICYmIE1rdFBhZ2UudXNlcmlkKSB7XG4gICAgcmV0dXJuIE1rdFBhZ2UudXNlcmlkXG4gIH1cbiAgcmV0dXJuICcnXG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIFRoaXMgZnVuY3Rpb24gdHJhY2tzIGFuZCBpZGVudGlmaWVzIHRoZSBjdXJyZW50IHVzZXIgdmlhIEhlYXAgQW5hbHl0aWNzXG4gKiAgQHBhcmFtIHtTdHJpbmd9IGFjdGlvbiAtIFRoZSBkZXNpcmVkIGFjdGlvbiAoaWQsIHRyYWNrKS5cbiAqICBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBUaGUgb2JqZWN0IG9mIHRoZSBldmVudCB0byBiZSB0cmFja2VkLlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuQVBQLmhlYXBUcmFjayA9IGZ1bmN0aW9uIChhY3Rpb24sIGV2ZW50KSB7XG4gIGxldCBpc0hlYXBBbmFseXRpY3MgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ2hlYXAubG9hZGVkJykpIHtcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzSGVhcEFuYWx5dGljcylcbiAgICAgIGxldCBva3RhRW1haWwsIG9rdGFGaXJzdE5hbWUsIG9rdGFMYXN0TmFtZSwgaGVhcEFwcCwgaGVhcEFyZWEsIGhlYXBFdmVudFByb3BzXG4gICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAvLyBIZWFwIEFuYWx5dGljcyBJZGVudGlmeSBVc2VyXG4gICAgICAgIGNhc2UgJ2lkJzpcbiAgICAgICAgICBva3RhRW1haWwgPSBMSUIuZ2V0Q29va2llKCdva3RhX2VtYWlsJylcbiAgICAgICAgICBva3RhRmlyc3ROYW1lID0gTElCLmdldENvb2tpZSgnb2t0YV9maXJzdF9uYW1lJylcbiAgICAgICAgICBva3RhTGFzdE5hbWUgPSBMSUIuZ2V0Q29va2llKCdva3RhX2xhc3RfbmFtZScpXG5cbiAgICAgICAgICBpZiAoTWt0UGFnZSAmJiBNa3RQYWdlLnVzZXJpZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gSGVhcCBBbmFseXRpY3MgSUQ6ICcgKyBNa3RQYWdlLnVzZXJpZClcbiAgICAgICAgICAgIGhlYXAuaWRlbnRpZnkoTWt0UGFnZS51c2VyaWQpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG9rdGFGaXJzdE5hbWUgJiYgb2t0YUxhc3ROYW1lKSB7XG4gICAgICAgICAgICBoZWFwLmFkZFVzZXJQcm9wZXJ0aWVzKHtOYW1lOiBva3RhRmlyc3ROYW1lICsgJyAnICsgb2t0YUxhc3ROYW1lfSlcbiAgICAgICAgICB9IGVsc2UgaWYgKE1rdFBhZ2UgJiYgTWt0UGFnZS51c2VyTmFtZSkge1xuICAgICAgICAgICAgaGVhcC5hZGRVc2VyUHJvcGVydGllcyh7XG4gICAgICAgICAgICAgIE5hbWU6IE1rdFBhZ2UudXNlck5hbWUucmVwbGFjZSgvID9cXFtbXlxcXV0rXFxdLywgJycpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgICBoZWFwLmFkZFVzZXJQcm9wZXJ0aWVzKHtSb2xlOiBBUFAuZ2V0VXNlclJvbGUoKX0pXG4gICAgICAgICAgaWYgKG9rdGFFbWFpbCkge1xuICAgICAgICAgICAgaGVhcC5hZGRVc2VyUHJvcGVydGllcyh7RW1haWw6IG9rdGFFbWFpbH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4JykpIHtcbiAgICAgICAgICAgIGlmIChNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeCA9PSBta3RvQWNjb3VudFN0cmluZzEwNikge1xuICAgICAgICAgICAgICBoZWFwLmFkZEV2ZW50UHJvcGVydGllcyh7RW52aXJvbm1lbnQ6ICdJbnRlcm5hbCd9KVxuICAgICAgICAgICAgfSBlbHNlIGlmIChNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeCA9PSBta3RvQWNjb3VudFN0cmluZzEwNmQpIHtcbiAgICAgICAgICAgICAgaGVhcC5hZGRFdmVudFByb3BlcnRpZXMoe0Vudmlyb25tZW50OiAnUGFydG5lcid9KVxuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXggPT0gbWt0b0FjY291bnRTdHJpbmdNYXN0ZXIgfHxcbiAgICAgICAgICAgICAgTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXggPT0gbWt0b0FjY291bnRTdHJpbmdNYXN0ZXJNRVVFXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgLy9UT0RPXG4gICAgICAgICAgICAgIGhlYXAuYWRkRXZlbnRQcm9wZXJ0aWVzKHtFbnZpcm9ubWVudDogJ01hc3Rlcid9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICAvLyBIZWFwIEFuYWx5dGljcyBFdmVudCBUcmFja2luZ1xuICAgICAgICBjYXNlICd0cmFjayc6XG4gICAgICAgICAgaWYgKE1rdFBhZ2UgJiYgTWt0UGFnZS5mcmllbmRseU5hbWUpIHtcbiAgICAgICAgICAgIGhlYXBBcHAgPSBNa3RQYWdlLmZyaWVuZGx5TmFtZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBoZWFwQXBwID0gJ01hcmtldG8nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKE1rdFBhZ2UgJiYgTWt0UGFnZS5iYXNlVGl0bGUpIHtcbiAgICAgICAgICAgIGhlYXBBcmVhID0gTWt0UGFnZS5iYXNlVGl0bGUuc3BsaXQoJ+KAoicpWzBdLnRyaW1SaWdodCgpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhlYXBBcmVhID0gJ1Vua25vd24nXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgICAgICBoZWFwRXZlbnRQcm9wcyA9IHtcbiAgICAgICAgICAgICAgYXBwOiBoZWFwQXBwLFxuICAgICAgICAgICAgICBhc3NldE5hbWU6IGV2ZW50LmFzc2V0TmFtZSxcbiAgICAgICAgICAgICAgYXNzZXRJZDogZXZlbnQuYXNzZXRJZCxcbiAgICAgICAgICAgICAgYXNzZXRUeXBlOiBldmVudC5hc3NldFR5cGUsXG4gICAgICAgICAgICAgIGFzc2V0UGF0aDogZXZlbnQuYXNzZXRQYXRoLFxuICAgICAgICAgICAgICB3b3Jrc3BhY2VJZDogZXZlbnQud29ya3NwYWNlSWQsXG4gICAgICAgICAgICAgIHdvcmtzcGFjZU5hbWU6IGV2ZW50LndvcmtzcGFjZU5hbWUsXG4gICAgICAgICAgICAgIHVzZXJGb2xkZXI6IGV2ZW50LnVzZXJGb2xkZXIsXG4gICAgICAgICAgICAgIGFyZWE6ICcnLFxuICAgICAgICAgICAgICBlbnZpcm9ubWVudDogJycsXG4gICAgICAgICAgICAgIHVybDogd2luZG93LmxvY2F0aW9uLmhyZWZcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LmFzc2V0QXJlYSkge1xuICAgICAgICAgICAgICBoZWFwRXZlbnRQcm9wcy5hcmVhID0gZXZlbnQuYXNzZXRBcmVhXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBoZWFwRXZlbnRQcm9wcy5hcmVhID0gaGVhcEFyZWFcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXgnKSkge1xuICAgICAgICAgICAgICBpZiAoTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXggPT0gbWt0b0FjY291bnRTdHJpbmcxMDYpIHtcbiAgICAgICAgICAgICAgICBoZWFwRXZlbnRQcm9wcy5lbnZpcm9ubWVudCA9ICdJbnRlcm5hbCdcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChNa3RQYWdlLnNhdmVkU3RhdGUuY3VzdFByZWZpeCA9PSBta3RvQWNjb3VudFN0cmluZzEwNmQpIHtcbiAgICAgICAgICAgICAgICBoZWFwRXZlbnRQcm9wcy5lbnZpcm9ubWVudCA9ICdQYXJ0bmVyJ1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgIE1rdFBhZ2Uuc2F2ZWRTdGF0ZS5jdXN0UHJlZml4ID09IG1rdG9BY2NvdW50U3RyaW5nTWFzdGVyIHx8XG4gICAgICAgICAgICAgICAgTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXggPT0gbWt0b0FjY291bnRTdHJpbmdNYXN0ZXJNRVVFXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIC8vVE9ET1xuICAgICAgICAgICAgICAgIGhlYXBFdmVudFByb3BzLmVudmlyb25tZW50ID0gJ01hc3RlcidcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gVHJhY2tpbmc6IEhlYXAgRXZlbnQ6ICcgKyBldmVudC5uYW1lICsgJ1xcbicgKyBKU09OLnN0cmluZ2lmeShoZWFwRXZlbnRQcm9wcywgbnVsbCwgMikpXG4gICAgICAgICAgICBoZWFwLnRyYWNrKGV2ZW50Lm5hbWUsIGhlYXBFdmVudFByb3BzKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdhZGRQcm9wJzpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBBZGRpbmc6IEhlYXAgRXZlbnQgUHJvcGVydGllczogJyArIEpTT04uc3RyaW5naWZ5KGV2ZW50LCBudWxsLCAyKSlcbiAgICAgICAgICBoZWFwLmFkZEV2ZW50UHJvcGVydGllcyhldmVudClcbiAgICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgfSwgMClcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgTWFpblxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyB3aW5kb3cubWt0b19saXZlX2V4dGVuc2lvbl9zdGF0ZSA9ICdNYXJrZXRvTGl2ZSBleHRlbnNpb24gaXMgYWxpdmUhJ1xuXG5sZXQgdG9nZ2xlU3RhdGUgPSBMSUIuZ2V0Q29va2llKCd0b2dnbGVTdGF0ZScpXG5cbmlmICh0b2dnbGVTdGF0ZSA9PSBudWxsKSB7XG4gIHRvZ2dsZVN0YXRlID0gJ3RydWUnXG59XG5cbmxldCBpc01rdFBhZ2VBcHAgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIE1rdFBhZ2UgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IE1hcmtldG8gUGFnZScpXG4gICAgbGV0IHVzZXJJZFxuXG4gICAgaWYgKExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXgnKSAmJiBNa3RQYWdlLnVzZXJpZCAmJiBMSUIuaXNQcm9wT2ZXaW5kb3dPYmooJ01rdDMuREwuZ2V0RGxUb2tlbicpICYmIE1rdDMuREwuZ2V0RGxUb2tlbigpKSB7XG4gICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc01rdFBhZ2VBcHApXG4gICAgICBhY2NvdW50U3RyaW5nID0gTWt0UGFnZS5zYXZlZFN0YXRlLmN1c3RQcmVmaXhcbiAgICAgIHVzZXJJZCA9IE1rdFBhZ2UudXNlcmlkLnRvTG93ZXJDYXNlKClcbiAgICAgIGN1cnJVcmxGcmFnbWVudCA9IE1rdDMuREwuZ2V0RGxUb2tlbigpXG4gICAgICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLkRMLmRsLmRsQ29tcENvZGUnKSkge1xuICAgICAgICBjdXJyQ29tcEZyYWdtZW50ID0gTWt0My5ETC5kbC5kbENvbXBDb2RlXG4gICAgICB9XG5cbiAgICAgIGlmICh1c2VySWQuc2VhcmNoKCcuZGVtb0AobWFya2V0by5jb218bWFya2V0b2xpdmUuY29tKSQnKSAhPSAtMSkge1xuICAgICAgICB1c2VyTmFtZSA9IHVzZXJJZC5zcGxpdCgnLmRlbW8nKVswXVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXNlck5hbWUgPSB1c2VySWQuc3BsaXQoJ0AnKVswXVxuICAgICAgICBpZiAodXNlck5hbWUgPT0gJ21hcmtldG9saXZlJykge1xuICAgICAgICAgIHVzZXJOYW1lID0gdXNlcklkLnNwbGl0KCdAJylbMV0uc3BsaXQoJy4nKVswXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgQVBQLnNldEluc3RhbmNlSW5mbyhhY2NvdW50U3RyaW5nKVxuXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICBleHRlbnNpb25JZCxcbiAgICAgIHtcbiAgICAgICAgYWN0aW9uOiAnY2hlY2tFeHRlbnNpb25WZXJzaW9uJyxcbiAgICAgICAgbWluVmVyc2lvbjogZXh0ZW5zaW9uTWluVmVyc2lvblxuICAgICAgfSxcbiAgICAgIG51bGwsXG4gICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmlzVmFsaWRFeHRlbnNpb24pIHtcbiAgICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgICAgICAgIGV4dGVuc2lvbklkLFxuICAgICAgICAgICAge2FjdGlvbjogJ2NoZWNrQmFkRXh0ZW5zaW9uJ30sXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5pc1ZhbGlkRXh0ZW5zaW9uKSB7XG4gICAgICAgICAgICAgICAgTElCLnZhbGlkYXRlRGVtb0V4dGVuc2lvbkNoZWNrKHJlc3BvbnNlLmlzVmFsaWRFeHRlbnNpb24pXG4gICAgICAgICAgICAgICAgaWYgKGFjY291bnRTdHJpbmcgPT0gbWt0b0FjY291bnRTdHJpbmdNYXN0ZXIgfHwgYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3Rlck1FVUUpIHtcbiAgICAgICAgICAgICAgICAgIC8vVE9ET1xuICAgICAgICAgICAgICAgICAgQVBQLm92ZXJyaWRlU3VwZXJiYWxsTWVudUl0ZW1zKCkgLy9yZXNwb25zZS5pc1ZhbGlkRXh0ZW5zaW9uKTtcbiAgICAgICAgICAgICAgICAgIC8vcmVzdG9yZUVtYWlsSW5zaWdodHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgaWYgKGN1cnJVcmxGcmFnbWVudCAmJiBjdXJyVXJsRnJhZ21lbnQgPT0gbWt0b015TWFya2V0b0ZyYWdtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJyaWRlVGlsZVRpbWVyQ291bnQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIEFQUC5vdmVycmlkZUhvbWVUaWxlcygpIC8vcmVzcG9uc2UuaXNWYWxpZEV4dGVuc2lvbik7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IGNoZWNrQmFkRXh0ZW5zaW9uIE1zZyA+IFJlc3BvbnNlOiAnICsgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpKVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgIExJQi52YWxpZGF0ZURlbW9FeHRlbnNpb25DaGVjayh0cnVlKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBMSUIudmFsaWRhdGVEZW1vRXh0ZW5zaW9uQ2hlY2soZmFsc2UpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBjaGVja0JhZEV4dGVuc2lvbiBNc2cgPiBFcnJvcjogJyArIEpTT04uc3RyaW5naWZ5KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFyZXNwb25zZSkge1xuICAgICAgICAgICAgTElCLnZhbGlkYXRlRGVtb0V4dGVuc2lvbkNoZWNrKHRydWUpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIExJQi52YWxpZGF0ZURlbW9FeHRlbnNpb25DaGVjayhmYWxzZSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IGNoZWNrRXh0ZW5zaW9uVmVyc2lvbiBNc2cgPiBFcnJvcjogJyArIEpTT04uc3RyaW5naWZ5KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG5cbiAgICBpZiAoTWt0UGFnZS51c2VyaWQgJiYgTWt0UGFnZS51c2VyTmFtZSkge1xuICAgICAgbGV0IG1rdG9Sb2xlID0gTWt0UGFnZS51c2VyTmFtZS5tYXRjaCgvXFxbW15cXF1dK1xcXS8pXG5cbiAgICAgIGlmIChta3RvUm9sZSAhPSBudWxsKSB7XG4gICAgICAgIG1rdG9Sb2xlID0gbWt0b1JvbGVbMF0ucmVwbGFjZSgvXlxcWyhbXlxcXV0rKV0kLywgJyQxJylcbiAgICAgIH1cbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKGV4dGVuc2lvbklkLCB7XG4gICAgICAgIGFjdGlvbjogJ3NldE1rdG9Db29raWVzJyxcbiAgICAgICAgbWt0b1VzZXJJZDogTWt0UGFnZS51c2VyaWQsXG4gICAgICAgIG1rdG9OYW1lOiBNa3RQYWdlLnVzZXJOYW1lLnJlcGxhY2UoLyA/XFxbW15cXF1dK1xcXS8sICcnKSxcbiAgICAgICAgbWt0b1JvbGU6IG1rdG9Sb2xlXG4gICAgICB9KVxuXG4gICAgICBBUFAuc2VuZE1rdG9NZXNzYWdlKGFjY291bnRTdHJpbmcsIG1rdG9Sb2xlLCB1c2VyTmFtZSlcbiAgICB9XG5cbiAgICBpZiAoY3VyclVybEZyYWdtZW50KSB7XG4gICAgICBpZiAoY3VyclVybEZyYWdtZW50ID09IG1rdG9BY2NvdW50QmFzZWRNYXJrZXRpbmdGcmFnbWVudCkge1xuICAgICAgICBBUFAuZGlzYWJsZUFjY291bnRBSSgpXG4gICAgICAgIGxldCBuYXZJdGVtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3g0LXRhYi1jZW50ZXInKSxcbiAgICAgICAgICBvcmlnTmF2SXRlbU9uQ2xpY2tcblxuICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbmF2SXRlbXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgbGV0IG5hdkJ1dHRvbiA9IG5hdkl0ZW1zW2lpXS5wYXJlbnROb2RlLnBhcmVudE5vZGUsXG4gICAgICAgICAgICBuYXZJdGVtID0gbmF2SXRlbXNbaWldLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3g0LXRhYi1pbm5lcicpXG5cbiAgICAgICAgICBpZiAobmF2SXRlbS5sZW5ndGggPiAwICYmIG5hdkl0ZW1bMF0uaW5uZXJIVE1MKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9yaWdOYXZJdGVtT25DbGljayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICBvcmlnTmF2SXRlbU9uQ2xpY2sgPSBuYXZCdXR0b24ub25jbGlja1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmF2QnV0dG9uLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIC8vZGVidWdnZXI7XG4gICAgICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ2FkZFByb3AnLCB7YXJlYTogJ0FCTScsIGFzc2V0VHlwZTogTElCLmZvcm1hdFRleHQodGhpcy5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCd4NC10YWItaW5uZXInKVswXS5pbm5lckhUTUwpfSlcblxuICAgICAgICAgICAgICBpZiAodHlwZW9mIG9yaWdOYXZJdGVtT25DbGljayA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgb3JpZ05hdkl0ZW1PbkNsaWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCd4NC10YWItdG9wLWFjdGl2ZScpLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCd4NC10YWItdG9wLWFjdGl2ZScpWzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3g0LXRhYi1pbm5lcicpLmxlbmd0aCA+IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgQVBQLmhlYXBUcmFjaygnYWRkUHJvcCcsIHthcmVhOiAnQUJNJywgYXNzZXRUeXBlOiBMSUIuZm9ybWF0VGV4dChkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCd4NC10YWItdG9wLWFjdGl2ZScpWzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3g0LXRhYi1pbm5lcicpWzBdLmlubmVySFRNTCl9KVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudCA9PSBta3RvTXlNYXJrZXRvRnJhZ21lbnQpIHtcbiAgICAgICAgb3ZlcnJpZGVUaWxlVGltZXJDb3VudCA9IHRydWVcbiAgICAgICAgQVBQLm92ZXJyaWRlSG9tZVRpbGVzKCkgLy9yZXN0b3JlRW1haWxJbnNpZ2h0cyk7XG4gICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdNeSBNYXJrZXRvJywgYXNzZXROYW1lOiAnSG9tZSd9KVxuICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9EaXNhYmxlQnV0dG9uc0ZyYWdtZW50TWF0Y2gpICE9IC0xKSB7XG4gICAgICAgIEFQUC5kaXNhYmxlQnV0dG9ucygpXG4gICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudCA9PSBta3RvQWRtaW5XZWJTa3lGcmFnbWVudCkge1xuICAgICAgICBBUFAuZGlzYWJsZUNoZWNrYm94ZXMoKVxuICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9BbmFseXRpY3NIb21lRnJhZ21lbnQpICE9IC0xKSB7XG4gICAgICAgIEFQUC5vdmVycmlkZUFuYWx5dGljc1RpbGVzKClcbiAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50LnNlYXJjaCgnXicgKyBBUFAuZ2V0QXNzZXRDb21wQ29kZSgnTnVydHVyZSBQcm9ncmFtJykgKyAnWzAtOV0rQTEkJykgIT0gLTEpIHtcbiAgICAgICAgQVBQLmRpc2FibGVOdXJ0dXJlUHJvZ3JhbXMoKVxuICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQgPT0gbWt0b0FkQnJpZGdlU21hcnRMaXN0RnJhZ21lbnQpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEFkIEJyaWRnZSBTbWFydCBMaXN0JylcbiAgICAgICAgQVBQLm9wZW5BZEJyaWRnZU1vZGFsKClcbiAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50ID09IG1rdG9BZG1pblNhbGVzZm9yY2VGcmFnbWVudCB8fCBjdXJyVXJsRnJhZ21lbnQgPT0gbWt0b0FkbWluRHluYW1pY3NGcmFnbWVudCkge1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogQWRtaW4gPiBDUk0nKVxuICAgICAgICBBUFAuaGlkZU90aGVyVG9vbGJhckl0ZW1zKFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZDogJ2VuYWJsZVN5bmMnLCAvL0VuYWJsZS9EaXNhYmxlIFN5bmNcbiAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgfVxuICAgICAgICBdKVxuICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQgPT0gbWt0b0FkbWluUmNhQ3VzdG9tRmllbGRTeW5jKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBBZG1pbiA+IFJldmVudWUgQ3ljbGUgQW5hbHl0aWNzID4gQ3VzdG9tIEZpZWxkIFN5bmMnKVxuICAgICAgICBBUFAuaGlkZU90aGVyVG9vbGJhckl0ZW1zKFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZDogJ2NhZENoYW5nZUJ1dHRvbicsIC8vRWRpdCBTeW5jIE9wdGlvblxuICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICB9XG4gICAgICAgIF0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gT25seSBleGVjdXRlIHRoaXMgYmxvY2sgaWYgdGhlIHVzZXIgaXMgbm90IG9uIGFuIGVkaXRvciBwYWdlLlxuICAgIGlmIChcbiAgICAgIGN1cnJVcmxGcmFnbWVudCAmJlxuICAgICAgY3VyclVybEZyYWdtZW50LnNlYXJjaChta3RvQW5hbHl0aWNzRnJhZ21lbnRNYXRjaCkgPT0gLTEgJiZcbiAgICAgICghY3VyckNvbXBGcmFnbWVudCB8fFxuICAgICAgICAoY3VyckNvbXBGcmFnbWVudC5zZWFyY2gobWt0b0FibUZyYWdtZW50TWF0Y2gpID09IC0xICYmIGN1cnJDb21wRnJhZ21lbnQuc2VhcmNoKG1rdG9EZXNpZ25lcnNGcmFnbWVudE1hdGNoKSA9PSAtMSkpXG4gICAgKSB7XG4gICAgICBpZiAoYWNjb3VudFN0cmluZy5zZWFyY2gobWt0b0FjY291bnRTdHJpbmdzMTA2TWF0Y2gpICE9IC0xKSB7XG4gICAgICAgIC8vQVBQLmRpc2NhcmREcmFmdHMoYWNjb3VudFN0cmluZywgXCJsYW5kaW5nUGFnZVwiKTtcbiAgICAgICAgQVBQLm92ZXJyaWRlVHJlZU5vZGVFeHBhbmQoKVxuICAgICAgICBBUFAub3ZlcnJpZGVUcmVlTm9kZUNvbGxhcHNlKClcbiAgICAgICAgQVBQLm92ZXJyaWRlU2F2aW5nKClcbiAgICAgICAgQVBQLmRpc2FibGVEcmFnQW5kRHJvcCgpXG4gICAgICAgIEFQUC5kaXNhYmxlTWVudXMoKVxuICAgICAgICBBUFAuaGlkZVRvb2xiYXJJdGVtcygpXG4gICAgICAgIEFQUC5vdmVycmlkZURyYWZ0RWRpdHMoKVxuICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgIEFQUC5kaXNhYmxlRm9ybURlbGV0ZUJ1dHRvbnMoKVxuICAgICAgICBBUFAuZGlzYWJsZUhhcm1mdWxTYXZlQnV0dG9ucygpXG4gICAgICAgIEFQUC5vdmVycmlkZVNtYXJ0Q2FtcGFpZ25TYXZpbmcoKVxuICAgICAgICBBUFAudHJhY2tOb2RlQ2xpY2soKVxuICAgICAgICBBUFAudHJhY2tUcmVlTm9kZUVkaXRzKClcbiAgICAgICAgQVBQLm92ZXJyaWRlQXNzZXRTYXZlRWRpdCgpXG4gICAgICAgIEFQUC5vdmVycmlkZVJlbmFtaW5nRm9sZGVycygpXG4gICAgICAgIEFQUC5vdmVycmlkZUNhbnZhcygpXG4gICAgICAgIEFQUC5vdmVycmlkZVVwZGF0ZVBvcnRsZXRPcmRlcigpXG4gICAgICAgIEFQUC5kaXNhYmxlQ29uZmlybWF0aW9uTWVzc2FnZSgpXG4gICAgICAgIEFQUC5kaXNhYmxlUmVxdWVzdHMoKVxuICAgICAgICBBUFAub3ZlcnJpZGVOZXdQcm9ncmFtQ3JlYXRlKClcbiAgICAgICAgQVBQLm92ZXJyaWRlTmV3QXNzZXRDcmVhdGUoKVxuICAgICAgICBBUFAub3ZlcnJpZGVOZXdGb2xkZXJzKClcbiAgICAgICAgQVBQLmhpZGVGb2xkZXJzT25JbXBvcnQoKVxuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnTGFzdCBMb2FkZWQnLCBhc3NldE5hbWU6ICdQYWdlJ30pXG4gICAgICB9IGVsc2UgaWYgKGFjY291bnRTdHJpbmcgPT0gbWt0b0FjY291bnRTdHJpbmdNYXN0ZXIgfHwgYWNjb3VudFN0cmluZyA9PSBta3RvQWNjb3VudFN0cmluZ01hc3Rlck1FVUUpIHtcbiAgICAgICAgLy9UT0RPXG4gICAgICAgIEFQUC5vdmVycmlkZVRyZWVOb2RlRXhwYW5kKClcbiAgICAgICAgQVBQLm92ZXJyaWRlVHJlZU5vZGVDb2xsYXBzZSgpXG4gICAgICAgIEFQUC5vdmVycmlkZVNhdmluZygpXG4gICAgICAgIEFQUC5kaXNhYmxlRHJhZ0FuZERyb3AoKVxuICAgICAgICBBUFAuZGlzYWJsZU1lbnVzKClcbiAgICAgICAgQVBQLmhpZGVUb29sYmFySXRlbXMoKVxuICAgICAgICBBUFAub3ZlcnJpZGVEcmFmdEVkaXRzKClcbiAgICAgICAgQVBQLmRpc2FibGVGb3JtU2F2ZUJ1dHRvbnMoKVxuICAgICAgICBBUFAuZGlzYWJsZUZvcm1EZWxldGVCdXR0b25zKClcbiAgICAgICAgQVBQLmRpc2FibGVIYXJtZnVsU2F2ZUJ1dHRvbnMoKVxuICAgICAgICBBUFAub3ZlcnJpZGVTbWFydENhbXBhaWduU2F2aW5nKClcbiAgICAgICAgQVBQLnRyYWNrTm9kZUNsaWNrKClcbiAgICAgICAgQVBQLnRyYWNrVHJlZU5vZGVFZGl0cygpXG4gICAgICAgIEFQUC5vdmVycmlkZUFzc2V0U2F2ZUVkaXQoKVxuICAgICAgICBBUFAub3ZlcnJpZGVSZW5hbWluZ0ZvbGRlcnMoKVxuICAgICAgICBBUFAub3ZlcnJpZGVDYW52YXMoKVxuICAgICAgICBBUFAub3ZlcnJpZGVVcGRhdGVQb3J0bGV0T3JkZXIoKVxuICAgICAgICBBUFAuZGlzYWJsZUNvbmZpcm1hdGlvbk1lc3NhZ2UoKVxuICAgICAgICBBUFAuZGlzYWJsZVJlcXVlc3RzKClcbiAgICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ0xhc3QgTG9hZGVkJywgYXNzZXROYW1lOiAnUGFnZSd9KVxuICAgICAgfSBlbHNlIGlmIChhY2NvdW50U3RyaW5nID09IG1rdG9BY2NvdW50U3RyaW5nRHluYW1pY3MpIHtcbiAgICAgICAgQVBQLm92ZXJyaWRlVHJlZU5vZGVFeHBhbmQoKVxuICAgICAgICBBUFAub3ZlcnJpZGVUcmVlTm9kZUNvbGxhcHNlKClcbiAgICAgICAgQVBQLm92ZXJyaWRlU2F2aW5nKClcbiAgICAgICAgQVBQLmRpc2FibGVEcmFnQW5kRHJvcCgpXG4gICAgICAgIEFQUC5kaXNhYmxlTWVudXMoKVxuICAgICAgICBBUFAuaGlkZVRvb2xiYXJJdGVtcygpXG4gICAgICAgIEFQUC5vdmVycmlkZURyYWZ0RWRpdHMoKVxuICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgIEFQUC5kaXNhYmxlRm9ybURlbGV0ZUJ1dHRvbnMoKVxuICAgICAgICBBUFAuZGlzYWJsZUhhcm1mdWxTYXZlQnV0dG9ucygpXG4gICAgICAgIEFQUC5vdmVycmlkZVNtYXJ0Q2FtcGFpZ25TYXZpbmcoKVxuICAgICAgICBBUFAudHJhY2tUcmVlTm9kZUVkaXRzKClcbiAgICAgICAgQVBQLm92ZXJyaWRlQXNzZXRTYXZlRWRpdCgpXG4gICAgICAgIEFQUC5vdmVycmlkZVJlbmFtaW5nRm9sZGVycygpXG4gICAgICAgIEFQUC5vdmVycmlkZUNhbnZhcygpXG4gICAgICAgIEFQUC5vdmVycmlkZVVwZGF0ZVBvcnRsZXRPcmRlcigpXG4gICAgICAgIEFQUC5kaXNhYmxlQ29uZmlybWF0aW9uTWVzc2FnZSgpXG4gICAgICAgIEFQUC5kaXNhYmxlUmVxdWVzdHMoKVxuICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnTGFzdCBMb2FkZWQnLCBhc3NldE5hbWU6ICdQYWdlJ30pXG4gICAgICB9IGVsc2UgaWYgKGFjY291bnRTdHJpbmcgPT0gbWt0b0FjY291bnRTdHJpbmdRZSkge1xuICAgICAgICBBUFAuZGlzYWJsZU1lbnVzKClcbiAgICAgICAgQVBQLmhpZGVUb29sYmFySXRlbXMoKVxuICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgIEFQUC5kaXNhYmxlRm9ybURlbGV0ZUJ1dHRvbnMoKVxuICAgICAgICBBUFAuZGlzYWJsZUhhcm1mdWxTYXZlQnV0dG9ucygpXG4gICAgICAgIEFQUC5vdmVycmlkZUFzc2V0U2F2ZUVkaXQoKVxuICAgICAgICBBUFAub3ZlcnJpZGVSZW5hbWluZ0ZvbGRlcnMoKVxuICAgICAgfSBlbHNlIGlmICh0b2dnbGVTdGF0ZSA9PSAnZmFsc2UnKSB7XG4gICAgICAgIEFQUC5vdmVycmlkZVNhdmluZygpXG4gICAgICAgIEFQUC5vdmVycmlkZVNtYXJ0Q2FtcGFpZ25TYXZpbmcoKVxuICAgICAgICBBUFAub3ZlcnJpZGVVcGRhdGVQb3J0bGV0T3JkZXIoKVxuICAgICAgICBBUFAuZGlzYWJsZUNvbmZpcm1hdGlvbk1lc3NhZ2UoKVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY3VyckNvbXBGcmFnbWVudCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IERlc2lnbmVycywgQUJNIEFyZWFzJylcbiAgICAgIHN3aXRjaCAoY3VyckNvbXBGcmFnbWVudCkge1xuICAgICAgICBjYXNlIG1rdG9BYm1EaXNjb3Zlck1hcmtldG9Db21wYW5pZXNGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogQUJNID4gRGlzY292ZXIgTWFya2V0byBDb21wYW5pZXMnKVxuICAgICAgICAgIEFQUC5kaXNhYmxlTWVudXMoKVxuICAgICAgICAgIEFQUC5oaWRlVG9vbGJhckl0ZW1zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmRpc2FibGVGb3JtRGVsZXRlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmRpc2FibGVIYXJtZnVsU2F2ZUJ1dHRvbnMoKVxuICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdMYXN0IExvYWRlZCcsIGFzc2V0TmFtZTogJ1BhZ2UnfSlcbiAgICAgICAgICBBUFAuaGVhcFRyYWNrKCdhZGRQcm9wJywge2FyZWE6ICdBQk0nLCBhc3NldFR5cGU6ICdEaXNjb3ZlciBNYXJrZXRvIENvbXBhbmllcyd9KVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0FibURpc2NvdmVyQ3JtQWNjb3VudHNGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogQUJNID4gRGlzY292ZXIgQ1JNIEFjY291bnRzJylcbiAgICAgICAgICBBUFAuZGlzYWJsZU1lbnVzKClcbiAgICAgICAgICBBUFAuaGlkZVRvb2xiYXJJdGVtcygpXG4gICAgICAgICAgQVBQLmRpc2FibGVGb3JtU2F2ZUJ1dHRvbnMoKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRm9ybURlbGV0ZUJ1dHRvbnMoKVxuICAgICAgICAgIEFQUC5kaXNhYmxlSGFybWZ1bFNhdmVCdXR0b25zKClcbiAgICAgICAgICBBUFAuaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnTGFzdCBMb2FkZWQnLCBhc3NldE5hbWU6ICdQYWdlJ30pXG4gICAgICAgICAgQVBQLmhlYXBUcmFjaygnYWRkUHJvcCcsIHthcmVhOiAnQUJNJywgYXNzZXRUeXBlOiAnRGlzY292ZXIgQ1JNIEFjY291bnRzJ30pXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvQWJtTmFtZWRBY2NvdW50RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEFCTSA+IE5hbWVkIEFjY291bnQnKVxuICAgICAgICAgIEFQUC5kaXNhYmxlTWVudXMoKVxuICAgICAgICAgIEFQUC5oaWRlVG9vbGJhckl0ZW1zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmRpc2FibGVGb3JtRGVsZXRlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmRpc2FibGVIYXJtZnVsU2F2ZUJ1dHRvbnMoKVxuICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdMYXN0IExvYWRlZCcsIGFzc2V0TmFtZTogJ1BhZ2UnfSlcbiAgICAgICAgICBBUFAuaGVhcFRyYWNrKCdhZGRQcm9wJywge2FyZWE6ICdBQk0nLCBhc3NldFR5cGU6ICdOYW1lZCBBY2NvdW50J30pXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvQWJtSW1wb3J0TmFtZWRBY2NvdW50c0ZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBBQk0gPiBJbXBvcnQgTmFtZWQgQWNjb3VudHMnKVxuICAgICAgICAgIEFQUC5kaXNhYmxlTWVudXMoKVxuICAgICAgICAgIEFQUC5oaWRlVG9vbGJhckl0ZW1zKClcbiAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmRpc2FibGVGb3JtRGVsZXRlQnV0dG9ucygpXG4gICAgICAgICAgQVBQLmRpc2FibGVIYXJtZnVsU2F2ZUJ1dHRvbnMoKVxuICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdMYXN0IExvYWRlZCcsIGFzc2V0TmFtZTogJ1BhZ2UnfSlcbiAgICAgICAgICBBUFAuaGVhcFRyYWNrKCdhZGRQcm9wJywge2FyZWE6ICdBQk0nLCBhc3NldFR5cGU6ICdJbXBvcnQgTmFtZWQgQWNjb3VudHMnfSlcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9MYW5kaW5nUGFnZUVkaXRGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogTGFuZGluZyBQYWdlIEVkaXRvcicpXG4gICAgICAgICAgQVBQLnJlc2V0R29sZGVuTGFuZGluZ1BhZ2VQcm9wcygpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnbGFuZGluZ1BhZ2UnLCAnZWRpdCcpXG4gICAgICAgICAgQVBQLmRpc2FibGVGb3JtU2F2ZUJ1dHRvbnMoKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0xhbmRpbmdQYWdlUHJldmlld0ZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBMYW5kaW5nIFBhZ2UgUHJldmlld2VyJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdsYW5kaW5nUGFnZScsICdwcmV2aWV3JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9MYW5kaW5nUGFnZVByZXZpZXdEcmFmdEZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBMYW5kaW5nIFBhZ2UgRHJhZnQgUHJldmlld2VyJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdsYW5kaW5nUGFnZScsICdwcmV2aWV3JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9MYW5kaW5nUGFnZVRlbXBsYXRlRWRpdEZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBMYW5kaW5nIFBhZ2UgVGVtcGxhdGUgRWRpdG9yJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdsYW5kaW5nUGFnZScsICd0ZW1wbGF0ZUVkaXQnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0xhbmRpbmdQYWdlVGVtcGxhdGVQcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IExhbmRpbmcgUGFnZSBUZW1wbGF0ZSBQcmV2aWV3ZXInKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2xhbmRpbmdQYWdlJywgJ3RlbXBsYXRlUHJldmlldycpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvRW1haWxFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgaWYgKGN1cnJVcmxGcmFnbWVudCA9PSBta3RvRW1haWxFZGl0RnJhZ21lbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBFbWFpbCBUZW1wbGF0ZSBQaWNrZXInKVxuICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnZW1haWwnLCAndGVtcGxhdGVQaWNrZXInKVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50LnNlYXJjaChta3RvRW1haWxQcmV2aWV3RnJhZ21lbnRSZWdleCkgPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBFbWFpbCBFZGl0b3InKVxuICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnZW1haWwnLCAnZWRpdCcpXG4gICAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBFbWFpbCBQcmV2aWV3ZXInKVxuICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnZW1haWwnLCAncHJldmlldycpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0VtYWlsVGVtcGxhdGVFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEVtYWlsIFRlbXBsYXRlIEVkaXRvcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnZW1haWwnLCAndGVtcGxhdGVFZGl0JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9Gb3JtRWRpdEZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBGb3JtIEVkaXRvcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnZm9ybScsICdlZGl0JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9Gb3JtUHJldmlld0ZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBGb3JtIFByZXZpZXdlcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnZm9ybScsICdwcmV2aWV3JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9Gb3JtUHJldmlld0RyYWZ0RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEZvcm0gRHJhZnQgUHJldmlld2VyJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdmb3JtJywgJ3ByZXZpZXcnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b1B1c2hOb3RpZmljYXRpb25FZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFB1c2ggTm90aWZpY2F0aW9uIEVkaXRvcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygncHVzaE5vdGlmaWNhdGlvbicsICdlZGl0JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9Nb2JpbGVQdXNoTm90aWZpY2F0aW9uUHJldmlld0ZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBQdXNoIE5vdGlmaWNhdGlvbiBQcmV2aWV3ZXInKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ3B1c2hOb3RpZmljYXRpb24nLCAncHJldmlldycpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvSW5BcHBNZXNzYWdlRWRpdEZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBJbi1BcHAgTWVzc2FnZSBFZGl0b3InKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2luQXBwTWVzc2FnZScsICdlZGl0JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9JbkFwcE1lc3NhZ2VQcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEluLUFwcCBNZXNzYWdlIFByZXZpZXdlcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnaW5BcHBNZXNzYWdlJywgJ3ByZXZpZXcnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b1Ntc01lc3NhZ2VFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFNNUyBNZXNzYWdlIEVkaXRvcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnc21zTWVzc2FnZScsICdlZGl0JylcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIG1rdG9Tb2NpYWxBcHBFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFNvY2lhbCBBcHAgRWRpdG9yJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdzb2NpYWxBcHAnLCAnZWRpdCcpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvU29jaWFsQXBwUHJldmlld0ZyYWdtZW50OlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBTb2NpYWwgQXBwIFByZXZpZXdlcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnc29jaWFsQXBwJywgJ3ByZXZpZXcnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgbWt0b0FiVGVzdEVkaXRGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogQS9CIFRlc3QgV2l6YXJkJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdhYlRlc3QnLCAnZWRpdCcpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvRW1haWxUZXN0R3JvdXBFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEVtYWlsIFRlc3QgR3JvdXAgV2l6YXJkJylcbiAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdhYlRlc3QnLCAnZWRpdCcpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvU25pcHBldEVkaXRGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogU25pcHBldCBFZGl0b3InKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ3NuaXBwZXQnLCAnZWRpdCcpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSBta3RvU25pcHBldFByZXZpZXdGcmFnbWVudDpcbiAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogU25pcHBldCBQcmV2aWV3ZXInKVxuICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ3NuaXBwZXQnLCAncHJldmlldycpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50ICYmIGN1cnJVcmxGcmFnbWVudC5zZWFyY2gobWt0b0FuYWx5dGljc0ZyYWdtZW50TWF0Y2gpICE9IC0xKSB7XG4gICAgICBpZiAoY3VyclVybEZyYWdtZW50LnNlYXJjaChta3RvQW5hbHl6ZXJzRnJhZ21lbnRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEdvbGRlbiBBbmFseXRpY3MnKVxuICAgICAgICBBUFAudXBkYXRlTmF2QmFyKClcbiAgICAgIH1cblxuICAgICAgaWYgKGN1cnJVcmxGcmFnbWVudC5zZWFyY2gobWt0b1JlcG9ydEZyYWdtZW50UmVnZXgpICE9IC0xKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBGdWxsc2NyZWVuIFJlcG9ydCcpXG4gICAgICAgIEFQUC5kaXNhYmxlQW5hbHl0aWNzU2F2aW5nKCdyZXBvcnQnKVxuICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9Nb2RlbGVyRnJhZ21lbnRSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNlYXJjaChta3RvTW9kZWxlclByZXZpZXdGcmFnbWVudFJlZ2V4KSA9PSAtMSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBSZXZlbnVlIEN5Y2xlIE1vZGVsIEVkaXRvcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVBbmFseXRpY3NTYXZpbmcoJ21vZGVsJywgJ2VkaXQnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBSZXZlbnVlIEN5Y2xlIE1vZGVsIFByZXZpZXdlcicpXG4gICAgICAgICAgQVBQLmRpc2FibGVBbmFseXRpY3NTYXZpbmcoJ21vZGVsJywgJ3ByZXZpZXcnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZSA9PSBta3RvUGVyc29uRGV0YWlsUGF0aCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IExlYWQgRGF0YWJhc2UgPiBQZXJzb24gRGV0YWlsJylcbiAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzTWt0UGFnZUFwcClcbiAgICAgIGlmIChNa3RQYWdlLnNhdmVkU3RhdGUgJiYgTWt0UGFnZS5zYXZlZFN0YXRlLm11bmNoa2luSWQpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gY2hlY2tNa3RvQ29va2llIE1zZycpXG4gICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKFxuICAgICAgICAgIGV4dGVuc2lvbklkLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2NoZWNrTWt0b0Nvb2tpZScsXG4gICAgICAgICAgICBtdW5jaGtpbklkOiBNa3RQYWdlLnNhdmVkU3RhdGUubXVuY2hraW5JZFxuICAgICAgICAgIH0sXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2UgfHwgIXJlc3BvbnNlLmlzQWRtaW4pIHtcbiAgICAgICAgICAgICAgQVBQLmRpc2FibGVSZXF1ZXN0cygpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBjaGVja01rdG9Db29raWUgTXNnID4gU2F2aW5nIEVuYWJsZWQgZm9yIEFkbWluJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gY2hlY2tNa3RvQ29va2llIE1zZyA+IEVycm9yOiAnICsgSlNPTi5zdHJpbmdpZnkoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIEFQUC5kaXNhYmxlUmVxdWVzdHMoKVxuICAgICAgfVxuICAgICAgQVBQLmhlYXBUcmFjaygndHJhY2snLCB7bmFtZTogJ0xhc3QgTG9hZGVkJywgYXNzZXROYW1lOiAnUGFnZSd9KVxuICAgIH1cblxuICAgIHdpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IFdpbmRvdzogUmVzaXplJylcbiAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKG1rdG9NeU1hcmtldG9GcmFnbWVudCkgPj0gMCkge1xuICAgICAgICBzZXRUaW1lb3V0KEFQUC5vdmVycmlkZUhvbWVUaWxlc1Jlc2l6ZSwgMTAwMClcbiAgICAgIH1cbiAgICB9XG5cbiAgICB3aW5kb3cub25oYXNoY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gV2luZG93OiBIYXNoIENoYW5nZWQnKVxuICAgICAgLy8gR2V0dGluZyB0aGUgVVJMIGZyYWdtZW50LCB0aGUgcGFydCBhZnRlciB0aGUgI1xuICAgICAgbGV0IGlzTmV3VXJsRnJhZ21lbnQgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLkRMLmdldERsVG9rZW4nKSAmJiBNa3QzLkRMLmdldERsVG9rZW4oKSkge1xuICAgICAgICAgIGlmIChjdXJyVXJsRnJhZ21lbnQgIT0gTWt0My5ETC5nZXREbFRva2VuKCkpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzTmV3VXJsRnJhZ21lbnQpXG5cbiAgICAgICAgICAgIGlmIChjdXJyVXJsRnJhZ21lbnQgPT0gbWt0b015TWFya2V0b1N1cGVyYmFsbEZyYWdtZW50ICYmIE1rdDMuREwuZ2V0RGxUb2tlbigpID09IG1rdG9NeU1hcmtldG9GcmFnbWVudCkge1xuICAgICAgICAgICAgICBvdmVycmlkZVRpbGVUaW1lckNvdW50ID0gdHJ1ZVxuICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQVBQLm92ZXJyaWRlSG9tZVRpbGVzKCkgLy9yZXN0b3JlRW1haWxJbnNpZ2h0cyk7XG4gICAgICAgICAgICAgIH0sIDEwMDApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnJVcmxGcmFnbWVudCA9IE1rdDMuREwuZ2V0RGxUb2tlbigpXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2FkZWQ6IE5ldyBVUkwgRnJhZ21lbnQgPSAnICsgY3VyclVybEZyYWdtZW50KVxuICAgICAgICAgICAgaWYgKGN1cnJVcmxGcmFnbWVudCA9PSBta3RvTXlNYXJrZXRvRnJhZ21lbnQpIHtcbiAgICAgICAgICAgICAgb3ZlcnJpZGVUaWxlVGltZXJDb3VudCA9IHRydWVcbiAgICAgICAgICAgICAgQVBQLm92ZXJyaWRlSG9tZVRpbGVzKCkgLy9yZXN0b3JlRW1haWxJbnNpZ2h0cyk7XG4gICAgICAgICAgICAgIEFQUC5oZWFwVHJhY2soJ3RyYWNrJywge25hbWU6ICdNeSBNYXJrZXRvJywgYXNzZXROYW1lOiAnSG9tZSd9KVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9EaXNhYmxlQnV0dG9uc0ZyYWdtZW50TWF0Y2gpICE9IC0xKSB7XG4gICAgICAgICAgICAgIEFQUC5kaXNhYmxlQnV0dG9ucygpXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudCA9PT0gbWt0b0FkbWluV2ViU2t5RnJhZ21lbnQpIHtcbiAgICAgICAgICAgICAgQVBQLmRpc2FibGVDaGVja2JveGVzKClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50LnNlYXJjaChta3RvQWNjb3VudEJhc2VkTWFya2V0aW5nRnJhZ21lbnQpICE9IC0xKSB7XG4gICAgICAgICAgICAgIEFQUC5kaXNhYmxlQWNjb3VudEFJKClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50LnNlYXJjaChta3RvQW5hbHl0aWNzSG9tZUZyYWdtZW50KSAhPSAtMSkge1xuICAgICAgICAgICAgICBBUFAub3ZlcnJpZGVBbmFseXRpY3NUaWxlcygpXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudC5zZWFyY2goJ14nICsgQVBQLmdldEFzc2V0Q29tcENvZGUoJ051cnR1cmUgUHJvZ3JhbScpICsgJ1swLTldK0ExJCcpICE9IC0xKSB7XG4gICAgICAgICAgICAgIEFQUC5kaXNhYmxlTnVydHVyZVByb2dyYW1zKClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50ID09IG1rdG9BZG1pblNhbGVzZm9yY2VGcmFnbWVudCB8fCBjdXJyVXJsRnJhZ21lbnQgPT0gbWt0b0FkbWluRHluYW1pY3NGcmFnbWVudCkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogQWRtaW4gPiBDUk0nKVxuICAgICAgICAgICAgICBBUFAuaGlkZU90aGVyVG9vbGJhckl0ZW1zKFt7XG4gICAgICAgICAgICAgICAgaWQ6ICdlbmFibGVTeW5jJywgLy9FbmFibGUvRGlzYWJsZSBTeW5jXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0VmlzaWJsZSdcbiAgICAgICAgICAgICAgfV0pXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJVcmxGcmFnbWVudCA9PSBta3RvQWRtaW5SY2FDdXN0b21GaWVsZFN5bmMpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEFkbWluID4gUmV2ZW51ZSBDeWNsZSBBbmFseXRpY3MgPiBDdXN0b20gRmllbGQgU3luYycpXG4gICAgICAgICAgICAgIEFQUC5oaWRlT3RoZXJUb29sYmFySXRlbXMoW3tcbiAgICAgICAgICAgICAgICBpZDogJ2NhZENoYW5nZUJ1dHRvbicsIC8vRWRpdCBTeW5jIE9wdGlvblxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3NldFZpc2libGUnXG4gICAgICAgICAgICAgIH1dKVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyVXJsRnJhZ21lbnQuc2VhcmNoKG1rdG9BbmFseXplcnNGcmFnbWVudE1hdGNoKSAhPSAtMSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogR29sZGVuIEFuYWx5dGljcycpXG4gICAgICAgICAgICAgIEFQUC51cGRhdGVOYXZCYXIoKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLkRMLmRsLmRsQ29tcENvZGUnKSkge1xuICAgICAgICAgICAgICBjdXJyQ29tcEZyYWdtZW50ID0gTWt0My5ETC5kbC5kbENvbXBDb2RlXG4gICAgICAgICAgICAgIGlmIChjdXJyQ29tcEZyYWdtZW50LnNlYXJjaChta3RvRGVzaWduZXJzRnJhZ21lbnRNYXRjaCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogRGVzaWduZXJzL1dpemFyZHMnKVxuICAgICAgICAgICAgICAgIHN3aXRjaCAoY3VyckNvbXBGcmFnbWVudCkge1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvTGFuZGluZ1BhZ2VFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBMYW5kaW5nIFBhZ2UgRWRpdG9yJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLnJlc2V0R29sZGVuTGFuZGluZ1BhZ2VQcm9wcygpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2xhbmRpbmdQYWdlJywgJ2VkaXQnKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9MYW5kaW5nUGFnZVByZXZpZXdGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IExhbmRpbmcgUGFnZSBQcmV2aWV3ZXInKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdsYW5kaW5nUGFnZScsICdwcmV2aWV3JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b0xhbmRpbmdQYWdlUHJldmlld0RyYWZ0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBMYW5kaW5nIFBhZ2UgRHJhZnQgUHJldmlld2VyJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnbGFuZGluZ1BhZ2UnLCAncHJldmlldycpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9MYW5kaW5nUGFnZVRlbXBsYXRlRWRpdEZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogTGFuZGluZyBQYWdlIFRlbXBsYXRlIEVkaXRvcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2xhbmRpbmdQYWdlJywgJ3RlbXBsYXRlRWRpdCcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9MYW5kaW5nUGFnZVRlbXBsYXRlUHJldmlld0ZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogTGFuZGluZyBQYWdlIFRlbXBsYXRlIFByZXZpZXdlcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2xhbmRpbmdQYWdlJywgJ3RlbXBsYXRlUHJldmlldycpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9FbWFpbEVkaXRGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJVcmxGcmFnbWVudCA9PSBta3RvRW1haWxFZGl0RnJhZ21lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogRW1haWwgVGVtcGxhdGUgUGlja2VyJylcbiAgICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdlbWFpbCcsICd0ZW1wbGF0ZVBpY2tlcicpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclVybEZyYWdtZW50LnNlYXJjaChta3RvRW1haWxQcmV2aWV3RnJhZ21lbnRSZWdleCkgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogRW1haWwgRWRpdG9yJylcbiAgICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdlbWFpbCcsICdlZGl0JylcbiAgICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZUZvcm1TYXZlQnV0dG9ucygpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEVtYWlsIFByZXZpZXdlcicpXG4gICAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnZW1haWwnLCAncHJldmlldycpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b0VtYWlsVGVtcGxhdGVFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBFbWFpbCBUZW1wbGF0ZSBFZGl0b3InKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdlbWFpbCcsICd0ZW1wbGF0ZUVkaXQnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvRm9ybUVkaXRGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IEZvcm0gRWRpdG9yJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnZm9ybScsICdlZGl0JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b0Zvcm1QcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBGb3JtIFByZXZpZXdlcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2Zvcm0nLCAncHJldmlldycpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9Gb3JtUHJldmlld0RyYWZ0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBGb3JtIERyYWZ0IFByZXZpZXdlcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2Zvcm0nLCAncHJldmlldycpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9QdXNoTm90aWZpY2F0aW9uRWRpdEZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogUHVzaCBOb3RpZmljYXRpb24gRWRpdG9yJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygncHVzaE5vdGlmaWNhdGlvbicsICdlZGl0JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b01vYmlsZVB1c2hOb3RpZmljYXRpb25QcmV2aWV3RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBQdXNoIE5vdGlmaWNhdGlvbiBQcmV2aWV3ZXInKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdwdXNoTm90aWZpY2F0aW9uJywgJ3ByZXZpZXcnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvSW5BcHBNZXNzYWdlRWRpdEZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogSW4tQXBwIE1lc3NhZ2UgRWRpdG9yJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnaW5BcHBNZXNzYWdlJywgJ2VkaXQnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvSW5BcHBNZXNzYWdlUHJldmlld0ZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogSW4tQXBwIE1lc3NhZ2UgUHJldmlld2VyJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnaW5BcHBNZXNzYWdlJywgJ3ByZXZpZXcnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvU21zTWVzc2FnZUVkaXRGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFNNUyBNZXNzYWdlIEVkaXRvcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ3Ntc01lc3NhZ2UnLCAnZWRpdCcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9Tb2NpYWxBcHBFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBTb2NpYWwgQXBwIEVkaXRvcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ3NvY2lhbEFwcCcsICdlZGl0JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b1NvY2lhbEFwcFByZXZpZXdGcmFnbWVudDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01hcmtldG8gQXBwID4gTG9jYXRpb246IFNvY2lhbCBBcHAgUHJldmlld2VyJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnc29jaWFsQXBwJywgJ3ByZXZpZXcnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvQWJUZXN0RWRpdEZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogQS9CIFRlc3QgV2l6YXJkJylcbiAgICAgICAgICAgICAgICAgICAgQVBQLmRpc2FibGVEZXNpZ25lclNhdmluZygnYWJUZXN0JywgJ2VkaXQnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgY2FzZSBta3RvRW1haWxUZXN0R3JvdXBFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBFbWFpbCBUZXN0IEdyb3VwIFdpemFyZCcpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ2FiVGVzdCcsICdlZGl0JylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIGNhc2UgbWt0b1NuaXBwZXRFZGl0RnJhZ21lbnQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNYXJrZXRvIEFwcCA+IExvY2F0aW9uOiBTbmlwcGV0IEVkaXRvcicpXG4gICAgICAgICAgICAgICAgICAgIEFQUC5kaXNhYmxlRGVzaWduZXJTYXZpbmcoJ3NuaXBwZXQnLCAnZWRpdCcpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICBjYXNlIG1rdG9TbmlwcGV0UHJldmlld0ZyYWdtZW50OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBMb2NhdGlvbjogU25pcHBldCBQcmV2aWV3ZXInKVxuICAgICAgICAgICAgICAgICAgICBBUFAuZGlzYWJsZURlc2lnbmVyU2F2aW5nKCdzbmlwcGV0JywgJ3ByZXZpZXcnKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgMClcbiAgICB9XG4gICAgQVBQLm92ZXJyaWRlU3VwZXJiYWxsTWVudUl0ZW1zKClcbiAgICAvLyBIZWFwIEFuYWx5dGljcyBJRFxuICAgIEFQUC5oZWFwVHJhY2soJ2lkJylcbiAgfVxufSwgMClcbiJdfQ==
