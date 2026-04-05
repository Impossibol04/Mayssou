// src/commands/fun/calc.js
// Remplace eval() par un parser mathématique sécurisé fait maison.
// Supporte : + - * / % ** ( ) nombres décimaux et négatifs.

function tokenize(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
        const ch = expr[i];
        if (/\s/.test(ch)) { i++; continue; }
        if (/\d/.test(ch) || (ch === '.' && /\d/.test(expr[i + 1] || ''))) {
            let num = '';
            while (i < expr.length && /[\d.]/.test(expr[i])) num += expr[i++];
            tokens.push({ type: 'NUM', val: parseFloat(num) });
            continue;
        }
        if ('+-*/%^()'.includes(ch)) {
            tokens.push({ type: 'OP', val: ch });
            i++;
            continue;
        }
        throw new Error(`Caractère inconnu : ${ch}`);
    }
    return tokens;
}

// Précédence des opérateurs
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
const RIGHT = new Set(['^']);

function toRPN(tokens) {
    const out = [], ops = [];
    let prevType = null;

    for (const tok of tokens) {
        if (tok.type === 'NUM') {
            out.push(tok);
            prevType = 'NUM';
        } else if (tok.val === '(') {
            ops.push(tok);
            prevType = 'OP';
        } else if (tok.val === ')') {
            while (ops.length && ops.at(-1).val !== '(') out.push(ops.pop());
            if (!ops.length) throw new Error('Parenthèses non fermées');
            ops.pop();
            prevType = 'NUM';
        } else {
            // Moins unaire → représenté par un token spécial NEG
            if (tok.val === '-' && (prevType === null || prevType === 'OP')) {
                ops.push({ type: 'OP', val: 'NEG', prec: 4 });
                prevType = 'OP';
                continue;
            }
            const prec = PREC[tok.val] ?? 0;
            while (
                ops.length &&
                ops.at(-1).val !== '(' &&
                ((PREC[ops.at(-1).val] ?? 0) > prec ||
                    ((PREC[ops.at(-1).val] ?? 0) === prec && !RIGHT.has(tok.val)))
            ) out.push(ops.pop());
            ops.push({ ...tok, prec });
            prevType = 'OP';
        }
    }
    while (ops.length) {
        if (ops.at(-1).val === '(') throw new Error('Parenthèse ouvrante non fermée');
        out.push(ops.pop());
    }
    return out;
}

function evalRPN(rpn) {
    const stack = [];
    for (const tok of rpn) {
        if (tok.type === 'NUM') { stack.push(tok.val); continue; }
        if (tok.val === 'NEG') {
            if (!stack.length) throw new Error('Expression invalide');
            stack.push(-stack.pop());
            continue;
        }
        if (stack.length < 2) throw new Error('Expression invalide');
        const b = stack.pop(), a = stack.pop();
        switch (tok.val) {
            case '+': stack.push(a + b); break;
            case '-': stack.push(a - b); break;
            case '*': stack.push(a * b); break;
            case '/':
                if (b === 0) throw new Error('Division par zéro');
                stack.push(a / b);
                break;
            case '%':
                if (b === 0) throw new Error('Modulo par zéro');
                stack.push(a % b);
                break;
            case '^': stack.push(Math.pow(a, b)); break;
            default: throw new Error(`Opérateur inconnu : ${tok.val}`);
        }
    }
    if (stack.length !== 1) throw new Error('Expression invalide');
    return stack[0];
}

function safeCalc(expression) {
    const tokens = tokenize(expression);
    const rpn = toRPN(tokens);
    return evalRPN(rpn);
}

function formatResult(n) {
    if (!isFinite(n)) return 'Infini / résultat non défini';
    // Évite les flottants parasites style 0.30000000000000004
    const fixed = parseFloat(n.toPrecision(12));
    return fixed.toString();
}

module.exports = async (client, message, args) => {
    const expression = args.join(' ');
    if (!expression) return message.reply('⚠️ Utilisation : `+calc 2+2` ou `+calc (10*3)/2`');

    try {
        const result = safeCalc(expression);
        message.reply(`🔢 \`${expression}\` = **${formatResult(result)}**`);
    } catch (err) {
        message.reply(`❌ Erreur : ${err.message}`);
    }
};