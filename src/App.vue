<template>
  <div id="app">
    <!-- 頂部導覽列 -->
    <header class="navbar">
      <h1>🍱 美味點餐系統</h1>
      <button class="cart-btn" @click="showCart = !showCart">
        🛒 購物車
        <Transition name="badge-pop">
          <span class="badge" v-if="cartCount > 0" :key="cartCount">{{ cartCount }}</span>
        </Transition>
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
 
    <!-- 菜單區域：TransitionGroup 讓切換分類時有動畫 -->
    <main class="menu-grid">
      <TransitionGroup name="menu-card" tag="div" class="menu-inner-grid">
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
      </TransitionGroup>
    </main>
 
    <!-- 沒有商品時顯示 -->
    <Transition name="fade">
      <div class="empty-menu" v-if="!isLoading && filteredMenu.length === 0">
        <p>😢 找不到商品</p>
      </div>
    </Transition>
 
    <!-- 購物車側欄：Transition 讓面板滑入滑出 -->
    <Transition name="cart-slide">
      <div class="cart-overlay" v-if="showCart" @click.self="showCart = false">
        <div class="cart-panel">
          <div class="cart-header">
            <h2>🛒 我的購物車</h2>
            <button @click="showCart = false">✕</button>
          </div>
 
          <!-- 空購物車提示 -->
          <Transition name="fade">
            <div v-if="cart.length === 0" class="empty-cart">
              <p>購物車是空的</p>
              <p>快去選購美食吧！🍽️</p>
            </div>
          </Transition>
 
          <!-- 購物車品項：TransitionGroup 讓加入/刪除有動畫 -->
          <div v-if="cart.length > 0">
            <TransitionGroup name="cart-item" tag="div" class="cart-list">
              <div class="cart-item" v-for="item in cart" :key="item.id">
                <span class="item-emoji">{{ item.image }}</span>
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-price">NT$ {{ item.price }}</span>
                </div>
                <div class="quantity-control">
                  <button @click="updateQuantity(item.id, -1)">－</button>
                  <Transition name="num-flip" mode="out-in">
                    <span class="quantity-num" :key="item.quantity">{{ item.quantity }}</span>
                  </Transition>
                  <button @click="updateQuantity(item.id, 1)">＋</button>
                </div>
                <span class="item-subtotal">NT$ {{ item.price * item.quantity }}</span>
                <button class="remove-btn" @click="removeItem(item.id)">🗑</button>
              </div>
            </TransitionGroup>
 
            <!-- 合計 -->
            <div class="cart-total">
              <span>總計：</span>
              <Transition name="num-flip" mode="out-in">
                <strong :key="total" class="total-num">NT$ {{ total }}</strong>
              </Transition>
            </div>
 
            <!-- 訂單表單 -->
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
    </Transition>
 
    <!-- 載入中遮罩 -->
    <Transition name="fade">
      <div class="loading-overlay" v-if="isLoading">
        <div class="spinner">⏳ 載入中...</div>
      </div>
    </Transition>
  </div>
</template>
 
<script setup>
import { ref, computed, onMounted } from 'vue'
 
// ── Google Apps Script URL（送出訂單用）請換成你自己的網址 ──
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
 
// ── 讀取菜單（本地 JSON，無 CORS 問題）──
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
 
// ── 送出訂單（fetch 不加 Content-Type，避開 CORS 預檢）──
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
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Noto Sans TC', sans-serif; background: #f8f5f0; color: #333; }
 
