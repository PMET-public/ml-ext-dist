// DO NOT EDIT! All changes will be lost. This is a temporary, auto-generated file using gulp to combine javascript sources.
window.MARKETO_EXT_VERSION = 'v5.4.17'; // version also automatically injected via gulp using manifest.json

isExtDevMode = true
console.log('Marketo App Admin > Running', MARKETO_EXT_VERSION)
/**************************************************************************************
 *  This content script contains all of the functionality needed for loading external
 *  scripts on the Marketo App.
 **************************************************************************************/

// eslint-disable-next-line no-var
var adminAreasWorkspaceRole = {},
  protectedWorkspaceRole = {},
  userWorkspaceRole = {},
  defaultRolesEn = [],
  defaultRolesJp = [],
  ADMIN = ADMIN || {}

/**************************************************************************************
 *  This function sets the instance specific variables with the proper values based
 *  upon the given accountString.
 *  @param {String} accountString - Marketo instance
 **************************************************************************************/

ADMIN.setInstanceInfo = function (accountString) {
  let protectedWorkspaceEn = {},
    protectedWorkspaceJp = {}

  switch (accountString) {
    case LIB.mktoAccountStringMaster:
      adminAreasWorkspaceRole.id = 1003
      adminAreasWorkspaceRole.allzones = true

      protectedWorkspaceRole.id = 1002
      protectedWorkspaceRole.allzones = false
      protectedWorkspaceEn.id = 1
      protectedWorkspaceJp.id = 3

      userWorkspaceRole.id = 102
      userWorkspaceRole.allzones = false

      defaultRolesEn = [
        {
          id: 1,
          allzones: false,
          zones: []
        },
        {
          id: adminAreasWorkspaceRole.id,
          allzones: adminAreasWorkspaceRole.allzones,
          zones: []
        },
        {
          id: 101,
          allzones: false,
          zones: []
        },
        {
          id: 1001,
          allzones: false,
          zones: []
        },
        {
          id: protectedWorkspaceRole.id,
          allzones: protectedWorkspaceRole.allzones,
          zones: [
            {
              id: protectedWorkspaceEn.id
            }
          ]
        },
        {
          id: 25,
          allzones: false,
          zones: []
        },
        {
          id: 24,
          allzones: false,
          zones: []
        },
        {
          id: 2,
          allzones: false,
          zones: []
        },
        {
          id: 103,
          allzones: false,
          zones: []
        }
      ]

      defaultRolesJp = [
        {
          id: 1,
          allzones: false,
          zones: []
        },
        {
          id: adminAreasWorkspaceRole.id,
          allzones: adminAreasWorkspaceRole.allzones,
          zones: []
        },
        {
          id: 101,
          allzones: false,
          zones: []
        },
        {
          id: 1001,
          allzones: false,
          zones: []
        },
        {
          id: protectedWorkspaceRole.id,
          allzones: protectedWorkspaceRole.allzones,
          zones: [
            {
              id: protectedWorkspaceEn.id
            },
            {
              id: protectedWorkspaceJp.id
            }
          ]
        },
        {
          id: 25,
          allzones: false,
          zones: []
        },
        {
          id: 24,
          allzones: false,
          zones: []
        },
        {
          id: 2,
          allzones: false,
          zones: []
        },
        {
          id: 103,
          allzones: false,
          zones: []
        }
      ]
      break
    case LIB.mktoAccountString106:
      var protectedWorkspacesEn = [],
        userWorkspace = {}

      adminAreasWorkspaceRole.id = 113
      adminAreasWorkspaceRole.allzones = true

      protectedWorkspaceRole.id = 109
      protectedWorkspaceRole.allzones = false
      protectedWorkspacesEn = [1, 174, 175, 176, 184, 185, 186]
      protectedWorkspaceJp.id = 173

      userWorkspaceRole.id = 102
      userWorkspaceRole.allzones = false
      userWorkspace.id = 172

      defaultRolesEn = [
        {
          id: 1,
          allzones: false,
          zones: []
        },
        {
          id: adminAreasWorkspaceRole.id,
          allzones: adminAreasWorkspaceRole.allzones,
          zones: []
        },
        {
          id: 104,
          allzones: false,
          zones: []
        },
        {
          id: protectedWorkspaceRole.id,
          allzones: protectedWorkspaceRole.allzones,
          zones: []
        },
        {
          id: 25,
          allzones: false,
          zones: []
        },
        {
          id: 24,
          allzones: false,
          zones: []
        },
        {
          id: 2,
          allzones: false,
          zones: []
        },
        {
          id: userWorkspaceRole.id,
          allzones: userWorkspaceRole.allzones,
          zones: [
            {
              id: userWorkspace.id
            }
          ]
        }
      ]

      defaultRolesJp = [
        {
          id: 1,
          allzones: false,
          zones: []
        },
        {
          id: adminAreasWorkspaceRole.id,
          allzones: adminAreasWorkspaceRole.allzones,
          zones: []
        },
        {
          id: 104,
          allzones: false,
          zones: []
        },
        {
          id: protectedWorkspaceRole.id,
          allzones: protectedWorkspaceRole.allzones,
          zones: []
        },
        {
          id: 25,
          allzones: false,
          zones: []
        },
        {
          id: 24,
          allzones: false,
          zones: []
        },
        {
          id: 2,
          allzones: false,
          zones: []
        },
        {
          id: userWorkspaceRole.id,
          allzones: userWorkspaceRole.allzones,
          zones: [
            {
              id: userWorkspace.id
            }
          ]
        }
      ]

      for (let ii = 0; ii < protectedWorkspacesEn.length; ii++) {
        defaultRolesEn[3].zones.push({id: protectedWorkspacesEn[ii]})
        defaultRolesJp[3].zones.push({id: protectedWorkspacesEn[ii]})
      }
      defaultRolesJp[3].zones.push({id: protectedWorkspaceJp.id})
      break
  }
}

