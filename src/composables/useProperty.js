import { ref } from 'vue'

export function useProperty() {
    const regions = ref([])
    const properties = ref([])
    const folderImages = ref([]) // 💡 新增：存放當前彈出視窗（Modal）要顯示的所有圖片

    const regionsLoading = ref(true)
    const propertiesLoading = ref(false)
    const folderImagesLoading = ref(false) // 💡 新增：詳細圖片的載入狀態
    const error = ref(null)

    // 🚀 正式版 Vercel 後端 API 根網址
    const baseUrl = 'https://agent-pro-backend.vercel.app/api'

    // 💡 1. 頁面初始化時調用：只抓取有哪些行政區分頁 (Tabs 選單)
    const fetchRegions = async () => {
        regionsLoading.value = true
        error.value = null
        try {
            const res = await fetch(`${baseUrl}/regions`)
            if (!res.ok) throw new Error('後端 API 伺服器回應異常')

            const data = await res.json()
            regions.value = data
        } catch (err) {
            console.error('抓取雲端區域清單失敗:', err)
            error.value = '無法載入區域清單，請聯絡管理員確認系統狀態'
        } finally {
            regionsLoading.value = false
        }
    }

    // 💡 2. 使用者點擊 Tab 時調用：根據傳入的行政區名稱，精準抓取該區房屋與照片
    const fetchPropertiesByRegion = async (regionName) => {
        propertiesLoading.value = true
        error.value = null
        properties.value = [] // 切換區域時先清空舊資料，避免畫面閃爍錯覺
        try {
            const res = await fetch(`${baseUrl}/properties?region=${encodeURIComponent(regionName)}`)
            if (!res.ok) throw new Error(`無法取得 ${regionName} 的房屋資料`)

            const data = await res.json()
            properties.value = data
        } catch (err) {
            console.error(`抓取 ${regionName} 房屋物件失敗:`, err)
            error.value = `無法載入 ${regionName} 的即時屋況資料，請重新嘗試`
        } finally {
            propertiesLoading.value = false
        }
    }

    // 💡 3. 新增功能：點擊物件詳細視窗時調用，傳入資料夾網址獲取該房間全部圖片
    const fetchFolderImages = async (folderUrl) => {
        if (!folderUrl) {
            folderImages.value = []
            return
        }

        folderImagesLoading.value = true
        error.value = null
        folderImages.value = [] // 讀取前先清空上一個房間的舊圖片
        try {
            // 將整串 Google Drive 資料夾網址作為 Query String 傳給後端
            const res = await fetch(`${baseUrl}/folder-images?folderUrl=${encodeURIComponent(folderUrl)}`)
            if (!res.ok) throw new Error('無法讀取該資料夾的詳細圖片')

            const data = await res.json()
            // 後端回傳格式為 [{ id, name, mimeType, url }, ...]，我們提取 url 塞給前端畫面
            folderImages.value = data.map(img => img.url)
        } catch (err) {
            console.error('抓取資料夾全部圖片失敗:', err)
            // 這裡不破壞大頁面的 error，僅在 console 記錄，詳細視窗內可以做防禦
            folderImages.value = []
        } finally {
            folderImagesLoading.value = false
        }
    }

    return {
        regions,
        properties,
        folderImages,
        regionsLoading,
        propertiesLoading,
        folderImagesLoading,
        error,
        fetchRegions,
        fetchPropertiesByRegion,
        fetchFolderImages
    }
}