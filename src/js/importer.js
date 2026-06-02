import * as helpers from './helpers';
import Papa from 'papaparse';

export default class Importer {
  static googleApiKey = 'AIzaSyCsGMnu4_lqVj1E0Hsyk7V8CbRpJJauSTM'

  static types = [
    { key: "google-sheets", label: "Google Sheets" },
    { key: "json-raw", label: "JSON (texto)" },
    { key: "json-file", label: "JSON (arquivo)" },
    { key: "csv-file", label: "CSV (arquivos)" },
  ]

  static loaders = {
    'google-sheets': this._importGoogleSheets,
    'json-raw': this._importJson,
    'json-file': this._importJsonFile,
    'csv-file': this._importCSV,
  }

  static validators = {
    'google-sheets': this._validateGoogleSheets,
    'json-raw': this._validateJson,
    'json-file': this._validateJsonFile,
    'csv-file': this._validateCSV,
  }

  static exampleFiles = {
    'json-raw': this._downloadExampleJson,
    'json-file': this._downloadExampleJson,
    'csv-file': this._downloadExampleCSV,
  }

  static sourcesRequiredHeaders = ["name", "type", ["shortname", "short name"], "link"];
  static monstersRequiredHeaders = ["name", "nd", "size", "type", "sources"];

  static _validateSources(sources) {
    for (let source of sources) {
      const sourceKeys = Object.keys(source);
      for (let key of this.sourcesRequiredHeaders) {
        if (Array.isArray(key)) {
          if (!key.find(option => sourceKeys.includes(option))) {
            return [false, `Fontes sem coluna obrigatória: '${key[0]}'`];
          }
        } else if (!sourceKeys.includes(key)) {
          return [false, `Fontes sem coluna obrigatória: '${key}'`];
        }
      }
    }
    return [true, sources];
  }

  static _validateMonsters(monsters, sources) {
    for (let monster of monsters) {
      const monsterKeys = Object.keys(monster);
      for (let key of this.monstersRequiredHeaders) {
        if (Array.isArray(key)) {
          if (!key.find(option => monsterKeys.includes(option))) {
            return [false, `Monstros sem coluna obrigatória: '${key[0]}'`];
          }
        } else if (!monsterKeys.includes(key)) {
          return [false, `Monstros sem coluna obrigatória: '${key}'`];
        } else if (key === "sources") {
          const sourceSplit = new RegExp(": \\d+$", "g")
          const monsterSources = monster[key].split(", ").map(source => source.split(sourceSplit)[0]);
          for (const monsterSource of monsterSources) {
            const source = sources.find(source => source['name'] === monsterSource);
            if (!source) {
              return [false, `Monstro '${monster['name']}' tem a fonte '${monsterSource}', mas ela não está definida nas fontes!`];
            }
          }
        }
      }
    }
    return [true, monsters];
  }