/**************************************************************************************
 *  This function returns the difference in days between two dates.
 **************************************************************************************/

ADMIN.dateDiffInDays = function (a, b) {
  let _MS_PER_DAY = 1000 * 60 * 60 * 24,
    utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()),
    utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())

  return Math.floor((utc2 - utc1) / _MS_PER_DAY)
}

/**************************************************************************************
 *  This function returns the data for all users.
 *  @param {Function} callabck - function to callback after the async request completes
 **************************************************************************************/

ADMIN.getAllUsers = function (callback) {
  console.log('Getting All Users')
  LIB.webRequest('/custAdmin/getAllUsers', 'xsrfId=' + MktSecurity.getXsrfId(), 'POST', true, 'json', function (response) {
    let result = JSON.parse(response)

    if (result.success) {
      console.log('Retrieved All Users')
      if (typeof callback === 'function') {
        callback(result)
      }
    }
  })
}

/**************************************************************************************
 *  This function returns the data for all roles.
 *  @param {Function} callabck - function to callback after the async request completes
 **************************************************************************************/

ADMIN.getAllRoles = function (callback) {
  console.log('Getting All Roles')
  LIB.webRequest('/custAdmin/getAllRoles', 'xsrfId=' + MktSecurity.getXsrfId(), 'POST', true, 'json', function (response) {
    let result = JSON.parse(response)
    if (result.data && result.data.length > 0) {
      console.log('Retrieved All Roles')
      if (typeof callback === 'function') {
        callback(result)
      }
    }
  })
}

/**************************************************************************************
 *  This function returns the data for all workspaces.
 *  @param {Function} callabck - function to callback after the async request completes
 *  @param {Object} args - arguments to pass through (Optional)
 **************************************************************************************/

ADMIN.getAllWorkspaces = function (callback, args) {
  console.log('Getting All Workspaces')
  LIB.webRequest('/custAdmin/getAllZones', 'xsrfId=' + MktSecurity.getXsrfId(), 'POST', true, 'json', function (response) {
    let result = JSON.parse(response)

    if (result.data && result.data.length > 0) {
      console.log('Retrieved All Workspaces')
      if (typeof callback === 'function') {
        callback(result, args)
      }
    }
  })
}

