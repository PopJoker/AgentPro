import { ref, computed } from 'vue'

const STORAGE_KEY = 'agent_pro_rent_notes'
const WORKER_URL = "https://agent-pro-ai-worker.popjoker.workers.dev";

export function useStorage() {
    const notes = ref([])

    // 載入資料
    const loadNotes = () => {
        const localData = localStorage.getItem(STORAGE_KEY)
        if (localData) {
            try {
                notes.value = JSON.parse(localData)
            } catch (e) {
                console.error('解析 LocalStorage 失敗，重新初始化', e)
                notes.value = []
            }
        } else {
            notes.value = getMockData()
            saveNotes()
        }
    }

    // 儲存資料
    const saveNotes = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value))
    }

    // 3. 新增場勘筆記 (加上 station 欄位支援)
    const addNote = (rawNote) => {
        const newNote = {
            id: 'note_' + Date.now(),
            title: rawNote.title || '未命名房源',
            address: rawNote.address || '',
            rent: Number(rawNote.rent) || 0,
            deposit: Number(rawNote.deposit) || 0,
            management_fee: Number(rawNote.management_fee) || 0,
            source_url: rawNote.source_url || '',
            raw_text: rawNote.raw_text || '',

            // 🌟 修正點 1：允許將算好的最近站點時間存入根節點
            closest_station_minutes: rawNote.closest_station_minutes !== undefined ? Number(rawNote.closest_station_minutes) : 5,

            // 狀態：'available' / 'scheduled' / 'reserved'
            status: rawNote.status || 'available',

            appointments: rawNote.appointments || [],

            reserved_customer: rawNote.reserved_customer || null,

            ai_analysis: {
                summary: rawNote.ai_analysis?.summary || '暫無 AI 摘要',
                pros: rawNote.ai_analysis?.pros || [],
                cons: rawNote.ai_analysis?.cons || [],
                traffic_info: rawNote.ai_analysis?.traffic_info || '',
                hidden_costs: rawNote.ai_analysis?.hidden_costs || []
            },

            // 🌟 修正點 2：如果傳進來的房源自帶 extraOpts（例如包含 stationDuration），也一併打包存下
            extraOpts: {
                estimatedUtility: rawNote.extraOpts?.estimatedUtility ?? 1000,
                sharePeople: rawNote.extraOpts?.sharePeople ?? 1,
                subsidyPeople: rawNote.extraOpts?.subsidyPeople ?? 1
            },

            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        notes.value.unshift(newNote)
        saveNotes()
        return newNote
    }

    // 4. 更新單一筆記 (包含多組預約與單一預定邏輯處理)
    const updateNote = (id, updatedFields) => {
        const index = notes.value.findIndex(note => note.id === id)
        if (index === -1) return

        const currentNote = notes.value[index]

        // 處理狀態切換時的防呆防爆連動
        let nextStatus = updatedFields.status || currentNote.status
        let nextReservedCustomer = updatedFields.reserved_customer !== undefined
            ? updatedFields.reserved_customer
            : currentNote.reserved_customer

        // 防呆：如果切回待處理，清除預定名單（但保留預約看房紀錄當作歷史軌跡）
        if (nextStatus === 'available') {
            nextReservedCustomer = null
        }
        // 防呆：如果直接切到已預定，但沒指定是誰，且預約清單只有一人，就貼心地自動帶入那個人
        if (nextStatus === 'reserved' && !nextReservedCustomer && currentNote.appointments.length === 1) {
            nextReservedCustomer = { ...currentNote.appointments[0] }
        }

        notes.value[index] = {
            ...currentNote,
            ...updatedFields,
            status: nextStatus,
            reserved_customer: nextReservedCustomer,
            updated_at: new Date().toISOString()
        }
        saveNotes()
    }

    // 5. 新增/修改某一筆預約聯絡人
    const saveAppointment = (noteId, appointmentData) => {
        const note = notes.value.find(n => n.id === noteId)
        if (!note) return

        let updatedAppointments = [...note.appointments]

        if (appointmentData.id) {
            // 修改現有預約
            const appIndex = updatedAppointments.findIndex(a => a.id === appointmentData.id)
            if (appIndex !== -1) {
                updatedAppointments[appIndex] = { ...updatedAppointments[appIndex], ...appointmentData }
            }
        } else {
            // 新增預約
            updatedAppointments.push({
                id: 'app_' + Date.now(),
                name: appointmentData.name || '',
                phone: appointmentData.phone || '',
                appointment_time: appointmentData.appointment_time || '',
                notes: appointmentData.notes || ''
            })
        }

        updateNote(noteId, { appointments: updatedAppointments })
    }

    // 6. 刪除某一筆預約看房紀錄
    const deleteAppointment = (noteId, appointmentId) => {
        const note = notes.value.find(n => n.id === noteId)
        if (!note) return
        const updatedAppointments = note.appointments.filter(a => a.id !== appointmentId)
        updateNote(noteId, { appointments: updatedAppointments })
    }

    // 7. 刪除筆記
    const deleteNote = (id) => {
        notes.value = notes.value.filter(note => note.id !== id)
        saveNotes()
    }

    const getNoteById = (id) => {
        return notes.value.find(note => note.id === id)
    }

    // ─── UI 篩選快取 (Computed) ───
    const availableNotes = computed(() => notes.value.filter(note => note.status === 'available' || !note.status))
    const scheduledNotes = computed(() => notes.value.filter(note => note.status === 'scheduled'))
    const reservedNotes = computed(() => notes.value.filter(note => note.status === 'reserved'))

    loadNotes()

    return {
        notes,
        availableNotes,
        scheduledNotes,
        reservedNotes,
        addNote,
        updateNote,
        saveAppointment,
        deleteAppointment,
        deleteNote,
        getNoteById,
        saveNotes
    }
}

