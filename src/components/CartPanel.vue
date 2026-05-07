<!-- src/components/CartPanel.vue -->
<template>
  <div class="cart-overlay" @click.self="$emit('close')">
    <div class="cart-panel">
      <div class="cart-header">
        <h2>🛒 我的購物車</h2>
        <button @click="$emit('close')">✕</button>
      </div>

      <!-- 空購物車提示 -->
      <div v-if="cart.length === 0" class="empty-cart">
        <p>購物車是空的</p>
        <p>快去選購美食吧！🍽️</p>
      </div>

      <!-- 品項列表 -->
      <div v-else>
        <div class="cart-item" v-for="item in cart" :key="item.id">
          <span class="item-emoji">{{ item.image }}</span>
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-price">NT$ {{ item.price }}</span>
          </div>
          <div class="quantity-control">
            <button @click="$emit('update-quantity', item.id, -1)">－</button>
            <span>{{ item.quantity }}</span>
            <button @click="$emit('update-quantity', item.id, 1)">＋</button>
          </div>
          <span class="item-subtotal">NT$ {{ item.price * item.quantity }}</span>
          <button class="remove-btn" @click="$emit('remove-item', item.id)">🗑</button>
        </div>

        <!-- 合計 -->
        <div class="cart-total">
          <strong>總計：NT$ {{ total }}</strong>
        </div>

        <!-- 顧客資訊表單 -->
        <div class="order-form">
          <h3>填寫訂購資訊</h3>
          <input v-model="form.customerName" placeholder="姓名 *" required />
          <input v-model="form.phone" placeholder="電話 *" type="tel" required />
          <textarea v-model="form.note" placeholder="備註（可空白）" rows="2"></textarea>
          <button class="submit-btn" @click="handleSubmit" :disabled="!isFormValid">
            ✅ 確認送出訂單
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ cart: Array })
const emit = defineEmits(['update-quantity', 'remove-item', 'submit-order', 'close'])

const form = ref({ customerName: '', phone: '', note: '' })

const total = computed(() =>
  props.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const isFormValid = computed(() =>
  form.value.customerName.trim() && form.value.phone.trim()
)

function handleSubmit() {
  if (!isFormValid.value) return
  emit('submit-order', { ...form.value })
  form.value = { customerName: '', phone: '', note: '' }
}
</script>
