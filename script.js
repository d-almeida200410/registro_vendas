// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDrTfjEoF5McvUm0kZLQURVjKJPkBD3gWM",
    authDomain: "estoquepapelaria-da1a7.firebaseapp.com",
    projectId: "estoquepapelaria-da1a7",
    storageBucket: "estoquepapelaria-da1a7.firebasestorage.app",
    messagingSenderId: "91379078877",
    appId: "1:91379078877:web:eb87052e4e061c9b25ed34"
  };
// Inicializa o Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Habilita a persistência de dados
firebase.firestore().enablePersistence()
    .then(() => {
        console.log("Persistência de dados habilitada.");
    })
    .catch((error) => {
        console.error("Erro ao habilitar persistência:", error);
    });

const db = firebase.firestore();

// Referências aos elementos do DOM
const itemName = document.getElementById('itemName');
const itemQuantity = document.getElementById('itemQuantity');
const registerSale = document.getElementById('registerSale');
const salesList = document.getElementById('salesList');
const totalValue = document.getElementById('totalValue');
const generateReport = document.getElementById('generateReport');

// Array para armazenar as vendas do dia
let sales = [];

// Função para calcular o valor total ganho no dia
const calculateTotalSales = () => {
    let total = 0;
    sales.forEach(sale => {
        total += sale.totalPrice;
    });
    totalValue.textContent = total.toFixed(2);
};

// Função para registrar uma venda
registerSale.addEventListener('click', async () => {
    const name = itemName.value;
    const quantity = parseInt(itemQuantity.value);

    if (name && quantity > 0) {
        try {
            // Verifica se o item existe no estoque
            const itemRef = db.collection('estoque').where('name', '==', name);
            const snapshot = await itemRef.get();

            if (snapshot.empty) {
                alert("Item não encontrado no estoque.");
                return;
            }

            // Obtém o preço do item
            const doc = snapshot.docs[0];
            const currentQuantity = doc.data().quantity;
            const price = doc.data().price;

            if (currentQuantity < quantity) {
                alert("Quantidade insuficiente no estoque.");
                return;
            }

            const newQuantity = currentQuantity - quantity;
            await db.collection('estoque').doc(doc.id).update({
                quantity: newQuantity
            });

            // Calcula o valor total da venda
            const totalPrice = price * quantity;

            // Adiciona a venda ao array de vendas
            sales.push({ name, quantity, totalPrice, date: new Date().toLocaleString() });

            // Atualiza a lista de vendas na tela
            updateSalesList();

            // Atualiza o valor total ganho no dia
            calculateTotalSales();

            // Limpa os campos do formulário
            itemName.value = '';
            itemQuantity.value = '';
        } catch (error) {
            console.error("Erro ao registrar venda: ", error);
            alert("Erro ao registrar venda. Verifique o console para mais detalhes.");
        }
    } else {
        alert("Preencha todos os campos corretamente.");
    }
});

// Função para atualizar a lista de vendas na tela
const updateSalesList = () => {
    salesList.innerHTML = '';
    sales.forEach((sale, index) => {
        const saleItem = document.createElement('div');
        saleItem.className = 'sale-item';
        saleItem.innerHTML = `
            <span>${sale.name}</span>
            <span>Quantidade: ${sale.quantity}</span>
            <span>Total: R$ ${sale.totalPrice.toFixed(2)}</span>
            <span>Data: ${sale.date}</span>
        `;
        salesList.appendChild(saleItem);
    });
};

// Função para gerar o relatório em PDF
generateReport.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cabeçalho do relatório
    doc.setFontSize(18);
    doc.text("Relatório de Vendas do Dia", 10, 10);

    // Conteúdo do relatório
    let y = 20;
    sales.forEach((sale, index) => {
        doc.setFontSize(12);
        doc.text(`Venda ${index + 1}: ${sale.name} - Quantidade: ${sale.quantity} - Total: R$ ${sale.totalPrice.toFixed(2)} - Data: ${sale.date}`, 10, y);
        y += 10;
    });

    // Adiciona o valor total ganho no dia
    doc.setFontSize(14);
    doc.text(`Total Ganho no Dia: R$ ${totalValue.textContent}`, 10, y + 10);

    // Salva o PDF
    doc.save("relatorio_vendas.pdf");
});