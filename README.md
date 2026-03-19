# 🤖 Mayssou — Discord Bot

A feature-rich Discord bot built with **JavaScript** and **Node.js**, offering moderation tools, fun interactions, utility commands, and music playback.

> ⚠️ More commands and features are actively being developed.

---

## ✨ Features

### 🛡️ Staff & Moderation
| Command | Description |
|---------|-------------|
| `ban` / `unban` | Ban or unban a member |
| `kick` | Kick a member from the server |
| `warn` | Warn a member |
| `timeout` | Temporarily mute a member |
| `lock` / `unlock` | Lock or unlock a channel |
| `clear` | Bulk delete messages |
| `addrole` / `removerole` | Manage member roles |
| `steal` | Steal an emoji from another server |
| `setconfess` | Configure the confession channel |

### 🎉 Fun
| Command | Description |
|---------|-------------|
| `8ball` | Ask the magic 8ball a question |
| `avatar` | Display a user's avatar |
| `banner` | Display a user's banner |
| `calc` | Simple calculator |
| `confess` | Send an anonymous confession |
| `poll` | Create a poll |
| `rate` | Rate something out of 10 |
| `snipe` | Retrieve the last deleted message |
| `love` / `gay` / `67` | Fun interaction commands |

### 🔧 Utility
| Command | Description |
|---------|-------------|
| `help` | Display all available commands |
| `ping` | Check the bot's latency |
| `serverinfo` | Display server information |
| `userinfo` | Display user information |
| `uptime` | Show how long the bot has been online |

### 🎵 Music
| Command | Description |
|---------|-------------|
| `play` | Play a song in a voice channel |
| `queue` | Display the current music queue |
| `skip` | Skip to the next track |
| `stop` | Stop playback and clear the queue |
| `loop` | Toggle loop mode |
| `leave` | Disconnect the bot from voice |
| `tts` | Text-to-speech in voice channel |

---

## 🛠️ Tech Stack

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-7289DA?style=for-the-badge&logo=discord&logoColor=white)

---

## 📁 Project Structure

```
Mayssou/
├── bot.js              # Entry point
├── config.json         # Bot configuration
├── src/
│   ├── data/           # Guild data storage
│   ├── utils/          # Utility functions & music manager
│   └── commands/
│       ├── fun/        # Fun commands
│       ├── staff/      # Moderation commands
│       ├── utility/    # Utility commands
│       └── voice/      # Music commands
```

---

## ⚙️ Setup

1. Clone the repository
2. Install dependencies
```bash
npm install
```
3. Fill in your `config.json` with your bot token and settings
4. Start the bot
```bash
node bot.js
```

---

> Built with ❤️ by [Impossibol](https://github.com/Impossibol04)
