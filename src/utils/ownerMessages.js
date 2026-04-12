/**
 * Texte d’aide quand une commande « owner » est refusée (OWNER_ID manquant ou incorrect).
 */
function ownerCommandDeniedLines() {
    const raw = process.env.OWNER_ID || process.env.BOT_OWNER_ID;
    const trimmed = raw && String(raw).trim();
    const state = !trimmed ? 'non défini' : 'défini (vérifie que la valeur est bien **ton** ID)';

    return [
        '❌ Ces commandes sont réservées au **propriétaire du bot**.',
        '',
        '**Comment les utiliser :**',
        '1. Active le **mode développeur** : Discord → Paramètres → Avancés → Mode développeur.',
        '2. Copie **ton ID** : clic droit sur ton avatar / ton profil → **Copier l’identifiant**.',
        '3. Sur l’hébergeur du bot (Railway, fichier `.env`, etc.), crée une variable :',
        '   • **nom** : `OWNER_ID`',
        '   • **valeur** : ton ID (17–19 chiffres, sans guillemets)',
        '4. **Redémarre** le bot pour charger la variable.',
        '',
        `État actuel de \`OWNER_ID\` : **${state}**`,
    ].join('\n');
}

module.exports = { ownerCommandDeniedLines };
