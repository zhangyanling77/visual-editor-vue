<template>
  <div class="app">
    <h1>这是页面内容</h1>
    <visual-editor />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { VisualEditor } from '@/packages/visual-editor';

export default defineComponent({
  name: 'App',
  components: {
    VisualEditor,
  },
  data() {
    return {
      
    }
  }
});
</script>

<style lang="scss">
html, body {
  margin: 0;
  padding: 0;
}
.app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
