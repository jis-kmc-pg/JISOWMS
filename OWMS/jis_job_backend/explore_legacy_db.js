const sql = require('mssql');

const config = {
  server: '192.168.123.75',
  port: 2133,
  database: 'JIS_JOB',
  user: 'sa',
  password: 'ver30',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function exploreLegacyDB() {
  try {
    console.log('🔌 MSSQL 연결 중...');
    await sql.connect(config);
    console.log('✅ 연결 성공!\n');

    // 1. 테이블 목록 조회
    console.log('📋 === 테이블 목록 ===');
    const tablesResult = await sql.query`
      SELECT
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;

    const tables = tablesResult.recordset;
    console.log(`총 ${tables.length}개 테이블 발견:\n`);
    tables.forEach((table, idx) => {
      console.log(`${idx + 1}. [${table.TABLE_SCHEMA}].${table.TABLE_NAME}`);
    });

    console.log('\n\n📊 === 각 테이블 스키마 및 데이터 샘플 ===\n');

    // 2. 각 테이블의 스키마와 샘플 데이터 조회
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      const schemaName = table.TABLE_SCHEMA;
      const fullTableName = `[${schemaName}].[${tableName}]`;

      console.log(`\n${'='.repeat(80)}`);
      console.log(`📄 테이블: ${fullTableName}`);
      console.log('='.repeat(80));

      // 컬럼 정보 조회
      const columnsResult = await sql.query`
        SELECT
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ${schemaName}
          AND TABLE_NAME = ${tableName}
        ORDER BY ORDINAL_POSITION
      `;

      console.log('\n🔧 컬럼 구조:');
      columnsResult.recordset.forEach((col, idx) => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
        console.log(`  ${idx + 1}. ${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE}${length} ${nullable}${defaultVal}`);
      });

      // 데이터 개수 조회
      const countResult = await sql.query(`SELECT COUNT(*) as cnt FROM ${fullTableName}`);
      const rowCount = countResult.recordset[0].cnt;
      console.log(`\n📈 총 레코드 수: ${rowCount}개`);

      // 샘플 데이터 조회 (최대 3개)
      if (rowCount > 0) {
        const sampleResult = await sql.query(`SELECT TOP 3 * FROM ${fullTableName}`);
        console.log('\n📝 샘플 데이터 (최대 3개):');
        sampleResult.recordset.forEach((row, idx) => {
          console.log(`\n  [샘플 ${idx + 1}]`);
          Object.entries(row).forEach(([key, value]) => {
            const displayValue = value instanceof Date
              ? value.toISOString()
              : (value === null ? 'NULL' : String(value));
            console.log(`    ${key}: ${displayValue}`);
          });
        });
      } else {
        console.log('  (데이터 없음)');
      }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ 탐색 완료!');
    console.log('='.repeat(80));

  } catch (err) {
    console.error('❌ 오류 발생:', err.message);
    console.error(err);
  } finally {
    await sql.close();
  }
}

exploreLegacyDB();
