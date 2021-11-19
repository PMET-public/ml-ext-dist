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

console.log('Landing Page > Script: Loaded')
/**************************************************************************************
 *  This script contains all of the functionality needed for automatically submitting
 *  forms on MarketoLive Landing Pages.
 **************************************************************************************/

// eslint-disable-next-line no-var
var mktoLiveDevMunchkinId = '685-BTN-772',
  mktoLiveProdMunchkinId = '185-NGX-811',
  mktoLiveMunchkinId = mktoLiveProdMunchkinId,
  numOfVerticals = 3,
  mockLeadEndpoint = 'https://www.mockaroo.com/0799ab60/download?count=1&key=7d30cdf0',
  hostSplit = window.location.host.split('.'),
  mktoLiveDomain,
  origCookie,
  LPAGE = LPAGE || {}

LPAGE.webRequest = function (url, params, method, async, responseType, callback) {
  console.log('Web Request > ' + url + '\n' + params)
  let xmlHttp = new XMLHttpRequest(),
    result
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4) {
      if (xmlHttp.status == 200) {
        if (typeof callback === 'function') {
          result = callback(xmlHttp.response)
        } else {
          result = xmlHttp.response
        }
      } else {
        window.location.href = window.location.protocol + '//' + mktoLiveDomain + '/en/tools/auto-close'
      }
    }
  }
  if (async && xmlHttp.responseType) {
    xmlHttp.responseType = responseType
  }
  xmlHttp.open(method, url, async) // true for asynchronous
  xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=UTF-8')
  xmlHttp.send(params)
  return result
}

LPAGE.getNextWebPage = function (mockLeadEmail) {
  let dayOfMonth = new Date().getDate(),
    currVerticalIndex,
    currVertical

  if (dayOfMonth > numOfVerticals) {
    currVerticalIndex = (dayOfMonth - 1) % numOfVerticals
  } else {
    currVerticalIndex = dayOfMonth - 1
  }
  switch (currVerticalIndex) {
    case 0:
      currVertical = 'coe'
      break
    case 1:
      currVertical = 'tech'
      break
    case 2:
      currVertical = 'mfg'
      break
  }

  return LPAGE.webRequest('https://marketolive.com/m3/pluginv3/data/' + currVertical + '-pages-web.json', null, 'GET', false, '',
    function (response) {
      let webPages = JSON.parse(response)
      if (!mockLeadEmail) {
        mockLeadEmail = LIB.getUrlParam('mockLead')
      }
      if (webPages) {
        let webPageX = webPages[Math.floor(Math.random() * webPages.length)],
          params = ''
        if (webPageX.type == 'verticals') {
          if (webPageX.clickRate >= 1.0 || Math.random() <= webPageX.clickRate) {
            params = 'click=true'
          } else {
            params = 'click=false'
          }
        }
        if (params == '') {
          return webPageX.url + '?' + 'mockLead=' + mockLeadEmail
        } else {
          return webPageX.url + '?' + params + '&mockLead=' + mockLeadEmail
        }
      }
      return ''
    }
  )
}

/**************************************************************************************
 *  Main
 **************************************************************************************/


mktoLiveDomain = 'www.marketolive.com'

if (!origCookie) {
  origCookie = LIB.getCookie('_mkto_trk')
}

