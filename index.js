const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const ms = require('ms');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

const PREFIX = '&';
const warnings = new Map();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    function sendEmbed(color, title, description, emoji) {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} ${title}`)
            .setDescription(description)
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }

    if (command === 'ban') {
        const member = message.mentions.members.first();
        if (!member) return message.reply("Please mention a valid member.");
        if (!member.bannable) return message.reply("I can't ban this user.");

        await member.ban();
        sendEmbed(0xff0000, "User Banned", `${member.user.tag} has been banned.`, "❌");
    }

    if (command === 'unban') {
        const userId = args[0];
        if (!userId) return message.reply("Provide a valid user ID to unban.");

        try {
            await message.guild.bans.remove(userId);
            sendEmbed(0x00ff00, "User Unbanned", `User with ID ${userId} has been unbanned.`, "✅");
        } catch (error) {
            message.reply("I couldn't unban the user. Make sure the ID is correct.");
        }
    }

    if (command === 'mute') {
        const member = message.mentions.members.first();
        if (!member) return message.reply("Please mention a valid member.");

        const muteTime = args[1] || "10m";
        const timeMs = ms(muteTime);
        if (!timeMs) return message.reply("Provide a valid mute duration (e.g., 10m, 1h, 1d).");

        await member.timeout(timeMs);
        sendEmbed(0x3498db, "User Muted", `${member.user.tag} has been muted for ${muteTime}.`, "🔇");
    }

    if (command === 'unmute') {
        const member = message.mentions.members.first();
        if (!member) return message.reply("Please mention a valid member.");

        await member.timeout(null);
        sendEmbed(0x00ff00, "User Unmuted", `${member.user.tag} has been unmuted.`, "✅");
    }

    if (command === 'warn') {
        const member = message.mentions.members.first();
        if (!member) return message.reply("Please mention a valid member.");

        const reason = args.slice(1).join(' ') || "No reason provided";
        if (!warnings.has(member.id)) warnings.set(member.id, []);
        warnings.get(member.id).push(reason);

        sendEmbed(0xffa500, "User Warned", `${member.user.tag} has been warned.`, "⚠️");
    }

    if (command === 'warnings') {
        const member = message.mentions.members.first();
        if (!member) return message.reply("Please mention a valid member.");

        const userWarnings = warnings.get(member.id) || [];
        if (userWarnings.length === 0) return message.reply("This user has no warnings.");

        sendEmbed(0xffa500, "User Warnings", `${member.user.tag} warnings:\n${userWarnings.join('\n')}`, "⚠️");
    }

    if (command === 'deletewarn') {
        const member = message.mentions.members.first();
        if (!member) return message.reply("Please mention a valid member.");
        if (!warnings.has(member.id)) return message.reply("This user has no warnings.");

        warnings.delete(member.id);
        sendEmbed(0x00ff00, "Warnings Cleared", `All warnings for ${member.user.tag} have been cleared.`, "✅");
    }

    if (command === 'clear') {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply("Enter a valid number of messages to delete.");

        const messages = await message.channel.messages.fetch({ limit: amount + 1 });
        await message.channel.bulkDelete(messages);
        sendEmbed(0x3498db, "Messages Cleared", `Deleted ${amount} messages.`, "🔇");
    }
});

client.login("MTM0Mjg0NDgxMTYxNDQ5MDczNQ.GUz7gf.hV15vkDzn6B8BMPpBQjmY4tQQt-ITeeDSsyJPY");
