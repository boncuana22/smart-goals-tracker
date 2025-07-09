const fs = require('fs');
const path = require('path');
const { FinancialData, FinancialMetric, KPI } = require('../models');
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

    // Verificăm dacă avem date
    if (!data || data.length < 2) {
      return res.status(400).json({ message: 'Invalid file format or empty data' });
    }

    // Detectăm automat structura coloanelor
    const columnStructure = detectColumnStructure(data);
    if (!columnStructure) {
      return res.status(400).json({ message: 'Could not detect column structure in file' });
    }

    // Determinăm dacă raportăm pentru toată perioada sau doar pentru o lună
    const reportingPeriodType = determineReportingPeriodType(startDateObj, endDateObj);
    
    // Procesăm balanța - pasăm ID-ul înregistrării financiare create și structura coloanelor
    const metrics = await processBalanceSheet(data, financialData.id, reportingPeriodType, columnStructure);

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

// Detectează automat structura coloanelor din fișierul de balanță
function detectColumnStructure(data) {
  console.log('Detecting column structure in balance sheet...');
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('Invalid data for column detection');
    return null;
  }
  
  // Presupunem că header-ul este în primul rând
  const headers = data[0];
  if (!headers || !Array.isArray(headers)) {
    console.error('Invalid header row in balance sheet');
    return null;
  }
  
  console.log('Headers found:', headers);
  
  // Inițializăm structura coloanelor
  let structure = {
    accountCodeCol: -1,
    accountNameCol: -1,
    debitCol: -1,       // Pentru rulaj lunar debit
    creditCol: -1,      // Pentru rulaj lunar credit
    totalDebitCol: -1,  // Pentru total debit
    totalCreditCol: -1  // Pentru total credit
  };
  
  // Căutăm pozițiile coloanelor bazate pe headerele lor
  headers.forEach((header, index) => {
    const headerStr = String(header || '').toLowerCase().trim();
    
    // Coloana pentru codul contului
    if (headerStr === 'cont' || headerStr === 'simbol' || 
        headerStr.includes('cont') || headerStr === 'symbol' || 
        headerStr.includes('account')) {
      structure.accountCodeCol = index;
    }
    
    // Coloana pentru denumirea contului
    else if (headerStr === 'denumire' || headerStr.includes('denumire') || 
             headerStr.includes('name') || headerStr.includes('descriere') || 
             headerStr.includes('description')) {
      structure.accountNameCol = index;
    }
    
    // Coloana pentru rulaj debit
    else if ((headerStr.includes('rulaj') && headerStr.includes('d')) || 
             headerStr === 'rulaj_d' || headerStr === 'rd' ||
             (headerStr.includes('debit') && headerStr.includes('period'))) {
      structure.debitCol = index;
    }
    
    // Coloana pentru rulaj credit
    else if ((headerStr.includes('rulaj') && headerStr.includes('c')) || 
             headerStr === 'rulaj_c' || headerStr === 'rc' ||
             (headerStr.includes('credit') && headerStr.includes('period'))) {
      structure.creditCol = index;
    }
    
    // Coloana pentru total debit
    else if ((headerStr.includes('total') && (headerStr.includes('deb') || headerStr.includes('d'))) || 
             headerStr === 'total_deb' || headerStr === 'td' ||
             headerStr === 'sold final d' || headerStr === 'fin_d') {
      structure.totalDebitCol = index;
    }
    
    // Coloana pentru total credit
    else if ((headerStr.includes('total') && (headerStr.includes('cred') || headerStr.includes('c'))) || 
             headerStr === 'total_cred' || headerStr === 'tc' ||
             headerStr === 'sold final c' || headerStr === 'fin_c') {
      structure.totalCreditCol = index;
    }
  });
  
  // Dacă nu am găsit anumite coloane, folosim logica secundară bazată pe poziție
  
  // Pentru codul contului, folosim prima coloană dacă nu am găsit-o
  if (structure.accountCodeCol === -1) {
    console.log('Account code column not found, using first column as default');
    structure.accountCodeCol = 0;
  }
  
  // Pentru denumirea contului, folosim a doua coloană dacă nu am găsit-o
  if (structure.accountNameCol === -1) {
    console.log('Account name column not found, using second column as default');
    structure.accountNameCol = 1;
  }
  
  // Dacă nu am găsit coloanele de rulaj, căutăm coloane care ar putea conține valori numerice
  if (structure.debitCol === -1 || structure.creditCol === -1) {
    console.log('Debit or credit column not found, searching for numeric columns');
    
    // Verificăm primele câteva rânduri pentru a identifica coloanele cu valori numerice
    const sampleRows = Math.min(data.length, 5);
    const numericColumnCounts = {};
    
    // Începem de la coloana 2 pentru a sări peste cont și denumire
    for (let col = 2; col < headers.length; col++) {
      numericColumnCounts[col] = 0;
      
      for (let row = 1; row < sampleRows; row++) {
        if (data[row] && data[row][col] !== undefined) {
          const value = parseRomanianNumber(data[row][col]);
          if (!isNaN(value) && value !== 0) {
            numericColumnCounts[col]++;
          }
        }
      }
    }
    
    // Sortăm coloanele după numărul de valori numerice
    const numericColumns = Object.entries(numericColumnCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([col, _]) => parseInt(col));
    
    console.log('Potential numeric columns:', numericColumns);
    
    // Dacă nu am găsit coloana debit, presupunem că este prima coloană numerică
    if (structure.debitCol === -1 && numericColumns.length > 0) {
      structure.debitCol = numericColumns[0];
    }
    
    // Dacă nu am găsit coloana credit, presupunem că este a doua coloană numerică
    if (structure.creditCol === -1 && numericColumns.length > 1) {
      structure.creditCol = numericColumns[1];
    }
  }
  
  // Dacă nu am găsit coloanele de total, presupunem că sunt la câteva poziții după cele de rulaj
  if (structure.totalDebitCol === -1 && structure.debitCol !== -1) {
    structure.totalDebitCol = structure.debitCol + 2;
  }
  
  if (structure.totalCreditCol === -1 && structure.creditCol !== -1) {
    structure.totalCreditCol = structure.creditCol + 2;
  }
  
  // Verificăm dacă structura este completă
  const hasRequiredColumns = 
    structure.accountCodeCol !== -1 && 
    structure.accountNameCol !== -1 && 
    structure.debitCol !== -1 && 
    structure.creditCol !== -1;
  
  if (!hasRequiredColumns) {
    console.error('Could not detect all required columns');
    return null;
  }
  
  console.log('Detected column structure:', {
    'Account Code': structure.accountCodeCol,
    'Account Name': structure.accountNameCol,
    'Debit': structure.debitCol,
    'Credit': structure.creditCol, 
    'Total Debit': structure.totalDebitCol,
    'Total Credit': structure.totalCreditCol
  });
  
  return structure;
}

