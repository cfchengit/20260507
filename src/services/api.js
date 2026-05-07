// src/services/api.js

const APPS_SCRIPT_URL = import.meta.env.VITE_API_URL

export const menuApi = {
  async getMenu() {
    // ✅ 讀本地 JSON，完全不碰 Apps Script，零 CORS 問題
    const res = await fetch('/20260507/menu.json')
    const data = await res.json()
    return data
  }
}

export const orderApi = {
  async submitOrder(orderData) {
    // ✅ POST 不加 Content-Type → 簡單請求 → 不觸發預檢
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'submitOrder', order: orderData })
    })
    return await res.json()
  }
}