/**************************************************************************************
 *  This function creates a workspace with the given details.
 *  @param {Object} workspace
 *    {String} name - name of the workspace
 *    {String} description - description of the workspace
 *    {String} language - language of the workspace
 *    {String} admLanguage - language code
 *    {String} domain - default email branding domain
 *    {String} partitionId - id of the partition
 *    {String} partitionName - name of the partition
 *  @param {Function} callabck - function to callback after the async request completes
 *  @param {Object} args - arguments to pass through (Optional)
 **************************************************************************************/

ADMIN.createWorkspace = function (workspace, callback, args) {
  console.log('Creating Workspace: ' + workspace.name)
  LIB.webRequest(
    '/custAdmin/createZoneSubmit',
    'ajaxHandler=MktSession&mktReqUid=' +
      new Date().getTime() +
      Ext.id(null, ':') +
      '&admLanguage=' +
      workspace.admLanguage +
      '&xsrfId=' +
      MktSecurity.getXsrfId() +
      '&zoneName=' +
      workspace.name +
      '&zoneDescription=' +
      workspace.description +
      '&prtnsArray=[' +
      workspace.partitionId +
      ']&primaryPrtn=' +
      workspace.partitionId +
      '&primaryPartition=' +
      workspace.partitionName +
      '&domain=' +
      workspace.domain +
      '&language=' +
      workspace.language,
    'POST',
    true,
    'json',
    function (response) {
      let result = JSON.parse(response)

      if (result.HTMLResults && result.HTMLResults.begin) {
        console.log('Created Workspace: ' + workspace.name)
        if (typeof callback === 'function') {
          callback(args)
        }
      }
    }
  )
}

/**************************************************************************************
 *  This function returns the workspace primary partition id and default domain of
 *  the matching given workspace name.
 *  @param {Object} workspaceMatch
 *    {String} name - name of the workspace to match
 *    {String} partitionName - name of the partition to match
 *  @param {Function} callabck - function to callback after the async request completes
 **************************************************************************************/

ADMIN.getWorkspacePartition = function (workspaceMatch, callback) {
  if (typeof callback !== 'function') {
    console.error('Expected function')
    return
  }
  ADMIN.getAllWorkspaces(function (result) {
    console.log('Getting Workspace Partition: ' + workspaceMatch.name)
    if (result.data) {
      for (let ii = 0; ii < result.data.length; ii++) {
        let workspace = result.data[ii]
        if (workspace.name == workspaceMatch.name) {
          for (let jj = 0; jj < workspace.ptns.length; jj++) {
            let partiton = workspace.ptns[jj]
            if (partiton.name == workspaceMatch.partitionName && partiton.isPrimary) {
              console.log('Retrieved Workspace/Partion: ' + workspaceMatch.name + '/' + workspaceMatch.partitionName)
              callback({ id: partiton.id, name: partiton.name, domain: workspace.defaultDomain })
            }
          }
        }
      }
    }
  })
}

/**************************************************************************************
 *  This function creates a workspace with the given details.
 *  @param {Object} workspace
 *    {String} name - name of the workspace
 *    {String} language - language of the workspace
 *  @param {Function} callback - function to callback after the async request completes
 *  @param {Object} args - arguments to pass through (Optional)
 **************************************************************************************/

ADMIN.createUserWorkspace = function (workspace, callback, args) {
  if (!workspace.none) {
    let description = 'User Workspace',
      workspaceMatch = {},
      admLanguage,
      language

    switch (workspace.language) {
      case 'English':
        workspaceMatch.name = workspaceMatch.partitionName = 'English'
        admLanguage = 'en_US'
        language = 'English'
        break
      case '日本語（日本）':
      case '日本語':
        workspaceMatch.name = workspaceMatch.partitionName = 'Japanese'
        admLanguage = 'ja'
        language = '日本語'
        break
      default:
        workspaceMatch.name = workspaceMatch.partitionName = 'English'
        admLanguage = 'en_US'
        language = 'English'
        break
    }

    ADMIN.getWorkspacePartition(workspaceMatch, function (partition) {
      ADMIN.createWorkspace({
        name: workspace.name,
        description: description,
        language: language,
        admLanguage: admLanguage,
        domain: partition.domain,
        partitionId: partition.id,
        partitionName: partition.name
      }, callback, args )
    })
  } else {
    callback(args)
  }
}

