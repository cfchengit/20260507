// src/services/api.js

const APPS_SCRIPT_URL = import.meta.env.VITE_API_URL

export const menuApi = {
  async getMenu() {
    // ↓ 這裡應該是 /20260507/menu.json，不是 Apps Script URL
    const res = await fetch('/20260507/menu.json')
    return await res.json()
  }
}

export const orderApi = {
  async submitOrder(orderData) {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'submitOrder', order: orderData })
    })
    return await res.json()
  }
}