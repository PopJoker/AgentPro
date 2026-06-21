import { createRouter, createWebHashHistory } from 'vue-router'

// 1. 引入組件
import PropertyListView from './views/PropertyListView.vue'
import AboutView from './views/AboutView.vue' // 💡 引入剛剛新增的房仲詳情頁

// 2. 定義路由地圖
const routes = [
    {
        path: '/',
        name: 'property-list',
        component: PropertyListView, // 首頁顯示物件列表
        meta: { title: '小陳精選代管物件' }
    },
    {
        path: '/about',
        name: 'about',
        component: AboutView, // 💡 房仲詳情頁
        meta: { title: '關於小陳代管' }
    },
    // 萬用路由：租客如果亂打網址，自動導回物件首頁
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

// 3. 建立路由實例
const router = createRouter({
    history: createWebHashHistory(),
    routes
})

// 4. 切換頁面時自動更新網頁分頁標題
// 4. 切換頁面時自動更新網頁分頁標題（優化彈窗分享時的標題表現）
router.afterEach((to) => {
    const region = to.query.region
    const propertyId = to.query.id

    if (propertyId) {
        // 如果網址有物件識別碼，將「地址」部分拆出來當作標題（去除房號避免太長）
        const address = propertyId.split('-')[0]
        document.title = `${address} | 小陳精選代管`
    } else if (region) {
        const cleanRegion = region.endsWith('區') ? region : `${region}區`
        document.title = `${cleanRegion}物件 | 小陳精選代管`
    } else {
        document.title = to.meta.title ? `${to.meta.title} | Agent Pro` : 'Agent Pro 租屋房仲助手'
    }
})

export default router