/**************************************************************************************
 *  This function returns the appropriate user roles for the given language and
 *  instance.
 *  @param {Object} userWorkspace
 *    {String} name - name of the user's workspace
 *    {String} language - the languge of the user, English or 日本語（日本）
 *  @param {Object} workspaces - array of all workspaces (Optional)
 **************************************************************************************/

ADMIN.getUserRoles = function (userWorkspace, workspaces) {
  let roles

  if (accountString == LIB.mktoAccountStringMaster || accountString == LIB.mktoAccountStringABDemoMaster) {
    if (!userWorkspace.none) {
      for (let ii = 0; ii < workspaces.data.length; ii++) {
        let workspace = workspaces.data[ii]

        if (workspace.name == userWorkspace.name) {
          userWorkspace.id = workspace.id
          break
        }
      }
    }

    switch (userWorkspace.language) {
      case 'English':
        roles = JSON.parse(JSON.stringify(defaultRolesEn))
        if (!userWorkspace.none) {
          roles.push({ id: userWorkspaceRole.id, allzones: userWorkspaceRole.allzones, zones: [ { id: userWorkspace.id } ] })
        }
        break
      case 'Japanese':
      case '日本語（日本）':
        roles = JSON.parse(JSON.stringify(defaultRolesJp))
        if (!userWorkspace.none) {
          roles.push({ id: userWorkspaceRole.id, allzones: userWorkspaceRole.allzones, zones: [ { id: userWorkspace.id } ] })
        }
        break
      default:
        roles = JSON.parse(JSON.stringify(defaultRolesEn))
        if (!userWorkspace.none) {
          roles.push({ id: userWorkspaceRole.id, allzones: userWorkspaceRole.allzones, zones: [ { id: userWorkspace.id } ] })
        }
        break
    }
  } else {
    switch (userWorkspace.language) {
      case 'English':
        roles = JSON.parse(JSON.stringify(defaultRolesEn))
        break
      case 'Japanese':
      case '日本語（日本）':
        roles = JSON.parse(JSON.stringify(defaultRolesJp))
        break
      default:
        roles = JSON.parse(JSON.stringify(defaultRolesEn))
        break
    }
  }

  return JSON.stringify(roles)
}

/**************************************************************************************
 *  This function invites a user, by default sending the invitation to marketodemo.
 *  @param {Object} user - the user's information
 *          (required) email, userId, firstName, lastName, role, language
 *          (optional) directInvite - boolean, if true sends invite directly to user
 **************************************************************************************/

ADMIN.inviteUser = function (user) {
  let userId = user.userId.replace(/\+/, '%2B'),
    email = user.email.replace(/\+/, '%2B'),
    message =
      '{{FirstName}} {{LastName}},<br><br>Welcome to Marketo!, Click this link to set your password and begin.<br><br>{{LoginToMarketoLink}}<br><br>Not sure where to start? Visit <a href="https://docs.marketo.com/display/DOCS/Getting+Started" target="_blank">Getting Started with Marketo page</a> for tutorials and other resources. You are already set up - dive right into Step 2!<br><br>Happy Marketing!',
    userWorkspace = { name: user.firstName + ' ' + user.lastName, language: user.language },
    roles

  if (!user.directInvite) {
    email = 'marketodemo%2B' + userId.split('@')[0] + '@gmail.com'
  }

  function getAllWorkspaces() {
    ADMIN.getAllWorkspaces(function (workspaces) {
      roles = ADMIN.getUserRoles(userWorkspace, workspaces)
      LIB.webRequest('/custAdmin/inviteUserSubmit',
        'ajaxHandler=MktSession&mktReqUid=' + new Date().getTime() + Ext.id(null, ':') + '&cadEmail=' + email + '&cadUserId=' + userId + '&cadFirstName=' + user.firstName + '&cadLastName=' + user.lastName + ' [' + user.role + ']' + '&cadApiOnly=false' + '&cadRole=' + roles + '&cadMessage=' + message + '&xsrfId=' + MktSecurity.getXsrfId(),
        'POST', true, 'json',
        function (response) {
          console.log('Invited User')
        }
      )
    })
  }

  if (accountString == LIB.mktoAccountStringMaster || accountString == LIB.mktoAccountStringABDemoMaster) {
    if (user.ownWorkspace == false) {
      userWorkspace.none = true
    }
    ADMIN.createUserWorkspace(userWorkspace, getAllWorkspaces)
  } else {
    roles = ADMIN.getUserRoles(userWorkspace)
    LIB.webRequest('/custAdmin/inviteUserSubmit',
      'ajaxHandler=MktSession&mktReqUid=' + new Date().getTime() + Ext.id(null, ':') + '&cadEmail=' + email + '&cadUserId=' + userId + '&cadFirstName=' + user.firstName + '&cadLastName=' + user.lastName + ' [' + user.role + ']' + '&cadApiOnly=false' + '&cadRole=' + roles + '&cadMessage=' + message + '&xsrfId=' + MktSecurity.getXsrfId(),
      'POST', true, 'json',
      function (response) {
        console.log('Invited User')
      }
    )
  }
  console.log('Inviting User: ' + email + ', ' + userId + ', ' + user.firstName + ', ' + user.lastName + ' [' + user.role + ']')
}

