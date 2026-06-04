async function runTests() {
  console.log('--- Fazendo login para obter token... ---');
  const resLogin = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const loginData = await resLogin.json();
  const token = loginData.token;
  console.log('Token obtido com sucesso!');

  console.log('\n--- 1. BUSCANDO TODAS AS VENDAS (GET /api/vendas) ---');
  const resList = await fetch('http://localhost:3001/api/vendas', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const sales = await resList.json();
  console.log(`Retornadas ${sales.length} vendas.`);
  sales.forEach(s => {
    console.log(`ID: ${s.id} | Modelo: ${s.modelo_carro} | Valor Centavos: ${s.valor} | Vendedor: ${s.vendedor_nome} | Data: ${s.data_venda}`);
  });

  if (sales.length === 0) {
    console.log('Nenhuma venda para testar.');
    return;
  }

  const targetId = sales[0].id;
  console.log(`\n--- 2. ATUALIZANDO A VENDA ID ${targetId} (PUT /api/vendas/${targetId}) ---`);
  
  const resUpdate = await fetch(`http://localhost:3001/api/vendas/${targetId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      categoria: 'importacao',
      modelo_carro: 'Porsche 911 GT2 RS (Editado)',
      vendedor_id: 2, // Ana Oliveira
      origem_id: 2, // Website
      valor: 2450000.75, // R$ 2.450.000,75
      data_venda: '2026-06-04 12:00:00'
    })
  });
  console.log('PUT Resposta Status:', resUpdate.status, await resUpdate.json());

  console.log(`\n--- 3. BUSCANDO A VENDA ATUALIZADA (GET /api/vendas) ---`);
  const resList2 = await fetch('http://localhost:3001/api/vendas', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const sales2 = await resList2.json();
  const updatedSale = sales2.find(s => s.id === targetId);
  if (updatedSale) {
    console.log('Venda Editada Encontrada:');
    console.log(`ID: ${updatedSale.id} | Modelo: ${updatedSale.modelo_carro} | Valor Centavos: ${updatedSale.valor} | Vendedor: ${updatedSale.vendedor_nome} (ID Vendedor: ${updatedSale.vendedor_id}) | Canal: ${updatedSale.origem_nome} (ID Canal: ${updatedSale.origem_id}) | Data: ${updatedSale.data_venda}`);
  } else {
    console.error('Falha: venda editada não encontrada!');
  }
}

runTests().catch(console.error);
