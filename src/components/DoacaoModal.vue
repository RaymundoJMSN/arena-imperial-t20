<script setup>
import Modal from "./Modal.vue";
import { useModals } from "../stores/modals";
import { ref, onMounted } from "vue";
import { buildPixPayload } from "../js/pix.js";
import QRCode from "qrcode";
import { useNotifications } from "../stores/notifications.js";

const modals = useModals();
const notifications = useNotifications();

const PIX_CHAVE = "71cb6e16-c667-482a-93e0-2096a88c70f7";
const pixPayload = buildPixPayload(PIX_CHAVE, "RayNathus", "Brasil");

const qrDataUrl = ref("");

onMounted(async () => {
  qrDataUrl.value = await QRCode.toDataURL(pixPayload, {
    width: 220,
    margin: 2,
    color: { dark: "#1B4332", light: "#FFFFFF" },
  });
});

function copyPix() {
  navigator.clipboard.writeText(PIX_CHAVE).then(() => {
    notifications.notify({ title: "Chave Pix copiada!" });
  });
}
</script>

<template>
  <Modal v-model:show="modals.doacao" title="Apoiar o projeto">
    <div class="my-3 w-full space-y-6">

      <!-- RayNathus -->
      <div class="rounded-lg border border-emerald-200 dark:border-emerald-800 p-4">
        <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <i class="fa fa-user text-emerald-600"></i> RayNathus — Arena Imperial T20
        </h3>

        <!-- Ko-fi -->
        <a
          href="https://ko-fi.com/raynathus"
          target="_blank"
          class="button-primary-md w-full justify-center mb-4 flex"
        >
          <i class="fa fa-coffee mr-2"></i> Apoiar no Ko-fi
        </a>

        <!-- Pix -->
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">ou via Pix</p>
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="QR Code Pix RayNathus"
            class="mx-auto rounded-lg shadow"
            width="220"
            height="220"
          />
          <div v-else class="w-[220px] h-[220px] mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>

          <div class="mt-3 flex items-center gap-2 justify-center">
            <code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate max-w-[200px]">
              {{ PIX_CHAVE }}
            </code>
            <button
              @click="copyPix"
              class="button-primary-sm !px-3 flex-shrink-0"
              title="Copiar chave Pix"
            >
              <i class="fa fa-copy"></i>
            </button>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Chave aleatória Pix</p>
        </div>
      </div>

      <!-- Fantasy Computerworks -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2 text-sm">
          <i class="fa fa-code text-gray-400"></i> Fantasy Computerworks — projeto original
        </h3>
        <a
          href="https://ko-fi.com/fantasycomputerworks"
          target="_blank"
          class="button-secondary-md w-full justify-center flex"
        >
          <i class="fa fa-coffee mr-2"></i> Apoiar no Ko-fi
        </a>
      </div>

    </div>

    <template #footer>
      <button @click="modals.hide('doacao')" type="button" class="button-primary-md">
        Fechar
      </button>
    </template>
  </Modal>
</template>