/**************************************************************************************
 *  This function issues a Calendar license for the given user.
 *  @param {String} userId - the ID of the user (aka Login ID)
 **************************************************************************************/

ADMIN.issueCalendarLicense = function (userId) {
  console.log('Issuing Calendar License: ' + userId)
  LIB.webRequest(
    '/calendar/issueLicensesSubmit',
    'ajaxHandler=MktSession&mktReqUid=' + new Date().getTime() + Ext.id(null, ':') + '&userIds=["' + userId + '"]' + '&xsrfId=' + MktSecurity.getXsrfId(),
    'POST', true, 'json',
    function (response) {
      console.log('Issued Calendar License')
    }
  )
}

/**************************************************************************************
 *  This function revokes a Calendar license for the given user.
 *  @param {String} userId - the ID of the user (aka Login ID)
 **************************************************************************************/

ADMIN.revokeCalendarLicense = function (userId) {
  console.log('Revoking Calendar License: ' + userId)
  LIB.webRequest( '/calendar/revokeLicensesSubmit',
    'ajaxHandler=MktSession&mktReqUid=' + new Date().getTime() + Ext.id(null, ':') + '&userIds=["' + userId + '"]' + '&xsrfId=' + MktSecurity.getXsrfId(),
    'POST', true, 'json',
    function (response) {
      console.log('Revoked Calendar License')
    }
  )
}

/**************************************************************************************
 *  This function issues an ABM license for the given user.
 *  @param {String} userId - the ID of the user (aka Login ID)
 **************************************************************************************/

ADMIN.issueAbmLicense = function (userId) {
  console.log('Issuing ABM License: ' + userId)
  LIB.webRequest(
    '/abm/issueLicensesSubmit',
    'ajaxHandler=MktSession&mktReqUid=' +
      new Date().getTime() +
      Ext.id(null, ':') +
      '&userIds=["' +
      userId +
      '"]' +
      '&xsrfId=' +
      MktSecurity.getXsrfId(),
    'POST',
    true,
    'json',
    function (response) {
      console.log('Issued ABM License')
    }
  )
}

/**************************************************************************************
 *  This function revokes an ABM license for the given user.
 *  @param {String} userId - the ID of the user (aka Login ID)
 **************************************************************************************/

ADMIN.revokeAbmLicense = function (userId) {
  console.log('Revoking ABM License: ' + userId)
  LIB.webRequest(
    '/abm/revokeLicensesSubmit',
    'ajaxHandler=MktSession&mktReqUid=' +
      new Date().getTime() +
      Ext.id(null, ':') +
      '&userIds=["' +
      userId +
      '"]' +
      '&xsrfId=' +
      MktSecurity.getXsrfId(),
    'POST',
    true,
    'json',
    function (response) {
      console.log('Revoked ABM License')
    }
  )
}

/**************************************************************************************
 *  This function invites multiple users, by default sending the invitation to
 *  marketodemo.
 *  @param [Array of {Object}] users - the users' information
 *          (required) email, userId, firstName, lastName, role
 *          (optional) directInvite - boolean, if true sends invite directly to user
 **************************************************************************************/

