22.12.1
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

async function findAndReloadOrCreateTab(tabInfo) {
let [tabs] = await chrome.tabs.query( { url: tabInfo.urlMatch });
   
      if (tabs.length > 0) {
        if (tabs[0].url == tabInfo.urlCreate) {
         await chrome.tabs.reload(tabs[0].id)
         await chrome.tabs.update(tabs[0].id, { active: true })
        } else {
          await chrome.tabs.update(tabs[0].id, { url: tabInfo.urlCreate, active: true })
        }
      } else {
        await chrome.tabs.create({ url: tabInfo.urlCreate, active: true })
      }
    
  
}

/**************************************************************************************
 *  This function reloads the company logo and color on all Marketo designer tabs in
 *  order to support email and landing page overlay without requiring to reload the tab.
 **************************************************************************************/

function reloadCompany() {
  console.log('Loading: Company Logo & Color')
  let companyLogoCookieDesigner = { url: mktoDesignerDomainMatch, name: 'logo' },
    queryInfo = { chrome: true, url: mktoDesignerMatchPattern },
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
    chrome.action.setBadgeBackgroundColor({color: '#5A54A4'})
    chrome.action.setBadgeText({text: 'up ⇪'})
  }
})
