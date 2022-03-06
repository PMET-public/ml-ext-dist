// DO NOT EDIT! All changes will be lost. This is a temporary, auto-generated file using gulp to combine javascript sources.
window.MARKETO_EXT_VERSION = 'v5.4.21'; // version also automatically injected via gulp using manifest.json

isExtDevMode = true
console.log('Marketo App > Running', MARKETO_EXT_VERSION)
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
  mktoAccountStringQe = 'globalsales',
  mktoAccountStringDynamics = 'mktodemoaccount408',
  mktoAccountStrings106Match = '^(' + LIB.mktoAccountString106 + '|' + LIB.mktoAccountString106d + ')$',
  mktoAccountStringsMatch = '^(' + LIB.mktoAccountStringMaster + '|' + LIB.mktoAccountStringMasterMEUE + '|' + LIB.mktoAccountString106 + '|' + LIB.mktoAccountString106d + '|' + mktoAccountStringDynamics + ')$', //TODO changed for MEUE
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
  mktoDisableButtonsFragmentMatch = '^(' + mktoMasterMarketingActivitiesEnglishFragment + '|' + mktoMarketingActivitiesDefaultFragment + '|' + mktoMarketingActivitiesUserFragment +
    '|' + mktoMarketingActivitiesJapaneseFragment + '|' + mktoMarketingActivitiesFinservFragment + '|' + mktoMarketingActivitiesHealthcareFragment + '|' +
    mktoMarketingActivitiesHigherEdFragment + '|' + mktoMarketingActivitiesManufacturingFragment + '|' + mktoMarketingActivitiesTechnologyFragment + '|' +
    mktoMarketingActivitiesTravelLeisureFragment + '|' + mktoMasterLeadDatabaseEnglishFragment + '|' + mktoLeadDatabaseDefaultFragment + '|' + mktoLeadDatabaseUserFragment +
    '|' + mktoLeadDatabaseJapaneseFragment + '|' + mktoLeadDatabaseFinservFragment + '|' + mktoLeadDatabaseHealthcareFragment + '|' + mktoLeadDatabaseHigherEdFragment + '|' +
    mktoLeadDatabaseManufacturingFragment + '|' + mktoLeadDatabaseTechnologyFragment + '|' + mktoLeadDatabaseTravelLeisureFragment + '|' + mktoAdminEmailEmailFragment + '|' + mktoAdminWebServicesFragment + ')$',
  mktoProgramAnalyzerFragment = 'AR1544A1!',
  mktoModelerFragment = 'RCM70A1!',
  mktoSuccessPathAnalyzerFragment = 'AR1682A1!',
  mktoAnalyzersFragmentMatch = '^(AR1559A1!|' + mktoProgramAnalyzerFragment + '|' + mktoModelerFragment + '|' + mktoSuccessPathAnalyzerFragment + ')$',
  mktoMobilePushNotificationFragment = 'MPN',
  mktoInAppMessageFragment = 'IAM',
  mktoSmsMessageFragment = 'SMS',
  mktoSocialAppFragment = 'SOA',
  mktoOtherAssetsFragmentMatch = '^(' + mktoMobilePushNotificationFragment + '|' + mktoInAppMessageFragment + '|' + mktoSmsMessageFragment + '|' + mktoSocialAppFragment + ')',
  mktoAbmDiscoverMarketoCompaniesFragment = 'ABMDM',
  mktoAbmDiscoverCrmAccountsFragment = 'ABMDC',
  mktoAbmNamedAccountFragment = 'NA',
  mktoAbmImportNamedAccountsFragment = 'ABMIA',
  mktoAbmFragmentMatch = '^(' + mktoAbmDiscoverMarketoCompaniesFragment + '|' + mktoAbmDiscoverCrmAccountsFragment + '|' + mktoAbmNamedAccountFragment + '|' + mktoAbmImportNamedAccountsFragment + ')$',
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
  mktoDesignersFragmentMatch = '^' + mktoEmailEditFragment + '$|^' + mktoEmailPreviewFragment2 + '|^' + mktoEmailPreviewFragment + '$|^' + mktoEmailTemplateEditFragment + '$|^' + mktoLandingPageEditFragment + '$|^' + mktoLandingPagePreviewFragment + '$|^' + mktoLandingPagePreviewDraftFragment + '$|^' + mktoLandingPageTemplateEditFragment + '$|^' + mktoLandingPageTemplatePreviewFragment + '$|^' + mktoFormEditFragment + '$|^' + mktoFormPreviewFragment + '$|^' + mktoFormPreviewDraftFragment + '$|^' + mktoPushNotificationEditFragment + '$|^' + mktoMobilePushNotificationPreviewFragment + '$|^' + mktoInAppMessageEditFragment + '$|^' + mktoInAppMessagePreviewFragment + '$|^' + mktoSmsMessageEditFragment + '$|^' + mktoSocialAppEditFragment + '$|^' + mktoSocialAppPreviewFragment + '$|^' + mktoAbTestEditFragment + '$|^' + mktoEmailTestGroupEditFragment + '$|^' + mktoSnippetEditFragment + '$|^' + mktoSnippetPreviewFragment + '$',
  mktoDefaultWorkspaceId,
  mktoJapaneseWorkspaceId,
  mktoFinservWorkspaceId,
  mktoHealthcareWorkspaceId,
  mktoHigherEdWorkspaceId,
  mktoManufacturingWorkspaceId,
  mktoTechnologyWorkspaceId,
  mktoTravelLeisureWorkspaceId,
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
  mktoEngagmentStreamPerformanceReport,
  mktoProgramPerformanceReport,
  mktoEmailLinkPerformanceReport,
  mktoPeopleByRevenueStageReport,
  mktoLandingPagePerformanceReport,
  mktoPeopleByStatusReport,
  mktoCompanyWebActivityReport,
  mktoSalesInsightEmailPerformanceReport,
  origEmailInsightsMenuItemLink,
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
  APP = APP || {}

