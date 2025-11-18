// programacao-data.js
// Dados das programações para SP (São Paulo), BH (Belo Horizonte) e PA (Pará de Minas).
// Estrutura: window.PROGRAMACAO[stationKey][dayKey] = [ { time: 'HH:MM - HH:MM', title: '...' }, ... ]

window.PROGRAMACAO = {
  sp: {
    'seg-sex': [
      { time: '00:00 - 04:00', title: 'Itatiaia é a Dona da Noite' },
      { time: '06:00 - 07:00', title: 'Bom dia Cidade' },
      { time: '07:00 - 09:00', title: 'Jornal da Itatiaia' },
      { time: '09:00 - 11:30', title: 'Horário Livre' },
      { time: '11:30 - 13:00', title: 'Rádio Esportes' },
      { time: '13:00 - 14:00', title: 'Itatiaia Agora' },
      { time: '14:00 - 16:00', title: 'Chamada Geral' },
      { time: '16:00 - 17:00', title: 'Paradão Sertanejo' },
      { time: '17:00 - 17:03', title: 'Repórter CBN' },
      { time: '17:03 - 18:00', title: 'Cidade Não Para' },
      { time: '18:00 - 18:02', title: 'Oração da Ave Maria' },
      { time: '18:02 - 18:30', title: 'Cidade Não Para' },
      { time: '18:30 - 18:33', title: 'Repórter CBN' },
      { time: '18:33 - 19:00', title: 'Cidade Não Para' },
      { time: '19:00 - 20:00', title: 'A VOZ DO BRASIL' },
      { time: '20:00 - 21:00', title: 'QUATRO EM CAMPO' },
      { time: '21:00 - 22:00', title: 'ASSUNTO FEDERAL' },
      { time: '22:00 - 23:00', title: 'NOITE LIVRE' },
      { time: '23:00 - 00:00', title: 'Show da Noite' }
    ],
    sab: [
      { time: '00:00 - 04:00', title: 'Itatiaia é a Dona da Noite' },
      { time: '04:00 - 06:00', title: 'Café com Noticia' },
      { time: '06:00 - 07:00', title: 'Bom dia Cidade' },
      { time: '07:00 - 09:00', title: 'Jornal da Itatiaia' },
      { time: '09:00 - 10:00', title: 'Horário Livre 1ª Edição (REDE)' },
      { time: '10:00 - 10:03', title: 'Repórter CBN' },
      { time: '10:03 - 11:00', title: 'Horário Livre 2ª Edição (LOCAL)' },
      { time: '11:00 - 11:03', title: 'Repórter CBN' },
      { time: '11:03 - 11:30', title: 'Horário Livre 3ª Edição (REDE)' },
      { time: '11:30 - 13:00', title: 'Rádio Esportes' },
      { time: '13:00 - 14:00', title: 'Itatiaia Agora' },
      { time: '14:00 - 15:00', title: 'Sábado Retrô' },
      { time: '15:00 - 21:00', title: 'CBN Show da Notícia' },
      { time: '21:00 - 23:00', title: 'Noite Livre' },
      { time: '23:00 - 00:00', title: 'Show da Noite' }
    ],
    dom: [
      { time: '00:00 - 04:00', title: 'Itatiaia é a Dona da Noite' },
      { time: '04:00 - 06:00', title: 'Parada no Rádio' },
      { time: '06:00 - 07:00', title: 'Bom Dia Cidade' },
      { time: '07:00 - 09:00', title: 'Jornal da Itatiaia' },
      { time: '09:00 - 10:00', title: 'Horário Livre 1ª Edição' },
      { time: '10:00 - 11:00', title: 'Horário Livre 2ª Edição (LOCAL)' },
      { time: '11:00 - 12:00', title: 'Horário Livre 3ª Edição (REDE)' },
      { time: '12:00 - 13:00', title: 'Paradão Sertanejo' },
      { time: '13:00 - 14:00', title: 'Domingão Esportivo' },
      { time: '15:00 - 16:00', title: 'Jornada Esportiva / Cidade Não Para' },
      { time: '19:00 - 20:00', title: 'Horário Livre' },
      { time: '20:00 - 23:00', title: 'Noite Livre' },
      { time: '23:00 - 00:00', title: 'Show da Noite' }
    ]
  },

  bh: {
    'seg-sex': [
      { time: '00:00 - 04:00', title: 'Itatiaia é a Dona da Noite' },
      { time: '04:00 - 06:00', title: 'Café com Notícia' },
      { time: '06:00 - 07:00', title: 'Bom Dia Cidade' },
      { time: '07:00 - 09:00', title: 'Jornal da Itatiaia' },
      { time: '09:00 - 11:30', title: 'Horário Livre' },
      { time: '11:30 - 13:00', title: 'Rádio Esportes' },
      { time: '13:00 - 14:00', title: 'Itatiaia Agora' },
      { time: '14:00 - 16:00', title: 'Chamada Geral' },
      { time: '16:00 - 17:00', title: 'Paradão Sertanejo' },
      { time: '17:00 - 18:00', title: 'Cidade Não Para' },
      { time: '18:00 - 18:02', title: 'Oração da Tarde' },
      { time: '18:02 - 19:00', title: 'Cidade Não Para' },
      { time: '19:00 - 20:00', title: 'A VOZ DO BRASIL' },
      { time: '20:00 - 20:20', title: 'Conversa de Redação' },
      { time: '20:20 - 21:00', title: 'Jornal da Itatiaia (Noite)' },
      { time: '21:00 - 22:00', title: 'Assunto Federal' },
      { time: '22:00 - 23:00', title: 'Noite Livre' },
      { time: '23:00 - 00:00', title: 'Show da Noite' }
    ],
    sab: [
      { time: '00:00 - 04:00', title: 'Itatiaia é a Dona da Noite' },
      { time: '04:00 - 06:00', title: 'Café com Notícia' },
      { time: '06:00 - 07:00', title: 'Bom Dia Cidade' },
      { time: '07:00 - 09:00', title: 'Jornal da Itatiaia' },
      { time: '09:00 - 10:00', title: 'Horário Livre 1ª Edição' },
      { time: '10:00 - 11:00', title: 'Horário Livre 2ª Edição (LOCAL)' },
      { time: '11:00 - 11:30', title: 'Horário Livre 3ª Edição (REDE)' },
      { time: '11:30 - 13:00', title: 'Rádio Esportes' },
      { time: '13:00 - 14:00', title: 'Horário Livre (BH)' },
      { time: '14:00 - 16:00', title: 'Sábado Retrô' },
      { time: '16:00 - 17:00', title: 'Paradão Sertanejo' },
      { time: '17:00 - 18:00', title: 'Cidade Não Para' },
      { time: '18:00 - 18:02', title: 'Oração da Tarde' },
      { time: '18:02 - 20:00', title: 'Turma do Bate Bola' },
      { time: '20:00 - 23:00', title: 'Noite Livre' },
      { time: '23:00 - 00:00', title: 'Show da Noite' }
    ],
    dom: [
      { time: '00:00 - 04:00', title: 'Itatiaia é a Dona da Noite' },
      { time: '04:00 - 06:00', title: 'Parada no Rádio' },
      { time: '06:00 - 07:00', title: 'Bom Dia Cidade' },
      { time: '07:00 - 09:00', title: 'Jornal da Itatiaia' },
      { time: '09:00 - 10:00', title: 'Horário Livre 1ª Edição' },
      { time: '10:00 - 11:00', title: 'Horário Livre 2ª Edição (LOCAL)' },
      { time: '11:00 - 12:00', title: 'Horário Livre 3ª Edição (REDE)' },
      { time: '12:00 - 13:00', title: 'Paradão Sertanejo' },
      { time: '13:00 - 14:00', title: 'Domingão Esportivo' },
      { time: '15:00 - 16:00', title: 'Jornada Esportiva / Cidade Não Para' },
      { time: '19:00 - 20:00', title: 'Horário Livre' },
      { time: '20:00 - 23:00', title: 'Noite Livre (blocos às 20:00 e 20:45)' },
      { time: '23:00 - 00:00', title: 'Show da Noite' }
    ]
  },

  pa: {
    // Pará de Minas tem a mesma grade de Belo Horizonte na maior parte dos dias, com pequenas diferenças anotadas onde aplicável.
    'seg-sex': [
      { time: '00:00 - 04:00', title: 'Itatiaia é a Dona da Noite' },
      { time: '04:00 - 06:00', title: 'Café com Notícias' },
      { time: '06:00 - 07:00', title: 'Bom Dia Cidade' },
      { time: '07:00 - 09:00', title: 'Jornal da Itatiaia' },
      { time: '09:00 - 11:30', title: 'Horário Livre' },
      { time: '11:30 - 13:00', title: 'Rádio Esportes' },
      { time: '13:00 - 14:00', title: 'Itatiaia Agora' },
      { time: '14:00 - 16:00', title: 'Chamada Geral' },
      { time: '16:00 - 17:00', title: 'Paradão Sertanejo' },
      { time: '17:00 - 18:00', title: 'Cidade Não Para' },
      { time: '18:00 - 18:02', title: 'Oração da Tarde' },
      { time: '18:02 - 19:00', title: 'Cidade Não Para' },
      { time: '19:00 - 20:00', title: 'A VOZ DO BRASIL' },
      { time: '20:00 - 20:20', title: 'Conversa de Redação' },
      { time: '20:20 - 21:00', title: 'Jornal da Itatiaia (Noite)' },
      { time: '21:00 - 22:00', title: 'Assunto Federal' },
      { time: '22:00 - 23:00', title: 'Noite Livre' },
      { time: '23:00 - 00:00', title: 'Show da Noite' }
    ],
    sab: [
      { time: '00:00 - 04:00', title: 'Itatiaia é a Dona da Noite' },
      { time: '04:00 - 06:00', title: 'Café com Notícia' },
      { time: '06:00 - 07:00', title: 'Bom Dia Cidade' },
      { time: '07:00 - 09:00', title: 'Jornal da Itatiaia' },
      { time: '09:00 - 10:00', title: 'Horário Livre 1ª Edição' },
      { time: '10:00 - 11:00', title: 'Horário Livre 2ª Edição (LOCAL)' },
      { time: '11:00 - 11:30', title: 'Horário Livre 3ª Edição (REDE)' },
      { time: '11:30 - 13:00', title: 'Rádio Esportes' },
      // No sábado PA: 13:00 - 14:00 Itatiaia Agora (conforme fornecido)
      { time: '13:00 - 14:00', title: 'Itatiaia Agora (PA)' },
      { time: '14:00 - 16:00', title: 'Sábado Retrô' },
      { time: '16:00 - 17:00', title: 'Paradão Sertanejo' },
      { time: '17:00 - 18:00', title: 'Cidade Não Para' },
      { time: '18:00 - 18:02', title: 'Oração da Tarde' },
      { time: '18:02 - 20:00', title: 'Turma do Bate Bola' },
      { time: '20:00 - 23:00', title: 'Noite Livre' },
      { time: '23:00 - 00:00', title: 'Show da Noite' }
    ],
    dom: [
      { time: '00:00 - 04:00', title: 'Itatiaia é a Dona da Noite' },
      { time: '04:00 - 06:00', title: 'Parada no Rádio' },
      { time: '06:00 - 07:00', title: 'Bom Dia Cidade' },
      { time: '07:00 - 09:00', title: 'Jornal da Itatiaia' },
      { time: '09:00 - 10:00', title: 'Horário Livre 1ª Edição' },
      { time: '10:00 - 11:00', title: 'Horário Livre 2ª Edição (LOCAL)' },
      { time: '11:00 - 12:00', title: 'Horário Livre 3ª Edição (REDE)' },
      { time: '12:00 - 13:00', title: 'Paradão Sertanejo' },
      { time: '13:00 - 14:00', title: 'Domingão Esportivo' },
      { time: '15:00 - 16:00', title: 'Jornada Esportiva / Cidade Não Para' },
      { time: '19:00 - 20:00', title: 'Horário Livre' },
      { time: '20:00 - 23:00', title: 'Noite Livre' },
      { time: '23:00 - 00:00', title: 'Show da Noite' }
    ]
  }
};