;(function () {
  var didInit = false,
    s,
    origMunchkinInit

  function overloadMunchkinInit() {
    if (typeof origMunchkinInit !== 'function') {
      origMunchkinInit = Munchkin.init
    }

    Munchkin.init = function (b, a, callback) {
      origMunchkinInit.apply(this, arguments)
      console.log('Loaded > Munchkin Tag')
      if (typeof callback === 'function') {
        callback()
      }
    }
  }

  function overloadMunchkinFunction() {
    if (typeof origMunckinFunction !== 'function') {
      origMunckinFunction = Munchkin.munchkinFunction
    }

    Munchkin.munchkinFunction = function (b, a, c, callback) {
      origMunckinFunction.apply(this, arguments)
      console.log('Completed > Munchkin Function')
      if (typeof callback === 'function') {
        callback()
      }
    }
  }

  function resetMunchkinCookie(munchkinId, cookieAnon, callback) {
    document.cookie =
      '_mkto_trk=;domain=.' +
      hostSplit[hostSplit.length - 2] +
      '.' +
      hostSplit[hostSplit.length - 1] +
      ';path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT'
    console.log('Removed > Cookie: _mkto_trk')
    overloadMunchkinInit()
    Munchkin.init(
      munchkinId,
      {
        cookieLifeDays: 365,
        cookieAnon: cookieAnon,
        disableClickDelay: true
      },
      callback
    )
  }

  function resetMasterMunchkinCookie(callback) {
    let oktaUsername = LIB.getCookie('okta_username')

    if (oktaUsername) {
      let email = 'mktodemosvcs+' + oktaUsername + '@gmail.com'

      document.cookie =
        '_mkto_trk=;domain=' +
        hostSplit[hostSplit.length - 2] +
        '.' +
        hostSplit[hostSplit.length - 1] +
        ';path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT'
      console.log('Removed > Cookie: _mkto_trk')
      overloadMunchkinInit()
      Munchkin.init(
        '185-NGX-811',
        {
          cookieLifeDays: 365,
          cookieAnon: false,
          disableClickDelay: true
        },
        function () {
          console.log('Associating > Lead : ' + email)
          overloadMunchkinFunction()
          Munchkin.munchkinFunction(
            'associateLead',
            {Email: email},
            sha1('123123123' + email),
            callback
          )
        }
      )
    } else {
      if (origCookie) {
        document.cookie =
          '_mkto_trk=' +
          origCookie +
          ';domain=' +
          hostSplit[hostSplit.length - 2] +
          '.' +
          hostSplit[hostSplit.length - 1] +
          ';path=/;expires=' +
          new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toUTCString()
        console.log('Restored > Cookie: _mkto_trk = ' + origCookie)
        console.log('Restored > Cookie: _mkto_trk = ' + LIB.getCookie('_mkto_trk'))
      }
      if (typeof callback === 'function') {
        callback()
      }
    }
  }

  function submitLeadData() {
    let cookieAnon = true

    resetMunchkinCookie(mktoLiveMunchkinId, cookieAnon, function () {
      let isMktoForm = window.setInterval(function () {
        if (typeof MktoForms2 !== 'undefined') {
          console.log('Landing Page > Getting: Form')
          window.clearInterval(isMktoForm)
          MktoForms2.whenReady(function (form) {
            let nextUrl = 'http://www.marketolive.com/data/mock-lead',
              demoMailBox = 'mktodemosvcs+',
              usernameCookieName = 'okta_username',
              firstNameCookieName = 'okta_first_name',
              lastNameCookieName = 'okta_last_name',
              jobTitleCookieName = 'attrib_job_title',
              companyNameCookieName = 'attrib_company_name',
              industryCookieName = 'attrib_industry',
              leadSourceCookieName = 'attrib_lead_source',
              mobileNumberCookieName = 'attrib_mobile_number',
              phoneNumberCookieName = 'attrib_phone_number',
              checkBoxes = ['yes', 'no'],
              submit = LIB.getUrlParam('submit'),
              isMockLead = LIB.getUrlParam('isMockLead'),
              utmTerm = LIB.getUrlParam('utmTerm'),
              utmMedium = LIB.getUrlParam('utmMedium'),
              utmCampaign = LIB.getUrlParam('utmCampaign'),
              utmSource = LIB.getUrlParam('utmSource'),
              answer,
              nextWebPage

            if (submit == 'true' || submit == 'test') {
              let formVals = form.getValues()
              if (isMockLead == 'true') {
                form.onSuccess(function (values, followUpUrl) {
                  window.location.href =
                    window.location.origin +
                    window.location.pathname +
                    '?submit=' + submit +
                    '&isMockLead=false' +
                    '&utmTerm=' + utmTerm +
                    '&utmMedium=' + utmMedium +
                    '&utmCampaign=' + utmCampaign +
                    '&utmSource=' + utmSource +
                    '&mockLead=' + values.Email
                  return false
                })

                LPAGE.webRequest(mockLeadEndpoint, null, 'GET', true, 'json', function (response) {
                  let mockLeadX = JSON.parse(response)
                  if (mockLeadX) {
                    if (mockLeadX.mobileNumber == null) {
                      mockLeadX.mobileNumber = ''
                    }
                    if (mockLeadX.phoneNumber == null) {
                      mockLeadX.phoneNumber = ''
                    }
                    if (typeof formVals.Email != 'undefined') {
                      if (mockLeadX.email != null) {
                        form.vals({Email: mockLeadX.email})
                      } else {
                        window.location.href = window.location.protocol + '//' + mktoLiveDomain + '/en/tools/auto-close'
                      }
                    }
                    if (typeof formVals.FirstName != 'undefined') {
                      if (mockLeadX.firstName != null) {
                        form.vals({FirstName: mockLeadX.firstName})
                      }
                    }
                    if (typeof formVals.LastName != 'undefined') {
                      if (mockLeadX.lastName != null) {
                        form.vals({LastName: mockLeadX.lastName})
                      }
                    }
                    if (typeof formVals.Title != 'undefined') {
                      if (mockLeadX.jobTitle != null) {
                        form.vals({Title: mockLeadX.jobTitle})
                      }
                    }
                    if (typeof formVals.Company != 'undefined') {
                      if (mockLeadX.company != null) {
                        form.vals({Company: mockLeadX.company})
                      }
                    }
                    if (typeof formVals.Industry != 'undefined') {
                      if (mockLeadX.industry != null) {
                        form.vals({Industry: mockLeadX.industry})
                      }
                    }
                    if (typeof formVals.LeadSource != 'undefined') {
                      if (mockLeadX.leadSource != null) {
                        form.vals({LeadSource: mockLeadX.leadSource})
                      }
                    }
                    if (typeof formVals.MobilePhone != 'undefined') {
                      if (mockLeadX.mobileNumber != null) {
                        form.vals({MobilePhone: mockLeadX.mobileNumber})
                      }
                    }
                    if (typeof formVals.Phone != 'undefined') {
                      if (mockLeadX.phoneNumber != null) {
                        form.vals({Phone: mockLeadX.phoneNumber})
                      }
                    }
                    if (typeof formVals.subscribedToAppMessages != 'undefined') {
                      form.vals({subscribedToAppMessages: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                    }
                    if (typeof formVals.subscribedToBlogPosts != 'undefined') {
                      form.vals({subscribedToBlogPosts: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                    }
                    if (typeof formVals.subscribedToEventInvitations != 'undefined') {
                      form.vals({subscribedToEventInvitations: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                    }
                    if (typeof formVals.subscribedToNewsletter != 'undefined') {
                      form.vals({subscribedToNewsletter: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                    }
                    if (typeof formVals.subscribedToSMS != 'undefined') {
                      form.vals({subscribedToSMS: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                    }
                    if (typeof formVals.subscribedToWebinarInvitations != 'undefined') {
                      form.vals({subscribedToWebinarInvitations: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                    }
                    if (typeof formVals.unsubscribedToAll != 'undefined') {
                      form.vals({unsubscribedToAll: Math.random() <= 0.05 ? checkBoxes[0] : checkBoxes[1]})
                    }
                  }
                  if (submit == 'true') {
                    form.submit()
                  }
                })
              } else {
                form.onSuccess(function (values, followUpUrl) {
                  window.location.href = LPAGE.getNextWebPage()
                  return false
                })
                if (typeof formVals.Email != 'undefined') {
                  let userId = LIB.getCookie(usernameCookieName),
                    email = demoMailBox + userId + '@gmail.com'
                  if (userId != null) {
                    form.vals({Email: email})
                  } else {
                    window.location.href = window.location.protocol + '//' + mktoLiveDomain + '/en/tools/auto-close'
                  }
                }
                if (typeof formVals.FirstName != 'undefined') {
                  let firstName = LIB.getCookie(firstNameCookieName)
                  if (firstName != null) {
                    form.vals({FirstName: firstName})
                  }
                }
                if (typeof formVals.LastName != 'undefined') {
                  let lastName = LIB.getCookie(lastNameCookieName)
                  if (lastName != null) {
                    form.vals({LastName: lastName})
                  }
                }
                if (typeof formVals.Title != 'undefined') {
                  let jobTitle = LIB.getCookie(jobTitleCookieName)
                  if (jobTitle != null) {
                    form.vals({Title: jobTitle})
                  }
                }
                if (typeof formVals.Company != 'undefined') {
                  let company = LIB.getCookie(companyNameCookieName)
                  if (company != null) {
                    form.vals({Company: company})
                  }
                }
                if (typeof formVals.Industry != 'undefined') {
                  let industry = LIB.getCookie(industryCookieName)
                  if (industry != null) {
                    form.vals({Industry: industry})
                  }
                }
                if (typeof formVals.LeadSource != 'undefined') {
                  let leadSource = LIB.getCookie(leadSourceCookieName)
                  if (leadSource != null) {
                    form.vals({LeadSource: leadSource})
                  }
                }
                if (typeof formVals.MobilePhone != 'undefined') {
                  let mobileNumber = LIB.getCookie(mobileNumberCookieName)
                  if (mobileNumber != null) {
                    form.vals({MobilePhone: mobileNumber})
                  }
                }
                if (typeof formVals.Phone != 'undefined') {
                  let phoneNumber = LIB.getCookie(phoneNumberCookieName)
                  if (phoneNumber != null) {
                    form.vals({Phone: phoneNumber})
                  }
                }
                if (typeof formVals.subscribedToAppMessages != 'undefined') {
                  form.vals({subscribedToAppMessages: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                }
                if (typeof formVals.subscribedToBlogPosts != 'undefined') {
                  form.vals({subscribedToBlogPosts: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                }
                if (typeof formVals.subscribedToEventInvitations != 'undefined') {
                  form.vals({subscribedToEventInvitations: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                }
                if (typeof formVals.subscribedToNewsletter != 'undefined') {
                  form.vals({subscribedToNewsletter: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                }
                if (typeof formVals.subscribedToSMS != 'undefined') {
                  form.vals({subscribedToSMS: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                }
                if (typeof formVals.subscribedToWebinarInvitations != 'undefined') {
                  form.vals({subscribedToWebinarInvitations: Math.random() <= 0.8 ? checkBoxes[0] : checkBoxes[1]})
                }
                if (typeof formVals.unsubscribedToAll != 'undefined') {
                  form.vals({unsubscribedToAll: Math.random() <= 0.05 ? checkBoxes[0] : checkBoxes[1]})
                }
                if (submit == 'true') {
                  form.submit()
                }
              }
            } else if (submit == 'false') {
              resetMasterMunchkinCookie(function () {
                console.log('Posting > Real Lead > Visit Web Page: ' + window.location.pathname)
                overloadMunchkinFunction()
                Munchkin.munchkinFunction(
                  'visitWebPage',
                  {url: window.location.pathname},
                  null,
                  function () {
                    window.setTimeout(function () {
                      window.location.href = LPAGE.getNextWebPage()
                    }, 1000)
                  }
                )
              })
            }
          })
        }
      }, 0)
    })
  }

  function initMunchkin() {
    if (didInit === false) {
      didInit = true
      submitLeadData()
    }
  }

  s = document.createElement('script')
  s.type = 'text/javascript'
  s.async = true
  s.src = '//munchkin.marketo.net/munchkin.js'
  s.onreadystatechange = function () {
    if (this.readyState == 'complete' || this.readyState == 'loaded') {
      initMunchkin()
    }
  }
  s.onload = initMunchkin
  document.getElementsByTagName('head')[0].appendChild(s)
})()

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFsdC9saWIvY29uY2F0LW5vdGUuanMiLCJhbHQvbGliL2Rldi1tb2RlLmpzIiwiYWx0L2xpYi9saWIuanMiLCJhbHQvcGx1Z2ludjMvbWFya2V0by1saXZlLWxhbmRpbmctcGFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUNGQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWx0L2Rpc3QvY2hyb21lLWV4dGVuc2lvbi93ZWItYWNjZXNzaWJsZS1yZXNvdXJjZXMvbWFya2V0by1saXZlLWxhbmRpbmctcGFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5UaGlzIGZpbGUgaXMgdGhlIGNvbWJpbmVkIG91dHB1dCBvZiBtdWx0aXBsZSBzcmMgZmlsZXMuIERvIG5vdCBlZGl0IGl0IGRpcmVjdGx5LlxuKi8iLCJpc0V4dERldk1vZGUgPSB0cnVlIiwiLy8gY2F0Y2ggYWxsIGZvciBnbG9iYWxseSBkZWZpbmVkIGZ1bmN0aW9ucyB1c2VkIGJ5IGFueSBmaWxlXG5cbi8vIHRoZSB3ZWIgYWNjZXNzaWJsZSByZXNvdXJjZXMgcHJlZml4IG5lZWRzIHRvIGV4aXN0IGluIHRoZSBjaHJvbWUgZXh0ZW5zaW9uIGNvbnRleHQgQU5EIHRoZSB3aW5kb3cgY29udGV4dFxuLy8gc28gaW5qZWN0ZWQgc2NyaXB0cyBjYW4gYWNjZXNzIG90aGVyIHNjcmlwdHNcbndpbmRvdy53YXJQcmVmaXhcbmlmICh0eXBlb2Ygd2FyUHJlZml4ID09PSAndW5kZWZpbmVkJyAmJlxuICB0eXBlb2YgY2hyb21lICE9PSAndW5kZWZpbmVkJyAmJlxuICB0eXBlb2YgY2hyb21lLnJ1bnRpbWUgIT09ICd1bmRlZmluZWQnICYmXG4gIHR5cGVvZiBjaHJvbWUucnVudGltZS5nZXRVUkwgIT09ICd1bmRlZmluZWQnKSB7XG4gIHdpbmRvdy53YXJQcmVmaXggPSBjaHJvbWUucnVudGltZS5nZXRVUkwoJ3dlYi1hY2Nlc3NpYmxlLXJlc291cmNlcycpXG5cbiAgLy8gZG8gbm90IGF0dGVtcHQgdG8gYWRkIHRoaXMgaW5saW5lIHNjcmlwdCB0byB0aGUgZXh0ZW5zaW9uIGJhY2tncm91bmQgb3IgcG9wdXAgcGFnZS5cbiAgLy8gaXQncyBub3QgYWxsb3dlZCBieSBDaHJvbWUncyBDU1AgYW5kIGl0J3Mgbm90IG5lZWRlZCBiL2MgdGhlIHdhclByZWZpeCB3aWxsIGJlIGFscmVhZHkgYmUgYXZhaWxhYmxlXG4gIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM3MjE4Njc4L2lzLWNvbnRlbnQtc2VjdXJpdHktcG9saWN5LXVuc2FmZS1pbmxpbmUtZGVwcmVjYXRlZFxuICBpZiAoIS9eY2hyb21lLWV4dGVuc2lvbjouKihcXC9fZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZVxcLmh0bWx8XFwvcG9wdXBcXC9wb3B1cC5odG1sKSQvLnRlc3QobG9jYXRpb24uaHJlZikpIHtcbiAgICBsZXQgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgcy5pbm5lckhUTUwgPSBgd2luZG93LndhclByZWZpeCA9ICcke3dhclByZWZpeH0nYFxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQocylcbiAgfVxufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdmFyXG52YXIgTElCID0ge1xuXG4gIE1BUktFVE9fTElWRV9BUFA6ICdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52My9tYXJrZXRvLWFwcC5qcycsXG4gIE1BUktFVE9fR0xPQkFMX0FQUDogJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzL21hcmtldG8tZ2xvYmFsLWFwcC5qcycsXG4gIEdMT0JBTF9MQU5ESU5HX1BBR0U6ICdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52My9nbG9iYWwtbGFuZGluZy1wYWdlLmpzJyxcbiAgSEVBUF9BTkFMWVRJQ1NfU0NSSVBUX0xPQ0FUSU9OOiAnaHR0cHM6Ly9tYXJrZXRvbGl2ZS5jb20vbTMvcGx1Z2ludjMvaGVhcC1hbmFseXRpY3MtZXh0LmpzJyxcblxuICBhZGRTdHlsZXM6IGZ1bmN0aW9uIChjc3MpIHtcbiAgICBsZXQgaCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG4gICAgICBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgIHMudHlwZSA9ICd0ZXh0L2NzcydcbiAgICBzLmlubmVySFRNTCA9IGNzc1xuICAgIGguYXBwZW5kQ2hpbGQocylcbiAgfSxcblxuICBpc1Byb3BPZldpbmRvd09iajogZnVuY3Rpb24gKHMpIHtcbiAgICBpZiAodHlwZW9mIHMgIT09ICdzdHJpbmcnIHx8IC9bWyhdXS8udGVzdChzKSkge1xuICAgICAgdGhyb3cgJ0ludmFsaWQgcGFyYW0gdG8gaXNQcm9wT2ZXaW5kb3dPYmonXG4gICAgfVxuICAgIGxldCBhID0gcy5zcGxpdCgnLicpLFxuICAgICAgb2JqID0gd2luZG93W2Euc2hpZnQoKV1cbiAgICB3aGlsZSAob2JqICYmIGEubGVuZ3RoKSB7XG4gICAgICBvYmogPSBvYmpbYS5zaGlmdCgpXVxuICAgIH1cbiAgICByZXR1cm4gISFvYmpcbiAgfSxcblxuICBnZXRFeHRlbnNpb25JZDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgY2hyb21lID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgY2hyb21lLnJ1bnRpbWUgPT09ICdvYmplY3QnICYmIGNocm9tZS5ydW50aW1lLmlkKSB7XG4gICAgICByZXR1cm4gY2hyb21lLnJ1bnRpbWUuaWRcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHdhclByZWZpeC5yZXBsYWNlKC8uKjpcXC9cXC8oW14vXSopLiovLCAnJDEnKVxuICAgIH1cbiAgfSxcblxuICByZWxvYWRUYWJzOiBmdW5jdGlvbiAodXJsTWF0Y2gpIHtcbiAgICBjaHJvbWUudGFicy5xdWVyeSh7dXJsOiB1cmxNYXRjaH0sXG4gICAgICBmdW5jdGlvbiAodGFicykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjaHJvbWUudGFicy5yZWxvYWQodGFic1tpXS5pZClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfSxcblxuICBnZXRDb29raWU6IGZ1bmN0aW9uIChjb29raWVOYW1lKSB7XG4gICAgY29uc29sZS5sb2coJ0dldHRpbmc6IENvb2tpZSAnICsgY29va2llTmFtZSlcbiAgICBsZXQgbmFtZSA9IGNvb2tpZU5hbWUgKyAnPScsXG4gICAgICBjb29raWVzID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7JyksXG4gICAgICBjdXJyQ29va2llXG5cbiAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgY29va2llcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIGN1cnJDb29raWUgPSBjb29raWVzW2lpXS50cmltKClcbiAgICAgIGlmIChjdXJyQ29va2llLmluZGV4T2YobmFtZSkgPT0gMCkge1xuICAgICAgICByZXR1cm4gY3VyckNvb2tpZS5zdWJzdHJpbmcobmFtZS5sZW5ndGgsIGN1cnJDb29raWUubGVuZ3RoKVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZygnR2V0dGluZzogQ29va2llICcgKyBjb29raWVOYW1lICsgJyBub3QgZm91bmQnKVxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgcmVtb3ZlQ29va2llOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgbGV0IGNvb2tpZSA9IHtcbiAgICAgIHVybDogb2JqLnVybCxcbiAgICAgIG5hbWU6IG9iai5uYW1lXG4gICAgfVxuICAgIGNocm9tZS5jb29raWVzLnJlbW92ZShjb29raWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdSZW1vdmluZzogJyArIGNvb2tpZS5uYW1lICsgJyBDb29raWUgZm9yICcgKyBjb29raWUudXJsKVxuICAgIH0pXG4gIH0sXG5cbiAgc2V0Q29va2llOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgbGV0IGNvb2tpZSA9IHtcbiAgICAgIHVybDogb2JqLnVybCxcbiAgICAgIG5hbWU6IG9iai5uYW1lLFxuICAgICAgdmFsdWU6IG9iai52YWx1ZSxcbiAgICAgIGRvbWFpbjogb2JqLmRvbWFpblxuICAgIH1cblxuICAgIGlmIChvYmouZXhwaXJlc0luRGF5cykge1xuICAgICAgY29va2llLmV4cGlyYXRpb25EYXRlID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwICsgb2JqLmV4cGlyZXNJbkRheXMgKiAyNCAqIDYwICogNjBcbiAgICB9XG4gICAgaWYgKG9iai5zZWN1cmUpIHtcbiAgICAgIGNvb2tpZS5zZWN1cmUgPSBvYmouc2VjdXJlXG4gICAgfVxuXG4gICAgY2hyb21lLmNvb2tpZXMuc2V0KGNvb2tpZSwgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGNvb2tpZS52YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdTZXR0aW5nOiAnICsgY29va2llLm5hbWUgKyAnIENvb2tpZSBmb3IgJyArIGNvb2tpZS5kb21haW4gKyAnID0gJyArIGNvb2tpZS52YWx1ZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdTZXR0aW5nOiAnICsgY29va2llLm5hbWUgKyAnIENvb2tpZSBmb3IgJyArIGNvb2tpZS5kb21haW4gKyAnID0gbnVsbCcpXG4gICAgICB9XG4gICAgfSlcbiAgfSxcblxuICBmb3JtYXRUZXh0OiBmdW5jdGlvbiAodGV4dCkge1xuICAgIGxldCBzcGxpdFRleHQgPSB0ZXh0LnRyaW0oKS5zcGxpdCgnICcpLFxuICAgICAgZm9ybWF0dGVkVGV4dCA9ICcnXG5cbiAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgc3BsaXRUZXh0Lmxlbmd0aDsgaWkrKykge1xuICAgICAgaWYgKGlpICE9IDApIHtcbiAgICAgICAgZm9ybWF0dGVkVGV4dCArPSAnICdcbiAgICAgIH1cbiAgICAgIGZvcm1hdHRlZFRleHQgKz0gc3BsaXRUZXh0W2lpXS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHNwbGl0VGV4dFtpaV0uc3Vic3RyaW5nKDEpLnRvTG93ZXJDYXNlKClcbiAgICB9XG5cbiAgICByZXR1cm4gZm9ybWF0dGVkVGV4dFxuICB9LFxuXG4gIGdldFVybFBhcmFtOiBmdW5jdGlvbiAocGFyYW0pIHtcbiAgICBjb25zb2xlLmxvZygnR2V0dGluZzogVVJMIFBhcmFtZXRlcjogJyArIHBhcmFtKVxuICAgIGxldCBwYXJhbVN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCc/JylbMV1cblxuICAgIGlmIChwYXJhbVN0cmluZykge1xuICAgICAgbGV0IHBhcmFtcyA9IHBhcmFtU3RyaW5nLnNwbGl0KCcmJyksXG4gICAgICAgIHBhcmFtUGFpcixcbiAgICAgICAgcGFyYW1OYW1lLFxuICAgICAgICBwYXJhbVZhbHVlXG5cbiAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBwYXJhbXMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIHBhcmFtUGFpciA9IHBhcmFtc1tpaV0uc3BsaXQoJz0nKVxuICAgICAgICBwYXJhbU5hbWUgPSBwYXJhbVBhaXJbMF1cbiAgICAgICAgcGFyYW1WYWx1ZSA9IHBhcmFtUGFpclsxXVxuXG4gICAgICAgIGlmIChwYXJhbU5hbWUgPT0gcGFyYW0pIHtcbiAgICAgICAgICBwYXJhbVZhbHVlID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhcmFtVmFsdWUpXG4gICAgICAgICAgaWYgKHBhcmFtVmFsdWUuc2VhcmNoKC9eaHR0cChzKT86XFwvXFwvLykgPT0gLTEpIHtcbiAgICAgICAgICAgIHBhcmFtVmFsdWUgPSBwYXJhbVZhbHVlLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUubG9nKCdVUkwgUGFyYW1ldGVyOiAnICsgcGFyYW1OYW1lICsgJyA9ICcgKyBwYXJhbVZhbHVlKVxuICAgICAgICAgIHJldHVybiBwYXJhbVZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICcnXG4gIH0sXG5cbiAgbG9hZFNjcmlwdDogZnVuY3Rpb24gKHNjcmlwdFNyYykge1xuICAgIHNjcmlwdFNyYyA9IHNjcmlwdFNyYy5yZXBsYWNlKCdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52MycsIHdhclByZWZpeClcbiAgICBjb25zb2xlLmxvZygnTG9hZGluZzogU2NyaXB0OiAnICsgc2NyaXB0U3JjKVxuICAgIGxldCBzY3JpcHRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0JylcbiAgICBzY3JpcHRFbGVtZW50LmFzeW5jID0gdHJ1ZVxuICAgIHNjcmlwdEVsZW1lbnQuc3JjID0gc2NyaXB0U3JjXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHRFbGVtZW50KVxuICB9LFxuXG4gIHdlYlJlcXVlc3Q6IGZ1bmN0aW9uICh1cmwsIHBhcmFtcywgbWV0aG9kLCBhc3luYywgcmVzcG9uc2VUeXBlLCBjYWxsYmFjaykge1xuICAgIHVybCA9IHVybC5yZXBsYWNlKCdodHRwczovL21hcmtldG9saXZlLmNvbS9tMy9wbHVnaW52MycsIHdhclByZWZpeClcbiAgICBjb25zb2xlLmxvZygnV2ViIFJlcXVlc3QgPiAnICsgdXJsICsgJ1xcbicgKyBwYXJhbXMpXG4gICAgbGV0IHhtbEh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcbiAgICAgIHJlc3VsdFxuICAgIHhtbEh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyAmJiB4bWxIdHRwLnJlYWR5U3RhdGUgPT0gNCAmJiB4bWxIdHRwLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2soeG1sSHR0cC5yZXNwb25zZSlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGFzeW5jICYmIHhtbEh0dHAucmVzcG9uc2VUeXBlKSB7XG4gICAgICB4bWxIdHRwLnJlc3BvbnNlVHlwZSA9IHJlc3BvbnNlVHlwZVxuICAgIH1cbiAgICB4bWxIdHRwLm9wZW4obWV0aG9kLCB1cmwsIGFzeW5jKSAvLyB0cnVlIGZvciBhc3luY2hyb25vdXNcbiAgICB4bWxIdHRwLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLTgnKVxuXG4gICAgLy8ga2hiOiBpcyB0aGlzIGhlYWRlciBuZWNlc3Nhcnk/IHdoeSBub3Qgc2V0IGl0IGFsbCB0aGUgdGltZT9cbiAgICBpZiAodXJsLnNlYXJjaCgvXlxcLy8pICE9IC0xIHx8IHVybC5yZXBsYWNlKC9eW2Etel0rOlxcL1xcLyhbXi9dKylcXC8/LiokLywgJyQxJykgPT0gd2luZG93LmxvY2F0aW9uLmhvc3QpIHtcbiAgICAgIHhtbEh0dHAuc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpXG4gICAgfVxuXG4gICAgeG1sSHR0cC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG4gICAgeG1sSHR0cC5zZW5kKHBhcmFtcylcbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sXG5cbiAgdmFsaWRhdGVEZW1vRXh0ZW5zaW9uQ2hlY2s6IGZ1bmN0aW9uIChpc1ZhbGlkRXh0ZW5zaW9uKSB7XG4gICAgY29uc29sZS5sb2coJz4gVmFsaWRhdGluZzogRGVtbyBFeHRlbnNpb24gQ2hlY2snKVxuICAgIGlmIChpc1ZhbGlkRXh0ZW5zaW9uKSB7XG4gICAgICB3aW5kb3cubWt0b19saXZlX2V4dGVuc2lvbl9zdGF0ZSA9ICdNYXJrZXRvTGl2ZSBleHRlbnNpb24gaXMgYWxpdmUhJ1xuICAgICAgY29uc29sZS5sb2coJz4gVmFsaWRhdGluZzogRGVtbyBFeHRlbnNpb24gSVMgVmFsaWQnKVxuICAgIH0gZWxzZSBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RQYWdlLnZhbGlkYXRlRGVtb0V4dGVuc2lvbicpKSB7XG4gICAgICB3aW5kb3cubWt0b19saXZlX2V4dGVuc2lvbl9zdGF0ZSA9IG51bGxcbiAgICAgIE1rdFBhZ2UudmFsaWRhdGVEZW1vRXh0ZW5zaW9uKG5ldyBEYXRlKCkpXG4gICAgICBjb25zb2xlLmxvZygnPiBWYWxpZGF0aW5nOiBEZW1vIEV4dGVuc2lvbiBJUyBOT1QgVmFsaWQnKVxuICAgIH1cbiAgfSxcblxuICBnZXRNa3QzQ3RsckFzc2V0OiBmdW5jdGlvbihrZXksIG1ldGhvZCkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KGtleSlbbWV0aG9kXSgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9LFxuXG4gIC8vIG92ZXJsYXlzIGFuIGVtYWlsIHdpdGggdGhlIHVzZXIgc3VibWl0dGVkIGNvbXBhbnkgbG9nbyBhbmQgY29sb3JcbiAgLy8gYWN0aW9uIC0gbW9kZSBpbiB3aGljaCB0aGlzIGFzc2V0IGlzIGJlaW5nIHZpZXdlZCAoZWRpdC9wcmV2aWV3KVxuICBvdmVybGF5RW1haWw6IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCcpXG4gICAgbGV0IGlzRW1haWxFZGl0b3IyLFxuICAgICAgY2xlYXJPdmVybGF5VmFycyxcbiAgICAgIG92ZXJsYXksXG4gICAgICBpc01rdG9IZWFkZXJCZ0NvbG9yUmVwbGFjZWQgPVxuICAgICAgICAoaXNNa3RvSW1nUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b0hlcm9CZ1JlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9UZXh0UmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b1N1YlRleHRSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b0VtYWlsMVJlcGxhY2VkID1cbiAgICAgICAgICBlZGl0b3JQcmV2UmVhZHkgPVxuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPVxuICAgICAgICAgIHBob25lUHJldlJlYWR5ID1cbiAgICAgICAgICBpc0Rlc2t0b3BQcmV2aWV3UmVwbGFjZWQgPVxuICAgICAgICAgIGlzUGhvbmVQcmV2aWV3UmVwbGFjZWQgPVxuICAgICAgICAgIGZhbHNlKSxcbiAgICAgIGxvZ29Na3RvTmFtZVJlZ2V4ID0gbmV3IFJlZ0V4cCgnbG9nbycsICdpJyksXG4gICAgICBidXR0b25UZXh0UmVnZXggPSBuZXcgUmVnRXhwKCdzaWdudXB8c2lnbiB1cHxjYWxsIHRvIGFjdGlvbnxjdGF8cmVnaXN0ZXJ8bW9yZXxjb250cmlidXRlJywgJ2knKSxcbiAgICAgIHNhdmVFZGl0c1RvZ2dsZSA9IExJQi5nZXRDb29raWUoJ3NhdmVFZGl0c1RvZ2dsZVN0YXRlJyksXG4gICAgICBsb2dvID0gTElCLmdldENvb2tpZSgnbG9nbycpLFxuICAgICAgaGVyb0JhY2tncm91bmQgPSBMSUIuZ2V0Q29va2llKCdoZXJvQmFja2dyb3VuZCcpLFxuICAgICAgY29sb3IgPSBMSUIuZ2V0Q29va2llKCdjb2xvcicpLFxuICAgICAgZGVmYXVsdENvbG9yID0gJ3JnYig0MiwgODMsIDExMiknLFxuICAgICAgbG9nb01heEhlaWdodCA9ICc1NScsXG4gICAgICBta3RvTWFpblRleHQgPSAnWW91IFRvIFRoZTxicj48YnI+UFJFTUlFUiBCVVNJTkVTUyBFVkVOVDxicj5PRiBUSEUgWUVBUicsXG4gICAgICBta3RvU3ViVGV4dCA9IExJQi5nZXRIdW1hbkRhdGUoKSxcbiAgICAgIGNvbXBhbnksXG4gICAgICBjb21wYW55TmFtZSxcbiAgICAgIGVkaXRvclJlcGVhdFJlYWR5Q291bnQgPSAoZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAwKSxcbiAgICAgIG1heFJlcGVhdFJlYWR5ID0gMjAwMCxcbiAgICAgIG1heFByZXZpZXdSZXBlYXRSZWFkeSA9IDMwMDBcblxuICAgIGlmIChzYXZlRWRpdHNUb2dnbGUgPT0gJ3RydWUnIHx8IChsb2dvID09IG51bGwgJiYgaGVyb0JhY2tncm91bmQgPT0gbnVsbCAmJiBjb2xvciA9PSBudWxsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChsb2dvICE9IG51bGwpIHtcbiAgICAgIGNvbXBhbnkgPSBsb2dvLnNwbGl0KCdodHRwczovL2xvZ28uY2xlYXJiaXQuY29tLycpWzFdLnNwbGl0KCcuJylbMF1cbiAgICAgIGNvbXBhbnlOYW1lID0gY29tcGFueS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGNvbXBhbnkuc2xpY2UoMSlcbiAgICAgIG1rdG9NYWluVGV4dCA9IGNvbXBhbnlOYW1lICsgJyBJbnZpdGVzICcgKyBta3RvTWFpblRleHRcbiAgICB9IGVsc2Uge1xuICAgICAgbWt0b01haW5UZXh0ID0gJ1dlIEludml0ZSAnICsgbWt0b01haW5UZXh0XG4gICAgfVxuXG4gICAgY2xlYXJPdmVybGF5VmFycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlzTWt0b0hlYWRlckJnQ29sb3JSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvSGVyb0JnUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9UZXh0UmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9TdWJUZXh0UmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0VtYWlsMVJlcGxhY2VkID1cbiAgICAgICAgZmFsc2VcbiAgICAgIGVtYWlsQm9keSA9XG4gICAgICAgIG1rdG9JbWdzID1cbiAgICAgICAgbWt0b1RleHRzID1cbiAgICAgICAgbWt0b0J1dHRvbnMgPVxuICAgICAgICBsb2dvU3dhcENvbXBhbnkgPVxuICAgICAgICBsb2dvU3dhcENvbnRhaW5lciA9XG4gICAgICAgIGxvZ29Td2FwQ29tcGFueUNvbnRhaW5lciA9XG4gICAgICAgIGxvZ29Ca2cgPVxuICAgICAgICBidXR0b25Ca2cgPVxuICAgICAgICBudWxsXG4gICAgfVxuXG4gICAgb3ZlcmxheSA9IGZ1bmN0aW9uIChlbWFpbERvY3VtZW50KSB7XG4gICAgICBpZiAoZW1haWxEb2N1bWVudCkge1xuICAgICAgICBsZXQgZW1haWxCb2R5ID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLFxuICAgICAgICAgIGxvZ29Td2FwQ29tcGFueSA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ28tc3dhcC1jb21wYW55JyksXG4gICAgICAgICAgbG9nb1N3YXBDb250YWluZXIgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2dvLXN3YXAtY29udGFpbmVyJyksXG4gICAgICAgICAgbG9nb1N3YXBDb21wYW55Q29udGFpbmVyID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nby1zd2FwLWNvbXBhbnktY29udGFpbmVyJyksXG4gICAgICAgICAgbG9nb0JrZyA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ28tYmtnJyksXG4gICAgICAgICAgYnV0dG9uQmtnID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnV0dG9uLWJrZycpXG5cbiAgICAgICAgaWYgKGVtYWlsQm9keSAmJiBlbWFpbEJvZHkuaW5uZXJIVE1MKSB7XG4gICAgICAgICAgbGV0IG1rdG9IZWFkZXIgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdoZWFkZXInKVswXSxcbiAgICAgICAgICAgIG1rdG9Mb2dvMSA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2xvZ28nKVswXSxcbiAgICAgICAgICAgIG1rdG9Mb2dvMiA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2xvZ28nKVsxXSxcbiAgICAgICAgICAgIG1rdG9JbWdzID0gZW1haWxCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21rdG9JbWcnKSxcbiAgICAgICAgICAgIG1rdG9IZXJvQmcgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdoZXJvQmFja2dyb3VuZCcpWzBdLFxuICAgICAgICAgICAgbWt0b1RkcyA9IGVtYWlsQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGQnKSxcbiAgICAgICAgICAgIG1rdG9UaXRsZSA9IGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ3RpdGxlJylbMF0sXG4gICAgICAgICAgICBta3RvU3VidGl0bGUgPSBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdzdWJ0aXRsZScpWzBdLFxuICAgICAgICAgICAgbWt0b1RleHRzID0gZW1haWxCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21rdG9UZXh0JyksXG4gICAgICAgICAgICBta3RvQnV0dG9uID0gZW1haWxEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnYnV0dG9uJylbMF0sXG4gICAgICAgICAgICBta3RvQnV0dG9ucyA9IGVtYWlsQm9keS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzZWNvbmRhcnktZm9udCBidXR0b24nKVxuXG4gICAgICAgICAgaWYgKCFpc01rdG9IZWFkZXJCZ0NvbG9yUmVwbGFjZWQgJiYgY29sb3IgJiYgbWt0b0hlYWRlcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIEhlYWRlciBCYWNrZ3JvdW5kIENvbXBhbnkgQ29sb3IgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICBta3RvSGVhZGVyLnN0eWxlLnNldFByb3BlcnR5KCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3IpXG4gICAgICAgICAgICBta3RvSGVhZGVyLnNldEF0dHJpYnV0ZSgnYmdDb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgaXNNa3RvSGVhZGVyQmdDb2xvclJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvSW1nUmVwbGFjZWQgJiYgbG9nbyAmJiAobWt0b0xvZ28xIHx8IG1rdG9Mb2dvMiB8fCBta3RvSW1ncy5sZW5ndGggIT0gMCkpIHtcbiAgICAgICAgICAgIGlmIChta3RvTG9nbzEgfHwgbWt0b0xvZ28yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBDb21wYW55IExvZ28gZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIGlmIChta3RvTG9nbzEgJiYgbWt0b0xvZ28xLmdldEF0dHJpYnV0ZSgnZGlzcGxheScpICE9ICdub25lJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBDb21wYW55IExvZ28gMScpXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMS5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAobWt0b0xvZ28yICYmIG1rdG9Mb2dvMi5nZXRBdHRyaWJ1dGUoJ2Rpc3BsYXknKSAhPSAnbm9uZScpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgQ29tcGFueSBMb2dvIDInKVxuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzIuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b0ltZ3MubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvSW1nID0gbWt0b0ltZ3NbaWldLFxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWdNa3RvTmFtZVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnbWt0b25hbWUnKSkge1xuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWdNa3RvTmFtZSA9IGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnbWt0b25hbWUnKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdpZCcpKSB7XG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZ01rdG9OYW1lID0gY3Vyck1rdG9JbWcuZ2V0QXR0cmlidXRlKCdpZCcpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvSW1nTWt0b05hbWUgJiYgY3Vyck1rdG9JbWdNa3RvTmFtZS5zZWFyY2gobG9nb01rdG9OYW1lUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9JbWdUYWcgPSBjdXJyTWt0b0ltZy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJylbMF1cblxuICAgICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvSW1nVGFnICYmIGN1cnJNa3RvSW1nVGFnLmdldEF0dHJpYnV0ZSgnc3JjJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIENvbXBhbnkgTG9nbycpXG4gICAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nVGFnLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nVGFnLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZ1RhZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvSGVyb0JnUmVwbGFjZWQgJiYgaGVyb0JhY2tncm91bmQgJiYgKG1rdG9IZXJvQmcgfHwgbWt0b1Rkcy5sZW5ndGggIT0gMCkpIHtcbiAgICAgICAgICAgIGlmIChta3RvSGVyb0JnKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIDIuMCBIZXJvIENvbXBhbnkgQmFja2dyb3VuZCBmb3IgRGVtbyBTdmNzIFRlbXBsYXRlJylcbiAgICAgICAgICAgICAgbWt0b0hlcm9CZy5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoXFwnJyArIGhlcm9CYWNrZ3JvdW5kICsgJ1xcJyknKVxuICAgICAgICAgICAgICBta3RvSGVyb0JnLnNldEF0dHJpYnV0ZSgnYmFja2dyb3VuZCcsIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgICAvL21rdG9IZXJvQmcuc3R5bGUuc2V0UHJvcGVydHkoXCJiYWNrZ3JvdW5kLXNpemVcIiwgXCJjb3ZlclwiKTtcbiAgICAgICAgICAgICAgaXNNa3RvSGVyb0JnUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b1Rkcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyck1rdG9UZCA9IG1rdG9UZHNbaWldXG5cbiAgICAgICAgICAgICAgICBpZiAoY3Vyck1rdG9UZCAmJiBjdXJyTWt0b1RkLmdldEF0dHJpYnV0ZSgnYmFja2dyb3VuZCcpKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgSGVybyBDb21wYW55IEJhY2tncm91bmQnKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9UZC5zZXRBdHRyaWJ1dGUoJ2JhY2tncm91bmQnLCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvVGQuc3R5bGUuc2V0UHJvcGVydHkoJ2JhY2tncm91bmQtaW1hZ2UnLCAndXJsKFxcJycgKyBoZXJvQmFja2dyb3VuZCArICdcXCcpJylcbiAgICAgICAgICAgICAgICAgIC8vY3Vyck1rdG9UZC5zdHlsZS5zZXRQcm9wZXJ0eShcImJhY2tncm91bmQtc2l6ZVwiLCBcImNvdmVyXCIpO1xuICAgICAgICAgICAgICAgICAgaXNNa3RvSGVyb0JnUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvQnV0dG9uUmVwbGFjZWQgJiYgY29sb3IgJiYgKG1rdG9CdXR0b24gfHwgbWt0b0J1dHRvbnMubGVuZ3RoICE9IDApKSB7XG4gICAgICAgICAgICBpZiAobWt0b0J1dHRvbikge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBFbWFpbCAyLjAgQnV0dG9uIENvbXBhbnkgQ29sb3IgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIG1rdG9CdXR0b24uc3R5bGUuc2V0UHJvcGVydHkoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvcilcbiAgICAgICAgICAgICAgbWt0b0J1dHRvbi5zdHlsZS5zZXRQcm9wZXJ0eSgnYm9yZGVyLWNvbG9yJywgY29sb3IpXG4gICAgICAgICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG1rdG9CdXR0b25zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b0J1dHRvbiA9IG1rdG9CdXR0b25zW2lpXVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJNa3RvQnV0dG9uLmlubmVySFRNTCAmJiBjdXJyTWt0b0J1dHRvbi5pbm5lckhUTUwuc2VhcmNoKGJ1dHRvblRleHRSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXJyTWt0b0J1dHRvbi5zdHlsZSAmJiBjdXJyTWt0b0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMi4wIEJ1dHRvbiBDb21wYW55IENvbG9yJylcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3JcbiAgICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uc3R5bGUuYm9yZGVyQ29sb3IgPSBjb2xvclxuICAgICAgICAgICAgICAgICAgICBpc01rdG9CdXR0b25SZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobG9nb1N3YXBDb21wYW55Q29udGFpbmVyICYmIGxvZ29Td2FwQ29udGFpbmVyICYmIGxvZ29Td2FwQ29tcGFueSAmJiBsb2dvQmtnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMS4wIENvbXBhbnkgTG9nbyAmIENvbG9yJylcbiAgICAgICAgICBpZiAoY29sb3IpIHtcbiAgICAgICAgICAgIGxvZ29Ca2cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3JcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAobG9nbykge1xuICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcblxuICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgbGV0IGxvZ29IZWlnaHRzUmF0aW8sIGxvZ29XaWR0aCwgbG9nb05ld1dpZHRoLCBsb2dvTmV3SGVpZ2h0LCBsb2dvU3R5bGVcblxuICAgICAgICAgICAgICBpZiAobG9nb1N3YXBDb21wYW55Lm5hdHVyYWxIZWlnaHQgJiYgbG9nb1N3YXBDb21wYW55Lm5hdHVyYWxIZWlnaHQgPiBsb2dvTWF4SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgbG9nb0hlaWdodHNSYXRpbyA9IGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsSGVpZ2h0IC8gbG9nb01heEhlaWdodFxuICAgICAgICAgICAgICAgIGxvZ29XaWR0aCA9IGxvZ29Td2FwQ29tcGFueS5uYXR1cmFsV2lkdGggLyBsb2dvSGVpZ2h0c1JhdGlvXG4gICAgICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LndpZHRoID0gbG9nb05ld1dpZHRoID0gbG9nb1dpZHRoXG4gICAgICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LmhlaWdodCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvTWF4SGVpZ2h0XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobG9nb1N3YXBDb21wYW55Lm5hdHVyYWxIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICBsb2dvU3dhcENvbXBhbnkud2lkdGggPSBsb2dvTmV3V2lkdGggPSBsb2dvU3dhcENvbXBhbnkubmF0dXJhbFdpZHRoXG4gICAgICAgICAgICAgICAgbG9nb1N3YXBDb21wYW55LmhlaWdodCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvU3dhcENvbXBhbnkubmF0dXJhbEhlaWdodFxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueS53aWR0aCA9IGxvZ29Td2FwQ29tcGFueS5oZWlnaHQgPSBsb2dvTmV3V2lkdGggPSBsb2dvTmV3SGVpZ2h0ID0gbG9nb01heEhlaWdodFxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKSAmJiBlbWFpbERvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0pIHtcbiAgICAgICAgICAgICAgICBsb2dvU3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gICAgICAgICAgICAgICAgbG9nb1N0eWxlLmlubmVySFRNTCA9XG4gICAgICAgICAgICAgICAgICAnIycgKyBsb2dvU3dhcENvbXBhbnkuaWQgKyAnIHt3aWR0aCA6ICcgKyBsb2dvTmV3V2lkdGggKyAncHggIWltcG9ydGFudDsgaGVpZ2h0IDogJyArIGxvZ29OZXdIZWlnaHQgKyAncHggIWltcG9ydGFudDt9J1xuICAgICAgICAgICAgICAgIGVtYWlsRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChsb2dvU3R5bGUpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgMS4wIENvbXBhbnkgTG9nbyBEaW1lbnNpb25zID0gJyArIGxvZ29OZXdXaWR0aCArICcgeCAnICsgbG9nb05ld0hlaWdodClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvZ29Td2FwQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgICAgIGxvZ29Td2FwQ29tcGFueUNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChidXR0b25Ca2cgJiYgY29sb3IpIHtcbiAgICAgICAgICAgIGJ1dHRvbkJrZy5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgIH1cbiAgICAgICAgICBpc01rdG9FbWFpbDFSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAoaXNNa3RvQnV0dG9uUmVwbGFjZWQgJiZcbiAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkICYmXG4gICAgICAgICAgICBpc01rdG9IZXJvQmdSZXBsYWNlZCAmJlxuICAgICAgICAgICAgKCFta3RvSGVhZGVyIHx8IChta3RvSGVhZGVyICYmIGlzTWt0b0hlYWRlckJnQ29sb3JSZXBsYWNlZCkpKSB8fFxuICAgICAgICAgIGlzTWt0b0VtYWlsMVJlcGxhY2VkXG4gICAgICAgICkge1xuICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgaXNFbWFpbEVkaXRvcjIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGFjdGlvbiA9PSAnZWRpdCcpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgRGVzaWduZXInKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAob3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHwgZWRpdG9yUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBFbWFpbCBEZXNpZ25lciA9ICcgKyBlZGl0b3JSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgSW50ZXJ2YWwgaXMgQ2xlYXJlZCcpXG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0VtYWlsRWRpdG9yMilcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9IGVsc2UgaWYgKGVkaXRvclByZXZSZWFkeSkge1xuICAgICAgICAgICAgZWRpdG9yUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVkaXRvclJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIGVkaXRvclByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlZGl0b3JQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PSAncHJldmlldycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRW1haWwgUHJldmlld2VyJylcbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc0Rlc2t0b3BQcmV2aWV3UmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhQcmV2aWV3UmVwZWF0UmVhZHlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXllZDogRW1haWwgRGVza3RvcCBQcmV2aWV3ID0gJyArIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNEZXNrdG9wUHJldmlld1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChkZXNrdG9wUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc1Bob25lUHJldmlld1JlcGxhY2VkICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJ1xuICAgICAgICApIHtcbiAgICAgICAgICBpZiAob3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHwgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID49IG1heFByZXZpZXdSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBFbWFpbCBQaG9uZSBQcmV2aWV3ID0gJyArIHBob25lUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzUGhvbmVQcmV2aWV3UmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKHBob25lUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBwaG9uZVJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIHBob25lUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBob25lUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1Bob25lUHJldmlld1JlcGxhY2VkICYmIGlzRGVza3RvcFByZXZpZXdSZXBsYWNlZCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEVtYWlsIEludGVydmFsIGlzIENsZWFyZWQnKVxuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzRW1haWxFZGl0b3IyKVxuICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAwKVxuICB9LFxuXG4gIC8vIG92ZXJsYXlzIGEgbGFuZGluZyBwYWdlIHdpdGggdGhlIHVzZXIgc3VibWl0dGVkIGNvbXBhbnkgbG9nbyBhbmQgY29sb3JcbiAgLy8gYWN0aW9uIC0gbW9kZSBpbiB3aGljaCB0aGlzIGFzc2V0IGlzIGJlaW5nIHZpZXdlZCAoZWRpdC9wcmV2aWV3KVxuICBvdmVybGF5TGFuZGluZ1BhZ2U6IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UnKVxuICAgIGxldCBpc0xhbmRpbmdQYWdlRWRpdG9yLFxuICAgICAgY2xlYXJPdmVybGF5VmFycyxcbiAgICAgIG92ZXJsYXksXG4gICAgICBpc01rdG9GcmVlRm9ybSA9XG4gICAgICAgIChpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkID1cbiAgICAgICAgICBpc01rdG9UZXh0UmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b1N1YlRleHRSZXBsYWNlZCA9XG4gICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPVxuICAgICAgICAgIGlzTWt0b09yaWdSZXBsYWNlZCA9XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPVxuICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUHJldlJlYWR5ID1cbiAgICAgICAgICBzaWRlQnlTaWRlUGhvbmVQcmV2UmVhZHkgPVxuICAgICAgICAgIGlzRGVza3RvcFJlcGxhY2VkID1cbiAgICAgICAgICBpc1Bob25lUmVwbGFjZWQgPVxuICAgICAgICAgIGlzU2lkZUJ5U2lkZURlc2t0b3BSZXBsYWNlZCA9XG4gICAgICAgICAgaXNTaWRlQnlTaWRlUGhvbmVSZXBsYWNlZCA9XG4gICAgICAgICAgZmFsc2UpLFxuICAgICAgbWt0b0JvZHlJZCA9ICdib2R5SWQnLFxuICAgICAgbWt0b0ZyZWVGb3JtQ2xhc3NOYW1lID0gJ21rdG9Nb2JpbGVTaG93JyxcbiAgICAgIGxvZ29SZWdleCA9IG5ldyBSZWdFeHAoJ3ByaW1hcnlJbWFnZXxwcmltYXJ5X2ltYWdlfHByaW1hcnktaW1hZ2V8bG9nb3xpbWFnZV8xfGltYWdlLTF8aW1hZ2UxJywgJ2knKSxcbiAgICAgIGhlcm9CZ0ltZ0lkUmVnZXggPSBuZXcgUmVnRXhwKCdoZXJvJywgJ2knKSxcbiAgICAgIGJ1dHRvblRleHRSZWdleCA9IG5ldyBSZWdFeHAoJ3NpZ251cHxzaWduIHVwfGNhbGwgdG8gYWN0aW9ufGN0YXxyZWdpc3Rlcnxtb3JlfGNvbnRyaWJ1dGV8c3VibWl0JywgJ2knKSxcbiAgICAgIHNhdmVFZGl0c1RvZ2dsZSA9IExJQi5nZXRDb29raWUoJ3NhdmVFZGl0c1RvZ2dsZVN0YXRlJyksXG4gICAgICBsb2dvID0gTElCLmdldENvb2tpZSgnbG9nbycpLFxuICAgICAgaGVyb0JhY2tncm91bmQgPSBMSUIuZ2V0Q29va2llKCdoZXJvQmFja2dyb3VuZCcpLFxuICAgICAgY29sb3IgPSBMSUIuZ2V0Q29va2llKCdjb2xvcicpLFxuICAgICAgZGVmYXVsdENvbG9yID0gJ3JnYig0MiwgODMsIDExMiknLFxuICAgICAgbG9nb09yaWdNYXhIZWlnaHQgPSAnNTUnLFxuICAgICAgbWt0b01haW5UZXh0ID0gJ1lvdSBUbyBPdXIgRXZlbnQnLFxuICAgICAgbWt0b1N1YlRleHQgPSBMSUIuZ2V0SHVtYW5EYXRlKCksXG4gICAgICBjb21wYW55LFxuICAgICAgY29tcGFueU5hbWUsXG4gICAgICBsaW5lYXJHcmFkaWVudCxcbiAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gKHBob25lUmVwZWF0UmVhZHlDb3VudCA9IHNpZGVCeVNpZGVEZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA9IHNpZGVCeVNpZGVQaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAwKSxcbiAgICAgIG1heFJlcGVhdFJlYWR5ID0gMjAwMCxcbiAgICAgIG1heE90aGVyUmVwZWF0UmVhZHkgPSAyMDAwLFxuICAgICAgZm9ybWF0QnV0dG9uU3R5bGVcblxuICAgIGlmIChzYXZlRWRpdHNUb2dnbGUgPT0gJ3RydWUnIHx8IChsb2dvID09IG51bGwgJiYgaGVyb0JhY2tncm91bmQgPT0gbnVsbCAmJiBjb2xvciA9PSBudWxsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChsb2dvICE9IG51bGwpIHtcbiAgICAgIGNvbXBhbnkgPSBsb2dvLnNwbGl0KCdodHRwczovL2xvZ28uY2xlYXJiaXQuY29tLycpWzFdLnNwbGl0KCcuJylbMF1cbiAgICAgIGNvbXBhbnlOYW1lID0gY29tcGFueS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGNvbXBhbnkuc2xpY2UoMSlcbiAgICAgIG1rdG9NYWluVGV4dCA9IGNvbXBhbnlOYW1lICsgJyBJbnZpdGVzICcgKyBta3RvTWFpblRleHRcbiAgICB9IGVsc2Uge1xuICAgICAgbWt0b01haW5UZXh0ID0gJ1dlIEludml0ZSAnICsgbWt0b01haW5UZXh0XG4gICAgfVxuXG4gICAgaWYgKGNvbG9yKSB7XG4gICAgICBmb3JtQnV0dG9uU3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gICAgICBmb3JtQnV0dG9uU3R5bGUudHlwZSA9ICd0ZXh0L2NzcydcbiAgICAgIGZvcm1CdXR0b25TdHlsZS5pbm5lckhUTUwgPVxuICAgICAgICAnLm1rdG9CdXR0b24geyBiYWNrZ3JvdW5kLWltYWdlOiBub25lICFpbXBvcnRhbnQ7IGJvcmRlci1yYWRpdXM6IDAgIWltcG9ydGFudDsgYm9yZGVyOiBub25lICFpbXBvcnRhbnQ7IGJhY2tncm91bmQtY29sb3I6ICcgK1xuICAgICAgICBjb2xvciArXG4gICAgICAgICcgIWltcG9ydGFudDsgfSdcbiAgICAgIGxpbmVhckdyYWRpZW50ID0gJ2xpbmVhci1ncmFkaWVudCh0byBib3R0b20sICcgKyBjb2xvciArICcsIHJnYigyNDIsIDI0MiwgMjQyKSkgIWltcG9ydGFudCdcbiAgICB9XG5cbiAgICBjbGVhck92ZXJsYXlWYXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9JbWdSZXBsYWNlZCA9XG4gICAgICAgIGlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvVGV4dFJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvU3ViVGV4dFJlcGxhY2VkID1cbiAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPVxuICAgICAgICBpc01rdG9PcmlnUmVwbGFjZWQgPVxuICAgICAgICBmYWxzZVxuICAgICAgaWZyYW1lQm9keSA9XG4gICAgICAgIGxvZ29JbWcgPVxuICAgICAgICB0ZXh0QmFja2dyb3VuZCA9XG4gICAgICAgIGJhbm5lckJhY2tncm91bmQgPVxuICAgICAgICBtYWluVGl0bGUgPVxuICAgICAgICBzdWJUaXRsZSA9XG4gICAgICAgIG1rdG9JbWdzID1cbiAgICAgICAgbWt0b1RleHRzID1cbiAgICAgICAgbWt0b1JpY2hUZXh0cyA9XG4gICAgICAgIG1rdG9CdXR0b25zID1cbiAgICAgICAgbnVsbFxuICAgIH1cblxuICAgIG92ZXJsYXkgPSBmdW5jdGlvbiAoaWZyYW1lRG9jdW1lbnQpIHtcbiAgICAgIGlmIChpZnJhbWVEb2N1bWVudCkge1xuICAgICAgICBsZXQgaWZyYW1lQm9keSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0sXG4gICAgICAgICAgbG9nb0ltZyA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdscC1sb2dvJyksXG4gICAgICAgICAgdGV4dEJhY2tncm91bmQgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFja2dyb3VuZC1jb2xvcicpLFxuICAgICAgICAgIGJhbm5lckJhY2tncm91bmQgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmlnZ2VyLWJhY2tncm91bmQnKSxcbiAgICAgICAgICBtYWluVGl0bGUgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGl0bGUnKSxcbiAgICAgICAgICBzdWJUaXRsZSA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdWItdGl0bGUnKVxuXG4gICAgICAgIGlmIChpZnJhbWVCb2R5ICYmIGlmcmFtZUJvZHkuaW5uZXJIVE1MKSB7XG4gICAgICAgICAgbGV0IG1rdG9IZWFkZXIgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnaGVhZGVyJylbMF0sXG4gICAgICAgICAgICBta3RvTG9nbzEgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnbG9nbycpWzBdLFxuICAgICAgICAgICAgbWt0b0xvZ28yID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ2xvZ28nKVsxXSxcbiAgICAgICAgICAgIG1rdG9JbWdzID0gaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdscGltZycpLFxuICAgICAgICAgICAgbWt0b0hlcm9CZyA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdoZXJvQmFja2dyb3VuZCcpWzBdLFxuICAgICAgICAgICAgbWt0b1RpdGxlID0gaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoJ3RpdGxlJylbMF0sXG4gICAgICAgICAgICBta3RvU3VidGl0bGUgPSBpZnJhbWVEb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZSgnc3VidGl0bGUnKVswXSxcbiAgICAgICAgICAgIG1rdG9UZXh0cyA9IGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWt0b1RleHQnKSxcbiAgICAgICAgICAgIG1rdG9SaWNoVGV4dHMgPSBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3JpY2hUZXh0U3BhbicpLFxuICAgICAgICAgICAgbWt0b0J1dHRvbiA9IGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKCdidXR0b24nKVswXSxcbiAgICAgICAgICAgIG1rdG9CdXR0b25zID0gaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYnV0dG9uJylcblxuICAgICAgICAgIGlmICghaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgJiYgY29sb3IgJiYgbWt0b0hlYWRlcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIEhlYWRlciBCYWNrZ3JvdW5kIENvbXBhbnkgQ29sb3IgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICBta3RvSGVhZGVyLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBta3RvSGVhZGVyLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSArICc7IGJhY2tncm91bmQ6ICcgKyBsaW5lYXJHcmFkaWVudCArICc7JylcbiAgICAgICAgICAgIGlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgaXNNa3RvRnJlZUZvcm0gPSBmYWxzZVxuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAhaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgJiZcbiAgICAgICAgICAgIGNvbG9yICYmXG4gICAgICAgICAgICAhYmFubmVyQmFja2dyb3VuZCAmJlxuICAgICAgICAgICAgaWZyYW1lQm9keS5pZCA9PSBta3RvQm9keUlkICYmXG4gICAgICAgICAgICBpZnJhbWVCb2R5LmNsYXNzTmFtZSAhPSBudWxsICYmXG4gICAgICAgICAgICBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKSAmJlxuICAgICAgICAgICAgaWZyYW1lQm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JylbMF0gJiZcbiAgICAgICAgICAgIGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpWzBdLnN0eWxlXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAoaWZyYW1lQm9keS5jbGFzc05hbWUuc2VhcmNoKG1rdG9GcmVlRm9ybUNsYXNzTmFtZSkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogRnJlZWZvcm0gTGFuZGluZyBQYWdlIEJhY2tncm91bmQgQ29tcGFueSBDb2xvcicpXG4gICAgICAgICAgICAgIGlmcmFtZUJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpWzBdLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yICsgJyAhaW1wb3J0YW50J1xuICAgICAgICAgICAgICBpc01rdG9CYWNrZ3JvdW5kQ29sb3JSZXBsYWNlZCA9IGlzTWt0b0ZyZWVGb3JtID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogR3VpZGVkIExhbmRpbmcgUGFnZSBCYWNrZ3JvdW5kIENvbXBhbnkgQ29sb3InKVxuICAgICAgICAgICAgICBpZnJhbWVCb2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKVswXS5zdHlsZS5iYWNrZ3JvdW5kID0gbGluZWFyR3JhZGllbnRcbiAgICAgICAgICAgICAgaXNNa3RvQmFja2dyb3VuZENvbG9yUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgIGlzTWt0b0ZyZWVGb3JtID0gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoZm9ybUJ1dHRvblN0eWxlKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaXNNa3RvSW1nUmVwbGFjZWQgJiYgbG9nbyAmJiAobWt0b0xvZ28xIHx8IG1rdG9Mb2dvMiB8fCBta3RvSW1ncy5sZW5ndGggIT0gMCkpIHtcbiAgICAgICAgICAgIGlmIChta3RvTG9nbzEgfHwgbWt0b0xvZ28yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28gZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIGlmIChta3RvTG9nbzEgJiYgbWt0b0xvZ28xLmdldEF0dHJpYnV0ZSgnZGlzcGxheScpICE9ICdub25lJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28gMScpXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgbWt0b0xvZ28xLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMS5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAobWt0b0xvZ28yICYmIG1rdG9Mb2dvMi5nZXRBdHRyaWJ1dGUoJ2Rpc3BsYXknKSAhPSAnbm9uZScpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvIDInKVxuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xuICAgICAgICAgICAgICAgIG1rdG9Mb2dvMi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICBta3RvTG9nbzIuc2V0QXR0cmlidXRlKCdzcmMnLCBsb2dvKVxuICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b0ltZ3MubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvSW1nID0gbWt0b0ltZ3NbaWldXG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc3JjICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlLnRhZ05hbWUgPT0gJ0RJVicgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnBhcmVudE5vZGUuaWQuc2VhcmNoKGxvZ29SZWdleCkgIT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEd1aWRlZCBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvJylcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnNyYyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZSAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZS50YWdOYW1lID09ICdTUEFOJyAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcucGFyZW50Tm9kZS5wYXJlbnROb2RlICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5wYXJlbnROb2RlLnBhcmVudE5vZGUuY2xhc3NOYW1lLnNlYXJjaChsb2dvUmVnZXgpICE9IC0xXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBGcmVlZm9ybSBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvJylcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnN0eWxlLndpZHRoID0gJ2F1dG8nXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5zdHlsZS5oZWlnaHQgPSAnYXV0bydcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgbG9nbylcbiAgICAgICAgICAgICAgICAgIGlzTWt0b0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkICYmIGhlcm9CYWNrZ3JvdW5kICYmIChta3RvSGVyb0JnIHx8IG1rdG9JbWdzLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9IZXJvQmcgJiYgbWt0b0hlcm9CZy5nZXRBdHRyaWJ1dGUoJ3NyYycpKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEd1aWRlZCBMYW5kaW5nIFBhZ2UgSGVybyBDb21wYW55IEJhY2tncm91bmQgZm9yIERlbW8gU3ZjcyBUZW1wbGF0ZScpXG4gICAgICAgICAgICAgIG1rdG9IZXJvQmcuc2V0QXR0cmlidXRlKCdzcmMnLCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgICAgICAgaXNNa3RvSGVyb0JnSW1nUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgbWt0b0ltZ3MubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJNa3RvSW1nID0gbWt0b0ltZ3NbaWldXG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ3NyYycpICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0ltZy5nZXRBdHRyaWJ1dGUoJ2lkJykgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvSW1nLmdldEF0dHJpYnV0ZSgnaWQnKS5zZWFyY2goaGVyb0JnSW1nSWRSZWdleCkgIT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IEd1aWRlZCBMYW5kaW5nIFBhZ2UgSGVybyBDb21wYW55IEJhY2tncm91bmQnKVxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9JbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBoZXJvQmFja2dyb3VuZClcbiAgICAgICAgICAgICAgICAgIGlzTWt0b0hlcm9CZ0ltZ1JlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWlzTWt0b0J1dHRvblJlcGxhY2VkICYmIGNvbG9yICYmIChta3RvQnV0dG9uIHx8IG1rdG9CdXR0b25zLmxlbmd0aCAhPSAwKSkge1xuICAgICAgICAgICAgaWYgKG1rdG9CdXR0b24pIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIEJ1dHRvbiBDb21wYW55IENvbG9yIGZvciBEZW1vIFN2Y3MgVGVtcGxhdGUnKVxuICAgICAgICAgICAgICBta3RvQnV0dG9uLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAnc3R5bGUnLFxuICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSArICc7IGJhY2tncm91bmQtY29sb3I6ICcgKyBjb2xvciArICcgIWltcG9ydGFudDsgYm9yZGVyLWNvbG9yOiAnICsgY29sb3IgKyAnICFpbXBvcnRhbnQ7J1xuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIGlzTWt0b0J1dHRvblJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG1rdG9CdXR0b25zLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyTWt0b0J1dHRvbiA9IG1rdG9CdXR0b25zW2lpXVxuXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24gJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLnN0eWxlICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgY3Vyck1rdG9CdXR0b24uaW5uZXJIVE1MICYmXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5pbm5lckhUTUwuc2VhcmNoKGJ1dHRvblRleHRSZWdleCkgIT0gLTFcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBCdXR0b24gQ29tcGFueSBDb2xvcicpXG4gICAgICAgICAgICAgICAgICBjdXJyTWt0b0J1dHRvbi5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgICAgICdzdHlsZScsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJNa3RvQnV0dG9uLmdldEF0dHJpYnV0ZSgnc3R5bGUnKSArXG4gICAgICAgICAgICAgICAgICAgICc7IGJhY2tncm91bmQtY29sb3I6ICcgK1xuICAgICAgICAgICAgICAgICAgICBjb2xvciArXG4gICAgICAgICAgICAgICAgICAgICcgIWltcG9ydGFudDsgYm9yZGVyLWNvbG9yOiAnICtcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgK1xuICAgICAgICAgICAgICAgICAgICAnICFpbXBvcnRhbnQ7J1xuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgaXNNa3RvQnV0dG9uUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb2dvSW1nICYmIHRleHRCYWNrZ3JvdW5kICYmIHRleHRCYWNrZ3JvdW5kLnN0eWxlICYmIGJhbm5lckJhY2tncm91bmQgJiYgYmFubmVyQmFja2dyb3VuZC5zdHlsZSAmJiBtYWluVGl0bGUgJiYgc3ViVGl0bGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBPcmlnaW5hbCBMYW5kaW5nIFBhZ2UgQ29tcGFueSBMb2dvICYgQ29sb3InKVxuICAgICAgICAgIGlmIChsb2dvKSB7XG4gICAgICAgICAgICBsb2dvSW1nLnNyYyA9IGxvZ29cblxuICAgICAgICAgICAgbG9nb0ltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGxldCBsb2dvSGVpZ2h0c1JhdGlvLCBsb2dvV2lkdGgsIGxvZ29OZXdXaWR0aCwgbG9nb05ld0hlaWdodCwgbG9nb1N0eWxlXG5cbiAgICAgICAgICAgICAgaWYgKGxvZ29JbWcubmF0dXJhbEhlaWdodCAmJiBsb2dvSW1nLm5hdHVyYWxIZWlnaHQgPiBsb2dvT3JpZ01heEhlaWdodCkge1xuICAgICAgICAgICAgICAgIGxvZ29IZWlnaHRzUmF0aW8gPSBsb2dvSW1nLm5hdHVyYWxIZWlnaHQgLyBsb2dvT3JpZ01heEhlaWdodFxuICAgICAgICAgICAgICAgIGxvZ29XaWR0aCA9IGxvZ29JbWcubmF0dXJhbFdpZHRoIC8gbG9nb0hlaWdodHNSYXRpb1xuICAgICAgICAgICAgICAgIGxvZ29JbWcud2lkdGggPSBsb2dvSW1nLnN0eWxlLndpZHRoID0gbG9nb05ld1dpZHRoID0gbG9nb1dpZHRoXG4gICAgICAgICAgICAgICAgbG9nb0ltZy5oZWlnaHQgPSBsb2dvSW1nLnN0eWxlLmhlaWdodCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvT3JpZ01heEhlaWdodFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxvZ29JbWcubmF0dXJhbEhlaWdodCkge1xuICAgICAgICAgICAgICAgIGxvZ29JbWcud2lkdGggPSBsb2dvSW1nLnN0eWxlLndpZHRoID0gbG9nb05ld1dpZHRoID0gbG9nb0ltZy5uYXR1cmFsV2lkdGhcbiAgICAgICAgICAgICAgICBsb2dvSW1nLmhlaWdodCA9IGxvZ29JbWcuc3R5bGUuaGVpZ2h0ID0gbG9nb05ld0hlaWdodCA9IGxvZ29JbWcubmF0dXJhbEhlaWdodFxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvZ29JbWcud2lkdGggPSBsb2dvSW1nLmhlaWdodCA9IGxvZ29JbWcuc3R5bGUud2lkdGggPSBsb2dvSW1nLnN0eWxlLmhlaWdodCA9IGxvZ29OZXdXaWR0aCA9IGxvZ29OZXdIZWlnaHQgPSBsb2dvT3JpZ01heEhlaWdodFxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJykgJiYgaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSkge1xuICAgICAgICAgICAgICAgIGxvZ29TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICAgICAgICAgICAgICBsb2dvU3R5bGUuaW5uZXJIVE1MID1cbiAgICAgICAgICAgICAgICAgICcjJyArIGxvZ29JbWcuaWQgKyAnIHt3aWR0aCA6ICcgKyBsb2dvTmV3V2lkdGggKyAncHggIWltcG9ydGFudDsgaGVpZ2h0IDogJyArIGxvZ29OZXdIZWlnaHQgKyAncHggIWltcG9ydGFudDt9J1xuICAgICAgICAgICAgICAgIGlmcmFtZURvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQobG9nb1N0eWxlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IE9yaWdpbmFsIExhbmRpbmcgUGFnZSBDb21wYW55IExvZ28gRGltZW5zaW9ucyA9ICcgKyBsb2dvTmV3V2lkdGggKyAnIHggJyArIGxvZ29OZXdIZWlnaHQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNvbG9yKSB7XG4gICAgICAgICAgICB0ZXh0QmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvclxuICAgICAgICAgICAgYmFubmVyQmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvclxuICAgICAgICAgICAgaWZyYW1lRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChmb3JtQnV0dG9uU3R5bGUpXG4gICAgICAgICAgfVxuICAgICAgICAgIG1haW5UaXRsZS5pbm5lckhUTUwgPSBta3RvTWFpblRleHRcbiAgICAgICAgICBzdWJUaXRsZS5pbm5lckhUTUwgPSBta3RvU3ViVGV4dFxuICAgICAgICAgIGlzTWt0b09yaWdSZXBsYWNlZCA9IGlzTWt0b0ZyZWVGb3JtID0gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIChpc01rdG9CdXR0b25SZXBsYWNlZCAmJlxuICAgICAgICAgICAgLy8mJiBpc01rdG9TdWJUZXh0UmVwbGFjZWRcbiAgICAgICAgICAgIC8vJiYgaXNNa3RvVGV4dFJlcGxhY2VkXG4gICAgICAgICAgICBpc01rdG9IZXJvQmdJbWdSZXBsYWNlZCAmJlxuICAgICAgICAgICAgaXNNa3RvSW1nUmVwbGFjZWQgJiZcbiAgICAgICAgICAgIGlzTWt0b0JhY2tncm91bmRDb2xvclJlcGxhY2VkKSB8fFxuICAgICAgICAgIGlzTWt0b09yaWdSZXBsYWNlZFxuICAgICAgICApIHtcbiAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBpc0xhbmRpbmdQYWdlRWRpdG9yID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChhY3Rpb24gPT0gJ2VkaXQnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBEZXNpZ25lcicpXG4gICAgICAgIGlmIChcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fCBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBMYW5kaW5nIFBhZ2UgRGVza3RvcCBEZXNpZ25lciA9ICcgKyBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzRGVza3RvcFJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChkZXNrdG9wUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBkZXNrdG9wUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGlzTWt0b0ZyZWVGb3JtICYmXG4gICAgICAgICAgIWlzUGhvbmVSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8IHBob25lUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBGcmVlZm9ybSBMYW5kaW5nIFBhZ2UgUGhvbmUgRGVzaWduZXIgPSAnICsgcGhvbmVSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNQaG9uZVJlcGxhY2VkID0gdHJ1ZVxuICAgICAgICAgICAgY2xlYXJPdmVybGF5VmFycygpXG4gICAgICAgICAgfSBlbHNlIGlmIChwaG9uZVByZXZSZWFkeSkge1xuICAgICAgICAgICAgcGhvbmVSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGhvbmVSZXBlYXRSZWFkeUNvdW50ID0gMVxuICAgICAgICAgIH1cbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwaG9uZVByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgKCFpc01rdG9GcmVlRm9ybSAmJlxuICAgICAgICAgICAgaXNEZXNrdG9wUmVwbGFjZWQgJiZcbiAgICAgICAgICAgICFkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLmlubmVySFRNTCkgfHxcbiAgICAgICAgICAoaXNNa3RvRnJlZUZvcm0gJiYgaXNQaG9uZVJlcGxhY2VkICYmIGlzRGVza3RvcFJlcGxhY2VkKVxuICAgICAgICApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5aW5nOiBMYW5kaW5nIFBhZ2UgSW50ZXJ2YWwgaXMgQ2xlYXJlZCcpXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaXNMYW5kaW5nUGFnZUVkaXRvcilcbiAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PSAncHJldmlldycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWluZzogTGFuZGluZyBQYWdlIFByZXZpZXdlcicpXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhaXNEZXNrdG9wUmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMl0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzJdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChvdmVybGF5KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsyXS5jb250ZW50V2luZG93LmRvY3VtZW50KSB8fCBkZXNrdG9wUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhSZXBlYXRSZWFkeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBMYW5kaW5nIFBhZ2UgRGVza3RvcCBQcmV2aWV3ID0gJyArIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KVxuICAgICAgICAgICAgaXNEZXNrdG9wUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlc2t0b3BQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIGRlc2t0b3BSZXBlYXRSZWFkeUNvdW50KytcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIGRlc2t0b3BQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVza3RvcFByZXZSZWFkeSA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgIWlzUGhvbmVSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVszXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbM10uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzNdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8IHBob25lUmVwZWF0UmVhZHlDb3VudCA+PSBtYXhPdGhlclJlcGVhdFJlYWR5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBPdmVybGF5ZWQ6IExhbmRpbmcgUGFnZSBQaG9uZSBQcmV2aWV3ID0gJyArIHBob25lUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzUGhvbmVSZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIH0gZWxzZSBpZiAocGhvbmVQcmV2UmVhZHkpIHtcbiAgICAgICAgICAgIHBob25lUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBob25lUmVwZWF0UmVhZHlDb3VudCA9IDFcbiAgICAgICAgICB9XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGhvbmVQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICFpc1NpZGVCeVNpZGVEZXNrdG9wUmVwbGFjZWQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0gJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMF0uY29udGVudFdpbmRvdyAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVswXS5jb250ZW50V2luZG93LmRvY3VtZW50ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG92ZXJsYXkoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQpIHx8XG4gICAgICAgICAgICBzaWRlQnlTaWRlRGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPj0gbWF4T3RoZXJSZXBlYXRSZWFkeVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBMYW5kaW5nIFBhZ2UgU2lkZSBieSBTaWRlIERlc2t0b3AgUHJldmlldyA9ICcgKyBzaWRlQnlTaWRlRGVza3RvcFJlcGVhdFJlYWR5Q291bnQpXG4gICAgICAgICAgICBpc1NpZGVCeVNpZGVEZXNrdG9wUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZGVCeVNpZGVEZXNrdG9wUHJldlJlYWR5KSB7XG4gICAgICAgICAgICBzaWRlQnlTaWRlRGVza3RvcFJlcGVhdFJlYWR5Q291bnQrK1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzaWRlQnlTaWRlRGVza3RvcFJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUHJldlJlYWR5ID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNpZGVCeVNpZGVEZXNrdG9wUHJldlJlYWR5ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhaXNTaWRlQnlTaWRlUGhvbmVSZXBsYWNlZCAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXSAmJlxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKVsxXS5jb250ZW50V2luZG93ICYmXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpWzFdLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgJiZcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgb3ZlcmxheShkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaWZyYW1lJylbMV0uY29udGVudFdpbmRvdy5kb2N1bWVudCkgfHxcbiAgICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVJlcGVhdFJlYWR5Q291bnQgPj0gbWF4T3RoZXJSZXBlYXRSZWFkeVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJz4gT3ZlcmxheWVkOiBMYW5kaW5nIFBhZ2UgU2lkZSBieSBTaWRlIFBob25lIFByZXZpZXcgPSAnICsgc2lkZUJ5U2lkZVBob25lUmVwZWF0UmVhZHlDb3VudClcbiAgICAgICAgICAgIGlzU2lkZUJ5U2lkZVBob25lUmVwbGFjZWQgPSB0cnVlXG4gICAgICAgICAgICBjbGVhck92ZXJsYXlWYXJzKClcbiAgICAgICAgICB9IGVsc2UgaWYgKHNpZGVCeVNpZGVQaG9uZVByZXZSZWFkeSkge1xuICAgICAgICAgICAgc2lkZUJ5U2lkZVBob25lUmVwZWF0UmVhZHlDb3VudCsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVJlcGVhdFJlYWR5Q291bnQgPSAxXG4gICAgICAgICAgfVxuICAgICAgICAgIHNpZGVCeVNpZGVQaG9uZVByZXZSZWFkeSA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzaWRlQnlTaWRlUGhvbmVQcmV2UmVhZHkgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzU2lkZUJ5U2lkZVBob25lUmVwbGFjZWQgJiYgaXNTaWRlQnlTaWRlRGVza3RvcFJlcGxhY2VkICYmIGlzUGhvbmVSZXBsYWNlZCAmJiBpc0Rlc2t0b3BSZXBsYWNlZCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCc+IE92ZXJsYXlpbmc6IExhbmRpbmcgUGFnZSBJbnRlcnZhbCBpcyBDbGVhcmVkJylcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0xhbmRpbmdQYWdlRWRpdG9yKVxuICAgICAgICAgIGNsZWFyT3ZlcmxheVZhcnMoKVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAwKVxuICB9LFxuXG4gIGdldFByb2dyYW1Bc3NldERldGFpbHM6IGZ1bmN0aW9uIChwcm9ncmFtQ29tcElkKSB7XG4gICAgbGV0IHJlc3VsdCA9IExJQi53ZWJSZXF1ZXN0KFxuICAgICAgJy9tYXJrZXRpbmdFdmVudC9nZXRMb2NhbEFzc2V0RGV0YWlscycsXG4gICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAnJmNvbXBJZD0nICtcbiAgICAgIHByb2dyYW1Db21wSWQgK1xuICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICdQT1NUJyxcbiAgICAgIGZhbHNlLFxuICAgICAgJycsXG4gICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHJlc3BvbnNlICYmXG4gICAgICAgICAgcmVzcG9uc2UuSlNPTlJlc3VsdHMgJiZcbiAgICAgICAgICByZXNwb25zZS5KU09OUmVzdWx0cy5sb2NhbEFzc2V0SW5mbyAmJlxuICAgICAgICAgIChyZXNwb25zZS5KU09OUmVzdWx0cy5sb2NhbEFzc2V0SW5mby5zbWFydENhbXBhaWducyB8fFxuICAgICAgICAgICAgKHJlc3BvbnNlLkpTT05SZXN1bHRzLmxvY2FsQXNzZXRJbmZvLmFzc2V0TGlzdFswXSAmJiByZXNwb25zZS5KU09OUmVzdWx0cy5sb2NhbEFzc2V0SW5mby5hc3NldExpc3RbMF0udHJlZSkpXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiByZXNwb25zZS5KU09OUmVzdWx0cy5sb2NhbEFzc2V0SW5mb1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICBnZXRQcm9ncmFtU2V0dGluZ3M6IGZ1bmN0aW9uIChwcm9ncmFtVHJlZU5vZGUpIHtcbiAgICBsZXQgcmVzdWx0ID0gTElCLndlYlJlcXVlc3QoXG4gICAgICAnL21hcmtldGluZ0V2ZW50L2dldFByb2dyYW1TZXR0aW5nc0RhdGEnLFxuICAgICAgJyZzdGFydD0wJyArXG4gICAgICAnJnF1ZXJ5PScgK1xuICAgICAgJyZjb21wSWQ9JyArXG4gICAgICBwcm9ncmFtVHJlZU5vZGUuY29tcElkICtcbiAgICAgICcmY29tcFR5cGU9JyArXG4gICAgICBwcm9ncmFtVHJlZU5vZGUuY29tcFR5cGUgK1xuICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICdQT1NUJyxcbiAgICAgIGZhbHNlLFxuICAgICAgJycsXG4gICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcbiAgICAgICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sXG5cbiAgZ2V0VGFnczogZnVuY3Rpb24gKCkge1xuICAgIGxldCByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICcvbWFya2V0aW5nRXZlbnQvZ2V0QWxsRGVzY3JpcHRvcnMnLFxuICAgICAgJyZzdGFydD0wJyArICcmeHNyZklkPScgKyBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICdQT1NUJyxcbiAgICAgIGZhbHNlLFxuICAgICAgJycsXG4gICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgICBsZXQgY3VyclRhZyxcbiAgICAgICAgICAgIGpqID0gMCxcbiAgICAgICAgICAgIGN1c3RvbVRhZ3MgPSBbXVxuICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCByZXNwb25zZS5kYXRhLmRlc2NyaXB0b3JzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgY3VyclRhZyA9IHJlc3BvbnNlLmRhdGEuZGVzY3JpcHRvcnNbaWldXG4gICAgICAgICAgICBpZiAoY3VyclRhZy50eXBlICE9ICdjaGFubmVsJykge1xuICAgICAgICAgICAgICBjdXN0b21UYWdzW2pqXSA9IGN1cnJUYWdcbiAgICAgICAgICAgICAgamorK1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY3VzdG9tVGFnc1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICBhcHBseU1hc3NDbG9uZTogZnVuY3Rpb24gKE9CSiwgZm9yY2VSZWxvYWQpIHtcbiAgICBjb25zb2xlLmxvZygnPiBBcHBseWluZzogTWFzcyBDbG9uZSBNZW51IEl0ZW0nKVxuICAgIGxldCBtYXNzQ2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy50cmlnZ2VyZWRGcm9tID09ICd0cmVlJyAmJiB0aGlzLmdldCgnbmV3TG9jYWxBc3NldCcpKSB7XG4gICAgICAgIGxldCBtYXNzQ2xvbmVJdGVtID0gdGhpcy5nZXQoJ25ld0xvY2FsQXNzZXQnKS5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgIG1hc3NDbG9uZUl0ZW1JZCA9ICdjbG9uZVZlcnRpY2FsJyxcbiAgICAgICAgICBjdXJyRXhwTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5pZClcblxuICAgICAgICBpZiAoIXRoaXMuZ2V0KG1hc3NDbG9uZUl0ZW1JZCkpIHtcbiAgICAgICAgICBtYXNzQ2xvbmVJdGVtLml0ZW1JZCA9IG1hc3NDbG9uZUl0ZW1JZFxuICAgICAgICAgIG1hc3NDbG9uZUl0ZW0udGV4dCA9ICdNYXNzIENsb25lJ1xuICAgICAgICAgIG1hc3NDbG9uZUl0ZW0uc2V0SGFuZGxlcihmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGxldCBjbG9uZUZvcm0gPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtcbiAgICAgICAgICAgICAgICBjbG9uZUZyb21JZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcElkLFxuICAgICAgICAgICAgICAgIGNsb25lTmFtZTogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMudGV4dCxcbiAgICAgICAgICAgICAgICBhY2Nlc3Nab25lSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmFjY2Vzc1pvbmVJZFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgY2xvbmVGcm9tRmllbGQgPSBjbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBGcm9tJylbMF0uY2xvbmVDb25maWcoKSxcbiAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQgPSBjbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXRGaWVsZCA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe1xuICAgICAgICAgICAgICAgIGNsb25lRnJvbUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wSWQsXG4gICAgICAgICAgICAgICAgY2xvbmVOYW1lOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0LFxuICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmFtZScpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIHRhZ05hbWVGaWVsZCA9IG5ldyBNa3QuYXBwcy5tYXJrZXRpbmdFdmVudC5NYXJrZXRpbmdFdmVudEZvcm0oe1xuICAgICAgICAgICAgICAgIGNsb25lRnJvbUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wSWQsXG4gICAgICAgICAgICAgICAgY2xvbmVOYW1lOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy50ZXh0LFxuICAgICAgICAgICAgICAgIGFjY2Vzc1pvbmVJZDogdGhpcy5vd25lckN0LmN1cnJOb2RlLmF0dHJpYnV0ZXMuYWNjZXNzWm9uZUlkXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2xvbmUgVG8nKVswXVxuICAgICAgICAgICAgICAgIC5jbG9uZUNvbmZpZygpLFxuICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkID0gbmV3IE1rdC5hcHBzLm1hcmtldGluZ0V2ZW50Lk1hcmtldGluZ0V2ZW50Rm9ybSh7XG4gICAgICAgICAgICAgICAgY2xvbmVGcm9tSWQ6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBJZCxcbiAgICAgICAgICAgICAgICBjbG9uZU5hbWU6IHRoaXMub3duZXJDdC5jdXJyTm9kZS5hdHRyaWJ1dGVzLnRleHQsXG4gICAgICAgICAgICAgICAgYWNjZXNzWm9uZUlkOiB0aGlzLm93bmVyQ3QuY3Vyck5vZGUuYXR0cmlidXRlcy5hY2Nlc3Nab25lSWRcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluZCgnZmllbGRMYWJlbCcsICdDbG9uZSBUbycpWzBdXG4gICAgICAgICAgICAgICAgLmNsb25lQ29uZmlnKCksXG4gICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0gPSBuZXcgTWt0LmFwcHMubWFya2V0aW5nRXZlbnQuTWFya2V0aW5nRXZlbnRGb3JtKHtjdXJyTm9kZTogdGhpcy5vd25lckN0LmN1cnJOb2RlfSksXG4gICAgICAgICAgICAgIGN1c3RvbVRhZ3MsXG4gICAgICAgICAgICAgIGN1cnJDdXN0b21UYWcsXG4gICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdOYW1lLFxuICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnVmFsdWVcbiAgICAgICAgICAgIGVsLnBhcmVudE1lbnUuaGlkZSh0cnVlKVxuXG4gICAgICAgICAgICBsZXQgaXNDbG9uZVZlcnRpY2FsRm9ybSA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5idXR0b25zWzFdICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5idXR0b25zWzFdLnNldEhhbmRsZXIgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2hhbm5lbCcpWzBdICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5uZWwnKVswXS5kZXN0cm95ICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0Rlc2NyaXB0aW9uJylbMF0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnRGVzY3JpcHRpb24nKVswXS5kZXN0cm95ICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ1Byb2dyYW0gVHlwZScpWzBdICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ1Byb2dyYW0gVHlwZScpWzBdLmRlc3Ryb3kgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2FtcGFpZ24gRm9sZGVyJylbMF0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnQ2FtcGFpZ24gRm9sZGVyJylbMF0uZmllbGRMYWJlbCAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdOYW1lJylbMF0gJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmFtZScpWzBdLmZpZWxkTGFiZWwgJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLml0ZW1zLmxhc3QoKS5zZXRUZXh0ICYmXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pdGVtcy5sYXN0KCkuc2V0VmlzaWJsZSAmJlxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2V0V2lkdGggJiZcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLnNldEhlaWdodFxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0Nsb25lVmVydGljYWxGb3JtKVxuXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5zZXRUaXRsZSgnTWFzcyBDbG9uZScpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5idXR0b25zWzFdLnNldFRleHQoJ0Nsb25lJylcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmJ1dHRvbnNbMV0uY3Vyck5vZGUgPSBtYXNzQ2xvbmVGb3JtLmN1cnJOb2RlXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5uZWwnKVswXS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnRGVzY3JpcHRpb24nKVswXS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUHJvZ3JhbSBUeXBlJylbMF0uZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0NhbXBhaWduIEZvbGRlcicpWzBdLmZpZWxkTGFiZWwgPSAnQ2xvbmUgVG8nXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ05hbWUnKVswXS5maWVsZExhYmVsID0gJ1Byb2dyYW0gU3VmZml4J1xuXG4gICAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQuZmllbGRMYWJlbCA9ICdTaG93IE1vcmUgT3B0aW9ucydcbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5pdGVtQ2xzID0gJydcbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLnNldCgndGV4dCcsICdObycpXG4gICAgICAgICAgICAgICAgc2hvd01vcmVPcHRpb25zRmllbGQuc3RvcmUuZGF0YS5pdGVtc1sxXS5zZXQoJ3RleHQnLCAnWWVzJylcblxuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLmZpZWxkTGFiZWwgPSAnU0MgQWN0aXZhdGlvbiBTdGF0ZSdcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5pdGVtQ2xzID0gJydcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzBdLnNldCgndGV4dCcsICdJbmhlcml0IFN0YXRlJylcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzFdLnNldCgndGV4dCcsICdGb3JjZSBBY3RpdmF0ZScpXG5cbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5maWVsZExhYmVsID0gJ1BlcmlvZCBDb3N0IERhdGEnXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQuaXRlbUNscyA9ICcnXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lRmllbGQuc3RvcmUuZGF0YS5pdGVtc1swXS5zZXQoJ3RleHQnLCAnSW5oZXJpdCBEYXRhJylcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzFdLnNldCgndGV4dCcsICdCYXNlbGluZSBEYXRhJylcblxuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLmZpZWxkTGFiZWwgPSAnUGVyaW9kIENvc3QgTW9udGhzJ1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLml0ZW1DbHMgPSAnbWt0UmVxdWlyZWQnXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQuc3RvcmUuZGF0YS5pdGVtc1swXS5zZXQoJ3RleHQnLCAnMTIgTW9udGhzJylcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5zdG9yZS5kYXRhLml0ZW1zWzFdLnNldCgndGV4dCcsICcyNCBNb250aHMnKVxuXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldEZpZWxkLmZpZWxkTGFiZWwgPSAnUGVyaW9kIENvc3QgT2Zmc2V0J1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXRGaWVsZC5pdGVtQ2xzID0gJydcblxuICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5maWVsZExhYmVsID0gJ0NoYW5nZSBUYWcgVHlwZSdcbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQuaXRlbUNscyA9ICcnXG5cbiAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLmZpZWxkTGFiZWwgPSAnTmV3IFRhZyBWYWx1ZSdcbiAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLml0ZW1DbHMgPSAnbWt0UmVxdWlyZWQnXG5cbiAgICAgICAgICAgICAgICBsZXQgb3JpZ09uU2VsZWN0ID0gc2hvd01vcmVPcHRpb25zRmllbGQub25TZWxlY3RcbiAgICAgICAgICAgICAgICBzaG93TW9yZU9wdGlvbnNGaWVsZC5vblNlbGVjdCA9IGZ1bmN0aW9uIChkb0ZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICBvcmlnT25TZWxlY3QuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdTQyBBY3RpdmF0aW9uIFN0YXRlJylbMF0ubGFiZWwuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdTQyBBY3RpdmF0aW9uIFN0YXRlJylbMF0uc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBEYXRhJylbMF0ubGFiZWwuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBEYXRhJylbMF0uc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdDaGFuZ2UgVGFnIFR5cGUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ0NoYW5nZSBUYWcgVHlwZScpWzBdLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1NDIEFjdGl2YXRpb24gU3RhdGUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdTQyBBY3RpdmF0aW9uIFN0YXRlJylbMF0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgRGF0YScpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IERhdGEnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdDaGFuZ2UgVGFnIFR5cGUnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdDaGFuZ2UgVGFnIFR5cGUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5vblNlbGVjdCA9IGZ1bmN0aW9uIChkb0ZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICBvcmlnT25TZWxlY3QuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gMikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ1BlcmlvZCBDb3N0IE1vbnRocycpWzBdLnNldFZpc2libGUodHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnUGVyaW9kIENvc3QgT2Zmc2V0JylbMF0ubGFiZWwuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBPZmZzZXQnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdQZXJpb2QgQ29zdCBNb250aHMnKVswXS5sYWJlbC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQub25TZWxlY3QgPSBmdW5jdGlvbiAoZG9Gb2N1cykge1xuICAgICAgICAgICAgICAgICAgb3JpZ09uU2VsZWN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ05ldyBUYWcgVmFsdWUnKVswXS5sYWJlbC5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXJDdC5maW5kKCdmaWVsZExhYmVsJywgJ05ldyBUYWcgVmFsdWUnKVswXS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyQ3QuZmluZCgnZmllbGRMYWJlbCcsICdOZXcgVGFnIFZhbHVlJylbMF0uc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lckN0LmZpbmQoJ2ZpZWxkTGFiZWwnLCAnTmV3IFRhZyBWYWx1ZScpWzBdLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQoMCwgY2xvbmVGcm9tRmllbGQpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQobWFzc0Nsb25lRm9ybS5pdGVtcy5sZW5ndGggLSAxLCBzaG93TW9yZU9wdGlvbnNGaWVsZClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHNjQWN0aXZhdGlvbkZpZWxkKVxuICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvbkZpZWxkLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pbnNlcnQobWFzc0Nsb25lRm9ybS5pdGVtcy5sZW5ndGggLSAxLCBwZXJpb2RDb3N0Q2xvbmVGaWVsZClcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uaW5zZXJ0KG1hc3NDbG9uZUZvcm0uaXRlbXMubGVuZ3RoIC0gMSwgcGVyaW9kQ29zdE1vbnRoRmllbGQpXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE1vbnRoRmllbGQuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHBlcmlvZENvc3RPZmZzZXRGaWVsZClcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0RmllbGQuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHRhZ05hbWVGaWVsZClcbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLmluc2VydChtYXNzQ2xvbmVGb3JtLml0ZW1zLmxlbmd0aCAtIDEsIHRhZ1ZhbHVlRmllbGQpXG4gICAgICAgICAgICAgICAgdGFnVmFsdWVGaWVsZC5zZXRWaXNpYmxlKGZhbHNlKVxuXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5idXR0b25zWzFdLnNldEhhbmRsZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgbGV0IHdhaXRNc2cgPSBuZXcgRXh0LldpbmRvdyh7XG4gICAgICAgICAgICAgICAgICAgIGNsb3NhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtb2RhbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDUyMCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAyMjUsXG4gICAgICAgICAgICAgICAgICAgIGNsczogJ21rdE1vZGFsRm9ybScsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnUGxlYXNlIFdhaXQgLi4uJyxcbiAgICAgICAgICAgICAgICAgICAgaHRtbDpcbiAgICAgICAgICAgICAgICAgICAgICAnPGI+TWFzcyBDbG9uaW5nOjwvYj4gIDxpPicgK1xuICAgICAgICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uY3Vyck5vZGUudGV4dCArXG4gICAgICAgICAgICAgICAgICAgICAgJzwvaT48YnI+PGJyPlRoaXMgbWF5IHRha2Ugc2V2ZXJhbCBtaW51dGVzIGRlcGVuZGluZyBvbiB0aGUgcXVhbnRpdHkgb2YgcHJvZ3JhbXMgYW5kIGFzc2V0cyBjb250YWluZWQgdGhlcmVpbi4nXG4gICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgY2xvbmVUb0ZvbGRlcklkID0gbWFzc0Nsb25lRm9ybS5maW5kKCdmaWVsZExhYmVsJywgJ0Nsb25lIFRvJylbMF0uZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgY2xvbmVUb1N1ZmZpeCA9IG1hc3NDbG9uZUZvcm0uZmluZCgnZmllbGRMYWJlbCcsICdQcm9ncmFtIFN1ZmZpeCcpWzBdLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIGNsb25lVG9UcmVlTm9kZSA9IE1rdEV4cGxvcmVyLmdldE5vZGVCeUlkKGNsb25lVG9Gb2xkZXJJZCksXG4gICAgICAgICAgICAgICAgICAgIHNjQWN0aXZhdGlvblN0YXRlID0gc2NBY3RpdmF0aW9uRmllbGQuZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kQ29zdENsb25lID0gcGVyaW9kQ29zdENsb25lRmllbGQuZ2V0VmFsdWUoKSxcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldCA9IHBlcmlvZENvc3RPZmZzZXRGaWVsZC5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICB0YWdOYW1lID0gdGFnTmFtZUZpZWxkLmdldFZhbHVlKCksXG4gICAgICAgICAgICAgICAgICAgIHRhZ1ZhbHVlID0gdGFnVmFsdWVGaWVsZC5nZXRWYWx1ZSgpLFxuICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGUsXG4gICAgICAgICAgICAgICAgICAgIGluaGVyaXRQZXJpb2RDb3N0LFxuICAgICAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGgsXG4gICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyxcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICB3YWl0TXNnU2hvd1xuXG4gICAgICAgICAgICAgICAgICBpZiAoc2NBY3RpdmF0aW9uU3RhdGUgPT0gMikge1xuICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGUgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAocGVyaW9kQ29zdENsb25lID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3QgPSB0cnVlXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbmhlcml0UGVyaW9kQ29zdCA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aCA9IHBlcmlvZENvc3RNb250aEZpZWxkLmdldFZhbHVlKClcblxuICAgICAgICAgICAgICAgICAgICBpZiAocGVyaW9kQ29zdE1vbnRoID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMgPSAxMlxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBlcmlvZENvc3RNb250aCA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID0gMjRcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMgPSAwXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTnVtYmVyKHBhcnNlSW50KHBlcmlvZENvc3RPZmZzZXQpKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHBlcmlvZENvc3RPZmZzZXQgPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5jbG9zZSgpXG4gICAgICAgICAgICAgICAgICB3YWl0TXNnU2hvdyA9IHdhaXRNc2cuc2hvdygpXG4gICAgICAgICAgICAgICAgICBPQkouaGVhcFRyYWNrKCd0cmFjaycsIHtuYW1lOiAnTWFzcyBDbG9uZScsIGFzc2V0TmFtZTogJ1Rvb2wnfSlcblxuICAgICAgICAgICAgICAgICAgbGV0IGlzV2FpdE1zZ1Nob3cgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAod2FpdE1zZ1Nob3cpIHtcbiAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc1dhaXRNc2dTaG93KVxuICAgICAgICAgICAgICAgICAgICAgIGxldCBjdXJyVHJlZU5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9uZUZvbGRlclJlc3BvbnNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZVxuXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKF90aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXNzIENsb25lIEAgRm9sZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpaSA9IDA7IF90aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY2hpbGRyZW4gJiYgaWkgPCBfdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNoaWxkcmVuLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyVHJlZU5vZGUgPSBfdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNoaWxkcmVuW2lpXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyVHJlZU5vZGUuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIEZvbGRlciB3aXRoIEZvbGRlciBjaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lRm9sZGVyUmVzcG9uc2UgPSBMSUIuY2xvbmVGb2xkZXIoY3VyclRyZWVOb2RlLnRleHQsIGNsb25lVG9TdWZmaXgsIGNsb25lVG9Gb2xkZXJJZClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZUZvbGRlclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqaiA9IDA7IGN1cnJUcmVlTm9kZS5jaGlsZHJlbiAmJiBqaiA8IGN1cnJUcmVlTm9kZS5jaGlsZHJlbi5sZW5ndGg7IGpqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJUcmVlTm9kZS5jaGlsZHJlbltqal0uY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIEZvbGRlciB3aXRoIEZvbGRlciBkZXB0aCBvZiAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJGb2xkZXJUcmVlTm9kZSA9IGN1cnJUcmVlTm9kZS5jaGlsZHJlbltqal1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lRm9sZGVyUmVzcG9uc2UgPSBMSUIuY2xvbmVGb2xkZXIoY3VyckZvbGRlclRyZWVOb2RlLnRleHQsIGNsb25lVG9TdWZmaXgsIGN1cnJGb2xkZXJUcmVlTm9kZS5pZClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9uZUZvbGRlclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGVcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2sgPSAwOyBjdXJyRm9sZGVyVHJlZU5vZGUuY2hpbGRyZW4gJiYga2sgPCBjdXJyRm9sZGVyVHJlZU5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBraysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlID0gY3VyckZvbGRlclRyZWVOb2RlLmNoaWxkcmVuW2trXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlID0gTElCLmNsb25lUHJvZ3JhbShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVRvU3VmZml4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lRm9sZGVyUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGluaGVyaXRQZXJpb2RDb3N0IHx8IG51bU9mUGVyaW9kQ29zdE1vbnRocyA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVQZXJpb2RDb3N0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludChwZXJpb2RDb3N0T2Zmc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcElkOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcFR5cGU6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiYgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJiB0YWdOYW1lICYmIHRhZ1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVRhZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVOdXJ0dXJlQ2FkZW5jZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmNsb25lU21hcnRDYW1wYWlnblN0YXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtUmVwb3J0RmlsdGVyKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3MgQ2xvbmUgQCBGb2xkZXIgd2l0aCBGb2xkZXIgZGVwdGggb2YgMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlID0gY3VyclRyZWVOb2RlLmNoaWxkcmVuW2pqXVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UgPSBMSUIuY2xvbmVQcm9ncmFtKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVUb1N1ZmZpeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lRm9sZGVyUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3MoY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpbmhlcml0UGVyaW9kQ29zdCB8fCBudW1PZlBlcmlvZENvc3RNb250aHMgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZVBlcmlvZENvc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1PZlBlcmlvZENvc3RNb250aHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQocGVyaW9kQ29zdE9mZnNldCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wSWQ6IGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBUeXBlOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcFR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJiBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhICYmIHRhZ05hbWUgJiYgdGFnVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1UYWcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5jbG9uZU51cnR1cmVDYWRlbmNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmNsb25lU21hcnRDYW1wYWlnblN0YXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuc2V0UHJvZ3JhbVJlcG9ydEZpbHRlcihnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzcyBDbG9uZSBAIEZvbGRlciB3aXRoIFByb2dyYW0gY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUgPSBjdXJyVHJlZU5vZGVcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlID0gTElCLmNsb25lUHJvZ3JhbShjbG9uZVRvU3VmZml4LCBjbG9uZVRvRm9sZGVySWQsIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lUHJvZ3JhbVJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPcmlnUHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5oZXJpdFBlcmlvZENvc3QgfHwgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVQZXJpb2RDb3N0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtT2ZQZXJpb2RDb3N0TW9udGhzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHBlcmlvZENvc3RPZmZzZXQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaGVyaXRQZXJpb2RDb3N0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgPSBMSUIuZ2V0UHJvZ3JhbVNldHRpbmdzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcElkOiBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wVHlwZTogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UgJiYgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSAmJiB0YWdOYW1lICYmIHRhZ1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtVGFnKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ1ZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUIuY2xvbmVOdXJ0dXJlQ2FkZW5jZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSA9IExJQi5jbG9uZVNtYXJ0Q2FtcGFpZ25TdGF0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY0ZvcmNlQWN0aXZhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1SZXBvcnRGaWx0ZXIoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3MgQ2xvbmUgQCBQcm9ncmFtXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3Vyck9yaWdQcm9ncmFtVHJlZU5vZGUgPSBfdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlID0gTElCLmNsb25lUHJvZ3JhbShjbG9uZVRvU3VmZml4LCBjbG9uZVRvRm9sZGVySWQsIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlID0gTElCLmdldFByb2dyYW1TZXR0aW5ncyhjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JpZ1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5oZXJpdFBlcmlvZENvc3QgfHwgbnVtT2ZQZXJpb2RDb3N0TW9udGhzID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lUGVyaW9kQ29zdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldE9yaWdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bU9mUGVyaW9kQ29zdE1vbnRocyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KHBlcmlvZENvc3RPZmZzZXQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJpdFBlcmlvZENvc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICBnZXROZXdQcm9ncmFtU2V0dGluZ3NSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtU2V0dGluZ3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBJZDogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wVHlwZTogY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlICYmIGdldE5ld1Byb2dyYW1TZXR0aW5nc1Jlc3BvbnNlLmRhdGEgJiYgdGFnTmFtZSAmJiB0YWdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQi5zZXRQcm9ncmFtVGFnKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbVNldHRpbmdzUmVzcG9uc2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUHJvZ3JhbVJlc3BvbnNlLkpTT05SZXN1bHRzLmFjdGlvbnNbMF0ucGFyYW1ldGVyc1swXVswXS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvbmVQcm9ncmFtUmVzcG9uc2UuSlNPTlJlc3VsdHMuYWN0aW9uc1swXS5wYXJhbWV0ZXJzWzBdWzBdLmNvbXBUeXBlID09ICdOdXJ0dXJlIFByb2dyYW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLmNsb25lTnVydHVyZUNhZGVuY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyT3JpZ1Byb2dyYW1UcmVlTm9kZS5jb21wSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlID0gTElCLmNsb25lU21hcnRDYW1wYWlnblN0YXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVByb2dyYW1SZXNwb25zZS5KU09OUmVzdWx0cy5hY3Rpb25zWzBdLnBhcmFtZXRlcnNbMF1bMF0uY29tcElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjRm9yY2VBY3RpdmF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgTElCLnNldFByb2dyYW1SZXBvcnRGaWx0ZXIoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLCBjbG9uZVRvRm9sZGVySWQpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIExJQi5yZWxvYWRNYXJrZXRpbmdBY3Rpdml0ZXMoKVxuICAgICAgICAgICAgICAgICAgICAgIHdhaXRNc2cuY2xvc2UoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLnNob3coKVxuICAgICAgICAgICAgICAgIHNob3dNb3JlT3B0aW9uc0ZpZWxkLm9uU2VsZWN0KHNob3dNb3JlT3B0aW9uc0ZpZWxkLmZpbmRSZWNvcmQoJ3RleHQnLCAnTm8nKSlcbiAgICAgICAgICAgICAgICBzY0FjdGl2YXRpb25GaWVsZC5vblNlbGVjdChzY0FjdGl2YXRpb25GaWVsZC5maW5kUmVjb3JkKCd0ZXh0JywgJ0luaGVyaXQgU3RhdGUnKSlcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0Q2xvbmVGaWVsZC5vblNlbGVjdChwZXJpb2RDb3N0Q2xvbmVGaWVsZC5maW5kUmVjb3JkKCd0ZXh0JywgJ0luaGVyaXQgRGF0YScpKVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2V0V2lkdGgoNTI1KVxuICAgICAgICAgICAgICAgIG1hc3NDbG9uZUZvcm0uc2V0SGVpZ2h0KDU2MClcbiAgICAgICAgICAgICAgICBtYXNzQ2xvbmVGb3JtLml0ZW1zLmxhc3QoKS5zZXRUZXh0KCdQcm9ncmFtcyB0aGF0IGhhdmUgYSBmb2xkZXIgZGVwdGggZ3JlYXRlciB0aGFuIDIgd2lsbCBub3QgYmUgY2xvbmVkLicpXG4gICAgICAgICAgICAgICAgbWFzc0Nsb25lRm9ybS5pdGVtcy5sYXN0KCkuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICB0YWdOYW1lRmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0TW9udGhGaWVsZC5sYWJlbC5kb20uaW5uZXJIVE1MID0gJyZuYnNwOyZuYnNwOyZuYnNwOyBNb250aHM6J1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RNb250aEZpZWxkLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgcGVyaW9kQ29zdE9mZnNldEZpZWxkLmxhYmVsLmRvbS5pbm5lckhUTUwgPSAnJm5ic3A7Jm5ic3A7Jm5ic3A7IENvc3QgT2Zmc2V0ICgrLy0pOidcbiAgICAgICAgICAgICAgICBwZXJpb2RDb3N0T2Zmc2V0RmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICB0YWdWYWx1ZUZpZWxkLmxhYmVsLmRvbS5pbm5lckhUTUwgPSAnJm5ic3A7Jm5ic3A7Jm5ic3A7IE5ldyBUYWcgVmFsdWU6J1xuICAgICAgICAgICAgICAgIHBlcmlvZENvc3RDbG9uZUZpZWxkLmxhYmVsLnNldFZpc2libGUoZmFsc2UpXG4gICAgICAgICAgICAgICAgc2NBY3RpdmF0aW9uRmllbGQubGFiZWwuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICAgICAgICBjdXN0b21UYWdzID0gTElCLmdldFRhZ3MoKVxuICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdOYW1lID0gdGFnTmFtZUZpZWxkLnN0b3JlLmRhdGEuaXRlbXNbMF0uY29weSgwKVxuICAgICAgICAgICAgICAgIGN1cnJDdXN0b21UYWdWYWx1ZSA9IHRhZ1ZhbHVlRmllbGQuc3RvcmUuZGF0YS5pdGVtc1swXS5jb3B5KDApXG4gICAgICAgICAgICAgICAgdGFnTmFtZUZpZWxkLnN0b3JlLnJlbW92ZUFsbCh0cnVlKVxuICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQuc3RvcmUucmVtb3ZlQWxsKHRydWUpXG4gICAgICAgICAgICAgICAgbGV0IGlzQ3VzdG9tVGFncyA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoY3VzdG9tVGFncykge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0N1c3RvbVRhZ3MpXG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGN1c3RvbVRhZ3MubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZyA9IGN1c3RvbVRhZ3NbaWldXG4gICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ05hbWUgPSBjdXJyQ3VzdG9tVGFnTmFtZS5jb3B5KGN1cnJDdXN0b21UYWcubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnTmFtZS5zZXQoJ3RleHQnLCBjdXJyQ3VzdG9tVGFnLm5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ05hbWUuZGF0YS5pZCA9IGN1cnJDdXN0b21UYWcubmFtZVxuICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWVGaWVsZC5zdG9yZS5hZGQoY3VyckN1c3RvbVRhZ05hbWUpXG5cbiAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqaiA9IDA7IGpqIDwgY3VyckN1c3RvbVRhZy52YWx1ZXMubGVuZ3RoOyBqaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnVmFsdWUgPSBjdXJyQ3VzdG9tVGFnVmFsdWUuY29weShjdXJyQ3VzdG9tVGFnLnZhbHVlc1tqal0udmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyQ3VzdG9tVGFnVmFsdWUuc2V0KCd0ZXh0JywgY3VyckN1c3RvbVRhZy52YWx1ZXNbampdLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgY3VyckN1c3RvbVRhZ1ZhbHVlLmRhdGEuaWQgPSBjdXJyQ3VzdG9tVGFnLnZhbHVlc1tqal0udmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ1ZhbHVlRmllbGQuc3RvcmUuYWRkKGN1cnJDdXN0b21UYWdWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCAwKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAwKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5nZXQobWFzc0Nsb25lSXRlbUlkKSkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICh0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInICYmXG4gICAgICAgICAgICAgICF0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMubWFya2V0aW5nUHJvZ3JhbUlkICYmXG4gICAgICAgICAgICAgIGN1cnJFeHBOb2RlICYmXG4gICAgICAgICAgICAgIGN1cnJFeHBOb2RlLmlzRXhwYW5kYWJsZSgpKSB8fFxuICAgICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgUHJvZ3JhbScgfHxcbiAgICAgICAgICAgIHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTnVydHVyZSBQcm9ncmFtJyB8fFxuICAgICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRXZlbnQnIHx8XG4gICAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ0VtYWlsIEJhdGNoIFByb2dyYW0nIHx8XG4gICAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ0luLUFwcCBQcm9ncmFtJ1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgaWYgKGZvcmNlUmVsb2FkKSB7XG4gICAgICAgICAgICAgIHRoaXMuZ2V0KG1hc3NDbG9uZUl0ZW1JZCkuZGVzdHJveSgpXG4gICAgICAgICAgICAgIHRoaXMuYWRkSXRlbShtYXNzQ2xvbmVJdGVtKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5nZXQobWFzc0Nsb25lSXRlbUlkKS5zZXRWaXNpYmxlKHRydWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2V0KG1hc3NDbG9uZUl0ZW1JZCkuc2V0VmlzaWJsZShmYWxzZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgKHRoaXMuY3Vyck5vZGUuYXR0cmlidXRlcy5jb21wVHlwZSA9PSAnTWFya2V0aW5nIEZvbGRlcicgJiZcbiAgICAgICAgICAgICF0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMubWFya2V0aW5nUHJvZ3JhbUlkICYmXG4gICAgICAgICAgICBjdXJyRXhwTm9kZSAmJlxuICAgICAgICAgICAgY3VyckV4cE5vZGUuaXNFeHBhbmRhYmxlKCkpIHx8XG4gICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdNYXJrZXRpbmcgUHJvZ3JhbScgfHxcbiAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScgfHxcbiAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ01hcmtldGluZyBFdmVudCcgfHxcbiAgICAgICAgICB0aGlzLmN1cnJOb2RlLmF0dHJpYnV0ZXMuY29tcFR5cGUgPT0gJ0VtYWlsIEJhdGNoIFByb2dyYW0nIHx8XG4gICAgICAgICAgdGhpcy5jdXJyTm9kZS5hdHRyaWJ1dGVzLmNvbXBUeXBlID09ICdJbi1BcHAgUHJvZ3JhbSdcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy5hZGRJdGVtKG1hc3NDbG9uZUl0ZW0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoTElCLmlzUHJvcE9mV2luZG93T2JqKCdFeHQubWVudS5NZW51LnByb3RvdHlwZS5zaG93QXQnKSkge1xuICAgICAgY29uc29sZS5sb2coJz4gRXhlY3V0aW5nOiBBcHBseWluZyBNYXNzIENsb25lIE1lbnUgSXRlbScpXG4gICAgICBpZiAoIW9yaWdNZW51U2hvd0F0RnVuYykge1xuICAgICAgICBvcmlnTWVudVNob3dBdEZ1bmMgPSBFeHQubWVudS5NZW51LnByb3RvdHlwZS5zaG93QXRcbiAgICAgIH1cblxuICAgICAgRXh0Lm1lbnUuTWVudS5wcm90b3R5cGUuc2hvd0F0ID0gZnVuY3Rpb24gKHh5LCBwYXJlbnRNZW51KSB7XG4gICAgICAgIG1hc3NDbG9uZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpIC8vVE9ETyBjaGFuZ2VzIGhlcmUgSHVudGVyXG4gICAgICAgIG9yaWdNZW51U2hvd0F0RnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCc+IFNraXBwaW5nOiBBcHBseWluZyBNYXNzIENsb25lIE1lbnUgSXRlbScpXG4gICAgfVxuICB9LFxuXG4gIC8qXG4gICogIFRoaXMgZnVuY3Rpb24gYWRkcyBhIHJpZ2h0LWNsaWNrIG1lbnUgaXRlbSB0aGF0IHBlcmZvcm1zIGEgbWFzcyBjbG9uZSBvZiBhbGxcbiAgKiAgUHJvZ3JhbXMgZnJvbSB0aGUgc2VsZWN0ZWQgcm9vdCBmb2xkZXIgdGhhdCBoYXZlIGEgZm9sZGVyIGRlcHRoIGxldmVsIDEgb3IgbGVzczpcbiAgKiAgICBDbG9uZXMgdGhlIGZvbGRlciBzdHJ1Y3R1cmVcbiAgKiAgICBDbG9uZXMgYWxsIFByb2dyYW1zXG4gICogICAgU2V0cyBQZXJpb2QgQ29zdHMgZm9yIHRoZSBuZXh0IDI0IG1vbnRocyB1c2luZyB0aGUgc291cmNlIFByb2dyYW0ncyBmaXJzdCBDb3N0XG4gICogICAgU2V0cyB0aGUgVmVydGljYWwgVGFnIHVzaW5nIHRoZSBuYW1lIG9mIHRoZSBkZXN0aW5hdGlvbiBmb2xkZXJcbiAgKiAgICBDbG9uZXMgdGhlIFN0cmVhbSBDYWRlbmNlcyB1c2luZyB0aGUgc291cmNlIE51cnR1cmUgUHJvZ3JhbVxuICAqICAgIENsb25lcyB0aGUgYWN0aXZhdGlvbiBzdGF0ZSBvZiB0cmlnZ2VyIFNtYXJ0IENhbXBhaWduc1xuICAqICAgIENsb25lcyB0aGUgcmVjdXJyaW5nIHNjaGVkdWxlIG9mIGJhdGNoIFNtYXJ0IENhbXBhaWduc1xuICAqICAgIFNldHMgdGhlIGFzc2V0IGZpbHRlciBmb3IgY2xvbmVkIHJlcG9ydHMgdG8gdGhlIGRlc3RpbmF0aW9uIGZvbGRlclxuICAqL1xuICBjbG9uZUZvbGRlcjogZnVuY3Rpb24gKG9yaWdGb2xkZXJOYW1lLCBjbG9uZVRvU3VmZml4LCBjbG9uZVRvRm9sZGVySWQpIHtcbiAgICBsZXQgbmV3Rm9sZGVyTmFtZSwgcmVzdWx0XG5cbiAgICBpZiAob3JpZ0ZvbGRlck5hbWUuc2VhcmNoKC9cXChbXildKlxcKSQvKSAhPSAtMSkge1xuICAgICAgbmV3Rm9sZGVyTmFtZSA9IG9yaWdGb2xkZXJOYW1lLnJlcGxhY2UoL1xcKFteKV0qXFwpJC8sICcoJyArIGNsb25lVG9TdWZmaXggKyAnKScpXG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld0ZvbGRlck5hbWUgPSBvcmlnRm9sZGVyTmFtZS50ZXh0ICsgJyAoJyArIGNsb25lVG9TdWZmaXggKyAnKSdcbiAgICB9XG5cbiAgICByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICcvZXhwbG9yZXIvY3JlYXRlUHJvZ3JhbUZvbGRlcicsXG4gICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICBuZXcgRGF0ZSgpLmdldFRpbWUoKSArXG4gICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAnJnRleHQ9JyArXG4gICAgICBuZXdGb2xkZXJOYW1lICtcbiAgICAgICcmcGFyZW50SWQ9JyArXG4gICAgICBjbG9uZVRvRm9sZGVySWQgK1xuICAgICAgJyZ0ZW1wTm9kZUlkPWV4dC0nICtcbiAgICAgIGNsb25lVG9Gb2xkZXJJZCArXG4gICAgICAnJnhzcmZJZD0nICtcbiAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgJ1BPU1QnLFxuICAgICAgZmFsc2UsXG4gICAgICAnJyxcbiAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICByZXNwb25zZSAmJlxuICAgICAgICAgIHJlc3BvbnNlLkpTT05SZXN1bHRzICYmXG4gICAgICAgICAgcmVzcG9uc2UuSlNPTlJlc3VsdHMuYXBwdmFycyAmJlxuICAgICAgICAgIHJlc3BvbnNlLkpTT05SZXN1bHRzLmFwcHZhcnMuY3JlYXRlUHJvZ3JhbUZvbGRlclJlc3VsdCA9PSAnc3VjY2VzcydcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sXG5cbiAgY2xvbmVOdXJ0dXJlQ2FkZW5jZTogZnVuY3Rpb24gKG9yaWdQcm9ncmFtQ29tcElkLCBuZXdQcm9ncmFtQ29tcElkKSB7XG4gICAgbGV0IGdldE51cnR1cmVDYWRlbmNlLCBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZSwgZ2V0TmV3TnVydHVyZUNhZGVuY2VSZXNwb25zZVxuXG4gICAgZ2V0TnVydHVyZUNhZGVuY2UgPSBmdW5jdGlvbiAocHJvZ3JhbUNvbXBJZCkge1xuICAgICAgbGV0IHByb2dyYW1GaWx0ZXIgPSBlbmNvZGVVUklDb21wb25lbnQoJ1t7XCJwcm9wZXJ0eVwiOlwiaWRcIixcInZhbHVlXCI6JyArIHByb2dyYW1Db21wSWQgKyAnfV0nKSxcbiAgICAgICAgZmllbGRzID0gZW5jb2RlVVJJQ29tcG9uZW50KCdbXCIrdHJhY2tzXCJdJyksXG4gICAgICAgIHJlc3VsdFxuXG4gICAgICByZXN1bHQgPSBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgJy9kYXRhL251cnR1cmUvcmV0cmlldmUnLFxuICAgICAgICAnZmlsdGVyPScgKyBwcm9ncmFtRmlsdGVyICsgJyZmaWVsZHM9JyArIGZpZWxkcyArICcmeHNyZklkPScgKyBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgJ1BPU1QnLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJycsXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSlcblxuICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApXG5cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9XG5cbiAgICBnZXRPcmlnTnVydHVyZUNhZGVuY2VSZXNwb25zZSA9IGdldE51cnR1cmVDYWRlbmNlKG9yaWdQcm9ncmFtQ29tcElkKVxuICAgIGdldE5ld051cnR1cmVDYWRlbmNlUmVzcG9uc2UgPSBnZXROdXJ0dXJlQ2FkZW5jZShuZXdQcm9ncmFtQ29tcElkKVxuXG4gICAgaWYgKFxuICAgICAgZ2V0T3JpZ051cnR1cmVDYWRlbmNlUmVzcG9uc2UgJiZcbiAgICAgIGdldE5ld051cnR1cmVDYWRlbmNlUmVzcG9uc2UgJiZcbiAgICAgIGdldE9yaWdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlLmRhdGFbMF0udHJhY2tzLmxlbmd0aCA9PSBnZXROZXdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlLmRhdGFbMF0udHJhY2tzLmxlbmd0aFxuICAgICkge1xuICAgICAgbGV0IGN1cnJPcmlnU3RyZWFtLFxuICAgICAgICBjdXJyTmV3U3RyZWFtLFxuICAgICAgICBzdHJlYW1DYWRlbmNlcyA9ICdbJ1xuXG4gICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgZ2V0T3JpZ051cnR1cmVDYWRlbmNlUmVzcG9uc2UuZGF0YVswXS50cmFja3MubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgIGN1cnJPcmlnU3RyZWFtID0gZ2V0T3JpZ051cnR1cmVDYWRlbmNlUmVzcG9uc2UuZGF0YVswXS50cmFja3NbaWldXG4gICAgICAgIGN1cnJOZXdTdHJlYW0gPSBnZXROZXdOdXJ0dXJlQ2FkZW5jZVJlc3BvbnNlLmRhdGFbMF0udHJhY2tzW2lpXVxuXG4gICAgICAgIGlmIChpaSAhPSAwKSB7XG4gICAgICAgICAgc3RyZWFtQ2FkZW5jZXMgKz0gJywnXG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtQ2FkZW5jZXMgKz1cbiAgICAgICAgICAne1wiaWRcIjonICtcbiAgICAgICAgICBjdXJyTmV3U3RyZWFtLmlkICtcbiAgICAgICAgICAnLFwicmVjdXJyZW5jZVR5cGVcIjpcIicgK1xuICAgICAgICAgIGN1cnJPcmlnU3RyZWFtLnJlY3VycmVuY2VUeXBlICtcbiAgICAgICAgICAnXCIsXCJldmVyeU5Vbml0XCI6JyArXG4gICAgICAgICAgY3Vyck9yaWdTdHJlYW0uZXZlcnlOVW5pdCArXG4gICAgICAgICAgJyxcIndlZWtNYXNrXCI6XCInICtcbiAgICAgICAgICBjdXJyT3JpZ1N0cmVhbS53ZWVrTWFzayArXG4gICAgICAgICAgJ1wiLFwic3RhcnREYXRlXCI6XCInICtcbiAgICAgICAgICBjdXJyT3JpZ1N0cmVhbS5zdGFydERhdGUgK1xuICAgICAgICAgICdcIn0nXG4gICAgICB9XG4gICAgICBzdHJlYW1DYWRlbmNlcyArPSAnXSdcbiAgICAgIHN0cmVhbUNhZGVuY2VzID0gc3RyZWFtQ2FkZW5jZXMucmVwbGFjZSgvXCJudWxsXCIvZywgJ251bGwnKVxuXG4gICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgJy9kYXRhL251cnR1cmVUcmFjay91cGRhdGUnLFxuICAgICAgICAnZGF0YT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmVhbUNhZGVuY2VzKSArICcmeHNyZklkPScgKyBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgJ1BPU1QnLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJycsXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICB9XG4gICAgICApXG4gICAgfVxuICB9LFxuXG4gIGNsb25lUGVyaW9kQ29zdDogZnVuY3Rpb24gKG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhLCBuZXdQcm9ncmFtQ29tcElkLCBudW1PZk1vbnRocywgb2Zmc2V0LCBpbmhlcml0KSB7XG4gICAgbGV0IGN1cnJZZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpLFxuICAgICAgY3Vyck1vbnRoID0gbmV3IERhdGUoKS5nZXRNb250aCgpICsgMSxcbiAgICAgIHNldFBlcmlvZENvc3RcblxuICAgIHNldFBlcmlvZENvc3QgPSBmdW5jdGlvbiAobmV3UHJvZ3JhbUNvbXBJZCwgY29zdERhdGUsIGNvc3RBbW91bnQpIHtcbiAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAnL21hcmtldGluZ0V2ZW50L3NldENvc3RTdWJtaXQnLFxuICAgICAgICAnYWpheEhhbmRsZXI9TWt0U2Vzc2lvbiZta3RSZXFVaWQ9JyArXG4gICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgRXh0LmlkKG51bGwsICc6JykgK1xuICAgICAgICAnJmNvbXBJZD0nICtcbiAgICAgICAgbmV3UHJvZ3JhbUNvbXBJZCArXG4gICAgICAgICcmY29zdElkPScgK1xuICAgICAgICAnJnR5cGU9cGVyaW9kJyArXG4gICAgICAgICcmc3RhcnREYXRlPScgK1xuICAgICAgICBjb3N0RGF0ZSArXG4gICAgICAgICcmYW1vdW50PScgK1xuICAgICAgICBjb3N0QW1vdW50LnRvU3RyaW5nKCkgK1xuICAgICAgICAnJmRlc2NyaXB0aW9uPScgK1xuICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICdQT1NUJyxcbiAgICAgICAgZmFsc2UsXG4gICAgICAgICcnLFxuICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgfVxuICAgICAgKVxuICAgIH1cblxuICAgIGlmIChpbmhlcml0ICYmIG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhKSB7XG4gICAgICBsZXQgY3VyclBlcmlvZENvc3RcblxuICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhLmxlbmd0aDsgaWkrKykge1xuICAgICAgICBjdXJyUGVyaW9kQ29zdCA9IG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhW2lpXVxuXG4gICAgICAgIGlmIChjdXJyUGVyaW9kQ29zdC5pdGVtVHlwZSA9PSAncGVyaW9kJyAmJiBjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5hbW91bnQgJiYgY3VyclBlcmlvZENvc3Quc3VtbWFyeURhdGEuc3RhcnREYXRlKSB7XG4gICAgICAgICAgdmFyIGN1cnJDb3N0TW9udGggPSBjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5zdGFydERhdGUucmVwbGFjZSgvXlswLTldWzAtOV1bMC05XVswLTldLS8sICcnKSxcbiAgICAgICAgICAgIGN1cnJDb3N0QW1vdW50ID0gY3VyclBlcmlvZENvc3Quc3VtbWFyeURhdGEuYW1vdW50LFxuICAgICAgICAgICAgY3VyckNvc3RZZWFyLFxuICAgICAgICAgICAgY3VyckNvc3REYXRlXG5cbiAgICAgICAgICBpZiAoY3VyclllYXIgPiBwYXJzZUludChjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5zdGFydERhdGUubWF0Y2goL15bMC05XVswLTldWzAtOV1bMC05XS8pKSkge1xuICAgICAgICAgICAgY3VyckNvc3RZZWFyID0gY3VyclllYXIgKyAoY3VyclllYXIgLSBwYXJzZUludChjdXJyUGVyaW9kQ29zdC5zdW1tYXJ5RGF0YS5zdGFydERhdGUubWF0Y2goL15bMC05XVswLTldWzAtOV1bMC05XS8pKSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VyckNvc3RZZWFyID0gcGFyc2VJbnQoY3VyclBlcmlvZENvc3Quc3VtbWFyeURhdGEuc3RhcnREYXRlLm1hdGNoKC9eWzAtOV1bMC05XVswLTldWzAtOV0vKSlcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VyckNvc3REYXRlID0gY3VyckNvc3RZZWFyLnRvU3RyaW5nKCkgKyAnLScgKyBjdXJyQ29zdE1vbnRoLnRvU3RyaW5nKClcbiAgICAgICAgICBzZXRQZXJpb2RDb3N0KG5ld1Byb2dyYW1Db21wSWQsIGN1cnJDb3N0RGF0ZSwgY3VyckNvc3RBbW91bnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFxuICAgICAgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGEgJiZcbiAgICAgIG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhWzBdICYmXG4gICAgICBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YVswXS5zdW1tYXJ5RGF0YSAmJlxuICAgICAgb3JpZ1Byb2dyYW1TZXR0aW5nc0RhdGFbMF0uc3VtbWFyeURhdGEuYW1vdW50XG4gICAgKSB7XG4gICAgICBpZiAoIW51bU9mTW9udGhzKSB7XG4gICAgICAgIG51bU9mTW9udGhzID0gMjRcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG51bU9mTW9udGhzOyBpaSsrKSB7XG4gICAgICAgIHZhciBjdXJyQ29zdERhdGUsIGN1cnJDb3N0QW1vdW50XG5cbiAgICAgICAgaWYgKGN1cnJNb250aCA+IDEyKSB7XG4gICAgICAgICAgY3Vyck1vbnRoID0gMVxuICAgICAgICAgIGN1cnJZZWFyKytcbiAgICAgICAgfVxuICAgICAgICBjdXJyQ29zdERhdGUgPSBjdXJyWWVhci50b1N0cmluZygpICsgJy0nICsgY3Vyck1vbnRoLnRvU3RyaW5nKClcbiAgICAgICAgY3Vyck1vbnRoKytcbiAgICAgICAgY3VyckNvc3RBbW91bnQgPSBwYXJzZUludChvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YVswXS5zdW1tYXJ5RGF0YS5hbW91bnQpXG5cbiAgICAgICAgaWYgKG9mZnNldCkge1xuICAgICAgICAgIGlmIChNYXRoLnJhbmRvbSgpIDw9IDAuNSkge1xuICAgICAgICAgICAgY3VyckNvc3RBbW91bnQgKz0gTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiBvZmZzZXQpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJDb3N0QW1vdW50IC09IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogb2Zmc2V0KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNldFBlcmlvZENvc3QobmV3UHJvZ3JhbUNvbXBJZCwgY3VyckNvc3REYXRlLCBjdXJyQ29zdEFtb3VudClcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgY2xvbmVQcm9ncmFtOiBmdW5jdGlvbiAoY2xvbmVUb1N1ZmZpeCwgY2xvbmVUb0ZvbGRlcklkLCBvcmlnUHJvZ3JhbVRyZWVOb2RlKSB7XG4gICAgbGV0IG5ld1Byb2dyYW1OYW1lLCBuZXdQcm9ncmFtVHlwZSwgcmVzdWx0XG5cbiAgICBpZiAob3JpZ1Byb2dyYW1UcmVlTm9kZS50ZXh0LnNlYXJjaCgvXFwoW14pXSpcXCkkLykgIT0gLTEpIHtcbiAgICAgIG5ld1Byb2dyYW1OYW1lID0gb3JpZ1Byb2dyYW1UcmVlTm9kZS50ZXh0LnJlcGxhY2UoL1xcKFteKV0qXFwpJC8sICcoJyArIGNsb25lVG9TdWZmaXggKyAnKScpXG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld1Byb2dyYW1OYW1lID0gb3JpZ1Byb2dyYW1UcmVlTm9kZS50ZXh0ICsgJyAoJyArIGNsb25lVG9TdWZmaXggKyAnKSdcbiAgICB9XG5cbiAgICBzd2l0Y2ggKG9yaWdQcm9ncmFtVHJlZU5vZGUuY29tcFR5cGUpIHtcbiAgICAgIGNhc2UgJ01hcmtldGluZyBQcm9ncmFtJzpcbiAgICAgICAgbmV3UHJvZ3JhbVR5cGUgPSAncHJvZ3JhbSdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ051cnR1cmUgUHJvZ3JhbSc6XG4gICAgICAgIG5ld1Byb2dyYW1UeXBlID0gJ251cnR1cmUnXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdNYXJrZXRpbmcgRXZlbnQnOlxuICAgICAgICBuZXdQcm9ncmFtVHlwZSA9ICdldmVudCdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ0VtYWlsIEJhdGNoIFByb2dyYW0nOlxuICAgICAgICBuZXdQcm9ncmFtVHlwZSA9ICdlbWFpbEJhdGNoUHJvZ3JhbSdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ0luLUFwcCBQcm9ncmFtJzpcbiAgICAgICAgbmV3UHJvZ3JhbVR5cGUgPSAnaW5BcHBQcm9ncmFtJ1xuICAgICAgICBicmVha1xuICAgIH1cblxuICAgIGlmIChuZXdQcm9ncmFtVHlwZSkge1xuICAgICAgcmVzdWx0ID0gTElCLndlYlJlcXVlc3QoXG4gICAgICAgICcvbWFya2V0aW5nRXZlbnQvY3JlYXRlTWFya2V0aW5nUHJvZ3JhbVN1Ym1pdCcsXG4gICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICcmbmFtZT0nICtcbiAgICAgICAgbmV3UHJvZ3JhbU5hbWUgK1xuICAgICAgICAnJmRlc2NyaXB0aW9uPScgK1xuICAgICAgICAnJnBhcmVudEZvbGRlcklkPScgK1xuICAgICAgICBjbG9uZVRvRm9sZGVySWQgK1xuICAgICAgICAnJmNsb25lRnJvbUlkPScgK1xuICAgICAgICBvcmlnUHJvZ3JhbVRyZWVOb2RlLmNvbXBJZCArXG4gICAgICAgICcmdHlwZT0nICtcbiAgICAgICAgbmV3UHJvZ3JhbVR5cGUgK1xuICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICdQT1NUJyxcbiAgICAgICAgZmFsc2UsXG4gICAgICAgICcnLFxuICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UpXG4gICAgICAgICAgLy9yZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UubWF0Y2goL3tcXFwiSlNPTlJlc3VsdHNcXFwiOi4qfS8pWzBdKTtcblxuICAgICAgICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5KU09OUmVzdWx0cyAmJiByZXNwb25zZS5KU09OUmVzdWx0cy5hcHB2YXJzICYmIHJlc3BvbnNlLkpTT05SZXN1bHRzLmFwcHZhcnMucmVzdWx0ID09ICdTdWNjZXNzJykge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKVxuXG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfSxcblxuICBjbG9uZVNtYXJ0Q2FtcGFpZ25TdGF0ZTogZnVuY3Rpb24gKG9yaWdQcm9ncmFtQ29tcElkLCBuZXdQcm9ncmFtQ29tcElkLCBmb3JjZUFjdGl2YXRlKSB7XG4gICAgbGV0IGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZVxuXG4gICAgZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtQXNzZXREZXRhaWxzKG9yaWdQcm9ncmFtQ29tcElkKVxuICAgIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSA9IExJQi5nZXRQcm9ncmFtQXNzZXREZXRhaWxzKG5ld1Byb2dyYW1Db21wSWQpXG5cbiAgICBpZiAoZ2V0T3JpZ1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSAmJiBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UpIHtcbiAgICAgIGxldCBzZXRTbWFydENhbXBhaWduU3RhdGVcblxuICAgICAgc2V0U21hcnRDYW1wYWlnblN0YXRlID0gZnVuY3Rpb24gKGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSkge1xuICAgICAgICBsZXQgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbiwgY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduLCBnZXRTY2hlZHVsZVJlc3BvbnNlXG5cbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2Uuc21hcnRDYW1wYWlnbnMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbiA9IGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2Uuc21hcnRDYW1wYWlnbnNbaWldXG4gICAgICAgICAgY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduID0gZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLnNtYXJ0Q2FtcGFpZ25zW2lpXVxuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5jb21wVHlwZSA9PSBjdXJyTmV3UHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcFR5cGUgJiZcbiAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcFR5cGUgPT0gJ1NtYXJ0IENhbXBhaWduJyAmJlxuICAgICAgICAgICAgY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5uYW1lID09IGN1cnJOZXdQcm9ncmFtU21hcnRDYW1wYWlnbi5uYW1lXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAoY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5zdGF0dXMgPT0gNyB8fCAoY3Vyck9yaWdQcm9ncmFtU21hcnRDYW1wYWlnbi5zdGF0dXMgPT0gNiAmJiBmb3JjZUFjdGl2YXRlKSkge1xuICAgICAgICAgICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgICAgICAgICAnL3NtYXJ0Y2FtcGFpZ25zL3RvZ2dsZUFjdGl2ZVN0YXR1cycsXG4gICAgICAgICAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICAgICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICAgICAgICAgJyZzbWFydENhbXBhaWduSWQ9JyArXG4gICAgICAgICAgICAgICAgY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduLmNvbXBJZCArXG4gICAgICAgICAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgICAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCksXG4gICAgICAgICAgICAgICAgJ1BPU1QnLFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICcnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjdXJyT3JpZ1Byb2dyYW1TbWFydENhbXBhaWduLnN0YXR1cyA9PSAzIHx8IGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uc3RhdHVzID09IDUpIHtcbiAgICAgICAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgICAgICAgJy9zbWFydGNhbXBhaWducy9lZGl0U2NoZWR1bGVSUycsXG4gICAgICAgICAgICAgICAgJ2FqYXhIYW5kbGVyPU1rdFNlc3Npb24mbWt0UmVxVWlkPScgK1xuICAgICAgICAgICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICAgICAgICAgJyZpc1JlcXVlc3Q9MScgK1xuICAgICAgICAgICAgICAgICcmc21hcnRDYW1wYWlnbklkPScgK1xuICAgICAgICAgICAgICAgIGN1cnJPcmlnUHJvZ3JhbVNtYXJ0Q2FtcGFpZ24uY29tcElkICtcbiAgICAgICAgICAgICAgICAnJnhzcmZJZD0nICtcbiAgICAgICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgICAgICAgICAnUE9TVCcsXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgJycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSlcbiAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5tYXRjaCgvTWt0UGFnZVxcLmFwcFZhcnNcXC5zY2hlZHVsZURhdGEgPSB7KFtePV18XFxufFxcXFxuKSp9LylbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZSA9IEpTT04ucGFyc2UoXG4gICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXRjaCgvTWt0UGFnZVxcLmFwcFZhcnNcXC5zY2hlZHVsZURhdGEgPSB7KFtePV18XFxufFxcXFxuKSp9LylbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9Na3RQYWdlXFwuYXBwVmFyc1xcLnNjaGVkdWxlRGF0YSA9IHsvLCAneycpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxuICovZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC86ICsvZywgJ1wiOiAnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wiXFwvXFwvW15cIl0rXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cIn0kLywgJ30nKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgaWYgKGdldFNjaGVkdWxlUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnRBdERhdGUgPSBuZXcgRGF0ZShEYXRlLnBhcnNlKGdldFNjaGVkdWxlUmVzcG9uc2Uuc3RhcnRfYXQpKSxcbiAgICAgICAgICAgICAgICAgIHN0YXJ0QXQgPVxuICAgICAgICAgICAgICAgICAgICBzdGFydEF0RGF0ZS5nZXRGdWxsWWVhcigpICtcbiAgICAgICAgICAgICAgICAgICAgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQoc3RhcnRBdERhdGUuZ2V0TW9udGgoKSArIDEpICtcbiAgICAgICAgICAgICAgICAgICAgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRBdERhdGUuZ2V0RGF0ZSgpICtcbiAgICAgICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRBdERhdGUuZ2V0SG91cnMoKSArXG4gICAgICAgICAgICAgICAgICAgICc6JyArXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0QXREYXRlLmdldE1pbnV0ZXMoKSArXG4gICAgICAgICAgICAgICAgICAgICc6JyArXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0QXREYXRlLmdldFNlY29uZHMoKVxuXG4gICAgICAgICAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgICAgICAgICAnL3NtYXJ0Y2FtcGFpZ25zL3JlY3VyQ2FtcFNjaGVkdWxlJyxcbiAgICAgICAgICAgICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgICAgICAgICAgICcmc21hcnRDYW1wYWlnbklkPScgK1xuICAgICAgICAgICAgICAgICAgY3Vyck5ld1Byb2dyYW1TbWFydENhbXBhaWduLmNvbXBJZCArXG4gICAgICAgICAgICAgICAgICAnJnJlY3VycmVuY2VfdHlwZT0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UucmVjdXJyZW5jZV90eXBlICtcbiAgICAgICAgICAgICAgICAgICcmZXZlcnlfbl91bml0PScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS5ldmVyeV9uX3VuaXQgK1xuICAgICAgICAgICAgICAgICAgJyZzdGFydF9hdD0nICtcbiAgICAgICAgICAgICAgICAgIHN0YXJ0QXQgK1xuICAgICAgICAgICAgICAgICAgJyZlbmRfYXQ9JyArXG4gICAgICAgICAgICAgICAgICAnJmV2ZXJ5X3dlZWtkYXk9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLmV2ZXJ5X3dlZWtkYXkgK1xuICAgICAgICAgICAgICAgICAgJyZ3ZWVrX21hc2s9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLndlZWtfbWFzayArXG4gICAgICAgICAgICAgICAgICAnJnJlY3VyRGF5X29mX21vbnRoPScgK1xuICAgICAgICAgICAgICAgICAgZ2V0U2NoZWR1bGVSZXNwb25zZS5yZWN1ckRheV9vZl9tb250aCArXG4gICAgICAgICAgICAgICAgICAnJnJlY3VyTW9udGhfZGF5X3R5cGU9JyArXG4gICAgICAgICAgICAgICAgICBnZXRTY2hlZHVsZVJlc3BvbnNlLnJlY3VyTW9udGhfZGF5X3R5cGUgK1xuICAgICAgICAgICAgICAgICAgJyZyZWN1ck1vbnRoX3dlZWtfdHlwZT0nICtcbiAgICAgICAgICAgICAgICAgIGdldFNjaGVkdWxlUmVzcG9uc2UucmVjdXJNb250aF93ZWVrX3R5cGUgK1xuICAgICAgICAgICAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgJycsXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdClcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2Uuc21hcnRDYW1wYWlnbnMubGVuZ3RoID09IGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5zbWFydENhbXBhaWducy5sZW5ndGgpIHtcbiAgICAgICAgc2V0U21hcnRDYW1wYWlnblN0YXRlKGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSlcbiAgICAgIH1cblxuICAgICAgaWYgKGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWUubGVuZ3RoID09IGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZS5hc3NldExpc3RbMF0udHJlZS5sZW5ndGgpIHtcbiAgICAgICAgbGV0IGN1cnJPcmlnUHJvZ3JhbUFzc2V0LCBjdXJyTmV3UHJvZ3JhbUFzc2V0XG5cbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGdldE9yaWdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWUubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgY3Vyck9yaWdQcm9ncmFtQXNzZXQgPSBnZXRPcmlnUHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlW2lpXVxuICAgICAgICAgIGN1cnJOZXdQcm9ncmFtQXNzZXQgPSBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UuYXNzZXRMaXN0WzBdLnRyZWVbaWldXG5cbiAgICAgICAgICBpZiAoY3Vyck9yaWdQcm9ncmFtQXNzZXQubmF2VHlwZSA9PSAnTUEnICYmIGN1cnJOZXdQcm9ncmFtQXNzZXQubmF2VHlwZSA9PSAnTUEnKSB7XG4gICAgICAgICAgICBzZXRTbWFydENhbXBhaWduU3RhdGUoXG4gICAgICAgICAgICAgIExJQi5nZXRQcm9ncmFtQXNzZXREZXRhaWxzKGN1cnJPcmlnUHJvZ3JhbUFzc2V0LmNvbXBJZCksXG4gICAgICAgICAgICAgIExJQi5nZXRQcm9ncmFtQXNzZXREZXRhaWxzKGN1cnJOZXdQcm9ncmFtQXNzZXQuY29tcElkKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2VcbiAgfSxcblxuICBnZXRIdW1hbkRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZygnTWFya2V0byBEZW1vIEFwcCA+IEdldHRpbmc6IERhdGUgNCBXZWVrcyBGcm9tIE5vdycpXG4gICAgbGV0IGRheU5hbWVzID0gWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXSxcbiAgICAgIG1vbnRoTmFtZXMgPSBbJ0pBTicsICdGRUInLCAnTUFSJywgJ0FQUicsICdNQVknLCAnSlVORScsICdKVUxZJywgJ0FVRycsICdTRVBUJywgJ09DVCcsICdOT1YnLCAnREVDJ10sXG4gICAgICBkYXRlID0gbmV3IERhdGUoKSxcbiAgICAgIGRheU9mV2VlayxcbiAgICAgIG1vbnRoLFxuICAgICAgZGF5T2ZNb250aCxcbiAgICAgIHllYXJcblxuICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDI4KVxuICAgIGRheU9mV2VlayA9IGRheU5hbWVzW2RhdGUuZ2V0RGF5KCldXG4gICAgbW9udGggPSBtb250aE5hbWVzW2RhdGUuZ2V0TW9udGgoKV1cbiAgICB5ZWFyID0gZGF0ZS5nZXRGdWxsWWVhcigpXG5cbiAgICBzd2l0Y2ggKGRhdGUuZ2V0RGF0ZSgpKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGRheU9mTW9udGggPSAnMXN0J1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAyOlxuICAgICAgICBkYXlPZk1vbnRoID0gJzJuZCdcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgZGF5T2ZNb250aCA9ICczcmQnXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBkYXlPZk1vbnRoID0gZGF0ZS5nZXREYXRlKCkgKyAndGgnXG4gICAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgcmV0dXJuIGRheU9mV2VlayArICcsICcgKyBtb250aCArICcgdGhlICcgKyBkYXlPZk1vbnRoICsgJyAnICsgeWVhclxuICB9LFxuXG4gIC8vIHJlbG9hZHMgdGhlIE1hcmtldGluZyBBY3Rpdml0ZXMgVHJlZVxuICByZWxvYWRNYXJrZXRpbmdBY3Rpdml0ZXM6IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgY29udGV4dCA9IHtcbiAgICAgIGNvbXBTdWJ0eXBlOiBudWxsLFxuICAgICAgY3VzdG9tVG9rZW46ICcnLFxuICAgICAgZGxDb21wQ29kZTogJ01BJyxcbiAgICAgIHR5cGU6ICdNQSdcbiAgICB9XG4gICAgICA7IChjdXN0b21Ub2tlbiA9IE1rdDMuRGxNYW5hZ2VyLmdldEN1c3RvbVRva2VuKCkpLCAocGFyYW1zID0gRXh0LnVybERlY29kZShjdXN0b21Ub2tlbikpXG5cbiAgICBpZiAoXG4gICAgICBjb250ZXh0ICYmXG4gICAgICAoY29udGV4dC5jb21wVHlwZSA9PT0gJ01hcmtldGluZyBFdmVudCcgfHxcbiAgICAgICAgY29udGV4dC5jb21wVHlwZSA9PT0gJ01hcmtldGluZyBQcm9ncmFtJyB8fFxuICAgICAgICBjb250ZXh0LmNvbXBTdWJ0eXBlID09PSAnbWFya2V0aW5ncHJvZ3JhbScgfHxcbiAgICAgICAgY29udGV4dC5jb21wU3VidHlwZSA9PT0gJ21hcmtldGluZ2V2ZW50JylcbiAgICApIHtcbiAgICAgIE1rdDMuTUtOb2RlQ29udGV4dC50aW1pbmdSZXBvcnQgPSB7XG4gICAgICAgIG5hdkxvYWRDYWw6IEV4dDQuRGF0ZS5ub3coKSxcbiAgICAgICAgY2FsZW5kYXJNb2RlOiAnUHJvZ3JhbSdcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgYWxyZWFkeUluTUEgPSBNa3RNYWluTmF2LmFjdGl2ZU5hdiA9PSAndG5NQScsXG4gICAgICBham9wdHMgPSBNa3RNYWluTmF2LmNvbW1vblByZUxvYWQoJ3RuTUEnLCBjb250ZXh0KVxuICAgIGlmIChNa3RQYWdlLmluaXROYXYgPT0gJ3llcycpIHtcbiAgICAgIE1rdEV4cGxvcmVyLmNsZWFyKClcbiAgICAgIE1rdEV4cGxvcmVyLm1hc2soKVxuICAgICAgbGV0IHBhcm1zID0gY29udGV4dFxuICAgICAgaWYgKCFNa3RQYWdlLnNhdGVsbGl0ZSkge1xuICAgICAgICBNa3RWaWV3cG9ydC5zZXRFeHBsb3JlclZpc2libGUodHJ1ZSlcblxuICAgICAgICBNa3RFeHBsb3Jlci5sb2FkVHJlZSgnZXhwbG9yZXIvZ2VuZXJhdGVGdWxsTWFFeHBsb3JlcicsIHtcbiAgICAgICAgICBzZXJpYWxpemVQYXJtczogcGFybXMsXG4gICAgICAgICAgb25NeUZhaWx1cmU6IE1rdE1haW5OYXYuZXhwRmFpbHVyZVJlc3BvbnNlLmNyZWF0ZURlbGVnYXRlKHRoaXMpXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHBhcm1zID0ge31cbiAgICAgIGFqb3B0cy5zZXJpYWxpemVQYXJtcyA9IHBhcm1zXG4gICAgICBpZiAoaXNEZWZpbmVkKGNvbnRleHQucGFuZWxJbmRleCkpIHtcbiAgICAgICAgcGFybXMucGFuZWxJbmRleCA9IGNvbnRleHQucGFuZWxJbmRleFxuICAgICAgfVxuXG4gICAgICBpZiAoY29udGV4dC5pc1Byb2dyYW1JbXBvcnQpIHtcbiAgICAgICAgcGFyYW1zLmlkID0gY29udGV4dC5jb21wSWRcblxuICAgICAgICBpZiAoTWt0UGFnZS5oYXNXb3Jrc3BhY2VzKCkpIHtcbiAgICAgICAgICAvLyB3ZSBhcmUgZm9yY2VkIHRvIGxvYWQgZGVmYXVsdCBNQSwgb3RoZXJ3aXNlIHRoZSBtb2RhbCBmb3JtIGlzIG5vdCBhbGlnbmVkIHByb3Blcmx5XG4gICAgICAgICAgTWt0Q2FudmFzLmNhbnZhc0FqYXhSZXF1ZXN0KCdleHBsb3Jlci9wcm9ncmFtQ2FudmFzJywge1xuICAgICAgICAgICAgb25NeVN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgRXh0NC53aWRnZXQoJ3Byb2dyYW1PbmVDbGlja0ltcG9ydEZvcm0nLCB7Zm9ybURhdGE6IHBhcmFtc30pXG5cbiAgICAgICAgICAgICAgTWt0Vmlld3BvcnQuc2V0QXBwTWFzayhmYWxzZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIE1rdFNlc3Npb24uYWpheFJlcXVlc3QoJy9pbXBFeHAvZG93bmxvYWRUZW1wbGF0ZScsIHtcbiAgICAgICAgICBzZXJpYWxpemVQYXJtczogcGFyYW1zLFxuICAgICAgICAgIG9uTXlTdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UsIHJlcXVlc3QpIHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5KU09OUmVzdWx0cykge1xuICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuSlNPTlJlc3VsdHMuc2hvd0ltcG9ydFN0YXR1cyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIE1rdENhbnZhcy5jYW52YXNBamF4UmVxdWVzdCgnZXhwbG9yZXIvcHJvZ3JhbUNhbnZhcycsIHtcbiAgICAgICAgICAgICAgICAgIG9uTXlTdWNjZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIE1rdC5hcHBzLmltcEV4cC5pbXBvcnRQcm9ncmFtU3RhdHVzKClcbiAgICAgICAgICAgICAgICAgICAgTWt0Vmlld3BvcnQuc2V0QXBwTWFzayhmYWxzZSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLkpTT05SZXN1bHRzLmVycm9yTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIC8vIGp1c3QgbG9hZCBNQVxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNNQSdcbiAgICAgICAgICAgICAgICBNa3RQYWdlLnNob3dBbGVydE1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgICBNa3RMYW5nLmdldFN0cigncGFnZS5JbXBvcnRfV2FybmluZycpLFxuICAgICAgICAgICAgICAgICAgTWt0TGFuZy5nZXRTdHIoJ3BhZ2UuSW1wb3J0X0ZhaWxlZCcpICsgcmVzcG9uc2UuSlNPTlJlc3VsdHMuZXJyb3JNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgJy9pbWFnZXMvaWNvbnMzMi9lcnJvci5wbmcnXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIGlmIChjb250ZXh0LmNvbXBTdWJ0eXBlID09ICdtYXJrZXRpbmdmb2xkZXInIHx8IGNvbnRleHQuY29tcFR5cGUgPT0gJ01hcmtldGluZyBGb2xkZXInIHx8IGNvbnRleHQuc3ViVHlwZSA9PSAnbWFya2V0aW5nZm9sZGVyJykge1xuICAgICAgICBNa3RNYWluTmF2LmxvYWRQRShjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChjb250ZXh0LmNvbXBTdWJ0eXBlID09ICdzbWFydGNhbXBhaWduJyB8fCBjb250ZXh0LnN1YlR5cGUgPT0gJ3NtYXJ0Y2FtcGFpZ24nIHx8IGNvbnRleHQuY29tcFR5cGUgPT0gJ1NtYXJ0IENhbXBhaWduJykge1xuICAgICAgICBNa3RNYWluTmF2LmxvYWRTbWFydENhbXBhaWduKGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuY29tcFN1YnR5cGUgPT0gJ21hcmtldGluZ2V2ZW50JyB8fCBjb250ZXh0LnN1YlR5cGUgPT0gJ21hcmtldGluZ2V2ZW50JyB8fCBjb250ZXh0LmNvbXBUeXBlID09ICdNYXJrZXRpbmcgRXZlbnQnKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZE1hcmtldGluZ0V2ZW50KGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBjb250ZXh0LmNvbXBTdWJ0eXBlID09ICdtYXJrZXRpbmdwcm9ncmFtJyB8fFxuICAgICAgICBjb250ZXh0LnN1YlR5cGUgPT0gJ21hcmtldGluZ3Byb2dyYW0nIHx8XG4gICAgICAgIGNvbnRleHQuY29tcFR5cGUgPT0gJ01hcmtldGluZyBQcm9ncmFtJ1xuICAgICAgKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZE1hcmtldGluZ1Byb2dyYW0oY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5jb21wU3VidHlwZSA9PSAnbnVydHVyZXByb2dyYW0nIHx8IGNvbnRleHQuc3ViVHlwZSA9PSAnbnVydHVyZXByb2dyYW0nIHx8IGNvbnRleHQuY29tcFR5cGUgPT0gJ051cnR1cmUgUHJvZ3JhbScpIHtcbiAgICAgICAgTWt0TWFpbk5hdi5sb2FkTnVydHVyZVByb2dyYW0oY29udGV4dClcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGNvbnRleHQuY29tcFN1YnR5cGUgPT09ICdlbWFpbGJhdGNocHJvZ3JhbScgfHxcbiAgICAgICAgY29udGV4dC5zdWJUeXBlID09PSAnZW1haWxiYXRjaHByb2dyYW0nIHx8XG4gICAgICAgIGNvbnRleHQuY29tcFR5cGUgPT09ICdFbWFpbCBCYXRjaCBQcm9ncmFtJ1xuICAgICAgKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZEVtYWlsQmF0Y2hQcm9ncmFtKGNvbnRleHQpXG4gICAgICB9IGVsc2UgaWYgKGNvbnRleHQuY29tcFN1YnR5cGUgPT09ICdpbkFwcCcgfHwgY29udGV4dC5zdWJUeXBlID09PSAnaW5BcHBQcm9ncmFtJyB8fCBjb250ZXh0LmNvbXBUeXBlID09PSAnSW4tQXBwIFByb2dyYW0nKSB7XG4gICAgICAgIE1rdE1haW5OYXYubG9hZEluQXBwUHJvZ3JhbShjb250ZXh0KVxuICAgICAgfSBlbHNlIGlmIChjb250ZXh0Lm5vZGVUeXBlID09ICdGbG93Jykge1xuICAgICAgICAvL1RoaXMgaXMganVzdCB0ZW1wb3JhcnkgdGlsbCBDcmFzaCBnZXQgdGhlIHN0dWZmIGZvciBteSB0cmVlXG4gICAgICAgIE1rdE1haW5OYXYubG9hZEZsb3coKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWpvcHRzLmNhY2hlUmVxdWVzdCA9IHRydWVcbiAgICAgICAgYWpvcHRzLm9uTXlTdWNjZXNzID0gTWt0TWFpbk5hdi5jYW52YXNBamF4UmVxdWVzdENvbXBsZXRlLmNyZWF0ZURlbGVnYXRlKE1rdE1haW5OYXYpXG4gICAgICAgIGFqb3B0cy5vbk15RmFpbHVyZSA9IE1rdE1haW5OYXYuY2FudmFzQWpheFJlcXVlc3RDb21wbGV0ZS5jcmVhdGVEZWxlZ2F0ZShNa3RNYWluTmF2KVxuICAgICAgICBNa3RDYW52YXMuY2FudmFzQWpheFJlcXVlc3QoJ2V4cGxvcmVyL3Byb2dyYW1DYW52YXMnLCBham9wdHMpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH0sXG5cbiAgLy8gZWRpdHMgdGhlIHZhcmlhYmxlcyB3aXRoaW4gdGhlIEVtYWlsIEVkaXRvciBmb3IgY3VzdG9tIGNvbXBhbnlcbiAgc2F2ZUVtYWlsRWRpdHM6IGZ1bmN0aW9uIChtb2RlLCBhc3NldCkge1xuICAgIGxldCBzYXZlRWRpdHNUb2dnbGUgPSBMSUIuZ2V0Q29va2llKCdzYXZlRWRpdHNUb2dnbGVTdGF0ZScpLFxuICAgICAgbG9nbyA9IExJQi5nZXRDb29raWUoJ2xvZ28nKSxcbiAgICAgIGhlcm9CYWNrZ3JvdW5kID0gTElCLmdldENvb2tpZSgnaGVyb0JhY2tncm91bmQnKSxcbiAgICAgIGNvbG9yID0gTElCLmdldENvb2tpZSgnY29sb3InKVxuXG4gICAgaWYgKHNhdmVFZGl0c1RvZ2dsZSA9PSAndHJ1ZScgJiYgKGxvZ28gIT0gbnVsbCB8fCBoZXJvQmFja2dyb3VuZCAhPSBudWxsIHx8IGNvbG9yICE9IG51bGwpKSB7XG4gICAgICBsZXQgaHR0cFJlZ0V4ID0gbmV3IFJlZ0V4cCgnXmh0dHB8XiQnLCAnaScpLFxuICAgICAgICAvL3RleHRSZWdleCA9IG5ldyBSZWdFeHAoXCJeW14jXXxeJFwiLCBcImlcIiksXG4gICAgICAgIGNvbG9yUmVnZXggPSBuZXcgUmVnRXhwKCdeI1swLTlhLWZdezMsNn0kfF5yZ2J8XiQnLCAnaScpLFxuICAgICAgICBsb2dvSWRzID0gWydoZXJvTG9nbycsICdmb290ZXJMb2dvJywgJ2hlYWRlckxvZ28nLCAnbG9nb0Zvb3RlcicsICdsb2dvJ10sXG4gICAgICAgIGhlcm9CZ1JlZ2V4ID0gbmV3IFJlZ0V4cCgnaGVyb0JhY2tncm91bmR8aGVyby1iYWNrZ3JvdW5kfGhlcm9Ca2d8aGVyby1ia2d8aGVyb0JnfGhlcm8tYmcnLCAnaScpLFxuICAgICAgICAvL3RpdGxlSWRzID0gW1widGl0bGVcIiwgXCJoZXJvVGl0bGVcIiwgXCJtYWluVGl0bGVcIl0sXG4gICAgICAgIC8vc3VidGl0bGVJZHMgPSBbXCJzdWJ0aXRsZVwiLCBcImhlcm9zdWJUaXRsZVwiXSxcbiAgICAgICAgaGVhZGVyQmdDb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAnXihoZWFkZXJCZ0NvbG9yfGhlYWRlci1iZy1jb2xvcnxoZWFkZXJCYWNrZ3JvdW5kQ29sb3J8aGVhZGVyLWJhY2tncm91bmQtY29sb3J8aGVhZGVyQmtnQ29sb3J8aGVhZGVyLWJrZy1jb2xvcnwpJCcsXG4gICAgICAgICAgJ2knXG4gICAgICAgICksXG4gICAgICAgIGJ1dHRvbkJnQ29sb3JSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ14oaGVyb0J1dHRvbkJnQ29sb3J8aGVyby1idXR0b24tYmctY29sb3J8aGVyb0J1dHRvbkJhY2tncm91bmRDb2xvcnxoZXJvLWJ1dHRvbi1iYWNrZ3JvdW5kLWNvbG9yfGhlcm9Ca2dDb2xvcnxoZXJvLWJrZy1jb2xvcnwpJCcsXG4gICAgICAgICAgJ2knXG4gICAgICAgICksXG4gICAgICAgIGJ1dHRvbkJvcmRlckNvbG9yUmVnZXggPSBuZXcgUmVnRXhwKCdeKGhlcm9CdXR0b25Cb3JkZXJDb2xvcnxoZXJvLWJ1dHRvbi1ib3JkZXItY29sb3J8aGVyb0JvcmRlckNvbG9yfGhlcm8tYm9yZGVyLWNvbG9yfCkkJywgJ2knKSxcbiAgICAgICAgbG9nbyA9IExJQi5nZXRDb29raWUoJ2xvZ28nKSxcbiAgICAgICAgaGVyb0JhY2tncm91bmQgPSBMSUIuZ2V0Q29va2llKCdoZXJvQmFja2dyb3VuZCcpLFxuICAgICAgICBjb2xvciA9IExJQi5nZXRDb29raWUoJ2NvbG9yJyksXG4gICAgICAgIC8vdGl0bGUgPSBcIllvdSBUbzxicj5QUkVNSUVSIEJVU0lORVNTIEVWRU5UPGJyPk9GIFRIRSBZRUFSXCIsXG4gICAgICAgIC8vc3VidGl0bGUgPSBMSUIuZ2V0SHVtYW5EYXRlKCksXG4gICAgICAgIC8vdGl0bGVNYXRjaCxcbiAgICAgICAgLy9jb21wYW55LFxuICAgICAgICAvL2NvbXBhbnlOYW1lLFxuICAgICAgICBlZGl0SHRtbCxcbiAgICAgICAgZWRpdEFzc2V0VmFycyxcbiAgICAgICAgd2FpdEZvckxvYWRNc2csXG4gICAgICAgIHdhaXRGb3JSZWxvYWRNc2dcblxuICAgICAgd2FpdEZvckxvYWRNc2cgPSBuZXcgRXh0LldpbmRvdyh7XG4gICAgICAgIGNsb3NhYmxlOiB0cnVlLFxuICAgICAgICBtb2RhbDogdHJ1ZSxcbiAgICAgICAgd2lkdGg6IDUwMCxcbiAgICAgICAgaGVpZ2h0OiAyNTAsXG4gICAgICAgIGNsczogJ21rdE1vZGFsRm9ybScsXG4gICAgICAgIHRpdGxlOiAnUGxlYXNlIFdhaXQgZm9yIFBhZ2UgdG8gTG9hZCcsXG4gICAgICAgIGh0bWw6ICc8dT5TYXZpbmcgRWRpdHMgdG8gSGVybyBCYWNrZ3JvdW5kICYgQnV0dG9uIEJhY2tncm91bmQgQ29sb3I8L3U+IDxicj5XYWl0IHVudGlsIHRoaXMgcGFnZSBjb21wbGV0ZWx5IGxvYWRzIGJlZm9yZSBjbG9zaW5nLiA8YnI+PGJyPjx1PlRvIERpc2FibGUgVGhpcyBGZWF0dXJlOjwvdT4gPGJyPkNsZWFyIHRoZSBzZWxlY3RlZCBjb21wYW55IHZpYSB0aGUgTWFya2V0b0xpdmUgZXh0ZW5zaW9uLidcbiAgICAgIH0pXG4gICAgICB3YWl0Rm9yUmVsb2FkTXNnID0gbmV3IEV4dC5XaW5kb3coe1xuICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcbiAgICAgICAgbW9kYWw6IHRydWUsXG4gICAgICAgIHdpZHRoOiA1MDAsXG4gICAgICAgIGhlaWdodDogMjUwLFxuICAgICAgICBjbHM6ICdta3RNb2RhbEZvcm0nLFxuICAgICAgICB0aXRsZTogJ1BsZWFzZSBXYWl0IGZvciBQYWdlIHRvIFJlbG9hZCcsXG4gICAgICAgIGh0bWw6ICc8dT5TYXZpbmcgRWRpdHMgdG8gTG9nbywgVGl0bGUsICYgU3VidGl0bGU8L3U+IDxicj5XYWl0IGZvciB0aGlzIHBhZ2UgdG8gcmVsb2FkIGF1dG9tYXRpY2FsbHkuIDxicj48YnI+PHU+VG8gRGlzYWJsZSBUaGlzIEZlYXR1cmU6PC91PiA8YnI+Q2xlYXIgdGhlIHNlbGVjdGVkIGNvbXBhbnkgdmlhIHRoZSBNYXJrZXRvTGl2ZSBleHRlbnNpb24uJ1xuICAgICAgfSlcblxuICAgICAgZWRpdEh0bWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICcvZW1haWxlZGl0b3IvZG93bmxvYWRIdG1sRmlsZTI/eHNyZklkPScgKyBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSArICcmZW1haWxJZD0nICsgTWt0My5ETC5kbC5jb21wSWQsXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICAnR0VUJyxcbiAgICAgICAgICB0cnVlLFxuICAgICAgICAgICdkb2N1bWVudCcsXG4gICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBsZXQgaXNMb2dvUmVwbGFjZWRcbiAgICAgICAgICAgIC8vaXNUaXRsZVJlcGxhY2VkLFxuICAgICAgICAgICAgLy9pc1N1YnRpdGxlUmVwbGFjZWQ7XG5cbiAgICAgICAgICAgIGlmIChsb2dvKSB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBsb2dvSWRzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyRWxlbWVudCA9IHJlc3BvbnNlLmdldEVsZW1lbnRCeUlkKGxvZ29JZHNbaWldKVxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIGN1cnJFbGVtZW50ICYmXG4gICAgICAgICAgICAgICAgICBjdXJyRWxlbWVudC5jbGFzc05hbWUuc2VhcmNoKCdta3RvSW1nJykgIT0gLTEgJiZcbiAgICAgICAgICAgICAgICAgIGN1cnJFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKVswXSAmJlxuICAgICAgICAgICAgICAgICAgY3VyckVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpWzBdLmdldEF0dHJpYnV0ZSgnc3JjJykgIT0gbG9nb1xuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gUmVwbGFjaW5nOiBMb2dvID4gJyArIGxvZ28pXG4gICAgICAgICAgICAgICAgICBpc0xvZ29SZXBsYWNlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgIGN1cnJFbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKVswXS5zZXRBdHRyaWJ1dGUoJ3NyYycsIGxvZ28pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgaXNMb2dvUmVwbGFjZWRcbiAgICAgICAgICAgICAgLy98fCBpc1RpdGxlUmVwbGFjZWRcbiAgICAgICAgICAgICAgLy98fCBpc1N1YnRpdGxlUmVwbGFjZWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBsZXQgdXBkYXRlSHRtbFxuXG4gICAgICAgICAgICAgIHVwZGF0ZUh0bWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgTElCLndlYlJlcXVlc3QoXG4gICAgICAgICAgICAgICAgICAnL2VtYWlsZWRpdG9yL3VwZGF0ZUNvbnRlbnQyJyxcbiAgICAgICAgICAgICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgICAgICAgICAgIG5ldyBEYXRlKCkuZ2V0VGltZSgpICtcbiAgICAgICAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpICtcbiAgICAgICAgICAgICAgICAgICcmZW1haWxJZD0nICtcbiAgICAgICAgICAgICAgICAgIE1rdDMuREwuZGwuY29tcElkICtcbiAgICAgICAgICAgICAgICAgICcmY29udGVudD0nICtcbiAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKHJlc3BvbnNlKSkgK1xuICAgICAgICAgICAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgICAgICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgICAgICAgICAgICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KVxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc3RvcCgpXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh3YWl0Rm9yTG9hZE1zZy5pc1Zpc2libGUoKSkge1xuICAgICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLmhpZGUoKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHdhaXRGb3JSZWxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIHVwZGF0ZUh0bWwoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICBlZGl0QXNzZXRWYXJzID0gZnVuY3Rpb24gKGFzc2V0KSB7XG4gICAgICAgIGxldCBhc3NldFZhcnMgPSBhc3NldC5nZXRWYXJpYWJsZVZhbHVlcygpXG5cbiAgICAgICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IE9iamVjdC5rZXlzKGFzc2V0VmFycykubGVuZ3RoOyBpaSsrKSB7XG4gICAgICAgICAgbGV0IGN1cnJWYXJpYWJsZUtleSA9IE9iamVjdC5rZXlzKGFzc2V0VmFycylbaWldXG4gICAgICAgICAgY3VyclZhcmlhYmxlVmFsdWUgPSBPYmplY3QudmFsdWVzKGFzc2V0VmFycylbaWldXG5cbiAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgY3VyclZhcmlhYmxlVmFsdWUgPSAnJ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGhlcm9CZ1JlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlICE9IGhlcm9CYWNrZ3JvdW5kICYmIGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChodHRwUmVnRXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRWYXJpYWJsZVZhbHVlKGN1cnJWYXJpYWJsZUtleSwgaGVyb0JhY2tncm91bmQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGhlYWRlckJnQ29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZSAhPSBjb2xvciAmJiBjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goY29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFZhcmlhYmxlVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBjb2xvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goYnV0dG9uQmdDb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlICE9IGNvbG9yICYmIGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChjb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0VmFyaWFibGVWYWx1ZShjdXJyVmFyaWFibGVLZXksIGNvbG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChidXR0b25Cb3JkZXJDb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgaWYgKGN1cnJWYXJpYWJsZVZhbHVlICE9IGNvbG9yICYmIGN1cnJWYXJpYWJsZVZhbHVlLnNlYXJjaChjb2xvclJlZ2V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0VmFyaWFibGVWYWx1ZShjdXJyVmFyaWFibGVLZXksIGNvbG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3YWl0Rm9yTG9hZE1zZy5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIE1rdDMuYXBwLmNvbnRyb2xsZXJzLmdldCgnTWt0My5jb250cm9sbGVyLmVkaXRvci5lbWFpbDIuRW1haWxFZGl0b3InKS5yZWxvYWRFbWFpbCgpXG4gICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5oaWRlKClcbiAgICAgICAgICB9LCA3NTAwKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZygnPiBFZGl0aW5nOiBFbWFpbCBWYXJpYWJsZXMnKVxuICAgICAgaWYgKG1vZGUgPT0gJ2VkaXQnKSB7XG4gICAgICAgIGxldCBpc1dlYlJlcXVlc3RTZXNzaW9uID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnPiBXYWl0aW5nOiBXZWIgUmVxdWVzdCBTZXNzaW9uIERhdGEnKVxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5ETC5kbC5jb21wSWQnKSAmJlxuICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3RTZWN1cml0eS5nZXRYc3JmSWQnKSAmJlxuICAgICAgICAgICAgTWt0U2VjdXJpdHkuZ2V0WHNyZklkKCkgJiZcbiAgICAgICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignRXh0LmlkJykgJiZcbiAgICAgICAgICAgIEV4dC5pZChudWxsLCAnOicpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTWFya2V0byBBcHAgPiBFZGl0aW5nOiBFbWFpbCBIVE1MJylcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzV2ViUmVxdWVzdFNlc3Npb24pXG5cbiAgICAgICAgICAgIGVkaXRIdG1sKClcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDApXG5cbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgZWRpdEFzc2V0VmFycyhhc3NldClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgaXNFbWFpbEVkaXRvclZhcmlhYmxlcyA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnPiBXYWl0aW5nOiBFbWFpbCBFZGl0b3IgVmFyaWFibGVzJylcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgIXdhaXRGb3JSZWxvYWRNc2cuaXNWaXNpYmxlKCkgJiZcbiAgICAgICAgICAgICAgTElCLmlzUHJvcE9mV2luZG93T2JqKCdNa3QzLmFwcC5jb250cm9sbGVycy5nZXQnKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLmdldEVtYWlsKCkgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLmVtYWlsMi5FbWFpbEVkaXRvcicpLmdldEVtYWlsKCkuZ2V0VmFyaWFibGVWYWx1ZXMoKSAmJlxuICAgICAgICAgICAgICBPYmplY3Qua2V5cyhNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKS5nZXRWYXJpYWJsZVZhbHVlcygpKS5sZW5ndGggIT0gMCAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKS5zZXRWYXJpYWJsZVZhbHVlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogRW1haWwgRWRpdG9yIFZhcmlhYmxlcycpXG4gICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGlzRW1haWxFZGl0b3JWYXJpYWJsZXMpXG5cbiAgICAgICAgICAgICAgZWRpdEFzc2V0VmFycyhNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuZW1haWwyLkVtYWlsRWRpdG9yJykuZ2V0RW1haWwoKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCAwKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT0gJ3ByZXZpZXcnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+IEVkaXRpbmc6IEVtYWlsIFByZXZpZXdlciBWYXJpYWJsZXMnKVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyBlZGl0cyB0aGUgdmFyaWFibGVzIHdpdGhpbiB0aGUgTGFuZGluZyBQYWdlIEVkaXRvciBmb3IgY3VzdG9tIGNvbXBhbnlcbiAgLy8gbW9kZSB2aWV3IChlZGl0LCBwcmV2aWV3KTsgYXNzZXQgdG8gYmUgZWRpdGVkXG4gIHNhdmVMYW5kaW5nUGFnZUVkaXRzOiBmdW5jdGlvbiAobW9kZSwgYXNzZXQpIHtcbiAgICBsZXQgc2F2ZUVkaXRzVG9nZ2xlID0gTElCLmdldENvb2tpZSgnc2F2ZUVkaXRzVG9nZ2xlU3RhdGUnKSxcbiAgICAgIGxvZ28gPSBMSUIuZ2V0Q29va2llKCdsb2dvJyksXG4gICAgICBoZXJvQmFja2dyb3VuZCA9IExJQi5nZXRDb29raWUoJ2hlcm9CYWNrZ3JvdW5kJyksXG4gICAgICBjb2xvciA9IExJQi5nZXRDb29raWUoJ2NvbG9yJylcblxuICAgIGlmIChzYXZlRWRpdHNUb2dnbGUgPT0gJ3RydWUnICYmIChsb2dvICE9IG51bGwgfHwgaGVyb0JhY2tncm91bmQgIT0gbnVsbCB8fCBjb2xvciAhPSBudWxsKSkge1xuICAgICAgbGV0IGh0dHBSZWdFeCA9IG5ldyBSZWdFeHAoJ15odHRwfF4kJywgJ2knKSxcbiAgICAgICAgLy90ZXh0UmVnZXggPSBuZXcgUmVnRXhwKFwiXlteI118XiRcIiwgXCJpXCIpLFxuICAgICAgICBjb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cCgnXiNbMC05YS1mXXszLDZ9JHxecmdifF4kJywgJ2knKSxcbiAgICAgICAgbG9nb1JlZ2V4ID0gbmV3IFJlZ0V4cCgnbG9nb3xoZWFkZXJMb2dvfGhlYWRlci1sb2dvfF4kJywgJ2knKSxcbiAgICAgICAgaGVyb0JnUmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICdoZXJvQmFja2dyb3VuZHxoZXJvLWJhY2tncm91bmR8aGVyb0JrZ3xoZXJvLWJrZ3xoZXJvQmd8aGVyby1iZ3xoZXJvMUJnfGhlcm8tMS1iZ3xoZXJvMUJrZ3xoZXJvLTEtYmtnfGhlcm8xQmFja2dyb3VuZHxeJCcsXG4gICAgICAgICAgJ2knXG4gICAgICAgICksXG4gICAgICAgIC8vdGl0bGVSZWdleCA9IG5ldyBSZWdFeHAoXCJeKG1haW5UaXRsZXxtYWluLXRpdGxlfGhlcm9UaXRsZXxoZXJvLXRpdGxlfHRpdGxlfCkkXCIsIFwiaVwiKSxcbiAgICAgICAgLy9zdWJ0aXRsZVJlZ2V4ID0gbmV3IFJlZ0V4cChcIl4oc3VidGl0bGV8c3ViLXRpdGxlfGhlcm9TdWJ0aXRsZXxoZXJvLXN1YnRpdGxlfCkkXCIsIFwiaVwiKSxcbiAgICAgICAgYnV0dG9uQmdDb2xvclJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAnXihoZXJvQnV0dG9uQmdDb2xvcnxoZXJvLWJ1dHRvbi1iZy1jb2xvcnxoZXJvQnV0dG9uQmFja2dyb3VuZENvbG9yfGhlcm8tYnV0dG9uLWJhY2tncm91bmQtY29sb3J8aGVyb0JrZ0NvbG9yfGhlcm8tYmtnLWNvbG9yfCkkJyxcbiAgICAgICAgICAnaSdcbiAgICAgICAgKSxcbiAgICAgICAgYnV0dG9uQm9yZGVyQ29sb3JSZWdleCA9IG5ldyBSZWdFeHAoJ14oaGVyb0J1dHRvbkJvcmRlckNvbG9yfGhlcm8tYnV0dG9uLWJvcmRlci1jb2xvcnxoZXJvQm9yZGVyQ29sb3J8aGVyby1ib3JkZXItY29sb3J8KSQnLCAnaScpLFxuICAgICAgICBoZWFkZXJCZ0NvbG9yID0gJ2hlYWRlckJnQ29sb3InLFxuICAgICAgICBoZWFkZXJMb2dvSW1nID0gJ2hlYWRlckxvZ29JbWcnLFxuICAgICAgICBoZXJvQmdJbWcgPSAnaGVyb0JnSW1nJyxcbiAgICAgICAgLy9oZXJvVGl0bGUgPSBcImhlcm9UaXRsZVwiLFxuICAgICAgICAvL2hlcm9TdWJ0aXRsZSA9IFwiaGVyb1N1YnRpdGxlXCIsXG4gICAgICAgIGZvcm1CdXR0b25CZ0NvbG9yID0gJ2Zvcm1CdXR0b25CZ0NvbG9yJyxcbiAgICAgICAgZm9vdGVyTG9nb0ltZyA9ICdmb290ZXJMb2dvSW1nJyxcbiAgICAgICAgLy90aXRsZSA9IFwiWW91IFRvIE91ciBFdmVudFwiLFxuICAgICAgICAvL3N1YnRpdGxlID0gTElCLmdldEh1bWFuRGF0ZSgpLFxuICAgICAgICAvL2NvbXBhbnksXG4gICAgICAgIC8vY29tcGFueU5hbWUsXG4gICAgICAgIGVkaXRBc3NldFZhcnMsXG4gICAgICAgIHdhaXRGb3JMb2FkTXNnXG5cbiAgICAgIHdhaXRGb3JMb2FkTXNnID0gbmV3IEV4dC5XaW5kb3coe1xuICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcbiAgICAgICAgbW9kYWw6IHRydWUsXG4gICAgICAgIHdpZHRoOiA1MDAsXG4gICAgICAgIGhlaWdodDogMjUwLFxuICAgICAgICBjbHM6ICdta3RNb2RhbEZvcm0nLFxuICAgICAgICB0aXRsZTogJ1BsZWFzZSBXYWl0IGZvciBQYWdlIHRvIExvYWQnLFxuICAgICAgICBodG1sOiAnPHU+U2F2aW5nIEVkaXRzPC91PiA8YnI+V2FpdCB1bnRpbCB0aGlzIHBhZ2UgY29tcGxldGVseSBsb2FkcyBiZWZvcmUgY2xvc2luZy4gPGJyPjxicj48dT5UbyBEaXNhYmxlIFRoaXMgRmVhdHVyZTo8L3U+IDxicj5DbGVhciB0aGUgc2VsZWN0ZWQgY29tcGFueSB2aWEgdGhlIE1hcmtldG9MaXZlIGV4dGVuc2lvbi4nXG4gICAgICB9KVxuXG4gICAgICBlZGl0QXNzZXRWYXJzID0gZnVuY3Rpb24gKGFzc2V0KSB7XG4gICAgICAgIGxldCBhc3NldFZhcnMgPSBhc3NldC5nZXRSZXNwb25zaXZlVmFyVmFsdWVzKClcbiAgICAgICAgLy9pc0xhbmRpbmdQYWdlRWRpdG9yRnJhZ21lbnRTdG9yZSxcbiAgICAgICAgLy9jb3VudCA9IDAsXG4gICAgICAgIC8vaXNUaXRsZVVwZGF0ZWQgPSBpc1N1YnRpdGxlVXBkYXRlZCA9IGZhbHNlO1xuXG4gICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuXG4gICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShoZWFkZXJCZ0NvbG9yLCBjb2xvcilcbiAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGhlYWRlckxvZ29JbWcsIGxvZ28pXG4gICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShoZXJvQmdJbWcsIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAvL2Fzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShoZXJvVGl0bGUsIHRpdGxlKTtcbiAgICAgICAgLy9hc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoaGVyb1N1YnRpdGxlLCBzdWJ0aXRsZSk7XG4gICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShmb3JtQnV0dG9uQmdDb2xvciwgY29sb3IpXG4gICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShmb290ZXJMb2dvSW1nLCBsb2dvKVxuXG4gICAgICAgIGZvciAobGV0IGlpID0gMDsgaWkgPCBPYmplY3Qua2V5cyhhc3NldFZhcnMpLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGxldCBjdXJyVmFyaWFibGVLZXkgPSBPYmplY3Qua2V5cyhhc3NldFZhcnMpW2lpXSxcbiAgICAgICAgICAgIGN1cnJWYXJpYWJsZVZhbHVlID0gT2JqZWN0LnZhbHVlcyhhc3NldFZhcnMpW2lpXS50b1N0cmluZygpXG5cbiAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgY3VyclZhcmlhYmxlVmFsdWUgPSAnJ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVLZXkuc2VhcmNoKGxvZ29SZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goaHR0cFJlZ0V4KSAhPSAtMSkge1xuICAgICAgICAgICAgICB3YWl0Rm9yTG9hZE1zZy5zaG93KClcbiAgICAgICAgICAgICAgYXNzZXQuc2V0UmVzcG9uc2l2ZVZhclZhbHVlKGN1cnJWYXJpYWJsZUtleSwgbG9nbylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goaGVyb0JnUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGh0dHBSZWdFeCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShjdXJyVmFyaWFibGVLZXksIGhlcm9CYWNrZ3JvdW5kKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VyclZhcmlhYmxlS2V5LnNlYXJjaChidXR0b25CZ0NvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICBpZiAoY3VyclZhcmlhYmxlVmFsdWUuc2VhcmNoKGNvbG9yUmVnZXgpICE9IC0xKSB7XG4gICAgICAgICAgICAgIHdhaXRGb3JMb2FkTXNnLnNob3coKVxuICAgICAgICAgICAgICBhc3NldC5zZXRSZXNwb25zaXZlVmFyVmFsdWUoY3VyclZhcmlhYmxlS2V5LCBjb2xvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJWYXJpYWJsZUtleS5zZWFyY2goYnV0dG9uQm9yZGVyQ29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChjdXJyVmFyaWFibGVWYWx1ZS5zZWFyY2goY29sb3JSZWdleCkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuc2hvdygpXG4gICAgICAgICAgICAgIGFzc2V0LnNldFJlc3BvbnNpdmVWYXJWYWx1ZShjdXJyVmFyaWFibGVLZXksIGNvbG9yKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3YWl0Rm9yTG9hZE1zZy5pc1Zpc2libGUoKSkge1xuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KFwiTWt0My5jb250cm9sbGVyLmVkaXRvci5MYW5kaW5nUGFnZVwiKS5sb2FkRWRpdG9yVmlldygpO1xuICAgICAgICAgICAgd2FpdEZvckxvYWRNc2cuaGlkZSgpXG4gICAgICAgICAgfSwgNzUwMClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogTGFuZGluZyBQYWdlIFZhcmlhYmxlcycpXG4gICAgICBpZiAobW9kZSA9PSAnZWRpdCcpIHtcbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgZWRpdEFzc2V0VmFycyhhc3NldClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZXQgaXNMYW5kaW5nUGFnZUVkaXRvclZhcmlhYmxlcyA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIExJQi5pc1Byb3BPZldpbmRvd09iaignTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0JykgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykgJiZcbiAgICAgICAgICAgICAgTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpLmdldFJlc3BvbnNpdmVWYXJWYWx1ZXMoKSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpLnNldFJlc3BvbnNpdmVWYXJWYWx1ZSAmJlxuICAgICAgICAgICAgICBNa3QzLmFwcC5jb250cm9sbGVycy5nZXQoJ01rdDMuY29udHJvbGxlci5lZGl0b3IuTGFuZGluZ1BhZ2UnKS5nZXRMYW5kaW5nUGFnZSgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJz4gRWRpdGluZzogTGFuZGluZyBQYWdlIEVkaXRvciBWYXJpYWJsZXMnKVxuICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc0xhbmRpbmdQYWdlRWRpdG9yVmFyaWFibGVzKVxuXG4gICAgICAgICAgICAgIGVkaXRBc3NldFZhcnMoTWt0My5hcHAuY29udHJvbGxlcnMuZ2V0KCdNa3QzLmNvbnRyb2xsZXIuZWRpdG9yLkxhbmRpbmdQYWdlJykuZ2V0TGFuZGluZ1BhZ2UoKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCAwKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT0gJ3ByZXZpZXcnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc+IEVkaXRpbmc6IExhbmRpbmcgUGFnZSBQcmV2aWV3ZXIgVmFyaWFibGVzJylcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgc2V0UHJvZ3JhbVJlcG9ydEZpbHRlcjogZnVuY3Rpb24gKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkLCBuZXdQcm9ncmFtQ29tcElkKSB7XG4gICAgbGV0IGFwcGx5UHJvZ3JhbVJlcG9ydEZpbHRlclxuXG4gICAgYXBwbHlQcm9ncmFtUmVwb3J0RmlsdGVyID0gZnVuY3Rpb24gKGdldE5ld1Byb2dyYW1Bc3NldERldGFpbHNSZXNwb25zZSwgY2xvbmVUb0ZvbGRlcklkKSB7XG4gICAgICBsZXQgY3Vyck5ld1JlcG9ydFxuXG4gICAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlLmxlbmd0aDsgaWkrKykge1xuICAgICAgICBjdXJyTmV3UmVwb3J0ID0gZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlLmFzc2V0TGlzdFswXS50cmVlW2lpXVxuXG4gICAgICAgIGlmIChjdXJyTmV3UmVwb3J0LmNvbXBUeXBlID09ICdSZXBvcnQnKSB7XG4gICAgICAgICAgbGV0IHJlcG9ydEZpbHRlclR5cGUsIHNlbGVjdGVkTm9kZXNcblxuICAgICAgICAgIGlmICgvXkVtYWlsL2kudGVzdChjdXJyTmV3UmVwb3J0LnRleHQpKSB7XG4gICAgICAgICAgICByZXBvcnRGaWx0ZXJUeXBlID0gJ21hRW1haWwnXG4gICAgICAgICAgICBzZWxlY3RlZE5vZGVzID0gJ1tcIicgKyBjbG9uZVRvRm9sZGVySWQgKyAnXCJdJ1xuICAgICAgICAgIH0gZWxzZSBpZiAoL14oRW5nYWdlbWVudHxOdXJ0dXIpL2kudGVzdChjdXJyTmV3UmVwb3J0LnRleHQpKSB7XG4gICAgICAgICAgICByZXBvcnRGaWx0ZXJUeXBlID0gJ251cnR1cmVwcm9ncmFtJ1xuICAgICAgICAgICAgc2VsZWN0ZWROb2RlcyA9ICdbXCInICsgY2xvbmVUb0ZvbGRlcklkICsgJ1wiXSdcbiAgICAgICAgICB9IGVsc2UgaWYgKC9eTGFuZGluZy9pLnRlc3QoY3Vyck5ld1JlcG9ydC50ZXh0KSkge1xuICAgICAgICAgICAgcmVwb3J0RmlsdGVyVHlwZSA9ICdtYUxhbmRpbmcnXG4gICAgICAgICAgICBzZWxlY3RlZE5vZGVzID0gJ1tcIicgKyBjbG9uZVRvRm9sZGVySWQgKyAnXCJdJ1xuICAgICAgICAgIH0gZWxzZSBpZiAoL15Qcm9ncmFtL2kudGVzdChjdXJyTmV3UmVwb3J0LnRleHQpKSB7XG4gICAgICAgICAgICByZXBvcnRGaWx0ZXJUeXBlID0gJ3Byb2dyYW0nXG4gICAgICAgICAgICBzZWxlY3RlZE5vZGVzID0gJ1tcIicgKyBjbG9uZVRvRm9sZGVySWQgKyAnXCJdJ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChyZXBvcnRGaWx0ZXJUeXBlICYmIHNlbGVjdGVkTm9kZXMpIHtcbiAgICAgICAgICAgIExJQi53ZWJSZXF1ZXN0KFxuICAgICAgICAgICAgICAnL2FuYWx5dGljcy9hcHBseUNvbXBvbmVudEZpbHRlcicsXG4gICAgICAgICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICAgICAgICcmbm9kZUlkcz0nICtcbiAgICAgICAgICAgICAgc2VsZWN0ZWROb2RlcyArXG4gICAgICAgICAgICAgICcmZmlsdGVyVHlwZT0nICtcbiAgICAgICAgICAgICAgcmVwb3J0RmlsdGVyVHlwZSArXG4gICAgICAgICAgICAgICcmcmVwb3J0SWQ9JyArXG4gICAgICAgICAgICAgIGN1cnJOZXdSZXBvcnQuY29tcElkICtcbiAgICAgICAgICAgICAgJyZ4c3JmSWQ9JyArXG4gICAgICAgICAgICAgIE1rdFNlY3VyaXR5LmdldFhzcmZJZCgpLFxuICAgICAgICAgICAgICAnUE9TVCcsXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2xvbmVUb0ZvbGRlcklkKSB7XG4gICAgICBpZiAoZ2V0TmV3UHJvZ3JhbUFzc2V0RGV0YWlsc1Jlc3BvbnNlKSB7XG4gICAgICAgIGFwcGx5UHJvZ3JhbVJlcG9ydEZpbHRlcihnZXROZXdQcm9ncmFtQXNzZXREZXRhaWxzUmVzcG9uc2UsIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgIH0gZWxzZSBpZiAobmV3UHJvZ3JhbUNvbXBJZCkge1xuICAgICAgICBhcHBseVByb2dyYW1SZXBvcnRGaWx0ZXIoTElCLmdldFByb2dyYW1Bc3NldERldGFpbHMobmV3UHJvZ3JhbUNvbXBJZCksIGNsb25lVG9Gb2xkZXJJZClcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgc2V0UHJvZ3JhbVRhZzogZnVuY3Rpb24gKG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhLCBuZXdQcm9ncmFtQ29tcElkLCB0YWdOYW1lLCB0YWdWYWx1ZSkge1xuICAgIGxldCBjdXJyU2V0dGluZywgdGFnRGF0YVxuXG4gICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IG9yaWdQcm9ncmFtU2V0dGluZ3NEYXRhLmxlbmd0aDsgaWkrKykge1xuICAgICAgY3VyclNldHRpbmcgPSBvcmlnUHJvZ3JhbVNldHRpbmdzRGF0YVtpaV1cblxuICAgICAgaWYgKGN1cnJTZXR0aW5nLnN1bW1hcnlEYXRhLm5hbWUgPT0gdGFnTmFtZSkge1xuICAgICAgICB0YWdEYXRhID0gZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgICAgICAgICd7XCJwcm9ncmFtSWRcIjonICtcbiAgICAgICAgICBuZXdQcm9ncmFtQ29tcElkICtcbiAgICAgICAgICAnLFwicHJvZ3JhbURlc2NyaXB0b3JJZFwiOicgK1xuICAgICAgICAgIHBhcnNlSW50KGN1cnJTZXR0aW5nLmlkLnJlcGxhY2UoL15QRC0vLCAnJykpICtcbiAgICAgICAgICAnLFwiZGVzY3JpcHRvcklkXCI6JyArXG4gICAgICAgICAgY3VyclNldHRpbmcuZGVzY3JpcHRvcklkICtcbiAgICAgICAgICAnLFwiZGVzY3JpcHRvclZhbHVlXCI6XCInICtcbiAgICAgICAgICB0YWdWYWx1ZSArXG4gICAgICAgICAgJ1wifSdcbiAgICAgICAgKVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0YWdEYXRhKSB7XG4gICAgICBMSUIud2ViUmVxdWVzdChcbiAgICAgICAgJy9tYXJrZXRpbmdFdmVudC9zZXRQcm9ncmFtRGVzY3JpcHRvclN1Ym1pdCcsXG4gICAgICAgICdhamF4SGFuZGxlcj1Na3RTZXNzaW9uJm1rdFJlcVVpZD0nICtcbiAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCkgK1xuICAgICAgICBFeHQuaWQobnVsbCwgJzonKSArXG4gICAgICAgICcmY29tcElkPScgK1xuICAgICAgICBuZXdQcm9ncmFtQ29tcElkICtcbiAgICAgICAgJyZfanNvbj0nICtcbiAgICAgICAgdGFnRGF0YSArXG4gICAgICAgICcmeHNyZklkPScgK1xuICAgICAgICBNa3RTZWN1cml0eS5nZXRYc3JmSWQoKSxcbiAgICAgICAgJ1BPU1QnLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgJycsXG4gICAgICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxuICAgICAgICB9XG4gICAgICApXG4gICAgfVxuICB9XG5cbn1cbiIsImNvbnNvbGUubG9nKCdMYW5kaW5nIFBhZ2UgPiBTY3JpcHQ6IExvYWRlZCcpXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBUaGlzIHNjcmlwdCBjb250YWlucyBhbGwgb2YgdGhlIGZ1bmN0aW9uYWxpdHkgbmVlZGVkIGZvciBhdXRvbWF0aWNhbGx5IHN1Ym1pdHRpbmdcbiAqICBmb3JtcyBvbiBNYXJrZXRvTGl2ZSBMYW5kaW5nIFBhZ2VzLlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdmFyXG52YXIgbWt0b0xpdmVEZXZNdW5jaGtpbklkID0gJzY4NS1CVE4tNzcyJyxcbiAgbWt0b0xpdmVQcm9kTXVuY2hraW5JZCA9ICcxODUtTkdYLTgxMScsXG4gIG1rdG9MaXZlTXVuY2hraW5JZCA9IG1rdG9MaXZlUHJvZE11bmNoa2luSWQsXG4gIG51bU9mVmVydGljYWxzID0gMyxcbiAgbW9ja0xlYWRFbmRwb2ludCA9ICdodHRwczovL3d3dy5tb2NrYXJvby5jb20vMDc5OWFiNjAvZG93bmxvYWQ/Y291bnQ9MSZrZXk9N2QzMGNkZjAnLFxuICBob3N0U3BsaXQgPSB3aW5kb3cubG9jYXRpb24uaG9zdC5zcGxpdCgnLicpLFxuICBta3RvTGl2ZURvbWFpbixcbiAgb3JpZ0Nvb2tpZSxcbiAgTFBBR0UgPSBMUEFHRSB8fCB7fVxuXG5MUEFHRS53ZWJSZXF1ZXN0ID0gZnVuY3Rpb24gKHVybCwgcGFyYW1zLCBtZXRob2QsIGFzeW5jLCByZXNwb25zZVR5cGUsIGNhbGxiYWNrKSB7XG4gIGNvbnNvbGUubG9nKCdXZWIgUmVxdWVzdCA+ICcgKyB1cmwgKyAnXFxuJyArIHBhcmFtcylcbiAgbGV0IHhtbEh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSxcbiAgICByZXN1bHRcbiAgeG1sSHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHhtbEh0dHAucmVhZHlTdGF0ZSA9PSA0KSB7XG4gICAgICBpZiAoeG1sSHR0cC5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByZXN1bHQgPSBjYWxsYmFjayh4bWxIdHRwLnJlc3BvbnNlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCA9IHhtbEh0dHAucmVzcG9uc2VcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgbWt0b0xpdmVEb21haW4gKyAnL2VuL3Rvb2xzL2F1dG8tY2xvc2UnXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChhc3luYyAmJiB4bWxIdHRwLnJlc3BvbnNlVHlwZSkge1xuICAgIHhtbEh0dHAucmVzcG9uc2VUeXBlID0gcmVzcG9uc2VUeXBlXG4gIH1cbiAgeG1sSHR0cC5vcGVuKG1ldGhvZCwgdXJsLCBhc3luYykgLy8gdHJ1ZSBmb3IgYXN5bmNocm9ub3VzXG4gIHhtbEh0dHAuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOCcpXG4gIHhtbEh0dHAuc2VuZChwYXJhbXMpXG4gIHJldHVybiByZXN1bHRcbn1cblxuTFBBR0UuZ2V0TmV4dFdlYlBhZ2UgPSBmdW5jdGlvbiAobW9ja0xlYWRFbWFpbCkge1xuICBsZXQgZGF5T2ZNb250aCA9IG5ldyBEYXRlKCkuZ2V0RGF0ZSgpLFxuICAgIGN1cnJWZXJ0aWNhbEluZGV4LFxuICAgIGN1cnJWZXJ0aWNhbFxuXG4gIGlmIChkYXlPZk1vbnRoID4gbnVtT2ZWZXJ0aWNhbHMpIHtcbiAgICBjdXJyVmVydGljYWxJbmRleCA9IChkYXlPZk1vbnRoIC0gMSkgJSBudW1PZlZlcnRpY2Fsc1xuICB9IGVsc2Uge1xuICAgIGN1cnJWZXJ0aWNhbEluZGV4ID0gZGF5T2ZNb250aCAtIDFcbiAgfVxuICBzd2l0Y2ggKGN1cnJWZXJ0aWNhbEluZGV4KSB7XG4gICAgY2FzZSAwOlxuICAgICAgY3VyclZlcnRpY2FsID0gJ2NvZSdcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAxOlxuICAgICAgY3VyclZlcnRpY2FsID0gJ3RlY2gnXG4gICAgICBicmVha1xuICAgIGNhc2UgMjpcbiAgICAgIGN1cnJWZXJ0aWNhbCA9ICdtZmcnXG4gICAgICBicmVha1xuICB9XG5cbiAgcmV0dXJuIExQQUdFLndlYlJlcXVlc3QoJ2h0dHBzOi8vbWFya2V0b2xpdmUuY29tL20zL3BsdWdpbnYzL2RhdGEvJyArIGN1cnJWZXJ0aWNhbCArICctcGFnZXMtd2ViLmpzb24nLCBudWxsLCAnR0VUJywgZmFsc2UsICcnLFxuICAgIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgbGV0IHdlYlBhZ2VzID0gSlNPTi5wYXJzZShyZXNwb25zZSlcbiAgICAgIGlmICghbW9ja0xlYWRFbWFpbCkge1xuICAgICAgICBtb2NrTGVhZEVtYWlsID0gTElCLmdldFVybFBhcmFtKCdtb2NrTGVhZCcpXG4gICAgICB9XG4gICAgICBpZiAod2ViUGFnZXMpIHtcbiAgICAgICAgbGV0IHdlYlBhZ2VYID0gd2ViUGFnZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogd2ViUGFnZXMubGVuZ3RoKV0sXG4gICAgICAgICAgcGFyYW1zID0gJydcbiAgICAgICAgaWYgKHdlYlBhZ2VYLnR5cGUgPT0gJ3ZlcnRpY2FscycpIHtcbiAgICAgICAgICBpZiAod2ViUGFnZVguY2xpY2tSYXRlID49IDEuMCB8fCBNYXRoLnJhbmRvbSgpIDw9IHdlYlBhZ2VYLmNsaWNrUmF0ZSkge1xuICAgICAgICAgICAgcGFyYW1zID0gJ2NsaWNrPXRydWUnXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcmFtcyA9ICdjbGljaz1mYWxzZSdcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcmFtcyA9PSAnJykge1xuICAgICAgICAgIHJldHVybiB3ZWJQYWdlWC51cmwgKyAnPycgKyAnbW9ja0xlYWQ9JyArIG1vY2tMZWFkRW1haWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gd2ViUGFnZVgudXJsICsgJz8nICsgcGFyYW1zICsgJyZtb2NrTGVhZD0nICsgbW9ja0xlYWRFbWFpbFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gJydcbiAgICB9XG4gIClcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgTWFpblxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbm1rdG9MaXZlRG9tYWluID0gJ3d3dy5tYXJrZXRvbGl2ZS5jb20nXG5cbmlmICghb3JpZ0Nvb2tpZSkge1xuICBvcmlnQ29va2llID0gTElCLmdldENvb2tpZSgnX21rdG9fdHJrJylcbn1cblxuOyhmdW5jdGlvbiAoKSB7XG4gIHZhciBkaWRJbml0ID0gZmFsc2UsXG4gICAgcyxcbiAgICBvcmlnTXVuY2hraW5Jbml0XG5cbiAgZnVuY3Rpb24gb3ZlcmxvYWRNdW5jaGtpbkluaXQoKSB7XG4gICAgaWYgKHR5cGVvZiBvcmlnTXVuY2hraW5Jbml0ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcmlnTXVuY2hraW5Jbml0ID0gTXVuY2hraW4uaW5pdFxuICAgIH1cblxuICAgIE11bmNoa2luLmluaXQgPSBmdW5jdGlvbiAoYiwgYSwgY2FsbGJhY2spIHtcbiAgICAgIG9yaWdNdW5jaGtpbkluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgY29uc29sZS5sb2coJ0xvYWRlZCA+IE11bmNoa2luIFRhZycpXG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNhbGxiYWNrKClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvdmVybG9hZE11bmNoa2luRnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZiBvcmlnTXVuY2tpbkZ1bmN0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcmlnTXVuY2tpbkZ1bmN0aW9uID0gTXVuY2hraW4ubXVuY2hraW5GdW5jdGlvblxuICAgIH1cblxuICAgIE11bmNoa2luLm11bmNoa2luRnVuY3Rpb24gPSBmdW5jdGlvbiAoYiwgYSwgYywgY2FsbGJhY2spIHtcbiAgICAgIG9yaWdNdW5ja2luRnVuY3Rpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgY29uc29sZS5sb2coJ0NvbXBsZXRlZCA+IE11bmNoa2luIEZ1bmN0aW9uJylcbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2soKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc2V0TXVuY2hraW5Db29raWUobXVuY2hraW5JZCwgY29va2llQW5vbiwgY2FsbGJhY2spIHtcbiAgICBkb2N1bWVudC5jb29raWUgPVxuICAgICAgJ19ta3RvX3Ryaz07ZG9tYWluPS4nICtcbiAgICAgIGhvc3RTcGxpdFtob3N0U3BsaXQubGVuZ3RoIC0gMl0gK1xuICAgICAgJy4nICtcbiAgICAgIGhvc3RTcGxpdFtob3N0U3BsaXQubGVuZ3RoIC0gMV0gK1xuICAgICAgJztwYXRoPS87ZXhwaXJlcz1UaHUsIDAxIEphbiAxOTcwIDAwOjAwOjAxIEdNVCdcbiAgICBjb25zb2xlLmxvZygnUmVtb3ZlZCA+IENvb2tpZTogX21rdG9fdHJrJylcbiAgICBvdmVybG9hZE11bmNoa2luSW5pdCgpXG4gICAgTXVuY2hraW4uaW5pdChcbiAgICAgIG11bmNoa2luSWQsXG4gICAgICB7XG4gICAgICAgIGNvb2tpZUxpZmVEYXlzOiAzNjUsXG4gICAgICAgIGNvb2tpZUFub246IGNvb2tpZUFub24sXG4gICAgICAgIGRpc2FibGVDbGlja0RlbGF5OiB0cnVlXG4gICAgICB9LFxuICAgICAgY2FsbGJhY2tcbiAgICApXG4gIH1cblxuICBmdW5jdGlvbiByZXNldE1hc3Rlck11bmNoa2luQ29va2llKGNhbGxiYWNrKSB7XG4gICAgbGV0IG9rdGFVc2VybmFtZSA9IExJQi5nZXRDb29raWUoJ29rdGFfdXNlcm5hbWUnKVxuXG4gICAgaWYgKG9rdGFVc2VybmFtZSkge1xuICAgICAgbGV0IGVtYWlsID0gJ21rdG9kZW1vc3ZjcysnICsgb2t0YVVzZXJuYW1lICsgJ0BnbWFpbC5jb20nXG5cbiAgICAgIGRvY3VtZW50LmNvb2tpZSA9XG4gICAgICAgICdfbWt0b190cms9O2RvbWFpbj0nICtcbiAgICAgICAgaG9zdFNwbGl0W2hvc3RTcGxpdC5sZW5ndGggLSAyXSArXG4gICAgICAgICcuJyArXG4gICAgICAgIGhvc3RTcGxpdFtob3N0U3BsaXQubGVuZ3RoIC0gMV0gK1xuICAgICAgICAnO3BhdGg9LztleHBpcmVzPVRodSwgMDEgSmFuIDE5NzAgMDA6MDA6MDEgR01UJ1xuICAgICAgY29uc29sZS5sb2coJ1JlbW92ZWQgPiBDb29raWU6IF9ta3RvX3RyaycpXG4gICAgICBvdmVybG9hZE11bmNoa2luSW5pdCgpXG4gICAgICBNdW5jaGtpbi5pbml0KFxuICAgICAgICAnMTg1LU5HWC04MTEnLFxuICAgICAgICB7XG4gICAgICAgICAgY29va2llTGlmZURheXM6IDM2NSxcbiAgICAgICAgICBjb29raWVBbm9uOiBmYWxzZSxcbiAgICAgICAgICBkaXNhYmxlQ2xpY2tEZWxheTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ0Fzc29jaWF0aW5nID4gTGVhZCA6ICcgKyBlbWFpbClcbiAgICAgICAgICBvdmVybG9hZE11bmNoa2luRnVuY3Rpb24oKVxuICAgICAgICAgIE11bmNoa2luLm11bmNoa2luRnVuY3Rpb24oXG4gICAgICAgICAgICAnYXNzb2NpYXRlTGVhZCcsXG4gICAgICAgICAgICB7RW1haWw6IGVtYWlsfSxcbiAgICAgICAgICAgIHNoYTEoJzEyMzEyMzEyMycgKyBlbWFpbCksXG4gICAgICAgICAgICBjYWxsYmFja1xuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob3JpZ0Nvb2tpZSkge1xuICAgICAgICBkb2N1bWVudC5jb29raWUgPVxuICAgICAgICAgICdfbWt0b190cms9JyArXG4gICAgICAgICAgb3JpZ0Nvb2tpZSArXG4gICAgICAgICAgJztkb21haW49JyArXG4gICAgICAgICAgaG9zdFNwbGl0W2hvc3RTcGxpdC5sZW5ndGggLSAyXSArXG4gICAgICAgICAgJy4nICtcbiAgICAgICAgICBob3N0U3BsaXRbaG9zdFNwbGl0Lmxlbmd0aCAtIDFdICtcbiAgICAgICAgICAnO3BhdGg9LztleHBpcmVzPScgK1xuICAgICAgICAgIG5ldyBEYXRlKG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgMzY1ICogMjQgKiA2MCAqIDYwICogMTAwMCkudG9VVENTdHJpbmcoKVxuICAgICAgICBjb25zb2xlLmxvZygnUmVzdG9yZWQgPiBDb29raWU6IF9ta3RvX3RyayA9ICcgKyBvcmlnQ29va2llKVxuICAgICAgICBjb25zb2xlLmxvZygnUmVzdG9yZWQgPiBDb29raWU6IF9ta3RvX3RyayA9ICcgKyBMSUIuZ2V0Q29va2llKCdfbWt0b190cmsnKSlcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2soKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN1Ym1pdExlYWREYXRhKCkge1xuICAgIGxldCBjb29raWVBbm9uID0gdHJ1ZVxuXG4gICAgcmVzZXRNdW5jaGtpbkNvb2tpZShta3RvTGl2ZU11bmNoa2luSWQsIGNvb2tpZUFub24sIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBpc01rdG9Gb3JtID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBNa3RvRm9ybXMyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdMYW5kaW5nIFBhZ2UgPiBHZXR0aW5nOiBGb3JtJylcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpc01rdG9Gb3JtKVxuICAgICAgICAgIE1rdG9Gb3JtczIud2hlblJlYWR5KGZ1bmN0aW9uIChmb3JtKSB7XG4gICAgICAgICAgICBsZXQgbmV4dFVybCA9ICdodHRwOi8vd3d3Lm1hcmtldG9saXZlLmNvbS9kYXRhL21vY2stbGVhZCcsXG4gICAgICAgICAgICAgIGRlbW9NYWlsQm94ID0gJ21rdG9kZW1vc3ZjcysnLFxuICAgICAgICAgICAgICB1c2VybmFtZUNvb2tpZU5hbWUgPSAnb2t0YV91c2VybmFtZScsXG4gICAgICAgICAgICAgIGZpcnN0TmFtZUNvb2tpZU5hbWUgPSAnb2t0YV9maXJzdF9uYW1lJyxcbiAgICAgICAgICAgICAgbGFzdE5hbWVDb29raWVOYW1lID0gJ29rdGFfbGFzdF9uYW1lJyxcbiAgICAgICAgICAgICAgam9iVGl0bGVDb29raWVOYW1lID0gJ2F0dHJpYl9qb2JfdGl0bGUnLFxuICAgICAgICAgICAgICBjb21wYW55TmFtZUNvb2tpZU5hbWUgPSAnYXR0cmliX2NvbXBhbnlfbmFtZScsXG4gICAgICAgICAgICAgIGluZHVzdHJ5Q29va2llTmFtZSA9ICdhdHRyaWJfaW5kdXN0cnknLFxuICAgICAgICAgICAgICBsZWFkU291cmNlQ29va2llTmFtZSA9ICdhdHRyaWJfbGVhZF9zb3VyY2UnLFxuICAgICAgICAgICAgICBtb2JpbGVOdW1iZXJDb29raWVOYW1lID0gJ2F0dHJpYl9tb2JpbGVfbnVtYmVyJyxcbiAgICAgICAgICAgICAgcGhvbmVOdW1iZXJDb29raWVOYW1lID0gJ2F0dHJpYl9waG9uZV9udW1iZXInLFxuICAgICAgICAgICAgICBjaGVja0JveGVzID0gWyd5ZXMnLCAnbm8nXSxcbiAgICAgICAgICAgICAgc3VibWl0ID0gTElCLmdldFVybFBhcmFtKCdzdWJtaXQnKSxcbiAgICAgICAgICAgICAgaXNNb2NrTGVhZCA9IExJQi5nZXRVcmxQYXJhbSgnaXNNb2NrTGVhZCcpLFxuICAgICAgICAgICAgICB1dG1UZXJtID0gTElCLmdldFVybFBhcmFtKCd1dG1UZXJtJyksXG4gICAgICAgICAgICAgIHV0bU1lZGl1bSA9IExJQi5nZXRVcmxQYXJhbSgndXRtTWVkaXVtJyksXG4gICAgICAgICAgICAgIHV0bUNhbXBhaWduID0gTElCLmdldFVybFBhcmFtKCd1dG1DYW1wYWlnbicpLFxuICAgICAgICAgICAgICB1dG1Tb3VyY2UgPSBMSUIuZ2V0VXJsUGFyYW0oJ3V0bVNvdXJjZScpLFxuICAgICAgICAgICAgICBhbnN3ZXIsXG4gICAgICAgICAgICAgIG5leHRXZWJQYWdlXG5cbiAgICAgICAgICAgIGlmIChzdWJtaXQgPT0gJ3RydWUnIHx8IHN1Ym1pdCA9PSAndGVzdCcpIHtcbiAgICAgICAgICAgICAgbGV0IGZvcm1WYWxzID0gZm9ybS5nZXRWYWx1ZXMoKVxuICAgICAgICAgICAgICBpZiAoaXNNb2NrTGVhZCA9PSAndHJ1ZScpIHtcbiAgICAgICAgICAgICAgICBmb3JtLm9uU3VjY2VzcyhmdW5jdGlvbiAodmFsdWVzLCBmb2xsb3dVcFVybCkge1xuICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPVxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ub3JpZ2luICtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJz9zdWJtaXQ9JyArIHN1Ym1pdCArXG4gICAgICAgICAgICAgICAgICAgICcmaXNNb2NrTGVhZD1mYWxzZScgK1xuICAgICAgICAgICAgICAgICAgICAnJnV0bVRlcm09JyArIHV0bVRlcm0gK1xuICAgICAgICAgICAgICAgICAgICAnJnV0bU1lZGl1bT0nICsgdXRtTWVkaXVtICtcbiAgICAgICAgICAgICAgICAgICAgJyZ1dG1DYW1wYWlnbj0nICsgdXRtQ2FtcGFpZ24gK1xuICAgICAgICAgICAgICAgICAgICAnJnV0bVNvdXJjZT0nICsgdXRtU291cmNlICtcbiAgICAgICAgICAgICAgICAgICAgJyZtb2NrTGVhZD0nICsgdmFsdWVzLkVtYWlsXG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgTFBBR0Uud2ViUmVxdWVzdChtb2NrTGVhZEVuZHBvaW50LCBudWxsLCAnR0VUJywgdHJ1ZSwgJ2pzb24nLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgIGxldCBtb2NrTGVhZFggPSBKU09OLnBhcnNlKHJlc3BvbnNlKVxuICAgICAgICAgICAgICAgICAgaWYgKG1vY2tMZWFkWCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobW9ja0xlYWRYLm1vYmlsZU51bWJlciA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgbW9ja0xlYWRYLm1vYmlsZU51bWJlciA9ICcnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vY2tMZWFkWC5waG9uZU51bWJlciA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgbW9ja0xlYWRYLnBob25lTnVtYmVyID0gJydcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1WYWxzLkVtYWlsICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKG1vY2tMZWFkWC5lbWFpbCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe0VtYWlsOiBtb2NrTGVhZFguZW1haWx9KVxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBta3RvTGl2ZURvbWFpbiArICcvZW4vdG9vbHMvYXV0by1jbG9zZSdcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtVmFscy5GaXJzdE5hbWUgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAobW9ja0xlYWRYLmZpcnN0TmFtZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe0ZpcnN0TmFtZTogbW9ja0xlYWRYLmZpcnN0TmFtZX0pXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuTGFzdE5hbWUgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAobW9ja0xlYWRYLmxhc3ROYW1lICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7TGFzdE5hbWU6IG1vY2tMZWFkWC5sYXN0TmFtZX0pXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuVGl0bGUgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAobW9ja0xlYWRYLmpvYlRpdGxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7VGl0bGU6IG1vY2tMZWFkWC5qb2JUaXRsZX0pXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuQ29tcGFueSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChtb2NrTGVhZFguY29tcGFueSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe0NvbXBhbnk6IG1vY2tMZWFkWC5jb21wYW55fSlcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtVmFscy5JbmR1c3RyeSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChtb2NrTGVhZFguaW5kdXN0cnkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS52YWxzKHtJbmR1c3RyeTogbW9ja0xlYWRYLmluZHVzdHJ5fSlcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtVmFscy5MZWFkU291cmNlICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKG1vY2tMZWFkWC5sZWFkU291cmNlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7TGVhZFNvdXJjZTogbW9ja0xlYWRYLmxlYWRTb3VyY2V9KVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1WYWxzLk1vYmlsZVBob25lICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKG1vY2tMZWFkWC5tb2JpbGVOdW1iZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS52YWxzKHtNb2JpbGVQaG9uZTogbW9ja0xlYWRYLm1vYmlsZU51bWJlcn0pXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuUGhvbmUgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAobW9ja0xlYWRYLnBob25lTnVtYmVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7UGhvbmU6IG1vY2tMZWFkWC5waG9uZU51bWJlcn0pXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuc3Vic2NyaWJlZFRvQXBwTWVzc2FnZXMgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe3N1YnNjcmliZWRUb0FwcE1lc3NhZ2VzOiBNYXRoLnJhbmRvbSgpIDw9IDAuOCA/IGNoZWNrQm94ZXNbMF0gOiBjaGVja0JveGVzWzFdfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1WYWxzLnN1YnNjcmliZWRUb0Jsb2dQb3N0cyAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7c3Vic2NyaWJlZFRvQmxvZ1Bvc3RzOiBNYXRoLnJhbmRvbSgpIDw9IDAuOCA/IGNoZWNrQm94ZXNbMF0gOiBjaGVja0JveGVzWzFdfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1WYWxzLnN1YnNjcmliZWRUb0V2ZW50SW52aXRhdGlvbnMgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe3N1YnNjcmliZWRUb0V2ZW50SW52aXRhdGlvbnM6IE1hdGgucmFuZG9tKCkgPD0gMC44ID8gY2hlY2tCb3hlc1swXSA6IGNoZWNrQm94ZXNbMV19KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuc3Vic2NyaWJlZFRvTmV3c2xldHRlciAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7c3Vic2NyaWJlZFRvTmV3c2xldHRlcjogTWF0aC5yYW5kb20oKSA8PSAwLjggPyBjaGVja0JveGVzWzBdIDogY2hlY2tCb3hlc1sxXX0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtVmFscy5zdWJzY3JpYmVkVG9TTVMgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe3N1YnNjcmliZWRUb1NNUzogTWF0aC5yYW5kb20oKSA8PSAwLjggPyBjaGVja0JveGVzWzBdIDogY2hlY2tCb3hlc1sxXX0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtVmFscy5zdWJzY3JpYmVkVG9XZWJpbmFySW52aXRhdGlvbnMgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe3N1YnNjcmliZWRUb1dlYmluYXJJbnZpdGF0aW9uczogTWF0aC5yYW5kb20oKSA8PSAwLjggPyBjaGVja0JveGVzWzBdIDogY2hlY2tCb3hlc1sxXX0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtVmFscy51bnN1YnNjcmliZWRUb0FsbCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7dW5zdWJzY3JpYmVkVG9BbGw6IE1hdGgucmFuZG9tKCkgPD0gMC4wNSA/IGNoZWNrQm94ZXNbMF0gOiBjaGVja0JveGVzWzFdfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKHN1Ym1pdCA9PSAndHJ1ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybS5zdWJtaXQoKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9ybS5vblN1Y2Nlc3MoZnVuY3Rpb24gKHZhbHVlcywgZm9sbG93VXBVcmwpIHtcbiAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gTFBBR0UuZ2V0TmV4dFdlYlBhZ2UoKVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1WYWxzLkVtYWlsICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgdXNlcklkID0gTElCLmdldENvb2tpZSh1c2VybmFtZUNvb2tpZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBlbWFpbCA9IGRlbW9NYWlsQm94ICsgdXNlcklkICsgJ0BnbWFpbC5jb20nXG4gICAgICAgICAgICAgICAgICBpZiAodXNlcklkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybS52YWxzKHtFbWFpbDogZW1haWx9KVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgbWt0b0xpdmVEb21haW4gKyAnL2VuL3Rvb2xzL2F1dG8tY2xvc2UnXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuRmlyc3ROYW1lICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgZmlyc3ROYW1lID0gTElCLmdldENvb2tpZShmaXJzdE5hbWVDb29raWVOYW1lKVxuICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0TmFtZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7Rmlyc3ROYW1lOiBmaXJzdE5hbWV9KVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1WYWxzLkxhc3ROYW1lICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgbGFzdE5hbWUgPSBMSUIuZ2V0Q29va2llKGxhc3ROYW1lQ29va2llTmFtZSlcbiAgICAgICAgICAgICAgICAgIGlmIChsYXN0TmFtZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7TGFzdE5hbWU6IGxhc3ROYW1lfSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtVmFscy5UaXRsZSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgbGV0IGpvYlRpdGxlID0gTElCLmdldENvb2tpZShqb2JUaXRsZUNvb2tpZU5hbWUpXG4gICAgICAgICAgICAgICAgICBpZiAoam9iVGl0bGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe1RpdGxlOiBqb2JUaXRsZX0pXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuQ29tcGFueSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgbGV0IGNvbXBhbnkgPSBMSUIuZ2V0Q29va2llKGNvbXBhbnlOYW1lQ29va2llTmFtZSlcbiAgICAgICAgICAgICAgICAgIGlmIChjb21wYW55ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybS52YWxzKHtDb21wYW55OiBjb21wYW55fSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtVmFscy5JbmR1c3RyeSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgbGV0IGluZHVzdHJ5ID0gTElCLmdldENvb2tpZShpbmR1c3RyeUNvb2tpZU5hbWUpXG4gICAgICAgICAgICAgICAgICBpZiAoaW5kdXN0cnkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe0luZHVzdHJ5OiBpbmR1c3RyeX0pXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuTGVhZFNvdXJjZSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgbGV0IGxlYWRTb3VyY2UgPSBMSUIuZ2V0Q29va2llKGxlYWRTb3VyY2VDb29raWVOYW1lKVxuICAgICAgICAgICAgICAgICAgaWYgKGxlYWRTb3VyY2UgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe0xlYWRTb3VyY2U6IGxlYWRTb3VyY2V9KVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1WYWxzLk1vYmlsZVBob25lICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgbW9iaWxlTnVtYmVyID0gTElCLmdldENvb2tpZShtb2JpbGVOdW1iZXJDb29raWVOYW1lKVxuICAgICAgICAgICAgICAgICAgaWYgKG1vYmlsZU51bWJlciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7TW9iaWxlUGhvbmU6IG1vYmlsZU51bWJlcn0pXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuUGhvbmUgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgIGxldCBwaG9uZU51bWJlciA9IExJQi5nZXRDb29raWUocGhvbmVOdW1iZXJDb29raWVOYW1lKVxuICAgICAgICAgICAgICAgICAgaWYgKHBob25lTnVtYmVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybS52YWxzKHtQaG9uZTogcGhvbmVOdW1iZXJ9KVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1WYWxzLnN1YnNjcmliZWRUb0FwcE1lc3NhZ2VzICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe3N1YnNjcmliZWRUb0FwcE1lc3NhZ2VzOiBNYXRoLnJhbmRvbSgpIDw9IDAuOCA/IGNoZWNrQm94ZXNbMF0gOiBjaGVja0JveGVzWzFdfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtVmFscy5zdWJzY3JpYmVkVG9CbG9nUG9zdHMgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7c3Vic2NyaWJlZFRvQmxvZ1Bvc3RzOiBNYXRoLnJhbmRvbSgpIDw9IDAuOCA/IGNoZWNrQm94ZXNbMF0gOiBjaGVja0JveGVzWzFdfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtVmFscy5zdWJzY3JpYmVkVG9FdmVudEludml0YXRpb25zICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe3N1YnNjcmliZWRUb0V2ZW50SW52aXRhdGlvbnM6IE1hdGgucmFuZG9tKCkgPD0gMC44ID8gY2hlY2tCb3hlc1swXSA6IGNoZWNrQm94ZXNbMV19KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1WYWxzLnN1YnNjcmliZWRUb05ld3NsZXR0ZXIgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7c3Vic2NyaWJlZFRvTmV3c2xldHRlcjogTWF0aC5yYW5kb20oKSA8PSAwLjggPyBjaGVja0JveGVzWzBdIDogY2hlY2tCb3hlc1sxXX0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuc3Vic2NyaWJlZFRvU01TICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe3N1YnNjcmliZWRUb1NNUzogTWF0aC5yYW5kb20oKSA8PSAwLjggPyBjaGVja0JveGVzWzBdIDogY2hlY2tCb3hlc1sxXX0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMuc3Vic2NyaWJlZFRvV2ViaW5hckludml0YXRpb25zICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICBmb3JtLnZhbHMoe3N1YnNjcmliZWRUb1dlYmluYXJJbnZpdGF0aW9uczogTWF0aC5yYW5kb20oKSA8PSAwLjggPyBjaGVja0JveGVzWzBdIDogY2hlY2tCb3hlc1sxXX0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHMudW5zdWJzY3JpYmVkVG9BbGwgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgIGZvcm0udmFscyh7dW5zdWJzY3JpYmVkVG9BbGw6IE1hdGgucmFuZG9tKCkgPD0gMC4wNSA/IGNoZWNrQm94ZXNbMF0gOiBjaGVja0JveGVzWzFdfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHN1Ym1pdCA9PSAndHJ1ZScpIHtcbiAgICAgICAgICAgICAgICAgIGZvcm0uc3VibWl0KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3VibWl0ID09ICdmYWxzZScpIHtcbiAgICAgICAgICAgICAgcmVzZXRNYXN0ZXJNdW5jaGtpbkNvb2tpZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1Bvc3RpbmcgPiBSZWFsIExlYWQgPiBWaXNpdCBXZWIgUGFnZTogJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSlcbiAgICAgICAgICAgICAgICBvdmVybG9hZE11bmNoa2luRnVuY3Rpb24oKVxuICAgICAgICAgICAgICAgIE11bmNoa2luLm11bmNoa2luRnVuY3Rpb24oXG4gICAgICAgICAgICAgICAgICAndmlzaXRXZWJQYWdlJyxcbiAgICAgICAgICAgICAgICAgIHt1cmw6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZX0sXG4gICAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBMUEFHRS5nZXROZXh0V2ViUGFnZSgpXG4gICAgICAgICAgICAgICAgICAgIH0sIDEwMDApXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0sIDApXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXRNdW5jaGtpbigpIHtcbiAgICBpZiAoZGlkSW5pdCA9PT0gZmFsc2UpIHtcbiAgICAgIGRpZEluaXQgPSB0cnVlXG4gICAgICBzdWJtaXRMZWFkRGF0YSgpXG4gICAgfVxuICB9XG5cbiAgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gIHMudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnXG4gIHMuYXN5bmMgPSB0cnVlXG4gIHMuc3JjID0gJy8vbXVuY2hraW4ubWFya2V0by5uZXQvbXVuY2hraW4uanMnXG4gIHMub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJyB8fCB0aGlzLnJlYWR5U3RhdGUgPT0gJ2xvYWRlZCcpIHtcbiAgICAgIGluaXRNdW5jaGtpbigpXG4gICAgfVxuICB9XG4gIHMub25sb2FkID0gaW5pdE11bmNoa2luXG4gIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQocylcbn0pKClcbiJdfQ==
