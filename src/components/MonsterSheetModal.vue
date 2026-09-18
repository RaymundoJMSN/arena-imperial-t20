<script setup>
import { computed } from "vue";
import Modal from "./Modal.vue";
import { useModals } from "../stores/modals";

const modals = useModals();
const m = computed(() => modals.sheet);
const f = computed(() => m.value?.attributes?.ficha);
const linha = computed(() => {
  if (!m.value) return "";
  const tags = m.value.tags.length ? ` (${m.value.tags.join(", ")})` : "";
  return `${m.value.type}${tags} ${m.value.size} · ND ${m.value.cr.string} · ${m.value.sources.map((s) => s.fullText).join(", ")}`;
});
</script>

<template>
  <Modal :title="m ? m.name : ''" :show="modals.ficha" @update:show="modals.hide('ficha')">
    <div v-if="m" class="w-full text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
      <p class="text-gray-500 dark:text-gray-400 mb-2" v-text="linha"></p>

      <p v-if="!f" class="italic">
        Este monstro só tem os dados de encontro: Defesa {{ m.defense }}, PV {{ m.hp }}, Iniciativa +{{ m.init }}
        <span v-if="m.resistances">· {{ m.resistances }}</span>.
      </p>

      <template v-else>
        <img
          v-if="f.img"
          :src="f.img"
          referrerpolicy="no-referrer"
          loading="lazy"
          alt=""
          class="float-right max-w-[40%] max-h-56 ml-3 mb-2 rounded border border-gray-300 dark:border-gray-600 bg-black"
        />
        <p>
          <b>Iniciativa</b> {{ f.iniciativa }} · <b>Percepção</b> {{ f.percepcao }}
          <span v-if="f.percepcaoObs" class="text-gray-500 dark:text-gray-400">({{ f.percepcaoObs }})</span>
        </p>
        <p>
          <b>Defesa</b> {{ f.defesa }}
          <span v-if="f.defesaObs" class="text-gray-500 dark:text-gray-400">({{ f.defesaObs }})</span>
          · <b>Fort</b> {{ f.fort }} · <b>Ref</b> {{ f.ref }} · <b>Von</b> {{ f.von }}
        </p>
        <p><b>PV</b> {{ f.pv }} · <b>PM</b> {{ f.pm }} · <b>Desl.</b> {{ f.desl }}</p>
        <p class="flex flex-wrap gap-x-4 my-1">
          <span v-for="(v, k) in f.atributos" :key="k"><b class="uppercase text-emerald-700 dark:text-emerald-400">{{ k }}</b> {{ v }}</span>
        </p>

        <div v-if="f.ataques.length" class="mt-2">
          <b class="uppercase text-xs tracking-wide text-gray-500 dark:text-gray-400">Ataques</b>
          <p v-for="(a, i) in f.ataques" :key="i">
            • <b>{{ a.nome }}</b> <span v-if="a.tipo">({{ a.tipo }})</span> {{ a.bonus }}<span v-if="a.dano">, {{ a.dano }}</span>
            <span v-if="a.desc"> — {{ a.desc }}</span>
          </p>
        </div>

        <div v-if="f.habilidades.length" class="mt-2">
          <b class="uppercase text-xs tracking-wide text-gray-500 dark:text-gray-400">Habilidades</b>
          <p v-for="(h, i) in f.habilidades" :key="i">
            • <b v-if="h.nome">{{ h.nome }}</b> <span v-if="h.tipo">({{ h.tipo }})</span><span v-if="h.custo"> [{{ h.custo }}]</span><span v-if="h.nome">:</span> {{ h.desc }}
          </p>
        </div>

        <p v-if="f.pericias" class="mt-2"><b>Perícias</b> {{ f.pericias }}</p>
        <p v-if="f.equipamento"><b>Equipamento</b> {{ f.equipamento }}</p>
        <p v-if="f.tesouro"><b>Tesouro</b> {{ f.tesouro }}</p>
        <p v-if="f.observacao" class="italic text-gray-500 dark:text-gray-400 mt-2">{{ f.observacao }}</p>
        <p class="clear-both text-xs text-gray-400 dark:text-gray-500 mt-3">Ficha do Arsenal (Nicholas Lemos) · {{ f.fonte }}</p>
      </template>
    </div>

    <template #footer>
      <button class="button-primary-sm" @click="modals.hide('ficha')">Fechar</button>
    </template>
  </Modal>
</template>