  static async _validateGoogleSheets(resourceLocator) {
    if (resourceLocator.length < 40) {
      return [false, "ID de planilha inválido — muito curto"];
    }

    if (resourceLocator.toLowerCase().startsWith("https://docs.google.com/spreadsheets/d/")) {
      const parts = resourceLocator.split('/');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === "d") {
          resourceLocator = parts[i + 1];
        }
      }
    }

    const initialLoad = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${resourceLocator}?` + new URLSearchParams({
      key: this.googleApiKey
    }))
      .then(response => response.json())
      .then(jsonifiedBody => {
        if (jsonifiedBody.error) {
          return [false, `Erro do Google: "${jsonifiedBody.error.message}"`];
        }

        const monsters = jsonifiedBody.sheets.find(sheet => sheet.properties.title === 'Monstros');
        if (!monsters) {
          return [false, "A planilha deve ter uma aba chamada 'Monstros'. Encontrado: '" + (jsonifiedBody.sheets.map(sheet => sheet.properties.title).join(', ')) + "'"];
        }

        const sources = jsonifiedBody.sheets.find(sheet => sheet.properties.title === 'Fontes');
        if (!sources) {
          return [false, "A planilha deve ter uma aba chamada 'Fontes'. Encontrado: '" + (jsonifiedBody.sheets.map(sheet => sheet.properties.title).join(', ')) + "'"];
        }

        return [true];
      });

    if (!initialLoad[0]) {
      return initialLoad;
    }

    let sourcesValid = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${resourceLocator}/values/Fontes?` + new URLSearchParams({
      key: this.googleApiKey
    }))
      .then(response => response.json())
      .then(jsonifiedBody => {
        const headers = jsonifiedBody.values.splice(0, 1)[0].map(str => str.toLowerCase());
        const sources = jsonifiedBody.values;
        const sourcesWithKeys = sources.map((source) => Object.fromEntries(headers.map((key, index) => {
          return [key, source[index] ?? ""]
        })));
        return this._validateSources(sourcesWithKeys);
      })
      .catch(err => {
        console.error(err)
        return false;
      });

    if (!sourcesValid[0]) {
      return sourcesValid;
    }

    let monstersValid = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${resourceLocator}/values/Monstros?` + new URLSearchParams({
      key: this.googleApiKey
    }))
      .then(response => response.json())
      .then(jsonifiedBody => {
        const headers = jsonifiedBody.values.splice(0, 1)[0].map(str => str.toLowerCase())
        const monsters = jsonifiedBody.values;
        const monstersWithKeys = monsters.map((monster) => Object.fromEntries(headers.map((key, index) => {
          return [key, monster[index] ?? ""];
        })));
        return this._validateMonsters(monstersWithKeys, sourcesValid[1]);
      })
      .catch(err => {
        console.error(err)
        return false;
      });

    if (!monstersValid[0]) {
      return monstersValid;
    }

    return [true, ''];
  }

  static async _validateJson(resourceLocator) {
    let results = await this._importJson(resourceLocator);

    if (!results) {
      return [false, "JSON inválido ou malformado."];
    }

    if (!results.sources) {
      return [false, "O JSON deve conter uma lista 'sources'."];
    }

    if (!results.monsters) {
      return [false, "O JSON tem 'sources', mas precisa também de 'monsters'."];
    }

    const validSources = this._validateSources(results.sources);
    if (!validSources[0]) {
      return validSources;
    }

    const validMonsters = this._validateMonsters(results.monsters, results.sources);
    if (!validMonsters[0]) {
      return validMonsters;
    }

    return [true, ""];
  }

  static async _validateJsonFile(resourceLocator) {
    if (resourceLocator.type !== 'application/json') {
      return [false, "O arquivo não é um JSON válido."];
    }

    let results = await this._importJsonFile(resourceLocator);

    if (!results) {
      return [false, "JSON inválido ou malformado."];
    }

    if (!results.sources) {
      return [false, "O JSON deve conter uma lista 'sources'."];
    }

    if (!results.monsters) {
      return [false, "O JSON tem 'sources', mas precisa também de 'monsters'."];
    }

    const validSources = this._validateSources(results.sources);
    if (!validSources[0]) {
      return validSources;
    }

    const validMonsters = this._validateMonsters(results.monsters, results.sources);
    if (!validMonsters[0]) {
      return validMonsters;
    }

    return [true, ""];
  }

  static async _validateCSV(resourceLocators) {

    if (!resourceLocators[0] || !resourceLocators[1]) {
      return [false, 'Arquivo faltando']
    }

    if (resourceLocators[0].type !== 'text/csv' || resourceLocators[1].type !== 'text/csv') {
      return [false, "Os arquivos precisam ser CSVs válidos."];
    }

    let results = await this._importCSV(resourceLocators);

    if (!results) {
      return [false, "CSV inválido ou malformado."];
    }

    const validSources = this._validateSources(results.sources);
    if (!validSources[0]) {
      return validSources;
    }

    const validMonsters = this._validateMonsters(results.monsters, results.sources);
    if (!validMonsters[0]) {
      return validMonsters;
    }

    return [true, ""];

  }

  static importerTemplates = {
    'google-sheets': `
                            <label class="mb-1" for="import_resource_locator">Insira o ID ou link de uma planilha Google Sheets. A planilha deve ter duas abas: <strong>Monstros</strong> e <strong>Fontes</strong>. <a class="primary-link" target="_blank" href="https://docs.google.com/spreadsheets/d/19R7j2m13LVWZBhFyhYRhv8MB85FqjCAC4mUER1QgSXw/edit?usp=sharing">Veja o modelo de exemplo.</a></label>
                            <input name="import_resource_locator" id="import_resource_locator" type="text" v-model="importerResourceLocator">
                        `,
        'json-raw': `
                            <label class="mb-1" for="import_resource_locator">Cole JSON diretamente ou <a href="javascript:;" class="primary-link" @click="$emit('downloadExample')">baixe um arquivo de exemplo para editar.</a></label>
                            <div class="mt-1">
                                <textarea id="import_resource_locator" v-model="importerResourceLocator" rows="4" name="comment" class="border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 block w-full rounded-md lg:rounded-r-none sm:text-sm disabled:text-gray-500 disabled:bg-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 text-gray-600"></textarea>
                            </div>
                        `,
        'json-file': `
                            <label class="mb-1 block" id="file_input_label" for="import_resource_locator_file">Envie um arquivo JSON ou <a class="primary-link" href="javascript:;" @click="$emit('downloadExample')">baixe um exemplo para editar.</a></label>
                            <input accept="application/json" class="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" @change="importerResourceLocator = $event.target.files[0]" aria-describedby="file_input_label" id="import_resource_locator_file" type="file">
                        `,
        'csv-file': `
                            <label class="mb-1">Envie os arquivos CSV abaixo ou <a class="primary-link" href="javascript:;" @click="$emit('downloadExample')">baixe exemplos para editar.</a></label>
                            <div class="grid grid-cols-2 gap-2 mt-2">
                                <label class="" id="file_input_label_1" for="import_resource_locator_file_1">CSV de Fontes</label>
                                <label class="" id="file_input_label_2" for="import_resource_locator_file_2">CSV de Monstros</label>
                                <input accept="text/csv" class=" text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" @change="onFileUpdate('importerSourcesFile', $event.target.files)" aria-describedby="file_input_label" id="import_resource_locator_file_1" type="file">
                                <input accept="text/csv" class=" text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" @change="onFileUpdate('importerMonstersFile', $event.target.files)" aria-describedby="file_input_label" id="import_resource_locator_file_2" type="file">
                            </div>
                        `
  }

  static loadersHtml = (correctLoader) => {
    return {
      template: `
        <div>${this.importerTemplates[correctLoader]}</div>
      `,
      props: {
        modelValue: [String, Array],
      },
      methods: {
        onFileUpdate(fileVar, fileList) {
          if (fileList.length) {
            this[fileVar] = fileList[0];
          }
        }
      },
      created() {
        this.$watch("importerResourceLocator", (newValue) => {
          if (correctLoader !== 'csv-file') {
            this.importerMonstersFile = null;
            this.importerSourcesFile = null;
          }

          this.$emit('update:modelValue', newValue);
        });

        this.$watch("importerSourcesFile", (newValue) => {
          this.importerResourceLocator = [
            newValue,
            this.importerMonstersFile,
          ]

          // Only emit the model update if we also have a monsters file
          if (this.importerMonstersFile && this.importerMonstersFile.length) {
            this.$emit('update:modelValue', this.importerResourceLocator);
          }
        });

        this.$watch("importerMonstersFile", (newValue) => {
          this.importerResourceLocator = [
            this.importerSourcesFile,
            newValue,
          ]

          // Only emit the model update if we also have a monsters file
          if (this.importerSourcesFile && this.importerSourcesFile.length) {
            this.$emit('update:modelValue', this.importerResourceLocator);
          }
        });
      },
      mounted() {
        this.importerResourceLocator = this.modelValue;
      },
      data() {
        return {
          importerResourceLocator: "",
          importerSourcesFile: null,
          importerMonstersFile: null,
        }
      }
    };
  }

  static async canImport(resourceLocator, type) {
    if (!resourceLocator) {
      return [false, "Forneça uma fonte de importação."];
    }

    return this.validators[type].bind(this)(resourceLocator);
  }

  static async import({ resourceLocator = false, type = 'google-sheets' } = {}) {
    return this.loaders[type].bind(this)(resourceLocator);
  }

  static async _importGoogleSheets(resourceLocator) {

    if (resourceLocator.toLowerCase().startsWith("https://docs.google.com/spreadsheets/d/")) {
      const parts = resourceLocator.split('/');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === "d") {
          resourceLocator = parts[i + 1];
        }
      }
    }

    let monsters = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${resourceLocator}/values/Monstros?` + new URLSearchParams({
      key: this.googleApiKey
    }))
      .then(response => response.json())
      .then(jsonifiedBody => {
        let headers = jsonifiedBody.values.splice(0, 1)[0].map(str => str.toLowerCase());
        const idx = (key) => headers.indexOf(key);
        return jsonifiedBody.values.map((item) => ({
          "name": item[idx("name")] ?? "",
          "nd": item[idx("nd")] ?? "",
          "size": item[idx("size")] ?? "",
          "type": item[idx("type")] ?? "",
          "tags": item[idx("tags")] ?? "",
          "section": item[idx("section")] ?? "",
          "role": (item[idx("role")] ?? "").split(",").map(r => r.trim()).filter(Boolean),
          "defense": item[idx("defense")] ? Number(item[idx("defense")]) : 0,
          "resistances": item[idx("resistances")] ?? "",
          "hp": item[idx("hp")] ? Number(item[idx("hp")]) : 0,
          "init": item[idx("init")] ? Number(item[idx("init")]) : 0,
          "sources": item[idx("sources")] ?? "",
        }));
      })
      .catch(
        err => console.error(err)
      );

    let sources = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${resourceLocator}/values/Fontes?` + new URLSearchParams({
      key: this.googleApiKey
    }))
      .then(response => response.json())
      .then(jsonifiedBody => {
        let headers = jsonifiedBody.values.splice(0, 1)[0].map(str => str.toLowerCase());
        return jsonifiedBody.values.map((item) => ({
          "name": item[headers.indexOf("name")],
          "type": item[headers.indexOf("type")],
          "shortname": item[headers.indexOf("short name")] || item[headers.indexOf("shortname")],
          "link": item[headers.indexOf("link")],
          "custom": true,
          "enabled": true,
        }));
      })
      .catch(
        err => console.error(err)
      );

    return { sources, monsters };
  }

  static async _importJsonFile(resourceLocator) {
    const data = await this._loadFile(resourceLocator);
    return this._importJson(data);
  }

  static async _importJson(resourceLocator) {
    try {
      const data = JSON.parse(resourceLocator);
      for (let source of data.sources) {
        source.custom = true;
        source.enabled = true;
      }
      return data;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  static _downloadExampleJson() {

    const jsonExample = {
      "sources": [
        {
          "name": "Fonte Customizada",
          "type": "Custom",
          "shortname": "FC",
          "link": ""
        },
      ],
      "monsters": [
        {
          "name": "Goblin",
          "nd": 1,
          "size": "Pequeno",
          "type": "Humanoide",
          "tags": "goblin",
          "section": "Goblins",
          "role": [],
          "defense": 13,
          "resistances": "",
          "hp": 22,
          "init": 3,
          "sources": "Fonte Customizada: 5"
        },
        {
          "name": "Chefe Goblin",
          "nd": 3,
          "size": "Pequeno",
          "type": "Humanoide",
          "tags": "goblin",
          "section": "Goblins",
          "role": ["Especial"],
          "defense": 16,
          "resistances": "resistência a veneno",
          "hp": 65,
          "init": 5,
          "sources": "Fonte Customizada: 7"
        },
      ]
    };

    helpers.downloadFile("exemplo.json", JSON.stringify(jsonExample, null, 4), "application/json");

  }

  static async _importCSV(resourceLocators) {

    const sources = await this._loadFile(resourceLocators[0]);
    if (!sources) {
      return false;
    }

    const monsters = await this._loadFile(resourceLocators[1]);
    if (!monsters) {
      return false;
    }

    return {
      sources: Papa.parse(sources, {
        header: true,
      }).data,
      monsters: Papa.parse(monsters, {
        header: true,
      }).data,
    }

  }

  static _downloadExampleCSV() {

    let sources = "name,type,shortname,link\n";
    sources += "Fonte Customizada,Custom,FC,\n";

    helpers.downloadFile("exemplo_fontes.csv", sources, "text/csv");

    let monsters = "name,nd,size,type,tags,section,role,defense,resistances,hp,init,sources\n";
    monsters += `Goblin,1,Pequeno,Humanoide,goblin,Goblins,,13,,22,3,Fonte Customizada: 5\n`;
    monsters += `Chefe Goblin,3,Pequeno,Humanoide,goblin,Goblins,Especial,16,resistência a veneno,65,5,Fonte Customizada: 7`;

    helpers.downloadFile("exemplo_monstros.csv", monsters, "text/csv");

  }

  static _loadFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', function () {
        try {
          resolve(reader.result);
        } catch (err) {
          console.error(err);
          reject(err);
        }
      });
      reader.readAsText(file);
    });
  }

}
