<template>
  <div>
    <!-- <h1>这是页面内容</h1> -->
    <visual-editor v-model="jsonData" :config="visualConfig" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { VisualEditor } from '@/packages/visual-editor';
import { visualConfig } from '@/visual.config';

export default defineComponent({
  name: 'App',
  components: {
    VisualEditor,
  },
  data() {
    return {
      visualConfig,
      jsonData: {
        container: {
          width: 800,
          height: 500,
        },
        blocks: [
          {
            componentKey: 'text',
            top: 100,
            left: 100,
          },
          {
            componentKey: 'button',
            top: 100,
            left: 200,
          },
          {
            componentKey: 'input',
            top: 200,
            left: 200,
          }
        ]
      }
    }
  }
});
</script>

<style lang="scss">
html, body {
  margin: 0;
  padding: 0;
}
</style>
