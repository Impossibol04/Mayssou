const { getOwnerIdFromEnv } = require('./commandGuards');

/**
 * Texte d’aide quand une commande « owner » est refusée.
 * @param {string} [requesterUserId] — ID Discord de celui qui a lancé la commande (pour diagnostic).
 */
function ownerCommandDeniedLines(requesterUserId) {
    const norm = getOwnerIdFromEnv();
    let state;
    if (!norm) {
        state =
            '**absent** côté process Node (`process.env.OWNER_ID`). Vérifie sur Railway : variable sur **ce** service (pas seulement « Shared » non liée), **redéploiement** après modification.';
    } else if (requesterUserId && String(requesterUserId) === norm) {
        state = '**défini et égal à ton ID** — si tu vois quand même ce message, signale un bug.';
    } else {
        state = `**présent** (${norm.length} caractères) mais **différent** de ton ID. Copie-colle ton ID sans espaces ni guillemets.`;
    }

    return [
        '❌ Ces commandes sont réservées au **propriétaire du bot**.',
        '',
        '**Comment s’autoriser (Railway / .env) :**',
        '1. Discord → Paramètres → Avancés → **Mode développeur** ON.',
        '2. Clic droit sur ton profil → **Copier l’identifiant** (17–19 chiffres).',
        '3. Variable d’environnement exactement : **`OWNER_ID`** = cette valeur (sans `" "`).',
        '4. Alias acceptés : `BOT_OWNER_ID` ou `DISCORD_OWNER_ID`.',
        '5. **Redéploie** le service après changement.',
        '',
        `État détecté par le bot : ${state}`,
    ].join('\n');
}

module.exports = { ownerCommandDeniedLines };
