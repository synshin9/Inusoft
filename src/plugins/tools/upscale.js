import { fileTypeFromBuffer } from "file-type";

import Upscale from "#lib/scraper/upscale";

export default {
	name: "upscale",
	description: "Clear your images or photos with upscale tools.",
	command: ["upscale", "hd"],
	permissions: "all",
	hidden: false,
	failed: "Failed to %command: %error",
	wait: null,
	category: "tools",
	cooldown: 5,
	limit: true,
	usage: "$prefix$command reply/send image, or leave empty for upscale process.",
	react: true,
	botAdmin: false,
	group: false,
	private: false,
	owner: false,

	/**
	 * @param {import('baileys').WASocket} sock - The Baileys socket object.
	 * @param {object} m - The serialized message object.
	 */
	execute: async (m) => {
		const q = m.isQuoted ? m.quoted : m;
		const mime = q.msg.mimetype || "";
		if (!/image\/(png|jpe?g|webp|gif)/i.test(mime)) {
			return m.reply(
				"Please reply/send a media with the command."
			);
		}
		const media = await q.download();
		const buffer = Buffer.isBuffer(media)
			? media
			: Buffer.from(media, "utf-8");
			
		const downloadMedia = async (url) => {
			const response = await fetch(url);
			const buffer = Buffer.from(await response.arrayBuffer());
			const type = await fileTypeFromBuffer(buffer);
			const mime = type?.mime || "application/octet-stream";
			const mediaType = mime.startsWith("video") ? "video" : "image";
			return { [mediaType]: buffer };
		};
		const execution = new Upscale();
		const results = await execution.process(buffer, {
			model: "RealESRGAN_x4plus",
			face_enhancement: true,
		})
		const getMedia = await downloadMedia(results);
		await m.reply({ ...getMedia, caption: "Don't forget to support us by donating to our donation page at https://inusoft.xyz/donations" });
	},
};
