import { createRouter, createWebHistory } from 'vue-router'

// 1. 定義路由地圖（將網址路徑對應到對應的 View 組件）
const routes = [
    {
        path: '/',
        name: 'calculator',
        component: () => import('./views/CalculatorView.vue'),
        meta: { title: '租屋適合度計算機' }
    },
    {
        path: '/notes',
        name: 'note-list',
        component: () => import('./views/NoteListView.vue'),
        meta: { title: '場勘筆記列表' }
    },
    {
        path: '/notes/:id',
        name: 'note-detail',
        component: () => import('./views/NoteDetailView.vue'),
        meta: { title: '房源詳細分析' }
    },
    // 萬用路由：打錯網址時自動導回首頁
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

// 2. 建立路由實例
const router = createRouter({
    history: createWebHistory(),
    routes
})

// 3. 額外小優化：切換頁面時自動更新網頁分頁標題 (Tab Title)
router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} | Agent Pro` : 'Agent Pro 租屋房仲助手'
})

export default router