ADMIN.inviteUsers = function (users) {
  for (let ii = 0; ii < users.length; ii++) {
    let user = users[ii]
    console.log('Inviting User (' + (ii + 1) + '/' + users.length + ')')
    ADMIN.inviteUser(user)
  }
}

/**************************************************************************************
 *  This function edits a user by resetting their information, importantly their roles
 *  and email. Used to reset their email from marketodemo to their real email.
 *  @param {Object} users - the users' information
 *    (required) email, userId, firstName, lastName, role, id
 **************************************************************************************/

ADMIN.editUser = function (user) {
  let userId = user.userId.replace(/\+/, '%2B'),
    {firstName} = user,
    {lastName} = user,
    {role} = user,
    newEmail = user.email.replace(/\+/, '%2B'),
    {id} = user,
    userWorkspace = { name: user.firstName + ' ' + user.lastName, language: user.language },
    roles

  function getUserWorkspaceId(workspaces) {
    roles = ADMIN.getUserRoles(userWorkspace, workspaces)
    console.log('Editing User: ' + userId + ', ' + firstName + ', ' + lastName + ', ' + newEmail)
    LIB.webRequest(
      '/custAdmin/editUserSubmit',
      'ajaxHandler=MktSession&mktReqUid=' + new Date().getTime() + Ext.id(null, ':') + '&cadUserId=' + userId + '&cadFirstName=' + firstName + '&cadLastName=' + lastName + ' [' + role + ']' + '&cadEmail=' + newEmail + '&cadRole=' + roles + '&cadId=' + id + '&cadApiOnly=false&cadIsDeviceAuthEnabled=0' + '&xsrfId=' + MktSecurity.getXsrfId(),
      'POST', true, 'json',
      function (response) {
        console.log('Edited User')
      }
    )
  }

  if (accountString == LIB.mktoAccountStringMaster || accountString == LIB.mktoAccountStringABDemoMaster) {
    if (user.ownWorkspace == false) {
      userWorkspace.none = true
    }
    ADMIN.getAllWorkspaces(getUserWorkspaceId)
  } else {
    roles = ADMIN.getUserRoles(userWorkspace)
    console.log('Editing User: ' + userId + ', ' + firstName + ', ' + lastName + ', ' + newEmail)
    LIB.webRequest(
      '/custAdmin/editUserSubmit',
      'ajaxHandler=MktSession&mktReqUid=' + new Date().getTime() + Ext.id(null, ':') + '&cadUserId=' + userId + '&cadFirstName=' + firstName + '&cadLastName=' + lastName + ' [' + role + ']' + '&cadEmail=' + newEmail + '&cadRole=' + roles + '&cadId=' + id + '&cadApiOnly=false&cadIsDeviceAuthEnabled=0' + '&xsrfId=' + MktSecurity.getXsrfId(),
      'POST', true, 'json',
      function (response) {
        console.log('Edited User')
      }
    )
  }
}

/**************************************************************************************
 *  This function id for editing new users in order to issue them licenses and reset
 *  their email from marketodemo to their real email.
 *  @param [Array of {Object}] users - the users' information
 *          (required) email, userId, firstName, lastName, role
 **************************************************************************************/

ADMIN.editNewUsers = function (users) {
  let editUsers = []

  for (let ii = 0; ii < users.length; ii++) {
    let userId = users[ii].userId.replace(/\+/, '%2B')
    console.log('Editing New User (' + (ii + 1) + '/' + users.length + ')')
    ADMIN.issueCalendarLicense(userId)
    ADMIN.issueAbmLicense(userId)

    if (!users[ii].directInvite) {
      editUsers.push(users[ii])
    }
  }

  if (editUsers.length > 0) {
    console.log('Getting Users to Edit (' + editUsers.length + ') ...')
    LIB.webRequest('/custAdmin/getAllUsers', 'xsrfId=' + MktSecurity.getXsrfId(), 'POST', true, 'json', function (response) {
      let result = JSON.parse(response).data,
        num = 0

      for (let ii = result.length - 1; ii >= 0; ii--) {
        for (let jj = 0; jj < editUsers.length; jj++) {
          if (result[ii].userid == editUsers[jj].userId.replace('%2B', '+')) {
            let user = editUsers[jj]
            user.id = result[ii].id
            num++
            console.log('Editing User: (' + num + '/' + editUsers.length + ')')
            ADMIN.editUser(user)
            break
          }
        }
      }
      console.log('Finished Sending Edit User Requests')
    })
  }
}

