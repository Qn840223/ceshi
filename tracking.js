// ==================== 用户行为追踪系统 ====================
// 智能追踪用户行为并异步上报到 Supabase

class UserTracker {
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl
        this.supabaseKey = supabaseKey
        this.sessionId = this.generateSessionId()
        this.userInfo = this.collectUserInfo()
        this.queue = []
        this.isProcessing = false
        
        console.log('🎯 用户追踪系统已初始化')
    }

    // ==================== 生成会话 ID ====================
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // ==================== 收集用户基础信息 ====================
    collectUserInfo() {
        const ua = navigator.userAgent
        
        return {
            // 设备信息
            deviceType: this.detectDeviceType(ua),
            browser: this.detectBrowser(ua),
            browserVersion: this.detectBrowserVersion(ua),
            os: this.detectOS(ua),
            osVersion: this.detectOSVersion(ua),
            
            // 屏幕信息
            screenResolution: `${screen.width}x${screen.height}`,
            screenWidth: screen.width,
            screenHeight: screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1,
            
            // 语言和时区
            language: navigator.language || navigator.userLanguage,
            languages: navigator.languages ? navigator.languages.join(',') : '',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            
            // 连接信息
            connectionType: this.getConnectionType(),
            
            // 原始 UA
            userAgent: ua
        }
    }

    // ==================== 设备类型检测 ====================
    detectDeviceType(ua) {
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet'
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile'
        }
        return 'desktop'
    }

    // ==================== 浏览器检测 ====================
    detectBrowser(ua) {
        if (ua.includes('Edg/')) return 'Edge'
        if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome'
        if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari'
        if (ua.includes('Firefox/')) return 'Firefox'
        if (ua.includes('MSIE') || ua.includes('Trident/')) return 'IE'
        if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera'
        return 'Unknown'
    }

    // ==================== 浏览器版本检测 ====================
    detectBrowserVersion(ua) {
        const browser = this.detectBrowser(ua)
        let match
        
        switch(browser) {
            case 'Chrome':
                match = ua.match(/Chrome\/(\d+)/)
                break
            case 'Safari':
                match = ua.match(/Version\/(\d+)/)
                break
            case 'Firefox':
                match = ua.match(/Firefox\/(\d+)/)
                break
            case 'Edge':
                match = ua.match(/Edg\/(\d+)/)
                break
            case 'Opera':
                match = ua.match(/OPR\/(\d+)/)
                break
        }
        
        return match ? match[1] : 'Unknown'
    }

    // ==================== 操作系统检测 ====================
    detectOS(ua) {
        if (ua.includes('Windows NT 10.0')) return 'Windows 10'
        if (ua.includes('Windows NT 6.3')) return 'Windows 8.1'
        if (ua.includes('Windows NT 6.2')) return 'Windows 8'
        if (ua.includes('Windows NT 6.1')) return 'Windows 7'
        if (ua.includes('Windows')) return 'Windows'
        if (ua.includes('Mac OS X')) return 'macOS'
        if (ua.includes('Android')) return 'Android'
        if (ua.includes('Linux')) return 'Linux'
        if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
        return 'Unknown'
    }

    // ==================== 操作系统版本检测 ====================
    detectOSVersion(ua) {
        let match
        
        if (ua.includes('Windows NT')) {
            match = ua.match(/Windows NT ([\d.]+)/)
        } else if (ua.includes('Mac OS X')) {
            match = ua.match(/Mac OS X ([\d_]+)/)
            if (match) return match[1].replace(/_/g, '.')
        } else if (ua.includes('Android')) {
            match = ua.match(/Android ([\d.]+)/)
        } else if (ua.includes('iPhone OS') || ua.includes('CPU OS')) {
            match = ua.match(/OS ([\d_]+)/)
            if (match) return match[1].replace(/_/g, '.')
        }
        
        return match ? match[1] : 'Unknown'
    }

    // ==================== 网络连接类型 ====================
    getConnectionType() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
        if (connection) {
            return connection.effectiveType || connection.type || 'unknown'
        }
        return 'unknown'
    }

    // ==================== 智能来源分析 ====================
    analyzeSource() {
        const urlParams = new URLSearchParams(window.location.search)
        const referrer = document.referrer
        
        // 1. 优先识别 UTM 参数
        const utmSource = urlParams.get('utm_source')
        const utmMedium = urlParams.get('utm_medium')
        const utmCampaign = urlParams.get('utm_campaign')
        const utmTerm = urlParams.get('utm_term')
        const utmContent = urlParams.get('utm_content')
        
        if (utmSource) {
            return {
                source: utmSource,
                medium: utmMedium || 'unknown',
                campaign: utmCampaign || 'unknown',
                term: utmTerm || null,
                content: utmContent || null,
                referrer: referrer || null,
                sourceType: 'utm',
                fullUrl: window.location.href
            }
        }
        
        // 2. 分析 referrer 域名
        if (referrer) {
            try {
                const referrerUrl = new URL(referrer)
                const referrerDomain = referrerUrl.hostname
                const currentDomain = window.location.hostname
                
                // 判断是否为外部来源
                if (referrerDomain !== currentDomain) {
                    const sourceInfo = this.identifyReferrerSource(referrerDomain)
                    return {
                        source: sourceInfo.source,
                        medium: sourceInfo.medium,
                        campaign: 'organic',
                        term: null,
                        content: null,
                        referrer: referrer,
                        sourceType: 'referrer',
                        fullUrl: window.location.href
                    }
                } else {
                    // 内部跳转
                    return {
                        source: 'internal',
                        medium: 'referral',
                        campaign: 'internal',
                        term: null,
                        content: null,
                        referrer: referrer,
                        sourceType: 'internal',
                        fullUrl: window.location.href
                    }
                }
            } catch (e) {
                console.warn('Referrer 解析失败:', e)
            }
        }
        
        // 3. 直接访问
        return {
            source: 'direct',
            medium: 'none',
            campaign: 'direct',
            term: null,
            content: null,
            referrer: null,
            sourceType: 'direct',
            fullUrl: window.location.href
        }
    }

    // ==================== 识别 Referrer 来源 ====================
    identifyReferrerSource(domain) {
        // 搜索引擎
        const searchEngines = {
            'google': { source: 'google', medium: 'organic' },
            'baidu': { source: 'baidu', medium: 'organic' },
            'bing': { source: 'bing', medium: 'organic' },
            'yahoo': { source: 'yahoo', medium: 'organic' },
            'sogou': { source: 'sogou', medium: 'organic' },
            'so.com': { source: '360', medium: 'organic' },
            'yandex': { source: 'yandex', medium: 'organic' }
        }
        
        for (const [key, value] of Object.entries(searchEngines)) {
            if (domain.includes(key)) {
                return value
            }
        }
        
        // 社交媒体
        const socialMedia = {
            'facebook': { source: 'facebook', medium: 'social' },
            'twitter': { source: 'twitter', medium: 'social' },
            'linkedin': { source: 'linkedin', medium: 'social' },
            'instagram': { source: 'instagram', medium: 'social' },
            'weibo': { source: 'weibo', medium: 'social' },
            'wechat': { source: 'wechat', medium: 'social' },
            'qq.com': { source: 'qq', medium: 'social' },
            'douyin': { source: 'douyin', medium: 'social' },
            'xiaohongshu': { source: 'xiaohongshu', medium: 'social' }
        }
        
        for (const [key, value] of Object.entries(socialMedia)) {
            if (domain.includes(key)) {
                return value
            }
        }
        
        // 其他外部来源
        return {
            source: domain,
            medium: 'referral'
        }
    }

    // ==================== 追踪点击事件 ====================
    async trackClick(buttonName, buttonType, targetUrl = '') {
        const sourceInfo = this.analyzeSource()
        
        const clickData = {
            // 会话信息
            session_id: this.sessionId,
            
            // 按钮信息
            button_name: buttonName,
            button_type: buttonType,
            target_url: targetUrl,
            
            // 页面信息
            page_url: window.location.href,
            page_path: window.location.pathname,
            page_title: document.title,
            
            // 来源信息
            referrer: sourceInfo.referrer,
            utm_source: sourceInfo.source,
            utm_medium: sourceInfo.medium,
            utm_campaign: sourceInfo.campaign,
            utm_term: sourceInfo.term,
            utm_content: sourceInfo.content,
            source_type: sourceInfo.sourceType,
            
            // 设备信息
            user_agent: this.userInfo.userAgent,
            device_type: this.userInfo.deviceType,
            browser: this.userInfo.browser,
            browser_version: this.userInfo.browserVersion,
            os: this.userInfo.os,
            os_version: this.userInfo.osVersion,
            
            // 屏幕信息
            screen_resolution: this.userInfo.screenResolution,
            screen_width: this.userInfo.screenWidth,
            screen_height: this.userInfo.screenHeight,
            viewport_width: this.userInfo.viewportWidth,
            viewport_height: this.userInfo.viewportHeight,
            pixel_ratio: this.userInfo.pixelRatio,
            
            // 其他信息
            language: this.userInfo.language,
            timezone: this.userInfo.timezone,
            connection_type: this.userInfo.connectionType,
            
            // 时间戳
            clicked_at: new Date().toISOString()
        }
        
        // 添加到队列并异步处理
        this.addToQueue(clickData)
    }

    // ==================== 添加到队列 ====================
    addToQueue(data) {
        this.queue.push(data)
        
        // 如果队列不在处理中，立即处理
        if (!this.isProcessing) {
            this.processQueue()
        }
    }

    // ==================== 处理队列（异步批量上报）====================
    async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false
            return
        }
        
        this.isProcessing = true
        
        // 取出队列中的所有数据
        const batch = [...this.queue]
        this.queue = []
        
        try {
            // 异步发送到 Supabase
            await this.sendToSupabase(batch)
            console.log(`✅ 成功上报 ${batch.length} 条追踪数据`)
        } catch (error) {
            console.error('❌ 数据上报失败:', error)
            
            // 失败的数据重新加入队列（最多重试3次）
            batch.forEach(item => {
                item._retryCount = (item._retryCount || 0) + 1
                if (item._retryCount < 3) {
                    this.queue.push(item)
                }
            })
        }
        
        // 继续处理队列
        setTimeout(() => this.processQueue(), 100)
    }

    // ==================== 发送到 Supabase ====================
    async sendToSupabase(data) {
        const url = `${this.supabaseUrl}/rest/v1/button_clicks`
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.supabaseKey,
                'Authorization': `Bearer ${this.supabaseKey}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        })
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return response
    }

    // ==================== 追踪页面浏览 ====================
    trackPageView() {
        this.trackClick('页面浏览', 'page-view', window.location.href)
    }

    // ==================== 追踪滚动深度 ====================
    trackScrollDepth(depth) {
        this.trackClick(`滚动深度-${depth}%`, 'scroll-depth', '')
    }

    // ==================== 追踪页面停留时间 ====================
    trackDuration(seconds) {
        this.trackClick(`页面停留-${seconds}秒`, 'page-duration', '')
    }

    // ==================== 追踪自定义事件 ====================
    trackEvent(eventName, eventType = 'custom', metadata = {}) {
        this.trackClick(eventName, eventType, JSON.stringify(metadata))
    }
}

// ==================== 导出单例 ====================
let trackerInstance = null

function initTracker(supabaseUrl, supabaseKey) {
    if (!trackerInstance) {
        trackerInstance = new UserTracker(supabaseUrl, supabaseKey)
    }
    return trackerInstance
}

function getTracker() {
    if (!trackerInstance) {
        console.warn('⚠️ 追踪器未初始化，请先调用 initTracker()')
    }
    return trackerInstance
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserTracker, initTracker, getTracker }
}
