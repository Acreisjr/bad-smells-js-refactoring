// src/ReportGenerator.refactored.js
'use strict';

const ROLES = Object.freeze({ ADMIN: 'ADMIN', USER: 'USER' });
const LIMIT_USER = 500;
const PRIORITY_ADMIN = 1000;

class ReportGenerator {
  constructor(database) {
    this.db = database; // mantido por compatibilidade
  }

  generateReport(reportType, user, items) {
    // 1) Filtra dados e calcula total sem ramificações aninhadas
    const visibleItems = this.#filterVisibleItems(user, items);
    const total = this.#calculateTotal(visibleItems);

    // 2) Seleciona formatador por tipo (Strategy simples)
    const formatter = this.#getFormatter(reportType);
    if (!formatter) {
      throw new Error(`Formato não suportado: ${reportType}`);
    }

    // 3) Formata saída (cabeçalho + corpo + rodapé)
    return formatter(user, visibleItems, total).trim();
  }

  // ---------- Helpers de domínio ----------

  #filterVisibleItems(user, items) {
    if (user?.role === ROLES.ADMIN) return items;
    if (user?.role === ROLES.USER) return items.filter((i) => i.value <= LIMIT_USER);
    return [];
  }

  #calculateTotal(items) {
    return items.reduce((sum, i) => sum + (i.value ?? 0), 0);
  }

  #isPriority(user, item) {
    return user?.role === ROLES.ADMIN && item.value > PRIORITY_ADMIN;
  }

  // ---------- Formatadores ----------

  #getFormatter(type) {
    const map = {
      CSV: (user, items, total) => this.#formatCSV(user, items, total),
      HTML: (user, items, total) => this.#formatHTML(user, items, total),
    };
    return map[type];
  }

  #formatCSV(user, items, total) {
    const header = 'ID,NOME,VALOR,USUARIO\n';
    const body = items
      .map((i) => `${i.id},${i.name},${i.value},${user.name}\n`)
      .join('');
    // Mantém exatamente o bloco "Total,,\n{total},,\n" que os testes procuram
    const footer = `\nTotal,,\n${total},,\n`;
    return header + body + footer;
  }

  #formatHTML(user, items, total) {
    const header =
      '<html><body>\n' +
      '<h1>Relatório</h1>\n' +
      `<h2>Usuário: ${user.name}</h2>\n` +
      '<table>\n' +
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n';

    const rows = items
      .map((i) => {
        const bold = this.#isPriority(user, i) ? ' style="font-weight:bold;"' : '';
        return `<tr${bold}><td>${i.id}</td><td>${i.name}</td><td>${i.value}</td></tr>\n`;
      })
      .join('');

    const footer =
      '</table>\n' +
      `<h3>Total: ${total}</h3>\n` +
      '</body></html>\n';

    return header + rows + footer;
  }
}

module.exports = { ReportGenerator };
