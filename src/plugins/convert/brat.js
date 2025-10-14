import Sticker from "#lib/sticker";

export default {
	name: "brat",
	description: "Create a sticker brat.",
	command: ["brat"],
	usage: "$prefix$command <text> (-animated for text animated).",
	permissions: "all",
	hidden: false,
	failed: "Failed to %command: %error",
	wait: null,
	category: "convert",
	cooldown: 5,
	limit: false,
	react: true,
	botAdmin: false,
	group: false,
	private: false,
	owner: false,

	async execute(m) {
		const input =
			m.text && m.text.trim() !== ""
				? m.text
				: m.quoted && m.quoted.text
					? m.quoted.text
					: null;

		if (!input) {
			return m.reply("Input text.");
		}

		const animated = /\s-animated\s*$/i.test(input);
		const text = animated
			? input.replace(/\s-animated\s*$/i, "").trim()
			: input.trim();

		if (!text) {
			return m.reply("Please provide the text.");
		}

        const apiUrl = animated
          ? `https://inusoft-brat.hf.space/api/bratvid?text=${encodeURIComponent(text)}`
          : `https://inusoft-brat.hf.space/api/brat?text=${encodeURIComponent(text)}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed.");
        
        const result = await response.json();
        
        if (!result.URL) throw new Error("URL not found in API result.");
        
        const file = await fetch(result.URL);
        const mediaBuffer = Buffer.from(await file.arrayBuffer());

		const sticker = await Sticker.create(mediaBuffer, {
			packname: "@inusoft.",
			author: m.pushName,
			emojis: "🤣",
		});

		await m.reply({ sticker });
	},
};
