// ==================== Supabase 配置 ====================
// 请替换为你的 Supabase 项目配置
const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

// ==================== 初始化追踪器 ====================
let tracker = null

// 页面加载时初始化
if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    tracker = initTracker(SUPABASE_URL, SUPABASE_ANON_KEY)
} else {
    console.warn('⚠️ 请配置 Supabase 凭证以启用追踪功能')
}

// ==================== 追踪辅助函数 ====================
async function trackButtonClick(buttonName, buttonType, targetUrl = '') {
    if (!tracker) {
        console.warn('⚠️ 追踪器未初始化')
        return
    }
    
    try {
        await tracker.trackClick(buttonName, buttonType, targetUrl)
    } catch (error) {
        console.error('❌ 点击追踪失败:', error)
    }
}

// ==================== 按钮事件监听 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 获取所有 CTA 按钮
    const ctaButtons = document.querySelectorAll('.cta-btn')
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const buttonType = button.dataset.button
            let buttonName = ''
            let targetUrl = ''
            
            // 根据按钮类型设置名称和目标
            switch(buttonType) {
                case 'whatsapp':
                    buttonName = 'WhatsApp'
                    targetUrl = 'https://wa.me/8613620293913'
                    window.open(targetUrl, '_blank')
                    break
                case 'line':
                    buttonName = 'LINE联系'
                    targetUrl = 'https://line.me/ti/p/4-vC2EBDF_'
                    window.open(targetUrl, '_blank')
                    break
                case 'wechat':
                    buttonName = '微信咨询'
                    targetUrl = 'https://work.weixin.qq.com/ca/cawcde7e9382f95e9d'
                    window.open(targetUrl, '_blank')
                    break
                case 'demo':
                    buttonName = '预约演示'
                    targetUrl = '/demo-booking'
                    showContactModal('预约演示', '填写表单预约')
                    break
            }
            
            // 追踪点击
            await trackButtonClick(buttonName, buttonType, targetUrl)
            
            // 添加视觉反馈
            button.style.transform = 'scale(0.95)'
            setTimeout(() => {
                button.style.transform = ''
            }, 150)
        })
    })
    
    // 追踪痛点卡片点击
    const painCards = document.querySelectorAll('.pain-card')
    painCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            const painTitle = card.querySelector('h3').textContent
            trackButtonClick(`痛点卡片-${painTitle}`, 'pain-card', '')
        })
    })
    
    // 追踪功能项点击
    const featureItems = document.querySelectorAll('.feature-item')
    featureItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const featureTitle = item.querySelector('h3').textContent
            trackButtonClick(`功能项-${featureTitle}`, 'feature-item', '')
        })
    })
})

// ==================== 联系方式弹窗 ====================
function showContactModal(type, info) {
    // 创建弹窗
    const modal = document.createElement('div')
    modal.className = 'contact-modal'
    modal.innerHTML = `
        <div class="modal-content glass-effect">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            <h3 class="gradient-text">${type}</h3>
            <p class="modal-info">${info}</p>
            <button class="modal-btn ripple-btn primary-btn" onclick="this.parentElement.parentElement.remove()">
                知道了
            </button>
        </div>
    `
    
    document.body.appendChild(modal)
    
    // 添加样式（如果还没有）
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style')
        style.id = 'modal-styles'
        style.textContent = `
            .contact-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .modal-content {
                max-width: 90%;
                width: 400px;
                padding: 32px;
                text-align: center;
                position: relative;
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .modal-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 24px;
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-primary);
            }
            
            .modal-content h3 {
                font-size: 28px;
                margin-bottom: 16px;
            }
            
            .modal-info {
                font-size: 18px;
                color: var(--text-secondary);
                margin-bottom: 24px;
                padding: 16px;
                background: rgba(0, 255, 136, 0.1);
                border-radius: 12px;
                border: 1px solid rgba(0, 255, 136, 0.2);
            }
            
            .modal-btn {
                width: 100%;
                padding: 16px;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
            }
        `
        document.head.appendChild(style)
    }
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove()
        }
    })
}

// ==================== 平滑滚动 ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute('href'))
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })
        }
    })
})

// ==================== 滚动动画 ====================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
        }
    })
}, observerOptions)

// 观察需要动画的元素
document.querySelectorAll('.pain-card, .feature-item, .cta-btn').forEach(el => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(30px)'
    el.style.transition = 'all 0.6s ease'
    observer.observe(el)
})

// ==================== 页面加载追踪 ====================
window.addEventListener('load', () => {
    if (tracker) {
        tracker.trackPageView()
    }
})

// ==================== 页面停留时间追踪 ====================
let startTime = Date.now()

window.addEventListener('beforeunload', () => {
    if (tracker) {
        const duration = Math.round((Date.now() - startTime) / 1000)
        tracker.trackDuration(duration)
    }
})

// ==================== 滚动深度追踪 ====================
let maxScrollDepth = 0
const scrollMilestones = { 25: false, 50: false, 75: false, 100: false }

window.addEventListener('scroll', () => {
    if (!tracker) return
    
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollDepth = Math.round((window.scrollY / scrollHeight) * 100)
    
    if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth
        
        // 每 25% 追踪一次（只追踪一次）
        if (scrollDepth >= 25 && !scrollMilestones[25]) {
            scrollMilestones[25] = true
            tracker.trackScrollDepth(25)
        } else if (scrollDepth >= 50 && !scrollMilestones[50]) {
            scrollMilestones[50] = true
            tracker.trackScrollDepth(50)
        } else if (scrollDepth >= 75 && !scrollMilestones[75]) {
            scrollMilestones[75] = true
            tracker.trackScrollDepth(75)
        } else if (scrollDepth >= 100 && !scrollMilestones[100]) {
            scrollMilestones[100] = true
            tracker.trackScrollDepth(100)
        }
    }
})

console.log('🚀 落地页已加载完成')
console.log('💡 提示：请在 script.js 中配置你的 Supabase 凭证')
