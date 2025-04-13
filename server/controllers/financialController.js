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

    // Procesarea fișierului Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });

    // Detectăm formatul balanței din Saga și extragem datele relevante
    const metrics = await processSagaBalanceSheet(data, financialData.id);

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

// Funcție pentru procesarea balanței din Saga
async function processSagaBalanceSheet(data, financialDataId) {
  const metrics = [];
  
  // Examinează primele rânduri pentru a detecta formatul
  console.log("Analizez structura fișierului Saga:", data.slice(0, 5));
  
  // Caută coloanele relevante în header
  let headerRow = -1;
  let debitFinalCol = -1;
  let creditFinalCol = -1;
  
  // Caută rândul cu header-ul și coloanele relevante
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    if (!row || !Array.isArray(row)) continue;
    
    // Caută un rând care ar putea fi header (conține "Debit" și "Credit")
    const rowStr = row.join(' ').toLowerCase();
    if (rowStr.includes('debit') && rowStr.includes('credit')) {
      headerRow = i;
      // Găsește indexul coloanelor pentru sold final
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j]).toLowerCase();
        if (cell.includes('debit') && cell.includes('final')) {
          debitFinalCol = j;
        }
        if (cell.includes('credit') && cell.includes('final')) {
          creditFinalCol = j;
        }
      }
      break;
    }
  }
  
  console.log(`Header row: ${headerRow}, Debit final col: ${debitFinalCol}, Credit final col: ${creditFinalCol}`);
  
  // Dacă nu am găsit headerul sau coloanele necesare, folosește valori implicite
  if (headerRow === -1 || debitFinalCol === -1 || creditFinalCol === -1) {
    console.log("Nu am putut detecta formatul specific. Folosim valori implicite:");
    // Presupunem că ultimele două coloane sunt debit final și credit final
    debitFinalCol = data[0].length - 2;
    creditFinalCol = data[0].length - 1;
    console.log(`Folosesc debit col: ${debitFinalCol}, credit col: ${creditFinalCol}`);
  }
  
  // Căutăm conturile relevante pentru metricile financiare importante
  let revenueAccounts = {}; // Conturi de venituri (7xx)
  let expenseAccounts = {}; // Conturi de cheltuieli (6xx)
  let assetAccounts = {};   // Conturi de active
  let liabilityAccounts = {}; // Conturi de datorii
  let taxAccounts = {};     // Conturi de impozite (69x)

  // Iteram prin datele din balanță pentru a extrage valorile conturilor
  for (let i = (headerRow !== -1 ? headerRow + 1 : 0); i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || row.length <= Math.max(debitFinalCol, creditFinalCol)) continue;
    
    // Verifică dacă avem un cont valid (prima coloană începe cu un număr)
    const accountCodeCell = row[0];
    if (!accountCodeCell) continue;
    
    const accountCode = String(accountCodeCell).trim();
    if (!/^\d/.test(accountCode)) continue; // Trebuie să înceapă cu un digit
    
    // Obține nume cont și valori
    const accountName = row[1] ? String(row[1]).trim() : '';
    const debitFinal = parseFloat(row[debitFinalCol]) || 0;
    const creditFinal = parseFloat(row[creditFinalCol]) || 0;
    
    console.log(`Cont ${accountCode} (${accountName}): debit=${debitFinal}, credit=${creditFinal}`);
    
    // Clasificăm conturile după cod
    if (accountCode.startsWith('7')) {
      // Conturi de venituri
      revenueAccounts[accountCode] = { name: accountName, value: creditFinal - debitFinal };
    } else if (accountCode.startsWith('6')) {
      if (accountCode.startsWith('69')) {
        // Conturi de impozite și taxe
        taxAccounts[accountCode] = { name: accountName, value: debitFinal - creditFinal };
      } else {
        // Alte cheltuieli
        expenseAccounts[accountCode] = { name: accountName, value: debitFinal - creditFinal };
      }
    } else if (['2', '3'].includes(accountCode.charAt(0)) || 
               (accountCode.charAt(0) === '4' && debitFinal > creditFinal)) {
      // Active
      assetAccounts[accountCode] = { name: accountName, value: debitFinal - creditFinal };
    } else if (accountCode.charAt(0) === '1' || 
               (accountCode.charAt(0) === '4' && creditFinal > debitFinal)) {
      // Datorii
      liabilityAccounts[accountCode] = { name: accountName, value: creditFinal - debitFinal };
    }
  }
  
  console.log("Conturi venituri:", Object.keys(revenueAccounts));
  console.log("Conturi cheltuieli:", Object.keys(expenseAccounts));
  console.log("Conturi taxe:", Object.keys(taxAccounts));

  // Calculul metricilor financiare conform standardelor contabile românești
  
  // 1. Cifra de afaceri (conturile 701-708 minus 709)
  let revenue = 0;
  Object.keys(revenueAccounts).forEach(code => {
    if (code.match(/^70[1-8]/)) {
      revenue += revenueAccounts[code].value;
    } else if (code === '709') {
      revenue -= revenueAccounts[code].value;
    }
  });
  
  // 2. Cheltuieli cu mărfurile și reducerile comerciale (607, 609)
  let costOfGoodsSold = 0;
  if (expenseAccounts['607']) {
    costOfGoodsSold += expenseAccounts['607'].value;
  }
  if (expenseAccounts['609']) {
    costOfGoodsSold += expenseAccounts['609'].value;
  }
  
  // 3. Marja brută
  const grossMargin = revenue - costOfGoodsSold;
  const grossMarginPercentage = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
  
  // 4. Total cheltuieli operaționale (clasa 6 fără 69x)
  let operatingExpenses = 0;
  Object.keys(expenseAccounts).forEach(code => {
    operatingExpenses += expenseAccounts[code].value;
  });
  
  // 5. Profit operațional (revenue - toate cheltuielile din clasa 6 fără 69x)
  const operatingProfit = revenue - operatingExpenses;
  
  // 6. Total impozite și taxe (69x)
  let taxes = 0;
  Object.keys(taxAccounts).forEach(code => {
    taxes += taxAccounts[code].value;
  });
  
  // 7. Profit net (profit operațional - impozite)
  const netProfit = operatingProfit - taxes;
  const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  console.log("Metrici calculate:");
  console.log(`Revenue: ${revenue}`);
  console.log(`Cost of Goods Sold: ${costOfGoodsSold}`);
  console.log(`Gross Margin: ${grossMargin} (${grossMarginPercentage}%)`);
  console.log(`Operating Expenses: ${operatingExpenses}`);
  console.log(`Operating Profit: ${operatingProfit}`);
  console.log(`Taxes: ${taxes}`);
  console.log(`Net Profit: ${netProfit} (${netProfitMargin}%)`);
  
  // Salvăm metricile calculate în baza de date
  try {
    const revenueMetric = await FinancialMetric.create({
      metric_name: 'Revenue',
      current_value: revenue,
      financial_data_id: financialDataId
    });
    metrics.push(revenueMetric);
    
    const cogs = await FinancialMetric.create({
      metric_name: 'Cost of Goods Sold',
      current_value: costOfGoodsSold,
      financial_data_id: financialDataId
    });
    metrics.push(cogs);
    
    const grossMarginMetric = await FinancialMetric.create({
      metric_name: 'Gross Margin',
      current_value: grossMargin,
      financial_data_id: financialDataId
    });
    metrics.push(grossMarginMetric);
    
    const grossMarginPercentageMetric = await FinancialMetric.create({
      metric_name: 'Gross Margin Percentage',
      current_value: grossMarginPercentage,
      unit: '%',
      financial_data_id: financialDataId
    });
    metrics.push(grossMarginPercentageMetric);
    
    const operatingExpensesMetric = await FinancialMetric.create({
      metric_name: 'Operating Expenses',
      current_value: operatingExpenses,
      financial_data_id: financialDataId
    });
    metrics.push(operatingExpensesMetric);
    
    const operatingProfitMetric = await FinancialMetric.create({
      metric_name: 'Operating Profit',
      current_value: operatingProfit,
      financial_data_id: financialDataId
    });
    metrics.push(operatingProfitMetric);
    
    const taxesMetric = await FinancialMetric.create({
      metric_name: 'Taxes',
      current_value: taxes,
      financial_data_id: financialDataId
    });
    metrics.push(taxesMetric);
    
    const netProfitMetric = await FinancialMetric.create({
      metric_name: 'Net Profit',
      current_value: netProfit,
      financial_data_id: financialDataId
    });
    metrics.push(netProfitMetric);
    
    const netProfitMarginMetric = await FinancialMetric.create({
      metric_name: 'Net Profit Margin',
      current_value: netProfitMargin,
      unit: '%',
      financial_data_id: financialDataId
    });
    metrics.push(netProfitMarginMetric);
    
  } catch (error) {
    console.error('Error saving financial metrics:', error);
    throw error;
  }
  
  return metrics;
}

module.exports = {
  uploadFinancialData: exports.uploadFinancialData,
  getAllFinancialData: exports.getAllFinancialData,
  getFinancialDataById: exports.getFinancialDataById,
  deleteFinancialData: exports.deleteFinancialData
};