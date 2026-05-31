import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";
import path from "path";

const { Pool } = pg;

// Load environment variables if they are not already set
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env");
  } catch {}
}
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(path.resolve(import.meta.dirname, "../../../.env"));
  } catch {}
}

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

// Robust Pool and Mock System
let useFallback = false;

const memoryDb: Record<string, any[]> = {
  users: [
    {
      id: 1,
      name: "Admin",
      email: "mohanrajit05@gmail.com",
      password_hash: "$2b$10$Z89G3ykYhJjgyantn0joE.vy9kyASpHyYNFWDB3/ddKe4tEfVonvK",
      role: "admin",
      reset_token: null,
      reset_token_expiry: null,
      created_at: new Date(),
    }
  ],
  scan_history: [],
  assistant_chats: [],
  scans: [],
  reports: []
};

/**
 * Parse a PostgreSQL-format value back into a JavaScript value.
 * Specifically handles PG array strings like '{"val1","val2"}' → ['val1','val2']
 * and PG empty arrays '{}' → [].
 */
function parsePgValue(val: any): any {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  // Detect PG text array format: starts with { and ends with }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const inner = trimmed.slice(1, -1);
    if (inner === '') return []; // empty array
    // Split on commas not inside quotes, then unquote each element
    const parts: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (ch === '"' && (i === 0 || inner[i - 1] !== '\\')) {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        parts.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    parts.push(current);
    return parts.map(p => p.replace(/^"|"$/g, '').replace(/\\"/g, '"'));
  }
  return val;
}

function mockQuery(text: string, values: any[] = [], rowMode?: string) {
  console.log(`[Database Fallback Mode] Query: ${text.replace(/\s+/g, ' ')}`, values, `rowMode: ${rowMode}`);
  const query = text.trim().toLowerCase();
  let resultRows: any[] = [];
  
  if (query.startsWith('select')) {
    const tableMatch = text.match(/from\s+"([^"]+)"/i) || text.match(/from\s+(\w+)/i);
    const tableName = tableMatch?.[1] || '';
    const list = memoryDb[tableName] || [];
    const isCount = query.includes('count(');
    
    // Filter with WHERE clause
    let filtered = list;
    if (query.includes('where')) {
      const whereClause = text.substring(text.toLowerCase().indexOf('where') + 5);
      // Find ALL column = $N conditions
      const allConditions = [...whereClause.matchAll(/"([^"]+)"\s*=\s*\$(\d+)/gi)];
      if (allConditions.length > 0) {
        filtered = list.filter(row => {
          return allConditions.every(match => {
            let colName = match[1];
            if (colName.includes('.')) colName = colName.split('.').pop() || colName;
            colName = colName.replace(/"/g, '');
            const paramIdx = Number(match[2]) - 1;
            const val = values[paramIdx];
            const rowVal = row[colName];
            if (typeof rowVal === 'string' && typeof val === 'string') {
              return rowVal.toLowerCase() === val.toLowerCase();
            }
            return rowVal == val;
          });
        });
      }
    }

    if (isCount) {
      // Return count result
      resultRows = [{ count: filtered.length }];
    } else {
      resultRows = [...filtered];
      
      // Handle ORDER BY ... DESC
      if (query.includes('order by')) {
        const orderMatch = text.match(/order by\s+"?([^"\s,]+)"?\s*(desc|asc)?/i);
        if (orderMatch) {
          const orderCol = orderMatch[1].replace(/"/g, '');
          const isDesc = orderMatch[2]?.toLowerCase() === 'desc';
          resultRows.sort((a, b) => {
            const aVal = a[orderCol];
            const bVal = b[orderCol];
            if (aVal instanceof Date && bVal instanceof Date) {
              return isDesc ? bVal.getTime() - aVal.getTime() : aVal.getTime() - bVal.getTime();
            }
            if (aVal < bVal) return isDesc ? 1 : -1;
            if (aVal > bVal) return isDesc ? -1 : 1;
            return 0;
          });
        }
      }

      // Handle LIMIT
      const limitMatch = text.match(/limit\s+(\d+)/i);
      const offsetMatch = text.match(/offset\s+(\d+)/i);
      if (limitMatch || offsetMatch) {
        const offset = offsetMatch ? Number(offsetMatch[1]) : 0;
        const limit = limitMatch ? Number(limitMatch[1]) : resultRows.length;
        resultRows = resultRows.slice(offset, offset + limit);
      }
    }
  }
  
  else if (query.startsWith('insert into')) {
    const tableMatch = text.match(/insert into\s+"([^"]+)"/i) || text.match(/insert into\s+(\w+)/i);
    const tableName = tableMatch?.[1] || '';
    if (!memoryDb[tableName]) memoryDb[tableName] = [];
    const list = memoryDb[tableName];
    
    const colsMatch = text.match(/\(([^)]+)\)\s*values/i);
    const colNames = colsMatch?.[1].split(',').map(s => s.replace(/"/g, '').trim()) || [];
    
    const valuesClauseMatch = text.match(/values\s*\((.+?)\)/i);
    const valPlaceholders = valuesClauseMatch?.[1].split(',').map(s => s.trim()) || [];
    
    const newRow: any = {};
    
    colNames.forEach((col, idx) => {
      let cleanCol = col;
      if (cleanCol.includes('.')) {
        cleanCol = cleanCol.split('.').pop() || cleanCol;
      }
      cleanCol = cleanCol.replace(/"/g, '');
      
      const placeholder = valPlaceholders[idx];
      if (!placeholder || placeholder.toLowerCase() === 'default') {
        if (cleanCol === 'id') {
          newRow['id'] = list.length + 1;
        } else if (cleanCol === 'created_at' || cleanCol === 'createdAt') {
          newRow[cleanCol] = new Date();
        } else {
          newRow[cleanCol] = null;
        }
      } else if (placeholder.startsWith('$')) {
        const paramIdx = Number(placeholder.substring(1)) - 1;
        newRow[cleanCol] = parsePgValue(values[paramIdx]);
      } else {
        newRow[cleanCol] = parsePgValue(placeholder);
      }
    });
    
    // Fallbacks if not populated
    if (newRow['id'] === undefined) {
      newRow['id'] = list.length + 1;
    }
    if (newRow['created_at'] === undefined && newRow['createdAt'] === undefined) {
      newRow['created_at'] = new Date();
    }
    
    console.log(`[Database Fallback] Created newRow:`, JSON.stringify(newRow));
    list.push(newRow);
    resultRows = [newRow];
  }
  
  else if (query.startsWith('update')) {
    const tableMatch = text.match(/update\s+"([^"]+)"/i) || text.match(/update\s+(\w+)/i);
    const tableName = tableMatch?.[1] || '';
    const list = memoryDb[tableName] || [];
    
    const whereMatch = text.match(/where\s+.*"([^"]+)"\s*=\s*\$(\d+)/i) || text.match(/where\s+.*(\w+)\s*=\s*\$(\d+)/i);
    if (whereMatch) {
      let whereCol = whereMatch[1];
      if (whereCol.includes('.')) {
        whereCol = whereCol.split('.').pop() || whereCol;
      }
      whereCol = whereCol.replace(/"/g, '');
      
      const whereParamIdx = Number(whereMatch[2]) - 1;
      const whereVal = values[whereParamIdx];
      
      const row = list.find(r => r[whereCol] == whereVal);
      if (row) {
        const setMatch = text.match(/set\s+([^where]+)/i);
        if (setMatch) {
          const setPairs = setMatch[1].split(',').map(s => s.trim());
          setPairs.forEach((pair) => {
            const colMatch = pair.match(/"([^"]+)"\s*=\s*\$(\d+)/) || pair.match(/(\w+)\s*=\s*\$(\d+)/);
            if (colMatch) {
              let col = colMatch[1];
              if (col.includes('.')) {
                col = col.split('.').pop() || col;
              }
              col = col.replace(/"/g, '');
              
              const valIdx = Number(colMatch[2]) - 1;
              row[col] = values[valIdx];
            }
          });
        }
        resultRows = [row];
      }
    }
  }

  else if (query.startsWith('delete')) {
    const tableMatch = text.match(/delete from\s+"([^"]+)"/i) || text.match(/delete from\s+(\w+)/i);
    const tableName = tableMatch?.[1] || '';
    const list = memoryDb[tableName] || [];
    
    if (query.includes('where')) {
      const whereClause = text.substring(text.toLowerCase().indexOf('where') + 5);
      const allConditions = [...whereClause.matchAll(/"([^"]+)"\s*=\s*\$(\d+)/gi)];
      if (allConditions.length > 0) {
        const toRemove = list.filter(row => {
          return allConditions.every(match => {
            let colName = match[1];
            if (colName.includes('.')) colName = colName.split('.').pop() || colName;
            colName = colName.replace(/"/g, '');
            const paramIdx = Number(match[2]) - 1;
            return row[colName] == values[paramIdx];
          });
        });
        memoryDb[tableName] = list.filter(row => !toRemove.includes(row));
        resultRows = toRemove;
      }
    } else {
      memoryDb[tableName] = [];
      resultRows = list;
    }
  }

  // Parse columns from SELECT statement or RETURNING clause to format array rows if rowMode === 'array'
  let selectColumns: string[] = [];
  if (query.startsWith('select')) {
    const selectMatch = text.match(/select\s+(.+?)\s+from/i);
    if (selectMatch) {
      selectColumns = selectMatch[1].split(',').map(s => s.replace(/"/g, '').trim());
    }
  } else if (query.includes('returning')) {
    const returningMatch = text.match(/returning\s+(.+)$/i);
    if (returningMatch) {
      selectColumns = returningMatch[1].split(',').map(s => s.replace(/"/g, '').trim());
    }
  }

  // A robust helper to get the value of a column from a row object,
  // supporting aliases, table prefixes, and snake_case/camelCase fallbacks.
  const getRowValue = (row: any, col: string): any => {
    let cleanCol = col.replace(/"/g, '').trim();
    
    if (cleanCol.toLowerCase().startsWith('count(')) {
      return row['count'] !== undefined ? row['count'] : (row['count(*)'] !== undefined ? row['count(*)'] : 0);
    }
    
    if (cleanCol.toLowerCase().includes(' as ')) {
      const parts = cleanCol.split(/\s+as\s+/i);
      const alias = parts[1].trim();
      if (row[alias] !== undefined) return row[alias];
      cleanCol = parts[0].trim();
    }
    
    if (cleanCol.includes('.')) {
      const parts = cleanCol.split('.');
      const colName = parts[parts.length - 1];
      if (row[colName] !== undefined) return row[colName];
    }
    
    if (row[cleanCol] === undefined) {
      const snake = cleanCol.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (row[snake] !== undefined) return row[snake];
      
      const camel = cleanCol.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (row[camel] !== undefined) return row[camel];
    }
    
    return row[cleanCol] === undefined ? null : row[cleanCol];
  };

  // If rowMode is 'array', format rows as arrays of values matching the select column sequence
  const formattedRows = rowMode === 'array' && selectColumns.length > 0
    ? resultRows.map(row => selectColumns.map(col => getRowValue(row, col)))
    : resultRows;

  const fields = selectColumns.length > 0
    ? selectColumns.map(name => ({ name }))
    : (resultRows[0] ? Object.keys(resultRows[0]).map(key => ({ name: key })) : []);

  console.log(`[Database Fallback] selectColumns:`, selectColumns, `formattedRows:`, JSON.stringify(formattedRows), `fields:`, fields);

  return {
    command: query.split(' ')[0].toUpperCase(),
    rowCount: resultRows.length,
    oid: 0,
    rows: formattedRows,
    fields
  };
}

class RobustPool {
  private pool: pg.Pool;
  constructor(config: pg.PoolConfig) {
    this.pool = new Pool(config);
    
    // Check database connection asynchronously
    this.pool.connect((err, client, release) => {
      if (err) {
        console.warn("⚠️ [Database Warning] The external PostgreSQL database is unreachable or misconfigured.");
        console.warn("⚠️ [Database Warning] Reason:", err.message);
        console.warn("⚠️ [Database Warning] PhishGuard is seamlessly starting with an In-Memory SQL Mock Database fallback.");
        useFallback = true;
      } else {
        console.log("✓ [Database Success] Connected to the external PostgreSQL database successfully.");
        release();
      }
    });
  }

  query(text: any, values?: any, callback?: any) {
    let actualText = text;
    let actualValues = values || [];
    let actualCallback = callback;
    let actualRowMode = undefined;

    if (typeof values === 'function') {
      actualCallback = values;
      actualValues = [];
    }

    if (typeof text === 'object' && text !== null) {
      actualText = text.text;
      actualValues = text.values || actualValues; // Preserve the passed values array
      actualRowMode = text.rowMode;
    }

    if (useFallback) {
      try {
        const result = mockQuery(actualText, actualValues, actualRowMode);
        if (actualCallback) {
          actualCallback(null, result);
        }
        return Promise.resolve(result);
      } catch (err: any) {
        if (actualCallback) {
          actualCallback(err);
        }
        return Promise.reject(err);
      }
    }

    return this.pool.query(text, values, callback);
  }

  connect(callback?: any) {
    if (useFallback) {
      const mockClient = {
        query: (t: any, v: any, cb: any) => this.query(t, v, cb),
        release: () => {}
      };
      if (callback) {
        callback(null, mockClient, () => {});
      }
      return Promise.resolve(mockClient);
    }
    return this.pool.connect(callback);
  }

  end(callback?: any) {
    if (useFallback) {
      if (callback) callback();
      return Promise.resolve();
    }
    return this.pool.end(callback);
  }
}

export const pool = new RobustPool({ connectionString: dbUrl }) as unknown as pg.Pool;
export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
