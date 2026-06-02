<script setup>
import { RouterLink } from "vue-router";
</script>

<template>
  <div class="relative bg-gray-800">
    <div class="absolute inset-0">
      <img class="w-full h-full object-cover" src="/images/castle.jpg" alt="" />
      <div class="absolute inset-0 bg-gray-700 dark:bg-gray-800 mix-blend-multiply" aria-hidden="true"></div>
    </div>
    <div class="relative max-w-7xl mx-auto py-20 px-12 sm:py-24 sm:px-6 lg:px-8">
      <h1 class="text-4xl font-extrabold text-center tracking-tight text-white md:text-5xl lg:text-6xl">
        Arena Imperial T20
      </h1>
      <p class="mt-4 text-xl text-gray-200 text-center">
        Gerador de encontros para Tormenta 20
      </p>
    </div>
  </div>

  <div class="max-w-4xl mx-auto pt-12 px-6 pb-16">
    <div class="prose dark:prose-invert max-w-none">

      <h2>Sobre o projeto</h2>
      <p>
        <strong>Arena Imperial T20</strong> é uma ferramenta independente para gerar e calcular encontros no sistema
        <strong>Tormenta 20</strong>. Ela permite que narradores montem grupos de monstros, calculem o ND do encontro,
        filtrem criaturas por tipo e papel de combate, e gerem encontros aleatórios balanceados.
      </p>
      <p>
        Esta é uma produção independente feita por
        <a class="primary-link" href="https://github.com/RaymundoJMSN" target="_blank"><strong>RayNathus</strong></a>
        e não é afiliada, endossada ou patrocinada pela
        <a class="primary-link" href="https://jamboeditora.com.br/" target="_blank">Jambô Editora</a>.
      </p>

      <h2>Direitos autorais — Tormenta 20</h2>
      <p>
        Tormenta 20 e todo o seu conteúdo são propriedade da <strong>Jambô Editora</strong>. Os monstros e regras
        presentes nesta ferramenta foram compilados a partir dos livros oficiais. Para jogar Tormenta 20 você
        precisa adquirir os livros oficiais:
      </p>
      <ul>
        <li>
          <a class="primary-link" href="https://jamboeditora.com.br/produto/tormenta20-edicao-jogo-do-ano/" target="_blank">
            Livro Básico — Edição Jogo do Ano
          </a>
        </li>
        <li>
          <a class="primary-link" href="https://jamboeditora.com.br/produto/ameacas-de-arton/" target="_blank">
            Ameaças de Arton
          </a>
        </li>
        <li>
          <a class="primary-link" href="https://jamboeditora.com.br/produto/tormenta20-deuses-de-arton/" target="_blank">
            Deuses de Arton
          </a>
        </li>
        <li>
          <a class="primary-link" href="https://jamboeditora.com.br/produto/tormenta20-guia-de-npcs/" target="_blank">
            Guia de NPCs
          </a>
        </li>
      </ul>
      <p>
        Esta ferramenta não substitui nenhum desses produtos. Todo o crédito do sistema e das criaturas pertence
        à Jambô Editora e aos autores de Tormenta 20.
      </p>

      <h2>Base técnica</h2>
      <p>
        Arena Imperial T20 é uma adaptação de
        <strong>Kobold+ Fight Club</strong>, originalmente desenvolvido por
        <a class="primary-link" href="https://github.com/fantasycalendar/kobold-plus-fight-club" target="_blank">Fantasy Computerworks</a>
        (Ian Toltz e Joe Barzilai), publicado sob a
        <a class="primary-link" href="https://opensource.org/licenses/MIT" target="_blank">Licença MIT</a>.
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Copyright 2021 Ian Toltz and Joe Barzilai. Permission is hereby granted, free of charge,
        to any person obtaining a copy of this software and associated documentation files (the "Software"),
        to deal in the Software without restriction, including without limitation the rights to use, copy,
        modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
      </p>

      <h2>Dúvidas e sugestões</h2>
      <p>
        Esta é uma ferramenta em desenvolvimento contínuo. Sugestões e correções são bem-vindas via
        <a class="primary-link" href="https://github.com/RaymundoJMSN" target="_blank">GitHub</a>.
      </p>

      <div class="mt-6">
        <RouterLink
          :to="{ name: 'privacy' }"
          class="inline-flex items-center px-4 py-2 border border-emerald-600 text-sm font-medium rounded-md text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 transition"
        >
          <i class="fa fa-shield-halved mr-2"></i> Política de Privacidade
        </RouterLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
.primary-link {
  @apply no-underline;
}
</style>
