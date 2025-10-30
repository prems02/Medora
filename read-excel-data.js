const XLSX = require('xlsx');
const path = require('path');

// Path to your Excel file
const excelFilePath = 'C:\\Users\\jeeln\\OneDrive - Universal Ai University\\Desktop\\2024.xlsx';

console.log('📊 Reading Excel file...');
console.log('File path:', excelFilePath);

try {
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    
    // Get all sheet names
    console.log('\n📋 Available sheets:');
    workbook.SheetNames.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name}`);
    });
    
    // Read each sheet and display sample data
    workbook.SheetNames.forEach((sheetName) => {
        console.log(`\n\n🔍 Analyzing sheet: "${sheetName}"`);
        console.log('=' .repeat(50));
        
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📊 Total rows: ${data.length}`);
        
        if (data.length > 0) {
            console.log('\n📋 Column headers:');
            const headers = Object.keys(data[0]);
            headers.forEach((header, index) => {
                console.log(`   ${index + 1}. ${header}`);
            });
            
            console.log('\n📝 First 3 rows of data:');
            data.slice(0, 3).forEach((row, index) => {
                console.log(`\n   Row ${index + 1}:`);
                Object.keys(row).forEach(key => {
                    console.log(`      ${key}: ${row[key]}`);
                });
            });
            
            // Check for potential doctor-related columns
            console.log('\n🔍 Potential doctor-related columns found:');
            const doctorKeywords = ['name', 'doctor', 'specialization', 'specialty', 'clinic', 'hospital', 'phone', 'email', 'address', 'qualification', 'degree', 'experience'];
            const matchedColumns = headers.filter(header => 
                doctorKeywords.some(keyword => 
                    header.toLowerCase().includes(keyword.toLowerCase())
                )
            );
            
            if (matchedColumns.length > 0) {
                matchedColumns.forEach(col => {
                    console.log(`   ✓ ${col}`);
                });
            } else {
                console.log('   No obvious doctor-related columns detected');
            }
        } else {
            console.log('   No data found in this sheet');
        }
    });
    
} catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(excelFilePath)) {
        console.error('   File does not exist at the specified path');
        console.log('\n💡 Please verify the file path is correct:');
        console.log(`   Expected: ${excelFilePath}`);
        
        // Try to find 2024.xlsx files
        console.log('\n🔍 Searching for 2024.xlsx files...');
        const { execSync } = require('child_process');
        try {
            const result = execSync(`dir "C:\\Users\\jeeln" /s /b | findstr "2024.xlsx"`, { encoding: 'utf-8' });
            console.log('Found files:');
            result.split('\n').filter(line => line.trim()).forEach(file => {
                console.log(`   - ${file.trim()}`);
            });
        } catch (searchError) {
            console.log('   Could not search for files automatically');
        }
    }
}