// Determină tipul de perioadă de raportare (lună sau an)
function determineReportingPeriodType(startDate, endDate) {
  // Calculăm diferența în luni
  const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
  
  // Dacă este mai mic sau egal cu 1 lună, folosim rulaj (date lunare)
  // Altfel, folosim total (date cumulative/anuale)
  return monthDiff <= 1 ? 'monthly' : 'yearly';
}

// Funcție pentru parsarea numerelor în format românesc (cu virgulă pentru zecimale)
function parseRomanianNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  
  // Dacă valoarea este deja un număr, o returnăm direct
  if (typeof value === 'number') return value;
  
  // Convertim la string
  const valueStr = String(value);
  
  // Înlocuim separatorii pentru formatul românesc (1.234,56 -> 1234.56)
  const normalized = valueStr.replace(/\./g, '').replace(/,/g, '.');
  
  // Convertim la număr
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

// Procesare balanță financiară
async function processBalanceSheet(data, financialDataId, reportingPeriodType = 'yearly', columnStructure) {
  console.log(`===== ÎNCEPEREA PROCESĂRII FIȘIERULUI (Mod: ${reportingPeriodType}) =====`);
  const metrics = [];
  
  // Verificăm dacă avem date
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('Nu există date în fișier sau formatul nu este corect');
    return metrics;
  }
  
  // Afișăm primele câteva rânduri pentru debug
  const printSampleRows = Math.min(5, data.length);
  for (let i = 0; i < printSampleRows; i++) {
    console.log(`Row ${i}:`, JSON.stringify(data[i]));
  }
  
  // Setăm coloanele pentru balanță
  const accountCodeCol = columnStructure.accountCodeCol;
  const accountNameCol = columnStructure.accountNameCol;
  
  // Alegem coloanele potrivite în funcție de tipul de raportare
  let debitCol, creditCol; 
  if (reportingPeriodType === 'monthly') {
    // Pentru raportare lunară - folosim rulajele lunare
    debitCol = columnStructure.debitCol;
    creditCol = columnStructure.creditCol;
    console.log('Folosim coloanele pentru RAPORTARE LUNARĂ');
  } else {
    // Pentru raportare anuală - folosim totalurile
    debitCol = columnStructure.totalDebitCol !== -1 ? columnStructure.totalDebitCol : columnStructure.debitCol;
    creditCol = columnStructure.totalCreditCol !== -1 ? columnStructure.totalCreditCol : columnStructure.creditCol;
    console.log('Folosim coloanele pentru RAPORTARE ANUALĂ');
  }
  
  console.log(`Coloane pentru balanță: Cont=${accountCodeCol}, Denumire=${accountNameCol}, Debit=${debitCol}, Credit=${creditCol}`);
  
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
    if (!row || !Array.isArray(row)) {
      continue; // Ignorăm rândurile invalide
    }
    
    // Obținem codul contului și numele
    const accountCode = String(row[accountCodeCol] || '').trim();
    if (!accountCode || !/^\d+/.test(accountCode)) {
      continue; // Ignorăm rândurile fără conturi valide
    }
    
    const accountName = String(row[accountNameCol] || '').trim();
    
    // Obținem valorile debit și credit folosind parsarea pentru format românesc
    const debitValue = parseRomanianNumber(row[debitCol]);
    const creditValue = parseRomanianNumber(row[creditCol]);
    
    processedAccounts++;
    console.log(`Procesez contul ${accountCode} (${accountName}): Debit=${debitValue}, Credit=${creditValue}`);
    
    // Clasificăm conturile în funcție de clasă
    if (accountCode.startsWith('7')) {
      // Venituri - clasa 7
      // În contabilitate, veniturile sunt de obicei înregistrate în credit
      const value = creditValue;
      if (value !== 0) {
        revenueAccounts[accountCode] = { name: accountName, value: value };
        revenueTotal += value;
        console.log(`Adăugat venit din contul ${accountCode}: ${value}`);
      }
    } 
    else if (accountCode.startsWith('6')) {
      // Cheltuieli - clasa 6
      // În contabilitate, cheltuielile sunt de obicei înregistrate în debit
      const value = debitValue;
      if (value !== 0) {
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
        const profit = parseRomanianNumber(row[columnStructure.totalDebitCol] || 0); // total debit
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
    
    // Structura de bază a metricilor
    const metricDefinitions = [
      { name: 'Revenue', value: revenueTotal },
      { name: 'Cost of Goods Sold', value: costOfGoodsSold },
      { name: 'Gross Margin', value: grossMargin },
      { name: 'Gross Margin Percentage', value: grossMarginPercentage, unit: '%' },
      { name: 'Operating Expenses', value: operatingExpenses },
      { name: 'Operating Profit', value: operatingProfit },
      { name: 'Taxes', value: taxes },
      { name: 'Net Profit', value: netProfit },
      { name: 'Net Profit Margin', value: netProfitMargin, unit: '%' }
    ];
    
    // Creăm metricile în baza de date
    for (const metricDef of metricDefinitions) {
      const metric = await FinancialMetric.create({
        metric_name: metricDef.name,
        current_value: metricDef.value,
        unit: metricDef.unit || '',
        financial_data_id: financialDataId
      });
      
      metrics.push(metric);
    }
    
    console.log(`Salvate ${metrics.length} metrici în baza de date.`);
    
    // --- Actualizează KPIs financiari dacă target_value este atins ---
    try {
      // Găsește toate KPIs financiari cu target_value definit
      const financialKpis = await KPI.findAll({
        where: {
          kpi_type: 'financial',
          target_value: { $ne: null }
        }
      });
      for (const kpi of financialKpis) {
        // Dacă există un metric cu același nume ca KPI-ul și current_value >= target_value
        const matchingMetric = metrics.find(m => m.metric_name === kpi.name);
        if (matchingMetric && matchingMetric.current_value >= kpi.target_value) {
          if (!kpi.is_achieved) {
            kpi.is_achieved = true;
            await kpi.save();
          }
        }
      }
    } catch (err) {
      console.error('Eroare la actualizarea KPIs financiari:', err);
    }
    
  } catch (error) {
    console.error('Error saving financial metrics:', error);
    throw error;
  }
  
  console.log("===== PROCESARE ÎNCHEIATĂ CU SUCCES =====");
  return metrics;
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

// Endpoint: GET /financial/metrics
exports.getAllFinancialMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    // Get all financial data uploaded by the user, including metrics
    const financialData = await FinancialData.findAll({
      where: { uploaded_by: userId },
      include: [{ model: FinancialMetric, as: 'metrics' }],
      order: [['data_period', 'DESC']]
    });
    // Flatten all metrics into a single array, most recent first
    const allMetrics = [];
    for (const data of financialData) {
      if (data.metrics && Array.isArray(data.metrics)) {
        for (const metric of data.metrics) {
          allMetrics.push({
            id: metric.id,
            name: metric.metric_name,
            value: metric.current_value,
            unit: metric.unit,
            financial_data_id: data.id,
            period: data.period_display
          });
        }
      }
    }
    res.status(200).json({ metrics: allMetrics });
  } catch (error) {
    console.error('Get all financial metrics error:', error);
    res.status(500).json({ message: 'Failed to get financial metrics', error: error.message });
  }
};

module.exports = {
  uploadFinancialData: exports.uploadFinancialData,
  getAllFinancialData: exports.getAllFinancialData,
  getFinancialDataById: exports.getFinancialDataById,
  deleteFinancialData: exports.deleteFinancialData,
  getAllFinancialMetrics: exports.getAllFinancialMetrics
};