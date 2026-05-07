// src/services/api.js

const API_URL = import.meta.env.VITE_API_URL

export const menuApi = {
  async getMenu() {
    const res = await fetch(`${API_URL}?action=getMenu`)
    const data = await res.json()
    return data.data || []
  }
}

export const orderApi = {
  async submitOrder(orderData) {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'submitOrder', order: orderData })
      // 不加 Content-Type header → 不觸發 CORS 預檢
    })
    const data = await res.json()
    return data
  }
}