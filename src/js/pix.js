// Gera payload estático Pix (EMV/BR Code) para QR Code
// Spec: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix-versao3.0.pdf

function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xFFFF;
    }
  }
  return crc;
}

function emv(id, value) {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

export function buildPixPayload(chave, nome, cidade) {
  const merchantInfo = emv("00", "br.gov.bcb.pix") + emv("01", chave);
  const additionalData = emv("05", "***");

  const nomeLimpo = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").substring(0, 25).toUpperCase();
  const cidadeLimpa = cidade.normalize("NFD").replace(/[̀-ͯ]/g, "").substring(0, 15).toUpperCase();

  let payload =
    emv("00", "01") +
    emv("26", merchantInfo) +
    emv("52", "0000") +
    emv("53", "986") +
    emv("58", "BR") +
    emv("59", nomeLimpo) +
    emv("60", cidadeLimpa) +
    emv("62", additionalData) +
    "6304"; // CRC placeholder

  const checksum = crc16(payload).toString(16).toUpperCase().padStart(4, "0");
  return payload + checksum;
}
