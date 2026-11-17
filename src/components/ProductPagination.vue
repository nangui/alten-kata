<script setup lang="ts">
defineProps<{
  page: number
  pageCount: number
}>()

const emit = defineEmits<{
  navigate: [page: number]
}>()

function onClick(event: MouseEvent, target: number) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  event.preventDefault()
  emit('navigate', target)
}
</script>

<template>
  <nav class="pagination" aria-label="Pagination">
    <a
      v-if="page > 1"
      class="pagination__link"
      :href="`?page=${page - 1}`"
      @click="onClick($event, page - 1)"
      >← Précédent</a
    >
    <span class="pagination__status">Page {{ page }} sur {{ pageCount }}</span>
    <a
      v-if="page < pageCount"
      class="pagination__link"
      :href="`?page=${page + 1}`"
      @click="onClick($event, page + 1)"
      >Suivant →</a
    >
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  margin-top: 3rem;
}

.pagination__link {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  color: inherit;
  text-decoration: none;
}

.pagination__link:hover {
  border-color: #111827;
}

.pagination__link:focus-visible {
  outline: 2px solid #1e3a8a;
  outline-offset: 2px;
}

.pagination__status {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
