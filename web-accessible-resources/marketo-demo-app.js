22.12.1
console.log('Marketo Demo App > Running', MARKETO_EXT_VERSION)
/**************************************************************************************
 *  This script contains all of the functionality needed for the manipulation of SC
 *  Marekto demo instances.
 **************************************************************************************/

// eslint-disable-next-line no-var
var mktoMyMarketoFragment = 'MM0A1',
  mktoMyMarketoSuperballFragment = 'MM',
  mktoAnalyticsFragmentMatch = new RegExp('^(AR[^!]+!|RCM[^!]+!)$', 'i'),
  mktoAnalyticsHomeFragment = 'AH0A1ZN',
  mktoAbmDiscoverMarketoCompaniesFragment = 'ABMDM',
  mktoAbmDiscoverCrmAccountsFragment = 'ABMDC',
  mktoAbmNamedAccountFragment = 'NA',
  mktoAbmFragmentMatch =
    '^(' + mktoAbmDiscoverMarketoCompaniesFragment + '|' + mktoAbmDiscoverCrmAccountsFragment + '|' + mktoAbmNamedAccountFragment + ')$',
  mktoEmailEditFragment = 'EME',
  mktoEmailPreviewFragmentRegex = new RegExp('^EME[0-9]+&isPreview', 'i'),
  mktoEmailPreviewFragment2 = 'EME[0-9]+&isPreview',
  mktoEmailPreviewFragment = 'EMP',
  mktoLandingPageEditFragment = 'LPE',
  mktoLandingPagePreviewFragment = 'LPP',
  mktoLandingPagePreviewDraftFragment = 'LPPD',
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
  mktoDesignersFragmentMatch = '^' + mktoEmailEditFragment + '$|^' + mktoEmailPreviewFragment2 + '|^' + mktoEmailPreviewFragment + '$|^' + mktoLandingPageEditFragment + '$|^' + mktoLandingPagePreviewFragment + '$|^' + mktoLandingPagePreviewDraftFragment + '$|^' + mktoFormEditFragment + '$|^' + mktoFormPreviewFragment + '$|^' + mktoFormPreviewDraftFragment + '$|^' + mktoPushNotificationEditFragment + '$|^' + mktoMobilePushNotificationPreviewFragment + '$|^' + mktoInAppMessageEditFragment + '$|^' + mktoInAppMessagePreviewFragment + '$|^' + mktoSmsMessageEditFragment + '$|^' + mktoSocialAppEditFragment + '$|^' + mktoSocialAppPreviewFragment + '$|^' + mktoAbTestEditFragment + '$|^' + mktoEmailTestGroupEditFragment + '$',
  origMenuShowAtFunc,
  APP = APP || {}

/**************************************************************************************
 *  This function overrides the target links for the Email Insights and Deliverability
 *  Tools Superball menu items if they exist, otherwise it creates the menu items. By
 *  default, these menu items uses SSO to login, however, we only have one instance for
 *  each item that contains usable demo data, so the plugin directs people into that
 *  instance. This function directs users to the 250ok login page where the
 *  deliverability-tools.js script will automatically login and hide the necessary
 *  buttons. This function should also run inside of SC sandbox instances.
 **************************************************************************************/

