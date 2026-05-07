<!-- src/App.vue -->
<template>
  <div id="app">
    <!-- 頂部導覽列 -->
    <header class="navbar">
      <h1>🍱 美味點餐系統</h1>
      <button class="cart-btn" @click="showCart = !showCart">
        🛒 購物車
        <span class="badge" v-if="cartCount > 0">{{ cartCount }}</span>
      </button>
    </header>

    <!-- 分類標籤 -->
    <div class="category-tabs">
      <button 
        v-for="cat in categories" 
        :key="cat"
        :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- 菜單區域 -->
    <main class="menu-grid">
      <MenuCard
        v-for="item in filteredMenu"
        :key="item.id"
        :item="item"
        @add-to-cart="addToCart"
      />
    </main>

    <!-- 購物車側欄 -->
    <CartPanel
      v-if="showCart"
      :cart="cart"
      @update-quantity="updateQuantity"
      @remove-item="removeItem"
      @submit-order="submitOrder"
      @close="showCart = false"
    />

    <!-- 載入中遮罩 -->
    <div class="loading-overlay" v-if="isLoading">
      <div class="spinner">⏳ 載入中...</div>
    </div>
  </div>
</template>

<script setup>


import { menuApi, orderApi } from './services/api'
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import MenuCard from './components/MenuCard.vue'
import CartPanel from './components/CartPanel.vue'

// ── 設定 Google Apps Script URL ──
const API_URL = 'https://script.google.com/macros/s/AKfycbweRScKFiWpxxOj244acYV-SzIx2VUCQ6-6_8TTU01b8bACKhvHjGHtEM5ICJInRJNLyA/exec'

// ── 響應式狀態 ──
const menu = ref([])
const cart = ref([])
const activeCategory = ref('全部')
const showCart = ref(false)
const isLoading = ref(false)

// ── 計算屬性 ──
const categories = computed(() => {
  if (!menu.value || menu.value.length === 0) return ['全部']
  const cats = [...new Set(menu.value.map(i => i.category))]
  return ['全部', ...cats]
})

const filteredMenu = computed(() => {
  if (activeCategory.value === '全部') return menu.value
  return menu.value.filter(i => i.category === activeCategory.value)
})

const cartCount = computed(() => 
  cart.value.reduce((sum, item) => sum + item.quantity, 0)
)

// ── 方法 ──
async function fetchMenu() {
  isLoading.value = true
  try {
    const res = await axios.get(`${API_URL}?action=getMenu`)
    menu.value = res.data.data || []
  } catch (err) {
    menu.value = [] 
    alert('讀取菜單失敗，請稍後再試')
  } finally {
    isLoading.value = false
  }
}

function addToCart(item) {
  const existing = cart.value.find(i => i.id === item.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ ...item, quantity: 1 })
  }
  // 加入動畫提示
  showAddAnimation(item.name)
}

function updateQuantity(itemId, delta) {
  const item = cart.value.find(i => i.id === itemId)
  if (item) {
    item.quantity += delta
    if (item.quantity <= 0) removeItem(itemId)
  }
}

function removeItem(itemId) {
  cart.value = cart.value.filter(i => i.id !== itemId)
}

async function submitOrder(orderInfo) {
  const total = cart.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const order = {
    ...orderInfo,
    items: cart.value,
    total
  }
  
  isLoading.value = true
  try {
    const res = await axios.post(API_URL, { action: 'submitOrder', order })
    alert(`✅ ${res.data.message}\n訂單編號：${res.data.orderId}`)
    cart.value = []
    showCart.value = false
  } catch (err) {
    alert('訂單送出失敗，請再試一次')
  } finally {
    isLoading.value = false
  }
}

function showAddAnimation(name) {
  // 簡單的 toast 提示
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = `✅ 已加入「${name}」`
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2000)
}

onMounted(fetchMenu)
</script>