// set the instance specific variables with the proper values
APP.setInstanceInfo = function (accountString) {
  if (accountString == LIB.mktoAccountStringMaster) {
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
    mktoEngagmentStreamPerformanceReport = 'AR209B2'
    mktoProgramPerformanceReport = 'AR216B2'
    mktoEmailLinkPerformanceReport = 'AR204B2'
    mktoPeopleByRevenueStageReport = 'AR26B2'
    mktoLandingPagePerformanceReport = 'AR210B2'
    mktoPeopleByStatusReport = 'AR225B2'
    mktoCompanyWebActivityReport = 'AR221B2'
    mktoSalesInsightEmailPerformanceReport = 'AR226B2'
  } else if (accountString == LIB.mktoAccountStringMasterMEUE) {
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
    mktoEngagmentStreamPerformanceReport = 'AR209B2'
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
    mktoTravelLeisureWorkspaceId = 186
    mktoUnknownWorkspaceId = -1
    mktoGoldenWorkspacesMatch = '^(' + mktoDefaultWorkspaceId + '|' + mktoJapaneseWorkspaceId + '|' + mktoFinservWorkspaceId + '|' + mktoHealthcareWorkspaceId + '|' + mktoHigherEdWorkspaceId +
      '|' + mktoManufacturingWorkspaceId + '|' + mktoTechnologyWorkspaceId + '|' + mktoTravelLeisureWorkspaceId + '|' + mktoUnknownWorkspaceId + ')$'
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
    mktoEngagmentStreamPerformanceReport = 'AR3881B2'
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
    case mktoTravelLeisureWorkspaceId:
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

        LIB.heapTrack('track', {name: 'Unauthorized Node Added', assetName: nodeConfig.text, assetId: nodeConfig.compId, assetType: nodeConfig.compType, workspaceId: workspaceId, workspaceName: workspaceName})

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
          changedNodeInfo = '\n>*Removed Node:* ' + nodeConfig.compType + ' | ' + nodeConfig.text + ' | ' + 'https://' + window.location.host + '/#' + APP.getAssetCompCode(nodeConfig.compType) + nodeConfig.compId,
          userInfo
        if (MktPage && MktPage.userName && MktPage.userid) {
          userInfo = '\n>*User:* ' + MktPage.userName + ' (' + MktPage.userid + ') '
        }
        LIB.webRequest( 'https://hooks.slack.com/services/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',
          '{"text": "*Unauthorized Changes*' + userInfo + workspaceInfo + changedNodeInfo + '"}',
          'POST', true, ''
        )
        LIB.heapTrack('track', {name: 'Unauthorized Node Removed', assetName: nodeConfig.text, assetId: nodeConfig.compId, assetType: nodeConfig.compType, workspaceId: nodeConfig.accessZoneId, workspaceName: workspaceName})

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
          changedNodeInfo = '\n>*Renamed Node:* ' + nodeConfig.compType + ' | From \'' + nodeConfig.text + '\' to \'' + text + '\' | ' + 'https://' + window.location.host + '/#' + APP.getAssetCompCode(nodeConfig.compType) + nodeConfig.compId,
          userInfo

        if (MktPage && MktPage.userName && MktPage.userid) {
          userInfo = '\n>*User:* ' + MktPage.userName + ' (' + MktPage.userid + ') '
        }

        LIB.webRequest( 'https://hooks.slack.com/services/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',
          '{"text": "*Unauthorized Changes*' + userInfo + workspaceInfo + changedNodeInfo + '"}',
          'POST', true, ''
        )

        LIB.heapTrack('track', {name: 'Unauthorized Node Renamed', assetName: nodeConfig.text, assetId: nodeConfig.compId, assetType: nodeConfig.compType, workspaceId: nodeConfig.accessZoneId, workspaceName: workspaceName})

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
 *  Flow Steps from a Smart Campaign or Smart List in the Default Workspace.
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
          Ext4.Msg.confirmDelete({ title: title, msg: msg, minHeight: 300, fn: function (buttonId) { if (buttonId === 'ok') { this._doClose() } }, scope: this })
        }
      } else {
        this._doClose()
      }
    }
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
              LIB.heapTrack('track', {name: 'Performance Insights', assetArea: 'Performance Insights', assetName: 'Demo App', assetType: 'Home Tile'})
            }
            performanceInsightsMenuItem.href = LIB.mktoPerformanceInsightsLink
            performanceInsightsMenuItem.update()
          } else {
            clonedMenuItem = menu.items.items[4].cloneConfig()
            clonedMenuItem.setText('Performance Insights')
            clonedMenuItem.setIconCls('mki3-mpi-logo-svg')
            clonedMenuItem.href = LIB.mktoPerformanceInsightsLink
            clonedMenuItem.hrefTarget = '_blank'

            clonedMenuItem.onClick = function (e) {
              LIB.heapTrack('track', {name: 'Performance Insights', assetArea: 'Performance Insights', assetName: 'Demo App', assetType: 'Home Tile'})
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
              emailInsightsMenuItem.href = LIB.mktoEmailInsightsLink
            }
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
            let origMenuItemOnClick = deliverabilityToolsMenuItem.onClick

            deliverabilityToolsMenuItem.onClick = function (e) {
              origMenuItemOnClick.apply(this, arguments)
              LIB.heapTrack('track', {name: 'Deliverability Tools', assetArea: 'Deliverability Tools', assetName: 'Demo Account', assetType: 'Home Tile'})
            }
            deliverabilityToolsMenuItem.href = LIB.mktoEmailDeliverabilityToolsLink
            deliverabilityToolsMenuItem.update()
          } else {
            clonedMenuItem = menu.items.items[3].cloneConfig()
            clonedMenuItem.setText('Deliverability Tools')
            clonedMenuItem.setIconCls('mki3-mail-sealed-svg')
            clonedMenuItem.href = LIB.mktoEmailDeliverabilityToolsLink
            clonedMenuItem.hrefTarget = '_blank'
            clonedMenuItem.onClick = function (e) {
              LIB.heapTrack('track', {name: 'Deliverability Tools', assetArea: 'Deliverability Tools', assetName: 'Demo Account', assetType: 'Home Tile'})
            }

            clonedMenuItem.update()
            menu.add(clonedMenuItem)
          }

          if (seoMenuItem) {
            let origMenuItemOnClick = seoMenuItem.onClick

            seoMenuItem.onClick = function (e) {
              origMenuItemOnClick.apply(this, arguments)
              LIB.heapTrack('track', {name: 'SEO', assetArea: 'SEO', assetName: 'Home', assetType: 'Home Tile'})
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
 *  This function overrides the save function of Smart Campaigns in order to disable
 *  saving within the Default Workspace at all times and within My Workspace if the
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
 *  and within My Workspace if the Program is NOT within the user's root folder.
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
 *  times and within My Workspace if the Program is NOT within the user's root folder
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
        (accountString == LIB.mktoAccountStringMaster || accountString == LIB.mktoAccountStringMasterMEUE) && //TODO
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
                (LIB.getUserRole() == 'Partner' &&
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
        (accountString == LIB.mktoAccountStringMaster || accountString == LIB.mktoAccountStringMasterMEUE) && //TODO MEUE
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
                (LIB.getUserRole() == 'Partner' &&
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
              if ( this.getInputItems()[1] .getValue() .toLowerCase() .search(userName + '$') == -1 ) {
                this.getInputItems()[1].setValue(this.getInputItems()[1].getValue() + ' - ' + userName)
              }
            } else {
              for (ii = 0; ii < this.getInputItems().length; ii++) {
                if (this.getInputItems()[ii] && this.getInputItems()[ii].fieldLabel == 'Name') {
                  if ( this.getInputItems()[ii].getValue() .toLowerCase() .search(userName + '$') == -1 ) {
                    this.getInputItems()[ii].setValue(this.getInputItems()[ii].getValue() + ' - ' + userName)
                  }
                }
              }
            }
          }
        } else if (this.title == 'New Segmentation') {
          if (this.findByType('textfield')) {
            if (this.findByType('textfield')[0] && this.findByType('textfield')[0].fieldLabel == 'Name') {
              if ( this.findByType('textfield')[0] .getValue() .toLowerCase() .search(userName + '$') == -1 ) {
                this.findByType('textfield')[0].setValue(this.findByType('textfield')[0].getValue() + ' - ' + userName)
              }
            } else {
              for (ii = 0; ii < this.findByType('textfield').length; ii++) {
                if (this.findByType('textfield')[ii] && this.findByType('textfield')[ii].fieldLabel == 'Name') {
                  if ( this.findByType('textfield')[ii].getValue() .toLowerCase() .search(userName + '$') == -1 ) {
                    this.findByType('textfield')[ii].setValue(this.findByType('textfield')[ii].getValue() + ' - ' + userName)
                  }
                }
              }
            }
          }
        }
      }

      if (this.submitInProgress || !this.beforeSubmitCallback()) {
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
        this.progressModal = Ext.MessageBox.show({ title: MktLang.getStr('ModalForm.Please_wait'), msg: this.progressMsg, progress: true, wait: true, width: 200, closable: false })
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
 *  This function overrides the save edit function for renaming existing Programs,
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

            if ( this.getTitleField() .getValue() .toLowerCase() .search(userName + '$') == -1 ) {
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

            el.animate( { height: { from: this.getHeight(), to: this.origHeight } }, 0.25,
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

            el.animate( { height: { from: this.getHeight(), to: this.origHeight } }, 0.25,
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
        let disable = APP.evaluateMenu('button', null, null, null)
        for (let ii = 0; ii < me.items.items.length; ii++) {
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

      LIB.heapTrack('track', heapEvent)
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

        LIB.heapTrack('track', heapEvent)

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
              // eslint-disable-next-line no-var
              var isEmailEditor = window.setInterval(function () {
                if (
                  typeof Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor') !== 'undefined' &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor') &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail() &&
                  Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail().getNodeJson()
                ) {
                  console.log('Marketo App > Disabling: Email Editor: Saving & Toolbar Menus')

                  window.clearInterval(isEmailEditor)

                  // eslint-disable-next-line no-var
                  var asset = Mkt3.app.controllers.get('Mkt3.controller.editor.email2.EmailEditor').getEmail()
                  assetNode = asset.getNodeJson()
                  menuItems = [
                    // Toolbar Menu
                    //"email2EditorToolbar [action=editSettings]", // Email Settings
                    //"email2EditorToolbar [action=editCode]", // Edit Code
                    //"email2EditorToolbar [action=preview]", // Preview
                    // Actions Menu
                    'emailEditor2 menu [action=approveEmail]', // Approve and Close
                    'emailEditor2 menu [action=sendTestEmail]', // Send Sample
                    //"emailEditor2 menu [action=editSettings]", // Email Settings
                    //"emailEditor2 menu [action=editCode]", // Edit Code
                    //"emailEditor2 menu [action=downloadHtml]", // Download HTML
                    'emailEditor2 menu [action=uploadImage]', // Upload Image or File
                    'emailEditor2 menu [action=grabImages]', // Grab Images from Web
                    'emailEditor2 menu [action=saveAsTemplate]' // Save as Template
                  ]

                  disableDesignerAsset(assetNode, menuItems)
                  LIB.overlayEmail('edit')
                  LIB.saveEmailEdits('edit', asset)
                }
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
        this.getXType() == 'adminSubscriptionInformationForm' || //Admin > My Account > Subscription Information
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

      var rendered = me.rendered
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
        window.location.href.search('#' + mktoCalendarFragment) != -1 ||
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
    LIB.webRequest( '/marketingEvent/setProgramStatusSubmit', 'ajaxHandler=MktSession&mktReqUid=' + new Date().getTime() + Ext.id(null, ':') + '&compId=' + compId + '&_json={"programId":' + compId + ',"statusValue":"off"}&xsrfId=' + MktSecurity.getXsrfId(),
      'POST', true, 'json',
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
    switch (LIB.currUrlFragment) {
      case mktoDefaultDiyLandingPageResponsiveEditFragment:
        console.log('Marketo App > Executing: Resetting Landing Page Responsive Properties/Variables')
        LIB.webRequest(
          '/data/landingPage/update?context=LPE11822&data=%5B%7B%22id%22%3A11822%2C%22responsiveOptions%22%3A%7B%22variables%22%3A%7B%22gradient1%22%3A%22%232A5370%22%2C%22gradient2%22%3A%22%23F2F2F2%22%2C%22showSection2%22%3Atrue%2C%22showSection3%22%3Atrue%2C%22showSection4%22%3Atrue%2C%22showFooter%22%3Atrue%2C%22showSocialButtons%22%3Atrue%2C%22section4ButtonLabel%22%3A%22Need%20More%20Info%3F%22%2C%22section4ButtonLink%22%3A%22%23%22%2C%22section3LeftButtonLabel%22%3A%22Join%20Us%22%2C%22section4BgColor%22%3A%22%23F2F2F2%22%2C%22footerBgColor%22%3A%22%232A5370%22%2C%22section2BgColor%22%3A%22%23F2F2F2%22%2C%22section3BgColor%22%3A%22%232A5370%22%2C%22section3LeftButtonLink%22%3A%22https%3A%2F%2Fwww.marketo.com%22%2C%22section3RightButtonLabel%22%3A%22Sign%20Up%22%7D%7D%7D%5D&xsrfId=' +
            MktSecurity.getXsrfId(), null, 'POST', true, '',
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
          (accountString == LIB.mktoAccountStringMaster || accountString == LIB.mktoAccountStringMasterMEUE) &&
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
        LIB.heapTrack('track', heapEvent)
      }
      node.ui.onClick(e)
    }
  }
}

APP.getUserId = function () {
  if (MktPage && MktPage.userid) {
    return MktPage.userid
  }
  return ''
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
      LIB.currUrlFragment = Mkt3.DL.getDlToken()
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
                if (accountString == LIB.mktoAccountStringMaster || accountString == LIB.mktoAccountStringMasterMEUE) {
                  APP.overrideSuperballMenuItems()
                  if (LIB.currUrlFragment && LIB.currUrlFragment == mktoMyMarketoFragment) {
                    LIB.overrideHomeTiles()
                  }
                }
                console.log('Marketo App > checkBadExtension Msg > Response: ', response)
              } else {
                if (!response) {
                  LIB.validateDemoExtensionCheck(true)
                } else {
                  LIB.validateDemoExtensionCheck(false)
                }
              }
              if (chrome.runtime.lastError) {
                console.log('Marketo App > checkBadExtension Msg > Error: ', chrome.runtime.lastError)
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
          console.log('Marketo App > checkExtensionVersion Msg > Error: ', chrome.runtime.lastError)
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

    if (LIB.currUrlFragment) {
      if (LIB.currUrlFragment == mktoAccountBasedMarketingFragment) {
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
              LIB.heapTrack('addProp', {area: 'ABM', assetType: LIB.formatText(this.getElementsByClassName('x4-tab-inner')[0].innerHTML)})

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
          LIB.heapTrack('addProp', {area: 'ABM', assetType: LIB.formatText(document.getElementsByClassName('x4-tab-top-active')[0].getElementsByClassName('x4-tab-inner')[0].innerHTML)})
        }
      } else if (LIB.currUrlFragment == mktoMyMarketoFragment) {
        LIB.overrideHomeTiles()
        LIB.heapTrack('track', {name: 'My Marketo', assetName: 'Home'})
      } else if (LIB.currUrlFragment.search(mktoDisableButtonsFragmentMatch) != -1) {
        APP.disableButtons()
      } else if (LIB.currUrlFragment == mktoAdminWebSkyFragment) {
        APP.disableCheckboxes()
      } else if (LIB.currUrlFragment.search(mktoAnalyticsHomeFragment) != -1) {
        LIB.overrideAnalyticsTiles()
      } else if (LIB.currUrlFragment.search('^' + APP.getAssetCompCode('Nurture Program') + '[0-9]+A1$') != -1) {
        APP.disableNurturePrograms()
      } else if (LIB.currUrlFragment == mktoAdBridgeSmartListFragment) {
        console.log('Marketo App > Location: Ad Bridge Smart List')
        APP.openAdBridgeModal()
      } else if (LIB.currUrlFragment == mktoAdminSalesforceFragment || LIB.currUrlFragment == mktoAdminDynamicsFragment) {
        console.log('Marketo App > Location: Admin > CRM')
        APP.hideOtherToolbarItems([{id: 'enableSync', action: 'setVisible'}])
      } else if (LIB.currUrlFragment == mktoAdminRcaCustomFieldSync) {
        console.log('Marketo App > Location: Admin > Revenue Cycle Analytics > Custom Field Sync')
        APP.hideOtherToolbarItems([{id: 'cadChangeButton', action: 'setVisible'}])
      }
    }

    // Only execute this block if the user is not on an editor page.
    if (
      LIB.currUrlFragment &&
      LIB.currUrlFragment.search(mktoAnalyticsFragmentMatch) == -1 &&
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
        LIB.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
      } else if (accountString == LIB.mktoAccountStringMaster || accountString == LIB.mktoAccountStringMasterMEUE) {
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
        LIB.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
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
        LIB.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
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
          LIB.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
          LIB.heapTrack('addProp', {area: 'ABM', assetType: 'Discover Marketo Companies'})
          break
        case mktoAbmDiscoverCrmAccountsFragment:
          console.log('Marketo App > Location: ABM > Discover CRM Accounts')
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableFormDeleteButtons()
          APP.disableHarmfulSaveButtons()
          LIB.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
          LIB.heapTrack('addProp', {area: 'ABM', assetType: 'Discover CRM Accounts'})
          break
        case mktoAbmNamedAccountFragment:
          console.log('Marketo App > Location: ABM > Named Account')
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableFormDeleteButtons()
          APP.disableHarmfulSaveButtons()
          LIB.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
          LIB.heapTrack('addProp', {area: 'ABM', assetType: 'Named Account'})
          break
        case mktoAbmImportNamedAccountsFragment:
          console.log('Marketo App > Location: ABM > Import Named Accounts')
          APP.disableMenus()
          APP.hideToolbarItems()
          APP.disableFormSaveButtons()
          APP.disableFormDeleteButtons()
          APP.disableHarmfulSaveButtons()
          LIB.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
          LIB.heapTrack('addProp', {area: 'ABM', assetType: 'Import Named Accounts'})
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
          if (LIB.currUrlFragment == mktoEmailEditFragment) {
            console.log('Marketo App > Location: Email Template Picker')
            APP.disableDesignerSaving('email', 'templatePicker')
          } else if (LIB.currUrlFragment.search(mktoEmailPreviewFragmentRegex) == -1) {
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
    } else if (LIB.currUrlFragment && LIB.currUrlFragment.search(mktoAnalyticsFragmentMatch) != -1) {
      if (LIB.currUrlFragment.search(mktoAnalyzersFragmentMatch) != -1) {
        console.log('Marketo App > Location: Golden Analytics')
        APP.updateNavBar()
      }

      if (LIB.currUrlFragment.search(mktoReportFragmentRegex) != -1) {
        console.log('Marketo App > Location: Fullscreen Report')
        APP.disableAnalyticsSaving('report')
      } else if (LIB.currUrlFragment.search(mktoModelerFragmentRegex) != -1) {
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
              console.log('Marketo App > checkMktoCookie Msg > Error: ', chrome.runtime.lastError)
            }
          }
        )
      } else {
        APP.disableRequests()
      }
      LIB.heapTrack('track', {name: 'Last Loaded', assetName: 'Page'})
    }

    APP.updateView = function () {
      LIB.currUrlFragment = Mkt3.DL.getDlToken()
      LIB.areHomeTilesOverridden = false
      LIB.areAnalyticsTilesOverridden = false
      console.log('Marketo App > Loaded: New URL Fragment = ' + LIB.currUrlFragment)
      if (LIB.currUrlFragment == mktoMyMarketoFragment) {
        LIB.overrideHomeTiles()
        LIB.heapTrack('track', {name: 'My Marketo', assetName: 'Home'})
      } else if (LIB.currUrlFragment.search(mktoDisableButtonsFragmentMatch) != -1) {
        APP.disableButtons()
      } else if (LIB.currUrlFragment === mktoAdminWebSkyFragment) {
        APP.disableCheckboxes()
      } else if (LIB.currUrlFragment.search(mktoAccountBasedMarketingFragment) != -1) {
        APP.disableAccountAI()
      } else if (LIB.currUrlFragment.search(mktoAnalyticsHomeFragment) != -1) {
        LIB.overrideAnalyticsTiles()
      } else if (LIB.currUrlFragment.search('^' + APP.getAssetCompCode('Nurture Program') + '[0-9]+A1$') != -1) {
        APP.disableNurturePrograms()
      } else if (LIB.currUrlFragment == mktoAdminSalesforceFragment || LIB.currUrlFragment == mktoAdminDynamicsFragment) {
        console.log('Marketo App > Location: Admin > CRM')
        APP.hideOtherToolbarItems([{ id: 'enableSync', action: 'setVisible' }])
      } else if (LIB.currUrlFragment == mktoAdminRcaCustomFieldSync) {
        console.log('Marketo App > Location: Admin > Revenue Cycle Analytics > Custom Field Sync')
        APP.hideOtherToolbarItems([{ id: 'cadChangeButton', action: 'setVisible' }])
      } else if (LIB.currUrlFragment.search(mktoAnalyzersFragmentMatch) != -1) {
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
              if (LIB.currUrlFragment == mktoEmailEditFragment) {
                console.log('Marketo App > Location: Email Template Picker')
                APP.disableDesignerSaving('email', 'templatePicker')
              } else if (LIB.currUrlFragment.search(mktoEmailPreviewFragmentRegex) == -1) {
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

    APP.overrideSuperballMenuItems()
    LIB.heapTrack('id')
  }
}, 0)