APP.overrideSuperballMenuItems = function () {
  console.log('Marketo Demo App > Overriding: Superball Menu Items')
  if (LIB.isPropOfWindowObj('MktPage.showSuperMenu')) {
    MktPage.showSuperMenu = function () {
      console.log('Marketo Demo App > Executing: Override Superball Menu Items')
      let logoEl = Ext.get(Ext.DomQuery.selectNode('.mkt-app-logo')),
        {menu} = logoEl,
        menuTop = 55
      if (!menu) {
        menu = logoEl.menu = Ext4.widget('appNavigationMenu', {
          listeners: {
            boxready: function (view) {
              let logoRegion = logoEl.getRegion() // shift out of the ball way
              if (logoRegion.bottom > menuTop) {
                view.setBodyStyle('padding-top', logoRegion.bottom - menuTop + 10 + 'px')
                view.updateLayout()
              }
              menu.setZIndex(logoEl.getStyle('zIndex') - 5) // prevent layering in front of the logo
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
        if (menu && menu.items && menu.items.items) {
          console.log('Marketo Demo App > Working: Override Superball Menu Items')
          let ii, currSuperBallMenuItem, performanceInsightsMenuItem, emailInsightsMenuItem, deliverabilityToolsMenuItem, clonedMenuItem
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
            }
          }
          if (performanceInsightsMenuItem) {
            performanceInsightsMenuItem.href = LIB.mktoPerformanceInsightsLink
            performanceInsightsMenuItem.update()
          } else {
            clonedMenuItem = menu.items.items[4].cloneConfig()
            clonedMenuItem.setText('Performance Insights')
            clonedMenuItem.setIconCls('mki3-mpi-logo-svg')
            clonedMenuItem.href = LIB.mktoPerformanceInsightsLink
            clonedMenuItem.hrefTarget = '_blank'
            clonedMenuItem.update()
            menu.add(clonedMenuItem)
          }
          if (emailInsightsMenuItem) {
            emailInsightsMenuItem.href = LIB.mktoEmailInsightsLink
            emailInsightsMenuItem.update()
          } else {
            clonedMenuItem = menu.items.items[4].cloneConfig()
            clonedMenuItem.setText('Email Insights')
            clonedMenuItem.setIconCls('mki3-email-insights-svg')
            clonedMenuItem.href = LIB.mktoEmailInsightsLink
            clonedMenuItem.hrefTarget = '_blank'
            clonedMenuItem.update()
            menu.add(clonedMenuItem)
          }
          if (deliverabilityToolsMenuItem) {
            deliverabilityToolsMenuItem.href = LIB.mktoEmailDeliverabilityToolsLink
            deliverabilityToolsMenuItem.update()
          } else {
            clonedMenuItem = menu.items.items[3].cloneConfig()
            clonedMenuItem.setText('Deliverability Tools')
            clonedMenuItem.setIconCls('mki3-mail-sealed-svg')
            clonedMenuItem.href = LIB.mktoEmailDeliverabilityToolsLink
            clonedMenuItem.hrefTarget = '_blank'
            clonedMenuItem.update()
            menu.add(clonedMenuItem)
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

APP.updateView = function () {
  if (LIB.currUrlFragment == mktoMyMarketoFragment) {
    LIB.overrideHomeTiles()
  } else if (LIB.currUrlFragment.search(mktoAnalyticsHomeFragment) != -1) {
    LIB.overrideAnalyticsTiles()
  }
  if (LIB.isPropOfWindowObj('Mkt3.DL.dl.dlCompCode')) {
    currCompFragment = Mkt3.DL.dl.dlCompCode
    if (currCompFragment.search(mktoDesignersFragmentMatch) != -1) {
      console.log('Marketo Demo App > Location: Designers/Wizards')
      switch (currCompFragment) {
        case mktoLandingPageEditFragment:
          console.log('Marketo Demo App > Location: Landing Page Editor')
          LIB.overlayLandingPage('edit')
          LIB.saveLandingPageEdits('edit')
          break
        case mktoLandingPagePreviewFragment:
          console.log('Marketo Demo App > Location: Landing Page Previewer')
          LIB.overlayLandingPage('preview')
          break
        case mktoLandingPagePreviewDraftFragment:
          console.log('Marketo Demo App > Location: Landing Page Draft Previewer')
          LIB.overlayLandingPage('preview')
          break
        case mktoEmailEditFragment:
          if (LIB.currUrlFragment.search(mktoEmailPreviewFragmentRegex) == -1) {
            console.log('Marketo Demo App > Location: Email Editor')
            LIB.overlayEmail('edit')
            LIB.saveEmailEdits('edit')
          } else {
            console.log('Marketo Demo App > Location: Email Previewer')
            LIB.overlayEmail('preview')
          }
          break
      }
    }
  }
}

/**************************************************************************************
 *  Main
 **************************************************************************************/
window.mkto_live_extension_state = 'MarketoLive extension is alive!'

// eslint-disable-next-line no-extra-semi
;(async function() {
  await LIB.dlTokenReady()
  console.log('Marketo Demo App > Location: Marketo Page')
  let currCompFragment
  LIB.currUrlFragment = Mkt3.DL.getDlToken()
  if (LIB.isPropOfWindowObj('Mkt3.DL.dl.dlCompCode')) {
    currCompFragment = Mkt3.DL.dl.dlCompCode
  }
  if (LIB.currUrlFragment == mktoMyMarketoFragment) {
    LIB.overrideHomeTiles()
  } else if (LIB.currUrlFragment.search(mktoAnalyticsHomeFragment) != -1) {
    LIB.overrideAnalyticsTiles()
  }
  LIB.heapTrack('track', {name: 'Last Loaded', assetName: 'Page' })
  if (
    LIB.currUrlFragment &&
    LIB.currUrlFragment.search(mktoAnalyticsFragmentMatch) == -1 &&
    (!currCompFragment ||
      (currCompFragment.search(mktoAbmFragmentMatch) == -1 && currCompFragment.search(mktoDesignersFragmentMatch) == -1))
  ) {
    LIB.applyMassClone(APP) //TODO put the MF hash hunter
  } else if (currCompFragment && currCompFragment.search(mktoDesignersFragmentMatch) != -1 && LIB.currUrlFragment.search(/[0-9]+$/) != -1) {
    console.log('Marketo Demo App > Location: Designers/Wizards')
    switch (currCompFragment) {
      case mktoLandingPageEditFragment:
        console.log('Marketo Demo App > Location: Landing Page Editor')
        LIB.overlayLandingPage('edit')
        LIB.saveLandingPageEdits('edit')
        break
      case mktoLandingPagePreviewFragment:
        console.log('Marketo Demo App > Location: Landing Page Previewer')
        LIB.overlayLandingPage('preview')
        break
      case mktoLandingPagePreviewDraftFragment:
        console.log('Marketo Demo App > Location: Landing Page Draft Previewer')
        LIB.overlayLandingPage('preview')
        break
      case mktoEmailEditFragment:
        if (LIB.currUrlFragment.search(mktoEmailPreviewFragmentRegex) == -1) {
          console.log('Marketo Demo App > Location: Email Editor')
          LIB.overlayEmail('edit')
          LIB.saveEmailEdits('edit')
        } else {
          console.log('Marketo Demo App > Location: Email Previewer')
          LIB.overlayEmail('preview')
        }
        break
    }
  }
  APP.overrideSuperballMenuItems()
  LIB.heapTrack('id')
})()
