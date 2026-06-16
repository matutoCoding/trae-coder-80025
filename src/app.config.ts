export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/myticket/index',
    'pages/approval/index',
    'pages/reminder/index',
    'pages/ticket-detail/index',
    'pages/approval-detail/index',
    'pages/business-list/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E5CBF',
    navigationBarTitleText: '政务取号办事大厅',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F0F5FF'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E5CBF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '取号大厅'
      },
      {
        pagePath: 'pages/myticket/index',
        text: '我的号码'
      },
      {
        pagePath: 'pages/approval/index',
        text: '审批中心'
      },
      {
        pagePath: 'pages/reminder/index',
        text: '催办管理'
      }
    ]
  }
})
