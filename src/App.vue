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
      <div
        class="menu-card"
        v-for="item in filteredMenu"
        :key="item.id"
        @click="addToCart(item)"
      >
        <div class="card-emoji">{{ item.image }}</div>
        <div class="card-body">
          <h3>{{ item.name }}</h3>
          <p class="description">{{ item.description }}</p>
          <div class="card-footer">
            <span class="price">NT$ {{ item.price }}</span>
            <button class="add-btn">+ 加入</button>
          </div>
        </div>
      </div>
    </main>

    <!-- 沒有商品時顯示 -->
    <div class="empty-menu" v-if="!isLoading && filteredMenu.length === 0">
      <p>😢 找不到商品</p>
    </div>

    <!-- 購物車側欄 -->
    <div class="cart-overlay" v-if="showCart" @click.self="showCart = false">
      <div class="cart-panel">
        <div class="cart-header">
          <h2>🛒 我的購物車</h2>
          <button @click="showCart = false">✕</button>
        </div>

        <div v-if="cart.length === 0" class="empty-cart">
          <p>購物車是空的</p>
          <p>快去選購美食吧！🍽️</p>
        </div>

        <div v-else>
          <div class="cart-item" v-for="item in cart" :key="item.id">
            <span class="item-emoji">{{ item.image }}</span>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-price">NT$ {{ item.price }}</span>
            </div>
            <div class="quantity-control">
              <button @click="updateQuantity(item.id, -1)">－</button>
              <span>{{ item.quantity }}</span>
              <button @click="updateQuantity(item.id, 1)">＋</button>
            </div>
            <span class="item-subtotal">NT$ {{ item.price * item.quantity }}</span>
            <button class="remove-btn" @click="removeItem(item.id)">🗑</button>
          </div>

          <div class="cart-total">
            <strong>總計：NT$ {{ total }}</strong>
          </div>

          <div class="order-form">
            <h3>填寫訂購資訊</h3>
            <input v-model="form.customerName" placeholder="姓名 *" />
            <input v-model="form.phone" placeholder="電話 *" type="tel" />
            <textarea v-model="form.note" placeholder="備註（可空白）" rows="2"></textarea>
            <button
              class="submit-btn"
              @click="handleSubmit"
              :disabled="!isFormValid || isLoading"
            >
              {{ isLoading ? '送出中...' : '✅ 確認送出訂單' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 載入中遮罩 -->
    <div class="loading-overlay" v-if="isLoading">
      <div class="spinner">⏳ 載入中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// ── Google Apps Script URL（送出訂單用）──
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbweRScKFiWpxxOj244acYV-SzIx2VUCQ6-6_8TTU01b8bACKhvHjGHtEM5ICJInRJNLyA/exec'

// ── 響應式狀態 ──
const menu = ref([])
const cart = ref([])
const activeCategory = ref('全部')
const showCart = ref(false)
const isLoading = ref(false)
const form = ref({ customerName: '', phone: '', note: '' })

// ── 計算屬性 ──
const categories = computed(() => {
  if (!menu.value || menu.value.length === 0) return ['全部']
  const cats = [...new Set(menu.value.map(i => i.category))]
  return ['全部', ...cats]
})

const filteredMenu = computed(() => {
  if (!menu.value) return []
  if (activeCategory.value === '全部') return menu.value
  return menu.value.filter(i => i.category === activeCategory.value)
})

const cartCount = computed(() =>
  cart.value.reduce((sum, item) => sum + item.quantity, 0)
)

const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const isFormValid = computed(() =>
  form.value.customerName.trim() && form.value.phone.trim()
)

// ── 讀取菜單（從本地 JSON，不打 Apps Script，避免 CORS）──
async function fetchMenu() {
  isLoading.value = true
  try {
    const res = await fetch('./menu.json')
    const data = await res.json()
    menu.value = data || []
  } catch (err) {
    console.error('讀取菜單失敗：', err)
    menu.value = []
    alert('讀取菜單失敗，請重新整理頁面')
  } finally {
    isLoading.value = false
  }
}

// ── 購物車操作 ──
function addToCart(item) {
  const existing = cart.value.find(i => i.id === item.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ ...item, quantity: 1 })
  }
  showToast(`✅ 已加入「${item.name}」`)
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

// ── 送出訂單（用 fetch，不加 Content-Type 避免 CORS 預檢）──
async function handleSubmit() {
  if (!isFormValid.value) return

  const order = {
    customerName: form.value.customerName,
    phone: form.value.phone,
    note: form.value.note,
    items: cart.value,
    total: total.value
  }

  isLoading.value = true
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'submitOrder', order })
      // 不加 Content-Type header → 不觸發 CORS 預檢
    })
    const result = await res.json()
    alert(`✅ ${result.message}\n訂單編號：${result.orderId}`)
    cart.value = []
    form.value = { customerName: '', phone: '', note: '' }
    showCart.value = false
  } catch (err) {
    console.error('訂單送出失敗：', err)
    alert('訂單送出失敗，請再試一次')
  } finally {
    isLoading.value = false
  }
}

