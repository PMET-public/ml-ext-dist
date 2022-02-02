// DO NOT EDIT! All changes will be lost. This is a temporary, auto-generated file using gulp to combine javascript sources.
window.MARKETO_EXT_VERSION = 'v5.4.19'; // version also automatically injected via gulp using manifest.json

const filesInDirectory = dir => new Promise (resolve =>
    dir.createReader ().readEntries (entries =>
        Promise.all (entries.filter (e => e.name[0] !== '.').map (e =>
            e.isDirectory
                ? filesInDirectory (e)
                : new Promise (resolve => e.file (resolve))
        ))
        .then (files => [].concat (...files))
        .then (resolve)
    )
)

const timestampForFilesInDirectory = dir =>
        filesInDirectory (dir).then (files =>
            files.map (f => f.name + f.lastModifiedDate).join ())

const watchChanges = (dir, lastTimestamp) => {
    timestampForFilesInDirectory (dir).then (timestamp => {
        if (!lastTimestamp || (lastTimestamp === timestamp)) {
            setTimeout (() => watchChanges (dir, timestamp), 1000) // retry after 1s
        } else {
            chrome.runtime.reload ()
        }
    })
}

chrome.management.getSelf (self => {
    if (self.installType === 'development') {
        chrome.runtime.getPackageDirectoryEntry (dir => watchChanges (dir))
        chrome.tabs.query ({ active: true, lastFocusedWindow: true }, tabs => { // NB: see https://github.com/xpl/crx-hotreload/issues/5
            if (tabs[0]) {
                chrome.tabs.reload (tabs[0].id)
            }
        })
    }
})

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
  mktoPerformanceInsightsLink: 'https://insights.marketolive.com/mpi',
  mktoEmailInsightsLink: 'https://insights.marketolive.com/email',
  mktoEmailDeliverabilityToolsLink: 'https://250ok.com/login?submit=true',
  mktoAccountStringMaster: 'mktodemolivemaster',
  mktoAccountStringMasterMEUE: 'mktodemoaccount544',
  mktoAccountStringABDemoMaster: 'mktodemoaccount544',
  mktoAccountString106: 'mktodemoaccount106',
  mktoAccountString106d: 'mktodemoaccount106d',
  mktoBizibleDiscoverLink: 'https://apps.bizible.com/Discover/3839',
  mktoBizibleRevPlanLink: 'https://apps.bizible.com/MyAccount/Business/391?busView=false#!/MyAccount/Business/DecisionEngine.DecisionEngineHome',
  demoModelerLink: 'https://app-sjp.marketo.com/?preview=true&approved=true/#RCM83A1',
  mktoDemoAccountMatch: '^(adobedemoaccount[0-9][0-9][0-9]|mktodemoaccount[0-9][0-9][0-9]|mktodemoaccount36|scdynamics1|mktodemoinfor01|mktodemoaccount390dev1)$',

  isMarketoLiveInstance: async function() {
    await LIB.mktoPageGlobalReady()
    return MktPage.savedState.custPrefix.search(`^(mktodemoaccount106|mktodemoaccount106d|mktodemolivemaster|mktodemoaccount408|globalsales|${LIB.mktoAccountStringABDemoMaster})$`) != -1
  },

  // this matches the logic of pluginv3/marketo-global-app.js to determine when to load pluginv3/marketo-demo-app.js
  isMarketoDemoInstance: async function () {
    if (await LIB.isMarketoLiveInstance()) {
      return false
    }
    return MktPage.savedState.custPrefix.search(LIB.mktoDemoAccountMatch) != -1
  },

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

    for (let i = 0; i < cookies.length; i++) {
      currCookie = cookies[i].trim()
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

    for (let i = 0; i < splitText.length; i++) {
      if (i != 0) {
        formattedText += ' '
      }
      formattedText += splitText[i].charAt(0).toUpperCase() + splitText[i].substring(1).toLowerCase()
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

      for (let i = 0; i < params.length; i++) {
        paramPair = params[i].split('=')
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
    console.log('LIB > Loading Script: ' + scriptSrc)
    let scriptElement = document.createElement('script')
    scriptElement.async = true
    scriptElement.src = scriptSrc
    document.getElementsByTagName('head')[0].appendChild(scriptElement)
  },

  webRequest: function (url, params, method, async, responseType, callback) {
    url = url.replace('https://marketolive.com/m3/pluginv3', warPrefix)
    console.log('LIB > Web Request: ' + url + '\n' + params)
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
    console.log('LIB > Validating: Demo Extension Check')
    if (isValidExtension) {
      window.mkto_live_extension_state = 'MarketoLive extension is alive!'
      console.log('LIB > Validating: Demo Extension IS Valid')
    } else if (LIB.isPropOfWindowObj('MktPage.validateDemoExtension')) {
      window.mkto_live_extension_state = null
      MktPage.validateDemoExtension(new Date())
      console.log('LIB > Validating: Demo Extension IS NOT Valid')
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
              for (let i = 0; i < mktoImgs.length; i++) {
                let currMktoImg = mktoImgs[i],
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
              for (let i = 0; i < mktoTds.length; i++) {
                let currMktoTd = mktoTds[i]

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
              for (let i = 0; i < mktoButtons.length; i++) {
                let currMktoButton = mktoButtons[i]

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
              for (let i = 0; i < mktoImgs.length; i++) {
                let currMktoImg = mktoImgs[i]
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
              for (let i = 0; i < mktoImgs.length; i++) {
                let currMktoImg = mktoImgs[i]
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

          if (!isMktoButtonReplaced && color && (mktoButton || mktoButtons.length)) {
            if (mktoButton) {
              console.log('> Overlaying: Landing Page Button Company Color for Demo Svcs Template')
              mktoButton.setAttribute(
                'style',
                currMktoButton.getAttribute('style') + '; background-color: ' + color + ' !important; border-color: ' + color + ' !important;'
              )
              isMktoButtonReplaced = true
            } else {
              for (let i = 0; i < mktoButtons.length; i++) {
                let currMktoButton = mktoButtons[i]
                if (
                  currMktoButton.style.backgroundColor != null &&
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
                      LIB.reloadMarketingActivities()
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

  // reloads the Marketing Activities Tree
  reloadMarketingActivities: function () {
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
  },

  replaceLinkInElHTML(el, link) {
    el.outerHTML = el.outerHTML.replace(/\s+href="[^"]*"\s+/g, ` href="${link}"`)
  },

  addTrackerToHomeTileById(id, text, assetName = 'Demo App') {
    document.getElementById(id).onclick = function () {
      LIB.heapTrack('track', {name: text, assetArea: text, assetName: assetName, assetType: 'Home Tile'})
    }
  },

  appendHomeTile: function (id, classInfix, link, linkText, ) {
    let container = document.querySelector('div[id^=homeTile-]').parentNode,
      d = document.createElement('div')
    container.insertBefore(d, container.childNodes[container.childNodes.length - 1])
    d.outerHTML =
      `<div class="x4-btn mkt3-homeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left" style="height: 150px;" id="${id}">
        <em id="${id}-btnWrap">
          <a id="${id}-btnEl" href="${link}" class="x4-btn-center" target="_blank" role="link" style="width: 140px; height: 140px;">
            <span id="${id}-btnInnerEl" class="x4-btn-inner" style="width: 140px; height: 140px; line-height: 140px;">${linkText}</span>
            <span id="${id}-btnIconEl" class="x4-btn-icon mki3-${classInfix}-svg"></span>
          </a>
        </em>
      </div>`
  },

  /**************************************************************************************
   *  This function overrides the target links for the Deliverability Tools and Email
   *  Insights tiles if they exist, otherwise it creates the tiles. We only have a single
   *  instance that contains usable demo data for both 250ok and Email Insights, so the
   *  plugin directs people into that instance. This function directs users to the 250ok
   *  login page where the deliverability-tools.js script will automatically login and
   *  hide the necessary buttons. This function should also run inside of SC sandbox
   *  instances.
   **************************************************************************************/
  overrideHomeTiles: async function () {
    if (LIB.areHomeTilesOverridden) {
      return console.log('LIB > Home Tiles Already Updated')
    } else {
      LIB.areHomeTilesOverridden = true
      console.log('LIB > Overriding: Home Tiles')
    }
    let firstTile = await LIB.waitForElBySel('div[id^=homeTile-]'),
      container = firstTile.parentNode,
      tilesTextContainers = container.getElementsByTagName('span'),
      hiddenTile1 = container.querySelector('div[role="presentation"]'),
      hiddenTile2 = container.querySelector('div[class="x-panel-bwrap x-panel"]'),
      performanceInsightsTile,
      emailInsightsTile,
      deliverabilityToolsTile

    hiddenTile1 && hiddenTile1.remove()
    hiddenTile2 && hiddenTile2.remove()

    for (let i = 0; i < tilesTextContainers.length; i++) {
      let tile = tilesTextContainers[i]
      switch (tile.textContent) {
        case 'Performance Insights':
          performanceInsightsTile = tile.parentNode.parentNode.parentNode
          if (performanceInsightsTile.style.display == 'none') {
            performanceInsightsTile.remove()
            performanceInsightsTile = false
          } else {
            LIB.replaceLinkInElHTML(performanceInsightsTile, LIB.mktoPerformanceInsightsLink)
          }
          break
        case 'Email Insights':
          if (!emailInsightsTile) {
            emailInsightsTile = tile.parentNode.parentNode.parentNode
            LIB.replaceLinkInElHTML(emailInsightsTile, LIB.mktoEmailInsightsLink)
          } else {
            tile.parentNode.parentNode.parentNode.remove()
          }
          break
        case 'Deliverability Tools':
          if (!deliverabilityToolsTile) {
            deliverabilityToolsTile = tile.parentNode.parentNode.parentNode
            LIB.replaceLinkInElHTML(deliverabilityToolsTile, LIB.mktoEmailInsightsLink)
          } else {
            tile.parentNode.parentNode.parentNode.remove()
          }
          break
        case 'SEO':
          LIB.addTrackerToHomeTileById(tile.parentNode.parentNode.parentNode.id, 'SEO')
          break
      }
    }

    if (!performanceInsightsTile) {
      LIB.appendHomeTile('performanceInsightsTile', 'mpi-logo', LIB.mktoPerformanceInsightsLink, 'Performance Insights')
    }
    LIB.addTrackerToHomeTileById(performanceInsightsTile ? performanceInsightsTile.id : 'performanceInsightsTile', 'Performance Insights')

    if (!emailInsightsTile) {
      LIB.appendHomeTile('emailInsightsTile', 'email-insights', LIB.mktoEmailInsightsLink, 'Email Insights')
    }
    LIB.addTrackerToHomeTileById(emailInsightsTile ? emailInsightsTile.id : 'emailInsightsTile', 'Email Insights')

    if (!deliverabilityToolsTile) {
      LIB.appendHomeTile('deliverabilityToolsTile', 'mail-sealed', LIB.mktoEmailDeliverabilityToolsLink, 'Deliverability Tools')
    }
    LIB.addTrackerToHomeTileById(deliverabilityToolsTile ? deliverabilityToolsTile.id : 'deliverabilityToolsTile', 'Deliverability Tools')

    if (MktPage.savedState.custPrefix == LIB.mktoAccountString106) {
      // this is what the button used to use
      // <img src="https://www.bizible.com/hs-fs/hub/233537/file-2495819411-png/bizible-logo-retina.png?t=1533581965699&amp;width=277&amp;name=bizible-logo-retina.png" style="width: 145px;margin-left:5px;margin-top:30px;">
      LIB.appendHomeTile('bizibleDiscoverToolsTile', '', LIB.mktoBizibleDiscoverLink, 'Bizible Discover')
      LIB.addTrackerToHomeTileById('bizibleDiscoverToolsTile', 'Bizible Discover', 'Demo 106 Account')

      LIB.appendHomeTile('bizibleRevPlanTile', '', LIB.mktoBizibleRevPlanLink, 'Bizible Revenue Planner')
      LIB.addTrackerToHomeTileById('bizibleRevPlanTile', 'Bizible Rev Plan', 'Demo 106 Account')

      LIB.appendHomeTile('demoModelerTile', 'success-path', LIB.demoModelerLink, 'Lifecycle Modeler')
      LIB.addTrackerToHomeTileById('demoModelerTile', 'Lifecycle Modeler', 'Demo 106 Account')
    }
  },

  waitForElBySel: async function(selector) {
    let cont, delay = 2
    while (!(cont && cont.parentNode)) {
      cont = document.querySelector(selector)
      await new Promise(resolve => setTimeout(resolve, delay *= 2))
    }
    return cont
  },

  appendAnalyticsTile(id, classInfix, link, linkText) {
    let tileOuterHTML =
      `<div class="x4-btn mkt3-analyticsTile mkt3-analyticsHomeTile x4-btn-default-small x4-icon-text-left x4-btn-icon-text-left x4-btn-default-small-icon-text-left" id="analyticsTile-${id}">
        <a id="analyticsTile-${id}-btnEl" href="${link}" class="x4-btn-center" target="_blank" role="link" style="text-decoration:none;">
          <em id="analyticsTile-${id}-btnWrap">
            <span id="analyticsTile-${id}-btnInnerEl" class="x4-btn-inner">${linkText}</span>
            <span id="analyticsTile-${id}-btnIconEl" class="x4-btn-icon mki3-${classInfix}-svg"></span>
          </em>
        </a>
      </div>`,
      idMatch = new RegExp(`analyticsTile-${id}`, 'g'),
      container = MktCanvas.getActiveTab().el.dom.querySelector('div[id^=analyticsTile-]').parentNode,
      childTiles = container.querySelectorAll('div[id^=analyticsTile-]'),
      spareTileClone = MktCanvas.lookupComponent(childTiles[childTiles.length - 1]).cloneConfig()
    spareTileClone.el.dom.outerHTML = tileOuterHTML.replace(idMatch, spareTileClone.id)
    container.appendChild(spareTileClone.el.dom)
  },

  overrideAnalyticsTiles: async function () {
    if (LIB.areAnalyticsTilesOverridden) {
      return console.log('LIB > Analytics Tiles Already Updated')
    } else {
      LIB.areAnalyticsTilesOverridden = true
      console.log('LIB > Overriding: Analytics Tiles')
      let firstTile = await LIB.waitForElBySel('div[id^=analyticsTile-]'),
        container = firstTile.parentNode,
        tiles = container.childNodes,
        setTileInnerHtml = (tile, link) => tile.innerHTML = `<a style="text-decoration:none;" href="#${link}">${tile.innerHTML}</a>`

      for (let i = 0; i < tiles.length; i++) {
        let tile = tiles[i]
        switch (tile.textContent) {
          case 'Performance Insights':
          case 'Email Insights':
          case '':
            tile.remove()
            break
        }
        if (!LIB.isMarketoDemoInstance()) {
          switch (tile.textContent) {
            case 'Email Performance':
              setTileInnerHtml(tile, mktoEmailPerformanceReport)
              break
            case 'People Performance':
              setTileInnerHtml(tile, mktoPeoplePerformanceReport)
              break
            case 'Web Page Activity':
              setTileInnerHtml(tile, mktoWebPageActivityReport)
              break
            case 'Opportunity Influence Analyzer':
              setTileInnerHtml(tile, mktoOpportunityInfluenceAnalyzer)
              break
            case 'Program Analyzer':
              setTileInnerHtml(tile, mktoProgramAnalyzer)
              break
            case 'Success Path Analyzer':
              setTileInnerHtml(tile, mktoSuccessPathAnalyzer)
              break
            case 'Engagement Stream Performance':
              setTileInnerHtml(tile, mktoEngagmentStreamPerformanceReport)
              break
            case 'Program Performance':
              setTileInnerHtml(tile, mktoProgramPerformanceReport)
              break
            case 'Email Link Performance':
              setTileInnerHtml(tile, mktoEmailLinkPerformanceReport)
              break
            case 'People By Revenue Stage':
              setTileInnerHtml(tile, mktoPeopleByRevenueStageReport)
              break
            case 'Landing Page Performance':
              setTileInnerHtml(tile, mktoLandingPagePerformanceReport)
              break
            case 'People By Status':
              setTileInnerHtml(tile, mktoPeopleByStatusReport)
              break
            case 'Company Web Activity':
              setTileInnerHtml(tile, mktoCompanyWebActivityReport)
              break
            case 'Sales Insight Email Performance':
              setTileInnerHtml(tile, mktoSalesInsightEmailPerformanceReport)
              break
          }
        }
      }
      LIB.appendAnalyticsTile('1068', 'mpi-logo', LIB.mktoPerformanceInsightsLink, 'Performance Insights')
      LIB.appendAnalyticsTile('1059', 'email-insights', LIB.mktoEmailInsightsLink, 'Emails Insights')
    }
  },

  mktoPageGlobalReady: async function () {
    let delay = 2
    while (!(LIB.isPropOfWindowObj('MktPage.savedState.custPrefix') && MktPage.userid)) {
      await new Promise(resolve => setTimeout(resolve, delay *= 2))
    }
    return true
  },

  dlTokenReady: async function () {
    let delay = 2
    while (!LIB.isPropOfWindowObj('Mkt3.DL.getDlToken')) {
      await new Promise(resolve => setTimeout(resolve, delay *= 2))
    }
    return true
  },

  getUserRole: function () {
    if (MktPage && MktPage.userName) {
      let roleSubstring = MktPage.userName.search(/\[[^\]]+\]/)
      if (roleSubstring != -1) {
        return MktPage.userName.substring(roleSubstring).replace(/^\[([^\]]+)]$/, '$1')
      }
    }
    return ''
  },

  heapReady: async function () {
    let delay = 2
    while (!LIB.isPropOfWindowObj('heap.loaded')) {
      await new Promise(resolve => setTimeout(resolve, delay *= 2))
    }
    return true
  },

  heapTrack: async function (action, event) {
    await LIB.heapReady()
    let oktaEmail, oktaFirstName, oktaLastName, heapApp, heapArea, heapEventProps
    switch (action) {
      case 'id':
        oktaEmail = LIB.getCookie('okta_email')
        oktaFirstName = LIB.getCookie('okta_first_name')
        oktaLastName = LIB.getCookie('okta_last_name')
        if (MktPage && MktPage.userid) {
          console.log('LIB > Heap Analytics ID: ' + MktPage.userid)
          heap.identify(MktPage.userid)
        }
        if (oktaFirstName && oktaLastName) {
          heap.addUserProperties({Name: oktaFirstName + ' ' + oktaLastName})
        } else if (MktPage && MktPage.userName) {
          heap.addUserProperties({Name: MktPage.userName.replace(/ ?\[[^\]]+\]/, '')})
        }
        heap.addUserProperties({Role: LIB.getUserRole()})
        if (oktaEmail) {
          heap.addUserProperties({Email: oktaEmail})
        }
        if (LIB.isPropOfWindowObj('MktPage.savedState.custPrefix')) {
          if (MktPage.savedState.custPrefix == LIB.mktoAccountString106) {
            heap.addEventProperties({Environment: 'Internal'})
          } else if (MktPage.savedState.custPrefix == LIB.mktoAccountString106d) {
            heap.addEventProperties({Environment: 'Partner'})
          } else if (
            MktPage.savedState.custPrefix == LIB.mktoAccountStringMaster || MktPage.savedState.custPrefix == LIB.mktoAccountStringMasterMEUE
          ) {
            heap.addEventProperties({Environment: 'Master'}) //TODO
          } else {
            heap.addUserProperties({Environment: MktPage.savedState.custPrefix})
          }
        }
        break
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
            if (MktPage.savedState.custPrefix == LIB.mktoAccountString106) {
              heapEventProps.environment = 'Internal'
            } else if (MktPage.savedState.custPrefix == LIB.mktoAccountString106d) {
              heapEventProps.environment = 'Partner'
            } else if (
              MktPage.savedState.custPrefix == LIB.mktoAccountStringMaster ||
              MktPage.savedState.custPrefix == LIB.mktoAccountStringMasterMEUE
            ) {
              heapEventProps.environment = 'Master'
            } else {
              heapEventProps.environment = MktPage.savedState.custPrefix
            }
          }
          console.log(`LIB > Tracking: Heap Event: ${event.name}`, heapEventProps)
          heap.track(event.name, heapEventProps)
        }
        break
      case 'addProp':
        console.log('LIB > Adding: Heap Event Properties: ', event)
        heap.addEventProperties(event)
        break
    }
  },

  interceptXHR: function () {
    const origOpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function() {
      const url = arguments[1]
      // changes to the UI used to be monitored by changes to the url hash #
      // now that the UI is loaded in an iframe that's not possible
      // so monitor local xhr requests while ignoring a known set that do not change the view
      if (
        !/^http/.test(url) &&
        !/user\/saveUserPref|user\/getPollingActions|homepage\/cancelRequest|\/smartpalette/.test(url)
      ) {
        console.log(`LIB > XHR Request: ${url}`)
        this.addEventListener('load', function() {
          console.log(`LIB > XHR Load: ${url}`)
          if (LIB.isPropOfWindowObj('Mkt3.DL.getDlToken') && Mkt3.DL.getDlToken()) {
            if (LIB.currUrlFragment === Mkt3.DL.getDlToken()) {
              return console.log(`LIB > Url Fragment Unchanged: ${url}`)
            } else {
              console.log(`LIB > Changed Url Fragment: ${url}`)
              LIB.currUrlFragment = Mkt3.DL.getDlToken()
              if (typeof APP !== 'undefined' && APP.updateView) {
                APP.updateView()
              }
            }
          }
        })
      }
      origOpen.apply(this, arguments)
    }
  }

}
LIB.interceptXHR()
localManifestVersion = chrome.runtime.getManifest().version

function displayVersionNum() {
  let d = document.createElement('div')
  document.getElementById('marketo-live-logo-container').appendChild(d)
  d.outerHTML = `<div id="extension-version">v${localManifestVersion}</div>`
}

async function checkExtUpdateAvailable() {
  if (chrome.runtime.id === 'onibnnoghllldiecboelbpcaeggfiohl') {
    return false // updates do not apply to the version from the chrome web store
  }
  const response = await fetch('https://raw.githubusercontent.com/PMET-public/ml-ext-dist/master/manifest.json'),
    json = await response.json(),
    remoteManifestParts = json.version.split('.')
  for (let i = 0; i < remoteManifestParts.length; i++) {
    let remotePart = parseInt(remoteManifestParts[i], 10),
      localPart = parseInt(localManifestVersion.split('.')[i], 10)
    if (remotePart < localPart) {
      return false
    } else if (remotePart > localPart) {
      return true
    }
    // if equal, just continue to next iteration of loop
  }
  return false // made it thru loop without returning, so same version and no update available
}
console.log('Background > Running', MARKETO_EXT_VERSION)

// eslint-disable-next-line no-var
var BACKGROUND_DATA_SCRIPT_LOCATION = 'https://marketolive.com/m3/pluginv3/background-demo-data.js',
  mktoLivePages = '^(https://app-.+.marketo.com/|https://.+.marketodesigner.com/|http(s)?://.*.marketolive.com/)', //probably not working on MEUE ABDEMO
  mktoLiveInstances = '^(https://app-(sjdemo1|sjp|sj11).marketo.com/|https://engage-(ab|sj).marketo.com)',
  mktoLiveDomainMatch = 'http://www.marketolive.com/*',
  mktoLiveUriDomain = '.marketolive.com',
  mktoLiveClassicDomainMatch = 'https://marketolive.com/*',
  mktoLiveClassicUriDomain = '.marketolive.com',
  mktoAppDomainMatch = 'https://app-*.marketo.com',
  mktoAppMEUEDomainMatch = 'https://engage-*.marketo.com',
  mktoAppUriDomain = '.marketo.com',
  mktoDesignerDomainMatch = 'https://www.marketodesigner.com/*',
  mktoDesignerUriDomain = '.marketodesigner.com',
  mktoDesignerMatchPattern = 'https://*.marketodesigner.com/*',
  mktoSjpWebRequest = 'https://app-sjp.marketo.com/',
  mktoABDemoWebRequest = 'https://app-abdemo1.marketo.com/',
  mktoSjdemo1WebRequest = 'https://app-sjdemo1.marketo.com/',
  mktoMEUEWebRequest = 'https://engage-sj.marketo.com/',
  mktoEmailDesignerFragment = 'EME',
  mktoEmailPreviewFragmentRegex = new RegExp('#EME[0-9]+&isPreview', 'i'),
  mktoEmailPreviewFragment = 'EMP',
  mktoLandingPageDesignerFragment = 'LPE',
  mktoLandingPagePreviewFragment = 'LPPD',
  adTargetingRegEx = '^http(s)?://(www|dev).marketolive.com/en/tools/ad-targeting',
  companyPickerRegEx = '^https://marketolive.com/m3/apps/color-picker.html\\?company=.+',
  mktoAppUserCookie = 'ids_sso',
  munchkinIdsMatch = '^(185-NGX-811|026-COU-482|767-TVJ-204|400-TWP-453|068-VUG-672|924-LFC-514)$', //added 451 munchkin for testing, TODO remove
  //adminUserNamesMatch = "^(mktodemolivemaster@marketo\.com$|admin(\.[a-z]{0,2})?@(marketolive.com$|mktodemoaccount)|marketodemo.*@gmail\.com$)",
  adminUserNamesMatch =
    '^(mktodemolivemaster@marketo.com$|admin(.[a-z]{0,2})?@(marketolive.com$|mktodemoaccount)|mktodemoaccount[a-z0-9]*@marketo.com$|marketodemo.*@gmail.com$)',
  mktoLiveBlockUrlPatterns = [
    '*://sjrtp3.marketo.com/app/*',
    '*://abrtp2.marketo.com/app/*',
    '*://sjrtp8.marketo.com/app/*',
    '*://sjrtp4.marketo.com/app/*',
    '*://sj-ee-api.marketo.com/api/v1/settings/dimensions/activate/*',
    '*://seo.marketo.com/*',
    '*://250ok.com/*'
  ], //TODO remove sjrtp8 used for testing MEUE
  mktoLiveRtpDomainsMatch = '(sjrtp3|sjrtp4|sjrtp8|abrtp2).marketo.com', //TODO remove sjrtp8 used for MEUE
  oktaFirstName,
  oktaLastName,
  oktaEmail,
  mktoUserId,
  mktoName,
  mktoRole,
  lastMktoMessageDate,
  numOfMktoLiveMessage

/**************************************************************************************
 *  This function searches for a tab that match the specified URL pattern, if found
 *  then it reloads the tab, else it will create a new tab using the URL given.
 *  @param {Object} tabInfo
 *    urlMatch - URL pattern to match against for tabs to reload
 *    urlCreate - URL to use when creating a new tab
 **************************************************************************************/

function findAndReloadOrCreateTab(tabInfo) {
  chrome.tabs.query( { url: tabInfo.urlMatch },
    function (tabs) {
      if (tabs.length > 0) {
        if (tabs[0].url == tabInfo.urlCreate) {
          chrome.tabs.reload(tabs[0].id)
          chrome.tabs.update(tabs[0].id, { active: true })
        } else {
          chrome.tabs.update(tabs[0].id, { url: tabInfo.urlCreate, active: true })
        }
      } else {
        chrome.tabs.create({ url: tabInfo.urlCreate, active: true })
      }
    }
  )
}

/**************************************************************************************
 *  This function reloads the company logo and color on all Marketo designer tabs in
 *  order to support email and landing page overlay without requiring to reload the tab.
 **************************************************************************************/

function reloadCompany() {
  console.log('Loading: Company Logo & Color')
  let companyLogoCookieDesigner = { url: mktoDesignerDomainMatch, name: 'logo' },
    queryInfo = { currentWindow: true, url: mktoDesignerMatchPattern },
    message = { action: '', assetType: '', assetView: '' },
    setAssetData

  chrome.cookies.get(companyLogoCookieDesigner, function (cookie) {
    if (cookie && cookie.value) {
      setAssetData = function (tab) {
        if (tab.url.search('#' + mktoEmailDesignerFragment + '[0-9]+$') != -1) {
          console.log('Loading: Company Logo, Hero Background, Color for Email Designer')
          message.assetType = 'email'
          message.assetView = 'edit'
        } else if (
          tab.url.search(mktoEmailPreviewFragmentRegex) != -1 ||
          tab.url.search('#' + mktoEmailPreviewFragment + '[0-9]+$') != -1
        ) {
          console.log('Loading: Company Logo, Hero Background, Color for Email Previewer')
          message.assetType = 'email'
          message.assetView = 'preview'
        } else if (tab.url.search('#' + mktoLandingPageDesignerFragment + '[0-9]+$') != -1) {
          console.log('Loading: Company Logo, Hero Background, Color for Landing Page Designer')
          message.assetType = 'landingPage'
          message.assetView = 'edit'
        } else if (tab.url.search('#' + mktoLandingPagePreviewFragment + '[0-9]+$') != -1) {
          console.log('Loading: Company Logo, Hero Background, Color for Landing Page Previewer')
          message.assetType = 'landingPage'
          message.assetView = 'preview'
        }

        if (message.assetType && message.assetView) {
          chrome.tabs.sendMessage(tab.id, message, function (response) {
            console.log('Receiving: Message Response from Content for tab: ' + tab.url + ' ' + response)
          })
          message.assetType = message.assetView = ''
        }
      }

      message.action = 'newCompany'
      chrome.tabs.query(queryInfo, function (tabs) {
        for (let ii = 0; ii < tabs.length; ii++) {
          setAssetData(tabs[ii])
        }
      })
    } else {
      console.log('NOT Loading: Company Logo & Color as logo is undefined')
    }
  })
}

/**************************************************************************************
 *  This function registers an event listener for app-sjp.marketo.com and
 *  app-sjdemo1.marketo.com demo pods web requests in order to initiate background data
 *  submission.
 *  @param {function} - Callback function for the response.
 **************************************************************************************/

chrome.webRequest.onCompleted.addListener(
  function (details) {
    console.log('webRequest Completed: ' + details.url)
    LIB.loadScript(BACKGROUND_DATA_SCRIPT_LOCATION)
    heapTrack({ name: 'Marketo > Demo Pod', app: 'Marketo', area: 'Demo Pod' })
  },
  {
    urls: [mktoSjpWebRequest, mktoSjdemo1WebRequest, mktoMEUEWebRequest, mktoABDemoWebRequest]
  }
)

// set the MarketoLiveClassic cookie to identify the user's pod.
function setMarketoUserPodCookie() {
  console.log('Setting: Marketo User Pod Cookie')
  ;[{
    url: mktoAppDomainMatch,
    domain: mktoAppUriDomain,
  },
  {
    url: mktoAppMEUEDomainMatch,
    domain: mktoAppUriDomain,
  },
  {
    url: mktoDesignerDomainMatch,
    domain: mktoDesignerUriDomain,
  },
  {
    url: mktoLiveClassicDomainMatch,
    domain: mktoLiveClassicUriDomain,
  }].forEach(obj => LIB.setCookie({
    url: obj.url,
    domain: obj.domain,
    name: 'userPod',
    value: 'app-sjp',
    expiresInDays: 365
  }))
}

function createBasicNotification(notification, extensionId) {
  let buttonClicked = function (notificationId, buttonIndex) {
      if (notificationId == notification.id && buttonIndex == 0) {
        let url
        switch (notification.action) {
          case 'update':
            url = 'chrome://extensions'
            if (extensionId) {
              url += '/?id=' + extensionId
            }
            chrome.tabs.create({ url: url })
            break
          case 'enable':
            chrome.management.setEnabled(extensionId, true)
            chrome.notifications.clear(notificationId)
            break
          case 'uninstall':
            chrome.management.uninstall(extensionId)
            break
          case 'mktoLiveMessage':
            if (notification.buttonLink) {
              chrome.tabs.create({ url: notification.buttonLink })
            }
            heapTrack({ name: 'Clicked Notification Button', notificationTitle: notification.title, app: 'Extension', area: 'Background', version: chrome.app.getDetails().version })
            chrome.notifications.clear(notificationId)
            break
        }
        if (notification.reload) {
          chrome.runtime.reload()
        }
      }
    }, notify = {
      type: 'basic',
      iconUrl: 'http://www.marketolive.com/static/marketo-live-circle-logo.png',
      title: notification.title,
      message: notification.message,
      requireInteraction: notification.requireInteraction
    }

  if (notification.buttonTitle) {
    notify.buttons = [{title: notification.buttonTitle}]
    chrome.notifications.onButtonClicked.addListener(buttonClicked)
  }

  function closedNotification(notificationId, byUser) {
    if (notificationId == notification.id) {
      chrome.notifications.onButtonClicked.removeListener(buttonClicked)
      chrome.notifications.onClosed.removeListener(closedNotification)
    }
  }
  chrome.notifications.onClosed.addListener(closedNotification)
  chrome.notifications.create(notification.id, notify)
}

function checkForOldExtension(extensionMinVersion) {
  let versionSplit = chrome.app.getDetails().version.split('.'),
    minVersionSplit = extensionMinVersion.split('.'),
    version = (minVersion = '')

  for (let ii = 0; ii < versionSplit.length; ii++) {
    version += versionSplit[ii]
    minVersion += minVersionSplit[ii]
  }
  version = parseInt(version)
  minVersion = parseInt(minVersion)

  if (version < minVersion) {
    let oldExtensionNotification = {
      id: 'MarketoLive Extension is Out of Date',
      title: 'Extension is Out of Date',
      message: 'Your MarketoLive extension is older than the required minimum version (' + extensionMinVersion + ').',
      buttonTitle: 'Update Extension',
      requireInteraction: true,
      action: 'update',
      reload: false
    }
    createBasicNotification(oldExtensionNotification, chrome.app.getDetails().id)
    heapTrack({ name: 'Old Extension', app: 'Extension', area: 'Background', version: chrome.app.getDetails().version })
    return {isValidExtension: false}
  }
  return {isValidExtension: true}
}

function checkForBadExtension() {
  chrome.management.getAll(function (extensions) {
    for (let ii = 0; ii < extensions.length; ii++) {
      let extension = extensions[ii]

      if (extension.id == 'kpipagoofoccjflbjohbadncakalhnmk') {
        extensionErrorNotification = {
          id: 'MarketoLive Extension Error',
          title: 'MarketoLive Extension Error',
          message: 'You have more than one MarketoLive extension installed.',
          buttonTitle: 'Uninstall Bad Extension',
          requireInteraction: true,
          action: 'uninstall',
          reload: false
        }
        addAsyncExternalMsgListener({
          isValidExtension: false
        })
        chrome.management.onUninstalled.addListener(function (extensionId) {
          if (extensionId == extension.id) {
            chrome.notifications.clear(extensionErrorNotification.id)
            chrome.runtime.reload()
          }
          chrome.management.onUninstalled.removeListener(this)
        })
        createBasicNotification(extensionErrorNotification, extension.id)
        heapTrack({ name: 'Bad Extension', app: 'Extension', area: 'Background', badExtensionId: extension.id, badExtensionName: extension.name })
        return
      }
    }
    addAsyncExternalMsgListener({isValidExtension: true})
  })
}

function setOktaCookies(message) {
  [
    { url: mktoLiveDomainMatch, domain: mktoLiveUriDomain, },
    { url: mktoLiveClassicDomainMatch, domain: mktoLiveClassicUriDomain, },
    { url: mktoAppDomainMatch, domain: mktoAppUriDomain, },
    { url: mktoAppMEUEDomainMatch, domain: mktoAppUriDomain, },
    { url: mktoDesignerMatchPattern, domain: mktoDesignerUriDomain, }
  ].forEach(obj => {
    [
      {n: 'okta_username', v: 'username'},
      {n: 'okta_first_name', v: 'firstName'},
      {n: 'okta_last_name', v: 'lastName'},
      {n: 'okta_email', v: 'email'}
    ].forEach(nameObj => LIB.setCookie({ url: obj.url, name: nameObj.n, value: message[nameObj.v], domain: obj.domain, expiresInDays: 365 }))
  })

  LIB.loadScript(BACKGROUND_DATA_SCRIPT_LOCATION)
  heapTrack({ name: 'Okta > Apps', app: 'Okta', area: 'Apps' })
}

function setMktoCookies(message) {
  [
    { url: mktoLiveDomainMatch, domain: mktoLiveUriDomain, },
    { url: mktoAppDomainMatch, domain: mktoAppUriDomain, },
    { url: mktoAppMEUEDomainMatch, domain: mktoAppUriDomain, }
  ].forEach(obj => {
    [
      {n: 'mkto_user_id', v: 'mktoUserId'},
      {n: 'mkto_name', v: 'mktoName'},
      {n: 'mkto_role', v: 'mktoRole'}
    ].forEach(nameObj => LIB.setCookie({ url: obj.url, name: nameObj.n, value: message[nameObj.v], domain: obj.domain, expiresInDays: 365 }))
  })
}

function setAdInfoCookies(message) {
  let googleDomainMatch = 'https://www' + message.domain + '/*',
    linkedinDomainMatch = 'marketolive.com/*',
    adInfoCookieName = 'ad_info'

  if (message.adInfo) {
    switch (message.adType) {
      case 'googleSearch':
        LIB.setCookie({ url: mktoLiveDomainMatch, name: adInfoCookieName, value: message.adInfo, domain: mktoLiveUriDomain })
        LIB.setCookie({ url: googleDomainMatch, name: adInfoCookieName, value: message.adInfo, domain: message.domain })
        break
      case 'facebook':
        LIB.setCookie({ url: mktoLiveDomainMatch, name: adInfoCookieName, value: message.adInfo, domain: mktoLiveUriDomain })
        break
      case 'linkedin':
        LIB.setCookie({ url: mktoLiveDomainMatch, name: adInfoCookieName, value: message.adInfo, domain: mktoLiveUriDomain })
        break
    }
    findAndReloadOrCreateTab({
      urlMatch: message.urlMatch,
      urlCreate: message.urlCreate
    })
  } else {
    LIB.removeCookie({ url: mktoLiveDomainMatch, name: adInfoCookieName })
    LIB.removeCookie({ url: googleDomainMatch, name: adInfoCookieName })
    LIB.removeCookie({ url: linkedinDomainMatch, name: adInfoCookieName })
  }
}

function setCompanyCookies(message) {
  let companyLogoCookieName = 'logo',
    companyColorCookieName = 'color',
    companyImageCookieName = 'heroBackground',
    companyImageResCookieName = 'heroBackgroundRes'

  if (message.logo) {
    LIB.setCookie({ url: mktoLiveClassicDomainMatch, name: companyLogoCookieName, value: message.logo, domain: mktoLiveClassicUriDomain })
    LIB.setCookie({ url: mktoDesignerDomainMatch, name: companyLogoCookieName, value: message.logo, domain: mktoDesignerUriDomain })
  }
  if (message.color) {
    LIB.setCookie({ url: mktoLiveClassicDomainMatch, name: companyColorCookieName, value: message.color, domain: mktoLiveClassicUriDomain })
    LIB.setCookie({ url: mktoDesignerDomainMatch, name: companyColorCookieName, value: message.color, domain: mktoDesignerUriDomain })
  } else {
    LIB.removeCookie({ url: mktoLiveClassicDomainMatch, name: companyColorCookieName })
    LIB.removeCookie({ url: mktoDesignerDomainMatch, name: companyColorCookieName })
  }
  if (message.image) {
    LIB.setCookie({ url: mktoLiveClassicDomainMatch, name: companyImageCookieName, value: message.image, domain: mktoLiveClassicUriDomain })
    LIB.setCookie({ url: mktoDesignerDomainMatch, name: companyImageCookieName, value: message.image, domain: mktoDesignerUriDomain })
  } else {
    LIB.removeCookie({ url: mktoLiveClassicDomainMatch, name: companyImageCookieName })
    LIB.removeCookie({ url: mktoDesignerDomainMatch, name: companyImageCookieName })
  }
  if (message.imageRes) {
    LIB.setCookie({ url: mktoLiveClassicDomainMatch, name: companyImageResCookieName, value: message.imageRes, domain: mktoLiveClassicUriDomain })
    LIB.setCookie({ url: mktoDesignerDomainMatch, name: companyImageResCookieName, value: message.imageRes, domain: mktoDesignerUriDomain })
  }
  if (message.logo || message.color || message.image) {
    chrome.cookies.get(
      {
        url: mktoDesignerDomainMatch,
        name: 'saveEditsToggleState'
      },
      function (cookie) {
        if (cookie && cookie.value == 'true') {
          LIB.reloadTabs('*://*' + mktoDesignerUriDomain + '/*')
        } else {
          reloadCompany()
        }
      }
    )
  }
}

function isDateInRange(date, startDate, endDate) {
  let isAfterStartDate, isBeforeEndDate
  if (startDate) {
    if (typeof startDate === 'string') {
      startDate = new Date(startDate)
    }
    if (date.getFullYear() >= startDate.getFullYear() && date.getMonth() >= startDate.getMonth() && date.getDate() >= startDate.getDate()) {
      isAfterStartDate = true
    } else {
      isAfterStartDate = false
    }
  }
  if (endDate) {
    if (typeof endDate === 'string') {
      endDate = new Date(endDate)
    }
    if (date.getFullYear() <= endDate.getFullYear() && date.getMonth() <= endDate.getMonth() && date.getDate() <= endDate.getDate()) {
      isBeforeEndDate = true
    } else {
      isBeforeEndDate = false
    }
  }
  if (startDate && !endDate) {
    return !!isAfterStartDate
  } else if (!startDate && endDate) {
    return !!isBeforeEndDate
  } else if (startDate && endDate) {
    return !!(isAfterStartDate && isBeforeEndDate)
  } else {
    return true
  }
}

function mktoLiveMessage(message) {
  let date = new Date()
  if (isDateInRange(date, message.startDate, message.endDate)) {
    let notification = {
      action: message.action,
      id: message.id,
      title: message.title,
      message: message.notify,
      requireInteraction: message.requireInteraction,
      buttonTitle: message.buttonTitle,
      buttonLink: message.buttonLink
    }
    if (message.numOfTimesPerDay && message.numOfTimesPerDay != -1) {
      if (lastMktoMessageDate && date.toDateString() == lastMktoMessageDate.toDateString()) {
        if (numOfMktoLiveMessage < message.numOfTimesPerDay) {
          createBasicNotification(notification)
          numOfMktoLiveMessage++
        }
      } else {
        createBasicNotification(notification)
        lastMktoMessageDate = new Date()
        numOfMktoLiveMessage = 1
        heapTrack({
          name: 'Received Important Message',
          app: 'Extension',
          area: 'Background',
          title: message.title
        })
      }
    } else {
      createBasicNotification(notification)
      heapTrack({
        name: 'Received Important Message',
        app: 'Extension',
        area: 'Background',
        title: message.title
      })
    }
  }
}

function addAsyncExternalMsgListener(response) {
  chrome.runtime.onMessageExternal.addListener(function (message, sender, sendResponse) {
    switch (message.action) {
      case 'checkBadExtension':
        sendResponse(response)
        console.log('Received ' + message.action + ' Response: ', response)
        break
    }
  })
  console.log('Added Async External Message Listener')
}

function checkMsgs(message, sender, sendResponse) {
  let response
  switch (message.action) {
    case 'setOktaUser':
      if (sender.url.indexOf('://adobe.okta.com/') >= 0) {
        setOktaCookies(message)
        console.log('Received: ', message)
      }
      break
    case 'getExtensionDetails':
      if (sender.url.search(mktoLivePages) != -1) {
        response = chrome.app.getDetails()
        sendResponse(response)
        console.log('Received ' + message.action + ' Response: ', response)
      }
      break
    case 'checkExtensionVersion':
      response = checkForOldExtension(message.minVersion)
      sendResponse(response)
      if (sender.url.search(mktoLiveInstances) != -1) {
        heapTrack({ name: 'Loaded MarketoLive Instance', app: 'Extension', area: 'Background', version: chrome.app.getDetails().version })
      }
      console.log('Received ' + message.action + ' Response: ', response)
      break
    case 'setMktoCookies':
      setMktoCookies(message)
      console.log('Received: ', message)
      break
    case 'setAdInfo':
      if (sender.url.search(adTargetingRegEx) != -1) {
        setAdInfoCookies(message)
        console.log('Received: ', message)
      }
      break
    case 'setCompanyCookies':
      if (sender.url.search(companyPickerRegEx) != -1) {
        setCompanyCookies(message)
        console.log('Received: ', message)
      }
      break
    case 'checkMktoCookie':
      chrome.cookies.getAll(
        {
          name: mktoAppUserCookie,
          domain: mktoAppUriDomain
        },
        function (cookies) {
          let cookie = cookies[0],
            response = {}

          if (
            cookie &&
            cookie.value &&
            ((message.munchkinId && cookie.value.split(':')[2].search(message.munchkinId) != -1) ||
              cookie.value.split(':')[2].search(munchkinIdsMatch) != -1)
          ) {
            response.isMktoLive = true

            if (cookie.value.split(':')[1].search(adminUserNamesMatch) != -1) {
              response.isAdmin = true
            } else {
              response.isAdmin = false
            }
          } else {
            response.isMktoLive = false
            response.isAdmin = false
          }

          sendResponse(response)
          console.log('Received ' + message.action + ' Response: ', response)
        }
      )
      break
    case 'demoDataPage':
      if (message.tabAction == 'create') {
        chrome.tabs.create(
          { url: message.url, active: false, selected: false, pinned: true },
          function (tab) {
            window.setTimeout(function () {
              if (!Number.isInteger(parseInt(message.tabTimeout))) {
                message.tabTimeout = 10000
              }
              chrome.tabs.remove(tab.id)
            }, parseInt(message.tabTimeout))
          }
        )
      } else {
        chrome.tabs.query(
          { url: message.currUrl, pinned: true },
          function (tabs) {
            let tabId = tabs[0].id
            switch (message.tabAction) {
              case 'update':
                chrome.tabs.update(tabId, {
                  url: message.nextUrl
                })
                break
              case 'remove':
                chrome.tabs.remove(tabId)
                break
            }
          }
        )
      }
      break
    case 'mktoLiveMessage':
      mktoLiveMessage(message)
      break
  }
  return true
}

function addMsgExtListener(listeningMsg) {
  chrome.runtime.onMessageExternal.addListener(listeningMsg)
  console.log('Added External Message Listener ' + listeningMsg.name)
}

function removeMsgExtListener(listeningMsg) {
  chrome.runtime.onMessageExternal.removeListener(listeningMsg)
  console.log('Removed External Message Listener ' + listeningMsg.name)
}

/**************************************************************************************
 *  This function cancels specific web requests for Email Insights, Web Personalization,
 *  and Predictive Content in order to block adding, removing, editing, saving, deleting
 *  for normal users in MarketoLive instances.
 *  @param [Object] details - JSON object that contains the following key/value pairs:
 *      {String} method - The method of the web request.
 *      {String} url - The URL of the web request.
 *      {String} tabId - The ID of the tab that issued the web request.
 **************************************************************************************/

function cancelWebRequest(details) {
  let toCancel
  switch (details.method) {
    case 'POST':
      if (
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/editSegment.ext') != -1 || // Segment > Edit
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/rest/segments/action') != -1 || // Segment > Enable/Disable/Delete
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/rest/labels') != -1 || // Segment > Label > New/Apply
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/editReaction.ext') != -1 || // Web Campaigns > Edit
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/campaign/labels.json') != -1 || // Web Campaigns > Label > New/Apply
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/rest/reactions/action') != -1 || // Web Campaigns > Launch/Pause/Delete
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/rest/reaction/schedule/schedule') != -1 || // Web Campaigns > Schedule > Add/Remove
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/editAudience.ext') != -1 || // Retargeting > Audience > Edit
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/rest/remarketing/action') != -1 || // Retargeting > Audience > Enable/Disable
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/rest/remarketing/params.json') != -1 || // Retargeting > Domain Retargeting Config > Edit
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/rest/setting/analytics/params.json') != -1 || // Account Settings > Domain > Analytics > Edit
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/admin/accountSettings/excludedips.json') != -1 || // Account Settings > Domain > IP Exclude > Edit
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/admin/accountSettings.do') != -1 || // Account Settings > Database > Fields > Add/Remove
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/admin/contentSettings.do') != -1 || // Content Settings > Categories & URL Patterns > New/Delete
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/rest/setting/rcmd/params.json') != -1 || // Content Settings > Bar > Recommendation Bar Config > Edit
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/predictive/content/addContent.json') != -1 || // Predictive Content > Content > Add
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/predictive/content/editContent.json') != -1 ||
        details.url.search('://seo.marketo.com/rest/report/keyword/addWithLists') != -1 || // SEO > Keywords > Phrase/List > Add
        details.url.search('://seo.marketo.com/keyword/overview:remove') != -1 || // SEO > Keywords > Phrase > Delete
        details.url.search('://seo.marketo.com/ajax/orgList:add') != -1 || // SEO > Keywords, Pages, Inbound Links > Phrase/Page/Issue/Link > Add To List
        details.url.search('://seo.marketo.com/ajax/orgList:delete') != -1 || // SEO > Keywords, Pages, Inbound Links > Phrase/Page/Issue/Link > Remove From List
        details.url.search('://seo.marketo.com/ajax/orgList:deleteList') != -1 || // SEO > Keywords, Pages, Inbound Links > List > Delete
        details.url.search('://seo.marketo.com/keyword/overview.keyworduploadform') != -1 || // SEO > Keywords > List > Import
        details.url.search('://seo.marketo.com/rest/report/page/addWithLists') != -1 || // SEO > Pages > Page > Add
        details.url.search('://seo.marketo.com/rest/report/page/delete') != -1 || // SEO > Pages > Page > Delete
        details.url.search('://seo.marketo.com/page/detail:hideResult') != -1 || // SEO > Pages > Issue > Remove
        details.url.search('://seo.marketo.com/ajax/StickyNote:Save') != -1 || // SEO > Pages > Issue > Sticky Note > Add/Delete
        details.url.search('://seo.marketo.com/rest/report/link/addWithLists') != -1 || // SEO > Inbound Links > Link > Add
        details.url.search('://seo.marketo.com/rest/report/link/addFromSuggestionsWithLists') != -1 || // SEO > Inbound Links > Link > Add From Suggestions
        details.url.search('://seo.marketo.com/rest/report/link/delete') != -1 || // SEO > Inbound Links > Link > Delete
        details.url.search('://seo.marketo.com/rest/report/link/uploadfile') != -1 || // SEO > Inbound Links > Link > Import
        details.url.search('://seo.marketo.com/rest/reportdetail/create') != -1 || // SEO > Reports > Report > Create
        details.url.search('://seo.marketo.com/rest/reportdetail/save') != -1 || // SEO > Reports > Report > Save
        details.url.search('://seo.marketo.com/rest/reportdetail/delete') != -1 || // SEO > Reports > Report > Delete
        details.url.search('://seo.marketo.com/rest/adminsettings/site/add') != -1 || // SEO > Admin Settings > Site > Add
        details.url.search('://seo.marketo.com/rest/adminsettings/site/[^/]+/delete') != -1 || // SEO > Admin Settings > Site > Delete
        details.url.search('://seo.marketo.com/rest/adminsettings/site/[^/]+/rename') != -1 || // SEO > Admin Settings > Site > Rename
        details.url.search('://seo.marketo.com/rest/adminsettings/searchengines/set') != -1 || // SEO > Admin Settings > Site > Search Engines > Set
        details.url.search('://seo.marketo.com/rest/adminsettings/competitor/add') != -1 || // SEO > Admin Settings > Site > Competitors > Add
        details.url.search('://seo.marketo.com/rest/adminsettings/competitor/[^/]+/delete') != -1 || // SEO > Admin Settings > Site > Competitors > Delete
        details.url.search('://250ok.com/ajax/bookmark') != -1 || // 250ok > ALL > Bookmark (Star) > Add/Remove
        details.url.search('://250ok.com/app/dashboard') != -1 || // 250ok > Dashboard > Dashboard & Widget > Add/Modify/Copy/Delete
        details.url.search('://250ok.com/ajax_dashboard/saveGrid') != -1 || // 250ok > Dashboard > Widget > Move/Resize
        details.url.search('://250ok.com/ajax_dashboard/removeWidget') != -1 || // 250ok > Dashboard > Widget > Remove
        details.url.search('://250ok.com/app/inbox-informant') != -1 || // 250ok > Inbox > Campaigns, Get Seedlist, Optimize Seedlist > ALL Actions
        details.url.search('://250ok.com/app/blacklist-informant') != -1 || // 250ok > Reputation > My Profiles > ALL Actions
        details.url.search('://250ok.com/ajax_blacklist/switchstatus') != -1 || // 250ok > Reputation > My Profiles > Status > Enable/Disable
        details.url.search('://250ok.com/app/snds/configuration') != -1 || // 250ok > Reputation > SNDS > Key > Add/Delete
        details.url.search('://250ok.com/app/signalspam') != -1 || // 250ok > Reputation > Signal Spam > ALL Actions
        details.url.search('://250ok.com/app/fbl') != -1 || // 250ok > Reputation > Feeback Loops > ALL Actions
        details.url.search('://250ok.com/app/email-analytics') != -1 || // 250ok > Analytics > Overview, Campaigns > ALL Actions
        details.url.search('://250ok.com/app/account') != -1 || // 250ok > Settings > Account, Users, API, Inbox, Analytics > ALL Actions
        details.url.search('://250ok.com/ajax_emailanalytics/switchstatus') != -1 || // 250ok > Settings > Analytics > Parameters & Segments Status > Enable/Disable
        details.url.search('://250ok.com/ajax_reputationinformant/switchstatus') != -1 || // 250ok > Settings > Reputation > Filter Sets Status > Enable/Disable
        details.url.search('://250ok.com/app/design-informant') != -1 || // 250ok > Design > ALL Actions
        details.url.search('://250ok.com/app/alerts') != -1 // 250ok > Alerts > ALL Actions
      ) {
        toCancel = true
      }
      break
    case 'PUT':
      if (
        details.url.search('://sj-ee-api.marketo.com/api/v1/settings/dimensions/activate/') != -1 || // Email Insights > System Settings > Dimension > Add/Remove
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/predictive/content/setEligibility.json') != -1 || // Predictive Content > Content > Approve/Unapprove
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/predictive/predictiveContent/setEmail.json') != -1 || // Predictive Content > Content > Enable/Disable EM
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/predictive/predictiveContent/setBar.json') != -1 || // Predictive Content > Content > Enable/Disable Bar
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/predictive/predictiveContent/setRichMedia.json') != -1 || // Predictive Content > Content > Enable/Disable RM
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/predictive/predictiveContent/editContentName.json') != -1 || // Predictive Content > Content > Name > Edit
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/predictive/predictiveContent/editContent.json') != -1
      ) {
        // Predictive Content > Content > Edit
        toCancel = true
      }
      break
    case 'GET':
      if (
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/rest/deleteAudience.json') != -1 || // Retargeting > Audience > Delete
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/setting/param.json') != -1 || // Account Settings > ALL > Toggles > Enable/Disable
        details.url.search('://seo.marketo.com/ajax/ComponentSettings:Save\\?id=keyword.overview.grid.keyword_table') != -1 || // SEO > Keywords > Report > Edit
        details.url.search('://250ok.com/app/design-informant/[^\\?]+\\?action=delete') != -1 // 250ok > Design > Test > Delete
      ) {
        toCancel = true
      }
      break
    case 'DELETE':
      if (
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/predictive/content/delete.json') != -1 || // Predictive Content > Content > Delete
        details.url.search('://' + mktoLiveRtpDomainsMatch + '/app/rest/reaction/schedule/schedule') != -1
      ) {
        // Web Campaigns > Schedule > Delete
        toCancel = true
      }
      break
    default:
      return
  }

  if (toCancel) {
    let notAllowedNotification = {
      id: 'MarketoLive Not Allowed',
      title: 'Not Allowed',
      message: 'You are not authorized to make changes to this demo instance.',
      requireInteraction: false
    }

    createBasicNotification(notAllowedNotification)
    if (details.url.search('://seo.marketo.com/rest/reportdetail/save') == -1) {
      chrome.tabs.reload(details.tabId)
    }
    return {
      cancel: true
    }
  }
}

/**************************************************************************************
 *  This function adds an event listener for Email Insights, Web Personalization,
 *  and Predictive Content web requests in order to block adding, removing,
 *  editing, saving, deleting for normal users in MarketoLive instances.
 *  @param {function} - Callback function for the response.
 **************************************************************************************/

function addWebRequestListener() {
  chrome.webRequest.onBeforeRequest.addListener(
    cancelWebRequest,
    { urls: mktoLiveBlockUrlPatterns },
    ['blocking']
  )
  console.log('Added Blocking Web Request Listener')
}

/**************************************************************************************
 *  This function removes an event listener for Email Insights, Web Personalization,
 *  and Predictive Content web requests in order to allow adding, removing,
 *  editing, saving, deleting for admins and non-MarketoLive instances.
 *  @param {function} - Callback function for the response.
 **************************************************************************************/

function removeWebRequestListener() {
  chrome.webRequest.onBeforeRequest.removeListener(cancelWebRequest)
  console.log('Removed Blocking Web Request Listener')
}

/**************************************************************************************
 *  This function issues a tracking event for Heap Analytics
 *  @param {Object} event - the details of the event to track
 **************************************************************************************/

function heapTrack(event) {
  let isHeapAnalyticsForBackground = window.setInterval(function () {
    if (LIB.isPropOfWindowObj('heap')) {
      window.clearInterval(isHeapAnalyticsForBackground)

      if (mktoUserId) {
        heap.identify(mktoUserId)
      } else {
        chrome.cookies.get(
          {
            url: mktoLiveDomainMatch,
            name: 'mkto_user_id'
          },
          function (cookie) {
            if (cookie && cookie.value) {
              mktoUserId = cookie.value
              heap.identify(cookie.value)
              if (oktaEmail) {
                heap.addUserProperties({
                  Email: oktaEmail
                })
              } else {
                chrome.cookies.get(
                  {
                    url: mktoLiveDomainMatch,
                    name: 'okta_email'
                  },
                  function (cookie) {
                    if (cookie && cookie.value) {
                      heap.addUserProperties({
                        Email: cookie.value
                      })
                    }
                  }
                )
              }
            } else {
              if (oktaEmail) {
                heap.identify(oktaEmail)
                heap.addUserProperties({ Email: oktaEmail })
              } else {
                chrome.cookies.get(
                  { url: mktoLiveDomainMatch, name: 'okta_email' },
                  function (cookie) {
                    if (cookie && cookie.value) {
                      heap.identify(cookie.value)
                      heap.addUserProperties({ Email: cookie.value })
                    } else {
                      heap.identify()
                    }
                  }
                )
              }
            }
          }
        )
      }
      if (oktaFirstName && oktaLastName) {
        heap.addUserProperties({ Name: oktaFirstName + ' ' + oktaLastName })
        console.log('okta > Heap Analytics ID: ' + oktaFirstName + ' ' + oktaLastName)
      } else {
        chrome.cookies.get(
          { url: mktoLiveDomainMatch, name: 'okta_first_name' },
          function (cookie) {
            if (cookie && cookie.value) {
              oktaFirstName = cookie.value
              chrome.cookies.get(
                { url: mktoLiveDomainMatch, name: 'okta_last_name' },
                function (cookie) {
                  if (cookie && cookie.value) {
                    oktaLastName = cookie.value
                    heap.addUserProperties({ Name: oktaFirstName + ' ' + oktaLastName })
                    console.log('okta > Heap Analytics ID: ' + oktaFirstName + ' ' + oktaLastName)
                  } else {
                    if (mktoName) {
                      heap.addUserProperties({ Name: mktoName })
                      console.log('okta > Heap Analytics ID: ' + mktoName)
                    } else {
                      chrome.cookies.get(
                        { url: mktoLiveDomainMatch, name: 'mkto_name' },
                        function (cookie) {
                          if (cookie && cookie.value) {
                            mktoName = cookie.value
                            heap.addUserProperties({ Name: mktoName })
                            console.log('okta > Heap Analytics ID: ' + mktoName)
                          }
                        }
                      )
                    }
                  }
                }
              )
            } else {
              if (mktoName) {
                heap.addUserProperties({ Name: mktoName })
                console.log('okta > Heap Analytics ID: ' + mktoName)
              } else {
                chrome.cookies.get( { url: mktoLiveDomainMatch, name: 'mkto_name' },
                  function (cookie) {
                    if (cookie && cookie.value) {
                      mktoName = cookie.value
                      heap.addUserProperties({ Name: mktoName })
                      console.log('okta > Heap Analytics ID: ' + mktoName)
                    }
                  }
                )
              }
            }
          }
        )
      }
      if (mktoRole) {
        heap.addUserProperties({
          Role: mktoRole
        })
      } else {
        chrome.cookies.get(
          { url: mktoLiveDomainMatch, name: 'mkto_role' },
          function (cookie) {
            if (cookie && cookie.value) {
              mktoRole = cookie.value
              heap.addUserProperties({Role: mktoRole})
            }
          }
        )
      }
      if (event) {
        console.log('Extension > Tracking: Heap Event:', event)
        heap.track(event.name, { app: event.app, area: event.area, version: event.version, badExtensionId: event.badExtensionId, badExtensionName: event.badExtensionName })
      }
    }
  }, 0)
}

/**************************************************************************************
 *  Main
 **************************************************************************************/

setMarketoUserPodCookie()
LIB.loadScript(LIB.HEAP_ANALYTICS_SCRIPT_LOCATION)
heapTrack({ name: 'Background', app: 'Extension', area: 'Background', version: chrome.app.getDetails().version })
addMsgExtListener(checkMsgs)
checkForBadExtension()
chrome.cookies.getAll(
  { name: mktoAppUserCookie, domain: mktoAppUriDomain },
  function (cookies) {
    if (!cookies[0]) {
      return
    }
    let parts = cookies[0].value.split(':')
    if ( parts[1].search(adminUserNamesMatch) == -1 && parts[2].search(munchkinIdsMatch) != -1 ) {
      addWebRequestListener()
    }
  }
)
chrome.cookies.onChanged.addListener(function (changeInfo) {
  if ( changeInfo.cookie && changeInfo.cookie.name == mktoAppUserCookie && changeInfo.cookie.domain == mktoAppUriDomain && changeInfo.cause == 'explicit' ) {
    let parts = changeInfo.cookie.value.split(':')
    if ( parts[1].search(adminUserNamesMatch) == -1 && parts[2].search(munchkinIdsMatch) != -1 ) {
      addWebRequestListener()
    } else {
      removeWebRequestListener()
    }
  }
})
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.id == chrome.app.getDetails().id) {
    let event = { name: '', app: 'Extension', area: 'Background', version: chrome.app.getDetails().version, previousVersion: '' }
    switch (details.reason) {
      case 'install':
        chrome.tabs.create({ url: 'http://www.marketolive.com/en/update/privacy-policy', active: true, selected: true })
        event.name = 'Install'
        break
      case 'update':
        if (details.previousVersion != chrome.app.getDetails().version) {
          chrome.tabs.create({ url: 'http://www.marketolive.com/en/update/extension', active: true, selected: true })
          event.name = 'Update'
          event.previousVersion = details.previousVersion
        }
        break
    }
    heapTrack(event)
  }
})

checkExtUpdateAvailable().then(available => {
  if (available) {
    chrome.browserAction.setBadgeBackgroundColor({color: '#5A54A4'})
    chrome.browserAction.setBadgeText({text: 'up ⇪'})
  }
})
