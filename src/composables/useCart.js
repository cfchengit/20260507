// src/composables/useCart.js
import { ref, computed } from 'vue'

export function useCart() {
  const cart = ref([])
  
  const total = computed(() =>
    cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  
  const cartCount = computed(() =>
    cart.value.reduce((sum, item) => sum + item.quantity, 0)
  )
  
  function addItem(item) {
    const existing = cart.value.find(i => i.id === item.id)
    if (existing) {
      existing.quantity++
    } else {
      cart.value.push({ ...item, quantity: 1 })
    }
  }
  
  function removeItem(id) {
    cart.value = cart.value.filter(i => i.id !== id)
  }
  
  function updateQuantity(id, delta) {
    const item = cart.value.find(i => i.id === id)
    if (item) {
      item.quantity += delta
      if (item.quantity <= 0) removeItem(id)
    }
  }
  
  function clearCart() {
    cart.value = []
  }
  
  return { cart, total, cartCount, addItem, removeItem, updateQuantity, clearCart }
}