// ── Toast 提示 ──
function showToast(message) {
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2000)
}

onMounted(fetchMenu)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans TC', sans-serif;
  background: #f8f5f0;
  color: #333;
}

/* 導覽列 */
.navbar {
  background: #e74c3c;
  color: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.navbar h1 { font-size: 1.4rem; }

.cart-btn {
  background: white;
  color: #e74c3c;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 1rem;
  cursor: pointer;
  position: relative;
  font-weight: bold;
}

.badge {
  background: #2ecc71;
  color: white;
  border-radius: 50%;
  padding: 2px 7px;
  font-size: 0.75rem;
  margin-left: 6px;
}

/* 分類標籤 */
.category-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  background: white;
  overflow-x: auto;
  border-bottom: 1px solid #eee;
}

.category-tabs button {
  padding: 6px 16px;
  border: 2px solid #e74c3c;
  border-radius: 20px;
  background: white;
  color: #e74c3c;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.category-tabs button.active {
  background: #e74c3c;
  color: white;
}

/* 菜單 Grid */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 菜單卡片 */
.menu-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.card-emoji {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 12px;
}

.card-body h3 { font-size: 1.1rem; margin-bottom: 6px; }

.description {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #e74c3c;
}

.add-btn {
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.add-btn:hover { background: #27ae60; }

/* 空狀態 */
.empty-menu {
  text-align: center;
  padding: 60px;
  color: #aaa;
  font-size: 1.2rem;
}

/* 購物車遮罩 */
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 200;
  display: flex;
  justify-content: flex-end;
}

/* 購物車面板 */
.cart-panel {
  background: white;
  width: 380px;
  max-width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-header button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.empty-cart {
  text-align: center;
  color: #aaa;
  padding: 40px 0;
}

/* 購物車品項 */
.cart-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.item-emoji { font-size: 1.5rem; }

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name { font-size: 0.9rem; font-weight: bold; }
.item-price { font-size: 0.8rem; color: #888; }

.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-control button {
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 1rem;
}

.item-subtotal {
  font-weight: bold;
  color: #e74c3c;
  font-size: 0.9rem;
  min-width: 60px;
  text-align: right;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

/* 合計 */
.cart-total {
  text-align: right;
  font-size: 1.2rem;
  color: #e74c3c;
  padding: 12px 0;
  border-top: 2px solid #eee;
}

/* 訂單表單 */
.order-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-form h3 { font-size: 1rem; margin-bottom: 4px; }

.order-form input,
.order-form textarea {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  font-size: 0.95rem;
  width: 100%;
  font-family: inherit;
}

.order-form input:focus,
.order-form textarea:focus {
  outline: none;
  border-color: #e74c3c;
}

.submit-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) { background: #c0392b; }
.submit-btn:disabled { background: #ccc; cursor: not-allowed; }

/* 載入遮罩 */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  font-size: 1.5rem;
}

/* Toast 提示 */
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 0.95rem;
  z-index: 9999;
  animation: fadeInOut 2s ease forwards;
}

@keyframes fadeInOut {
  0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }
  15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
  75%  { opacity: 1; }
  100% { opacity: 0; }
}

/* 響應式 */
@media (max-width: 640px) {
  .menu-grid { padding: 16px; gap: 12px; }
  .cart-panel { width: 100%; }
}
</style>
