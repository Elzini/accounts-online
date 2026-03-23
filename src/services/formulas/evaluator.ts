import { create, all } from 'mathjs';
import { FormulaNode, OPERATORS } from './types';

const math = create(all);
const limitedEvaluate = math.evaluate;
math.import({
  'import': function () { throw new Error('Function import is disabled'); },
  'createUnit': function () { throw new Error('Function createUnit is disabled'); },
  'evaluate': function () { throw new Error('Function evaluate is disabled'); },
  'parse': function () { throw new Error('Function parse is disabled'); },
  'simplify': function () { throw new Error('Function simplify is disabled'); },
  'derivative': function () { throw new Error('Function derivative is disabled'); },
  'config': function () { throw new Error('Function config is disabled'); },
}, { override: true });

const ALLOWED_OPERATORS = new Set(['+', '-', '*', '/', '%']);
const ALLOWED_NODE_TYPES = new Set(['variable', 'operator', 'number', 'parenthesis', 'function']);
const ALLOWED_FUNCTIONS_SET = new Set(['SUM', 'AVG', 'MAX', 'MIN', 'ABS', 'ROUND', 'IF', 'sum', 'avg', 'max', 'min', 'abs', 'round']);

function validateFormulaNode(node: FormulaNode): boolean {
  if (!ALLOWED_NODE_TYPES.has(node.type)) return false;
  switch (node.type) {
    case 'operator': return ALLOWED_OPERATORS.has(node.value);
    case 'number': return /^-?\d+(\.\d+)?$/.test(node.value);
    case 'parenthesis': return node.value === '(' || node.value === ')';
    case 'function': return ALLOWED_FUNCTIONS_SET.has(node.value);
    case 'variable': return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(node.value);
    default: return true;
  }
}

export function evaluateFormula(expression: FormulaNode[], variableValues: Record<string, number>): number {
  if (!expression || expression.length === 0) return 0;
  for (const node of expression) { if (!validateFormulaNode(node)) { console.error('Formula validation failed'); return 0; } }

  let exprString = '';
  for (const node of expression) {
    switch (node.type) {
      case 'variable': exprString += (variableValues[node.value] ?? 0).toString(); break;
      case 'operator': exprString += ` ${node.value} `; break;
      case 'number': exprString += node.value; break;
      case 'parenthesis': exprString += node.value; break;
      case 'function': {
        const funcMap: Record<string, string> = { 'SUM': 'sum', 'AVG': 'mean', 'MAX': 'max', 'MIN': 'min', 'ABS': 'abs', 'ROUND': 'round' };
        exprString += funcMap[node.value] || node.value.toLowerCase(); break;
      }
      default: exprString += node.value;
    }
  }

  try {
    exprString = exprString.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1 / 100)');
    const result = limitedEvaluate(exprString);
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : 0;
  } catch (error) {
    console.error('Error evaluating formula:', error, exprString);
    return 0;
  }
}

export function formulaToString(expression: FormulaNode[]): string {
  if (!expression || expression.length === 0) return '';
  return expression.map(node => {
    if (node.type === 'variable') return `[${node.label || node.value}]`;
    if (node.type === 'operator') { const op = OPERATORS.find(o => o.value === node.value); return ` ${op?.label || node.value} `; }
    return node.value;
  }).join('');
}

export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