/* ── 導覽列 ── */
.navbar {
  background: #e74c3c; color: white;
  padding: 16px 24px;
  display: flex; justify-content: space-between; align-items: center;
  position: sticky; top: 0; z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.navbar h1 { font-size: 1.4rem; }
.cart-btn {
  background: white; color: #e74c3c; border: none;
  border-radius: 20px; padding: 8px 16px; font-size: 1rem;
  cursor: pointer; font-weight: bold;
  display: flex; align-items: center; gap: 6px;
}
.badge {
  background: #2ecc71; color: white; border-radius: 50%;
  padding: 2px 7px; font-size: 0.75rem; font-weight: bold;
}
/* 購物車數字彈出 */
.badge-pop-enter-active { animation: badgePop 0.3s ease; }
@keyframes badgePop {
  0% { transform: scale(0); } 70% { transform: scale(1.3); } 100% { transform: scale(1); }
}
 
/* ── 分類標籤 ── */
.category-tabs {
  display: flex; gap: 8px; padding: 16px 24px;
  background: white; overflow-x: auto; border-bottom: 1px solid #eee;
}
.category-tabs button {
  padding: 6px 16px; border: 2px solid #e74c3c; border-radius: 20px;
  background: white; color: #e74c3c; cursor: pointer;
  white-space: nowrap; font-size: 0.9rem; transition: all 0.2s; flex-shrink: 0;
}
.category-tabs button.active { background: #e74c3c; color: white; }
 
/* ── 菜單 Grid ── */
.menu-grid { padding: 24px; max-width: 1200px; margin: 0 auto; }
.menu-inner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px; position: relative;
}
 
/* 菜單卡片動畫 */
.menu-card-enter-active { transition: all 0.35s ease; }
.menu-card-leave-active { transition: all 0.2s ease; position: absolute; }
.menu-card-enter-from { opacity: 0; transform: translateY(20px) scale(0.95); }
.menu-card-leave-to { opacity: 0; transform: scale(0.9); }
.menu-card-move { transition: transform 0.35s ease; }
 
.menu-card {
  background: white; border-radius: 16px; padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08); cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.menu-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.menu-card:active { transform: scale(0.97); }
.card-emoji { font-size: 3rem; text-align: center; margin-bottom: 12px; }
.card-body h3 { font-size: 1.1rem; margin-bottom: 6px; }
.description { color: #888; font-size: 0.85rem; margin-bottom: 12px; }
.card-footer { display: flex; justify-content: space-between; align-items: center; }
.price { font-size: 1.2rem; font-weight: bold; color: #e74c3c; }
.add-btn {
  background: #2ecc71; color: white; border: none;
  border-radius: 20px; padding: 6px 14px; cursor: pointer;
  font-size: 0.9rem; transition: background 0.2s, transform 0.1s;
}
.add-btn:active { transform: scale(0.9); }
 
/* ── 購物車面板滑入動畫 ── */
.cart-slide-enter-active, .cart-slide-leave-active { transition: opacity 0.25s ease; }
.cart-slide-enter-from, .cart-slide-leave-to { opacity: 0; }
.cart-slide-enter-active .cart-panel,
.cart-slide-leave-active .cart-panel { transition: transform 0.3s ease; }
.cart-slide-enter-from .cart-panel,
.cart-slide-leave-to .cart-panel { transform: translateX(100%); }
 
.cart-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 200; display: flex; justify-content: flex-end;
}
.cart-panel {
  background: white; width: 380px; max-width: 100vw;
  height: 100%; overflow-y: auto; padding: 24px;
  display: flex; flex-direction: column; gap: 12px;
}
.cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.cart-header button { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #888; }
.empty-cart { text-align: center; color: #aaa; padding: 60px 0; font-size: 1.1rem; line-height: 2; }
 
/* ── 購物車品項動畫（TransitionGroup）── */
.cart-list { display: flex; flex-direction: column; position: relative; }
.cart-item-enter-active { transition: all 0.35s ease; }
.cart-item-leave-active { transition: all 0.25s ease; position: absolute; width: calc(100% - 48px); }
.cart-item-enter-from { opacity: 0; transform: translateX(40px); }
.cart-item-leave-to { opacity: 0; transform: translateX(-30px); }
.cart-item-move { transition: transform 0.35s ease; }
 
.cart-item {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 0; border-bottom: 1px solid #f0f0f0;
}
.item-emoji { font-size: 1.5rem; flex-shrink: 0; }
.item-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.item-name { font-size: 0.9rem; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-price { font-size: 0.8rem; color: #888; }
.quantity-control { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.quantity-control button {
  background: #f0f0f0; border: none; border-radius: 50%;
  width: 30px; height: 30px; cursor: pointer; font-size: 1rem;
  transition: background 0.15s, transform 0.1s;
  display: flex; align-items: center; justify-content: center;
}
.quantity-control button:active { transform: scale(0.85); }
 
/* 數量數字切換動畫 */
.quantity-num { font-weight: bold; min-width: 24px; text-align: center; display: inline-block; }
.num-flip-enter-active, .num-flip-leave-active { transition: all 0.15s ease; }
.num-flip-enter-from { opacity: 0; transform: translateY(-8px); }
.num-flip-leave-to { opacity: 0; transform: translateY(8px); }
 
.item-subtotal { font-weight: bold; color: #e74c3c; font-size: 0.85rem; min-width: 58px; text-align: right; flex-shrink: 0; }
.remove-btn { background: none; border: none; cursor: pointer; font-size: 1rem; transition: transform 0.15s; flex-shrink: 0; }
.remove-btn:active { transform: scale(0.8); }
 
/* ── 合計 ── */
.cart-total {
  display: flex; justify-content: flex-end; align-items: center; gap: 8px;
  font-size: 1.15rem; color: #e74c3c;
  padding: 14px 0; border-top: 2px solid #eee; margin-top: 4px;
}
.total-num { display: inline-block; font-size: 1.3rem; }
 
/* ── 訂單表單 ── */
.order-form { display: flex; flex-direction: column; gap: 10px; }
.order-form h3 { font-size: 1rem; margin-bottom: 4px; }
.order-form input, .order-form textarea {
  border: 1.5px solid #ddd; border-radius: 8px; padding: 10px 12px;
  font-size: 0.95rem; width: 100%; font-family: inherit; transition: border-color 0.2s;
}
.order-form input:focus, .order-form textarea:focus { outline: none; border-color: #e74c3c; }
.submit-btn {
  background: #e74c3c; color: white; border: none; border-radius: 10px;
  padding: 14px; font-size: 1rem; cursor: pointer;
  transition: background 0.2s, transform 0.1s; font-family: inherit;
}
.submit-btn:hover:not(:disabled) { background: #c0392b; }
.submit-btn:active:not(:disabled) { transform: scale(0.98); }
.submit-btn:disabled { background: #ccc; cursor: not-allowed; }
 
/* ── 通用淡入淡出 ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
 
/* ── 載入遮罩 ── */
.empty-menu { text-align: center; padding: 60px; color: #aaa; font-size: 1.2rem; }
.loading-overlay {
  position: fixed; inset: 0; background: rgba(255,255,255,0.85);
  display: flex; justify-content: center; align-items: center; z-index: 999; font-size: 1.5rem;
}
 
/* ── Toast 提示 ── */
.toast {
  position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
  background: #333; color: white; padding: 12px 24px; border-radius: 24px;
  font-size: 0.95rem; z-index: 9999; white-space: nowrap;
  animation: toastAnim 2s ease forwards;
}
@keyframes toastAnim {
  0%   { opacity: 0; transform: translateX(-50%) translateY(12px); }
  15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
  75%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(-4px); }
}
 
/* ── 手機響應式 ── */
@media (max-width: 640px) {
  .menu-grid { padding: 12px; }
  .menu-inner-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .card-emoji { font-size: 2.2rem; }
  .card-body h3 { font-size: 0.95rem; }
  .cart-panel { width: 100vw; }
  .item-subtotal { min-width: 50px; font-size: 0.8rem; }
}
</style>