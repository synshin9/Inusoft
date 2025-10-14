import axios from "axios";
import FormData from "form-data";

export default class Upscale {
  constructor() {
    this.api_url = "https://thestinger-ilaria-upscaler.hf.space/gradio_api";
    this.file_url = "https://thestinger-ilaria-upscaler.hf.space/file=";
  }

  generateSession() {
    return Math.random().toString(36).substring(2);
  }

  async upload(buffer) {
    const upload_id = this.generateSession();
    const orig_name = `upscale_${Date.now()}.jpg`;
    const form = new FormData();
    form.append("files", buffer, orig_name);

    const { data } = await axios.post(`${this.api_url}/upload?upload_id=${upload_id}`, form, {
      headers: form.getHeaders(),
    });

    const filePath = data.data ? data.data[0] : data[0];
    if (!filePath) throw new Error("Gagal upload ke server");

    return {
      orig_name,
      path: filePath,
      url: `${this.file_url}${filePath}`,
    };
  }

  async process(buffer, opts = {}) {
    const {
      model = "RealESRGAN_x4plus",
      denoise_strength = 0.5,
      resolution = 4,
      face_enhancement = false,
    } = opts;

    const validModels = [
      "RealESRGAN_x4plus",
      "RealESRNet_x4plus",
      "RealESRGAN_x4plus_anime_6B",
      "RealESRGAN_x2plus",
      "realesr-general-x4v3",
    ];
    if (!validModels.includes(model))
      throw new Error(`Model tersedia: ${validModels.join(", ")}`);

    const upload = await this.upload(buffer);
    const session = this.generateSession();
    const payload = {
      data: [
        {
          path: upload.path,
          url: upload.url,
          orig_name: upload.orig_name,
          size: buffer.length,
          mime_type: "image/jpeg",
          meta: { _type: "gradio.FileData" },
        },
        model,
        denoise_strength,
        face_enhancement,
        resolution,
      ],
      fn_index: 1,
      trigger_id: 20,
      session_hash: session,
    };

    await axios.post(`${this.api_url}/queue/join`, payload);

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const { data } = await axios.get(
            `${this.api_url}/queue/data?session_hash=${session}`
          );
          const lines = data.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data:")) {
              const d = JSON.parse(line.substring(5).trim());
              if (d.msg === "process_completed") {
                clearInterval(interval);
                const result = d.output?.data?.[0]?.url;
                if (result) return resolve(result);
                else return reject(new Error("Proses selesai tapi tidak ada hasil."));
              } else if (d.msg === "process_failed") {
                clearInterval(interval);
                return reject(new Error("Gagal memproses gambar di server."));
              }
            }
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, 1000);
    });
  }
}