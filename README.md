<div align="center">

# 🤖 Mayssou — Discord Bot

**[English](#english) • [Français](#français)**

</div>

---

<a name="english"></a>
# 🇬🇧 English

A feature-rich Discord bot built with **JavaScript** and **Node.js**, offering moderation tools, fun interactions, music playback, stats tracking, and more.

> ⚠️ More commands and features are actively being developed.

## ✨ Features

### 🛡️ Staff & Moderation

| Command | Description |
|---------|-------------|
| `ban` / `unban` | Ban or unban a member (by mention or ID) |
| `kick` | Kick a member from the server |
| `warn` | Warn a member with a DM notification |
| `timeout` | Temporarily mute a member |
| `lock` / `unlock` | Lock or unlock a channel |
| `clear` | Bulk delete messages |
| `addrole` / `removerole` | Manage multiple roles at once |
| `steal` | Steal an emoji from another server |
| `vmute` / `vunmute` | Mute or unmute a member in voice |
| `vdeafen` / `vundeafen` | Deafen or undeafen a member in voice |
| `vkick` | Kick a member from a voice channel |
| `vmove` | Move a member to another voice channel |
| `setconfess` | Configure the confession channel |
| `setwelcome` | Configure welcome / leave messages |
| `setjoinvoice` / `deletejoinvoice` | Setup auto voice channel creation |

### 🎉 Fun

| Command | Description |
|---------|-------------|
| `8ball` | Ask the magic 8ball a question |
| `avatar` | Display a user's avatar |
| `banner` | Display a user's banner |
| `calc` | Simple calculator |
| `confess` | Send an anonymous confession |
| `poll` | Create a poll with reactions |
| `rate` | Rate something out of 100 |
| `snipe` | Retrieve the last deleted message |
| `love` / `gay` / `67` | Fun interaction commands |

### 🔧 Utility

| Command | Description |
|---------|-------------|
| `help` | Display all available commands |
| `ping` | Check the bot's latency |
| `serverinfo` | Display server information |
| `userinfo` | Display user information with roles |
| `uptime` | Show how long the bot has been online |
| `stats` | View a member's activity card (messages & voice) |
| `leaderboard` / `lb` / `top` | Server activity leaderboard card |

### 🎵 Music

| Command | Description |
|---------|-------------|
| `play <title>` | Play a song from SoundCloud |
| `play -k <title>` | Karaoke mode with auto lyrics |
| `skip` | Skip to the next track |
| `stop` | Stop playback (keeps queue) |
| `pause` / `resume` | Pause or resume playback |
| `queue` / `q` | Display the current music queue |
| `loop` | Toggle loop mode |
| `leave` | Disconnect the bot from voice |
| `tts <text>` / `say <text>` | Text-to-speech in voice channel |

### 🔊 Auto Voice

| Command | Description |
|---------|-------------|
| `setjoinvoice` | Create a hub voice channel |
| `deletejoinvoice` | Remove the hub voice channel |
| `voicename <name>` | Rename your personal voice channel |
| `voicelimit <number>` | Set a user limit for your voice channel |

### 📊 Stats

- Real-time message and voice tracking per member
- Live voice session tracking (no need to leave to update)
- 30-day rolling stats + all-time totals
- Visual stat cards generated with Canvas

## 🛠️ Tech Stack

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

## 📁 Project Structure

```
Mayssou/
├── bot.js                  # Entry point
├── config.json             # Bot configuration
└── src/
    ├── commands/
    │   ├── fun/
    │   ├── staff/
    │   ├── utility/
    │   └── voice/
    ├── events/
    └── utils/
```

## ⚙️ Setup

1. Clone the repository
```bash
git clone https://github.com/Impossibol04/mayssou.git
cd mayssou
```

2. Install dependencies
```bash
npm install discord.js @discordjs/voice play-dl genius-lyrics better-sqlite3 canvas google-tts-api
```

3. Fill in your `config.json`
```json
{
  "token": "YOUR_BOT_TOKEN",
  "prefix": "+"
}
```

4. Enable Privileged Intents on the [Discord Developer Portal](https://discord.com/developers/applications) :
   - ✅ Server Members Intent
   - ✅ Message Content Intent

5. Start the bot
```bash
node bot.js
```

> Built with ❤️ by [Impossibol](https://github.com/Impossibol04)

---

<a name="français"></a>
# 🇫🇷 Français

Un bot Discord complet développé avec **JavaScript** et **Node.js**, offrant des outils de modération, des interactions fun, de la musique, un suivi des statistiques et bien plus.

> ⚠️ De nouvelles commandes et fonctionnalités sont en cours de développement.

## ✨ Fonctionnalités

### 🛡️ Staff & Modération

| Commande | Description |
|---------|-------------|
| `ban` / `unban` | Bannir ou débannir un membre (mention ou ID) |
| `kick` | Expulser un membre du serveur |
| `warn` | Avertir un membre avec notification en MP |
| `timeout` | Mettre en sourdine temporairement |
| `lock` / `unlock` | Verrouiller ou déverrouiller un salon |
| `clear` | Supprimer des messages en masse |
| `addrole` / `removerole` | Gérer plusieurs rôles en même temps |
| `steal` | Voler un emoji d'un autre serveur |
| `vmute` / `vunmute` | Muter ou démuter en vocal |
| `vdeafen` / `vundeafen` | Casquer ou décasquer en vocal |
| `vkick` | Expulser du salon vocal |
| `vmove` | Déplacer vers un autre salon vocal |
| `setconfess` | Configurer le salon des confessions |
| `setwelcome` | Configurer les messages d'arrivée / départ |
| `setjoinvoice` / `deletejoinvoice` | Configurer la création automatique de vocaux |

### 🎉 Fun

| Commande | Description |
|---------|-------------|
| `8ball` | Poser une question à la boule magique |
| `avatar` | Afficher l'avatar d'un utilisateur |
| `banner` | Afficher la bannière d'un utilisateur |
| `calc` | Calculatrice simple |
| `confess` | Envoyer une confession anonyme |
| `poll` | Créer un sondage avec réactions |
| `rate` | Noter quelque chose sur 100 |
| `snipe` | Récupérer le dernier message supprimé |
| `love` / `gay` / `67` | Commandes fun |

### 🔧 Utilitaire

| Commande | Description |
|---------|-------------|
| `help` | Afficher toutes les commandes |
| `ping` | Vérifier la latence du bot |
| `serverinfo` | Informations sur le serveur |
| `userinfo` | Informations sur un utilisateur |
| `uptime` | Temps de fonctionnement du bot |
| `stats` | Carte d'activité d'un membre |
| `leaderboard` / `lb` / `top` | Classement du serveur en image |

### 🎵 Musique

| Commande | Description |
|---------|-------------|
| `play <titre>` | Jouer une musique depuis SoundCloud |
| `play -k <titre>` | Mode karaoké avec paroles automatiques |
| `skip` | Passer à la musique suivante |
| `stop` | Arrêter la musique (garde la file) |
| `pause` / `resume` | Mettre en pause ou reprendre |
| `queue` / `q` | Afficher la file d'attente |
| `loop` | Activer/désactiver le loop |
| `leave` | Déconnecter le bot du vocal |
| `tts <texte>` / `say <texte>` | Synthèse vocale dans le salon |

### 🔊 Vocal Auto

| Commande | Description |
|---------|-------------|
| `setjoinvoice` | Créer un salon hub vocal |
| `deletejoinvoice` | Supprimer le salon hub |
| `voicename <nom>` | Renommer son salon vocal personnel |
| `voicelimit <nombre>` | Limiter le nombre de membres |

### 📊 Statistiques

- Suivi des messages et du temps vocal en temps réel
- Sessions vocales en direct (sans besoin de quitter)
- Stats sur 30 jours glissants + totaux depuis le début
- Cartes de stats générées avec Canvas

## 🛠️ Stack Technique

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

## 📁 Structure du Projet

```
Mayssou/
├── bot.js                  # Point d'entrée
├── config.json             # Configuration du bot
└── src/
    ├── commands/
    │   ├── fun/
    │   ├── staff/
    │   ├── utility/
    │   └── voice/
    ├── events/
    └── utils/
```

## ⚙️ Installation

1. Cloner le dépôt
```bash
git clone https://github.com/Impossibol04/mayssou.git
cd mayssou
```

2. Installer les dépendances
```bash
npm install discord.js @discordjs/voice play-dl genius-lyrics better-sqlite3 canvas google-tts-api
```

3. Remplir le `config.json`
```json
{
  "token": "TON_TOKEN_BOT",
  "prefix": "+"
}
```

4. Activer les Privileged Intents sur le [Portail Développeur Discord](https://discord.com/developers/applications) :
   - ✅ Server Members Intent
   - ✅ Message Content Intent

5. Lancer le bot
```bash
node bot.js
```

> Développé avec ❤️ par [Impossibol](https://github.com/Impossibol04)
