<template>
  <v-form
    ref="vForm"
    v-model="validated"
  >
    <v-checkbox
      v-model="exporter.active"
      class="ma-0"
      label="Active"
      @change="changed = true"
    />
    <v-text-field
      v-model="exporter.options.filePath"
      label="JSON file"
      outlined
      :rules="rules"
      @change="changed = true"
    />
    <v-btn
      color="primary"
      :disabled="!readyToSave"
      @click="submit()"
    >
      Save
    </v-btn>
  </v-form>
</template>

<script lang="ts">
import { setupExporterConfigForm } from '@/ui/components/app/exporters/exportersCommon';
import { OutputVendorName } from '@/backend/commonTypes';
import { legalPath, required } from '@/ui/components/shared/formValidations';
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  setup() {
    return {
      ...setupExporterConfigForm(OutputVendorName.JSON),
      rules: [
        required,
        legalPath
      ]
    };
  }
});
</script>

<style scoped>

</style>
