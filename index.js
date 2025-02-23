const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const ms = require('ms');
require('dotenv').config();

const db = new QuickDB();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

const PREFIX = 'b.';
const allowedRoles = ['1339702504442695830', '1339702504518189056', '1339702504518189057'];

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
        const member = message.mentions.members.first();
        if (!member) return sendErrorEmbed(message, 'Please mention a valid user.');

        const isProtected = await db.get(`protected_${member.id}`);
        if (isProtected) return sendErrorEmbed(message, 'You cannot ban a protected user.');

        await member.ban();
        sendSuccessEmbed(message, `${member.user.tag} has been banned.`, '🛑', 0xff0000);
        sendDM(member, `You have been banned from **${message.guild.name}**.`, '🛑', 0xff0000);
    }

    if (command === 'unban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
        const userId = args[0];
        if (!userId) return sendErrorEmbed(message, 'Provide a valid user ID to unban.');

        await message.guild.bans.remove(userId);
        sendSuccessEmbed(message, `User with ID ${userId} has been unbanned.`, '✅', 0x00ff00);
    }

    if (command === 'mute') {
        if (!hasPermission(message)) return;
        const member = message.mentions.members.first();
        const muteTime = args[1] || '10m';
        const timeMs = ms(muteTime);
        if (!timeMs) return sendErrorEmbed(message, 'Provide a valid mute duration.');

        await member.timeout(timeMs);
        sendSuccessEmbed(message, `${member.user.tag} has been muted for ${muteTime}.`, '🔇', 0x3498db);
        sendDM(member, `You have been muted in **${message.guild.name}** for **${muteTime}**.`, '🔇', 0x3498db);
    }

    if (command === 'unmute') {
        if (!hasPermission(message)) return;
        const member = message.mentions.members.first();
        await member.timeout(null);
        sendSuccessEmbed(message, `${member.user.tag} has been unmuted.`, '✅', 0x00ff00);
    }

    if (command === 'warn') {
        if (!hasPermission(message)) return;
        const member = message.mentions.members.first();
        await db.push(`warnings_${member.id}`, 'Warning');
        sendSuccessEmbed(message, `${member.user.tag} has been warned.`, '⚠️', 0xffa500);
        sendDM(member, `You have been warned in **${message.guild.name}**.`, '⚠️', 0xffa500);
    }

    if (command === 'warnings') {
        const member = message.mentions.members.first();
        const warnings = (await db.get(`warnings_${member.id}`)) || [];
        sendSuccessEmbed(message, `${member.user.tag} has ${warnings.length} warnings.`, '⚠️', 0xffa500);
    }

    if (command === 'deletewarn') {
        if (!hasPermission(message)) return;
        const member = message.mentions.members.first();
        await db.set(`warnings_${member.id}`, []);
        sendSuccessEmbed(message, `All warnings for ${member.user.tag} have been cleared.`, '✅', 0x00ff00);
    }

    if (command === 'clear') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return sendErrorEmbed(message, 'Enter a valid number of messages to delete.');
        const messages = await message.channel.messages.fetch({ limit: amount + 1 });
        await message.channel.bulkDelete(messages);
        sendSuccessEmbed(message, `Deleted ${amount} messages.`, '☑️', 0x808080);
    }

    if (command === 'protect') {
        const member = message.mentions.members.first();
        await db.set(`protected_${member.id}`, true);
        sendSuccessEmbed(message, `${member.user.tag} is now protected from bans/kicks.`, '✅', 0x00ff00);
    }
});

function sendSuccessEmbed(message, text, emoji, color) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(`${emoji} | ${text}`)
        .setTimestamp();
    message.channel.send({ embeds: [embed] });
}

function sendErrorEmbed(message, text) {
    const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`❌ | ${text}`)
        .setTimestamp();
    message.channel.send({ embeds: [embed] });
}

function sendDM(member, text, emoji, color) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(`${emoji} | ${text}`)
        .setTimestamp();
    member.send({ embeds: [embed] }).catch(() => {});
}

function hasPermission(message) {
    return message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
        message.member.roles.cache.some(role => allowedRoles.includes(role.id));
}

require('dotenv').config();
client.login(process.env.TOKEN);