/**************************************************************************************
 *  This function deletes a given user.
 *  @param {Integer} id - the server-side ID of the user
 **************************************************************************************/

ADMIN.deleteUser = function (id) {
  console.log('Deleting User')
  LIB.webRequest(
    '/custAdmin/deleteUserSubmit',
    'ajaxHandler=MktSession&mktReqUid=' +
      new Date().getTime() +
      Ext.id(null, ':') +
      '&cadUserId=' +
      id +
      '&cadIsUser=true' +
      '&xsrfId=' +
      MktSecurity.getXsrfId(),
    'POST',
    true,
    'json',
    function (response) {
      console.log('Deleted User')
    }
  )
}

/**************************************************************************************
 *  This function deletes multiple given users.
 *  @param [Array of {Object}] users - the users' information
 *          (required) userId
 **************************************************************************************/

ADMIN.deleteUsers = function (users) {
  console.log('Getting User IDs to Delete ...')
  LIB.webRequest('/custAdmin/getAllUsers', 'xsrfId=' + MktSecurity.getXsrfId(), 'POST', true, 'json', function (response) {
    let result = JSON.parse(response).data,
      num = 0

    for (let ii = 0; ii < result.length; ii++) {
      let userId = result[ii].userid

      for (let jj = 0; jj < users.length; jj++) {
        if (userId == users[jj].userId.replace('%2B', '+')) {
          let {id} = result[ii],
            {name} = result[ii]
          num++
          console.log('Deleting User (' + num + '/' + users.length + '): ' + userId + ', ' + name)
          ADMIN.deleteUser(id)
          break
        }
      }
    }
    console.log('Finished Sending Delete User Requests')
  })
}

/**************************************************************************************
 *  This function deletes users who have been inactive for more than the given number
 *  of days.
 *  @param {Integer} maxDaysSinceLastLogin - max days since last login, greater than
 *   which the user will be deleted
 **************************************************************************************/

ADMIN.deleteInactiveUsers = function (maxDaysSinceLastLogin) {
  console.log('Getting Inactive Users to Delete ...')
  LIB.webRequest('/custAdmin/getAllUsers', 'xsrfId=' + MktSecurity.getXsrfId(), 'POST', true, 'json', function (response) {
    let result = JSON.parse(response).data

    for (let ii = 0; ii < result.length; ii++) {
      let {lastLogin} = result[ii],
        daysSinceLastLogin = ADMIN.dateDiffInDays(new Date(lastLogin), new Date())

      if (daysSinceLastLogin > maxDaysSinceLastLogin) {
        let {id} = result[ii],
          userId = result[ii].userid,
          {name} = result[ii]
        console.log('Deleting User: ' + userId + ', ' + name + ', ' + daysSinceLastLogin + ' days since last login')
        ADMIN.deleteUser(id)
      }
    }
    console.log('Finished Sending Delete User Requests')
  })
}

/**************************************************************************************
 *  Main
 **************************************************************************************/

let toggleState = LIB.getCookie('toggleState'),
  origMenuShowAtFunc,
  accountString

LIB.validateDemoExtensionCheck(true)

// This check ensures that an admin can login and test the extension as a normal user.
if (toggleState == 'false') {
  console.log('Marketo App Admin > User: Admin is now a normal user')
  LIB.loadScript(LIB.MARKETO_LIVE_APP)
} else {
  LIB.applyMassClone(ADMIN)
}

let isMktPageAppAdmin = window.setInterval(function () {
  if (LIB.isPropOfWindowObj('MktPage.savedState.custPrefix') &&
    MktPage.savedState.custPrefix != ''
  ) {
    console.log('Marketo App Admin > Location: Marketo Page')
    window.clearInterval(isMktPageAppAdmin)

    accountString = MktPage.savedState.custPrefix
    ADMIN.setInstanceInfo(accountString)
  }
}, 0)
