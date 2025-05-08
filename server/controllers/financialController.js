const fs = require('fs');
const path = require('path');
const { FinancialData, FinancialMetric } = require('../models');
const XLSX = require('xlsx');

// Încărcare și procesare fișier financiar
exports.uploadFinancialData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const { dataType, startDate, endDate } = req.body;
    
    // Verifică dacă avem datele pentru perioadă
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }
    
    // Formatează perioada pentru afișare (ex: "Jan 2022 - Mar 2022")
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const formattedPeriod = `${startDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    
    // Salvare informații despre fișier în baza de date
    const financialData = await FinancialData.create({
      filename: req.file.filename,
      original_filename: req.file.originalname,
      data_type: dataType || 'Balance Sheet',
      data_period: endDateObj, // Folosim data de sfârșit pentru sortare
      period_start: startDateObj,
      period_end: endDateObj,
      period_display: formattedPeriod,
      file_path: req.file.path,
      uploaded_by: userId
    });

    // Procesarea fișierului Excel cu opțiuni mai robuste
    const workbook = XLSX.readFile(req.file.path, {
      cellDates: true,
      cellNF: true,
      cellStyles: true
    });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertim la json cu păstrarea valorilor goale pentru o analiză mai bună
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      raw: true,
      defval: '',
      blankrows: false
    });

    // Determinăm dacă raportăm pentru toată perioada sau doar pentru o lună
    const reportingPeriodType = determineReportingPeriodType(startDateObj, endDateObj);
    
    // Procesăm balanța Saga - pasăm ID-ul înregistrării financiare create
    const metrics = await processSagaBalanceSheet(data, financialData.id, reportingPeriodType);

    res.status(201).json({
      message: 'Financial data uploaded and processed successfully',
      financialData,
      metrics
    });
  } catch (error) {
    console.error('Upload financial data error:', error);
    res.status(500).json({ message: 'Failed to upload financial data', error: error.message });
  }
};

// Determină tipul de perioadă de raportare (lună sau an)
function determineReportingPeriodType(startDate, endDate) {
  // Calculăm diferența în luni
  const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
  
  // Dacă este mai mic sau egal cu 1 lună, folosim rulaj (date lunare)
  // Altfel, folosim total (date cumulative/anuale)
  return monthDiff <= 1 ? 'monthly' : 'yearly';
}

// Obținere toate datele financiare
exports.getAllFinancialData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const financialData = await FinancialData.findAll({
      where: { uploaded_by: userId },
      include: [{ model: FinancialMetric, as: 'metrics' }],
      order: [['data_period', 'DESC']]
    });
    
    res.status(200).json({ financialData });
  } catch (error) {
    console.error('Get all financial data error:', error);
    res.status(500).json({ message: 'Failed to get financial data', error: error.message });
  }
};

// Obținere date financiare după ID
exports.getFinancialDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const financialData = await FinancialData.findOne({
      where: { id, uploaded_by: userId },
      include: [{ model: FinancialMetric, as: 'metrics' }]
    });
    
    if (!financialData) {
      return res.status(404).json({ message: 'Financial data not found' });
    }
    
    res.status(200).json({ financialData });
  } catch (error) {
    console.error('Get financial data by ID error:', error);
    res.status(500).json({ message: 'Failed to get financial data', error: error.message });
  }
};

// Ștergere date financiare
exports.deleteFinancialData = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const financialData = await FinancialData.findOne({ 
      where: { id, uploaded_by: userId } 
    });
    
    if (!financialData) {
      return res.status(404).json({ message: 'Financial data not found' });
    }
    
    // Ștergere fișier fizic
    if (fs.existsSync(financialData.file_path)) {
      fs.unlinkSync(financialData.file_path);
    }
    
    // Ștergere din baza de date
    await financialData.destroy();
    
    res.status(200).json({ 
      message: 'Financial data deleted successfully' 
    });
  } catch (error) {
    console.error('Delete financial data error:', error);
    res.status(500).json({ message: 'Failed to delete financial data', error: error.message });
  }
};

// Funcție pentru procesarea balanței Saga
async function processSagaBalanceSheet(data, financialDataId, reportingPeriodType = 'yearly') {
  console.log(`===== ÎNCEPEREA PROCESĂRII FIȘIERULUI SAGA (Mod: ${reportingPeriodType}) =====`);
  const metrics = [];
  
  // Verificăm dacă avem date
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('Nu există date în fișier sau formatul nu este corect');
    return metrics;
  }
  
  // Afisăm câteva rânduri pentru a vedea structura
  const printSampleRows = Math.min(5, data.length);
  for (let i = 0; i < printSampleRows; i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
  }
  
  // Setăm coloanele pentru balanța Saga - HARDCODED pentru formatul specific
  const accountCodeCol = 0;  // Cont (prima coloană)
  const accountNameCol = 1;  // Denumire (a doua coloană)
  
  // Alegem coloanele potrivite în funcție de tipul de raportare
  let debitCol, creditCol; 
  if (reportingPeriodType === 'monthly') {
    // Pentru raportare lunară - folosim rulajele lunare
    debitCol = 10;  // rulaj_d - debit period
    creditCol = 11; // rulaj_c - credit period
    console.log('Folosim coloanele pentru RAPORTARE LUNARĂ: rulaj_d și rulaj_c');
  } else {
    // Pentru raportare anuală - folosim totalurile
    debitCol = 14;  // total_deb - total debit
    creditCol = 15; // total_cred - total credit
    console.log('Folosim coloanele pentru RAPORTARE ANUALĂ: total_deb și total_cred');
  }
  
  console.log(`Coloane pentru balanța Saga: Cont=${accountCodeCol}, Denumire=${accountNameCol}, Debit=${debitCol}, Credit=${creditCol}`);
  
  // Ignorăm primul rând (header) și începem procesarea de la al doilea rând
  const startRow = 1;
  
  // Colectăm conturile pe categorii
  let revenueAccounts = {}; // Conturi de venituri (clasa 7)
  let expenseAccounts = {}; // Conturi de cheltuieli (clasa 6)
  let cogsAccounts = {};    // Costuri cu mărfurile vândute (607, 608, 609)
  let taxAccounts = {};     // Conturi de impozite (691, 698, etc)
  
  let processedAccounts = 0;
  let revenueTotal = 0;
  let cogsTotal = 0;
  let operatingExpensesTotal = 0;
  let taxesTotal = 0;
  
  // Parcurgem rândurile cu date
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || row.length <= Math.max(debitCol, creditCol)) {
      continue; // Ignorăm rândurile incomplete
    }
    
    // Obținem codul contului și numele
    const accountCode = String(row[accountCodeCol] || '').trim();
    if (!accountCode || !/^\d+/.test(accountCode)) {
      continue; // Ignorăm rândurile fără conturi valide
    }
    
    const accountName = String(row[accountNameCol] || '').trim();
    
    // Obținem valorile debit și credit
    let debitValue = 0;
    let creditValue = 0;
    
    // Convertim la număr, ignorând valorile non-numerice
    if (row[debitCol] !== undefined && row[debitCol] !== null) {
      const debit = parseFloat(row[debitCol]);
      if (!isNaN(debit)) {
        debitValue = debit;
      }
    }
    
    if (row[creditCol] !== undefined && row[creditCol] !== null) {
      const credit = parseFloat(row[creditCol]);
      if (!isNaN(credit)) {
        creditValue = credit;
      }
    }
    
    processedAccounts++;
    console.log(`Procesez contul ${accountCode} (${accountName}): Debit=${debitValue}, Credit=${creditValue}`);
    
    // Clasificăm conturile în funcție de clasă
    if (accountCode.startsWith('7')) {
      // Venituri - clasa 7
      // În contabilitate, veniturile sunt de obicei înregistrate în credit
      const value = creditValue;
      if (value > 0) {
        revenueAccounts[accountCode] = { name: accountName, value: value };
        revenueTotal += value;
        console.log(`Adăugat venit din contul ${accountCode}: ${value}`);
      }
    } 
    else if (accountCode.startsWith('6')) {
      // Cheltuieli - clasa 6
      // În contabilitate, cheltuielile sunt de obicei înregistrate în debit
      const value = debitValue;
      if (value > 0) {
        if (accountCode.startsWith('607') || accountCode.startsWith('608') || accountCode.startsWith('609')) {
          // Costul bunurilor vândute
          cogsAccounts[accountCode] = { name: accountName, value: value };
          cogsTotal += value;
          console.log(`Adăugat COGS din contul ${accountCode}: ${value}`);
        } 
        else if (accountCode.startsWith('69')) {
          // Impozite și taxe
          taxAccounts[accountCode] = { name: accountName, value: value };
          taxesTotal += value;
          console.log(`Adăugat taxă din contul ${accountCode}: ${value}`);
        } 
        else {
          // Alte cheltuieli operaționale
          expenseAccounts[accountCode] = { name: accountName, value: value };
          operatingExpensesTotal += value;
          console.log(`Adăugată cheltuială operațională din contul ${accountCode}: ${value}`);
        }
      }
    }
  }
  
  // Rezumatul conturilor procesate
  console.log(`Total conturi procesate: ${processedAccounts}`);
  console.log(`Conturi de venituri găsite: ${Object.keys(revenueAccounts).length}`);
  console.log(`Conturi de COGS găsite: ${Object.keys(cogsAccounts).length}`);
  console.log(`Conturi de cheltuieli operaționale găsite: ${Object.keys(expenseAccounts).length}`);
  console.log(`Conturi de taxe găsite: ${Object.keys(taxAccounts).length}`);
  
  // Verificăm dacă am găsit venituri și cheltuieli
  if (revenueTotal === 0) {
    // Dacă nu avem venituri, folosim contul de profit ca indicator
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || !Array.isArray(row)) continue;
      
      const accountCode = String(row[accountCodeCol] || '').trim();
      if (accountCode === '121') {
        // Folosim soldul contului 121 (Profit și Pierdere) pentru a estima venitul
        // Dorim să detectăm dacă contul are un sold creditor (profit) sau debitor (pierdere)
        const profit = parseFloat(row[14] || 0); // total debit
        if (profit > 0) {
          console.log(`Nu s-au găsit conturi de venituri. Folosim contul 121 (Profit și Pierdere) ca estimare: ${profit}`);
          
          // Estimăm venituri ca fiind profitul * 2 (o estimare grosieră)
          revenueTotal = profit * 2;
        }
        break;
      }
    }
  }
  
  // Calculăm metricile financiare
  const revenue = revenueTotal;
  const costOfGoodsSold = cogsTotal;
  const grossMargin = revenue - costOfGoodsSold;
  const grossMarginPercentage = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
  const operatingExpenses = operatingExpensesTotal;
  const operatingProfit = grossMargin - operatingExpenses;
  const taxes = taxesTotal;
  const netProfit = operatingProfit - taxes;
  const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  // Afișăm metricile pentru verificare
  console.log("===== METRICI CALCULATE =====");
  console.log(`Venituri totale: ${revenue}`);
  console.log(`Cost bunuri vândute: ${costOfGoodsSold}`);
  console.log(`Marjă brută: ${grossMargin} (${grossMarginPercentage.toFixed(2)}%)`);
  console.log(`Cheltuieli operaționale: ${operatingExpenses}`);
  console.log(`Profit operațional: ${operatingProfit}`);
  console.log(`Taxe: ${taxes}`);
  console.log(`Profit net: ${netProfit} (${netProfitMargin.toFixed(2)}%)`);
  
  // Salvăm metricile calculate în baza de date
  try {
    console.log("Salvare metrici în baza de date...");
    
    // Revenue
    const revenueMetric = await FinancialMetric.create({
      metric_name: 'Revenue',
      current_value: revenueTotal,
      financial_data_id: financialDataId
    });
    metrics.push(revenueMetric);
    
    // Cost of Goods Sold
    const cogsMetric = await FinancialMetric.create({
      metric_name: 'Cost of Goods Sold',
      current_value: costOfGoodsSold,
      financial_data_id: financialDataId
    });
    metrics.push(cogsMetric);
    
    // Gross Margin
    const grossMarginMetric = await FinancialMetric.create({
      metric_name: 'Gross Margin',
      current_value: grossMargin,
      financial_data_id: financialDataId
    });
    metrics.push(grossMarginMetric);
    
    // Gross Margin Percentage
    const grossMarginPercentageMetric = await FinancialMetric.create({
      metric_name: 'Gross Margin Percentage',
      current_value: grossMarginPercentage,
      unit: '%',
      financial_data_id: financialDataId
    });
    metrics.push(grossMarginPercentageMetric);
    
    // Operating Expenses
    const operatingExpensesMetric = await FinancialMetric.create({
      metric_name: 'Operating Expenses',
      current_value: operatingExpenses,
      financial_data_id: financialDataId
    });
    metrics.push(operatingExpensesMetric);
    
    // Operating Profit
    const operatingProfitMetric = await FinancialMetric.create({
      metric_name: 'Operating Profit',
      current_value: operatingProfit,
      financial_data_id: financialDataId
    });
    metrics.push(operatingProfitMetric);
    
    // Taxes
    const taxesMetric = await FinancialMetric.create({
      metric_name: 'Taxes',
      current_value: taxes,
      financial_data_id: financialDataId
    });
    metrics.push(taxesMetric);
    
    // Net Profit
    const netProfitMetric = await FinancialMetric.create({
      metric_name: 'Net Profit',
      current_value: netProfit,
      financial_data_id: financialDataId
    });
    metrics.push(netProfitMetric);
    
    // Net Profit Margin
    const netProfitMarginMetric = await FinancialMetric.create({
      metric_name: 'Net Profit Margin',
      current_value: netProfitMargin,
      unit: '%',
      financial_data_id: financialDataId
    });
    metrics.push(netProfitMarginMetric);
    
    console.log(`Salvate ${metrics.length} metrici în baza de date.`);
    
  } catch (error) {
    console.error('Error saving financial metrics:', error);
    throw error;
  }
  
  console.log("===== PROCESARE ÎNCHEIATĂ CU SUCCES =====");
  return metrics;
}

module.exports = {
  uploadFinancialData: exports.uploadFinancialData,
  getAllFinancialData: exports.getAllFinancialData,
  getFinancialDataById: exports.getFinancialDataById,
  deleteFinancialData: exports.deleteFinancialData
};