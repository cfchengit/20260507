<!-- src/components/MenuCard.vue -->
<template>
  <div class="menu-card" :class="{ 'adding': isAdding }">
    <div class="card-emoji">{{ item.image }}</div>
    <div class="card-body">
      <h3>{{ item.name }}</h3>
      <p class="description">{{ item.description }}</p>
      <div class="card-footer">
        <span class="price">NT$ {{ item.price }}</span>
        <button class="add-btn" @click="handleAdd">
          <span>+</span> 加入
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ item: Object })
const emit = defineEmits(['add-to-cart'])
const isAdding = ref(false)

function handleAdd() {
  isAdding.value = true
  emit('add-to-cart', props.item)
  setTimeout(() => { isAdding.value = false }, 300)
}
</script>

<style scoped>
.menu-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.menu-card.adding {
  transform: scale(0.97);
}
.card-emoji {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 12px;
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
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}
.add-btn:hover { background: #27ae60; }
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}
</style>
