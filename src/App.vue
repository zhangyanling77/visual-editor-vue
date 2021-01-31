<template>
  <div class="app">
    <visual-editor
      v-model="jsonData"
      :config="visualConfig"
      :formData="formData"
      :customProps="customProps"
    >
      <!--<template #subBtn>
        <el-button v-if="formData.food === 'dangao'">自定义的按钮</el-button>
        <el-tag v-else>自定义的标签</el-tag>
      </template>-->
    </visual-editor>
    <div style="text-align:center;">
      {{JSON.stringify(formData)}}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { VisualEditor } from '@/packages/visual-editor';
import { visualConfig } from '@/visual.config';
import jsonData from './data.json';

export default defineComponent({
  name: 'App',
  components: {
    VisualEditor,
  },
  data() {
    return {
      visualConfig,
      jsonData,
      formData: {
        username: 'admin',
      },
      customProps: {
        subBtn: {
          onClick: () => {
            this.$notify({
              message: '执行表单数据校验以及提交到服务器的动作'
            })
          }
        },
        mySelect: {
          onChange: (val: any) => {
            this.$notify({
              message: `食物发生变化：${val}`
            });
            // this.formData.acctType = null;
          }
        }
      },
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
  padding-bottom: 300px;
}
</style>