// ─── 附屬工具：台灣租屋測試假資料 (同步加入預設交通分鐘數) ───
function getMockData() {
    return [
        {
            id: 'note_mock_1',
            title: '近捷運全新採光獨立套房',
            address: '新北市板橋區文化路二段',
            rent: 16500,
            deposit: 33000,
            management_fee: 1200,
            source_url: 'https://rent.591.com.tw/12345',
            raw_text: '板橋精華地段，捷運站走路3分鐘。採光極佳，獨立洗衣機，垃圾集中處理...',
            status: 'scheduled',
            closest_station_minutes: 3,
            extraOpts: { estimatedUtility: 1000, sharePeople: 1, subsidyPeople: 1 },
            appointments: [
                {
                    id: 'app_mock_1',
                    name: '林先生',
                    phone: '0912-345678',
                    appointment_time: '2026-06-21 15:30',
                    notes: '在北車上班的軟體工程師，偏好安靜房源'
                },
                {
                    id: 'app_mock_2',
                    name: '張小姐',
                    phone: '0922-111222',
                    appointment_time: '2026-06-22 19:00',
                    notes: '帶媽媽一起看，注重廚房組'
                }
            ],
            reserved_customer: null,
            ai_analysis: {
                summary: '交通極為便利的精緻套房，適合預算充足的通勤上班族。',
                pros: ['步行至捷運站僅需 3 分鐘', '生活機能極佳，樓下有超商'],
                cons: ['臨主幹道，低樓層可能有車流噪音'],
                traffic_info: '板南線捷運站旁，過橋即達台北市',
                hidden_costs: ['管理費 1200 元/月']
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'note_mock_2',
            title: 'CP值超高大空間分租套房',
            address: '桃園市中壢區大遠百周邊',
            rent: 8500,
            deposit: 17000,
            management_fee: 0,
            source_url: 'https://rent.591.com.tw/67890',
            raw_text: '中壢市區生活圈，空間大，附基本傢俱，電費一度5.5元，爬梯4樓...',
            status: 'reserved',
            closest_station_minutes: 5,
            extraOpts: { estimatedUtility: 1000, sharePeople: 1, subsidyPeople: 1 },
            appointments: [
                {
                    id: 'app_mock_3',
                    name: '王小明',
                    phone: '0933-444555',
                    appointment_time: '2026-06-15 13:00',
                    notes: '嫌樓梯太高，後來沒下定'
                },
                {
                    id: 'app_mock_4',
                    name: '陳小姐',
                    phone: '0987-654321',
                    appointment_time: '2026-06-18 10:00',
                    notes: '當場看了很喜歡，直接付定金'
                }
            ],
            reserved_customer: {
                name: '陳小姐',
                phone: '0987-654321',
                contract_start_date: '2026-07-01',
                notes: '已付定金，預計下個月 1 號正式簽約入住'
            },
            ai_analysis: {
                summary: '空間寬敞且租金親民，但需注意爬樓梯與夏季電費支出。',
                pros: ['租金便宜，空間達 8 坪'],
                cons: ['位於 4 樓無電梯，搬行李較辛苦'],
                traffic_info: '騎車至火車站約 5 分鐘',
                hidden_costs: ['電費每度 5.5 元']
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ]
}